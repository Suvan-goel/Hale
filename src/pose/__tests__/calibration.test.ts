import { BodyScaleCalibrator } from '../calibration';
import { ChainReliabilityTracker } from '../chains';
import { makeFrame, mulberry32, SYNTHETIC_HIP_ANKLE, timestamps30fps } from '../testing/syntheticPose';
import { createPoseFrame, LANDMARK_COUNT, LANDMARK_STRIDE, LM, parseLandmarkEvent, RawLandmarkEvent } from '../types';

function run(events: RawLandmarkEvent[]): BodyScaleCalibrator {
  const calibrator = new BodyScaleCalibrator();
  const chains = new ChainReliabilityTracker(15);
  const frame = createPoseFrame();
  for (const e of events) {
    parseLandmarkEvent(e, frame);
    chains.update(frame);
    calibrator.update(frame, chains);
  }
  return calibrator;
}

describe('BodyScaleCalibrator', () => {
  it('locks a body-unit scale near ground truth during a stable stance', () => {
    const rng = mulberry32(21);
    const calibrator = run(timestamps30fps(0, 90).map((t) => makeFrame(t, rng, { noiseAmp: 0.002 })));
    expect(calibrator.calibrated).toBe(true);
    expect(calibrator.bodyUnit!).toBeGreaterThan(SYNTHETIC_HIP_ANKLE * 0.95);
    expect(calibrator.bodyUnit!).toBeLessThan(SYNTHETIC_HIP_ANKLE * 1.05);
    // 1 hip-to-ankle length should convert to ~1 body unit
    expect(calibrator.toBodyUnits(SYNTHETIC_HIP_ANKLE)).toBeCloseTo(1, 1);
  });

  it('does not calibrate while the subject is walking', () => {
    const rng = mulberry32(22);
    const calibrator = run(
      // hip midpoint slides 0.3 units/sec — way above the stillness gate
      timestamps30fps(0, 90).map((t) => makeFrame(t, rng, { xOffset: 0.3 * (t / 1000) }))
    );
    expect(calibrator.calibrated).toBe(false);
  });

  it('restarts the sample window after a movement burst', () => {
    const rng = mulberry32(23);
    const events: RawLandmarkEvent[] = [];
    // 20 still frames, 10 moving frames, then enough still frames to lock
    for (const t of timestamps30fps(0, 20)) events.push(makeFrame(t, rng));
    for (const t of timestamps30fps(667, 10)) {
      events.push(makeFrame(t, rng, { xOffset: 0.4 * ((t - 667) / 1000) }));
    }
    for (const t of timestamps30fps(1000, 60)) events.push(makeFrame(t, rng));
    const calibrator = run(events);
    expect(calibrator.calibrated).toBe(true);
  });

  it('uses the reliable near side when one side is occluded', () => {
    const rng = mulberry32(24);
    const calibrator = run(
      timestamps30fps(0, 90).map((t) => makeFrame(t, rng, { leftVisibility: 0.15 }))
    );
    expect(calibrator.calibrated).toBe(true);
    expect(calibrator.bodyUnit!).toBeGreaterThan(SYNTHETIC_HIP_ANKLE * 0.9);
  });

  it('reset clears the scale', () => {
    const rng = mulberry32(25);
    const calibrator = run(timestamps30fps(0, 90).map((t) => makeFrame(t, rng)));
    expect(calibrator.calibrated).toBe(true);
    calibrator.reset();
    expect(calibrator.calibrated).toBe(false);
    expect(calibrator.bodyUnit).toBeNull();
  });

  it('locks the same body unit seated and standing (posture-invariant leg length)', () => {
    // The V2 check-up opens with the user SEATED. The scale must measure
    // anatomical leg length (hip→knee + knee→ankle), not the posture-dependent
    // direct hip-to-ankle distance, or sessions would disagree by ~30%
    // depending on when the subject first held still.
    const thigh = 0.22;
    const shank = 0.24;
    const standing = run(
      timestamps30fps(0, 90).map((t) => stanceFrame(t, { thigh, shank, kneeBentForward: 0 }))
    );
    const seated = run(
      // Knee at ~90°: thigh horizontal, shank vertical.
      timestamps30fps(0, 90).map((t) => stanceFrame(t, { thigh, shank, kneeBentForward: thigh }))
    );
    expect(standing.calibrated).toBe(true);
    expect(seated.calibrated).toBe(true);
    expect(seated.bodyUnit!).toBeCloseTo(standing.bodyUnit!, 5);
    expect(standing.bodyUnit!).toBeCloseTo(thigh + shank, 5);
  });
});

/** Side-view right-side stance: hip fixed, knee `kneeBentForward` ahead of the
 * hip (0 = straight leg), segment lengths preserved. */
function stanceFrame(
  timestampMs: number,
  { thigh, shank, kneeBentForward }: { thigh: number; shank: number; kneeBentForward: number }
): RawLandmarkEvent {
  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE).fill(0);
  const hipX = 0.5;
  const hipY = 0.5;
  const kneeX = hipX + kneeBentForward;
  const kneeY = hipY + Math.sqrt(Math.max(0, thigh * thigh - kneeBentForward * kneeBentForward));
  const set = (lm: LM, x: number, y: number) => {
    const base = lm * LANDMARK_STRIDE;
    landmarks[base] = x;
    landmarks[base + 1] = y;
    landmarks[base + 3] = 0.99;
    landmarks[base + 4] = 0.99;
  };
  // Populate the full right-side chain (shoulder→hip→knee→ankle) plus enough
  // head/torso landmarks for subject validity and chain reliability.
  set(LM.NOSE, hipX, hipY - 0.3);
  set(LM.LEFT_EAR, hipX - 0.02, hipY - 0.29);
  set(LM.RIGHT_EAR, hipX + 0.02, hipY - 0.29);
  set(LM.LEFT_SHOULDER, hipX - 0.01, hipY - 0.2);
  set(LM.RIGHT_SHOULDER, hipX + 0.01, hipY - 0.2);
  set(LM.LEFT_HIP, hipX - 0.01, hipY);
  set(LM.RIGHT_HIP, hipX + 0.01, hipY);
  set(LM.LEFT_KNEE, kneeX - 0.01, kneeY);
  set(LM.RIGHT_KNEE, kneeX, kneeY);
  set(LM.LEFT_ANKLE, kneeX - 0.01, kneeY + shank);
  set(LM.RIGHT_ANKLE, kneeX, kneeY + shank);
  return { timestampMs, landmarks };
}
