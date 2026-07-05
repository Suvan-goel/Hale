import {
  getBlockPurposeCopy as getAdherenceBlockPurposeCopy,
  getLapseRecoveryCopy as getAdherenceLapseRecoveryCopy,
  getLifeGoalDisplayText,
  type LifeGoal,
  type MovementBlock,
  type MovementDomain,
} from '../adherence';
import { domainLabel } from '../adherence/goalDomainMapping';

export function getBlockPurposeCopy(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  return getAdherenceBlockPurposeCopy(block, lifeGoal);
}

export function getManualCheckupCopy(_input: { activeBlock?: boolean } = {}): { title: string; body: string } {
  return {
    title: 'Check in on your progress',
    body: "Choose a quick check-in or complete a full Movement Check-Up whenever you're curious. These optional check-ups won't change your plan or Strength Profile.",
  };
}

export function getMicroCheckCopy(domain: MovementDomain): { title: string; body: string } {
  if (domain === 'balance') {
    return {
      title: 'One timed balance hold',
      body: 'A quick check-in for the steadiness you are building in this plan.',
    };
  }
  if (domain === 'mobility') {
    return {
      title: 'One simple mobility check',
      body: 'A short range-of-motion check keeps the trend visible between full check-ups.',
    };
  }
  return {
    title: 'Five fast chair stands',
    body: 'A quick power check for the leg strength you use every day.',
  };
}

export function getSessionIntroCopy({
  focusDomain,
  lifeGoal,
}: {
  focusDomain: MovementDomain;
  lifeGoal?: LifeGoal | null;
}): string {
  const benefit = sessionBenefitCopy(focusDomain);
  if (lifeGoal) {
    return `${benefit} It also supports your goal to ${lowercaseFirst(getLifeGoalDisplayText(lifeGoal))}.`;
  }
  return benefit;
}

function sessionBenefitCopy(focusDomain: MovementDomain): string {
  if (focusDomain === 'balance') {
    return "Today's balance work helps you practice steadier standing, walking, and turning.";
  }
  if (focusDomain === 'mobility') {
    return "Today's mobility work helps reaching, bending, and everyday movement feel more comfortable.";
  }
  return "Today's strength work helps with standing up, stairs, and carrying everyday things.";
}

function lowercaseFirst(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'stay capable';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export function getLapseRecoveryCopy(state: Parameters<typeof getAdherenceLapseRecoveryCopy>[0], lifeGoal?: LifeGoal | null) {
  return getAdherenceLapseRecoveryCopy(state, lifeGoal);
}

export function getReportCopy({
  focusDomain,
  hasComparison,
}: {
  focusDomain: MovementDomain;
  hasComparison: boolean;
}): string {
  if (hasComparison) {
    return `Your latest ${domainLabel(focusDomain)} check-up helps Hale update your plan.`;
  }
  return 'Your latest check-up result will appear here once it is connected.';
}
