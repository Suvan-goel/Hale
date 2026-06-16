/**
 * Exercise registry entry point. Importing this module registers every training
 * exercise definition; the session player and block builder use the registry
 * and never import a definition module directly. New exercise: add the file,
 * add one import line here — player/block code stays untouched.
 */

import './sitToStand';
import './supportedSquat';
import './stepUp';
import './heelRaise';
import './gluteBridge';
import './pushUp';
import './overheadPress';
import './hipHinge';
import './balanceRung';
import './seatedHamstringReach';
import './neckRotation';
import './loadedMarch';
import './pullUpperBack';
import './lateralStability';
import './mobilityDrills';

export { STS_CUSHION_ID, STS_STANDARD_ID, STS_SLOW_ECC_ID, STS_POWER_ID, LOADED_STS_ID } from './sitToStand';
export { SQUAT_SUPPORTED_ID, SQUAT_FREE_ID, SQUAT_SLOW_ECC_ID, SQUAT_LOADED_ID, SPLIT_SQUAT_SUPPORTED_ID } from './supportedSquat';
export { STEP_UP_ID } from './stepUp';
export { HEEL_RAISE_SUPPORTED_ID, HEEL_RAISE_FREE_ID, TOE_RAISE_SUPPORTED_ID } from './heelRaise';
export { BRIDGE_HOLD_ID, BRIDGE_REPS_ID } from './gluteBridge';
export { PUSHUP_WALL_ID, PUSHUP_INCLINE_ID, PUSHUP_STANDARD_ID } from './pushUp';
export { OVERHEAD_REACH_ID, OVERHEAD_PRESS_ID } from './overheadPress';
export { HINGE_WALL_ID, HINGE_FREE_ID } from './hipHinge';
export { BALANCE_FEET_TOGETHER_ID, BALANCE_TANDEM_ID, BALANCE_SINGLE_LEG_ID } from './balanceRung';
export { HAMSTRING_REACH_ID } from './seatedHamstringReach';
export { NECK_ROTATION_ID } from './neckRotation';
export { LOADED_MARCH_ID } from './loadedMarch';
export { SEATED_BAND_ROW_ID, STANDING_BAND_ROW_ID, BAND_PULL_APART_ID } from './pullUpperBack';
export { SIDE_STEP_SUPPORTED_ID, LATERAL_WALK_MINI_BAND_ID } from './lateralStability';
export { THORACIC_ROTATION_ID, HIP_FLEXOR_STRETCH_ID, WALL_CALF_STRETCH_ID } from './mobilityDrills';

export {
  getExerciseLadder,
  legacyExerciseAliases,
  listExerciseLadders,
  listVisibleExerciseLadders,
  resolveExerciseId,
  resolveExerciseLevel,
} from './ladders';
export type { ExerciseCameraView, ExerciseLadder, ExerciseLevel, ResolvedExerciseLevel } from './ladders';

export { getExercise, hasExercise, listExercises, familyLevels, registerExercise } from './registry';
export type {
  ExerciseDefinition,
  ExerciseDomain,
  ExerciseKind,
  ExercisePrescription,
  ExerciseSetGrader,
  ExerciseVoiceScript,
  MeasurementTier,
  ReleaseStatus,
  SetGraderUpdate,
  SetResult,
  TrainingSlot,
} from './types';
