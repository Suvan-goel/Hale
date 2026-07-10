/**
 * Post-onboarding surfaces (onboarding-spec §5/§8 under the rulings): the
 * T1/T3 camera adapter, the assessment re-offer policy, the in-context
 * questions (band at the Pull L4 unlock; doming at the first core demo), and
 * the once-only surface registry (signposts render once, dismissible, never
 * recurring — membership in oneTimeSurfacesShown is permanent).
 */

import type { CheckUp } from '../checkup';
import type { MovementProfileV2BatteryMovement } from '../movementProfileV2/internalCheckupFlow';
import { CHAIR_RISE_V2_ID, ONE_LEG_BALANCE_V2_ID } from '../movements';
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

/**
 * Check-up #0 protocol scope (founder ruling 2026-07-06): TWO protocols only,
 * gentle-first — single-leg balance, then the 30-second chair rise (max
 * effort last), behind a fixed guided warm-up and followed by the optional
 * Everyday Clarity appendix. The same core protocol is used at baseline and
 * every four-week re-test. The legacy full battery is never
 * presented at Check-up #0 or the routine programme-v2 check-ups; it may
 * return later only as an explicit opt-in "full movement check". Any
 * assessment host MUST consume this sequence — pinned by test.
 */
export const CHECKUP_ZERO_PROTOCOL_SEQUENCE = [
  ONE_LEG_BALANCE_V2_ID,
  CHAIR_RISE_V2_ID,
] as const;

/**
 * The pinned scope constant translated into coordinator battery tokens —
 * Check-up #0 AND the routine 4–6-week programme-v2 check-ups construct
 * their battery from this (single source of scope truth). Unknown ids are
 * construction-time errors.
 */
export function checkupZeroBatterySequence(): readonly MovementProfileV2BatteryMovement[] {
  return CHECKUP_ZERO_PROTOCOL_SEQUENCE.map((movementId) => {
    if (movementId === ONE_LEG_BALANCE_V2_ID) return 'balance' as const;
    if (movementId === CHAIR_RISE_V2_ID) return 'chair' as const;
    throw new Error(`no battery movement for Check-up #0 protocol '${movementId}'`);
  });
}

/**
 * Extracts T1/T3 from completed check-up items (the two-protocol Check-up #0
 * host; also reads any legacy full-battery record — extra items are simply
 * ignored). Items without a usable result are absent; placement then falls
 * back to activity prior for that ladder.
 */
export function assessmentInputsFromCheckUp(checkUp: Pick<CheckUp, 'items'>): AssessmentInputs {
  let chairRise: Pick<ChairRiseV2Result, 'reps' | 'flags'> | null = null;
  const holds: number[] = [];
  for (const item of checkUp.items) {
    if (!item.result) continue;
    if (item.movementId === CHAIR_RISE_V2_ID) {
      const result = item.result as unknown as ChairRiseV2Result;
      if (Number.isFinite(result.reps)) chairRise = { reps: result.reps, flags: result.flags };
    }
    if (item.movementId === ONE_LEG_BALANCE_V2_ID) {
      const result = item.result as unknown as OneLegBalanceV2Result;
      if (Number.isFinite(result.bestHoldSec)) holds.push(result.bestHoldSec);
    }
  }
  return assessmentInputsFromV2Results({
    chairRise,
    balanceLeft: holds.length > 0 ? { bestHoldSec: Math.min(...holds) } : null,
  });
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

/**
 * Routine check-up cadence (spec: every 4–6 weeks the minimal battery is the
 * measured reconciliation point, C10). Due at 28 days since the last applied
 * assessment; only ever for users whose assessment is 'done' (pre-done states
 * are owned by the re-offer policy below, and the B1 bypass by gp_confirmed).
 * Not once-only: the home surface simply shows while due — completing the
 * check-up restarts the clock via applyAssessmentPlacement.
 */
export const ROUTINE_CHECKUP_DUE_DAYS = 28;

export function routineCheckupDue(state: ProgrammeState, nowIso: string): boolean {
  const { assessmentStatus, lastAssessmentAtIso } = state.profile;
  if (assessmentStatus !== 'done' || !lastAssessmentAtIso) return false;
  const elapsed = Date.parse(nowIso) - Date.parse(lastAssessmentAtIso);
  return Number.isFinite(elapsed) && elapsed >= ROUTINE_CHECKUP_DUE_DAYS * 24 * 60 * 60 * 1000;
}

export function assessmentReoffer(state: ProgrammeState, nowIso: string): AssessmentReoffer {
  const { assessmentStatus, gentleStartActive, gpConfirmed } = state.profile;
  // B1 bypass: NO assessment surface exists anywhere until gp_confirmed —
  // max-effort testing contradicts the flag (conformance Q1).
  if (assessmentStatus === 'bypassed_b1' || (gentleStartActive && !gpConfirmed)) {
    return assessmentStatus === 'bypassed_b1' && gpConfirmed ? 'post_gp_reoffer' : 'none';
  }
  if (
    assessmentStatus === 'deferred' &&
    state.profile.consentHealthData &&
    state.completedSessionCount >= 1
  ) {
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
  | 'band_question';

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
