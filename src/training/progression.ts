/**
 * Progression engine v1 — deterministic, fully replayable, NO machine learning
 * (V1 non-goal). After a session it decides, per exercise family, whether to
 * promote to the next level, hold, or demote — and tracks a per-exercise
 * velocity trend so promotion can require power at/above the user's own
 * baseline, not just rep completion.
 *
 * Rules (CLAUDE.md "evidence and routine", not streaks):
 *   PROMOTE  — every set reached its target at full range, NO autoregulation
 *              trigger, and (for velocity items) mean velocity ≥ the personal
 *              trend. The first time, with no trend yet, full completion alone
 *              promotes.
 *   DEMOTE   — the user struggled: sets fell short with NO autoregulation (the
 *              load was simply too hard), OR autoregulation fired very early
 *              (power gave out well before the target — the level is too hard).
 *   HOLD     — everything else, including a normal mid/late autoregulation stop
 *              (a good, complete effort) and any session with no usable
 *              measurement (we never demote on a tracking failure or a skip).
 *
 * Levels are clamped to the family's registered ladder bounds. State is a plain
 * record so it serialises trivially (see training/store.ts).
 */

import { ExerciseDefinition, SetResult, familyLevels } from '../exercises';
import { TrainingItemResult, TrainingSessionResult } from './sessionPlayer';

export interface ProgressionState {
  /** Current level per family (absent ⇒ level 1). */
  levels: Record<string, number>;
  /** Recent per-exercise mean velocities (oldest→newest), the trend source. */
  velHistory: Record<string, number[]>;
}

export function initialProgressionState(): ProgressionState {
  return { levels: {}, velHistory: {} };
}

export interface ProgressionConfig {
  /** How many recent sessions form an exercise's velocity trend. */
  trendWindow: number;
  /** Promote needs meanVel ≥ trend × this (a small tolerance for "at" trend). */
  velPromoteFraction: number;
  /** Autoregulation below this fraction of the rep target counts as "early". */
  earlyAutoregFraction: number;
}

export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
  trendWindow: 3,
  velPromoteFraction: 0.98,
  earlyAutoregFraction: 0.5,
};

export type ProgressionAction = 'promote' | 'hold' | 'demote';

/** Per-exercise distilled session outcome the rules reason over. */
export interface ExerciseSessionSummary {
  exerciseId: string;
  family: string;
  level: number;
  kind: 'reps' | 'hold' | 'rom';
  /** Mean of finite per-set mean velocities (reps kind); NaN otherwise. */
  meanVel: number;
  /** Reps credited across all sets (reps kind); 0 otherwise. */
  totalReps: number;
  /** Prescribed reps across all sets (reps kind); 0 otherwise. */
  targetReps: number;
  /** Every prescribed set reached its rep/hold/rom target. */
  reachedAllTargets: boolean;
  /** Any set ended on velocity autoregulation. */
  autoregulated: boolean;
  /** The session produced a usable measurement (else we can't judge → hold). */
  measured: boolean;
}

/** Distil a played item into the progression summary. */
export function summarizeItem(item: TrainingItemResult, def: ExerciseDefinition): ExerciseSessionSummary {
  const sets = item.sets;
  const prescribed = def.prescription.sets;
  const ranAll = item.status === 'completed' && sets.length >= prescribed;
  const base = { exerciseId: def.id, family: def.family, level: def.level, kind: def.kind };

  if (def.kind === 'reps') {
    const totalReps = sum(sets.map((s) => s.reps));
    const targetReps = (def.prescription.repsPerSet ?? 0) * prescribed;
    const vels = sets.map((s) => s.meanVel).filter(Number.isFinite);
    return {
      ...base,
      meanVel: vels.length > 0 ? sum(vels) / vels.length : NaN,
      totalReps,
      targetReps,
      reachedAllTargets: ranAll && sets.every((s) => s.reachedTarget),
      autoregulated: sets.some((s) => s.autoregulated),
      measured: totalReps > 0,
    };
  }
  if (def.kind === 'hold') {
    return {
      ...base,
      meanVel: NaN,
      totalReps: 0,
      targetReps: 0,
      reachedAllTargets: ranAll && sets.every((s) => s.reachedTarget),
      autoregulated: false,
      measured: sets.some((s) => Number.isFinite(s.holdSec) && s.holdSec > 0),
    };
  }
  // rom
  return {
    ...base,
    meanVel: NaN,
    totalReps: 0,
    targetReps: 0,
    reachedAllTargets: ranAll && sets.every((s) => Number.isFinite(s.romPeak)),
    autoregulated: false,
    measured: sets.some((s) => Number.isFinite(s.romPeak)),
  };
}

/** Mean of an exercise's recent velocities; NaN when there's no history yet. */
export function velocityTrend(state: ProgressionState, exerciseId: string, window: number): number {
  const h = state.velHistory[exerciseId];
  if (!h || h.length === 0) return NaN;
  const recent = h.slice(-window);
  return sum(recent) / recent.length;
}

/** The pure decision for one family, given the prior trend. */
export function decideLevel(
  currentLevel: number,
  maxLevel: number,
  s: ExerciseSessionSummary,
  trend: number,
  config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
): { level: number; action: ProgressionAction } {
  if (!s.measured) return { level: currentLevel, action: 'hold' };

  const earlyAutoreg =
    s.autoregulated && s.kind === 'reps' && s.totalReps < s.targetReps * config.earlyAutoregFraction;
  const struggled = !s.autoregulated && !s.reachedAllTargets;
  if (earlyAutoreg || struggled) {
    return { level: Math.max(1, currentLevel - 1), action: 'demote' };
  }

  const velOk =
    s.kind !== 'reps' || !Number.isFinite(trend) || s.meanVel >= trend * config.velPromoteFraction;
  if (s.reachedAllTargets && !s.autoregulated && velOk) {
    return { level: Math.min(maxLevel, currentLevel + 1), action: 'promote' };
  }
  return { level: currentLevel, action: 'hold' };
}

/**
 * Apply one finished session to the progression state — pure: returns a NEW
 * state (current levels updated per family, velocity history appended). The
 * trend each decision uses is the history BEFORE this session's velocity is
 * recorded, so a promotion compares against the established baseline.
 */
export function applySession(
  state: ProgressionState,
  summaries: readonly ExerciseSessionSummary[],
  config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
): ProgressionState {
  const levels: Record<string, number> = { ...state.levels };
  const velHistory: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(state.velHistory)) velHistory[k] = v.slice();

  for (const s of summaries) {
    const max = Math.max(1, familyLevels(s.family).length);
    const current = levels[s.family] ?? s.level;
    const trend = velocityTrend(state, s.exerciseId, config.trendWindow);
    levels[s.family] = decideLevel(current, max, s, trend, config).level;

    if (s.kind === 'reps' && Number.isFinite(s.meanVel)) {
      const h = (velHistory[s.exerciseId] ?? []).concat(s.meanVel);
      // Keep a little more than the trend window so older context isn't lost abruptly.
      velHistory[s.exerciseId] = h.slice(-config.trendWindow * 2);
    }
  }
  return { levels, velHistory };
}

/** Convenience: distil a whole session and apply it (skips can't be summarised). */
export function applySessionResult(
  state: ProgressionState,
  session: TrainingSessionResult,
  resolve: (exerciseId: string) => ExerciseDefinition,
  config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
): ProgressionState {
  const summaries = session.items
    .filter((i) => i.status === 'completed')
    .map((i) => summarizeItem(i, resolve(i.exerciseId)));
  return applySession(state, summaries, config);
}

function sum(xs: readonly number[]): number {
  let t = 0;
  for (const x of xs) t += x;
  return t;
}
