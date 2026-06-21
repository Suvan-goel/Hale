import {
  LOCAL_USER_ID,
  blockProgress,
  movementBlockSourceCheckUpId,
  movementDomainFromScoreDomainOrNull,
  scoreDomainFromMovementDomain,
  type MovementAssessment,
  type MovementBlock,
  type MovementBlockReport,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
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
  completions: readonly TrainingSessionCompletion[];
  nowIso?: string;
}): MovementBlockReport {
  const progress = blockProgress(block, completions);
  const schedule = getBlockScheduleState({ block, completions, today: nowIso });
  const snapshotEndpointMismatch =
    !scoreSnapshotMatchesAssessment(previousScoreSnapshot, baselineAssessment) ||
    !scoreSnapshotMatchesAssessment(latestScoreSnapshot, retestAssessment);
  const compatibility = snapshotEndpointMismatch
    ? 'invalid_snapshot'
    : compareScoreSnapshots(previousScoreSnapshot, latestScoreSnapshot);
  const compatible = compatibility === 'compatible';
  const domainChanges = compatible ? (compareDomains(previousScore, latestScore) ?? {}) : {};
  const focusChange = domainChanges[block.focusDomain];
  return {
    id: `block-report-${block.id}`,
    userId,
    blockId: block.id,
    baselineAssessmentId: baselineAssessment?.id ?? movementBlockSourceCheckUpId(block),
    retestAssessmentId: retestAssessment?.id,
    createdAt: nowIso,
    summary: compatible
      ? getReportCopy({ focusDomain: block.focusDomain, hasComparison: !!focusChange?.current })
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
    recommendedNextFocusDomain: latestScore
      ? movementDomainFromScoreDomainOrNull(latestScore.weakestDomain) ?? block.focusDomain
      : block.focusDomain,
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
): NonNullable<MovementBlockReport['comparison']>['status'] {
  if (compatibility === 'unsupported_schema') return 'unsupported_schema';
  if (compatibility === 'invalid_snapshot') return 'invalid_snapshot';
  if (compatibility === 'legacy_unversioned') return 'legacy_unversioned';
  if (compatibility === 'missing_snapshot') return 'missing_snapshot';
  if (compatibility === 'compatible') return 'compatible';
  return 'incompatible_version';
}

function versionMetadataForReport(
  snapshot: VersionedCheckUpScoreSnapshot | null | undefined
): NonNullable<MovementBlockReport['comparison']>['startSnapshot'] {
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
  const out: MovementBlockReport['domainChanges'] = {};
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

function direction(previous: number, current: number): 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown' {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return 'unknown';
  if (current < previous) return 'recorded_lower';
  if (current === previous) return 'similar';
  return 'recorded_higher';
}
