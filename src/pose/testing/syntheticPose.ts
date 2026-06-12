/**
 * Synthetic pose generator for tests and fixtures. Seeded PRNG only — never
 * Math.random() — so every test and generated fixture is deterministic.
 */

import { LANDMARK_COUNT, LANDMARK_STRIDE, LM, RawLandmarkEvent } from '../types';

/** mulberry32 — tiny deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Canonical standing pose, front view, centered. Normalized coordinates,
 * y grows downward. Body height (nose→ankle) ≈ 0.7 of frame;
 * hip→ankle ≈ 0.33 — synthetic ground truth for the body-unit scale.
 */
const STANDING: ReadonlyArray<readonly [number, number]> = (() => {
  const p: [number, number][] = new Array(LANDMARK_COUNT);
  const set = (i: LM, x: number, y: number) => {
    p[i] = [x, y];
  };
  set(LM.NOSE, 0.5, 0.18);
  set(LM.LEFT_EYE_INNER, 0.51, 0.165);
  set(LM.LEFT_EYE, 0.52, 0.165);
  set(LM.LEFT_EYE_OUTER, 0.53, 0.165);
  set(LM.RIGHT_EYE_INNER, 0.49, 0.165);
  set(LM.RIGHT_EYE, 0.48, 0.165);
  set(LM.RIGHT_EYE_OUTER, 0.47, 0.165);
  set(LM.LEFT_EAR, 0.545, 0.175);
  set(LM.RIGHT_EAR, 0.455, 0.175);
  set(LM.MOUTH_LEFT, 0.515, 0.20);
  set(LM.MOUTH_RIGHT, 0.485, 0.20);
  set(LM.LEFT_SHOULDER, 0.57, 0.30);
  set(LM.RIGHT_SHOULDER, 0.43, 0.30);
  set(LM.LEFT_ELBOW, 0.60, 0.42);
  set(LM.RIGHT_ELBOW, 0.40, 0.42);
  set(LM.LEFT_WRIST, 0.61, 0.52);
  set(LM.RIGHT_WRIST, 0.39, 0.52);
  set(LM.LEFT_PINKY, 0.615, 0.545);
  set(LM.RIGHT_PINKY, 0.385, 0.545);
  set(LM.LEFT_INDEX, 0.618, 0.548);
  set(LM.RIGHT_INDEX, 0.382, 0.548);
  set(LM.LEFT_THUMB, 0.61, 0.54);
  set(LM.RIGHT_THUMB, 0.39, 0.54);
  set(LM.LEFT_HIP, 0.545, 0.55);
  set(LM.RIGHT_HIP, 0.455, 0.55);
  set(LM.LEFT_KNEE, 0.55, 0.72);
  set(LM.RIGHT_KNEE, 0.45, 0.72);
  set(LM.LEFT_ANKLE, 0.55, 0.88);
  set(LM.RIGHT_ANKLE, 0.45, 0.88);
  set(LM.LEFT_HEEL, 0.555, 0.895);
  set(LM.RIGHT_HEEL, 0.445, 0.895);
  set(LM.LEFT_FOOT_INDEX, 0.565, 0.905);
  set(LM.RIGHT_FOOT_INDEX, 0.435, 0.905);
  return p;
})();

/** Ground-truth hip→ankle distance of the canonical pose at scale 1. */
export const SYNTHETIC_HIP_ANKLE = Math.hypot(0.55 - 0.545, 0.88 - 0.55);

export interface SyntheticFrameOptions {
  /** No pose detected at all (subject fully out of frame). */
  present?: boolean;
  /** Uniform jitter amplitude in normalized units (typical real: ~0.004). */
  noiseAmp?: number;
  /** Horizontal shift of the whole body. */
  xOffset?: number;
  /** Vertical shift of the whole body. */
  yOffset?: number;
  /** Scale around body center (camera distance proxy). */
  scale?: number;
  /** Visibility for left-side landmarks (side-view far-limb simulation). */
  leftVisibility?: number;
  /** Visibility for right-side landmarks. */
  rightVisibility?: number;
  /** Visibility for midline landmarks (default 0.95). */
  baseVisibility?: number;
}

const LEFT_LANDMARKS = new Set<number>([
  LM.LEFT_EYE_INNER, LM.LEFT_EYE, LM.LEFT_EYE_OUTER, LM.LEFT_EAR, LM.MOUTH_LEFT,
  LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_PINKY, LM.LEFT_INDEX,
  LM.LEFT_THUMB, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL,
  LM.LEFT_FOOT_INDEX,
]);
const RIGHT_LANDMARKS = new Set<number>([
  LM.RIGHT_EYE_INNER, LM.RIGHT_EYE, LM.RIGHT_EYE_OUTER, LM.RIGHT_EAR, LM.MOUTH_RIGHT,
  LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_PINKY, LM.RIGHT_INDEX,
  LM.RIGHT_THUMB, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_HEEL,
  LM.RIGHT_FOOT_INDEX,
]);

export function makeFrame(
  timestampMs: number,
  rng: () => number,
  options: SyntheticFrameOptions = {}
): RawLandmarkEvent {
  const {
    present = true,
    noiseAmp = 0.004,
    xOffset = 0,
    yOffset = 0,
    scale = 1,
    leftVisibility = 0.95,
    rightVisibility = 0.95,
    baseVisibility = 0.95,
  } = options;

  if (!present) {
    return { timestampMs, landmarks: [] };
  }

  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const [bx, by] = STANDING[i];
    const x = 0.5 + (bx - 0.5) * scale + xOffset + (rng() * 2 - 1) * noiseAmp;
    const y = 0.55 + (by - 0.55) * scale + yOffset + (rng() * 2 - 1) * noiseAmp;
    let vis = baseVisibility;
    if (LEFT_LANDMARKS.has(i)) vis = leftVisibility;
    else if (RIGHT_LANDMARKS.has(i)) vis = rightVisibility;
    const base = i * LANDMARK_STRIDE;
    landmarks[base] = x;
    landmarks[base + 1] = y;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = vis;
    landmarks[base + 4] = vis;
  }
  return { timestampMs, landmarks };
}

/** Frame timestamps at exactly 30fps starting from startMs. */
export function timestamps30fps(startMs: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(startMs + Math.round((i * 1000) / 30));
  return out;
}
