import {
  getActiveMovementBlock,
  type AdherenceStoreState,
  type MovementAssessment,
  type MovementBlock,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
import type { StoredCheckUp } from '../history';
import type { UserProfile } from '../profile';
import type { CheckUpScore } from '../scoring';
import type { TrainingState } from '../training';
import { latestUsableOfficialAssessment } from './assessments';
import { latestUsableOfficialCheckUpRecord } from './checkupHistory';
import {
  blockScheduleDateKey,
  daysBetweenBlockScheduleDates,
  getBlockScheduleState,
  type BlockScheduleState,
} from './blockSchedule';
import { isMicroCheckDueForSchedule } from './microCheck';
import { PLAN_SESSION_IDS, type PlanSessionId } from './sessionIds';

export type HaleLifecycleState =
  | 'needs_onboarding'
  | 'needs_baseline_checkup'
  | 'needs_block_creation'
  | 'first_session_ready'
  | 'normal_training_day'
  | 'weekly_micro_check_due'
  | 'monthly_retest_due'
  | 'week_complete'
  | 'inactive_restart';

export type TodayPrimaryActionType =
  | 'start_onboarding'
  | 'start_checkup'
  | 'create_block'
  | 'start_first_session'
  | 'start_today_session'
  | 'start_micro_check'
  | 'start_retest'
  | 'start_gentle_restart'
  | 'explore_extra_sessions';

export interface TodayPrimaryAction {
  type: TodayPrimaryActionType;
  title: string;
  subtitle: string;
  ctaLabel: string;
  tone?: 'default' | 'gentle' | 'progress' | 'retest';
}

export interface HaleAppLifecycleInput {
  profile?: UserProfile | null;
  history?: readonly StoredCheckUp[] | null;
  training?: TrainingState | null;
  adherence?: AdherenceStoreState | null;
  today: string;
}

export interface HaleAppLifecycleResult {
  state: HaleLifecycleState;
  primaryAction: TodayPrimaryAction;
  activeBlockSummary?: ActiveBlockSummary;
  movementSnapshot?: MovementSnapshot;
  weekSessionStatuses?: WeekSessionStatus[];
  retestDueDate?: string;
  reason: string;
}

export interface ActiveBlockSummary {
  blockId?: string;
  focusTitle: string;
  focusDomain?: MovementDomain;
  weekNumber: number;
  totalWeeks: number;
  sessionsCompleteThisWeek: number;
  sessionsTargetThisWeek: number;
  retestInDays?: number;
}

export type MovementSnapshotBand = 'starting_point' | 'building' | 'strong';

export interface MovementSnapshot {
  strengthPower?: MovementSnapshotBand;
  balance?: MovementSnapshotBand;
  mobility?: MovementSnapshotBand;
}

export interface WeekSessionStatus {
  id: PlanSessionId;
  title: string;
  status: 'complete' | 'next' | 'later';
  focus: string;
  templateId?: string;
  completedAt?: string;
}

export function getHaleAppLifecycle(input: HaleAppLifecycleInput): HaleAppLifecycleResult {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  const schedule = activeBlock ? activeBlockSchedule({ ...input, today }, activeBlock) : null;
  const latestScore = latestUsableCheckUpScore(input.history, input.adherence?.assessments);
  const hasBaseline = !!latestScore || hasOfficialAssessment(input.adherence);
  const activeBlockSummary = getActiveBlockSummary({ ...input, today });
  const movementSnapshot = getMovementSnapshot({ score: latestScore });
  const weekSessionStatuses = getWeekSessionStatuses({ ...input, today });
  const completedMainPlanTemplatesThisWeek = schedule?.creditedTemplateIds.length ?? 0;
  const retestDueDate = schedule?.retestNotBeforeDateKey ?? activeBlock?.retestDate ?? undefined;

  let state: HaleLifecycleState;
  let reason: string;
  if (!hasCompletedFirstRunProfile(input.profile)) {
    state = 'needs_onboarding';
    reason = 'life goal or safety profile is missing';
  } else if (!hasBaseline) {
    state = 'needs_baseline_checkup';
    reason = 'profile exists but no Movement Check-Up is stored';
  } else if (!activeBlock) {
    state = 'needs_block_creation';
    reason = input.training?.block
      ? 'legacy training block exists but no active current MovementBlock is stored'
      : 'baseline exists but no active 4-week block is stored';
  } else if (schedule?.status === 'retest_due' || shouldShowRetestPrompt({ ...input, today })) {
    state = 'monthly_retest_due';
    reason = 'active block is complete or due for re-test';
  } else if (schedule?.status === 'session_due' && shouldRouteToRestart(schedule)) {
    state = 'inactive_restart';
    reason = 'active block exists and the plan should restart gently after an inactive week';
  } else if (schedule?.status === 'session_due' && schedule.totalCredits === 0) {
    state = 'first_session_ready';
    reason = 'active block exists and no session has been completed yet';
  } else if (shouldShowWeeklyMicroCheck({ ...input, today })) {
    state = 'weekly_micro_check_due';
    reason = 'weekly session target is complete and the weekly micro-check is still open';
  } else if (schedule?.status === 'week_complete_waiting' || schedule?.status === 'training_complete_waiting_retest') {
    state = 'week_complete';
    reason = 'weekly session target is complete';
  } else {
    state = 'normal_training_day';
    reason = 'active block exists and Today can start the next planned session';
  }

  return {
    state,
    primaryAction: getTodayPrimaryAction(state),
    activeBlockSummary,
    movementSnapshot,
    weekSessionStatuses,
    retestDueDate,
    reason,
  };
}

export function getTodayPrimaryAction(state: HaleLifecycleState): TodayPrimaryAction {
  switch (state) {
    case 'needs_onboarding':
      return {
        type: 'start_onboarding',
        title: 'Welcome to Hale',
        subtitle: 'Start with a short check-up so Hale can build your first plan.',
        ctaLabel: 'Start',
      };
    case 'needs_baseline_checkup':
      return {
        type: 'start_checkup',
        title: 'Ready for your first check-up?',
        subtitle: 'Hale will check strength, balance, and mobility at home.',
        ctaLabel: 'Start check-up',
      };
    case 'needs_block_creation':
      return {
        type: 'create_block',
        title: 'Your results are ready',
        subtitle: 'Hale is preparing your plan from your check-up.',
        ctaLabel: 'Prepare plan',
        tone: 'progress',
      };
    case 'first_session_ready':
      return {
        type: 'start_first_session',
        title: 'Your first session is ready',
        subtitle: 'Built from your check-up.',
        ctaLabel: 'Start session',
        tone: 'progress',
      };
    case 'weekly_micro_check_due':
      return {
        type: 'start_micro_check',
        title: '60-second check-in',
        subtitle: 'A quick check-in to keep your plan on track.',
        ctaLabel: 'Start micro-check',
        tone: 'progress',
      };
    case 'monthly_retest_due':
      return {
        type: 'start_retest',
        title: 'Time for your next check-up',
        subtitle: 'Repeat your check-up to see what has changed.',
        ctaLabel: 'Start check-up',
        tone: 'retest',
      };
    case 'week_complete':
      return {
        type: 'explore_extra_sessions',
        title: "You've completed your sessions this week",
        subtitle: 'Support your progress with an optional mobility reset.',
        ctaLabel: 'Start mobility reset',
        tone: 'gentle',
      };
    case 'inactive_restart':
      return {
        type: 'start_gentle_restart',
        title: 'Clean slate',
        subtitle: "Let's restart gently with a shorter session.",
        ctaLabel: 'Restart gently',
        tone: 'gentle',
      };
    case 'normal_training_day':
    default:
      return {
        type: 'start_today_session',
        title: "Today's session",
        subtitle: 'Your next session uses your check-up and recent sessions.',
        ctaLabel: 'Start session',
      };
  }
}

export function getActiveBlockSummary(input: HaleAppLifecycleInput): ActiveBlockSummary | undefined {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (activeBlock) {
    const schedule = activeBlockSchedule({ ...input, today }, activeBlock);
    const retestInDays = schedule.retestNotBeforeDateKey
      ? daysUntilDateKey(schedule.retestNotBeforeDateKey, today)
      : undefined;
    return {
      blockId: activeBlock.id,
      focusTitle: focusTitle(activeBlock.focusDomain),
      focusDomain: activeBlock.focusDomain,
      weekNumber: schedule.currentWeekNumber,
      totalWeeks: 4,
      sessionsCompleteThisWeek: schedule.creditedTemplateIds.length,
      sessionsTargetThisWeek: activeBlock.sessionsPerWeekTarget,
      retestInDays,
    };
  }

  return undefined;
}

export function getWeekSessionStatuses(input: HaleAppLifecycleInput): WeekSessionStatus[] {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  const focus = activeBlock ? shortFocus(activeBlock.focusDomain) : 'capability';
  const schedule = activeBlock ? activeBlockSchedule({ ...input, today }, activeBlock) : null;

  return PLAN_SESSION_IDS.map((id, index) => {
    const templateId = schedule?.requiredTemplateIds[index];
    const completion = templateId ? scheduledCompletionForTemplate(schedule, templateId) : undefined;
    let status: WeekSessionStatus['status'];
    if (completion) {
      status = 'complete';
    } else if (templateId && schedule?.status === 'session_due' && schedule.nextTemplateId === templateId) {
      status = 'next';
    } else if (!activeBlock && index === 0) {
      status = 'next';
    } else {
      status = 'later';
    }
    return {
      id,
      title: `Session ${String.fromCharCode(65 + index)}`,
      status,
      focus: index === 0 ? 'Strength foundation' : index === 1 ? 'Movement control' : `Full-body ${focus}`,
      templateId: completion?.templateId ?? templateId,
      completedAt: completion?.completedAt,
    };
  });
}

export function getMovementSnapshot(input: { score?: CheckUpScore | null }): MovementSnapshot | undefined {
  const score = input.score;
  if (!score) return undefined;
  const snapshot: MovementSnapshot = {};
  for (const domain of score.domains) {
    if (!domain.measured) continue;
    const band = bandFromAgeRange(domain.ageLow, domain.ageHigh);
    if (!band) continue;
    if (domain.domain === 'strength') snapshot.strengthPower = band;
    if (domain.domain === 'balance') snapshot.balance = band;
    if (domain.domain === 'mobility') snapshot.mobility = band;
  }
  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

export function shouldShowRetestPrompt(input: HaleAppLifecycleInput): boolean {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (activeBlock) {
    const schedule = activeBlockSchedule({ ...input, today }, activeBlock);
    return schedule.status === 'retest_due';
  }
  return false;
}

export function shouldShowCleanSlatePrompt(input: HaleAppLifecycleInput): boolean {
  if (!hasCompletedFirstRunProfile(input.profile)) return false;
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (activeBlock) {
    const schedule = activeBlockSchedule({ ...input, today }, activeBlock);
    return schedule.status === 'session_due' && shouldRouteToRestart(schedule);
  }
  return false;
}

function shouldRouteToRestart(schedule: BlockScheduleState): boolean {
  return schedule.lapseState === 'resume_gently' || schedule.lapseState === 'restart_recommended';
}

function shouldShowWeeklyMicroCheck(input: HaleAppLifecycleInput): boolean {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (!activeBlock) return false;
  const completions = input.adherence?.completions ?? [];
  const schedule = activeBlockSchedule({ ...input, today }, activeBlock);
  return isMicroCheckDueForSchedule(schedule, completions);
}

function getActiveBlock(input: HaleAppLifecycleInput): MovementBlock | null {
  const blocks = input.adherence?.blocks ?? [];
  return getActiveMovementBlock(blocks);
}

function latestUsableCheckUpScore(
  history: HaleAppLifecycleInput['history'],
  assessments: readonly MovementAssessment[] | null | undefined
): CheckUpScore | null {
  return latestUsableOfficialCheckUpRecord(history, assessments)?.score ?? null;
}

function hasOfficialAssessment(adherence: AdherenceStoreState | null | undefined): boolean {
  return !!latestUsableOfficialAssessment(adherence?.assessments ?? []);
}

function hasCompletedFirstRunProfile(profile: UserProfile | null | undefined): boolean {
  return !!profile?.lifeGoal && !!profile.safetyProfile;
}

function normalizeToday(today: string): string {
  const parsed = Date.parse(today);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function activeBlockSchedule(
  input: HaleAppLifecycleInput,
  block: MovementBlock
): BlockScheduleState {
  return getBlockScheduleState({
    block,
    completions: input.adherence?.completions ?? [],
    generatedSessionSummaries: input.training?.generatedSessionSummaries ?? [],
    today: input.today,
  });
}

function scheduledCompletionForTemplate(
  schedule: BlockScheduleState | null,
  templateId: string
): { templateId?: string; completedAt?: string } | undefined {
  const currentWeek = schedule?.weeks.find((week) => week.weekIndex === schedule.currentWeekIndex);
  const credit = currentWeek?.credits.find((item) => item.templateId === templateId);
  return credit ? { templateId: credit.templateId, completedAt: credit.completedAt } : undefined;
}

function daysUntilDateKey(targetDateKey: string, today: string): number {
  const todayKey = blockScheduleDateKey(today);
  if (!todayKey) return 0;
  const days = daysBetweenBlockScheduleDates(todayKey, targetDateKey);
  return days === null ? 0 : Math.max(0, days);
}

// Existing scoring expresses a domain as an age-range estimate. Lower estimate
// maps to the stronger display band, so we invert the intuitive "higher score
// is stronger" mapping. Missing or non-finite ranges are simply omitted.
function bandFromAgeRange(ageLow: number, ageHigh: number): MovementSnapshotBand | undefined {
  if (!Number.isFinite(ageLow) || !Number.isFinite(ageHigh)) return undefined;
  const mid = (ageLow + ageHigh) / 2;
  if (mid <= 58) return 'strong';
  if (mid <= 72) return 'building';
  return 'starting_point';
}

function focusTitle(domain: MovementDomain): string {
  if (domain === 'strength_power') return 'Building stronger legs and everyday power';
  if (domain === 'balance') return 'Building steadier movement';
  return 'Building more mobile joints';
}

function shortFocus(domain: MovementDomain): string {
  if (domain === 'strength_power') return 'strength';
  return domain;
}

function scoreDomainToMovementDomain(domain: 'strength' | 'balance' | 'mobility'): MovementDomain {
  if (domain === 'strength') return 'strength_power';
  return domain;
}
