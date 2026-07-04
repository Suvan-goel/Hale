/**
 * 'standard'  — fresh results right after a check-up.
 * 'onboarding' — the first-ever results, with onboarding framing.
 * 'history'   — a saved profile opened later from Progress; read-only, no plan
 *               actions. Renders through the standard layout.
 */
export type UnifiedCheckUpResultsVariant = 'standard' | 'onboarding' | 'history';

export type UnifiedResultDomainId =
  | 'strength_power'
  | 'balance_stability'
  | 'mobility_flexibility';

export type UnifiedResultDomainTone = 'neutral' | 'attention' | 'informational';

export type UnifiedCheckUpResultsAction =
  | { type: 'view_plan' }
  | { type: 'view_block_report' }
  | { type: 'done' }
  | { type: 'retry_checkup' }
  | { type: 'complete_onboarding' }
  | { type: 'finish_movement_profile' }
  | { type: 'view_saved_profile' };

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
  statusLabel?: string;
  bandLabel?: string;
  featured?: boolean;
  tone: UnifiedResultDomainTone;
  iconToken: 'strength' | 'balance' | 'mobility';
  accessibilityLabel?: string;
}

export interface UnifiedFocusPresentation {
  kicker: string;
  title: string;
  body: string;
}

export interface UnifiedPlanPresentation {
  status: 'hidden' | 'ready' | 'conflict' | 'unavailable';
  title?: string;
  body?: string;
}

export interface UnifiedResultsRecoveryPresentation {
  title: string;
  body: string;
}

export interface UnifiedRetestComparisonRow {
  id: string;
  title: string;
  previousLabel?: string;
  currentLabel?: string;
  note?: string;
}

export interface UnifiedRetestComparisonPresentation {
  title: string;
  subtitle?: string;
  rows: readonly UnifiedRetestComparisonRow[];
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
  domains: readonly [
    UnifiedDomainResultCard,
    UnifiedDomainResultCard,
    UnifiedDomainResultCard,
  ];
  domainSection?: {
    title?: string;
    subtitle?: string;
  };
  focus: UnifiedFocusPresentation;
  plan: UnifiedPlanPresentation;
  caveat?: string;
  trend?: {
    title: string;
    body: string;
  };
  comparison?: UnifiedRetestComparisonPresentation;
  actions: readonly UnifiedResultsActionViewModel[];
  recovery?: UnifiedResultsRecoveryPresentation;
  accessibility: {
    screenSummary: string;
    announcementKey?: string;
  };
}
