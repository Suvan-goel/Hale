import type { MovementBlock, TrainingSessionCompletion, TrainingSessionCompletionType } from '../../adherence';
import type { HaleSessionPlan } from '../../haleFlow';
import type {
  PainArea,
  PersistedGeneratedSessionSummary,
  TrackingQuality,
  TrainingSessionResult,
} from '../../training';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb } from '../observability/sentry';

import { getCurrentSession } from './authService';
import type { BackendJson } from './types';

type RemoteTrainingSessionStatus = 'completed' | 'started' | 'abandoned' | 'skipped';
type SessionSyncStatus = 'signed_out' | 'synced' | 'failed' | 'skipped';

type SyncableTrainingSessionType = Extract<TrainingSessionCompletionType, 'starter' | 'standard' | 'restart'>;

type CompletionWithFeedback = TrainingSessionCompletion & {
  completed?: boolean;
  painArea?: PainArea;
  trackingQuality?: TrackingQuality;
};

export interface TrainingSessionCompletionSyncInput {
  completion: TrainingSessionCompletion;
  sessionPlan?: HaleSessionPlan | null;
  sessionResult?: TrainingSessionResult | null;
  generatedSummary?: PersistedGeneratedSessionSummary | null;
  movementBlock?: MovementBlock | null;
  sessionIndex?: number;
  movementBlockRemoteId?: string | null;
}

export interface TrainingSessionCompletionSyncResult {
  status: SessionSyncStatus;
  localSessionId?: string;
  error?: unknown;
}

interface TrainingSessionCompletionRemotePayload {
  user_id: string;
  movement_block_id?: string | null;
  local_session_id: string;
  session_index?: number;
  status: RemoteTrainingSessionStatus;
  duration_seconds?: number;
  perceived_effort?: number | null;
  pain_flag?: boolean | null;
  tracking_quality?: string | null;
  summary_json?: BackendJson;
  raw_result_json?: BackendJson;
  completed_at: string;
}

interface MovementBlockResolution {
  movementBlockId?: string | null;
  lookupFailed: boolean;
}

interface ExistingSessionJsonResolution {
  summaryJson?: BackendJson;
  rawResultJson?: BackendJson;
  lookupFailed: boolean;
}

const inFlightSyncs = new Set<string>();
const successfulFingerprints = new Map<string, string>();
const SYNCABLE_SESSION_TYPES: readonly SyncableTrainingSessionType[] = [
  'standard',
  'starter',
  'restart',
];

export async function syncTrainingSessionCompletionToRemote(
  input: TrainingSessionCompletionSyncInput
): Promise<TrainingSessionCompletionSyncResult> {
  if (!isSyncableSessionCompletion(input.completion)) {
    return { status: 'skipped', localSessionId: localSessionIdFor(input.completion) };
  }

  const localSessionId = localSessionIdFor(input.completion);

  try {
    const session = await getCurrentSession();
    const userId = session?.user.id;
    if (!userId) return { status: 'signed_out', localSessionId };

    const syncKey = `${userId}:${localSessionId}`;
    if (inFlightSyncs.has(syncKey)) {
      return { status: 'skipped', localSessionId };
    }

    inFlightSyncs.add(syncKey);

    try {
      const blockResolution = await resolveMovementBlockId(input, userId);
      const hasFreshRawResult = !!input.sessionResult;
      const existingJsonResolution =
        hasFreshRawResult ? { lookupFailed: false } : await loadExistingSessionJson(userId, localSessionId);
      const payload = mapLocalSessionCompletionToRemotePayload(input, userId, {
        movementBlockId: blockResolution.movementBlockId,
        omitMovementBlockId: blockResolution.lookupFailed,
        existingSummaryJson: existingJsonResolution.summaryJson,
        existingRawResultJson: existingJsonResolution.rawResultJson,
        omitJsonPayloads: existingJsonResolution.lookupFailed && !hasFreshRawResult,
      });
      const fingerprint = JSON.stringify(payload);

      if (successfulFingerprints.get(syncKey) === fingerprint) {
        return { status: 'skipped', localSessionId };
      }

      if (__DEV__) {
        console.log(
          `[session-sync] started local_session_id=${localSessionId} status=${payload.status}`
        );
      }
      addBreadcrumb('sync category started', {
        category: 'session_completions',
        localSessionId,
        status: payload.status,
      });

      const { error } = await supabase
        .from('training_session_completions')
        .upsert(payload, { onConflict: 'user_id,local_session_id' });

      if (error) throw error;

      successfulFingerprints.set(syncKey, fingerprint);

      if (__DEV__) {
        console.log(
          `[session-sync] synced local_session_id=${localSessionId} status=${payload.status}`
        );
      }
      addBreadcrumb('sync category succeeded', {
        category: 'session_completions',
        localSessionId,
        status: payload.status,
      });

      return { status: 'synced', localSessionId };
    } finally {
      inFlightSyncs.delete(syncKey);
    }
  } catch (error) {
    console.warn(`[session-sync] Supabase session completion sync failed for ${localSessionId}`, error);
    addBreadcrumb('sync category failed', {
      category: 'session_completions',
      localSessionId,
    });
    return { status: 'failed', localSessionId, error };
  }
}

export async function syncRecentTrainingSessionCompletionsToRemote(
  completions: readonly TrainingSessionCompletion[],
  options: {
    blocks?: readonly MovementBlock[];
    generatedSummaries?: readonly PersistedGeneratedSessionSummary[];
    limit?: number;
  } = {}
): Promise<TrainingSessionCompletionSyncResult[]> {
  const syncable = completions
    .filter(isSyncableSessionCompletion)
    .slice()
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const recent = syncable.slice(-(options.limit ?? 20));
  const results: TrainingSessionCompletionSyncResult[] = [];

  for (const completion of recent) {
    results.push(
      await syncTrainingSessionCompletionToRemote({
        completion,
        movementBlock: options.blocks?.find((block) => block.id === completion.blockId) ?? null,
        generatedSummary: generatedSummaryForCompletion(completion, options.generatedSummaries),
        sessionIndex: sessionIndexForCompletion(completion, syncable),
      })
    );
  }

  return results;
}

export function mapLocalSessionCompletionToRemotePayload(
  input: TrainingSessionCompletionSyncInput,
  userId: string,
  options: {
    movementBlockId?: string | null;
    omitMovementBlockId?: boolean;
    existingSummaryJson?: BackendJson;
    existingRawResultJson?: BackendJson;
    omitJsonPayloads?: boolean;
  } = {}
): TrainingSessionCompletionRemotePayload {
  const completion = input.completion as CompletionWithFeedback;
  const localSessionId = localSessionIdFor(input.completion);
  const rawResultJson = input.sessionResult ? toBackendJson(sanitizeTrainingSessionResult(input.sessionResult)) : undefined;
  const summaryJson = toBackendJson({
    ...jsonRecord(options.existingSummaryJson),
    schemaVersion: 1,
    completion: sanitizeCompletion(input.completion),
    sessionPlan: sanitizeSessionPlan(input.sessionPlan),
    movementBlock: sanitizeMovementBlock(input.movementBlock),
    generatedSummary: input.generatedSummary ?? jsonRecord(options.existingSummaryJson).generatedSummary ?? null,
  });

  return omitUndefined({
    user_id: userId,
    movement_block_id: options.omitMovementBlockId ? undefined : options.movementBlockId ?? null,
    local_session_id: localSessionId,
    session_index: finitePositiveInteger(input.sessionIndex) ?? sessionIndexFromPlannedDate(input.completion.plannedDate),
    status: mapCompletionStatus(completion),
    duration_seconds: durationSeconds(input.completion, input.sessionResult),
    perceived_effort: completion.perceivedEffort ?? null,
    pain_flag: completion.painReported ?? null,
    tracking_quality: completion.trackingQuality ?? null,
    summary_json: options.omitJsonPayloads ? undefined : summaryJson,
    raw_result_json: options.omitJsonPayloads
      ? undefined
      : rawResultJson ?? options.existingRawResultJson,
    completed_at: input.completion.completedAt,
  });
}

async function resolveMovementBlockId(
  input: TrainingSessionCompletionSyncInput,
  userId: string
): Promise<MovementBlockResolution> {
  if (input.movementBlockRemoteId) {
    return { movementBlockId: input.movementBlockRemoteId, lookupFailed: false };
  }

  const localBlockId = normalizedString(input.completion.blockId ?? input.movementBlock?.id);
  if (!localBlockId) return { movementBlockId: null, lookupFailed: false };

  const { data, error } = await supabase
    .from('movement_blocks')
    .select('id')
    .eq('user_id', userId)
    .eq('local_block_id', localBlockId)
    .maybeSingle();

  if (error) {
    console.warn(`[session-sync] movement block lookup failed for local_block_id=${localBlockId}`, error);
    return { lookupFailed: true };
  }

  const movementBlockId = typeof data?.id === 'string' && data.id.trim().length > 0 ? data.id : null;
  return { movementBlockId, lookupFailed: false };
}

async function loadExistingSessionJson(
  userId: string,
  localSessionId: string
): Promise<ExistingSessionJsonResolution> {
  const { data, error } = await supabase
    .from('training_session_completions')
    .select('summary_json, raw_result_json')
    .eq('user_id', userId)
    .eq('local_session_id', localSessionId)
    .maybeSingle();

  if (error) {
    console.warn(`[session-sync] existing session JSON lookup failed for local_session_id=${localSessionId}`, error);
    return { lookupFailed: true };
  }

  return {
    summaryJson: isBackendJson(data?.summary_json) ? data.summary_json : undefined,
    rawResultJson: isBackendJson(data?.raw_result_json) ? data.raw_result_json : undefined,
    lookupFailed: false,
  };
}

function isSyncableSessionCompletion(
  completion: TrainingSessionCompletion
): completion is TrainingSessionCompletion & { sessionType: SyncableTrainingSessionType } {
  return (
    completion.mainPlanCredit === true &&
    SYNCABLE_SESSION_TYPES.includes(completion.sessionType as SyncableTrainingSessionType)
  );
}

function localSessionIdFor(completion: TrainingSessionCompletion): string {
  const explicit = normalizedString(completion.id);
  if (explicit) return explicit;
  return `session-${stableHash(JSON.stringify(sanitizeCompletion(completion)))}`;
}

function mapCompletionStatus(completion: CompletionWithFeedback): RemoteTrainingSessionStatus {
  if (completion.completed === false) return 'abandoned';
  return 'completed';
}

function durationSeconds(
  completion: TrainingSessionCompletion,
  sessionResult: TrainingSessionResult | null | undefined
): number | undefined {
  if (typeof completion.durationMinutes === 'number' && Number.isFinite(completion.durationMinutes)) {
    return Math.max(0, Math.round(completion.durationMinutes * 60));
  }

  if (!sessionResult?.startedAt) return undefined;
  const started = Date.parse(sessionResult.startedAt);
  const completed = Date.parse(completion.completedAt);
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) return undefined;
  return Math.round((completed - started) / 1000);
}

function sessionIndexForCompletion(
  completion: TrainingSessionCompletion,
  orderedCompletions: readonly TrainingSessionCompletion[]
): number | undefined {
  const explicit = sessionIndexFromPlannedDate(completion.plannedDate);
  if (explicit) return explicit;

  const blockCompletions = orderedCompletions.filter((item) => item.blockId === completion.blockId);
  const index = blockCompletions.findIndex((item) => localSessionIdFor(item) === localSessionIdFor(completion));
  return index >= 0 ? index + 1 : undefined;
}

function sessionIndexFromPlannedDate(plannedDate: string | undefined): number | undefined {
  const match = plannedDate?.match(/^session-(\d+)$/);
  if (!match) return undefined;
  return finitePositiveInteger(Number(match[1]));
}

function generatedSummaryForCompletion(
  completion: TrainingSessionCompletion,
  summaries: readonly PersistedGeneratedSessionSummary[] | undefined
): PersistedGeneratedSessionSummary | null {
  if (!summaries) return null;
  return (
    summaries.find((summary) => summary.blockId === completion.blockId && summary.completedAt === completion.completedAt) ??
    null
  );
}

function sanitizeCompletion(completion: TrainingSessionCompletion): BackendJson {
  return sanitizeForBackendJson({
    id: completion.id,
    blockId: completion.blockId,
    plannedDate: completion.plannedDate,
    completedAt: completion.completedAt,
    sessionType: completion.sessionType,
    focusDomain: completion.focusDomain,
    source: completion.source,
    templateId: completion.templateId,
    mainPlanCredit: completion.mainPlanCredit,
    workEvidence: completion.workEvidence,
    focusStimulusEvidence: completion.focusStimulusEvidence,
    durationMinutes: completion.durationMinutes,
    perceivedEffort: completion.perceivedEffort,
    painReported: completion.painReported,
    notes: completion.notes,
    completed: (completion as CompletionWithFeedback).completed,
    painArea: (completion as CompletionWithFeedback).painArea,
    trackingQuality: (completion as CompletionWithFeedback).trackingQuality,
  });
}

function sanitizeSessionPlan(plan: HaleSessionPlan | null | undefined): BackendJson {
  if (!plan) return null;
  return sanitizeForBackendJson({
    id: plan.id,
    blockId: plan.blockId,
    title: plan.title,
    sessionType: plan.sessionType,
    estimatedMinutes: plan.estimatedMinutes,
    focusDomain: plan.focusDomain,
    exerciseIds: plan.exercises.map((exercise) => exercise.id),
    exercises: plan.exercises.map((exercise) => ({
      id: exercise.id,
      ladderId: exercise.ladderId,
      family: exercise.family,
      domain: exercise.domain,
      level: exercise.level,
      measurementTier: exercise.measurementTier,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      durationSeconds: exercise.durationSeconds,
    })),
    metadata: plan.metadata,
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
    totalPlannedSessions: block.totalPlannedSessions,
    completedSessions: block.completedSessions,
    microChecksCompleted: block.microChecksCompleted,
  });
}

function sanitizeTrainingSessionResult(result: TrainingSessionResult): BackendJson {
  return sanitizeForBackendJson({
    schemaVersion: 1,
    startedAt: result.startedAt,
    items: result.items.map((item) => ({
      exerciseId: item.exerciseId,
      status: item.status,
      sets: item.sets,
    })),
  });
}

function finitePositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
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
