/**
 * Audio cue keys + priorities. Pure TS (no Expo imports) so movement
 * definitions and the session controller stay replay-testable; the manifest
 * mapping keys → bundled audio files lives in src/audio/manifest.ts.
 *
 * Per the audio laws: all lines are pre-generated and bundled (no runtime
 * TTS), one line plays at a time, and when the channel is busy a
 * lower-priority line is DROPPED, never queued stale.
 */

/** Spoken number words for stitched results ("You completed" + "twelve" + …). */
export type NumberCueKey = `num-${number}`;

export type VoiceCueKey =
  // Pre-flight framing prompts (mirror PreflightPrompt keys).
  | 'step-into-frame'
  | 'center-yourself'
  | 'step-back'
  | 'step-closer'
  | 'hold-still'
  | 'turn-on-light'
  | 'framing-ready'
  // Chair-stand instructions.
  | 'chair-stand-intro'
  | 'chair-stand-setup'
  // Session flow.
  | 'countdown-three'
  | 'countdown-two'
  | 'countdown-one'
  | 'go'
  | 'times-up'
  // Results.
  | 'you-completed'
  | 'stands-suffix'
  | 'no-reps'
  | NumberCueKey;

/** Non-voice session sounds; play on their own channel, may overlap voice. */
export type SfxCueKey = 'rep-credit';

export type AudioCueKey = VoiceCueKey | SfxCueKey;

/** Highest wins the channel; a busy channel drops lower-or-equal priority. */
export function voicePriority(cue: VoiceCueKey): number {
  if (cue.startsWith('num-')) return 9;
  switch (cue) {
    case 'countdown-three':
    case 'countdown-two':
    case 'countdown-one':
    case 'go':
    case 'times-up':
      return 10;
    case 'you-completed':
    case 'stands-suffix':
    case 'no-reps':
      return 9;
    case 'chair-stand-intro':
    case 'chair-stand-setup':
      return 8;
    default:
      return 5; // pre-flight framing prompts
  }
}

/** Largest number word we bundle; clamp before speaking counts. */
export const MAX_NUMBER_CUE = 40;

export function numberCue(n: number): NumberCueKey {
  const clamped = Math.max(0, Math.min(MAX_NUMBER_CUE, Math.round(n)));
  return `num-${clamped}`;
}
