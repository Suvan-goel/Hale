import {
  movementBlockDomainFocus,
  normalizeMovementBlockFocus,
  type MovementBlock,
  type MovementBlockReport,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
import {
  blockScheduleDateKey,
  daysBetweenBlockScheduleDates,
  getBlockScheduleState,
  type BlockScheduleState,
} from '../haleFlow';
import type { MovementProfileV2ProgressDomainSummary } from '../haleFlow/movementProfileV2ProgressViewModel';

export interface ProgressNextCheckUpCardCopy {
  title: 'Your next check-up';
  lead: string;
  body: string;
  actionLabel?: 'Start Movement Check-Up';
}

export interface ProgressPlanSummaryCardCopy {
  title: 'Current 4-week plan' | 'Last 4-week plan';
  meta: string;
  actionLabel: 'View current plan' | 'View plan';
  accessibilityLabel: string;
}

// One plain status vocabulary shared by all three domains, so the profile rows read
// in a single language instead of mixing percentiles ("Below 10th percentile"),
// hold-bands ("Strong hold"), and range-words ("Within typical range"). Tiers rise
// Starting point → Building → On track → Strong; "Saved result" covers the case where
// there is no age reference to place the result against. Strength tiers follow the
// same percentile cut-offs the assessment engine already uses (high ≤ 25, ≤ 40).
export type ProgressStatusTier = 'Starting point' | 'Building' | 'On track' | 'Strong' | 'Saved result';

export function progressSummaryStatusLabel(card: MovementProfileV2ProgressDomainSummary): ProgressStatusTier {
  const label = card.interpretation.toLowerCase();
  if (card.domain === 'strength_power') {
    if (label.includes('below the 10th')) return 'Starting point';
    if (label.includes('above the 90th')) return 'Strong';
    const match = card.interpretation.match(/Around the ([0-9]+)th-([0-9]+)th percentile/);
    if (match) {
      const high = Number(match[2]);
      if (high <= 25) return 'Starting point';
      if (high <= 40) return 'Building';
      if (high <= 60) return 'On track';
      return 'Strong';
    }
    return 'Saved result';
  }
  if (card.domain === 'balance') {
    if (label.includes('45-second') || label.includes('full')) return 'Strong';
    if (label.includes('typical range')) return 'On track';
    if (label.includes('building')) return 'Building';
    if (label.includes('starting') || label.includes('clear place')) return 'Starting point';
    return 'Saved result';
  }
  if (label.includes('above')) return 'Strong';
  if (label.includes('within')) return 'On track';
  if (label.includes('below')) return 'Building';
  return 'Saved result';
}

export function progressPracticeStatusLabel(status: string): string {
  if (status === 'Ready for next step') return 'Ready';
  if (status === 'Available in plan') return 'Available';
  if (status === 'Recently included') return 'Building';
  if (status === 'Same level for now') return 'Building';
  if (status === 'Building') return 'Building';
  return 'Available';
}

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

export function buildProgressPlanSummaryCard(input: {
  activeBlock: MovementBlock | null | undefined;
  blocks: readonly MovementBlock[] | null | undefined;
  reports: readonly MovementBlockReport[] | null | undefined;
  completions: readonly TrainingSessionCompletion[] | null | undefined;
  today: string;
}): ProgressPlanSummaryCardCopy | null {
  const block = selectProgressPlanBlock(input);
  if (!block) return null;
  const isCurrent = block.status === 'active' || block.status === 'paused';
  const schedule = getBlockScheduleState({
    block,
    completions: input.completions ?? [],
    today: isCurrent ? input.today : latestScheduleDate(block, input.completions ?? [], input.today),
  });
  const total = Math.max(1, block.totalPlannedSessions || 12);
  const completed = Math.min(schedule.totalCredits, total);
  const title = isCurrent ? 'Current 4-week plan' : 'Last 4-week plan';
  const actionLabel = isCurrent ? 'View current plan' : 'View plan';
  const meta = `${movementBlockFocusTitle(block)} · ${completed} of ${total} sessions completed.`;
  return {
    title,
    meta,
    actionLabel,
    accessibilityLabel: `${title}. ${meta} Opens the Plan tab without starting a session.`,
  };
}

function selectProgressPlanBlock(input: {
  activeBlock: MovementBlock | null | undefined;
  blocks: readonly MovementBlock[] | null | undefined;
  reports: readonly MovementBlockReport[] | null | undefined;
}): MovementBlock | null {
  if (isMovementProfileV2Block(input.activeBlock)) return input.activeBlock;
  const reportedV2Blocks = movementProfileV2ReportBlockIds(input.reports);
  return (input.blocks ?? [])
    .filter((block) => isMovementProfileV2Block(block))
    .filter((block) => block.status === 'completed' || reportedV2Blocks.has(block.id))
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
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

function movementBlockFocusTitle(block: MovementBlock): string {
  const domain = movementBlockDomainFocus(block);
  if (domain) return movementDomainTitle(domain);
  return normalizeMovementBlockFocus(block)?.kind === 'balanced' ? 'Balanced' : 'Balanced';
}

function movementDomainTitle(domain: MovementDomain): string {
  if (domain === 'balance') return 'Balance';
  if (domain === 'mobility') return 'Mobility';
  return 'Strength / Power';
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

function latestScheduleDate(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  fallback: string
): string {
  const candidates = completions
    .filter((completion) => completion.blockId === block.id)
    .map((completion) => completion.completedAt)
    .concat(block.updatedAt, block.startDate, fallback)
    .sort();
  return candidates[candidates.length - 1] ?? fallback;
}
