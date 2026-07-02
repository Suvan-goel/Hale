import type { MovementBlock, TrainingSessionCompletion } from '../adherence/types';
import type { PersistedGeneratedSessionSummary } from '../training';
import {
  classifyMainPlanCompletion,
  classifyMainPlanGeneratedSummary,
  requiredMainPlanTemplatesForBlock,
  type MainPlanCreditEvent,
  type MainPlanCreditRejectionReason,
} from './mainPlanEvents';

export const BLOCK_TRAINING_WEEK_COUNT = 4;
export const MAIN_PLAN_TEMPLATES_PER_WEEK = 3;
export const TRAINING_WEEK_MIN_CALENDAR_DAYS = 7;
export const BLOCK_MIN_CALENDAR_DAYS = 28;
export const RESTART_RECOMMENDED_AFTER_DAYS = 14;
export const RESUME_GENTLY_AFTER_DAYS = 7;
export const MAX_SCHEDULE_CREDITS_PER_DATE = 1;
export const BLOCK_SCHEDULE_POLICY_VERSION = 1;

export type BlockScheduleStatus =
  | 'session_due'
  | 'week_complete_waiting'
  | 'training_complete_waiting_retest'
  | 'retest_due'
  | 'block_completed'
  | 'schedule_unavailable';

export type BlockLapseState = 'active' | 'resume_gently' | 'restart_recommended';

export type BlockScheduleDiagnosticReason =
  | 'missing_block'
  | 'invalid_current_date'
  | 'invalid_block_start_date'
  | 'missing_required_templates'
  | 'main_plan_rejected'
  | 'malformed_completion_date'
  | 'future_completion'
  | 'pre_block_completion'
  | 'daily_credit_already_used'
  | 'template_already_credited_for_week'
  | 'week_locked_until_next_start'
  | 'block_training_already_complete'
  | 'duplicate_event';

export interface BlockScheduleDiagnostic {
  reason: BlockScheduleDiagnosticReason;
  eventId?: string;
  blockId?: string;
  templateId?: string;
  plannedDateKey?: string;
  completedAt?: string;
  dateKey?: string;
  weekIndex?: number;
  weekNumber?: number;
  unlockDateKey?: string;
  rejectedReason?: MainPlanCreditRejectionReason;
}

export interface BlockScheduleCredit {
  eventId?: string;
  creditId: string;
  blockId: string;
  templateId: string;
  plannedDateKey?: string;
  completedAt: string;
  dateKey: string;
  weekIndex: number;
  weekNumber: number;
}

export interface BlockScheduleWeek {
  weekIndex: number;
  weekNumber: number;
  startDateKey: string;
  creditedTemplateIds: readonly string[];
  credits: readonly BlockScheduleCredit[];
  complete: boolean;
  nextUnlockDateKey?: string;
}

export interface BlockScheduleState {
  status: BlockScheduleStatus;
  policyVersion: typeof BLOCK_SCHEDULE_POLICY_VERSION;
  blockId?: string;
  currentWeekIndex: number;
  currentWeekNumber: number;
  currentWeekStartDateKey?: string;
  nextUnlockDateKey?: string;
  requiredTemplateIds: readonly string[];
  creditedTemplateIds: readonly string[];
  nextTemplateId?: string;
  totalCredits: number;
  lastCreditDateKey?: string;
  lapseState: BlockLapseState;
  retestNotBeforeDateKey?: string;
  diagnostics: readonly BlockScheduleDiagnostic[];
  weeks: readonly BlockScheduleWeek[];
  credits: readonly BlockScheduleCredit[];
}

export interface CompletionScheduleCreditSummary {
  policyVersion: typeof BLOCK_SCHEDULE_POLICY_VERSION;
  credited: boolean;
  status: 'credited' | 'denied' | 'not_applicable';
  reason?: BlockScheduleDiagnosticReason;
  weekIndex?: number;
  weekNumber?: number;
  dateKey?: string;
  templateId?: string;
  creditId?: string;
}

interface ScheduleCandidate {
  kind: 'completion' | 'summary';
  event: MainPlanCreditEvent;
  stableId: string;
  dateKey: string;
  completedAt: string;
}

interface MutableWeek {
  weekIndex: number;
  startDateKey: string;
  credits: BlockScheduleCredit[];
  nextUnlockDateKey?: string;
}

export function getBlockScheduleState({
  block,
  completions = [],
  generatedSessionSummaries = [],
  today,
}: {
  block: MovementBlock | null | undefined;
  completions?: readonly TrainingSessionCompletion[];
  generatedSessionSummaries?: readonly PersistedGeneratedSessionSummary[];
  today: string | Date;
}): BlockScheduleState {
  const todayKey = dateKeyFromUnknown(today);
  const diagnostics: BlockScheduleDiagnostic[] = [];
  if (!block) {
    diagnostics.push({ reason: 'missing_block' });
    return unavailableSchedule(diagnostics, todayKey.dateKey);
  }
  if (!todayKey.ok) {
    diagnostics.push({ reason: 'invalid_current_date', blockId: block.id });
    return unavailableSchedule(diagnostics);
  }
  const blockStart = dateKeyFromUnknown(block.startDate);
  if (!blockStart.ok) {
    diagnostics.push({ reason: 'invalid_block_start_date', blockId: block.id });
    return unavailableSchedule(diagnostics, todayKey.dateKey);
  }
  const requiredTemplateIds = requiredMainPlanTemplatesForBlock(block).templateIds.slice(0, MAIN_PLAN_TEMPLATES_PER_WEEK);
  if (requiredTemplateIds.length !== MAIN_PLAN_TEMPLATES_PER_WEEK) {
    diagnostics.push({ reason: 'missing_required_templates', blockId: block.id });
    return unavailableSchedule(diagnostics, todayKey.dateKey, block.id);
  }

  const candidates = scheduleCandidates({
    block,
    completions,
    generatedSessionSummaries,
    todayDateKey: todayKey.dateKey,
    diagnostics,
  });
  const weeks: MutableWeek[] = [{ weekIndex: 0, startDateKey: blockStart.dateKey, credits: [] }];
  const usedCreditDates = new Set<string>();
  const seenEvents = new Set<string>();
  let activeWeekIndex = 0;

  for (const candidate of candidates) {
    const duplicateKey = `${candidate.event.blockId}:${candidate.event.templateId}:${candidate.event.plannedDateKey ?? ''}:${candidate.completedAt}`;
    if (seenEvents.has(duplicateKey)) {
      diagnostics.push(diagnosticForCandidate(candidate, 'duplicate_event'));
      continue;
    }
    seenEvents.add(duplicateKey);

    while (activeWeekIndex < BLOCK_TRAINING_WEEK_COUNT) {
      const week = weeks[activeWeekIndex];
      if (!isWeekComplete(week, requiredTemplateIds)) break;
      const nextStart = week.nextUnlockDateKey;
      if (!nextStart || compareDateKeys(candidate.dateKey, nextStart) < 0) break;
      activeWeekIndex += 1;
      if (activeWeekIndex < BLOCK_TRAINING_WEEK_COUNT && !weeks[activeWeekIndex]) {
        weeks[activeWeekIndex] = {
          weekIndex: activeWeekIndex,
          startDateKey: nextStart,
          credits: [],
        };
      }
    }

    if (activeWeekIndex >= BLOCK_TRAINING_WEEK_COUNT) {
      diagnostics.push(diagnosticForCandidate(candidate, 'block_training_already_complete'));
      continue;
    }

    const week = weeks[activeWeekIndex];
    if (
      isWeekComplete(week, requiredTemplateIds) &&
      week.nextUnlockDateKey &&
      compareDateKeys(candidate.dateKey, week.nextUnlockDateKey) < 0
    ) {
      diagnostics.push(diagnosticForCandidate(candidate, 'week_locked_until_next_start', week));
      continue;
    }
    if (compareDateKeys(candidate.dateKey, week.startDateKey) < 0) {
      diagnostics.push(diagnosticForCandidate(candidate, 'week_locked_until_next_start', week));
      continue;
    }
    if (usedCreditDates.has(candidate.dateKey)) {
      diagnostics.push(diagnosticForCandidate(candidate, 'daily_credit_already_used', week));
      continue;
    }
    if (week.credits.some((credit) => credit.templateId === candidate.event.templateId)) {
      diagnostics.push(diagnosticForCandidate(candidate, 'template_already_credited_for_week', week));
      continue;
    }

    const credit: BlockScheduleCredit = {
      eventId: candidate.event.id,
      creditId: candidate.event.creditId,
      blockId: block.id,
      templateId: candidate.event.templateId,
      plannedDateKey: candidate.event.plannedDateKey,
      completedAt: candidate.completedAt,
      dateKey: candidate.dateKey,
      weekIndex: week.weekIndex,
      weekNumber: week.weekIndex + 1,
    };
    week.credits.push(credit);
    usedCreditDates.add(candidate.dateKey);

    if (isWeekComplete(week, requiredTemplateIds)) {
      week.nextUnlockDateKey = maxDateKey(
        addDateKeyDays(week.startDateKey, TRAINING_WEEK_MIN_CALENDAR_DAYS),
        addDateKeyDays(candidate.dateKey, 1)
      );
    }
  }

  const immutableWeeks = normalizedWeeks(weeks, requiredTemplateIds);
  const credits = immutableWeeks.flatMap((week) => week.credits);
  const totalCredits = credits.length;
  const lastCredit = credits[credits.length - 1];
  const lapseState = computeLapseState({
    blockStartDateKey: blockStart.dateKey,
    lastCreditDateKey: lastCredit?.dateKey,
    todayDateKey: todayKey.dateKey,
  });
  const incompleteIndex = firstIncompleteWeekIndex(immutableWeeks);

  if (hasRetestCompletion(block, completions) && incompleteIndex >= BLOCK_TRAINING_WEEK_COUNT) {
    return {
      status: 'block_completed',
      policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
      blockId: block.id,
      currentWeekIndex: Math.min(BLOCK_TRAINING_WEEK_COUNT - 1, incompleteIndex),
      currentWeekNumber: Math.min(BLOCK_TRAINING_WEEK_COUNT, incompleteIndex + 1),
      currentWeekStartDateKey: immutableWeeks[Math.min(BLOCK_TRAINING_WEEK_COUNT - 1, incompleteIndex)]?.startDateKey,
      requiredTemplateIds,
      creditedTemplateIds: [],
      totalCredits,
      lastCreditDateKey: lastCredit?.dateKey,
      lapseState,
      retestNotBeforeDateKey: retestNotBeforeDateKey(blockStart.dateKey, lastCredit?.dateKey),
      diagnostics,
      weeks: immutableWeeks,
      credits,
    };
  }

  if (incompleteIndex >= BLOCK_TRAINING_WEEK_COUNT) {
    const retestNotBefore = retestNotBeforeDateKey(blockStart.dateKey, lastCredit?.dateKey);
    return {
      status: compareDateKeys(todayKey.dateKey, retestNotBefore) >= 0 ? 'retest_due' : 'training_complete_waiting_retest',
      policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
      blockId: block.id,
      currentWeekIndex: BLOCK_TRAINING_WEEK_COUNT - 1,
      currentWeekNumber: BLOCK_TRAINING_WEEK_COUNT,
      currentWeekStartDateKey: immutableWeeks[BLOCK_TRAINING_WEEK_COUNT - 1]?.startDateKey,
      requiredTemplateIds,
      creditedTemplateIds: requiredTemplateIds,
      totalCredits,
      lastCreditDateKey: lastCredit?.dateKey,
      lapseState,
      retestNotBeforeDateKey: retestNotBefore,
      diagnostics,
      weeks: immutableWeeks,
      credits,
    };
  }

  const currentWeek = immutableWeeks[incompleteIndex];
  if (compareDateKeys(todayKey.dateKey, currentWeek.startDateKey) < 0) {
    const previousWeek = immutableWeeks[Math.max(0, incompleteIndex - 1)] ?? currentWeek;
    return {
      status: 'week_complete_waiting',
      policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
      blockId: block.id,
      currentWeekIndex: previousWeek.weekIndex,
      currentWeekNumber: previousWeek.weekNumber,
      currentWeekStartDateKey: previousWeek.startDateKey,
      nextUnlockDateKey: currentWeek.startDateKey,
      requiredTemplateIds,
      creditedTemplateIds: previousWeek.creditedTemplateIds,
      totalCredits,
      lastCreditDateKey: lastCredit?.dateKey,
      lapseState,
      diagnostics,
      weeks: immutableWeeks,
      credits,
    };
  }

  const creditedTemplateIds = currentWeek.creditedTemplateIds;
  return {
    status: 'session_due',
    policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
    blockId: block.id,
    currentWeekIndex: currentWeek.weekIndex,
    currentWeekNumber: currentWeek.weekNumber,
    currentWeekStartDateKey: currentWeek.startDateKey,
    requiredTemplateIds,
    creditedTemplateIds,
    nextTemplateId: requiredTemplateIds.find((templateId) => !creditedTemplateIds.includes(templateId)),
    totalCredits,
    lastCreditDateKey: lastCredit?.dateKey,
    lapseState,
    diagnostics,
    weeks: immutableWeeks,
    credits,
  };
}

export function scheduleCreditForCompletion(
  schedule: BlockScheduleState,
  completion: TrainingSessionCompletion
): CompletionScheduleCreditSummary {
  const credit = schedule.credits.find((item) => item.eventId === completion.id);
  if (credit) {
    return {
      policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
      credited: true,
      status: 'credited',
      weekIndex: credit.weekIndex,
      weekNumber: credit.weekNumber,
      dateKey: credit.dateKey,
      templateId: credit.templateId,
      creditId: credit.creditId,
    };
  }
  const diagnostic = schedule.diagnostics.find((item) => item.eventId === completion.id);
  return {
    policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
    credited: false,
    status: diagnostic ? 'denied' : 'not_applicable',
    reason: diagnostic?.reason,
    weekIndex: diagnostic?.weekIndex,
    weekNumber: diagnostic?.weekNumber,
    dateKey: diagnostic?.dateKey,
    templateId: diagnostic?.templateId ?? completion.templateId,
  };
}

export function annotateCompletionWithScheduleCredit(
  completion: TrainingSessionCompletion,
  schedule: BlockScheduleState
): TrainingSessionCompletion {
  return {
    ...completion,
    scheduleCredit: scheduleCreditForCompletion(schedule, completion),
  };
}

export function isScheduleCreditedCompletion(completion: TrainingSessionCompletion | null | undefined): boolean {
  return completion?.scheduleCredit?.credited === true;
}

export function scheduleRecentSessionsForGeneration(schedule: BlockScheduleState) {
  return schedule.credits.map((credit) => ({
    id: credit.eventId,
    blockId: credit.blockId,
    templateId: credit.templateId,
    plannedDate: credit.plannedDateKey,
    completedAt: credit.completedAt,
    source: 'block_generated' as const,
    status: 'completed' as const,
  }));
}

export function blockScheduleDateKey(value: string | Date): string | null {
  const parsed = dateKeyFromUnknown(value);
  return parsed.ok ? parsed.dateKey : null;
}

export function addBlockScheduleDays(dateKey: string, days: number): string | null {
  return isValidDateKey(dateKey) ? addDateKeyDays(dateKey, days) : null;
}

export function daysBetweenBlockScheduleDates(startDateKey: string, endDateKey: string): number | null {
  if (!isValidDateKey(startDateKey) || !isValidDateKey(endDateKey)) return null;
  return daysBetweenDateKeys(startDateKey, endDateKey);
}

function scheduleCandidates({
  block,
  completions,
  generatedSessionSummaries,
  todayDateKey,
  diagnostics,
}: {
  block: MovementBlock;
  completions: readonly TrainingSessionCompletion[];
  generatedSessionSummaries: readonly PersistedGeneratedSessionSummary[];
  todayDateKey: string;
  diagnostics: BlockScheduleDiagnostic[];
}): ScheduleCandidate[] {
  const out: ScheduleCandidate[] = [];
  const blockStart = dateKeyFromUnknown(block.startDate);
  const startDateKey = blockStart.ok ? blockStart.dateKey : '0000-01-01';

  for (const completion of completions) {
    const classification = classifyMainPlanCompletion(block, completion);
    if (!classification.credited) {
      if (completion.blockId === block.id) {
        diagnostics.push({
          reason: 'main_plan_rejected',
          rejectedReason: classification.reason,
          eventId: completion.id,
          blockId: completion.blockId,
          templateId: completion.templateId,
          plannedDateKey: completion.plannedDate,
          completedAt: completion.completedAt,
        });
      }
      continue;
    }
    addCandidateIfCalendarEligible({
      event: classification.event,
      stableId: completion.id,
      kind: 'completion',
      todayDateKey,
      blockStartDateKey: startDateKey,
      diagnostics,
      out,
    });
  }

  for (const summary of generatedSessionSummaries) {
    const classification = classifyMainPlanGeneratedSummary(block, summary);
    if (!classification.credited) continue;
    addCandidateIfCalendarEligible({
      event: classification.event,
      stableId: summary.id,
      kind: 'summary',
      todayDateKey,
      blockStartDateKey: startDateKey,
      diagnostics,
      out,
    });
  }

  return out.sort((a, b) => {
    const byCompletedAt = a.completedAt.localeCompare(b.completedAt);
    if (byCompletedAt !== 0) return byCompletedAt;
    const byKind = a.kind.localeCompare(b.kind);
    if (byKind !== 0) return byKind;
    return a.stableId.localeCompare(b.stableId);
  });
}

function addCandidateIfCalendarEligible({
  event,
  stableId,
  kind,
  todayDateKey,
  blockStartDateKey,
  diagnostics,
  out,
}: {
  event: MainPlanCreditEvent;
  stableId: string;
  kind: ScheduleCandidate['kind'];
  todayDateKey: string;
  blockStartDateKey: string;
  diagnostics: BlockScheduleDiagnostic[];
  out: ScheduleCandidate[];
}): void {
  const eventDate = dateKeyFromUnknown(event.completedAt);
  if (!eventDate.ok) {
    diagnostics.push({
      reason: 'malformed_completion_date',
      eventId: event.id,
      blockId: event.blockId,
      templateId: event.templateId,
      plannedDateKey: event.plannedDateKey,
      completedAt: event.completedAt,
    });
    return;
  }
  if (compareDateKeys(eventDate.dateKey, todayDateKey) > 0) {
    diagnostics.push({
      reason: 'future_completion',
      eventId: event.id,
      blockId: event.blockId,
      templateId: event.templateId,
      plannedDateKey: event.plannedDateKey,
      completedAt: event.completedAt,
      dateKey: eventDate.dateKey,
    });
    return;
  }
  if (compareDateKeys(eventDate.dateKey, blockStartDateKey) < 0) {
    diagnostics.push({
      reason: 'pre_block_completion',
      eventId: event.id,
      blockId: event.blockId,
      templateId: event.templateId,
      plannedDateKey: event.plannedDateKey,
      completedAt: event.completedAt,
      dateKey: eventDate.dateKey,
    });
    return;
  }
  out.push({
    kind,
    event,
    stableId,
    dateKey: eventDate.dateKey,
    completedAt: event.completedAt,
  });
}

function normalizedWeeks(weeks: readonly MutableWeek[], requiredTemplateIds: readonly string[]): BlockScheduleWeek[] {
  const out: BlockScheduleWeek[] = [];
  for (let index = 0; index < BLOCK_TRAINING_WEEK_COUNT; index += 1) {
    const previous = out[index - 1];
    const mutable = weeks[index] ?? {
      weekIndex: index,
      startDateKey: previous?.nextUnlockDateKey ?? addDateKeyDays(previous?.startDateKey ?? '1970-01-01', TRAINING_WEEK_MIN_CALENDAR_DAYS),
      credits: [],
    };
    const creditedTemplateIds = requiredTemplateIds.filter((templateId) =>
      mutable.credits.some((credit) => credit.templateId === templateId)
    );
    out.push({
      weekIndex: index,
      weekNumber: index + 1,
      startDateKey: mutable.startDateKey,
      creditedTemplateIds,
      credits: mutable.credits.slice(),
      complete: creditedTemplateIds.length === requiredTemplateIds.length,
      nextUnlockDateKey: mutable.nextUnlockDateKey,
    });
  }
  return out;
}

function firstIncompleteWeekIndex(weeks: readonly BlockScheduleWeek[]): number {
  const index = weeks.findIndex((week) => !week.complete);
  return index >= 0 ? index : BLOCK_TRAINING_WEEK_COUNT;
}

function isWeekComplete(week: MutableWeek, requiredTemplateIds: readonly string[]): boolean {
  return requiredTemplateIds.every((templateId) => week.credits.some((credit) => credit.templateId === templateId));
}

function computeLapseState({
  blockStartDateKey,
  lastCreditDateKey,
  todayDateKey,
}: {
  blockStartDateKey: string;
  lastCreditDateKey?: string;
  todayDateKey: string;
}): BlockLapseState {
  const anchor = lastCreditDateKey ?? blockStartDateKey;
  const days = daysBetweenDateKeys(anchor, todayDateKey);
  if (days >= RESTART_RECOMMENDED_AFTER_DAYS) return 'restart_recommended';
  if (days >= RESUME_GENTLY_AFTER_DAYS) return 'resume_gently';
  return 'active';
}

function retestNotBeforeDateKey(blockStartDateKey: string, finalCreditDateKey: string | undefined): string {
  const calendarMinimum = addDateKeyDays(blockStartDateKey, BLOCK_MIN_CALENDAR_DAYS);
  const afterFinalCredit = finalCreditDateKey ? addDateKeyDays(finalCreditDateKey, 1) : calendarMinimum;
  return maxDateKey(calendarMinimum, afterFinalCredit);
}

function hasRetestCompletion(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[]
): boolean {
  return completions.some((completion) => completion.blockId === block.id && completion.sessionType === 'retest');
}

function unavailableSchedule(
  diagnostics: readonly BlockScheduleDiagnostic[],
  todayDateKey?: string,
  blockId?: string
): BlockScheduleState {
  return {
    status: 'schedule_unavailable',
    policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
    blockId,
    currentWeekIndex: 0,
    currentWeekNumber: 1,
    requiredTemplateIds: [],
    creditedTemplateIds: [],
    totalCredits: 0,
    lapseState: 'active',
    diagnostics,
    weeks: [],
    credits: [],
    ...(todayDateKey ? { currentWeekStartDateKey: todayDateKey } : {}),
  };
}

function diagnosticForCandidate(
  candidate: ScheduleCandidate,
  reason: BlockScheduleDiagnosticReason,
  week?: Pick<MutableWeek, 'weekIndex' | 'nextUnlockDateKey'>
): BlockScheduleDiagnostic {
  return {
    reason,
    eventId: candidate.event.id,
    blockId: candidate.event.blockId,
    templateId: candidate.event.templateId,
    plannedDateKey: candidate.event.plannedDateKey,
    completedAt: candidate.completedAt,
    dateKey: candidate.dateKey,
    weekIndex: week?.weekIndex,
    weekNumber: typeof week?.weekIndex === 'number' ? week.weekIndex + 1 : undefined,
    unlockDateKey: week?.nextUnlockDateKey,
  };
}

/**
 * Schedule days are the USER'S calendar days: timestamps resolve to the
 * device-local date, never the UTC date. Otherwise an evening session (or any
 * session for users east of UTC) lands on the wrong day, and the
 * one-credit-per-day and week-unlock rules misfire. Date-only strings are
 * already calendar days and pass through unchanged.
 */
function dateKeyFromUnknown(value: string | Date): { ok: true; dateKey: string } | { ok: false; dateKey?: string } {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return { ok: false };
    return { ok: true, dateKey: localDateKey(value) };
  }
  if (typeof value !== 'string') return { ok: false };
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return isValidDateKey(value) ? { ok: true, dateKey: value } : { ok: false, dateKey: value };
  }
  if (!/^\d{4}-\d{2}-\d{2}[T ]/.test(value)) return { ok: false };
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return { ok: false };
  return { ok: true, dateKey: localDateKey(parsed) };
}

function localDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function isValidDateKey(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function addDateKeyDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetweenDateKeys(startDateKey: string, endDateKey: string): number {
  const [startYear, startMonth, startDay] = startDateKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateKey.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.floor((end - start) / 86400000);
}

function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function maxDateKey(a: string, b: string): string {
  return compareDateKeys(a, b) >= 0 ? a : b;
}
