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
  // Balance ladder instructions + stage cues (spoken mid-activity).
  | 'balance-intro'
  | 'balance-setup'
  | 'balance-feet-together'
  | 'balance-semi-tandem'
  | 'balance-tandem'
  | 'balance-single-leg'
  | 'close-your-eyes'
  | 'open-your-eyes'
  // Timed Up and Go instructions.
  | 'tug-intro'
  | 'tug-setup'
  // Shoulder flexion instructions + closing cue.
  | 'shoulder-intro'
  | 'shoulder-setup'
  | 'relax-arm'
  // Hinge reach instructions + closing cue.
  | 'hinge-intro'
  | 'hinge-setup'
  | 'stand-tall'
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
  | 'item-complete'
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
    case 'relax-arm':
    case 'stand-tall':
      return 10; // window-closing / countdown cues
    case 'you-completed':
    case 'stands-suffix':
    case 'no-reps':
    case 'item-complete':
      return 9; // result lines
    case 'chair-stand-intro':
    case 'chair-stand-setup':
    case 'balance-intro':
    case 'balance-setup':
    case 'balance-feet-together':
    case 'balance-semi-tandem':
    case 'balance-tandem':
    case 'balance-single-leg':
    case 'close-your-eyes':
    case 'open-your-eyes':
    case 'tug-intro':
    case 'tug-setup':
    case 'shoulder-intro':
    case 'shoulder-setup':
    case 'hinge-intro':
    case 'hinge-setup':
      return 8; // instructions + balance stage narration
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
