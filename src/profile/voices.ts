/**
 * Trainer-voice catalog. Voice lines are pre-generated, bundled audio assets
 * (CLAUDE.md audio rule — no runtime TTS in the session path), so each voice is
 * a full set of recordings synthesized once by scripts/generate-audio.ts via
 * the ElevenLabs API (Multilingual v2 model). The `elevenLabsVoiceId` here is the
 * ElevenLabs voice used at *generation* time only; nothing in the app ever
 * calls ElevenLabs at runtime.
 *
 * Pearl ships Clara as its sole trainer voice. `available` gates the Settings
 * preview: a voice is exposed only once its bundled set exists.
 */

export interface VoiceOption {
  /** Stable key; also the asset subdirectory under assets/audio/voice/. */
  id: string;
  /** The trainer's name, shown in the picker. */
  label: string;
  /** Short character description for the picker. */
  description: string;
  /**
   * ElevenLabs voice id used to synthesize this voice's bundled lines. Used by
   * scripts/generate-audio.ts at build time only (never at runtime). Empty
   * until the real id is supplied.
   */
  elevenLabsVoiceId: string;
  /** Whether a complete bundled audio set exists for this voice today. */
  available: boolean;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'clara',
    label: 'Clara',
    description: 'Warm and reassuring',
    elevenLabsVoiceId: 'rfkTsdZrVWEVhDycUYn9',
    available: true,
  },
];

export const DEFAULT_VOICE_ID = 'clara';

export function getVoice(id: string): VoiceOption {
  return (
    VOICE_OPTIONS.find((v) => v.id === id) ??
    VOICE_OPTIONS.find((v) => v.id === DEFAULT_VOICE_ID) ??
    VOICE_OPTIONS[0]
  );
}
