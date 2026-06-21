import {
  formatPreferredDays,
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getPlanSessionCategoryCopy,
  getRetestCopy,
  intensityLabel,
} from '../planViewModel';

describe('planViewModel', () => {
  it('uses the right empty-state action for first-run stages', () => {
    expect(getPlanEmptyStateCopy('needs_onboarding')).toMatchObject({
      ctaLabel: 'Start',
      action: 'onboarding',
    });
    expect(getPlanEmptyStateCopy('needs_baseline_checkup')).toMatchObject({
      ctaLabel: 'Start Movement Check-Up',
      action: 'checkup',
    });
    expect(getPlanEmptyStateCopy('needs_block_creation')).toMatchObject({
      ctaLabel: 'Prepare plan',
      action: 'create_block',
    });
  });

  it('returns warm focus copy for each movement domain', () => {
    expect(getPlanFocusCopy('strength_power').title).toContain('stronger');
    expect(getPlanFocusCopy('balance').title).toContain('steadier');
    expect(getPlanFocusCopy('mobility').title).toContain('mobility');
  });

  it('labels A/B/C sessions with expected categories', () => {
    expect(getPlanSessionCategoryCopy('session_a').categories).toContain('Foundation');
    expect(getPlanSessionCategoryCopy('session_b').categories).toContain('Stability');
    expect(getPlanSessionCategoryCopy('session_c').categories).toContain('Full body');
  });

  it('surfaces re-test readiness without medical copy', () => {
    expect(getRetestCopy(undefined).due).toBe(false);
    expect(
      getRetestCopy({
        focusTitle: 'Building steadier movement',
        focusDomain: 'balance',
        weekNumber: 4,
        totalWeeks: 4,
        sessionsCompleteThisWeek: 3,
        sessionsTargetThisWeek: 3,
        retestInDays: 0,
      })
    ).toMatchObject({ due: true, title: 'Re-test is ready' });
  });

  it('formats local schedule and intensity preferences', () => {
    expect(formatPreferredDays([])).toContain('Choose');
    expect(formatPreferredDays(['Mon', 'Wed', 'Fri'])).toBe('Mon, Wed, Fri');
    expect(intensityLabel('gentle')).toBe('Gentle');
    expect(intensityLabel('standard')).toBe('Standard');
    expect(intensityLabel('more_challenge')).toBe('More challenge');
  });
});
