/**
 * TEST-ONLY legacy Progress summary builders. The legacy V1 Progress
 * presentation was removed 2026-07-04; schedule integration tests still use
 * these to assert retest-due and completed-plan semantics on stored data.
 */

import {
  daysUntil,
  movementBlockDomainFocus,
  domainLabel,
  type MovementBlock,
  type MovementDomain,
  type MovementBlockReport,
  type TrainingSessionCompletion,
} from '../../adherence';
import { blockScheduleDateKey, getBlockScheduleState } from '../blockSchedule';

export interface BlockReportSummary {
  blockId: string;
  dateRange: string;
  focus: string;
  sessions: string;
  mainChange: string;
}

export interface RetestDueSummary {
  title: string;
  body: string;
  ctaLabel?: string;
  due: boolean;
}

export function getBlockReportSummaries({
  blocks,
  reports,
  completions,
}: {
  blocks?: readonly MovementBlock[] | null;
  reports?: readonly MovementBlockReport[] | null;
  completions?: readonly TrainingSessionCompletion[] | null;
}): BlockReportSummary[] {
  const allBlocks = blocks ?? [];
  const allReports = reports ?? [];
  const allCompletions = completions ?? [];
  const reportedBlockIds = new Set(allReports.map((report) => report.blockId));
  const candidates = allBlocks.filter((block) => block.status === 'completed' || reportedBlockIds.has(block.id));
  return candidates
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((block) => {
      const report = allReports.find((item) => item.blockId === block.id);
      const schedule = getBlockScheduleState({
        block,
        completions: allCompletions,
        today: latestScheduleDate(block, allCompletions),
      });
      return {
        blockId: block.id,
        dateRange: `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`,
        focus: movementBlockDomainFocus(block) ? domainLabel(movementBlockDomainFocus(block)!) : 'Balanced',
        sessions: `${schedule.totalCredits} of ${block.totalPlannedSessions} sessions`,
        mainChange: report ? mainChangeFromReport(report) : 'Check-up history will add the main change for this plan.',
      };
    });
}

export function getRetestDueSummary({
  activeBlock,
  today,
  hasBaseline,
  completions,
}: {
  activeBlock?: MovementBlock | null;
  today: string;
  hasBaseline: boolean;
  completions?: readonly TrainingSessionCompletion[] | null;
}): RetestDueSummary {
  if (!hasBaseline) {
    return {
      title: 'Start with your first check-up',
      body: 'Do one Movement Check-Up so Hale can save your starting numbers.',
      ctaLabel: 'Start Movement Check-Up',
      due: false,
    };
  }
  if (!activeBlock) {
    return {
      title: 'Next check-up',
      body: 'Start a 4-week plan to set the date for your next Movement Check-Up.',
      due: false,
    };
  }
  const schedule = getBlockScheduleState({
    block: activeBlock,
    completions: completions ?? [],
    today,
  });
  const targetDateKey = schedule.retestNotBeforeDateKey ?? blockScheduleDateKey(activeBlock.retestDate);
  const todayKey = blockScheduleDateKey(today);
  const days = targetDateKey && todayKey ? Math.max(0, daysBetweenDateKeys(todayKey, targetDateKey)) : daysUntil(activeBlock.retestDate, today);
  if (schedule.status === 'retest_due') {
    return {
      title: 'Time for your next check-up',
      body: 'Repeat the same Movement Check-Up now so Hale can compare it with your last one.',
      ctaLabel: 'Start check-up',
      due: true,
    };
  }
  if (days === 0) {
    return {
      title: 'Next check-up',
      body: 'Finish the planned sessions in this 4-week plan, then Hale will open your next check-up.',
      due: false,
    };
  }
  return {
    title: 'Next check-up',
    body: `Your next Movement Check-Up opens in ${days} ${days === 1 ? 'day' : 'days'}.`,
    due: false,
  };
}


function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function latestScheduleDate(block: MovementBlock, completions: readonly TrainingSessionCompletion[]): string {
  const candidates = completions
    .filter((completion) => completion.blockId === block.id)
    .map((completion) => completion.completedAt)
    .concat(block.updatedAt, block.startDate)
    .sort();
  return candidates[candidates.length - 1] ?? block.updatedAt;
}

function mainChangeFromReport(report: MovementBlockReport): string {
  const changes = Object.entries(report.domainChanges ?? {});
  const changed = changes.find(([, change]) => reportDirectionIsChanged(change?.direction));
  const similar = changes.find(([, change]) => reportDirectionIsSimilar(change?.direction));
  const selected = changed ?? similar ?? changes[0];
  if (!selected) return report.summary;
  const [domain, change] = selected as [MovementDomain, NonNullable<MovementBlockReport['domainChanges']>[MovementDomain]];
  if (reportDirectionIsChanged(change?.direction)) return `${domainLabel(domain)} changed in the latest check-up.`;
  if (reportDirectionIsSimilar(change?.direction)) return `${domainLabel(domain)} was similar in the latest check-up.`;
  return report.summary;
}

function daysBetweenDateKeys(startDateKey: string, endDateKey: string): number {
  const [startYear, startMonth, startDay] = startDateKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateKey.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.floor((end - start) / 86400000);
}

function reportDirectionIsChanged(direction: unknown): boolean {
  return (
    direction === 'recorded_lower' ||
    direction === 'recorded_higher' ||
    direction === 'improved' ||
    direction === 'declined'
  );
}

function reportDirectionIsSimilar(direction: unknown): boolean {
  return direction === 'similar' || direction === 'held_steady';
}
