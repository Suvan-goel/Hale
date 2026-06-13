/**
 * General side-view synthetic frame builder, shared by the ROM and TUG
 * generators (the chair-stand generator stays specialised on its hip-height
 * IK). Seeded PRNG only — deterministic fixtures and tests.
 *
 * You supply core joints in SAGITTAL coordinates: origin at the ankle,
 * x = forward (the subject faces +x, the camera sees their `nearSide`),
 * y = UP (+). The builder fills all 33 landmarks (duplicating the two body
 * sides with a small near/far separation + near/far visibility) and projects
 * into normalized image space using the SAME placement/scale convention as
 * the chair-stand generator, so calibration and subject-validity behave
 * identically across movements.
 */

import { LANDMARK_COUNT, LANDMARK_STRIDE, LM, RawLandmarkEvent } from '../types';

export type Vec = [number, number];

/** Core sagittal joints (ankle-anchored, y up). Heads/hands/feet are derived. */
export interface SideJoints {
  nose: Vec;
  shoulder: Vec;
  elbow: Vec;
  wrist: Vec;
  hip: Vec;
  knee: Vec;
  ankle: Vec;
}

export interface SideStyle {
  /** Camera distance proxy (body size in frame); 1 ≈ 2.7 m. */
  scale?: number;
  /** Horizontal placement of the ankle in frame (added to 0.5). */
  xOffset?: number;
  /** <1 foreshortens sagittal x (slight camera-angle offset). */
  xCompress?: number;
  /** Uniform landmark jitter amplitude (typical real ≈ 0.004). */
  noiseAmp?: number;
  nearSide?: 'left' | 'right';
  farVisibility?: number;
  nearVisibility?: number;
}

const SIDE_X_SEP = 0.006;
const ANKLE_Y_CENTER = 0.55;
const ANKLE_Y_OFFSET = 0.31;

const LEFT_SIDED = new Set<number>([
  LM.LEFT_EYE_INNER, LM.LEFT_EYE, LM.LEFT_EYE_OUTER, LM.LEFT_EAR, LM.MOUTH_LEFT,
  LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_PINKY, LM.LEFT_INDEX,
  LM.LEFT_THUMB, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL,
  LM.LEFT_FOOT_INDEX,
]);
const RIGHT_SIDED = new Set<number>([
  LM.RIGHT_EYE_INNER, LM.RIGHT_EYE, LM.RIGHT_EYE_OUTER, LM.RIGHT_EAR, LM.MOUTH_RIGHT,
  LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_PINKY, LM.RIGHT_INDEX,
  LM.RIGHT_THUMB, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_HEEL,
  LM.RIGHT_FOOT_INDEX,
]);

/** hip→ankle distance of a standing sagittal pose, used as the body-unit truth. */
export function sideBodyUnit(joints: SideJoints, style: SideStyle): number {
  const s = style.scale ?? 1;
  const xc = style.xCompress ?? 1;
  const dx = (joints.hip[0] - joints.ankle[0]) * xc;
  const dy = joints.hip[1] - joints.ankle[1];
  return Math.hypot(dx, dy) * s;
}

/** Build one side-view frame from core joints. Allocation is fine (tests only). */
export function makeSideFrame(
  timestampMs: number,
  joints: SideJoints,
  rng: () => number,
  style: SideStyle = {}
): RawLandmarkEvent {
  const {
    scale: s = 1,
    xOffset = 0,
    xCompress = 1,
    noiseAmp = 0.004,
    nearSide = 'right',
    farVisibility = 0.35,
    nearVisibility = 0.92,
  } = style;

  const { nose, shoulder, elbow, wrist, hip, knee, ankle } = joints;

  const sagittal = new Array<Vec | null>(LANDMARK_COUNT).fill(null);
  // Head cluster, derived from the nose (a compact side-view head).
  sagittal[LM.NOSE] = nose;
  sagittal[LM.LEFT_EYE_INNER] = [nose[0] - 0.008, nose[1] + 0.008];
  sagittal[LM.LEFT_EYE] = [nose[0] - 0.012, nose[1] + 0.009];
  sagittal[LM.LEFT_EYE_OUTER] = [nose[0] - 0.016, nose[1] + 0.009];
  sagittal[LM.RIGHT_EYE_INNER] = [nose[0] - 0.008, nose[1] + 0.008];
  sagittal[LM.RIGHT_EYE] = [nose[0] - 0.012, nose[1] + 0.009];
  sagittal[LM.RIGHT_EYE_OUTER] = [nose[0] - 0.016, nose[1] + 0.009];
  sagittal[LM.LEFT_EAR] = [nose[0] - 0.03, nose[1] - 0.002];
  sagittal[LM.RIGHT_EAR] = [nose[0] - 0.03, nose[1] - 0.002];
  sagittal[LM.MOUTH_LEFT] = [nose[0] - 0.002, nose[1] - 0.018];
  sagittal[LM.MOUTH_RIGHT] = [nose[0] - 0.006, nose[1] - 0.018];
  sagittal[LM.LEFT_SHOULDER] = shoulder;
  sagittal[LM.RIGHT_SHOULDER] = shoulder;
  sagittal[LM.LEFT_ELBOW] = elbow;
  sagittal[LM.RIGHT_ELBOW] = elbow;
  sagittal[LM.LEFT_WRIST] = wrist;
  sagittal[LM.RIGHT_WRIST] = wrist;
  sagittal[LM.LEFT_PINKY] = [wrist[0] + 0.02, wrist[1] - 0.008];
  sagittal[LM.RIGHT_PINKY] = [wrist[0] + 0.02, wrist[1] - 0.008];
  sagittal[LM.LEFT_INDEX] = [wrist[0] + 0.024, wrist[1] - 0.006];
  sagittal[LM.RIGHT_INDEX] = [wrist[0] + 0.024, wrist[1] - 0.006];
  sagittal[LM.LEFT_THUMB] = [wrist[0] + 0.018, wrist[1] - 0.002];
  sagittal[LM.RIGHT_THUMB] = [wrist[0] + 0.018, wrist[1] - 0.002];
  sagittal[LM.LEFT_HIP] = hip;
  sagittal[LM.RIGHT_HIP] = hip;
  sagittal[LM.LEFT_KNEE] = knee;
  sagittal[LM.RIGHT_KNEE] = knee;
  sagittal[LM.LEFT_ANKLE] = ankle;
  sagittal[LM.RIGHT_ANKLE] = ankle;
  sagittal[LM.LEFT_HEEL] = [ankle[0] - 0.025, ankle[1] - 0.014];
  sagittal[LM.RIGHT_HEEL] = [ankle[0] - 0.025, ankle[1] - 0.014];
  sagittal[LM.LEFT_FOOT_INDEX] = [ankle[0] + 0.05, ankle[1] - 0.018];
  sagittal[LM.RIGHT_FOOT_INDEX] = [ankle[0] + 0.05, ankle[1] - 0.018];

  const ankleX = 0.5 + xOffset;
  const ankleY = ANKLE_Y_CENTER + ANKLE_Y_OFFSET * s;
  const nearIsLeft = nearSide === 'left';

  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const pos = sagittal[i] as Vec;
    const isLeft = LEFT_SIDED.has(i);
    const isRight = RIGHT_SIDED.has(i);
    let sep = 0;
    if (isLeft) sep = nearIsLeft ? SIDE_X_SEP : -SIDE_X_SEP;
    else if (isRight) sep = nearIsLeft ? -SIDE_X_SEP : SIDE_X_SEP;
    // Sagittal x is forward; y is UP, so flip into image space (y grows down).
    const x = ankleX + (pos[0] - ankle[0] + sep) * s * xCompress + (rng() * 2 - 1) * noiseAmp;
    const y = ankleY - (pos[1] - ankle[1]) * s + (rng() * 2 - 1) * noiseAmp;
    let vis = 0.9;
    if (isLeft) vis = nearIsLeft ? nearVisibility : farVisibility;
    else if (isRight) vis = nearIsLeft ? farVisibility : nearVisibility;
    const base = i * LANDMARK_STRIDE;
    landmarks[base] = x;
    landmarks[base + 1] = y;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = vis;
    landmarks[base + 4] = vis;
  }
  return { timestampMs, landmarks };
}
