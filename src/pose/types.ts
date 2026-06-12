/**
 * Core pose types. Pure TS — no React, no Expo imports. The same code runs
 * on-device and in the headless replay harness, which is what makes
 * record/replay deterministic.
 *
 * Coordinate convention: x/y normalized [0..1] in upright portrait image
 * space, y grows downward, unmirrored. Distances derived from these are in
 * "normalized units" until divided by the body-unit scale (see calibration).
 */

export const LANDMARK_COUNT = 33;
export const LANDMARK_STRIDE = 5; // x, y, z, visibility, presence

/** MediaPipe PoseLandmarker landmark indices. */
export enum LM {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

/**
 * Struct-of-arrays pose frame. Preallocated once and mutated in place on the
 * hot path — never allocate one of these per frame.
 */
export interface PoseFrame {
  timestampMs: number;
  hasPose: boolean;
  xs: Float64Array;
  ys: Float64Array;
  zs: Float64Array;
  visibility: Float64Array;
  presence: Float64Array;
}

export function createPoseFrame(): PoseFrame {
  return {
    timestampMs: 0,
    hasPose: false,
    xs: new Float64Array(LANDMARK_COUNT),
    ys: new Float64Array(LANDMARK_COUNT),
    zs: new Float64Array(LANDMARK_COUNT),
    visibility: new Float64Array(LANDMARK_COUNT),
    presence: new Float64Array(LANDMARK_COUNT),
  };
}

export function copyPoseFrame(src: PoseFrame, dst: PoseFrame): void {
  dst.timestampMs = src.timestampMs;
  dst.hasPose = src.hasPose;
  dst.xs.set(src.xs);
  dst.ys.set(src.ys);
  dst.zs.set(src.zs);
  dst.visibility.set(src.visibility);
  dst.presence.set(src.presence);
}

/** Shape of the native onLandmarks payload (and of recorded JSONL frames). */
export interface RawLandmarkEvent {
  timestampMs: number;
  /** Flat [x, y, z, visibility, presence] * 33, or empty when no pose. */
  landmarks: ArrayLike<number>;
}

/** Parses a raw native event into a preallocated frame. Allocation-free. */
export function parseLandmarkEvent(event: RawLandmarkEvent, out: PoseFrame): void {
  out.timestampMs = event.timestampMs;
  const lm = event.landmarks;
  if (lm.length < LANDMARK_COUNT * LANDMARK_STRIDE) {
    out.hasPose = false;
    return;
  }
  out.hasPose = true;
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const base = i * LANDMARK_STRIDE;
    out.xs[i] = lm[base];
    out.ys[i] = lm[base + 1];
    out.zs[i] = lm[base + 2];
    out.visibility[i] = lm[base + 3];
    out.presence[i] = lm[base + 4];
  }
}

export function dist(frame: PoseFrame, a: LM, b: LM): number {
  const dx = frame.xs[a] - frame.xs[b];
  const dy = frame.ys[a] - frame.ys[b];
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpointX(frame: PoseFrame, a: LM, b: LM): number {
  return (frame.xs[a] + frame.xs[b]) * 0.5;
}

export function midpointY(frame: PoseFrame, a: LM, b: LM): number {
  return (frame.ys[a] + frame.ys[b]) * 0.5;
}
