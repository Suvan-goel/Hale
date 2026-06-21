import { describe, expect, it } from 'vitest';

import { buildPricing, parsePrice } from '@/lib/pricing';

describe('pricing', () => {
  it('parses plain decimal prices', () => {
    expect(parsePrice('29')).toBe(29);
    expect(parsePrice('29.50')).toBe(29.5);
    expect(parsePrice(' 0 ')).toBe(0);
  });

  it('rejects invalid prices', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('free')).toBeNull();
    expect(parsePrice('-1')).toBeNull();
    expect(parsePrice('10.999')).toBeNull();
  });

  it('shows configured pricing with derived savings', () => {
    const pricing = buildPricing({
      betaPrice: '29',
      regularPrice: '59',
      currency: 'GBP',
      billingDescription: 'per month',
    });

    expect(pricing.kind).toBe('configured');
    if (pricing.kind === 'configured') {
      expect(pricing.betaFormatted).toBe('£29');
      expect(pricing.regularFormatted).toBe('£59');
      expect(pricing.savingAmountFormatted).toBe('£30');
      expect(pricing.savingPercent).toBe(51);
      expect(pricing.billingDescription).toBe('per month');
    }
  });

  it('does not render pricing when beta price is higher than regular price', () => {
    expect(
      buildPricing({
        betaPrice: '60',
        regularPrice: '59',
        currency: 'GBP',
        billingDescription: 'per month',
      })
    ).toEqual({ kind: 'unconfigured', reason: 'reversed' });
  });
});
