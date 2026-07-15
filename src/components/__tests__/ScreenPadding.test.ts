import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('page horizontal padding', () => {
  it('uses the Home responsive gutter in the shared Screen component', () => {
    const sharedUi = source('src/components/ui.tsx');
    const home = source('src/screens/TodayScreen.tsx');

    expect(sharedUi).toContain('paddingHorizontal: responsive.horizontalPadding');
    expect(home).toContain('paddingHorizontal: responsive.horizontalPadding');
  });

  it('does not override Plan, Progress, or Settings with wider page gutters', () => {
    for (const file of [
      'src/screens/PlanScreen.tsx',
      'src/screens/ProgressScreen.tsx',
      'src/screens/SettingsScreen.tsx',
    ]) {
      const screen = source(file);
      expect(screen).not.toContain(
        'paddingHorizontal: responsive.isCompactWidth ? spacing.xl : spacing.xxl'
      );
    }
  });

  it('uses the same responsive gutter in the custom recording screen', () => {
    const recording = source('src/screens/CheckUpRecordingShell.tsx');

    expect(recording).toContain('paddingHorizontal: responsive.horizontalPadding');
  });
});
