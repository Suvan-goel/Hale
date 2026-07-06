import { DUAL_TASK_VERBAL_FLOOR, verbalTaskPerformed } from '../speechActivity';
import { ScriptedSpeechActivityMonitor } from '../testing/scriptedSpeechActivity';

describe('speech-activity seam (CLARITY_INSTRUMENTS_TDD §4.3)', () => {
  it('F5: long thinking pauses never invalidate — the floor is cumulative, not continuous', () => {
    // 40 s hold with speech only in two short bursts separated by a 20 s
    // silent thinking stretch: 6 s + 5 s = 11 s cumulative ≥ min(8 s, 10 s).
    const monitor = new ScriptedSpeechActivityMonitor({
      segments: [
        { fromMs: 0, toMs: 6000 },
        { fromMs: 26000, toMs: 31000 },
      ],
    });
    monitor.start(1000);
    const summary = monitor.stop(41000);
    expect(summary).toEqual({ speechActiveMs: 11000, windowMs: 40000 });
    expect(verbalTaskPerformed(summary)).toBe(true);
  });

  it('short holds need proportionally little speech (min of the two floors)', () => {
    // 10 s hold: floor = min(8000, 0.25 × 10000) = 2500 ms.
    expect(verbalTaskPerformed({ speechActiveMs: 2600, windowMs: 10000 })).toBe(true);
    expect(verbalTaskPerformed({ speechActiveMs: 2000, windowMs: 10000 })).toBe(false);
  });

  it('total silence fails the floor — she left the verbal task, not the movement', () => {
    const monitor = new ScriptedSpeechActivityMonitor({ segments: [] });
    monitor.start(0);
    const summary = monitor.stop(45000);
    expect(summary.speechActiveMs).toBe(0);
    expect(verbalTaskPerformed(summary)).toBe(false);
    // The floor constants are data, not code (tuned at device Block 7).
    expect(DUAL_TASK_VERBAL_FLOOR).toEqual({ minSpeechMs: 8000, minSpeechFraction: 0.25 });
  });

  it('unavailable monitors refuse to start (the offer-suppression path)', async () => {
    const monitor = new ScriptedSpeechActivityMonitor({ availability: 'unavailable' });
    await expect(monitor.availability()).resolves.toBe('unavailable');
    expect(() => monitor.start(0)).toThrow(/unavailable/);
  });

  it('reports presence only — the seam has no word/transcript/audio surface', () => {
    // Module-shape pin: the privacy property is structural, not conventional.
    const seam = require('../speechActivity');
    const exported = Object.keys(seam).join(' ');
    expect(exported).not.toMatch(/transcri|word|audio|text/i);
    const monitor = new ScriptedSpeechActivityMonitor({ segments: [{ fromMs: 0, toMs: 1000 }] });
    const events: unknown[] = [];
    monitor.onActivity((event) => events.push(event));
    monitor.start(0);
    monitor.stop(2000);
    for (const event of events) {
      expect(Object.keys(event as object).sort()).toEqual(['atMs', 'speaking']);
    }
  });
});
