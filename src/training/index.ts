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
  createSessionTemplatesForFocus,
  createTrainingBlockFromAssessment,
  generatePresetSession,
  generateTodaySession as generateDynamicTodaySession,
  getExtraSessionPreset,
  getTemplateSelection,
  listExtraSessionPresets,
  scoreDomainFromTrainingDomain,
  selectNextSessionTemplate,
  trainingDomainFromScoreDomain,
  updateLadderProgressAfterSession,
} from './workoutGeneration';
export type {
  CompletedExerciseResult,
  CompletedGeneratedSession,
  DailyReadiness,
  GeneratedExerciseDose,
  GeneratedExercise,
  GeneratedSession,
  GenerateSessionInput,
  LadderProgress,
  PainArea,
  PostSessionFeedback,
  RecentSessionSummary,
  SessionSlot,
  SessionSlotType,
  SlotStimulus,
  SlotStimulusReason,
  SlotStimulusRole,
  SessionIntensity,
  SessionSource,
  SessionTemplate,
  TemplateSelection,
  TrackingQuality,
  TrainingBlock as DynamicTrainingBlock,
  TrainingDomain,
} from './workoutGeneration';
export {
  discomfortConstraintForAreas,
  discomfortConstraintForContext,
  isExerciseExcludedByDiscomfort,
  normalizeDailyTrainingContext,
  progressionEvidencePolicyFor,
} from './dailyTrainingContext';
export type {
  DailyTrainingContextSource,
  DailyTrainingInputStatus,
  DailyTrainingReasonCode,
  DiscomfortConstraint,
  DiscomfortConstraintReason,
  NormalizedDailyTrainingContext,
  NormalizedReadiness,
  ProgressionEvidencePolicy,
} from './dailyTrainingContext';
export {
  formatDebugWorkoutScenario,
  formatDebugWorkoutScenarios,
  generateDebugWorkoutScenarios,
} from './debugWorkoutScenarios';
export type {
  DebugWorkoutExercisePreview,
  DebugWorkoutScenarioPreview,
} from './debugWorkoutScenarios';
export { upsertGeneratedSessionSummary } from './dynamicState';
export type {
  PersistedGeneratedExerciseSummary,
  PersistedGeneratedSessionSummary,
  PersistedPostSessionFeedback,
  PersistedSessionSource,
} from './dynamicState';
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
export { TrainingStore } from './store';
export {
  TRAINING_SCHEMA_VERSION,
  defaultTrainingPlanPreferences,
  defaultTrainingState,
  deserializeMicroCheck,
  deserializeTrainingState,
  serializeMicroCheck,
  serializeTrainingState,
} from './serialize';
export type { BlockProgress, TrainingIntensityPreference, TrainingPlanPreferences, TrainingState } from './serialize';
export {
  VALID_TIME_PROGRESSION_ENABLED,
  classifyValidTimePerformance,
  summarizeValidTimeItem,
  summarizeValidTimeSets,
  validTimeSessionSummaryCards,
} from './validTimeProgression';
export type {
  ValidTimeProgressionConfig,
  ValidTimeProgressionSignal,
  ValidTimeProgressionSummary,
  ValidTimeSessionSummaryCard,
} from './validTimeProgression';
export {
  nextSessionExercises,
  nextSessionPlan,
  recordCompletedSession,
  retestDue,
  startBlock,
} from './state';
