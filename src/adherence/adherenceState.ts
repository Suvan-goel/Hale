import {
  completedTrainingSessions,
  currentBlockWeek,
  daysBetween,
  expectedSessionsByDate,
  lastTrainingCompletionAt,
  microCheckCompletedThisWeek,
  sessionsCompletedThisWeek,
} from './dateUtils';
import type { AdherenceState, MovementBlock, TrainingSessionCompletion } from './types';

export function getAdherenceState(
  block: MovementBlock | null | undefined,
  completions: readonly TrainingSessionCompletion[],
  nowIso: string = new Date().toISOString()
): AdherenceState {
  if (!block) return 'no_block';
  if (block.status === 'completed' || hasRetestCompletion(block, completions)) return 'block_complete';
  const completedSessions = completedTrainingSessions(block, completions).length;
  if (completedSessions >= block.totalPlannedSessions || daysBetween(nowIso, block.retestDate) <= 3) {
    return 'ready_for_retest';
  }

  const lastAt = lastTrainingCompletionAt(block, completions);
  const daysSinceStart = daysBetween(block.startDate, nowIso);
  const inactiveDays = lastAt ? daysBetween(lastAt, nowIso) : daysSinceStart;
  if (inactiveDays >= 14) return 'inactive_14_days';
  if (inactiveDays >= 7) return 'inactive_this_week';

  const expected = expectedSessionsByDate(block, nowIso);
  if (completedSessions >= expected) return 'on_track';
  if (expected - completedSessions === 1) return 'missed_one_session';
  return 'slightly_behind';
}

export function currentWeekProgress(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  nowIso: string = new Date().toISOString()
): {
  weekNumber: number;
  sessionsCompleted: number;
  sessionsTarget: number;
  microCheckCompleted: boolean;
} {
  return {
    weekNumber: currentBlockWeek(block, nowIso),
    sessionsCompleted: sessionsCompletedThisWeek(block, completions, nowIso),
    sessionsTarget: block.sessionsPerWeekTarget,
    microCheckCompleted: microCheckCompletedThisWeek(block, completions, nowIso),
  };
}

export function blockProgress(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[]
): {
  completedSessions: number;
  totalSessions: number;
  microChecksCompleted: number;
} {
  return {
    completedSessions: completedTrainingSessions(block, completions).length,
    totalSessions: block.totalPlannedSessions,
    microChecksCompleted: completions.filter((c) => c.blockId === block.id && c.sessionType === 'micro_check').length,
  };
}

function hasRetestCompletion(block: MovementBlock, completions: readonly TrainingSessionCompletion[]): boolean {
  return completions.some((c) => c.blockId === block.id && c.sessionType === 'retest');
}
