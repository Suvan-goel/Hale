import fs from 'fs';
import path from 'path';

import {
  FIT_FRAME_CHECKUP_RECORDING_VISUAL_ROLLBACK_ENV,
  isFitFrameCheckUpRecordingVisualEnabled,
  parseFitFrameCheckUpRecordingVisualRollbackFlag,
} from '../../config/fitFrameCheckUpRecordingVisual';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('legacy Check-Up Fit Frame recording visual gate', () => {
  it('defaults the legacy Check-Up Fit Frame visual on and rolls back only on exact 1', () => {
    expect(FIT_FRAME_CHECKUP_RECORDING_VISUAL_ROLLBACK_ENV).toBe(
      'EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP'
    );
    expect(parseFitFrameCheckUpRecordingVisualRollbackFlag(undefined)).toBe(false);
    expect(parseFitFrameCheckUpRecordingVisualRollbackFlag('0')).toBe(false);
    expect(parseFitFrameCheckUpRecordingVisualRollbackFlag('true')).toBe(false);
    expect(parseFitFrameCheckUpRecordingVisualRollbackFlag(' 1 ')).toBe(false);
    expect(parseFitFrameCheckUpRecordingVisualRollbackFlag('1')).toBe(true);
    expect(isFitFrameCheckUpRecordingVisualEnabled({})).toBe(true);
    expect(
      isFitFrameCheckUpRecordingVisualEnabled({
        EXPO_PUBLIC_ENABLE_FIT_FRAME_CHECKUP: '0',
      })
    ).toBe(true);
    expect(
      isFitFrameCheckUpRecordingVisualEnabled({
        EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP: '1',
      })
    ).toBe(false);
  });

  it('documents the temporary rollback flag default as off', () => {
    const envExample = source('.env.example');

    expect(envExample).toContain('Fit Frame + Premium Pose Trace is the default recording visual.');
    expect(envExample).toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP=0');
    expect(envExample).not.toContain('EXPO_PUBLIC_ENABLE_FIT_FRAME_CHECKUP');
  });

  it('keeps rollback legacy Check-Up on the shell default recording area', () => {
    const text = source('src/screens/CheckUpScreen.tsx');

    expect(text).toContain('FIT_FRAME_CHECKUP_RECORDING_VISUAL_ENABLED');
    expect(text).toContain(
      'FIT_FRAME_CHECKUP_RECORDING_VISUAL_ENABLED ? renderFitFrameRecordingArea : undefined'
    );
  });

  it('wires default legacy Check-Up through RecordingVisualSurface only via the shell render seam', () => {
    const text = source('src/screens/CheckUpScreen.tsx');

    expect(text).toContain('RecordingVisualSurface');
    expect(text).toContain('buildCheckUpRecordingVisualGuidance');
    expect(text).toContain('renderRecordingArea=');
    expect(text).toContain('rendererRef={skeletonRef}');
    expect(text).toContain('poseWindow={poseWindow}');
    expect(text).not.toContain('<FitFramePoseTraceRenderer');
    expect(text).not.toMatch(/<SafePoseDetectionView|<PoseDetectionView|nativeSkeletonOverlayEnabled/);
  });

  it('does not integrate the legacy Check-Up flag into Training, Micro-Check, or MPV2', () => {
    const microCheckText = source('src/screens/MicroCheckScreen.tsx');
    expect(microCheckText).not.toContain('FIT_FRAME_CHECKUP_RECORDING_VISUAL');
    expect(microCheckText).not.toContain('buildCheckUpRecordingVisualGuidance');

    const trainingText = source('src/screens/TrainingSessionScreen.tsx');
    expect(trainingText).not.toContain('FIT_FRAME_CHECKUP_RECORDING_VISUAL');
    expect(trainingText).not.toContain('buildCheckUpRecordingVisualGuidance');

    for (const file of [
      'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx',
    ]) {
      const text = source(file);
      expect(text).not.toContain('FIT_FRAME_CHECKUP_RECORDING_VISUAL');
      expect(text).not.toContain('buildCheckUpRecordingVisualGuidance');
    }
  });
});
