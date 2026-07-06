/**
 * Fluency transcription seam (CLARITY_INSTRUMENTS_TDD §5.4–5.5, FL1).
 *
 * THE PRIVACY MODEL, IN ONE MODULE (recorded decision 2026-07-06; the
 * CLAUDE.md second scoped amendment names it):
 * - The app-wide promise for COMMANDS and SAFETY WORDS is untouched: intents
 *   only, never transcribed. This seam exists for exactly one thing — the
 *   optional, per-use-consented, ~60-second fluency check inside the official
 *   check-up — and nothing else may import it into a session/command path.
 * - Transcription is ON-DEVICE ONLY. There is no server fallback; an engine
 *   that cannot guarantee on-device processing must report 'unavailable'
 *   (the iOS on-device flag errors rather than silently using the server —
 *   that honesty property is required of any implementation).
 * - STRUCTURAL CONTAINMENT, not convention: the seam NEVER RETURNS WORDS.
 *   `countWords` hands the token list to a counting callback and returns only
 *   that callback's numeric output — tokens exist inside the callback scope
 *   and die there. No API on this interface yields transcripts or audio, so
 *   "no transcript can reach any store, telemetry, or backup" is a property
 *   of the type system, pinned by fluencyPrivacy.test.ts at the same rigor
 *   as the pain-audit and reported-vs-measured guarantees.
 *
 * The native implementation is PLANNED until device-evening Block 8 passes;
 * the default below reports 'unavailable' so the fluency segment never offers
 * itself in production (recorded limitation, never flaky).
 */

export type FluencyTranscriberAvailability = 'available' | 'unavailable';

/**
 * The ONLY error vocabulary that may leave the seam (founder hardening
 * requirement 2, 2026-07-06): closed enum codes. Speech engines embed
 * recognized text in error messages and result metadata — none of that may
 * propagate to throws, Sentry, logs, or any store. Engine adapters go through
 * createSanitizedFluencyTranscriber below, which drops every engine-provided
 * object at the boundary.
 */
export type FluencyCountFailure =
  | 'engine_unavailable'
  | 'permission_denied'
  | 'timeout'
  | 'recognition_failed'
  | 'no_speech';

export type FluencyCountOutcome =
  | { ok: true; validWordCount: number }
  | { ok: false; reason: FluencyCountFailure };

export interface FluencyTranscriber {
  availability(): Promise<FluencyTranscriberAvailability>;
  /**
   * Run one on-device transcription window and reduce it to a count. The
   * counter receives the tokens ONCE, synchronously, and only its number
   * leaves this call. Implementations must discard all audio and text before
   * resolving. COUNTER PURITY CONTRACT: the counter must be a pure function
   * (tokens in, number out) — no I/O, no logging, no telemetry, no closure
   * capture of tokens; see src/checkup/fluencyCounting.ts, where counting
   * rules live inside an enforced scan.
   *
   * Never rejects: every failure is a closed enum code in the outcome.
   */
  countWords(
    durationSec: 60,
    counter: (tokens: readonly string[]) => number
  ): Promise<FluencyCountOutcome>;
  /** Optional early stop ("I'm done") — resolves the running window early. */
  stop?(): void;
}

/**
 * The UNTRUSTED side: a raw engine adapter (native module wrapper). It may
 * throw anything, reject with anything, and attach arbitrary metadata to its
 * results — all of it is dropped by the sanitizer. The only engine field the
 * sanitizer reads is an optional `code` ENUM VALUE (never message text).
 */
export interface RawFluencyEngine {
  availability(): Promise<FluencyTranscriberAvailability>;
  transcribeOnce(durationSec: number): Promise<{ tokens: readonly string[] }>;
  stop?(): void;
}

const RAW_ENGINE_CODES: readonly FluencyCountFailure[] = [
  'engine_unavailable',
  'permission_denied',
  'timeout',
  'recognition_failed',
  'no_speech',
];

function failureCodeFrom(error: unknown): FluencyCountFailure {
  // Only a closed enum `code` field is ever read — never message text, never
  // the error object itself. Everything else maps to recognition_failed.
  const code = (error as { code?: unknown } | null)?.code;
  return RAW_ENGINE_CODES.includes(code as FluencyCountFailure)
    ? (code as FluencyCountFailure)
    : 'recognition_failed';
}

/**
 * The mandatory adapter path for ANY engine implementation (the post-Block-8
 * native module included): catches everything, maps to enum codes, never
 * rethrows, never logs, and lets tokens exist only inside the counter call.
 */
export function createSanitizedFluencyTranscriber(engine: RawFluencyEngine): FluencyTranscriber {
  return {
    async availability() {
      try {
        return await engine.availability();
      } catch {
        return 'unavailable';
      }
    },
    async countWords(durationSec, counter) {
      try {
        const window = await engine.transcribeOnce(durationSec);
        const tokens = Array.isArray(window?.tokens) ? window.tokens.filter((t) => typeof t === 'string') : null;
        if (tokens === null) return { ok: false, reason: 'recognition_failed' };
        if (tokens.length === 0) return { ok: false, reason: 'no_speech' };
        const validWordCount = counter(tokens);
        if (!Number.isFinite(validWordCount) || validWordCount < 0) {
          return { ok: false, reason: 'recognition_failed' };
        }
        return { ok: true, validWordCount: Math.floor(validWordCount) };
      } catch (error) {
        return { ok: false, reason: failureCodeFrom(error) };
      }
    },
    stop: engine.stop ? () => engine.stop?.() : undefined,
  };
}

/**
 * Production default — the PLANNED state until device Block 8 passes: no
 * native on-device ASR exists yet, so fluency reports itself unavailable and
 * the consent screen never renders. Replaced by the native module ONLY after
 * the gate, behind this same interface (and through the sanitizer above).
 */
export function defaultFluencyTranscriber(): FluencyTranscriber {
  return {
    availability: () => Promise.resolve('unavailable'),
    countWords: () => Promise.resolve({ ok: false, reason: 'engine_unavailable' }),
  };
}
