import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  buildPrivacyShadowGeometry,
  createPrivacyShadowGeometry,
  isFinitePrivacyShadowGeometry,
} from '../privacyShadowGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(924), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('privacy shadow geometry', () => {
  it('builds layered diffused shadow paths from a standing MediaPipe pose', () => {
    const out = createPrivacyShadowGeometry();

    buildPrivacyShadowGeometry(mappedStandingPose(), out);

    expect(out.hasPose).toBe(true);
    expect(isFinitePrivacyShadowGeometry(out)).toBe(true);
    expect(out.outerPath).toContain('C');
    expect(out.midPath).toContain('C');
    expect(out.corePath).toContain('C');
    expect(out.surfacePathCount).toBe(3);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.shapeCount).toBeGreaterThanOrEqual(4);
    expect(out.opacity).toBeGreaterThan(0.7);
    expect(out.visibility.headVisible).toBe(true);
    expect(out.visibility.feetVisible).toBe(true);
  });

  it('moves the broad shadow when distal landmarks move', () => {
    const neutral = mappedStandingPose();
    const raised = mappedStandingPose();
    raised.ys[LM.LEFT_WRIST] -= 210;
    raised.ys[LM.LEFT_INDEX] -= 210;
    raised.ys[LM.LEFT_PINKY] -= 210;
    raised.ys[LM.LEFT_THUMB] -= 210;

    const neutralOut = createPrivacyShadowGeometry();
    const raisedOut = createPrivacyShadowGeometry();
    buildPrivacyShadowGeometry(neutral, neutralOut);
    buildPrivacyShadowGeometry(raised, raisedOut);

    expect(raisedOut.outerPath).not.toBe(neutralOut.outerPath);
    expect(raisedOut.bounds.minY).toBeLessThan(neutralOut.bounds.minY);
    expect(isFinitePrivacyShadowGeometry(raisedOut)).toBe(true);
  });

  it('keeps the body shadow when one wrist is low confidence', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.LEFT_WRIST, LM.LEFT_INDEX, LM.LEFT_PINKY, LM.LEFT_THUMB]) {
      pose.visibility[lm] = 0.01;
      pose.presence[lm] = 0.01;
    }
    const out = createPrivacyShadowGeometry();

    buildPrivacyShadowGeometry(pose, out);

    expect(out.hasPose).toBe(true);
    expect(out.outerPath).not.toBe('');
    expect(out.shapeCount).toBeGreaterThanOrEqual(3);
    expect(isFinitePrivacyShadowGeometry(out)).toBe(true);
  });
});
