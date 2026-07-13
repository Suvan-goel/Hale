import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const screenSource = readFileSync(
  join(process.cwd(), 'src/screens/ProgrammeOnboardingScreen.tsx'),
  'utf8'
);

describe('simplified programme onboarding surface', () => {
  it('groups related answers into About You, Movement Comfort, and Setup', () => {
    expect(screenSource).toContain("screen === 'about_you'");
    expect(screenSource).toContain("screen === 'movement_comfort'");
    expect(screenSource).toContain("screen === 'setup'");
  });

  it('keeps Everyday Clarity and the local-only camera promise on the start screen', () => {
    expect(screenSource).toContain('offers Everyday Clarity');
    expect(screenSource).toContain('processed on this phone and never shows your video');
  });

  it('treats going Home as the same one-starter deferral when the check-up is available', () => {
    expect(screenSource).toContain(
      "assessmentChoice: checkUpAvailable ? 'after_first_workout' : 'skip'"
    );
  });

  it('keeps guest-first Continue primary and makes returning-user sign-in optional', () => {
    const returningUserCopy = 'Already have a ${BRAND.appName} profile? Sign in';
    expect(screenSource).toContain('message.continueLabel');
    expect(screenSource).toContain(returningUserCopy);
    expect(screenSource.indexOf('message.continueLabel')).toBeLessThan(
      screenSource.indexOf(returningUserCopy)
    );

    const root = readFileSync(join(process.cwd(), 'src/screens/ProgrammeV2Root.tsx'), 'utf8');
    expect(root).toContain('isOnlineProfilesEnabled() && !isSignedIn');
    expect(root).toContain('onContinueWithoutAccount');
  });
});
