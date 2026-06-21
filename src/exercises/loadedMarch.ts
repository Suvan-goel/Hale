/**
 * March in place (side view) — dynamic-balance practice with support nearby.
 * The id is a legacy name; this V1 item is not loaded. Graded on the near-side
 * knee cycle: the knee flexes as it lifts (angle drops) and extends as the foot
 * returns (angle rises), so each down→up commit credits one near-side march
 * step. Endurance/coordination item — velocity autoregulation off.
 */

import { repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

export const LOADED_MARCH_ID = 'loaded-march';

export const loadedMarchDefinition: ExerciseDefinition = {
  id: LOADED_MARCH_ID,
  displayName: 'March in Place',
  family: 'march',
  level: 1,
  slot: 'power',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['counter'],
  kind: 'reps',
  prescription: { sets: 3, repsPerSet: 16, restSec: 45, autoregulate: false },
  voice: { instructions: ['ex-march'] },
  // Knee cycle: angle drops on the lift, returns above upEnter as the foot lands.
  createGrader: repsGrader({ exerciseId: LOADED_MARCH_ID, signal: { cycleA: 'hip', cycleVertex: 'knee', cycleB: 'ankle', riseLandmark: 'knee' }, upEnterDeg: 160, downEnterDeg: 120, targetReps: 16, autoregulate: false }),
};

registerExercise(loadedMarchDefinition);
