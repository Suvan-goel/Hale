/**
 * Synthetic front-view balance session generator. Seeded PRNG only.
 *
 * Front-view 2D pose cannot see foot depth, so it cannot tell semi-tandem from
 * tandem — and the grader does not pretend to. What it CAN measure, and what
 * this generator drives, is: a single-leg foot lift and its touchdown (ankle
 * vertical separation), a recovery step out of a narrow base (ankle horizontal
 * separation), and pelvis sway (hip-midpoint x). Each stage occupies a fixed
 * time block (the voice script delimits stages), so the generator and grader
 * follow the SAME schedule and stay in lockstep without coupling.
 */

import { BALANCE_GET_READY_MS, BalanceStance } from '../../movements/balanceLadder';
import { LANDMARK_COUNT, LANDMARK_STRIDE, LM, RawLandmarkEvent } from '../types';
import { mulberry32 } from './syntheticPose';

export type BalanceOutcome = 'completed' | 'fail' | 'not-attempted';

export interface BalanceStageSpec {
  stance: BalanceStance;
  windowMs: number;
  outcome: BalanceOutcome;
  /** ms into the hold window when the stance breaks (outcome 'fail'). */
  failAtMs?: number;
}

export interface BalanceSessionOptions {
  seed?: number;
  scale?: number;
  xOffset?: number;
  noiseAmp?: number;
  /** Peak pelvis sway amplitude (image units) during holds. */
  swayAmp?: number;
  calibrationMs?: number;
  stages?: BalanceStageSpec[];
  goneWindows?: { startMs: number; endMs: number }[];
  fps?: number;
  tailMs?: number;
}

export interface BalanceSession {
  frames: RawLandmarkEvent[];
  durationMs: number;
}

// Front-view base pose (x, y), y grows downward. Arms hang at the sides.
const BASE: Array<[number, number]> = (() => {
  const p: [number, number][] = new Array(LANDMARK_COUNT);
  const set = (i: LM, x: number, y: number) => { p[i] = [x, y]; };
  set(LM.NOSE, 0.5, 0.18);
  set(LM.LEFT_EYE_INNER, 0.51, 0.165); set(LM.LEFT_EYE, 0.52, 0.165); set(LM.LEFT_EYE_OUTER, 0.53, 0.165);
  set(LM.RIGHT_EYE_INNER, 0.49, 0.165); set(LM.RIGHT_EYE, 0.48, 0.165); set(LM.RIGHT_EYE_OUTER, 0.47, 0.165);
  set(LM.LEFT_EAR, 0.545, 0.175); set(LM.RIGHT_EAR, 0.455, 0.175);
  set(LM.MOUTH_LEFT, 0.515, 0.20); set(LM.MOUTH_RIGHT, 0.485, 0.20);
  set(LM.LEFT_SHOULDER, 0.57, 0.30); set(LM.RIGHT_SHOULDER, 0.43, 0.30);
  set(LM.LEFT_ELBOW, 0.585, 0.42); set(LM.RIGHT_ELBOW, 0.415, 0.42);
  set(LM.LEFT_WRIST, 0.59, 0.53); set(LM.RIGHT_WRIST, 0.41, 0.53);
  set(LM.LEFT_PINKY, 0.593, 0.555); set(LM.RIGHT_PINKY, 0.407, 0.555);
  set(LM.LEFT_INDEX, 0.595, 0.557); set(LM.RIGHT_INDEX, 0.405, 0.557);
  set(LM.LEFT_THUMB, 0.588, 0.55); set(LM.RIGHT_THUMB, 0.412, 0.55);
  set(LM.LEFT_HIP, 0.545, 0.55); set(LM.RIGHT_HIP, 0.455, 0.55);
  set(LM.LEFT_KNEE, 0.54, 0.72); set(LM.RIGHT_KNEE, 0.46, 0.72);
  set(LM.LEFT_ANKLE, 0.54, 0.88); set(LM.RIGHT_ANKLE, 0.46, 0.88);
  set(LM.LEFT_HEEL, 0.538, 0.895); set(LM.RIGHT_HEEL, 0.462, 0.895);
  set(LM.LEFT_FOOT_INDEX, 0.552, 0.905); set(LM.RIGHT_FOOT_INDEX, 0.448, 0.905);
  return p;
})();

const LEFT_LEG = [LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX];
const RIGHT_LEG = [LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX];

interface FrameShape {
  /** Pull both feet toward the centreline (narrow base). 0 = base, 1 = together. */
  narrow: number;
  /** Split feet wide (a recovery step). 0 = none, 1 = wide. */
  stepWide: number;
  /** Lift the right foot (single-leg). 0 = down, 1 = fully raised. */
  rightLift: number;
  swayX: number;
}

function makeBalanceFrame(
  ts: number,
  shape: FrameShape,
  rng: () => number,
  scale: number,
  xOffset: number,
  noiseAmp: number
): RawLandmarkEvent {
  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE);
  const liftAmt = 0.18 * shape.rightLift; // image units the right foot rises
  const narrowPull = 0.05 * shape.narrow; // toward centre
  const widePush = 0.16 * shape.stepWide; // away from centre

  for (let i = 0; i < LANDMARK_COUNT; i++) {
    let [bx, by] = BASE[i];
    // Narrow base pulls both feet toward the centreline; a recovery step
    // pushes them apart.
    if (LEFT_LEG.includes(i) || RIGHT_LEG.includes(i)) {
      const dirToCenter = bx < 0.5 ? 1 : -1; // toward x = 0.5
      bx += dirToCenter * (narrowPull - widePush);
    }
    // Right-foot lift raises the whole right lower limb.
    if (RIGHT_LEG.includes(i)) by -= liftAmt;
    // Scale about body centre (camera distance), place, sway, jitter.
    const x = 0.5 + (bx - 0.5) * scale + xOffset + shape.swayX + (rng() * 2 - 1) * noiseAmp;
    const y = 0.55 + (by - 0.55) * scale + (rng() * 2 - 1) * noiseAmp;
    const base = i * LANDMARK_STRIDE;
    landmarks[base] = x;
    landmarks[base + 1] = y;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = 0.95;
    landmarks[base + 4] = 0.95;
  }
  return { timestampMs: ts, landmarks };
}

const DEFAULT_STAGES: BalanceStageSpec[] = [
  { stance: 'feet-together', windowMs: 10000, outcome: 'completed' },
  { stance: 'tandem', windowMs: 10000, outcome: 'completed' },
  { stance: 'single-leg', windowMs: 12000, outcome: 'completed' },
];

export function balanceSession(options: BalanceSessionOptions = {}): BalanceSession {
  const {
    seed = 42,
    scale = 1,
    xOffset = 0,
    noiseAmp = 0.004,
    swayAmp = 0.01,
    calibrationMs = 3500,
    stages = DEFAULT_STAGES,
    goneWindows = [],
    fps = 30,
    tailMs = 1500,
  } = options;

  const rng = mulberry32(seed);
  const frames: RawLandmarkEvent[] = [];
  const frameMs = 1000 / fps;

  // Block boundaries (relative to the end of calibration).
  const blocks = stages.map((s) => BALANCE_GET_READY_MS + s.windowMs);
  const totalStaged = blocks.reduce((a, b) => a + b, 0);
  const totalMs = calibrationMs + totalStaged + tailMs;

  for (let t = 0; t < totalMs; t += frameMs) {
    const ts = Math.round(t);
    if (goneWindows.some((w) => ts >= w.startMs && ts < w.endMs)) {
      frames.push({ timestampMs: ts, landmarks: [] });
      continue;
    }
    const shape: FrameShape = { narrow: 0, stepWide: 0, rightLift: 0, swayX: 0 };

    if (t >= calibrationMs && t < calibrationMs + totalStaged) {
      let rel = t - calibrationMs;
      let k = 0;
      while (k < blocks.length && rel >= blocks[k]) {
        rel -= blocks[k];
        k++;
      }
      const stage = stages[k];
      const inHold = rel >= BALANCE_GET_READY_MS;
      const holdT = rel - BALANCE_GET_READY_MS;
      const failed = stage.outcome === 'fail' && stage.failAtMs !== undefined && holdT >= stage.failAtMs;
      // Gentle sway only during the hold (a still subject barely sways).
      shape.swayX = inHold ? swayAmp * Math.sin((holdT / 1000) * 1.7) : 0;

      const narrowStance = stage.stance !== 'single-leg';
      if (narrowStance) {
        shape.narrow = 1;
        if (inHold && failed) shape.stepWide = 1; // recovery step out
      } else {
        // Single-leg: lift during the hold unless not-attempted; drop on fail.
        if (inHold && stage.outcome !== 'not-attempted') {
          shape.rightLift = failed ? 0 : 1;
        }
      }
    }
    frames.push(makeBalanceFrame(ts, shape, rng, scale, xOffset, noiseAmp));
  }
  return { frames, durationMs: totalMs };
}
