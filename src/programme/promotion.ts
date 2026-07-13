/**
 * Promotion / demotion engine — exercise-ladders-spec v0.2 §12 (normative
 * pseudocode) under the 2026-07-06 rulings.
 *
 * SEMANTIC OF RECORD (C10): promotion is an ADHERENCE/EFFORT decision over
 * REPORTED data — reported reps/seconds and the effort answer — never a
 * measurement. Camera check-ups are the measured reconciliation point
 * (applyCheckupPlacement, upward or downward). Reported values never enter
 * measurement surfaces (TDD-ADDENDUM N5).
 *
 * Rules implemented (spec §12, with C3's teach-only gateways):
 *   promote        top of range on 2 consecutive sessions AND effort in
 *                  {none, a_few} AND no pain flag in the last 2 sessions AND
 *                  (next level not gateway OR gateway complete) AND
 *                  cross-ladder prereqs met
 *   fast-promote   top of range AND effort == lots (1 session)
 *   entry-promote  entry level (L1–L2) AND top of range (1 session)
 *   hold+reduce    effort == none at bottom of range twice in a row
 *   regress        pain flag (→ last pain-free level) OR 14+ days inactive
 *                  (→ one level down on EVERY ladder, once per gap)
 *
 * Between check-ups promotions are single-step by construction (+1 only);
 * multi-step jumps happen only via applyCheckupPlacement.
 *
 * DELIBERATE AMENDMENT TO §12 (founder ruling, 2026-07-06): an unanswered
 * effort question blocks EVERY promotion path — including entry-promotion,
 * which the spec pseudocode gates on top-of-range alone. Stricter than the
 * spec, chosen as the conservative default: v1 effort arrives from the
 * session-level RPE check-in, and a skipped check-in must never level
 * anyone up.
 *
 * Voice never announces raw logic — promotions are framed as earned level-ups,
 * regressions as "easing back in" (copy lives with the session layer).
 */

import { getProgrammeLevel, maxProgrammeLevel, PROGRAMME_LADDERS } from './ladders';
import type {
  GatewayProgress,
  PatternLadderState,
  PatternSessionOutcome,
  ProgrammeLevel,
  ProgrammePattern,
  ProgrammeState,
  PromotionEvaluation,
} from './types';

export interface PromotionConfig {
  /** Consecutive top-of-range sessions required for a standard promotion. */
  standardConsecutiveSessions: number;
  /** Consecutive bottom-of-range 'none' sessions that trigger hold+reduce. */
  bottomNoneSessionsForHoldReduce: number;
  /** Days without any session before the one-level-everywhere regression. */
  inactivityRegressionDays: number;
}

export const DEFAULT_PROMOTION_CONFIG: PromotionConfig = {
  standardConsecutiveSessions: 2,
  bottomNoneSessionsForHoldReduce: 2,
  inactivityRegressionDays: 14,
};

export function freshPatternLadderState(
  pattern: ProgrammePattern,
  startLevel: number
): PatternLadderState {
  return {
    pattern,
    currentLevel: clampLevel(pattern, startLevel),
    consecutiveTopSessions: 0,
    consecutiveBottomNoneSessions: 0,
    recentPainFlags: [],
    lastPainFreeLevel: null,
    gatewayProgress: {},
    bonusSetSuspended: false,
    currentRepTarget: null,
    lastPerformedAtIso: null,
  };
}

// ---------------------------------------------------------------------------
// Gateway progress (teach-only, C3)
// ---------------------------------------------------------------------------

const EMPTY_GATEWAY_PROGRESS: GatewayProgress = {
  demoWatched: false,
  rehearsalExposures: 0,
  selfConfirmed: false,
};

export function gatewayProgressFor(state: PatternLadderState, level: number): GatewayProgress {
  return state.gatewayProgress[level] ?? { ...EMPTY_GATEWAY_PROGRESS };
}

export function isGatewayComplete(state: PatternLadderState, level: ProgrammeLevel): boolean {
  if (!level.gateway) return true;
  const progress = gatewayProgressFor(state, level.level);
  return (
    progress.demoWatched &&
    progress.selfConfirmed &&
    progress.rehearsalExposures >= level.gateway.requiredRehearsalExposures
  );
}

export function recordGatewayDemoWatched(
  state: PatternLadderState,
  level: number
): PatternLadderState {
  return withGatewayProgress(state, level, (p) => ({ ...p, demoWatched: true }));
}

export function recordGatewaySelfConfirmation(
  state: PatternLadderState,
  level: number
): PatternLadderState {
  return withGatewayProgress(state, level, (p) => ({ ...p, selfConfirmed: true }));
}

/**
 * Credits one rehearsal exposure (a movement-prep drill performed this
 * session) to every gateway level in this ladder whose rehearsal drill
 * matches. Exposures accrue from day one, long before the user reaches the
 * gateway — that is the point of the rehearsal (spec §4).
 */
export function recordRehearsalExposure(
  state: PatternLadderState,
  drillId: string
): PatternLadderState {
  let next = state;
  for (const level of PROGRAMME_LADDERS[state.pattern].levels) {
    if (level.gateway?.rehearsalDrillId === drillId) {
      next = withGatewayProgress(next, level.level, (p) => ({
        ...p,
        rehearsalExposures: p.rehearsalExposures + 1,
      }));
    }
  }
  return next;
}

function withGatewayProgress(
  state: PatternLadderState,
  level: number,
  update: (p: GatewayProgress) => GatewayProgress
): PatternLadderState {
  const current = gatewayProgressFor(state, level);
  return {
    ...state,
    gatewayProgress: { ...state.gatewayProgress, [level]: update(current) },
  };
}

// ---------------------------------------------------------------------------
// Cross-ladder prerequisites
// ---------------------------------------------------------------------------

export function crossLadderPrereqMet(
  level: ProgrammeLevel,
  allStates: Record<ProgrammePattern, PatternLadderState>
): boolean {
  const prereq = level.crossLadderPrereq;
  if (!prereq) return true;
  const target = allStates[prereq.pattern];
  if (target.currentLevel > prereq.level) return true;
  if (target.currentLevel < prereq.level) return false;
  return isGatewayComplete(target, getProgrammeLevel(prereq.pattern, prereq.level));
}

// ---------------------------------------------------------------------------
// Per-session evaluation (§12 core)
// ---------------------------------------------------------------------------

export function evaluatePatternOutcome(
  state: PatternLadderState,
  outcome: PatternSessionOutcome,
  allStates: Record<ProgrammePattern, PatternLadderState>,
  config: PromotionConfig = DEFAULT_PROMOTION_CONFIG
): PromotionEvaluation {
  const level = getProgrammeLevel(state.pattern, state.currentLevel);

  // A session at another level (e.g. a day-scoped easier variant) carries
  // pain/recency information but never feeds promotion counters.
  if (outcome.levelPerformed !== state.currentLevel) {
    return {
      nextState: recordHistoryOnly(state, outcome),
      decision: { kind: 'not_applicable', reason: 'level_mismatch' },
    };
  }

  // Pain wins over everything: regress to the last pain-free level.
  if (outcome.painFlag) {
    const target = clampLevel(
      state.pattern,
      Math.min(state.lastPainFreeLevel ?? state.currentLevel - 1, state.currentLevel - 1)
    );
    return {
      nextState: {
        ...recordHistoryOnly(state, outcome),
        currentLevel: target,
        consecutiveTopSessions: 0,
        consecutiveBottomNoneSessions: 0,
        currentRepTarget: null,
      },
      decision: { kind: 'regress', toLevel: target, reason: 'pain' },
    };
  }

  const top = allSetsAtOrAbove(outcome, level, level.scheme.max);
  const bottomNone =
    outcome.effort === 'none' && outcome.sets.every((s) => s.achieved <= level.scheme.min);

  const consecutiveTopSessions = top ? state.consecutiveTopSessions + 1 : 0;
  const consecutiveBottomNoneSessions = bottomNone
    ? state.consecutiveBottomNoneSessions + 1
    : 0;

  const base: PatternLadderState = {
    ...recordHistoryOnly(state, outcome),
    consecutiveTopSessions,
    consecutiveBottomNoneSessions,
    // Hold+reduce lifts once the top of the range is rebuilt.
    bonusSetSuspended: top ? false : state.bonusSetSuspended,
  };

  const promoteReason = promotionReason(state, outcome, level, top, consecutiveTopSessions, config);
  if (promoteReason) {
    const nextLevelNumber = state.currentLevel + 1;
    if (nextLevelNumber > maxProgrammeLevel(state.pattern)) {
      // Top of the ladder: progression is load, not harder gymnastics (§3).
      return { nextState: base, decision: { kind: 'hold' } };
    }
    const nextLevel = getProgrammeLevel(state.pattern, nextLevelNumber);
    if (!isGatewayComplete(state, nextLevel)) {
      return {
        nextState: base,
        decision: {
          kind: 'promotion_locked',
          toLevel: nextLevelNumber,
          reason: 'gateway_incomplete',
        },
      };
    }
    if (!crossLadderPrereqMet(nextLevel, allStates)) {
      return {
        nextState: base,
        decision: {
          kind: 'promotion_locked',
          toLevel: nextLevelNumber,
          reason: 'cross_ladder_prereq_unmet',
        },
      };
    }
    return {
      nextState: {
        ...base,
        currentLevel: nextLevelNumber,
        consecutiveTopSessions: 0,
        consecutiveBottomNoneSessions: 0,
        bonusSetSuspended: false,
        currentRepTarget: null,
      },
      decision: { kind: 'promote', toLevel: nextLevelNumber, reason: promoteReason },
    };
  }

  if (consecutiveBottomNoneSessions >= config.bottomNoneSessionsForHoldReduce) {
    return {
      nextState: { ...base, bonusSetSuspended: true, consecutiveBottomNoneSessions: 0 },
      decision: { kind: 'hold_reduce' },
    };
  }

  return { nextState: base, decision: { kind: 'hold' } };
}

function promotionReason(
  state: PatternLadderState,
  outcome: PatternSessionOutcome,
  level: ProgrammeLevel,
  top: boolean,
  consecutiveTopSessions: number,
  config: PromotionConfig
): 'standard' | 'fast' | 'entry' | null {
  if (!top) return null;
  // Unanswered effort never promotes — any path (see module header: a
  // deliberate, stricter-than-§12 amendment; conservative default).
  if (outcome.effort === null) return null;
  // Entry levels (L1–L2): one session at top of range — early boredom is a
  // bigger risk than early progression (§1).
  if (level.isEntryLevel) return 'entry';
  if (outcome.effort === 'lots') return 'fast';
  const previousSessionPainFree = state.recentPainFlags.length === 0 || !lastOf(state.recentPainFlags);
  if (
    consecutiveTopSessions >= config.standardConsecutiveSessions &&
    (outcome.effort === 'none' || outcome.effort === 'a_few') &&
    previousSessionPainFree
  ) {
    return 'standard';
  }
  return null;
}

function allSetsAtOrAbove(
  outcome: PatternSessionOutcome,
  level: ProgrammeLevel,
  threshold: number
): boolean {
  return (
    outcome.sets.length >= level.sets && outcome.sets.every((s) => s.achieved >= threshold)
  );
}

function recordHistoryOnly(
  state: PatternLadderState,
  outcome: PatternSessionOutcome
): PatternLadderState {
  const recentPainFlags = [...state.recentPainFlags, outcome.painFlag].slice(-2);
  return {
    ...state,
    recentPainFlags,
    lastPainFreeLevel: outcome.painFlag ? state.lastPainFreeLevel : outcome.levelPerformed,
    lastPerformedAtIso: outcome.performedAtIso,
  };
}

// ---------------------------------------------------------------------------
// Inactivity regression (14+ days → one level down everywhere, once per gap)
// ---------------------------------------------------------------------------

export function applyInactivityRegressionIfDue(
  state: ProgrammeState,
  nowIso: string,
  config: PromotionConfig = DEFAULT_PROMOTION_CONFIG
): { state: ProgrammeState; applied: boolean } {
  const last = state.lastSessionAtIso;
  if (!last) return { state, applied: false };
  if (state.inactivityRegressionAppliedForGapEndingAtIso === last) return { state, applied: false };
  const gapDays = (Date.parse(nowIso) - Date.parse(last)) / (24 * 60 * 60 * 1000);
  if (!Number.isFinite(gapDays) || gapDays < config.inactivityRegressionDays) {
    return { state, applied: false };
  }
  const ladders = { ...state.ladders };
  for (const pattern of Object.keys(ladders) as ProgrammePattern[]) {
    const ladder = ladders[pattern];
    ladders[pattern] = {
      ...ladder,
      currentLevel: clampLevel(pattern, ladder.currentLevel - 1),
      consecutiveTopSessions: 0,
      consecutiveBottomNoneSessions: 0,
      currentRepTarget: null,
    };
  }
  return {
    state: { ...state, ladders, inactivityRegressionAppliedForGapEndingAtIso: last },
    applied: true,
  };
}

// ---------------------------------------------------------------------------
// Check-up re-placement — the measured reconciliation point (C10)
// ---------------------------------------------------------------------------

/**
 * Applies a new per-pattern placement from a completed assessment/check-up.
 * `upwardOnly` is the deferred-assessment completion rule (onboarding spec
 * §6); check-ups reconcile in both directions. This is the only path that
 * may move more than one level at a time.
 */
export function applyCheckupPlacement(
  state: ProgrammeState,
  placement: Partial<Record<ProgrammePattern, number>>,
  options: { upwardOnly: boolean }
): ProgrammeState {
  const ladders = { ...state.ladders };
  for (const pattern of Object.keys(ladders) as ProgrammePattern[]) {
    const target = placement[pattern];
    if (typeof target !== 'number') continue;
    const ladder = ladders[pattern];
    const clamped = clampLevel(pattern, target);
    const nextLevel = options.upwardOnly ? Math.max(ladder.currentLevel, clamped) : clamped;
    if (nextLevel === ladder.currentLevel) continue;
    ladders[pattern] = {
      ...ladder,
      currentLevel: nextLevel,
      consecutiveTopSessions: 0,
      consecutiveBottomNoneSessions: 0,
      currentRepTarget: null,
    };
  }
  return { ...state, ladders };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function clampLevel(pattern: ProgrammePattern, level: number): number {
  return Math.min(Math.max(1, Math.round(level)), maxProgrammeLevel(pattern));
}

function lastOf<T>(values: readonly T[]): T | undefined {
  return values.length > 0 ? values[values.length - 1] : undefined;
}
