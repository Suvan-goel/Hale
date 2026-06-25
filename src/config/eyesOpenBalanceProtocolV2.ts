export const EYES_OPEN_BALANCE_PROTOCOL_V2_ENV =
  'EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2';

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
