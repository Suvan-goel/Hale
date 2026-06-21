import { movementBlockSourceCheckUpId, type MovementBlock, type MovementBlockStatus, type MovementDomain } from '../../adherence';
import type { TrainingBlock, TrainingState } from '../../training';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb } from '../observability/sentry';

import { getCurrentSession } from './authService';
import type { BackendJson } from './types';

type RemoteMovementBlockFocusDomain = MovementDomain | 'general';
type RemoteMovementBlockStatus = 'draft' | 'active' | 'completed' | 'paused' | 'abandoned';
type BlockSyncStatus = 'signed_out' | 'synced' | 'failed' | 'skipped';

export interface MovementBlockSyncInput {
  block: MovementBlock;
  trainingBlock?: TrainingBlock | null;
  training?: TrainingState | null;
  blockNumber?: number;
  sourceCheckupLocalId?: string | null;
  sourceCheckupRemoteId?: string | null;
}

export interface MovementBlockSyncResult {
  status: BlockSyncStatus;
  localBlockId?: string;
  focusDomain?: RemoteMovementBlockFocusDomain;
  error?: unknown;
}

interface MovementBlockRemotePayload {
  user_id: string;
  local_block_id: string;
  source_checkup_id?: string | null;
  block_number?: number;
  focus_domain: RemoteMovementBlockFocusDomain;
  status: RemoteMovementBlockStatus;
  started_at?: string;
  completed_at?: string | null;
  block_json?: BackendJson;
}

interface SourceCheckupResolution {
  sourceCheckupId?: string | null;
  lookupFailed: boolean;
}

interface ExistingBlockJsonResolution {
  blockJson?: BackendJson;
  lookupFailed: boolean;
}

const inFlightSyncs = new Set<string>();
const successfulFingerprints = new Map<string, string>();

export async function syncMovementBlockToRemote(
  input: MovementBlockSyncInput
): Promise<MovementBlockSyncResult> {
  const localBlockId = localBlockIdFor(input.block);
  const focusDomain = mapFocusDomain(input.block.focusDomain);

  try {
    const session = await getCurrentSession();
    const userId = session?.user.id;
    if (!userId) return { status: 'signed_out', localBlockId, focusDomain };

    const syncKey = `${userId}:${localBlockId}`;
    if (inFlightSyncs.has(syncKey)) {
      return { status: 'skipped', localBlockId, focusDomain };
    }

    inFlightSyncs.add(syncKey);

    try {
      const sourceResolution = await resolveSourceCheckupId(input, userId);
      const trainingBlock = input.trainingBlock ?? trainingBlockForMovementBlock(input.block, input.training);
      const existingBlockJsonResolution = trainingBlock
        ? { lookupFailed: false }
        : await loadExistingBlockJson(userId, localBlockId);
      const payload = mapLocalBlockToRemotePayload(input, userId, {
        sourceCheckupId: sourceResolution.sourceCheckupId,
        omitSourceCheckupId: sourceResolution.lookupFailed,
        trainingBlock,
        existingBlockJson: existingBlockJsonResolution.blockJson,
        omitBlockJson: existingBlockJsonResolution.lookupFailed,
      });
      const fingerprint = JSON.stringify(payload);

      if (successfulFingerprints.get(syncKey) === fingerprint) {
        return { status: 'skipped', localBlockId, focusDomain };
      }

      if (__DEV__) {
        console.log(
          `[block-sync] started local_block_id=${localBlockId} focus_domain=${focusDomain} status=${input.block.status}`
        );
      }
      addBreadcrumb('sync category started', {
        category: 'movement_blocks',
        localBlockId,
        focusDomain,
        status: input.block.status,
      });

      const { error } = await supabase
        .from('movement_blocks')
        .upsert(payload, { onConflict: 'user_id,local_block_id' });

      if (error) throw error;

      successfulFingerprints.set(syncKey, fingerprint);

      if (__DEV__) {
        console.log(
          `[block-sync] synced local_block_id=${localBlockId} focus_domain=${focusDomain} status=${payload.status}`
        );
      }
      addBreadcrumb('sync category succeeded', {
        category: 'movement_blocks',
        localBlockId,
        focusDomain,
        status: payload.status,
      });

      return { status: 'synced', localBlockId, focusDomain };
    } finally {
      inFlightSyncs.delete(syncKey);
    }
  } catch (error) {
    console.warn(`[block-sync] Supabase block sync failed for ${localBlockId}`, error);
    addBreadcrumb('sync category failed', {
      category: 'movement_blocks',
      localBlockId,
      focusDomain,
    });
    return { status: 'failed', localBlockId, focusDomain, error };
  }
}

export async function syncRecentMovementBlocksToRemote(
  blocks: readonly MovementBlock[],
  options: {
    training?: TrainingState | null;
    limit?: number;
  } = {}
): Promise<MovementBlockSyncResult[]> {
  const ordered = orderedBlocks(blocks);
  const recent = ordered.slice(-(options.limit ?? 8));
  const results: MovementBlockSyncResult[] = [];

  for (const block of recent) {
    results.push(
      await syncMovementBlockToRemote({
        block,
        training: options.training ?? null,
        trainingBlock: trainingBlockForMovementBlock(block, options.training),
        blockNumber: blockNumberFor(block, ordered),
        sourceCheckupLocalId: movementBlockSourceCheckUpId(block),
      })
    );
  }

  return results;
}

export function mapLocalBlockToRemotePayload(
  input: MovementBlockSyncInput,
  userId: string,
  options: {
    sourceCheckupId?: string | null;
    omitSourceCheckupId?: boolean;
    trainingBlock?: TrainingBlock | null;
    existingBlockJson?: BackendJson;
    omitBlockJson?: boolean;
  } = {}
): MovementBlockRemotePayload {
  const localBlockId = localBlockIdFor(input.block);
  const status = mapBlockStatus(input.block.status);
  const trainingBlock =
    options.trainingBlock ?? input.trainingBlock ?? trainingBlockForMovementBlock(input.block, input.training);
  const existingBlockJson = isBackendJsonRecord(options.existingBlockJson) ? options.existingBlockJson : {};
  const completedAt = status === 'completed' ? input.block.updatedAt : null;

  return omitUndefined({
    user_id: userId,
    local_block_id: localBlockId,
    source_checkup_id: options.omitSourceCheckupId ? undefined : options.sourceCheckupId ?? null,
    block_number: finitePositiveInteger(input.blockNumber),
    focus_domain: mapFocusDomain(input.block.focusDomain),
    status,
    started_at: validIsoLike(input.block.startDate) ?? validIsoLike(input.block.createdAt),
    completed_at: completedAt,
    block_json: options.omitBlockJson
      ? undefined
      : toBackendJson({
          ...existingBlockJson,
          schemaVersion: 1,
          movementBlock: input.block,
          legacyTrainingBlock: trainingBlock ?? existingBlockJson.legacyTrainingBlock ?? null,
          legacyTrainingProgress: input.training?.progress ?? existingBlockJson.legacyTrainingProgress ?? null,
          equipment: input.training?.equipment ?? existingBlockJson.equipment ?? null,
        }),
  });
}

async function resolveSourceCheckupId(
  input: MovementBlockSyncInput,
  userId: string
): Promise<SourceCheckupResolution> {
  if (input.sourceCheckupRemoteId) {
    return { sourceCheckupId: input.sourceCheckupRemoteId, lookupFailed: false };
  }

  const localCheckupId = normalizedString(input.sourceCheckupLocalId ?? movementBlockSourceCheckUpId(input.block));
  if (!localCheckupId) return { sourceCheckupId: null, lookupFailed: false };

  const { data, error } = await supabase
    .from('movement_checkups')
    .select('id')
    .eq('user_id', userId)
    .eq('local_checkup_id', localCheckupId)
    .maybeSingle();

  if (error) {
    console.warn(`[block-sync] source check-up lookup failed for local_checkup_id=${localCheckupId}`, error);
    return { lookupFailed: true };
  }

  const sourceCheckupId = typeof data?.id === 'string' && data.id.trim().length > 0 ? data.id : null;
  return { sourceCheckupId, lookupFailed: false };
}

async function loadExistingBlockJson(userId: string, localBlockId: string): Promise<ExistingBlockJsonResolution> {
  const { data, error } = await supabase
    .from('movement_blocks')
    .select('block_json')
    .eq('user_id', userId)
    .eq('local_block_id', localBlockId)
    .maybeSingle();

  if (error) {
    console.warn(`[block-sync] existing block_json lookup failed for local_block_id=${localBlockId}`, error);
    return { lookupFailed: true };
  }

  return { blockJson: isBackendJson(data?.block_json) ? data.block_json : undefined, lookupFailed: false };
}

function trainingBlockForMovementBlock(
  block: MovementBlock,
  training: TrainingState | null | undefined
): TrainingBlock | null {
  const legacyBlock = training?.block ?? null;
  if (!legacyBlock) return null;

  if (legacyBlock.createdAt === block.createdAt || legacyBlock.createdAt === block.startDate) {
    return legacyBlock;
  }

  return null;
}

function blockNumberFor(block: MovementBlock, ordered: readonly MovementBlock[]): number | undefined {
  const index = ordered.findIndex((item) => item.id === block.id);
  return index >= 0 ? index + 1 : undefined;
}

function orderedBlocks(blocks: readonly MovementBlock[]): MovementBlock[] {
  return blocks
    .slice()
    .sort((a, b) => (a.startDate || a.createdAt).localeCompare(b.startDate || b.createdAt));
}

function localBlockIdFor(block: MovementBlock): string {
  const explicit = normalizedString(block.id);
  if (explicit) return explicit;
  return `movement-block-${stableHash(JSON.stringify(sanitizeForBackendJson(block)))}`;
}

function mapFocusDomain(domain: MovementDomain | undefined): RemoteMovementBlockFocusDomain {
  if (domain === 'strength_power' || domain === 'balance' || domain === 'mobility') return domain;
  return 'general';
}

function mapBlockStatus(status: MovementBlockStatus | undefined): RemoteMovementBlockStatus {
  if (status === 'completed' || status === 'paused' || status === 'abandoned') return status;
  if (status === 'active') return 'active';
  return 'draft';
}

function finitePositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function validIsoLike(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function normalizedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isBackendJson(value: unknown): value is BackendJson {
  if (value === null) return true;
  if (typeof value === 'boolean' || typeof value === 'string') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isBackendJson);
  if (typeof value === 'object') return Object.values(value).every(isBackendJson);
  return false;
}

function isBackendJsonRecord(value: unknown): value is Record<string, BackendJson> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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
