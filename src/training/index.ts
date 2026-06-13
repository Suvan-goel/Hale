/**
 * Training entry point — the voice-guided workout side of the loop. Screens and
 * the app import from here. (Progression, block assignment, the micro-check, and
 * the training store are added by later Stage 4 milestones.)
 */

export {
  DEFAULT_TRAINING_CONFIG,
  TrainingSessionPlayer,
} from './sessionPlayer';
export type {
  TrainingFrameUpdate,
  TrainingItemResult,
  TrainingPhase,
  TrainingPlayerConfig,
  TrainingSessionResult,
} from './sessionPlayer';
