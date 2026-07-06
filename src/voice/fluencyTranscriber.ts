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

export type FluencyCountFailure =
  | 'unavailable'
  | 'permission_denied'
  | 'transcriber_failed'
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
   * resolving.
   */
  countWords(
    durationSec: 60,
    counter: (tokens: readonly string[]) => number
  ): Promise<FluencyCountOutcome>;
}

/**
 * Production default — the PLANNED state until device Block 8 passes: no
 * native on-device ASR exists yet, so fluency reports itself unavailable and
 * the consent screen never renders. Replaced by the native module ONLY after
 * the gate, behind this same interface.
 */
export function defaultFluencyTranscriber(): FluencyTranscriber {
  return {
    availability: () => Promise.resolve('unavailable'),
    countWords: () => Promise.resolve({ ok: false, reason: 'unavailable' }),
  };
}
