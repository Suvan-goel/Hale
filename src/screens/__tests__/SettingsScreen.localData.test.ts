import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Settings MVP scope and local data', () => {
  it('does not expose preferred days until real scheduling exists', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).not.toContain('Preferred workout days');
    expect(settings).not.toContain('DayPreferencePicker');
    expect(settings).not.toContain('onPreferredDaysChange');
    expect(root).not.toContain('preferredDays={programmeState.profile.chosenDays}');
    expect(root).not.toContain('chosenDays: days');
  });

  it('shows four clear sections and hides no-effect equipment controls', () => {
    const settings = source('src/screens/SettingsScreen.tsx');

    expect(settings).toContain("title: 'Your profile'");
    expect(settings).toContain("title: 'Workout & voice'");
    expect(settings).toContain("title: 'Safety & camera'");
    expect(settings).toContain("title: 'Privacy & data'");
    expect(settings).not.toContain("openSection === 'equipment'");
    expect(settings).not.toContain('onToggleAvailableEquipment');
    expect(settings).not.toContain('Preferred workout days');
  });

  it('keeps effectful movement support and camera setup together', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).toContain('Keep support nearby for balance');
    expect(settings).toContain('Once enabled, this protection stays on.');
    expect(settings).toContain('balanceSupportDefault: true');
    expect(settings).toContain('Keep sessions low impact');
    expect(settings).toContain('Avoid stomping sounds');
    expect(settings).toContain('Use my low, stable step');
    expect(settings).toContain('See camera setup tips');
    expect(root).toContain('balanceSupportDefault: next.balanceSupportDefault');
    expect(root).toContain("pelvicRouting: next.lowImpact ? 'low_impact' : 'none'");
    expect(root).toContain('quietMode: next.quietMode');
    expect(root).toContain('hasStairs: next.hasStairs');
    expect(root).not.toContain("setFlow('safety-profile')");
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
