/**
 * Bonus-set offer (programme v2, additive player option): the rest window
 * after the FINAL planned set of a listed exercise becomes a once-per-item
 * offer. "I'm ready" grants exactly one extra set; rest expiry or rest-skip
 * declines. Absent option = behaviour byte-identical (pinned by the untouched
 * existing voice-session suites). Uses the injectable catalogue seam — no
 * registry, proving the option works for bridge-resolved exercises.
 */

import type { ExerciseDefinition } from '../../exercises';
import { PreflightCheck } from '../../preflight/preflight';
import type { PlannedExerciseSafetyCueProfile } from '../safetyCueDefinitions';
import { SAFETY_CUE_SCHEMA_VERSION } from '../safetyCueDefinitions';
import { TrainingSessionPlayer, type TrainingSessionPlayerOptions } from '../sessionPlayer';
import { enabledSessionIntents } from '../../voice/sessionIntentPolicy';

function fakeDefinition(id: string): ExerciseDefinition {
  return {
    id,
    displayName: id,
    family: 'test.family',
    level: 1,
    slot: 'lower-push',
    cameraView: { view: 'not_required', requiredReliableSideChains: 1 },
    equipment: ['none'],
    kind: 'reps',
    prescription: { sets: 2, repsPerSet: 8, restSec: 30, autoregulate: false },
    voice: { instructions: ['prog-test-exercise' as never] },
    createGrader: () => {
      throw new Error('voice-only');
    },
  };
}

function fakeProfile(exerciseId: string): PlannedExerciseSafetyCueProfile {
  return {
    schemaVersion: SAFETY_CUE_SCHEMA_VERSION,
    exerciseId,
    setupCueIds: [],
    activeCueIds: ['comfortable_range_only'],
    repeatedSetCueIds: [],
    recoveryCueIds: [],
  };
}

function makePlayer(options: Partial<TrainingSessionPlayerOptions> = {}) {
  return new TrainingSessionPlayer(
    '2026-07-07T09:00:00.000Z',
    ['test.ex'],
    new PreflightCheck(),
    undefined,
    {
      sessionMode: 'voice_guided',
      resolveExercise: fakeDefinition,
      resolveSafetyProfile: fakeProfile,
      generatedExercises: [{ exerciseId: 'test.ex', sets: 2, repsPerSet: 8, restSeconds: 30 }],
      ...options,
    }
  );
}

interface Driver {
  player: TrainingSessionPlayer;
  ts: number;
  busyUntil: number;
  tick(): ReturnType<TrainingSessionPlayer['tick']>;
  until(pred: (u: ReturnType<TrainingSessionPlayer['tick']>) => boolean): ReturnType<TrainingSessionPlayer['tick']>;
}

function drive(player: TrainingSessionPlayer): Driver {
  const d: Driver = {
    player,
    ts: 0,
    busyUntil: -1,
    tick() {
      d.ts += 250;
      const u = player.tick(d.ts, d.ts < d.busyUntil);
      if (u.voice) d.busyUntil = d.ts + u.voice.cues.length * 1000;
      return u;
    },
    until(pred) {
      let u = d.tick();
      const deadline = d.ts + 30 * 60 * 1000;
      while (!pred(u) && d.ts < deadline) u = d.tick();
      if (!pred(u)) throw new Error(`timeout in phase ${u.phase}`);
      return u;
    },
  };
  return d;
}

/** Advance to an idle waiting_ready and confirm it. */
function readyThroughSet(d: Driver): void {
  d.until((x) => x.phase === 'waiting_ready' && d.ts >= d.busyUntil);
  d.player.confirmReady(d.ts);
  d.until((x) => x.phase === 'set');
  d.ts += 2000;
  d.player.completeCurrentSet(d.ts);
}

const OFFER: TrainingSessionPlayerOptions['bonusSetOffer'] = {
  exerciseIds: ['test.ex'],
  offerCue: 'prog-bonus-set-offer',
};

describe('bonus-set offer', () => {
  it('without the option, the final set completes the item (no offer ever)', () => {
    const d = drive(makePlayer());
    readyThroughSet(d); // set 1 → ordinary rest
    expect(d.tick().bonusOfferPending).toBe(false);
    d.player.skipRest(d.ts);
    readyThroughSet(d); // set 2 → item completes
    const end = d.until((x) => x.phase === 'done');
    expect(end.phase).toBe('done');
    expect(d.player.result?.items[0].sets).toHaveLength(2);
  });

  it('offers once after the final planned set; accepting grants exactly one extra set', () => {
    const d = drive(makePlayer({ bonusSetOffer: OFFER }));
    readyThroughSet(d); // set 1 → ordinary rest
    expect(d.tick().bonusOfferPending).toBe(false);
    d.player.skipRest(d.ts);
    readyThroughSet(d); // set 2 → OFFER rest
    const offer = d.tick();
    expect(offer.phase).toBe('rest');
    expect(offer.bonusOfferPending).toBe(true);
    expect(offer.totalSets).toBe(2);

    // 'ready' is live in the offer window (policy) and accepts it.
    expect(enabledSessionIntents('rest', { voiceBusy: false, bonusOfferPending: true })).toContain(
      'ready'
    );
    expect(d.player.handleSessionIntent('ready', d.ts)).toBe(true);
    const set = d.until((x) => x.phase === 'set');
    expect(set.totalSets).toBe(3);
    d.ts += 2000;
    d.player.completeCurrentSet(d.ts);

    // No second offer — the item completes.
    const end = d.until((x) => x.phase === 'done');
    expect(end.phase).toBe('done');
    expect(d.player.result?.items[0].sets).toHaveLength(3);
    expect(d.player.result?.items[0].status).toBe('completed');
  });

  it('rest expiry declines silently and the item completes with planned sets only', () => {
    const d = drive(makePlayer({ bonusSetOffer: OFFER }));
    readyThroughSet(d);
    d.player.skipRest(d.ts);
    readyThroughSet(d);
    expect(d.tick().bonusOfferPending).toBe(true);
    // Let the rest clock run out — silence is a decline.
    const end = d.until((x) => x.phase === 'done');
    expect(end.phase).toBe('done');
    expect(d.player.result?.items[0].sets).toHaveLength(2);
  });

  it("skipping the offer rest declines too (tap parity with 'No thanks')", () => {
    const d = drive(makePlayer({ bonusSetOffer: OFFER }));
    readyThroughSet(d);
    d.player.skipRest(d.ts);
    readyThroughSet(d);
    expect(d.tick().bonusOfferPending).toBe(true);
    expect(d.player.skipRest(d.ts)).toBe(true);
    const end = d.until((x) => x.phase === 'done');
    expect(end.phase).toBe('done');
    expect(d.player.result?.items[0].sets).toHaveLength(2);
  });

  it('never offers for unlisted exercises, and ready stays dead in ordinary rests', () => {
    const d = drive(
      makePlayer({ bonusSetOffer: { exerciseIds: ['someone.else'], offerCue: 'prog-bonus-set-offer' } })
    );
    readyThroughSet(d);
    const rest = d.tick();
    expect(rest.phase).toBe('rest');
    expect(rest.bonusOfferPending).toBe(false);
    expect(enabledSessionIntents('rest', { voiceBusy: false, bonusOfferPending: false })).not.toContain(
      'ready'
    );
    expect(d.player.confirmReady(d.ts)).toBe(false);
    d.player.skipRest(d.ts);
    readyThroughSet(d);
    const end = d.until((x) => x.phase === 'done');
    expect(end.phase).toBe('done');
    expect(d.player.result?.items[0].sets).toHaveLength(2);
  });
});
