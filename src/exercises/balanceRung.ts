/**
 * Balance rungs (front view) — balance. The assessment's balance ladder broken
 * into individually TRAINABLE holds: feet-together → tandem → single-leg, each
 * a timed hold graded by HoldTracker (narrow-base step-out / single-leg
 * touchdown termination, same conditions as the assessment). Safety: fingertips
 * near a counter. Zero equipment.
 */

import { holdGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

const FRONT = { view: 'front', requiredReliableSideChains: 2 } as const;
const FAMILY = 'balance';

export const BALANCE_FEET_TOGETHER_ID = 'balance-feet-together-hold';
export const BALANCE_TANDEM_ID = 'balance-tandem-hold';
export const BALANCE_SINGLE_LEG_ID = 'balance-single-leg-hold';

export const balanceRungLevels: ExerciseDefinition[] = [
  {
    id: BALANCE_FEET_TOGETHER_ID,
    displayName: 'Feet-Together Hold',
    family: FAMILY,
    level: 1,
    slot: 'balance',
    cameraView: FRONT,
    equipment: ['none'],
    kind: 'hold',
    prescription: { sets: 3, holdSec: 20, restSec: 30, autoregulate: false },
    voice: { instructions: ['ex-balance'] },
    progressionId: BALANCE_TANDEM_ID,
    createGrader: holdGrader({ exerciseId: BALANCE_FEET_TOGETHER_ID, condition: 'narrow-base', targetSec: 20 }),
  },
  {
    id: BALANCE_TANDEM_ID,
    displayName: 'Tandem Hold',
    family: FAMILY,
    level: 2,
    slot: 'balance',
    cameraView: FRONT,
    equipment: ['none'],
    kind: 'hold',
    prescription: { sets: 3, holdSec: 20, restSec: 30, autoregulate: false },
    voice: { instructions: ['ex-balance'] },
    progressionId: BALANCE_SINGLE_LEG_ID,
    regressionId: BALANCE_FEET_TOGETHER_ID,
    createGrader: holdGrader({ exerciseId: BALANCE_TANDEM_ID, condition: 'narrow-base', targetSec: 20 }),
  },
  {
    id: BALANCE_SINGLE_LEG_ID,
    displayName: 'Single-Leg Hold',
    family: FAMILY,
    level: 3,
    slot: 'balance',
    cameraView: FRONT,
    equipment: ['none'],
    kind: 'hold',
    prescription: { sets: 3, holdSec: 15, restSec: 30, autoregulate: false },
    voice: { instructions: ['ex-balance'] },
    regressionId: BALANCE_TANDEM_ID,
    createGrader: holdGrader({ exerciseId: BALANCE_SINGLE_LEG_ID, condition: 'single-leg', targetSec: 15 }),
  },
];

balanceRungLevels.forEach(registerExercise);
