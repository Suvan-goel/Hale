/**
 * Persisted onboarding-funnel event: local-only instrumentation for the
 * install → accepted-baseline funnel (the evidence behind the 2026-07-06
 * baseline-first and B1 safety-step rulings). Same discipline as the
 * session-funnel log: schema-versioned, append-only (one file per event, no
 * rewrite races), kept in the telemetry scope so guest adoption and privacy
 * erasure treat it exactly like session funnels. Local telemetry only — no
 * remote analytics, per ruling.
 *
 * Privacy: events are FUNNEL LOCATIONS, never answers. `advisory_required`
 * counts the safety-advisory surface becoming due — deliberately named for
 * the surface, not the heart answer — and no goal category, joint flag, or
 * health value is ever recorded here. Analysis note: events are transition
 * counts; Back-and-redo can re-fire one, so rate analysis should dedupe by
 * first occurrence per event within an attempt (timestamps make this easy).
 */

import {
  currentOnboardingStep,
  type ProgrammeOnboardingFlowState,
} from '../programme/onboarding/flow';

export const ONBOARDING_FUNNEL_SCHEMA_VERSION = 1;

export const ONBOARDING_FUNNEL_EVENTS = [
  /** Continued past the Welcome cover. */
  'welcome_continued',
  /** Chose a life goal (which one is never recorded). */
  'goal_answered',
  /** Took the explicit "I'll decide later" path. */
  'goal_skipped',
  /** The required safety-step advisory became part of this user's flow. */
  'advisory_required',
  /** Both health answers recorded (any combination of answer/skip). */
  'safety_questions_completed',
  /** Confirmed the safety step on the advisory surface. */
  'advisory_confirmed',
  /** Reached the final start surface. */
  'start_screen_reached',
  /** Opened the non-counted session preview. */
  'preview_opened',
  /** Entered the baseline check-up (from onboarding or the Home CTA). */
  'checkup_started',
  /** Left the baseline check-up before an accepted result. */
  'baseline_checkup_left',
  /** The activation goal: an accepted baseline check-up. */
  'baseline_accepted',
] as const;

export type OnboardingFunnelEvent = (typeof ONBOARDING_FUNNEL_EVENTS)[number];

export interface StoredOnboardingFunnelEvent {
  schemaVersion: number;
  kind: 'onboarding';
  event: OnboardingFunnelEvent;
  /** Wall-clock moment the event fired. */
  atIso: string;
}

export function buildOnboardingFunnelEvent(input: {
  event: OnboardingFunnelEvent;
  atIso: string;
}): StoredOnboardingFunnelEvent {
  return {
    schemaVersion: ONBOARDING_FUNNEL_SCHEMA_VERSION,
    kind: 'onboarding',
    event: input.event,
    atIso: input.atIso,
  };
}

export function serializeOnboardingFunnelEvent(record: StoredOnboardingFunnelEvent): string {
  return JSON.stringify(record);
}

/** Returns null for anything unreadable, foreign, or from an unknown schema. */
export function deserializeOnboardingFunnelEvent(
  json: string
): StoredOnboardingFunnelEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const rec = parsed as Partial<StoredOnboardingFunnelEvent>;
  if (rec.schemaVersion !== ONBOARDING_FUNNEL_SCHEMA_VERSION) return null;
  if (rec.kind !== 'onboarding') return null;
  if (typeof rec.atIso !== 'string') return null;
  if (!ONBOARDING_FUNNEL_EVENTS.includes(rec.event as OnboardingFunnelEvent)) return null;
  return {
    schemaVersion: ONBOARDING_FUNNEL_SCHEMA_VERSION,
    kind: 'onboarding',
    event: rec.event as OnboardingFunnelEvent,
    atIso: rec.atIso,
  };
}

/**
 * Pure flow-state transition → funnel events. The shell applies every
 * onboarding flow-state change through this so the funnel can never disagree
 * with what the flow machine actually did. Undo produces no events (answers
 * only ever count when they appear); the moment-of-effect events
 * (preview/check-up/baseline) are logged by the shell at their own sites.
 */
export function onboardingFunnelEventsForTransition(
  prev: ProgrammeOnboardingFlowState,
  next: ProgrammeOnboardingFlowState
): OnboardingFunnelEvent[] {
  const events: OnboardingFunnelEvent[] = [];
  if (!prev.acknowledged.includes('welcome') && next.acknowledged.includes('welcome')) {
    events.push('welcome_continued');
  }
  if (prev.answers.lifeGoal === null && next.answers.lifeGoal !== null) {
    events.push(next.answers.lifeGoal === 'skipped' ? 'goal_skipped' : 'goal_answered');
  }
  if (prev.answers.b1Heart !== 'yes' && next.answers.b1Heart === 'yes') {
    events.push('advisory_required');
  }
  if (prev.answers.b3Joints === null && next.answers.b3Joints !== null) {
    events.push('safety_questions_completed');
  }
  if (!prev.acknowledged.includes('b1_advisory') && next.acknowledged.includes('b1_advisory')) {
    events.push('advisory_confirmed');
  }
  if (
    currentOnboardingStep(prev) !== 'assessment_offer' &&
    currentOnboardingStep(next) === 'assessment_offer'
  ) {
    events.push('start_screen_reached');
  }
  return events;
}
