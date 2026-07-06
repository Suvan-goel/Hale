import type {
  MovementDomain,
  MovementProfileV2ComparisonUnit,
  MovementProfileV2RetestComparison,
  MovementProfileV2RetestComparisonDomain,
} from '../adherence';
import type {
  MovementProfileV2Domain,
  MovementProfileV2ResultsViewModel,
} from '../movementProfileV2/viewModel';
import type {
  UnifiedCheckUpResultsPresentation,
  UnifiedDomainResultCard,
  UnifiedPopulationComparisonPresentation,
  UnifiedResultDomainId,
} from './types';

import { BRAND } from '../brand';
export type MovementProfileV2UnifiedPlanState =
  | {
      status: 'ready';
      blockId: string;
    }
  | {
      status: 'sync_pending_local_ready';
      blockId: string;
    }
  | {
      status: 'active_block_conflict';
      existingBlockId?: string;
    }
  | {
      status: 'unavailable';
      title?: string;
      body?: string;
    };

export interface MovementProfileV2PopulationComparisonInput {
  /** True from the second stored official check-up onward (condition 1: the
   * first assessment stays purely diagnosis-shaped — no affordance). */
  available: boolean;
  optedIn: boolean;
}

export function buildMovementProfileV2UnifiedResultsPresentation(input: {
  viewModel: MovementProfileV2ResultsViewModel;
  planState: MovementProfileV2UnifiedPlanState;
  variant?: 'standard' | 'onboarding' | 'history';
  retestComparison?: MovementProfileV2RetestComparison | null;
  populationComparison?: MovementProfileV2PopulationComparisonInput;
}): UnifiedCheckUpResultsPresentation {
  // A saved profile opened later from Progress: same layout as fresh results,
  // but read-only — no plan section or plan actions, and honest "saved" copy.
  const historyMode = input.variant === 'history';
  const planReady =
    !historyMode &&
    (input.planState.status === 'ready' || input.planState.status === 'sync_pending_local_ready');
  const retestMode = !!input.retestComparison;
  const domains = input.viewModel.domainCards.map((card) =>
    domainCardToPresentation(card, input.viewModel.focus.domain)
  );
  const planCopy = planPresentation(input.viewModel, input.planState);
  return {
    variant: input.variant ?? 'standard',
    header: {
      eyebrow:
        input.variant === 'onboarding'
          ? 'Check-up complete'
          : historyMode
            ? 'Saved check-up'
            : 'Movement Check-Up',
      title: 'Your Strength Profile',
      completedAtLabel: input.viewModel.dateLabel,
      subtitle: historyMode
        ? 'A saved check-up from your history. Opening it does not change your plan.'
        : retestMode
          ? 'Your latest Check-Up is saved.'
          : planReady
            ? 'Your 4-week plan is ready.'
            : 'Your Strength Profile is saved.',
    },
    focus: {
      kicker: historyMode ? 'Focus at the time' : 'Where to focus',
      title: input.viewModel.focus.title,
      body: input.viewModel.focus.body,
    },
    domainSection: {
      title: retestMode ? 'Current results' : 'The three areas',
    },
    domains: toDomainCards(domains),
    plan: retestMode || historyMode ? { status: 'hidden' } : planCopy,
    caveat: input.viewModel.summary,
    comparison: input.retestComparison
      ? comparisonPresentation(input.retestComparison)
      : undefined,
    populationComparison: populationComparisonPresentation(input.variant, input.populationComparison),
    actions: input.retestComparison
      ? [
          {
            id: 'view-block-report',
            label: 'View my phase report',
            action: { type: 'view_block_report' },
            button: 'primary',
            accessibilityLabel: 'View my phase report.',
          },
        ]
      : planReady
      ? [
          {
            id: 'view-plan',
            label: 'View my 4-week plan',
            action: { type: 'view_plan' },
            button: 'primary',
            accessibilityLabel: 'View my 4-week plan. Opens the existing prepared plan.',
          },
        ]
      : [
          {
            id: 'done',
            label: 'Done',
            action: { type: 'done' },
            button: 'primary',
          },
        ],
    accessibility: {
      screenSummary: 'Strength Profile results',
    },
  };
}

// Founder conditions of record (2026-07-06): never on the first-ever results
// (onboarding variant); quiet and subordinate — the invitation must not imply
// the comparison is the fuller or more real answer; reversible in place, with
// Settings as the always-findable switch. History (saved profiles) shows no
// affordance either — it is a read-only surface.
function populationComparisonPresentation(
  variant: 'standard' | 'onboarding' | 'history' | undefined,
  input?: MovementProfileV2PopulationComparisonInput
): UnifiedPopulationComparisonPresentation | undefined {
  if (!input || !input.available) return undefined;
  if (variant === 'onboarding' || variant === 'history') return undefined;
  if (!input.optedIn) {
    return {
      state: 'invite',
      title: 'See how you compare',
      body: 'Optional: view results next to published values for your age and sex, where a result supports it. Your own trend stays the main story.',
      toggleLabel: 'Show comparisons',
      accessibilityLabel:
        'See how you compare. Optional: view results next to published values for your age and sex. Your own trend stays the main story.',
    };
  }
  return {
    state: 'active',
    title: 'Comparing with published values',
    body: 'Shown only where a result can be read against published values for your age and sex. You can turn this off any time, here or in Settings.',
    toggleLabel: 'Hide comparisons',
    accessibilityLabel: 'Comparing with published values. You can turn this off any time, here or in Settings.',
  };
}

function comparisonPresentation(
  comparison: MovementProfileV2RetestComparison
): UnifiedCheckUpResultsPresentation['comparison'] {
  return {
    title: 'Previous and current',
    subtitle: 'Side by side with your last check-up.',
    rows: [
      comparisonRow('strength_power', comparison.domains.strength_power),
      comparisonRow('balance', comparison.domains.balance),
      comparisonRow('mobility', comparison.domains.mobility),
    ],
  };
}

function comparisonRow(
  id: MovementDomain,
  domain: MovementProfileV2RetestComparisonDomain
): NonNullable<UnifiedCheckUpResultsPresentation['comparison']>['rows'][number] {
  return {
    id,
    title: domain.metricLabel,
    ...('previousValue' in domain && typeof domain.previousValue === 'number'
      ? { previousLabel: `Previous: ${formatComparisonValue(domain.previousValue, domain.unit)}` }
      : {}),
    ...('currentValue' in domain && typeof domain.currentValue === 'number'
      ? { currentLabel: `Current: ${formatComparisonValue(domain.currentValue, domain.unit)}` }
      : {}),
    ...(domain.status === 'shown_separately' || domain.status === 'unavailable'
      ? { note: domain.note }
      : {}),
  };
}

function formatComparisonValue(
  value: number,
  unit: MovementProfileV2ComparisonUnit
): string {
  const rounded = unit === 'degrees' || unit === 'seconds' ? Math.round(value) : value;
  if (unit === 'degrees') return `${rounded}°`;
  if (unit === 'seconds') return `${rounded} sec`;
  return `${rounded} reps`;
}

function domainCardToPresentation(
  card: MovementProfileV2ResultsViewModel['domainCards'][number],
  focusDomain?: MovementProfileV2Domain
): UnifiedDomainResultCard {
  const id = domainId(card.domain);
  return {
    id,
    title: card.title,
    metricLabel: 'Result',
    metricValue: card.metric,
    interpretation: card.status,
    body: card.body,
    statusLabel: card.status,
    bandLabel: card.metric,
    featured: card.domain === focusDomain,
    tone: toneForCard(card),
    iconToken: iconToken(card.domain),
    accessibilityLabel: `${card.title}. ${card.metric}. ${card.status}. ${card.body}`,
  };
}

function planPresentation(
  viewModel: MovementProfileV2ResultsViewModel,
  planState: MovementProfileV2UnifiedPlanState
): UnifiedCheckUpResultsPresentation['plan'] {
  if (planState.status === 'ready' || planState.status === 'sync_pending_local_ready') {
    return {
      status: 'ready',
      title: 'Your 4-week plan is ready',
      body: viewModel.focus.kind === 'balanced'
        ? 'Your plan gives strength, balance, and mobility equal attention across each week.'
        : domainPlanBody(viewModel.focus.domain),
    };
  }
  if (planState.status === 'active_block_conflict') {
    return {
      status: 'conflict',
      title: 'Your current plan is unchanged.',
      body: 'You can still view this Movement Profile in Progress.',
    };
  }
  return {
    status: 'unavailable',
    title: planState.title ?? 'Plan unavailable right now',
    body: planState.body ?? `Your Strength Profile is saved, but ${BRAND.appName} could not find a matching prepared plan.`,
  };
}

function domainPlanBody(domain: MovementDomain | undefined): string {
  if (domain === 'balance') {
    return 'The plan gives extra attention to balance while still training strength and mobility.';
  }
  if (domain === 'mobility') {
    return 'The plan gives extra attention to mobility while still training strength and balance.';
  }
  return 'The plan gives extra attention to strength and power while still training balance and mobility.';
}

function toneForCard(card: MovementProfileV2ResultsViewModel['domainCards'][number]): UnifiedDomainResultCard['tone'] {
  if (card.status === 'Starting point') return 'attention';
  if (card.status === 'Saved result') return 'informational';
  return 'neutral';
}

function domainId(domain: MovementProfileV2Domain): UnifiedResultDomainId {
  if (domain === 'strength_power') return 'strength_power';
  if (domain === 'balance') return 'balance_stability';
  return 'mobility_flexibility';
}

function iconToken(domain: MovementProfileV2Domain): UnifiedDomainResultCard['iconToken'] {
  if (domain === 'strength_power') return 'strength';
  if (domain === 'balance') return 'balance';
  return 'mobility';
}

// Dimension-generic (REPOSITION_TDD §4): one card per registered
// camera-measured dimension — the view model already iterates the registry,
// so an empty result is the only impossible state worth guarding.
function toDomainCards(domains: UnifiedDomainResultCard[]): readonly UnifiedDomainResultCard[] {
  if (domains.length === 0) {
    throw new Error('Movement Profile V2 results require at least one dimension card.');
  }
  return domains;
}
