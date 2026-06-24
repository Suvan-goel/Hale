import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createCheckUpProtocolPolicy,
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
  evaluateMovementProfileV2Completeness,
  isJsonSafeProtocolPayload,
  latestV2ShoulderSide,
  latestV2StandingLeg,
} from '../../checkup';
import type { CheckUp } from '../../checkup';
import { createPoseFrame, LM } from '../../pose/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  ActiveShoulderReachV2ProtocolController,
  CHAIR_RISE_V2_ID,
  ChairRiseV2ProtocolController,
  ONE_LEG_BALANCE_V2_ID,
  OneLegBalanceV2ProtocolController,
  shoulderReachAngleDegForSide,
  shoulderReachLandmarksForSide,
  type ActiveShoulderReachV2Result,
  type ChairRiseV2Result,
  type OneLegBalanceV2Result,
} from '../index';

const START = '2026-06-23T08:00:00.000Z';

describe('Movement Profile V2 protocol controllers', () => {
  it('requires chair setup and practice before the 30s active window, and counts a stand at expiry', () => {
    const controller = new ChairRiseV2ProtocolController();

    expect(controller.startActive(0)).toBe(false);
    expect(controller.confirmSetup(createChairRiseV2Setup({ confirmed: true }), 0)).toBe(true);
    expect(controller.startActive(1000)).toBe(false);
    expect(controller.completePracticeRep(2000)).toBe(true);
    expect(controller.startActive(3000)).toBe(true);
    expect(
      controller.creditStand({
        completedAtMs: 33000,
        meanVel: 0.38,
        peakVel: 0.52,
        durationMs: 900,
      })
    ).toBe(true);
    expect(controller.creditStand({ completedAtMs: 33001, meanVel: 0.4 })).toBe(false);

    const result = controller.finish(33000);
    expect(result).toMatchObject({
      movementId: CHAIR_RISE_V2_ID,
      evidenceStatus: 'reference_protocol_complete',
      reps: 1,
      fullStandAtExpiryCounted: true,
      practiceRepCompleted: true,
      invalidReasons: [],
    });
    expect(result.sessionMeanVel).toBeCloseTo(0.38);
    expect(isJsonSafeProtocolPayload(JSON.parse(JSON.stringify(result)))).toBe(true);
  });

  it('keeps one-leg balance invalid attempts out of the valid trial count and honors decline', () => {
    const controller = new OneLegBalanceV2ProtocolController();

    expect(
      controller.confirmSetup(
        createOneLegBalanceV2Setup({ standingLeg: 'right', confirmed: true, priorStandingLeg: 'left' }),
        0
      )
    ).toBe(true);
    expect(controller.startTrial(1000)).toBe(true);
    expect(controller.invalidateTrial(5000, 'tracking_invalid')).toBe(true);
    expect(controller.startTrial(10000)).toBe(false);
    expect(controller.startTrial(35000)).toBe(true);
    expect(controller.completeTrial({ nowMs: 47000, holdMs: 12000, termination: 'touchdown', swaySd: 0.08 })).toBe(true);
    expect(controller.declineRemainingTrials(48000)).toBe(true);

    const result = controller.finish(48000);
    expect(result).toMatchObject({
      movementId: ONE_LEG_BALANCE_V2_ID,
      evidenceStatus: 'raw_only_protocol_incomplete',
      standingLeg: 'right',
      validTrialCount: 1,
      attemptedTrialCount: 2,
      retryCount: 1,
      declinedRemainingTrials: true,
      bestHoldSec: 12,
    });
    expect(result.setup?.changedFromPrior).toBe(true);
    expect(result.trials[0]).toMatchObject({ valid: false, validTrialNumber: null, termination: 'tracking_invalid' });
    expect(result.trials[1]).toMatchObject({ valid: true, validTrialNumber: 1 });
  });

  it('stops one-leg balance early on a 45s ceiling hold', () => {
    const controller = new OneLegBalanceV2ProtocolController();
    controller.confirmSetup(createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: true }), 0);
    controller.startTrial(1000);
    controller.completeTrial({ nowMs: 46000, holdMs: 45000, termination: 'ceiling', swaySd: 0.03 });

    const result = controller.finish(46000);
    expect(result).toMatchObject({
      evidenceStatus: 'reference_protocol_complete',
      validTrialCount: 1,
      bestHoldSec: 45,
      hardCapReached: false,
    });
  });

  it('freezes shoulder side selection, allows one invalid retry, and records pain-limited raw evidence', () => {
    const controller = new ActiveShoulderReachV2ProtocolController();

    expect(
      controller.confirmSetup(
        createActiveShoulderReachV2Setup({ selectedSide: 'right', confirmed: true, priorSelectedSide: 'left' }),
        0
      )
    ).toBe(true);
    expect(controller.startCapture(1000)).toBe(true);
    expect(controller.recordInvalidCapture(4000, 'tracking_uncertain')).toBe(true);
    expect(controller.phase).toBe('retry_ready');
    expect(controller.startCapture(5000)).toBe(true);
    expect(controller.recordPainLimitedCapture({ nowMs: 8000, peakFlexionDeg: 126, validTrackingMs: 3200 })).toBe(true);

    const result = controller.finish(8000);
    expect(result).toMatchObject({
      movementId: ACTIVE_SHOULDER_REACH_V2_ID,
      evidenceStatus: 'raw_only_pain_limited',
      selectedSide: 'right',
      retryCount: 1,
      painLimited: true,
      peakFlexionDeg: 126,
    });
    expect(result.setup?.changedFromPrior).toBe(true);
  });

  it('uses selected-side shoulder geometry instead of auto-switching to the near side', () => {
    const frame = createPoseFrame();
    frame.hasPose = true;
    frame.xs[LM.LEFT_HIP] = 0;
    frame.ys[LM.LEFT_HIP] = 1;
    frame.xs[LM.LEFT_SHOULDER] = 0;
    frame.ys[LM.LEFT_SHOULDER] = 0;
    frame.xs[LM.LEFT_ELBOW] = 1;
    frame.ys[LM.LEFT_ELBOW] = 0;
    frame.xs[LM.RIGHT_HIP] = 0;
    frame.ys[LM.RIGHT_HIP] = 1;
    frame.xs[LM.RIGHT_SHOULDER] = 0;
    frame.ys[LM.RIGHT_SHOULDER] = 0;
    frame.xs[LM.RIGHT_ELBOW] = 0;
    frame.ys[LM.RIGHT_ELBOW] = -1;

    expect(shoulderReachLandmarksForSide('left')).toMatchObject({ shoulder: LM.LEFT_SHOULDER });
    expect(shoulderReachLandmarksForSide('right')).toMatchObject({ shoulder: LM.RIGHT_SHOULDER });
    expect(shoulderReachAngleDegForSide(frame, 'left')).toBeCloseTo(90);
    expect(shoulderReachAngleDegForSide(frame, 'right')).toBeCloseTo(180);
  });
});

describe('Movement Profile V2 raw completeness', () => {
  it('requires V2 headline movements and treats hinge reach as supporting only', () => {
    const checkUp: CheckUp = {
      startedAt: START,
      protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, START),
      bodyUnit: 0.33,
      items: [
        measured(CHAIR_RISE_V2_ID, chairResult()),
        measured(ONE_LEG_BALANCE_V2_ID, balanceResult()),
        measured(ACTIVE_SHOULDER_REACH_V2_ID, shoulderResult()),
      ],
    };

    expect(evaluateMovementProfileV2Completeness(checkUp)).toMatchObject({
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      isMovementProfileV2: true,
      referenceComplete: true,
      missingHeadlineMovementIds: [],
    });
    expect(latestV2StandingLeg([checkUp])).toBe('left');
    expect(latestV2ShoulderSide([checkUp])).toBe('right');
  });
});

function measured(movementId: string, result: ChairRiseV2Result | OneLegBalanceV2Result | ActiveShoulderReachV2Result): CheckUp['items'][number] {
  return { movementId, status: 'measured', result };
}

function chairResult(): ChairRiseV2Result {
  const controller = new ChairRiseV2ProtocolController();
  controller.confirmSetup(createChairRiseV2Setup({ confirmed: true }), 0);
  controller.completePracticeRep(1000);
  controller.startActive(2000);
  controller.creditStand({ completedAtMs: 3000, meanVel: 0.4, peakVel: 0.6, durationMs: 900 });
  return controller.finish(32000);
}

function balanceResult(): OneLegBalanceV2Result {
  const controller = new OneLegBalanceV2ProtocolController();
  controller.confirmSetup(createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: true }), 0);
  controller.startTrial(1000);
  controller.completeTrial({ nowMs: 46000, holdMs: 45000, termination: 'ceiling', swaySd: 0.04 });
  return controller.finish(46000);
}

function shoulderResult(): ActiveShoulderReachV2Result {
  const controller = new ActiveShoulderReachV2ProtocolController();
  controller.confirmSetup(createActiveShoulderReachV2Setup({ selectedSide: 'right', confirmed: true }), 0);
  controller.startCapture(1000);
  controller.recordValidCapture({ nowMs: 5000, peakFlexionDeg: 158, validTrackingMs: 3500 });
  return controller.finish(5000);
}
