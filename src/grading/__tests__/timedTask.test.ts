import { TimedTaskTracker } from '../timedTask';

// TUG-shaped task.
const PHASES = ['rising', 'walk-out', 'turn', 'walk-back', 'sitting'] as const;
const CONFIG = { phases: PHASES, debounceFrames: 3 };

const ts = (i: number) => Math.round((i * 1000) / 30);

/** Drives `met=true` from frame `from` until the transition commits. */
function commit(tracker: TimedTaskTracker, from: number): number {
  let frame = from;
  for (let i = 0; i < CONFIG.debounceFrames; i++, frame++) {
    tracker.update(true, ts(frame));
  }
  return frame;
}

describe('TimedTaskTracker', () => {
  it('starts on the first phase entry, timestamped at the first run frame', () => {
    const tracker = new TimedTaskTracker(CONFIG);
    for (let i = 0; i < 10; i++) {
      expect(tracker.update(false, ts(i)).started).toBe(false);
    }
    commit(tracker, 10);
    const out = tracker.update(false, ts(20));
    expect(out.started).toBe(true);
    expect(out.phaseIndex).toBe(0);
    expect(out.phaseName).toBe('rising');
    expect(out.totalMs).toBe(ts(20) - ts(10)); // clock started at frame 10
  });

  it('a broken debounce run does not advance the phase', () => {
    const tracker = new TimedTaskTracker(CONFIG);
    commit(tracker, 0);
    tracker.update(true, ts(3));
    tracker.update(true, ts(4));
    tracker.update(false, ts(5)); // run broken at 2 < 3 frames
    const out = tracker.update(false, ts(6));
    expect(out.phaseIndex).toBe(0);
  });

  it('sequences all phases and reports per-phase wall-clock', () => {
    const tracker = new TimedTaskTracker(CONFIG);
    // Enter each phase at a known frame: 0, 30, 90, 120, 180; complete at 240.
    const entries = [0, 30, 90, 120, 180, 240];
    let frame = 0;
    for (let e = 0; e < entries.length; e++) {
      while (frame < entries[e]) {
        tracker.update(false, ts(frame));
        frame++;
      }
      frame = commit(tracker, frame);
    }
    const out = tracker.update(false, ts(frame));
    expect(out.complete).toBe(true);
    expect(out.totalMs).toBe(ts(240) - ts(0));
    for (let i = 0; i < PHASES.length; i++) {
      expect(tracker.phaseDurationMs(i)).toBe(ts(entries[i + 1]) - ts(entries[i]));
    }
  });

  it('phase durations of unfinished phases read NaN', () => {
    const tracker = new TimedTaskTracker(CONFIG);
    commit(tracker, 0); // entered phase 0 only
    expect(Number.isNaN(tracker.phaseDurationMs(0))).toBe(true);
    expect(Number.isNaN(tracker.phaseDurationMs(4))).toBe(true);
  });

  it('no further transitions after completion', () => {
    const tracker = new TimedTaskTracker({ phases: ['only'], debounceFrames: 1 });
    tracker.update(true, ts(0)); // start
    tracker.update(true, ts(10)); // complete
    const out = tracker.update(true, ts(20));
    expect(out.complete).toBe(true);
    expect(out.totalMs).toBe(ts(10) - ts(0));
  });

  it('abort freezes the clock at the last observed frame', () => {
    const tracker = new TimedTaskTracker(CONFIG);
    commit(tracker, 0);
    tracker.update(false, ts(50));
    tracker.abort();
    const out = tracker.update(true, ts(60));
    expect(out.aborted).toBe(true);
    expect(out.complete).toBe(false);
    expect(out.totalMs).toBe(ts(50) - ts(0));
  });

  it('reset clears everything', () => {
    const tracker = new TimedTaskTracker(CONFIG);
    commit(tracker, 0);
    tracker.reset();
    const out = tracker.update(false, ts(100));
    expect(out.started).toBe(false);
    expect(out.phaseIndex).toBe(-1);
  });
});
