import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('unified Movement Check-Up recording shell', () => {
  it('keeps the shared shell presentation-only', () => {
    const text = source('src/screens/CheckUpRecordingShell.tsx');

    expect(text).toContain('export function CheckUpRecordingShell');
    expect(text).toContain('CheckUpShellControl');
    expect(text).not.toMatch(/CheckUpOrchestrator|MovementProfileV2LiveCoordinator/);
    expect(text).not.toMatch(/scoreCheckUp|materializeOfficialMovementProfileV2Artifacts|createMovementProfileV2Assessment/);
    expect(text).not.toMatch(/Warden|referenceDetails|MovementProfileV2Reference/);
  });

  it('routes V1 through the shared shell without moving the V1 controller out of CheckUpScreen', () => {
    const text = source('src/screens/CheckUpScreen.tsx');

    expect(text).toContain('CheckUpRecordingShell');
    expect(text).toContain('new CheckUpOrchestrator');
    expect(text).toContain('new PosePipeline');
    expect(text).toContain('new LandmarkRecorder');
    expect(text).toContain('onLandmarks');
  });

  it('adds a V2 live-coordinator adapter that uses the shared shell and not canned captures', () => {
    const text = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');

    expect(text).toContain('CheckUpRecordingShell');
    expect(text).toContain('new MovementProfileV2LiveCoordinator');
    expect(text).toContain('const handsFreeMode = voiceRuntimeEnabled');
    expect(text).toContain('handsFreeFallbackAvailable');
    expect(text).toContain('createMovementProfileV2LivePoseSample');
    expect(text).toContain('new MovementProfileV2VoiceRuntime');
    expect(text).toContain('canDispatchAction(action, liveRef.current)');
    expect(text).not.toMatch(/createCaptured|mockCheckUp|reps:\s*12/);
  });

  it('keeps V1 shell code behind rollback routing and removes the obsolete internal V2 launchers', () => {
    const app = source('App.tsx');
    const settings = source('src/screens/SettingsScreen.tsx');

    expect(app).toContain("flow === 'checkup' && legacyV1CheckUpFlowAllowed");
    expect(app).toContain('LEGACY_V1_CHECKUP_ROLLBACK_ENABLED');
    expect(app).toContain('<CheckUpScreen');
    expect(app).toContain("'movement-profile-v2-unified-checkup'");
    expect(app).toContain('<MovementProfileV2UnifiedCheckUpScreen');
    expect(app).not.toContain("'movement-profile-v2-checkup'");
    expect(app).not.toContain('<MovementProfileV2CheckUpScreen');
    expect(settings).not.toContain('onStartMovementProfileV2Internal');
    expect(settings).not.toContain('onStartMovementProfileV2UnifiedInternal');
    expect(settings).not.toContain('Movement Profile V2 unified shell');
  });
});
