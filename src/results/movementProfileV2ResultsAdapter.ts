import type {
  MovementProfileV2ReportableDomain,
  MovementProfileV2ResultsViewModel,
} from '../movementProfileV2/viewModel';
import type {
  UnifiedCheckUpResultsPresentation,
  UnifiedDomainResultCard,
  UnifiedResultDomainId,
} from './types';

/**
 * Fresh check-ups use one concise completion presentation; saved history keeps
 * the detailed read-only breakdown. Progress owns Clarity and change over time,
 * while Settings owns the optional published-value comparison preference. The
 * adapter stays downstream of the frozen view model only (architecture pin).
 */
export function buildMovementProfileV2UnifiedResultsPresentation(input: {
  viewModel: MovementProfileV2ResultsViewModel;
  variant?: 'standard' | 'onboarding' | 'history';
}): UnifiedCheckUpResultsPresentation {
  // A saved profile opened later from Progress uses honest read-only copy and
  // the shell's detailed history layout.
  const historyMode = input.variant === 'history';
  const domains = input.viewModel.domainCards.map((card) =>
    domainCardToPresentation(card, {
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
      eyebrow: historyMode ? 'Saved check-up' : 'Movement Check-Up',
      title: historyMode ? 'Your Movement Check-Up' : 'Check-up complete',
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
    domains: toDomainCards(domains),
    caveat: input.viewModel.summary,
    actions: [
      {
        id: 'done',
        label:
          input.variant === 'onboarding'
            ? 'Continue'
            : historyMode
              ? 'Done'
              : 'Return Home',
        action: { type: 'done' },
        button: 'primary',
      },
    ],
    accessibility: {
      screenSummary: 'Movement Check-Up results',
    },
  };
}

function domainCardToPresentation(
  card: MovementProfileV2ResultsViewModel['domainCards'][number],
  options?: { suppressStatusTier?: boolean }
): UnifiedDomainResultCard {
  const id = domainId(card.domain);
  const suppressTier = options?.suppressStatusTier === true;
  return {
    id,
    title: card.title,
    metricLabel: 'Result',
    metricValue: card.metric,
    ...(suppressTier ? {} : { interpretation: card.status }),
    body: card.body,
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

function domainId(domain: MovementProfileV2ReportableDomain): UnifiedResultDomainId {
  return domain === 'strength_power' ? 'strength_power' : 'balance_stability';
}

function iconToken(domain: MovementProfileV2ReportableDomain): UnifiedDomainResultCard['iconToken'] {
  return domain === 'strength_power' ? 'strength' : 'balance';
}

// The official view model always supplies Strength and Balance; keep the
// impossible empty-state guard at this presentation boundary.
function toDomainCards(domains: UnifiedDomainResultCard[]): readonly UnifiedDomainResultCard[] {
  if (domains.length === 0) {
    throw new Error('Movement Profile V2 results require at least one dimension card.');
  }
  return domains;
}
