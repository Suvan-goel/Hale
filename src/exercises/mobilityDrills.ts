/**
 * V1 mobility drills. These use timed sets unless an existing ROM primitive is
 * already trustworthy; that keeps mobility calm and trend-oriented instead of
 * turning it into fragile form correction.
 */

import { timerGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const FAMILY = 'mobility-flexibility';

export const THORACIC_ROTATION_ID = 'thoracic-rotation';
export const HIP_FLEXOR_STRETCH_ID = 'supported-hip-flexor-stretch';
export const WALL_CALF_STRETCH_ID = 'wall-calf-stretch';

export const mobilityDrillDefinitions: ExerciseDefinition[] = [
  {
    id: THORACIC_ROTATION_ID,
    displayName: 'Thoracic Rotation',
    family: FAMILY,
    level: 1,
    slot: 'mobility',
    cameraView: { view: 'front', requiredReliableSideChains: 2 },
    equipment: ['none'],
    kind: 'timer',
    timing: { mode: 'valid_time' },
    prescription: { sets: 2, timerSec: 30, restSec: 20, autoregulate: false },
    voice: { instructions: [] },
    createGrader: timerGrader(THORACIC_ROTATION_ID, 30, {
      validationMode: 'broad_setup_gated',
      predicate: 'front-upright',
    }),
  },
  {
    id: HIP_FLEXOR_STRETCH_ID,
    displayName: 'Supported Hip Flexor Stretch',
    family: FAMILY,
    level: 2,
    slot: 'mobility',
    cameraView: { view: 'side', requiredReliableSideChains: 1 },
    equipment: ['chair', 'counter'],
    kind: 'timer',
    timing: { mode: 'valid_time' },
    prescription: { sets: 2, timerSec: 30, restSec: 15, autoregulate: false },
    voice: { instructions: [] },
    createGrader: timerGrader(HIP_FLEXOR_STRETCH_ID, 30, {
      validationMode: 'broad_setup_gated',
      predicate: 'side-stretch',
    }),
  },
  {
    id: WALL_CALF_STRETCH_ID,
    displayName: 'Wall Calf Stretch',
    family: FAMILY,
    level: 3,
    slot: 'mobility',
    cameraView: { view: 'side', requiredReliableSideChains: 1 },
    equipment: ['wall'],
    kind: 'timer',
    timing: { mode: 'valid_time' },
    prescription: { sets: 2, timerSec: 30, restSec: 15, autoregulate: false },
    voice: { instructions: [] },
    createGrader: timerGrader(WALL_CALF_STRETCH_ID, 30, {
      validationMode: 'broad_setup_gated',
      predicate: 'side-stretch',
    }),
  },
];

mobilityDrillDefinitions.forEach(registerExercise);
