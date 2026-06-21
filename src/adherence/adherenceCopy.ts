import { daysUntil } from './dateUtils';
import {
  domainLabel,
  domainShortLabel,
  getLifeGoalDisplayText,
  getLifeGoalTrainingRelevance,
} from './goalDomainMapping';
import type {
  AdherenceState,
  LifeGoal,
  MovementBlock,
  MovementDomain,
  NotificationEventType,
} from './types';

// Copy guardrails: no shame, no streak pressure, no clinical claims, and no
// unsupported counterfactual decline math.

export { getLifeGoalDisplayText, getLifeGoalTrainingRelevance };

export function getBlockTitle(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  const goal = lifeGoal ? goalTitleFragment(lifeGoal) : null;
  if (goal) return `Your ${goal} block`;
  return `Your ${domainShortLabel(block.focusDomain)} block`;
}

export function getBlockPurposeCopy(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  const domain = domainShortLabel(block.focusDomain);
  if (!lifeGoal) {
    return `This 4-week block focuses on ${domain} so your training has a clear place to start.`;
  }
  switch (lifeGoal.category) {
    case 'stairs':
      return `This 4-week block focuses on ${domain} so you can feel steadier on stairs.`;
    case 'travel':
      return block.focusDomain === 'strength_power'
        ? 'This block supports the leg power you use for travel, stairs, and longer walks.'
        : `This block builds ${domain} for travel days, long walks, and moving with confidence.`;
    case 'grandchildren':
      return 'You said you want to keep up with your children or grandchildren. This block builds the strength and mobility that support that.';
    case 'walking_hiking_sport':
      return `This block builds ${domain} for the walking, hiking, or sport you want to keep enjoying.`;
    case 'gardening_hobbies':
      return `This block supports the ${domain} that helps you garden and do hobbies comfortably.`;
    case 'floor_confidence':
      return `This block builds ${domain} for getting down and back up with more confidence.`;
    case 'carrying_loads':
      return 'This block supports the strength you use for shopping, bags, and everyday loads.';
    case 'independence':
      return `This block builds ${domain} to support the independence you care about.`;
    case 'noticed_decline':
      return `Your latest check-up pointed to ${domain}. This block starts there, with support from the other domains.`;
    case 'custom':
      return `You said this matters: ${getLifeGoalDisplayText(lifeGoal)}. This block builds the ${domain} that supports it.`;
  }
}

export function getDashboardCopy({
  block,
  lifeGoal,
  adherenceState,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  adherenceState: AdherenceState;
}): string {
  if (adherenceState === 'ready_for_retest') {
    return 'Your 4-week re-test is close. It will add another data point.';
  }
  if (adherenceState === 'inactive_14_days' || adherenceState === 'inactive_this_week') {
    return 'Clean slate. Hale will ease you back in with a shorter restart session.';
  }
  if (adherenceState === 'missed_one_session' || adherenceState === 'slightly_behind') {
    return 'Life gets busy. One short session today keeps the block alive.';
  }
  const goal = lifeGoal ? getLifeGoalDisplayText(lifeGoal).toLowerCase() : null;
  return goal
    ? `You are supporting progress for what matters: ${goal}.`
    : `You are supporting your ${domainShortLabel(block.focusDomain)} progress this month.`;
}

export function getLapseRecoveryCopy(
  state: AdherenceState,
  _lifeGoal?: LifeGoal | null
): { title: string; body: string; cta: string } {
  if (state === 'inactive_14_days') {
    return {
      title: 'Start from where your body is today',
      body: "Let's restart gently and keep the plan moving from here.",
      cta: 'Restart my block',
    };
  }
  if (state === 'inactive_this_week') {
    return {
      title: 'Clean slate',
      body: 'Life gets in the way. Hale will ease you back in with a shorter restart session.',
      cta: 'Restart gently',
    };
  }
  if (state === 'missed_one_session' || state === 'slightly_behind') {
    return {
      title: 'No problem - keep the week moving',
      body: 'One shorter session today is enough to support your progress.',
      cta: 'Start a short session',
    };
  }
  return {
    title: 'Keep your progress moving',
    body: 'One shorter session today is enough to keep your plan moving.',
    cta: 'Start today',
  };
}

export function getProtectionCopy({
  lifeGoal,
  focusDomain,
  adherenceState,
}: {
  lifeGoal?: LifeGoal | null;
  focusDomain?: MovementDomain | null;
  adherenceState?: AdherenceState;
  progressTrend?: 'improving' | 'steady' | 'unknown';
}): string {
  if (adherenceState === 'inactive_this_week' || adherenceState === 'inactive_14_days') {
    return 'Clean slate today. A shorter session is enough to restart gently.';
  }
  if (lifeGoal) {
    return `Today supports the goal you chose: ${getLifeGoalDisplayText(lifeGoal)}.`;
  }
  if (focusDomain === 'balance') return 'Keep your balance steady.';
  if (focusDomain === 'mobility') return 'Support the mobility you use every day.';
  return 'Support the strength you use every day.';
}

export function getWeeklySummaryCopy({
  block,
  lifeGoal,
  sessionsCompleted,
  microCheckCompleted,
  adherenceState,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  sessionsCompleted: number;
  microCheckCompleted: boolean;
  adherenceState: AdherenceState;
}): { title: string; body: string; nextFocus: string } {
  const goal = lifeGoal ? goalSummaryFragment(lifeGoal) : domainShortLabel(block.focusDomain);
  if (sessionsCompleted >= block.sessionsPerWeekTarget) {
    return {
      title: 'Good week',
      body: `You completed ${sessionsCompleted} sessions${microCheckCompleted ? ' and your 60-second check-in' : ''}. You supported your ${domainShortLabel(block.focusDomain)} progress for ${goal}.`,
      nextFocus: `Next week, keep building ${domainShortLabel(block.focusDomain)} with steady practice.`,
    };
  }
  if (adherenceState === 'inactive_this_week' || adherenceState === 'inactive_14_days') {
    return {
      title: 'Fresh start',
      body: 'The block is still here. Start next week with one shorter restart session.',
      nextFocus: 'Next week begins with a clean slate.',
    };
  }
  if (sessionsCompleted > 0) {
    return {
      title: 'You restarted this week',
      body: 'That matters. Next week is a clean slate, with shorter sessions available if you need them.',
      nextFocus: `Next week, rebuild rhythm around ${domainShortLabel(block.focusDomain)}.`,
    };
  }
  return {
    title: 'A quiet week',
    body: 'The plan is ready when life has room again. One short session is enough to restart.',
    nextFocus: `Next week, start with ${domainShortLabel(block.focusDomain)}.`,
  };
}

export function getSupportNotificationCopy(userName: string | null | undefined): string {
  const name = userName?.trim() || 'Someone you support';
  return `${name} asked Hale to let you know they have not checked in this week. A quick encouraging message could help them restart.`;
}

export function getNotificationCopy(type: NotificationEventType): string {
  switch (type) {
    case 'planned_session':
      return 'Your Hale session is ready. 20 minutes to support your progress.';
    case 'weekly_micro_check':
      return 'Time for a 60-second check-in. Keep your trend line alive.';
    case 'retest_approaching':
      return 'Your 4-week re-test is coming up. It will add another data point.';
    case 'lapse_recovery':
      return 'Clean slate today. Start with a shorter session.';
    case 'supporter_milestone':
      return 'A Hale milestone is ready to share with your supporter.';
    case 'missed_week_support':
      return 'Your supporter can send a quick note to help you restart gently.';
  }
}

export function retestCountdownCopy(block: MovementBlock, nowIso: string): string {
  const days = daysUntil(block.retestDate, nowIso);
  if (days === 0) return 'Re-test today';
  if (days === 1) return 'Re-test tomorrow';
  return `Re-test in ${days} days`;
}

function goalTitleFragment(goal: LifeGoal): string | null {
  switch (goal.category) {
    case 'stairs':
      return 'steady-on-stairs';
    case 'travel':
      return 'travel-ready';
    case 'floor_confidence':
      return 'floor-confidence';
    case 'carrying_loads':
      return 'everyday-strength';
    case 'independence':
      return 'stay-capable';
    default:
      return null;
  }
}

function goalSummaryFragment(goal: LifeGoal): string {
  switch (goal.category) {
    case 'stairs':
      return 'stairs';
    case 'travel':
      return 'travel and longer walks';
    case 'grandchildren':
      return 'keeping up with family';
    case 'custom':
      return getLifeGoalDisplayText(goal).toLowerCase();
    default:
      return getLifeGoalDisplayText(goal).toLowerCase();
  }
}

export function assessmentComparisonCopy({
  before,
  after,
  focusDomain,
}: {
  before?: number | null;
  after?: number | null;
  focusDomain: MovementDomain;
}): string {
  if (before === null || before === undefined || after === null || after === undefined) {
    return 'Your re-test result will appear here once the Movement Check-Up is connected.';
  }
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    return 'Your re-test result will appear here once the Movement Check-Up is connected.';
  }
  if (after < before) {
    return `Your ${domainLabel(focusDomain)} range added a new data point in the latest re-test.`;
  }
  if (after === before) {
    return `Your ${domainLabel(focusDomain)} range was similar in the latest re-test.`;
  }
  return `Your ${domainLabel(focusDomain)} result gives Hale a clear starting point for the next block.`;
}
