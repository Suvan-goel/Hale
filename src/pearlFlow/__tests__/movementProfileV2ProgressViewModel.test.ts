import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import type { CheckUp } from '../../checkup/types';
import type { MeasurementProtocolRef } from '../../checkup/measurementContext';
import {
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
  PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
} from '../../checkup/measurementProtocolRegistry';
import { bareDownwardChanges } from '../testing/copyInvariants';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  type MovementProfileV2Assessment,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { buildMovementProfileV2ProgressViewModel } from '../movementProfileV2ProgressViewModel';

const BASELINE_AT = '2026-06-01T08:00:00.000Z';
const RETAKE_AT = '2026-06-10T08:00:00.000Z';
const RETEST_AT = '2026-06-29T08:00:00.000Z';
const CREATED_AT = '2026-06-01T08:08:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 Progress view model', () => {
  it('shows the latest frozen measurements and neutral official history', () => {
    const baseline = artifacts('baseline', BASELINE_AT);

    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record],
    });

    expect(viewModel.status).toBe('ready');
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.hero.domains.map((card) => card.metric)).toContain('12 rises in 30 seconds');
    expect(viewModel.officialHistory).toHaveLength(1);
    expect(viewModel.officialHistory[0]).toMatchObject({
      id: BASELINE_AT,
      sourceLabel: 'First Movement Check-Up',
    });
    // Computed-change words stay banned on this frozen surface. The bare word
    // "trend" left the list 2026-07-06 (reposition slice 5): the neutral card
    // body's forward-looking "your own … trend" is the framing of record and
    // claims no computed change.
    expect(JSON.stringify(viewModel).toLowerCase()).not.toMatch(
      /movement age|weakest|improved|declined|increase|decrease|delta|percent change/
    );
  });

  it('summarises change across check-ups only once a second Check-Up exists', () => {
    const baseline = artifacts('baseline', BASELINE_AT); // default chair result is 12 reps
    const retake = artifacts('baseline_retake', RETAKE_AT, { chair: chairResult({ reps: 16 }) });

    const single = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record],
    });
    if (single.status !== 'ready') throw new Error(single.status);
    expect(single.change).toBeNull();
    expect(single.changeReadiness).toMatchObject({
      status: 'building_baseline',
      title: 'Your baseline is saved',
    });

    const paired = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retake.record],
    });
    if (paired.status !== 'ready') throw new Error(paired.status);
    expect(paired.change).not.toBeNull();
    expect(paired.changeReadiness).toEqual({ status: 'ready' });
    expect(paired.change?.headline).toContain('Since your first check-up');
    expect(paired.change?.domains.find((domain) => domain.domain === 'strength_power')).toMatchObject({
      direction: 'up',
      value: '12 → 16 rises',
      caption: 'Up 4 rises',
      series: [
        { atIso: BASELINE_AT, dateLabel: 'Jun 1, 2026', value: 12 },
        { atIso: RETAKE_AT, dateLabel: 'Jun 10, 2026', value: 16 },
      ],
    });
    // Up rows never carry support copy — pairing is for lower readings only.
    expect(
      paired.change?.domains.find((domain) => domain.domain === 'strength_power')?.supportCopy
    ).toBeUndefined();
  });

  it('starts a new comparison series when the measurement protocol changes', () => {
    const legacy = artifacts('baseline', BASELINE_AT, { chair: chairResult({ reps: 8 }) });
    const monthlyProtocol: MeasurementProtocolRef = {
      protocolId: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
      protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
      protocolVariant: PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
    };
    const firstMonthly = artifacts('baseline_retake', RETAKE_AT, {
      chair: chairResult({ reps: 12 }),
      measurementProtocol: monthlyProtocol,
    });
    const latestMonthly = artifacts('official_retest', RETEST_AT, {
      chair: chairResult({ reps: 16 }),
      measurementProtocol: monthlyProtocol,
    });

    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [legacy.record, firstMonthly.record, latestMonthly.record],
    });
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.change?.headline).toBe('Since this check-up method began · Jun 10, 2026');
    expect(viewModel.change?.domains.find((domain) => domain.domain === 'strength_power')).toMatchObject({
      direction: 'up',
      value: '12 → 16 rises',
      caption: 'Up 4 rises',
      series: [
        { atIso: RETAKE_AT, dateLabel: 'Jun 10, 2026', value: 12 },
        { atIso: RETEST_AT, dateLabel: 'Jun 29, 2026', value: 16 },
      ],
    });
  });

  it('explains when a changed measurement method is still building its new baseline', () => {
    const legacy = artifacts('baseline', BASELINE_AT, { chair: chairResult({ reps: 8 }) });
    const monthly = artifacts('official_retest', RETEST_AT, {
      chair: chairResult({ reps: 14 }),
      measurementProtocol: {
        protocolId: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
        protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
        protocolVariant: PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
      },
    });
    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [legacy.record, monthly.record],
    });
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.change).toBeNull();
    expect(viewModel.changeReadiness).toMatchObject({
      status: 'new_method_baseline',
      title: 'A new comparison baseline has started',
    });
  });

  it('treats small absolute changes as measurement noise', () => {
    const baseline = artifacts('baseline', BASELINE_AT, {
      balance: balanceResult({ bestHoldSec: 32 }),
    });
    const retake = artifacts('baseline_retake', RETAKE_AT, {
      balance: balanceResult({ bestHoldSec: 34 }),
    });
    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retake.record],
    });
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.change?.domains.find((domain) => domain.domain === 'balance')).toMatchObject({
      direction: 'steady',
      value: '32 → 34 sec',
      caption: 'Holding steady',
    });
  });

  it('never presents a lower reading bare: every down row pairs the trainable path (§2.4)', () => {
    const baseline = artifacts('baseline', BASELINE_AT); // default chair result is 12 reps
    const retake = artifacts('baseline_retake', RETAKE_AT, { chair: chairResult({ reps: 9 }) });
    const paired = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retake.record],
    });
    if (paired.status !== 'ready') throw new Error(paired.status);
    const rows = (paired.change?.domains ?? []).map((domain) => ({
      id: domain.domain,
      direction: domain.direction,
      supportCopy: domain.supportCopy,
    }));
    expect(rows.some((row) => row.direction === 'down')).toBe(true);
    expect(bareDownwardChanges(rows)).toEqual([]);
    const down = paired.change?.domains.find((domain) => domain.direction === 'down');
    expect(down?.supportCopy).toContain('your plan');
  });

  it('uses typed recovery states without V1 fallback copy', () => {
    const malformed = buildMovementProfileV2ProgressViewModel({
      history: [{
        ...artifacts('baseline', BASELINE_AT).record,
        movementProfileV2Assessment: undefined,
        movementProfileV2AssessmentCompatibility: 'malformed',
      }],
    });
    expect(malformed.status).toBe('artifact_recovery');
    if (malformed.status === 'ready') throw new Error('expected recovery');
    expect(malformed.actions).toEqual([]);
    expect(JSON.stringify(malformed).toLowerCase()).not.toContain('movement age');
  });
});

function artifacts(
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest',
  startedAt: string,
  overrides: {
    chair?: ChairRiseV2Result;
    balance?: OneLegBalanceV2Result;
    shoulder?: ActiveShoulderReachV2Result;
    measurementProtocol?: MeasurementProtocolRef;
  } = {}
): {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  record: StoredCheckUp;
} {
  const checkUp = v2CheckUp({ startedAt, ...overrides });
  const snapshot = mustCreateSnapshot(checkUp, checkupType);
  const assessment = mustAssess(checkUp, snapshot);
  return {
    checkUp,
    snapshot,
    assessment,
    record: {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      checkUp,
      checkupType,
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      movementProfileV2Snapshot: snapshot,
      movementProfileV2SnapshotCompatibility: 'current',
      movementProfileV2Assessment: assessment,
      movementProfileV2AssessmentCompatibility: 'current',
    },
  };
}

function mustCreateSnapshot(
  checkUp: CheckUp,
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest'
): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(created.reason);
  return created.snapshot;
}

function mustAssess(
  checkUp: CheckUp,
  snapshot: StoredMovementProfileV2Snapshot
): MovementProfileV2Assessment {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(created.reason);
  return created.assessment;
}

function v2CheckUp(input: {
  startedAt: string;
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
  measurementProtocol?: MeasurementProtocolRef;
}): CheckUp {
  return {
    startedAt: input.startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, input.startedAt),
    ...(input.measurementProtocol ? { measurementProtocol: input.measurementProtocol } : {}),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: input.chair ?? chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: input.balance ?? balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: input.shoulder ?? shoulderResult() },
    ],
  };
}

function chairResult(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
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

function balanceResult(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
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

function shoulderResult(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
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
