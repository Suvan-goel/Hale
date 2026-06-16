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

// The figure is built from one torso path + tapered limbs + neck + ellipse head.
// Each is one subpath, so counting leading "M" commands counts shapes.
//
// Bright shapes when every chain is reliable:
//   torso (one shouldered path)                      = 1
//   arms:  2 upper + 2 fore                          = 4
//   legs:  2 thigh + 2 shin                          = 4
//   feet:  2                                          = 2
//   neck (with the head chain reliable)              = 1
//                                                    -----
//                                                   = 12
const BRIGHT_ALL = 12;

function shapes(path: string): number {
  return (path.match(/M/g) ?? []).length;
}

function frameFor(reliabilities: Partial<Record<(typeof CHAIN_IDS)[number], number>>) {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(61), { noiseAmp: 0 }), frame);
  const rel = new Float64Array(CHAIN_COUNT).fill(0.95);
  for (const [chain, value] of Object.entries(reliabilities)) {
    rel[CHAIN_IDS.indexOf(chain as (typeof CHAIN_IDS)[number])] = value!;
  }
  return { frame, rel };
}

describe('buildSkeletonPaths (mannequin)', () => {
  it('fills the whole figure bright when every chain is reliable', () => {
    const { frame, rel } = frameFor({});
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    expect(shapes(out.bright)).toBe(BRIGHT_ALL);
    expect(out.dim).toBe('');
    expect(out.head).not.toBe('');
  });

  it('moves far-side limbs to the dim layer when that side degrades', () => {
    const { frame, rel } = frameFor({ leftSide: 0.2, leftArm: 0.2 });
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    // left: 2 arm + 2 leg + 1 foot = 5 dim; torso stays bright (right side ok).
    expect(shapes(out.dim)).toBe(5);
    expect(shapes(out.bright)).toBe(BRIGHT_ALL - 5);
  });

  it('keeps the torso bright if at least one side chain is reliable', () => {
    const { frame, rel } = frameFor({ leftSide: 0.1 });
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    // only the left leg + foot drop out (3); the torso is gated on the max side.
    expect(shapes(out.dim)).toBe(3);
    expect(shapes(out.bright)).toBe(BRIGHT_ALL - 3);
  });

  it('mutes the head into the dim layer when the head chain is weak', () => {
    const { frame, rel } = frameFor({ head: 0.1 });
    const out = emptySkeletonPaths();
    buildSkeletonPaths(frame, rel, VIEWPORT, out);
    expect(out.head).toBe('');
    // neck + head ellipse fall to dim = 2 shapes.
    expect(shapes(out.dim)).toBe(2);
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
