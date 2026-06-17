/**
 * Dynamic balance / lateral stability. These are deliberately timed
 * camera-assisted sets in V1: useful presence, rhythm, and completion support
 * without brittle side-step form scoring.
 */

import { timerGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const FRONT = { view: 'front', requiredReliableSideChains: 2 } as const;
const FAMILY = 'lateral-stability';

export const SIDE_STEP_SUPPORTED_ID = 'supported-side-step';
export const LATERAL_WALK_MINI_BAND_ID = 'mini-band-lateral-walk';

export const lateralStabilityLevels: ExerciseDefinition[] = [
  {
    id: SIDE_STEP_SUPPORTED_ID,
    displayName: 'Supported Side Step',
    family: FAMILY,
    level: 1,
    slot: 'balance',
    cameraView: FRONT,
    equipment: ['counter'],
    kind: 'timer',
    timing: { mode: 'valid_time' },
    prescription: { sets: 2, timerSec: 30, restSec: 30, autoregulate: false },
    voice: { instructions: [] },
    progressionId: LATERAL_WALK_MINI_BAND_ID,
    createGrader: timerGrader(SIDE_STEP_SUPPORTED_ID, 30, {
      validationMode: 'broad_setup_gated',
      predicate: 'front-lateral',
    }),
  },
  {
    id: LATERAL_WALK_MINI_BAND_ID,
    displayName: 'Mini-Band Lateral Walk',
    family: FAMILY,
    level: 2,
    slot: 'balance',
    cameraView: FRONT,
    equipment: ['mini_band'],
    kind: 'timer',
    timing: { mode: 'valid_time' },
    prescription: { sets: 2, timerSec: 30, restSec: 35, autoregulate: false },
    voice: { instructions: [] },
    regressionId: SIDE_STEP_SUPPORTED_ID,
    substituteId: SIDE_STEP_SUPPORTED_ID,
    createGrader: timerGrader(LATERAL_WALK_MINI_BAND_ID, 30, {
      validationMode: 'broad_setup_gated',
      predicate: 'front-lateral',
    }),
  },
];

lateralStabilityLevels.forEach(registerExercise);
