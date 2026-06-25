import type { MovementDomain } from '../adherence';
import type { StoredCheckUp } from '../history';
import {
  latestOfficialMovementProfileV2Assessment,
  type OfficialMovementProfileV2AssessmentRecord,
} from '../haleFlow/checkupHistory';
import type {
  BalanceInterpretation,
  ChairInterpretation,
  MovementProfileV2Assessment,
  ShoulderInterpretation,
  StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';

export type MovementProfileV2Domain = MovementDomain;

export interface MovementProfileV2DomainCardViewModel {
  domain: MovementProfileV2Domain;
  title: string;
  metric: string;
  status: string;
  body: string;
}

export interface MovementProfileV2DomainDetailViewModel extends MovementProfileV2DomainCardViewModel {
  rows: { label: string; value: string }[];
  note: string;
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
      | 'goal_led_reference_supported'
      | 'balanced_insufficient_reference'
      | 'needs_retake';
  };
  focusTitle: string;
  focusBody: string;
  domainCards: MovementProfileV2DomainCardViewModel[];
  domainDetails: MovementProfileV2DomainDetailViewModel[];
}

const DOMAIN_ORDER: readonly MovementProfileV2Domain[] = ['strength_power', 'balance', 'mobility'];

export function buildMovementProfileV2ResultsViewModel(input: {
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
}): MovementProfileV2ResultsViewModel {
  const domainDetails = DOMAIN_ORDER.map((domain) => domainDetail(domain, input.snapshot));
  const focus = focusDisplay(input.assessment);
  return {
    checkUpId: input.snapshot.sourceCheckUpId,
    dateLabel: formatDate(input.snapshot.sourceCheckUpId),
    title: 'Your Movement Profile',
    summary:
      "Where available, comparisons use published reference groups and the setup recorded during your Check-Up. Hale's camera results are beta estimates, not medical assessments.",
    focus,
    focusTitle: focus.kind === 'balanced' ? 'Suggested focus: Balanced plan' : `Suggested focus: ${focus.title}`,
    focusBody: focus.body,
    domainCards: domainDetails.map(({ rows: _rows, note: _note, ...card }) => card),
    domainDetails,
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

export function movementProfileV2DomainDetail(
  viewModel: MovementProfileV2ResultsViewModel,
  domain: MovementProfileV2Domain
): MovementProfileV2DomainDetailViewModel | null {
  return viewModel.domainDetails.find((item) => item.domain === domain) ?? null;
}

function domainDetail(
  domain: MovementProfileV2Domain,
  snapshot: StoredMovementProfileV2Snapshot
): MovementProfileV2DomainDetailViewModel {
  if (domain === 'strength_power') return chairDetail(snapshot.interpretation.chair);
  if (domain === 'balance') return balanceDetail(snapshot.interpretation.balance);
  return shoulderDetail(snapshot.interpretation.shoulder);
}

function chairDetail(chair: ChairInterpretation): MovementProfileV2DomainDetailViewModel {
  const reps = chair.rawMetric?.value;
  const metric = Number.isFinite(reps) ? `${reps} rises in 30 seconds` : 'Not measured';
  const status = chair.percentileRange ? 'Published comparison saved' : 'Saved as your personal baseline';
  return {
    domain: 'strength_power',
    title: 'Strength / Power',
    metric,
    status,
    body: chair.percentileRange
      ? 'Hale saved the published comparison that was available for this check-up.'
      : 'Hale saved this raw chair-rise result without a published comparison.',
    rows: [
      { label: '30-second protocol', value: metric },
      { label: 'Reference status', value: status },
      { label: 'Use in focus', value: chair.percentileRange ? 'Reference-supported' : 'Raw baseline only' },
    ],
    note: 'This is a measurement summary, not a form critique or diagnosis.',
  };
}

function balanceDetail(balance: BalanceInterpretation): MovementProfileV2DomainDetailViewModel {
  const seconds = balance.rawMetric?.value;
  const eyesOpenLadder = balance.rawMetric?.metricId === 'balance_eyes_open_total';
  const metric = Number.isFinite(seconds)
    ? eyesOpenLadder
      ? `${formatNumber(seconds)} sec total held`
      : `${formatNumber(seconds)} sec best hold`
    : 'Not measured';
  const band = balance.taskBand ? balanceBandLabel(balance.taskBand) : 'Raw result only';
  const benchmark = balance.sourceBenchmark ? 'Published age-group benchmark saved' : band;
  return {
    domain: 'balance',
    title: 'Balance',
    metric,
    status: benchmark,
    body: eyesOpenLadder
      ? 'Hale saved the four-stage eyes-open ladder as a new balance comparison series.'
      : balance.reachedCeiling
        ? 'This check-up reached the 45-second task ceiling.'
        : 'Hale uses the best valid trial from this frozen check-up.',
    rows: [
      { label: eyesOpenLadder ? 'Eyes-open ladder' : 'Best hold', value: metric },
      { label: eyesOpenLadder ? 'Comparison status' : 'Task band', value: band },
      ...(eyesOpenLadder && balance.rawMetric?.metricId === 'balance_eyes_open_total'
        ? [{ label: 'Stages completed', value: `${balance.rawMetric.completedStageCount} of 4` }]
        : []),
      { label: 'Standing leg', value: balance.selectedStandingLeg ? sideLabel(balance.selectedStandingLeg) : 'Not saved' },
    ],
    note: 'Balance labels describe this home task only and are not a fall-risk diagnosis.',
  };
}

function shoulderDetail(shoulder: ShoulderInterpretation): MovementProfileV2DomainDetailViewModel {
  const degrees = shoulder.rawMetric?.value;
  const metric = Number.isFinite(degrees)
    ? `${formatNumber(degrees)} deg ${sideLabel(shoulder.selectedSide)}`
    : 'Not measured';
  const status = shoulder.iqr ? shoulderIqrLabel(shoulder.iqr.category) : 'Raw angle only';
  return {
    domain: 'mobility',
    title: 'Mobility',
    metric,
    status,
    body: shoulder.painLimited
      ? 'This capture was marked pain-limited, so Hale keeps the result cautious.'
      : 'Hale stores the active shoulder-reach angle from the selected side.',
    rows: [
      { label: 'Shoulder reach', value: metric },
      { label: 'Reference status', value: status },
      { label: 'Selected side', value: shoulder.selectedSide ? sideLabel(shoulder.selectedSide) : 'Not saved' },
    ],
    note: 'Mobility reference labels are broad bands, not medical ranges.',
  };
}

function focusDisplay(assessment: MovementProfileV2Assessment): MovementProfileV2ResultsViewModel['focus'] {
  const focus = assessment.focus;
  if (focus.kind === 'domain') {
    return {
      kind: 'domain',
      domain: focus.focusDomain,
      title: domainTitle(focus.focusDomain),
      body: focus.planMode === 'goal_led_reference_supported'
        ? 'Your results were broadly matched, so Hale used your goal to guide the suggestion.'
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
    body: 'A retake is needed before Hale can suggest a focus from this profile.',
    planMode: focus.planMode,
  };
}

function domainTitle(domain: MovementProfileV2Domain): string {
  if (domain === 'strength_power') return 'Strength / Power';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function balanceBandLabel(band: NonNullable<BalanceInterpretation['taskBand']>): string {
  if (band === 'ceiling_complete') return 'Full 45-second hold completed';
  if (band === 'building') return 'Building the hold';
  if (band === 'starting_point_low') return 'A clear place to build';
  return 'Starting point';
}

function shoulderIqrLabel(category: NonNullable<ShoulderInterpretation['iqr']>['category']): string {
  if (category === 'below_published_middle_range') return 'Below the published middle range';
  if (category === 'above_published_middle_range') return 'Above the published middle range';
  return 'Within the published middle range';
}

function sideLabel(side: string | null | undefined): string {
  if (side === 'left') return 'left side';
  if (side === 'right') return 'right side';
  return 'selected side';
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
