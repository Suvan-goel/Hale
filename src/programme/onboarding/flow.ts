/**
 * Onboarding flow machine — onboarding-spec v0.2 §2/§3/§4 under the
 * 2026-07-06 rulings. Pure state + transitions; screens render whatever step
 * this machine says is current, from the content layer.
 *
 * Rules encoded here (the gate table, B2 row deferred):
 * - B1 yes → a required safety-step confirmation before onboarding can
 *   finish. Once confirmed, the starting Movement Check-Up remains the first
 *   programme action. There is no workout-first Gentle Start branch.
 * - Onboarding collects a life goal plus B1 heart safety and B3 joint comfort.
 *   Activity, pelvic, balance preference, stairs, noise, and menopause-stage
 *   details do not delay first value. Their day-one state is explicit and
 *   conservative: L1 placement, temporary support on, quiet on, no stair.
 * - B1 and B3 are progressively disclosed inside one user-visible Health &
 *   Privacy stage. The required local-use disclosure appears with B1, and
 *   choosing any B1 answer is the affirmative action before data is stored.
 * - Eligible users complete an accepted baseline before Week 1. The retained
 *   `after_first_workout` token is read-compatible only; current onboarding
 *   treats it as a baseline-first choice. Every user who completes current
 *   onboarding is eligible for the starting check-up.
 */

import type { LifeGoalCategory } from '../../adherence';
import { placementForOnboarding, type AssessmentInputs } from '../placement';
import { freshPatternLadderState } from '../promotion';
import { programmePolicyFingerprint } from '../policy';
import { defaultProgrammeState } from '../serialize';
import {
  isOnboardingQuestionStep,
  type OnboardingQuestionStepId,
  type OnboardingStepId,
} from './content';
import {
  PROGRAMME_PATTERNS,
  type JointFlag,
  type PatternLadderState,
  type ProgrammePattern,
  type ProgrammeProfile,
  type ProgrammeState,
} from '../types';

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

export const SKIPPED = 'skipped' as const;
export type Skipped = typeof SKIPPED;

export interface OnboardingAnswers {
  lifeGoal: LifeGoalCategory | Skipped | null;
  b1Heart: 'yes' | 'no' | null;
  /** Empty array = explicit "none of these"; SKIPPED is non-disclosure. */
  b3Joints: readonly JointFlag[] | Skipped | null;
  /** `after_first_workout` is retained only for interrupted legacy flows. */
  assessmentChoice: 'now' | 'after_first_workout' | 'skip' | null;
}

export function emptyOnboardingAnswers(): OnboardingAnswers {
  return {
    lifeGoal: null,
    b1Heart: null,
    b3Joints: null,
    assessmentChoice: null,
  };
}

export interface ProgrammeOnboardingFlowState {
  answers: OnboardingAnswers;
  /** Message steps the user has continued past. */
  acknowledged: readonly OnboardingStepId[];
}

export function initialOnboardingFlowState(): ProgrammeOnboardingFlowState {
  return { answers: emptyOnboardingAnswers(), acknowledged: [] };
}

// ---------------------------------------------------------------------------
// Step sequence
// ---------------------------------------------------------------------------

export function visibleOnboardingSteps(answers: OnboardingAnswers): OnboardingStepId[] {
  const steps: OnboardingStepId[] = ['welcome', 'a1_life_goal', 'b1_heart', 'b3_joints'];
  if (answers.b1Heart === 'yes') steps.push('b1_advisory');
  steps.push('assessment_offer');
  return steps;
}

export type OnboardingScreenId =
  | 'welcome'
  | 'goal'
  | 'health_safety'
  | 'heart_advisory'
  | 'finish';

/** Maps machine-level answer steps onto the four core user-visible surfaces. */
export function onboardingScreenForStep(step: OnboardingStepId): OnboardingScreenId {
  switch (step) {
    case 'welcome':
      return 'welcome';
    case 'a1_life_goal':
      return 'goal';
    case 'b1_heart':
    case 'b3_joints':
      return 'health_safety';
    case 'b1_advisory':
      return 'heart_advisory';
    case 'assessment_offer':
      return 'finish';
  }
}

export function visibleOnboardingScreens(answers: OnboardingAnswers): OnboardingScreenId[] {
  const screens: OnboardingScreenId[] = [];
  for (const step of visibleOnboardingSteps(answers)) {
    const screen = onboardingScreenForStep(step);
    if (screens[screens.length - 1] !== screen) screens.push(screen);
  }
  return screens;
}

function stepAnswered(answers: OnboardingAnswers, step: OnboardingQuestionStepId): boolean {
  switch (step) {
    case 'a1_life_goal':
      return answers.lifeGoal !== null;
    case 'b1_heart':
      return answers.b1Heart !== null;
    case 'b3_joints':
      return answers.b3Joints !== null;
    case 'assessment_offer':
      return answers.assessmentChoice !== null;
  }
}

/** The step the UI should show, or 'complete' when the flow is finished. */
export function currentOnboardingStep(state: ProgrammeOnboardingFlowState): OnboardingStepId | 'complete' {
  for (const step of visibleOnboardingSteps(state.answers)) {
    if (isOnboardingQuestionStep(step)) {
      if (!stepAnswered(state.answers, step)) return step;
    } else if (!state.acknowledged.includes(step)) {
      return step;
    }
  }
  return 'complete';
}

export function acknowledgeOnboardingStep(
  state: ProgrammeOnboardingFlowState,
  step: OnboardingStepId
): ProgrammeOnboardingFlowState {
  if (state.acknowledged.includes(step)) return state;
  return { ...state, acknowledged: [...state.acknowledged, step] };
}

/**
 * Clears the immediately preceding progressive panel. The two short health
 * questions share one top-level stage, but Back still behaves like a normal
 * form: B3 → B1 → Goal. No-op at Welcome.
 */
export function undoLastOnboardingStep(
  state: ProgrammeOnboardingFlowState
): ProgrammeOnboardingFlowState {
  const current = currentOnboardingStep(state);
  const steps = visibleOnboardingSteps(state.answers);
  const currentIndex = current === 'complete' ? steps.length : steps.indexOf(current);
  if (currentIndex <= 0) return state;
  return clearOnboardingStep(state, steps[currentIndex - 1]);
}

function clearOnboardingStep(
  state: ProgrammeOnboardingFlowState,
  step: OnboardingStepId
): ProgrammeOnboardingFlowState {
  const answers = { ...state.answers };
  let acknowledged = state.acknowledged;
  switch (step) {
    case 'welcome':
      acknowledged = acknowledged.filter((step) => step !== 'welcome');
      break;
    case 'a1_life_goal':
      answers.lifeGoal = null;
      break;
    case 'b1_heart':
      answers.b1Heart = null;
      answers.b3Joints = null;
      acknowledged = acknowledged.filter((step) => step !== 'b1_advisory');
      break;
    case 'b1_advisory':
      acknowledged = acknowledged.filter((step) => step !== 'b1_advisory');
      break;
    case 'b3_joints':
      answers.b3Joints = null;
      break;
    case 'assessment_offer':
      answers.assessmentChoice = null;
      break;
  }
  return { ...state, answers, acknowledged };
}

export type OnboardingAnswerValue =
  | { step: 'a1_life_goal'; value: LifeGoalCategory | Skipped }
  | { step: 'b1_heart'; value: 'yes' | 'no' }
  | { step: 'b3_joints'; value: readonly JointFlag[] | Skipped }
  | { step: 'assessment_offer'; value: 'now' | 'after_first_workout' | 'skip' };

export function recordOnboardingAnswer(
  state: ProgrammeOnboardingFlowState,
  answer: OnboardingAnswerValue
): ProgrammeOnboardingFlowState {
  const answers = { ...state.answers };
  switch (answer.step) {
    case 'a1_life_goal':
      answers.lifeGoal = answer.value;
      break;
    case 'b1_heart':
      answers.b1Heart = answer.value;
      break;
    case 'b3_joints':
      answers.b3Joints = answer.value === SKIPPED ? SKIPPED : [...answer.value];
      break;
    case 'assessment_offer':
      answers.assessmentChoice = answer.value;
      break;
  }
  return { ...state, answers };
}

// ---------------------------------------------------------------------------
// Completion → profile handoff
// ---------------------------------------------------------------------------

export interface OnboardingCompletion {
  programmeState: ProgrammeState;
  /** Written to the EXISTING LifeGoal surface by the app layer (C8). */
  lifeGoalCategory: LifeGoalCategory | null;
  /** 'start_now' → the app launches Check-up #0; placement then re-derives. */
  assessmentIntent: 'start_now' | null;
}

export function completeOnboarding(
  state: ProgrammeOnboardingFlowState,
  options: { completedAtIso?: string } = {}
): OnboardingCompletion {
  const answers = state.answers;
  const healthAnswersComplete = answers.b1Heart !== null && answers.b3Joints !== null;
  const safetyStepConfirmed =
    answers.b1Heart === 'no' ||
    (answers.b1Heart === 'yes' && state.acknowledged.includes('b1_advisory'));
  const readyForStartingCheckUp = healthAnswersComplete && safetyStepConfirmed;
  const gentleStart = healthAnswersComplete && !safetyStepConfirmed;

  const placementResult = placementForOnboarding({
    // The 'now' assessment runs AFTER onboarding; conservative placement
    // stands until its results re-derive placement via
    // applyAssessmentPlacement below.
    assessment: null,
    activityLevel: null,
    consentDeclined: !healthAnswersComplete,
    gentleStart,
  });

  const jointFlags: readonly JointFlag[] =
    healthAnswersComplete && Array.isArray(answers.b3Joints)
      ? answers.b3Joints
      : [];
  const startingPlacement = jointSensitiveStartingPlacement(
    placementResult.placement,
    jointFlags
  );

  const profile: ProgrammeProfile = {
    consentHealthData: healthAnswersComplete,
    activityLevel: null,
    gentleStartActive: gentleStart,
    heartSafetyAnswer:
      !healthAnswersComplete || answers.b1Heart === null
        ? null
        : answers.b1Heart,
    gpConfirmed: answers.b1Heart === 'yes' && safetyStepConfirmed,
    // No symptom disclosure is inferred. Universal quiet mode below removes
    // the stomping item without unlocking pelvic-health content.
    pelvicRouting: 'none',
    // Quiet, supported and stair-free are preference/safety defaults, not
    // inferred health disclosures. They can be changed later in Settings.
    quietMode: true,
    jointFlags,
    // Support is initially conservative, not a claimed user preference. An
    // accepted baseline balance result can resolve this temporary default.
    balanceSupportDefault: true,
    balanceSupportPreference: null,
    // Only an accepted camera check-up can make this protection required.
    balanceSupportRequired: false,
    hasStairs: null,
    hasBand: null,
    diastasisFlag: false,
    placement: startingPlacement,
    assessmentStatus: gentleStart
      ? 'bypassed_b1'
      : !healthAnswersComplete
        ? 'skipped'
        : null, // eligible starts, including legacy choices, require Check-up #0
    lastAssessmentAtIso: null,
    chosenDays: [],
    firstSessionStarted: false,
    oneTimeSurfacesShown: [],
  };

  const ladders = {} as Record<ProgrammePattern, PatternLadderState>;
  for (const pattern of PROGRAMME_PATTERNS) {
    ladders[pattern] = freshPatternLadderState(pattern, startingPlacement[pattern]);
  }

  const programmeState: ProgrammeState = {
    ...defaultProgrammeState(),
    profile,
    ladders,
    finisher: {
      track: 'quiet_power',
      completedSessions: 0,
      currentContacts: placementResult.finisherContacts,
    },
    onboardingCompletedAtIso: options.completedAtIso ?? new Date().toISOString(),
    policyFingerprint: programmePolicyFingerprint(),
  };

  return {
    programmeState,
    lifeGoalCategory: answers.lifeGoal === SKIPPED ? null : answers.lifeGoal,
    assessmentIntent:
      readyForStartingCheckUp ? 'start_now' : null,
  };
}

/**
 * Every retained comfort answer has a concrete day-one effect. The intake
 * does not claim to diagnose or permanently lock progression; it simply
 * starts the related ladder at its gentlest level. Successful, comfortable
 * sessions can still progress normally from there.
 */
function jointSensitiveStartingPlacement(
  placement: Readonly<Record<ProgrammePattern, number>>,
  flags: readonly JointFlag[]
): Record<ProgrammePattern, number> {
  const next = { ...placement };
  for (const flag of flags) {
    switch (flag) {
      case 'knee':
        next.squat = 1;
        break;
      case 'hip':
        next.squat = 1;
        next.hinge = 1;
        break;
      case 'shoulder':
        next.push = 1;
        next.pull = 1;
        break;
      case 'wrist':
        next.push = 1;
        next.core = 1;
        break;
      case 'low_back':
        next.hinge = 1;
        next.core = 1;
        break;
    }
  }
  return next;
}

/**
 * Applies a newly saved joint-comfort choice immediately. Adding a flag may
 * lower a related ladder to L1; removing one never auto-promotes it. This
 * keeps the Settings promise aligned with the same protection used during
 * baseline placement.
 */
export function applyJointComfortFlags(
  state: ProgrammeState,
  flags: readonly JointFlag[]
): ProgrammeState {
  const currentLevels = {} as Record<ProgrammePattern, number>;
  const placementLevels = {} as Record<ProgrammePattern, number>;
  for (const pattern of PROGRAMME_PATTERNS) {
    currentLevels[pattern] = state.ladders[pattern].currentLevel;
    placementLevels[pattern] = state.profile.placement[pattern] ?? currentLevels[pattern];
  }
  const cappedLevels = jointSensitiveStartingPlacement(currentLevels, flags);
  const cappedPlacement = jointSensitiveStartingPlacement(placementLevels, flags);
  const ladders = { ...state.ladders };
  for (const pattern of PROGRAMME_PATTERNS) {
    if (cappedLevels[pattern] >= ladders[pattern].currentLevel) continue;
    ladders[pattern] = {
      ...ladders[pattern],
      currentLevel: cappedLevels[pattern],
      consecutiveTopSessions: 0,
      consecutiveBottomNoneSessions: 0,
      currentRepTarget: null,
    };
  }
  return {
    ...state,
    ladders,
    profile: {
      ...state.profile,
      jointFlags: [...flags],
      placement: cappedPlacement,
    },
  };
}

function profileAfterBalanceAssessment(
  profile: ProgrammeProfile,
  balanceSupportRequired: boolean | null
): ProgrammeProfile {
  if (balanceSupportRequired === null) return profile;
  return {
    ...profile,
    balanceSupportDefault:
      balanceSupportRequired || profile.balanceSupportPreference === true,
    balanceSupportRequired,
  };
}

/** Updates balance protection from an accepted check-up without re-placing ladders. */
export function applyAssessmentSafety(
  state: ProgrammeState,
  assessment: AssessmentInputs
): ProgrammeState {
  if (!assessment.t1) return state;
  const profile = profileAfterBalanceAssessment(
    state.profile,
    assessment.t1.worseSideSeconds < 10
  );
  return profile === state.profile ? state : { ...state, profile };
}

/**
 * Applies a completed Check-up #0 to an onboarded state. The immediate 'now'
 * path derives fresh placement (nothing trained yet to protect), then keeps
 * any disclosed joint-sensitive starts at L1; the deferred path re-places
 * UPWARD ONLY (spec §6) within the same safety constraint. A valid T1 resolves
 * the temporary support default; a short hold requires support, while an
 * explicit voluntary Settings preference remains enabled after a strong hold.
 */
export function applyAssessmentPlacement(
  state: ProgrammeState,
  assessment: AssessmentInputs,
  options: { deferred: boolean; completedAtIso?: string }
): ProgrammeState {
  const result = placementForOnboarding({
    assessment,
    activityLevel: state.profile.activityLevel,
    consentDeclined: !state.profile.consentHealthData,
    gentleStart: state.profile.gentleStartActive && !state.profile.gpConfirmed,
  });
  const targetPlacement = jointSensitiveStartingPlacement(
    result.placement,
    state.profile.jointFlags
  );
  const ladders = { ...state.ladders };
  for (const pattern of PROGRAMME_PATTERNS) {
    const target = targetPlacement[pattern];
    const nextLevel = options.deferred ? Math.max(ladders[pattern].currentLevel, target) : target;
    if (nextLevel !== ladders[pattern].currentLevel) {
      ladders[pattern] = {
        ...ladders[pattern],
        currentLevel: nextLevel,
        consecutiveTopSessions: 0,
        consecutiveBottomNoneSessions: 0,
        currentRepTarget: null,
      };
    }
  }
  return {
    ...state,
    ladders,
    profile: profileAfterBalanceAssessment({
      ...state.profile,
      placement: targetPlacement,
      assessmentStatus: 'done',
      // Starts (and restarts) the routine check-up cadence clock.
      lastAssessmentAtIso: options.completedAtIso ?? new Date().toISOString(),
    }, result.balanceSupportRequired),
  };
}

/** The activation event (§10): flips once, mirrored into local telemetry. */
export function markFirstSessionStarted(state: ProgrammeState): ProgrammeState {
  if (state.profile.firstSessionStarted) return state;
  return { ...state, profile: { ...state.profile, firstSessionStarted: true } };
}
