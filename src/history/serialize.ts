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

import { CheckUp } from '../checkup/types';
import type { CheckupType } from '../adherence/types';
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
}

export interface StoredCheckUp {
  schemaVersion: number;
  checkUp: CheckUp;
  checkupType: StoredCheckUpType;
  sourceAssessmentId?: string;
  retryOfCheckUpId?: string;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot;
  scoreSnapshotCompatibility: ScoreSnapshotCompatibility;
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

export function serializeCheckUp(checkUp: CheckUp, metadata: StoredCheckUpMetadata = {}): string {
  const parsedSnapshot = parseScoreSnapshotForCheckUp(metadata.scoreSnapshot, checkUp);
  const record: StoredCheckUp = {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp,
    checkupType: validStoredCheckUpType(metadata.checkupType) ?? 'legacy_unknown',
    sourceAssessmentId: metadata.sourceAssessmentId,
    retryOfCheckUpId: metadata.retryOfCheckUpId,
    ...(parsedSnapshot.snapshot ? { scoreSnapshot: parsedSnapshot.snapshot } : {}),
    scoreSnapshotCompatibility: parsedSnapshot.compatibility,
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
  const checkUp = rec.checkUp;
  if (!checkUp || typeof checkUp !== 'object' || !Array.isArray(checkUp.items)) return null;
  if (typeof checkUp.startedAt !== 'string') return null;
  const parsedSnapshot = parseScoreSnapshotForCheckUp(rec.scoreSnapshot, checkUp);
  const explicitCompatibility = validScoreSnapshotCompatibility(rec.scoreSnapshotCompatibility);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp,
    checkupType: validStoredCheckUpType(rec.checkupType) ?? 'legacy_unknown',
    sourceAssessmentId: typeof rec.sourceAssessmentId === 'string' ? rec.sourceAssessmentId : undefined,
    retryOfCheckUpId: typeof rec.retryOfCheckUpId === 'string' ? rec.retryOfCheckUpId : undefined,
    ...(parsedSnapshot.snapshot ? { scoreSnapshot: parsedSnapshot.snapshot } : {}),
    scoreSnapshotCompatibility: parsedSnapshot.snapshot
      ? parsedSnapshot.compatibility
      : explicitCompatibility ?? parsedSnapshot.compatibility,
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
    value === 'manual_extra' ||
    value === 'official_retest' ||
    value === 'quick_recheck' ||
    value === 'micro_check' ||
    value === 'legacy_unknown'
  ) {
    return value;
  }
  return null;
}

function validScoreSnapshotCompatibility(value: unknown): ScoreSnapshotCompatibility | null {
  if (
    value === 'current' ||
    value === 'legacy_unversioned' ||
    value === 'incompatible_version' ||
    value === 'invalid_snapshot' ||
    value === 'unsupported_schema'
  ) {
    return value;
  }
  return null;
}

function parseScoreSnapshotForCheckUp(
  value: VersionedCheckUpScoreSnapshot | null | undefined,
  checkUp: CheckUp
): { snapshot?: VersionedCheckUpScoreSnapshot; compatibility: ScoreSnapshotCompatibility } {
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
