import { RECORDING_CAMERA_ASPECT, recordingCameraViewportSize } from '../recordingViewport';

describe('recording camera viewport sizing', () => {
  it('keeps a centered portrait camera area below full-screen height', () => {
    const size = recordingCameraViewportSize(390, 844);
    expect(size.width / size.height).toBeCloseTo(RECORDING_CAMERA_ASPECT, 2);
    expect(size.height).toBeLessThan(844 * 0.5);
  });

  it('shrinks the camera area when setup help needs vertical space', () => {
    const normal = recordingCameraViewportSize(390, 844, false);
    const compact = recordingCameraViewportSize(390, 844, true);
    expect(compact.height).toBeLessThan(normal.height);
    expect(compact.width / compact.height).toBeCloseTo(RECORDING_CAMERA_ASPECT, 2);
  });
});
