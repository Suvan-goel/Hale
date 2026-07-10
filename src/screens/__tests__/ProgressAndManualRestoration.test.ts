import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The old Plan/manual-check-up surfaces retired with promotion commit 2.
// A smaller informational Plan returned on 2026-07-10; these pins keep
// Progress focused on measured results rather than programme structure.
describe('Progress UI restoration', () => {
  it('keeps the no-profile state informational so Home owns the check-up action', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');

    expect(progress).toContain("viewModel.status === 'no_profile'");
    expect(progress).toContain('if (onStartCheckUp) return <ProgressEmptyState />');
    expect(progress).toContain('Your progress will appear here');
    expect(progress).toContain('After your first Movement Check-Up');
    expect(progress).toContain('Everyday Clarity will appear too if you choose to answer it.');
    expect(progress).toContain('Start your check-up from Home when you’re ready.');
    expect(progress).not.toContain('Set your starting point');
    expect(progress).not.toContain('Plan preparation steps');
    expect(progress).not.toContain('<ProgressEmptyStep');
    expect(progress).not.toContain('actionLabel: \'Start check-up\'');
    expect(progress).toContain('Opens camera setup for your Movement Check-Up.');
  });

  it('restores the simplified V2 Progress dashboard cards without technical summary copy', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const profileCard = progress.slice(
      progress.indexOf('function MovementProfileCard'),
      progress.indexOf('function MovementProfileV2ChangeCard')
    );

    // The simplified Progress tab: one merged profile card, comparable change,
    // collapsed history, and observational Clarity. Plan owns journey structure;
    // unscheduled extra official check-ups are deliberately absent:
    // they would break the frozen monthly comparison cadence.
    expect(progress).toContain('<MovementProfileCard');
    expect(progress).toContain('<MovementProfileV2ChangeCard');
    expect(progress).not.toContain('<MovementProfileV2NextCheckUpCard');
    expect(progress).toContain('<MovementProfileV2HistoryCard');
    expect(progress).not.toContain('<MovementProfileV2ExtraCheckUpCard');
    expect(progress).not.toContain('<ProgrammeJourneyCard');
    expect(progress).not.toContain('<ProgrammeTrainingLevelsCard');
    expect(progress).toContain('<ClarityProgressCard');
    expect(progress).toContain("progress?.status === 'ready' && progress.officialHistory.length >= 2");
    expect(progress).toContain("history.slice(1)");
    expect(progress).toContain("expanded ? 'Hide check-up history' : 'See check-up history'");
    expect(progress).toContain('accessibilityState={{ expanded }}');
    expect(progress.indexOf('<ClarityProgressCard')).toBeLessThan(
      progress.indexOf('<MovementProfileV2HistoryCard')
    );
    // Programme structure and practice-ladder mechanics stay off Progress.
    expect(progress).not.toContain('<MovementProfileV2PlanSummaryCard');
    expect(progress).not.toContain('<TrainingProgressCard');
    expect(profileCard).toContain('See full results');
    expect(profileCard).toContain('Where to focus');
    expect(profileCard).toContain('Last check-up ·');
    expect(profileCard).not.toMatch(/Frozen|reference labels|schema|fingerprint/);
    // Status pills show the shared tier vocabulary straight from the view model.
    expect(progress).toContain('{card.interpretation}');
    expect(progress).not.toContain('Your current plan is based on your previous Movement Profile');
  });
});
