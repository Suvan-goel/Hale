import { RepCycleEventType, RepCycleTracker } from '../repCycle';
import { mulberry32 } from '../../pose/testing/syntheticPose';

// Knee-angle-like configuration: seated ~90°, standing ~175°.
const CONFIG = { upEnter: 155, downEnter: 110, emaAlpha: 1 };

const ts = (i: number) => Math.round((i * 1000) / 30);

/** Feeds a signal trace; returns every event type in firing order. */
function run(tracker: RepCycleTracker, signal: number[], startFrame = 0): RepCycleEventType[] {
  const events: RepCycleEventType[] = [];
  for (let i = 0; i < signal.length; i++) {
    const out = tracker.update(signal[i], ts(startFrame + i));
    for (const e of out.events) events.push(e.type);
  }
  return events;
}

/** Linear ramp from a to b over n samples (inclusive endpoints). */
function ramp(a: number, b: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(a + ((b - a) * i) / (n - 1));
  return out;
}

describe('RepCycleTracker', () => {
  it('counts clean reps with the expected event sequence', () => {
    const tracker = new RepCycleTracker(CONFIG);
    const events = run(tracker, [
      90, // anchors 'down'
      ...ramp(90, 175, 20),
      ...ramp(175, 90, 20),
      ...ramp(90, 175, 20),
      ...ramp(175, 90, 20),
    ]);
    expect(tracker.reps).toBe(2);
    expect(events).toEqual([
      'ascent-start', 'rep', 'bottom',
      'ascent-start', 'rep', 'bottom',
    ]);
  });

  it('hysteresis: jitter around the up threshold never double-counts', () => {
    const tracker = new RepCycleTracker(CONFIG);
    run(tracker, [90, ...ramp(90, 160, 15)]); // one rep credited
    expect(tracker.reps).toBe(1);

    // 200 frames of noisy hovering across upEnter (150..160) — committed
    // state stays 'up'; only a drop below downEnter could re-arm.
    const rng = mulberry32(7);
    const jitter: number[] = [];
    for (let i = 0; i < 200; i++) jitter.push(155 + (rng() - 0.5) * 10);
    const events = run(tracker, jitter, 16);
    expect(tracker.reps).toBe(1);
    expect(events).toEqual([]);
  });

  it('hysteresis: jitter around the down threshold re-arms exactly once', () => {
    const tracker = new RepCycleTracker(CONFIG);
    run(tracker, [90, ...ramp(90, 160, 15)]);
    // Noisy hovering across downEnter (105..115): one 'bottom' commit, then
    // only ascent-start/abort chatter — never a rep.
    const rng = mulberry32(8);
    const jitter: number[] = [];
    for (let i = 0; i < 200; i++) jitter.push(110 + (rng() - 0.5) * 10);
    const events = run(tracker, jitter, 16);
    expect(events.filter((e) => e === 'bottom')).toHaveLength(1);
    expect(events.filter((e) => e === 'rep')).toHaveLength(0);
    expect(tracker.reps).toBe(1);
  });

  it('partial rise stalls inside the band and is never counted', () => {
    const tracker = new RepCycleTracker(CONFIG);
    const events = run(tracker, [
      90,
      ...ramp(90, 140, 15), // rises past downEnter but never reaches upEnter
      ...ramp(140, 92, 15),
    ]);
    expect(tracker.reps).toBe(0);
    expect(events).toEqual(['ascent-start', 'ascent-abort']);
  });

  it('a one-frame jump across the whole band still pairs ascent-start with rep', () => {
    const tracker = new RepCycleTracker(CONFIG);
    const events = run(tracker, [90, 170]);
    expect(events).toEqual(['ascent-start', 'rep']);
    expect(tracker.reps).toBe(1);
  });

  it('resetState (subject gone) re-anchors without double-counting on re-entry', () => {
    const tracker = new RepCycleTracker(CONFIG);
    run(tracker, [90, ...ramp(90, 170, 15)]);
    expect(tracker.reps).toBe(1);

    // Subject leaves at the top and re-enters still standing: re-anchoring to
    // 'up' must NOT credit a rep for the same stand.
    tracker.resetState();
    const events = run(tracker, [170, 170, 170], 20);
    expect(events).toEqual([]);
    expect(tracker.reps).toBe(1);

    // A genuine new cycle after re-entry still counts.
    run(tracker, [...ramp(170, 90, 15), ...ramp(90, 170, 15)], 23);
    expect(tracker.reps).toBe(2);
  });

  it('EMA smoothing keeps a single-frame spike from crossing the band', () => {
    const tracker = new RepCycleTracker({ ...CONFIG, emaAlpha: 0.3 });
    const events = run(tracker, [90, 90, 200, 90, 90, 90]);
    expect(tracker.reps).toBe(0);
    expect(events.filter((e) => e === 'rep')).toHaveLength(0);
  });

  it('first commit from "unknown" never credits a rep', () => {
    const tracker = new RepCycleTracker(CONFIG);
    const events = run(tracker, [170, 170]); // session starts standing
    expect(events).toEqual([]);
    expect(tracker.reps).toBe(0);
  });

  it('reset clears the rep count; resetState keeps it', () => {
    const tracker = new RepCycleTracker(CONFIG);
    run(tracker, [90, ...ramp(90, 170, 10)]);
    expect(tracker.reps).toBe(1);
    tracker.resetState();
    expect(tracker.reps).toBe(1);
    tracker.reset();
    expect(tracker.reps).toBe(0);
  });

  it('rejects a non-hysteretic config', () => {
    expect(() => new RepCycleTracker({ upEnter: 100, downEnter: 100, emaAlpha: 1 })).toThrow();
  });
});
