/**
 * Native fluency raw engine (on-device ASR) over expo-voice-commands — built
 * 2026-07-07 under the founder's informal Option-A spike verdict. ALWAYS
 * consumed through createSanitizedFluencyTranscriber (fluencyTranscriber.ts):
 * tokens exist transiently here and die in the counter's scope; every failure
 * leaves as a closed enum code.
 *
 * On-device honesty is native-enforced: iOS errors rather than touching the
 * server (requiresOnDeviceRecognition); Android <12 reports the
 * prefer-offline caveat through availability, which this engine treats as
 * available only when the platform's availability check says so.
 *
 * GATE POSTURE UNCHANGED: production keeps defaultFluencyTranscriber
 * (unavailable) — this engine mounts ONLY behind the dev-only Clarity flag
 * until device Block 8 passes. May only be imported by the check-up fluency
 * path (fluencyPrivacy discipline) — never by session/command code.
 */

import {
  ExpoVoiceCommandsModule,
  getOnDeviceAvailabilityAsync,
  startListeningAsync,
  stopListeningAsync,
  type TranscriptEventPayload,
} from '../../modules/expo-voice-commands';
import type { FluencyTranscriberAvailability, RawFluencyEngine } from './fluencyTranscriber';

export interface NativeFluencyDeps {
  availability(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
  onTranscript(listener: (payload: TranscriptEventPayload) => void): () => void;
  setTimer(fn: () => void, ms: number): () => void;
}

function productionDeps(): NativeFluencyDeps {
  return {
    availability: async () => (await getOnDeviceAvailabilityAsync('en-GB')).available,
    start: () => startListeningAsync({ locale: 'en-GB', continuous: true }),
    stop: () => stopListeningAsync(),
    onTranscript: (listener) => {
      const sub = ExpoVoiceCommandsModule.addListener('onTranscript', listener);
      return () => sub.remove();
    },
    setTimer: (fn, ms) => {
      const id = setTimeout(fn, ms);
      return () => clearTimeout(id);
    },
  };
}

/**
 * One transcription window: accumulate FINAL utterance tokens across the
 * continuous window; the duration timer (or an early stop) closes it and
 * resolves with everything heard so far. Zero tokens after a full window is
 * the caller's 'no_speech' (the sanitizer maps it).
 */
export function createNativeFluencyEngine(deps: NativeFluencyDeps = productionDeps()): RawFluencyEngine {
  let endEarly: (() => void) | null = null;

  return {
    async availability(): Promise<FluencyTranscriberAvailability> {
      try {
        return (await deps.availability()) ? 'available' : 'unavailable';
      } catch {
        return 'unavailable';
      }
    },
    async transcribeOnce(durationSec: number): Promise<{ tokens: readonly string[] }> {
      const tokens: string[] = [];
      let settled = false;
      return new Promise((resolve, reject) => {
        const unsubscribe = deps.onTranscript((payload) => {
          if (settled || !payload.isFinal) return;
          for (const raw of payload.transcript.split(/\s+/)) {
            const token = raw.trim();
            if (token.length > 0) tokens.push(token);
          }
        });
        const finish = () => {
          if (settled) return;
          settled = true;
          endEarly = null;
          cancelTimer();
          unsubscribe();
          void deps.stop().catch(() => undefined);
          resolve({ tokens });
        };
        const cancelTimer = deps.setTimer(finish, Math.max(1, durationSec) * 1000);
        endEarly = finish;
        deps.start().catch((error) => {
          if (settled) return;
          settled = true;
          endEarly = null;
          cancelTimer();
          unsubscribe();
          reject({ code: 'engine_unavailable', cause: error });
        });
      });
    },
    stop() {
      endEarly?.();
    },
  };
}
