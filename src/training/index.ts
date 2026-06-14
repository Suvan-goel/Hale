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
export {
  DEFAULT_PROGRESSION_CONFIG,
  applySession,
  applySessionResult,
  decideLevel,
  initialProgressionState,
  summarizeItem,
  velocityTrend,
} from './progression';
export type {
  ExerciseSessionSummary,
  ProgressionAction,
  ProgressionConfig,
  ProgressionState,
} from './progression';
export {
  DEFAULT_EQUIPMENT,
  blockComplete,
  buildBlock,
  resolveSession,
  resolveSlot,
  totalSessions,
} from './block';
export type { EquipmentProfile, SessionPlan, SlotAssignment, TrainingBlock } from './block';
export {
  DEFAULT_MICROCHECK_CONFIG,
  MicroCheckRunner,
  microCheckTrendPoints,
} from './microCheck';
export type {
  MicroCheckConfig,
  MicroCheckFrameUpdate,
  MicroCheckPhase,
  MicroCheckResult,
  MicroCheckType,
} from './microCheck';
