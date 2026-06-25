export {
  bothSidesRoundSpecForExercise,
  isTrainingBothSidesAffectedExerciseId,
  listBothSidesRoundSpecs,
  semanticSideRoleForExercise,
  sideLabelForExercise,
  voiceSideVariantForExercise,
  type BothSidesExerciseRoundSpec,
} from './exerciseRoles';
export {
  deriveBothSidesDosePlan,
  deriveBothSidesDosePlanForExerciseDefinition,
  deriveBothSidesDosePlanForExerciseId,
  oppositeSide,
  planFingerprint,
  sourceTargetForDefinition,
  targetForRoundSide,
  type DeriveBothSidesDosePlanInput,
} from './dosePlanner';
export {
  aggregateTrainingRoundResult,
  bothSidesRoundResultsToLegacySetResults,
  createTrainingSideSegmentResult,
  summarizeBothSidesProgression,
  type CreateTrainingSideSegmentResultInput,
} from './aggregation';
export {
  advanceBothSidesRoundState,
  completedSideResultFor,
  createBothSidesRoundRuntimeState,
  currentBothSidesTarget,
  restoreBothSidesRoundRuntimeState,
  type BothSidesRoundAction,
} from './stateMachine';
export {
  deserializeBothSidesRoundRuntimeState,
  isBothSidesDosePlan,
  serializeBothSidesRoundRuntimeState,
  type BothSidesRoundRestoreEnvelope,
} from './persistence';
export {
  EMPTY_BOTH_SIDES_START_SIDE_SEED_STATE,
  applyBothSidesExerciseCompletionToStartSideSeed,
  isTrainingInitialSideExerciseId,
  nextBothSidesStartSideForExercise,
  normalizeBothSidesStartSideSeedState,
  pinBothSidesInitialStartSide,
} from './startSide';
export {
  attachBothSidesDosePlansToGeneratedSession,
  deriveBothSidesDosePlanForGeneratedExercise,
  type BothSidesGeneratedExerciseLike,
  type BothSidesGeneratedSessionLike,
} from './generatedSession';
export {
  TRAINING_BOTH_SIDES_ROUNDS_DEFAULT_ENABLED,
  TRAINING_BOTH_SIDES_ROUNDS_FEATURE_FLAG,
  TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_READY,
  isTrainingBothSidesRoundsFeatureEnabled,
  selectTrainingBothSidesRoundsMode,
  type TrainingBothSidesRoundsSelection,
} from './readiness';
export {
  diagnosticForDosePlan,
  type BothSidesDiagnosticEvent,
  type BothSidesDiagnosticEventName,
} from './diagnostics';
export type {
  BothSidesDosePlan,
  BothSidesDosePlanReasonCode,
  BothSidesDoseUnit,
  BothSidesProgressionSummary,
  BothSidesRoundDescriptor,
  BothSidesRoundPhase,
  BothSidesRoundRuntimeState,
  BothSidesRoundSideTarget,
  BothSidesStartSideSeedState,
  TrainingBothSidesAffectedExerciseId,
  TrainingInitialSideExerciseId,
  TrainingRoundResult,
  TrainingRoundSide,
  TrainingRoundSideRole,
  TrainingSideSegmentEndReason,
  TrainingSideSegmentResult,
} from './types';
export {
  TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS,
  TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION,
} from './types';
