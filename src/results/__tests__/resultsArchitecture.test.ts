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

  it('routes the unified internal V2 path to the polished shared shell while retaining the harness', () => {
    const app = readSource('App.tsx');
    const unifiedScreen = readSource('src/screens/MovementProfileV2UnifiedResultsScreen.tsx');

    expect(app).toContain('movement-profile-v2-unified-results');
    expect(app).toContain('MovementProfileV2ResultsScreen');
    expect(app).toContain('MovementProfileV2UnifiedResultsScreen');
    expect(app).toContain('movementProfileV2BlockMatchesResult');
    expect(unifiedScreen).toContain('CheckUpResultsShell');
  });
});

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
