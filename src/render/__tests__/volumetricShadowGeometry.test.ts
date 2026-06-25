import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  buildVolumetricShadowGeometry,
  createVolumetricShadowGeometry,
  isFiniteVolumetricShadowGeometry,
} from '../volumetricShadowGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(1844), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('volumetric shadow geometry', () => {
  it('builds finite batched micro-stipple paths at the benchmark mark count', () => {
    const out = createVolumetricShadowGeometry();

    buildVolumetricShadowGeometry(mappedStandingPose(), out, { maxDots: 3000 });

    expect(out.hasPose).toBe(true);
    expect(isFiniteVolumetricShadowGeometry(out)).toBe(true);
    expect(out.dotCount).toBeGreaterThan(2850);
    expect(out.dotCount).toBeLessThanOrEqual(3040);
    expect(out.surfacePathCount).toBeLessThanOrEqual(4);
    expect(out.haloPath).toContain('a');
    expect(out.bodyPath).toContain('a');
    expect(out.corePath).toContain('a');
    expect(out.opacity).toBeGreaterThan(0.7);
  });

  it('keeps torso and near-side volume when the far side drops below confidence', () => {
    const out = createVolumetricShadowGeometry();

    buildVolumetricShadowGeometry(mappedStandingPose({ leftVisibility: 0.08 }), out, {
      maxDots: 3000,
    });

    expect(out.hasPose).toBe(true);
    expect(out.dotCount).toBeGreaterThan(1800);
    expect(out.skippedPartCount).toBeGreaterThanOrEqual(2);
    expect(isFiniteVolumetricShadowGeometry(out)).toBe(true);
  });

  it('moves the volume field when MediaPipe wrist landmarks move', () => {
    const neutral = createVolumetricShadowGeometry();
    const raised = createVolumetricShadowGeometry();
    const neutralPose = mappedStandingPose();
    const raisedPose = mappedStandingPose();
    raisedPose.ys[LM.LEFT_WRIST] -= 210;
    raisedPose.ys[LM.LEFT_INDEX] -= 210;
    raisedPose.ys[LM.LEFT_PINKY] -= 210;
    raisedPose.ys[LM.LEFT_THUMB] -= 210;

    buildVolumetricShadowGeometry(neutralPose, neutral, { maxDots: 3000 });
    buildVolumetricShadowGeometry(raisedPose, raised, { maxDots: 3000 });

    expect(raised.bodyPath).not.toBe(neutral.bodyPath);
    expect(raised.dotCount).toBe(neutral.dotCount);
    expect(isFiniteVolumetricShadowGeometry(raised)).toBe(true);
  });
});
