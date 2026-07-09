import type {
  MovementProfileV2ComparisonUnit,
  MovementProfileV2RetestComparison,
  MovementProfileV2RetestComparisonDomain,
} from '../adherence';
import type { CheckUp } from '../checkup';
import {
  movementProfileSnapshotCompatibility,
  parseMovementProfileV2Assessment,
  parseStoredMovementProfileV2Snapshot,
  type MovementProfileV2Assessment,
  type StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';

import { BRAND } from '../brand';
export const MOVEMENT_PROFILE_V2_RETEST_COMPARISON_SCHEMA_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-retest-comparison-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_VERSION,
    authority: 'movementProfileSnapshotCompatibility',
    claims: 'previous-current-raw-values-only',
    noDelta: true,
    noDirection: true,
    domains: ['strength_power', 'balance', 'mobility'],
    excludes: ['hinge_supporting_metric', 'warden_chair_percentile'],
  }
);

export type MovementProfileV2RetestComparisonResult =
  | {
      ok: true;
      comparison: MovementProfileV2RetestComparison;
    }
  | {
      ok: false;
      reason:
        | 'prior_snapshot_invalid'
        | 'current_snapshot_invalid'
        | 'prior_assessment_invalid'
        | 'current_assessment_invalid'
        | 'source_mismatch'
        | 'fingerprint_invalid';
    };

export function buildMovementProfileV2RetestComparison(input: {
  priorCheckUp: CheckUp;
  priorSnapshot: StoredMovementProfileV2Snapshot;
  priorAssessment: MovementProfileV2Assessment;
  currentCheckUp: CheckUp;
  currentSnapshot: StoredMovementProfileV2Snapshot;
  currentAssessment: MovementProfileV2Assessment;
}): MovementProfileV2RetestComparisonResult {
  const priorSnapshot = parseStoredMovementProfileV2Snapshot(input.priorSnapshot);
  if (!priorSnapshot.ok) return { ok: false, reason: 'prior_snapshot_invalid' };
  const currentSnapshot = parseStoredMovementProfileV2Snapshot(input.currentSnapshot);
  if (!currentSnapshot.ok) return { ok: false, reason: 'current_snapshot_invalid' };
  const priorAssessment = parseMovementProfileV2Assessment(input.priorAssessment);
  if (!priorAssessment.ok) return { ok: false, reason: 'prior_assessment_invalid' };
  const currentAssessment = parseMovementProfileV2Assessment(input.currentAssessment);
  if (!currentAssessment.ok) return { ok: false, reason: 'current_assessment_invalid' };
  if (
    priorSnapshot.snapshot.sourceCheckUpId !== input.priorCheckUp.startedAt ||
    priorAssessment.assessment.sourceCheckUpId !== input.priorCheckUp.startedAt ||
    currentSnapshot.snapshot.sourceCheckUpId !== input.currentCheckUp.startedAt ||
    currentAssessment.assessment.sourceCheckUpId !== input.currentCheckUp.startedAt
  ) {
    return { ok: false, reason: 'source_mismatch' };
  }

  const compatibility = movementProfileSnapshotCompatibility(
    priorSnapshot.snapshot,
    currentSnapshot.snapshot
  );
  const domains = {
    strength_power: chairComparison(priorSnapshot.snapshot, currentSnapshot.snapshot, compatibility),
    balance: balanceComparison(priorSnapshot.snapshot, currentSnapshot.snapshot, compatibility),
    mobility: shoulderComparison(priorSnapshot.snapshot, currentSnapshot.snapshot, compatibility),
  };
  const comparisonBase: Omit<MovementProfileV2RetestComparison, 'comparisonFingerprint'> = {
    kind: 'movement_profile_v2_retest_comparison',
    schemaVersion: MOVEMENT_PROFILE_V2_RETEST_COMPARISON_SCHEMA_VERSION,
    comparisonPolicyVersion: MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_VERSION,
    comparisonPolicyFingerprint: MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_FINGERPRINT,
    comparisonId: movementProfileV2RetestComparisonId({
      priorAssessmentId: priorAssessment.assessment.assessmentId,
      currentAssessmentId: currentAssessment.assessment.assessmentId,
    }),
    prior: {
      checkUpId: input.priorCheckUp.startedAt,
      snapshotId: priorSnapshot.snapshot.snapshotId,
      snapshotFingerprint: priorSnapshot.snapshot.snapshotFingerprint,
      assessmentId: priorAssessment.assessment.assessmentId,
      assessmentFingerprint: priorAssessment.assessment.assessmentFingerprint,
      completedAt: priorSnapshot.snapshot.sourceCheckUpId,
    },
    current: {
      checkUpId: input.currentCheckUp.startedAt,
      snapshotId: currentSnapshot.snapshot.snapshotId,
      snapshotFingerprint: currentSnapshot.snapshot.snapshotFingerprint,
      assessmentId: currentAssessment.assessment.assessmentId,
      assessmentFingerprint: currentAssessment.assessment.assessmentFingerprint,
      completedAt: currentSnapshot.snapshot.sourceCheckUpId,
    },
    domains,
    overallStatus: overallStatus(Object.values(domains)),
  };
  const comparison: MovementProfileV2RetestComparison = {
    ...comparisonBase,
    comparisonFingerprint: movementProfileV2RetestComparisonFingerprint(comparisonBase),
  };
  return { ok: true, comparison };
}

export function movementProfileV2RetestComparisonId(input: {
  priorAssessmentId: string;
  currentAssessmentId: string;
}): string {
  return `mpv2-retest-comparison:${encodeURIComponent(input.priorAssessmentId)}:${encodeURIComponent(
    input.currentAssessmentId
  )}`;
}

export function movementProfileV2RetestComparisonFingerprint(
  comparison: Omit<MovementProfileV2RetestComparison, 'comparisonFingerprint'> | MovementProfileV2RetestComparison
): string {
  const { comparisonFingerprint: _comparisonFingerprint, ...material } =
    comparison as MovementProfileV2RetestComparison;
  return deterministicFingerprint('mpv2-retest-comparison-v1', material);
}

export function parseMovementProfileV2RetestComparison(
  value: unknown
): MovementProfileV2RetestComparisonResult {
  if (!value || typeof value !== 'object') return { ok: false, reason: 'fingerprint_invalid' };
  const comparison = value as MovementProfileV2RetestComparison;
  if (
    comparison.kind !== 'movement_profile_v2_retest_comparison' ||
    comparison.schemaVersion !== MOVEMENT_PROFILE_V2_RETEST_COMPARISON_SCHEMA_VERSION ||
    comparison.comparisonPolicyVersion !== MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_VERSION ||
    comparison.comparisonPolicyFingerprint !== MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_FINGERPRINT ||
    typeof comparison.comparisonId !== 'string' ||
    typeof comparison.comparisonFingerprint !== 'string' ||
    !comparison.prior ||
    !comparison.current ||
    !comparison.domains
  ) {
    return { ok: false, reason: 'fingerprint_invalid' };
  }
  if (comparison.comparisonFingerprint !== movementProfileV2RetestComparisonFingerprint(comparison)) {
    return { ok: false, reason: 'fingerprint_invalid' };
  }
  return { ok: true, comparison };
}

function chairComparison(
  prior: StoredMovementProfileV2Snapshot,
  current: StoredMovementProfileV2Snapshot,
  compatibility: ReturnType<typeof movementProfileSnapshotCompatibility>
): MovementProfileV2RetestComparisonDomain {
  return domainComparison({
    metricLabel: 'Chair-rise capacity',
    unit: 'reps',
    previousValue: prior.interpretation.chair.rawMetric?.value,
    currentValue: current.interpretation.chair.rawMetric?.value,
    previousInterpretation: chairInterpretationLabel(prior),
    currentInterpretation: chairInterpretationLabel(current),
    rawComparable: compatibility.compatible && compatibility.domainComparability.chair.rawComparable,
    referenceComparable: compatibility.compatible && compatibility.domainComparability.chair.referenceComparable,
    incompatibleReason: compatibility.compatible ? null : compatibility.reason,
    separateNote: `${BRAND.appName} is showing this chair-rise result separately because the two Check-Ups used different measurement policy details.`,
  });
}

function balanceComparison(
  prior: StoredMovementProfileV2Snapshot,
  current: StoredMovementProfileV2Snapshot,
  compatibility: ReturnType<typeof movementProfileSnapshotCompatibility>
): MovementProfileV2RetestComparisonDomain {
  const sameStandingLeg = compatibility.compatible
    ? compatibility.domainComparability.balance.sameStandingLeg
    : false;
  return domainComparison({
    metricLabel: 'Balance hold',
    unit: 'seconds',
    previousValue: prior.interpretation.balance.rawMetric?.value,
    currentValue: current.interpretation.balance.rawMetric?.value,
    previousInterpretation: balanceInterpretationLabel(prior),
    currentInterpretation: balanceInterpretationLabel(current),
    rawComparable: compatibility.compatible && compatibility.domainComparability.balance.rawComparable,
    referenceComparable: compatibility.compatible && compatibility.domainComparability.balance.referenceComparable,
    incompatibleReason: compatibility.compatible ? null : compatibility.reason,
    reasonCodes: sameStandingLeg ? [] : ['DIFFERENT_STANDING_LEG'],
    separateNote: sameStandingLeg
      ? `${BRAND.appName} is showing this balance result separately because the two Check-Ups used different measurement policy details.`
      : `A different standing leg was used this time, so ${BRAND.appName} is showing the current balance result separately.`,
  });
}

function shoulderComparison(
  prior: StoredMovementProfileV2Snapshot,
  current: StoredMovementProfileV2Snapshot,
  compatibility: ReturnType<typeof movementProfileSnapshotCompatibility>
): MovementProfileV2RetestComparisonDomain {
  const sameSide = compatibility.compatible ? compatibility.domainComparability.shoulder.sameSide : false;
  return domainComparison({
    metricLabel: 'Shoulder reach',
    unit: 'degrees',
    previousValue: prior.interpretation.shoulder.rawMetric?.value,
    currentValue: current.interpretation.shoulder.rawMetric?.value,
    previousInterpretation: shoulderInterpretationLabel(prior),
    currentInterpretation: shoulderInterpretationLabel(current),
    rawComparable: compatibility.compatible && compatibility.domainComparability.shoulder.rawComparable,
    referenceComparable: compatibility.compatible && compatibility.domainComparability.shoulder.referenceComparable,
    incompatibleReason: compatibility.compatible ? null : compatibility.reason,
    reasonCodes: sameSide ? [] : ['DIFFERENT_SHOULDER_SIDE'],
    separateNote: sameSide
      ? `${BRAND.appName} is showing this reach result separately because the two Check-Ups used different measurement policy details.`
      : `A different shoulder was tested this time, so ${BRAND.appName} is showing the current reach result separately.`,
  });
}

function domainComparison(input: {
  metricLabel: string;
  unit: MovementProfileV2ComparisonUnit;
  previousValue: number | undefined;
  currentValue: number | undefined;
  previousInterpretation?: string;
  currentInterpretation?: string;
  rawComparable: boolean;
  referenceComparable: boolean;
  incompatibleReason: string | null;
  reasonCodes?: readonly string[];
  separateNote: string;
}): MovementProfileV2RetestComparisonDomain {
  const previousValue = finiteValue(input.previousValue);
  const currentValue = finiteValue(input.currentValue);
  const reasonCodes = stableReasonCodes([
    ...(input.incompatibleReason ? [input.incompatibleReason] : []),
    ...(input.reasonCodes ?? []),
  ]);
  if (input.rawComparable && previousValue !== undefined && currentValue !== undefined) {
    return {
      status: 'raw_comparable',
      previousValue,
      currentValue,
      unit: input.unit,
      metricLabel: input.metricLabel,
      referenceComparable: input.referenceComparable,
      ...(input.previousInterpretation ? { previousInterpretation: input.previousInterpretation } : {}),
      ...(input.currentInterpretation ? { currentInterpretation: input.currentInterpretation } : {}),
      reasonCodes,
    };
  }
  if (previousValue !== undefined || currentValue !== undefined) {
    return {
      status: 'shown_separately',
      ...(previousValue !== undefined ? { previousValue } : {}),
      ...(currentValue !== undefined ? { currentValue } : {}),
      unit: input.unit,
      metricLabel: input.metricLabel,
      reasonCodes: reasonCodes.length > 0 ? reasonCodes : ['RAW_COMPARISON_NOT_AVAILABLE'],
      note: input.separateNote,
    };
  }
  return {
    status: 'unavailable',
    metricLabel: input.metricLabel,
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : ['MISSING_RAW_VALUE'],
    note: 'This result was not available in both Check-Ups.',
  };
}

function overallStatus(domains: readonly MovementProfileV2RetestComparisonDomain[]): MovementProfileV2RetestComparison['overallStatus'] {
  const comparable = domains.filter((domain) => domain.status === 'raw_comparable').length;
  if (comparable === domains.length) return 'comparable';
  if (comparable > 0) return 'partially_comparable';
  return 'not_comparable';
}

function finiteValue(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stableReasonCodes(codes: readonly string[]): string[] {
  return Array.from(new Set(codes.filter((code) => code.trim().length > 0))).sort();
}

function chairInterpretationLabel(snapshot: StoredMovementProfileV2Snapshot): string {
  return snapshot.interpretation.chair.percentileRange ? 'Published comparison saved' : 'Raw result only';
}

function balanceInterpretationLabel(snapshot: StoredMovementProfileV2Snapshot): string {
  const band = snapshot.interpretation.balance.taskBand;
  if (band === 'ceiling_complete') return 'Full 45-second hold completed';
  if (band === 'building') return 'Building the hold';
  if (band === 'starting_point_low') return 'Starting point';
  if (band === 'starting_point') return 'Starting point';
  return 'Raw result only';
}

function shoulderInterpretationLabel(snapshot: StoredMovementProfileV2Snapshot): string {
  const category = snapshot.interpretation.shoulder.iqr?.category;
  if (category === 'above_published_middle_range') return 'Above the published middle range';
  if (category === 'within_published_middle_range') return 'Within the published middle range';
  if (category === 'below_published_middle_range') return 'Below the published middle range';
  return 'Raw angle only';
}
