import type {
  LifeGoal,
  LifeGoalCategory,
  LifeGoalTrainingRelevance,
  LifeGoalWorkoutBias,
  MovementDomain,
} from './types';
import { LOCAL_USER_ID } from './types';

import { BRAND } from '../brand';
// One preset per functional training bucket. Categories that produced the same
// (or near-identical) workout bias were merged on 2026-07-04; see docs/decisions.md.
export const LIFE_GOAL_PRESETS: { category: LifeGoalCategory; label: string; hint: string }[] = [
  {
    category: 'stairs_walks',
    label: 'Feel stronger and steadier on stairs and walks',
    hint: 'Build leg strength and steadiness for steps and walking.',
  },
  {
    category: 'grandchildren',
    label: 'Get down low and stand back up with confidence',
    hint: 'Build strength for lowering, rising, and moving comfortably.',
  },
  {
    category: 'bend_reach_carry',
    label: 'Make everyday lifting, reaching, and carrying feel easier',
    hint: 'Support easier bending, reaching, and everyday carrying.',
  },
  {
    category: 'independence',
    label: 'Build confidence in what my body can do now',
    hint: 'Build an all-round routine with strength and balance working together.',
  },
];

export const LIFE_GOAL_CATEGORIES: LifeGoalCategory[] = LIFE_GOAL_PRESETS.map(
  (preset) => preset.category
);

export function createLifeGoal({
  category,
  userId = LOCAL_USER_ID,
  nowIso = new Date().toISOString(),
}: {
  category: LifeGoalCategory;
  userId?: string;
  nowIso?: string;
}): LifeGoal {
  return {
    id: `life-goal-${nowIso.replace(/[:.]/g, '-')}`,
    userId,
    category,
    createdAt: nowIso,
    updatedAt: nowIso,
    isPrimary: true,
  };
}

export function getLifeGoalDisplayText(goal: LifeGoal | null | undefined): string {
  if (!goal) return 'Build strength for where you are now';
  return LIFE_GOAL_PRESETS.find((p) => p.category === goal.category)?.label ?? 'Build strength for now';
}

export function normalizeLifeGoalDisplayText(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^in\s+the\s+future,\s+i\s+want\s+to\s+be\s+able\s+to\s+/i, '')
    .replace(/^i\s+want\s+to\s+be\s+able\s+to\s+/i, '')
    .replace(/^my\s+goal\s+is\s+to\s+/i, '')
    .replace(/^i\s+want\s+to\s+/i, '')
    .replace(/^to\s+/i, '')
    .trim();
}

export function getLifeGoalTrainingRelevance(goal: LifeGoal | null | undefined): LifeGoalTrainingRelevance {
  if (!goal) {
    return {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: `${BRAND.appName} will use your latest check-up to choose the most useful place to start.`,
    };
  }

  const map: Record<LifeGoalCategory, LifeGoalTrainingRelevance> = {
    stairs_walks: {
      primaryDomains: ['strength_power', 'balance'],
      copy: 'Leg power and steady footing support stairs, walks, and getting around.',
    },
    grandchildren: {
      primaryDomains: ['strength_power', 'mobility'],
      copy: 'Strength supports lowering, rising, and moving with confidence.',
    },
    bend_reach_carry: {
      primaryDomains: ['mobility', 'strength_power'],
      copy: 'Bending, reaching, and carrying draw on easy-moving joints and everyday strength.',
    },
    independence: {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: 'Confidence grows from strength and balance working together.',
    },
  };
  return map[goal.category];
}

export function getLifeGoalWorkoutBias(goal: LifeGoal | null | undefined): LifeGoalWorkoutBias {
  if (!goal) {
    return {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: [],
      preferredSlotTypes: [],
      copy: 'Use the check-up focus first, then keep supporting work balanced.',
    };
  }

  const map: Record<LifeGoalCategory, LifeGoalWorkoutBias> = {
    stairs_walks: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: ['step-up', 'sit-to-stand', 'heel-toe-raise', 'lateral-stability', 'balance', 'mobility-flexibility'],
      preferredSlotTypes: ['lower_body_strength', 'ankle', 'balance', 'lateral_stability', 'dynamic_balance', 'hip_mobility'],
      copy: 'Prefer stair- and walk-relevant leg power, ankle strength, and steadiness when the check-up focus leaves room.',
    },
    grandchildren: {
      preferredDomains: ['strength_power', 'mobility', 'balance'],
      preferredLadderIds: ['sit-to-stand', 'squat', 'hinge-glutes', 'mobility-flexibility', 'balance'],
      preferredSlotTypes: ['lower_body_strength', 'posterior_chain', 'hip_mobility', 'trunk_mobility', 'mobility', 'balance'],
      copy: 'Prefer chair-rise, squat, hip, and lowering-and-rising support when the check-up focus leaves room.',
    },
    bend_reach_carry: {
      preferredDomains: ['mobility', 'strength_power', 'balance'],
      preferredLadderIds: ['hinge-glutes', 'mobility-flexibility', 'pull-upper-back', 'shoulder-reach-press', 'sit-to-stand', 'balance'],
      preferredSlotTypes: ['posterior_chain', 'hip_mobility', 'trunk_mobility', 'shoulder_mobility', 'upper_body_pull', 'mobility'],
      copy: 'Prefer hinge, hip, trunk, reaching, and everyday strength support when safe.',
    },
    independence: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: ['sit-to-stand', 'balance', 'mobility-flexibility', 'heel-toe-raise', 'hinge-glutes', 'lateral-stability'],
      preferredSlotTypes: ['lower_body_strength', 'balance', 'mobility', 'ankle', 'hip_mobility', 'lateral_stability'],
      copy: 'Keep the routine balanced across strength and balance work.',
    },
  };
  return map[goal.category];
}

export function domainLabel(domain: MovementDomain): string {
  switch (domain) {
    case 'strength_power':
      return 'Strength & Power';
    case 'balance':
      return 'Balance';
    case 'mobility':
      return 'Mobility';
  }
}

export function domainShortLabel(domain: MovementDomain): string {
  return domain === 'strength_power' ? 'strength' : domain;
}
