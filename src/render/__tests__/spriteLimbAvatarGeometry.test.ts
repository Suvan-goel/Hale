import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  buildSpriteLimbAvatarGeometry,
  createSpriteLimbAvatarGeometry,
  isFiniteSpriteLimbAvatarGeometry,
  SPRITE_LIMB_AVATAR_SURFACE_CAP,
} from '../spriteLimbAvatarGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(438), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

function visibleSurfaceIds(
  out: ReturnType<typeof createSpriteLimbAvatarGeometry>
): readonly string[] {
  return out.surfaces.filter((surface) => surface.visible).map((surface) => surface.id);
}

describe('sprite limb avatar geometry', () => {
  it('maps static body-part masks onto MediaPipe bones with a low primitive count', () => {
    const out = createSpriteLimbAvatarGeometry();

    buildSpriteLimbAvatarGeometry(mappedStandingPose(), out);

    expect(out.hasPose).toBe(true);
    expect(isFiniteSpriteLimbAvatarGeometry(out)).toBe(true);
    expect(out.surfaces).toHaveLength(SPRITE_LIMB_AVATAR_SURFACE_CAP);
    expect(out.surfacePathCount).toBeGreaterThanOrEqual(14);
    expect(out.surfacePathCount).toBeLessThanOrEqual(SPRITE_LIMB_AVATAR_SURFACE_CAP);
    expect(out.dynamicPathCount).toBe(0);
    expect(out.staticTransformedShapeCount).toBe(out.surfacePathCount);
    expect(visibleSurfaceIds(out)).toEqual(
      expect.arrayContaining([
        'centralShell',
        'leftUpperArm',
        'leftForearm',
        'leftThigh',
        'leftLowerLeg',
        'rightUpperArm',
        'rightForearm',
        'rightThigh',
        'rightLowerLeg',
      ])
    );
  });

  it('keeps fixed surface slots across repeated builds', () => {
    const out = createSpriteLimbAvatarGeometry();
    const surfaceSlots = out.surfaces;
    const centralSlot = out.surfaces.find((surface) => surface.id === 'centralShell');

    buildSpriteLimbAvatarGeometry(mappedStandingPose(), out);
    buildSpriteLimbAvatarGeometry(mappedStandingPose(), out);

    expect(out.surfaces).toBe(surfaceSlots);
    expect(out.surfaces.find((surface) => surface.id === 'centralShell')).toBe(centralSlot);
    expect(out.surfaces).toHaveLength(SPRITE_LIMB_AVATAR_SURFACE_CAP);
    expect(out.dynamicPathCount).toBe(0);
  });

  it('moves the forearm sprite transform when the wrist moves', () => {
    const neutral = mappedStandingPose();
    const raised = mappedStandingPose();
    raised.ys[LM.LEFT_WRIST] -= 180;
    raised.ys[LM.LEFT_INDEX] -= 180;
    raised.ys[LM.LEFT_PINKY] -= 180;
    raised.ys[LM.LEFT_THUMB] -= 180;

    const neutralOut = createSpriteLimbAvatarGeometry();
    const raisedOut = createSpriteLimbAvatarGeometry();
    buildSpriteLimbAvatarGeometry(neutral, neutralOut);
    buildSpriteLimbAvatarGeometry(raised, raisedOut);

    const neutralForearm = neutralOut.surfaces.find((surface) => surface.id === 'leftForearm');
    const raisedForearm = raisedOut.surfaces.find((surface) => surface.id === 'leftForearm');
    expect(neutralForearm?.transform).not.toBe(raisedForearm?.transform);
    expect(isFiniteSpriteLimbAvatarGeometry(raisedOut)).toBe(true);
  });
});
