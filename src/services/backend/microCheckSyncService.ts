import type { MovementBlock, TrainingSessionCompletion } from '../../adherence';
import type { MicroCheckResult, MicroCheckType } from '../../training';
import { supabase } from '../../lib/supabase';

import { getCurrentSession } from './authService';
import type { BackendJson } from './types';

type RemoteMicroCheckDomain = 'strength_power' | 'balance' | 'mobility';
type MicroCheckSyncStatus = 'signed_out' | 'synced' | 'failed' | 'skipped';

export interface MicroCheckSyncInput {
  result: MicroCheckResult;
  movementBlock?: MovementBlock | null;
  completion?: TrainingSessionCompletion | null;
  movementBlockRemoteId?: string | null;
}

export interface MicroCheckSyncResult {
  status: MicroCheckSyncStatus;
  localMicroCheckId?: string;
  domain?: RemoteMicroCheckDomain;
  error?: unknown;
}

interface MicroCheckRemotePayload {
  user_id: string;
  movement_block_id?: string | null;
  local_micro_check_id: string;
  domain: RemoteMicroCheckDomain;
  result_json: BackendJson;
  completed_at: string;
}

interface MovementBlockResolution {
  movementBlockId?: string | null;
  lookupFailed: boolean;
}

interface ExistingMicroCheckJsonResolution {
  resultJson?: BackendJson;
  lookupFailed: boolean;
}

const inFlightSyncs = new Set<string>();
const successfulFingerprints = new Map<string, string>();

export async function syncMicroCheckToRemote(input: MicroCheckSyncInput): Promise<MicroCheckSyncResult> {
  const localMicroCheckId = localMicroCheckIdFor(input.result);
  const domain = domainForMicroCheck(input.result.type);

  try {
    const session = await getCurrentSession();
    const userId = session?.user.id;
    if (!userId) return { status: 'signed_out', localMicroCheckId, domain };

    const syncKey = `${userId}:${localMicroCheckId}`;
    if (inFlightSyncs.has(syncKey)) {
      return { status: 'skipped', localMicroCheckId, domain };
    }

    inFlightSyncs.add(syncKey);

    try {
      const blockResolution = await resolveMovementBlockId(input, userId);
      const existingJsonResolution =
        input.movementBlock || input.completion
          ? { lookupFailed: false }
          : await loadExistingMicroCheckJson(userId, localMicroCheckId);
      const payload = mapLocalMicroCheckToRemotePayload(input, userId, {
        movementBlockId: blockResolution.movementBlockId,
        omitMovementBlockId: blockResolution.lookupFailed,
        existingResultJson: existingJsonResolution.resultJson,
      });
      const fingerprint = JSON.stringify(payload);

      if (successfulFingerprints.get(syncKey) === fingerprint) {
        return { status: 'skipped', localMicroCheckId, domain };
      }

      if (__DEV__) {
        console.log(`[microcheck-sync] started local_micro_check_id=${localMicroCheckId} domain=${domain}`);
      }

      const { error } = await supabase
        .from('micro_checks')
        .upsert(payload, { onConflict: 'user_id,local_micro_check_id' });

      if (error) throw error;

      successfulFingerprints.set(syncKey, fingerprint);

      if (__DEV__) {
        console.log(`[microcheck-sync] synced local_micro_check_id=${localMicroCheckId} domain=${domain}`);
      }

      return { status: 'synced', localMicroCheckId, domain };
    } finally {
      inFlightSyncs.delete(syncKey);
    }
  } catch (error) {
    console.warn(`[microcheck-sync] Supabase micro-check sync failed for ${localMicroCheckId}`, error);
    return { status: 'failed', localMicroCheckId, domain, error };
  }
}

export async function syncRecentMicroChecksToRemote(
  results: readonly MicroCheckResult[],
  options: {
    blocks?: readonly MovementBlock[];
    completions?: readonly TrainingSessionCompletion[];
    limit?: number;
  } = {}
): Promise<MicroCheckSyncResult[]> {
  const orderedResults = results.slice().sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const recent = orderedResults.slice(-(options.limit ?? 20));
  const matchedCompletionIds = new Set<string>();
  const syncResults: MicroCheckSyncResult[] = [];

  for (const result of recent) {
    const completion = completionForMicroCheck(result, options.completions, matchedCompletionIds);
    if (completion) matchedCompletionIds.add(completion.id);
    const movementBlock = completion
      ? options.blocks?.find((block) => block.id === completion.blockId) ?? null
      : null;

    syncResults.push(
      await syncMicroCheckToRemote({
        result,
        completion,
        movementBlock,
      })
    );
  }

  return syncResults;
}

export function mapLocalMicroCheckToRemotePayload(
  input: MicroCheckSyncInput,
  userId: string,
  options: {
    movementBlockId?: string | null;
    omitMovementBlockId?: boolean;
    existingResultJson?: BackendJson;
  } = {}
): MicroCheckRemotePayload {
  const existingResultJson = jsonRecord(options.existingResultJson);
  const domain = domainForMicroCheck(input.result.type);

  return omitUndefined({
    user_id: userId,
    movement_block_id: options.omitMovementBlockId ? undefined : options.movementBlockId ?? null,
    local_micro_check_id: localMicroCheckIdFor(input.result),
    domain,
    result_json: toBackendJson({
      ...existingResultJson,
      schemaVersion: 1,
      domain,
      metric: metricForMicroCheck(input.result),
      result: sanitizeMicroCheckResult(input.result),
      movementBlock: sanitizeMovementBlock(input.movementBlock) ?? existingResultJson.movementBlock ?? null,
      completion: sanitizeCompletion(input.completion) ?? existingResultJson.completion ?? null,
    }),
    completed_at: input.result.startedAt,
  });
}

async function resolveMovementBlockId(
  input: MicroCheckSyncInput,
  userId: string
): Promise<MovementBlockResolution> {
  if (input.movementBlockRemoteId) {
    return { movementBlockId: input.movementBlockRemoteId, lookupFailed: false };
  }

  const localBlockId = normalizedString(input.completion?.blockId ?? input.movementBlock?.id);
  if (!localBlockId) return { movementBlockId: null, lookupFailed: false };

  const { data, error } = await supabase
    .from('movement_blocks')
    .select('id')
    .eq('user_id', userId)
    .eq('local_block_id', localBlockId)
    .maybeSingle();

  if (error) {
    console.warn(`[microcheck-sync] movement block lookup failed for local_block_id=${localBlockId}`, error);
    return { lookupFailed: true };
  }

  const movementBlockId = typeof data?.id === 'string' && data.id.trim().length > 0 ? data.id : null;
  return { movementBlockId, lookupFailed: false };
}

async function loadExistingMicroCheckJson(
  userId: string,
  localMicroCheckId: string
): Promise<ExistingMicroCheckJsonResolution> {
  const { data, error } = await supabase
    .from('micro_checks')
    .select('result_json')
    .eq('user_id', userId)
    .eq('local_micro_check_id', localMicroCheckId)
    .maybeSingle();

  if (error) {
    console.warn(`[microcheck-sync] existing result_json lookup failed for local_micro_check_id=${localMicroCheckId}`, error);
    return { lookupFailed: true };
  }

  return {
    resultJson: isBackendJson(data?.result_json) ? data.result_json : undefined,
    lookupFailed: false,
  };
}

function completionForMicroCheck(
  result: MicroCheckResult,
  completions: readonly TrainingSessionCompletion[] | undefined,
  matchedCompletionIds: ReadonlySet<string>
): TrainingSessionCompletion | null {
  if (!completions) return null;
  const resultDay = result.startedAt.slice(0, 10);
  const candidates = completions
    .filter((completion) => completion.sessionType === 'micro_check')
    .filter((completion) => !matchedCompletionIds.has(completion.id))
    .filter((completion) => completion.completedAt.slice(0, 10) === resultDay)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));

  return candidates.length === 1 ? candidates[0] : null;
}

function localMicroCheckIdFor(result: MicroCheckResult): string {
  const startedAt = normalizedString(result.startedAt);
  if (startedAt) return `microcheck-${startedAt.replace(/[:.]/g, '-')}`;
  return `microcheck-${stableHash(JSON.stringify(sanitizeMicroCheckResult(result)))}`;
}

function domainForMicroCheck(type: MicroCheckType): RemoteMicroCheckDomain {
  if (type === 'chair-power') return 'strength_power';
  if (type === 'single-leg-balance') return 'balance';
  return 'mobility';
}

function metricForMicroCheck(result: MicroCheckResult): BackendJson {
  if (result.type === 'chair-power') {
    return sanitizeForBackendJson({
      key: 'rise_velocity',
      riseVelocityBuPerSecond: result.value,
      reps: result.reps,
      measured: result.measured,
    });
  }

  if (result.type === 'single-leg-balance') {
    return sanitizeForBackendJson({
      key: 'single_leg_hold_seconds',
      holdSeconds: result.value,
      measured: result.measured,
    });
  }

  return sanitizeForBackendJson({
    key: 'mobility_reach_angle',
    reachAngleDegrees: result.value,
    measured: result.measured,
  });
}

function sanitizeMicroCheckResult(result: MicroCheckResult): BackendJson {
  return sanitizeForBackendJson({
    type: result.type,
    startedAt: result.startedAt,
    value: result.value,
    reps: result.reps,
    measured: result.measured,
  });
}

function sanitizeMovementBlock(block: MovementBlock | null | undefined): BackendJson {
  if (!block) return null;
  return sanitizeForBackendJson({
    id: block.id,
    status: block.status,
    focusDomain: block.focusDomain,
    startDate: block.startDate,
    endDate: block.endDate,
    retestDate: block.retestDate,
    completedSessions: block.completedSessions,
    microChecksCompleted: block.microChecksCompleted,
  });
}

function sanitizeCompletion(completion: TrainingSessionCompletion | null | undefined): BackendJson {
  if (!completion) return null;
  return sanitizeForBackendJson({
    id: completion.id,
    blockId: completion.blockId,
    completedAt: completion.completedAt,
    sessionType: completion.sessionType,
    durationMinutes: completion.durationMinutes,
    focusDomain: completion.focusDomain,
  });
}

function normalizedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function jsonRecord(value: unknown): Record<string, BackendJson> {
  return !!value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, BackendJson>) : {};
}

function isBackendJson(value: unknown): value is BackendJson {
  if (value === null) return true;
  if (typeof value === 'boolean' || typeof value === 'string') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isBackendJson);
  if (typeof value === 'object') return Object.values(value).every(isBackendJson);
  return false;
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
