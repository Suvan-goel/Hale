import type { CheckUpScore, Domain, DomainResult } from './scoring';

export const SCORE_DOMAIN_ORDER: readonly Domain[] = ['strength', 'balance', 'mobility'];
export const INTERIM_NEAR_TIE_MARGIN_YEARS = 5;
export const FOCUS_SELECTION_POLICY_VERSION = 1;

export type FocusSelectionKind = 'clear' | 'exact_tie' | 'near_tie';
export type FocusTieBreakReason =
  | 'balanced_first_block'
  | 'preserve_current_focus'
  | 'deterministic_fallback'
  | 'near_tie_deterministic_fallback'
  | 'near_tie_preserve_current_focus';

export interface ScoreFocusSelection {
  kind: FocusSelectionKind;
  focusDomain: Domain;
  tiedDomains: Domain[];
  nearTiedDomains?: Domain[];
  nearTieMarginYears?: number;
  policyVersion?: number;
  tieBreakReason?: FocusTieBreakReason;
}

export interface FocusSelectionContext {
  activeFocusDomain?: Domain | null;
}

interface ComparableDomain {
  domain: Domain;
  value: number;
}

export function selectFocusFromScore(
  score: CheckUpScore | null | undefined,
  context: FocusSelectionContext = {}
): ScoreFocusSelection | null {
  if (!score) return null;
  return selectFocusFromDomainResults(score.domains, context);
}

export function selectFocusFromDomainResults(
  domains: readonly DomainResult[] | null | undefined,
  context: FocusSelectionContext = {}
): ScoreFocusSelection | null {
  const comparable = completeComparableDomains(domains);
  if (!comparable) return null;

  const oldest = Math.max(...comparable.map((item) => item.value));
  const tiedDomains = comparable
    .filter((item) => item.value === oldest)
    .map((item) => item.domain);

  if (tiedDomains.length > 1) {
    const activeFocusDomain = context.activeFocusDomain;
    if (activeFocusDomain && tiedDomains.includes(activeFocusDomain)) {
      return {
        kind: 'exact_tie',
        focusDomain: activeFocusDomain,
        tiedDomains,
        tieBreakReason: 'preserve_current_focus',
      };
    }

    return {
      kind: 'exact_tie',
      focusDomain: tiedDomains[0],
      tiedDomains,
      tieBreakReason: 'deterministic_fallback',
    };
  }

  const nearTiedDomains = comparable
    .filter((item) => oldest - item.value <= INTERIM_NEAR_TIE_MARGIN_YEARS)
    .map((item) => item.domain);

  if (nearTiedDomains.length === 1) {
    return {
      kind: 'clear',
      focusDomain: tiedDomains[0],
      tiedDomains,
    };
  }

  const activeFocusDomain = context.activeFocusDomain;
  if (activeFocusDomain && nearTiedDomains.includes(activeFocusDomain)) {
    return {
      kind: 'near_tie',
      focusDomain: activeFocusDomain,
      tiedDomains: nearTiedDomains,
      nearTiedDomains,
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: 'near_tie_preserve_current_focus',
    };
  }

  return {
    kind: 'near_tie',
    focusDomain: nearTiedDomains[0],
    tiedDomains: nearTiedDomains,
    nearTiedDomains,
    nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
    policyVersion: FOCUS_SELECTION_POLICY_VERSION,
    tieBreakReason: 'near_tie_deterministic_fallback',
  };
}

export function applyFocusSelectionToScore(
  score: CheckUpScore,
  focusSelection: ScoreFocusSelection | null | undefined
): CheckUpScore {
  if (!focusSelection || score.weakestDomain === focusSelection.focusDomain) return score;
  return { ...score, weakestDomain: focusSelection.focusDomain };
}

export function focusSelectionFromUnknown(value: unknown): ScoreFocusSelection | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.kind !== 'clear' && record.kind !== 'exact_tie' && record.kind !== 'near_tie') return null;
  if (!isScoreDomain(record.focusDomain)) return null;
  if (!Array.isArray(record.tiedDomains)) return null;

  const tiedDomains: Domain[] = [];
  for (const domain of record.tiedDomains) {
    if (!isScoreDomain(domain) || tiedDomains.includes(domain)) return null;
    tiedDomains.push(domain);
  }
  const stableTiedDomains = SCORE_DOMAIN_ORDER.filter((domain) => tiedDomains.includes(domain));
  if (stableTiedDomains.length !== tiedDomains.length) return null;
  if (!stableTiedDomains.includes(record.focusDomain)) return null;

  if (record.kind === 'clear') {
    if (stableTiedDomains.length !== 1 || stableTiedDomains[0] !== record.focusDomain) return null;
    return {
      kind: 'clear',
      focusDomain: record.focusDomain,
      tiedDomains: stableTiedDomains,
    };
  }

  if (record.kind === 'near_tie') {
    if (stableTiedDomains.length < 2) return null;
    if (!Array.isArray(record.nearTiedDomains)) return null;
    const nearTiedDomains: Domain[] = [];
    for (const domain of record.nearTiedDomains) {
      if (!isScoreDomain(domain) || nearTiedDomains.includes(domain)) return null;
      nearTiedDomains.push(domain);
    }
    const stableNearTiedDomains = SCORE_DOMAIN_ORDER.filter((domain) => nearTiedDomains.includes(domain));
    if (stableNearTiedDomains.length !== nearTiedDomains.length) return null;
    if (!sameDomains(stableTiedDomains, stableNearTiedDomains)) return null;
    if (record.nearTieMarginYears !== INTERIM_NEAR_TIE_MARGIN_YEARS) return null;
    if (record.policyVersion !== FOCUS_SELECTION_POLICY_VERSION) return null;
    if (!isNearTieBreakReason(record.tieBreakReason)) return null;
    return {
      kind: 'near_tie',
      focusDomain: record.focusDomain,
      tiedDomains: stableTiedDomains,
      nearTiedDomains: stableNearTiedDomains,
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: record.tieBreakReason,
    };
  }

  if (stableTiedDomains.length < 2) return null;
  if (!isTieBreakReason(record.tieBreakReason)) return null;
  if (isNearTieBreakReason(record.tieBreakReason)) return null;
  return {
    kind: 'exact_tie',
    focusDomain: record.focusDomain,
    tiedDomains: stableTiedDomains,
    tieBreakReason: record.tieBreakReason,
  };
}

export function focusSelectionMatchesScore(
  score: CheckUpScore,
  focusSelection: ScoreFocusSelection
): boolean {
  const expected = selectFocusFromScore(score, {
    activeFocusDomain:
      (focusSelection.kind === 'exact_tie' && focusSelection.tieBreakReason === 'preserve_current_focus') ||
      (focusSelection.kind === 'near_tie' && focusSelection.tieBreakReason === 'near_tie_preserve_current_focus')
        ? focusSelection.focusDomain
        : null,
  });
  if (!expected) return false;
  return focusSelectionsEqual(expected, focusSelection);
}

export function focusSelectionsEqual(
  a: ScoreFocusSelection | null | undefined,
  b: ScoreFocusSelection | null | undefined
): boolean {
  if (!a || !b) return a === b;
  return (
    a.kind === b.kind &&
    a.focusDomain === b.focusDomain &&
    a.tieBreakReason === b.tieBreakReason &&
    a.nearTieMarginYears === b.nearTieMarginYears &&
    a.policyVersion === b.policyVersion &&
    sameDomains(a.tiedDomains, b.tiedDomains) &&
    sameOptionalDomains(a.nearTiedDomains, b.nearTiedDomains)
  );
}

export function isScoreDomain(value: unknown): value is Domain {
  return value === 'strength' || value === 'balance' || value === 'mobility';
}

export function isTieBreakReason(value: unknown): value is FocusTieBreakReason {
  return (
    value === 'balanced_first_block' ||
    value === 'preserve_current_focus' ||
    value === 'deterministic_fallback' ||
    value === 'near_tie_deterministic_fallback' ||
    value === 'near_tie_preserve_current_focus'
  );
}

export function isNearTieBreakReason(
  value: unknown
): value is Extract<FocusTieBreakReason, 'near_tie_deterministic_fallback' | 'near_tie_preserve_current_focus'> {
  return value === 'near_tie_deterministic_fallback' || value === 'near_tie_preserve_current_focus';
}

function completeComparableDomains(
  domains: readonly DomainResult[] | null | undefined
): ComparableDomain[] | null {
  if (!Array.isArray(domains)) return null;
  const out: ComparableDomain[] = [];
  for (const domain of SCORE_DOMAIN_ORDER) {
    const result = domains.find((item) => item.domain === domain);
    if (!result || !domainIsComparable(result)) return null;
    out.push({ domain, value: (result.ageLow + result.ageHigh) / 2 });
  }
  return out;
}

function domainIsComparable(domain: DomainResult): boolean {
  return (
    domain.measured &&
    Number.isFinite(domain.ageLow) &&
    Number.isFinite(domain.ageHigh) &&
    domain.ageLow <= domain.ageHigh
  );
}

function sameDomains(a: readonly Domain[], b: readonly Domain[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((domain, index) => domain === b[index]);
}

function sameOptionalDomains(a: readonly Domain[] | undefined, b: readonly Domain[] | undefined): boolean {
  if (!a || !b) return a === b;
  return sameDomains(a, b);
}
