/**
 * Movement registry entry point. Importing this module registers every
 * movement definition; screens use the registry and never import a
 * definition module directly. New movements: add the file, add one import
 * line here — player code stays untouched.
 */

import './chairStand';
import './balanceLadder';
import './tug';
import './shoulderFlexion';
import './hingeReach';

export { CHAIR_STAND_ID } from './chairStand';
export type { ChairStandRepStat, ChairStandResult } from './chairStand';
export {
  BALANCE_LADDER_ID,
  DEFAULT_BALANCE_STAGES,
} from './balanceLadder';
export type {
  BalanceResult,
  BalanceStageConfig,
  BalanceStageResult,
  BalanceStance,
  BalanceTermination,
} from './balanceLadder';
export { TUG_ID } from './tug';
export type { TugResult } from './tug';
export { SHOULDER_FLEXION_ID } from './shoulderFlexion';
export type { ShoulderFlexionResult } from './shoulderFlexion';
export { HINGE_REACH_ID } from './hingeReach';
export type { HingeReachResult } from './hingeReach';
export { getMovement, listMovements, registerMovement } from './registry';
export type {
  CameraViewSpec,
  EquipmentTag,
  GraderUpdate,
  GraderVoice,
  MovementDefinition,
  MovementGrader,
  MovementResultBase,
  MovementVoiceScript,
} from './types';
