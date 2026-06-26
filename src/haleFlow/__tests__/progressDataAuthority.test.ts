import { selectProgressDataAuthority } from '../progressDataAuthority';

describe('Progress data authority', () => {
  it('uses V1 only for explicit rollback with no V2 state', () => {
    expect(base({ v1RollbackAvailable: true })).toEqual({
      kind: 'legacy_v1',
      reason: 'rollback_no_v2_state',
    });
  });

  it('uses V2 empty mode by default without the old release flag', () => {
    expect(base({ unifiedReleaseEnabled: false })).toEqual({
      kind: 'movement_profile_v2',
      reason: 'public_v2_default',
    });
  });

  it('keeps accepted V2 state canonical even when rollback is on', () => {
    expect(base({ acceptedV2OfficialProfiles: [{}], v1RollbackAvailable: true })).toEqual({
      kind: 'movement_profile_v2',
      reason: 'accepted_v2_profile',
    });
  });

  it('selects V2 for V2 blocks, reports, and pending continuation before rollback', () => {
    expect(base({
      v2OriginBlocks: [{ origin: { kind: 'movement_profile_v2_assessment' } }],
    })).toEqual({ kind: 'movement_profile_v2', reason: 'v2_block_exists' });
    expect(base({ acceptedV2Reports: [{ kind: 'movement_profile_v2_block_report' }] })).toEqual({
      kind: 'movement_profile_v2',
      reason: 'v2_report_exists',
    });
    expect(base({ hasPendingV2Continuation: true })).toEqual({
      kind: 'movement_profile_v2',
      reason: 'v2_pending_continuation',
    });
  });

  it('fails closed for malformed V2 state instead of falling back to V1', () => {
    expect(base({ hasMalformedV2State: true })).toEqual({
      kind: 'unavailable',
      reason: 'v2_malformed_state',
    });
  });
});

function base(overrides: Partial<Parameters<typeof selectProgressDataAuthority>[0]> = {}) {
  return selectProgressDataAuthority({
    unifiedReleaseEnabled: false,
    acceptedV2OfficialProfiles: [],
    v2OriginBlocks: [],
    acceptedV2Reports: [],
    hasPendingV2Continuation: false,
    hasMalformedV2State: false,
    v1RollbackAvailable: false,
    ...overrides,
  });
}
