import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const RECORDING_SCREENS = [
  'src/screens/MicroCheckScreen.tsx',
  'src/screens/TrainingSessionScreen.tsx',
] as const;

const SHELL_SCREENS = ['src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx'] as const;

describe('recording visual wiring', () => {
  it('renders every direct recording screen through RecordingVisualSurface with one camera path', () => {
    for (const file of RECORDING_SCREENS) {
      const text = source(file);
      expect(text).toContain('RecordingVisualSurface');
      expect(text).not.toContain('<FitFramePoseTraceRenderer');
      expect(text.match(/<SafePoseDetectionView/g) ?? []).toHaveLength(1);
    }
  });

  it('renders both check-up screens through the shared shell recording area', () => {
    for (const file of SHELL_SCREENS) {
      const text = source(file);
      expect(text).toContain('renderRecordingArea={renderFitFrameRecordingArea}');
      expect(text).toContain('RecordingVisualSurface');
      expect(text).not.toContain('<FitFramePoseTraceRenderer');
    }
    const shell = source('src/screens/CheckUpRecordingShell.tsx');
    expect(shell.match(/<SafePoseDetectionView/g) ?? []).toHaveLength(1);
    expect(shell).toContain('renderRecordingArea({ cameraViewport, poseWindow })');
  });

  it('keeps RecordingVisualSurface as the single Fit Frame owner', () => {
    const surface = source('src/recording/RecordingVisualSurface.tsx');
    expect(surface).toContain('FitFramePoseTraceRenderer');
  });
});
