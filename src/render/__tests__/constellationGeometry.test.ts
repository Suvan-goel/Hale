import { CHAIN_COUNT, CHAIN_IDS } from '../../pose/chains';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  buildConstellationGeometry,
  CONSTELLATION_CONNECTIONS,
  createConstellationGeometry,
} from '../constellationGeometry';
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
  parseLandmarkEvent(makeFrame(0, mulberry32(19), { noiseAmp: 0 }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, VIEWPORT, pose);
  return pose;
}

function reliableChains() {
  return new Float64Array(CHAIN_COUNT).fill(0.95);
}

function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const x = ax + dx * t;
  const y = ay + dy * t;
  return Math.hypot(px - x, py - y);
}

describe('buildConstellationGeometry', () => {
  it('generates deterministic sampled dots and paths', () => {
    const pose = mappedStandingPose();
    const chains = reliableChains();
    const a = createConstellationGeometry();
    const b = createConstellationGeometry();

    buildConstellationGeometry(pose, chains, a);
    buildConstellationGeometry(pose, chains, b);

    expect(a.linePath).toBe(b.linePath);
    expect(a.sampleDotPath).toBe(b.sampleDotPath);
    expect(a.softSampleDotPath).toBe(b.softSampleDotPath);
    expect(a.jointDotPath).toBe(b.jointDotPath);
    expect(a.dotCount).toBeGreaterThan(120);
    expect(a.dotCount).toBeLessThanOrEqual(220);
  });

  it('keeps sampled dots near their intended bone segments', () => {
    const pose = mappedStandingPose();
    const out = createConstellationGeometry();
    buildConstellationGeometry(pose, reliableChains(), out);

    for (let i = 0; i < out.sampleCount; i++) {
      let minDistance = Infinity;
      for (const connection of CONSTELLATION_CONNECTIONS) {
        minDistance = Math.min(
          minDistance,
          pointToSegmentDistance(
            out.sampleXs[i],
            out.sampleYs[i],
            pose.xs[connection.a],
            pose.ys[connection.a],
            pose.xs[connection.b],
            pose.ys[connection.b]
          )
        );
      }
      expect(minDistance).toBeLessThanOrEqual(2.1);
    }
  });

  it('skips low-confidence landmarks and related segments', () => {
    const pose = mappedStandingPose();
    pose.visibility[LM.LEFT_WRIST] = 0.1;
    pose.presence[LM.LEFT_WRIST] = 0.1;
    const out = createConstellationGeometry();

    buildConstellationGeometry(pose, reliableChains(), out);

    expect(out.skippedLandmarks).toBe(1);
    expect(out.skippedSegments).toBeGreaterThan(0);
  });

  it('filters segments when a chain is unreliable', () => {
    const pose = mappedStandingPose();
    const chains = reliableChains();
    const full = createConstellationGeometry();
    const filtered = createConstellationGeometry();
    chains[CHAIN_IDS.indexOf('leftArm')] = 0.05;

    buildConstellationGeometry(pose, reliableChains(), full);
    buildConstellationGeometry(pose, chains, filtered);

    expect(filtered.lineCount).toBeLessThan(full.lineCount);
    expect(filtered.skippedSegments).toBeGreaterThan(0);
  });

  it('caps total dots', () => {
    const out = createConstellationGeometry();
    buildConstellationGeometry(mappedStandingPose(), reliableChains(), out, { maxDots: 40 });

    expect(out.dotCount).toBeLessThanOrEqual(40);
  });

  it('can skip sampled dots while keeping joints and lines', () => {
    const out = createConstellationGeometry();
    buildConstellationGeometry(mappedStandingPose(), reliableChains(), out, {
      sampledDotsEnabled: false,
    });

    expect(out.lineCount).toBeGreaterThan(0);
    expect(out.sampleCount).toBe(0);
    expect(out.jointCount).toBeGreaterThan(0);
    expect(out.dotCount).toBe(out.jointCount);
  });

  it('reduces sampled dots with sample density', () => {
    const full = createConstellationGeometry();
    const reduced = createConstellationGeometry();

    buildConstellationGeometry(mappedStandingPose(), reliableChains(), full);
    buildConstellationGeometry(mappedStandingPose(), reliableChains(), reduced, {
      sampleDensity: 0.5,
    });

    expect(reduced.sampleCount).toBeLessThan(full.sampleCount);
    expect(reduced.lineCount).toBe(full.lineCount);
    expect(reduced.jointCount).toBe(full.jointCount);
  });

  it('handles an empty pose without paths or dots', () => {
    const pose = createScreenPoseLandmarks();
    const out = createConstellationGeometry();

    buildConstellationGeometry(pose, reliableChains(), out);

    expect(out.dotCount).toBe(0);
    expect(out.linePath).toBe('');
    expect(out.sampleDotPath).toBe('');
    expect(out.jointDotPath).toBe('');
  });

  it('adds deterministic domain emphasis overlays without changing dot counts', () => {
    const pose = mappedStandingPose();
    const base = createConstellationGeometry();
    const emphasized = createConstellationGeometry();
    const emphasizedAgain = createConstellationGeometry();

    buildConstellationGeometry(pose, reliableChains(), base);
    buildConstellationGeometry(pose, reliableChains(), emphasized, {
      activeDomain: 'strength_power',
      domainEmphasisStrength: 1,
    });
    buildConstellationGeometry(pose, reliableChains(), emphasizedAgain, {
      activeDomain: 'strength_power',
      domainEmphasisStrength: 1,
    });

    expect(emphasized.dotCount).toBe(base.dotCount);
    expect(emphasized.emphasizedLinePath).toContain('M');
    expect(emphasized.emphasizedSampleDotPath + emphasized.emphasizedSoftSampleDotPath).toContain('M');
    expect(emphasized.emphasizedLinePath).toBe(emphasizedAgain.emphasizedLinePath);
  });
});
