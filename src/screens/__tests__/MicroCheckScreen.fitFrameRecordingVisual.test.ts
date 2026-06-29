import fs from 'fs';
import path from 'path';

import {
  FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ROLLBACK_ENV,
  isFitFrameMicroCheckRecordingVisualEnabled,
  parseFitFrameMicroCheckRecordingVisualRollbackFlag,
} from '../../config/fitFrameMicroCheckRecordingVisual';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Micro-Check Fit Frame recording visual gate', () => {
  it('defaults the Micro-Check Fit Frame visual on and rolls back only on exact 1', () => {
    expect(FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ROLLBACK_ENV).toBe(
      'EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK'
    );
    expect(parseFitFrameMicroCheckRecordingVisualRollbackFlag(undefined)).toBe(false);
    expect(parseFitFrameMicroCheckRecordingVisualRollbackFlag('0')).toBe(false);
    expect(parseFitFrameMicroCheckRecordingVisualRollbackFlag('true')).toBe(false);
    expect(parseFitFrameMicroCheckRecordingVisualRollbackFlag(' 1 ')).toBe(false);
    expect(parseFitFrameMicroCheckRecordingVisualRollbackFlag('1')).toBe(true);
    expect(isFitFrameMicroCheckRecordingVisualEnabled({})).toBe(true);
    expect(
      isFitFrameMicroCheckRecordingVisualEnabled({
        EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK: '1',
      })
    ).toBe(false);
    expect(
      isFitFrameMicroCheckRecordingVisualEnabled({
        EXPO_PUBLIC_ENABLE_FIT_FRAME_MICRO_CHECK: '0',
      })
    ).toBe(true);
    expect(source('.env.example')).toContain(
      'EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK=0'
    );
  });

  it('keeps rollback Micro-Check on the existing SkeletonView visual area', () => {
    const text = source('src/screens/MicroCheckScreen.tsx');

    expect(text).toContain('FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ENABLED');
    expect(text).toContain(
      ') : FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ENABLED ? ('
    );
    expect(text).toContain('<SkeletonView');
    expect(text).toContain('measurementState={avatarMeasurementState}');
    expect(text).toContain('activeDomain={avatarDomain}');
  });

  it('wires default Micro-Check through RecordingVisualSurface without adding another camera path', () => {
    const text = source('src/screens/MicroCheckScreen.tsx');

    expect(text).toContain('RecordingVisualSurface');
    expect(text).toContain('buildMicroCheckRecordingVisualGuidance');
    expect(text).toContain('rendererRef={skeletonRef}');
    expect(text).toContain('cameraViewport={cameraViewport}');
    expect(text).toContain('poseWindow={poseWindow}');
    expect(text).toContain('guidance={recordingVisualGuidance}');
    expect(text).not.toContain('<FitFramePoseTraceRenderer');
    expect(text).not.toMatch(/nativeSkeletonOverlayEnabled|CameraPreview/);
    expect(text.match(/<SafePoseDetectionView/g) ?? []).toHaveLength(1);
  });

  it('preserves Micro-Check chrome, manual fallback, metrics, and tracked-go ownership', () => {
    const text = source('src/screens/MicroCheckScreen.tsx');
    const visualStart = text.indexOf('<RecordingVisualSurface');
    const visualBlock = text.slice(visualStart, text.indexOf('/>', visualStart) + 2);

    expect(text).toContain('RecordingSetupNotice');
    expect(text).toContain('MicroCheckCardFooter');
    expect(text).toContain('Choose side manually');
    expect(text).toContain('runner.notifyCountdownGoPlaybackStarted');
    expect(text).toContain('pinMicroCheckSide(sideStatus.selectedSide');
    expect(visualBlock).not.toMatch(
      /pinMicroCheckSide|setRunner|notifyCountdownGoPlaybackStarted|voice\.|sfx\.|onComplete|setManualSideFallback/
    );
  });

  it('keeps Training and MPV2 out of the Micro-Check Fit Frame gate', () => {
    const trainingText = source('src/screens/TrainingSessionScreen.tsx');
    expect(trainingText).not.toContain('FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL');
    expect(trainingText).not.toContain('buildMicroCheckRecordingVisualGuidance');

    for (const file of [
      'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx',
    ]) {
      const text = source(file);
      expect(text).not.toContain('FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL');
      expect(text).not.toContain('buildMicroCheckRecordingVisualGuidance');
    }
  });
});
