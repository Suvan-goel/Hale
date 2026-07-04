import { daysUntil } from './dateUtils';
import { movementBlockDomainFocus } from './blockFocus';
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
} from './types';

// Copy guardrails: no shame, no streak pressure, no clinical claims, and no
// unsupported counterfactual decline math.

export { getLifeGoalDisplayText, getLifeGoalTrainingRelevance };

export function getBlockTitle(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  const goal = lifeGoal ? goalTitleFragment(lifeGoal) : null;
  if (goal) return `Your ${goal} block`;
  const focusDomain = movementBlockDomainFocus(block);
  return focusDomain ? `Your ${domainShortLabel(focusDomain)} block` : 'Your balanced block';
}

export function getBlockPurposeCopy(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  const focusDomain = movementBlockDomainFocus(block);
  const domain = focusDomain ? domainShortLabel(focusDomain) : 'strength, balance, and mobility';
  if (!lifeGoal) {
    return focusDomain
      ? `This 4-week block focuses on ${domain} so your training has a clear place to start.`
      : 'This 4-week block balances strength, steadiness, and mobility so your training has a clear place to start.';
  }
  switch (lifeGoal.category) {
    case 'stairs_walks':
      return `This 4-week block focuses on ${domain} so stairs and walks feel steadier.`;
    case 'grandchildren':
      return 'You said you want to keep up with your children or grandchildren. This block builds the strength and mobility that support that.';
    case 'bend_reach_carry':
      return `This block supports the ${domain} you use for bending, reaching, and carrying.`;
    case 'independence':
      return `This block builds ${domain} to support the independence you care about.`;
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
  const focusDomain = movementBlockDomainFocus(block);
  return goal
    ? `You are supporting progress for what matters: ${goal}.`
    : focusDomain
      ? `You are supporting your ${domainShortLabel(focusDomain)} progress this month.`
      : 'You are supporting strength, balance, and mobility this month.';
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

export function retestCountdownCopy(block: MovementBlock, nowIso: string): string {
  const days = daysUntil(block.retestDate, nowIso);
  if (days === 0) return 'Re-test today';
  if (days === 1) return 'Re-test tomorrow';
  return `Re-test in ${days} days`;
}

function goalTitleFragment(goal: LifeGoal): string | null {
  switch (goal.category) {
    case 'stairs_walks':
      return 'stairs-and-walks';
    case 'bend_reach_carry':
      return 'everyday-strength';
    case 'independence':
      return 'stay-capable';
    default:
      return null;
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
