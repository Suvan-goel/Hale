import type { MovementAssessment, MovementDomain } from '../adherence/types';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../checkup/protocolPolicy';
import {
  CURRENT_NORM_VERSION,
  CURRENT_SCORING_VERSION,
  SCORE_SNAPSHOT_SCHEMA_VERSION,
  focusSelectionFromUnknown,
  focusSelectionMatchesScore,
  focusSelectionsEqual,
  parseStoredScoreSnapshot,
  selectFocusFromScore,
  scoreSnapshotMatchesScore,
  type CheckUpScore,
  type ScoreFocusSelection,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import {
  headlineEvidenceFromAssessment,
  headlineEvidenceFromScore,
  isOfficialCheckupType,
  movementDomainFromScoreDomainStrict,
} from './assessmentEvidence';

export type BlockCreationIneligibilityReason =
  | 'no_measured_domains'
  | 'unsupported_checkup_protocol'
  | 'missing_headline_domains'
  | 'assessment_invalid'
  | 'assessment_incomplete'
  | 'assessment_not_completed'
  | 'non_official_assessment'
  | 'missing_score_snapshot'
  | 'legacy_unversioned_score'
  | 'incompatible_scoring_version'
  | 'incompatible_norm_version'
  | 'unsupported_score_snapshot_schema'
  | 'invalid_score_snapshot'
  | 'score_version_mismatch'
  | 'missing_focus_domain'
  | 'invalid_focus_measurement'
  | 'missing_focus_metadata'
  | 'invalid_focus_metadata'
  | 'unsupported_balanced_focus'
  | 'score_assessment_mismatch';

export type BlockCreationEligibility =
  | {
      eligible: true;
      focusDomain: MovementDomain;
      measuredDomains: MovementDomain[];
      focusSelection?: ScoreFocusSelection;
    }
  | {
      eligible: false;
      reason: BlockCreationIneligibilityReason;
      measuredDomains: MovementDomain[];
    };

export interface BlockCreationEligibilityInput {
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  assessment?: MovementAssessment | null;
}

export function getBlockCreationEligibility({
  score,
  scoreSnapshot,
  assessment,
}: BlockCreationEligibilityInput): BlockCreationEligibility {
  const parsedSnapshot = parseStoredScoreSnapshot(scoreSnapshot);
  const effectiveScore = score ?? (parsedSnapshot.ok ? parsedSnapshot.score : null);
  const scoreEvidence = effectiveScore
    ? evidenceFromScore(effectiveScore, parsedSnapshot.ok ? parsedSnapshot.snapshot.focusSelection : undefined)
    : null;
  const assessmentEvidence = assessment ? evidenceFromAssessment(assessment) : null;
  const evidence = scoreEvidence ?? assessmentEvidence ?? {
    focusDomain: null,
    focusMeasured: false,
    measuredDomains: [],
    complete: false,
  };

  if (assessmentHasUnsupportedProtocol(assessment)) {
    return ineligible('unsupported_checkup_protocol', evidence.measuredDomains);
  }
  if (!assessment) {
    return ineligible('non_official_assessment', evidence.measuredDomains);
  }
  if (!assessment.isOfficialForProgress || !isOfficialCheckupType(assessment.type)) {
    return ineligible('non_official_assessment', evidence.measuredDomains);
  }
  if (assessment.status === 'invalid') {
    return ineligible('assessment_invalid', evidence.measuredDomains);
  }
  if (assessment.status === 'incomplete') {
    return ineligible('assessment_incomplete', evidence.measuredDomains);
  }
  if (assessment.status !== 'completed') {
    return ineligible('assessment_not_completed', evidence.measuredDomains);
  }
  if (evidence.measuredDomains.length === 0) {
    return ineligible('no_measured_domains', evidence.measuredDomains);
  }
  if (!evidence.complete || !assessmentEvidence?.complete || (scoreEvidence && !scoreEvidence.complete)) {
    return ineligible('missing_headline_domains', evidence.measuredDomains);
  }
  if (!evidence.focusDomain) {
    return ineligible('missing_focus_domain', evidence.measuredDomains);
  }
  if (!evidence.focusMeasured) {
    return ineligible('invalid_focus_measurement', evidence.measuredDomains);
  }
  const versionResult = snapshotVersionEligibility({
    score: effectiveScore,
    originalScore: score ?? null,
    scoreSnapshot,
    parsedSnapshot,
    assessment,
  });
  if (versionResult) return ineligible(versionResult, evidence.measuredDomains);

  const focusMetadataResult = focusMetadataEligibility({
    score: effectiveScore,
    parsedSnapshot,
    assessment,
  });
  if (focusMetadataResult) return ineligible(focusMetadataResult, evidence.measuredDomains);

  if (effectiveScore && assessmentCheckUpId(assessment) && assessmentCheckUpId(assessment) !== effectiveScore.startedAt) {
    return ineligible('score_assessment_mismatch', scoreEvidence?.measuredDomains ?? evidence.measuredDomains);
  }
  if (scoreEvidence && assessment && assessmentEvidence && evidenceDisagrees(scoreEvidence, assessmentEvidence, assessment)) {
    return ineligible('score_assessment_mismatch', scoreEvidence.measuredDomains);
  }
  if (scoreEvidence && assessment && !assessmentEvidence) {
    return ineligible('score_assessment_mismatch', scoreEvidence.measuredDomains);
  }

  return {
    eligible: true,
    focusDomain: evidence.focusDomain,
    measuredDomains: evidence.measuredDomains,
    ...(evidence.focusSelection ? { focusSelection: evidence.focusSelection } : {}),
  };
}

export function isMovementAssessmentUsableForTraining(assessment: MovementAssessment): boolean {
  if (assessmentHasUnsupportedProtocol(assessment)) return false;
  if (!assessment.isOfficialForProgress || !isOfficialCheckupType(assessment.type)) return false;
  if (assessment.status !== 'completed') return false;
  const evidence = evidenceFromAssessment(assessment);
  if (!evidence?.complete || !evidence.focusDomain || !evidence.focusMeasured) return false;
  return assessmentHasCurrentSnapshotMetadata(assessment);
}

function ineligible(
  reason: BlockCreationIneligibilityReason,
  measuredDomains: MovementDomain[]
): BlockCreationEligibility {
  return { eligible: false, reason, measuredDomains };
}

function snapshotVersionEligibility({
  score,
  originalScore,
  scoreSnapshot,
  parsedSnapshot,
  assessment,
}: {
  score: CheckUpScore | null;
  originalScore: CheckUpScore | null;
  scoreSnapshot: VersionedCheckUpScoreSnapshot | null | undefined;
  parsedSnapshot: ReturnType<typeof parseStoredScoreSnapshot>;
  assessment: MovementAssessment;
}): Extract<BlockCreationIneligibilityReason, 'missing_score_snapshot' | 'legacy_unversioned_score' | 'incompatible_scoring_version' | 'incompatible_norm_version' | 'unsupported_score_snapshot_schema' | 'invalid_score_snapshot' | 'score_version_mismatch'> | null {
  if (!scoreSnapshot) return 'missing_score_snapshot';
  if (!parsedSnapshot.ok) {
    if (parsedSnapshot.compatibility === 'legacy_unversioned') return 'legacy_unversioned_score';
    if (parsedSnapshot.compatibility === 'unsupported_schema') return 'unsupported_score_snapshot_schema';
    return 'invalid_score_snapshot';
  }
  if (parsedSnapshot.compatibility === 'incompatible_version') {
    if (parsedSnapshot.snapshot.scoringVersion !== CURRENT_SCORING_VERSION) return 'incompatible_scoring_version';
    if (parsedSnapshot.snapshot.normVersion !== CURRENT_NORM_VERSION) return 'incompatible_norm_version';
    return 'incompatible_scoring_version';
  }
  if (parsedSnapshot.compatibility !== 'current') return 'invalid_score_snapshot';
  if (parsedSnapshot.snapshot.schemaVersion !== SCORE_SNAPSHOT_SCHEMA_VERSION) return 'unsupported_score_snapshot_schema';
  if (score && parsedSnapshot.snapshot.sourceCheckUpId !== score.startedAt) return 'score_version_mismatch';
  if (originalScore && !scoreSnapshotMatchesScore(parsedSnapshot.snapshot, originalScore)) return 'score_version_mismatch';
  if (!assessmentVersionMetadataMatches(assessment, parsedSnapshot.snapshot)) return 'score_version_mismatch';
  return null;
}

function focusMetadataEligibility({
  score,
  parsedSnapshot,
  assessment,
}: {
  score: CheckUpScore | null;
  parsedSnapshot: ReturnType<typeof parseStoredScoreSnapshot>;
  assessment: MovementAssessment;
}): Extract<
  BlockCreationIneligibilityReason,
  'missing_focus_metadata' | 'invalid_focus_metadata' | 'unsupported_balanced_focus' | 'score_assessment_mismatch'
> | null {
  if (!score || !parsedSnapshot.ok) return null;

  const defaultSelection = selectFocusFromScore(score);
  const snapshotSelection = parsedSnapshot.snapshot.focusSelection;
  const assessmentSelection = focusSelectionFromAssessment(assessment);

  if ((defaultSelection?.kind === 'exact_tie' || defaultSelection?.kind === 'near_tie') && !snapshotSelection) {
    return 'missing_focus_metadata';
  }
  if (!snapshotSelection) return null;
  if (snapshotSelection.tieBreakReason === 'balanced_first_block') {
    return 'unsupported_balanced_focus';
  }
  if (!focusSelectionMatchesScore(score, snapshotSelection)) {
    return 'invalid_focus_metadata';
  }
  if (score.weakestDomain !== snapshotSelection.focusDomain) {
    return 'invalid_focus_metadata';
  }

  const assessmentFocusDomain = movementDomainFromScoreDomainStrict(snapshotSelection.focusDomain);
  if (!assessmentFocusDomain || assessment.results?.weakestDomain !== assessmentFocusDomain) {
    return 'score_assessment_mismatch';
  }
  if ((snapshotSelection.kind === 'exact_tie' || snapshotSelection.kind === 'near_tie') && !assessmentSelection) {
    return 'missing_focus_metadata';
  }
  if (assessmentSelection) {
    if (!focusSelectionMatchesScore(score, assessmentSelection)) {
      return 'invalid_focus_metadata';
    }
    if (!focusSelectionsEqual(snapshotSelection, assessmentSelection)) {
      return 'score_assessment_mismatch';
    }
  }
  return null;
}

interface Evidence {
  focusDomain: MovementDomain | null;
  focusMeasured: boolean;
  measuredDomains: MovementDomain[];
  complete: boolean;
  focusSelection?: ScoreFocusSelection;
}

function evidenceFromScore(score: CheckUpScore, focusSelection?: ScoreFocusSelection): Evidence {
  const focusDomain = movementDomainFromScoreDomainStrict(focusSelection?.focusDomain ?? score.weakestDomain);
  const headlineEvidence = headlineEvidenceFromScore(score);
  const measuredDomains = headlineEvidence.measuredDomains;
  const focusResult = focusDomain
    ? score.domains.find((domain) => movementDomainFromScoreDomainStrict(domain.domain) === focusDomain)
    : undefined;

  return {
    focusDomain,
    measuredDomains,
    complete: headlineEvidence.complete,
    ...(focusSelection ? { focusSelection } : {}),
    focusMeasured:
      !!focusResult &&
      focusResult.measured &&
      Number.isFinite(focusResult.ageLow) &&
      Number.isFinite(focusResult.ageHigh),
  };
}

function evidenceFromAssessment(assessment: MovementAssessment): Evidence | null {
  if (!assessment.results) return null;
  const focusSelection = focusSelectionFromAssessment(assessment);
  const focusDomain = movementDomainFromScoreDomainStrict(focusSelection?.focusDomain ?? assessment.results.weakestDomain);
  const headlineEvidence = headlineEvidenceFromAssessment(assessment);
  const measuredDomains = headlineEvidence.measuredDomains;

  return {
    focusDomain,
    measuredDomains,
    complete: headlineEvidence.complete,
    ...(focusSelection ? { focusSelection } : {}),
    focusMeasured: focusDomain ? Number.isFinite(scoreForAssessmentDomain(assessment, focusDomain)) : false,
  };
}

function evidenceDisagrees(score: Evidence, assessment: Evidence, sourceAssessment: MovementAssessment): boolean {
  if (score.focusDomain !== assessment.focusDomain) return true;
  if (!sameDomains(score.measuredDomains, assessment.measuredDomains)) return true;
  if (score.complete !== assessment.complete) return true;
  const measuredDomains = sourceAssessment.results?.rawMetrics?.measuredDomains;
  return typeof measuredDomains === 'number' && measuredDomains !== score.measuredDomains.length;
}

function scoreForAssessmentDomain(
  assessment: MovementAssessment,
  domain: MovementDomain
): number | undefined {
  if (domain === 'strength_power') return assessment.results?.strengthPowerScore;
  if (domain === 'balance') return assessment.results?.balanceScore;
  return assessment.results?.mobilityScore;
}

function assessmentCheckUpId(assessment: MovementAssessment): string | null {
  const checkUpId = assessment.results?.rawMetrics?.checkUpId;
  return typeof checkUpId === 'string' ? checkUpId : null;
}

function assessmentHasUnsupportedProtocol(assessment: MovementAssessment | null | undefined): boolean {
  const value = assessment?.results?.rawMetrics?.checkUpProtocolPolicyId;
  return value === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID || (typeof value === 'string' && value !== 'legacy_movement_age_v1');
}

function focusSelectionFromAssessment(assessment: MovementAssessment): ScoreFocusSelection | undefined {
  const rawSelection = assessment.results?.rawMetrics?.focusSelection;
  return focusSelectionFromUnknown(rawSelection) ?? undefined;
}

function assessmentVersionMetadataMatches(
  assessment: MovementAssessment,
  snapshot: VersionedCheckUpScoreSnapshot
): boolean {
  const rawMetrics = assessment.results?.rawMetrics;
  if (!rawMetrics) return false;
  return (
    rawMetrics.scoreSnapshotSchemaVersion === snapshot.schemaVersion &&
    rawMetrics.scoringVersion === snapshot.scoringVersion &&
    rawMetrics.normVersion === snapshot.normVersion &&
    rawMetrics.scoreSnapshotSourceCheckUpId === snapshot.sourceCheckUpId &&
    rawMetrics.scoreSnapshotScoreStartedAt === snapshot.score.startedAt &&
    assessmentCheckUpId(assessment) === snapshot.sourceCheckUpId
  );
}

function assessmentHasCurrentSnapshotMetadata(assessment: MovementAssessment): boolean {
  const rawMetrics = assessment.results?.rawMetrics;
  if (!rawMetrics) return false;
  const checkUpId = assessmentCheckUpId(assessment);
  return (
    rawMetrics.scoreSnapshotSchemaVersion === SCORE_SNAPSHOT_SCHEMA_VERSION &&
    rawMetrics.scoringVersion === CURRENT_SCORING_VERSION &&
    rawMetrics.normVersion === CURRENT_NORM_VERSION &&
    typeof rawMetrics.scoreSnapshotSourceCheckUpId === 'string' &&
    rawMetrics.scoreSnapshotSourceCheckUpId === checkUpId &&
    typeof rawMetrics.scoreSnapshotScoreStartedAt === 'string' &&
    rawMetrics.scoreSnapshotScoreStartedAt === checkUpId
  );
}

function sameDomains(a: MovementDomain[], b: MovementDomain[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((domain) => b.includes(domain));
}

export { movementDomainFromScoreDomainStrict } from './assessmentEvidence';
