/**
 * Training entry point — the voice-guided workout side of the loop. Screens and
 * the app import from here. (Progression, block assignment, the micro-check, and
 * the training store are added by later Stage 4 milestones.)
 */

export {
  DEFAULT_TRAINING_CONFIG,
  TRAINING_FLOOR_V2_1_FEATURE_FLAG,
  TrainingSessionPlayer,
  isTrainingFloorV21FeatureEnabled,
} from './sessionPlayer';
export type {
  TrainingFinalPositionPhase,
  TrainingFloorEnvironment,
  TrainingFloorSessionMemory,
  TrainingFloorSetupSnapshot,
  TrainingFrameUpdate,
  TrainingItemResult,
  TrainingPhase,
  TrainingPlayerConfig,
  TrainingSessionResult,
} from './sessionPlayer';
export type { TrainingItemFunnel, TrainingSessionFunnel } from './sessionFunnel';
export {
  SESSION_RESUME_MAX_AGE_MS,
  SESSION_RESUME_SCHEMA_VERSION,
  buildSessionInProgress,
  deserializeSessionInProgress,
  mergeResumedSessionResult,
  resumableSessionStart,
  serializeSessionInProgress,
} from './sessionResume';
export type {
  SessionResumePlanInfo,
  SessionResumeStart,
  TrainingSessionInProgress,
} from './sessionResume';
export {
  createTrainingSetRuntime,
  selectTrainingSetRuntime,
} from './setRuntime';
export type {
  SerializedTrainingSetRuntime,
  TrainingSetRuntime,
  TrainingSetRuntimeCapabilities,
  TrainingSetRuntimeGeneratedExercise,
  TrainingSetRuntimeSelection,
  TrainingSetRuntimeUpdate,
  TrainingVoiceRuntimeMode,
} from './setRuntime';
export { initialProgressionState } from './progression';
export type { ProgressionState } from './progression';
export { DEFAULT_EQUIPMENT } from './block';
export type { EquipmentProfile, SessionPlan, SlotAssignment, TrainingBlock } from './block';
export {
  createSessionTemplatesForFocus,
  createBalancedSessionTemplates,
  createTrainingBlockFromAssessment,
  generatePresetSession,
  generateTodaySession as generateDynamicTodaySession,
  getExtraSessionPreset,
  getTemplateSelection,
  initialLadderProgressFromMeasuredCapability,
  listExtraSessionPresets,
  scoreDomainFromTrainingDomain,
  selectNextSessionTemplate,
  trainingDomainFromScoreDomain,
  updateLadderProgressAfterSession,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_SOURCES,
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
  MOBILITY_COLLECTION_CORE_MEMBER_IDS,
  MOBILITY_COLLECTION_ID,
  collectionCoverageSummary,
  collectionExposuresFromGeneratedSessionSummaries,
  collectionSelectionPolicyFingerprint,
  eligibleCollectionMemberIds,
  isPlannedCollectionSelection,
  mobilityCollectionMemberIds,
  plannedCollectionSelectionFromResult,
  selectCollectionMember,
} from './collectionSelection';
export type {
  CollectionCoverageSummary,
  CollectionExposure,
  CollectionSelectionReason,
  CollectionSelectionResult,
  MobilityCollectionCoreMemberId,
  PlannedCollectionSelection,
} from './collectionSelection';
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
} from './microCheck';
export type {
  MicroCheckConfig,
  MicroCheckFrameUpdate,
  MicroCheckPhase,
  MicroCheckResult,
  MicroCheckType,
} from './microCheck';
export {
  createMicroCheckMeasurementContextForSide,
  deriveMicroCheckSideSetup,
  oppositeMicroCheckSide,
} from './microCheckSideSetup';
export type {
  CreateMicroCheckMeasurementContextForSideInput,
  DeriveMicroCheckSideSetupInput,
  MicroCheckSideProtocolRegistry,
  MicroCheckSideReasonCode,
  MicroCheckSideRecommendationSource,
  MicroCheckSideSetup,
} from './microCheckSideSetup';
export {
  PAIN_RECURRENCE_SESSION_COUNT,
  activePainExclusionLadderIds,
  defaultPainHistory,
  recordSessionPainEvents,
  reinstateLadder,
} from './painHistory';
export type {
  PainEventRecord,
  PainExclusionRecord,
  PainHistoryState,
  RecordPainEventsResult,
} from './painHistory';
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
  SESSION_GLOBAL_SAFETY_CUE_IDS,
  coreExerciseIdsMissingSafetyProfiles,
  exerciseSafetySetupText,
  exerciseSafetySummaryText,
  plannedSafetyCueSnapshotForExercises,
  registeredExerciseIdsMissingSafetyProfiles,
  requireExerciseSafetyCueProfile,
  resolveExerciseSafetyCueProfile,
  safetyCueProfileText,
  validateExerciseSafetyCueProfile,
  validateSafetyCueSnapshot,
} from './safetyCues';
export type {
  PlannedExerciseSafetyCueProfile,
  PlannedSafetyCueSnapshot,
  SafetyCueId,
  SafetyCueValidation,
  SafetyCueValidationIssue,
  SafetyCueValidationReason,
} from './safetyCues';
export * from './voiceV21';
