import {
  POSE_ESTIMATION_SOURCE_ASPECT,
  POSE_ESTIMATION_TOP_OFFSET,
  RECORDING_CARD_ASPECT,
  poseEstimationWindowSize,
  recordingCameraViewportSize,
} from '../recordingViewport';

describe('recording camera viewport sizing', () => {
  it('uses the full phone width with a 9:16 portrait recording card', () => {
    const size = recordingCameraViewportSize(390, 844);
    expect(size.width).toBe(390);
    expect(size.height).toBe(693);
    expect(size.width / size.height).toBeCloseTo(RECORDING_CARD_ASPECT, 2);
  });

  it('places a 3:4 pose-estimation window below the recording chrome spacing', () => {
    const card = recordingCameraViewportSize(390, 844);
    const window = poseEstimationWindowSize(card.width, card.height);
    expect(window.width).toBe(390);
    expect(window.height).toBe(520);
    expect(window.left).toBe(0);
    expect(window.top).toBe(POSE_ESTIMATION_TOP_OFFSET);
    expect(window.width / window.height).toBeCloseTo(POSE_ESTIMATION_SOURCE_ASPECT, 2);
  });

  it('keeps the viewport size stable when setup help is showing', () => {
    const normal = recordingCameraViewportSize(390, 844, false);
    const compact = recordingCameraViewportSize(390, 844, true);
    expect(compact).toEqual(normal);
    expect(compact.width / compact.height).toBeCloseTo(RECORDING_CARD_ASPECT, 2);
  });
});
