import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('shared Pearl page header', () => {
  it('shows the page name and replaces the Pearl mark with Back on nested pages', () => {
    const header = source('src/components/PageHeader.tsx');

    expect(header).toContain('<PearlBrandMark');
    expect(header).toContain('{title}');
    expect(header).toContain('title: string');
    expect(header).toContain('onBack ? (');
    expect(header).toContain('<BackArrowButton');
  });

  it('is the header used by root and shared content screens', () => {
    for (const file of [
      'src/screens/TodayScreen.tsx',
      'src/screens/PlanScreen.tsx',
      'src/screens/ProgressScreen.tsx',
      'src/screens/AuthScreen.tsx',
      'src/components/ui.tsx',
    ]) {
      expect(source(file)).toContain('PageHeader');
    }
    expect(source('src/screens/TodayScreen.tsx')).toContain('title="Home"');
    expect(source('src/screens/PlanScreen.tsx')).toContain('title="Plan"');
    expect(source('src/screens/ProgressScreen.tsx')).toContain('title="Progress"');
    expect(source('src/screens/SettingsScreen.tsx')).toContain('title="Settings"');
    expect(source('src/components/ui.tsx')).not.toContain('HeaderLogo');
  });

  it('routes existing back actions through the shared header slot', () => {
    const nestedScreens = [
      'src/screens/SettingsScreen.tsx',
      'src/screens/ProgrammeOnboardingScreen.tsx',
      'src/screens/CameraSetupScreen.tsx',
      'src/screens/CheckUpRecordingShell.tsx',
      'src/results/CheckUpResultsShell.tsx',
    ];

    for (const file of nestedScreens) {
      expect(source(file)).toContain('onBack=');
    }
  });

  it('keeps Back transparent and in the same visual slot as the default Pearl mark', () => {
    const backButton = source('src/components/BackArrowButton.tsx');

    expect(backButton).toContain('width: 30');
    expect(backButton).toContain('height: 30');
    expect(backButton).not.toContain('backgroundColor:');
    expect(backButton).not.toContain('borderWidth:');
    expect(backButton).not.toContain('borderColor:');
    expect(backButton).toContain('hitSlop=');
  });
});
