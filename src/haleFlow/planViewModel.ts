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
      title: 'Start with your check-up',
      body: 'Hale uses your goal and check-up to build your first plan.',
      ctaLabel: 'Start',
      action: 'onboarding',
    };
  }
  if (state === 'needs_baseline_checkup') {
    return {
      title: 'Start with your check-up',
      body: 'A short guided check-up gives Hale what it needs to build your first plan.',
      ctaLabel: 'Start check-up',
      action: 'checkup',
    };
  }
  return {
    title: 'Your plan is being prepared',
    body: 'Hale is using your check-up to prepare a simple plan for strength, steadiness, and mobility.',
    ctaLabel: 'Prepare plan',
    action: 'create_block',
  };
}

export function getPlanFocusCopy(domain: MovementDomain | undefined): PlanFocusCopy {
  if (domain === 'strength_power') {
    return {
      title: 'This plan focuses on strength',
      body: 'Your check-up suggested leg strength is the best place to start. Your sessions still include balance and mobility.',
    };
  }
  if (domain === 'balance') {
    return {
      title: 'This plan focuses on balance',
      body: 'Your check-up suggested balance is the best place to start. Your sessions still include strength and mobility.',
    };
  }
  if (domain === 'mobility') {
    return {
      title: 'This plan focuses on mobility',
      body: 'Your check-up suggested mobility is the best place to start. Your sessions still include strength and balance.',
    };
  }
  return {
    title: 'This plan works on all three areas',
    body: 'Your sessions include strength, balance, and mobility so the week stays simple and balanced.',
  };
}

export function getPlanSessionCategoryCopy(id: PlanSessionId): PlanSessionCategoryCopy {
  if (id === 'session_a') {
    return {
      title: 'Session 1',
      categories: ['Foundation', 'Strength', 'Control'],
      body: 'Start with steady strength and balance practice.',
    };
  }
  if (id === 'session_b') {
    return {
      title: 'Session 2',
      categories: ['Build', 'Stability', 'Mobility'],
      body: 'Practice the same goal with a few different movements.',
    };
  }
  return {
    title: 'Session 3',
    categories: ['Complete', 'Full body', 'Reset'],
    body: 'Finish the week with full-body movement and easy mobility.',
  };
}

export function getRetestCopy(summary: ActiveBlockSummary | undefined): { title: string; body: string; due: boolean } {
  if (!summary) {
    return {
      title: 'Check-up after your plan',
      body: 'Your next check-up helps Hale update your plan.',
      due: false,
    };
  }
  if (summary.retestInDays !== undefined && summary.retestInDays <= 0) {
    return {
      title: 'Check-up is ready',
      body: 'Repeat your check-up when you are ready. Hale will use it to build your next plan.',
      due: true,
    };
  }
  if (summary.retestInDays !== undefined) {
    return {
      title: `Check-up in ${summary.retestInDays} ${summary.retestInDays === 1 ? 'day' : 'days'}`,
      body: 'Keep following this plan. Your next check-up will help Hale update it.',
      due: false,
    };
  }
  return {
    title: 'Check-up after this plan',
    body: 'Your next check-up helps Hale update your plan.',
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
