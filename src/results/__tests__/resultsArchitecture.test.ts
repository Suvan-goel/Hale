import fs from 'fs';
import path from 'path';

describe('unified check-up results architecture', () => {
  it('keeps the shared shell presentation-only', () => {
    const source = readSource('src/results/CheckUpResultsShell.tsx');

    expect(source).not.toMatch(/from ['"]\.\.\/(?:checkup|haleFlow|history|movementProfileV2|reference|scoring|services)\b/);
    expect(source).not.toMatch(/computeTrends|getAssessmentResultState|materializeMovementProfileV2Block|interpretMovementProfileV2/);
  });

  it('keeps V1 results screens as thin wrappers around the shared shell', () => {
    const results = readSource('src/screens/ResultsScreen.tsx');
    const onboarding = readSource('src/screens/OnboardingResultsScreen.tsx');

    expect(results).toContain('CheckUpResultsShell');
    expect(results).toContain('buildV1StandardResultsPresentation');
    expect(results).not.toMatch(/StyleSheet|react-native-svg|computeTrends|getAssessmentResultState|DOMAIN_LABEL/);

    expect(onboarding).toContain('CheckUpResultsShell');
    expect(onboarding).toContain('buildV1OnboardingResultsPresentation');
    expect(onboarding).not.toMatch(/StyleSheet|onboardingDomainSummaries|plannedOnboardingFocusDomain/);
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
