import { angleAtDeg, aspectCorrectedAngleAtDeg, aspectCorrectedDist } from '../geometry';
import { DEFAULT_ONE_EURO, PoseSmoother } from '../filters';
import {
  createPoseFrame,
  LANDMARK_COUNT,
  LANDMARK_STRIDE,
  LM,
  parseLandmarkEvent,
  type PoseFrame,
  type RawLandmarkEvent,
} from '../types';

function frameWithPoints(points: readonly [LM, number, number][], aspect = 1): PoseFrame {
  const frame = createPoseFrame();
  frame.hasPose = true;
  frame.aspect = aspect;
  for (const [lm, x, y] of points) {
    frame.xs[lm] = x;
    frame.ys[lm] = y;
  }
  return frame;
}

describe('aspect-corrected geometry', () => {
  it('matches angleAtDeg exactly at aspect 1', () => {
    const frame = frameWithPoints([
      [LM.RIGHT_HIP, 0.5, 0.7],
      [LM.RIGHT_SHOULDER, 0.5, 0.4],
      [LM.RIGHT_ELBOW, 0.62, 0.31],
    ]);
    expect(aspectCorrectedAngleAtDeg(frame, LM.RIGHT_HIP, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW)).toBeCloseTo(
      angleAtDeg(frame, LM.RIGHT_HIP, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW),
      10
    );
  });

  it('recovers the physical angle on a portrait frame where raw space distorts it', () => {
    // A physically 45°-from-vertical arm on a 480x640 portrait frame: the
    // physical horizontal offset equals the vertical one, but in normalized
    // units the x-delta is larger by 1/aspect (x is per-width).
    const aspect = 480 / 640;
    const physicalDelta = 0.15; // in height units
    const frame = frameWithPoints(
      [
        [LM.RIGHT_HIP, 0.5, 0.7],
        [LM.RIGHT_SHOULDER, 0.5, 0.4],
        [LM.RIGHT_ELBOW, 0.5 + physicalDelta / aspect, 0.4 - physicalDelta],
      ],
      aspect
    );
    // vertex→hip points straight down; vertex→elbow is physically 135° away.
    expect(aspectCorrectedAngleAtDeg(frame, LM.RIGHT_HIP, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW)).toBeCloseTo(135, 5);
    // The raw-space reading is measurably different — the distortion the
    // corrected helper exists to remove.
    expect(
      Math.abs(angleAtDeg(frame, LM.RIGHT_HIP, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW) - 135)
    ).toBeGreaterThan(3);
  });

  it('measures aspect-corrected distances in height units', () => {
    const aspect = 0.75;
    const frame = frameWithPoints(
      [
        [LM.RIGHT_HIP, 0.5, 0.5],
        [LM.RIGHT_KNEE, 0.5 + 0.3 / aspect, 0.5],
      ],
      aspect
    );
    expect(aspectCorrectedDist(frame, LM.RIGHT_HIP, LM.RIGHT_KNEE)).toBeCloseTo(0.3, 10);
  });
});

describe('frame aspect plumbing', () => {
  function rawEvent(extra: Partial<RawLandmarkEvent> = {}): RawLandmarkEvent {
    return {
      timestampMs: 1000,
      landmarks: new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE).fill(0.5),
      ...extra,
    };
  }

  it('parses source dimensions into frame.aspect and defaults to 1 without them', () => {
    const frame = createPoseFrame();
    parseLandmarkEvent(rawEvent({ sourceWidth: 480, sourceHeight: 640 }), frame);
    expect(frame.aspect).toBeCloseTo(0.75, 10);

    parseLandmarkEvent(rawEvent(), frame);
    expect(frame.aspect).toBe(1);

    parseLandmarkEvent(rawEvent({ sourceWidth: 0, sourceHeight: 640 }), frame);
    expect(frame.aspect).toBe(1);
  });

  it('propagates aspect through the smoother', () => {
    const smoother = new PoseSmoother(DEFAULT_ONE_EURO);
    const src = createPoseFrame();
    const dst = createPoseFrame();
    parseLandmarkEvent(rawEvent({ sourceWidth: 480, sourceHeight: 640 }), src);
    smoother.apply(src, dst);
    expect(dst.aspect).toBeCloseTo(0.75, 10);
  });
});
