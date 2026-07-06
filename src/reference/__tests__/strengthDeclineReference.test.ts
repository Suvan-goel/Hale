import {
  STRENGTH_DECLINE_REFERENCE,
  typicalRetainedFraction,
  validateStrengthDeclineReference,
} from '../strengthDeclineReference';

describe('strength decline reference (Hughes 2001; founder constraints 2026-07-06)', () => {
  it('cites the source with a resolvable DOI and stays conservative', () => {
    expect(STRENGTH_DECLINE_REFERENCE.doi).toBe('10.1093/gerona/56.5.B209');
    expect(STRENGTH_DECLINE_REFERENCE.authors).toMatch(/Hughes VA/);
    // Anchor is far below the source's own ~14%/decade (0.014/yr) so the band
    // can never over-flatter.
    expect(STRENGTH_DECLINE_REFERENCE.annualDeclineFraction).toBe(0.01);
    expect(STRENGTH_DECLINE_REFERENCE.annualDeclineFraction).toBeLessThan(0.014);
    expect(STRENGTH_DECLINE_REFERENCE.attribution).toMatch(/conservatively|conservative/i);
  });

  it('validates clean, and its fingerprint machinery catches silent edits', () => {
    expect(validateStrengthDeclineReference()).toEqual([]);

    // A tampered fingerprint fails (same discipline as the measurement sources).
    expect(
      validateStrengthDeclineReference({ ...STRENGTH_DECLINE_REFERENCE, sourceFingerprint: 'forged' })
    ).toContain('decline_reference_fingerprint_mismatch');

    // Raising the anchor to/above the published rate is rejected as
    // non-conservative — the "never over-flatter" guarantee, enforced.
    const steep = { ...STRENGTH_DECLINE_REFERENCE, annualDeclineFraction: 0.014 };
    expect(validateStrengthDeclineReference(steep)).toContain('decline_reference_rate_not_conservative');
  });

  it('applies flat annual decline from her baseline, floored at zero', () => {
    expect(typicalRetainedFraction(0)).toBe(1);
    expect(typicalRetainedFraction(1)).toBeCloseTo(0.99, 5);
    expect(typicalRetainedFraction(5)).toBeCloseTo(0.95, 5);
    expect(typicalRetainedFraction(1000)).toBe(0); // floored, never negative
  });
});
