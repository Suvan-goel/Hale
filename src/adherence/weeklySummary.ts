import { getAdherenceState, currentWeekProgress } from './adherenceState';
import { getWeeklySummaryCopy } from './adherenceCopy';
import { weekWindow } from './dateUtils';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion, WeeklySummary } from './types';

export function generateWeeklySummary({
  block,
  lifeGoal,
  completions,
  nowIso = new Date().toISOString(),
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  nowIso?: string;
}): WeeklySummary {
  const progress = currentWeekProgress(block, completions, nowIso);
  const status = getAdherenceState(block, completions, nowIso);
  const copy = getWeeklySummaryCopy({
    block,
    lifeGoal,
    sessionsCompleted: progress.sessionsCompleted,
    microCheckCompleted: progress.microCheckCompleted,
    adherenceState: status,
  });
  const window = weekWindow(block, nowIso);
  return {
    id: `weekly-summary-${block.id}-${window.weekNumber}`,
    userId: block.userId,
    blockId: block.id,
    weekNumber: window.weekNumber,
    weekStart: window.start,
    weekEnd: window.end,
    sessionsCompleted: progress.sessionsCompleted,
    microCheckCompleted: progress.microCheckCompleted,
    title: copy.title,
    body: copy.body,
    nextFocus: copy.nextFocus,
    createdAt: nowIso,
  };
}
