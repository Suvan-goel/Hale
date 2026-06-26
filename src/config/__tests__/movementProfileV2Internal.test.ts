import { parseMovementProfileV2InternalFlag } from '../movementProfileV2Internal';
import {
  EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
  EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY,
  parseEyesOpenBalanceProtocolV2Flag,
  isEyesOpenBalanceProtocolV2Selectable,
} from '../eyesOpenBalanceProtocolV2';

describe('Movement Profile V2 internal gate', () => {
  it('enables only for the exact compile-time 1 flag', () => {
    expect(parseMovementProfileV2InternalFlag('1')).toBe(true);
    expect(parseMovementProfileV2InternalFlag('true')).toBe(false);
    expect(parseMovementProfileV2InternalFlag('0')).toBe(false);
    expect(parseMovementProfileV2InternalFlag(true)).toBe(false);
    expect(parseMovementProfileV2InternalFlag(undefined)).toBe(false);
  });
});

describe('eyes-open balance protocol V2 gate', () => {
  it('requires exact flag plus audio readiness, keeping the live default off while assets are pending', () => {
    expect(parseEyesOpenBalanceProtocolV2Flag('1')).toBe(true);
    expect(parseEyesOpenBalanceProtocolV2Flag('true')).toBe(false);
    expect(EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY).toBe(false);
    expect(EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY).toBe(true);
    expect(isEyesOpenBalanceProtocolV2Selectable({ flagValue: '1', audioReady: false })).toBe(false);
    expect(isEyesOpenBalanceProtocolV2Selectable({ flagValue: '1', audioReady: true })).toBe(true);
    expect(isEyesOpenBalanceProtocolV2Selectable({ betaDefaultEnabled: true })).toBe(true);
  });
});
