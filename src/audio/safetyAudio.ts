import { VOICE_OPTIONS } from '../profile/voices';
import {
  SAFETY_CUE_DEFINITIONS,
  SAFETY_CUE_SCHEMA_VERSION,
  safetyCueText,
  type SafetyCueId,
} from '../training/safetyCueDefinitions';

export const AUDIO_TTS_PROVIDER = 'elevenlabs' as const;
export const ELEVENLABS_MODEL = 'eleven_multilingual_v2' as const;
export const AUDIO_OUTPUT_FORMAT = 'mp3_44100_128' as const;
export const SAFETY_AUDIO_FINGERPRINT_SCHEMA_VERSION = 1 as const;

export type AudioVoiceSettingsMetadata = Readonly<{
  stability: number;
  similarity_boost: number;
  use_speaker_boost: boolean;
  speed: number;
}>;

export const AUDIO_VOICE_SETTINGS = {
  stability: 0.35,
  similarity_boost: 0.85,
  use_speaker_boost: true,
  speed: 0.92,
} as const satisfies AudioVoiceSettingsMetadata;

export interface SafetyAudioAssetMetadata {
  schemaVersion: typeof SAFETY_AUDIO_FINGERPRINT_SCHEMA_VERSION;
  cueSchemaVersion: typeof SAFETY_CUE_SCHEMA_VERSION;
  cueId: SafetyCueId;
  voiceId: string;
  provider: typeof AUDIO_TTS_PROVIDER;
  providerVoiceId: string;
  model: typeof ELEVENLABS_MODEL;
  outputFormat: typeof AUDIO_OUTPUT_FORMAT;
  path: string;
  fingerprint: string;
}

export type SafetyAudioMetadataByVoice = Readonly<
  Record<string, Partial<Record<SafetyCueId, SafetyAudioAssetMetadata>>>
>;

export function safetyAudioCueIds(): SafetyCueId[] {
  return Object.keys(SAFETY_CUE_DEFINITIONS).sort() as SafetyCueId[];
}

export function safetyAudioExpectedPath(voiceId: string, cueId: SafetyCueId): string {
  return `assets/audio/voice/${voiceId}/${cueId}.mp3`;
}

export function safetyAudioFingerprint(input: {
  cueId: SafetyCueId;
  voiceId: string;
  providerVoiceId: string;
  text?: string;
}): string {
  const payload = [
    `schema=${SAFETY_AUDIO_FINGERPRINT_SCHEMA_VERSION}`,
    `cueSchema=${SAFETY_CUE_SCHEMA_VERSION}`,
    `cue=${input.cueId}`,
    `text=${input.text ?? safetyCueText(input.cueId)}`,
    `voice=${input.voiceId}`,
    `provider=${AUDIO_TTS_PROVIDER}`,
    `providerVoice=${input.providerVoiceId}`,
    `model=${ELEVENLABS_MODEL}`,
    `format=${AUDIO_OUTPUT_FORMAT}`,
    `settings=${stableSettingsString()}`,
  ].join('|');
  return `safety-audio-v${SAFETY_AUDIO_FINGERPRINT_SCHEMA_VERSION}-${fnv1a32(payload)}`;
}

export function safetyAudioMetadataFor(input: {
  cueId: SafetyCueId;
  voiceId: string;
  providerVoiceId: string;
}): SafetyAudioAssetMetadata {
  return {
    schemaVersion: SAFETY_AUDIO_FINGERPRINT_SCHEMA_VERSION,
    cueSchemaVersion: SAFETY_CUE_SCHEMA_VERSION,
    cueId: input.cueId,
    voiceId: input.voiceId,
    provider: AUDIO_TTS_PROVIDER,
    providerVoiceId: input.providerVoiceId,
    model: ELEVENLABS_MODEL,
    outputFormat: AUDIO_OUTPUT_FORMAT,
    path: safetyAudioExpectedPath(input.voiceId, input.cueId),
    fingerprint: safetyAudioFingerprint(input),
  };
}

export function expectedSafetyAudioMetadata(): SafetyAudioMetadataByVoice {
  const out: Record<string, Partial<Record<SafetyCueId, SafetyAudioAssetMetadata>>> = {};
  for (const voice of VOICE_OPTIONS) {
    out[voice.id] = {};
    for (const cueId of safetyAudioCueIds()) {
      out[voice.id][cueId] = safetyAudioMetadataFor({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
    }
  }
  return out;
}

function stableSettingsString(): string {
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
