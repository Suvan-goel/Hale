/**
 * Pure-TS figure geometry: pipeline output → filled SVG path strings.
 *
 * We render a refined, filled HUMAN FIGURE (never camera video — Product Law 1).
 * Limbs are TAPERED capsules (the convex hull of two circles of different radii)
 * so an arm narrows naturally from shoulder to wrist; the torso is a single
 * smooth tapered trunk from shoulders to hips; the head is an ellipse joined by a
 * tapered neck. Drawn in one fill, the overlapping shapes union into a single
 * continuous silhouette with believable human proportions — not a balloon-jointed
 * pictogram. SkeletonView fills it with a soft vertical gradient for depth.
 *
 * All widths scale with a body-reference length (shoulder-to-hip distance)
 * measured per frame, so proportions hold at any camera distance — the same
 * body-unit philosophy the measurement pipeline uses.
 *
 * Reliability gating is preserved: parts on chains above the threshold fill
 * BRIGHT; occluded (e.g. side-on far-side) chains fill DIM, so the figure
 * degrades to a clean profile instead of flailing garbage.
 *
 * Every shape is built by `taper()` / `ellipse()` with consistent winding, so a
 * single fill path unions them solid (nonzero rule, no holes where limbs overlap
 * the torso). Per-frame string building is the one deliberate allocation on the
 * render path; everything feeding it is allocation-free.
 */

import { CHAIN_IDS, ChainId, RELIABLE_THRESHOLD } from '../pose/chains';
import { LM, PoseFrame } from '../pose/types';
import {
  computeCoverTransform,
  mapLandmarkX,
  mapLandmarkY,
  PoseScreenViewport,
} from './poseCoordinateMapper';

interface Segment {
  a: LM;
  b: LM;
  /** Chain whose reliability gates this segment; null = max(leftSide, rightSide). */
  chain: ChainId | null;
  /** Capsule radius at A and B, as fractions of the body-reference length. */
  ra: number;
  rb: number;
}

// Tapered limb + foot segments. Torso, neck and head are derived from midpoints
// below. Radii are deliberately slim and taper toward the extremities so the
// figure reads as a person, not a chain of balloons.
const LIMBS: readonly Segment[] = [
  // arms — taper shoulder → elbow → wrist
  { a: LM.LEFT_SHOULDER, b: LM.LEFT_ELBOW, chain: 'leftArm', ra: 0.06, rb: 0.046 },
  { a: LM.LEFT_ELBOW, b: LM.LEFT_WRIST, chain: 'leftArm', ra: 0.046, rb: 0.033 },
  { a: LM.RIGHT_SHOULDER, b: LM.RIGHT_ELBOW, chain: 'rightArm', ra: 0.06, rb: 0.046 },
  { a: LM.RIGHT_ELBOW, b: LM.RIGHT_WRIST, chain: 'rightArm', ra: 0.046, rb: 0.033 },
  // legs — taper hip → knee → ankle
  { a: LM.LEFT_HIP, b: LM.LEFT_KNEE, chain: 'leftSide', ra: 0.085, rb: 0.062 },
  { a: LM.LEFT_KNEE, b: LM.LEFT_ANKLE, chain: 'leftSide', ra: 0.058, rb: 0.038 },
  { a: LM.RIGHT_HIP, b: LM.RIGHT_KNEE, chain: 'rightSide', ra: 0.085, rb: 0.062 },
  { a: LM.RIGHT_KNEE, b: LM.RIGHT_ANKLE, chain: 'rightSide', ra: 0.058, rb: 0.038 },
  // feet
  { a: LM.LEFT_ANKLE, b: LM.LEFT_FOOT_INDEX, chain: 'leftSide', ra: 0.04, rb: 0.026 },
  { a: LM.RIGHT_ANKLE, b: LM.RIGHT_FOOT_INDEX, chain: 'rightSide', ra: 0.04, rb: 0.026 },
];

const LEFT_SIDE_IDX = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_IDX = CHAIN_IDS.indexOf('rightSide');
const HEAD_IDX = CHAIN_IDS.indexOf('head');

export interface SkeletonPaths {
  /** Filled figure on reliable chains. */
  bright: string;
  /** Filled figure parts on unreliable chains (drawn dim, not hidden). */
  dim: string;
  /** Head ellipse (its own layer to avoid winding interaction with the body). */
  head: string;
}

export type SkeletonViewport = PoseScreenViewport;

export function emptySkeletonPaths(): SkeletonPaths {
  return { bright: '', dim: '', head: '' };
}

/**
 * Builds aspect-preserving "cover" figure path strings for the current frame.
 * Mutates `out`. Call only when frame.hasPose.
 */
export function buildSkeletonPaths(
  frame: PoseFrame,
  chainReliability: Float64Array,
  viewport: SkeletonViewport,
  out: SkeletonPaths,
  threshold = RELIABLE_THRESHOLD
): void {
  const transform = computeCoverTransform(viewport);
  const X = (lm: LM): number => mapLandmarkX(frame, lm, transform);
  const Y = (lm: LM): number => mapLandmarkY(frame, lm, transform);

  const shMidX = (X(LM.LEFT_SHOULDER) + X(LM.RIGHT_SHOULDER)) / 2;
  const shMidY = (Y(LM.LEFT_SHOULDER) + Y(LM.RIGHT_SHOULDER)) / 2;
  const hipMidX = (X(LM.LEFT_HIP) + X(LM.RIGHT_HIP)) / 2;
  const hipMidY = (Y(LM.LEFT_HIP) + Y(LM.RIGHT_HIP)) / 2;
  const torsoLen = Math.hypot(shMidX - hipMidX, shMidY - hipMidY);
  const shoulderSpan = Math.hypot(X(LM.LEFT_SHOULDER) - X(LM.RIGHT_SHOULDER), Y(LM.LEFT_SHOULDER) - Y(LM.RIGHT_SHOULDER));
  const hipSpan = Math.hypot(X(LM.LEFT_HIP) - X(LM.RIGHT_HIP), Y(LM.LEFT_HIP) - Y(LM.RIGHT_HIP));
  // Floor on shoulder span so a side-on pose (shoulders nearly stacked) keeps a
  // sensible thickness instead of collapsing to a sliver.
  const ref = Math.max(torsoLen, shoulderSpan * 1.2, 1);

  const sideReliable = Math.max(chainReliability[LEFT_SIDE_IDX], chainReliability[RIGHT_SIDE_IDX]) >= threshold;

  let bright = '';
  let dim = '';

  // Torso: a smooth shouldered shape — shoulder line across the top, curved sides
  // drawn in through the waist, hip line across the bottom. Shoulders sit exactly
  // at the shoulder landmarks where the arms attach, so the figure has a natural
  // shoulder line instead of a central hump. Built wide enough on a side-on pose
  // (when spans collapse) via the ref floor.
  // Shoulders a touch broader than the actual joints so the arms tuck UNDER the
  // shoulder line (no poke-out notch); hips a hair fuller than the waist.
  const shoulderHalf = Math.max(shoulderSpan * 0.58, ref * 0.23);
  const hipHalf = Math.max(hipSpan * 0.5, ref * 0.17);
  // Body axis (shoulders → hips) and its perpendicular; the neck base sits above
  // the shoulder line so the shoulders slope up into the neck (trapezius), not a
  // flat ledge with arms hung off the ends.
  let ux = hipMidX - shMidX;
  let uy = hipMidY - shMidY;
  const ulen = Math.hypot(ux, uy) || 1;
  ux /= ulen;
  uy /= ulen;
  const neckBaseX = shMidX - ux * shoulderHalf * 0.55;
  const neckBaseY = shMidY - uy * shoulderHalf * 0.55;
  const torso = torsoPath(shMidX, shMidY, hipMidX, hipMidY, shoulderHalf, hipHalf, neckBaseX, neckBaseY);
  if (sideReliable) bright += torso;
  else dim += torso;

  // Limbs + feet (tapered).
  for (let i = 0; i < LIMBS.length; i++) {
    const seg = LIMBS[i];
    const s = taper(X(seg.a), Y(seg.a), ref * seg.ra, X(seg.b), Y(seg.b), ref * seg.rb);
    if (chainIsReliable(seg.chain, chainReliability, threshold)) bright += s;
    else dim += s;
  }

  // Head: an ellipse centred between the ears, joined to the neck base (the
  // raised top of the torso) by a short tapered neck. Side-on the ears nearly
  // coincide, so floor the radius.
  const earMidX = (X(LM.LEFT_EAR) + X(LM.RIGHT_EAR)) / 2;
  const earMidY = (Y(LM.LEFT_EAR) + Y(LM.RIGHT_EAR)) / 2;
  const earSpan = Math.hypot(X(LM.LEFT_EAR) - X(LM.RIGHT_EAR), Y(LM.LEFT_EAR) - Y(LM.RIGHT_EAR));
  const headRx = Math.max(earSpan * 0.55, ref * 0.15);
  const headRy = headRx * 1.18;
  // Neck runs from the neck base up to inside the base of the head.
  const neckTopX = earMidX + (neckBaseX - earMidX) * 0.4;
  const neckTopY = earMidY + (neckBaseY - earMidY) * 0.4;
  const neck = taper(neckBaseX, neckBaseY, ref * 0.085, neckTopX, neckTopY, ref * 0.066);

  const headReliable = chainReliability[HEAD_IDX] >= threshold;
  if (headReliable) {
    bright += neck;
    out.head = ellipse(earMidX, earMidY, headRx, headRy);
  } else {
    // Keep the figure whole but muted when the head chain is weak.
    dim += neck + ellipse(earMidX, earMidY, headRx, headRy);
    out.head = '';
  }

  out.bright = bright;
  out.dim = dim;
}

function chainIsReliable(chain: ChainId | null, reliability: Float64Array, threshold: number): boolean {
  if (chain === null) {
    return Math.max(reliability[LEFT_SIDE_IDX], reliability[RIGHT_SIDE_IDX]) >= threshold;
  }
  return reliability[CHAIN_IDS.indexOf(chain)] >= threshold;
}

function f(n: number): string {
  return n.toFixed(1);
}

/**
 * Filled TAPERED capsule: the convex hull of a circle of radius ra at A and rb
 * at B — straight outer tangents down each side, a rounded cap at each end. With
 * ra === rb this is a plain stadium. Built with a consistent winding so many of
 * these concatenated into one fill path union solidly (nonzero rule).
 *
 * Construction: the external-tangent contact direction makes an angle with the
 * A→B axis whose cosine is (ra - rb)/d. Tangent points on both circles share
 * that direction (parallel radii). The narrow end takes the minor cap arc, the
 * wide end the major arc, so the outline stays convex and hole-free.
 */
function taper(ax: number, ay: number, ra: number, bx: number, by: number, rb: number): string {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  // Degenerate / one circle swallows the other → just the larger circle.
  if (d < 1e-3 || d <= Math.abs(ra - rb)) {
    return ra >= rb ? circle(ax, ay, ra) : circle(bx, by, rb);
  }
  const vx = dx / d;
  const vy = dy / d;
  const nx = -vy;
  const ny = vx;
  const c = (ra - rb) / d; // cos of contact angle from the axis
  const s = Math.sqrt(Math.max(0, 1 - c * c));
  // Contact directions (unit), shared by both circles for external tangents.
  const pdx = vx * c + nx * s;
  const pdy = vy * c + ny * s; // "+" side
  const mdx = vx * c - nx * s;
  const mdy = vy * c - ny * s; // "−" side

  const ap1x = ax + ra * pdx;
  const ap1y = ay + ra * pdy;
  const bp1x = bx + rb * pdx;
  const bp1y = by + rb * pdy;
  const bm1x = bx + rb * mdx;
  const bm1y = by + rb * mdy;
  const am1x = ax + ra * mdx;
  const am1y = ay + ra * mdy;

  const RA = f(ra);
  const RB = f(rb);
  // A is the wider/equal end → its cap is the major arc (largeArc=1); B's is minor.
  // Both sweep=0 to match the winding of the plain-stadium case.
  return (
    `M${f(ap1x)} ${f(ap1y)}` +
    `L${f(bp1x)} ${f(bp1y)}` +
    `A${RB} ${RB} 0 0 0 ${f(bm1x)} ${f(bm1y)}` +
    `L${f(am1x)} ${f(am1y)}` +
    `A${RA} ${RA} 0 1 0 ${f(ap1x)} ${f(ap1y)}Z`
  );
}

/**
 * A smooth, shouldered torso around the shoulder-midpoint → hip-midpoint axis:
 * shoulders that slope UP to the neck base (peak), sides curved inward through a
 * narrower waist, a hip line across the bottom. Aligned to the body axis (so it
 * leans with the torso) and symmetric off the centre line, which keeps it clean
 * on a side-on pose where individual shoulder/hip landmarks get noisy. Wound
 * clockwise to match `taper()` so the union with the limbs stays hole-free.
 */
function torsoPath(
  shx: number, shy: number, hx: number, hy: number,
  shoulderHalf: number, hipHalf: number, peakX: number, peakY: number
): string {
  let ux = hx - shx;
  let uy = hy - shy;
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const nx = -uy; // perpendicular (body left/right)
  const ny = ux;

  const wcx = (shx + hx) / 2;
  const wcy = (shy + hy) / 2;
  const waistHalf = Math.min(shoulderHalf, hipHalf) * 0.78;

  const lsx = shx - nx * shoulderHalf, lsy = shy - ny * shoulderHalf;
  const rsx = shx + nx * shoulderHalf, rsy = shy + ny * shoulderHalf;
  const lhx = hx - nx * hipHalf, lhy = hy - ny * hipHalf;
  const rhx = hx + nx * hipHalf, rhy = hy + ny * hipHalf;
  const lwx = wcx - nx * waistHalf, lwy = wcy - ny * waistHalf;
  const rwx = wcx + nx * waistHalf, rwy = wcy + ny * waistHalf;
  // Shoulder slope control: between each shoulder and the raised neck base, so
  // the top edge sweeps up from the shoulder joint into the neck.
  const lcx = (lsx + peakX) / 2, lcy = (lsy + peakY) / 2;
  const rcx = (rsx + peakX) / 2, rcy = (rsy + peakY) / 2;

  // LS → up to peak → down to RS (sloped shoulders) → curve down right through
  // waist → RH → LH (hips) → curve up left through waist → close.
  return (
    `M${f(lsx)} ${f(lsy)}` +
    `Q${f(lcx)} ${f(lcy)} ${f(peakX)} ${f(peakY)}` +
    `Q${f(rcx)} ${f(rcy)} ${f(rsx)} ${f(rsy)}` +
    `Q${f(rwx)} ${f(rwy)} ${f(rhx)} ${f(rhy)}` +
    `L${f(lhx)} ${f(lhy)}` +
    `Q${f(lwx)} ${f(lwy)} ${f(lsx)} ${f(lsy)}Z`
  );
}

function circle(cx: number, cy: number, r: number): string {
  const R = f(r);
  return `M${f(cx - r)} ${f(cy)}a${R} ${R} 0 1 0 ${f(2 * r)} 0a${R} ${R} 0 1 0 ${f(-2 * r)} 0Z`;
}

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  const RX = f(rx);
  const RY = f(ry);
  return `M${f(cx - rx)} ${f(cy)}a${RX} ${RY} 0 1 0 ${f(2 * rx)} 0a${RX} ${RY} 0 1 0 ${f(-2 * rx)} 0Z`;
}
