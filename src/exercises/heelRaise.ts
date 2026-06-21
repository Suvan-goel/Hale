/**
 * Heel raise (side view) — lower-push accessory (calf/ankle). Wall-supported
 * regression → free-standing. Ankle plantarflexion cycle (knee→ankle→foot) with
 * the heel as the rise landmark. Small, jittery ROM, so velocity autoregulation
 * is off — this is an endurance item graded purely on reps.
 */

import { repsGrader, timerGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'knee', cycleVertex: 'ankle', cycleB: 'foot', riseLandmark: 'heel' } as const;
const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'heel-raise';

export const HEEL_RAISE_SUPPORTED_ID = 'heel-raise-supported';
export const HEEL_RAISE_FREE_ID = 'heel-raise-free';
export const TOE_RAISE_SUPPORTED_ID = 'toe-raise-supported';

export const heelRaiseLevels: ExerciseDefinition[] = [
  {
    id: HEEL_RAISE_SUPPORTED_ID,
    displayName: 'Supported Heel Raise',
    family: FAMILY,
    level: 1,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['wall', 'counter'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 15, restSec: 40, autoregulate: false },
    voice: { instructions: ['ex-heel-raise'] },
    progressionId: HEEL_RAISE_FREE_ID,
    createGrader: repsGrader({ exerciseId: HEEL_RAISE_SUPPORTED_ID, signal: SIGNAL, upEnterDeg: 150, downEnterDeg: 120, targetReps: 15, autoregulate: false }),
  },
  {
    id: HEEL_RAISE_FREE_ID,
    displayName: 'Heel Raise',
    family: FAMILY,
    level: 2,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['none'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 18, restSec: 40, autoregulate: false },
    voice: { instructions: ['ex-heel-raise'] },
    progressionId: TOE_RAISE_SUPPORTED_ID,
    regressionId: HEEL_RAISE_SUPPORTED_ID,
    createGrader: repsGrader({ exerciseId: HEEL_RAISE_FREE_ID, signal: SIGNAL, upEnterDeg: 150, downEnterDeg: 120, targetReps: 18, autoregulate: false }),
  },
  {
    id: TOE_RAISE_SUPPORTED_ID,
    displayName: 'Supported Toe Raise',
    family: FAMILY,
    level: 3,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['wall', 'counter'],
    kind: 'timer',
    prescription: { sets: 2, timerSec: 30, restSec: 30, autoregulate: false },
    voice: { instructions: ['ex-heel-raise'] },
    regressionId: HEEL_RAISE_FREE_ID,
    createGrader: timerGrader(TOE_RAISE_SUPPORTED_ID, 30),
  },
];

heelRaiseLevels.forEach(registerExercise);
