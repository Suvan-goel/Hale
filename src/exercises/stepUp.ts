/**
 * Step-up (side view) — power/functional finisher. Needs a bottom stair; when
 * the user's equipment profile has no stair the block substitutes power
 * sit-to-stand tempo work (`substituteId`), so a missing step never blocks the
 * session (product law 6). Knee-angle cycle + near-hip rise velocity on the
 * stepping leg; velocity-autoregulated like the power STS.
 */

import { repsGrader } from './common';
import { STS_STANDARD_ID } from './sitToStand';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'hip', cycleVertex: 'knee', cycleB: 'ankle', riseLandmark: 'hip' } as const;

export const STEP_UP_ID = 'step-up';

export const stepUpDefinition: ExerciseDefinition = {
  id: STEP_UP_ID,
  displayName: 'Step-Up',
  family: 'step-up',
  level: 1,
  slot: 'power',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['stair'],
  kind: 'reps',
  prescription: { sets: 3, repsPerSet: 12, restSec: 60, autoregulate: true },
  voice: { instructions: ['ex-step-up'] },
  // No stair → power sit-to-stand tempo (the zero-equipment substitute).
  substituteId: STS_STANDARD_ID,
  createGrader: repsGrader({ exerciseId: STEP_UP_ID, signal: SIGNAL, upEnterDeg: 160, downEnterDeg: 120, targetReps: 12, autoregulate: true }),
};

registerExercise(stepUpDefinition);
