import { todayCopy, todayHomeLayout, type TodayProgrammeMode } from '../TodayScreen';

function programme(overrides: Partial<TodayProgrammeMode> = {}): TodayProgrammeMode {
  return {
    today: {
      state: 'session_ready',
      primaryAction: {
        type: 'start_today_session',
        title: 'Ready when you are',
        subtitle: 'Squat and push today — about 24 minutes.',
        ctaLabel: 'Start session',
        tone: 'default',
      },
      sessionPreview: {
        template: 'A',
        preset: 'standard',
        estimatedMinutes: 24,
        mainPatternTitles: ['Squat', 'Push', 'Core'],
      },
      sessionDetail: 'Today: squat, push and core — about 24 minutes.',
      checkupOffer: null,
    },
    journey: {
      status: 'active',
      physicalFocus: 'strength',
      currentWeekSummary: {
        phase: 1,
        week: 1,
        creditedSessions: 0,
        plannedSessions: 3,
        sufficientSessions: 2,
        sufficient: false,
        plannedComplete: false,
      },
      checkUpDraftInProgress: false,
    },
    ...overrides,
  };
}

describe('Home programme-aware copy', () => {
  it('shows the current emphasis, weekly position and movement patterns', () => {
    expect(todayCopy(programme(), 24)).toEqual({
      title: 'Build strength today',
      subtitle: '24 minutes · Session 1 of 3 this week\nSquat · push · core',
      status: 'Two sessions makes a successful week',
    });
  });

  it('calls out a successful week after two credited sessions', () => {
    const value = programme();
    value.journey.physicalFocus = 'balance';
    value.journey.currentWeekSummary = {
      ...value.journey.currentWeekSummary!,
      creditedSessions: 2,
      sufficient: true,
    };
    expect(todayCopy(value, 24)).toMatchObject({
      title: 'Practise balance today',
      subtitle: '24 minutes · Session 3 of 3 this week\nSquat · push · core',
      status: '2 sessions complete · successful week',
    });
  });

  it('describes post-programme sessions without inventing a current week', () => {
    const value = programme();
    value.journey.status = 'completed';
    value.journey.currentWeekSummary = null;
    expect(todayCopy(value, 24)).toMatchObject({
      subtitle: '24 minutes · Follow-on session\nSquat · push · core',
      status: 'Your 12-week programme is complete',
    });
  });

  it('uses practical preparation copy for the first session', () => {
    const value = programme();
    value.today.state = 'first_session_ready';
    value.today.primaryAction.type = 'start_first_session';
    expect(todayCopy(value, 24)).toEqual({
      title: 'Your first session',
      subtitle: '24 minutes · Starting levels\nSquat · push · core',
      status: 'A chair and a little floor space are all you need',
    });
  });

  it('explains how to finish a saved check-up draft', () => {
    const value = programme();
    value.today.state = 'baseline_due';
    value.today.primaryAction.type = 'start_baseline_checkup';
    value.today.primaryAction.title = 'Finish your Movement Check-Up';
    value.today.sessionDetail = 'Your Strength and Balance measurements are already saved.';
    value.journey.checkUpDraftInProgress = true;
    expect(todayCopy(value, 8)).toEqual({
      title: 'Finish your Movement Check-Up',
      subtitle: 'Your Strength and Balance measurements are already saved.',
      status: 'Continue with Everyday Clarity, or skip it, to finish',
    });
  });
});

describe('responsive Home composition', () => {
  const compact = todayHomeLayout({
    contentWidth: 292,
    windowHeight: 568,
    bottomClearance: 80,
    titleLength: 'Practise balance today'.length,
  });
  const standard = todayHomeLayout({
    contentWidth: 361,
    windowHeight: 873,
    bottomClearance: 86,
    titleLength: 'Practise balance today'.length,
  });
  const large = todayHomeLayout({
    contentWidth: 398,
    windowHeight: 932,
    bottomClearance: 90,
    titleLength: 'Practise balance today'.length,
  });

  it('keeps the display title below the former fixed 64-point size', () => {
    expect(compact.titleSize).toBeLessThan(standard.titleSize);
    expect(standard.titleSize).toBeLessThanOrEqual(46);
    expect(large.titleSize).toBeLessThanOrEqual(50);
  });

  it('scales the hero and button with the available screen dimensions', () => {
    expect(compact.heroWidth).toBeLessThan(standard.heroWidth);
    expect(standard.heroWidth).toBeLessThan(large.heroWidth);
    expect(compact.buttonWidth / 292).toBeCloseTo(0.98, 2);
    expect(standard.buttonWidth / 361).toBeCloseTo(0.96, 2);
    expect(large.buttonWidth / 398).toBeCloseTo(0.96, 2);
  });

  it('reserves a complete bottom stack for the hero, gap and button', () => {
    for (const layout of [compact, standard, large]) {
      expect(layout.lowerStageMinHeight).toBe(
        layout.heroHeight + layout.heroButtonGap + layout.buttonHeight + layout.buttonBottomGap
      );
    }
  });
});
