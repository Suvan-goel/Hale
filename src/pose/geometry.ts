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
 * Interior angle at `vertex` in PHYSICAL degrees: x-deltas are scaled by the
 * frame aspect so both axes share the same units before the angle is taken.
 * Use for angles that are REPORTED or compared against published norms
 * (shoulder flexion peak). Threshold-trigger angles tuned in raw normalized
 * space (rep-cycle knee angle, setup-pose gates) keep using angleAtDeg —
 * their constants were tuned in that space and are self-consistent.
 */
export function aspectCorrectedAngleAtDeg(frame: PoseFrame, a: LM, vertex: LM, b: LM): number {
  const s = frame.aspect;
  const v1x = (frame.xs[a] - frame.xs[vertex]) * s;
  const v1y = frame.ys[a] - frame.ys[vertex];
  const v2x = (frame.xs[b] - frame.xs[vertex]) * s;
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
 * Distance between two landmarks in height-normalized units (x-deltas scaled
 * by the frame aspect). Use where a physically true length matters — the
 * body-unit calibration measures anatomical leg length with this.
 */
export function aspectCorrectedDist(frame: PoseFrame, a: LM, b: LM): number {
  const dx = (frame.xs[a] - frame.xs[b]) * frame.aspect;
  const dy = frame.ys[a] - frame.ys[b];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Estimated head yaw, degrees, signed: 0 facing the camera, positive turning
 * toward the subject's right. 2D pose can't see transverse rotation EXCEPT head
 * yaw, which the nose/ear geometry betrays (CLAUDE.md): facing forward the nose
 * sits centred between the ears; turning brings it toward the leading ear. We
 * report the nose's offset from the ear midpoint as a fraction of ear
 * separation (~±0.5 at a near-full turn) scaled to ~±90°. A rough proxy — only
 * the peak magnitude is graded (neck-rotation ROM), never a precise angle.
 */
export function headYawDeg(frame: PoseFrame): number {
  const earSep = Math.abs(frame.xs[LM.LEFT_EAR] - frame.xs[LM.RIGHT_EAR]);
  if (earSep === 0) return 0;
  const earMidX = (frame.xs[LM.LEFT_EAR] + frame.xs[LM.RIGHT_EAR]) * 0.5;
  const ratio = (frame.xs[LM.NOSE] - earMidX) / earSep;
  return ratio * 180;
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
