import { PoseEvent, PosePipeline, TrackingState } from '../pipeline';
import { makeFrame, mulberry32, timestamps30fps } from '../testing/syntheticPose';
import { RawLandmarkEvent } from '../types';

interface RunResult {
  states: TrackingState[];
  events: PoseEvent[];
  finalBodyUnit: number | null;
}

function run(pipeline: PosePipeline, events: RawLandmarkEvent[]): RunResult {
  const states: TrackingState[] = [];
  const collected: PoseEvent[] = [];
  let bodyUnit: number | null = null;
  for (const e of events) {
    const out = pipeline.process(e);
    states.push(out.state);
    for (const ev of out.events) collected.push({ ...ev });
    bodyUnit = out.bodyUnit;
  }
  return { states, events: collected, finalBodyUnit: bodyUnit };
}

function standingSession(seed: number, startMs: number, frames: number): RawLandmarkEvent[] {
  const rng = mulberry32(seed);
  return timestamps30fps(startMs, frames).map((t) => makeFrame(t, rng));
}

describe('PosePipeline state machine', () => {
  it('gates on warmup: no tracking until the stability window passes', () => {
    const pipeline = new PosePipeline();
    const { states, events } = run(pipeline, standingSession(31, 0, 90));

    expect(states[0]).toBe('no-subject');
    expect(events.map((e) => e.type)).toContain('subject-acquired');
    expect(events.map((e) => e.type)).toContain('tracking-started');

    const trackingStart = states.indexOf('tracking');
    // warmup is 1500ms ≈ frame 45+; nothing counts before that
    expect(trackingStart).toBeGreaterThanOrEqual(45);
    for (let i = 0; i < trackingStart; i++) {
      expect(states[i]).not.toBe('tracking');
    }
  });

  it('emits subject-gone and resets when the subject walks out mid-tracking', () => {
    const pipeline = new PosePipeline();
    const session = [
      ...standingSession(32, 0, 90), // acquire + warmup + track + calibrate
      ...timestamps30fps(3000, 30).map((t) => makeFrame(t, mulberry32(33), { present: false })),
    ];
    const { states, events } = run(pipeline, session);

    expect(events.filter((e) => e.type === 'subject-gone')).toHaveLength(1);
    expect(states[states.length - 1]).toBe('interrupted');
    // subject-gone fires ~10 frames after disappearance, not instantly
    // (a single dropped frame must never reset a rep counter)
    const goneEvent = events.find((e) => e.type === 'subject-gone')!;
    expect(goneEvent.timestampMs).toBeGreaterThan(3000 + 9 * 33);
  });

  it('re-entry goes through warmup again (no instant re-tracking)', () => {
    const pipeline = new PosePipeline();
    const session = [
      ...standingSession(34, 0, 90),
      ...timestamps30fps(3000, 30).map((t) => makeFrame(t, mulberry32(35), { present: false })),
      ...standingSession(36, 4000, 90),
    ];
    const { states, events } = run(pipeline, session);

    const types = events.map((e) => e.type);
    expect(types.filter((t) => t === 'subject-acquired')).toHaveLength(2);
    expect(types.filter((t) => t === 'tracking-started')).toHaveLength(2);

    // after re-acquisition, the state walks no-subject/interrupted → warmup → tracking
    const reacquired = states.slice(120);
    expect(reacquired).toContain('warmup');
    expect(reacquired[reacquired.length - 1]).toBe('tracking');
  });

  it('a brief flicker (a few bad frames) does NOT fire subject-gone', () => {
    const pipeline = new PosePipeline();
    const rng = mulberry32(37);
    const session = [
      ...standingSession(38, 0, 90),
      // 4 dropped frames — under the 10-frame threshold
      ...timestamps30fps(3000, 4).map((t) => makeFrame(t, rng, { present: false })),
      ...standingSession(39, 3133, 60),
    ];
    const { states, events } = run(pipeline, session);
    expect(events.filter((e) => e.type === 'subject-gone')).toHaveLength(0);
    expect(states[states.length - 1]).toBe('tracking');
  });

  it('treats a large timestamp gap as an interruption', () => {
    const pipeline = new PosePipeline();
    const session = [
      ...standingSession(40, 0, 90),
      // stream resumes 5 seconds later (app backgrounded, camera stalled)
      ...standingSession(41, 8000, 90),
    ];
    const { events, states } = run(pipeline, session);
    expect(events.filter((e) => e.type === 'subject-gone')).toHaveLength(1);
    // and the pipeline recovers to tracking after a fresh warmup
    expect(states[states.length - 1]).toBe('tracking');
  });

  it('calibrates the body-unit scale once tracking and emits the event', () => {
    const pipeline = new PosePipeline();
    const { events, finalBodyUnit } = run(pipeline, standingSession(42, 0, 150));
    expect(events.map((e) => e.type)).toContain('calibration-complete');
    expect(finalBodyUnit).not.toBeNull();
    expect(finalBodyUnit!).toBeGreaterThan(0.2);
    expect(finalBodyUnit!).toBeLessThan(0.5);
  });

  it('carries native inference timing for latency diagnostics', () => {
    const pipeline = new PosePipeline();
    const out = pipeline.process({ ...standingSession(50, 0, 1)[0], inferenceMs: 18.4 });

    expect(out.inferenceMs).toBe(18.4);
  });

  it('side-on subject (one reliable chain) still tracks — required for side-view items', () => {
    const pipeline = new PosePipeline();
    const rng = mulberry32(43);
    const session = timestamps30fps(0, 120).map((t) =>
      makeFrame(t, rng, { leftVisibility: 0.15 })
    );
    const { states } = run(pipeline, session);
    expect(states[states.length - 1]).toBe('tracking');
  });

  it('never tracks furniture: an implausible static cluster stays no-subject', () => {
    const pipeline = new PosePipeline();
    const rng = mulberry32(44);
    const session = timestamps30fps(0, 120).map((t) =>
      makeFrame(t, rng, { scale: 0.12, noiseAmp: 0.001 })
    );
    const { states, events } = run(pipeline, session);
    expect(new Set(states)).toEqual(new Set(['no-subject']));
    expect(events).toHaveLength(0);
  });

  it('is fully deterministic: identical input → identical states and events', () => {
    const runOnce = () => {
      const pipeline = new PosePipeline();
      const session = [
        ...standingSession(45, 0, 120),
        ...timestamps30fps(4000, 20).map((t) => makeFrame(t, mulberry32(46), { present: false })),
        ...standingSession(47, 4700, 60),
      ];
      return run(pipeline, session);
    };
    const a = runOnce();
    const b = runOnce();
    expect(a.states).toEqual(b.states);
    expect(a.events).toEqual(b.events);
    expect(a.finalBodyUnit).toBe(b.finalBodyUnit);
  });

  it('reset returns the pipeline to a cold state', () => {
    const pipeline = new PosePipeline();
    run(pipeline, standingSession(48, 0, 120));
    expect(pipeline.trackingState).toBe('tracking');
    pipeline.reset();
    expect(pipeline.trackingState).toBe('no-subject');
    const { states } = run(pipeline, standingSession(49, 0, 30));
    expect(states[0]).toBe('no-subject');
  });
});
