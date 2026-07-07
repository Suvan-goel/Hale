/**
 * Native SpeechActivityMonitor (dual-task VAD) over the expo-voice-commands
 * presence-only mode — built 2026-07-07 under the founder's informal Option-A
 * spike verdict (decisions.md).
 *
 * Privacy: the native window runs presenceOnly — transcript events are
 * suppressed native-side, so no text ever crosses the bridge in the check-up
 * flow. This module only ever sees {speaking, timestampMs} booleans.
 *
 * GATE POSTURE UNCHANGED: production wiring keeps defaultSpeechActivityMonitor
 * (unavailable) — this monitor mounts ONLY behind the dev-only Clarity flag
 * until device Block 7 (incl. the 7.4 camera+mic coexistence HARD GATE)
 * passes. Unavailable, never flaky.
 */

import {
  getOnDeviceAvailabilityAsync,
  startListeningAsync,
  stopListeningAsync,
  ExpoVoiceCommandsModule,
  type SpeechActivityEventPayload,
} from '../../modules/expo-voice-commands';
import type {
  SpeechActivityEvent,
  SpeechActivityMonitor,
  SpeechActivitySummary,
} from './speechActivity';

/** Heartbeat hangover: speech is assumed over this long after the last native pulse. */
const SPEECH_HANGOVER_MS = 800;

export interface NativeSpeechActivityDeps {
  availability(): Promise<boolean>;
  start(): void;
  stop(): void;
  /** Subscribe to native presence events; returns unsubscribe. */
  onNativeActivity(listener: (payload: SpeechActivityEventPayload) => void): () => void;
  nowMs(): number;
}

function productionDeps(): NativeSpeechActivityDeps {
  return {
    availability: async () => (await getOnDeviceAvailabilityAsync('en-GB')).available,
    start: () => {
      void startListeningAsync({ locale: 'en-GB', continuous: true, presenceOnly: true }).catch(
        () => undefined
      );
    },
    stop: () => {
      void stopListeningAsync().catch(() => undefined);
    },
    onNativeActivity: (listener) => {
      const sub = ExpoVoiceCommandsModule.addListener('onSpeechActivity', listener);
      return () => sub.remove();
    },
    nowMs: () => Date.now(),
  };
}

/**
 * Accumulation semantics: native `speaking: true` pulses open (or extend) a
 * speech segment; `speaking: false` closes it at the event time; a segment
 * with no explicit close is capped at lastPulse + hangover (engine hiccups
 * must never inflate speech time). Cumulative only — long pauses just stop
 * accumulating (F5: pauses are "still thinking", never abandonment).
 */
export function createNativeSpeechActivityMonitor(
  deps: NativeSpeechActivityDeps = productionDeps()
): SpeechActivityMonitor {
  let running = false;
  let startedAtMs = 0;
  let accumulatedMs = 0;
  let segmentStartMs: number | null = null;
  let lastPulseMs = 0;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<(event: SpeechActivityEvent) => void>();

  const closeSegment = (atMs: number) => {
    if (segmentStartMs === null) return;
    const cappedEnd = Math.min(atMs, lastPulseMs + SPEECH_HANGOVER_MS);
    accumulatedMs += Math.max(0, cappedEnd - segmentStartMs);
    segmentStartMs = null;
  };

  return {
    availability: async () => {
      try {
        return (await deps.availability()) ? 'available' : 'unavailable';
      } catch {
        return 'unavailable';
      }
    },
    start(atMs: number) {
      if (running) return;
      running = true;
      startedAtMs = atMs;
      accumulatedMs = 0;
      segmentStartMs = null;
      const startedAtWall = deps.nowMs();
      unsubscribe = deps.onNativeActivity((payload) => {
        if (!running) return;
        const eventAtMs = atMs + Math.max(0, deps.nowMs() - startedAtWall);
        if (payload.speaking) {
          lastPulseMs = eventAtMs;
          if (segmentStartMs === null) segmentStartMs = eventAtMs;
          for (const listener of listeners) listener({ speaking: true, atMs: eventAtMs });
        } else {
          closeSegment(eventAtMs);
          for (const listener of listeners) listener({ speaking: false, atMs: eventAtMs });
        }
      });
      deps.start();
    },
    stop(atMs: number): SpeechActivitySummary {
      if (!running) return { speechActiveMs: 0, windowMs: 0 };
      running = false;
      closeSegment(atMs);
      unsubscribe?.();
      unsubscribe = null;
      deps.stop();
      return {
        speechActiveMs: Math.round(accumulatedMs),
        windowMs: Math.max(0, atMs - startedAtMs),
      };
    },
    onActivity(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
