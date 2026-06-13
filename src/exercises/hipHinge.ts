/**
 * Wall-tap hip hinge (side view) — hinge. Stand a foot from a wall and hinge
 * back to tap it with the hips (the wall teaches the hinge and caps the range);
 * the regression is wall-supported, the progression free-standing. Hip-angle
 * cycle (shoulder→hip→knee) — the trunk folds forward at the bottom — with the
 * shoulder as the rise landmark (it rises as the user stands back up).
 */

import { repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'shoulder', cycleVertex: 'hip', cycleB: 'knee', riseLandmark: 'shoulder' } as const;
const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'hip-hinge';

export const HINGE_WALL_ID = 'hip-hinge-wall';
export const HINGE_FREE_ID = 'hip-hinge-free';

export const hipHingeLevels: ExerciseDefinition[] = [
  {
    id: HINGE_WALL_ID,
    displayName: 'Wall-Tap Hinge',
    family: FAMILY,
    level: 1,
    slot: 'hinge',
    cameraView: SIDE,
    equipment: ['wall'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 10, restSec: 45, autoregulate: false },
    voice: { instructions: ['ex-hip-hinge'] },
    progressionId: HINGE_FREE_ID,
    createGrader: repsGrader({ exerciseId: HINGE_WALL_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 110, targetReps: 10, autoregulate: false }),
  },
  {
    id: HINGE_FREE_ID,
    displayName: 'Hip Hinge',
    family: FAMILY,
    level: 2,
    slot: 'hinge',
    cameraView: SIDE,
    equipment: ['none'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 12, restSec: 45, autoregulate: false },
    voice: { instructions: ['ex-hip-hinge'] },
    regressionId: HINGE_WALL_ID,
    createGrader: repsGrader({ exerciseId: HINGE_FREE_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 110, targetReps: 12, autoregulate: false }),
  },
];

hipHingeLevels.forEach(registerExercise);
