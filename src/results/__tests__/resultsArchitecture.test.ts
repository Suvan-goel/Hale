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
    const unifiedScreen = readSource('src/screens/MovementProfileV2UnifiedResultsScreen.tsx');
    const adapter = readSource('src/results/movementProfileV2ResultsAdapter.ts');

    // The results flow is dormant since promotion commit 2 (2026-07-08) —
    // it returns with the opt-in full movement check. The shared-shell
    // architecture pins hold on the kept surfaces themselves: one unified
    // results screen over the one shell, a terminal results page, and the
    // 'history' variant in the adapter.
    expect(unifiedScreen).toContain('CheckUpResultsShell');
    expect(readSource('src/results/CheckUpResultsShell.tsx')).not.toContain('view_domain_detail');
    expect(adapter).toContain("'history'");
  });
});

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
