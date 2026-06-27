import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup';
import type { CheckUp } from '../../checkup';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  type ActiveShoulderReachV2Result,
  type ChairRiseV2Result,
  type OneLegBalanceV2Result,
} from '../../movements';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { buildMovementProfileV2ResultsViewModel } from '../viewModel';

describe('Movement Profile V2 view model', () => {
  it('uses only frozen V2 artifacts and avoids trend, age, and diagnostic-code language', () => {
    const checkUp = makeV2CheckUp();
    const snapshot = createMovementProfileV2Snapshot({
      checkUp,
      checkupType: 'baseline',
      referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
      createdAt: '2026-06-24T09:01:00.000Z',
    });
    if (!snapshot.ok) throw new Error(snapshot.reason);
    const assessment = createMovementProfileV2Assessment({
      checkUp,
      snapshot: snapshot.snapshot,
      createdAt: '2026-06-24T09:02:00.000Z',
    });
    if (!assessment.ok) throw new Error(assessment.reason);

    const model = buildMovementProfileV2ResultsViewModel({
      snapshot: snapshot.snapshot,
      assessment: assessment.assessment,
    });
    const text = JSON.stringify(model);

    expect(model.domainCards.map((card) => card.domain)).toEqual(['strength_power', 'balance', 'mobility']);
    expect(model.focusTitle).toMatch(/^Suggested focus:/);
    expect(text).not.toMatch(/movement age|improved|declined|fingerprint|v2_|reason/i);
    expect(text).toContain('Around the 10th-40th percentile');
  });
});

function makeV2CheckUp(): CheckUp {
  return {
    startedAt: '2026-06-24T09:00:00.000Z',
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, '2026-06-24T09:00:00.000Z'),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: shoulderResult() },
    ],
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
  };
}

function shoulderResult(): ActiveShoulderReachV2Result {
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
  };
}
