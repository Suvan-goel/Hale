import type { MovementDomain } from '../adherence';
import type { StoredCheckUp } from '../history';
import {
  latestOfficialMovementProfileV2Assessment,
  type OfficialMovementProfileV2AssessmentRecord,
} from '../pearlFlow/checkupHistory';
import type {
  BalanceInterpretation,
  ChairInterpretation,
  ChairPercentileRange,
  MovementProfileV2Assessment,
  MovementProfileV2DomainEvidence,
  StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';

import { BRAND } from '../brand';

export type MovementProfileV2Domain = MovementDomain;
export type MovementProfileV2ReportableDomain = Extract<MovementProfileV2Domain, 'strength_power' | 'balance'>;

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
  | 'Saved result'
  /** The battery never ran this domain (two-protocol check-up scope). */
  | 'Not measured';

export interface MovementProfileV2DomainCardViewModel {
  domain: MovementProfileV2ReportableDomain;
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
      | 'checkup_pearl_band_focus'
      | 'prior_focus_reference_supported'
      | 'balanced_insufficient_reference'
      | 'needs_retake';
  };
  focusTitle: string;
  focusBody: string;
  domainCards: MovementProfileV2DomainCardViewModel[];
}

// Pearl's official MVP protocol trains and reports Strength + Balance. Legacy
// full-battery records may still contain Mobility data, but the active product
// must not render an empty or unprescribed Mobility card. Clarity is presented
// separately as observational personal signals.
const DOMAIN_ORDER: readonly MovementProfileV2ReportableDomain[] = ['strength_power', 'balance'];

function isReportableDomain(domain: MovementProfileV2Domain): domain is MovementProfileV2ReportableDomain {
  return domain === 'strength_power' || domain === 'balance';
}

export interface MovementProfileV2ResultsViewModelOptions {
  /**
   * Population-comparison opt-in (REPOSITION_TDD slice 5, founder conditions
   * 2026-07-06): baseline-relative is the default everywhere — explicit
   * "for your age group" comparison copy renders ONLY when she opted in, and
   * only where the claim-eligibility machinery already supports it. The
   * percentile-derived Strength tier is also suppressed unless she opts in.
   */
  comparisonOptIn?: boolean;
}

export function buildMovementProfileV2ResultsViewModel(input: {
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  comparisonOptIn?: boolean;
}): MovementProfileV2ResultsViewModel {
  const focus = focusDisplay(input.assessment);
  const comparisonOptIn = input.comparisonOptIn === true;
  return {
    checkUpId: input.snapshot.sourceCheckUpId,
    dateLabel: formatDate(input.snapshot.sourceCheckUpId),
    title: 'Your Movement Check-Up',
    summary: 'Camera results are beta estimates to help you track Strength and Balance at home.',
    focus,
    focusTitle: focus.kind === 'balanced' ? 'Suggested focus: Balanced plan' : `Suggested focus: ${focus.title}`,
    focusBody: focus.body,
    domainCards: DOMAIN_ORDER.map((domain) => domainCard(domain, input.snapshot, comparisonOptIn)),
  };
}

export function latestMovementProfileV2ResultsViewModel(
  history: readonly StoredCheckUp[] | null | undefined,
  options?: MovementProfileV2ResultsViewModelOptions
): MovementProfileV2ResultsViewModel | null {
  const latest = latestOfficialMovementProfileV2Assessment(history);
  return latest ? movementProfileV2ResultsViewModelForRecord(latest, options) : null;
}

export function movementProfileV2ResultsViewModelForRecord(
  record: OfficialMovementProfileV2AssessmentRecord,
  options?: MovementProfileV2ResultsViewModelOptions
): MovementProfileV2ResultsViewModel {
  return buildMovementProfileV2ResultsViewModel({
    snapshot: record.snapshot,
    assessment: record.assessment,
    comparisonOptIn: options?.comparisonOptIn,
  });
}

function domainCard(
  domain: MovementProfileV2ReportableDomain,
  snapshot: StoredMovementProfileV2Snapshot,
  comparisonOptIn: boolean
): MovementProfileV2DomainCardViewModel {
  if (domain === 'strength_power') return chairCard(snapshot.interpretation.chair, comparisonOptIn);
  return balanceCard(snapshot.interpretation.balance, comparisonOptIn);
}

function chairCard(chair: ChairInterpretation, comparisonOptIn: boolean): MovementProfileV2DomainCardViewModel {
  const reps = chair.rawMetric?.value;
  return {
    domain: 'strength_power',
    title: 'Strength',
    metric: Number.isFinite(reps) ? `${reps} rises in 30 seconds` : 'Not measured',
    status: comparisonOptIn ? chairTier(chair.percentileRange) : 'Saved result',
    body: comparisonOptIn
      ? chairEvidence(chair.percentileRange)
      : chair.percentileRange
        ? 'Adds to your own strength trend with every check-up.'
        : chairEvidence(null),
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

function balanceCard(balance: BalanceInterpretation, comparisonOptIn: boolean): MovementProfileV2DomainCardViewModel {
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
          ? comparisonOptIn
            ? 'Compared with typical results for your age group.'
            : 'Adds to your own balance trend with every check-up.'
          : 'Your longest steady hold from this check-up.',
  };
}

function balanceTier(balance: BalanceInterpretation): MovementProfileV2StatusTier {
  if (balance.taskBand === 'ceiling_complete') return 'Strong';
  if (balance.taskBand === 'building') return 'Building';
  if (balance.taskBand === 'starting_point' || balance.taskBand === 'starting_point_low') {
    return 'Starting point';
  }
  return 'Saved result';
}

function focusDisplay(assessment: MovementProfileV2Assessment): MovementProfileV2ResultsViewModel['focus'] {
  const focus = assessment.focus;
  if (focus.kind === 'domain') {
    if (focus.focusDomain === 'mobility') {
      return {
        kind: 'balanced',
        title: 'Balanced',
        body: `This older check-up included Mobility. ${BRAND.appName} keeps the result in your history, while current programmes use Strength and Balance.`,
        planMode: 'balanced_insufficient_reference',
      };
    }
    return {
      kind: 'domain',
      domain: focus.focusDomain,
      title: domainTitle(focus.focusDomain),
      body: focus.planMode === 'prior_focus_reference_supported'
        ? `Your results were broadly matched, so ${BRAND.appName} kept the focus from your last phase.`
        : strongestAssetBody(assessment, focus.focusDomain),
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
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

/**
 * Diagnosis-shaped first-assessment body (REPOSITION_TDD §2.3, approved):
 * "[strongest] is your strongest asset. [focus] is your biggest opportunity —
 * your plan starts there." The ranking is ORDINAL ONLY, derived from the
 * evidence categories the focus engine already computed (no new scoring, no
 * numbers) and only from reference-supported evidence — when eligibility
 * can't support naming an asset, this falls back to the honest focus line
 * rather than fabricating a ranking. Ties are named honestly in the plural.
 */
function strongestAssetBody(assessment: MovementProfileV2Assessment, focusDomain: MovementProfileV2Domain): string {
  const fallback = "This was the clearest area to build from today's Check-Up.";
  const assets = strongestAssets(assessment, focusDomain);
  if (assets.length === 0) return fallback;
  const assetPhrase =
    assets.length === 1
      ? `${assetName(assets[0])} is your strongest asset.`
      : `${assets.map(assetName).join(' and ')} are your strongest assets.`;
  return `${assetPhrase} ${assetName(focusDomain)} is your biggest opportunity — your plan starts there.`;
}

// Ordinal tiers over the focus engine's evidence categories. Only
// reference-supported categories can name an asset; raw-only and invalid
// evidence never rank (never a fabricated ranking).
function assetTier(category: MovementProfileV2DomainEvidence['category']): 2 | 1 | 0 {
  if (category === 'above_reference_or_ceiling') return 2;
  if (category === 'within_reference' || category === 'pearl_building') return 1;
  return 0;
}

function strongestAssets(
  assessment: MovementProfileV2Assessment,
  focusDomain: MovementProfileV2Domain
): MovementProfileV2Domain[] {
  const evidence = assessment.focusProvenance?.domainEvidence ?? [];
  const candidates = evidence
    .filter((item) => item.domain !== focusDomain && isReportableDomain(item.domain))
    .map((item) => ({ domain: item.domain, tier: assetTier(item.category) }))
    .filter((item) => item.tier > 0);
  if (candidates.length === 0) return [];
  const topTier = Math.max(...candidates.map((item) => item.tier));
  return DOMAIN_ORDER.filter((domain) =>
    candidates.some((item) => item.domain === domain && item.tier === topTier)
  );
}

function assetName(domain: MovementProfileV2Domain): string {
  if (domain === 'strength_power') return 'Strength';
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
