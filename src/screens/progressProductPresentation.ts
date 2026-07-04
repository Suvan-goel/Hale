import {
  type MovementBlock,
  type MovementBlockReport,
  type TrainingSessionCompletion,
} from '../adherence';
import {
  blockScheduleDateKey,
  daysBetweenBlockScheduleDates,
  getBlockScheduleState,
  type BlockScheduleState,
} from '../haleFlow';

export interface ProgressNextCheckUpCardCopy {
  title: 'Your next check-up';
  lead: string;
  body: string;
  actionLabel?: 'Start Movement Check-Up';
}

// Domain status tiers come from the shared Movement Profile view model
// (MovementProfileV2StatusTier in src/movementProfileV2/viewModel.ts), so the
// Progress rows and the check-up results page always speak the same language.

export function buildProgressNextCheckUpCard(input: {
  hasReadyProfile: boolean;
  activeBlock: MovementBlock | null | undefined;
  reports: readonly MovementBlockReport[] | null | undefined;
  completions: readonly TrainingSessionCompletion[] | null | undefined;
  today: string;
}): ProgressNextCheckUpCardCopy | null {
  if (!input.hasReadyProfile || !isMovementProfileV2Block(input.activeBlock)) return null;
  const block = input.activeBlock;
  const schedule = getBlockScheduleState({
    block,
    completions: input.completions ?? [],
    today: input.today,
  });
  if (
    block.status === 'completed' ||
    schedule.status === 'block_completed' ||
    movementProfileV2ReportBlockIds(input.reports).has(block.id)
  ) {
    return null;
  }
  if (schedule.status === 'retest_due') {
    return {
      title: 'Your next check-up',
      lead: 'Ready now.',
      body: 'Repeat your Movement Check-Up to save your latest Movement Profile.',
      actionLabel: 'Start Movement Check-Up',
    };
  }
  if (schedule.status === 'schedule_unavailable') return null;

  const days = daysUntilScheduleRetest({ schedule, block, today: input.today });
  const lead = days === null
    ? 'After this plan.'
    : days <= 0
      ? 'After your planned sessions.'
      : `In ${days} ${days === 1 ? 'day' : 'days'}.`;
  const body =
    schedule.status === 'training_complete_waiting_retest'
      ? 'Your plan sessions are complete. Hale will open your Movement Check-Up when the date gate is ready.'
      : 'Hale will guide your next Movement Check-Up when your 4-week plan is ready to review.';

  return {
    title: 'Your next check-up',
    lead,
    body,
  };
}

function isMovementProfileV2Block(block: MovementBlock | null | undefined): block is MovementBlock {
  return block?.origin?.kind === 'movement_profile_v2_assessment';
}

function movementProfileV2ReportBlockIds(reports: readonly MovementBlockReport[] | null | undefined): Set<string> {
  return new Set(
    (reports ?? [])
      .filter((report) => report.kind === 'movement_profile_v2_block_report')
      .map((report) => report.blockId)
  );
}

function daysUntilScheduleRetest(input: {
  schedule: BlockScheduleState;
  block: MovementBlock;
  today: string;
}): number | null {
  const targetDateKey = input.schedule.retestNotBeforeDateKey ?? blockScheduleDateKey(input.block.retestDate);
  const todayDateKey = blockScheduleDateKey(input.today);
  if (!targetDateKey || !todayDateKey) return null;
  const days = daysBetweenBlockScheduleDates(todayDateKey, targetDateKey);
  return days === null ? null : Math.max(0, days);
}
