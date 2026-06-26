import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Progress and Manual / Extra Check-Up UI restoration', () => {
  it('renders the founder Progress empty state for a no-profile V2 Progress model', () => {
    const progress = readFileSync(join(process.cwd(), 'src/screens/ProgressScreen.tsx'), 'utf8');
    const app = readFileSync(join(process.cwd(), 'App.tsx'), 'utf8');

    expect(progress).toContain("viewModel.status === 'no_profile'");
    expect(progress).toContain('<ProgressEmptyState onBeginCheckUp={onStartCheckUp} />');
    expect(progress).toContain('Start with your first Movement Check-Up');
    expect(progress).toContain('Start Movement Check-Up');
    expect(progress).toContain('Opens camera setup for your Movement Check-Up.');
    expect(progress).not.toContain(
      'Opens saved read-only Movement Profile content or the next safe continuation step.'
    );
    expect(app).toContain('selectPublicMovementCheckUpLaunch');
    expect(app).toContain('beginUnifiedMovementProfileV2Public');
    expect(app).toContain("flow === 'checkup' && legacyV1CheckUpFlowAllowed");
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
});
