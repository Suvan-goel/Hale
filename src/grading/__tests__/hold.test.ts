import { HoldTracker } from '../hold';

const CONFIG = {
  startDebounceFrames: 3,
  endDebounceFrames: 3,
  maxHoldMs: 30000,
};

const ts = (i: number) => Math.round((i * 1000) / 30);

describe('HoldTracker', () => {
  it('starts after the debounce run but times from its first frame', () => {
    const tracker = new HoldTracker(CONFIG);
    tracker.update(false, 0, ts(0));
    tracker.update(true, 0, ts(1));
    tracker.update(true, 0, ts(2));
    expect(tracker.update(true, 0, ts(3)).phase).toBe('holding');

    const out = tracker.update(true, 0, ts(10));
    expect(out.holdMs).toBe(ts(10) - ts(1)); // from first met frame, not third
  });

  it('a broken debounce run never starts the hold', () => {
    const tracker = new HoldTracker(CONFIG);
    for (let i = 0; i < 20; i++) {
      const out = tracker.update(i % 2 === 0, 0, ts(i)); // condition flickers
      expect(out.phase).toBe('waiting');
    }
  });

  it('landmark flicker shorter than the grace window does not terminate', () => {
    const tracker = new HoldTracker(CONFIG);
    for (let i = 0; i < 5; i++) tracker.update(true, 0, ts(i));
    // 2 lost frames (< endDebounceFrames), then recovery.
    tracker.update(false, 0, ts(5));
    tracker.update(false, 0, ts(6));
    const out = tracker.update(true, 0, ts(7));
    expect(out.phase).toBe('holding');
    expect(out.endReason).toBeNull();
  });

  it('touchdown terminates with the duration measured to the first lost frame', () => {
    const tracker = new HoldTracker(CONFIG);
    for (let i = 0; i < 90; i++) tracker.update(true, 0, ts(i)); // ~3s hold
    tracker.update(false, 0, ts(90)); // touchdown
    tracker.update(false, 0, ts(91));
    const out = tracker.update(false, 0, ts(92));
    expect(out.phase).toBe('ended');
    expect(out.endReason).toBe('condition-lost');
    expect(out.holdMs).toBe(ts(90) - ts(0)); // debounce frames don't pad it
  });

  it('computes the sway proxy as population SD of the sway signal', () => {
    const tracker = new HoldTracker(CONFIG);
    // Alternating ±0.02 around 0.5 → mean 0.5, population SD 0.02.
    for (let i = 0; i < 200; i++) {
      tracker.update(true, 0.5 + (i % 2 === 0 ? 0.02 : -0.02), ts(i));
    }
    const out = tracker.update(true, 0.5 + 0.02, ts(200));
    expect(out.swaySd).toBeCloseTo(0.02, 3);
  });

  it('caps at maxHoldMs', () => {
    const tracker = new HoldTracker({ ...CONFIG, maxHoldMs: 1000 });
    let out = tracker.update(true, 0, 0);
    for (let i = 1; i <= 40; i++) out = tracker.update(true, 0, ts(i));
    expect(out.phase).toBe('ended');
    expect(out.endReason).toBe('max-duration');
    expect(out.holdMs).toBe(1000);
  });

  it('interrupt ends a hold at the last observed frame', () => {
    const tracker = new HoldTracker(CONFIG);
    for (let i = 0; i < 30; i++) tracker.update(true, 0, ts(i));
    tracker.interrupt();
    const out = tracker.update(true, 0, ts(30));
    expect(out.phase).toBe('ended');
    expect(out.endReason).toBe('interrupted');
    expect(out.holdMs).toBe(ts(29) - ts(0));
  });

  it('interrupt during a pending touchdown uses the touchdown time', () => {
    const tracker = new HoldTracker(CONFIG);
    for (let i = 0; i < 30; i++) tracker.update(true, 0, ts(i));
    tracker.update(false, 0, ts(30)); // touchdown candidate, not yet debounced
    tracker.interrupt();
    const out = tracker.update(false, 0, ts(31));
    expect(out.endReason).toBe('interrupted');
    expect(out.holdMs).toBe(ts(30) - ts(0));
  });

  it('reset returns to waiting with cleared stats', () => {
    const tracker = new HoldTracker(CONFIG);
    for (let i = 0; i < 30; i++) tracker.update(true, 0.7, ts(i));
    tracker.reset();
    const out = tracker.update(false, 0, ts(100));
    expect(out.phase).toBe('waiting');
    expect(out.holdMs).toBe(0);
    expect(Number.isNaN(out.swaySd)).toBe(true);
  });
});
