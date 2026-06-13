/**
 * Chair-supported squat (side view) — lower-push. A standing squat with a chair
 * back or counter for fingertip support (the regression), progressing to
 * free-standing. Knee-angle cycle + near-hip rise velocity, like the sit-to-
 * stand, but the bottom is a partial squat rather than a full seated position.
 */

import { repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'hip', cycleVertex: 'knee', cycleB: 'ankle', riseLandmark: 'hip' } as const;
const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'squat';

export const SQUAT_SUPPORTED_ID = 'squat-supported';
export const SQUAT_FREE_ID = 'squat-free';

export const squatLevels: ExerciseDefinition[] = [
  {
    id: SQUAT_SUPPORTED_ID,
    displayName: 'Supported Squat',
    family: FAMILY,
    level: 1,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['chair'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 10, restSec: 45, autoregulate: true },
    voice: { instructions: ['ex-squat'] },
    progressionId: SQUAT_FREE_ID,
    createGrader: repsGrader({ exerciseId: SQUAT_SUPPORTED_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 120, targetReps: 10, autoregulate: true }),
  },
  {
    id: SQUAT_FREE_ID,
    displayName: 'Squat',
    family: FAMILY,
    level: 2,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['none'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 12, restSec: 60, autoregulate: true },
    voice: { instructions: ['ex-squat'] },
    regressionId: SQUAT_SUPPORTED_ID,
    createGrader: repsGrader({ exerciseId: SQUAT_FREE_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 120, targetReps: 12, autoregulate: true }),
  },
];

squatLevels.forEach(registerExercise);
