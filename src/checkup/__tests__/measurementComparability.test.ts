import {
  comparableMeasurementSeriesKey,
  deriveMeasurementComparability,
  measurementContextsAllowChangeClaim,
  measurementSeriesKey,
} from '../measurementComparability';
import type { BodySide, MeasurementContext, MeasurementProtocolRef, MeasurementSideRole } from '../measurementContext';

const protocol: MeasurementProtocolRef = { protocolId: 'mpv2_single_leg_balance_45s_v1', protocolVersion: 1 };

function context({
  side = 'left',
  role = 'standing_leg',
  protocolRef = protocol,
}: {
  side?: BodySide | null;
  role?: MeasurementSideRole;
  protocolRef?: MeasurementProtocolRef;
}): MeasurementContext {
  const base = {
    protocol: protocolRef,
    side: {
      role,
      selectedSide: role === 'not_applicable' ? null : side,
      observedSide: role === 'not_applicable' ? null : side,
      source: side ? 'baseline_user_confirmed' as const : 'legacy_unknown' as const,
      userConfirmed: !!side,
      anchorResultId: 'anchor-1',
      anchorSide: role === 'not_applicable' ? null : side,
    },
  };
  return {
    ...base,
    comparability: deriveMeasurementComparability({ current: base }),
  };
}

describe('measurement comparability', () => {
  it('treats no reference as a new baseline when protocol and side are known', () => {
    expect(context({ side: 'left' }).comparability).toMatchObject({
      sideStatus: 'establishes_side_baseline',
      protocolStatus: 'establishes_protocol_baseline',
      overallStatus: 'establishes_new_baseline',
    });
  });

  it('compares same protocol/same side and reduces opposite-side fallback', () => {
    const previous = context({ side: 'left' });
    const same = deriveMeasurementComparability({ current: context({ side: 'left' }), reference: previous });
    const opposite = deriveMeasurementComparability({ current: context({ side: 'right' }), reference: previous });
    expect(same.overallStatus).toBe('comparable');
    expect(same.reasonCodes).toEqual(['SAME_PROTOCOL', 'SAME_SIDE']);
    expect(opposite.overallStatus).toBe('reduced_comparability');
    expect(opposite.reasonCodes).toEqual(['OPPOSITE_SIDE', 'SAME_PROTOCOL']);
  });

  it('fails unknown side and different protocol closed to raw-only', () => {
    const previous = context({ side: 'left' });
    expect(deriveMeasurementComparability({ current: context({ side: null }), reference: previous }).overallStatus).toBe('raw_only');
    expect(
      deriveMeasurementComparability({
        current: context({ side: 'left', protocolRef: { protocolId: 'new_protocol', protocolVersion: 1 } }),
        reference: previous,
      }).protocolStatus
    ).toBe('different_protocol_raw_only');
  });

  it('does not split side-independent chair-style series by observed side', () => {
    const a = context({ role: 'not_applicable', side: null, protocolRef: { protocolId: 'legacy_chair_stand_30s', protocolVersion: 1 } });
    const b = {
      ...a,
      side: { ...a.side, observedSide: 'right' as BodySide },
      comparability: deriveMeasurementComparability({ current: a, reference: a }),
    };
    expect(measurementSeriesKey(a, 'chair_stand_30s')).toBe(measurementSeriesKey(b, 'chair_stand_30s'));
    expect(measurementContextsAllowChangeClaim(a, b, 'chair_stand_30s')).toBe(true);
  });

  it('series keys differ by version and required side, and reduced/raw-only contexts do not get comparable keys', () => {
    const left = context({ side: 'left' });
    const right = context({ side: 'right' });
    const v2 = context({ side: 'left', protocolRef: { protocolId: protocol.protocolId, protocolVersion: 2 } });
    expect(measurementSeriesKey(left, 'balance')).not.toBe(measurementSeriesKey(right, 'balance'));
    expect(measurementSeriesKey(left, 'balance')).not.toBe(measurementSeriesKey(v2, 'balance'));
    expect(comparableMeasurementSeriesKey(context({ side: null }), 'balance')).toBeNull();
  });

  it('suppresses direct change claims between old single-leg and new eyes-open balance protocols', () => {
    const oldBalance = context({ side: 'left' });
    const eyesOpen = context({
      side: 'left',
      protocolRef: { protocolId: 'home_balance_eyes_open_v2', protocolVersion: 2 },
    });
    const comparability = deriveMeasurementComparability({ current: eyesOpen, reference: oldBalance });

    expect(comparability).toMatchObject({
      protocolStatus: 'different_protocol_raw_only',
      overallStatus: 'raw_only',
    });
    expect(measurementContextsAllowChangeClaim(oldBalance, eyesOpen, 'home_balance_eyes_open_ladder')).toBe(false);
  });
});
