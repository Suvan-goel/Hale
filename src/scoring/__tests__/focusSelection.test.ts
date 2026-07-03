import {
  FOCUS_SELECTION_POLICY_VERSION,
  INTERIM_NEAR_TIE_MARGIN_YEARS,
  focusSelectionFromUnknown,
  selectFocusFromScore,
  type CheckUpScore,
  type Domain,
  type DomainResult,
} from '..';

const START = '2026-06-20T08:00:00.000Z';

function domainResult(domain: Domain, midpoint: number, measured = true): DomainResult {
  return {
    domain,
    label: domain,
    measured,
    ageLow: measured ? midpoint - 2 : NaN,
    ageHigh: measured ? midpoint + 2 : NaN,
    estimated: false,
    interpretation: measured ? 'Measured.' : 'Not measured.',
    rows: [],
    primaryMetricValue: measured ? midpoint : NaN,
  };
}

function score(midpoints: Partial<Record<Domain, number>>): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain: null,
    domains: [
      domainResult('strength', midpoints.strength ?? 58, midpoints.strength !== undefined),
      domainResult('balance', midpoints.balance ?? 58, midpoints.balance !== undefined),
      domainResult('mobility', midpoints.mobility ?? 58, midpoints.mobility !== undefined),
    ],
  };
}

describe('exact focus selection', () => {
  it('returns a clear focus when one complete domain has the exact oldest midpoint', () => {
    expect(selectFocusFromScore(score({ strength: 62, balance: 74, mobility: 68 }))).toEqual({
      kind: 'clear',
      focusDomain: 'balance',
      tiedDomains: ['balance'],
    });
  });

  it('records an exact tie using stable score-domain order and deterministic fallback', () => {
    expect(selectFocusFromScore(score({ strength: 74, balance: 74, mobility: 62 }))).toEqual({
      kind: 'exact_tie',
      focusDomain: 'strength',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'deterministic_fallback',
    });
  });

  it('records a near tie when domains are within the interim age-year margin', () => {
    expect(selectFocusFromScore(score({ strength: 74, balance: 70, mobility: 62 }))).toEqual({
      kind: 'near_tie',
      focusDomain: 'strength',
      tiedDomains: ['strength', 'balance'],
      nearTiedDomains: ['strength', 'balance'],
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: 'near_tie_deterministic_fallback',
    });
  });

  it('preserves the active focus when an official re-test ties that active domain exactly', () => {
    expect(selectFocusFromScore(score({ strength: 62, balance: 74, mobility: 74 }), { activeFocusDomain: 'mobility' })).toEqual({
      kind: 'exact_tie',
      focusDomain: 'mobility',
      tiedDomains: ['balance', 'mobility'],
      tieBreakReason: 'preserve_current_focus',
    });
  });

  it('preserves the active focus when an official re-test near-ties that active domain', () => {
    expect(selectFocusFromScore(score({ strength: 62, balance: 74, mobility: 70 }), { activeFocusDomain: 'mobility' })).toEqual({
      kind: 'near_tie',
      focusDomain: 'mobility',
      tiedDomains: ['balance', 'mobility'],
      nearTiedDomains: ['balance', 'mobility'],
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: 'near_tie_preserve_current_focus',
    });
  });

  it('keeps exact ties exact and uses clear focus when the next domain is outside the near-tie margin', () => {
    expect(selectFocusFromScore(score({ strength: 74, balance: 74, mobility: 73 }))).toEqual({
      kind: 'exact_tie',
      focusDomain: 'strength',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'deterministic_fallback',
    });
    expect(selectFocusFromScore(score({ strength: 74, balance: 68.999, mobility: 62 }))).toEqual({
      kind: 'clear',
      focusDomain: 'strength',
      tiedDomains: ['strength'],
    });
    expect(selectFocusFromScore(score({ strength: 74 }))).toBeNull();
  });

  it('rejects malformed focus metadata and normalizes stable tied-domain order', () => {
    expect(
      focusSelectionFromUnknown({
        kind: 'exact_tie',
        focusDomain: 'balance',
        tiedDomains: ['balance', 'strength'],
        tieBreakReason: 'preserve_current_focus',
      })
    ).toEqual({
      kind: 'exact_tie',
      focusDomain: 'balance',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'preserve_current_focus',
    });
    expect(focusSelectionFromUnknown({ kind: 'exact_tie', focusDomain: 'balance', tiedDomains: ['balance'] })).toBeNull();
    expect(focusSelectionFromUnknown({ kind: 'clear', focusDomain: 'strength', tiedDomains: ['strength', 'balance'] })).toBeNull();
  });

  it('rejects malformed near-tie metadata and normalizes stable near-tied-domain order', () => {
    expect(
      focusSelectionFromUnknown({
        kind: 'near_tie',
        focusDomain: 'balance',
        tiedDomains: ['balance', 'strength'],
        nearTiedDomains: ['balance', 'strength'],
        nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
        policyVersion: FOCUS_SELECTION_POLICY_VERSION,
        tieBreakReason: 'near_tie_preserve_current_focus',
      })
    ).toEqual({
      kind: 'near_tie',
      focusDomain: 'balance',
      tiedDomains: ['strength', 'balance'],
      nearTiedDomains: ['strength', 'balance'],
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: 'near_tie_preserve_current_focus',
    });
    expect(
      focusSelectionFromUnknown({
        kind: 'near_tie',
        focusDomain: 'balance',
        tiedDomains: ['balance', 'strength'],
        nearTiedDomains: ['balance'],
        nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
        policyVersion: FOCUS_SELECTION_POLICY_VERSION,
        tieBreakReason: 'near_tie_preserve_current_focus',
      })
    ).toBeNull();
    expect(
      focusSelectionFromUnknown({
        kind: 'near_tie',
        focusDomain: 'balance',
        tiedDomains: ['balance', 'strength'],
        nearTiedDomains: ['balance', 'strength'],
        nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS + 1,
        policyVersion: FOCUS_SELECTION_POLICY_VERSION,
        tieBreakReason: 'near_tie_preserve_current_focus',
      })
    ).toBeNull();
  });
});
