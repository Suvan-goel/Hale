/**
 * Programme v2 app-lifecycle adapter (promotion integration, Phase 1): pure
 * projections of ProgrammeState onto the shapes the existing app shell
 * renders — the Today primary action + session detail, the home check-up
 * offer, the pre/post-session moments, and per-pattern level rows for the
 * Plan/Progress surfaces.
 *
 * Rules of the file:
 * - PURE and read-only: nothing here mutates or persists state. The 14-day
 *   inactivity easing (§12) is applied to a COPY so previews match what the
 *   next session will actually run; persisting it stays the caller's job at
 *   session start (the established shell pattern).
 * - Zero old-engine coupling (C4): imports stay inside src/programme.
 * - All user-facing copy lives HERE, not in screens, and is scanned by
 *   src/pearlFlow/__tests__/copyGuardrails.test.ts. Voice lines are NOT owned
 *   here — this file is silent UI copy only.
 * - Callers gate on onboarding: these projections assume
 *   onboardingCompletedAtIso is set (AppGate owns the onboarding staging).
 */

import type { SessionRpe } from './effort';
import { BRAND } from '../brand';
import { getProgrammeLevel, maxProgrammeLevel } from './ladders';
import { programmeDisplayName } from './naming';
import {
  assessmentReoffer,
  routineCheckupDue,
  shouldAskBandQuestion,
  shouldShowDomingCheck,
} from './postOnboarding';
import { applyInactivityRegressionIfDue } from './promotion';
import { isProgrammeJourneyRetestDue } from './journey';
import {
  generateProgrammeSession,
  type ProgrammeSessionPlan,
  type SessionDurationPreset,
  type SessionTemplateId,
} from './session';
import {
  PROGRAMME_PATTERNS,
  type EffortAnswer,
  type ProgrammePattern,
  type ProgrammeState,
  type PromotionDecision,
} from './types';

// ---------------------------------------------------------------------------
// Session-input derivation — the ONE source of the A/B + preset rule
// ---------------------------------------------------------------------------

export interface NextProgrammeSessionInput {
  template: SessionTemplateId;
  preset: SessionDurationPreset;
  lastSessionEffort: EffortAnswer | null;
}

/**
 * A/B alternation by completed-session parity; the first-ever session runs
 * the 15-minute minimum-dose preset (§7). Extracted from the dev shell so
 * preview and start-session generation can never drift apart.
 */
export function nextProgrammeSessionInput(state: ProgrammeState): NextProgrammeSessionInput {
  return {
    template: state.completedSessionCount % 2 === 0 ? 'A' : 'B',
    preset: state.profile.firstSessionStarted ? 'standard' : 'first_session',
    lastSessionEffort: state.lastSessionEffort,
  };
}

// ---------------------------------------------------------------------------
// Today view model
// ---------------------------------------------------------------------------

export type ProgrammeTodayStateId =
  | 'first_session_ready'
  | 'session_ready'
  | 'returning_after_break'
  | 'health_answers_required'
  | 'baseline_due';

/** Mirrors the old lifecycle's action vocabulary so TodayScreen ports cleanly. */
export interface ProgrammeTodayAction {
  type:
    | 'start_first_session'
    | 'start_today_session'
    | 'start_gentle_restart'
    | 'start_baseline_checkup'
    | 'review_health_answers';
  title: string;
  subtitle: string;
  ctaLabel: string;
  tone: 'default' | 'gentle';
}

/**
 * Eligible users need an accepted baseline before programme training begins.
 * This also closes the old one-starter exception for legacy `deferred`,
 * `skipped`, and interrupted states. The active B1 Gentle Start safety route
 * remains an authoritative exception because Pearl cannot offer it the
 * effort-based check-up.
 */
export function baselineCheckupRequiredBeforeTraining(state: ProgrammeState): boolean {
  if (
    state.journey.status !== 'awaiting_baseline' ||
    !state.profile.consentHealthData ||
    state.profile.assessmentStatus === 'done'
  ) {
    return false;
  }
  if (state.profile.gentleStartActive && !state.profile.gpConfirmed) return false;
  return state.profile.assessmentStatus !== 'bypassed_b1' || state.profile.gpConfirmed;
}

/**
 * A new programme cannot begin without both the private safety answers and an
 * accepted baseline. Kept separate from the check-up gate because consent must
 * be restored before Pearl can decide whether the check-up itself is suitable.
 */
export function healthAnswersRequiredBeforeBaseline(state: ProgrammeState): boolean {
  return (
    state.journey.status === 'awaiting_baseline' &&
    !state.profile.consentHealthData &&
    state.profile.assessmentStatus !== 'done'
  );
}

export interface ProgrammeSessionPreview {
  template: SessionTemplateId;
  preset: SessionDurationPreset;
  estimatedMinutes: number;
  /** Main patterns in session order, plain names (naming-law compliant). */
  mainPatternTitles: readonly string[];
}

export interface ProgrammeCheckupOffer {
  /**
   * routine_due — the persistent 28-day cadence card (never once-only);
   * standing_entry — the permanent home entry while placement is still
   * conservative (deferred/skipped/post-GP re-offer states).
   */
  kind: 'routine_due' | 'standing_entry';
  title: string;
  ctaLabel: string;
}

export interface ProgrammeTodayViewModel {
  state: ProgrammeTodayStateId;
  primaryAction: ProgrammeTodayAction;
  sessionPreview: ProgrammeSessionPreview;
  /** e.g. "Today: squat, push and core — about 15 minutes." */
  sessionDetail: string;
  checkupOffer: ProgrammeCheckupOffer | null;
}

export function programmeTodayViewModel(
  state: ProgrammeState,
  nowIso: string
): ProgrammeTodayViewModel {
  // Preview against the post-easing state so what we describe is what will
  // run; the caller persists the easing at session start, never here.
  const regression = applyInactivityRegressionIfDue(state, nowIso);
  const effective = regression.state;
  const input = nextProgrammeSessionInput(effective);
  const plan = generateProgrammeSession({ state: effective, ...input });
  const minutes = Math.round(plan.estimatedMinutes);
  const patternList = listSentence(plan.main.map((exercise) => patternTitle(exercise.pattern).toLowerCase()));

  const healthAnswersRequired = healthAnswersRequiredBeforeBaseline(effective);
  const baselineRequired = baselineCheckupRequiredBeforeTraining(effective);
  const checkupOffer = healthAnswersRequired || baselineRequired
    ? null
    : checkupOfferFor(effective, nowIso);
  const routineCheckupDue = checkupOffer?.kind === 'routine_due';
  const stateId: ProgrammeTodayStateId = healthAnswersRequired
    ? 'health_answers_required'
    : baselineRequired || routineCheckupDue
    ? 'baseline_due'
    : !effective.profile.firstSessionStarted
      ? 'first_session_ready'
      : regression.applied
        ? 'returning_after_break'
        : 'session_ready';

  const primaryAction: ProgrammeTodayAction =
    healthAnswersRequired
      ? {
          type: 'review_health_answers',
          title: 'Health answers needed before your check-up',
          subtitle:
            `Week 1 begins after an accepted starting check-up. Review the two private safety answers so ${BRAND.appName} can decide whether to offer it.`,
          ctaLabel: 'Review health answers',
          tone: 'default',
        }
      : baselineRequired
      ? {
          type: 'start_baseline_checkup',
          title: 'Start with your Movement Check-Up',
          // Warm re-entry: anyone who left the check-up lands here, so the
          // card reads as a plan waiting for its moment, never a dead end
          // (2026-07-14 onboarding review).
          subtitle:
            `Ready whenever you are — about eight minutes with a sturdy chair and a little clear space. It measures your starting Strength and Balance before Week 1, so ${BRAND.appName} can choose the right focus and compare your results later.`,
          ctaLabel: 'Start check-up',
          tone: 'default',
        }
      : routineCheckupDue
        ? {
            type: 'start_baseline_checkup',
            title: 'Your next 12-week check-up is ready',
            subtitle:
              'Repeat the same private Strength and Balance check, then optional Everyday Clarity, to see what changed and set your next focus.',
            ctaLabel: 'Start check-up',
            tone: 'default',
          }
      : stateId === 'first_session_ready'
      ? {
          type: 'start_first_session',
          title: 'Your first session is ready',
          subtitle: `About ${minutes} minutes at your starting levels. A chair and a little floor space are all you need.`,
          ctaLabel: 'Start your first session',
          tone: 'default',
        }
      : stateId === 'returning_after_break'
        ? {
            type: 'start_gentle_restart',
            title: 'Welcome back',
            subtitle: `It's been a little while, so we've eased every exercise back a step. About ${minutes} minutes today.`,
            ctaLabel: 'Start session',
            tone: 'gentle',
          }
        : {
            type: 'start_today_session',
            title: 'Ready when you are',
            subtitle: `${capitalize(patternList)} today — about ${minutes} minutes.`,
            ctaLabel: 'Start session',
            tone: 'default',
          };

  return {
    state: stateId,
    primaryAction,
    sessionPreview: {
      template: input.template,
      preset: input.preset,
      estimatedMinutes: plan.estimatedMinutes,
      mainPatternTitles: plan.main.map((exercise) => patternTitle(exercise.pattern)),
    },
    sessionDetail: healthAnswersRequired
      ? 'The answers stay on this phone and can be removed later in Settings.'
      : baselineRequired || routineCheckupDue
        ? 'About eight minutes · Strength, Balance, then optional Everyday Clarity.'
      : `Today: ${patternList} — about ${minutes} minutes.`,
    checkupOffer,
  };
}

/**
 * Home check-up affordance: the
 * routine 28-day card while due (persistent, not once-only), otherwise the
 * permanent standing entry whenever placement is not 'done' and the re-offer
 * policy has anything to say (B1-bypassed users correctly get nothing until
 * gp_confirmed — the policy returns 'none' there).
 */
export function checkupOfferFor(
  state: ProgrammeState,
  nowIso: string
): ProgrammeCheckupOffer | null {
  if (!state.profile.consentHealthData) return null;
  if (state.profile.gentleStartActive && !state.profile.gpConfirmed) return null;
  if (state.journey.status === 'completed') return null;
  if (isProgrammeJourneyRetestDue(state.journey, nowIso)) {
    return {
      kind: 'routine_due',
      title: 'Your next Movement Check-Up is ready',
      ctaLabel: 'Start check-up',
    };
  }
  // Compatibility fallback for pre-journey programme files that have a
  // completed placement but no reconstructed official assessment artifact.
  if (state.journey.status === 'awaiting_baseline' && routineCheckupDue(state, nowIso)) {
    return {
      kind: 'routine_due',
      title: 'Your next Movement Check-Up is ready',
      ctaLabel: 'Start check-up',
    };
  }
  if (
    state.journey.status === 'awaiting_baseline' &&
    state.profile.assessmentStatus !== 'done' &&
    assessmentReoffer(state, nowIso) !== 'none'
  ) {
    return {
      kind: 'standing_entry',
      title: 'Complete your Movement Check-Up when you are ready',
      ctaLabel: 'Start check-up',
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Onboarding completion routing
// ---------------------------------------------------------------------------

export interface OnboardingRoute {
  /** Run Check-up #0 first (assessment_offer answered 'now' — flow contract). */
  assessmentFirst: boolean;
  /** Start the first session (after the check-up when assessmentFirst). */
  startFirstSession: boolean;
}

/**
 * Where the app goes when onboarding completes. Current onboarding always
 * launches Check-up #0, then honors the first-session promise only after that
 * check-up. A missing assessment intent is an incomplete/legacy caller and
 * fails closed without a session route.
 */
export function onboardingCompletionRoute(
  completion: { assessmentIntent: 'start_now' | null },
  action: 'start_first_session' | 'schedule'
): OnboardingRoute {
  if (completion.assessmentIntent !== 'start_now') {
    return { assessmentFirst: false, startFirstSession: false };
  }
  return {
    assessmentFirst: true,
    startFirstSession: action === 'start_first_session',
  };
}

// ---------------------------------------------------------------------------
// Pre-session moment (in-context questions at their moment of effect, §8)
// ---------------------------------------------------------------------------

export type ProgrammePreSessionPrompt =
  | { kind: 'band_question'; title: string; body: string; yesLabel: string; noLabel: string }
  | { kind: 'doming_check'; title: string; body: string; yesLabel: string; noLabel: string };

/** Band question first, then the doming check — dev-shell order preserved. */
export function preSessionPrompt(
  state: ProgrammeState,
  plan: ProgrammeSessionPlan
): ProgrammePreSessionPrompt | null {
  if (shouldAskBandQuestion(state, plan)) {
    return {
      kind: 'band_question',
      title: 'Do you have a resistance band?',
      body: "Today's pulling exercise gets a free upgrade with a long band — books-in-a-backpack works meanwhile.",
      yesLabel: 'Yes, I have one',
      noLabel: 'Not yet',
    };
  }
  if (shouldShowDomingCheck(state, plan)) {
    return {
      kind: 'doming_check',
      title: 'One quick check before the floor work',
      body: "Lying on your back, lift your head: if you see a bulge or ridge down the middle of your tummy, tap the first option — we'll choose kinder core work.",
      yesLabel: 'I see a bulge',
      noLabel: 'All looks fine',
    };
  }
  return null;
}

/** Shown once after a positive doming check (once-only registry owns recurrence). */
export const PELVIC_PHYSIO_SIGNPOST_COPY = {
  title: 'Worth knowing',
  body: "A pelvic-health physiotherapist can help with this — it's common and very treatable. We've already adjusted your core work.",
  dismissLabel: 'Got it',
} as const;

// ---------------------------------------------------------------------------
// Effort check-in (C9) — the one answer promotion needs
// ---------------------------------------------------------------------------

export const PROGRAMME_EFFORT_CHECKIN_COPY = {
  title: 'How did that feel?',
  body: 'Could you have done more?',
  skipLabel: 'Skip',
} as const;

export const PROGRAMME_SESSION_RPE_OPTIONS: readonly { value: SessionRpe; label: string }[] = [
  { value: 1, label: 'I could do lots more' },
  { value: 3, label: 'I could do a few more' },
  { value: 5, label: 'Nothing left' },
];

// ---------------------------------------------------------------------------
// Post-session moment
// ---------------------------------------------------------------------------

export interface ProgrammePostSessionSurface {
  kind: 'gateway_teach';
  pattern: ProgrammePattern;
  toLevel: number;
  levelDisplayName: string;
  demoWatched: boolean;
  selfConfirmed: boolean;
  title: string;
  body: string;
  demoLabel: string;
  confirmLabel: string;
  laterLabel: string;
}

/**
 * The only post-session interruption is a gateway-locked promotion
 * (teach-only, C3 — never a camera verdict). Check-up offers belong on Home,
 * and routine completion returns there directly. Gateway locks are scanned in
 * PROGRAMME_PATTERNS order for determinism.
 */
export function postSessionSurface(
  state: ProgrammeState,
  decisions: Partial<Record<ProgrammePattern, PromotionDecision>>
): ProgrammePostSessionSurface | null {
  for (const pattern of PROGRAMME_PATTERNS) {
    const decision = decisions[pattern];
    if (!decision || decision.kind !== 'promotion_locked' || decision.reason !== 'gateway_incomplete') {
      continue;
    }
    const progress = state.ladders[pattern].gatewayProgress[decision.toLevel];
    const levelDisplayName = programmeDisplayName(
      getProgrammeLevel(pattern, decision.toLevel).primary.id
    );
    return {
      kind: 'gateway_teach',
      pattern,
      toLevel: decision.toLevel,
      levelDisplayName,
      demoWatched: progress?.demoWatched ?? false,
      selfConfirmed: progress?.selfConfirmed ?? false,
      title: `You've earned the next level: ${levelDisplayName}`,
      body: "It's a technique level, so two quick steps unlock it: watch the short demo, then confirm you feel ready. No camera involved.",
      demoLabel: 'I watched the demo',
      confirmLabel: "I feel ready — unlock it",
      laterLabel: 'Later',
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Level rows (Plan/Progress surfaces)
// ---------------------------------------------------------------------------

export interface ProgrammeLevelRow {
  pattern: ProgrammePattern;
  patternTitle: string;
  currentLevel: number;
  maxLevel: number;
  /** Plain-language current-level name from the naming layer, never an id. */
  levelDisplayName: string;
}

/** One row per pattern, stable PROGRAMME_PATTERNS order. */
export function programmeLevelRows(state: ProgrammeState): readonly ProgrammeLevelRow[] {
  return PROGRAMME_PATTERNS.map((pattern) => {
    const ladder = state.ladders[pattern];
    return {
      pattern,
      patternTitle: patternTitle(pattern),
      currentLevel: ladder.currentLevel,
      maxLevel: maxProgrammeLevel(pattern),
      levelDisplayName: programmeDisplayName(
        getProgrammeLevel(pattern, ladder.currentLevel).primary.id
      ),
    };
  });
}

// ---------------------------------------------------------------------------
// Copy helpers
// ---------------------------------------------------------------------------

const PATTERN_TITLES: Record<ProgrammePattern, string> = {
  squat: 'Squat',
  hinge: 'Hinge',
  push: 'Push',
  pull: 'Pull',
  core: 'Core',
};

export function patternTitle(pattern: ProgrammePattern): string {
  return PATTERN_TITLES[pattern];
}

function listSentence(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}
