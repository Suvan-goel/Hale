import {
  LOCAL_USER_ID,
  blockProgress,
  movementBlockDomainFocus,
  movementBlockSourceCheckUpId,
  movementDomainFromScoreDomainOrNull,
  scoreDomainFromMovementDomain,
  type MovementAssessment,
  type MovementBlock,
  type MovementBlockReport,
  type LegacyV1MovementBlockReport,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
import {
  checkUpItemsAllowChangeClaim,
  descriptorForMovementMeasurement,
  normalizeCheckUpMeasurementMetadata,
  protocolPolicyIdForCheckUp,
  type CheckUp,
} from '../checkup';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
} from '../movements';
import type { CheckUpScore } from '../scoring';
import {
  compareScoreSnapshots,
  scoreSnapshotVersionMetadata,
  type ScoreSnapshotPairCompatibility,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import { getReportCopy } from './copy';
import { getBlockScheduleState } from './blockSchedule';

export function createMovementBlockReport({
  userId = LOCAL_USER_ID,
  block,
  baselineAssessment,
  retestAssessment,
  previousScore,
  latestScore,
  previousScoreSnapshot,
  latestScoreSnapshot,
  previousCheckUp,
  latestCheckUp,
  completions,
  nowIso = new Date().toISOString(),
}: {
  userId?: string;
  block: MovementBlock;
  baselineAssessment?: MovementAssessment | null;
  retestAssessment?: MovementAssessment | null;
  previousScore?: CheckUpScore | null;
  latestScore?: CheckUpScore | null;
  previousScoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  latestScoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  previousCheckUp?: CheckUp | null;
  latestCheckUp?: CheckUp | null;
  completions: readonly TrainingSessionCompletion[];
  nowIso?: string;
}): LegacyV1MovementBlockReport {
  const progress = blockProgress(block, completions);
  const schedule = getBlockScheduleState({ block, completions, today: nowIso });
  const snapshotEndpointMismatch =
    !scoreSnapshotMatchesAssessment(previousScoreSnapshot, baselineAssessment) ||
    !scoreSnapshotMatchesAssessment(latestScoreSnapshot, retestAssessment);
  const compatibility = snapshotEndpointMismatch
    ? 'invalid_snapshot'
    : compareScoreSnapshots(previousScoreSnapshot, latestScoreSnapshot);
  const compatible = compatibility === 'compatible';
  const comparedDomainChanges = compatible ? (compareDomains(previousScore, latestScore) ?? {}) : {};
  const measurementComparability = compatible
    ? filterReportDomainChangesByMeasurementContext({
        domainChanges: comparedDomainChanges,
        previousCheckUp,
        latestCheckUp,
      })
    : { domainChanges: {}, suppressedDomains: [] as MovementDomain[], evaluated: false };
  const domainChanges = measurementComparability.domainChanges ?? {};
  const focusDomain = movementBlockDomainFocus(block);
  const focusChange = focusDomain ? domainChanges[focusDomain] : undefined;
  return {
    id: `block-report-${block.id}`,
    userId,
    blockId: block.id,
    baselineAssessmentId: baselineAssessment?.id ?? movementBlockSourceCheckUpId(block),
    retestAssessmentId: retestAssessment?.id,
    createdAt: nowIso,
    summary: compatible
      ? focusDomain
        ? measurementComparability.evaluated && !focusChange?.current && measurementComparability.suppressedDomains.includes(focusDomain)
          ? 'Your latest result has been saved. Hale needs matching side and protocol metadata before it describes a direct change.'
          : getReportCopy({ focusDomain, hasComparison: !!focusChange?.current })
        : measurementComparability.evaluated && measurementComparability.suppressedDomains.length > 0
          ? 'Your latest result has been saved. Hale needs matching side and protocol metadata before it describes a direct change.'
          : 'Your latest check-up has been saved. Hale will use it to keep the next plan balanced across strength, balance, and mobility.'
      : "Your latest result has been saved. Hale's scoring method has changed since your earlier Check-Up, so a direct comparison isn't available.",
    sessionsCompleted: schedule.totalCredits,
    totalPlannedSessions: progress.totalSessions,
    microChecksCompleted: progress.microChecksCompleted,
    domainChanges,
    comparison: {
      status: reportComparisonStatus(compatibility),
      startCheckUpId: previousScoreSnapshot?.sourceCheckUpId ?? rawMetricString(baselineAssessment, 'checkUpId'),
      endCheckUpId: latestScoreSnapshot?.sourceCheckUpId ?? rawMetricString(retestAssessment, 'checkUpId'),
      startSnapshot: versionMetadataForReport(previousScoreSnapshot),
      endSnapshot: versionMetadataForReport(latestScoreSnapshot),
    },
    measurementComparability: {
      status: measurementComparability.evaluated
        ? measurementComparability.suppressedDomains.length > 0
          ? 'suppressed'
          : 'compatible'
        : 'not_evaluated',
      ...(measurementComparability.suppressedDomains.length > 0
        ? {
            suppressedDomains: measurementComparability.suppressedDomains,
            reason: 'side_or_protocol_metadata_insufficient' as const,
          }
        : {}),
    },
    recommendedNextFocusDomain: latestScore
      ? movementDomainFromScoreDomainOrNull(latestScore.weakestDomain) ?? focusDomain ?? undefined
      : focusDomain ?? undefined,
  };
}

function rawMetricString(assessment: MovementAssessment | null | undefined, key: string): string | undefined {
  const value = assessment?.results?.rawMetrics?.[key];
  return typeof value === 'string' ? value : undefined;
}

function scoreSnapshotMatchesAssessment(
  snapshot: VersionedCheckUpScoreSnapshot | null | undefined,
  assessment: MovementAssessment | null | undefined
): boolean {
  if (!snapshot) return true;
  const checkUpId = rawMetricString(assessment, 'checkUpId');
  if (!checkUpId) return true;
  return snapshot.sourceCheckUpId === checkUpId && snapshot.score.startedAt === checkUpId;
}

function reportComparisonStatus(
  compatibility: ScoreSnapshotPairCompatibility
): NonNullable<LegacyV1MovementBlockReport['comparison']>['status'] {
  if (compatibility === 'unsupported_schema') return 'unsupported_schema';
  if (compatibility === 'invalid_snapshot') return 'invalid_snapshot';
  if (compatibility === 'legacy_unversioned') return 'legacy_unversioned';
  if (compatibility === 'missing_snapshot') return 'missing_snapshot';
  if (compatibility === 'compatible') return 'compatible';
  return 'incompatible_version';
}

function versionMetadataForReport(
  snapshot: VersionedCheckUpScoreSnapshot | null | undefined
): NonNullable<LegacyV1MovementBlockReport['comparison']>['startSnapshot'] {
  const metadata = scoreSnapshotVersionMetadata(snapshot);
  return {
    schemaVersion: metadata.schemaVersion,
    scoringVersion: metadata.scoringVersion,
    normVersion: metadata.normVersion,
  };
}

function compareDomains(
  previousScore?: CheckUpScore | null,
  latestScore?: CheckUpScore | null
): MovementBlockReport['domainChanges'] {
  const out: LegacyV1MovementBlockReport['domainChanges'] = {};
  if (!previousScore || !latestScore) return out;
  for (const domain of ['strength_power', 'balance', 'mobility'] as MovementDomain[]) {
    const scoreDomain = scoreDomainFromMovementDomain(domain);
    const previous = previousScore.domains.find((d) => d.domain === scoreDomain);
    const current = latestScore.domains.find((d) => d.domain === scoreDomain);
    if (!previous?.measured || !current?.measured) continue;
    const previousMid = (previous.ageLow + previous.ageHigh) / 2;
    const currentMid = (current.ageLow + current.ageHigh) / 2;
    out[domain] = {
      previous: previousMid,
      current: currentMid,
      direction: direction(previousMid, currentMid),
    };
  }
  return out;
}

function filterReportDomainChangesByMeasurementContext({
  domainChanges,
  previousCheckUp,
  latestCheckUp,
}: {
  domainChanges: MovementBlockReport['domainChanges'];
  previousCheckUp?: CheckUp | null;
  latestCheckUp?: CheckUp | null;
}): {
  domainChanges: MovementBlockReport['domainChanges'];
  suppressedDomains: MovementDomain[];
  evaluated: boolean;
} {
  if (!previousCheckUp || !latestCheckUp) {
    return { domainChanges, suppressedDomains: [], evaluated: false };
  }
  const previous = normalizeCheckUpMeasurementMetadata(previousCheckUp);
  const latest = normalizeCheckUpMeasurementMetadata(latestCheckUp);
  const filtered: LegacyV1MovementBlockReport['domainChanges'] = {};
  const suppressedDomains: MovementDomain[] = [];
  for (const [domain, change] of Object.entries(domainChanges ?? {}) as [MovementDomain, NonNullable<MovementBlockReport['domainChanges']>[MovementDomain]][]) {
    const movementId = reportMovementIdForDomain(domain, previous, latest);
    if (!movementId) {
      suppressedDomains.push(domain);
      continue;
    }
    const previousItem = previous.items.find((item) => item.movementId === movementId);
    const latestItem = latest.items.find((item) => item.movementId === movementId);
    const descriptor = descriptorForMovementMeasurement({
      movementId,
      policyId: protocolPolicyIdForCheckUp(latest),
      protocolVariant: latestItem?.measurementContext?.protocol.protocolVariant ?? null,
    });
    if (descriptor && checkUpItemsAllowChangeClaim(previousItem, latestItem, descriptor.comparisonGroup)) {
      filtered[domain] = change;
    } else {
      suppressedDomains.push(domain);
    }
  }
  return { domainChanges: filtered, suppressedDomains, evaluated: true };
}

function reportMovementIdForDomain(domain: MovementDomain, previous: CheckUp, latest: CheckUp): string | null {
  if (domain === 'strength_power') return CHAIR_STAND_ID;
  if (domain === 'balance') return BALANCE_LADDER_ID;
  if (domain === 'mobility') {
    if (hasFiniteResultNumber(previous, SHOULDER_FLEXION_ID, 'peakFlexionDeg') && hasFiniteResultNumber(latest, SHOULDER_FLEXION_ID, 'peakFlexionDeg')) {
      return SHOULDER_FLEXION_ID;
    }
    if (hasFiniteResultNumber(previous, HINGE_REACH_ID, 'reachBu') && hasFiniteResultNumber(latest, HINGE_REACH_ID, 'reachBu')) {
      return HINGE_REACH_ID;
    }
  }
  return null;
}

function hasFiniteResultNumber(checkUp: CheckUp, movementId: string, key: string): boolean {
  const result = checkUp.items.find((item) => item.movementId === movementId)?.result as Record<string, unknown> | null | undefined;
  return typeof result?.[key] === 'number' && Number.isFinite(result[key]);
}

function direction(previous: number, current: number): 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown' {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return 'unknown';
  if (current < previous) return 'recorded_lower';
  if (current === previous) return 'similar';
  return 'recorded_higher';
}
