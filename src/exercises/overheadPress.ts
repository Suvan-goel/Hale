/**
 * Overhead reach / press (side view) — pull-or-reach (shoulder). Unsupported
 * overhead reach and banded overhead press are distinct practice options; with
 * no band in the equipment profile the press substitutes the reach
 * (`substituteId`). Shoulder-flexion cycle (hip→shoulder→elbow) with the wrist
 * as the rise landmark. Reach ROM is the point, so autoregulation is off.
 */

import { repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'hip', cycleVertex: 'shoulder', cycleB: 'elbow', riseLandmark: 'wrist' } as const;
const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'overhead';

export const OVERHEAD_REACH_ID = 'overhead-reach';
export const OVERHEAD_PRESS_ID = 'overhead-press-band';

export const overheadLevels: ExerciseDefinition[] = [
  {
    id: OVERHEAD_REACH_ID,
    displayName: 'Overhead Reach',
    family: FAMILY,
    level: 1,
    slot: 'pull-reach',
    cameraView: SIDE,
    equipment: ['none'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 12, restSec: 40, autoregulate: false },
    voice: { instructions: ['ex-overhead'] },
    progressionId: OVERHEAD_PRESS_ID,
    createGrader: repsGrader({ exerciseId: OVERHEAD_REACH_ID, signal: SIGNAL, upEnterDeg: 150, downEnterDeg: 60, targetReps: 12, autoregulate: false }),
  },
  {
    id: OVERHEAD_PRESS_ID,
    displayName: 'Band Overhead Press',
    family: FAMILY,
    level: 2,
    slot: 'pull-reach',
    cameraView: SIDE,
    equipment: ['long_band'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 12, restSec: 50, autoregulate: true },
    voice: { instructions: ['ex-overhead'] },
    regressionId: OVERHEAD_REACH_ID,
    // No band → bodyweight overhead reach.
    substituteId: OVERHEAD_REACH_ID,
    createGrader: repsGrader({ exerciseId: OVERHEAD_PRESS_ID, signal: SIGNAL, upEnterDeg: 150, downEnterDeg: 60, targetReps: 12, autoregulate: true }),
  },
];

overheadLevels.forEach(registerExercise);
