/**
 * Pull / upper-back ladder. V1 uses simple camera-assisted counting/timing:
 * rows reuse the generic elbow-angle cycle; pull-aparts are timed practice so
 * we do not overbuild a fragile bilateral wrist-distance scorer.
 */

import { repsGrader, timerGrader } from './common';
import { ExerciseDefinition } from './types';
import { OVERHEAD_REACH_ID } from './overheadPress';
import { registerExercise } from './registry';

const ROW_SIGNAL = { cycleA: 'shoulder', cycleVertex: 'elbow', cycleB: 'wrist', riseLandmark: 'wrist' } as const;
const OBLIQUE = { view: 'side_oblique', requiredReliableSideChains: 1 } as const;
const FRONT = { view: 'front', requiredReliableSideChains: 2 } as const;
const FAMILY = 'pull-upper-back';

export const SEATED_BAND_ROW_ID = 'seated-band-row';
export const STANDING_BAND_ROW_ID = 'standing-band-row';
export const BAND_PULL_APART_ID = 'band-pull-apart';

export const pullUpperBackLevels: ExerciseDefinition[] = [
  {
    id: SEATED_BAND_ROW_ID,
    displayName: 'Seated Band Row',
    family: FAMILY,
    level: 1,
    slot: 'pull-reach',
    cameraView: OBLIQUE,
    equipment: ['chair', 'long_band'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 10, restSec: 45, autoregulate: false },
    voice: { instructions: [] },
    progressionId: STANDING_BAND_ROW_ID,
    substituteId: OVERHEAD_REACH_ID,
    createGrader: repsGrader({ exerciseId: SEATED_BAND_ROW_ID, signal: ROW_SIGNAL, upEnterDeg: 145, downEnterDeg: 95, targetReps: 10, autoregulate: false }),
  },
  {
    id: STANDING_BAND_ROW_ID,
    displayName: 'Standing Band Row',
    family: FAMILY,
    level: 2,
    slot: 'pull-reach',
    cameraView: OBLIQUE,
    equipment: ['long_band'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 10, restSec: 50, autoregulate: false },
    voice: { instructions: [] },
    progressionId: BAND_PULL_APART_ID,
    regressionId: SEATED_BAND_ROW_ID,
    substituteId: OVERHEAD_REACH_ID,
    createGrader: repsGrader({ exerciseId: STANDING_BAND_ROW_ID, signal: ROW_SIGNAL, upEnterDeg: 145, downEnterDeg: 95, targetReps: 10, autoregulate: false }),
  },
  {
    id: BAND_PULL_APART_ID,
    displayName: 'Band Pull-Apart',
    family: FAMILY,
    level: 3,
    slot: 'pull-reach',
    cameraView: FRONT,
    equipment: ['long_band'],
    kind: 'timer',
    prescription: { sets: 2, timerSec: 30, restSec: 40, autoregulate: false },
    voice: { instructions: [] },
    regressionId: STANDING_BAND_ROW_ID,
    substituteId: OVERHEAD_REACH_ID,
    createGrader: timerGrader(BAND_PULL_APART_ID, 30),
  },
];

pullUpperBackLevels.forEach(registerExercise);
