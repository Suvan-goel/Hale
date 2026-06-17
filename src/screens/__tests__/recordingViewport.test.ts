import { RECORDING_CAMERA_ASPECT, recordingCameraViewportSize } from '../recordingViewport';

describe('recording camera viewport sizing', () => {
  it('uses the full phone width with the portrait camera aspect ratio', () => {
    const size = recordingCameraViewportSize(390, 844);
    expect(size.width).toBe(390);
    expect(size.height).toBe(520);
    expect(size.width / size.height).toBeCloseTo(RECORDING_CAMERA_ASPECT, 2);
  });

  it('keeps the viewport size stable when setup help is showing', () => {
    const normal = recordingCameraViewportSize(390, 844, false);
    const compact = recordingCameraViewportSize(390, 844, true);
    expect(compact).toEqual(normal);
    expect(compact.width / compact.height).toBeCloseTo(RECORDING_CAMERA_ASPECT, 2);
  });
});
