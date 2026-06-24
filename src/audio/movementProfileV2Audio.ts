import { VOICE_OPTIONS } from '../profile/voices';
import {
  MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_CUE_SCHEMA_VERSION,
  movementProfileV2CueIds,
  movementProfileV2CueText,
  type MovementProfileV2CueId,
} from '../movementProfileV2/voiceCues';
import {
  AUDIO_OUTPUT_FORMAT,
  AUDIO_TTS_PROVIDER,
  AUDIO_VOICE_SETTINGS,
  ELEVENLABS_MODEL,
} from './safetyAudio';

export const MOVEMENT_PROFILE_V2_AUDIO_FINGERPRINT_SCHEMA_VERSION = 1 as const;

export interface MovementProfileV2AudioAssetMetadata {
  schemaVersion: typeof MOVEMENT_PROFILE_V2_AUDIO_FINGERPRINT_SCHEMA_VERSION;
  cueSchemaVersion: typeof MOVEMENT_PROFILE_V2_CUE_SCHEMA_VERSION;
  cuePolicyFingerprint: string;
  cueId: MovementProfileV2CueId;
  voiceId: string;
  provider: typeof AUDIO_TTS_PROVIDER;
  providerVoiceId: string;
  model: typeof ELEVENLABS_MODEL;
  outputFormat: typeof AUDIO_OUTPUT_FORMAT;
  path: string;
  fingerprint: string;
}

export type MovementProfileV2AudioMetadataByVoice = Readonly<
  Record<string, Partial<Record<MovementProfileV2CueId, MovementProfileV2AudioAssetMetadata>>>
>;

export function movementProfileV2AudioCueIds(): MovementProfileV2CueId[] {
  return movementProfileV2CueIds();
}

export function movementProfileV2AudioExpectedPath(
  voiceId: string,
  cueId: MovementProfileV2CueId
): string {
  return `assets/audio/voice/${voiceId}/${cueId}.mp3`;
}

export function movementProfileV2AudioFingerprint(input: {
  cueId: MovementProfileV2CueId;
  voiceId: string;
  providerVoiceId: string;
  text?: string;
}): string {
  const payload = [
    `schema=${MOVEMENT_PROFILE_V2_AUDIO_FINGERPRINT_SCHEMA_VERSION}`,
    `cueSchema=${MOVEMENT_PROFILE_V2_CUE_SCHEMA_VERSION}`,
    `cuePolicy=${MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT}`,
    `cue=${input.cueId}`,
    `text=${input.text ?? movementProfileV2CueText(input.cueId)}`,
    `voice=${input.voiceId}`,
    `provider=${AUDIO_TTS_PROVIDER}`,
    `providerVoice=${input.providerVoiceId}`,
    `model=${ELEVENLABS_MODEL}`,
    `format=${AUDIO_OUTPUT_FORMAT}`,
    `settings=${stableSettingsString()}`,
  ].join('|');
  return `mpv2-audio-v${MOVEMENT_PROFILE_V2_AUDIO_FINGERPRINT_SCHEMA_VERSION}-${fnv1a32(payload)}`;
}

export function movementProfileV2AudioMetadataFor(input: {
  cueId: MovementProfileV2CueId;
  voiceId: string;
  providerVoiceId: string;
}): MovementProfileV2AudioAssetMetadata {
  return {
    schemaVersion: MOVEMENT_PROFILE_V2_AUDIO_FINGERPRINT_SCHEMA_VERSION,
    cueSchemaVersion: MOVEMENT_PROFILE_V2_CUE_SCHEMA_VERSION,
    cuePolicyFingerprint: MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT,
    cueId: input.cueId,
    voiceId: input.voiceId,
    provider: AUDIO_TTS_PROVIDER,
    providerVoiceId: input.providerVoiceId,
    model: ELEVENLABS_MODEL,
    outputFormat: AUDIO_OUTPUT_FORMAT,
    path: movementProfileV2AudioExpectedPath(input.voiceId, input.cueId),
    fingerprint: movementProfileV2AudioFingerprint(input),
  };
}

export function expectedMovementProfileV2AudioMetadata(): MovementProfileV2AudioMetadataByVoice {
  const out: Record<
    string,
    Partial<Record<MovementProfileV2CueId, MovementProfileV2AudioAssetMetadata>>
  > = {};
  for (const voice of VOICE_OPTIONS) {
    out[voice.id] = {};
    for (const cueId of movementProfileV2AudioCueIds()) {
      out[voice.id][cueId] = movementProfileV2AudioMetadataFor({
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
