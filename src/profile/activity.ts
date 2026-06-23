import type { ActivityLevel } from '../adherence';

export type StartingPaceOption = {
  value: ActivityLevel;
  label: string;
  body: string;
};

export const STARTING_PACE_OPTIONS: readonly StartingPaceOption[] = [
  {
    value: 'very_inactive',
    label: 'Gentle',
    body: 'The easiest starting option.',
  },
  {
    value: 'lightly_active',
    label: 'Standard',
    body: 'Balanced effort and rest.',
  },
  {
    value: 'very_active',
    label: 'A little more',
    body: 'For when you already move often.',
  },
];

export function onboardingActivityLevel(value: ActivityLevel | null | undefined): ActivityLevel {
  if (value === 'very_inactive' || value === 'very_active') return value;
  return 'lightly_active';
}

export function startingEffortLabel(value: ActivityLevel | null | undefined): string {
  const normalized = onboardingActivityLevel(value);
  return STARTING_PACE_OPTIONS.find((option) => option.value === normalized)?.label ?? 'Standard';
}
