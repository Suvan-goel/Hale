import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8');
}

describe('official Movement Check-Up lifecycle', () => {
  const host = source('src/screens/ProgrammeCheckupZeroScreen.tsx');
  const root = source('src/screens/ProgrammeV2Root.tsx');

  it('uses a fixed warm-up and offers Everyday Clarity after the movement battery', () => {
    expect(host).toContain('const WARM_UP_SECONDS = 60');
    expect(host).not.toContain('I’m warm — let’s go');
    expect(host).toContain("setPhase('clarity')");
    expect(host).toContain('<ClarityCheckInScreen');
    expect(host.indexOf('<MovementProfileV2UnifiedCheckUpScreen')).toBeLessThan(
      host.lastIndexOf("setPhase('clarity')")
    );
  });

  it('stages raw movement data as a draft and saves official history only on final completion', () => {
    expect(root).toContain('new OfficialCheckUpDraftStore(localFs)');
    expect(root).toContain('checkUpDraftStore.save(checkUp, checkupType, updatedAtIso)');
    expect(root).toContain('prepared = prepareOfficialCheckUp(checkUp)');
    expect(root).toContain('checkUpDraftStore.clear()');

    const rawHandler = root.slice(
      root.indexOf('onRawCheckUpReady={(checkUp) =>'),
      root.indexOf('onComplete={(checkUp) =>')
    );
    expect(rawHandler).not.toContain('prepareOfficialCheckUp');
    expect(rawHandler).not.toContain('historyStore.save');

    const preparation = root.slice(
      root.indexOf('const prepareOfficialCheckUp ='),
      root.indexOf('// What happens once fresh results are dismissed')
    );
    expect(preparation).not.toContain('historyStore.save');
    expect(root.indexOf('const journeyResult = applyOfficialAssessmentToProgrammeJourney')).toBeLessThan(
      root.indexOf('historyStore.save(prepared.checkUp')
    );
  });

  it('advances the 12-week journey from the frozen assessment and leaves retest ladders alone', () => {
    expect(root).toContain('applyOfficialAssessmentToProgrammeJourney');
    expect(root).toContain('journey: journeyResult.state');
    expect(root).toContain('Retests choose the next phase\'s focus');
    expect(root).not.toContain('onBeginAdditionalCheckUp={goAssessment}');
  });

  it('enforces consent, safety, and cadence in the route handler as well as the UI', () => {
    expect(root).toContain('const checkUpAccess = officialCheckUpAccess');
    const handler = root.slice(
      root.indexOf('const startOfficialCheckUp ='),
      root.indexOf('const startSessionFromHome =')
    );
    expect(handler).toContain('officialCheckUpAccess');
    expect(handler).toContain('if (access.allowed)');
    expect(root).toContain('checkUpBlockedReason=');
  });
});
