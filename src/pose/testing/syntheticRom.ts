/**
 * Synthetic side-view ROM sessions (shoulder flexion peak, hinge reach) built
 * on the shared side-view frame builder. Seeded PRNG only.
 *
 * Each session is a still standing lead-in (warmup + body-unit calibration),
 * then the movement ramps to a peak, holds, and returns — so the captured peak
 * is known exactly. Shoulder flexion drives the arm angle θ (the graded
 * shoulder angle equals θ by construction); hinge reach drives the trunk fold
 * angle φ, with the arm hanging straight down.
 */

import { RawLandmarkEvent } from '../types';
import { mulberry32 } from './syntheticPose';
import { makeSideFrame, SideJoints, SideStyle, sideBodyUnit, Vec } from './syntheticSideView';

const ANKLE: Vec = [0, 0];
const KNEE: Vec = [0, 0.17];
const HIP: Vec = [-0.01, 0.34];
const SHOULDER: Vec = [0, 0.62];
const NOSE_UP: Vec = [0.04, 0.78];
const UPPER_ARM = 0.15;
const FOREARM = 0.13;
const TRUNK = 0.27;
const ARM_DROP = 0.3; // shoulder → hanging wrist
const HEAD = 0.12;

interface Segment {
  durMs: number;
  from: number;
  to: number;
}

function driveFrames(
  segments: Segment[],
  jointsAt: (value: number) => SideJoints,
  style: SideStyle,
  seed: number,
  fps: number
): { frames: RawLandmarkEvent[]; durationMs: number; peakValue: number } {
  const rng = mulberry32(seed);
  const frames: RawLandmarkEvent[] = [];
  const totalMs = segments.reduce((a, s) => a + s.durMs, 0);
  const frameMs = 1000 / fps;
  let peakValue = segments[0]?.from ?? 0;
  for (let t = 0; t < totalMs; t += frameMs) {
    const ts = Math.round(t);
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
    const value = active.from + (active.to - active.from) * p;
    frames.push(makeSideFrame(ts, jointsAt(value), rng, style));
  }
  return { frames, durationMs: totalMs, peakValue };
}

// ---- Shoulder flexion -----------------------------------------------------

const DEG = Math.PI / 180;

function shoulderJoints(thetaRad: number): SideJoints {
  const ex = SHOULDER[0] + UPPER_ARM * Math.sin(thetaRad);
  const ey = SHOULDER[1] - UPPER_ARM * Math.cos(thetaRad);
  const wx = ex + FOREARM * Math.sin(thetaRad);
  const wy = ey - FOREARM * Math.cos(thetaRad);
  return {
    nose: NOSE_UP,
    shoulder: SHOULDER,
    elbow: [ex, ey],
    wrist: [wx, wy],
    hip: HIP,
    knee: KNEE,
    ankle: ANKLE,
  };
}

export interface ShoulderFlexionSessionOptions extends SideStyle {
  seed?: number;
  fps?: number;
  calibrationMs?: number;
  /** Peak flexion angle reached, degrees. */
  peakDeg?: number;
  riseMs?: number;
  holdMs?: number;
  goneWindows?: { startMs: number; endMs: number }[];
}

export interface ShoulderFlexionSyntheticSession {
  frames: RawLandmarkEvent[];
  truth: { peakDeg: number; bodyUnit: number };
  durationMs: number;
}

export function shoulderFlexionSession(
  options: ShoulderFlexionSessionOptions = {}
): ShoulderFlexionSyntheticSession {
  const {
    seed = 42,
    fps = 30,
    calibrationMs = 4500,
    peakDeg = 165,
    riseMs = 2000,
    holdMs = 3500,
    goneWindows = [],
    ...style
  } = options;
  const restDeg = 8;
  const segments: Segment[] = [
    { durMs: calibrationMs, from: restDeg, to: restDeg },
    { durMs: riseMs, from: restDeg, to: peakDeg },
    { durMs: holdMs, from: peakDeg, to: peakDeg },
    { durMs: 1800, from: peakDeg, to: restDeg },
    { durMs: 1000, from: restDeg, to: restDeg },
  ];
  const built = driveFrames(segments, (deg) => shoulderJoints(deg * DEG), style, seed, fps);
  const frames = applyGone(built.frames, goneWindows);
  return {
    frames,
    truth: { peakDeg, bodyUnit: sideBodyUnit(shoulderJoints(restDeg * DEG), style) },
    durationMs: built.durationMs,
  };
}

// ---- Hinge reach ----------------------------------------------------------

function hingeJoints(phiRad: number): SideJoints {
  const sx = HIP[0] + TRUNK * Math.sin(phiRad);
  const sy = HIP[1] + TRUNK * Math.cos(phiRad);
  return {
    nose: [sx + HEAD * Math.sin(phiRad), sy + HEAD * Math.cos(phiRad)],
    shoulder: [sx, sy],
    elbow: [sx, sy - ARM_DROP * 0.5],
    wrist: [sx, sy - ARM_DROP],
    hip: HIP,
    knee: KNEE,
    ankle: ANKLE,
  };
}

export interface HingeReachSessionOptions extends SideStyle {
  seed?: number;
  fps?: number;
  calibrationMs?: number;
  /** Peak forward-fold angle, degrees from upright. */
  peakFoldDeg?: number;
  foldMs?: number;
  holdMs?: number;
  goneWindows?: { startMs: number; endMs: number }[];
}

export interface HingeReachSyntheticSession {
  frames: RawLandmarkEvent[];
  truth: { bodyUnit: number; peakFoldDeg: number };
  durationMs: number;
}

export function hingeReachSession(
  options: HingeReachSessionOptions = {}
): HingeReachSyntheticSession {
  const {
    seed = 42,
    fps = 30,
    calibrationMs = 4500,
    peakFoldDeg = 85,
    foldMs = 2200,
    holdMs = 3500,
    goneWindows = [],
    ...style
  } = options;
  const segments: Segment[] = [
    { durMs: calibrationMs, from: 0, to: 0 },
    { durMs: foldMs, from: 0, to: peakFoldDeg },
    { durMs: holdMs, from: peakFoldDeg, to: peakFoldDeg },
    { durMs: 2000, from: peakFoldDeg, to: 0 },
    { durMs: 1000, from: 0, to: 0 },
  ];
  const built = driveFrames(segments, (deg) => hingeJoints(deg * DEG), style, seed, fps);
  const frames = applyGone(built.frames, goneWindows);
  return {
    frames,
    truth: { bodyUnit: sideBodyUnit(hingeJoints(0), style), peakFoldDeg },
    durationMs: built.durationMs,
  };
}

function applyGone(
  frames: RawLandmarkEvent[],
  goneWindows: { startMs: number; endMs: number }[]
): RawLandmarkEvent[] {
  if (goneWindows.length === 0) return frames;
  return frames.map((f) =>
    goneWindows.some((w) => f.timestampMs >= w.startMs && f.timestampMs < w.endMs)
      ? { timestampMs: f.timestampMs, landmarks: [] }
      : f
  );
}
