import type { StoredCheckUp, StoredCheckUpType } from '../history';
import {
  buildMovementProfileV2ResultsViewModel,
  type MovementProfileV2Domain,
} from '../movementProfileV2/viewModel';
import { type MovementProfileV2Assessment } from '../reference/movementProfileV2';
import type { StoredMovementProfileV2Snapshot } from '../reference/movementProfileV2';
import {
  officialMovementProfileV2AssessmentSelection,
  type OfficialMovementProfileV2AssessmentRecord,
} from './checkupHistory';

import { BRAND } from '../brand';
export type MovementProfileV2ProgressStatus =
  | 'ready'
  | 'no_profile'
  | 'needs_retake'
  | 'artifact_recovery';

export interface MovementProfileV2ProgressAction {
  id: 'start_movement_checkup';
  label: string;
}

export interface MovementProfileV2ProgressDomainSummary {
  domain: MovementProfileV2Domain;
  title: string;
  metric: string;
}

export interface MovementProfileV2ProgressHero {
  dateLabel: string;
  domains: readonly MovementProfileV2ProgressDomainSummary[];
}

export type MovementProfileV2ProgressChangeDirection = 'up' | 'down' | 'steady';

export interface MovementProfileV2ProgressChangeDomain {
  domain: MovementProfileV2Domain;
  title: string;
  direction: MovementProfileV2ProgressChangeDirection;
  value: string;
  caption: string;
  /**
   * The exact-protocol personal series behind this change. Keeping these
   * points in the view model lets Progress draw a truthful chart without
   * reparsing display copy or mixing measurements from different methods.
   */
  series: readonly {
    atIso: string;
    dateLabel: string;
    value: number;
  }[];
  /**
   * Worse-never-bare (REPOSITION_TDD §2.4, approved 2026-07-06): every `down`
   * row carries the trainable path — a lower reading is never presented bare.
   * Undefined for up/steady rows. Known-driver context (sleep, symptom load)
   * joins when check-up covariates exist (slice 4).
   */
  supportCopy?: string;
}

export interface MovementProfileV2ProgressChange {
  headline: string;
  domains: readonly MovementProfileV2ProgressChangeDomain[];
}

export type MovementProfileV2ProgressChangeReadiness =
  | { status: 'ready' }
  | {
      status: 'building_baseline' | 'new_method_baseline' | 'not_comparable';
      title: string;
      body: string;
    };

export interface MovementProfileV2HistoryEntry {
  id: string;
  sourceLabel: string;
  dateLabel: string;
  focusTitle: string;
}

export type MovementProfileV2ProgressViewModel =
  | {
      status: 'ready';
      hero: MovementProfileV2ProgressHero;
      change: MovementProfileV2ProgressChange | null;
      changeReadiness: MovementProfileV2ProgressChangeReadiness;
      officialHistory: readonly MovementProfileV2HistoryEntry[];
    }
  | {
      status: Exclude<MovementProfileV2ProgressStatus, 'ready'>;
      recovery: {
        title: string;
        body: string;
      };
      actions: readonly MovementProfileV2ProgressAction[];
    };

export interface MovementProfileV2ProgressInput {
  history: readonly StoredCheckUp[] | null | undefined;
}

type AcceptedProfile = OfficialMovementProfileV2AssessmentRecord;

export function buildMovementProfileV2ProgressViewModel(
  input: MovementProfileV2ProgressInput
): MovementProfileV2ProgressViewModel {
  const history = input.history ?? [];
  const selection = officialMovementProfileV2AssessmentSelection(history);
  const acceptedProfiles = sortProfiles(selection.records);
  const hasMalformedState = hasMalformedArtifacts({
    history,
    selectionConflictCount: selection.conflicts.length,
  });

  const latest = acceptedProfiles[acceptedProfiles.length - 1] ?? null;
  if (!latest) {
    if (hasMalformedState) {
      return {
        status: 'artifact_recovery',
        recovery: {
          title: 'Check-up results need attention',
          body: `Your saved check-up data is still on this phone, but ${BRAND.appName} cannot safely show it here yet.`,
        },
        actions: [],
      };
    }
    return {
      status: 'no_profile',
      recovery: {
        title: 'Complete your Movement Check-Up',
        body: 'Your Strength and Balance results will appear here after your Check-Up.',
      },
      actions: [{ id: 'start_movement_checkup', label: 'Start Movement Check-Up' }],
    };
  }

  const profileViewModel = buildMovementProfileV2ResultsViewModel({
    snapshot: latest.snapshot,
    assessment: latest.assessment,
  });
  if (profileViewModel.focus.kind === 'needs_retake') {
    return {
      status: 'needs_retake',
      recovery: {
        title: 'Retake your Movement Check-Up',
        body: `Your latest Check-Up is saved, but ${BRAND.appName} needs a retake before showing the results.`,
      },
      actions: [{ id: 'start_movement_checkup', label: 'Start Movement Check-Up' }],
    };
  }

  const hero: MovementProfileV2ProgressHero = {
    dateLabel: profileViewModel.dateLabel,
    domains: profileViewModel.domainCards.map((card) => ({
      domain: card.domain,
      title: card.title,
      metric: card.metric,
    })),
  };

  const changeState = buildMovementProfileV2ProgressChangeState(acceptedProfiles);
  return {
    status: 'ready',
    hero,
    change: changeState.change,
    changeReadiness: changeState.readiness,
    officialHistory: buildOfficialHistory(acceptedProfiles),
  };
}

// Only the two movement domains in Pearl's official MVP protocol. Clarity has
// its own observational trend; legacy Mobility data is preserved but hidden.
const CHANGE_DOMAIN_ORDER: readonly MovementProfileV2Domain[] = ['strength_power', 'balance'];

// Minimum change (in each domain's own raw unit) worth calling a move rather than
// noise. Between-session setup variance is the product's #1 measurement threat, so
// small differences are reported as "holding steady", never as progress or decline.
const CHANGE_MIN_DELTA: Record<DomainReading['unit'], number> = {
  reps: 1,
  seconds: 3,
  degrees: 5,
};

interface DomainReading {
  value: number;
  metricId: string;
  unit: 'reps' | 'seconds' | 'degrees';
}

function buildMovementProfileV2ProgressChangeState(
  profiles: readonly AcceptedProfile[]
): {
  change: MovementProfileV2ProgressChange | null;
  readiness: MovementProfileV2ProgressChangeReadiness;
} {
  if (profiles.length < 2) {
    return {
      change: null,
      readiness: {
        status: 'building_baseline',
        title: 'Your baseline is saved',
        body: 'After your next comparable programme check-up, you’ll see how Strength and Balance changed.',
      },
    };
  }
  const latestProfile = profiles[profiles.length - 1];
  // A protocol change establishes a new personal series. Find the earliest
  // accepted profile that is genuinely comparable with the latest rather than
  // letting one older legacy/different-protocol record suppress progress
  // forever.
  const baselineProfile = profiles.find((profile) =>
    profilesShareMeasurementProtocol(profile, latestProfile)
  );
  if (!baselineProfile || baselineProfile === latestProfile) {
    return {
      change: null,
      readiness: {
        status: 'new_method_baseline',
        title: 'A new comparison baseline has started',
        body: 'This check-up used a different measurement method. One more comparable check-up will show change without mixing unlike results.',
      },
    };
  }
  const domains: MovementProfileV2ProgressChangeDomain[] = [];
  for (const domain of CHANGE_DOMAIN_ORDER) {
    const baseline = domainReading(domain, baselineProfile.snapshot);
    const latest = domainReading(domain, latestProfile.snapshot);
    if (!baseline || !latest || baseline.metricId !== latest.metricId) continue;
    const series = profiles.flatMap((profile) => {
      if (!profilesShareMeasurementProtocol(profile, latestProfile)) return [];
      const reading = domainReading(domain, profile.snapshot);
      if (!reading || reading.metricId !== latest.metricId) return [];
      return [{
        atIso: profile.assessment.sourceCheckUpId,
        dateLabel: formatDate(profile.assessment.sourceCheckUpId),
        value: reading.value,
      }];
    });
    domains.push(changeDomain(domain, baseline, latest, series));
  }
  if (domains.length === 0) {
    return {
      change: null,
      readiness: {
        status: 'not_comparable',
        title: 'Change is not available yet',
        body: `The saved check-ups do not contain matching Strength or Balance measurements, so ${BRAND.appName} will not show a misleading comparison.`,
      },
    };
  }
  const beganAfterEarlierHistory = baselineProfile !== profiles[0];
  return {
    change: {
      headline: `${
        beganAfterEarlierHistory ? 'Since this check-up method began' : 'Since your first check-up'
      } · ${formatDate(baselineProfile.snapshot.sourceCheckUpId)}`,
      domains,
    },
    readiness: { status: 'ready' },
  };
}

function profilesShareMeasurementProtocol(
  baseline: AcceptedProfile,
  latest: AcceptedProfile
): boolean {
  const a = baseline.record.checkUp.measurementProtocol;
  const b = latest.record.checkUp.measurementProtocol;
  // Preserve comparison among imported legacy records, but never bridge a
  // known frozen protocol to an unknown or different one.
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.protocolId === b.protocolId &&
    a.protocolVersion === b.protocolVersion &&
    (a.protocolVariant ?? '') === (b.protocolVariant ?? '')
  );
}

function domainReading(
  domain: MovementProfileV2Domain,
  snapshot: StoredMovementProfileV2Snapshot
): DomainReading | null {
  if (domain === 'strength_power') {
    const raw = snapshot.interpretation.chair.rawMetric;
    return raw && Number.isFinite(raw.value) ? { value: raw.value, metricId: raw.metricId, unit: 'reps' } : null;
  }
  if (domain === 'balance') {
    const raw = snapshot.interpretation.balance.rawMetric;
    return raw && Number.isFinite(raw.value) ? { value: raw.value, metricId: raw.metricId, unit: 'seconds' } : null;
  }
  const raw = snapshot.interpretation.shoulder.rawMetric;
  return raw && Number.isFinite(raw.value) ? { value: raw.value, metricId: raw.metricId, unit: 'degrees' } : null;
}

function changeDomain(
  domain: MovementProfileV2Domain,
  baseline: DomainReading,
  latest: DomainReading,
  series: MovementProfileV2ProgressChangeDomain['series']
): MovementProfileV2ProgressChangeDomain {
  const delta = latest.value - baseline.value;
  const magnitude = Math.abs(delta);
  const direction: MovementProfileV2ProgressChangeDirection =
    magnitude < CHANGE_MIN_DELTA[latest.unit] ? 'steady' : delta > 0 ? 'up' : 'down';
  const value = `${formatReadingNumber(baseline.value)} → ${formatReadingNumber(latest.value)}${unitSuffix(latest.unit, latest.value)}`;
  const caption =
    direction === 'steady'
      ? 'Holding steady'
      : `${direction === 'up' ? 'Up' : 'Down'} ${formatReadingNumber(magnitude)}${unitSuffix(latest.unit, magnitude)}`;
  return {
    domain,
    title: changeDomainTitle(domain),
    direction,
    value,
    caption,
    series,
    ...(direction === 'down' ? { supportCopy: downSupportCopy(domain) } : {}),
  };
}

// The trainable path paired with every lower reading (worse never bare).
// Warm, mechanism-honest, no promised outcomes; measurement honesty is
// covered by the single-reading caveat these rows sit under.
function downSupportCopy(domain: MovementProfileV2Domain): string {
  if (domain === 'balance') {
    return 'Balance responds to steady practice — your plan keeps it in every week, and next check-up shows the fuller picture.';
  }
  return 'Strength rebuilds with the same sessions that measured this — your plan keeps working it, and next check-up shows the fuller picture.';
}

function changeDomainTitle(domain: MovementProfileV2Domain): string {
  if (domain === 'balance') return 'Balance';
  return 'Strength';
}

function unitSuffix(unit: DomainReading['unit'], value: number): string {
  if (unit === 'reps') return value === 1 ? ' rise' : ' rises';
  if (unit === 'seconds') return ' sec';
  return '°';
}

function formatReadingNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function movementProfileV2ProgressProfileBySourceCheckUpId(
  history: readonly StoredCheckUp[] | null | undefined,
  sourceCheckUpId: string
): AcceptedProfile | null {
  return sortProfiles(officialMovementProfileV2AssessmentSelection(history).records).find(
    (profile) => profile.assessment.sourceCheckUpId === sourceCheckUpId
  ) ?? null;
}

function buildOfficialHistory(profiles: readonly AcceptedProfile[]): MovementProfileV2HistoryEntry[] {
  return profiles
    .slice()
    .sort((a, b) => compareProfiles(b, a))
    .map((profile) => {
      const viewModel = buildMovementProfileV2ResultsViewModel({
        snapshot: profile.snapshot,
        assessment: profile.assessment,
      });
      return {
        id: profile.assessment.sourceCheckUpId,
        sourceLabel: sourceLabel(profile.type),
        dateLabel: viewModel.dateLabel,
        focusTitle: viewModel.focus.title,
      };
    });
}

function hasMalformedArtifacts({
  history,
  selectionConflictCount,
}: {
  history: readonly StoredCheckUp[];
  selectionConflictCount: number;
}): boolean {
  if (selectionConflictCount > 0) return true;
  return history.some((record) => {
    const snapshotCompatibility = record.movementProfileV2SnapshotCompatibility;
    const assessmentCompatibility = record.movementProfileV2AssessmentCompatibility;
    return (
      (snapshotCompatibility !== undefined &&
        snapshotCompatibility !== 'current' &&
        snapshotCompatibility !== 'missing') ||
      (assessmentCompatibility !== undefined &&
        assessmentCompatibility !== 'current' &&
        assessmentCompatibility !== 'missing')
    );
  });
}

function sortProfiles(records: readonly AcceptedProfile[]): AcceptedProfile[] {
  return records.slice().sort(compareProfiles);
}

function compareProfiles(a: AcceptedProfile, b: AcceptedProfile): number {
  const byCompletion = profileCompletionTimestamp(a).localeCompare(profileCompletionTimestamp(b));
  if (byCompletion !== 0) return byCompletion;
  const bySourceId = a.assessment.sourceCheckUpId.localeCompare(b.assessment.sourceCheckUpId);
  if (bySourceId !== 0) return bySourceId;
  const byAssessmentId = a.assessment.assessmentId.localeCompare(b.assessment.assessmentId);
  if (byAssessmentId !== 0) return byAssessmentId;
  return a.assessment.assessmentFingerprint.localeCompare(b.assessment.assessmentFingerprint);
}

function profileCompletionTimestamp(profile: {
  record: StoredCheckUp;
  assessment: MovementProfileV2Assessment;
  snapshot: StoredMovementProfileV2Snapshot;
}): string {
  return profile.assessment.sourceCheckUpId || profile.record.checkUp.startedAt || profile.snapshot.sourceCheckUpId;
}

function sourceLabel(type: Extract<StoredCheckUpType, 'baseline' | 'baseline_retake' | 'official_retest'>): string {
  if (type === 'official_retest') return 'Follow-up Movement Check-Up';
  if (type === 'baseline_retake') return 'Movement Check-Up retake';
  return 'First Movement Check-Up';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
