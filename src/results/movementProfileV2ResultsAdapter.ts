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

/**
 * Results adapter, restored 2026-07-08 (founder direction) in a v2 trim: the
 * old engine's plan states and block-bound retest comparison did not return;
 * Progress owns the twelve-week journey and change-over-time view. The
 * adapter stays downstream of the frozen view model only (architecture pin).
 */
export interface MovementProfileV2PopulationComparisonInput {
  /** True from the second stored official check-up onward (condition 1: the
   * first assessment stays purely diagnosis-shaped — no affordance). */
  available: boolean;
  optedIn: boolean;
}

export function buildMovementProfileV2UnifiedResultsPresentation(input: {
  viewModel: MovementProfileV2ResultsViewModel;
  variant?: 'standard' | 'onboarding' | 'history';
  populationComparison?: MovementProfileV2PopulationComparisonInput;
}): UnifiedCheckUpResultsPresentation {
  // A saved profile opened later from Progress: same layout as fresh results,
  // but read-only — honest "saved" copy.
  const historyMode = input.variant === 'history';
  const domains = input.viewModel.domainCards.map((card) =>
    domainCardToPresentation(card, input.viewModel.focus.domain, {
      // Founder decision 2026-07-06: the FIRST-EVER results stay purely
      // diagnosis-shaped — no tier chip, consistent with the comparison
      // affordance being gated off there. Tiers remain the app-wide band
      // vocabulary everywhere else (Today, Progress, later check-ups).
      suppressStatusTier: input.variant === 'onboarding',
    })
  );
  return {
    variant: input.variant ?? 'standard',
    header: {
      eyebrow:
        input.variant === 'onboarding'
          ? 'Check-up complete'
          : historyMode
            ? 'Saved check-up'
            : 'Movement Check-Up',
      title: 'Your Movement Check-Up',
      completedAtLabel: input.viewModel.dateLabel,
      subtitle: historyMode
        ? 'A saved check-up from your history. Opening it does not change your plan.'
        : 'Your Strength and Balance results are saved.',
    },
    focus: {
      kicker: historyMode ? 'Focus at the time' : 'Where to focus',
      title: input.viewModel.focus.title,
      body: input.viewModel.focus.body,
    },
    domainSection: {
      title: 'Strength and Balance',
    },
    domains: toDomainCards(domains),
    plan: { status: 'hidden' },
    caveat: input.viewModel.summary,
    populationComparison: populationComparisonPresentation(input.variant, input.populationComparison),
    actions: [
      {
        id: 'done',
        label: 'Done',
        action: { type: 'done' },
        button: 'primary',
      },
    ],
    accessibility: {
      screenSummary: 'Movement Check-Up results',
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

function domainCardToPresentation(
  card: MovementProfileV2ResultsViewModel['domainCards'][number],
  focusDomain?: MovementProfileV2Domain,
  options?: { suppressStatusTier?: boolean }
): UnifiedDomainResultCard {
  const id = domainId(card.domain);
  const suppressTier = options?.suppressStatusTier === true;
  return {
    id,
    title: card.title,
    metricLabel: 'Result',
    metricValue: card.metric,
    ...(suppressTier ? {} : { interpretation: card.status, statusLabel: card.status }),
    body: card.body,
    bandLabel: card.metric,
    featured: card.domain === focusDomain,
    tone: toneForCard(card),
    iconToken: iconToken(card.domain),
    accessibilityLabel: suppressTier
      ? `${card.title}. ${card.metric}. ${card.body}`
      : `${card.title}. ${card.metric}. ${card.status}. ${card.body}`,
  };
}

function toneForCard(card: MovementProfileV2ResultsViewModel['domainCards'][number]): UnifiedDomainResultCard['tone'] {
  if (card.status === 'Starting point') return 'attention';
  if (card.status === 'Saved result' || card.status === 'Not measured') return 'informational';
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
