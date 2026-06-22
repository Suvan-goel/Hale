/**
 * Audio cue keys + priorities. Pure TS (no Expo imports) so movement
 * definitions and the session controller stay replay-testable; the manifest
 * mapping keys → bundled audio files lives in src/audio/manifest.ts.
 *
 * Per the audio laws: all lines are pre-generated and bundled (no runtime
 * TTS), one line plays at a time, and when the channel is busy a
 * lower-priority line is DROPPED, never queued stale.
 */

import type { SafetyCueId } from '../training/safetyCueDefinitions';

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
  // Check-Up battery orchestration (between-item transitions).
  | 'checkup-intro'
  | 'checkup-complete'
  | 'turn-side-on'
  | 'face-forward'
  | 'next-exercise'
  | 'exercise-skipped'
  // Training exercise instructions (one per family).
  | 'ex-sit-to-stand'
  | 'ex-squat'
  | 'ex-step-up'
  | 'ex-heel-raise'
  | 'ex-glute-bridge'
  | 'ex-push-up'
  | 'ex-overhead'
  | 'ex-hip-hinge'
  | 'ex-balance'
  | 'ex-hamstring-reach'
  | 'ex-neck-rotation'
  | 'ex-march'
  // Training session flow (player orchestration + autoregulation).
  | 'training-intro'
  | 'thats-your-set'
  | 'rest-now'
  | 'next-up'
  | 'last-set'
  | 'set-done'
  | 'cooldown-now'
  | 'session-complete'
  | 'time-to-retest'
  // Weekly micro-check.
  | 'microcheck-intro'
  | 'microcheck-chair'
  | 'microcheck-balance'
  | 'microcheck-complete'
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
  | NumberCueKey
  | SafetyCueId;

/** Non-voice session sounds; play on their own channel, may overlap voice. */
export type SfxCueKey = 'rep-credit';

export type AudioCueKey = VoiceCueKey | SfxCueKey;

/** Highest wins the channel; a busy channel drops lower-or-equal priority. */
export function voicePriority(cue: VoiceCueKey): number {
  if (cue.startsWith('num-')) return 9;
  if (
    cue.startsWith('global_') ||
    cue.startsWith('support_') ||
    cue.startsWith('chair_') ||
    cue.startsWith('floor_') ||
    cue.startsWith('step_') ||
    cue.startsWith('band_') ||
    cue.startsWith('door_anchor_') ||
    cue.startsWith('comfortable_') ||
    cue.startsWith('mobility_') ||
    cue.startsWith('balance_') ||
    cue.startsWith('tracking_')
  ) {
    return cue === 'tracking_pause_and_reset' ? 10 : 8;
  }
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
    case 'checkup-intro':
    case 'checkup-complete':
    case 'turn-side-on':
    case 'face-forward':
    case 'next-exercise':
    case 'exercise-skipped':
    case 'thats-your-set':
    case 'training-intro':
    case 'rest-now':
    case 'next-up':
    case 'last-set':
    case 'set-done':
    case 'cooldown-now':
    case 'session-complete':
    case 'time-to-retest':
    case 'microcheck-intro':
    case 'microcheck-complete':
      return 9; // result lines + between-item / between-set transition guidance
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
    case 'ex-sit-to-stand':
    case 'ex-squat':
    case 'ex-step-up':
    case 'ex-heel-raise':
    case 'ex-glute-bridge':
    case 'ex-push-up':
    case 'ex-overhead':
    case 'ex-hip-hinge':
    case 'ex-balance':
    case 'ex-hamstring-reach':
    case 'ex-neck-rotation':
    case 'ex-march':
    case 'microcheck-chair':
    case 'microcheck-balance':
      return 8; // instructions + exercise narration
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
