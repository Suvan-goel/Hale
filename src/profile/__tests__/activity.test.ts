import { STARTING_PACE_OPTIONS, onboardingActivityLevel } from '../activity';

describe('starting pace activity options', () => {
  it('exposes three onboarding choices and keeps moderate activity as legacy-only', () => {
    expect(STARTING_PACE_OPTIONS.map((option) => option.value)).toEqual([
      'very_inactive',
      'lightly_active',
      'very_active',
    ]);
    expect(STARTING_PACE_OPTIONS.map((option) => option.value)).not.toContain('moderately_active');
  });

  it('maps legacy moderate activity to the standard starting pace', () => {
    expect(onboardingActivityLevel('moderately_active')).toBe('lightly_active');
    expect(onboardingActivityLevel(undefined)).toBe('lightly_active');
    expect(onboardingActivityLevel('very_inactive')).toBe('very_inactive');
    expect(onboardingActivityLevel('very_active')).toBe('very_active');
  });
});
