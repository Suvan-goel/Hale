import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The old Plan/manual-check-up surfaces retired with promotion commit 2.
// A smaller informational Plan returned on 2026-07-10; these pins keep
// Progress focused on measured results rather than programme structure.
// 2026-07-15 visual pass: both measured domains render stacked in one scroll
// (no hidden domain tabs), the chart labels its endpoints directly, and every
// non-ready state shares one quiet notice pattern.
describe('Progress UI restoration', () => {
  it('keeps the no-profile state informational so Home owns the check-up action', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');

    expect(progress).toContain("viewModel.status === 'no_profile'");
    expect(progress).toContain('if (onStartCheckUp) return <ProgressEmptyState />');
    expect(progress).toContain('Your results will begin here');
    expect(progress).toContain('compare the same check-up at weeks 4, 8 and 12');
    expect(progress).toContain("alignItems: 'center'");
    expect(progress).toContain("justifyContent: 'center'");
    expect(progress).not.toContain('Strength + Balance');
    expect(progress).not.toContain('Everyday Clarity is optional and always shown separately.');
    expect(progress).not.toContain('Saved privately on this device · Start from Home');
    expect(progress).not.toContain('<EmptyResultRow');
    expect(progress).not.toContain('Set your starting point');
    expect(progress).not.toContain('Plan preparation steps');
    expect(progress).not.toContain('<ProgressEmptyStep');
    expect(progress).not.toContain('actionLabel: \'Start check-up\'');
  });

  it('shares one quiet notice pattern across blocked, recovery, and retake states', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const sharedUi = readFileSync(join(process.cwd(), 'src/components/ui.tsx'), 'utf8');

    // The notice pattern lives in shared UI so Plan and Progress render
    // identical "not available, here's why" moments.
    expect(sharedUi).toContain('export function NoticeCard');
    // The optional continuation stays quiet (secondary), never a hero action.
    expect(sharedUi).toContain('<SecondaryButton title={actionLabel} onPress={onPress} />');
    expect(progress).toContain('<NoticeCard');
    expect(progress).toContain('Check-up results need attention');
    expect(progress).toContain('blockedCheckUpCopy(checkUpBlockedReason)');
    expect(progress).not.toContain('<ProgressActionRow');
    expect(progress).not.toContain('<ProgressPictogram');
  });

  it('keeps the V2 Progress dashboard personal, comparable, and free of technical summary copy', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const profileCard = progress.slice(
      progress.indexOf('function MovementProfileCard'),
      progress.indexOf('function DomainSection')
    );

    // The Progress tab: both measured domains stacked (Strength then Balance,
    // never behind tabs), collapsed history, and observational Clarity. Plan
    // owns journey structure; unscheduled extra official check-ups are
    // deliberately absent: they would break the frozen comparison cadence.
    expect(progress).toContain('<MovementProfileCard');
    expect(progress).toContain('<DomainSection');
    expect(progress).toContain('availableDomains.map');
    expect(progress).not.toContain('<DomainTabs');
    expect(progress).toContain('<ProgressChart');
    expect(progress).toContain('Latest check-up · ${dateLabel}');
    expect(progress).toContain("'30-second chair stand'");
    expect(progress).toContain("'One-leg balance'");
    expect(progress).toContain('Current level');
    expect(progress).not.toContain('label={change ? `Change since');
    expect(progress).toContain('change.series');
    expect(progress).not.toContain('<MovementProfileV2NextCheckUpCard');
    expect(progress).toContain('<MovementProfileV2HistoryCard');
    expect(progress).not.toContain('<MovementProfileV2ExtraCheckUpCard');
    expect(progress).not.toContain('<ProgrammeJourneyCard');
    expect(progress).not.toContain('<ProgrammeTrainingLevelsCard');
    expect(progress).toContain('<ClarityProgressCard');
    expect(progress).toContain("progress?.status === 'ready' && progress.officialHistory.length >= 1");
    expect(progress).toContain('history.map((entry, index)');
    // The disclosure label stays fixed while the chevron rotates.
    expect(progress).toContain('Check-up details and history</Text>');
    expect(progress).not.toContain("expanded ? 'Hide check-up history'");
    expect(progress).toContain('accessibilityState={{ expanded }}');
    expect(progress).toContain("'Stronger'} than in ${sinceMonth(change)}");
    expect(progress.indexOf('<ClarityProgressCard')).toBeLessThan(
      progress.indexOf('<MovementProfileV2HistoryCard')
    );
    // Programme structure and practice-ladder mechanics stay off Progress.
    expect(progress).not.toContain('<MovementProfileV2PlanSummaryCard');
    expect(progress).not.toContain('<TrainingProgressCard');
    expect(profileCard).not.toContain('See full results');
    expect(profileCard).not.toContain('Latest check-up focus');
    expect(profileCard).not.toContain('Camera readings are estimates');
    expect(progress).toContain('straightChartPath');
    expect(progress).not.toContain('smoothChartPath');
    expect(profileCard).not.toMatch(/Frozen|reference labels|schema|fingerprint/);
    // The summary stays own-trend first. Published comparison copy is explicit
    // and preference-gated; unexplained tier pills stay off this surface.
    expect(progress).not.toContain('{card.interpretation}');
    expect(progress).toContain("readiness.status !== 'ready'");
    expect(progress).not.toContain('Your current plan is based on your previous Movement Profile');
  });

  it('labels the chart endpoints directly with system-scaling text instead of a y-axis', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');

    // Endpoint values are native Text (respects the system font-size setting,
    // unlike SVG text) and there is no tick axis for her to decode.
    expect(progress).toContain('<ChartPointLabel');
    expect(progress).toContain('<ChartMonthLabel');
    expect(progress).not.toContain('SvgText');
    expect(progress).not.toContain('tickStep');
    // A single check-up never draws a chart frame around a lone dot.
    expect(progress).toContain('if (series.length < 2) return null');
  });
});
