/**
 * Onboarding flow machine — onboarding-spec v0.2 §2/§3/§4 under the
 * 2026-07-06 rulings. Pure state + transitions; screens render whatever step
 * this machine says is current, from the content layer.
 *
 * Rules encoded here (the gate table, B2 row deferred):
 * - Consent declined → Stage B never shown; §4 decline row applies (placement
 *   capped L2, conservative finisher routing, no assessment offer bypass —
 *   but explicitly NOT Gentle Start: a privacy choice is never a health flag).
 * - B1 yes → advisory with required acknowledgement, Gentle Start preset,
 *   movement assessment BYPASSED (the final screen explains that it stays
 *   off; re-offered once gp_confirmed). B1 skipped → conservative: same preset and bypass, no
 *   GP advisory (nothing was disclosed); B1 is re-asked at the first check-up
 *   (§8 re-asks unanswered Stage B items) and answering No lifts the preset.
 * - Every skip routes to the CONSERVATIVE default (non-negotiable):
 *   B5 skip → support variants on; C1 skip → treated as no stairs;
 *   C2 skip → quiet mode on; A3 skip → activity prior 0.
 * - Related answers share one visual screen: About You, Movement Comfort,
 *   and Setup. Preferred days are no longer collected here because the app
 *   does not schedule around them.
 * - Nothing in onboarding ever blocks access to the app.
 */

import type { ActivityLevel, LifeGoalCategory } from '../../adherence';
import type { MenopauseStage } from '../../profile';
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
  menopauseStage: MenopauseStage | null;
  activityLevel: ActivityLevel | Skipped | null;
  consent: 'agree' | 'decline' | null;
  b1Heart: 'yes' | 'no' | Skipped | null;
  /** Empty array = explicit "none of these". */
  b3Joints: readonly JointFlag[] | null;
  b4Pelvic: 'often' | 'sometimes' | 'never' | 'prefer_not_to_say' | null;
  b5Balance: 'yes' | 'no' | Skipped | null;
  c1Stairs: 'yes' | 'no' | Skipped | null;
  c2Quiet: 'yes' | 'no' | Skipped | null;
  assessmentChoice: 'now' | 'after_first_workout' | 'skip' | null;
}

export function emptyOnboardingAnswers(): OnboardingAnswers {
  return {
    lifeGoal: null,
    menopauseStage: null,
    activityLevel: null,
    consent: null,
    b1Heart: null,
    b3Joints: null,
    b4Pelvic: null,
    b5Balance: null,
    c1Stairs: null,
    c2Quiet: null,
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

/** Gentle Start preset applies on B1 yes AND on B1 skip (conservative). */
export function gentleStartFromAnswers(answers: OnboardingAnswers): boolean {
  return answers.consent === 'agree' && (answers.b1Heart === 'yes' || answers.b1Heart === SKIPPED);
}

// ---------------------------------------------------------------------------
// Step sequence
// ---------------------------------------------------------------------------

export function visibleOnboardingSteps(answers: OnboardingAnswers): OnboardingStepId[] {
  const steps: OnboardingStepId[] = ['welcome', 'a1_life_goal', 'a2_menopause_journey', 'a3_activity', 'consent_health'];
  if (answers.consent === 'agree' || answers.consent === null) {
    // Until consent is answered we optimistically include the safety screens;
    // a decline removes them (§4 decline row, normal tone).
    steps.push('b1_heart');
    if (answers.b1Heart === 'yes') steps.push('b1_advisory');
    steps.push('b3_joints', 'b4_pelvic', 'b5_balance');
  }
  // Everyone reaches one final start screen. That screen offers the check-up
  // only when consent + B1 policy allow it; Gentle Start / consent-declined
  // paths record a conservative skip before completing.
  steps.push('c1_stairs', 'c2_quiet', 'assessment_offer');
  return steps;
}

export type OnboardingScreenId =
  | 'welcome'
  | 'about_you'
  | 'health_consent'
  | 'heart_safety'
  | 'heart_advisory'
  | 'movement_comfort'
  | 'setup'
  | 'finish';

/** Maps machine-level answer steps onto the seven core user-visible screens. */
export function onboardingScreenForStep(step: OnboardingStepId): OnboardingScreenId {
  switch (step) {
    case 'welcome':
      return 'welcome';
    case 'a1_life_goal':
    case 'a2_menopause_journey':
    case 'a3_activity':
      return 'about_you';
    case 'consent_health':
      return 'health_consent';
    case 'b1_heart':
      return 'heart_safety';
    case 'b1_advisory':
      return 'heart_advisory';
    case 'b3_joints':
    case 'b4_pelvic':
    case 'b5_balance':
      return 'movement_comfort';
    case 'c1_stairs':
    case 'c2_quiet':
      return 'setup';
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
    case 'a2_menopause_journey':
      return answers.menopauseStage !== null;
    case 'a3_activity':
      return answers.activityLevel !== null;
    case 'consent_health':
      return answers.consent !== null;
    case 'b1_heart':
      return answers.b1Heart !== null;
    case 'b3_joints':
      return answers.b3Joints !== null;
    case 'b4_pelvic':
      return answers.b4Pelvic !== null;
    case 'b5_balance':
      return answers.b5Balance !== null;
    case 'c1_stairs':
      return answers.c1Stairs !== null;
    case 'c2_quiet':
      return answers.c2Quiet !== null;
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
 * Step-wise back (promotion integration Phase 2): clears the most recent
 * answered/acknowledged step so `currentOnboardingStep` returns to it. The
 * Back navigation follows user-visible screens rather than individual fields
 * inside a grouped screen. It clears the previous screen's answers so the
 * machine returns to that screen in one tap. No-op at Welcome.
 */
export function undoLastOnboardingStep(
  state: ProgrammeOnboardingFlowState
): ProgrammeOnboardingFlowState {
  const current = currentOnboardingStep(state);
  const screens = visibleOnboardingScreens(state.answers);
  const currentScreen = current === 'complete' ? null : onboardingScreenForStep(current);
  const currentIndex = currentScreen === null ? screens.length : screens.indexOf(currentScreen);
  if (currentIndex <= 0) return state;
  return clearOnboardingScreen(state, screens[currentIndex - 1]);
}

function clearOnboardingScreen(
  state: ProgrammeOnboardingFlowState,
  screen: OnboardingScreenId
): ProgrammeOnboardingFlowState {
  const answers = { ...state.answers };
  let acknowledged = state.acknowledged;
  switch (screen) {
    case 'welcome':
      acknowledged = acknowledged.filter((step) => step !== 'welcome');
      break;
    case 'about_you':
      answers.lifeGoal = null;
      answers.menopauseStage = null;
      answers.activityLevel = null;
      break;
    case 'health_consent':
      answers.consent = null;
      break;
    case 'heart_safety':
      answers.b1Heart = null;
      break;
    case 'heart_advisory':
      acknowledged = acknowledged.filter((step) => step !== 'b1_advisory');
      break;
    case 'movement_comfort':
      answers.b3Joints = null;
      answers.b4Pelvic = null;
      answers.b5Balance = null;
      break;
    case 'setup':
      answers.c1Stairs = null;
      answers.c2Quiet = null;
      break;
    case 'finish':
      answers.assessmentChoice = null;
      break;
  }
  return { ...state, answers, acknowledged };
}

export type OnboardingAnswerValue =
  | { step: 'a1_life_goal'; value: LifeGoalCategory | Skipped }
  | { step: 'a2_menopause_journey'; value: MenopauseStage }
  | { step: 'a3_activity'; value: ActivityLevel | Skipped }
  | { step: 'consent_health'; value: 'agree' | 'decline' }
  | { step: 'b1_heart'; value: 'yes' | 'no' | Skipped }
  | { step: 'b3_joints'; value: readonly JointFlag[] }
  | { step: 'b4_pelvic'; value: 'often' | 'sometimes' | 'never' | 'prefer_not_to_say' }
  | { step: 'b5_balance'; value: 'yes' | 'no' | Skipped }
  | { step: 'c1_stairs'; value: 'yes' | 'no' | Skipped }
  | { step: 'c2_quiet'; value: 'yes' | 'no' | Skipped }
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
    case 'a2_menopause_journey':
      answers.menopauseStage = answer.value;
      break;
    case 'a3_activity':
      answers.activityLevel = answer.value;
      break;
    case 'consent_health':
      answers.consent = answer.value;
      break;
    case 'b1_heart':
      answers.b1Heart = answer.value;
      break;
    case 'b3_joints':
      answers.b3Joints = [...answer.value];
      break;
    case 'b4_pelvic':
      answers.b4Pelvic = answer.value;
      break;
    case 'b5_balance':
      answers.b5Balance = answer.value;
      break;
    case 'c1_stairs':
      answers.c1Stairs = answer.value;
      break;
    case 'c2_quiet':
      answers.c2Quiet = answer.value;
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
  /** Written to the EXISTING preferences profile by the app layer (C6). */
  menopauseStage: MenopauseStage | null;
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
  const consentDeclined = answers.consent === 'decline';
  const gentleStart = gentleStartFromAnswers(answers);

  const placementResult = placementForOnboarding({
    // The 'now' assessment runs AFTER onboarding; conservative placement
    // stands until its results re-derive placement via
    // applyAssessmentPlacement below.
    assessment: null,
    activityLevel: answers.activityLevel === SKIPPED ? null : answers.activityLevel,
    consentDeclined,
    gentleStart,
  });

  const jointFlags = answers.consent === 'agree' ? (answers.b3Joints ?? []) : [];
  const startingPlacement = jointSensitiveStartingPlacement(
    placementResult.placement,
    jointFlags
  );

  const profile: ProgrammeProfile = {
    consentHealthData: answers.consent === 'agree',
    activityLevel: answers.activityLevel === SKIPPED ? null : answers.activityLevel,
    gentleStartActive: gentleStart,
    gpConfirmed: false,
    // Conservative default: any pelvic answer other than an explicit "never"
    // routes low-impact (spec B4); consent-declined stays 'none' — the §4
    // decline row applies conservative routing WITHOUT the health-content
    // unlock (a privacy choice is not a symptom report).
    pelvicRouting:
      answers.consent === 'agree' && answers.b4Pelvic !== null && answers.b4Pelvic !== 'never'
        ? 'low_impact'
        : 'none',
    quietMode: answers.c2Quiet === 'yes' || answers.c2Quiet === SKIPPED,
    // Consent-gated like every Stage B mapping: with back-navigation a user
    // can answer B3 and THEN retract consent — stale special-category answers
    // must never be used (§4 decline row).
    jointFlags,
    balanceSupportDefault:
      answers.consent === 'agree' && (answers.b5Balance === 'yes' || answers.b5Balance === SKIPPED),
    hasStairs: answers.c1Stairs === 'yes' ? true : answers.c1Stairs === 'no' ? false : null,
    hasBand: null,
    diastasisFlag: false,
    placement: startingPlacement,
    assessmentStatus: gentleStart
      ? 'bypassed_b1'
      : answers.assessmentChoice === 'after_first_workout'
        ? 'deferred'
        : answers.assessmentChoice === 'skip' || consentDeclined
          ? 'skipped'
          : null, // 'now' → set to 'done' when Check-up #0 completes
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
    menopauseStage: answers.menopauseStage,
    lifeGoalCategory: answers.lifeGoal === SKIPPED ? null : answers.lifeGoal,
    assessmentIntent:
      answers.consent === 'agree' && !gentleStart && answers.assessmentChoice === 'now'
        ? 'start_now'
        : null,
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
 * Applies a completed Check-up #0 to an onboarded state. The immediate 'now'
 * path derives fresh placement (nothing trained yet to protect), then keeps
 * any disclosed joint-sensitive starts at L1; the deferred path re-places
 * UPWARD ONLY (spec §6) within the same safety constraint. T1 under 10 s
 * forces balance-support-default on even when B5 said No — never the reverse.
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
    profile: {
      ...state.profile,
      placement: targetPlacement,
      assessmentStatus: 'done',
      // Starts (and restarts) the routine check-up cadence clock.
      lastAssessmentAtIso: options.completedAtIso ?? new Date().toISOString(),
      balanceSupportDefault:
        result.balanceSupportRequired === true ? true : state.profile.balanceSupportDefault,
    },
  };
}

/** The activation event (§10): flips once, mirrored into local telemetry. */
export function markFirstSessionStarted(state: ProgrammeState): ProgrammeState {
  if (state.profile.firstSessionStarted) return state;
  return { ...state, profile: { ...state.profile, firstSessionStarted: true } };
}
