import type { MovementDomain } from '../adherence';
import type { StoredCheckUp } from '../history';
import {
  latestOfficialMovementProfileV2Assessment,
  type OfficialMovementProfileV2AssessmentRecord,
} from '../haleFlow/checkupHistory';
import type {
  BalanceInterpretation,
  ChairInterpretation,
  ChairPercentileRange,
  MovementProfileV2Assessment,
  ShoulderInterpretation,
  StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';

import { BRAND } from '../brand';
import { objectiveMovementDomains } from '../dimensions';

export type MovementProfileV2Domain = MovementDomain;

/**
 * The one plain status vocabulary shown everywhere a domain result appears
 * (check-up results, Progress). Tiers rise Starting point → Building →
 * On track → Strong; 'Saved result' covers results with no age reference.
 * Strength tiers follow the same percentile cut-offs as the assessment
 * engine's evidence bands (high ≤ 25, ≤ 40, ≤ 60).
 */
export type MovementProfileV2StatusTier =
  | 'Starting point'
  | 'Building'
  | 'On track'
  | 'Strong'
  | 'Saved result';

export interface MovementProfileV2DomainCardViewModel {
  domain: MovementProfileV2Domain;
  title: string;
  metric: string;
  status: MovementProfileV2StatusTier;
  body: string;
}

export interface MovementProfileV2ResultsViewModel {
  checkUpId: string;
  dateLabel: string;
  title: string;
  summary: string;
  focus: {
    kind: 'domain' | 'balanced' | 'needs_retake';
    title: string;
    body: string;
    domain?: MovementProfileV2Domain;
    planMode:
      | 'checkup_reference_focus'
      | 'checkup_hale_band_focus'
      | 'prior_focus_reference_supported'
      | 'balanced_insufficient_reference'
      | 'needs_retake';
  };
  focusTitle: string;
  focusBody: string;
  domainCards: MovementProfileV2DomainCardViewModel[];
}

// Registry-derived (REPOSITION_TDD §4): camera-measured dimensions in surface
// order. Clarity is structurally excluded — self-report never renders as a
// measurement card.
const DOMAIN_ORDER: readonly MovementProfileV2Domain[] = objectiveMovementDomains();

export function buildMovementProfileV2ResultsViewModel(input: {
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
}): MovementProfileV2ResultsViewModel {
  const focus = focusDisplay(input.assessment);
  return {
    checkUpId: input.snapshot.sourceCheckUpId,
    dateLabel: formatDate(input.snapshot.sourceCheckUpId),
    title: 'Your Movement Profile',
    summary: 'Camera results are beta estimates to help you track your movement at home.',
    focus,
    focusTitle: focus.kind === 'balanced' ? 'Suggested focus: Balanced plan' : `Suggested focus: ${focus.title}`,
    focusBody: focus.body,
    domainCards: DOMAIN_ORDER.map((domain) => domainCard(domain, input.snapshot)),
  };
}

export function latestMovementProfileV2ResultsViewModel(
  history: readonly StoredCheckUp[] | null | undefined
): MovementProfileV2ResultsViewModel | null {
  const latest = latestOfficialMovementProfileV2Assessment(history);
  return latest ? movementProfileV2ResultsViewModelForRecord(latest) : null;
}

export function movementProfileV2ResultsViewModelForRecord(
  record: OfficialMovementProfileV2AssessmentRecord
): MovementProfileV2ResultsViewModel {
  return buildMovementProfileV2ResultsViewModel({
    snapshot: record.snapshot,
    assessment: record.assessment,
  });
}

function domainCard(
  domain: MovementProfileV2Domain,
  snapshot: StoredMovementProfileV2Snapshot
): MovementProfileV2DomainCardViewModel {
  if (domain === 'strength_power') return chairCard(snapshot.interpretation.chair);
  if (domain === 'balance') return balanceCard(snapshot.interpretation.balance);
  return shoulderCard(snapshot.interpretation.shoulder);
}

function chairCard(chair: ChairInterpretation): MovementProfileV2DomainCardViewModel {
  const reps = chair.rawMetric?.value;
  return {
    domain: 'strength_power',
    title: 'Strength / Power',
    metric: Number.isFinite(reps) ? `${reps} rises in 30 seconds` : 'Not measured',
    status: chairTier(chair.percentileRange),
    body: chairEvidence(chair.percentileRange),
  };
}

// Tier cut-offs mirror chairRangeEvidenceBand in the assessment engine.
function chairTier(range: ChairPercentileRange | null): MovementProfileV2StatusTier {
  if (!range) return 'Saved result';
  if (range.kind === 'below_10') return 'Starting point';
  if (range.kind === 'above_90') return 'Strong';
  if (range.high <= 25) return 'Starting point';
  if (range.high <= 40) return 'Building';
  if (range.high <= 60) return 'On track';
  return 'Strong';
}

function chairEvidence(range: ChairPercentileRange | null): string {
  if (!range) return 'Saved as your personal starting point.';
  if (range.kind === 'below_10') return 'Below the 10th percentile for your age group.';
  if (range.kind === 'above_90') return 'Above the 90th percentile for your age group.';
  return `Around the ${range.low}th-${range.high}th percentile for your age group.`;
}

function balanceCard(balance: BalanceInterpretation): MovementProfileV2DomainCardViewModel {
  const seconds = balance.rawMetric?.value;
  const eyesOpenLadder = balance.rawMetric?.metricId === 'balance_eyes_open_total';
  return {
    domain: 'balance',
    title: 'Balance',
    metric: Number.isFinite(seconds)
      ? eyesOpenLadder
        ? `${formatNumber(seconds)} sec total held`
        : `${formatNumber(seconds)} sec best hold`
      : 'Not measured',
    status: balanceTier(balance),
    body: eyesOpenLadder
      ? 'Total time held across four balance stances, eyes open.'
      : balance.reachedCeiling
        ? 'You held the full 45 seconds — the longest this check-up measures.'
        : balance.sourceBenchmark
          ? 'Compared with typical results for your age group.'
          : 'Your longest steady hold from this check-up.',
  };
}

function balanceTier(balance: BalanceInterpretation): MovementProfileV2StatusTier {
  if (balance.sourceBenchmark) return 'On track';
  if (balance.taskBand === 'ceiling_complete') return 'Strong';
  if (balance.taskBand === 'building') return 'Building';
  if (balance.taskBand === 'starting_point' || balance.taskBand === 'starting_point_low') return 'Starting point';
  return 'Saved result';
}

function shoulderCard(shoulder: ShoulderInterpretation): MovementProfileV2DomainCardViewModel {
  const degrees = shoulder.rawMetric?.value;
  return {
    domain: 'mobility',
    title: 'Mobility',
    metric: Number.isFinite(degrees) ? `${formatNumber(degrees)}° reach` : 'Not measured',
    status: shoulderTier(shoulder),
    body: shoulder.painLimited
      ? `You noted pain during this reach, so ${BRAND.appName} keeps the result cautious.`
      : shoulderEvidence(shoulder),
  };
}

function shoulderTier(shoulder: ShoulderInterpretation): MovementProfileV2StatusTier {
  const category = shoulder.iqr?.category;
  if (category === 'above_published_middle_range') return 'Strong';
  if (category === 'within_published_middle_range') return 'On track';
  if (category === 'below_published_middle_range') return 'Building';
  return 'Saved result';
}

function shoulderEvidence(shoulder: ShoulderInterpretation): string {
  const category = shoulder.iqr?.category;
  if (category === 'above_published_middle_range') return 'Above the typical range for your age group.';
  if (category === 'within_published_middle_range') return 'Within the typical range for your age group.';
  if (category === 'below_published_middle_range') return 'Below the typical range for your age group.';
  return 'Saved as your personal starting point.';
}

function focusDisplay(assessment: MovementProfileV2Assessment): MovementProfileV2ResultsViewModel['focus'] {
  const focus = assessment.focus;
  if (focus.kind === 'domain') {
    return {
      kind: 'domain',
      domain: focus.focusDomain,
      title: domainTitle(focus.focusDomain),
      body: focus.planMode === 'prior_focus_reference_supported'
        ? `Your results were broadly matched, so ${BRAND.appName} kept the focus from your last block.`
        : "This was the clearest area to build from today's Check-Up.",
      planMode: focus.planMode,
    };
  }
  if (focus.kind === 'balanced') {
    return {
      kind: 'balanced',
      title: 'Balanced',
      body: 'Your results did not point to one clear area today.',
      planMode: focus.planMode,
    };
  }
  return {
    kind: 'needs_retake',
    title: 'Retake needed',
    body: `A retake is needed before ${BRAND.appName} can suggest a focus from this profile.`,
    planMode: focus.planMode,
  };
}

function domainTitle(domain: MovementProfileV2Domain): string {
  if (domain === 'strength_power') return 'Strength / Power';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved check-up';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
