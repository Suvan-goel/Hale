export {
  resolveStepUpRepEvidence,
  hasStepUpAlternationReadiness,
  type StepUpAlternationReadinessEvidence,
  type StepUpRepEvidenceInput,
} from './evidence';
export {
  createStepUpAlternationEvidenceAdapter,
  type StepUpAlternationEvidenceAdapter,
  type StepUpEvidenceAdapterSnapshot,
  type StepUpEvidenceRepSetup,
  type StepUpEvidenceSetup,
  type StepUpFrameObservation,
} from './evidenceAdapter';
export {
  deriveStepUpAlternationPlan,
  deriveStepUpAlternationPlanForExerciseDefinition,
  deriveStepUpAlternationPlanForExerciseId,
  planFingerprint,
  setStartLeadForIndex,
  type DeriveStepUpAlternationPlanInput,
} from './plan';
export {
  currentStepUpAttemptId,
  advanceStepUpAlternationState,
  createStepUpAlternationRuntimeState,
  restoreStepUpAlternationRuntimeState,
  type StepUpAlternationAction,
} from './stateMachine';
export {
  stepUpSetResultToLegacySetResult,
  summarizeStepUpAlternationProgression,
  summarizeStepUpSetResult,
} from './aggregation';
export {
  deserializeStepUpAlternationRuntimeState,
  isStepUpAlternationPlan,
  serializeStepUpAlternationRuntimeState,
  type StepUpAlternationRestoreEnvelope,
} from './persistence';
export {
  attachStepUpAlternationPlansToGeneratedSession,
  deriveStepUpAlternationPlanForGeneratedExercise,
  type StepUpGeneratedExerciseLike,
  type StepUpGeneratedSessionLike,
} from './generatedSession';
export {
  TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
  TRAINING_STEP_UP_ALTERNATION_FEATURE_FLAG,
  TRAINING_STEP_UP_ALTERNATION_SOFTWARE_READY,
  isTrainingStepUpAlternationFeatureEnabled,
  selectTrainingStepUpAlternationMode,
  type TrainingStepUpAlternationSelection,
} from './readiness';
export {
  diagnosticForStepUpAlternationPlan,
  type StepUpAlternationDiagnosticEvent,
  type StepUpAlternationDiagnosticEventName,
} from './diagnostics';
export {
  stepUpAlternationViewModel,
  stepUpNextLeadCueKey,
  stepUpWrongLeadCueKey,
  type StepUpAlternationViewModel,
} from './viewModel';
export {
  StepUpAlternationSetRuntime,
  type SerializedStepUpAlternationSetRuntime,
  type StepUpAlternationRuntimeUpdate,
} from './runtime';
export type {
  StepUpAlternationPlan,
  StepUpAlternationProgressionSummary,
  StepUpAlternationReasonCode,
  StepUpAlternationRuntimeState,
  StepUpLeadSide,
  StepUpRepEndReason,
  StepUpRepEvidence,
  StepUpRepPhase,
  StepUpSetResult,
} from './types';
export {
  STEP_UP_ALTERNATION_PLAN_VERSION,
  STEP_UP_EXERCISE_ID,
} from './types';
