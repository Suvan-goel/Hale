import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Progress and Manual / Extra Check-Up UI restoration', () => {
  it('renders the founder Progress empty state for a no-profile V2 Progress model', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const app = readFileSync(join(process.cwd(), 'App.tsx'), 'utf8');

    expect(progress).toContain("viewModel.status === 'no_profile'");
    expect(progress).toContain('<ProgressEmptyState onBeginCheckUp={onStartCheckUp} />');
    expect(progress).toContain('Set your starting point');
    expect(progress).toContain('Start with your check-up');
    expect(progress).toContain('A short guided check-up gives Hale what it needs to build your first plan.');
    expect(progress).toContain('Three calm sessions appear here when your plan is ready.');
    expect(progress).toContain('Start check-up');
    expect(progress).toContain('Your camera view stays private. Hale never shows a live camera view.');
    expect(progress).not.toContain('Progress is based on repeat check-ups, not one-day changes.');
    expect(progress).toContain('Opens camera setup for your Movement Check-Up.');
    expect(progress).not.toContain(
      'Opens saved read-only Movement Profile content or the next safe continuation step.'
    );
    expect(app).toContain('selectPublicMovementCheckUpLaunch');
    expect(app).toContain('beginUnifiedMovementProfileV2Public');
  });

  it('keeps the Plan goal summary hidden until a plan exists', () => {
    const plan = readFileSync(join(process.cwd(), 'src/screens/PlanScreen.tsx'), 'utf8');

    expect(plan).toContain('const showCreatedPlanHeaderSummary = !showBlockingNextAction && !!activeBlockSummary;');
    expect(plan).toContain('{showCreatedPlanHeaderSummary ? <PlanGoalSummary goalText={goalText} /> : null}');
    expect(plan).toContain('Built around what matters to you: {goalText}.');
  });

  it('keeps the Manual / Extra Check-Up screen polished and never blank', () => {
    const screen = readFileSync(join(process.cwd(), 'src/screens/ManualCheckupStartScreen.tsx'), 'utf8');
    const rules = readFileSync(join(process.cwd(), 'src/haleFlow/manualCheckup.ts'), 'utf8');
    const copy = readFileSync(join(process.cwd(), 'src/haleFlow/copy.ts'), 'utf8');

    expect(screen).toContain('recommendedCard');
    expect(screen).toContain('secondaryStack');
    expect(screen).toContain('<HeaderLogo />');
    expect(screen).toContain('<BackArrowButton');
    expect(rules).toContain('Quick micro check-up');
    expect(rules).toContain('Full Movement Check-Up');
    expect(rules).toContain("type: 'manual_extra_v2'");
    expect(copy).toContain('Check in on your progress');
    expect(copy).toContain("These optional check-ups won't change your plan or Movement Profile.");
    expect(screen).not.toMatch(/Movement Age|weakest-domain|V1|V2/);
    expect(`${rules}\n${copy}`).not.toMatch(/Movement Age|weakest-domain/);
  });

  it('routes optional quick micro check-ups through the domain chooser', () => {
    const app = readFileSync(join(process.cwd(), 'App.tsx'), 'utf8');
    const handler = app.slice(
      app.indexOf('const beginManualOptionalMicroCheck'),
      app.indexOf('const beginManualMicroCheckForDomain')
    );

    expect(handler).toContain("setFlow('manual-microcheck-domain')");
    expect(handler).toContain('setMicroCheckLaunch(null)');
    expect(handler).not.toContain("setFlow('microcheck')");
    expect(handler).not.toContain('setMicroCheckLaunch({');
    expect(app).toContain("flow === 'manual-microcheck-domain'");
    expect(app).toContain('<ManualMicroCheckDomainScreen');
  });

  it('restores the simplified V2 Progress dashboard cards without technical summary copy', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const profileCard = progress.slice(
      progress.indexOf('function MovementProfileCard'),
      progress.indexOf('function MovementProfileV2ChangeCard')
    );

    // The simplified Progress tab: one merged profile card, the change-over-time card,
    // a slim next check-up, a merged history card, and the quiet extra check-up.
    expect(progress).toContain('<MovementProfileCard');
    expect(progress).toContain('<MovementProfileV2ChangeCard');
    expect(progress).toContain('<MovementProfileV2NextCheckUpCard');
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
    expect(progress).toContain('progressSummaryStatusLabel(card)');
    expect(progress).not.toContain('Your current plan is based on your previous Movement Profile');
  });
});
