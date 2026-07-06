/**
 * Programme engine v2 (flag-gated parallel build — C4 ruling 2026-07-06).
 *
 * Pure data + pure logic implementing exercise-ladders-spec v0.2 and
 * onboarding-spec v0.2 §10 under the recorded implementation rulings
 * (docs/decisions.md 2026-07-06). Nothing here touches UI, native modules,
 * or the network; the existing training engine keeps shipping until this
 * one is promoted. Gated by EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2.
 */

export * from './types';
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
  visibleOnboardingSteps,
} from './onboarding/flow';
export type {
  OnboardingAnswerValue,
  OnboardingAnswers,
  OnboardingCompletion,
  ProgrammeOnboardingFlowState,
} from './onboarding/flow';
