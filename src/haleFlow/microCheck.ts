import { movementBlockDomainFocus, type MovementBlock, type TrainingSessionCompletion } from '../adherence';
import {
  addBlockScheduleDays,
  blockScheduleDateKey,
  type BlockScheduleState,
} from './blockSchedule';
import { getMicroCheckCopy } from './copy';
import type { MicroCheckDefinition } from './types';

export function getMicroCheckForBlock(block: MovementBlock): MicroCheckDefinition | null {
  const focusDomain = movementBlockDomainFocus(block);
  if (!focusDomain) return null;
  const type =
    focusDomain === 'balance'
      ? 'single-leg-balance'
      : focusDomain === 'mobility'
        ? 'mobility-reach'
        : 'chair-power';
  const copy = getMicroCheckCopy(focusDomain);
  return {
    type,
    domain: focusDomain,
    title: copy.title,
    body: copy.body,
    estimatedSeconds: 60,
  };
}

export function isMicroCheckDueForSchedule(
  schedule: BlockScheduleState | null | undefined,
  completions: readonly TrainingSessionCompletion[]
): boolean {
  if (!schedule || !schedule.blockId || !schedule.currentWeekStartDateKey) return false;
  if (schedule.status !== 'week_complete_waiting' && schedule.status !== 'training_complete_waiting_retest') {
    return false;
  }
  return !microCheckCompletedInScheduleWindow(completions, schedule);
}

function microCheckCompletedInScheduleWindow(
  completions: readonly TrainingSessionCompletion[],
  schedule: BlockScheduleState
): boolean {
  const start = schedule.currentWeekStartDateKey;
  if (!start || !schedule.blockId) return false;
  const end = schedule.nextUnlockDateKey ?? schedule.retestNotBeforeDateKey ?? addBlockScheduleDays(start, 7);
  if (!end) return false;

  return completions.some((completion) => {
    if (completion.blockId !== schedule.blockId || completion.sessionType !== 'micro_check') return false;
    const completedDateKey = blockScheduleDateKey(completion.completedAt);
    return !!completedDateKey && completedDateKey >= start && completedDateKey < end;
  });
}
