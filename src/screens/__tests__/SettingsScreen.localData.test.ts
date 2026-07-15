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

  it('shows the optional online-profile section and hides no-effect equipment controls', () => {
    const settings = source('src/screens/SettingsScreen.tsx');

    expect(settings).toContain("title: 'Your profile'");
    expect(settings).toContain("title: 'Sessions & voice'");
    expect(settings).toContain("title: 'Safety & camera'");
    expect(settings).toContain("title: 'Online profile'");
    expect(settings).toContain("title: 'Privacy & data'");
    expect(settings).toContain('onResolveOnlineProfileConflict');
    expect(settings).not.toContain("openSection === 'equipment'");
    expect(settings).not.toContain('onToggleAvailableEquipment');
    expect(settings).not.toContain('Preferred workout days');
  });

  it('keeps effectful movement support and camera setup together', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).toContain('Keep support nearby for balance');
    expect(settings).toContain('balanceSupportRequired');
    expect(settings).toContain('A future check-up can review this protection.');
    expect(settings).toContain('Use pelvic-floor-friendly guidance');
    expect(settings).not.toContain('Keep sessions low impact');
    expect(settings).toContain('Avoid stomping sounds');
    expect(settings).toContain('Use my low, stable step');
    expect(settings).toContain('See camera setup tips');
    expect(root).toContain('balanceSupportDefault: next.balanceSupportDefault');
    expect(root).toContain('balanceSupportRequired: next.balanceSupportRequired');
    expect(root).toContain("pelvicRouting: next.lowImpact ? 'low_impact' : 'none'");
    expect(root).toContain('quietMode: next.quietMode');
    expect(root).toContain('hasStairs: next.hasStairs');
    expect(root).not.toContain("setFlow('safety-profile')");
  });

  it('provides actionable local health-data review and Gentle Start recovery', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).toContain('Review or remove health answers');
    expect(settings).toContain('Review health questions');
    expect(settings).toContain('Stop using and remove health answers');
    expect(settings).toContain('a new programme cannot begin without an accepted starting result');
    expect(settings).toContain('I’ve completed the safety step');
    expect(settings).toContain('Confirm and enable check-ups');
    expect(root).toContain('consentHealthData: next.consentHealthData');
    expect(root).toContain('gpConfirmed: next.gpConfirmed');
    expect(root).toContain('jointFlags: next.jointFlags');
    expect(settings).toContain('initialSection ?? null');
    expect(root).toContain('initialSection={settingsInitialSection ?? undefined}');
  });

  it('shows an editable future-facing movement goal and does not collect unused symptoms', () => {
    const settings = source('src/screens/SettingsScreen.tsx');

    expect(settings).toContain('What I want to stay strong for');
    expect(settings).toContain('onLifeGoalChange');
    expect(settings).toContain('never changes a measured result');
    expect(settings).not.toContain('SYMPTOM_PICTURE_TOGGLE_OPTIONS');
    expect(settings).toContain('Remove symptom information');
  });

  it('keeps the destructive data action after the ordinary results preference', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const privacyStart = settings.indexOf("if (openSection === 'privacy')");
    const privacyEnd = settings.indexOf('return null;', privacyStart);
    const privacy = settings.slice(privacyStart, privacyEnd);

    expect(privacy.indexOf('Compare with published values')).toBeLessThan(
      privacy.indexOf('<ClearDeviceDataCard')
    );
    expect(settings).toContain('Health answers');
    expect(settings).toContain('AppVersionFooter');
  });

  it('keeps device deletion local, confirmed, and connected to a fresh onboarding state', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).toContain('Clear data on this device');
    expect(settings).toContain('Clear all data from this device?');
    expect(settings).toContain('It cannot be undone.');
    expect(settings).toContain('onClearDeviceData');
    expect(settings).toContain('Data cleared');

    expect(root).toContain('clearLocalPearlData({ userId: backendUserId })');
    expect(root).toContain('setProgrammeState(defaultProgrammeState())');
    expect(root).toContain('setPrefs(freshPreferences)');
    expect(root).toContain('setHistory([])');
    expect(root).toContain('setFlowState(initialOnboardingFlowState())');
    expect(root).toContain("setPhase('onboarding')");
    expect(root).not.toContain('signOutAndClearLocalData');
  });

  it('offers a DEV-only onboarding replay that preserves saved programme data', () => {
    const settings = source('src/screens/SettingsScreen.tsx');
    const root = source('src/screens/ProgrammeV2Root.tsx');

    expect(settings).toContain('__DEV__ &&');
    expect(settings).toContain('Replay onboarding');
    expect(settings).toContain('any starting check-up is a dry run and saves nothing');
    expect(settings).toContain('onReplayOnboarding');
    expect(root).toContain('replayingOnboardingRef.current = true');
    expect(root).toContain('devOnboardingCheckUpRef.current = true');
    expect(root).toContain('setFlowState(initialOnboardingFlowState())');
    expect(root).toContain('if (replayingOnboardingRef.current)');
    expect(root).toContain("assessmentChoice === 'now'");
    expect(root).toContain("setPhase('assessment')");
    expect(root).toContain('history={isDevOnboardingCheckUp ? [] : history}');
    expect(root).toContain(
      'initialDraft={isDevOnboardingCheckUp ? undefined : checkUpDraft?.checkUp}'
    );
    expect(root).toContain('if (isDevOnboardingCheckUp) return;');
    expect(root).toContain("setPhase('dev_checkup_done')");
    expect(root).toContain('your existing programme and history are unchanged');
    expect(root).toContain('onReplayOnboarding={handleReplayOnboarding}');

    const assessment = root.slice(
      root.indexOf("if (phase === 'assessment')"),
      root.indexOf('// ── Tab shell')
    );
    const rawReady = assessment.slice(
      assessment.indexOf('onRawCheckUpReady={(checkUp) =>'),
      assessment.indexOf('onComplete={(checkUp) =>')
    );
    expect(rawReady.indexOf('if (isDevOnboardingCheckUp) return;')).toBeLessThan(
      rawReady.indexOf('checkUpDraftStore.save')
    );
    const completion = assessment.slice(assessment.indexOf('onComplete={(checkUp) =>'));
    expect(completion.indexOf('if (isDevOnboardingCheckUp)')).toBeLessThan(
      completion.indexOf('prepareOfficialCheckUp(checkUp)')
    );
    expect(completion.indexOf("setPhase('dev_checkup_done')")).toBeLessThan(
      completion.indexOf('historyStore.save')
    );
  });

  it('commits online hydration only after the scoped device profile is durable', () => {
    const root = source('src/screens/ProgrammeV2Root.tsx');
    const syncStart = root.indexOf('const queueOnlineProfileSync');
    const syncEnd = root.indexOf('React.useEffect(', syncStart);
    const sync = root.slice(syncStart, syncEnd);

    expect(sync).toContain('revision === onlineProfileSyncRevisionRef.current');
    expect(sync.indexOf('profileStore.save(result.preferences)')).toBeLessThan(
      sync.indexOf('result.finalize?.()')
    );
  });
});
