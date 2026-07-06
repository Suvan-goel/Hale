/**
 * Persisted check-up record: schema-versioned from day one (CLAUDE.md data
 * rule). The raw CheckUp remains stored, but user-facing interpretations are
 * frozen in a versioned score snapshot. Loading history must not silently
 * rescore old raw measurements with current norms.
 *
 * Pure (de)serialization + migration — no I/O, fully unit-testable. Non-finite
 * numbers (NaN for unmeasured metrics) are stored as null and read back as
 * null; every consumer already guards with Number.isFinite.
 */

import type { CheckUp } from '../checkup/types';
import { normalizeCheckUpMeasurementMetadata } from '../checkup/measurementMetadata';
import { validCheckUpSelfReport } from '../checkup/selfReport';
import {
  LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID,
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  normalizeCheckUpRecordProtocolPolicy,
} from '../checkup/protocolPolicy';
import type { CheckupType } from '../adherence/types';
import {
  getMovementProfileV2AssessmentPersistenceEligibility,
  type MovementProfileV2Assessment,
  type MovementProfileV2AssessmentCompatibility,
  parseStoredMovementProfileV2Snapshot,
  validMovementProfileV2SnapshotForCheckUp,
  type MovementProfileV2SnapshotCompatibility,
  type StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';
import {
  classifyStoredScoreSnapshot,
  parseStoredScoreSnapshot,
  type ScoreSnapshotCompatibility,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';

export const HISTORY_SCHEMA_VERSION = 1;

export type StoredCheckUpType = CheckupType;

export interface StoredCheckUpMetadata {
  checkupType?: StoredCheckUpType;
  sourceAssessmentId?: string;
  retryOfCheckUpId?: string;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  movementProfileV2Snapshot?: StoredMovementProfileV2Snapshot | null;
  movementProfileV2Assessment?: MovementProfileV2Assessment | null;
}

export interface StoredCheckUp {
  schemaVersion: number;
  checkUp: CheckUp;
  checkupType: StoredCheckUpType;
  sourceAssessmentId?: string;
  retryOfCheckUpId?: string;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot;
  scoreSnapshotCompatibility: ScoreSnapshotCompatibility;
  movementProfileV2Snapshot?: StoredMovementProfileV2Snapshot;
  movementProfileV2SnapshotCompatibility?: MovementProfileV2SnapshotCompatibility;
  movementProfileV2Assessment?: MovementProfileV2Assessment;
  movementProfileV2AssessmentCompatibility?: MovementProfileV2AssessmentCompatibility;
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

export function serializeCheckUp(checkUp: CheckUp, metadata: StoredCheckUpMetadata = {}): string {
  const checkupType = validStoredCheckUpType(metadata.checkupType) ?? 'legacy_unknown';
  const rawCheckUp = normalizeCheckUpMeasurementMetadata(checkUpWithoutEmbeddedSnapshots(checkUp), { checkupType });
  const parsedSnapshot = parseScoreSnapshotForCheckUp(metadata.scoreSnapshot, rawCheckUp);
  const movementProfileV2SnapshotCandidate =
    metadata.movementProfileV2Snapshot !== undefined
      ? metadata.movementProfileV2Snapshot
      : (checkUp as { movementProfileV2Snapshot?: unknown }).movementProfileV2Snapshot;
  const parsedMovementProfileV2Snapshot = parseMovementProfileV2SnapshotForCheckUp(
    movementProfileV2SnapshotCandidate,
    rawCheckUp,
    checkupType
  );
  const movementProfileV2AssessmentCandidate =
    metadata.movementProfileV2Assessment !== undefined
      ? metadata.movementProfileV2Assessment
      : (checkUp as { movementProfileV2Assessment?: unknown }).movementProfileV2Assessment;
  const parsedMovementProfileV2Assessment = parseMovementProfileV2AssessmentForCheckUp(
    movementProfileV2AssessmentCandidate,
    parsedMovementProfileV2Snapshot.snapshot,
    rawCheckUp,
    checkupType
  );
  const record: StoredCheckUp = {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp: rawCheckUp,
    checkupType,
    sourceAssessmentId: metadata.sourceAssessmentId,
    retryOfCheckUpId: metadata.retryOfCheckUpId,
    ...(parsedSnapshot.snapshot ? { scoreSnapshot: parsedSnapshot.snapshot } : {}),
    scoreSnapshotCompatibility: parsedSnapshot.compatibility,
    ...(parsedMovementProfileV2Snapshot.snapshot
      ? { movementProfileV2Snapshot: parsedMovementProfileV2Snapshot.snapshot }
      : {}),
    ...(parsedMovementProfileV2Snapshot.shouldStoreCompatibility
      ? { movementProfileV2SnapshotCompatibility: parsedMovementProfileV2Snapshot.compatibility }
      : {}),
    ...(parsedMovementProfileV2Assessment.assessment
      ? { movementProfileV2Assessment: parsedMovementProfileV2Assessment.assessment }
      : {}),
    ...(parsedMovementProfileV2Assessment.shouldStoreCompatibility
      ? { movementProfileV2AssessmentCompatibility: parsedMovementProfileV2Assessment.compatibility }
      : {}),
  };
  return JSON.stringify(record, nanReplacer);
}

/**
 * Migrate a parsed record forward to the current schema. Returns null for
 * anything unreadable or from a schema we don't understand (forward-compatible:
 * a newer app's file is skipped rather than crashing an older app).
 */
export function migrate(parsed: unknown): StoredCheckUp | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const rec = parsed as Partial<StoredCheckUp>;
  if (rec.schemaVersion !== HISTORY_SCHEMA_VERSION) return null; // no older versions exist yet
  const checkupType = validStoredCheckUpType(rec.checkupType) ?? 'legacy_unknown';
  const rawCheckUp = rec.checkUp as CheckUp;
  const strippedCheckUp = checkUpWithoutEmbeddedSnapshots(rawCheckUp);
  if (!strippedCheckUp || typeof strippedCheckUp !== 'object' || !Array.isArray(strippedCheckUp.items)) return null;
  if (typeof strippedCheckUp.startedAt !== 'string') return null;
  const checkUp = normalizeCheckUpMeasurementMetadata(strippedCheckUp, { checkupType });
  const parsedSnapshot = parseScoreSnapshotForCheckUp(rec.scoreSnapshot, checkUp);
  const explicitCompatibility = validScoreSnapshotCompatibility(rec.scoreSnapshotCompatibility);
  const nestedMovementProfileV2Snapshot = (rawCheckUp as { movementProfileV2Snapshot?: unknown } | undefined)
    ?.movementProfileV2Snapshot;
  const nestedMovementProfileV2Assessment = (rawCheckUp as { movementProfileV2Assessment?: unknown } | undefined)
    ?.movementProfileV2Assessment;
  const movementProfileV2SnapshotCandidate =
    rec.movementProfileV2Snapshot !== undefined ? rec.movementProfileV2Snapshot : nestedMovementProfileV2Snapshot;
  const parsedMovementProfileV2Snapshot = parseMovementProfileV2SnapshotForCheckUp(
    movementProfileV2SnapshotCandidate,
    checkUp,
    checkupType
  );
  const explicitMovementProfileV2Compatibility = validMovementProfileV2SnapshotCompatibility(
    rec.movementProfileV2SnapshotCompatibility
  );
  const movementProfileV2AssessmentCandidate =
    rec.movementProfileV2Assessment !== undefined
      ? rec.movementProfileV2Assessment
      : nestedMovementProfileV2Assessment;
  const parsedMovementProfileV2Assessment = parseMovementProfileV2AssessmentForCheckUp(
    movementProfileV2AssessmentCandidate,
    parsedMovementProfileV2Snapshot.snapshot,
    checkUp,
    checkupType
  );
  const explicitMovementProfileV2AssessmentCompatibility = validMovementProfileV2AssessmentCompatibility(
    rec.movementProfileV2AssessmentCompatibility
  );
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp,
    checkupType,
    sourceAssessmentId: typeof rec.sourceAssessmentId === 'string' ? rec.sourceAssessmentId : undefined,
    retryOfCheckUpId: typeof rec.retryOfCheckUpId === 'string' ? rec.retryOfCheckUpId : undefined,
    ...(parsedSnapshot.snapshot ? { scoreSnapshot: parsedSnapshot.snapshot } : {}),
    scoreSnapshotCompatibility: parsedSnapshot.snapshot
      ? parsedSnapshot.compatibility
      : explicitCompatibility ?? parsedSnapshot.compatibility,
    ...(parsedMovementProfileV2Snapshot.snapshot
      ? { movementProfileV2Snapshot: parsedMovementProfileV2Snapshot.snapshot }
      : {}),
    ...(parsedMovementProfileV2Snapshot.shouldStoreCompatibility || explicitMovementProfileV2Compatibility
      ? {
          movementProfileV2SnapshotCompatibility: parsedMovementProfileV2Snapshot.snapshot
            ? parsedMovementProfileV2Snapshot.compatibility
            : explicitMovementProfileV2Compatibility ?? parsedMovementProfileV2Snapshot.compatibility,
        }
      : {}),
    ...(parsedMovementProfileV2Assessment.assessment
      ? { movementProfileV2Assessment: parsedMovementProfileV2Assessment.assessment }
      : {}),
    ...(parsedMovementProfileV2Assessment.shouldStoreCompatibility || explicitMovementProfileV2AssessmentCompatibility
      ? {
          movementProfileV2AssessmentCompatibility: parsedMovementProfileV2Assessment.assessment
            ? parsedMovementProfileV2Assessment.compatibility
            : explicitMovementProfileV2AssessmentCompatibility ?? parsedMovementProfileV2Assessment.compatibility,
        }
      : {}),
  };
}

export function deserializeCheckUp(json: string): StoredCheckUp | null {
  try {
    return migrate(JSON.parse(json));
  } catch {
    return null;
  }
}

function validStoredCheckUpType(value: unknown): StoredCheckUpType | null {
  if (
    value === 'baseline' ||
    value === 'baseline_retake' ||
    value === 'manual_extra_v2' ||
    value === 'official_retest' ||
    value === 'micro_check' ||
    value === 'legacy_unknown'
  ) {
    return value;
  }
  // Retired manual/quick-recheck records from early dev installs.
  if (value === 'manual_extra' || value === 'quick_recheck') return 'legacy_unknown';
  return null;
}

function validScoreSnapshotCompatibility(value: unknown): ScoreSnapshotCompatibility | null {
  if (
    value === 'current' ||
    value === 'legacy_unversioned' ||
    value === 'incompatible_version' ||
    value === 'invalid_snapshot' ||
    value === 'unsupported_schema' ||
    value === 'unsupported_checkup_protocol'
  ) {
    return value;
  }
  return null;
}

function parseScoreSnapshotForCheckUp(
  value: VersionedCheckUpScoreSnapshot | null | undefined,
  checkUp: CheckUp
): { snapshot?: VersionedCheckUpScoreSnapshot; compatibility: ScoreSnapshotCompatibility } {
  const protocolPolicy = normalizeCheckUpRecordProtocolPolicy(checkUp);
  if (
    !protocolPolicy.supported ||
    protocolPolicy.policy.id !== LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID
  ) {
    return { compatibility: 'unsupported_checkup_protocol' };
  }
  const parsedSnapshot = parseStoredScoreSnapshot(value);
  if (!parsedSnapshot.ok) {
    return { compatibility: classifyStoredScoreSnapshot(value) };
  }
  if (!scoreSnapshotBelongsToCheckUp(parsedSnapshot.snapshot, checkUp)) {
    return { compatibility: 'invalid_snapshot' };
  }
  return { snapshot: parsedSnapshot.snapshot, compatibility: parsedSnapshot.compatibility };
}

function scoreSnapshotBelongsToCheckUp(snapshot: VersionedCheckUpScoreSnapshot, checkUp: CheckUp): boolean {
  return snapshot.sourceCheckUpId === checkUp.startedAt && snapshot.score.startedAt === checkUp.startedAt;
}

function parseMovementProfileV2SnapshotForCheckUp(
  value: unknown,
  checkUp: CheckUp,
  checkupType: StoredCheckUpType
): {
  snapshot?: StoredMovementProfileV2Snapshot;
  compatibility: MovementProfileV2SnapshotCompatibility;
  shouldStoreCompatibility: boolean;
} {
  if (value === undefined || value === null) {
    return {
      compatibility: 'missing',
      shouldStoreCompatibility: isMovementProfileV2CheckUp(checkUp),
    };
  }
  const parsed = parseStoredMovementProfileV2Snapshot(value);
  if (!parsed.ok) {
    return { compatibility: parsed.compatibility, shouldStoreCompatibility: true };
  }
  if (!isOfficialMovementProfileV2SnapshotSourceType(checkupType)) {
    return { compatibility: 'unsupported_source_type', shouldStoreCompatibility: true };
  }
  if (!isMovementProfileV2CheckUp(checkUp)) {
    return { compatibility: 'unsupported_checkup_protocol', shouldStoreCompatibility: true };
  }
  const valid = validMovementProfileV2SnapshotForCheckUp({
    snapshot: parsed.snapshot,
    checkUp,
    checkupType,
  });
  if (!valid) {
    return { compatibility: 'source_mismatch', shouldStoreCompatibility: true };
  }
  return { snapshot: valid, compatibility: parsed.compatibility, shouldStoreCompatibility: true };
}

function parseMovementProfileV2AssessmentForCheckUp(
  value: unknown,
  snapshot: StoredMovementProfileV2Snapshot | undefined,
  checkUp: CheckUp,
  checkupType: StoredCheckUpType
): {
  assessment?: MovementProfileV2Assessment;
  compatibility: MovementProfileV2AssessmentCompatibility;
  shouldStoreCompatibility: boolean;
} {
  if (value === undefined || value === null) {
    return {
      compatibility: 'missing',
      shouldStoreCompatibility: isMovementProfileV2CheckUp(checkUp),
    };
  }
  if (!snapshot) {
    return { compatibility: 'snapshot_missing', shouldStoreCompatibility: true };
  }
  const eligibility = getMovementProfileV2AssessmentPersistenceEligibility({
    checkUp,
    checkupType,
    snapshot,
    assessment: value,
  });
  if (!eligibility.eligible) {
    return { compatibility: eligibility.compatibility, shouldStoreCompatibility: true };
  }
  return { assessment: eligibility.assessment, compatibility: 'current', shouldStoreCompatibility: true };
}

function validMovementProfileV2SnapshotCompatibility(value: unknown): MovementProfileV2SnapshotCompatibility | null {
  if (
    value === 'current' ||
    value === 'missing' ||
    value === 'malformed' ||
    value === 'future_schema' ||
    value === 'fingerprint_invalid' ||
    value === 'source_mismatch' ||
    value === 'unsupported_checkup_protocol' ||
    value === 'unsupported_source_type'
  ) {
    return value;
  }
  return null;
}

function validMovementProfileV2AssessmentCompatibility(value: unknown): MovementProfileV2AssessmentCompatibility | null {
  if (
    value === 'current' ||
    value === 'missing' ||
    value === 'malformed' ||
    value === 'future_schema' ||
    value === 'fingerprint_invalid' ||
    value === 'source_mismatch' ||
    value === 'snapshot_missing' ||
    value === 'unsupported_checkup_protocol' ||
    value === 'unsupported_source_type' ||
    value === 'focus_not_persistable' ||
    value === 'conflict'
  ) {
    return value;
  }
  return null;
}

function isMovementProfileV2CheckUp(checkUp: CheckUp): boolean {
  const protocolPolicy = normalizeCheckUpRecordProtocolPolicy(checkUp);
  return protocolPolicy.supported && protocolPolicy.policy.id === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
}

function isOfficialMovementProfileV2SnapshotSourceType(
  checkupType: StoredCheckUpType
): checkupType is 'baseline' | 'baseline_retake' | 'official_retest' {
  return checkupType === 'baseline' || checkupType === 'baseline_retake' || checkupType === 'official_retest';
}

function checkUpWithoutEmbeddedSnapshots(value: CheckUp): CheckUp {
  if (!value || typeof value !== 'object') return value;
  const {
    movementProfileV2Snapshot: _movementProfileV2Snapshot,
    movementProfileV2Assessment: _movementProfileV2Assessment,
    ...checkUp
  } = value as CheckUp & {
    movementProfileV2Snapshot?: unknown;
    movementProfileV2Assessment?: unknown;
  };
  // Additive self-report appendix (no history version bump): a malformed
  // block drops rather than blocking the measurement record it rides on.
  const selfReport = validCheckUpSelfReport((checkUp as CheckUp).selfReport);
  if (selfReport) return { ...checkUp, selfReport };
  const { selfReport: _selfReport, ...withoutSelfReport } = checkUp as CheckUp;
  return withoutSelfReport;
}
