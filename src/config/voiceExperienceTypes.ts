export type VoiceExperienceMode = 'v21_beta' | 'legacy';

export const DEFAULT_VOICE_EXPERIENCE_MODE: VoiceExperienceMode = 'v21_beta';

export function parseVoiceExperienceMode(value: unknown): VoiceExperienceMode | null {
  return value === 'v21_beta' || value === 'legacy' ? value : null;
}

export function isVoiceExperienceMode(value: unknown): value is VoiceExperienceMode {
  return parseVoiceExperienceMode(value) !== null;
}
