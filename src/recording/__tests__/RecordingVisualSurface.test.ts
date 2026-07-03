import fs from 'fs';
import path from 'path';

import { fitFrameVisualStateForRecording } from '../RecordingVisualSurface';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('RecordingVisualSurface', () => {
  it('maps flow-level visual states onto the existing Fit Frame renderer states', () => {
    expect(fitFrameVisualStateForRecording('lost')).toBe('lost');
    expect(fitFrameVisualStateForRecording('adjust')).toBe('adjust');
    expect(fitFrameVisualStateForRecording('tracking')).toBe('tracking');
    expect(fitFrameVisualStateForRecording('ready')).toBe('ready');
    expect(fitFrameVisualStateForRecording('active')).toBe('active');
    expect(fitFrameVisualStateForRecording('recovery')).toBe('lost');
  });

  it('renders the Fit Frame renderer without owning camera, voice, storage, or scoring work', () => {
    const text = source('src/recording/RecordingVisualSurface.tsx');

    expect(text).toContain('FitFramePoseTraceRenderer');
    expect(text).not.toMatch(/<SafePoseDetectionView|<PoseDetectionView|CameraPreview/);
    expect(text).not.toMatch(/SkeletonView|MediaPipeSkeletonRenderer|mediapipe_skeleton/);
    expect(text).not.toMatch(/VoiceChannel|VoicePlayer|voicePlayer|speak\(/);
    expect(text).not.toMatch(/Supabase|AsyncStorage|LandmarkRecorder|scoreCheckUp/);
    expect(text).not.toMatch(/blocksMeasurement|blocksAutoStart|voiceCue/);
  });
});
