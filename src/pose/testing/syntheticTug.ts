/**
 * Synthetic side-lateral Timed Up and Go session. Seeded PRNG only.
 *
 * Two driven parameters per frame:
 *   stand  — 0 (seated, knee ≈ 95°) … 1 (standing, knee ≈ 177°)
 *   xOff   — horizontal placement of the whole figure (the walk path), which
 *            moves the hip-x across the frame so the grader can detect the
 *            seat-off, the turn (hip-x velocity reversal), and the re-seat.
 *
 * A small `scale` keeps the figure in frame across the full walk excursion.
 * The standing lead-in calibrates the body unit before the subject sits.
 */

import { RawLandmarkEvent } from '../types';
import { mulberry32 } from './syntheticPose';
import { makeSideFrame, SideJoints, SideStyle, Vec } from './syntheticSideView';

const SEATED: SideJoints = {
  ankle: [0, 0],
  knee: [0.02, 0.17],
  hip: [0.2, 0.2],
  shoulder: [0.17, 0.46],
  elbow: [0.27, 0.3],
  wrist: [0.3, 0.22],
  nose: [0.21, 0.62],
};

const STANDING: SideJoints = {
  ankle: [0, 0],
  knee: [0, 0.17],
  hip: [-0.01, 0.34],
  shoulder: [0, 0.62],
  elbow: [0.02, 0.47],
  wrist: [0.03, 0.34],
  nose: [0.04, 0.78],
};

function lerpVec(a: Vec, b: Vec, t: number): Vec {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function tugJoints(stand: number): SideJoints {
  return {
    ankle: lerpVec(SEATED.ankle, STANDING.ankle, stand),
    knee: lerpVec(SEATED.knee, STANDING.knee, stand),
    hip: lerpVec(SEATED.hip, STANDING.hip, stand),
    shoulder: lerpVec(SEATED.shoulder, STANDING.shoulder, stand),
    elbow: lerpVec(SEATED.elbow, STANDING.elbow, stand),
    wrist: lerpVec(SEATED.wrist, STANDING.wrist, stand),
    nose: lerpVec(SEATED.nose, STANDING.nose, stand),
  };
}

interface TugSegment {
  durMs: number;
  standFrom: number;
  standTo: number;
  xFrom: number;
  xTo: number;
}

export interface TugSessionOptions extends SideStyle {
  seed?: number;
  fps?: number;
  calibrationMs?: number;
  /** Horizontal walk excursion (image units); larger = longer path. */
  walkDistance?: number;
  walkMs?: number;
  turnDwellMs?: number;
  /** Skip the turn + walk-back + re-seat (subject abandons mid-walk). */
  abandonAfterWalkOut?: boolean;
  goneWindows?: { startMs: number; endMs: number }[];
}

export interface TugSyntheticSession {
  frames: RawLandmarkEvent[];
  durationMs: number;
}

export function tugSession(options: TugSessionOptions = {}): TugSyntheticSession {
  const {
    seed = 42,
    fps = 30,
    calibrationMs = 4500,
    walkDistance = 0.4,
    walkMs = 2500,
    turnDwellMs = 800,
    abandonAfterWalkOut = false,
    goneWindows = [],
    scale = 0.6,
    ...rest
  } = options;
  const style: SideStyle = { scale, ...rest };

  const x0 = -walkDistance / 2; // chair at one end, path centred in frame
  const x1 = walkDistance / 2;
  const segments: TugSegment[] = [
    { durMs: calibrationMs, standFrom: 1, standTo: 1, xFrom: x0, xTo: x0 }, // stand still, calibrate
    { durMs: 1500, standFrom: 1, standTo: 0, xFrom: x0, xTo: x0 }, // sit down
    { durMs: 1500, standFrom: 0, standTo: 0, xFrom: x0, xTo: x0 }, // settle seated
    { durMs: 1000, standFrom: 0, standTo: 1, xFrom: x0, xTo: x0 }, // seat-off (clock start)
    { durMs: walkMs, standFrom: 1, standTo: 1, xFrom: x0, xTo: x1 }, // walk out
  ];
  if (!abandonAfterWalkOut) {
    segments.push(
      { durMs: turnDwellMs, standFrom: 1, standTo: 1, xFrom: x1, xTo: x1 }, // turn
      { durMs: walkMs, standFrom: 1, standTo: 1, xFrom: x1, xTo: x0 }, // walk back
      { durMs: 1200, standFrom: 1, standTo: 0, xFrom: x0, xTo: x0 }, // re-seat (complete)
      { durMs: 1500, standFrom: 0, standTo: 0, xFrom: x0, xTo: x0 } // tail
    );
  } else {
    segments.push({ durMs: 2500, standFrom: 1, standTo: 1, xFrom: x1, xTo: x1 }); // stranded
  }

  const totalMs = segments.reduce((a, s) => a + s.durMs, 0);
  const rng = mulberry32(seed);
  const frames: RawLandmarkEvent[] = [];
  const frameMs = 1000 / fps;

  for (let t = 0; t < totalMs; t += frameMs) {
    const ts = Math.round(t);
    if (goneWindows.some((w) => ts >= w.startMs && ts < w.endMs)) {
      frames.push({ timestampMs: ts, landmarks: [] });
      continue;
    }
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
    const stand = active.standFrom + (active.standTo - active.standFrom) * p;
    const xOff = active.xFrom + (active.xTo - active.xFrom) * p;
    frames.push(makeSideFrame(ts, tugJoints(stand), rng, { ...style, xOffset: xOff }));
  }
  return { frames, durationMs: totalMs };
}
