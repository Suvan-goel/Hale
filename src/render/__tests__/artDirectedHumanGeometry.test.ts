import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  ART_DIRECTED_HUMAN_SURFACE_CAP,
  buildArtDirectedHumanGeometry,
  createArtDirectedHumanGeometry,
  isFiniteArtDirectedHumanGeometry,
} from '../artDirectedHumanGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(4242), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('art-directed human geometry', () => {
  it('builds finite low-path template surfaces from a standing pose', () => {
    const out = createArtDirectedHumanGeometry();

    buildArtDirectedHumanGeometry(mappedStandingPose(), out);

    expect(out.hasPose).toBe(true);
    expect(isFiniteArtDirectedHumanGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBe(ART_DIRECTED_HUMAN_SURFACE_CAP);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.shapeCount).toBe(out.surfacePathCount);
    expect(out.surfaces.find((surface) => surface.id === 'body')?.path).toContain('C');
  });

  it('keeps the central body intact when a wrist is low confidence', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.LEFT_WRIST, LM.LEFT_INDEX, LM.LEFT_PINKY, LM.LEFT_THUMB]) {
      pose.visibility[lm] = 0.01;
      pose.presence[lm] = 0.01;
    }
    const out = createArtDirectedHumanGeometry();

    buildArtDirectedHumanGeometry(pose, out);

    expect(out.hasPose).toBe(true);
    expect(out.surfaces.find((surface) => surface.id === 'body')?.visible).toBe(true);
    expect(out.skippedPartCount).toBe(0);
    expect(isFiniteArtDirectedHumanGeometry(out)).toBe(true);
  });

  it('deforms the limb surface when a wrist moves', () => {
    const neutral = mappedStandingPose();
    const raised = mappedStandingPose();
    raised.ys[LM.LEFT_WRIST] -= 180;
    raised.ys[LM.LEFT_INDEX] -= 180;
    raised.ys[LM.LEFT_PINKY] -= 180;
    const neutralOut = createArtDirectedHumanGeometry();
    const raisedOut = createArtDirectedHumanGeometry();

    buildArtDirectedHumanGeometry(neutral, neutralOut);
    buildArtDirectedHumanGeometry(raised, raisedOut);

    const neutralArm = neutralOut.surfaces.find((surface) => surface.id === 'leftArm')?.path;
    const raisedArm = raisedOut.surfaces.find((surface) => surface.id === 'leftArm')?.path;
    expect(raisedArm).not.toBe(neutralArm);
    expect(isFiniteArtDirectedHumanGeometry(raisedOut)).toBe(true);
  });

  it('can render separated arm and leg subsegments for joint-gap testing', () => {
    const out = createArtDirectedHumanGeometry();

    buildArtDirectedHumanGeometry(mappedStandingPose(), out, { jointStyle: 'separated' });

    const leftArm = out.surfaces.find((surface) => surface.id === 'leftArm')?.path ?? '';
    const leftLeg = out.surfaces.find((surface) => surface.id === 'leftLeg')?.path ?? '';
    expect(out.hasPose).toBe(true);
    expect(isFiniteArtDirectedHumanGeometry(out)).toBe(true);
    expect((leftArm.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect((leftLeg.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
