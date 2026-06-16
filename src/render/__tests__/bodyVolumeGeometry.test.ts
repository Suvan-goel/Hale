import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  buildBodyVolumeGeometry,
  createBodyVolumeGeometry,
  generateHeadDotSeeds,
  generateTorsoDotSeeds,
  getHeadEstimate,
  mapHeadSeedToScreenPoint,
  Point,
} from '../bodyVolumeGeometry';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  ScreenPoseLandmarks,
} from '../poseCoordinateMapper';

const VIEWPORT = {
  width: 390,
  height: 844,
  sourceAspect: 480 / 640,
  mirrored: false,
};

function mappedStandingPose(): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(23), { noiseAmp: 0 }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

describe('body volume geometry', () => {
  it('generates deterministic torso and head seeds', () => {
    expect(generateTorsoDotSeeds(8)).toEqual(generateTorsoDotSeeds(8));
    expect(generateHeadDotSeeds(8)).toEqual(generateHeadDotSeeds(8));
  });

  it('maps torso dots inside the shoulder-hip quadrilateral', () => {
    const pose = mappedStandingPose();
    const out = createBodyVolumeGeometry();
    buildBodyVolumeGeometry(pose, out, {
      bodyVolumeEnabled: true,
      torsoVolumeEnabled: true,
      headVolumeEnabled: false,
      torsoDotCount: 80,
      maxVolumeDots: 120,
    });

    const quad = [
      { x: pose.xs[LM.LEFT_SHOULDER], y: pose.ys[LM.LEFT_SHOULDER] },
      { x: pose.xs[LM.RIGHT_SHOULDER], y: pose.ys[LM.RIGHT_SHOULDER] },
      { x: pose.xs[LM.RIGHT_HIP], y: pose.ys[LM.RIGHT_HIP] },
      { x: pose.xs[LM.LEFT_HIP], y: pose.ys[LM.LEFT_HIP] },
    ];
    expect(out.torsoDotCount).toBeGreaterThan(40);
    for (let i = 0; i < out.torsoDotCount; i++) {
      expect(pointInPolygon({ x: out.torsoXs[i], y: out.torsoYs[i] }, quad)).toBe(true);
    }
  });

  it('maps head dots inside the estimated ellipse', () => {
    const pose = mappedStandingPose();
    const estimate = getHeadEstimate(pose);
    expect(estimate).not.toBeNull();
    const seeds = generateHeadDotSeeds(24);

    for (const seed of seeds) {
      const point = mapHeadSeedToScreenPoint(seed, estimate!);
      const nx = (point.x - estimate!.center.x) / estimate!.rx;
      const ny = (point.y - estimate!.center.y) / estimate!.ry;
      expect(nx * nx + ny * ny).toBeLessThanOrEqual(1.05);
    }
  });

  it('returns no torso dots when torso landmarks are low confidence', () => {
    const pose = mappedStandingPose();
    pose.visibility[LM.LEFT_HIP] = 0.1;
    pose.presence[LM.LEFT_HIP] = 0.1;
    const out = createBodyVolumeGeometry();

    buildBodyVolumeGeometry(pose, out, {
      bodyVolumeEnabled: true,
      torsoVolumeEnabled: true,
      headVolumeEnabled: false,
    });

    expect(out.torsoDotCount).toBe(0);
    expect(out.skippedVolumeSections).toBeGreaterThan(0);
  });

  it('returns no head dots when head cannot be estimated safely', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER]) {
      pose.visibility[lm] = 0.1;
      pose.presence[lm] = 0.1;
    }
    const out = createBodyVolumeGeometry();

    buildBodyVolumeGeometry(pose, out, {
      bodyVolumeEnabled: true,
      torsoVolumeEnabled: false,
      headVolumeEnabled: true,
    });

    expect(out.headDotCount).toBe(0);
    expect(out.skippedVolumeSections).toBeGreaterThan(0);
  });

  it('keeps total volume dots under the configured cap', () => {
    const out = createBodyVolumeGeometry();
    buildBodyVolumeGeometry(mappedStandingPose(), out, {
      bodyVolumeEnabled: true,
      torsoVolumeEnabled: true,
      headVolumeEnabled: true,
      shoulderHipDensityEnabled: true,
      torsoDotCount: 100,
      headDotCount: 30,
      shoulderHipDotCount: 30,
      maxVolumeDots: 60,
    });

    expect(out.volumeDotCount).toBeLessThanOrEqual(60);
  });

  it('does not call Math.random while generating or mapping volume dots', () => {
    const spy = jest.spyOn(Math, 'random');
    const out = createBodyVolumeGeometry();

    generateTorsoDotSeeds(12);
    generateHeadDotSeeds(12);
    buildBodyVolumeGeometry(mappedStandingPose(), out, {
      bodyVolumeEnabled: true,
      torsoVolumeEnabled: true,
      headVolumeEnabled: true,
      maxVolumeDots: 80,
    });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
