import {
  getBlockPurposeCopy as getAdherenceBlockPurposeCopy,
  getLapseRecoveryCopy as getAdherenceLapseRecoveryCopy,
  getLifeGoalDisplayText,
  type LifeGoal,
  type MovementBlock,
  type MovementDomain,
} from '../adherence';
import { domainLabel, domainShortLabel } from '../adherence/goalDomainMapping';
import type { HaleUserFlowState, NextBestAction } from './types';

export function getBlockPurposeCopy(block: MovementBlock, lifeGoal?: LifeGoal | null): string {
  return getAdherenceBlockPurposeCopy(block, lifeGoal);
}

export function getNextBestActionCopy({
  state,
  block,
  lifeGoal,
}: {
  state: HaleUserFlowState;
  block?: MovementBlock | null;
  lifeGoal?: LifeGoal | null;
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
        title: 'Set up your Movement Check-Up',
        body: 'Prop your phone at hip height, step back, and Hale will guide the camera setup.',
        primaryCta: 'Set up camera',
        primaryRoute: 'camera-setup',
      };
    case 'needs_baseline_checkup':
      return {
        title: 'Start with your Movement Check-Up',
        body: 'In about 10 minutes, Hale will estimate your strength, balance, and mobility and build your first plan.',
        primaryCta: 'Start check-up',
        primaryRoute: 'camera-setup',
      };
    case 'baseline_checkup_incomplete':
      return {
        title: 'Finish your Movement Check-Up',
        body: 'Complete the baseline so Hale can build your first 4-week block.',
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
        title: 'Create your first 4-week block',
        body: focusBody(block, lifeGoal, 'Hale has enough information to turn your check-up into a plan.'),
        primaryCta: 'Create my block',
        primaryRoute: 'create-block',
      };
    case 'active_block_session_due':
      return {
        title: "Today's session is ready",
        body: sessionBody(block, lifeGoal),
        primaryCta: "Start today's session",
        primaryRoute: 'training',
        secondaryCta: 'Do 60-second micro-check',
        secondaryRoute: 'microcheck',
      };
    case 'active_block_micro_check_due':
      return {
        title: 'Do your 60-second check-in',
        body: 'Micro-checks keep your trend line alive between full check-ups.',
        primaryCta: 'Start micro-check',
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
        secondaryCta: 'Do 60-second micro-check',
        secondaryRoute: 'microcheck',
      };
    case 'active_block_slightly_behind':
      return {
        title: 'Keep the week moving',
        body: 'Life gets busy. One short session today is enough to support your progress.',
        primaryCta: 'Start a short session',
        primaryRoute: 'restart-intro',
        secondaryCta: 'Start Movement Check-Up',
        secondaryRoute: 'manual-checkup',
      };
    case 'active_block_restart_needed':
      return {
        title: 'Clean slate',
        body: 'Life gets busy. Hale will ease you back in with a shorter restart session.',
        primaryCta: 'Restart gently',
        primaryRoute: 'restart-intro',
        secondaryCta: 'Start Movement Check-Up',
        secondaryRoute: 'manual-checkup',
      };
    case 'active_block_retest_due':
      return {
        title: 'Your 4-week re-test is ready',
        body: 'Repeat the check-up to add another data point.',
        primaryCta: 'Start re-test',
        primaryRoute: 'official-retest',
        secondaryCta: 'View block',
        secondaryRoute: 'home-block',
      };
    case 'block_complete_needs_report':
      return {
        title: 'Your 4-week report is ready',
        body: 'Review your sessions, check-ins, and re-test before Hale builds the next block.',
        primaryCta: 'View report',
        primaryRoute: 'block-report',
      };
    case 'report_ready':
      return {
        title: 'Your 4-week report is ready',
        body: 'Review the latest re-test and choose the next 4-week focus.',
        primaryCta: 'View report',
        primaryRoute: 'block-report',
        secondaryCta: 'Start next block',
        secondaryRoute: 'next-block',
      };
    case 'needs_next_block':
      return {
        title: 'Start your next 4-week block',
        body: 'Use your latest check-up to keep building from where you are now.',
        primaryCta: 'Start next block',
        primaryRoute: 'next-block',
        secondaryCta: 'Start Movement Check-Up',
        secondaryRoute: 'manual-checkup',
      };
    case 'no_active_block':
      return {
        title: 'Start with a Movement Check-Up',
        body: 'Hale will estimate strength, balance, and mobility before building your plan.',
        primaryCta: 'Start check-up',
        primaryRoute: 'camera-setup',
      };
  }
}

export function getManualCheckupCopy(): { title: string; body: string } {
  return {
    title: 'Start a Movement Check-Up',
    body: 'Full check-ups are most useful every 4 weeks. Mid-block, a 60-second check-in may be the better next step.',
  };
}

export function getMicroCheckCopy(domain: MovementDomain): { title: string; body: string } {
  if (domain === 'balance') {
    return {
      title: 'One timed balance hold',
      body: 'A quick check-in for the steadiness you are building this block.',
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
  const domain = domainShortLabel(focusDomain);
  if (lifeGoal) {
    return `Today we are training ${domain} to support ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`;
  }
  return `Today we are training ${domain} so your block keeps a clear focus.`;
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
    return `Your ${domainLabel(focusDomain)} re-test adds another data point for your plan.`;
  }
  return 'Your re-test result will appear here once the Movement Check-Up is connected.';
}

function sessionBody(block?: MovementBlock | null, lifeGoal?: LifeGoal | null): string {
  if (block && lifeGoal) return `20 minutes to support progress toward ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`;
  if (block) return `20 minutes to keep building ${domainShortLabel(block.focusDomain)}.`;
  return '20 minutes to support your progress and keep building toward your goal.';
}

function focusBody(block?: MovementBlock | null, lifeGoal?: LifeGoal | null, fallback?: string): string {
  if (!block) return fallback ?? 'Hale will use your latest check-up to choose the first focus.';
  return getBlockPurposeCopy(block, lifeGoal);
}
