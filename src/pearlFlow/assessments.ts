import { LOCAL_USER_ID, type MovementAssessment } from '../adherence/types';
import {
  parseStoredScoreSnapshot,
  type CheckUpScore,
  type DomainResult,
  type ScoreFocusSelection,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import {
  isMovementAssessmentUsableForTraining,
} from './assessmentEligibility';
import {
  checkupStatusFromHeadlineEvidence,
  confidenceFromHeadlineEvidence,
  headlineEvidenceFromScore,
  isOfficialCheckupType,
  movementDomainFromScoreDomainStrict,
} from './assessmentEvidence';
import type { CreateAssessmentInput } from './types';

export function createMovementAssessment({
  userId = LOCAL_USER_ID,
  checkUpId,
  type,
  score,
  scoreSnapshot,
  sourceBlockId,
  completedAt = new Date().toISOString(),
  status,
  isOfficialForProgress,
}: CreateAssessmentInput): MovementAssessment {
  const headlineEvidence = headlineEvidenceFromScore(score);
  const confidence = confidenceFromHeadlineEvidence(headlineEvidence);
  const resolvedStatus = resolveAssessmentStatus(status, checkupStatusFromHeadlineEvidence(headlineEvidence));
  const parsedSnapshot = parseStoredScoreSnapshot(scoreSnapshot);
  const focusSelection = parsedSnapshot.ok ? parsedSnapshot.snapshot.focusSelection : undefined;
  const authoritativeFocus = headlineEvidence.complete
    ? movementDomainFromScoreDomainStrict(focusSelection?.focusDomain ?? score?.weakestDomain)
    : null;
  return {
    id: `assessment-${type}-${checkUpId.replace(/[:.]/g, '-')}`,
    userId,
    type,
    status: resolvedStatus,
    createdAt: checkUpId,
    completedAt,
    sourceBlockId,
    results: score
      ? {
          strengthPowerScore: scoreForDomain(score, 'strength'),
          balanceScore: scoreForDomain(score, 'balance'),
          mobilityScore: scoreForDomain(score, 'mobility'),
          ...(authoritativeFocus ? { weakestDomain: authoritativeFocus } : {}),
          confidence,
          rawMetrics: {
            checkUpId: score.startedAt,
            measuredDomains: headlineEvidence.measuredDomainCount,
            headlineDomainsMeasured: headlineEvidence.measuredDomains,
            missingHeadlineDomains: headlineEvidence.missingDomains,
            headlineEvidenceComplete: headlineEvidence.complete,
            ...scoreSnapshotRawMetrics(scoreSnapshot),
            ...focusSelectionRawMetrics(focusSelection),
          },
        }
      : {
          confidence: 'low',
          rawMetrics: {
            checkUpId,
            measuredDomains: 0,
            headlineDomainsMeasured: [],
            missingHeadlineDomains: headlineEvidence.missingDomains,
            headlineEvidenceComplete: false,
            ...scoreSnapshotRawMetrics(scoreSnapshot),
            ...focusSelectionRawMetrics(focusSelection),
          },
        },
    isOfficialForProgress: isOfficialForProgress ?? isOfficialCheckupType(type),
  };
}

function focusSelectionRawMetrics(
  focusSelection: ScoreFocusSelection | null | undefined
): Record<string, unknown> {
  if (!focusSelection) return {};
  return {
    focusSelection,
    focusSelectionKind: focusSelection.kind,
    effectiveFocusDomain: focusSelection.focusDomain,
    tiedScoreDomains: focusSelection.tiedDomains,
    ...(focusSelection.nearTiedDomains ? { nearTiedScoreDomains: focusSelection.nearTiedDomains } : {}),
    ...(typeof focusSelection.nearTieMarginYears === 'number'
      ? { nearTieMarginYears: focusSelection.nearTieMarginYears }
      : {}),
    ...(typeof focusSelection.policyVersion === 'number'
      ? { focusSelectionPolicyVersion: focusSelection.policyVersion }
      : {}),
    ...(focusSelection.tieBreakReason ? { focusTieBreakReason: focusSelection.tieBreakReason } : {}),
  };
}

function scoreSnapshotRawMetrics(
  snapshot: VersionedCheckUpScoreSnapshot | null | undefined
): Record<string, unknown> {
  const parsed = parseStoredScoreSnapshot(snapshot);
  if (!parsed.ok) return {};
  return {
    scoreSnapshotSchemaVersion: parsed.snapshot.schemaVersion,
    scoringVersion: parsed.snapshot.scoringVersion,
    normVersion: parsed.snapshot.normVersion,
    scoreSnapshotCreatedAt: parsed.snapshot.createdAt,
    scoreSnapshotSourceCheckUpId: parsed.snapshot.sourceCheckUpId,
    scoreSnapshotScoreStartedAt: parsed.snapshot.score.startedAt,
  };
}

export function latestOfficialAssessment(
  assessments: readonly MovementAssessment[]
): MovementAssessment | null {
  return latestUsableOfficialAssessment(assessments);
}

export function latestOfficialAssessmentAttempt(
  assessments: readonly MovementAssessment[]
): MovementAssessment | null {
  const official = assessments.filter((a) => a.isOfficialForProgress && isOfficialCheckupType(a.type));
  if (official.length === 0) return null;
  return official.slice().sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))[0];
}

export function latestUsableOfficialAssessment(
  assessments: readonly MovementAssessment[]
): MovementAssessment | null {
  const official = assessments.filter((a) => a.isOfficialForProgress && isMovementAssessmentUsableForTraining(a));
  if (official.length === 0) return null;
  return official.slice().sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))[0];
}

export function latestIncompleteOfficialAssessment(
  assessments: readonly MovementAssessment[]
): MovementAssessment | null {
  const official = assessments.filter((a) => a.isOfficialForProgress && isOfficialCheckupType(a.type) && a.status === 'incomplete');
  if (official.length === 0) return null;
  return official.slice().sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))[0];
}

export function canReplaceBaselineWithRetake({
  original,
  retake,
  confirmed,
}: {
  original: MovementAssessment | null | undefined;
  retake: MovementAssessment;
  confirmed: boolean;
}): boolean {
  if (!confirmed || !original) return false;
  if (original.type !== 'baseline' || retake.type !== 'baseline_retake') return false;
  return retake.isOfficialForProgress && isMovementAssessmentUsableForTraining(retake);
}

function scoreForDomain(score: CheckUpScore, domain: DomainResult['domain']): number | undefined {
  const result = score.domains.find((d) => d.domain === domain);
  if (!result?.measured || !Number.isFinite(result.ageLow) || !Number.isFinite(result.ageHigh)) return undefined;
  return (result.ageLow + result.ageHigh) / 2;
}

function resolveAssessmentStatus(
  requested: MovementAssessment['status'] | undefined,
  evidenceStatus: MovementAssessment['status']
): MovementAssessment['status'] {
  if (requested === 'not_started' || requested === 'in_progress' || requested === 'cancelled') {
    return requested;
  }
  return evidenceStatus;
}

export { isOfficialCheckupType } from './assessmentEvidence';
