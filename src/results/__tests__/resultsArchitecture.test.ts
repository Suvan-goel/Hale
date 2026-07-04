import fs from 'fs';
import path from 'path';

describe('unified check-up results architecture', () => {
  it('keeps the shared shell presentation-only', () => {
    const source = readSource('src/results/CheckUpResultsShell.tsx');

    expect(source).not.toMatch(/from ['"]\.\.\/(?:checkup|haleFlow|history|movementProfileV2|reference|scoring|services)\b/);
    expect(source).not.toMatch(/computeTrends|getAssessmentResultState|materializeMovementProfileV2Block|interpretMovementProfileV2/);
  });

  it('keeps the V2 adapter downstream of the frozen view model only', () => {
    const adapter = readSource('src/results/movementProfileV2ResultsAdapter.ts');

    expect(adapter).toContain('MovementProfileV2ResultsViewModel');
    expect(adapter).not.toMatch(/materializeMovementProfileV2Block|interpretMovementProfileV2|createMovementProfileV2Snapshot|createMovementProfileV2Assessment|HistoryStore|syncMovement/);
  });

  it('routes every results surface through the one shared shell', () => {
    const app = readSource('App.tsx');
    const unifiedScreen = readSource('src/screens/MovementProfileV2UnifiedResultsScreen.tsx');
    const adapter = readSource('src/results/movementProfileV2ResultsAdapter.ts');

    // One results flow renders both fresh (standard/onboarding) and saved
    // history ('history' variant) results; the bespoke standalone screen and
    // its separate 'unified-results' flow are gone.
    expect(app).toContain("flow === 'movement-profile-v2-results'");
    expect(app).not.toContain('movement-profile-v2-unified-results');
    expect(app).not.toContain('MovementProfileV2ResultsScreen');
    expect(app).toContain('MovementProfileV2UnifiedResultsScreen');
    // The per-domain detail layer was removed: the results page is terminal.
    expect(app).not.toContain('MovementProfileV2DomainDetailScreen');
    expect(readSource('src/results/CheckUpResultsShell.tsx')).not.toContain('view_domain_detail');
    expect(app).toContain("? 'history'");
    expect(app).toContain('movementProfileV2BlockMatchesResult');
    expect(unifiedScreen).toContain('CheckUpResultsShell');
    expect(adapter).toContain("'history'");
  });
});

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
