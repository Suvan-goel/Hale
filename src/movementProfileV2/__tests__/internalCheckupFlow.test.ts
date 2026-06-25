import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup';
import type { CheckUp } from '../../checkup';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  BALANCE_EYES_OPEN_V2_ID,
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  type ActiveShoulderReachV2Result,
  type ChairRiseV2Result,
  type OneLegBalanceV2Result,
} from '../../movements';
import {
  createCapturedActiveShoulderReachV2Result,
  createCapturedBalanceEyesOpenV2Result,
  createCapturedChairRiseV2Result,
  createCapturedHingeReachResult,
  createCapturedOneLegBalanceV2Result,
  createMovementProfileV2InternalFlow,
  latestPendingMovementProfileV2RawCheckUp,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
} from '../internalCheckupFlow';

describe('internal Movement Profile V2 flow', () => {
  it('starts as baseline without a prior official V2 artifact', () => {
    const flow = createMovementProfileV2InternalFlow({
      startedAt: '2026-06-24T09:00:00.000Z',
      history: [],
    });

    expect(flow.sourceType).toBe('baseline');
    expect(flow.step).toBe('chair_setup');
  });

  it('starts later internal runs as baseline retakes and prefills side choices from frozen V2 history', () => {
    const prior = storedV2Assessment(makeV2CheckUp('2026-06-01T09:00:00.000Z'), 'baseline');
    const flow = createMovementProfileV2InternalFlow({
      startedAt: '2026-06-24T09:00:00.000Z',
      history: [prior],
    });

    expect(flow.sourceType).toBe('baseline_retake');
    expect(flow.priorStandingLeg).toBe('right');
    expect(flow.standingLeg).toBe('right');
    expect(flow.priorShoulderSide).toBe('left');
    expect(flow.shoulderSide).toBe('left');
  });

  it('records each movement once and materializes a raw V2 check-up in battery order', () => {
    let flow = createMovementProfileV2InternalFlow({ startedAt: '2026-06-24T09:00:00.000Z' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
    const chair = createCapturedChairRiseV2Result({ reps: 12 });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'record_chair', result: chair });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'record_chair', result: createCapturedChairRiseV2Result({ reps: 20 }) });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_balance_setup', standingLeg: 'left' });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_balance',
      result: createCapturedOneLegBalanceV2Result({ standingLeg: 'left', holdsSec: [28, 31, 30] }),
    });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_shoulder_setup', shoulderSide: 'right' });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_shoulder',
      result: createCapturedActiveShoulderReachV2Result({ selectedSide: 'right', peakFlexionDeg: 154 }),
    });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_hinge',
      result: createCapturedHingeReachResult(0.24),
    });

    const checkUp = movementProfileV2RawCheckUpFromFlow(flow);

    expect(flow.items.filter((item) => item.movementId === CHAIR_RISE_V2_ID)).toHaveLength(1);
    expect(checkUp?.protocolPolicy?.id).toBe(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID);
    expect(checkUp?.items.map((item) => item.movementId)).toEqual([
      CHAIR_RISE_V2_ID,
      ONE_LEG_BALANCE_V2_ID,
      ACTIVE_SHOULDER_REACH_V2_ID,
      'hinge-reach',
    ]);
  });

  it('materializes the eyes-open balance V2 battery order without mixing old and new balance items', () => {
    let flow = createMovementProfileV2InternalFlow({ startedAt: '2026-06-24T09:00:00.000Z' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'record_chair', result: createCapturedChairRiseV2Result({ reps: 12 }) });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_balance_setup', standingLeg: 'left' });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_balance',
      result: createCapturedBalanceEyesOpenV2Result({ standingLeg: 'left' }),
    });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_shoulder_setup', shoulderSide: 'right' });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_shoulder',
      result: createCapturedActiveShoulderReachV2Result({ selectedSide: 'right', peakFlexionDeg: 154 }),
    });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'record_hinge', result: createCapturedHingeReachResult(0.24) });

    const checkUp = movementProfileV2RawCheckUpFromFlow(flow);

    expect(checkUp?.items.map((item) => item.movementId)).toEqual([
      CHAIR_RISE_V2_ID,
      BALANCE_EYES_OPEN_V2_ID,
      ACTIVE_SHOULDER_REACH_V2_ID,
      'hinge-reach',
    ]);
    expect(checkUp?.items.some((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)).toBe(false);
  });

  it('resumes the latest raw-complete V2 record at reference details', () => {
    const pending = storedRawV2(makeV2CheckUp('2026-06-24T09:00:00.000Z'), 'baseline');
    const materialized = storedV2Assessment(makeV2CheckUp('2026-06-01T09:00:00.000Z'), 'baseline');

    const resumed = latestPendingMovementProfileV2RawCheckUp([materialized, pending]);

    expect(resumed?.record.checkUp.startedAt).toBe('2026-06-24T09:00:00.000Z');
    expect(resumed?.sourceType).toBe('baseline');
  });
});

const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

function makeV2CheckUp(startedAt: string): CheckUp {
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: shoulderResult() },
    ],
  };
}

function storedRawV2(checkUp: CheckUp, checkupType: 'baseline' | 'baseline_retake'): StoredCheckUp {
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp,
    checkupType,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
  };
}

function storedV2Assessment(checkUp: CheckUp, checkupType: 'baseline' | 'baseline_retake'): StoredCheckUp {
  const snapshot = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt: checkUp.startedAt,
  });
  if (!snapshot.ok) throw new Error(snapshot.reason);
  const assessment = createMovementProfileV2Assessment({
    checkUp,
    snapshot: snapshot.snapshot,
    createdAt: checkUp.startedAt,
  });
  if (!assessment.ok) throw new Error(assessment.reason);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp,
    checkupType,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    movementProfileV2Snapshot: snapshot.snapshot,
    movementProfileV2SnapshotCompatibility: 'current',
    movementProfileV2Assessment: assessment.assessment,
    movementProfileV2AssessmentCompatibility: 'current',
  };
}

function chairResult(): ChairRiseV2Result {
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
  };
}

function balanceResult(): OneLegBalanceV2Result {
  return {
    movementId: ONE_LEG_BALANCE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createOneLegBalanceV2Setup({ standingLeg: 'right', confirmed: true }),
    standingLeg: 'right',
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
  };
}

function shoulderResult(): ActiveShoulderReachV2Result {
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createActiveShoulderReachV2Setup({ selectedSide: 'left', confirmed: true }),
    selectedSide: 'left',
    setupConfidence: 'confirmed',
    peakFlexionDeg: 151,
    retryCount: 0,
    painLimited: false,
    validTrackingMs: 5000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 9000, valid: true, reason: 'valid_capture' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
  };
}
