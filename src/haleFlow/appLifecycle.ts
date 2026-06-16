import {
  blockProgress,
  completedTrainingSessions,
  currentWeekProgress,
  daysBetween,
  daysUntil,
  getActiveMovementBlock,
  lastTrainingCompletionAt,
  microCheckCompletedThisWeek,
  sessionsCompletedThisWeek,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementDomain,
} from '../adherence';
import type { StoredCheckUp } from '../history';
import type { UserProfile } from '../profile';
import { scoreCheckUp, type CheckUpScore } from '../scoring';
import type { TrainingState } from '../training';
import { PLAN_SESSION_IDS, planSessionIdForTemplateId, type PlanSessionId } from './sessionIds';

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
  const latestScore = latestCheckUpScore(input.history);
  const hasBaseline = !!latestScore || hasOfficialAssessment(input.adherence);
  const activeBlockSummary = getActiveBlockSummary({ ...input, today });
  const movementSnapshot = getMovementSnapshot({ score: latestScore });
  const weekSessionStatuses = getWeekSessionStatuses({ ...input, today });
  const retestDueDate = activeBlock?.retestDate ?? input.training?.progress.retestDueAt ?? undefined;

  let state: HaleLifecycleState;
  let reason: string;
  if (!hasCompletedFirstRunProfile(input.profile)) {
    state = 'needs_onboarding';
    reason = 'life goal or safety profile is missing';
  } else if (!hasBaseline) {
    state = 'needs_baseline_checkup';
    reason = 'profile exists but no Movement Check-Up is stored';
  } else if (!activeBlock && !input.training?.block) {
    state = 'needs_block_creation';
    reason = 'baseline exists but no active 4-week block is stored';
  } else if (shouldShowRetestPrompt({ ...input, today })) {
    state = 'monthly_retest_due';
    reason = 'active block is complete or due for re-test';
  } else if (shouldShowCleanSlatePrompt({ ...input, today })) {
    state = 'inactive_restart';
    reason = 'active block exists and no training session is recorded in 14+ days';
  } else if (totalCompletedSessions(input) === 0) {
    state = 'first_session_ready';
    reason = 'active block exists and no session has been completed yet';
  } else if (activeBlock && sessionsCompletedThisWeek(activeBlock, input.adherence?.completions ?? [], today) >= activeBlock.sessionsPerWeekTarget) {
    state = 'week_complete';
    reason = 'weekly session target is complete';
  } else if (shouldShowWeeklyMicroCheck({ ...input, today })) {
    state = 'weekly_micro_check_due';
    reason = 'at least one session is complete this week and the weekly micro-check is still open';
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
        subtitle: 'Start with a simple Movement Check-Up to build your first 4-week block.',
        ctaLabel: 'Start',
      };
    case 'needs_baseline_checkup':
      return {
        type: 'start_checkup',
        title: 'Ready for your first Movement Check-Up?',
        subtitle: 'Check strength, balance, and mobility from home.',
        ctaLabel: 'Start Check-Up',
      };
    case 'needs_block_creation':
      return {
        type: 'create_block',
        title: 'Your results are ready',
        subtitle: 'Create your first 4-week block from your Movement Check-Up.',
        ctaLabel: 'Create 4-Week Block',
        tone: 'progress',
      };
    case 'first_session_ready':
      return {
        type: 'start_first_session',
        title: 'Your first Hale Session is ready',
        subtitle: 'Start your first step toward feeling stronger, steadier, and more mobile.',
        ctaLabel: 'Start First Session',
        tone: 'progress',
      };
    case 'weekly_micro_check_due':
      return {
        type: 'start_micro_check',
        title: '60-second check-in',
        subtitle: 'A quick check to keep your block on track.',
        ctaLabel: 'Start Micro-Check',
        tone: 'progress',
      };
    case 'monthly_retest_due':
      return {
        type: 'start_retest',
        title: "It's time to re-test",
        subtitle: 'Repeat your Movement Check-Up to see what changed.',
        ctaLabel: 'Start Re-Test',
        tone: 'retest',
      };
    case 'week_complete':
      return {
        type: 'explore_extra_sessions',
        title: "You've completed your sessions this week",
        subtitle: 'Protect your progress with an optional mobility reset.',
        ctaLabel: 'Explore Extra Sessions',
        tone: 'gentle',
      };
    case 'inactive_restart':
      return {
        type: 'start_gentle_restart',
        title: 'Clean slate',
        subtitle: "Let's restart gently with a shorter session.",
        ctaLabel: 'Start Gentle Session',
        tone: 'gentle',
      };
    case 'normal_training_day':
    default:
      return {
        type: 'start_today_session',
        title: "Today's Hale Session",
        subtitle: 'Your next session is adjusted from your check-up and recent progress.',
        ctaLabel: 'Start',
      };
  }
}

export function getActiveBlockSummary(input: HaleAppLifecycleInput): ActiveBlockSummary | undefined {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (activeBlock) {
    const week = currentWeekProgress(activeBlock, input.adherence?.completions ?? [], today);
    return {
      blockId: activeBlock.id,
      focusTitle: focusTitle(activeBlock.focusDomain),
      focusDomain: activeBlock.focusDomain,
      weekNumber: week.weekNumber,
      totalWeeks: 4,
      sessionsCompleteThisWeek: week.sessionsCompleted,
      sessionsTargetThisWeek: week.sessionsTarget,
      retestInDays: daysUntil(activeBlock.retestDate, today),
    };
  }

  // Legacy fallback: older state can have a training block without a persisted
  // MovementBlock. This keeps existing users out of a broken "create block"
  // state without writing a migration in this stage.
  const legacy = input.training?.block;
  if (!legacy) return undefined;
  const completed = input.training?.progress.completedSessions ?? 0;
  const weekNumber = Math.min(4, Math.floor(completed / Math.max(1, legacy.sessionsPerWeek)) + 1);
  return {
    focusTitle: legacy.weakestDomain ? focusTitle(scoreDomainToMovementDomain(legacy.weakestDomain)) : 'Your 4-week block',
    focusDomain: legacy.weakestDomain ? scoreDomainToMovementDomain(legacy.weakestDomain) : undefined,
    weekNumber,
    totalWeeks: 4,
    sessionsCompleteThisWeek: completed % Math.max(1, legacy.sessionsPerWeek),
    sessionsTargetThisWeek: legacy.sessionsPerWeek,
    retestInDays: input.training?.progress.retestDueAt ? 0 : undefined,
  };
}

export function getWeekSessionStatuses(input: HaleAppLifecycleInput): WeekSessionStatus[] {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  const focus = activeBlock ? shortFocus(activeBlock.focusDomain) : 'capability';
  const completedById = activeBlock ? weeklyTemplateCompletions(input, activeBlock, today) : new Map<PlanSessionId, { templateId?: string; completedAt?: string }>();
  const fallbackCompletedThisWeek = activeBlock
    ? sessionsCompletedThisWeek(activeBlock, input.adherence?.completions ?? [], today)
    : Math.min(3, input.training?.progress.completedSessions ?? 0);
  const fallbackCount = Math.max(0, Math.min(3, fallbackCompletedThisWeek));
  const usingTemplateStatus = completedById.size > 0;
  let nextAssigned = false;

  return PLAN_SESSION_IDS.map((id, index) => {
    const completion = completedById.get(id);
    let status: WeekSessionStatus['status'];
    if (completion) {
      status = 'complete';
    } else if (usingTemplateStatus) {
      status = nextAssigned ? 'later' : 'next';
      nextAssigned = true;
    } else {
      status = statusForIndex(index, fallbackCount);
    }
    return {
      id,
      title: `Session ${String.fromCharCode(65 + index)}`,
      status,
      focus: index === 0 ? 'Strength foundation' : index === 1 ? 'Movement control' : `Full-body ${focus}`,
      templateId: completion?.templateId,
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
  if (input.training?.progress.retestDueAt) return true;
  if (activeBlock) {
    const completions = input.adherence?.completions ?? [];
    if (activeBlock.status === 'completed') return true;
    if (blockProgress(activeBlock, completions).completedSessions >= activeBlock.totalPlannedSessions) return true;
    if (daysBetween(activeBlock.startDate, today) >= 28) return true;
    if (daysUntil(activeBlock.retestDate, today) === 0) return true;
  }
  const legacy = input.training?.block;
  if (!legacy) return false;
  return (input.training?.progress.completedSessions ?? 0) >= legacy.weeks * legacy.sessionsPerWeek;
}

export function shouldShowCleanSlatePrompt(input: HaleAppLifecycleInput): boolean {
  if (!hasCompletedFirstRunProfile(input.profile)) return false;
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (activeBlock) {
    const lastAt = lastTrainingCompletionAt(activeBlock, input.adherence?.completions ?? []);
    const inactiveDays = lastAt ? daysBetween(lastAt, today) : daysBetween(activeBlock.startDate, today);
    return inactiveDays >= 14;
  }
  const lastAt = input.training?.progress.lastSessionAt;
  return !!input.training?.block && !!lastAt && daysBetween(lastAt, today) >= 14;
}

function shouldShowWeeklyMicroCheck(input: HaleAppLifecycleInput): boolean {
  const today = normalizeToday(input.today);
  const activeBlock = getActiveBlock(input);
  if (!activeBlock) return false;
  const completions = input.adherence?.completions ?? [];
  const sessions = sessionsCompletedThisWeek(activeBlock, completions, today);
  return sessions > 0 && sessions < activeBlock.sessionsPerWeekTarget && !microCheckCompletedThisWeek(activeBlock, completions, today);
}

function getActiveBlock(input: HaleAppLifecycleInput): MovementBlock | null {
  const blocks = input.adherence?.blocks ?? [];
  return getActiveMovementBlock(blocks);
}

function latestCheckUpScore(history: HaleAppLifecycleInput['history']): CheckUpScore | null {
  const latest = history && history.length > 0 ? history[history.length - 1] : null;
  return latest ? scoreCheckUp(latest.checkUp) : null;
}

function hasOfficialAssessment(adherence: AdherenceStoreState | null | undefined): boolean {
  return !!adherence?.assessments.some((assessment) => assessment.isOfficialForProgress && assessment.status === 'completed');
}

function hasCompletedFirstRunProfile(profile: UserProfile | null | undefined): boolean {
  return !!profile?.lifeGoal && !!profile.safetyProfile;
}

function totalCompletedSessions(input: HaleAppLifecycleInput): number {
  const activeBlock = getActiveBlock(input);
  if (activeBlock) return completedTrainingSessions(activeBlock, input.adherence?.completions ?? []).length;
  return input.training?.progress.completedSessions ?? 0;
}

function normalizeToday(today: string): string {
  const parsed = Date.parse(today);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function statusForIndex(index: number, completedCount: number): WeekSessionStatus['status'] {
  if (index < completedCount) return 'complete';
  if (index === completedCount) return 'next';
  return 'later';
}

function weeklyTemplateCompletions(
  input: HaleAppLifecycleInput,
  block: MovementBlock,
  today: string
): Map<PlanSessionId, { templateId?: string; completedAt?: string }> {
  const out = new Map<PlanSessionId, { templateId?: string; completedAt?: string }>();
  const inWeek = isInBlockWeek(block, today);
  for (const completion of completedTrainingSessions(block, input.adherence?.completions ?? [])) {
    if (!inWeek(completion.completedAt)) continue;
    const id = planSessionIdForTemplateId(completion.plannedDate);
    if (id) out.set(id, { templateId: templateIdFromPlannedDate(completion.plannedDate), completedAt: completion.completedAt });
  }
  for (const summary of input.training?.generatedSessionSummaries ?? []) {
    if (!summary.completedAt || (summary.blockId && summary.blockId !== block.id)) continue;
    if (!inWeek(summary.completedAt)) continue;
    const id = planSessionIdForTemplateId(summary.templateId);
    if (id && !out.has(id)) out.set(id, { templateId: summary.templateId, completedAt: summary.completedAt });
  }
  return out;
}

function templateIdFromPlannedDate(plannedDate: string | undefined): string | undefined {
  return plannedDate?.split(':')[0];
}

function isInBlockWeek(block: MovementBlock, today: string): (value: string) => boolean {
  const week = currentWeekProgress(block, [], today).weekNumber;
  const start = new Date(block.startDate);
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date >= start && date < end;
  };
}

// Existing scoring expresses a domain as a movement-age range. Lower movement
// age is better, so we invert the intuitive "higher score is stronger" mapping:
// younger-than-late-50s => strong, typical 60s => building, older ranges =>
// starting point. Missing or non-finite ranges are simply omitted.
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
