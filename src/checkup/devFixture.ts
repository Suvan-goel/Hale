/**
 * DEV-ONLY synthetic Movement Check-Up.
 *
 * Lets you skip the camera-graded battery (which can't run on an emulator —
 * MediaPipe needs OpenGL ES 3.1+) and exercise everything downstream of a
 * check-up: results, focus selection, longitudinal history, and the training
 * block it seeds. Builds a unified Movement Profile V2 raw check-up through
 * the same internal flow reducer and protocol controllers the live capture
 * uses, so it materializes and persists exactly like a real result.
 *
 * Values are plausible for the target demographic and biased so Balance
 * lands as the weakest domain, making the generated block non-trivial. Not
 * imported by production paths; gate any call site on `__DEV__`.
 */

import {
  createCapturedActiveShoulderReachV2Result,
  createCapturedChairRiseV2Result,
  createCapturedHingeReachResult,
  createCapturedOneLegBalanceV2Result,
  createMovementProfileV2InternalFlow,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
} from '../movementProfileV2/internalCheckupFlow';
import type { CheckUp } from './types';

export function syntheticCheckUp(startedAt: string = new Date().toISOString()): CheckUp {
  let flow = createMovementProfileV2InternalFlow({ startedAt });
  flow = { ...flow, sourceType: 'baseline' };
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_chair',
    result: createCapturedChairRiseV2Result({ reps: 13 }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'confirm_balance_setup',
    standingLeg: 'left',
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_balance',
    result: createCapturedOneLegBalanceV2Result({
      standingLeg: 'left',
      holdsSec: [8, 7, 6],
    }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'confirm_shoulder_setup',
    shoulderSide: 'right',
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_shoulder',
    result: createCapturedActiveShoulderReachV2Result({
      selectedSide: 'right',
      peakFlexionDeg: 158,
    }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_hinge',
    result: createCapturedHingeReachResult(0.2),
  });
  const checkUp = movementProfileV2RawCheckUpFromFlow(flow);
  if (!checkUp) {
    throw new Error('[devFixture] synthetic Movement Profile V2 check-up did not complete');
  }
  return checkUp;
}
