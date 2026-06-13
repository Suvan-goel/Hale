/**
 * Neck rotations (front view) — mobility cooldown. The one transverse-plane
 * movement 2D pose can honestly grade: head yaw, estimated from nose/ear
 * geometry (CLAUDE.md). We capture the peak yaw MAGNITUDE (left/right turn)
 * over a fixed window via MaxRomTracker. Both ears must be visible, so this is
 * a front-view item. Zero equipment.
 */

import { romGrader } from './common';
import { ExerciseDefinition } from './types';
import { registerExercise } from './registry';

export const NECK_ROTATION_ID = 'neck-rotation';

export const neckRotationDefinition: ExerciseDefinition = {
  id: NECK_ROTATION_ID,
  displayName: 'Neck Rotations',
  family: 'neck-rotation',
  level: 1,
  slot: 'mobility',
  cameraView: { view: 'front', requiredReliableSideChains: 2 },
  equipment: ['none'],
  kind: 'rom',
  prescription: { sets: 1, captureSec: 14, restSec: 15, autoregulate: false },
  voice: { instructions: ['ex-neck-rotation'] },
  createGrader: romGrader(NECK_ROTATION_ID, { kind: 'head-yaw' }),
};

registerExercise(neckRotationDefinition);
