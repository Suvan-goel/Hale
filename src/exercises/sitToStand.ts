/**
 * Sit-to-stand ladder (side view) — lower-push. The core lower-body strength
 * progression: cushion-raised seat (shorter range, easiest) → standard → slow
 * eccentric (3s lower, more time under tension) → power STS (drive up fast,
 * velocity-autoregulated). Same knee-angle cycle + near-hip rise velocity as
 * the assessment chair stand, so the measurement is directly comparable.
 */

import { repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIGNAL = { cycleA: 'hip', cycleVertex: 'knee', cycleB: 'ankle', riseLandmark: 'hip' } as const;
const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'sit-to-stand';

export const STS_CUSHION_ID = 'sts-cushion';
export const STS_STANDARD_ID = 'sts-standard';
export const STS_SLOW_ECC_ID = 'sts-slow-eccentric';
export const STS_POWER_ID = 'sts-power';
export const LOADED_STS_ID = 'loaded-sit-to-stand';

export const sitToStandLevels: ExerciseDefinition[] = [
  {
    id: STS_CUSHION_ID,
    displayName: 'Cushion Sit-to-Stand',
    family: FAMILY,
    level: 1,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['chair', 'cushion'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 8, restSec: 45, autoregulate: false },
    voice: { instructions: ['ex-sit-to-stand'] },
    progressionId: STS_STANDARD_ID,
    createGrader: repsGrader({ exerciseId: STS_CUSHION_ID, signal: SIGNAL, upEnterDeg: 155, downEnterDeg: 110, targetReps: 8, autoregulate: false }),
  },
  {
    id: STS_STANDARD_ID,
    displayName: 'Sit-to-Stand',
    family: FAMILY,
    level: 2,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['chair'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 10, restSec: 45, autoregulate: true },
    voice: { instructions: ['ex-sit-to-stand'] },
    progressionId: STS_SLOW_ECC_ID,
    regressionId: STS_CUSHION_ID,
    createGrader: repsGrader({ exerciseId: STS_STANDARD_ID, signal: SIGNAL, upEnterDeg: 155, downEnterDeg: 110, targetReps: 10, autoregulate: true }),
  },
  {
    id: STS_SLOW_ECC_ID,
    displayName: 'Slow-Lower Sit-to-Stand',
    family: FAMILY,
    level: 3,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['chair'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 8, restSec: 60, autoregulate: true },
    voice: { instructions: ['ex-sit-to-stand'] },
    progressionId: STS_POWER_ID,
    regressionId: STS_STANDARD_ID,
    createGrader: repsGrader({ exerciseId: STS_SLOW_ECC_ID, signal: SIGNAL, upEnterDeg: 155, downEnterDeg: 110, targetReps: 8, autoregulate: true }),
  },
  {
    id: STS_POWER_ID,
    displayName: 'Power Sit-to-Stand',
    family: FAMILY,
    level: 4,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['chair'],
    kind: 'reps',
    // Drive up fast: the set ends on velocity autoregulation, not a fixed count.
    prescription: { sets: 3, repsPerSet: 12, restSec: 75, autoregulate: true },
    voice: { instructions: ['ex-sit-to-stand'] },
    progressionId: LOADED_STS_ID,
    regressionId: STS_SLOW_ECC_ID,
    createGrader: repsGrader({ exerciseId: STS_POWER_ID, signal: SIGNAL, upEnterDeg: 155, downEnterDeg: 110, targetReps: 12, autoregulate: true }),
  },
  {
    id: LOADED_STS_ID,
    displayName: 'Loaded Sit-to-Stand',
    family: FAMILY,
    level: 5,
    slot: 'lower-push',
    cameraView: SIDE,
    equipment: ['chair', 'backpack_or_weight'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 8, restSec: 75, autoregulate: true },
    // Spoken audio for this exact level is not bundled yet; written ladder
    // instructions carry the load-selection detail until audio is regenerated.
    voice: { instructions: ['ex-sit-to-stand'] },
    regressionId: STS_POWER_ID,
    substituteId: STS_POWER_ID,
    createGrader: repsGrader({ exerciseId: LOADED_STS_ID, signal: SIGNAL, upEnterDeg: 155, downEnterDeg: 110, targetReps: 8, autoregulate: true }),
  },
];

sitToStandLevels.forEach(registerExercise);
