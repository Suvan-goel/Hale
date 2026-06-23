import type {
  LifeGoal,
  LifeGoalCategory,
  LifeGoalTrainingRelevance,
  LifeGoalWorkoutBias,
  MovementDomain,
} from './types';
import { LOCAL_USER_ID } from './types';

export type SelectableLifeGoalCategory = Exclude<LifeGoalCategory, 'custom'>;

export const LIFE_GOAL_PRESETS: { category: SelectableLifeGoalCategory; label: string }[] = [
  { category: 'stairs', label: 'Climb stairs more easily' },
  { category: 'walking_hiking_sport', label: 'Keep up on walks' },
  { category: 'travel', label: 'Travel comfortably' },
  { category: 'grandchildren', label: 'Play with children/grandchildren' },
  { category: 'gardening_hobbies', label: 'Feel less stiff' },
  { category: 'floor_confidence', label: 'Get down to and up from the floor' },
  { category: 'carrying_loads', label: 'Carry groceries or luggage' },
  { category: 'independence', label: 'Stay independent' },
  { category: 'noticed_decline', label: 'Feel stronger overall' },
];

export const LIFE_GOAL_CATEGORIES: LifeGoalCategory[] = [
  'grandchildren',
  'stairs',
  'travel',
  'walking_hiking_sport',
  'gardening_hobbies',
  'floor_confidence',
  'carrying_loads',
  'independence',
  'noticed_decline',
  'custom',
];

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
    grandchildren: {
      preferredDomains: ['strength_power', 'mobility', 'balance'],
      preferredLadderIds: ['sit-to-stand', 'squat', 'hinge-glutes', 'mobility-flexibility', 'balance'],
      preferredSlotTypes: ['lower_body_strength', 'posterior_chain', 'hip_mobility', 'trunk_mobility', 'mobility', 'balance'],
      copy: 'Prefer chair-rise, squat, hip, and mobility support when the check-up focus leaves room.',
    },
    stairs: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: ['step-up', 'sit-to-stand', 'heel-toe-raise', 'lateral-stability', 'balance', 'mobility-flexibility'],
      preferredSlotTypes: ['lower_body_strength', 'ankle', 'balance', 'lateral_stability', 'dynamic_balance', 'hip_mobility'],
      copy: 'Prefer stair-relevant leg power, ankle strength, and steadiness when setup is confirmed.',
    },
    travel: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: ['sit-to-stand', 'heel-toe-raise', 'lateral-stability', 'balance', 'pull-upper-back', 'hinge-glutes', 'mobility-flexibility'],
      preferredSlotTypes: ['lower_body_strength', 'ankle', 'dynamic_balance', 'balance', 'upper_body_pull', 'posterior_chain', 'hip_mobility'],
      copy: 'Prefer walking capacity, carrying support, steadiness, and easy-moving joints.',
    },
    walking_hiking_sport: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: ['sit-to-stand', 'heel-toe-raise', 'lateral-stability', 'balance', 'step-up', 'hinge-glutes', 'mobility-flexibility'],
      preferredSlotTypes: ['lower_body_strength', 'ankle', 'lateral_stability', 'dynamic_balance', 'balance', 'posterior_chain'],
      copy: 'Prefer repeatable leg strength, ankle/calf work, and lateral balance support.',
    },
    gardening_hobbies: {
      preferredDomains: ['mobility', 'strength_power', 'balance'],
      preferredLadderIds: ['hinge-glutes', 'mobility-flexibility', 'sit-to-stand', 'pull-upper-back', 'shoulder-reach-press', 'balance'],
      preferredSlotTypes: ['posterior_chain', 'posterior_chain_mobility', 'hip_mobility', 'trunk_mobility', 'mobility', 'shoulder_mobility', 'upper_body_pull'],
      copy: 'Prefer hinge, hip, trunk, reaching, and posterior-chain support for bending and hobbies.',
    },
    floor_confidence: {
      preferredDomains: ['strength_power', 'mobility', 'balance'],
      preferredLadderIds: ['sit-to-stand', 'squat', 'hinge-glutes', 'mobility-flexibility', 'balance'],
      preferredSlotTypes: ['lower_body_strength', 'posterior_chain', 'hip_mobility', 'trunk_mobility', 'mobility', 'balance'],
      copy: 'Prefer chair-rise, hip, trunk, and floor-transfer preparation when safe.',
    },
    carrying_loads: {
      preferredDomains: ['strength_power', 'mobility', 'balance'],
      preferredLadderIds: ['hinge-glutes', 'pull-upper-back', 'sit-to-stand', 'squat', 'shoulder-reach-press', 'balance'],
      preferredSlotTypes: ['posterior_chain', 'upper_body_pull', 'lower_body_strength', 'shoulder_mobility', 'trunk_mobility', 'balance'],
      copy: 'Prefer hinge, glute, upper-back, and everyday strength support when safe.',
    },
    independence: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: ['sit-to-stand', 'balance', 'mobility-flexibility', 'heel-toe-raise', 'hinge-glutes', 'lateral-stability'],
      preferredSlotTypes: ['lower_body_strength', 'balance', 'mobility', 'ankle', 'hip_mobility', 'lateral_stability'],
      copy: 'Keep support balanced across strength, balance, and mobility.',
    },
    noticed_decline: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: [],
      preferredSlotTypes: [],
      copy: 'Defer to the check-up focus and keep support balanced.',
    },
    custom: {
      preferredDomains: ['strength_power', 'balance', 'mobility'],
      preferredLadderIds: [],
      preferredSlotTypes: [],
      copy: 'Use the check-up focus first, then keep supporting work balanced.',
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
