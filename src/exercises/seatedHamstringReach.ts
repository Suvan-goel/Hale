/**
 * Seated hamstring reach (side view) — mobility cooldown. Seated on a chair,
 * one leg extended, reach toward the toes; we capture peak trunk-over-thigh
 * flexion (hip angle shoulder→hip→knee, direction 'min' — a smaller angle is a
 * deeper reach) over a fixed capture window via MaxRomTracker.
 */

import { romGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

export const HAMSTRING_REACH_ID = 'seated-hamstring-reach';

export const seatedHamstringReachDefinition: ExerciseDefinition = {
  id: HAMSTRING_REACH_ID,
  displayName: 'Seated Hamstring Reach',
  family: 'hamstring-reach',
  level: 1,
  slot: 'mobility',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['chair'],
  kind: 'rom',
  timing: { mode: 'valid_time' },
  prescription: { sets: 2, captureSec: 12, restSec: 20, autoregulate: false },
  voice: { instructions: ['ex-hamstring-reach'] },
  createGrader: romGrader(
    HAMSTRING_REACH_ID,
    { kind: 'angle', a: 'shoulder', vertex: 'hip', b: 'knee', direction: 'min' },
    { targetSec: 12, predicate: 'seated-hamstring-reach' }
  ),
};

registerExercise(seatedHamstringReachDefinition);
