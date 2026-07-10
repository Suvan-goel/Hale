import fs from 'fs';
import path from 'path';

// Restored 2026-07-08 with the per-check-up results page (founder direction),
// in a v2 trim: no plan states, no block-report actions, no block-bound
// retest comparison. The architecture pins below are unchanged in spirit.
describe('unified check-up results architecture', () => {
  it('keeps the shared shell presentation-only', () => {
    const source = readSource('src/results/CheckUpResultsShell.tsx');

    expect(source).not.toMatch(/from ['"]\.\.\/(?:checkup|pearlFlow|history|movementProfileV2|reference|scoring|services)\b/);
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
    const shell = readSource('src/results/CheckUpResultsShell.tsx');

    expect(unifiedScreen).toContain('CheckUpResultsShell');
    expect(shell).not.toContain('view_domain_detail');
    // Both surfaces (fresh + saved) are variants of the one presentation.
    expect(adapter).toContain("'history'");
    expect(adapter).toContain("'onboarding'");
    // The old engine's plan/report actions did not return with the restore.
    expect(adapter).not.toContain("'view_plan'");
    expect(adapter).not.toContain("'view_block_report'");
    expect(unifiedScreen).not.toContain('onViewPlan');
    expect(unifiedScreen).not.toContain('onViewBlockReport');
  });

  it('keeps fresh completion concise and saved history detailed', () => {
    const shell = readSource('src/results/CheckUpResultsShell.tsx');
    const adapter = readSource('src/results/movementProfileV2ResultsAdapter.ts');

    expect(shell).toContain("presentation.variant === 'history'");
    expect(shell).toContain('<FreshResultsVariant');
    expect(shell).toContain('<HistoryResultsVariant');
    expect(shell).toContain('<FreshDomainResultRow');
    expect(shell).toContain('<DomainAreaRow');
    expect(shell).not.toContain('Plan ready');
    expect(shell).not.toContain('presentation.domainSection');
    expect(adapter).toContain("? 'Continue'");
    expect(adapter).toContain(": 'Return Home'");
    expect(adapter).toContain("? 'Done'");
  });

  it('keeps Clarity on Progress and population comparison control in Settings', () => {
    const unifiedScreen = readSource('src/screens/MovementProfileV2UnifiedResultsScreen.tsx');
    const shell = readSource('src/results/CheckUpResultsShell.tsx');
    const adapter = readSource('src/results/movementProfileV2ResultsAdapter.ts');
    const root = readSource('src/screens/ProgrammeV2Root.tsx');
    const settings = readSource('src/screens/SettingsScreen.tsx');

    expect(unifiedScreen).not.toContain('ClarityProgressCard');
    expect(unifiedScreen).not.toContain('populationComparison');
    expect(shell).not.toContain('toggle_population_comparison');
    expect(adapter).not.toContain('See how you compare');
    expect(root).toContain('comparisonOptIn: prefs?.settings.comparisonOptIn');
    expect(settings).toContain('settings.comparisonOptIn');
  });
});

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
