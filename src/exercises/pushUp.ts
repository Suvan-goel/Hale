/**
 * Push-up ladder (side view) — upper-push. Wall push-up (most upright, easiest)
 * → incline (hands on a chair/counter) → standard floor push-up. Elbow-angle
 * cycle (shoulder→elbow→wrist) with the shoulder as the rise landmark (the
 * concentric phase pushes the torso up/away). Velocity-autoregulated.
 */

import { repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'shoulder', cycleVertex: 'elbow', cycleB: 'wrist', riseLandmark: 'shoulder' } as const;
const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'push-up';

export const PUSHUP_WALL_ID = 'push-up-wall';
export const PUSHUP_INCLINE_ID = 'push-up-incline';
export const PUSHUP_STANDARD_ID = 'push-up-standard';

export const pushUpLevels: ExerciseDefinition[] = [
  {
    id: PUSHUP_WALL_ID,
    displayName: 'Wall Push-Up',
    family: FAMILY,
    level: 1,
    slot: 'upper-push',
    cameraView: SIDE,
    equipment: ['wall'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 10, restSec: 45, autoregulate: true },
    voice: { instructions: ['ex-push-up'] },
    progressionId: PUSHUP_INCLINE_ID,
    createGrader: repsGrader({ exerciseId: PUSHUP_WALL_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 100, targetReps: 10, autoregulate: true }),
  },
  {
    id: PUSHUP_INCLINE_ID,
    displayName: 'Incline Push-Up',
    family: FAMILY,
    level: 2,
    slot: 'upper-push',
    cameraView: SIDE,
    equipment: ['chair'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 10, restSec: 50, autoregulate: true },
    voice: { instructions: ['ex-push-up'] },
    progressionId: PUSHUP_STANDARD_ID,
    regressionId: PUSHUP_WALL_ID,
    createGrader: repsGrader({ exerciseId: PUSHUP_INCLINE_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 100, targetReps: 10, autoregulate: true }),
  },
  {
    id: PUSHUP_STANDARD_ID,
    displayName: 'Push-Up',
    family: FAMILY,
    level: 3,
    slot: 'upper-push',
    cameraView: SIDE,
    equipment: ['floor'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 8, restSec: 60, autoregulate: true },
    voice: { instructions: ['ex-push-up'] },
    regressionId: PUSHUP_INCLINE_ID,
    createGrader: repsGrader({ exerciseId: PUSHUP_STANDARD_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 100, targetReps: 8, autoregulate: true }),
  },
];

pushUpLevels.forEach(registerExercise);
