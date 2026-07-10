import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { planWeekSessionRows } from '../PlanScreen';

const homeSource = readFileSync(join(process.cwd(), 'src/screens/TodayScreen.tsx'), 'utf8');
const planSource = readFileSync(join(process.cwd(), 'src/screens/PlanScreen.tsx'), 'utf8');
const progressSource = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');

describe('Home / Plan / Progress information architecture', () => {
  it('keeps Home to one dynamic action hero without plan-summary cards', () => {
    expect(homeSource).toContain("action.type === 'start_baseline_checkup'");
    expect(homeSource).toContain('onPress={onPrimaryAction}');
    expect(homeSource).not.toContain('WeeklyPulseCard');
    expect(homeSource).not.toContain('TodayFocusCard');
    expect(homeSource).not.toContain('DailyNoteCard');
    expect(homeSource).not.toContain('CheckupOfferCard');
  });

  it('puts programme structure on Plan and keeps Clarity observational', () => {
    expect(planSource).toContain('YOUR 12-WEEK PLAN');
    expect(planSource).toContain('This week');
    expect(planSource).toContain('Next check-up');
    expect(planSource).toContain('Everyday Clarity is tracked separately in Progress');
    expect(planSource).toContain('never changes your exercises');
  });

  it('keeps Progress about measurement rather than programme mechanics', () => {
    expect(progressSource).toContain('<ClarityProgressCard');
    expect(progressSource).not.toContain('ProgrammeJourneyCard');
    expect(progressSource).not.toContain('ProgrammeTrainingLevelsCard');
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
