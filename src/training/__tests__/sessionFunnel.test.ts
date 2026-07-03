/**
 * Setup-funnel instrumentation: the tracker in isolation, then through a
 * headless TrainingSessionPlayer run (synthetic feed → PosePipeline → player),
 * so funnel numbers are asserted against the same deterministic frame clock
 * the player runs on — a replayed recording must reproduce them exactly.
 */

import { BRIDGE_HOLD_ID, STS_STANDARD_ID, NECK_ROTATION_ID } from '../../exercises';
import { PosePipeline } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { RawLandmarkEvent } from '../../pose/types';
import {
  PreflightCheck,
  TRAINING_PREFLIGHT_CONFIG,
  type PreflightConfig,
} from '../../preflight/preflight';
import { SessionFunnelTracker } from '../sessionFunnel';
import {
  DEFAULT_TRAINING_CONFIG,
  TrainingPlayerConfig,
  TrainingSessionPlayer,
  TrainingSessionResult,
  type TrainingFrameUpdate,
} from '../sessionPlayer';

const FRAME_MS = 1000 / 30;
const CUE_PLAY_MS = 1200;

describe('SessionFunnelTracker', () => {
  it('records per-item framing/first-set durations and session firsts', () => {
    const t = new SessionFunnelTracker();
    t.sessionStarted(1000);
    t.itemSetupStarted('a', 5000);
    t.framingReady(8000);
    t.setStarted(12000);
    t.setStarted(30000); // second set: firsts must not move
    t.repCredited(14000);
    t.repCredited(15000);
    t.itemSetupStarted('b', 40000);
    t.setStarted(45000);

    const snap = t.snapshot('complete', false);
    expect(snap.items).toEqual([
      { exerciseId: 'a', framingMs: 3000, toFirstSetMs: 7000, setupIssues: 0, skippedDuringSetup: false },
      { exerciseId: 'b', framingMs: null, toFirstSetMs: 5000, setupIssues: 0, skippedDuringSetup: false },
    ]);
    expect(snap.timeToFirstSetMs).toBe(11000);
    expect(snap.timeToFirstRepMs).toBe(13000);
    expect(snap.setupIssueCount).toBe(0);
    expect(snap.endedInPhase).toBe('complete');
    expect(snap.completed).toBe(false);
  });

  it('marks a skip as a setup skip only before the first set', () => {
    const t = new SessionFunnelTracker();
    t.sessionStarted(0);
    t.itemSetupStarted('a', 100);
    t.setupIssueLatched();
    t.itemSkipped();
    t.itemSetupStarted('b', 5000);
    t.setStarted(6000);
    t.itemSkipped(); // mid-work skip — not a setup skip

    const snap = t.snapshot('preflight', false);
    expect(snap.items[0].skippedDuringSetup).toBe(true);
    expect(snap.items[0].setupIssues).toBe(1);
    expect(snap.items[1].skippedDuringSetup).toBe(false);
    expect(snap.setupIssueCount).toBe(1);
  });

  it('shiftTiming keeps in-flight durations pause-free', () => {
    const t = new SessionFunnelTracker();
    t.sessionStarted(0);
    t.itemSetupStarted('a', 1000);
    t.shiftTiming(60000); // one-minute pause mid-setup
    t.framingReady(64000); // frame clock resumed at 61000 + 3000 of real framing
    const snap = t.snapshot('preflight', false);
    expect(snap.items[0].framingMs).toBe(3000);
  });

  it('snapshots are detached copies', () => {
    const t = new SessionFunnelTracker();
    t.sessionStarted(0);
    t.itemSetupStarted('a', 100);
    const snap = t.snapshot('preflight', false);
    snap.items[0].setupIssues = 99;
    expect(t.snapshot('preflight', false).items[0].setupIssues).toBe(0);
  });
});

function runSession(
  exerciseIds: string[],
  frameAt: (ts: number) => RawLandmarkEvent,
  config: TrainingPlayerConfig,
  maxFrames = 60000,
  onUpdate?: (update: TrainingFrameUpdate, player: TrainingSessionPlayer) => void,
  preflightConfig?: PreflightConfig
): { result: TrainingSessionResult | null; player: TrainingSessionPlayer } {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck(preflightConfig);
  const player = new TrainingSessionPlayer('2026-07-03T09:00:00.000Z', exerciseIds, preflight, config);
  let voiceBusyUntil = -1;
  let ts = 0;
  for (let frames = 0; frames < maxFrames; frames++, ts += FRAME_MS) {
    const out = pipeline.process(frameAt(Math.round(ts)));
    const u = player.update(out, ts < voiceBusyUntil);
    onUpdate?.(u, player);
    if (u.voice) voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
    if (u.phase === 'done') break;
  }
  return { result: player.result, player };
}

function framedStanding(seed = 7): (ts: number) => RawLandmarkEvent {
  const rng = mulberry32(seed);
  return (ts: number) => makeFrame(ts, rng);
}

describe('TrainingSessionPlayer — funnel', () => {
  const config: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, setSafetyMs: 4000 };

  it('a completed session carries a full funnel in its result', () => {
    const { result } = runSession([STS_STANDARD_ID, NECK_ROTATION_ID], framedStanding(), config);
    const funnel = result?.funnel;
    expect(funnel).toBeDefined();
    if (!funnel) return;
    expect(funnel.completed).toBe(true);
    expect(funnel.endedInPhase).toBe('done');
    expect(funnel.setupIssueCount).toBe(0);
    expect(funnel.items.map((i) => i.exerciseId)).toEqual([STS_STANDARD_ID, NECK_ROTATION_ID]);
    for (const item of funnel.items) {
      expect(item.framingMs).toBeGreaterThan(0);
      expect(item.toFirstSetMs).toBeGreaterThan(item.framingMs as number);
      expect(item.skippedDuringSetup).toBe(false);
    }
    expect(funnel.timeToFirstSetMs).toBeGreaterThan(0);
    // The synthetic subject stands still: sets end on the safety cap, no reps.
    expect(funnel.timeToFirstRepMs).toBeNull();
  });

  it('records setup-issue latches and setup skips when framing never succeeds', () => {
    const issueConfig: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, maxFramingMs: 3000 };
    const { result } = runSession(
      [STS_STANDARD_ID, NECK_ROTATION_ID],
      (ts) => ({ timestampMs: ts, landmarks: [] }),
      issueConfig,
      8000,
      (u, player) => {
        if (u.setupIssue) player.skipCurrentItem();
      }
    );
    const funnel = result?.funnel;
    expect(funnel).toBeDefined();
    if (!funnel) return;
    expect(funnel.setupIssueCount).toBe(2);
    for (const item of funnel.items) {
      expect(item.setupIssues).toBe(1);
      expect(item.skippedDuringSetup).toBe(true);
      expect(item.framingMs).toBeNull();
      expect(item.toFirstSetMs).toBeNull();
    }
    expect(funnel.timeToFirstSetMs).toBeNull();
  });

  // Preflight keeps evaluating through intro/transition, so once the session
  // has banked one full pass, a short re-verification usually finishes inside
  // the transition dwell and the preflight phase is nearly instant. The
  // observable contrast is against a camera-view change, which revokes the
  // fast path and pushes the full 2s sample past the transition.
  it('with the training preflight config, a same-view second item frames on the short sample', () => {
    // Chair stand → bridge: both side-view, so the fast path applies.
    const { result } = runSession(
      [STS_STANDARD_ID, BRIDGE_HOLD_ID],
      framedStanding(),
      config,
      60000,
      undefined,
      TRAINING_PREFLIGHT_CONFIG
    );
    const items = result?.funnel?.items ?? [];
    expect(items[1].framingMs).toBeLessThan(600);
  });

  it('a camera-view change demands the full sample again', () => {
    // Chair stand (side) → neck rotations (front): the turn revokes the fast path.
    const { result } = runSession(
      [STS_STANDARD_ID, NECK_ROTATION_ID],
      framedStanding(),
      config,
      60000,
      undefined,
      TRAINING_PREFLIGHT_CONFIG
    );
    const items = result?.funnel?.items ?? [];
    expect(items[1].framingMs).toBeGreaterThan(600);
  });

  it('funnelSnapshot reports an unfinished session honestly (abandonment path)', () => {
    let midSession: ReturnType<TrainingSessionPlayer['funnelSnapshot']> | null = null;
    runSession([STS_STANDARD_ID], framedStanding(), config, 60000, (u, player) => {
      if (u.phase === 'set' && !midSession) midSession = player.funnelSnapshot();
    });
    expect(midSession).not.toBeNull();
    expect(midSession!.completed).toBe(false);
    expect(midSession!.endedInPhase).toBe('set');
    expect(midSession!.timeToFirstSetMs).toBeGreaterThan(0);
  });
});
