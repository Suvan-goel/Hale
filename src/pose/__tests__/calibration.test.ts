import { BodyScaleCalibrator } from '../calibration';
import { ChainReliabilityTracker } from '../chains';
import { makeFrame, mulberry32, SYNTHETIC_HIP_ANKLE, timestamps30fps } from '../testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent, RawLandmarkEvent } from '../types';

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
});
