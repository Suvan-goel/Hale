/**
 * Voice-guided session mode, fully headless: clock ticks + intents/taps drive
 * the same TrainingSessionPlayer, no camera and no pose pipeline anywhere.
 *
 * The FIRST test is the founder-mandated invariant: a complete session must
 * be fully usable with voice disabled — taps only, recognizer never consulted.
 * That invariant is the hedge that makes deferring the on-device KWS spike
 * safe. The remaining tests cover the intent surface (ready/done/skip/pause/
 * stop/resume/pain), the no-auto-advance rule, and reported-vs-measured
 * honesty on SetResult.
 */

import { VoiceCueKey } from '../../audio/cues';
import { BALANCE_FEET_TOGETHER_ID, STS_STANDARD_ID, getExercise } from '../../exercises';
import {
  type TrainingFrameUpdate,
  VoiceSessionPlayer as TrainingSessionPlayer,
  VOICE_SESSION_TIMING,
} from '../voiceSessionPlayer';

const TICK_MS = 250;
const CUE_PLAY_MS = 1200;

function makeVoicePlayer(exerciseIds: string[]): TrainingSessionPlayer {
  return new TrainingSessionPlayer(
    '2026-07-06T09:00:00.000Z',
    exerciseIds
  );
}

interface VoiceRun {
  player: TrainingSessionPlayer;
  spoken: VoiceCueKey[];
  ts: number;
  voiceBusyUntil: number;
  tick(): TrainingFrameUpdate;
  /** Tick until predicate or timeout; returns the last update. */
  tickUntil(predicate: (u: TrainingFrameUpdate) => boolean, maxMs?: number): TrainingFrameUpdate;
}

function startRun(player: TrainingSessionPlayer): VoiceRun {
  const run: VoiceRun = {
    player,
    spoken: [],
    ts: 0,
    voiceBusyUntil: -1,
    tick() {
      run.ts += TICK_MS;
      const u = player.tick(run.ts, run.ts < run.voiceBusyUntil);
      if (u.voice) {
        run.spoken.push(...(u.voice.cues as VoiceCueKey[]));
        run.voiceBusyUntil = run.ts + u.voice.cues.length * CUE_PLAY_MS;
      }
      return u;
    },
    tickUntil(predicate, maxMs = 30 * 60 * 1000) {
      let u = run.tick();
      const deadline = run.ts + maxMs;
      while (!predicate(u) && run.ts < deadline) u = run.tick();
      if (!predicate(u)) throw new Error(`tickUntil timed out at phase=${u.phase}`);
      return u;
    },
  };
  return run;
}

describe('tap-only completeness (TESTED INVARIANT — voice disabled)', () => {
  it('completes a full multi-exercise session via taps alone, recognizer never consulted', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    const run = startRun(player);
    const sts = getExercise(STS_STANDARD_ID);
    const balance = getExercise(BALANCE_FEET_TOGETHER_ID);

    let guard = 0;
    while (player.result === null && guard++ < 200) {
      const u = run.tickUntil(
        (x) =>
          x.phase === 'done' ||
          (x.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil) ||
          (x.phase === 'set' && x.currentExerciseId === STS_STANDARD_ID) ||
          x.phase === 'rest'
      );
      if (u.phase === 'done') break;
      if (u.phase === 'waiting_ready') {
        expect(player.confirmReady(run.ts)).toBe(true); // tap
      } else if (u.phase === 'set' && u.currentExerciseId === STS_STANDARD_ID) {
        run.ts += 5000; // she works at her own pace
        expect(player.completeCurrentSet(run.ts)).toBe(true); // tap "done"
      } else if (u.phase === 'rest') {
        expect(player.skipRest(run.ts)).toBe(true); // tap skip-rest
      }
    }
    run.tickUntil((u) => u.phase === 'done');

    const result = player.result;
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(2);
    for (const item of result!.items) expect(item.status).toBe('completed');

    // Reported, never measured: reps 0 / meanVel NaN on every voice set.
    const stsSets = result!.items[0].sets;
    expect(stsSets).toHaveLength(sts.prescription.sets);
    for (const set of stsSets) {
      expect(set.flags).toContain('voice-guided');
      expect(set.reps).toBe(0);
      expect(Number.isNaN(set.meanVel)).toBe(true);
      expect(set.reportedReps).toBe(sts.prescription.repsPerSet);
    }
    // Timed hold sets end on the audio clock and record elapsed seconds.
    const balanceSets = result!.items[1].sets;
    expect(balanceSets).toHaveLength(balance.prescription.sets);
    for (const set of balanceSets) {
      expect(set.holdSec).toBeCloseTo(balance.prescription.holdSec as number, 0);
      expect(set.reachedTarget).toBe(true);
      expect(set.reportedReps).toBeUndefined();
    }
    expect(result!.painEvents).toBeUndefined();
    expect(result!.funnel?.completed).toBe(true);
  });

  it('never auto-advances a waiting user: one re-prompt, then tap-lean, forever', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    run.tickUntil((u) => u.phase === 'waiting_ready');

    // Sit silent for 10 minutes.
    let u = run.tick();
    const target = run.ts + 10 * 60 * 1000;
    while (run.ts < target) u = run.tick();

    expect(u.phase).toBe('waiting_ready');
    expect(u.tapPromptHighlighted).toBe(true);
    expect(run.spoken.filter((c) => c === 'voice-say-ready-reprompt')).toHaveLength(1);
  });

  it('open rep sets never end themselves: one done-hint, then patience', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    run.tickUntil((u) => u.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil);
    player.confirmReady(run.ts);
    run.tickUntil((u) => u.phase === 'set');

    let u = run.tick();
    const target = run.ts + 15 * 60 * 1000;
    while (run.ts < target) u = run.tick();

    expect(u.phase).toBe('set');
    expect(run.spoken.filter((c) => c === 'voice-done-reprompt')).toHaveLength(1);
    expect(u.tapPromptHighlighted).toBe(true);
  });
});

describe('camera-free honesty', () => {
  it('the intro speaks the global safety lines WITHOUT the camera-tracking one', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    run.tickUntil((u) => u.phase === 'waiting_ready');
    expect(run.spoken).toContain('training-intro');
    expect(run.spoken).toContain('global_stop_sharp_or_increasing_pain');
    // There is no camera in a voice session; "if tracking pauses…" must
    // never be spoken here (it describes a system she is not using).
    expect(run.spoken).not.toContain('global_pause_if_tracking_lost');
  });

  it('the countdown always reaches her in order: three, two, one, go', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    run.tickUntil((u) => u.phase === 'waiting_ready');
    // Confirm ready while the say-ready prompt is STILL PLAYING — the
    // regression this pins: a pending "three" being clobbered by "two".
    expect(run.ts).toBeLessThan(run.voiceBusyUntil);
    expect(player.confirmReady(run.ts)).toBe(true);
    run.tickUntil((u) => u.phase === 'set');
    const countdown = run.spoken.filter((cue) =>
      ['countdown-three', 'countdown-two', 'countdown-one', 'go'].includes(cue)
    );
    expect(countdown).toEqual(['countdown-three', 'countdown-two', 'countdown-one', 'go']);
  });
});

describe('voice intent surface', () => {
  function toFirstSet(run: VoiceRun): void {
    run.tickUntil((u) => u.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil);
    expect(run.player.handleSessionIntent('ready', run.ts)).toBe(true);
    run.tickUntil((u) => u.phase === 'set');
  }

  it('ready → countdown → set; done completes the set into rest', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    toFirstSet(run);
    run.ts += 8000;
    expect(player.handleSessionIntent('done', run.ts)).toBe(true);
    const u = run.tick();
    expect(u.phase).toBe('rest');
    expect(run.spoken).toContain('go');
  });

  it('pain: halts, acknowledges, skips the exercise, session continues', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    const run = startRun(player);
    toFirstSet(run);
    expect(player.handleSessionIntent('pain', run.ts)).toBe(true);
    const u = run.tickUntil((x) => x.currentExerciseId === BALANCE_FEET_TOGETHER_ID);
    expect(u.phase).not.toBe('done');
    run.tickUntil(() => run.spoken.includes('pain-acknowledge'), 30000);

    // Finish the remaining exercise by taps.
    let guard = 0;
    while (player.result === null && guard++ < 60) {
      const next = run.tickUntil(
        (x) => x.phase === 'done' || (x.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil)
      );
      if (next.phase === 'done') break;
      player.confirmReady(run.ts);
      run.tickUntil((x) => x.phase === 'set' || x.phase === 'rest' || x.phase === 'done');
    }
    run.tickUntil((x) => x.phase === 'done');

    const result = player.result!;
    expect(result.items[0]).toMatchObject({
      exerciseId: STS_STANDARD_ID,
      status: 'skipped',
      skipReason: 'pain',
    });
    expect(result.items[1].status).toBe('completed');
    expect(result.painEvents).toHaveLength(1);
    expect(result.painEvents![0]).toMatchObject({ exerciseId: STS_STANDARD_ID, setIndex: 0 });
  });

  it('pause halts to voice_paused and resume restarts the set from waiting_ready', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    toFirstSet(run);
    expect(player.handleSessionIntent('pause', run.ts)).toBe(true);
    let u = run.tick();
    expect(u.phase).toBe('voice_paused');
    expect(u.stopRequested).toBe(false);
    run.tickUntil(() => run.spoken.includes('paused-v21'), 30000);

    run.ts += 60000; // paused indefinitely is fine — her pace
    expect(player.handleSessionIntent('resume', run.ts)).toBe(true);
    u = run.tick();
    expect(u.phase).toBe('waiting_ready');
    expect(u.setIndex).toBe(0); // the interrupted set restarts, not skips
  });

  it('resume after a mid-rep-set pause says every rep counts (effort never reads as discarded)', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    toFirstSet(run);
    run.ts += 12000; // six reps in, she pauses
    player.handleSessionIntent('pause', run.ts);
    run.tickUntil(() => run.spoken.includes('paused-v21'), 30000);
    player.handleSessionIntent('resume', run.ts);
    run.tickUntil(() => run.spoken.includes('voice-resume-counts'), 30000);
    const readyIdx = run.spoken.lastIndexOf('voice-say-ready');
    expect(readyIdx).toBeGreaterThan(run.spoken.indexOf('voice-resume-counts'));
  });

  it('resume after pausing a TIMED hold set does not speak the rep-counting line', () => {
    const player = makeVoicePlayer([BALANCE_FEET_TOGETHER_ID]);
    const run = startRun(player);
    run.tickUntil((u) => u.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil);
    player.handleSessionIntent('ready', run.ts);
    run.tickUntil((u) => u.phase === 'set');
    run.ts += 5000;
    player.handleSessionIntent('pause', run.ts);
    player.handleSessionIntent('resume', run.ts + 2000);
    run.tickUntil((u) => u.phase === 'waiting_ready');
    expect(run.spoken).not.toContain('voice-resume-counts');
  });

  it('stop surfaces stopRequested for the end-session confirm', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    toFirstSet(run);
    expect(player.handleSessionIntent('stop', run.ts)).toBe(true);
    const u = run.tick();
    expect(u.phase).toBe('voice_paused');
    expect(u.stopRequested).toBe(true);
  });

  it('skip during rest skips only the rest; skip mid-set skips the exercise', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    const run = startRun(player);
    toFirstSet(run);
    player.handleSessionIntent('done', run.ts);
    run.tickUntil((u) => u.phase === 'rest');
    expect(player.handleSessionIntent('skip', run.ts)).toBe(true);
    const afterRest = run.tickUntil((u) => u.phase === 'waiting_ready');
    expect(afterRest.setIndex).toBe(1);
    expect(afterRest.currentExerciseId).toBe(STS_STANDARD_ID);

    expect(run.player.handleSessionIntent('skip', run.ts)).toBe(true);
    const afterSkip = run.tickUntil((u) => u.currentExerciseId === BALANCE_FEET_TOGETHER_ID);
    expect(afterSkip.phase).not.toBe('done');
  });
});

describe('±rep windows after a final set (founder fix 2026-07-06)', () => {
  it('adjusts through the exercise-complete transition; closes when the next exercise announces', () => {
    const player = makeVoicePlayer([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    const run = startRun(player);
    const sts = getExercise(STS_STANDARD_ID);

    // Finish every STS set; the last completion enters transition directly.
    for (let set = 0; set < sts.prescription.sets; set++) {
      run.tickUntil((u) => u.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil);
      player.confirmReady(run.ts);
      run.tickUntil((u) => u.phase === 'set');
      player.completeCurrentSet((run.ts += 5000));
      if (set < sts.prescription.sets - 1) {
        run.tickUntil((u) => u.phase === 'rest');
        player.skipRest(run.ts);
      }
    }
    const u = run.tick();
    expect(u.phase).toBe('transition');
    expect(player.adjustReportedReps(-1)).toBe(true); // window open post-final-set

    // Next exercise announces → window closed.
    run.tickUntil(() => run.spoken.includes('ex-balance'), 60000);
    expect(player.adjustReportedReps(-1)).toBe(false);

    // Finish the session by taps and check the adjustment landed.
    let guard = 0;
    while (player.result === null && guard++ < 60) {
      const next = run.tickUntil(
        (x) => x.phase === 'done' || (x.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil)
      );
      if (next.phase === 'done') break;
      player.confirmReady(run.ts);
      run.tickUntil((x) => x.phase !== 'countdown' && x.phase !== 'waiting_ready');
    }
    run.tickUntil((x) => x.phase === 'done');
    const stsSets = player.result!.items[0].sets;
    expect(stsSets[stsSets.length - 1].repsAdjusted).toBe(-1);
    expect(stsSets[stsSets.length - 1].reportedReps).toBe((sts.prescription.repsPerSet as number) - 1);
  });

  it("the session's final exercise stays adjustable through the complete phase", () => {
    const player = makeVoicePlayer([STS_STANDARD_ID]);
    const run = startRun(player);
    const sts = getExercise(STS_STANDARD_ID);
    for (let set = 0; set < sts.prescription.sets; set++) {
      run.tickUntil((u) => u.phase === 'waiting_ready' && run.ts >= run.voiceBusyUntil);
      player.confirmReady(run.ts);
      run.tickUntil((u) => u.phase === 'set');
      player.completeCurrentSet((run.ts += 5000));
      if (set < sts.prescription.sets - 1) {
        run.tickUntil((u) => u.phase === 'rest');
        player.skipRest(run.ts);
      }
    }
    run.tickUntil((u) => u.phase === 'complete');
    expect(player.adjustReportedReps(2)).toBe(true);
    run.tickUntil((u) => u.phase === 'done');
    const sets = player.result!.items[0].sets;
    expect(sets[sets.length - 1].repsAdjusted).toBe(2);
    // done = delivered; the summary screen's own control takes over from here.
    expect(player.adjustReportedReps(1)).toBe(false);
  });
});

describe('voice pacing', () => {
  it('exposes the pacing constants for tuning, not magic numbers', () => {
    expect(VOICE_SESSION_TIMING.readyRepromptMs).toBeGreaterThan(0);
    expect(VOICE_SESSION_TIMING.doneRepromptFactor).toBeGreaterThan(1);
  });
});
