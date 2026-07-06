import type { MovementDomain } from '../adherence';
import type { ActiveBlockSummary, HaleLifecycleState } from './appLifecycle';

import { BRAND } from '../brand';
export interface PlanEmptyStateCopy {
  title: string;
  body: string;
  /** Empty when the state resolves on its own and no user action is needed. */
  ctaLabel: string;
  action: 'onboarding' | 'checkup' | 'create_block';
}

export interface PlanFocusCopy {
  title: string;
  body: string;
}


export function getPlanEmptyStateCopy(state: HaleLifecycleState): PlanEmptyStateCopy {
  if (state === 'needs_onboarding') {
    return {
      title: 'Start with your check-up',
      body: `${BRAND.appName} uses your goal and check-up to build your first plan.`,
      ctaLabel: 'Start',
      action: 'onboarding',
    };
  }
  if (state === 'needs_baseline_checkup') {
    return {
      title: 'Start with your check-up',
      body: `A short guided check-up gives ${BRAND.appName} what it needs to build your first plan.`,
      ctaLabel: 'Start check-up',
      action: 'checkup',
    };
  }
  // needs_block_creation: the app creates the block automatically from the
  // stored Movement Profile, so this state is transient and asks nothing.
  return {
    title: 'Preparing your plan',
    body: `${BRAND.appName} is turning your check-up into a simple plan for strength, steadiness, and mobility. This finishes on its own.`,
    ctaLabel: '',
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

export function getRetestCopy(summary: ActiveBlockSummary | undefined): { title: string; due: boolean } {
  if (!summary) {
    return { title: 'Check-up after your plan', due: false };
  }
  if (summary.retestInDays !== undefined && summary.retestInDays <= 0) {
    return { title: 'Check-up is ready', due: true };
  }
  if (summary.retestInDays !== undefined) {
    return {
      title: `Check-up in ${summary.retestInDays} ${summary.retestInDays === 1 ? 'day' : 'days'}`,
      due: false,
    };
  }
  return { title: 'Check-up after this plan', due: false };
}
