/**
 * Post-onboarding surfaces (onboarding-spec §5/§8 under the rulings): the
 * T1/T3 camera adapter, the assessment re-offer policy, the in-context
 * questions (band at the Pull L4 unlock; doming at the first core demo), and
 * the once-only surface registry (signposts render once, dismissible, never
 * recurring — membership in oneTimeSurfacesShown is permanent).
 */

import type { ChairRiseV2Result } from '../movements/chairRiseV2';
import type { OneLegBalanceV2Result } from '../movements/oneLegBalanceV2';
import type { AssessmentInputs } from './placement';
import type { ProgrammeSessionPlan } from './session';
import type { ProgrammeState } from './types';

// ---------------------------------------------------------------------------
// T1/T3 adapter — existing camera protocols → placement inputs
// ---------------------------------------------------------------------------

/**
 * Maps the EXISTING measured protocols onto Check-up #0 inputs: T3 from the
 * chair-rise result (reps; hand-assist read from result flags — absent
 * detection defaults to false, and the −1 easy start still cushions it),
 * T1 from the WORSE side of the two balance runs (one side available → that
 * side). T2 stays deferred. Pure mapping; the camera never judges form.
 */
export function assessmentInputsFromV2Results(input: {
  chairRise?: Pick<ChairRiseV2Result, 'reps' | 'flags'> | null;
  balanceLeft?: Pick<OneLegBalanceV2Result, 'bestHoldSec'> | null;
  balanceRight?: Pick<OneLegBalanceV2Result, 'bestHoldSec'> | null;
}): AssessmentInputs {
  const out: AssessmentInputs = {};
  if (input.chairRise && Number.isFinite(input.chairRise.reps)) {
    out.t3 = {
      reps: input.chairRise.reps,
      handsUsed: (input.chairRise.flags ?? []).some((flag) => /hand/i.test(flag)),
    };
  }
  const holds = [input.balanceLeft?.bestHoldSec, input.balanceRight?.bestHoldSec].filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  if (holds.length > 0) {
    out.t1 = { worseSideSeconds: Math.min(...holds) };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Assessment re-offer policy (§8)
// ---------------------------------------------------------------------------

export type AssessmentReoffer =
  | 'none'
  | 'deferred_reoffer' // end of session 1 / start of session 2
  | 'skipped_warm_reoffer' // week 1 elapsed OR 2 sessions done, whichever first
  | 'post_gp_reoffer'; // B1 bypass lifts only on gp_confirmed

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function assessmentReoffer(state: ProgrammeState, nowIso: string): AssessmentReoffer {
  const { assessmentStatus, gentleStartActive, gpConfirmed } = state.profile;
  // B1 bypass: NO assessment surface exists anywhere until gp_confirmed —
  // max-effort testing contradicts the flag (conformance Q1).
  if (assessmentStatus === 'bypassed_b1' || (gentleStartActive && !gpConfirmed)) {
    return assessmentStatus === 'bypassed_b1' && gpConfirmed ? 'post_gp_reoffer' : 'none';
  }
  if (assessmentStatus === 'deferred' && state.completedSessionCount >= 1) {
    return 'deferred_reoffer';
  }
  if (assessmentStatus === 'skipped' && state.profile.consentHealthData) {
    // §4 decline row excludes consent-declined users from any re-offer.
    // Warm re-offer: week 1 elapsed OR 2 completed sessions, whichever first
    // (founder trigger, 2026-07-06). The card renders once (once-only
    // registry); Settings/home remains the permanent entry point.
    const weekElapsed =
      state.onboardingCompletedAtIso !== null &&
      Date.parse(nowIso) - Date.parse(state.onboardingCompletedAtIso) >= WEEK_MS;
    if (weekElapsed || state.completedSessionCount >= 2) return 'skipped_warm_reoffer';
  }
  return 'none';
}

// ---------------------------------------------------------------------------
// Once-only surfaces (signposts render once, dismissible, never recurring)
// ---------------------------------------------------------------------------

export type OneTimeSurfaceId =
  | 'doming_check'
  | 'pelvic_physio_signpost'
  | 'band_question'
  | 'skipped_warm_reoffer_card';

export function surfaceAlreadyShown(state: ProgrammeState, surface: OneTimeSurfaceId): boolean {
  return state.profile.oneTimeSurfacesShown.includes(surface);
}

export function markSurfaceShown(state: ProgrammeState, surface: OneTimeSurfaceId): ProgrammeState {
  if (surfaceAlreadyShown(state, surface)) return state;
  return {
    ...state,
    profile: {
      ...state.profile,
      oneTimeSurfacesShown: [...state.profile.oneTimeSurfacesShown, surface],
    },
  };
}

// ---------------------------------------------------------------------------
// In-context questions (asked at their moment of effect, never at onboarding)
// ---------------------------------------------------------------------------

/** Band question fires at the Pull L4 unlock moment, once, while unanswered. */
export function shouldAskBandQuestion(state: ProgrammeState, plan: ProgrammeSessionPlan): boolean {
  if (state.profile.hasBand !== null || surfaceAlreadyShown(state, 'band_question')) return false;
  return plan.main.some((exercise) => exercise.pattern === 'pull' && exercise.level >= 4);
}

export function recordBandAnswer(state: ProgrammeState, hasBand: boolean): ProgrammeState {
  const marked = markSurfaceShown(state, 'band_question');
  return { ...marked, profile: { ...marked.profile, hasBand } };
}

/** Doming check fires at the first core exercise demo, once (§8). */
export function shouldShowDomingCheck(state: ProgrammeState, plan: ProgrammeSessionPlan): boolean {
  if (surfaceAlreadyShown(state, 'doming_check') || state.profile.diastasisFlag) return false;
  return plan.main.some((exercise) => exercise.pattern === 'core');
}

/**
 * Doming reported → diastasis branch armed + the pelvic-health physio
 * signpost queued exactly once (dismissible; never recurs — Q3).
 */
export function recordDomingCheck(
  state: ProgrammeState,
  domingSeen: boolean
): { state: ProgrammeState; showPhysioSignpost: boolean } {
  let next = markSurfaceShown(state, 'doming_check');
  if (!domingSeen) return { state: next, showPhysioSignpost: false };
  next = { ...next, profile: { ...next.profile, diastasisFlag: true } };
  const showPhysioSignpost = !surfaceAlreadyShown(next, 'pelvic_physio_signpost');
  if (showPhysioSignpost) next = markSurfaceShown(next, 'pelvic_physio_signpost');
  return { state: next, showPhysioSignpost };
}
