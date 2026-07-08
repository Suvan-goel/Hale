/**
 * Programme engine v2 (flag-gated parallel build — C4 ruling 2026-07-06).
 *
 * Pure data + pure logic implementing exercise-ladders-spec v0.2 and
 * onboarding-spec v0.2 §10 under the recorded implementation rulings
 * (docs/decisions.md 2026-07-06). Nothing here touches UI, native modules,
 * or the network. PROMOTED 2026-07-08: this is the app's programming engine
 * (the old engine's shell is decommission-pending, promotion commit 2).
 */

export * from './types';
export {
  PELVIC_PHYSIO_SIGNPOST_COPY,
  PROGRAMME_EFFORT_CHECKIN_COPY,
  PROGRAMME_SESSION_RPE_OPTIONS,
  checkupOfferFor,
  nextProgrammeSessionInput,
  onboardingCompletionRoute,
  patternTitle,
  postSessionSurface,
  preSessionPrompt,
  programmeLevelRows,
  programmeTodayViewModel,
} from './appLifecycle';
export type {
  NextProgrammeSessionInput,
  OnboardingRoute,
  ProgrammeCheckupOffer,
  ProgrammeLevelRow,
  ProgrammePostSessionSurface,
  ProgrammePreSessionPrompt,
  ProgrammeSessionPreview,
  ProgrammeTodayAction,
  ProgrammeTodayStateId,
  ProgrammeTodayViewModel,
} from './appLifecycle';
export {
  ADAPTATION_BRANCHES,
  DEFAULT_REQUIRED_REHEARSAL_EXPOSURES,
  HINGE_REHEARSAL_DRILL_ID,
  JOINT_FLAG_BRANCHES,
  PROGRAMME_LADDERS,
  QUIET_FINISHER_ITEMS,
  allProgrammeExercises,
  getProgrammeLadder,
  getProgrammeLevel,
  maxProgrammeLevel,
} from './ladders';
export {
  allProgrammeDisplayNames,
  hasProgrammeDisplayName,
  programmeDisplayName,
} from './naming';
export {
  DEFAULT_PROMOTION_CONFIG,
  applyCheckupPlacement,
  applyInactivityRegressionIfDue,
  clampLevel,
  crossLadderPrereqMet,
  evaluatePatternOutcome,
  freshPatternLadderState,
  gatewayProgressFor,
  isGatewayComplete,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  recordRehearsalExposure,
} from './promotion';
export type { PromotionConfig } from './promotion';
export {
  PROGRAMME_POLICY_SCHEMA_VERSION,
  programmePolicyFingerprint,
  validateProgrammePolicyFingerprint,
} from './policy';
export type { ProgrammePolicyValidation } from './policy';
export { activityPrior, placementForOnboarding, squatCapacityFromT3 } from './placement';
export type { AssessmentInputs, PlacementInputs, PlacementResult } from './placement';
export { effortFromRpe } from './effort';
export type { SessionRpe } from './effort';
export { HARD_GATE_RULES, resolveSessionRouting } from './routing';
export type {
  ResolvedSessionRouting,
  RoutingDecision,
  RoutingTier,
  SessionRouting,
} from './routing';
export {
  PROGRAMME_STATE_SCHEMA_VERSION,
  defaultProgrammeProfile,
  defaultProgrammeState,
  deserializeProgrammeState,
  serializeProgrammeState,
} from './serialize';
export { ProgrammeStore } from './store';
export {
  ONBOARDING_MESSAGE_STEPS,
  ONBOARDING_QUESTION_STEPS,
  STAGE_B_QUESTION_COUNT,
  allOnboardingCopyStrings,
  isOnboardingQuestionStep,
  onboardingMessageContent,
  onboardingQuestionContent,
} from './onboarding/content';
export type {
  OnboardingMessageContent,
  OnboardingMessageStepId,
  OnboardingOption,
  OnboardingQuestionContent,
  OnboardingQuestionStepId,
  OnboardingStepId,
} from './onboarding/content';
export {
  SKIPPED,
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
  completeOnboarding,
  currentOnboardingStep,
  emptyOnboardingAnswers,
  gentleStartFromAnswers,
  initialOnboardingFlowState,
  markFirstSessionStarted,
  recordOnboardingAnswer,
  undoLastOnboardingStep,
  visibleOnboardingSteps,
} from './onboarding/flow';
export type {
  OnboardingAnswerValue,
  OnboardingAnswers,
  OnboardingCompletion,
  ProgrammeOnboardingFlowState,
} from './onboarding/flow';
export {
  SESSION_PRESET_TARGET_MINUTES,
  adaptationBranchById,
  applyProgrammeSessionResults,
  estimateSessionMinutes,
  generateProgrammeSession,
} from './session';
export type {
  AppliedProgrammeSession,
  GenerateSessionInput,
  ProgrammeFinisherPlanItem,
  ProgrammeSessionExercise,
  ProgrammeSessionPlan,
  ProgrammeSessionResults,
  SessionDurationPreset,
  SessionTemplateId,
} from './session';
export {
  CHECKUP_ZERO_PROTOCOL_SEQUENCE,
  ROUTINE_CHECKUP_DUE_DAYS,
  routineCheckupDue,
  assessmentInputsFromCheckUp,
  checkupZeroBatterySequence,
  assessmentInputsFromV2Results,
  assessmentReoffer,
  markSurfaceShown,
  recordBandAnswer,
  recordDomingCheck,
  shouldAskBandQuestion,
  shouldShowDomingCheck,
  surfaceAlreadyShown,
} from './postOnboarding';
export type { AssessmentReoffer, OneTimeSurfaceId } from './postOnboarding';
export {
  PROGRAMME_PREP_ITEM_ID,
  allProgrammeVoiceExerciseIds,
  programmeVoiceExerciseDefinition,
  programmeVoiceSafetyProfile,
  withSupportCues,
} from './voiceCatalog';
export { PROGRAMME_VOICE_LINES, programmeInstructionCueKey } from './voiceScripts';
export {
  programmeResultsFromVoiceSession,
  voiceSessionInputsFromPlan,
} from './voiceSession';
export type { ProgrammeVoiceSessionInputs } from './voiceSession';
