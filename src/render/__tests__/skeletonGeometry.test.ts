import { CHAIN_COUNT, CHAIN_IDS } from '../../pose/chains';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent } from '../../pose/types';
import { buildSkeletonPaths, emptySkeletonPaths, SkeletonViewport } from '../skeletonGeometry';

const VIEWPORT: SkeletonViewport = {
  width: 390,
  height: 844,
  sourceAspect: 480 / 640,
  mirrored: false,
};

function frameFor(reliabilities: Partial<Record<(typeof CHAIN_IDS)[number], number>>) {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(61), { noiseAmp: 0 }), frame);
  const rel = new Float64Array(CHAIN_COUNT).fill(0.95);
  for (const [chain, value] of Object.entries(reliabilities)) {
    rel[CHAIN_IDS.indexOf(chain as (typeof CHAIN_IDS)[number])] = value!;
  }
  return { frame, rel };
}

describe('buildSkeletonPaths', () => {
  it('puts all bones in the bright path when every chain is reliable', () => {
    const { frame, rel } = frameFor({});
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    expect(out.bright.split('M').length - 1).toBe(18); // all 18 bones
    expect(out.dim).toBe('');
    expect(out.joints).not.toBe('');
  });

  it('moves far-side bones to the dim path when that chain degrades', () => {
    const { frame, rel } = frameFor({ leftSide: 0.2, leftArm: 0.2 });
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    // left torso side + 4 left leg/foot bones + 2 left arm bones = 7 dim
    expect(out.dim.split('M').length - 1).toBe(7);
    expect(out.bright.split('M').length - 1).toBe(11);
  });

  it('keeps the torso cross-bones bright if at least one side chain is reliable', () => {
    const { frame, rel } = frameFor({ leftSide: 0.1 });
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    // shoulder line + hip line stay bright (gated on max of side chains)
    expect(out.bright).toContain('M');
    expect(out.bright.split('M').length - 1).toBe(13);
  });

  it('mirrors x when mirrored (front camera)', () => {
    const { frame, rel } = frameFor({});
    const plain = emptySkeletonPaths();
    const flipped = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, plain);
    buildSkeletonPaths(frame, rel, { ...VIEWPORT, mirrored: true }, flipped);
    expect(flipped.bright).not.toBe(plain.bright);
  });

  it('letterboxes to preserve the source aspect (cover fit)', () => {
    const { frame, rel } = frameFor({});
    const wide = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, { ...VIEWPORT, width: 844, height: 390 }, wide);
    expect(wide.bright).toContain('M');
  });
});
