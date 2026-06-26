import { VOICE_V2_1_AUDIO_ASSET_METADATA } from '../audio/voiceV21AudioManifest';

export const EYES_OPEN_BALANCE_PROTOCOL_V2_ENV =
  'EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2';

const REQUIRED_EYES_OPEN_BALANCE_V2_GENERATED_CUES = [
  'checkup-balance-feet-together-v21',
  'checkup-balance-semi-tandem-left-v21',
  'checkup-balance-semi-tandem-right-v21',
  'checkup-balance-tandem-left-v21',
  'checkup-balance-tandem-right-v21',
  'checkup-balance-single-leg-left-v21',
  'checkup-balance-single-leg-right-v21',
  'checkup-balance-next-stance-v21',
  'checkup-balance-support-touch-v21',
] as const;
const REQUIRED_EYES_OPEN_BALANCE_V2_VOICE_IDS = ['clara', 'marcus'] as const;

export const EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY =
  REQUIRED_EYES_OPEN_BALANCE_V2_GENERATED_CUES.every((cueKey) =>
    REQUIRED_EYES_OPEN_BALANCE_V2_VOICE_IDS.every((voiceId) => {
      const metadata = VOICE_V2_1_AUDIO_ASSET_METADATA[voiceId]?.[cueKey];
      return (
        metadata?.logicalCueKey === cueKey &&
        metadata.physicalCueKey === cueKey &&
        metadata.path === `assets/audio/voice/${voiceId}/${cueKey}.mp3`
      );
    })
  );
export const EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_APPROVAL_READY = false;
export const EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY = false;

export function parseEyesOpenBalanceProtocolV2Flag(value: unknown): boolean {
  return value === '1';
}

export function isEyesOpenBalanceProtocolV2Selectable(input: {
  flagValue?: unknown;
  audioReady?: boolean;
} = {}): boolean {
  const flagValue =
    input.flagValue === undefined
      ? process.env.EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2
      : input.flagValue;
  return parseEyesOpenBalanceProtocolV2Flag(flagValue) && input.audioReady === true;
}

export const EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE = isEyesOpenBalanceProtocolV2Selectable({
  audioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
});
