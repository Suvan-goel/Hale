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
import type { MovementProfileV2CueId } from '../movementProfileV2/voiceCues';
import type { MicroCheckVoiceLogicalCueKeyV21 } from '../training/microCheckVoiceV21/types';

/** Spoken number words for stitched results ("You completed" + "twelve" + …). */
export type NumberCueKey = `num-${number}`;

export type VoiceCueKey =
  // Settings voice picker.
  | 'voice-preview'
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
  | 'balance-same-leg'
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
  // Voice-guided session flow (logical until the voice-lines generation
  // slice bundles audio — the V2.1 logical-first pattern). Scripts must pass
  // the hot-phrase lint at generation time.
  | 'voice-say-ready'
  | 'voice-say-ready-reprompt'
  | 'voice-done-reprompt'
  | 'voice-resume-counts'
  | 'pain-acknowledge'
  // Training Voice V2.1 logical/runtime cues. Most exercise-specific V2.1
  // keys are logical only until the later physical manifest/audio phase.
  | 'training-intro-v21'
  | 'safe-session-start-v21'
  | 'final-position-set-v21'
  | 'setup-enter-view-v21'
  | 'setup-clearer-view-v21'
  | 'setup-center-v21'
  | 'setup-back-v21'
  | 'setup-closer-v21'
  | 'setup-hold-still-v21'
  | 'setup-light-v21'
  | 'tracking-loss-v21'
  | 'tracking-recovered-v21'
  | 'times-up-v21'
  | 'halfway-v21'
  | 'five-seconds-left-v21'
  | 'paused-v21'
  | 'resuming-v21'
  | 'retry-v21'
  | 'training-skip-v21'
  | 'set-complete-v21'
  | 'rest-now-v21'
  | 'last-set-v21'
  | 'next-exercise-v21'
  | 'session-complete-v21'
  | 'item-complete-v21'
  | 'equip-chair-stable-v21'
  | 'equip-support-close-v21'
  | 'equip-balance-support-v21'
  | 'equip-step-stable-v21'
  | 'equip-long-band-v21'
  | 'equip-door-anchor-v21'
  | 'equip-floor-transition-v21'
  | 'floor-gate-question-v21'
  | 'switch-legs-v21'
  | 'switch-foot-positions-v21'
  | 'switch-sides-v21'
  | 'step-up-next-left-v21'
  | 'step-up-next-right-v21'
  | 'step-up-wrong-left-v21'
  | 'step-up-wrong-right-v21'
  | `ex-${string}-first-v21`
  | `ex-${string}-next-v21`
  | `target-${string}-v21`
  | `side-${string}-v21`
  | `step-up-start-${'left' | 'right'}-v21`
  // Programme engine v2 voice-session lines (src/programme/voiceScripts.ts);
  // generated with the founder audio run, resolved via VOICE_MANIFEST like
  // every plain cue — missing assets degrade through the asset_missing path.
  | `prog-${string}`
  // Eyes-Open Balance V2 stage-specific generated cues.
  | 'checkup-balance-feet-together-v21'
  | 'checkup-balance-semi-tandem-left-v21'
  | 'checkup-balance-semi-tandem-right-v21'
  | 'checkup-balance-tandem-left-v21'
  | 'checkup-balance-tandem-right-v21'
  | 'checkup-balance-single-leg-left-v21'
  | 'checkup-balance-single-leg-right-v21'
  | 'checkup-balance-next-stance-v21'
  | 'checkup-balance-support-touch-v21'
  // Micro-Check Voice V2.1 generated cue keys.
  | MicroCheckVoiceLogicalCueKeyV21
  // Results.
  | 'you-completed'
  | 'stands-suffix'
  | 'no-reps'
  | 'item-complete'
  | NumberCueKey
  | SafetyCueId
  | MovementProfileV2CueId;

/** Non-voice session sounds; play on their own channel, may overlap voice. */
export type SfxCueKey =
  | 'rep-credit'
  | 'measurement-complete'
  | 'tracking-paused'
  | 'tracking-recovered'
  | 'session-complete';


/** Highest wins the channel; a busy channel drops lower-or-equal priority. */
export function voicePriority(cue: VoiceCueKey): number {
  if (cue.startsWith('num-')) return 9;
  // Programme v2 lines: instructions + exercise narration tier.
  if (cue.startsWith('prog-')) return 8;
  if (cue.startsWith('mpv2_') || cue.endsWith('-v21')) {
    if (
      cue.includes('tracking') ||
      cue === 'times-up-v21' ||
      cue === 'mpv2_chair_official_ready'
    ) {
      return 10;
    }
    if (
      cue.includes('complete') ||
      cue.includes('saved') ||
      cue === 'item-complete-v21' ||
      cue === 'checkup-complete-v21'
    ) {
      return 9;
    }
    return 8;
  }
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
    case 'pain-acknowledge': // safety response must never be dropped
      return 10; // window-closing / countdown cues
    case 'voice-say-ready':
    case 'voice-say-ready-reprompt':
    case 'voice-done-reprompt':
      return 8; // session pacing prompts — droppable under busier lines
    case 'voice-resume-counts':
      return 9; // effort-honesty line — a paused set must never read as discarded
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
    case 'balance-same-leg':
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
