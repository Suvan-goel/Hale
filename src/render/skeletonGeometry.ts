/**
 * Pure-TS skeleton geometry: pipeline output → SVG path strings.
 *
 * Reliability gating is visual here: bones belonging to chains above the
 * reliability threshold draw bright; the rest draw dim. The skeleton degrades
 * gracefully as the subject turns side-on instead of flickering garbage.
 *
 * Per-frame string building is the one deliberate allocation on the render
 * path (transient, collected young); everything feeding it is allocation-free.
 */

import { CHAIN_IDS, ChainId, RELIABLE_THRESHOLD } from '../pose/chains';
import { LM, PoseFrame } from '../pose/types';

interface Bone {
  a: LM;
  b: LM;
  /** Chain whose reliability gates this bone; null = max(leftSide, rightSide). */
  chain: ChainId | null;
}

const BONES: readonly Bone[] = [
  // head
  { a: LM.NOSE, b: LM.LEFT_EAR, chain: 'head' },
  { a: LM.NOSE, b: LM.RIGHT_EAR, chain: 'head' },
  // torso box — trust if either side chain is reliable
  { a: LM.LEFT_SHOULDER, b: LM.RIGHT_SHOULDER, chain: null },
  { a: LM.LEFT_HIP, b: LM.RIGHT_HIP, chain: null },
  { a: LM.LEFT_SHOULDER, b: LM.LEFT_HIP, chain: 'leftSide' },
  { a: LM.RIGHT_SHOULDER, b: LM.RIGHT_HIP, chain: 'rightSide' },
  // arms
  { a: LM.LEFT_SHOULDER, b: LM.LEFT_ELBOW, chain: 'leftArm' },
  { a: LM.LEFT_ELBOW, b: LM.LEFT_WRIST, chain: 'leftArm' },
  { a: LM.RIGHT_SHOULDER, b: LM.RIGHT_ELBOW, chain: 'rightArm' },
  { a: LM.RIGHT_ELBOW, b: LM.RIGHT_WRIST, chain: 'rightArm' },
  // legs + feet
  { a: LM.LEFT_HIP, b: LM.LEFT_KNEE, chain: 'leftSide' },
  { a: LM.LEFT_KNEE, b: LM.LEFT_ANKLE, chain: 'leftSide' },
  { a: LM.LEFT_ANKLE, b: LM.LEFT_HEEL, chain: 'leftSide' },
  { a: LM.LEFT_HEEL, b: LM.LEFT_FOOT_INDEX, chain: 'leftSide' },
  { a: LM.RIGHT_HIP, b: LM.RIGHT_KNEE, chain: 'rightSide' },
  { a: LM.RIGHT_KNEE, b: LM.RIGHT_ANKLE, chain: 'rightSide' },
  { a: LM.RIGHT_ANKLE, b: LM.RIGHT_HEEL, chain: 'rightSide' },
  { a: LM.RIGHT_HEEL, b: LM.RIGHT_FOOT_INDEX, chain: 'rightSide' },
];

const JOINTS: readonly { lm: LM; chain: ChainId | null }[] = [
  { lm: LM.NOSE, chain: 'head' },
  { lm: LM.LEFT_SHOULDER, chain: 'leftSide' },
  { lm: LM.RIGHT_SHOULDER, chain: 'rightSide' },
  { lm: LM.LEFT_ELBOW, chain: 'leftArm' },
  { lm: LM.RIGHT_ELBOW, chain: 'rightArm' },
  { lm: LM.LEFT_WRIST, chain: 'leftArm' },
  { lm: LM.RIGHT_WRIST, chain: 'rightArm' },
  { lm: LM.LEFT_HIP, chain: 'leftSide' },
  { lm: LM.RIGHT_HIP, chain: 'rightSide' },
  { lm: LM.LEFT_KNEE, chain: 'leftSide' },
  { lm: LM.RIGHT_KNEE, chain: 'rightSide' },
  { lm: LM.LEFT_ANKLE, chain: 'leftSide' },
  { lm: LM.RIGHT_ANKLE, chain: 'rightSide' },
];

const LEFT_SIDE_IDX = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_IDX = CHAIN_IDS.indexOf('rightSide');

export interface SkeletonPaths {
  /** Bones/joints on reliable chains. */
  bright: string;
  /** Bones/joints on unreliable chains (drawn dim, not hidden). */
  dim: string;
  /** Joint circles, bright chains only. */
  joints: string;
}

export interface SkeletonViewport {
  width: number;
  height: number;
  /** Camera source aspect (w/h of the upright image), e.g. 480/640. */
  sourceAspect: number;
  /** Mirror x for front camera so the skeleton moves like a mirror image. */
  mirrored: boolean;
}

export function emptySkeletonPaths(): SkeletonPaths {
  return { bright: '', dim: '', joints: '' };
}

export function clearSkeletonPaths(out: SkeletonPaths): void {
  out.bright = '';
  out.dim = '';
  out.joints = '';
}

/**
 * Builds aspect-preserving "cover" path strings for the current frame.
 * Mutates `out`. Call only when frame.hasPose.
 */
export function buildSkeletonPaths(
  frame: PoseFrame,
  chainReliability: Float64Array,
  viewport: SkeletonViewport,
  out: SkeletonPaths,
  threshold = RELIABLE_THRESHOLD
): void {
  const { width, height, sourceAspect, mirrored } = viewport;
  const viewAspect = width / height;
  let sx: number;
  let sy: number;
  let ox = 0;
  let oy = 0;
  if (viewAspect > sourceAspect) {
    sx = width;
    sy = width / sourceAspect;
    oy = (height - sy) / 2;
  } else {
    sy = height;
    sx = height * sourceAspect;
    ox = (width - sx) / 2;
  }

  let bright = '';
  let dim = '';
  let joints = '';

  for (let i = 0; i < BONES.length; i++) {
    const bone = BONES[i];
    const reliable = chainIsReliable(bone.chain, chainReliability, threshold);
    const xa = px(frame.xs[bone.a], mirrored) * sx + ox;
    const ya = frame.ys[bone.a] * sy + oy;
    const xb = px(frame.xs[bone.b], mirrored) * sx + ox;
    const yb = frame.ys[bone.b] * sy + oy;
    const segment = `M${xa.toFixed(1)} ${ya.toFixed(1)}L${xb.toFixed(1)} ${yb.toFixed(1)}`;
    if (reliable) bright += segment;
    else dim += segment;
  }

  const r = Math.max(3, sx * 0.012);
  for (let i = 0; i < JOINTS.length; i++) {
    const joint = JOINTS[i];
    if (!chainIsReliable(joint.chain, chainReliability, threshold)) continue;
    const x = px(frame.xs[joint.lm], mirrored) * sx + ox;
    const y = frame.ys[joint.lm] * sy + oy;
    joints += circle(x, y, r);
  }

  out.bright = bright;
  out.dim = dim;
  out.joints = joints;
}

function px(x: number, mirrored: boolean): number {
  return mirrored ? 1 - x : x;
}

function chainIsReliable(
  chain: ChainId | null,
  reliability: Float64Array,
  threshold: number
): boolean {
  if (chain === null) {
    return (
      Math.max(reliability[LEFT_SIDE_IDX], reliability[RIGHT_SIDE_IDX]) >= threshold
    );
  }
  return reliability[CHAIN_IDS.indexOf(chain)] >= threshold;
}

function circle(x: number, y: number, r: number): string {
  const x0 = (x - r).toFixed(1);
  const x1 = (x + r).toFixed(1);
  const yy = y.toFixed(1);
  const rr = r.toFixed(1);
  return `M${x0} ${yy}a${rr} ${rr} 0 1 0 ${(2 * r).toFixed(1)} 0a${rr} ${rr} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
}
