import {
  getBlockPurposeCopy as getAdherenceBlockPurposeCopy,
  getLapseRecoveryCopy as getAdherenceLapseRecoveryCopy,
  getLifeGoalDisplayText,
  movementBlockDomainFocus,
  type LifeGoal,
  type MovementBlock,
  type MovementDomain,
} from '../adherence';
import { domainLabel, domainShortLabel } from '../adherence/goalDomainMapping';
import type { HaleUserFlowState, MicroCheckDefinition, NextBestAction } from './types';

export function getBlockPurposeCopy(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  return getAdherenceBlockPurposeCopy(block, lifeGoal);
}

export function getNextBestActionCopy({
  state,
  block,
  lifeGoal,
  microCheckTarget,
}: {
  state: HaleUserFlowState;
  block?: MovementBlock | null;
  lifeGoal?: LifeGoal | null;
  microCheckTarget?: MicroCheckDefinition;
}): Omit<NextBestAction, 'state'> {
  switch (state) {
    case 'needs_life_goal':
      return {
        title: 'What do you want your body to keep letting you do?',
        body: 'Choose the real-life reason Hale should build toward.',
        primaryCta: 'Choose my goal',
        primaryRoute: 'life-goal',
      };
    case 'needs_profile_safety':
      return {
        title: 'Set your starting point',
        body: 'A short profile helps Hale choose gentler starts and equipment substitutions.',
        primaryCta: 'Complete profile',
        primaryRoute: 'safety-profile',
      };
    case 'needs_camera_setup':
      return {
        title: 'Set up your check-up',
        body: 'Prop your phone at hip height, step back, and Hale will guide the camera setup.',
        primaryCta: 'Set up camera',
        primaryRoute: 'camera-setup',
      };
    case 'needs_baseline_checkup':
      return {
        title: 'Start with your check-up',
        body: 'In about 10 minutes, Hale will estimate your strength, balance, and mobility and build your first plan.',
        primaryCta: 'Start check-up',
        primaryRoute: 'camera-setup',
      };
    case 'baseline_checkup_incomplete':
      return {
        title: 'Finish your check-up',
        body: 'Complete your check-up so Hale can build your first plan.',
        primaryCta: 'Continue check-up',
        primaryRoute: 'checkup',
      };
    case 'baseline_checkup_invalid':
      return {
        title: "Let's repeat that",
        body: 'The camera could not estimate this clearly enough. A quick retake will give your plan a clearer starting point.',
        primaryCta: 'Retake check-up',
        primaryRoute: 'checkup-retake',
      };
    case 'baseline_complete_needs_block':
      return {
        title: 'Your first plan is ready',
        body: focusBody(block, lifeGoal, 'Hale has used your check-up to prepare your starting plan.'),
        primaryCta: 'View my plan',
        primaryRoute: 'create-block',
      };
    case 'active_block_session_due':
      return {
        title: "Today's session is ready",
        body: sessionBody(block, lifeGoal),
        primaryCta: "Start today's session",
        primaryRoute: 'training',
        secondaryCta: 'Do 60-second check-in',
        secondaryRoute: 'microcheck',
      };
    case 'active_block_micro_check_due':
      return {
        title: microCheckTarget ? `${microCheckDomainLabel(microCheckTarget.domain)} check-in` : 'Do your 60-second check-in',
        body: microCheckTarget?.body ?? 'Quick check-ins help Hale adjust between full check-ups.',
        primaryCta: 'Start check-in',
        primaryRoute: 'microcheck',
        secondaryCta: "Start today's session",
        secondaryRoute: 'training',
      };
    case 'active_block_on_track':
      return {
        title: 'You are on track',
        body: block ? getBlockPurposeCopy(block, lifeGoal) : 'Keep building strength, balance, and mobility.',
        primaryCta: "Start today's session",
        primaryRoute: 'training',
        secondaryCta: 'Do 60-second check-in',
        secondaryRoute: 'microcheck',
      };
    case 'active_block_slightly_behind':
      return {
        title: 'Keep the week moving',
        body: 'Life gets busy. One short session today is enough to support your progress.',
        primaryCta: 'Start a short session',
        primaryRoute: 'restart-intro',
        secondaryCta: 'Start check-up',
        secondaryRoute: 'manual-checkup',
      };
    case 'active_block_restart_needed':
      return {
        title: 'Clean slate',
        body: 'Life gets busy. Hale will ease you back in with a shorter restart session.',
        primaryCta: 'Restart gently',
        primaryRoute: 'restart-intro',
        secondaryCta: 'Start check-up',
        secondaryRoute: 'manual-checkup',
      };
    case 'active_block_retest_due':
      return {
        title: 'Your next check-up is ready',
        body: 'Repeat the check-up to see what has changed.',
        primaryCta: 'Start check-up',
        primaryRoute: 'official-retest',
        secondaryCta: 'View plan',
        secondaryRoute: 'home-block',
      };
    case 'block_complete_needs_report':
      return {
        title: 'Your next plan is ready',
        body: 'Your latest check-up is saved. Open your next plan when you are ready.',
        primaryCta: 'View plan',
        primaryRoute: 'next-block',
        secondaryCta: 'See progress',
        secondaryRoute: 'progress',
      };
    case 'report_ready':
      return {
        title: 'Your next plan is ready',
        body: 'Your latest check-up is saved. Open your next plan when you are ready.',
        primaryCta: 'View plan',
        primaryRoute: 'next-block',
        secondaryCta: 'See progress',
        secondaryRoute: 'progress',
      };
    case 'needs_next_block':
      return {
        title: 'View your next 4-week plan',
        body: 'Use your latest check-up to keep building from where you are now.',
        primaryCta: 'View plan',
        primaryRoute: 'next-block',
        secondaryCta: 'Start check-up',
        secondaryRoute: 'manual-checkup',
      };
    case 'no_active_block':
      return {
        title: 'Start with a check-up',
        body: 'Hale will estimate strength, balance, and mobility before building your plan.',
        primaryCta: 'Start check-up',
        primaryRoute: 'camera-setup',
      };
  }
}

export function getManualCheckupCopy(_input: { activeBlock?: boolean } = {}): { title: string; body: string } {
  return {
    title: 'Check in on your progress',
    body: "Choose a quick check-in or complete a full Movement Check-Up whenever you're curious. These optional check-ups won't change your plan or Movement Profile.",
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

function sessionBody(block?: MovementBlock | null, lifeGoal?: LifeGoal | null): string {
  if (block && lifeGoal) return `20 minutes to support progress toward ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`;
  const focusDomain = movementBlockDomainFocus(block);
  if (focusDomain) return `20 minutes to keep building ${domainShortLabel(focusDomain)}.`;
  if (block) return '20 minutes to build strength, balance, and mobility.';
  return '20 minutes to support your progress and keep building toward your goal.';
}

function microCheckDomainLabel(domain: MovementDomain): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function focusBody(block?: MovementBlock | null, lifeGoal?: LifeGoal | null, fallback?: string): string {
  if (!block) return fallback ?? 'Hale will use your latest check-up to choose the first focus.';
  return getBlockPurposeCopy(block, lifeGoal);
}
