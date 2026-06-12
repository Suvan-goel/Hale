/**
 * Subject validity: is this skeleton a plausible, present human — or
 * furniture/wall art that MediaPipe hallucinated a pose onto? (Hard-won
 * lesson: without this gate, a coat rack becomes the subject.)
 *
 * Checks are orientation-agnostic on purpose: a hinge reach puts the head
 * below the hips, so "head above hips" style checks would break real
 * movements. We check dispersion, size in frame, and segment proportions.
 */

import { LM, midpointX, midpointY, PoseFrame } from './types';

export type ValidityReason =
  | 'ok'
  | 'no-pose'
  | 'too-few-visible'
  | 'too-small'
  | 'implausible-proportions';

export interface ValidityResult {
  valid: boolean;
  reason: ValidityReason;
}

export interface ValidityConfig {
  /** Core landmarks that must be at least weakly present. */
  minVisibleCoreLandmarks: number;
  coreVisibilityFloor: number;
  /** Bounding-box diagonal of core landmarks, in normalized units. */
  minBboxDiagonal: number;
  /** torso/leg length ratio plausibility band (human ≈ 0.6–1.0). */
  minTorsoLegRatio: number;
  maxTorsoLegRatio: number;
  /** Shoulder-mid to hip-mid must not collapse to a point. */
  minTorsoLength: number;
}

export const DEFAULT_VALIDITY_CONFIG: ValidityConfig = {
  // 4, not more: a side-on subject only has its near-side core landmarks
  // (shoulder/hip/knee/ankle) visible, and side views must stay valid.
  minVisibleCoreLandmarks: 4,
  coreVisibilityFloor: 0.3,
  minBboxDiagonal: 0.18,
  minTorsoLegRatio: 0.3,
  maxTorsoLegRatio: 2.0,
  minTorsoLength: 0.05,
};

/** Torso + legs: the landmarks that define "a body is here". */
const CORE_LANDMARKS: readonly LM[] = [
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
];

/**
 * Mutates and returns `out` — allocation-free on the hot path when the
 * caller passes a reusable result object.
 */
export function checkSubjectValidity(
  frame: PoseFrame,
  out: ValidityResult,
  config: ValidityConfig = DEFAULT_VALIDITY_CONFIG
): ValidityResult {
  if (!frame.hasPose) {
    out.valid = false;
    out.reason = 'no-pose';
    return out;
  }

  let visibleCount = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < CORE_LANDMARKS.length; i++) {
    const idx = CORE_LANDMARKS[i];
    if (frame.visibility[idx] >= config.coreVisibilityFloor) visibleCount++;
    const x = frame.xs[idx];
    const y = frame.ys[idx];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (visibleCount < config.minVisibleCoreLandmarks) {
    out.valid = false;
    out.reason = 'too-few-visible';
    return out;
  }

  const dx = maxX - minX;
  const dy = maxY - minY;
  const diagonal = Math.sqrt(dx * dx + dy * dy);
  if (diagonal < config.minBboxDiagonal) {
    out.valid = false;
    out.reason = 'too-small';
    return out;
  }

  // Proportions: shoulder-mid→hip-mid vs hip-mid→ankle-mid.
  const torsoDx = midpointX(frame, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER) -
    midpointX(frame, LM.LEFT_HIP, LM.RIGHT_HIP);
  const torsoDy = midpointY(frame, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER) -
    midpointY(frame, LM.LEFT_HIP, LM.RIGHT_HIP);
  const torsoLen = Math.sqrt(torsoDx * torsoDx + torsoDy * torsoDy);

  const legDx = midpointX(frame, LM.LEFT_HIP, LM.RIGHT_HIP) -
    midpointX(frame, LM.LEFT_ANKLE, LM.RIGHT_ANKLE);
  const legDy = midpointY(frame, LM.LEFT_HIP, LM.RIGHT_HIP) -
    midpointY(frame, LM.LEFT_ANKLE, LM.RIGHT_ANKLE);
  const legLen = Math.sqrt(legDx * legDx + legDy * legDy);

  if (torsoLen < config.minTorsoLength || legLen <= 0) {
    out.valid = false;
    out.reason = 'implausible-proportions';
    return out;
  }
  const ratio = torsoLen / legLen;
  if (ratio < config.minTorsoLegRatio || ratio > config.maxTorsoLegRatio) {
    out.valid = false;
    out.reason = 'implausible-proportions';
    return out;
  }

  out.valid = true;
  out.reason = 'ok';
  return out;
}
