import fs from 'fs';
import path from 'path';

// Restored 2026-07-08 with the per-check-up results page (founder direction),
// in a v2 trim: no plan states, no block-report actions, no block-bound
// retest comparison. The architecture pins below are unchanged in spirit.
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

  it('routes every results surface through the one shared shell, without old-engine actions', () => {
    const unifiedScreen = readSource('src/screens/MovementProfileV2UnifiedResultsScreen.tsx');
    const adapter = readSource('src/results/movementProfileV2ResultsAdapter.ts');

    expect(unifiedScreen).toContain('CheckUpResultsShell');
    expect(readSource('src/results/CheckUpResultsShell.tsx')).not.toContain('view_domain_detail');
    // Both surfaces (fresh + saved) are variants of the one presentation.
    expect(adapter).toContain("'history'");
    expect(adapter).toContain("'onboarding'");
    // The old engine's plan/report actions did not return with the restore.
    expect(adapter).not.toContain("'view_plan'");
    expect(adapter).not.toContain("'view_block_report'");
    expect(unifiedScreen).not.toContain('onViewPlan');
    expect(unifiedScreen).not.toContain('onViewBlockReport');
  });
});

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
