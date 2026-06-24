import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import type { CheckUp } from '../../checkup/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import {
  ONE_LEG_BALANCE_V2_ID,
  type OneLegBalanceV2Result,
} from '../../movements/oneLegBalanceV2';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import {
  classifyMovementProfileV2RecoveryState,
  movementProfileV2RecoveryCopy,
  type MovementProfileV2RecoveryStateKind,
} from '../recovery';

const STARTED_AT = '2026-06-24T08:00:00.000Z';
const CREATED_AT = '2026-06-24T08:02:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 recovery', () => {
  it('classifies ready, sync-pending, raw-complete, and snapshot-only states without recomputing display artifacts', () => {
    const checkUp = makeV2CheckUp();
    const snapshot = snapshotFor(checkUp);
    const assessment = assessmentFor(checkUp, snapshot);

    expect(
      classifyMovementProfileV2RecoveryState({
        checkUp: { ...checkUp, movementProfileV2Snapshot: snapshot, movementProfileV2Assessment: assessment },
        checkupType: 'baseline',
      })
    ).toMatchObject({
      kind: 'ready',
      canOpenProfile: true,
      canMaterialize: false,
    });

    expect(
      classifyMovementProfileV2RecoveryState({
        checkUp: { ...checkUp, movementProfileV2Snapshot: snapshot, movementProfileV2Assessment: assessment },
        checkupType: 'baseline',
        syncPending: true,
      })
    ).toMatchObject({
      kind: 'sync_pending_local_ready',
      canUseSavedResult: true,
    });

    expect(classifyMovementProfileV2RecoveryState({ checkUp, checkupType: 'baseline' })).toMatchObject({
      kind: 'raw_complete_missing_snapshot',
      canMaterialize: true,
    });
    expect(
      classifyMovementProfileV2RecoveryState({
        checkUp: { ...checkUp, movementProfileV2Snapshot: snapshot },
        checkupType: 'baseline',
      })
    ).toMatchObject({
      kind: 'snapshot_missing_assessment',
      canMaterialize: true,
    });
  });

  it('classifies incomplete, future, and mismatched artifacts into safe recovery states', () => {
    const validCheckUp = makeV2CheckUp();
    const snapshot = snapshotFor(validCheckUp);
    const incomplete = makeV2CheckUp({
      balance: balanceResult({ evidenceStatus: 'invalid_measurement', bestHoldSec: Number.NaN }),
    });

    expect(classifyMovementProfileV2RecoveryState({ checkUp: incomplete, checkupType: 'baseline' })).toMatchObject({
      kind: 'raw_incomplete',
      shouldRetake: true,
    });
    expect(
      classifyMovementProfileV2RecoveryState({
        checkUp: validCheckUp,
        checkupType: 'baseline',
        snapshot: { ...snapshot, schemaVersion: 2 },
      })
    ).toMatchObject({
      kind: 'unsupported_future_artifact',
      shouldRetake: true,
    });
    expect(
      classifyMovementProfileV2RecoveryState({
        checkUp: makeV2CheckUp({ startedAt: '2026-06-25T08:00:00.000Z' }),
        checkupType: 'baseline',
        snapshot,
      })
    ).toMatchObject({
      kind: 'snapshot_malformed_or_mismatched',
      shouldRetake: true,
    });
    expect(
      classifyMovementProfileV2RecoveryState({
        checkUp: ({
          ...validCheckUp,
          movementProfileV2Snapshot: snapshot,
          movementProfileV2Assessment: { kind: 'legacy' } as unknown,
        } as CheckUp),
        checkupType: 'baseline',
      })
    ).toMatchObject({
      kind: 'assessment_malformed_or_mismatched',
      shouldRetake: true,
    });
  });

  it('keeps recovery copy calm and free of internal artifact jargon', () => {
    const banned = /corrupt|failed|invalid database|fingerprint|schema|conflict|internal reason/i;
    const states: MovementProfileV2RecoveryStateKind[] = [
      'ready',
      'raw_complete_missing_snapshot',
      'snapshot_missing_assessment',
      'raw_incomplete',
      'snapshot_malformed_or_mismatched',
      'assessment_malformed_or_mismatched',
      'immutable_conflict',
      'unsupported_future_artifact',
      'sync_pending_local_ready',
    ];

    for (const kind of states) {
      const copy = movementProfileV2RecoveryCopy(kind);
      expect(`${copy.title} ${copy.body} ${copy.primaryLabel} ${copy.secondaryLabel ?? ''}`).not.toMatch(banned);
    }
  });
});

function snapshotFor(checkUp: CheckUp): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: 'baseline',
    referenceProfile: REFERENCE_PROFILE,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(`expected snapshot: ${created.reason}`);
  return created.snapshot;
}

function assessmentFor(checkUp: CheckUp, snapshot: StoredMovementProfileV2Snapshot) {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(`expected assessment: ${created.reason}`);
  return created.assessment;
}

function makeV2CheckUp(overrides: {
  startedAt?: string;
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  const startedAt = overrides.startedAt ?? STARTED_AT;
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderResult() },
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
