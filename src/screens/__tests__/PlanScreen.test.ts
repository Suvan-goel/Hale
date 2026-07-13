import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { planFocusLabel, planWeekSessionRows } from '../PlanScreen';

const homeSource = readFileSync(join(process.cwd(), 'src/screens/TodayScreen.tsx'), 'utf8');
const planSource = readFileSync(join(process.cwd(), 'src/screens/PlanScreen.tsx'), 'utf8');
const progressSource = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
const programmeRootSource = readFileSync(join(process.cwd(), 'src/screens/ProgrammeV2Root.tsx'), 'utf8');

describe('Home / Plan / Progress information architecture', () => {
  it('keeps Home to one centered action without imagery or plan-summary cards', () => {
    expect(homeSource).toContain("action.type === 'start_baseline_checkup'");
    expect(homeSource).toContain('onPress={onPrimaryAction}');
    expect(homeSource).toContain('styles.actionStage');
    expect(homeSource).not.toContain('HERO_IMAGE');
    expect(homeSource).not.toContain('<Image');
    expect(homeSource).not.toContain('WeeklyPulseCard');
    expect(homeSource).not.toContain('TodayFocusCard');
    expect(homeSource).not.toContain('DailyNoteCard');
    expect(homeSource).not.toContain('CheckupOfferCard');
  });

  it('keeps Plan focused on programme position, weekly sessions and the next check-up', () => {
    expect(planSource).toContain('WEEK {programmeWeek} OF 12');
    expect(planSource).toContain('phaseSubtitle(phase)');
    expect(planSource).toContain('<JourneyProgress currentPhase={phase} />');
    expect(planSource).toContain('Foundations');
    expect(planSource).toContain('Build');
    expect(planSource).toContain('Progress');
    expect(planSource).toContain('This week');
    expect(planSource).toContain('Next check-up');
    expect(planSource).not.toContain('Plan details');
    expect(planSource).not.toContain('How your plan adapts');
    expect(planSource).not.toContain('2 sessions is enough');
    expect(planSource).not.toContain('successful week');
  });

  it('uses a Plan-specific editorial hero and connected vertical session timeline', () => {
    expect(planSource).toContain("pearl-plan-twelve-week-hero-v11.png");
    expect(planSource).toContain('<PlanJourneyHero />');
    expect(planSource).toContain('source={PLAN_JOURNEY_HERO}');
    expect(planSource).toContain('resizeMode="cover"');
    expect(planSource).toContain('styles.timelineRail');
    expect(planSource).toContain('styles.timelineLineTop');
    expect(planSource).toContain('styles.timelineLineBottom');
  });

  it('describes sessions honestly and starts only the next session', () => {
    expect(planSource).toContain("today.sessionPreview.mainPatternTitles.join(' · ')");
    expect(planSource).toContain('Strength emphasis · Balance included');
    expect(planSource).toContain('Balance emphasis · Strength included');
    expect(planSource).toContain("row.state === 'next' ? onStartNextSession : undefined");
    expect(planSource).toContain('onPress={onStart}');
    expect(programmeRootSource).toContain('onStartNextSession={startSessionFromHome}');
  });

  it('keeps every Plan section directly on the page background', () => {
    expect(planSource).not.toContain('<Card');
    expect(planSource).not.toContain('backgroundColor: colors.bgSurface');
    expect(planSource).not.toContain('styles.focusPill');
  });

  it('keeps the completed state concise but gives it useful journey context', () => {
    expect(planSource).toContain('Programme complete');
    expect(planSource).toContain('<JourneyProgress completedAll />');
    expect(planSource).toContain('Continuing focus');
    expect(planSource).toContain('planWeekSessionRows(0)');
    expect(planSource).toContain('Saved in Progress');
    expect(planSource).not.toContain('Your maintenance plan');
    expect(planSource).not.toContain('There is no further check-up');
  });

  it('keeps pre-baseline to the two required steps and the camera privacy fact', () => {
    expect(planSource).toContain('STARTING YOUR PLAN');
    expect(planSource).toContain('8 min · No video shown or saved');
    expect(planSource).not.toContain('title="Phase 1"');
  });

  it('keeps Progress about measurement rather than programme mechanics', () => {
    expect(progressSource).toContain('<ClarityProgressCard');
    expect(progressSource).not.toContain('ProgrammeJourneyCard');
    expect(progressSource).not.toContain('ProgrammeTrainingLevelsCard');
  });
});

describe('Plan focus labels', () => {
  it('does not present missing focus data as a balanced prescription', () => {
    expect(planFocusLabel('strength')).toBe('Strength');
    expect(planFocusLabel('balance')).toBe('Balance');
    expect(planFocusLabel('balanced')).toBe('Balanced');
    expect(planFocusLabel(null)).toBe('Focus unavailable');
  });
});

describe('weekly Plan session states', () => {
  it('marks completed sessions and one clear next session', () => {
    expect(planWeekSessionRows(0).map((row) => row.state)).toEqual([
      'next',
      'planned',
      'planned',
    ]);
    expect(planWeekSessionRows(2).map((row) => row.state)).toEqual([
      'complete',
      'complete',
      'next',
    ]);
  });

  it('does not label another session next when the check-up has priority', () => {
    expect(planWeekSessionRows(1, true).map((row) => row.state)).toEqual([
      'complete',
      'planned',
      'planned',
    ]);
  });
});
