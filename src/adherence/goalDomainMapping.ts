import type {
  LifeGoal,
  LifeGoalCategory,
  LifeGoalTrainingRelevance,
  MovementDomain,
} from './types';
import { LOCAL_USER_ID } from './types';

export const LIFE_GOAL_PRESETS: { category: LifeGoalCategory; label: string }[] = [
  { category: 'grandchildren', label: 'Keep up with my children or grandchildren' },
  { category: 'stairs', label: 'Feel steady on stairs' },
  { category: 'travel', label: 'Travel without worrying about long walks' },
  { category: 'walking_hiking_sport', label: 'Keep walking, hiking, or playing sport' },
  { category: 'gardening_hobbies', label: 'Garden or do hobbies comfortably' },
  { category: 'floor_confidence', label: 'Get up from the floor confidently' },
  { category: 'carrying_loads', label: 'Carry shopping and everyday loads' },
  { category: 'independence', label: 'Stay independent as I age' },
  { category: 'noticed_decline', label: 'Feel stronger after noticing decline' },
  { category: 'custom', label: 'Something else' },
];

export const LIFE_GOAL_CATEGORIES = LIFE_GOAL_PRESETS.map((p) => p.category);

export function createLifeGoal({
  category,
  customText,
  userId = LOCAL_USER_ID,
  nowIso = new Date().toISOString(),
}: {
  category: LifeGoalCategory;
  customText?: string;
  userId?: string;
  nowIso?: string;
}): LifeGoal {
  return {
    id: `life-goal-${nowIso.replace(/[:.]/g, '-')}`,
    userId,
    category,
    customText: customText?.trim() || undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
    isPrimary: true,
  };
}

export function getLifeGoalDisplayText(goal: LifeGoal | null | undefined): string {
  if (!goal) return 'Stay capable for the life you want to keep living';
  if (goal.category === 'custom') {
    return goal.customText?.trim() || 'Something personal that matters to you';
  }
  return LIFE_GOAL_PRESETS.find((p) => p.category === goal.category)?.label ?? 'Stay capable';
}

export function getLifeGoalTrainingRelevance(goal: LifeGoal | null | undefined): LifeGoalTrainingRelevance {
  if (!goal) {
    return {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: 'Hale will use your latest check-up to choose the most useful place to start.',
    };
  }

  const map: Record<LifeGoalCategory, LifeGoalTrainingRelevance> = {
    grandchildren: {
      primaryDomains: ['strength_power', 'mobility'],
      copy: 'Strength and mobility help with getting down low, standing up, and keeping pace.',
    },
    stairs: {
      primaryDomains: ['strength_power', 'balance'],
      copy: 'Leg power and balance support the steadiness you use on stairs.',
    },
    travel: {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: 'Travel asks for leg power, steady walking, and joints that keep moving comfortably.',
    },
    walking_hiking_sport: {
      primaryDomains: ['strength_power', 'balance'],
      copy: 'Walking, hiking, and sport depend on repeatable leg power and steady footing.',
    },
    gardening_hobbies: {
      primaryDomains: ['mobility', 'strength_power'],
      copy: 'Hobbies and gardening ask for reachable joints and everyday strength.',
    },
    floor_confidence: {
      primaryDomains: ['strength_power', 'mobility'],
      copy: 'Getting up from the floor draws on leg strength, hips, and trunk mobility.',
    },
    carrying_loads: {
      primaryDomains: ['strength_power'],
      copy: 'Everyday loads are mostly a strength and power job.',
    },
    independence: {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: 'Staying independent is supported by all three domains working together.',
    },
    noticed_decline: {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: 'Hale will start where your latest check-up says support matters most.',
    },
    custom: {
      primaryDomains: ['strength_power', 'balance', 'mobility'],
      copy: 'Hale will shape the block around your own reason for staying capable.',
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
