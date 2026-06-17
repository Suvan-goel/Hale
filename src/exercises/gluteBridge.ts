/**
 * Glute bridge (side/oblique view) — hinge (posterior chain). Progresses from a
 * static bridge HOLD (isometric, graded by HoldTracker on trunk-extension
 * angle) to dynamic bridge REPS (hip-extension cycle, near-hip rise velocity).
 * Floor-based; the cushion under the head is comfort, not equipment.
 */

import { holdGrader, repsGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const SIDE = { view: 'side', requiredReliableSideChains: 1 } as const;
const FAMILY = 'glute-bridge';

export const BRIDGE_HOLD_ID = 'glute-bridge-hold';
export const BRIDGE_REPS_ID = 'glute-bridge-reps';

export const gluteBridgeLevels: ExerciseDefinition[] = [
  {
    id: BRIDGE_HOLD_ID,
    displayName: 'Bridge Hold',
    family: FAMILY,
    level: 1,
    slot: 'hinge',
    cameraView: SIDE,
    equipment: ['floor'],
    kind: 'hold',
    timing: { mode: 'valid_time' },
    prescription: { sets: 3, holdSec: 20, restSec: 40, autoregulate: false },
    voice: { instructions: ['ex-glute-bridge'] },
    progressionId: BRIDGE_REPS_ID,
    createGrader: holdGrader({ exerciseId: BRIDGE_HOLD_ID, condition: 'bridge-up', targetSec: 20 }),
  },
  {
    id: BRIDGE_REPS_ID,
    displayName: 'Glute Bridge',
    family: FAMILY,
    level: 2,
    slot: 'hinge',
    cameraView: SIDE,
    equipment: ['floor'],
    kind: 'reps',
    prescription: { sets: 3, repsPerSet: 12, restSec: 45, autoregulate: false },
    voice: { instructions: ['ex-glute-bridge'] },
    regressionId: BRIDGE_HOLD_ID,
    // Trunk-extension cycle: shoulder→hip→knee opens as the hips lift.
    createGrader: repsGrader({ exerciseId: BRIDGE_REPS_ID, signal: { cycleA: 'shoulder', cycleVertex: 'hip', cycleB: 'knee', riseLandmark: 'hip' }, upEnterDeg: 150, downEnterDeg: 120, targetReps: 12, autoregulate: false }),
  },
];

gluteBridgeLevels.forEach(registerExercise);
