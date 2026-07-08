import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Plan/manual-check-up pins retired with the old shell (promotion commit 2,
// 2026-07-08): PlanScreen and ManualCheckupStartScreen were decommissioned;
// the ProgressScreen pins below remain live surfaces.
describe('Progress UI restoration', () => {
  it('renders the founder Progress empty state for a no-profile V2 Progress model', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');

    expect(progress).toContain("viewModel.status === 'no_profile'");
    expect(progress).toContain('<ProgressEmptyState onBeginCheckUp={onStartCheckUp} />');
    expect(progress).toContain('Set your starting point');
    expect(progress).toContain('Start with your check-up');
    expect(progress).toContain('A short guided check-up gives ${BRAND.appName} what it needs to build your first plan.');
    expect(progress).toContain('Three calm sessions appear here when your plan is ready.');
    expect(progress).toContain('Start check-up');
    expect(progress).toContain('Your camera view stays private. ${BRAND.appName} never shows a live camera view.');
    expect(progress).not.toContain('Progress is based on repeat check-ups, not one-day changes.');
    expect(progress).toContain('Opens camera setup for your Movement Check-Up.');
    expect(progress).not.toContain(
      'Opens saved read-only Movement Profile content or the next safe continuation step.'
    );
  });

  it('restores the simplified V2 Progress dashboard cards without technical summary copy', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const profileCard = progress.slice(
      progress.indexOf('function MovementProfileCard'),
      progress.indexOf('function MovementProfileV2ChangeCard')
    );

    // The simplified Progress tab: one merged profile card, the change-over-time
    // card, a merged history card, and the quiet extra check-up. The
    // next-check-up card retired with the founder-directed deletion pass
    // (2026-07-08) — it could only render from old-engine blocks the promoted
    // shell never produces. "See full results" RETURNED the same day with the
    // restored per-check-up results page (founder direction).
    expect(progress).toContain('<MovementProfileCard');
    expect(progress).toContain('<MovementProfileV2ChangeCard');
    expect(progress).not.toContain('<MovementProfileV2NextCheckUpCard');
    expect(progress).toContain('<MovementProfileV2HistoryCard');
    expect(progress).toContain('<MovementProfileV2ExtraCheckUpCard');
    expect(progress).toContain('viewModel.officialHistory.length >= 2');
    // The plan summary and practice-ladder cards moved off Progress — they duplicated the Plan tab.
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
