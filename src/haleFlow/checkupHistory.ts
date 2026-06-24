import type { MovementAssessment } from '../adherence/types';
import type { CheckUp } from '../checkup';
import type { StoredCheckUp, StoredCheckUpType } from '../history';
import {
  latestOfficialMovementProfileV2AssessmentBeforeCheckUp as latestOfficialMovementProfileV2AssessmentBeforeCheckUpRecord,
  latestOfficialMovementProfileV2AssessmentRecord,
  movementProfileV2AssessmentRecordForSourceCheckUpId,
  movementProfileV2AssessmentRecordForSourceSnapshotId,
  priorMovementProfileV2FocusContextForCheckUp as selectPriorMovementProfileV2FocusContextForCheckUp,
  selectOfficialMovementProfileV2AssessmentRecords,
  validMovementProfileV2SnapshotForCheckUp,
  type MovementProfileV2AssessmentConflict,
  type MovementProfileV2AssessmentPersistenceDiagnostic,
  type MovementProfileV2PriorFocusSelection,
  type OfficialMovementProfileV2AssessmentRecord as GenericOfficialMovementProfileV2AssessmentRecord,
  type StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';
import {
  compareScoreSnapshots,
  parseStoredScoreSnapshot,
  type CheckUpScore,
  type ScoreSnapshotPairCompatibility,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import { getBlockCreationEligibility } from './assessmentEligibility';
import { isOfficialCheckupType } from './assessmentEvidence';

export interface UsableOfficialCheckUpRecord {
  record: StoredCheckUp;
  assessment: MovementAssessment;
  score: CheckUpScore;
  scoreSnapshot: VersionedCheckUpScoreSnapshot;
  type: StoredCheckUpType;
}

export interface HistoricalOfficialCheckUpRecord {
  record: StoredCheckUp;
  assessment: MovementAssessment;
  score: CheckUpScore;
  scoreSnapshot: VersionedCheckUpScoreSnapshot;
  type: StoredCheckUpType;
  currentVersionUsable: boolean;
}

export interface OfficialMovementProfileV2SnapshotRecord {
  record: StoredCheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  type: Extract<StoredCheckUpType, 'baseline' | 'baseline_retake' | 'official_retest'>;
}

export type OfficialMovementProfileV2AssessmentRecord =
  GenericOfficialMovementProfileV2AssessmentRecord<StoredCheckUp>;

export interface OfficialMovementProfileV2AssessmentSelection {
  records: OfficialMovementProfileV2AssessmentRecord[];
  conflicts: MovementProfileV2AssessmentConflict<StoredCheckUp>[];
  diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[];
}

export type OfficialCheckUpComparisonPair =
  | {
      compatible: true;
      compatibility: 'compatible';
      previous: HistoricalOfficialCheckUpRecord;
      latest: HistoricalOfficialCheckUpRecord;
    }
  | {
      compatible: false;
      compatibility: Exclude<ScoreSnapshotPairCompatibility, 'compatible'>;
      previous?: HistoricalOfficialCheckUpRecord;
      latest?: HistoricalOfficialCheckUpRecord;
    };

export function resolveStoredCheckUpType(
  record: StoredCheckUp,
  assessments: readonly MovementAssessment[] | null | undefined
): StoredCheckUpType {
  if (record.checkupType && record.checkupType !== 'legacy_unknown') return record.checkupType;
  const matches = matchingAssessmentsForCheckUp(assessments ?? [], record.checkUp.startedAt);
  return matches.length === 1 ? matches[0].type : 'legacy_unknown';
}

export function findAssessmentForCheckUp(
  assessments: readonly MovementAssessment[] | null | undefined,
  checkUpStartedAt: string
): MovementAssessment | null {
  const matches = matchingAssessmentsForCheckUp(assessments ?? [], checkUpStartedAt);
  if (matches.length === 0) return null;
  return matches.slice().sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))[0];
}

export function findCheckUpForAssessment(
  history: readonly StoredCheckUp[] | null | undefined,
  assessment: MovementAssessment | null | undefined
): CheckUp | null {
  if (!assessment) return null;
  const checkUpId = assessmentCheckUpId(assessment);
  if (!checkUpId) return null;
  return (history ?? []).find((record) => record.checkUp.startedAt === checkUpId)?.checkUp ?? null;
}

export function usableOfficialCheckUpRecords(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments: readonly MovementAssessment[] | null | undefined
): UsableOfficialCheckUpRecord[] {
  return (history ?? [])
    .slice()
    .sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt))
    .map((record) => usableOfficialCheckUpRecord(record, assessments))
    .filter((item): item is UsableOfficialCheckUpRecord => !!item);
}

export function historicalOfficialCheckUpRecords(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments: readonly MovementAssessment[] | null | undefined
): HistoricalOfficialCheckUpRecord[] {
  return (history ?? [])
    .slice()
    .sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt))
    .map((record) => historicalOfficialCheckUpRecord(record, assessments))
    .filter((item): item is HistoricalOfficialCheckUpRecord => !!item);
}

export function validOfficialMovementProfileV2Snapshots(
  history: readonly StoredCheckUp[] | null | undefined
): OfficialMovementProfileV2SnapshotRecord[] {
  return (history ?? [])
    .slice()
    .sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt))
    .map(validOfficialMovementProfileV2SnapshotRecord)
    .filter((item): item is OfficialMovementProfileV2SnapshotRecord => !!item);
}

export function latestOfficialMovementProfileV2Snapshot(
  history: readonly StoredCheckUp[] | null | undefined
): OfficialMovementProfileV2SnapshotRecord | null {
  const records = validOfficialMovementProfileV2Snapshots(history);
  return records[records.length - 1] ?? null;
}

export function movementProfileV2SnapshotForSourceCheckUpId(
  history: readonly StoredCheckUp[] | null | undefined,
  sourceCheckUpId: string
): OfficialMovementProfileV2SnapshotRecord | null {
  return (
    validOfficialMovementProfileV2Snapshots(history).find(
      (item) => item.snapshot.sourceCheckUpId === sourceCheckUpId
    ) ?? null
  );
}

export function validOfficialMovementProfileV2Assessments(
  history: readonly StoredCheckUp[] | null | undefined
): OfficialMovementProfileV2AssessmentRecord[] {
  return selectOfficialMovementProfileV2AssessmentRecords(history).records;
}

export function officialMovementProfileV2AssessmentSelection(
  history: readonly StoredCheckUp[] | null | undefined
): OfficialMovementProfileV2AssessmentSelection {
  return selectOfficialMovementProfileV2AssessmentRecords(history);
}

export function latestOfficialMovementProfileV2Assessment(
  history: readonly StoredCheckUp[] | null | undefined
): OfficialMovementProfileV2AssessmentRecord | null {
  return latestOfficialMovementProfileV2AssessmentRecord(history);
}

export function movementProfileV2AssessmentForSourceCheckUpId(
  history: readonly StoredCheckUp[] | null | undefined,
  sourceCheckUpId: string
): OfficialMovementProfileV2AssessmentRecord | null {
  return movementProfileV2AssessmentRecordForSourceCheckUpId(history, sourceCheckUpId);
}

export function movementProfileV2AssessmentForSourceSnapshotId(
  history: readonly StoredCheckUp[] | null | undefined,
  sourceSnapshotId: string
): OfficialMovementProfileV2AssessmentRecord | null {
  return movementProfileV2AssessmentRecordForSourceSnapshotId(history, sourceSnapshotId);
}

export function latestOfficialMovementProfileV2AssessmentBeforeCheckUp(
  history: readonly StoredCheckUp[] | null | undefined,
  currentCheckUp: CheckUp
): OfficialMovementProfileV2AssessmentRecord | null {
  return latestOfficialMovementProfileV2AssessmentBeforeCheckUpRecord(history, currentCheckUp);
}

export function priorMovementProfileV2FocusContextForCheckUp({
  currentCheckUp,
  currentCheckupType,
  acceptedHistory,
}: {
  currentCheckUp: CheckUp;
  currentCheckupType?: StoredCheckUpType | null;
  acceptedHistory: readonly StoredCheckUp[] | null | undefined;
}): MovementProfileV2PriorFocusSelection<StoredCheckUp> {
  return selectPriorMovementProfileV2FocusContextForCheckUp({
    currentCheckUp,
    currentCheckupType,
    acceptedHistory,
  });
}

export function latestUsableOfficialCheckUpRecord(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments: readonly MovementAssessment[] | null | undefined
): UsableOfficialCheckUpRecord | null {
  const records = usableOfficialCheckUpRecords(history, assessments);
  return records[records.length - 1] ?? null;
}

export function latestHistoricalOfficialCheckUpRecord(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments: readonly MovementAssessment[] | null | undefined
): HistoricalOfficialCheckUpRecord | null {
  const records = historicalOfficialCheckUpRecords(history, assessments);
  return records[records.length - 1] ?? null;
}

export function latestOfficialComparisonPair(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments: readonly MovementAssessment[] | null | undefined
): OfficialCheckUpComparisonPair {
  const records = historicalOfficialCheckUpRecords(history, assessments);
  if (records.length < 2) return { compatible: false, compatibility: 'missing_snapshot' };
  const previous = records[records.length - 2];
  const latest = records[records.length - 1];
  const compatibility = compareScoreSnapshots(previous.scoreSnapshot, latest.scoreSnapshot);
  return compatibility === 'compatible'
    ? { compatible: true, compatibility, previous, latest }
    : { compatible: false, compatibility, previous, latest };
}

export function latestIncompleteOfficialCheckUpRecord(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments: readonly MovementAssessment[] | null | undefined
): { record: StoredCheckUp; assessment: MovementAssessment; type: StoredCheckUpType } | null {
  const sorted = (history ?? []).slice().sort((a, b) => b.checkUp.startedAt.localeCompare(a.checkUp.startedAt));
  for (const record of sorted) {
    const type = resolveStoredCheckUpType(record, assessments);
    if (!isOfficialCheckupType(type)) continue;
    const assessment = findAssessmentForCheckUp(assessments, record.checkUp.startedAt);
    if (!assessment || assessment.status !== 'incomplete') continue;
    return { record, assessment, type };
  }
  return null;
}

function usableOfficialCheckUpRecord(
  record: StoredCheckUp,
  assessments: readonly MovementAssessment[] | null | undefined
): UsableOfficialCheckUpRecord | null {
  const type = resolveStoredCheckUpType(record, assessments);
  if (!isOfficialCheckupType(type)) return null;
  const assessment = findAssessmentForCheckUp(assessments, record.checkUp.startedAt);
  if (!assessment) return null;
  const parsedSnapshot = parseStoredScoreSnapshot(record.scoreSnapshot);
  if (!parsedSnapshot.ok) return null;
  if (!scoreSnapshotMatchesRecord(parsedSnapshot.snapshot, record, assessment)) return null;
  const score = parsedSnapshot.score;
  const eligibility = getBlockCreationEligibility({ score, scoreSnapshot: parsedSnapshot.snapshot, assessment });
  if (!eligibility.eligible) return null;
  return { record, assessment, score, scoreSnapshot: parsedSnapshot.snapshot, type };
}

function historicalOfficialCheckUpRecord(
  record: StoredCheckUp,
  assessments: readonly MovementAssessment[] | null | undefined
): HistoricalOfficialCheckUpRecord | null {
  const type = resolveStoredCheckUpType(record, assessments);
  if (!isOfficialCheckupType(type)) return null;
  const assessment = findAssessmentForCheckUp(assessments, record.checkUp.startedAt);
  if (!assessment || assessment.status !== 'completed') return null;
  const parsedSnapshot = parseStoredScoreSnapshot(record.scoreSnapshot);
  if (!parsedSnapshot.ok) return null;
  if (!scoreSnapshotMatchesRecord(parsedSnapshot.snapshot, record, assessment)) return null;
  const currentEligibility = getBlockCreationEligibility({
    score: parsedSnapshot.score,
    scoreSnapshot: parsedSnapshot.snapshot,
    assessment,
  });
  return {
    record,
    assessment,
    score: parsedSnapshot.score,
    scoreSnapshot: parsedSnapshot.snapshot,
    type,
    currentVersionUsable: currentEligibility.eligible,
  };
}

function validOfficialMovementProfileV2SnapshotRecord(
  record: StoredCheckUp
): OfficialMovementProfileV2SnapshotRecord | null {
  const type = record.checkupType;
  if (!isOfficialCheckupType(type)) return null;
  if (type !== 'baseline' && type !== 'baseline_retake' && type !== 'official_retest') return null;
  const snapshot = validMovementProfileV2SnapshotForCheckUp({
    snapshot: record.movementProfileV2Snapshot,
    checkUp: record.checkUp,
    checkupType: type,
  });
  return snapshot ? { record, snapshot, type } : null;
}

function matchingAssessmentsForCheckUp(
  assessments: readonly MovementAssessment[],
  checkUpStartedAt: string
): MovementAssessment[] {
  return assessments.filter((assessment) => assessmentCheckUpId(assessment) === checkUpStartedAt);
}

function assessmentCheckUpId(assessment: MovementAssessment): string | null {
  const rawCheckUpId = assessment.results?.rawMetrics?.checkUpId;
  if (typeof rawCheckUpId === 'string') return rawCheckUpId;
  return assessment.createdAt || null;
}

function scoreSnapshotMatchesRecord(
  snapshot: VersionedCheckUpScoreSnapshot,
  record: StoredCheckUp,
  assessment: MovementAssessment
): boolean {
  const checkUpId = record.checkUp.startedAt;
  if (snapshot.sourceCheckUpId !== checkUpId || snapshot.score.startedAt !== checkUpId) return false;
  const assessmentId = assessmentCheckUpId(assessment);
  return !assessmentId || assessmentId === checkUpId;
}
