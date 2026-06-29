import fs from 'fs';
import path from 'path';

import {
  FIT_FRAME_TRAINING_RECORDING_VISUAL_ROLLBACK_ENV,
  isFitFrameTrainingRecordingVisualEnabled,
  parseFitFrameTrainingRecordingVisualRollbackFlag,
} from '../../config/fitFrameTrainingRecordingVisual';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Training Fit Frame recording visual gate', () => {
  it('defaults the Training Fit Frame visual on and rolls back only on exact 1', () => {
    expect(FIT_FRAME_TRAINING_RECORDING_VISUAL_ROLLBACK_ENV).toBe(
      'EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING'
    );
    expect(parseFitFrameTrainingRecordingVisualRollbackFlag(undefined)).toBe(false);
    expect(parseFitFrameTrainingRecordingVisualRollbackFlag('0')).toBe(false);
    expect(parseFitFrameTrainingRecordingVisualRollbackFlag('true')).toBe(false);
    expect(parseFitFrameTrainingRecordingVisualRollbackFlag(' 1 ')).toBe(false);
    expect(parseFitFrameTrainingRecordingVisualRollbackFlag('1')).toBe(true);
    expect(isFitFrameTrainingRecordingVisualEnabled({})).toBe(true);
    expect(
      isFitFrameTrainingRecordingVisualEnabled({
        EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING: '1',
      })
    ).toBe(false);
    expect(
      isFitFrameTrainingRecordingVisualEnabled({
        EXPO_PUBLIC_ENABLE_FIT_FRAME_TRAINING: '0',
      })
    ).toBe(true);
    expect(source('.env.example')).toContain(
      'EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING=0'
    );
  });

  it('keeps rollback Training on the native skeleton overlay path', () => {
    const text = source('src/screens/TrainingSessionScreen.tsx');

    expect(text).toContain('FIT_FRAME_TRAINING_RECORDING_VISUAL_ENABLED');
    expect(text).toContain(
      'nativeSkeletonOverlayEnabled={!FIT_FRAME_TRAINING_RECORDING_VISUAL_ENABLED}'
    );
    expect(text).toContain('nativeSkeletonColor={TEMP_TRAINING_NATIVE_SKELETON_COLOR}');
    expect(text).toContain('canvasColor={TEMP_TRAINING_NATIVE_SKELETON_CANVAS}');
  });

  it('wires default Training through RecordingVisualSurface without adding another camera path', () => {
    const text = source('src/screens/TrainingSessionScreen.tsx');

    expect(text).toContain('RecordingVisualSurface');
    expect(text).toContain('buildTrainingRecordingVisualGuidance');
    expect(text).toContain('const trainingRendererRef = React.useRef<PoseAvatarRendererHandle>(null)');
    expect(text).toContain('trainingRendererRef.current?.update(out, sourceAspect)');
    expect(text).toContain('rendererRef={trainingRendererRef}');
    expect(text).toContain('cameraViewport={cameraViewport}');
    expect(text).toContain('poseWindow={poseWindow}');
    expect(text).toContain('guidance={recordingVisualGuidance}');
    expect(text).not.toContain('<FitFramePoseTraceRenderer');
    expect(text).not.toMatch(/CameraPreview/);
    expect(text.match(/<SafePoseDetectionView/g) ?? []).toHaveLength(1);
  });

  it('preserves Training chrome, active metrics, floor setup, and tracked-go ownership', () => {
    const text = source('src/screens/TrainingSessionScreen.tsx');
    const visualStart = text.indexOf('<RecordingVisualSurface');
    const visualBlock = text.slice(visualStart, text.indexOf('/>', visualStart) + 2);

    expect(text).toContain('RecordingSetupNotice');
    expect(text).toContain('RecordingCardFooter');
    expect(text).toContain('display={stageDisplay}');
    expect(text).toContain('confirmFloorStartPosition');
    expect(text).toContain('validTimeCaption');
    expect(text).toContain('stepUpCorrection');
    expect(text).toContain('player.notifyCountdownGoPlaybackStarted');
    expect(visualBlock).not.toMatch(
      /player\.|voice\.|sfx\.|onComplete|confirmFloorStartPosition|skipCurrentItem|notifyCountdownGoPlaybackStarted|setPaused|setShowHelp/
    );
  });

  it('does not render the bottom pose-latency diagnostics panel in Training sessions', () => {
    const text = source('src/screens/TrainingSessionScreen.tsx');

    expect(text).not.toContain('PoseLatencyDiagnosticsOverlay');
  });

  it('keeps MPV2 out of the Training Fit Frame gate', () => {
    const mpv2 = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');

    expect(mpv2).not.toContain('FIT_FRAME_TRAINING_RECORDING_VISUAL');
    expect(mpv2).not.toContain('buildTrainingRecordingVisualGuidance');
  });
});
