/**
 * Movement registry entry point. Importing this module registers every
 * movement definition; screens use the registry and never import a
 * definition module directly. New movements: add the file, add one import
 * line here — player code stays untouched.
 */

import './chairStand';

export { CHAIR_STAND_ID } from './chairStand';
export type { ChairStandRepStat, ChairStandResult } from './chairStand';
export { getMovement, listMovements, registerMovement } from './registry';
export type {
  CameraViewSpec,
  EquipmentTag,
  GraderUpdate,
  MovementDefinition,
  MovementGrader,
  MovementResultBase,
  MovementVoiceScript,
} from './types';
