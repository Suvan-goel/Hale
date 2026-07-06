/**
 * Voice-activity seam for the dual-task instrument (CLARITY_INSTRUMENTS_TDD
 * §4.3, approved 2026-07-06). Mirrors the intent-matcher pattern: this module
 * is the STABLE SEAM — pure types + validity policy — and everything above it
 * is engine-agnostic. The native monitor (engine choice deferred to
 * device-evening Block 7) implements the interface; CI drives the scripted
 * fake in src/voice/testing/.
 *
 * Privacy posture (unchanged by dual-task, pinned by test): this seam reports
 * PRESENCE of speech only — booleans and milliseconds. There is no API that
 * yields words, transcripts, or audio data. The global "intents only, never
 * transcribed" promise is untouched.
 *
 * Audio-session scope (2026-07-06 second scoped amendment, founder sign-off):
 * the native implementation owns the recording-capable session and holds it
 * ONLY between start() and stop(), restoring playback-only immediately after —
 * the same containment the voice-commands module uses. Device Block 7.4
 * (camera+mic coexistence) is a HARD GATE; until it passes, availability()
 * returns 'unavailable' and the instrument never offers itself.
 */

export type SpeechActivityAvailability = 'available' | 'unavailable';

export interface SpeechActivityEvent {
  speaking: boolean;
  atMs: number;
}

export interface SpeechActivitySummary {
  /** Cumulative milliseconds classified as speech across the whole window. */
  speechActiveMs: number;
  /** Total monitored window in milliseconds. */
  windowMs: number;
}

export interface SpeechActivityMonitor {
  availability(): Promise<SpeechActivityAvailability>;
  start(atMs: number): void;
  stop(atMs: number): SpeechActivitySummary;
  onActivity(listener: (event: SpeechActivityEvent) => void): () => void;
}

/**
 * Verbal-task validity floor — plain data, provisional pre-device-evening
 * (Block 7 tunes it; one iteration allowed under the frozen-criteria rule).
 *
 * F5 requirement of record: long pauses are "still thinking — keep going",
 * NEVER task abandonment. The floor is therefore CUMULATIVE speech over the
 * whole window with no continuity requirement — the effective threshold is
 * min(minSpeechMs, minSpeechFraction × window), so short holds need
 * proportionally little speech and a long silent stretch mid-hold cannot
 * invalidate a trial by itself.
 */
export interface VerbalTaskFloorConfig {
  minSpeechMs: number;
  minSpeechFraction: number;
}

export const DUAL_TASK_VERBAL_FLOOR: VerbalTaskFloorConfig = {
  minSpeechMs: 8000,
  minSpeechFraction: 0.25,
};

/**
 * Did she actually perform the verbal task? Silence below the floor is
 * `no_speech_detected` (she left the verbal task — invalid), which must never
 * be conflated with stopping the MOVEMENT under load (valid degradation, her
 * real capacity — the grader records that normally).
 */
export function verbalTaskPerformed(
  summary: SpeechActivitySummary,
  config: VerbalTaskFloorConfig = DUAL_TASK_VERBAL_FLOOR
): boolean {
  if (summary.windowMs <= 0) return false;
  const required = Math.min(config.minSpeechMs, config.minSpeechFraction * summary.windowMs);
  return summary.speechActiveMs >= required;
}

/**
 * The production monitor. PLANNED state until device Block 7 passes: no
 * native implementation exists yet, so this reports 'unavailable' and the
 * level-2 offer never renders — the instrument records itself honestly as
 * unavailable rather than shipping flaky (F1 hard gate). The native module
 * replaces this after the gate, behind the same interface.
 */
export function defaultSpeechActivityMonitor(): SpeechActivityMonitor {
  return {
    availability: () => Promise.resolve('unavailable'),
    start: () => {
      throw new Error('speech-activity monitor unavailable (device gate pending)');
    },
    stop: () => ({ speechActiveMs: 0, windowMs: 0 }),
    onActivity: () => () => undefined,
  };
}
