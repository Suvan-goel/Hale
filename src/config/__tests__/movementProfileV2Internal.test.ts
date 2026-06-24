import { parseMovementProfileV2InternalFlag } from '../movementProfileV2Internal';

describe('Movement Profile V2 internal gate', () => {
  it('enables only for the exact compile-time 1 flag', () => {
    expect(parseMovementProfileV2InternalFlag('1')).toBe(true);
    expect(parseMovementProfileV2InternalFlag('true')).toBe(false);
    expect(parseMovementProfileV2InternalFlag('0')).toBe(false);
    expect(parseMovementProfileV2InternalFlag(true)).toBe(false);
    expect(parseMovementProfileV2InternalFlag(undefined)).toBe(false);
  });
});
