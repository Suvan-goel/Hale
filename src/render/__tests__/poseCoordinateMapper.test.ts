import { createPoseFrame } from '../../pose/types';
import {
  computeContainTransform,
  computeCoverTransform,
  createScreenPoseLandmarks,
  mapNormalizedX,
  mapNormalizedY,
  mapPoseFrameToScreenPose,
  PoseScreenViewport,
} from '../poseCoordinateMapper';

const VIEWPORT: PoseScreenViewport = {
  width: 390,
  height: 844,
  sourceAspect: 480 / 640,
  mirrored: false,
};

describe('pose coordinate mapper', () => {
  it('cover-fits the camera source into the view', () => {
    const transform = computeCoverTransform(VIEWPORT);
    expect(transform.sy).toBe(844);
    expect(transform.sx).toBeCloseTo(633, 0);
    expect(transform.ox).toBeCloseTo(-121.5, 1);
    expect(transform.oy).toBe(0);
  });

  it('contain-fits the whole camera source into the view without cropping', () => {
    const transform = computeContainTransform(VIEWPORT);
    expect(transform.sx).toBe(390);
    expect(transform.sy).toBe(520);
    expect(transform.ox).toBe(0);
    expect(transform.oy).toBe(162);
  });

  it('mirrors x without changing y', () => {
    const plain = computeCoverTransform(VIEWPORT);
    const mirrored = computeCoverTransform({ ...VIEWPORT, mirrored: true });

    expect(mapNormalizedX(0.25, mirrored)).toBeCloseTo(mapNormalizedX(0.75, plain), 6);
    expect(mapNormalizedY(0.4, mirrored)).toBeCloseTo(mapNormalizedY(0.4, plain), 6);
  });

  it('maps pose frame landmarks into screen coordinates', () => {
    const frame = createPoseFrame();
    frame.hasPose = true;
    frame.xs[0] = 0.5;
    frame.ys[0] = 0.5;
    frame.visibility[0] = 0.9;
    frame.presence[0] = 0.8;
    const out = createScreenPoseLandmarks();

    mapPoseFrameToScreenPose(frame, VIEWPORT, out);

    expect(out.hasPose).toBe(true);
    expect(out.xs[0]).toBeCloseTo(195, 1);
    expect(out.ys[0]).toBeCloseTo(422, 1);
    expect(out.visibility[0]).toBe(0.9);
    expect(out.presence[0]).toBe(0.8);
  });
});
