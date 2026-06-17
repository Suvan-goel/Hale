import type { MovementDomain } from '../adherence';
import type { TrainingIntensityPreference } from '../training';
import type { ActiveBlockSummary, HaleLifecycleState } from './appLifecycle';
import type { PlanSessionId } from './sessionIds';

export interface PlanEmptyStateCopy {
  title: string;
  body: string;
  ctaLabel: string;
  action: 'onboarding' | 'checkup' | 'create_block';
}

export interface PlanFocusCopy {
  title: string;
  body: string;
}

export interface PlanSessionCategoryCopy {
  title: string;
  categories: readonly string[];
  body: string;
}

export function getPlanEmptyStateCopy(state: HaleLifecycleState): PlanEmptyStateCopy {
  if (state === 'needs_onboarding') {
    return {
      title: 'Start with your Movement Check-Up',
      body: 'Hale builds your 4-week block after learning what you want to stay capable of doing.',
      ctaLabel: 'Start',
      action: 'onboarding',
    };
  }
  if (state === 'needs_baseline_checkup') {
    return {
      title: 'Start with your Movement Check-Up',
      body: 'A short camera-guided check-up gives Hale what it needs to build your first block.',
      ctaLabel: 'Start Movement Check-Up',
      action: 'checkup',
    };
  }
  return {
    title: 'Create your 4-week block',
    body: 'Your Movement Check-Up is ready to become a simple plan for strength, steadiness, and mobility.',
    ctaLabel: 'Create 4-week block',
    action: 'create_block',
  };
}

export function getPlanFocusCopy(domain: MovementDomain | undefined): PlanFocusCopy {
  if (domain === 'strength_power') {
    return {
      title: 'Building stronger legs and everyday power',
      body: 'This block gives extra attention to chair-rise strength, controlled lower-body work, and the power you use for stairs, carrying, and getting up with confidence.',
    };
  }
  if (domain === 'balance') {
    return {
      title: 'Becoming steadier and more confident',
      body: 'This block adds more balance practice, ankle and hip control, and supported strength so everyday movement feels steadier.',
    };
  }
  if (domain === 'mobility') {
    return {
      title: 'Improving mobility and control',
      body: 'This block gives extra time to hips, shoulders, trunk, and easy strength work so you can move with more comfort and range.',
    };
  }
  return {
    title: 'Staying stronger, steadier, and more mobile',
    body: 'This block keeps your weekly sessions simple and balanced, with Hale choosing what matters most today.',
  };
}

export function getPlanSessionCategoryCopy(id: PlanSessionId): PlanSessionCategoryCopy {
  if (id === 'session_a') {
    return {
      title: 'Session A',
      categories: ['Foundation', 'Strength', 'Control'],
      body: 'Start the week with the core strength and balance work your block is built around.',
    };
  }
  if (id === 'session_b') {
    return {
      title: 'Session B',
      categories: ['Build', 'Stability', 'Mobility'],
      body: 'Add a second angle on the same goal, with different movements and steady practice.',
    };
  }
  return {
    title: 'Session C',
    categories: ['Complete', 'Full body', 'Reset'],
    body: 'Round out the week with full-body work and mobility to protect progress.',
  };
}

export function getRetestCopy(summary: ActiveBlockSummary | undefined): { title: string; body: string; due: boolean } {
  if (!summary) {
    return {
      title: 'Re-test after your block',
      body: 'Your next Movement Check-Up refreshes the plan and shows what changed.',
      due: false,
    };
  }
  if (summary.retestInDays !== undefined && summary.retestInDays <= 0) {
    return {
      title: 'Re-test is ready',
      body: 'Repeat your Movement Check-Up when you are ready, then Hale will build the next block.',
      due: true,
    };
  }
  if (summary.retestInDays !== undefined) {
    return {
      title: `Re-test in ${summary.retestInDays} ${summary.retestInDays === 1 ? 'day' : 'days'}`,
      body: 'Keep following this block. Your next Movement Check-Up will refresh the plan.',
      due: false,
    };
  }
  return {
    title: 'Re-test after this block',
    body: 'Your next Movement Check-Up refreshes the block and shows what changed.',
    due: false,
  };
}

export function formatPreferredDays(days: readonly string[] | undefined): string {
  if (!days || days.length === 0) return 'Choose the days you prefer to train.';
  if (days.length === 1) return days[0];
  return days.join(', ');
}

export function intensityLabel(value: TrainingIntensityPreference): string {
  if (value === 'gentle') return 'Gentle';
  if (value === 'more_challenge') return 'More challenge';
  return 'Standard';
}
