import { supabase } from '../../lib/supabase';
import {
  TRAINING_SCHEMA_VERSION,
  type PersistedGeneratedExerciseSummary,
  type PersistedGeneratedSessionSummary,
  type PersistedPostSessionFeedback,
  type ProgressionState,
  type TrainingState,
} from '../../training';

import { getCurrentSession } from './authService';
import type { BackendJson } from './types';
import { addBreadcrumb } from '../observability/sentry';

type TrainingStateSyncStatus = 'signed_out' | 'synced' | 'failed' | 'skipped';

export interface TrainingStateSyncInput {
  training: TrainingState;
  updatedAt?: string;
}

export interface TrainingStateSyncResult {
  status: TrainingStateSyncStatus;
  error?: unknown;
}

interface TrainingStateRemotePayload {
  user_id: string;
  state_json: BackendJson;
  updated_at: string;
}

const RECENT_GENERATED_SESSION_LIMIT = 20;
const VELOCITY_HISTORY_LIMIT = 20;
const inFlightSyncs = new Set<string>();
const successfulFingerprints = new Map<string, string>();

export async function syncTrainingStateToRemote(
  input: TrainingStateSyncInput
): Promise<TrainingStateSyncResult> {
  try {
    const session = await getCurrentSession();
    const userId = session?.user.id;
    if (!userId) return { status: 'signed_out' };

    if (inFlightSyncs.has(userId)) {
      return { status: 'skipped' };
    }

    inFlightSyncs.add(userId);

    try {
      const payload = mapLocalTrainingStateToRemotePayload(input, userId);
      const fingerprint = JSON.stringify(payload);

      if (successfulFingerprints.get(userId) === fingerprint) {
        return { status: 'skipped' };
      }

      if (__DEV__) {
        console.log('[training-state-sync] started');
      }
      addBreadcrumb('sync category started', { category: 'training_state' });

      const { error } = await supabase
        .from('training_state')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      successfulFingerprints.set(userId, fingerprint);

      if (__DEV__) {
        console.log('[training-state-sync] synced');
      }
      addBreadcrumb('sync category succeeded', { category: 'training_state' });

      return { status: 'synced' };
    } finally {
      inFlightSyncs.delete(userId);
    }
  } catch (error) {
    console.warn('[training-state-sync] Supabase training state sync failed', error);
    addBreadcrumb('sync category failed', { category: 'training_state' });
    return { status: 'failed', error };
  }
}

export async function syncCurrentTrainingStateToRemote(
  training: TrainingState,
  options: { updatedAt?: string } = {}
): Promise<TrainingStateSyncResult> {
  return syncTrainingStateToRemote({ training, updatedAt: options.updatedAt });
}

export function mapLocalTrainingStateToRemotePayload(
  input: TrainingStateSyncInput,
  userId: string,
  options: { syncedAt?: string } = {}
): TrainingStateRemotePayload {
  const updatedAt = validIsoLike(input.updatedAt) ?? validIsoLike(options.syncedAt) ?? new Date().toISOString();

  return {
    user_id: userId,
    state_json: toBackendJson({
      snapshotSchemaVersion: 1,
      trainingSchemaVersion: TRAINING_SCHEMA_VERSION,
      capturedAt: updatedAt,
      activeLegacyTrainingBlock: input.training.block,
      progress: input.training.progress,
      progression: compactProgression(input.training.progression),
      equipment: input.training.equipment,
      planPreferences: input.training.planPreferences,
      ladderProgressById: input.training.ladderProgressById,
      appliedProgressionEventIds: input.training.appliedProgressionEventIds,
      generatedSessionContext: {
        totalPersisted: input.training.generatedSessionSummaries.length,
        recentSummaries: input.training.generatedSessionSummaries
          .slice(-RECENT_GENERATED_SESSION_LIMIT)
          .map(sanitizeGeneratedSessionSummary),
      },
      lastPostSessionFeedback: sanitizePostSessionFeedback(input.training.lastPostSessionFeedback),
    }),
    updated_at: updatedAt,
  };
}

function compactProgression(progression: ProgressionState): BackendJson {
  const velHistory: Record<string, number[]> = {};
  for (const [exerciseId, values] of Object.entries(progression.velHistory ?? {})) {
    velHistory[exerciseId] = Array.isArray(values)
      ? values.filter((value) => typeof value === 'number' && Number.isFinite(value)).slice(-VELOCITY_HISTORY_LIMIT)
      : [];
  }

  return sanitizeForBackendJson({
    levels: progression.levels,
    velHistory,
  });
}

function sanitizeGeneratedSessionSummary(summary: PersistedGeneratedSessionSummary): BackendJson {
  return sanitizeForBackendJson({
    id: summary.id,
    blockId: summary.blockId,
    source: summary.source,
    templateId: summary.templateId,
    plannedDateKey: summary.plannedDateKey,
    sessionType: summary.sessionType,
    completionSource: summary.completionSource,
    status: summary.status,
    mainPlanCredit: summary.mainPlanCredit,
    scheduleCredit: summary.scheduleCredit,
    workEvidence: summary.workEvidence,
    focusStimulusEvidence: summary.focusStimulusEvidence,
    title: summary.title,
    focus: summary.focus,
    generatedAt: summary.generatedAt,
    completedAt: summary.completedAt,
    exerciseIds: summary.exerciseIds,
    ladderIds: summary.ladderIds,
    readiness: summary.readiness,
    painArea: summary.painArea,
    dailyContext: summary.dailyContext,
    progressionEvidencePolicy: summary.progressionEvidencePolicy,
    adjustmentReasons: summary.adjustmentReasons,
    durationMinutes: summary.durationMinutes,
    equipmentSnapshot: summary.equipmentSnapshot,
    movementCapabilitySnapshot: summary.movementCapabilitySnapshot,
    exercises: summary.exercises?.map(sanitizeGeneratedExerciseSummary),
    feedback: sanitizePostSessionFeedback(summary.feedback),
  });
}

function sanitizeGeneratedExerciseSummary(summary: PersistedGeneratedExerciseSummary): BackendJson {
  return sanitizeForBackendJson({
    exerciseId: summary.exerciseId,
    ladderId: summary.ladderId,
    levelId: summary.levelId,
    slotType: summary.slotType,
    sets: summary.sets,
    repsPerSet: summary.repsPerSet,
    secondsPerSet: summary.secondsPerSet,
    measurementTier: summary.measurementTier,
    intendedDomain: summary.intendedDomain,
    stimulusRole: summary.stimulusRole,
    stimulusReason: summary.stimulusReason,
    requestedLevelId: summary.requestedLevelId,
    selectedDailyLevelId: summary.selectedDailyLevelId,
    doseBeforeAdjustment: summary.doseBeforeAdjustment,
    adjustmentReasons: summary.adjustmentReasons,
  });
}

function sanitizePostSessionFeedback(feedback: PersistedPostSessionFeedback | null | undefined): BackendJson {
  if (!feedback) return null;
  return sanitizeForBackendJson({
    sessionId: feedback.sessionId,
    rpe: feedback.rpe,
    discomfort: feedback.discomfort,
    painArea: feedback.painArea,
    completed: feedback.completed,
    trackingQuality: feedback.trackingQuality,
    submittedAt: feedback.submittedAt,
  });
}

function validIsoLike(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
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
  return /(frame|frames|landmark|landmarks|video|image|base64|uri|path)/i.test(key);
}

function toBackendJson(value: unknown): BackendJson {
  return sanitizeForBackendJson(value);
}
