import {
  LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID,
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createCheckUpProtocolPolicy,
  normalizeCheckUpRecordProtocolPolicy,
} from '../protocolPolicy';

describe('check-up protocol policy', () => {
  it('infers legacy Movement Age for records created before policy metadata existed', () => {
    const normalized = normalizeCheckUpRecordProtocolPolicy({
      startedAt: '2026-06-23T08:00:00.000Z',
      bodyUnit: 0.33,
      items: [],
    });

    expect(normalized).toMatchObject({
      supported: true,
      inferredDefault: true,
      policy: {
        id: LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID,
        version: 1,
        frozenAt: '2026-06-23T08:00:00.000Z',
      },
    });
  });

  it('keeps a Movement Profile V2 policy frozen at Check-Up start', () => {
    const policy = createCheckUpProtocolPolicy(
      MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      '2026-06-23T08:00:00.000Z'
    );
    const normalized = normalizeCheckUpRecordProtocolPolicy({
      startedAt: '2026-06-23T08:00:00.000Z',
      protocolPolicy: policy,
      bodyUnit: 0.33,
      items: [],
    });

    expect(normalized).toEqual({ supported: true, policy, inferredDefault: false });
  });

  it('fails closed for future protocol ids and versions', () => {
    expect(
      normalizeCheckUpRecordProtocolPolicy({
        startedAt: '2026-06-23T08:00:00.000Z',
        protocolPolicy: { id: 'movement_profile_v3', version: 1, frozenAt: '2026-06-23T08:00:00.000Z' },
        bodyUnit: 0.33,
        items: [],
      })
    ).toMatchObject({ supported: false, unsupportedId: 'movement_profile_v3' });

    expect(
      normalizeCheckUpRecordProtocolPolicy({
        startedAt: '2026-06-23T08:00:00.000Z',
        protocolPolicy: { id: LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID, version: 2, frozenAt: '2026-06-23T08:00:00.000Z' },
        bodyUnit: 0.33,
        items: [],
      })
    ).toMatchObject({ supported: false, unsupportedId: LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID });
  });
});
