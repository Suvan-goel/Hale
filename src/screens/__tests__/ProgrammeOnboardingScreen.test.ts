import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const screenSource = readFileSync(
  join(process.cwd(), 'src/screens/ProgrammeOnboardingScreen.tsx'),
  'utf8'
);

describe('four-surface programme onboarding', () => {
  it('renders one goal stage and one progressively disclosed Health & Privacy stage', () => {
    expect(screenSource).toContain("screen === 'goal'");
    expect(screenSource).toContain("screen === 'health_safety'");
    expect(screenSource).not.toContain("screen === 'movement_comfort'");
    expect(screenSource).not.toContain("screen === 'setup'");
  });

  it('uses one progress system: the eyebrow stage counters, never step dots', () => {
    // Two counters with different scales on one screen read as broken
    // (2026-07-14 onboarding review) — the "Safety check · 1 of 2" eyebrows
    // are the only progress language in the flow.
    expect(screenSource).not.toContain('progress={{');
  });

  it('states the physical setup before the check-up commitment', () => {
    expect(screenSource).toContain('You’ll need a sturdy chair and a little clear space.');
  });

  it('renders the on-device disclosure at body size in the primary colour', () => {
    const noteStyle = screenSource.slice(
      screenSource.indexOf('noteText: {'),
      screenSource.indexOf('}', screenSource.indexOf('noteText: {'))
    );
    expect(noteStyle).toContain('type.bodySmall');
    expect(noteStyle).toContain('colors.textPrimary');
  });

  it('keeps short section labels in navigation and renders every page title prominently', () => {
    expect(screenSource.match(/prominentTitle/g)).toHaveLength(4);
    expect(screenSource).toContain('eyebrow={question.eyebrow}');
    expect(screenSource).toContain('title={question.question}');

    const uiSource = readFileSync(join(process.cwd(), 'src/components/ui.tsx'), 'utf8');
    expect(uiSource).toContain('title={showProminentTitle ? eyebrow : title}');
    expect(uiSource).toContain('style={styles.headerProminentTitle}');
    expect(uiSource).toContain('headerProminentTitle: { ...type.pageTitle');
  });

  it('starts directly with the first health answer and shows its privacy disclosure', () => {
    expect(screenSource).not.toContain('onAnswerHealth');
    expect(screenSource).not.toContain('consent_health');
    expect(screenSource).toContain('step="b1_heart"');
    expect(screenSource).toContain('selected={answers.b1Heart}');
    expect(screenSource).toContain('question.options.map');
    expect(screenSource).toContain('question.note');
    expect(screenSource).toContain("step === 'b3_joints'");

    expect(screenSource).toContain('onSelect={onSelectOption}');
  });

  it('offers the baseline-to-session chain or a non-counted session preview', () => {
    expect(screenSource).toContain('Do my starting check-up');
    expect(screenSource).toContain("onComplete({ assessmentChoice: 'now', action: 'start_first_session' })");
    expect(screenSource).toContain('See how a session works');
    expect(screenSource).toContain('onPress={onPreviewSession}');
    expect(screenSource).not.toContain('Start a 15-minute session');
    expect(screenSource).not.toContain("assessmentChoice: 'after_first_workout'");
    expect(screenSource).not.toContain('Go to Home for now');
  });

  it('has no decline branch that can complete onboarding without health answers', () => {
    expect(screenSource).not.toContain('healthAnswersDeclined');
    expect(screenSource).not.toContain('Review health & privacy');
    expect(screenSource).not.toContain('Not now');
  });

  it('always makes the starting check-up the completion action', () => {
    expect(screenSource).not.toContain('Start my first session');
    expect(screenSource).not.toContain("assessmentChoice: 'skip'");
    expect(screenSource).not.toContain('gentleStart');
    expect(screenSource).toContain('Do my starting check-up');
  });

  it('keeps Everyday Clarity and the local-only camera promise', () => {
    expect(screenSource).toContain('offers optional Everyday Clarity');
    expect(screenSource).toContain('processed on this phone and never shows your video');
  });

  it('keeps guest-first Continue primary and returning-user sign-in optional', () => {
    const returningUserCopy = 'Already have a ${BRAND.appName} profile? Sign in';
    expect(screenSource).toContain('message.continueLabel');
    expect(screenSource).toContain(returningUserCopy);
    expect(screenSource.indexOf('message.continueLabel')).toBeLessThan(
      screenSource.indexOf(returningUserCopy)
    );
  });
});
