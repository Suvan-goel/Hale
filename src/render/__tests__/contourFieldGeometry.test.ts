import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent } from '../../pose/types';
import {
  buildContourFieldGeometry,
  createContourFieldGeometry,
  isFiniteContourFieldGeometry,
} from '../contourFieldGeometry';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';

const VIEWPORT = {
  width: 390,
  height: 844,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(xOffset = 0): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(53), { noiseAmp: 0, xOffset }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('contour field geometry', () => {
  it('builds a batched contour avatar from a standing MediaPipe pose', () => {
    const out = createContourFieldGeometry();

    buildContourFieldGeometry(mappedStandingPose(), out);

    expect(out.hasPose).toBe(true);
    expect(out.lineCount).toBeGreaterThanOrEqual(110);
    expect(out.lineCount).toBeLessThanOrEqual(180);
    expect(out.particleCount).toBeGreaterThanOrEqual(80);
    expect(out.particleCount).toBeLessThanOrEqual(120);
    expect(out.surfacePathCount).toBeLessThanOrEqual(4);
    expect(out.dynamicPathCount).toBeLessThanOrEqual(4);
    expect(out.shapeCount).toBe(out.lineCount + out.particleCount);
    expect(isFiniteContourFieldGeometry(out)).toBe(true);
  });

  it('responds to pose movement while preserving the same render budget', () => {
    const left = createContourFieldGeometry();
    const right = createContourFieldGeometry();

    buildContourFieldGeometry(mappedStandingPose(-0.04), left);
    buildContourFieldGeometry(mappedStandingPose(0.04), right);

    expect(left.primaryLinePath).not.toBe(right.primaryLinePath);
    expect(left.lineCount).toBe(right.lineCount);
    expect(left.particleCount).toBe(right.particleCount);
    expect(left.surfacePathCount).toBe(right.surfacePathCount);
  });

  it('empties cleanly when no pose is available', () => {
    const pose = createScreenPoseLandmarks();
    const out = createContourFieldGeometry();

    buildContourFieldGeometry(pose, out);

    expect(out.hasPose).toBe(false);
    expect(out.lineCount).toBe(0);
    expect(out.particleCount).toBe(0);
    expect(out.dynamicPathCount).toBe(0);
    expect(isFiniteContourFieldGeometry(out)).toBe(true);
  });
});
