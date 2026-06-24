import { movementDomainFromScoreDomain, type CheckupType, type CheckupStatus, type MovementAssessment } from '../../adherence';
import {
  LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID,
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  normalizeCheckUpRecordProtocolPolicy,
  type CheckUp,
} from '../../checkup';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  parseStoredMovementProfileV2Snapshot,
  validMovementProfileV2SnapshotForCheckUp,
  type MovementProfileV2SnapshotCompatibility,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import {
  createCurrentVersionedScoreSnapshot,
  parseStoredScoreSnapshot,
  scoreSnapshotVersionMetadata,
  type CheckUpScore,
  type Domain,
  type VersionedCheckUpScoreSnapshot,
} from '../../scoring';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb } from '../observability/sentry';
import { getCurrentSession } from './authService';
import type { BackendJson } from './types';

type RemoteMovementCheckupType = 'baseline' | 'official_retest' | 'manual_extra' | 'weekly_micro' | 'unknown';
type CheckupSyncStatus = 'signed_out' | 'synced' | 'failed' | 'skipped';

export interface MovementCheckupSyncInput {
  checkUp: CheckUp;
  checkupType?: CheckupType | RemoteMovementCheckupType;
  status?: CheckupStatus;
  completedAt?: string;
  score?: CheckUpScore;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  movementProfileV2Snapshot?: StoredMovementProfileV2Snapshot | null;
  assessment?: MovementAssessment | null;
}

export interface MovementCheckupSyncResult {
  status: CheckupSyncStatus;
  localCheckupId?: string;
  checkupType?: RemoteMovementCheckupType;
  error?: unknown;
}

interface MovementCheckupRemotePayload {
  user_id: string;
  local_checkup_id: string;
  checkup_type: RemoteMovementCheckupType;
  status: CheckupStatus;
  body_unit?: number;
  strength_power_score?: number;
  balance_score?: number;
  mobility_score?: number;
  weakest_domain?: string;
  derived_scores_json: BackendJson;
  raw_checkup_json: BackendJson;
  created_locally_at: string;
  completed_at: string;
}

const inFlightSyncs = new Set<string>();
const successfulSyncs = new Set<string>();

export async function syncMovementCheckupToRemote(
  input: MovementCheckupSyncInput
): Promise<MovementCheckupSyncResult> {
  const localCheckupId = localCheckupIdFor(input.checkUp);
  const checkupType = mapCheckupType(input.checkupType ?? input.assessment?.type);

  try {
    const session = await getCurrentSession();
    const userId = session?.user.id;
    if (!userId) return { status: 'signed_out', localCheckupId, checkupType };

    const syncKey = `${userId}:${localCheckupId}`;
    if (inFlightSyncs.has(syncKey)) {
      return { status: 'skipped', localCheckupId, checkupType };
    }
    if (successfulSyncs.has(syncKey)) {
      return { status: 'skipped', localCheckupId, checkupType };
    }

    inFlightSyncs.add(syncKey);
    addBreadcrumb('sync category started', {
      category: 'checkups',
      localCheckupId,
      checkupType,
    });
    if (__DEV__) {
      console.log(`[checkup-sync] started local_checkup_id=${localCheckupId} checkup_type=${checkupType}`);
    }

    try {
      const payload = mapLocalCheckupToRemotePayload(input, userId);
      const { error } = await supabase
        .from('movement_checkups')
        .upsert(payload, { onConflict: 'user_id,local_checkup_id' });

      if (error) throw error;

      if (__DEV__) {
        console.log(`[checkup-sync] synced local_checkup_id=${localCheckupId} checkup_type=${checkupType}`);
      }

      successfulSyncs.add(syncKey);
      addBreadcrumb('sync category succeeded', {
        category: 'checkups',
        localCheckupId,
        checkupType,
      });
      return { status: 'synced', localCheckupId, checkupType };
    } finally {
      inFlightSyncs.delete(syncKey);
    }
  } catch (error) {
    console.warn(`[checkup-sync] Supabase check-up sync failed for ${localCheckupId}`, error);
    addBreadcrumb('sync category failed', {
      category: 'checkups',
      localCheckupId,
      checkupType,
    });
    return { status: 'failed', localCheckupId, checkupType, error };
  }
}

export async function syncRecentMovementCheckupsToRemote(
  records: readonly StoredCheckUp[],
  options: {
    assessments?: readonly MovementAssessment[];
    limit?: number;
  } = {}
): Promise<MovementCheckupSyncResult[]> {
  const limit = options.limit ?? 20;
  const recent = records.slice(-limit);
  const results: MovementCheckupSyncResult[] = [];

  for (const record of recent) {
    const assessment = assessmentForCheckup(record.checkUp, options.assessments);
    results.push(
      await syncMovementCheckupToRemote({
        checkUp: record.checkUp,
        assessment,
        checkupType: assessment?.type ?? record.checkupType,
        status: assessment?.status,
        completedAt: assessment?.completedAt,
        scoreSnapshot: record.scoreSnapshot,
        movementProfileV2Snapshot: record.movementProfileV2Snapshot,
      })
    );
  }

  return results;
}

export function mapLocalCheckupToRemotePayload(
  input: MovementCheckupSyncInput,
  userId: string
): MovementCheckupRemotePayload {
  const suppliedSnapshot = parseStoredScoreSnapshot(input.scoreSnapshot);
  const suppliedSnapshotBelongsToCheckUp =
    suppliedSnapshot.ok && scoreSnapshotBelongsToCheckUp(suppliedSnapshot.snapshot, input.checkUp);
  const protocolPolicy = normalizeCheckUpRecordProtocolPolicy(input.checkUp);
  const unsupportedProtocol =
    !protocolPolicy.supported ||
    protocolPolicy.policy.id !== LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID;
  const scored =
    input.scoreSnapshot === undefined && !unsupportedProtocol
      ? createCurrentVersionedScoreSnapshot(input.checkUp, { createdAt: input.completedAt ?? input.checkUp.startedAt })
      : null;
  const scoreSnapshot = suppliedSnapshotBelongsToCheckUp ? suppliedSnapshot.snapshot : scored?.snapshot ?? null;
  const score = scoreSnapshot ? (suppliedSnapshotBelongsToCheckUp ? suppliedSnapshot.score : scored?.score ?? null) : null;
  const localCheckupId = localCheckupIdFor(input.checkUp);
  const status = input.status ?? input.assessment?.status ?? 'completed';
  const completedAt = input.completedAt ?? input.assessment?.completedAt ?? input.checkUp.startedAt;
  const exactCheckupType = exactLocalCheckupType(input.checkupType ?? input.assessment?.type);
  const checkupType = mapCheckupType(input.checkupType ?? input.assessment?.type);
  const weakestDomain = score?.weakestDomain ? movementDomainFromScoreDomain(score.weakestDomain) : undefined;
  const snapshotMetadata = scoreSnapshotVersionMetadata(scoreSnapshot);
  const movementProfileV2SnapshotCandidate =
    input.movementProfileV2Snapshot !== undefined
      ? input.movementProfileV2Snapshot
      : input.checkUp.movementProfileV2Snapshot;
  const parsedMovementProfileV2Snapshot = parseMovementProfileV2SnapshotForSync(
    movementProfileV2SnapshotCandidate,
    input.checkUp,
    exactCheckupType
  );
  const movementProfileV2SnapshotFields = parsedMovementProfileV2Snapshot.shouldStore
    ? {
        movementProfileV2Snapshot: parsedMovementProfileV2Snapshot.snapshot ?? null,
        movementProfileV2SnapshotCompatibility: parsedMovementProfileV2Snapshot.compatibility,
        movementProfileV2SnapshotSchemaVersion: parsedMovementProfileV2Snapshot.snapshot?.schemaVersion ?? null,
        movementProfileV2SnapshotSourceCheckUpId: parsedMovementProfileV2Snapshot.snapshot?.sourceCheckUpId ?? null,
        movementProfileV2SnapshotFingerprint: parsedMovementProfileV2Snapshot.snapshot?.snapshotFingerprint ?? null,
      }
    : {};
  const snapshotCompatibility = scoreSnapshot
    ? suppliedSnapshotBelongsToCheckUp
      ? suppliedSnapshot.compatibility
      : 'current'
    : unsupportedProtocol
      ? 'unsupported_checkup_protocol'
    : input.scoreSnapshot === undefined
      ? 'invalid_snapshot'
      : suppliedSnapshot.ok
        ? 'invalid_snapshot'
        : suppliedSnapshot.compatibility;

  return omitUndefined({
    user_id: userId,
    local_checkup_id: localCheckupId,
    checkup_type: checkupType,
    status,
    body_unit: finiteNumber(input.checkUp.bodyUnit),
    strength_power_score: score ? scoreForDomain(score, 'strength') : undefined,
    balance_score: score ? scoreForDomain(score, 'balance') : undefined,
    mobility_score: score ? scoreForDomain(score, 'mobility') : undefined,
    weakest_domain: weakestDomain,
    derived_scores_json: toBackendJson({
      schemaVersion: 1,
      checkupType: exactCheckupType,
      exactCheckupType,
      scoreSnapshot,
      scoreSnapshotCompatibility: snapshotCompatibility,
      scoreSnapshotSchemaVersion: snapshotMetadata.schemaVersion,
      scoringVersion: snapshotMetadata.scoringVersion,
      normVersion: snapshotMetadata.normVersion,
      ...movementProfileV2SnapshotFields,
      score,
      weakestDomain,
      assessment: input.assessment
        ? {
            id: input.assessment.id,
            type: input.assessment.type,
            status: input.assessment.status,
            completedAt: input.assessment.completedAt,
            sourceBlockId: input.assessment.sourceBlockId,
            isOfficialForProgress: input.assessment.isOfficialForProgress,
          }
        : null,
    }),
    raw_checkup_json: toBackendJson({
      schemaVersion: HISTORY_SCHEMA_VERSION,
      checkupType: exactCheckupType,
      scoreSnapshot,
      ...movementProfileV2SnapshotFields,
      checkUp: sanitizeCheckup(input.checkUp),
    }),
    created_locally_at: input.checkUp.startedAt,
    completed_at: completedAt,
  });
}

function mapCheckupType(type: CheckupType | RemoteMovementCheckupType | undefined): RemoteMovementCheckupType {
  if (type === 'baseline' || type === 'official_retest' || type === 'manual_extra') return type;
  if (type === 'weekly_micro') return 'weekly_micro';
  return 'unknown';
}

function exactLocalCheckupType(type: CheckupType | RemoteMovementCheckupType | undefined): CheckupType | undefined {
  if (
    type === 'baseline' ||
    type === 'baseline_retake' ||
    type === 'manual_extra' ||
    type === 'official_retest' ||
    type === 'quick_recheck' ||
    type === 'micro_check' ||
    type === 'legacy_unknown'
  ) {
    return type;
  }
  return undefined;
}

function assessmentForCheckup(
  checkUp: CheckUp,
  assessments: readonly MovementAssessment[] | undefined
): MovementAssessment | null {
  if (!assessments) return null;
  return assessments.find((assessment) => assessment.results?.rawMetrics?.checkUpId === checkUp.startedAt) ?? null;
}

function localCheckupIdFor(checkUp: CheckUp): string {
  if (checkUp.startedAt.trim().length > 0) return checkUp.startedAt;
  return `checkup-${stableHash(JSON.stringify(sanitizeCheckup(checkUp)))}`;
}

function scoreSnapshotBelongsToCheckUp(snapshot: VersionedCheckUpScoreSnapshot, checkUp: CheckUp): boolean {
  return snapshot.sourceCheckUpId === checkUp.startedAt && snapshot.score.startedAt === checkUp.startedAt;
}

function parseMovementProfileV2SnapshotForSync(
  value: unknown,
  checkUp: CheckUp,
  checkupType: CheckupType | undefined
): {
  snapshot?: StoredMovementProfileV2Snapshot;
  compatibility: MovementProfileV2SnapshotCompatibility;
  shouldStore: boolean;
} {
  const protocolPolicy = normalizeCheckUpRecordProtocolPolicy(checkUp);
  const isV2Protocol = protocolPolicy.supported && protocolPolicy.policy.id === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  if (value === undefined || value === null) {
    return {
      compatibility: 'missing',
      shouldStore: isV2Protocol,
    };
  }
  const parsed = parseStoredMovementProfileV2Snapshot(value);
  if (!parsed.ok) {
    return { compatibility: parsed.compatibility, shouldStore: true };
  }
  if (!isOfficialMovementProfileV2SnapshotSourceType(checkupType)) {
    return { compatibility: 'unsupported_source_type', shouldStore: true };
  }
  if (!isV2Protocol) {
    return { compatibility: 'unsupported_checkup_protocol', shouldStore: true };
  }
  const valid = validMovementProfileV2SnapshotForCheckUp({
    snapshot: parsed.snapshot,
    checkUp,
    checkupType,
  });
  if (!valid) {
    return { compatibility: 'source_mismatch', shouldStore: true };
  }
  return { snapshot: valid, compatibility: parsed.compatibility, shouldStore: true };
}

function isOfficialMovementProfileV2SnapshotSourceType(
  checkupType: CheckupType | undefined
): checkupType is 'baseline' | 'baseline_retake' | 'official_retest' {
  return checkupType === 'baseline' || checkupType === 'baseline_retake' || checkupType === 'official_retest';
}

function scoreForDomain(score: CheckUpScore, domain: Domain): number | undefined {
  const result = score.domains.find((item) => item.domain === domain);
  if (!result?.measured) return undefined;
  const midpoint = (result.ageLow + result.ageHigh) / 2;
  return finiteNumber(midpoint);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function sanitizeCheckup(checkUp: CheckUp): BackendJson {
  return sanitizeForBackendJson({
    startedAt: checkUp.startedAt,
    protocolPolicy: checkUp.protocolPolicy ?? null,
    bodyUnit: checkUp.bodyUnit,
    items: checkUp.items.map((item) => ({
      movementId: item.movementId,
      status: item.status,
      result: item.result,
    })),
  });
}

function sanitizeForBackendJson(value: unknown, key = ''): BackendJson {
  if (isSensitivePayloadKey(key)) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map((item) => sanitizeForBackendJson(item));
  if (typeof value === 'object') {
    const out: Record<string, BackendJson> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (isSensitivePayloadKey(childKey)) continue;
      out[childKey] = sanitizeForBackendJson(childValue, childKey);
    }
    return out;
  }
  return null;
}

function isSensitivePayloadKey(key: string): boolean {
  return /(^|_)(frame|frames|landmark|landmarks|video|image|base64|uri|path)$/i.test(key);
}

function toBackendJson(value: unknown): BackendJson {
  return sanitizeForBackendJson(value);
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) out[key] = item;
  }
  return out as T;
}

function stableHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
