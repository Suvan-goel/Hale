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

  it('adds a V2 live-coordinator adapter that uses the shared shell and not canned captures', () => {
    const text = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');

    expect(text).toContain('CheckUpRecordingShell');
    expect(text).toContain('new MovementProfileV2LiveCoordinator');
    expect(text).toContain('handsFreeMode: true');
    expect(text).toContain('handsFreeFallbackAvailable');
    expect(text).toContain('createMovementProfileV2LivePoseSample');
    expect(text).toContain('new MovementProfileV2VoiceRuntime');
    expect(text).toContain('canDispatchAction(action, liveRef.current)');
    expect(text).toContain("live.balanceTimerKind === 'rest'");
    expect(text).toContain("label: 'Rest'");
    expect(text).toContain('live.timerRemainingMs !== null');
    expect(text).not.toMatch(/createCaptured|mockCheckUp|reps:\s*12/);
  });

  it('keeps the unified check-up as the only camera check-up surface', () => {
    // Since promotion commit 2 (2026-07-08) the v2 shell mounts camera
    // check-ups ONLY through the Check-up #0 host, which renders the one
    // unified screen — no bespoke camera check-up surface anywhere.
    const shell = source('src/screens/ProgrammeV2Root.tsx');
    const host = source('src/screens/ProgrammeCheckupZeroScreen.tsx');
    const settings = source('src/screens/SettingsScreen.tsx');

    expect(shell).toContain('<ProgrammeCheckupZeroScreen');
    expect(shell).not.toContain('<MovementProfileV2UnifiedCheckUpScreen');
    expect(shell).not.toContain('<CheckUpScreen');
    expect(host).toContain('<MovementProfileV2UnifiedCheckUpScreen');
    expect(settings).not.toContain('onStartMovementProfileV2Internal');
    expect(settings).not.toContain('onStartMovementProfileV2UnifiedInternal');
    expect(settings).not.toContain('Movement Profile V2 unified shell');
  });

  it('clips the native matte figure to the exact shared Fit Frame', () => {
    const text = source('src/screens/CheckUpRecordingShell.tsx');

    expect(text).toContain('resolveFitFrameRect(');
    expect(text).toContain('POSE_ESTIMATION_SOURCE_ASPECT');
    expect(text).toContain('styles.recordingFigureViewport');
    expect(text).toContain('segmentationMaskFigureEnabled={maskFigureEnabled}');
    expect(text).toContain('segmentationMaskFigureColor={colors.accentDeep}');
    expect(text).toContain('canvasColor={colors.focusCanvas}');
  });
});
