/**
 * 'standard'   — concise fresh results after a routine check-up.
 * 'onboarding' — the same concise completion layout after the first check-up.
 * 'history'    — a detailed saved profile opened read-only from Progress.
 */
export type UnifiedCheckUpResultsVariant = 'standard' | 'onboarding' | 'history';

export type UnifiedResultDomainId =
  | 'strength_power'
  | 'balance_stability'
  | 'mobility_flexibility'
  // Registered dimension (REPOSITION_TDD Part 2a). Never rendered as a card in
  // v1 — Clarity gets its own trend surface; the id exists so a future
  // dimension needs no type migration.
  | 'clarity';

export type UnifiedResultDomainTone = 'neutral' | 'attention' | 'informational';

export type UnifiedCheckUpResultsAction = { type: 'done' };

export interface UnifiedResultsActionViewModel {
  id: string;
  label: string;
  action: UnifiedCheckUpResultsAction;
  button: 'primary' | 'secondary';
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface UnifiedDomainResultCard {
  id: UnifiedResultDomainId;
  title: string;
  metricLabel: string;
  metricValue: string;
  interpretation?: string;
  body?: string;
  tone: UnifiedResultDomainTone;
  iconToken: 'strength' | 'balance' | 'mobility' | 'clarity';
  accessibilityLabel?: string;
}

/** Dimension-generic alias (REPOSITION_TDD §4) — cards are registry entries. */
export type UnifiedDimensionResultCard = UnifiedDomainResultCard;

export interface UnifiedFocusPresentation {
  kicker: string;
  title: string;
  body: string;
}

export interface UnifiedResultsRecoveryPresentation {
  title: string;
  body: string;
}

export interface UnifiedCheckUpResultsPresentation {
  variant: UnifiedCheckUpResultsVariant;
  header: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    completedAtLabel?: string;
    showBackButton?: boolean;
    backAccessibilityLabel?: string;
  };
  /**
   * Dimension-generic (REPOSITION_TDD §4): one card per active camera-measured
   * dimension, in registry surface order — no longer a fixed 3-tuple.
   */
  domains: readonly UnifiedDomainResultCard[];
  focus: UnifiedFocusPresentation;
  caveat?: string;
  actions: readonly UnifiedResultsActionViewModel[];
  recovery?: UnifiedResultsRecoveryPresentation;
  accessibility: {
    screenSummary: string;
    announcementKey?: string;
  };
}
