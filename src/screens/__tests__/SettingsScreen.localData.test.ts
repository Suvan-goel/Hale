import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Settings local data and schedule wiring', () => {
  it('stores canonical lowercase weekdays while displaying capitalized labels', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    for (const [value, label] of [
      ['mon', 'Mon'],
      ['tue', 'Tue'],
      ['wed', 'Wed'],
      ['thu', 'Thu'],
      ['fri', 'Fri'],
      ['sat', 'Sat'],
      ['sun', 'Sun'],
    ]) {
      expect(settings).toContain(`{ value: '${value}', label: '${label}' }`);
    }
    expect(settings).toContain('selectedDays.includes(day.value)');
    expect(settings).toContain('onToggleDay(day.value)');
    expect(root).toContain('chosenDays: days');
    expect(root).not.toContain('chosenDays: days.filter');
  });

  it('keeps device deletion local, confirmed, and connected to a fresh onboarding state', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).toContain('Clear data on this device');
    expect(settings).toContain('Clear all data from this device?');
    expect(settings).toContain('It cannot be undone.');
    expect(settings).toContain('onClearDeviceData');
    expect(settings).toContain('Data cleared');

    expect(root).toContain('clearLocalPearlData({ fs: localFs })');
    expect(root).toContain('setProgrammeState(defaultProgrammeState())');
    expect(root).toContain('setPrefs(freshPreferences)');
    expect(root).toContain('setHistory([])');
    expect(root).toContain('setFlowState(initialOnboardingFlowState())');
    expect(root).toContain("setPhase('onboarding')");
    expect(root).not.toContain('signOutAndClearLocalData');
  });
});
