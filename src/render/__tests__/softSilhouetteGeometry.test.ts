import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  buildSoftSilhouetteGeometry,
  createSoftSilhouetteGeometry,
  isFiniteSoftSilhouetteGeometry,
} from '../softSilhouetteGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(822), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('soft silhouette geometry', () => {
  it('builds a cohesive low-path silhouette from MediaPipe landmarks', () => {
    const out = createSoftSilhouetteGeometry();

    buildSoftSilhouetteGeometry(mappedStandingPose(), out);

    expect(out.hasPose).toBe(true);
    expect(isFiniteSoftSilhouetteGeometry(out)).toBe(true);
    expect(out.corePath).toContain('C');
    expect(out.limbPath).toBe('');
    expect(out.blendPath).toBe('');
    expect(out.rimPath).toContain('C');
    expect(out.surfacePathCount).toBe(2);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.shapeCount).toBe(1);
    expect(out.opacity).toBeGreaterThan(0.7);
  });

  it('keeps the core present when face landmarks are unreliable', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR]) {
      pose.visibility[lm] = 0.01;
      pose.presence[lm] = 0.01;
    }
    const out = createSoftSilhouetteGeometry();

    buildSoftSilhouetteGeometry(pose, out);

    expect(out.hasPose).toBe(true);
    expect(out.corePath).not.toBe('');
    expect(isFiniteSoftSilhouetteGeometry(out)).toBe(true);
  });

  it('updates limb geometry when a wrist moves', () => {
    const neutral = mappedStandingPose();
    const raised = mappedStandingPose();
    raised.ys[LM.LEFT_WRIST] -= 210;
    raised.ys[LM.LEFT_INDEX] -= 210;
    raised.ys[LM.LEFT_PINKY] -= 210;
    raised.ys[LM.LEFT_THUMB] -= 210;

    const neutralOut = createSoftSilhouetteGeometry();
    const raisedOut = createSoftSilhouetteGeometry();
    buildSoftSilhouetteGeometry(neutral, neutralOut);
    buildSoftSilhouetteGeometry(raised, raisedOut);

    expect(raisedOut.corePath).not.toBe(neutralOut.corePath);
    expect(isFiniteSoftSilhouetteGeometry(raisedOut)).toBe(true);
  });
});
