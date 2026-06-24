export const MPV2_VOICE_RUNTIME_FOUNDATION_ENV =
  'EXPO_PUBLIC_ENABLE_MPV2_VOICE_RUNTIME_FOUNDATION';

export function parseMpv2VoiceRuntimeFoundationFlag(value: unknown): boolean {
  return value !== '0';
}

export const MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED = parseMpv2VoiceRuntimeFoundationFlag(
  process.env.EXPO_PUBLIC_ENABLE_MPV2_VOICE_RUNTIME_FOUNDATION
);
