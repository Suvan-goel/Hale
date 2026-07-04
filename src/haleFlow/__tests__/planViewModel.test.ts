import {
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getRetestCopy,
} from '../planViewModel';

describe('planViewModel', () => {
  it('uses the right empty-state action for first-run stages', () => {
    expect(getPlanEmptyStateCopy('needs_onboarding')).toMatchObject({
      ctaLabel: 'Start',
      action: 'onboarding',
    });
    expect(getPlanEmptyStateCopy('needs_baseline_checkup')).toMatchObject({
      ctaLabel: 'Start check-up',
      action: 'checkup',
    });
    // Block creation is automatic — the empty ctaLabel means no button is shown.
    expect(getPlanEmptyStateCopy('needs_block_creation')).toMatchObject({
      title: 'Preparing your plan',
      ctaLabel: '',
      action: 'create_block',
    });
  });

  it('returns clear focus copy for each movement domain', () => {
    expect(getPlanFocusCopy('strength_power').title).toBe('This plan focuses on strength');
    expect(getPlanFocusCopy('balance').title).toBe('This plan focuses on balance');
    expect(getPlanFocusCopy('mobility').title).toBe('This plan focuses on mobility');
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
    ).toMatchObject({ due: true, title: 'Check-up is ready' });
  });
});
