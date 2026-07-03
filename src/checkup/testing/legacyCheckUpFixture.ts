/**
 * TEST-ONLY legacy-format synthetic check-up.
 *
 * Lets you skip the camera-graded battery (which can't run on an emulator —
 * MediaPipe needs OpenGL ES 3.1+) and exercise everything downstream of a
 * check-up: the Results screen, weakest-domain focus, longitudinal history,
 * and the training block it seeds. Fed through the normal completion path, so
 * it scores and persists exactly like a real result.
 *
 * Values are plausible for the target demographic and biased so Balance
 * lands as the weakest domain, making the generated block non-trivial. Not
 * imported by production paths; gate any call site on `__DEV__`.
 */

import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  TUG_ID,
} from '../../movements';
import type {
  BalanceResult,
  ChairStandResult,
  HingeReachResult,
  ShoulderFlexionResult,
  TugResult,
} from '../../movements';
import type { MovementResultBase } from '../../movements';
import { CheckUp, CheckUpItem } from '../types';

function measured(movementId: string, result: MovementResultBase): CheckUpItem {
  return { movementId, status: 'measured', result };
}

export function legacySyntheticCheckUp(startedAt: string = new Date().toISOString()): CheckUp {
  const chairStand: ChairStandResult = {
    movementId: CHAIR_STAND_ID,
    flags: [],
    interruptions: 0,
    reps: 13,
    repStats: [],
    sessionMeanVel: 0.21,
    sessionMeanPeakVel: 0.29,
    pushOffDetected: false,
  };
  const tug: TugResult = {
    movementId: TUG_ID,
    flags: [],
    interruptions: 0,
    totalSec: 9.2,
    completed: true,
    turnDetected: true,
    peakExcursionBu: 1.9,
    nonStandardShortPath: false,
  };
  const balance: BalanceResult = {
    movementId: BALANCE_LADDER_ID,
    flags: [],
    interruptions: 0,
    stages: [],
    singleLegEyesOpenSec: 8,
  };
  const shoulder: ShoulderFlexionResult = {
    movementId: SHOULDER_FLEXION_ID,
    flags: [],
    interruptions: 0,
    peakFlexionDeg: 158,
  };
  const hinge: HingeReachResult = {
    movementId: HINGE_REACH_ID,
    flags: [],
    interruptions: 0,
    reachBu: 0.2,
  };

  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      measured(CHAIR_STAND_ID, chairStand),
      measured(TUG_ID, tug),
      measured(BALANCE_LADDER_ID, balance),
      measured(SHOULDER_FLEXION_ID, shoulder),
      measured(HINGE_REACH_ID, hinge),
    ],
  };
}
