import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type Point,
} from '../bodyVolumeGeometry';
import {
  buildPointCloudBodyGeometry,
  createPointCloudBodyGeometry,
  generateCapsuleDotSeeds,
  generateHeadBodyDotSeeds,
  generateTorsoBodyDotSeeds,
  mapCapsuleSeedToPoint,
  mapHeadBodySeedToPoint,
} from '../pointCloudBodyGeometry';
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

describe('point-cloud body geometry', () => {
  it('generates deterministic body seeds', () => {
    expect(generateTorsoBodyDotSeeds(12)).toEqual(generateTorsoBodyDotSeeds(12));
    expect(generateHeadBodyDotSeeds(12)).toEqual(generateHeadBodyDotSeeds(12));
    expect(generateCapsuleDotSeeds(12, 'leftUpperArm')).toEqual(
      generateCapsuleDotSeeds(12, 'leftUpperArm')
    );
  });

  it('maps capsule dots inside the tapered limb capsule', () => {
    const start = { x: 20, y: 10 };
    const end = { x: 140, y: 10 };
    const startHalfWidth = 14;
    const endHalfWidth = 8;

    for (const seed of generateCapsuleDotSeeds(48, 'capsule-test')) {
      const point = mapCapsuleSeedToPoint(seed, start, end, startHalfWidth, endHalfWidth);
      const t = (point.x - start.x) / (end.x - start.x);
      const halfWidth = startHalfWidth + (endHalfWidth - startHalfWidth) * t;

      expect(t).toBeGreaterThanOrEqual(-0.001);
      expect(t).toBeLessThanOrEqual(1.001);
      expect(Math.abs(point.y - start.y)).toBeLessThanOrEqual(halfWidth + 0.001);
    }
  });

  it('maps torso body dots inside the shoulder-hip quadrilateral', () => {
    const pose = mappedStandingPose();
    const torso = getTorsoEstimate(pose);
    expect(torso).not.toBeNull();
    const out = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(pose, out, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 520,
      showKeypoints: false,
    });

    const quad = [
      torso!.leftShoulder,
      torso!.rightShoulder,
      torso!.rightHip,
      torso!.leftHip,
    ];
    expect(out.torsoDotCount).toBeGreaterThan(100);
    for (let i = 0; i < out.torsoDotCount; i++) {
      expect(pointInPolygon({ x: out.torsoXs[i], y: out.torsoYs[i] }, quad)).toBe(true);
    }
  });

  it('maps head body dots inside the estimated head ellipse', () => {
    const pose = mappedStandingPose();
    const estimate = getHeadEstimate(pose);
    expect(estimate).not.toBeNull();

    for (const seed of generateHeadBodyDotSeeds(48)) {
      const point = mapHeadBodySeedToPoint(seed, estimate!);
      const nx = (point.x - estimate!.center.x) / estimate!.rx;
      const ny = (point.y - estimate!.center.y) / estimate!.ry;
      expect(nx * nx + ny * ny).toBeLessThanOrEqual(1.05);
    }
  });

  it('keeps medium density body-like and reduces count in low-latency mode', () => {
    const pose = mappedStandingPose();
    const normal = createPointCloudBodyGeometry();
    const low = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(pose, normal, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
    });
    buildPointCloudBodyGeometry(pose, low, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 400,
      lowLatencyMode: true,
    });

    expect(normal.dotCount).toBeGreaterThanOrEqual(740);
    expect(normal.dotCount).toBeLessThanOrEqual(800);
    expect(low.dotCount).toBeLessThan(normal.dotCount);
    expect(low.dotCount).toBeLessThanOrEqual(400);
  });

  it('scales rendered dot radii without increasing dot count', () => {
    const pose = mappedStandingPose();
    const small = createPointCloudBodyGeometry();
    const large = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(pose, small, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
      dotScale: 1,
    });
    buildPointCloudBodyGeometry(pose, large, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
      dotScale: 1.4,
    });

    expect(large.dotCount).toBe(small.dotCount);
    expect(firstRadius(large.torsoDotPath || large.softTorsoDotPath)).toBeGreaterThan(
      firstRadius(small.torsoDotPath || small.softTorsoDotPath)
    );
  });

  it('respects the configured absolute dot cap including keypoints', () => {
    const out = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(mappedStandingPose(), out, {
      pointCloudBodyEnabled: true,
      density: 'high',
      maxDots: 240,
      showKeypoints: true,
    });

    expect(out.dotCount).toBeLessThanOrEqual(240);
  });

  it('skips dependent limb capsules when a required landmark is low confidence', () => {
    const pose = mappedStandingPose();
    pose.visibility[LM.LEFT_ELBOW] = 0.1;
    pose.presence[LM.LEFT_ELBOW] = 0.1;
    const out = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(pose, out, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
      showKeypoints: false,
    });

    expect(out.bodyPartDotCounts.leftUpperArm).toBe(0);
    expect(out.bodyPartDotCounts.leftForearm).toBe(0);
    expect(out.bodyPartDotCounts.rightUpperArm).toBeGreaterThan(0);
    expect(out.skippedBodyPartCount).toBeGreaterThanOrEqual(2);
  });

  it('skips torso dots when shoulder and hip confidence is below threshold', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP]) {
      pose.visibility[lm] = 0.1;
      pose.presence[lm] = 0.1;
    }
    const out = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(pose, out, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
      showKeypoints: false,
    });

    expect(out.torsoDotCount).toBe(0);
    expect(out.skippedBodyPartCount).toBeGreaterThan(0);
  });

  it('caps optional local connection lines', () => {
    const out = createPointCloudBodyGeometry();

    buildPointCloudBodyGeometry(mappedStandingPose(), out, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
      showConnections: true,
      connectionMaxLines: 12,
    });

    expect(out.connectionLineCount).toBeGreaterThan(0);
    expect(out.connectionLineCount).toBeLessThanOrEqual(12);
  });

  it('does not call Math.random while generating or mapping body dots', () => {
    const spy = jest.spyOn(Math, 'random');
    const out = createPointCloudBodyGeometry();

    generateTorsoBodyDotSeeds(12);
    generateHeadBodyDotSeeds(12);
    generateCapsuleDotSeeds(12, 'random-check');
    buildPointCloudBodyGeometry(mappedStandingPose(), out, {
      pointCloudBodyEnabled: true,
      density: 'medium',
      maxDots: 800,
      showConnections: true,
    });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

function firstRadius(path: string): number {
  const match = path.match(/a([0-9.]+) [0-9.]+/);
  expect(match).not.toBeNull();
  return Number(match![1]);
}
