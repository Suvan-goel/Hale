import { MaxRomTracker } from '../maxRom';

const ts = (i: number) => Math.round((i * 1000) / 30);

describe('MaxRomTracker', () => {
  it('captures the peak of a rising-then-falling signal (direction max)', () => {
    const tracker = new MaxRomTracker({ emaAlpha: 1, direction: 'max' });
    const values = [10, 40, 90, 130, 155, 148, 120, 80];
    let out = tracker.update(values[0], ts(0));
    for (let i = 1; i < values.length; i++) out = tracker.update(values[i], ts(i));
    expect(out.peak).toBe(155);
    expect(out.peakTimestampMs).toBe(ts(4));
  });

  it('captures the minimum for direction min (hinge reach: wrist-to-floor)', () => {
    const tracker = new MaxRomTracker({ emaAlpha: 1, direction: 'min' });
    const values = [0.9, 0.6, 0.35, 0.2, 0.24, 0.5];
    let out = tracker.update(values[0], ts(0));
    for (let i = 1; i < values.length; i++) out = tracker.update(values[i], ts(i));
    expect(out.peak).toBe(0.2);
    expect(out.peakTimestampMs).toBe(ts(3));
  });

  it('EMA smoothing keeps a single-frame spike from becoming the session best', () => {
    const tracker = new MaxRomTracker({ emaAlpha: 0.3, direction: 'max' });
    let out = tracker.update(100, ts(0));
    for (let i = 1; i < 30; i++) out = tracker.update(100, ts(i));
    out = tracker.update(200, ts(30)); // glitch frame
    for (let i = 31; i < 60; i++) out = tracker.update(100, ts(i));
    // EMA absorbs the spike: peak ≈ 130, far below the raw 200.
    expect(out.peak).toBeLessThan(135);
    expect(out.peak).toBeGreaterThan(100);
  });

  it('resetState keeps the earned peak but re-seeds smoothing', () => {
    const tracker = new MaxRomTracker({ emaAlpha: 0.3, direction: 'max' });
    for (let i = 0; i < 30; i++) tracker.update(150, ts(i));
    tracker.resetState();
    // Re-acquired at a much lower value: EMA restarts there (no stale lag),
    // peak survives.
    const out = tracker.update(40, ts(100));
    expect(out.current).toBe(40);
    expect(out.peak).toBeCloseTo(150, 0);
  });

  it('reset clears the peak', () => {
    const tracker = new MaxRomTracker({ emaAlpha: 1, direction: 'max' });
    tracker.update(150, ts(0));
    tracker.reset();
    const out = tracker.update(10, ts(1));
    expect(out.peak).toBe(10);
  });
});
