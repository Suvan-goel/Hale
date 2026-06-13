/**
 * Synthetic side-view chair-stand session generator — the ground-truth source
 * for grading tests and the noise-floor dry run. Seeded PRNG only.
 *
 * The figure is a sagittal-plane stick model anchored at the ankle. Hip
 * HEIGHT above the ankle is the driven parameter and rises LINEARLY in time
 * during each rep, so true hip vertical velocity is piecewise-constant and
 * known exactly — the "known-velocity synthetic ramp" the acceptance tests
 * assert against. Knee angle follows from two-link IK (equal shank/thigh
 * lengths), giving ~88° seated → ~175° standing, matching what the grader
 * measures from landmarks.
 *
 * Camera-setup knobs mirror the noise-floor experiment variables:
 *   scale     — camera distance proxy (body size in frame)
 *   xOffset   — placement in frame
 *   xCompress — slight camera angle offset (foreshortens sagittal x)
 *   noiseAmp  — landmark jitter
 */

import { LANDMARK_COUNT, LANDMARK_STRIDE, LM, RawLandmarkEvent } from '../types';
import { mulberry32 } from './syntheticPose';

// Scale-1 body constants (normalized units).
const SHANK = 0.17;
const LEG_FULL = 2 * SHANK; // hip-ankle distance at a perfectly straight knee
/** Hip height above ankle, standing (knee ≈ 175°). */
export const HY_STAND = 0.3395;
/** Hip height above ankle, seated (knee ≈ 88°). */
export const HY_SEAT = 0.222;
const HX_STAND = -0.01; // hip trails the ankle slightly when standing
const HX_SEAT = -0.08; // and clearly when seated (feet ahead of the chair)
const TRUNK = 0.27;
const LEAN_SEAT_RAD = (14 * Math.PI) / 180;
const LEAN_STAND_RAD = (4 * Math.PI) / 180;
const ANKLE_Y_CENTER = 0.55; // scaling pivot, matches syntheticPose convention
const ANKLE_Y_OFFSET = 0.31; // ankle sits at 0.86 at scale 1
const SIDE_X_SEP = 0.006; // near/far landmark separation in a side view

export interface ChairStandSegment {
  durMs: number;
  hyFrom: number;
  hyTo: number;
  /** Hands ride the thighs (push-off) instead of staying crossed. */
  pushOff: boolean;
}

export interface ChairStandSessionOptions {
  seed?: number;
  /** Camera distance proxy: 1 ≈ 2.7 m, 0.85 far (~3.2 m), 1.15 near (~2.2 m). */
  scale?: number;
  /** Horizontal placement of the subject in frame. */
  xOffset?: number;
  /** <1 simulates a slight camera angle offset (sagittal x foreshortening). */
  xCompress?: number;
  /** Uniform landmark jitter amplitude (typical real ≈ 0.004). */
  noiseAmp?: number;
  /** Which side of the body faces the camera. */
  nearSide?: 'left' | 'right';
  fps?: number;
  /** Standing lead-in: warmup (~1.7s) + calibration (~1.5s) + slack. */
  calibrationMs?: number;
  /** Rise duration per rep — one entry per rep, drives ground-truth velocity. */
  riseMsPerRep?: number[];
  /** Rep indices (0-based) performed with hands pushing on the thighs. */
  pushOffReps?: number[];
  /** Partial rises inserted after the given rep: rises only `fraction` of the
   * way up, holds, sits back — must never count. */
  partials?: { afterRep: number; fraction: number; riseMs?: number }[];
  /** Subject fully out of frame during these windows (empty landmark arrays). */
  goneWindows?: { startMs: number; endMs: number }[];
  sitMs?: number;
  settleMs?: number;
  topMs?: number;
  descendMs?: number;
  restMs?: number;
  tailMs?: number;
  /** Far-side landmark visibility (occluded limb). */
  farVisibility?: number;
  nearVisibility?: number;
}

export interface ChairStandGroundTruth {
  /** Exact (noise-free) hip→ankle landmark distance while standing. */
  bodyUnit: number;
  /** Full seat→stand hip rise, in body units. */
  riseDisplacementBu: number;
  /** True (constant) hip vertical velocity of each rep's rise, bu/s. */
  repTrueMeanVelBu: number[];
  expectedReps: number;
  /** Total session length. */
  durationMs: number;
}

export interface ChairStandSession {
  frames: RawLandmarkEvent[];
  truth: ChairStandGroundTruth;
  segments: ChairStandSegment[];
}

export function chairStandSession(options: ChairStandSessionOptions = {}): ChairStandSession {
  const {
    seed = 42,
    scale = 1,
    xOffset = 0,
    xCompress = 1,
    noiseAmp = 0.004,
    nearSide = 'right',
    fps = 30,
    calibrationMs = 4500,
    riseMsPerRep = [1200, 1200, 1200, 1200, 1200],
    pushOffReps = [],
    partials = [],
    goneWindows = [],
    sitMs = 1200,
    settleMs = 1000,
    topMs = 600,
    descendMs = 1100,
    restMs = 700,
    tailMs = 1000,
    farVisibility = 0.35,
    nearVisibility = 0.92,
  } = options;

  const segments: ChairStandSegment[] = [];
  const seg = (durMs: number, hyFrom: number, hyTo: number, pushOff = false) =>
    segments.push({ durMs, hyFrom, hyTo, pushOff });

  seg(calibrationMs, HY_STAND, HY_STAND);
  seg(sitMs, HY_STAND, HY_SEAT);
  seg(settleMs, HY_SEAT, HY_SEAT);
  for (let rep = 0; rep < riseMsPerRep.length; rep++) {
    seg(riseMsPerRep[rep], HY_SEAT, HY_STAND, pushOffReps.includes(rep));
    seg(topMs, HY_STAND, HY_STAND);
    seg(descendMs, HY_STAND, HY_SEAT);
    seg(restMs, HY_SEAT, HY_SEAT);
    for (const partial of partials) {
      if (partial.afterRep === rep) {
        const partialTop = HY_SEAT + partial.fraction * (HY_STAND - HY_SEAT);
        const partialRise = partial.riseMs ?? 900;
        seg(partialRise, HY_SEAT, partialTop);
        seg(400, partialTop, partialTop);
        seg(partialRise, partialTop, HY_SEAT);
        seg(restMs, HY_SEAT, HY_SEAT);
      }
    }
  }
  seg(tailMs, HY_SEAT, HY_SEAT);

  const totalMs = segments.reduce((sum, s) => sum + s.durMs, 0);
  const rng = mulberry32(seed);
  const frames: RawLandmarkEvent[] = [];
  const frameIntervalMs = 1000 / fps;

  for (let t = 0; t < totalMs; t += frameIntervalMs) {
    const ts = Math.round(t);
    if (goneWindows.some((w) => ts >= w.startMs && ts < w.endMs)) {
      frames.push({ timestampMs: ts, landmarks: [] });
      continue;
    }
    // Locate the active segment.
    let segStart = 0;
    let active = segments[segments.length - 1];
    for (const s of segments) {
      if (t < segStart + s.durMs) {
        active = s;
        break;
      }
      segStart += s.durMs;
    }
    const p = active.durMs > 0 ? (t - segStart) / active.durMs : 1;
    const hy = active.hyFrom + (active.hyTo - active.hyFrom) * p;
    frames.push(
      makeChairStandFrame(ts, hy, active.pushOff, rng, {
        scale,
        xOffset,
        xCompress,
        noiseAmp,
        nearSide,
        farVisibility,
        nearVisibility,
      })
    );
  }

  const bodyUnit = Math.hypot(HX_STAND * xCompress, HY_STAND) * scale;
  const riseDisplacementBu = ((HY_STAND - HY_SEAT) * scale) / bodyUnit;
  return {
    frames,
    segments,
    truth: {
      bodyUnit,
      riseDisplacementBu,
      repTrueMeanVelBu: riseMsPerRep.map((ms) => riseDisplacementBu / (ms / 1000)),
      expectedReps: riseMsPerRep.length,
      durationMs: totalMs,
    },
  };
}

interface FrameStyle {
  scale: number;
  xOffset: number;
  xCompress: number;
  noiseAmp: number;
  nearSide: 'left' | 'right';
  farVisibility: number;
  nearVisibility: number;
}

/**
 * Builds one side-view frame for hip height `hy` (scale-1 units above the
 * ankle). The subject faces +x; the camera sees their `nearSide`.
 */
export function makeChairStandFrame(
  timestampMs: number,
  hy: number,
  pushOff: boolean,
  rng: () => number,
  style: FrameStyle
): RawLandmarkEvent {
  const { scale: s, xOffset, xCompress, noiseAmp, nearSide, farVisibility, nearVisibility } = style;

  const progress = clamp01((hy - HY_SEAT) / (HY_STAND - HY_SEAT));
  const hx = lerp(HX_SEAT, HX_STAND, progress);

  // Sagittal-plane positions relative to the ankle; x forward (+), y DOWN (+).
  const hip: Vec = [hx * s, -hy * s];
  const d = Math.hypot(hip[0], hip[1]);
  // Two-link IK: knee sits at the triangle apex, forward of the ankle→hip line.
  const halfD = Math.min(d / 2, SHANK * s * 0.99999);
  const apex = Math.sqrt(SHANK * s * (SHANK * s) - halfD * halfD);
  const ux = hip[0] / d;
  const uy = hip[1] / d;
  const knee: Vec = [hip[0] / 2 + -uy * apex, hip[1] / 2 + ux * apex];

  const lean = lerp(LEAN_SEAT_RAD, LEAN_STAND_RAD, progress);
  const shoulder: Vec = [hip[0] + Math.sin(lean) * TRUNK * s, hip[1] - Math.cos(lean) * TRUNK * s];
  const nose: Vec = [shoulder[0] + 0.055 * s, shoulder[1] - 0.085 * s];

  let wrist: Vec;
  let elbow: Vec;
  if (pushOff) {
    // Hand rides the thigh: wrist on the hip→knee segment.
    wrist = [lerp(hip[0], knee[0], 0.55), lerp(hip[1], knee[1], 0.55) - 0.012 * s];
    elbow = [(shoulder[0] + wrist[0]) / 2, (shoulder[1] + wrist[1]) / 2];
  } else {
    // Arms crossed over the chest (Rikli & Jones protocol).
    elbow = [shoulder[0] + 0.05 * s, shoulder[1] + 0.11 * s];
    wrist = [shoulder[0] + 0.09 * s, shoulder[1] + 0.06 * s];
  }

  const ankle: Vec = [0, 0];
  const heel: Vec = [-0.025 * s, 0.014 * s];
  const foot: Vec = [0.05 * s, 0.018 * s];

  // Sagittal landmark layout shared by both body sides.
  const sagittal = new Array<Vec | null>(LANDMARK_COUNT).fill(null);
  sagittal[LM.NOSE] = nose;
  sagittal[LM.LEFT_EYE_INNER] = [nose[0] - 0.008 * s, nose[1] - 0.008 * s];
  sagittal[LM.LEFT_EYE] = [nose[0] - 0.012 * s, nose[1] - 0.009 * s];
  sagittal[LM.LEFT_EYE_OUTER] = [nose[0] - 0.016 * s, nose[1] - 0.009 * s];
  sagittal[LM.RIGHT_EYE_INNER] = [nose[0] - 0.008 * s, nose[1] - 0.008 * s];
  sagittal[LM.RIGHT_EYE] = [nose[0] - 0.012 * s, nose[1] - 0.009 * s];
  sagittal[LM.RIGHT_EYE_OUTER] = [nose[0] - 0.016 * s, nose[1] - 0.009 * s];
  sagittal[LM.LEFT_EAR] = [nose[0] - 0.03 * s, nose[1] + 0.002 * s];
  sagittal[LM.RIGHT_EAR] = [nose[0] - 0.03 * s, nose[1] + 0.002 * s];
  sagittal[LM.MOUTH_LEFT] = [nose[0] - 0.002 * s, nose[1] + 0.018 * s];
  sagittal[LM.MOUTH_RIGHT] = [nose[0] - 0.006 * s, nose[1] + 0.018 * s];
  sagittal[LM.LEFT_SHOULDER] = shoulder;
  sagittal[LM.RIGHT_SHOULDER] = shoulder;
  sagittal[LM.LEFT_ELBOW] = elbow;
  sagittal[LM.RIGHT_ELBOW] = elbow;
  sagittal[LM.LEFT_WRIST] = wrist;
  sagittal[LM.RIGHT_WRIST] = wrist;
  sagittal[LM.LEFT_PINKY] = [wrist[0] + 0.02 * s, wrist[1] + 0.008 * s];
  sagittal[LM.RIGHT_PINKY] = [wrist[0] + 0.02 * s, wrist[1] + 0.008 * s];
  sagittal[LM.LEFT_INDEX] = [wrist[0] + 0.024 * s, wrist[1] + 0.006 * s];
  sagittal[LM.RIGHT_INDEX] = [wrist[0] + 0.024 * s, wrist[1] + 0.006 * s];
  sagittal[LM.LEFT_THUMB] = [wrist[0] + 0.018 * s, wrist[1] + 0.002 * s];
  sagittal[LM.RIGHT_THUMB] = [wrist[0] + 0.018 * s, wrist[1] + 0.002 * s];
  sagittal[LM.LEFT_HIP] = hip;
  sagittal[LM.RIGHT_HIP] = hip;
  sagittal[LM.LEFT_KNEE] = knee;
  sagittal[LM.RIGHT_KNEE] = knee;
  sagittal[LM.LEFT_ANKLE] = ankle;
  sagittal[LM.RIGHT_ANKLE] = ankle;
  sagittal[LM.LEFT_HEEL] = heel;
  sagittal[LM.RIGHT_HEEL] = heel;
  sagittal[LM.LEFT_FOOT_INDEX] = foot;
  sagittal[LM.RIGHT_FOOT_INDEX] = foot;

  const ankleX = 0.5 + xOffset;
  const ankleY = ANKLE_Y_CENTER + ANKLE_Y_OFFSET * s;
  const nearIsLeft = nearSide === 'left';

  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const pos = sagittal[i] as Vec;
    const isLeft = LEFT_SIDED.has(i);
    const isRight = RIGHT_SIDED.has(i);
    // Near-side landmarks sit a hair toward the camera (+sep), far side away.
    let sep = 0;
    if (isLeft) sep = nearIsLeft ? SIDE_X_SEP : -SIDE_X_SEP;
    else if (isRight) sep = nearIsLeft ? -SIDE_X_SEP : SIDE_X_SEP;
    const x = ankleX + (pos[0] + sep * s) * xCompress + (rng() * 2 - 1) * noiseAmp;
    const y = ankleY + pos[1] + (rng() * 2 - 1) * noiseAmp;
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

type Vec = [number, number];

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
