export interface PricingInput {
  betaPrice: string;
  regularPrice: string;
  currency: string;
  billingDescription: string;
}

export interface ConfiguredPricing {
  kind: 'configured';
  beta: number;
  regular: number;
  currency: string;
  billingDescription: string;
  betaFormatted: string;
  regularFormatted: string;
  savingAmountFormatted: string;
  savingPercent: number;
}

export interface UnconfiguredPricing {
  kind: 'unconfigured';
  reason: 'missing' | 'invalid' | 'reversed';
}

export type PricingPresentation = ConfiguredPricing | UnconfiguredPricing;

export function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function buildPricing(input: PricingInput): PricingPresentation {
  const beta = parsePrice(input.betaPrice);
  const regular = parsePrice(input.regularPrice);
  const currency = input.currency.trim().toUpperCase();

  if (beta === null || regular === null || !currency || !input.billingDescription.trim()) {
    return { kind: 'unconfigured', reason: 'missing' };
  }

  if (beta > regular) {
    return { kind: 'unconfigured', reason: 'reversed' };
  }

  try {
    const saving = regular - beta;
    return {
      kind: 'configured',
      beta,
      regular,
      currency,
      billingDescription: input.billingDescription.trim(),
      betaFormatted: formatCurrency(beta, currency),
      regularFormatted: formatCurrency(regular, currency),
      savingAmountFormatted: formatCurrency(saving, currency),
      savingPercent: regular === 0 ? 0 : Math.round((saving / regular) * 100),
    };
  } catch {
    return { kind: 'unconfigured', reason: 'invalid' };
  }
}

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
