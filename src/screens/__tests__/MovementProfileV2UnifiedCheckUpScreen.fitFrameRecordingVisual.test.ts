import fs from 'fs';
import path from 'path';

import {
  FIT_FRAME_MPV2_RECORDING_VISUAL_ROLLBACK_ENV,
  isFitFrameMpv2RecordingVisualEnabled,
  parseFitFrameMpv2RecordingVisualRollbackFlag,
} from '../../config/fitFrameMpv2RecordingVisual';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('MovementProfileV2 Fit Frame recording visual gate', () => {
  it('defaults the MPV2 Fit Frame visual on and rolls back only on exact 1', () => {
    expect(FIT_FRAME_MPV2_RECORDING_VISUAL_ROLLBACK_ENV).toBe(
      'EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2'
    );
    expect(parseFitFrameMpv2RecordingVisualRollbackFlag(undefined)).toBe(false);
    expect(parseFitFrameMpv2RecordingVisualRollbackFlag('0')).toBe(false);
    expect(parseFitFrameMpv2RecordingVisualRollbackFlag('true')).toBe(false);
    expect(parseFitFrameMpv2RecordingVisualRollbackFlag(' 1 ')).toBe(false);
    expect(parseFitFrameMpv2RecordingVisualRollbackFlag('1')).toBe(true);
    expect(isFitFrameMpv2RecordingVisualEnabled({})).toBe(true);
    expect(
      isFitFrameMpv2RecordingVisualEnabled({
        EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2: '1',
      })
    ).toBe(false);
    expect(
      isFitFrameMpv2RecordingVisualEnabled({
        EXPO_PUBLIC_ENABLE_FIT_FRAME_MPV2: '0',
      })
    ).toBe(true);
    expect(source('.env.example')).toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2=0');
  });

  it('keeps rollback MPV2 on the shell default recording area', () => {
    const text = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');

    expect(text).toContain('FIT_FRAME_MPV2_RECORDING_VISUAL_ENABLED');
    expect(text).toContain(
      'FIT_FRAME_MPV2_RECORDING_VISUAL_ENABLED ? renderFitFrameRecordingArea : undefined'
    );
    expect(text).toContain('skeletonRef={skeletonRef}');
  });

  it('wires default MPV2 through RecordingVisualSurface via the shell render seam', () => {
    const text = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');

    expect(text).toContain('RecordingVisualSurface');
    expect(text).toContain('renderRecordingArea=');
    expect(text).toContain('rendererRef={skeletonRef}');
    expect(text).toContain('cameraViewport={cameraViewport}');
    expect(text).toContain('poseWindow={poseWindow}');
    expect(text).toContain('guidance={live.recordingVisualGuidance}');
    expect(text).not.toContain('<FitFramePoseTraceRenderer');
    expect(text).not.toContain('buildMovementProfileV2RecordingVisualGuidance');
    expect(text).not.toMatch(/<SafePoseDetectionView|<PoseDetectionView|nativeSkeletonOverlayEnabled|CameraPreview/);
  });

  it('keeps the visual renderer passive and coordinator-owned', () => {
    const text = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');
    const visualStart = text.indexOf('<RecordingVisualSurface');
    const visualBlock = text.slice(visualStart, text.indexOf('/>', visualStart) + 2);

    expect(visualBlock).toContain('guidance={live.recordingVisualGuidance}');
    expect(visualBlock).not.toMatch(
      /receiveUserAction|runLiveAction|confirm_|start_|setSelected|setPendingOfficialFallback|getVoiceRuntime|voice\.|speak|onComplete|movementProfileV2InternalFlowReducer/
    );
  });

  it('preserves shell camera-unavailable priority before custom recording areas', () => {
    const shell = source('src/screens/CheckUpRecordingShell.tsx');
    const unavailableIndex = shell.indexOf("cameraAvailability === 'unavailable' ? (");
    const customRendererIndex = shell.indexOf(') : renderRecordingArea ? (');

    expect(unavailableIndex).toBeGreaterThanOrEqual(0);
    expect(customRendererIndex).toBeGreaterThan(unavailableIndex);
    expect(shell).toContain('CameraUnavailableNotice');
  });

  it('keeps MPV2 top notice priority ahead of stage instructions', () => {
    const text = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');
    const noticeStart = text.indexOf('function movementProfileV2ShellNotice');
    const noticeText = text.slice(noticeStart, text.indexOf('function movementProfileV2AvatarState'));

    expect(noticeText.indexOf('if (voiceRuntimeEnabled && voiceRuntimeState.lastFailure)')).toBeLessThan(
      noticeText.indexOf('if (voiceRuntimeEnabled && voiceRuntimeState.blocking)')
    );
    expect(noticeText.indexOf('if (voiceRuntimeEnabled && voiceRuntimeState.blocking)')).toBeLessThan(
      noticeText.indexOf('if (live.backgrounded)')
    );
    expect(noticeText.indexOf('if (live.backgrounded)')).toBeLessThan(
      noticeText.indexOf('if (live.recoveryEpisode)')
    );
    expect(noticeText.indexOf('if (live.recoveryEpisode)')).toBeLessThan(
      noticeText.indexOf('if (pendingOfficialFallback)')
    );
    expect(noticeText.indexOf('if (pendingOfficialFallback)')).toBeLessThan(
      noticeText.indexOf('movementProfileV2InstructionTextForStage')
    );
  });

  it('keeps the MPV2 Fit Frame flag isolated from legacy Check-Up, Micro-Check, and Training', () => {
    for (const file of [
      'src/screens/CheckUpScreen.tsx',
      'src/screens/MicroCheckScreen.tsx',
      'src/screens/TrainingSessionScreen.tsx',
    ]) {
      const text = source(file);
      expect(text).not.toContain('FIT_FRAME_MPV2_RECORDING_VISUAL');
      expect(text).not.toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2');
    }
  });
});
