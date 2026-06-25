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
import './chairRiseV2';
import './oneLegBalanceV2';
import './balanceEyesOpenV2';
import './activeShoulderReachV2';

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
export { CHAIR_RISE_V2_ID, ChairRiseV2ProtocolController } from './chairRiseV2';
export type {
  ChairRiseV2Config,
  ChairRiseV2Phase,
  ChairRiseV2RepStat,
  ChairRiseV2Result,
  ChairRiseV2StandInput,
} from './chairRiseV2';
export { ONE_LEG_BALANCE_V2_ID, OneLegBalanceV2ProtocolController } from './oneLegBalanceV2';
export type {
  OneLegBalanceV2Config,
  OneLegBalanceV2Phase,
  OneLegBalanceV2RestEvent,
  OneLegBalanceV2Result,
  OneLegBalanceV2TrialResult,
  OneLegBalanceV2TrialTermination,
} from './oneLegBalanceV2';
export {
  BALANCE_EYES_OPEN_V2_ID,
  BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
  BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
  BALANCE_EYES_OPEN_V2_STAGE_DESCRIPTORS,
  BalanceEyesOpenV2ProtocolController,
  balanceEyesOpenStageSide,
} from './balanceEyesOpenV2';
export type {
  BalanceEyesOpenCompletionReason,
  BalanceEyesOpenPhase,
  BalanceEyesOpenStageDescriptor,
  BalanceEyesOpenStageId,
  BalanceEyesOpenStageKind,
  BalanceEyesOpenStageResult,
  BalanceEyesOpenTrackingRetry,
  BalanceEyesOpenV2Config,
  BalanceEyesOpenV2Result,
  BalanceStageEndReason,
} from './balanceEyesOpenV2';
export {
  ACTIVE_SHOULDER_REACH_V2_ID,
  ActiveShoulderReachV2ProtocolController,
  shoulderReachAngleDegForSide,
  shoulderReachLandmarksForSide,
} from './activeShoulderReachV2';
export type {
  ActiveShoulderReachV2Config,
  ActiveShoulderReachV2Phase,
  ActiveShoulderReachV2Result,
  ShoulderReachLandmarks,
} from './activeShoulderReachV2';
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
