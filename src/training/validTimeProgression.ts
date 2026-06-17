import { getExercise } from '../exercises';
import type { SetResult } from '../exercises';
import type { TimerValidationMode, ValidTimeResult } from '../exercises/validTime';
import type { TrainingItemResult, TrainingSessionResult } from './sessionPlayer';

export const VALID_TIME_PROGRESSION_ENABLED = true;

export const MAX_STRONG_PAUSE_COUNT = 1;
export const STRONG_LONGEST_HOLD_RATIO = 0.8;
export const HIGH_PAUSE_COUNT = 3;
export const HIGH_WALL_TIME_RATIO = 1.6;
export const HIGH_TRACKING_LOSS_RATIO = 0.2;

export type ValidTimeProgressionSignal =
  | 'strong'
  | 'completed_with_resets'
  | 'incomplete'
  | 'tracking_uncertain'
  | 'not_applicable';

export interface ValidTimeProgressionSummary extends ValidTimeResult {
  signal: ValidTimeProgressionSignal;
  setCount: number;
}

export interface ValidTimeProgressionConfig {
  validTimeProgressionEnabled: boolean;
}

export const DEFAULT_VALID_TIME_PROGRESSION_CONFIG: ValidTimeProgressionConfig = {
  validTimeProgressionEnabled: VALID_TIME_PROGRESSION_ENABLED,
};

export interface ValidTimeSessionSummaryCard {
  exerciseId: string;
  title: string;
  lines: readonly string[];
  signal: Exclude<ValidTimeProgressionSignal, 'not_applicable'>;
}

export function classifyValidTimePerformance(
  validTime: ValidTimeResult | null | undefined,
  targetSeconds: number = validTime?.targetValidSeconds ?? NaN
): ValidTimeProgressionSignal {
  if (!validTime) return 'not_applicable';
  if (!isConsistentValidTime(validTime, targetSeconds)) return 'tracking_uncertain';

  const trackingLossRatio = validTime.wallClockSeconds > 0
    ? validTime.trackingLostSeconds / validTime.wallClockSeconds
    : validTime.trackingLostSeconds > 0
      ? 1
      : 0;
  if (trackingLossRatio >= HIGH_TRACKING_LOSS_RATIO) return 'tracking_uncertain';

  const reachedTarget = validTime.accumulatedValidSeconds + 0.01 >= targetSeconds;
  const wallClockHigh = validTime.wallClockSeconds >= targetSeconds * HIGH_WALL_TIME_RATIO;
  const pauseCountHigh = validTime.pauseCount >= HIGH_PAUSE_COUNT;
  const longestHoldStrong = validTime.longestContinuousValidSeconds + 0.01 >= targetSeconds * STRONG_LONGEST_HOLD_RATIO;

  if (validTime.completedByValidTime && reachedTarget && !validTime.endedBySafetyCap) {
    if (
      validTime.pauseCount <= MAX_STRONG_PAUSE_COUNT &&
      !pauseCountHigh &&
      longestHoldStrong &&
      !wallClockHigh
    ) {
      return 'strong';
    }
    return 'completed_with_resets';
  }

  if (validTime.completedByValidTime && reachedTarget) return 'completed_with_resets';

  if (!validTime.completedByValidTime && (!reachedTarget || validTime.endedBySafetyCap)) {
    return 'incomplete';
  }

  return 'tracking_uncertain';
}

export function summarizeValidTimeSets(sets: readonly SetResult[]): ValidTimeProgressionSummary | null {
  const validTimes = sets.map((set) => set.validTime).filter((v): v is ValidTimeResult => !!v);
  if (validTimes.length === 0) return null;

  const setSignals = validTimes.map((validTime) => classifyValidTimePerformance(validTime));
  const signal = aggregateSetSignals(setSignals, validTimes.length < sets.length);
  const validationMode = commonValidationMode(validTimes);

  return {
    signal,
    setCount: validTimes.length,
    targetValidSeconds: sum(validTimes.map((validTime) => validTime.targetValidSeconds)),
    accumulatedValidSeconds: sum(validTimes.map((validTime) => validTime.accumulatedValidSeconds)),
    wallClockSeconds: sum(validTimes.map((validTime) => validTime.wallClockSeconds)),
    pauseCount: sum(validTimes.map((validTime) => validTime.pauseCount)),
    longestContinuousValidSeconds: Math.max(...validTimes.map((validTime) => validTime.longestContinuousValidSeconds)),
    positionLostEvents: sum(validTimes.map((validTime) => validTime.positionLostEvents)),
    trackingLostSeconds: sum(validTimes.map((validTime) => validTime.trackingLostSeconds)),
    completedByValidTime: validTimes.every((validTime) => validTime.completedByValidTime),
    endedBySafetyCap: validTimes.some((validTime) => validTime.endedBySafetyCap),
    ...(validationMode ? { validationMode } : {}),
  };
}

export function summarizeValidTimeItem(item: TrainingItemResult | null | undefined): ValidTimeProgressionSummary | null {
  if (!item || item.status !== 'completed') return null;
  return summarizeValidTimeSets(item.sets);
}

export function validTimeSessionSummaryCards(
  session: TrainingSessionResult | null | undefined,
  maxCards = 2
): ValidTimeSessionSummaryCard[] {
  if (!session) return [];
  const cards: ValidTimeSessionSummaryCard[] = [];
  for (const item of session.items) {
    const summary = summarizeValidTimeItem(item);
    if (!summary || summary.signal === 'not_applicable') continue;
    const def = getExercise(item.exerciseId);
    const lines = linesForSummary(summary, def.kind === 'hold');
    if (lines.length === 0) continue;
    cards.push({
      exerciseId: item.exerciseId,
      title: def.displayName,
      lines,
      signal: summary.signal,
    });
    if (cards.length >= maxCards) break;
  }
  return cards;
}

function aggregateSetSignals(
  signals: readonly ValidTimeProgressionSignal[],
  hasPartialMetadata: boolean
): ValidTimeProgressionSignal {
  if (hasPartialMetadata || signals.includes('tracking_uncertain')) return 'tracking_uncertain';
  if (signals.includes('incomplete')) return 'incomplete';
  if (signals.length > 0 && signals.every((signal) => signal === 'strong')) return 'strong';
  if (signals.includes('completed_with_resets') || signals.includes('strong')) return 'completed_with_resets';
  return 'tracking_uncertain';
}

function linesForSummary(summary: ValidTimeProgressionSummary, isHold: boolean): string[] {
  const accumulated = roundedSeconds(summary.accumulatedValidSeconds);
  const target = roundedSeconds(summary.targetValidSeconds);
  const longest = roundedSeconds(summary.longestContinuousValidSeconds);
  switch (summary.signal) {
    case 'strong':
      return [
        isHold ? `You held ${target} seconds total.` : `You completed ${target} seconds of steady time.`,
        `Longest steady stretch: ${longest} seconds.`,
      ];
    case 'completed_with_resets':
      return [
        `You reached ${target} seconds total.`,
        resetLine(summary.pauseCount),
      ];
    case 'incomplete':
      return [
        `You reached ${accumulated} seconds of steady time today.`,
        "We'll keep this level comfortable next time.",
      ];
    case 'tracking_uncertain':
      return [
        'We had some trouble tracking this movement clearly.',
        "We'll repeat this level next time.",
      ];
    default:
      return [];
  }
}

function isConsistentValidTime(validTime: ValidTimeResult, targetSeconds: number): boolean {
  const values = [
    targetSeconds,
    validTime.targetValidSeconds,
    validTime.accumulatedValidSeconds,
    validTime.wallClockSeconds,
    validTime.pauseCount,
    validTime.longestContinuousValidSeconds,
    validTime.positionLostEvents,
    validTime.trackingLostSeconds,
  ];
  if (!values.every((value) => Number.isFinite(value))) return false;
  if (targetSeconds <= 0 || validTime.targetValidSeconds <= 0) return false;
  if (validTime.accumulatedValidSeconds < -0.01 || validTime.wallClockSeconds < -0.01) return false;
  if (validTime.pauseCount < 0 || validTime.positionLostEvents < 0 || validTime.trackingLostSeconds < -0.01) return false;
  if (validTime.longestContinuousValidSeconds < -0.01) return false;
  if (validTime.accumulatedValidSeconds - validTime.wallClockSeconds > 0.01) return false;
  if (validTime.longestContinuousValidSeconds - validTime.accumulatedValidSeconds > 0.01) return false;
  if (validTime.completedByValidTime && validTime.accumulatedValidSeconds + 0.01 < targetSeconds) return false;
  return true;
}

function commonValidationMode(validTimes: readonly ValidTimeResult[]): TimerValidationMode | undefined {
  const first = validTimes[0]?.validationMode;
  if (!first) return undefined;
  return validTimes.every((validTime) => validTime.validationMode === first) ? first : undefined;
}

function roundedSeconds(value: number): number {
  return Math.max(0, Math.round(value));
}

function pauseWord(count: number): string {
  const rounded = Math.max(0, Math.round(count));
  if (rounded === 1) return 'once';
  if (rounded === 2) return 'twice';
  return `${rounded} times`;
}

function resetLine(count: number): string {
  const rounded = Math.max(0, Math.round(count));
  if (rounded === 0) return 'The timer waited while you settled back in.';
  return `Timer paused ${pauseWord(rounded)} while you reset.`;
}

function sum(xs: readonly number[]): number {
  let total = 0;
  for (const x of xs) total += x;
  return total;
}
