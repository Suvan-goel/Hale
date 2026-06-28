import {
  AUDIO_OUTPUT_FORMAT,
  AUDIO_TTS_PROVIDER,
  AUDIO_VOICE_SETTINGS,
  type AudioVoiceSettingsMetadata,
  ELEVENLABS_MODEL,
} from './safetyAudio';

export const VOICE_V2_1_AUDIO_FINGERPRINT_SCHEMA_VERSION = 1 as const;

export interface VoiceV21AudioAssetMetadata {
  readonly schemaVersion: typeof VOICE_V2_1_AUDIO_FINGERPRINT_SCHEMA_VERSION;
  readonly logicalCueKey: string;
  readonly physicalCueKey: string;
  readonly voiceId: string;
  readonly provider: typeof AUDIO_TTS_PROVIDER;
  readonly providerVoiceId: string;
  readonly model: typeof ELEVENLABS_MODEL;
  readonly outputFormat: typeof AUDIO_OUTPUT_FORMAT;
  readonly voiceSettings: AudioVoiceSettingsMetadata;
  readonly path: string;
  readonly script: string;
  readonly fingerprint: string;
  readonly sha256: string;
  readonly fileSizeBytes: number;
  readonly durationMs: number;
  readonly sampleRateHz: number;
  readonly channels: number;
  readonly generatedAt: string;
}

export type VoiceV21AudioMetadataByVoice = Readonly<
  Record<string, Partial<Record<string, VoiceV21AudioAssetMetadata>>>
>;

export function voiceV21AudioExpectedPath(voiceId: string, physicalCueKey: string): string {
  return `assets/audio/voice/${voiceId}/${physicalCueKey}.mp3`;
}

export function voiceV21AudioFingerprint(input: {
  logicalCueKey: string;
  physicalCueKey: string;
  voiceId: string;
  providerVoiceId: string;
  script: string;
}): string {
  const payload = [
    `schema=${VOICE_V2_1_AUDIO_FINGERPRINT_SCHEMA_VERSION}`,
    `logical=${input.logicalCueKey}`,
    `physical=${input.physicalCueKey}`,
    `script=${input.script}`,
    `voice=${input.voiceId}`,
    `provider=${AUDIO_TTS_PROVIDER}`,
    `providerVoice=${input.providerVoiceId}`,
    `model=${ELEVENLABS_MODEL}`,
    `format=${AUDIO_OUTPUT_FORMAT}`,
    `settings=${stableVoiceV21SettingsString()}`,
  ].join('|');
  return `voice-v21-audio-v${VOICE_V2_1_AUDIO_FINGERPRINT_SCHEMA_VERSION}-${fnv1a32(payload)}`;
}

export function stableVoiceV21SettingsString(): string {
  return [
    `similarity_boost:${AUDIO_VOICE_SETTINGS.similarity_boost}`,
    `speed:${AUDIO_VOICE_SETTINGS.speed}`,
    `stability:${AUDIO_VOICE_SETTINGS.stability}`,
    `use_speaker_boost:${AUDIO_VOICE_SETTINGS.use_speaker_boost}`,
  ].join(',');
}

function fnv1a32(value: string): string {
  let hash = 2166136261;
  for (let idx = 0; idx < value.length; idx++) {
    hash ^= value.charCodeAt(idx);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
