import { createMovementAssessment } from '../assessments';
import {
  historicalOfficialCheckUpRecords,
  latestIncompleteOfficialCheckUpRecord,
  latestOfficialComparisonPair,
  latestUsableOfficialCheckUpRecord,
  resolveStoredCheckUpType,
} from '../checkupHistory';
import { mergeCheckUpRetry, retryBatteryForMissingHeadlineDomains } from '../../checkup';
import type { CheckUp, CheckUpItem } from '../../checkup';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
} from '../../movements';
import { CURRENT_SCORING_VERSION, createCurrentVersionedScoreSnapshot, scoreCheckUp } from '../../scoring';
import type { CheckupType } from '../../adherence';

const START = '2026-06-19T08:00:00.000Z';

describe('typed official check-up history selectors', () => {
  it('uses only usable official records for official progress', () => {
    const official = stored(fullCheckUp(START), 'baseline');
    const manual = stored(fullCheckUp('2026-06-20T08:00:00.000Z'), 'manual_extra');
    const assessments = [assessmentFor(official), assessmentFor(manual)];

    const latest = latestUsableOfficialCheckUpRecord([official, manual], assessments);

    expect(latest?.record.checkUp.startedAt).toBe(official.checkUp.startedAt);
    expect(latest?.type).toBe('baseline');
  });

  it('recovers legacy type only from one exact matching assessment', () => {
    const legacy = stored(fullCheckUp(START), 'legacy_unknown');
    const baseline = assessmentFor(legacy, 'baseline');
    const retake = assessmentFor(legacy, 'baseline_retake');

    expect(resolveStoredCheckUpType(legacy, [baseline])).toBe('baseline');
    expect(resolveStoredCheckUpType(legacy, [baseline, retake])).toBe('legacy_unknown');
  });

  it('finds incomplete official attempts without promoting them to usable official progress', () => {
    const partial = stored(partialStrengthCheckUp(START), 'official_retest');
    const partialAssessment = assessmentFor(partial, 'official_retest');

    expect(partialAssessment.status).toBe('incomplete');
    expect(latestIncompleteOfficialCheckUpRecord([partial], [partialAssessment])?.record.checkUp.startedAt).toBe(START);
    expect(latestUsableOfficialCheckUpRecord([partial], [partialAssessment])).toBeNull();
  });

  it('does not silently promote legacy unversioned history to official progress', () => {
    const legacy = legacyStored(fullCheckUp(START), 'baseline');
    const assessment = assessmentFor(legacy, 'baseline');

    expect(latestUsableOfficialCheckUpRecord([legacy], [assessment])).toBeNull();
    expect(historicalOfficialCheckUpRecords([legacy], [assessment])).toEqual([]);
  });

  it('keeps incompatible snapshots historical but excludes them from current block eligibility and comparisons', () => {
    const baseline = stored(fullCheckUp(START), 'baseline');
    const future = stored(fullCheckUp('2026-06-29T08:00:00.000Z'), 'official_retest');
    future.scoreSnapshot = {
      ...future.scoreSnapshot!,
      scoringVersion: CURRENT_SCORING_VERSION + 1,
    };
    future.scoreSnapshotCompatibility = 'incompatible_version';
    const assessments = [assessmentFor(baseline), assessmentFor(future)];

    const historical = historicalOfficialCheckUpRecords([baseline, future], assessments);
    const pair = latestOfficialComparisonPair([baseline, future], assessments);

    expect(latestUsableOfficialCheckUpRecord([baseline, future], assessments)?.record.checkUp.startedAt).toBe(START);
    expect(historical.map((item) => [item.record.checkUp.startedAt, item.currentVersionUsable])).toEqual([
      [START, true],
      ['2026-06-29T08:00:00.000Z', false],
    ]);
    expect(pair.compatibility).toBe('incompatible_version');
    expect(pair.compatible).toBe(false);
  });

  it('excludes snapshots whose source does not match the stored check-up from official history', () => {
    const valid = stored(fullCheckUp(START), 'baseline');
    const mismatched = stored(fullCheckUp('2026-06-29T08:00:00.000Z'), 'official_retest');
    mismatched.scoreSnapshot = {
      ...mismatched.scoreSnapshot!,
      sourceCheckUpId: '2026-06-28T08:00:00.000Z',
    };
    const assessments = [assessmentFor(valid), assessmentFor(mismatched)];

    expect(latestUsableOfficialCheckUpRecord([valid, mismatched], assessments)?.record.checkUp.startedAt).toBe(START);
    expect(historicalOfficialCheckUpRecords([valid, mismatched], assessments).map((item) => item.record.checkUp.startedAt)).toEqual([
      START,
    ]);
    expect(latestOfficialComparisonPair([valid, mismatched], assessments)).toMatchObject({
      compatible: false,
      compatibility: 'missing_snapshot',
    });
  });
});

describe('targeted check-up retry helpers', () => {
  it('maps missing headline domains to the supported retry battery only', () => {
    expect(retryBatteryForMissingHeadlineDomains(['strength_power', 'mobility'])).toEqual([
      CHAIR_STAND_ID,
      SHOULDER_FLEXION_ID,
    ]);
    expect(retryBatteryForMissingHeadlineDomains([])).toEqual([
      CHAIR_STAND_ID,
      BALANCE_LADDER_ID,
      SHOULDER_FLEXION_ID,
    ]);
  });

  it('merges retry items without duplicating or replacing unrelated valid evidence', () => {
    const base = partialStrengthCheckUp(START);
    const retry = {
      startedAt: '2026-06-20T08:00:00.000Z',
      bodyUnit: 0.34,
      items: [balanceItem(10), shoulderItem(150)],
    };

    const merged = mergeCheckUpRetry({
      baseCheckUp: base,
      retryCheckUp: retry,
      retriedMovementIds: [BALANCE_LADDER_ID, SHOULDER_FLEXION_ID],
    });
    const score = scoreCheckUp(merged);

    expect(merged.startedAt).toBe(retry.startedAt);
    expect(merged.items.map((item) => item.movementId)).toEqual([
      CHAIR_STAND_ID,
      BALANCE_LADDER_ID,
      SHOULDER_FLEXION_ID,
      HINGE_REACH_ID,
    ]);
    expect(merged.items.filter((item) => item.movementId === CHAIR_STAND_ID)).toHaveLength(1);
    expect(score.domains.filter((domain) => domain.measured).map((domain) => domain.domain)).toEqual([
      'strength',
      'balance',
      'mobility',
    ]);
  });
});

function stored(checkUp: CheckUp, checkupType: CheckupType): StoredCheckUp {
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType,
    checkUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function legacyStored(checkUp: CheckUp, checkupType: CheckupType): StoredCheckUp {
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType,
    checkUp,
    scoreSnapshotCompatibility: 'legacy_unversioned',
  };
}

function assessmentFor(record: StoredCheckUp, type: CheckupType = record.checkupType) {
  const scored = createCurrentVersionedScoreSnapshot(record.checkUp);
  return createMovementAssessment({
    checkUpId: record.checkUp.startedAt,
    type,
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    completedAt: record.checkUp.startedAt,
    isOfficialForProgress: type === 'baseline' || type === 'baseline_retake' || type === 'official_retest',
  });
}

function fullCheckUp(startedAt: string): CheckUp {
  return {
    startedAt,
    bodyUnit: 0.33,
    items: [chairItem(12), balanceItem(10), shoulderItem(150), hingeItem(0.3)],
  };
}

function partialStrengthCheckUp(startedAt: string): CheckUp {
  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      chairItem(12),
      noMeasurementItem(BALANCE_LADDER_ID),
      noMeasurementItem(SHOULDER_FLEXION_ID),
      hingeItem(0.3),
    ],
  };
}

function chairItem(reps: number): CheckUpItem {
  return measuredItem(CHAIR_STAND_ID, {
    reps,
    repStats: [],
    sessionMeanVel: 0.21,
    sessionMeanPeakVel: 0.29,
    pushOffDetected: false,
  });
}

function balanceItem(singleLegEyesOpenSec: number): CheckUpItem {
  return measuredItem(BALANCE_LADDER_ID, {
    stages: [],
    singleLegEyesOpenSec,
  });
}

function shoulderItem(peakFlexionDeg: number): CheckUpItem {
  return measuredItem(SHOULDER_FLEXION_ID, { peakFlexionDeg });
}

function hingeItem(reachBu: number): CheckUpItem {
  return measuredItem(HINGE_REACH_ID, { reachBu });
}

function measuredItem(movementId: string, result: Record<string, unknown>): CheckUpItem {
  return {
    movementId,
    status: 'measured',
    result: { movementId, flags: [], interruptions: 0, ...result } as never,
  };
}

function noMeasurementItem(movementId: string): CheckUpItem {
  return {
    movementId,
    status: 'measured',
    result: { movementId, flags: ['no-measurement'], interruptions: 0 } as never,
  };
}
