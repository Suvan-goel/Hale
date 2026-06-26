/**
 * Trainer-voice catalog. Voice lines are pre-generated, bundled audio assets
 * (CLAUDE.md audio rule — no runtime TTS in the session path), so each voice is
 * a full set of recordings synthesized once by scripts/generate-audio.ts via
 * the ElevenLabs API (Multilingual v2 model). The `elevenLabsVoiceId` here is the
 * ElevenLabs voice used at *generation* time only; nothing in the app ever
 * calls ElevenLabs at runtime.
 *
 * V1 ships two voices — one female (Clara), one male (Marcus). `available`
 * gates the Settings picker: a voice is offered only once its bundled set
 * exists. Until `npm run audio` is run with an API key + voice ids, the default
 * voice falls back to the previously-bundled set so the app still speaks.
 */

export interface VoiceOption {
  /** Stable key; also the asset subdirectory under assets/audio/voice/. */
  id: string;
  /** The trainer's name, shown in the picker. */
  label: string;
  /** Short character description for the picker. */
  description: string;
  /** Perceived voice gender — purely descriptive for the picker. */
  gender: 'female' | 'male';
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
    gender: 'female',
    elevenLabsVoiceId: 'rfkTsdZrVWEVhDycUYn9',
    available: true,
  },
  {
    id: 'marcus',
    label: 'Marcus',
    description: 'Steady and clear',
    gender: 'male',
    elevenLabsVoiceId: 'lUTamkMw7gOzZbFIwmq4',
    available: true,
  },
];

export const DEFAULT_VOICE_ID = 'clara';

export function getVoice(id: string): VoiceOption {
  return VOICE_OPTIONS.find((v) => v.id === id) ?? VOICE_OPTIONS[0];
}
