import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  buildShadowSilhouetteGeometry,
  createShadowSilhouetteGeometry,
  isFiniteShadowSilhouetteGeometry,
} from '../shadowSilhouetteGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(771), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('shadow silhouette geometry', () => {
  it('builds a low-path filled human silhouette from MediaPipe landmarks', () => {
    const out = createShadowSilhouetteGeometry();

    buildShadowSilhouetteGeometry(mappedStandingPose(), out);

    expect(out.hasPose).toBe(true);
    expect(isFiniteShadowSilhouetteGeometry(out)).toBe(true);
    expect(out.bodyPath).toContain('C');
    expect(out.neckPath).toContain('Q');
    expect(out.headPath).toContain('C');
    expect(out.limbPath).toContain('Q');
    expect(out.accentPath).toContain('C');
    expect(out.surfacePathCount).toBeLessThanOrEqual(6);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.shapeCount).toBeLessThanOrEqual(15);
    expect(out.opacity).toBeGreaterThan(0.7);
    expect(out.continuity).toMatchObject({
      coreContinuous: true,
      headAttached: true,
      leftArmContinuous: true,
      rightArmContinuous: true,
      leftLegContinuous: true,
      rightLegContinuous: true,
      leftArmHasElbow: true,
      rightArmHasElbow: true,
      leftLegHasKnee: true,
      rightLegHasKnee: true,
    });
  });

  it('keeps the body present while dropping low-confidence far-side limbs', () => {
    const out = createShadowSilhouetteGeometry();

    buildShadowSilhouetteGeometry(mappedStandingPose({ leftVisibility: 0.08 }), out);

    expect(out.hasPose).toBe(true);
    expect(out.bodyPath).not.toBe('');
    expect(out.continuity.leftArmContinuous).toBe(false);
    expect(out.continuity.rightArmContinuous).toBe(true);
    expect(out.continuity.leftLegContinuous).toBe(false);
    expect(out.continuity.rightLegContinuous).toBe(true);
    expect(out.skippedPartCount).toBeGreaterThanOrEqual(2);
    expect(isFiniteShadowSilhouetteGeometry(out)).toBe(true);
  });

  it('moves limb bounds when the MediaPipe wrist moves', () => {
    const neutral = mappedStandingPose();
    const raised = mappedStandingPose();
    raised.ys[LM.LEFT_WRIST] -= 230;
    raised.ys[LM.LEFT_INDEX] -= 230;
    raised.ys[LM.LEFT_PINKY] -= 230;
    raised.ys[LM.LEFT_THUMB] -= 230;

    const neutralOut = createShadowSilhouetteGeometry();
    const raisedOut = createShadowSilhouetteGeometry();
    buildShadowSilhouetteGeometry(neutral, neutralOut);
    buildShadowSilhouetteGeometry(raised, raisedOut);

    expect(raisedOut.bounds.minY).toBeLessThan(neutralOut.bounds.minY);
    expect(raisedOut.limbPath).not.toBe(neutralOut.limbPath);
    expect(isFiniteShadowSilhouetteGeometry(raisedOut)).toBe(true);
  });
});
