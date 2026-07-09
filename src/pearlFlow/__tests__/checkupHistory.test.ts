import { mergeCheckUpRetry, retryBatteryForMissingHeadlineDomains } from '../../checkup/testing/legacyRetryFixture';
import { createMovementAssessment } from '../assessments';
import {
  historicalOfficialCheckUpRecords,
  latestIncompleteOfficialCheckUpRecord,
  latestOfficialMovementProfileV2Assessment,
  movementProfileV2AssessmentForSourceCheckUpId,
  officialMovementProfileV2AssessmentSelection,
  priorMovementProfileV2FocusContextForCheckUp,
  latestOfficialMovementProfileV2Snapshot,
  latestOfficialComparisonPair,
  latestUsableOfficialCheckUpRecord,
  movementProfileV2SnapshotForSourceCheckUpId,
  resolveStoredCheckUpType,
  validOfficialMovementProfileV2Snapshots,
} from '../checkupHistory';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createCheckUpProtocolPolicy,
  createOneLegBalanceV2Setup,
} from '../../checkup';
import type { CheckUp, CheckUpItem } from '../../checkup';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
} from '../../movements';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import { createMovementProfileV2Assessment, createMovementProfileV2Snapshot } from '../../reference/movementProfileV2';
import { CURRENT_SCORING_VERSION, createCurrentVersionedScoreSnapshot, scoreCheckUp } from '../../scoring';
import type { CheckupType } from '../../adherence';

const START = '2026-06-19T08:00:00.000Z';

describe('typed official check-up history selectors', () => {
  it('uses only usable official records for official progress', () => {
    const official = stored(fullCheckUp(START), 'baseline');
    const manual = stored(fullCheckUp('2026-06-20T08:00:00.000Z'), 'manual_extra_v2');
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

  it('selects only valid official Movement Profile V2 snapshots', () => {
    const valid = storedV2Snapshot(makeV2CheckUp('2026-06-23T08:00:00.000Z'), 'baseline');
    const latest = storedV2Snapshot(makeV2CheckUp('2026-07-23T08:00:00.000Z'), 'official_retest');
    const manual = storedV2Snapshot(makeV2CheckUp('2026-08-23T08:00:00.000Z'), 'manual_extra_v2');
    const mismatched = storedV2Snapshot(makeV2CheckUp('2026-09-23T08:00:00.000Z'), 'baseline');
    (mismatched.checkUp.items[0].result as ChairRiseV2Result).reps = 13;

    const records = validOfficialMovementProfileV2Snapshots([latest, mismatched, manual, valid]);

    expect(records.map((item) => item.record.checkUp.startedAt)).toEqual([
      '2026-06-23T08:00:00.000Z',
      '2026-07-23T08:00:00.000Z',
    ]);
    expect(latestOfficialMovementProfileV2Snapshot([latest, valid])?.snapshot.snapshotFingerprint).toBe(
      latest.movementProfileV2Snapshot?.snapshotFingerprint
    );
    expect(
      movementProfileV2SnapshotForSourceCheckUpId([latest, valid], '2026-06-23T08:00:00.000Z')?.type
    ).toBe('baseline');
  });

  it('selects only valid official Movement Profile V2 assessments and reports duplicate conflicts', () => {
    const valid = storedV2Assessment(makeV2CheckUp('2026-06-23T08:00:00.000Z'), 'baseline');
    const latest = storedV2Assessment(makeV2CheckUp('2026-07-23T08:00:00.000Z'), 'official_retest');
    const manual = storedV2Assessment(makeV2CheckUp('2026-08-23T08:00:00.000Z'), 'manual_extra_v2');
    const conflict = storedV2Assessment(makeV2CheckUp('2026-06-23T08:00:00.000Z'), 'baseline', true);

    const selection = officialMovementProfileV2AssessmentSelection([latest, manual, conflict, valid]);

    expect(selection.records.map((item) => item.record.checkUp.startedAt)).toEqual([
      '2026-06-23T08:00:00.000Z',
      '2026-07-23T08:00:00.000Z',
    ]);
    expect(selection.conflicts).toHaveLength(1);
    expect(latestOfficialMovementProfileV2Assessment([valid, latest])?.assessment.assessmentFingerprint).toBe(
      latest.movementProfileV2Assessment?.assessmentFingerprint
    );
    expect(movementProfileV2AssessmentForSourceCheckUpId([latest, valid], valid.checkUp.startedAt)?.type).toBe(
      'baseline'
    );
    expect(
      priorMovementProfileV2FocusContextForCheckUp({
        currentCheckUp: latest.checkUp,
        currentCheckupType: 'official_retest',
        acceptedHistory: [valid],
      }).priorFocusContext.kind
    ).not.toBe('none');
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

function storedV2Snapshot(checkUp: CheckUp, checkupType: CheckupType): StoredCheckUp {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
    createdAt: checkUp.startedAt,
  });
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType,
    checkUp,
    movementProfileV2Snapshot: created.ok ? created.snapshot : undefined,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    movementProfileV2SnapshotCompatibility: created.ok ? 'current' : 'unsupported_source_type',
  };
}

function storedV2Assessment(checkUp: CheckUp, checkupType: CheckupType, alternateGoal = false): StoredCheckUp {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: checkupType === 'manual_extra_v2' ? 'baseline' : checkupType,
    referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
    createdAt: checkUp.startedAt,
  });
  if (!created.ok) throw new Error(`expected V2 snapshot: ${created.reason}`);
  const assessment = createMovementProfileV2Assessment({
    checkUp,
    snapshot: created.snapshot,
    lifeGoal: alternateGoal
      ? {
          id: 'goal-stairs',
          userId: 'local-device-user',
          category: 'stairs_walks',
          createdAt: checkUp.startedAt,
          updatedAt: checkUp.startedAt,
          isPrimary: true,
        }
      : null,
    createdAt: checkUp.startedAt,
  });
  if (!assessment.ok) throw new Error(`expected V2 assessment: ${assessment.reason}`);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType,
    checkUp,
    movementProfileV2Snapshot: created.snapshot,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    movementProfileV2SnapshotCompatibility: 'current',
    movementProfileV2Assessment: assessment.assessment,
    movementProfileV2AssessmentCompatibility: 'current',
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

function makeV2CheckUp(startedAt: string, overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairV2Result() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceV2Result() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderV2Result() },
    ],
  };
}

function chairV2Result(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
  return {
    movementId: CHAIR_RISE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createChairRiseV2Setup({ confirmed: true }),
    setupConfidence: 'confirmed',
    practiceRepCompleted: true,
    activeWindowMs: 30000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 30000, valid: true, reason: 'scheduled_active_window' }],
    fullStandRule: 'stand_completed_at_or_before_window_end',
    reps: 12,
    repStats: [],
    sessionMeanVel: 1.1,
    sessionMeanPeakVel: 1.4,
    pushOffDetected: false,
    fullStandAtExpiryCounted: false,
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function balanceV2Result(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
  return {
    movementId: ONE_LEG_BALANCE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: true }),
    standingLeg: 'left',
    setupConfidence: 'confirmed',
    bestHoldSec: 32,
    bestTrialNumber: 1,
    validTrialCount: 3,
    attemptedTrialCount: 3,
    trials: [],
    rests: [],
    retryCount: 0,
    declinedRemainingTrials: false,
    hardCapReached: false,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 45000, valid: true, reason: 'trial_window' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function shoulderV2Result(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createActiveShoulderReachV2Setup({ selectedSide: 'right', confirmed: true }),
    selectedSide: 'right',
    setupConfidence: 'confirmed',
    peakFlexionDeg: 151,
    retryCount: 0,
    painLimited: false,
    validTrackingMs: 5000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 9000, valid: true, reason: 'valid_capture' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}
