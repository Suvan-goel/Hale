/**
 * Side-contract PARITY tests (founder requirement 1): the three contracts the
 * camera screen honors — abandonment-funnel persistence, resume snapshots at
 * item boundaries, single-record completion — proven on the voice controller,
 * plus the day-one instrumentation (voice-vs-tap counts, churn location,
 * pain audit) this surface exists to produce.
 */

import type { HistoryFs } from '../../history/store';
import { BALANCE_FEET_TOGETHER_ID, STS_STANDARD_ID } from '../../exercises';
import { deserializeSessionFunnel } from '../../telemetry/sessionFunnelRecord';
import { SessionFunnelStore } from '../../telemetry/sessionFunnelStore';
import type { TrainingItemResult, TrainingSessionResult } from '../../training/sessionPlayer';
import { VoiceSessionController } from '../voiceSessionController';

function memoryFs(): { fs: HistoryFs; files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    files,
    fs: {
      list: () => [...files.keys()],
      read: async (name: string) => files.get(name) ?? null,
      write: (name: string, contents: string) => {
        files.set(name, contents);
      },
    } as unknown as HistoryFs,
  };
}

interface Harness {
  controller: VoiceSessionController;
  files: Map<string, string>;
  results: TrainingSessionResult[];
  boundaries: TrainingItemResult[][];
  ts: number;
  voiceBusyUntil: number;
  tick(): ReturnType<VoiceSessionController['tick']>;
  tickUntil(pred: (u: ReturnType<VoiceSessionController['tick']>) => boolean, maxMs?: number): ReturnType<VoiceSessionController['tick']>;
}

function makeHarness(exerciseIds: string[]): Harness {
  const { fs, files } = memoryFs();
  const results: TrainingSessionResult[] = [];
  const boundaries: TrainingItemResult[][] = [];
  const controller = new VoiceSessionController({
    startedAtIso: '2026-07-06T09:00:00.000Z',
    exerciseIds,
    funnelStore: new SessionFunnelStore(fs),
    onComplete: (result) => results.push(result),
    onItemCompleted: (items) => boundaries.push(items.map((item) => ({ ...item }))),
    nowIso: () => '2026-07-06T09:30:00.000Z',
  });
  const h: Harness = {
    controller,
    files,
    results,
    boundaries,
    ts: 0,
    voiceBusyUntil: -1,
    tick() {
      h.ts += 250;
      const u = controller.tick(h.ts, h.ts < h.voiceBusyUntil);
      if (u.voice) h.voiceBusyUntil = h.ts + u.voice.cues.length * 1200;
      return u;
    },
    tickUntil(pred, maxMs = 30 * 60 * 1000) {
      let u = h.tick();
      const deadline = h.ts + maxMs;
      while (!pred(u) && h.ts < deadline) u = h.tick();
      if (!pred(u)) throw new Error(`tickUntil timeout in phase ${u.phase}`);
      return u;
    },
  };
  return h;
}

function runToCompletion(h: Harness, useVoiceForDone = false): void {
  let guard = 0;
  while (h.results.length === 0 && guard++ < 100) {
    const u = h.tickUntil(
      (x) =>
        x.phase === 'done' ||
        (x.phase === 'waiting_ready' && h.ts >= h.voiceBusyUntil) ||
        x.phase === 'set' ||
        x.phase === 'rest'
    );
    if (u.phase === 'done') break;
    if (u.phase === 'waiting_ready') h.controller.handleTap('ready', h.ts);
    else if (u.phase === 'set') {
      h.ts += 4000;
      if (useVoiceForDone) h.controller.handleVoiceIntent('done', h.ts);
      else h.controller.handleTap('done', h.ts);
    } else if (u.phase === 'rest') h.controller.handleTap('skip_rest', h.ts);
  }
  h.tickUntil((u) => u.phase === 'done');
}

describe('side-contract parity', () => {
  it('completion: exactly one funnel record; onComplete fires; abandonment after completion is a no-op', () => {
    const h = makeHarness([STS_STANDARD_ID]);
    runToCompletion(h);
    expect(h.results).toHaveLength(1);
    expect(h.files.size).toBe(1);

    h.controller.recordAbandonment(); // unmount after completion
    expect(h.files.size).toBe(1);
    const record = deserializeSessionFunnel([...h.files.values()][0])!;
    expect(record.outcome).toBe('completed');
    expect(record.completionPoint).toBe('completed');
    expect(record.sessionMode).toBe('voice_guided');
  });

  it('abandonment mid-set: unmount records once, idempotently, with churn location', () => {
    const h = makeHarness([STS_STANDARD_ID]);
    h.tickUntil((u) => u.phase === 'waiting_ready' && h.ts >= h.voiceBusyUntil);
    h.controller.handleTap('ready', h.ts);
    h.tickUntil((u) => u.phase === 'set');

    h.controller.recordAbandonment(); // unmount (back/stop/navigation)
    h.controller.recordAbandonment(); // double unmount safety
    expect(h.files.size).toBe(1);
    const record = deserializeSessionFunnel([...h.files.values()][0])!;
    expect(record.outcome).toBe('abandoned');
    expect(record.completionPoint).toBe('abandoned_mid_set');
  });

  it('resume snapshots: onItemCompleted fires per item boundary with cumulative items', () => {
    const h = makeHarness([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    runToCompletion(h);
    expect(h.boundaries).toHaveLength(2);
    expect(h.boundaries[0].map((i) => i.exerciseId)).toEqual([STS_STANDARD_ID]);
    expect(h.boundaries[1].map((i) => i.exerciseId)).toEqual([
      STS_STANDARD_ID,
      BALANCE_FEET_TOGETHER_ID,
    ]);
  });
});

describe('day-one instrumentation', () => {
  it('voice and tap usage are tallied separately, only when the action lands', () => {
    const h = makeHarness([STS_STANDARD_ID]);
    // 'done' before any set exists must not count.
    expect(h.controller.handleVoiceIntent('done', h.ts)).toBe(false);
    runToCompletion(h, true); // voice says done; taps do ready/skip_rest
    const record = deserializeSessionFunnel([...h.files.values()][0])!;
    expect(record.voiceIntentCounts?.done).toBeGreaterThanOrEqual(3);
    expect(record.voiceIntentCounts?.ready).toBeUndefined();
    expect(record.tapActionCounts?.ready).toBeGreaterThanOrEqual(3);
    expect(record.tapActionCounts?.done).toBeUndefined();
  });

  it('pain events ride the abandoned record too (immutable audit)', () => {
    const h = makeHarness([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    h.tickUntil((u) => u.phase === 'waiting_ready' && h.ts >= h.voiceBusyUntil);
    h.controller.handleTap('ready', h.ts);
    h.tickUntil((u) => u.phase === 'set');
    h.controller.handleVoiceIntent('pain', h.ts);
    h.controller.recordAbandonment();
    const record = deserializeSessionFunnel([...h.files.values()][0])!;
    expect(record.painEvents).toHaveLength(1);
    expect(record.painEvents![0].exerciseId).toBe(STS_STANDARD_ID);
    expect(record.voiceIntentCounts?.pain).toBe(1);
  });

  it('rest-screen rep adjustment maps to reportedReps/repsAdjusted', () => {
    const h = makeHarness([STS_STANDARD_ID]);
    h.tickUntil((u) => u.phase === 'waiting_ready' && h.ts >= h.voiceBusyUntil);
    h.controller.handleTap('ready', h.ts);
    h.tickUntil((u) => u.phase === 'set');
    h.controller.handleTap('done', (h.ts += 5000));
    h.tickUntil((u) => u.phase === 'rest');
    expect(h.controller.handleTap('adjust_reps_down')).toBe(true);
    expect(h.controller.handleTap('adjust_reps_down')).toBe(true);
    runToCompletion(h);
    const sets = h.results[0].items[0].sets;
    expect(sets[0].repsAdjusted).toBe(-2);
    expect(sets[0].reportedReps).toBe((sets[1].reportedReps as number) - 2);
  });
});

describe('intent policy delegation', () => {
  it('exposes hot-only intents while speaking and phase commands when idle', () => {
    const h = makeHarness([STS_STANDARD_ID]);
    h.tickUntil((u) => u.phase === 'waiting_ready');
    expect(h.controller.enabledIntents(true)).toEqual(['stop', 'pain', 'pause']);
    expect(h.controller.enabledIntents(false)).toEqual(
      expect.arrayContaining(['ready', 'repeat', 'stop', 'pain'])
    );
  });
});
