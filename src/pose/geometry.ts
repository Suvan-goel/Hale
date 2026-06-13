/**
 * Pose-space geometry shared by grading code. Pure functions, no allocation —
 * safe on the 30fps frame path.
 *
 * All angles are in degrees (per project convention); distances are in
 * normalized image units until the caller divides by the body-unit scale.
 */

import { LM, PoseFrame } from './types';

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Interior angle at `vertex` between rays vertex→a and vertex→b, in degrees
 * [0..180]. E.g. knee angle = angleAtDeg(frame, HIP, KNEE, ANKLE): ~90° when
 * seated, ~175° at full extension.
 */
export function angleAtDeg(frame: PoseFrame, a: LM, vertex: LM, b: LM): number {
  const v1x = frame.xs[a] - frame.xs[vertex];
  const v1y = frame.ys[a] - frame.ys[vertex];
  const v2x = frame.xs[b] - frame.xs[vertex];
  const v2y = frame.ys[b] - frame.ys[vertex];
  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (len1 === 0 || len2 === 0) return 0;
  let cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
  if (cos > 1) cos = 1;
  else if (cos < -1) cos = -1;
  return Math.acos(cos) * RAD_TO_DEG;
}

/**
 * Distance from landmark `p` to the segment a→b (normalized units). Used for
 * e.g. wrist-to-thigh proximity (hand-push-off detection on chair stands).
 */
export function pointToSegmentDist(frame: PoseFrame, p: LM, a: LM, b: LM): number {
  const px = frame.xs[p];
  const py = frame.ys[p];
  const ax = frame.xs[a];
  const ay = frame.ys[a];
  const bx = frame.xs[b];
  const by = frame.ys[b];
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const dx = px - (ax + t * abx);
  const dy = py - (ay + t * aby);
  return Math.sqrt(dx * dx + dy * dy);
}
