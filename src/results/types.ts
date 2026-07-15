/**
 * 'standard'   — concise fresh results after a routine check-up.
 * 'onboarding' — the same concise completion layout after the first check-up.
 * 'history'    — saved read-only results opened from Progress.
 */
export type UnifiedCheckUpResultsVariant = 'standard' | 'onboarding' | 'history';

/** Journey context supplied by the programme shell for an accepted check-up. */
export type UnifiedCheckUpMilestone = 'baseline' | 'week4' | 'week8' | 'week12';

export type UnifiedResultDomainId =
  | 'strength_power'
  | 'balance_stability';

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
  iconToken: 'strength' | 'balance';
  accessibilityLabel?: string;
}

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
    milestoneLabel?: string;
    completedAtLabel?: string;
    showBackButton?: boolean;
    backAccessibilityLabel?: string;
  };
  /** Strength and Balance, in the official check-up order. */
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
