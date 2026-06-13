import { RepVelocityTracker } from '../repVelocity';

const CONFIG = {
  cycle: { upEnter: 155, downEnter: 110, emaAlpha: 1 },
  velocityEmaAlpha: 0.3,
  maxReps: 64,
};

const FPS = 30;
const ts = (i: number) => Math.round((i * 1000) / FPS);

/**
 * Scripted rep: signal ramps 90→175 while position rises at EXACTLY
 * `velocity` bu/s (computed from the rounded timestamps, so discrete
 * sampling introduces zero error), then returns to seated.
 */
function performRep(
  tracker: RepVelocityTracker,
  startFrame: number,
  riseFrames: number,
  velocity: number,
  basePos: number
): { lastFrame: number; endPos: number } {
  let frame = startFrame;
  const t0 = ts(frame);
  // Rise.
  for (let i = 0; i <= riseFrames; i++, frame++) {
    const t = ts(frame);
    const signal = 90 + (85 * i) / riseFrames;
    const pos = basePos + (velocity * (t - t0)) / 1000;
    tracker.update(signal, pos, t);
  }
  const endPos = basePos + (velocity * (ts(frame - 1) - t0)) / 1000;
  // Brief stand, then descend at the same rate, then settle.
  for (let i = 0; i < 10; i++, frame++) tracker.update(175, endPos, ts(frame));
  for (let i = 0; i <= riseFrames; i++, frame++) {
    const signal = 175 - (85 * i) / riseFrames;
    const pos = endPos - ((endPos - basePos) * i) / riseFrames;
    tracker.update(signal, pos, ts(frame));
  }
  for (let i = 0; i < 10; i++, frame++) tracker.update(90, basePos, ts(frame));
  return { lastFrame: frame, endPos };
}

describe('RepVelocityTracker', () => {
  it('measures a known-velocity ramp exactly (mean) and closely (peak)', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    tracker.update(90, 0, ts(0)); // anchor seated
    performRep(tracker, 1, 40, 0.35, 0);

    expect(tracker.repCount).toBe(1);
    const stats = tracker.repStats();
    expect(stats).toHaveLength(1);
    // Constant true velocity ⇒ windowed displacement/duration is exact.
    expect(stats[0].meanVel).toBeCloseTo(0.35, 6);
    // Peak = EMA of constant instantaneous velocity ⇒ converges to V.
    expect(Math.abs(stats[0].peakVel - 0.35)).toBeLessThan(0.35 * 0.05);
  });

  it('session mean is the mean of per-rep means', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    tracker.update(90, 0, ts(0));
    let frame = 1;
    frame = performRep(tracker, frame, 40, 0.3, 0).lastFrame;
    frame = performRep(tracker, frame, 40, 0.5, 0).lastFrame;
    expect(tracker.repCount).toBe(2);
    const stats = tracker.repStats();
    expect(stats[0].meanVel).toBeCloseTo(0.3, 6);
    expect(stats[1].meanVel).toBeCloseTo(0.5, 6);
    expect(tracker.sessionMeanVel).toBeCloseTo(0.4, 6);
  });

  it('an aborted ascent stores nothing', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    tracker.update(90, 0, ts(0));
    // Partial rise: signal stalls at 140 (inside the band) and falls back.
    let frame = 1;
    for (let i = 0; i <= 20; i++, frame++) {
      tracker.update(90 + (50 * i) / 20, (0.3 * ts(frame)) / 1000, ts(frame));
    }
    for (let i = 0; i <= 20; i++, frame++) {
      tracker.update(140 - (50 * i) / 20, 0.2 - (0.2 * i) / 20, ts(frame));
    }
    expect(tracker.repCount).toBe(0);
    expect(tracker.storedRepCount).toBe(0);
    expect(Number.isNaN(tracker.sessionMeanVel)).toBe(true);
  });

  it('resetState discards the stale position so a gap never fabricates velocity', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    tracker.update(90, 0, ts(0));
    performRep(tracker, 1, 40, 0.35, 0);
    expect(tracker.repCount).toBe(1);

    // Subject gone; re-enters seated at a very different measured position
    // (e.g. recalibrated framing). The position jump must not leak into the
    // next rep's velocity.
    tracker.resetState();
    const resumeFrame = 200;
    tracker.update(90, 5.0, ts(resumeFrame)); // re-anchor 'down', new baseline
    performRep(tracker, resumeFrame + 1, 40, 0.35, 5.0);

    expect(tracker.repCount).toBe(2);
    const stats = tracker.repStats();
    expect(stats[1].meanVel).toBeCloseTo(0.35, 6);
    expect(Math.abs(stats[1].peakVel - 0.35)).toBeLessThan(0.35 * 0.05);
  });

  it('credited reps and stats survive resetState', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    tracker.update(90, 0, ts(0));
    performRep(tracker, 1, 40, 0.4, 0);
    tracker.resetState();
    expect(tracker.repCount).toBe(1);
    expect(tracker.storedRepCount).toBe(1);
    expect(tracker.sessionMeanVel).toBeCloseTo(0.4, 6);
  });

  it('reports NaN stats before any rep completes', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    const out = tracker.update(90, 0, ts(0));
    expect(Number.isNaN(out.lastRepMeanVel)).toBe(true);
    expect(Number.isNaN(out.sessionMeanVel)).toBe(true);
    expect(out.repCredited).toBe(false);
  });

  it('repCredited pulses only on the crediting frame', () => {
    const tracker = new RepVelocityTracker(CONFIG);
    tracker.update(90, 0, ts(0));
    let creditedFrames = 0;
    let frame = 1;
    for (let i = 0; i <= 40; i++, frame++) {
      const t = ts(frame);
      const out = tracker.update(90 + (85 * i) / 40, (0.35 * t) / 1000, t);
      if (out.repCredited) creditedFrames++;
    }
    expect(creditedFrames).toBe(1);
  });
});
