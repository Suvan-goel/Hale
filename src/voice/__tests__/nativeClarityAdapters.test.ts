/**
 * Native clarity-audio adapters (built 2026-07-07 under the informal Option-A
 * verdict), tested through their injectable deps — no native module. The gate
 * posture is pinned elsewhere: production defaults stay 'unavailable' until
 * device Blocks 7–8 pass; these tests cover the adapter logic that Session B
 * will exercise on-device.
 */

import { createSanitizedFluencyTranscriber } from '../fluencyTranscriber';
import { createNativeFluencyEngine, type NativeFluencyDeps } from '../nativeFluency';
import {
  createNativeSpeechActivityMonitor,
  type NativeSpeechActivityDeps,
} from '../nativeSpeechActivity';
import type { SpeechActivityEventPayload } from '../../../modules/expo-voice-commands';

// ---------------------------------------------------------------------------
// Speech-activity monitor
// ---------------------------------------------------------------------------

function activityHarness(availability = true) {
  let emit: ((payload: SpeechActivityEventPayload) => void) | null = null;
  let wallMs = 0;
  const calls: string[] = [];
  const deps: NativeSpeechActivityDeps = {
    availability: async () => availability,
    start: () => calls.push('start'),
    stop: () => calls.push('stop'),
    onNativeActivity: (listener) => {
      emit = listener;
      return () => {
        emit = null;
      };
    },
    nowMs: () => wallMs,
  };
  return {
    monitor: createNativeSpeechActivityMonitor(deps),
    calls,
    setWall: (ms: number) => {
      wallMs = ms;
    },
    pulse: (speaking: boolean) => emit?.({ speaking, timestampMs: wallMs }),
  };
}

describe('native speech-activity monitor', () => {
  it('accumulates closed speech segments into the summary (presence only)', () => {
    const h = activityHarness();
    h.setWall(1000);
    h.monitor.start(0);
    h.setWall(2000); // speech starts 1s in
    h.pulse(true);
    h.setWall(4000); // heartbeats keep the segment open
    h.pulse(true);
    h.setWall(5000); // explicit close at 4s
    h.pulse(false);
    const summary = h.monitor.stop(10000);
    // Segment: 1000→4000 (close capped at lastPulse+hangover = 3800).
    expect(summary.speechActiveMs).toBe(2800);
    expect(summary.windowMs).toBe(10000);
    expect(h.calls).toEqual(['start', 'stop']);
  });

  it('caps an unclosed segment at the last pulse plus hangover — hiccups never inflate speech', () => {
    const h = activityHarness();
    h.setWall(0);
    h.monitor.start(0);
    h.pulse(true); // opens at 0
    h.setWall(1000);
    h.pulse(true); // last pulse at 1000
    const summary = h.monitor.stop(60000); // never closed natively
    expect(summary.speechActiveMs).toBe(1800); // 0 → 1000+800
    expect(summary.windowMs).toBe(60000);
  });

  it('reports availability from the platform and maps failures to unavailable', async () => {
    await expect(activityHarness(true).monitor.availability()).resolves.toBe('available');
    await expect(activityHarness(false).monitor.availability()).resolves.toBe('unavailable');
    const throwing = createNativeSpeechActivityMonitor({
      availability: () => Promise.reject(new Error('boom')),
      start: () => undefined,
      stop: () => undefined,
      onNativeActivity: () => () => undefined,
      nowMs: () => 0,
    });
    await expect(throwing.availability()).resolves.toBe('unavailable');
  });

  it('emits presence events (booleans only) to subscribers while running', () => {
    const h = activityHarness();
    const seen: { speaking: boolean }[] = [];
    h.monitor.onActivity((event) => seen.push({ speaking: event.speaking }));
    h.setWall(0);
    h.monitor.start(0);
    h.pulse(true);
    h.pulse(false);
    h.monitor.stop(5000);
    expect(seen).toEqual([{ speaking: true }, { speaking: false }]);
  });
});

// ---------------------------------------------------------------------------
// Fluency engine (through the mandatory sanitizer)
// ---------------------------------------------------------------------------

function fluencyHarness(options: { failStart?: boolean; availability?: boolean } = {}) {
  let emit: ((payload: { transcript: string; isFinal: boolean; timestampMs: number }) => void) | null =
    null;
  let fireTimer: (() => void) | null = null;
  const deps: NativeFluencyDeps = {
    availability: async () => options.availability ?? true,
    start: () => (options.failStart ? Promise.reject(new Error('mic busy')) : Promise.resolve()),
    stop: () => Promise.resolve(),
    onTranscript: (listener) => {
      emit = listener;
      return () => {
        emit = null;
      };
    },
    setTimer: (fn) => {
      fireTimer = fn;
      return () => {
        fireTimer = null;
      };
    },
  };
  return {
    engine: createNativeFluencyEngine(deps),
    say: (transcript: string, isFinal = true) => emit?.({ transcript, isFinal, timestampMs: 0 }),
    elapse: () => fireTimer?.(),
  };
}

describe('native fluency engine (sanitized)', () => {
  it('accumulates final-utterance tokens across the window; the count leaves, tokens die in scope', async () => {
    const h = fluencyHarness();
    const transcriber = createSanitizedFluencyTranscriber(h.engine);
    const pending = transcriber.countWords(60, (tokens) => tokens.length);
    h.say('cat dog', true);
    h.say('partial noise', false); // partials never counted
    h.say('heron', true);
    h.elapse();
    await expect(pending).resolves.toEqual({ ok: true, validWordCount: 3 });
  });

  it('a silent window sanitizes to no_speech', async () => {
    const h = fluencyHarness();
    const transcriber = createSanitizedFluencyTranscriber(h.engine);
    const pending = transcriber.countWords(60, (tokens) => tokens.length);
    h.elapse();
    await expect(pending).resolves.toEqual({ ok: false, reason: 'no_speech' });
  });

  it('early stop resolves with everything heard so far', async () => {
    const h = fluencyHarness();
    const transcriber = createSanitizedFluencyTranscriber(h.engine);
    const pending = transcriber.countWords(60, (tokens) => tokens.length);
    h.say('owl badger fox', true);
    transcriber.stop?.();
    await expect(pending).resolves.toEqual({ ok: true, validWordCount: 3 });
  });

  it('a start failure leaves only a closed enum code — never the engine error', async () => {
    const h = fluencyHarness({ failStart: true });
    const transcriber = createSanitizedFluencyTranscriber(h.engine);
    await expect(transcriber.countWords(60, (tokens) => tokens.length)).resolves.toEqual({
      ok: false,
      reason: 'engine_unavailable',
    });
  });

  it('availability maps platform checks and failures honestly', async () => {
    await expect(fluencyHarness({ availability: true }).engine.availability()).resolves.toBe(
      'available'
    );
    await expect(fluencyHarness({ availability: false }).engine.availability()).resolves.toBe(
      'unavailable'
    );
  });
});
