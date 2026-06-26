import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';
import {
  buildSoftDigitalTwinGeometry,
  createSoftDigitalTwinGeometry,
  isFiniteSoftDigitalTwinGeometry,
} from '../softDigitalTwinGeometry';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(options: Parameters<typeof makeFrame>[2] = {}): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(1017), { noiseAmp: 0, ...options }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

describe('soft digital twin geometry', () => {
  it('builds the balanced blended human from separate pose-driven surfaces', () => {
    const out = createSoftDigitalTwinGeometry();

    buildSoftDigitalTwinGeometry(mappedStandingPose(), out);

    const ids = out.surfaces.map((surface) => surface.id);
    expect(out.hasPose).toBe(true);
    expect(isFiniteSoftDigitalTwinGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBe(13);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.shapeCount).toBe(out.surfacePathCount);
    expect(ids).toEqual(expect.arrayContaining(['head', 'neck', 'ribcageTorso', 'pelvis']));
    expect(ids).toEqual(expect.arrayContaining(['leftUpperArm', 'rightUpperArm']));
    expect(ids).toEqual(expect.arrayContaining(['leftForearmHand', 'rightForearmHand']));
    expect(ids).toEqual(expect.arrayContaining(['leftThigh', 'rightThigh']));
    expect(ids).toEqual(expect.arrayContaining(['leftShinFoot', 'rightShinFoot']));
    expect(ids).not.toContain('leftHand');
    expect(ids).not.toContain('rightHand');
    expect(ids).not.toContain('leftFoot');
    expect(ids).not.toContain('rightFoot');
    expect(ids).not.toContain('balancedBodyEnvelope');
    expect(ids).not.toContain('balancedCoreEnvelope');
    expect(ids).not.toContain('jointBlends');
    expect(out.constructionPoints.map((point) => point.id)).toEqual(
      expect.arrayContaining([
        'neckTop',
        'neckBase',
        'ribCentre',
        'pelvisCentre',
        'visualLeftShoulder',
        'visualRightShoulder',
        'visualLeftHip',
        'visualRightHip',
      ])
    );
    expect(out.constructionLines.map((line) => line.id)).toEqual(
      expect.arrayContaining(['visualShoulders', 'visualHips', 'neckAxis'])
    );
    expect(out.opacity).toBeGreaterThan(0.7);
  });

  it('preserves the lean segmented preset as a benchmark comparison', () => {
    const out = createSoftDigitalTwinGeometry();

    buildSoftDigitalTwinGeometry(mappedStandingPose(), out, { visualPreset: 'lean' });

    const ids = out.surfaces.map((surface) => surface.id);
    expect(out.hasPose).toBe(true);
    expect(isFiniteSoftDigitalTwinGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBe(13);
    expect(ids).toEqual(expect.arrayContaining(['head', 'neck', 'ribcageTorso', 'pelvis']));
    expect(ids).toEqual(expect.arrayContaining(['leftArm', 'rightArm', 'leftLeg', 'rightLeg']));
    expect(ids).not.toContain('jointBlends');
  });

  it('localizes low-confidence distal landmark loss instead of dropping the whole body', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.LEFT_WRIST, LM.LEFT_INDEX, LM.LEFT_PINKY, LM.LEFT_THUMB]) {
      pose.visibility[lm] = 0.02;
      pose.presence[lm] = 0.02;
    }
    const out = createSoftDigitalTwinGeometry();

    buildSoftDigitalTwinGeometry(pose, out);

    const ids = out.surfaces.map((surface) => surface.id);
    expect(out.hasPose).toBe(true);
    expect(ids).toContain('ribcageTorso');
    expect(ids).toContain('pelvis');
    expect(ids).toContain('leftUpperArm');
    expect(ids).not.toContain('leftForearmHand');
    expect(isFiniteSoftDigitalTwinGeometry(out)).toBe(true);
  });

  it('moves the segmented limb surface with the underlying landmarks', () => {
    const neutral = mappedStandingPose();
    const raised = mappedStandingPose();
    raised.ys[LM.LEFT_WRIST] -= 190;
    raised.ys[LM.LEFT_INDEX] -= 190;
    raised.ys[LM.LEFT_PINKY] -= 190;
    raised.ys[LM.LEFT_THUMB] -= 190;

    const neutralOut = createSoftDigitalTwinGeometry();
    const raisedOut = createSoftDigitalTwinGeometry();
    buildSoftDigitalTwinGeometry(neutral, neutralOut);
    buildSoftDigitalTwinGeometry(raised, raisedOut);

    const neutralArm = neutralOut.surfaces.find((surface) => surface.id === 'leftForearmHand');
    const raisedArm = raisedOut.surfaces.find((surface) => surface.id === 'leftForearmHand');

    expect(neutralArm?.path).toBeDefined();
    expect(raisedArm?.path).toBeDefined();
    expect(raisedArm?.path).not.toBe(neutralArm?.path);
    expect(isFiniteSoftDigitalTwinGeometry(raisedOut)).toBe(true);
  });
});
