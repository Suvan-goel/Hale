import type { CheckupType } from '../../adherence';
import {
  checkUpMeasurementMetadataRichness,
  type CheckUp,
} from '../../checkup';
import { HISTORY_SCHEMA_VERSION, deserializeCheckUp, type StoredCheckUp, type StoredCheckUpMetadata } from '../../history';
import { defaultPreferences, type Preferences } from '../../profile';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { getCurrentSession } from './authService';
import { mergeRemoteProfileIntoLocal } from './profileSyncService';
import type { BackendJson, BackendProfile } from './types';

import { BRAND } from '../../brand';

/**
 * Remote-to-local restore, trimmed to the data the app still writes
 * (2026-07-08 old-engine cleanup, founder direction): the local profile and
 * the check-up history. The old engine's blocks, training state, session
 * completions, micro-check results, and block reports no longer restore —
 * the promoted programme engine's state is LOCAL-ONLY by ruling, testers
 * re-onboard (no live migration, recorded), and the app can no longer
 * produce those record kinds. Wire-up into the shell remains a pre-beta
 * task (the "optional backup" promise).
 */
type JsonRecord = Record<string, unknown>;

type RemoteTableName = 'profiles' | 'movement_checkups';

export interface RemoteHaleSnapshot {
  profile: BackendProfile | null;
  movementCheckups: RemoteMovementCheckupRow[];
  fetchErrors: Partial<Record<RemoteTableName, unknown>>;
}

export interface LocalHaleStateForRestore {
  preferences: Preferences;
  history: StoredCheckUp[];
}

export interface RestoreStores {
  profileStore: { save(prefs: Preferences): void };
  historyStore: { save(checkUp: CheckUp, metadata?: StoredCheckUpMetadata): void };
}

export interface RestoredLocalState {
  preferences: Preferences;
  history: StoredCheckUp[];
}

export type RestoreStatus =
  | 'signed_out'
  | 'skipped_local_not_empty'
  | 'remote_empty'
  | 'restored'
  | 'failed'
  | 'timeout';

export interface RestoreResult {
  status: RestoreStatus;
  restoredState?: RestoredLocalState;
  restoredCounts?: {
    profile: number;
    checkups: number;
  };
  skippedReason?: string;
  gaps: string[];
  error?: unknown;
}

export interface RestoreRemoteStateInput {
  local: LocalHaleStateForRestore;
  stores?: RestoreStores;
  snapshot?: RemoteHaleSnapshot;
  timeoutMs?: number;
}

interface RemoteMovementCheckupRow {
  id?: string | null;
  local_checkup_id?: string | null;
  checkup_type?: string | null;
  status?: string | null;
  body_unit?: number | null;
  strength_power_score?: number | null;
  balance_score?: number | null;
  mobility_score?: number | null;
  weakest_domain?: string | null;
  derived_scores_json?: BackendJson | null;
  raw_checkup_json?: BackendJson | null;
  created_locally_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
}

const RESTORE_TIMEOUT_MS = 8000;
const CHECKUP_TYPES: CheckupType[] = [
  'baseline',
  'baseline_retake',
  'manual_extra_v2',
  'official_retest',
  'micro_check',
  'legacy_unknown',
];

export async function restoreRemoteStateIfLocalEmpty(input: RestoreRemoteStateInput): Promise<RestoreResult> {
  if (!isLocalStateEmptyForRestore(input.local)) {
    addBreadcrumb('restore skipped', { status: 'skipped_local_not_empty' });
    return {
      status: 'skipped_local_not_empty',
      skippedReason: `Local ${BRAND.appName} state already has profile or check-up data.`,
      gaps: [],
    };
  }

  try {
    const snapshot =
      input.snapshot ??
      (await withTimeout(fetchRemoteHaleSnapshot(), input.timeoutMs ?? RESTORE_TIMEOUT_MS, `remote ${BRAND.appName} restore`));

    if (!snapshot) {
      return { status: 'signed_out', gaps: [] };
    }

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, input.local);
    const counts = restoredCounts(mapped, input.local);
    const restoredAnything = Object.values(counts).some((count) => count > 0);

    if (!restoredAnything) {
      return {
        status: 'remote_empty',
        restoredCounts: counts,
        gaps: mapped.gaps,
      };
    }

    if (input.stores) {
      persistRestoredLocalState(mapped.state, input.local, input.stores);
    }

    return {
      status: 'restored',
      restoredState: mapped.state,
      restoredCounts: counts,
      gaps: mapped.gaps,
    };
  } catch (error) {
    console.warn('[restore] Remote-to-local restore failed', error);
    addBreadcrumb('restore failed', { status: isTimeoutError(error) ? 'timeout' : 'failed' });
    captureError(error, {
      area: 'restore',
      action: 'remote_to_local_restore',
      timeout: isTimeoutError(error),
    });
    return { status: isTimeoutError(error) ? 'timeout' : 'failed', gaps: [], error };
  }
}

export async function fetchRemoteHaleSnapshot(): Promise<RemoteHaleSnapshot | null> {
  const session = await getCurrentSession();
  const userId = session?.user.id;
  if (!userId) return null;

  const fetchErrors: Partial<Record<RemoteTableName, unknown>> = {};
  const [profile, movementCheckups] = await Promise.all([
    fetchRemoteProfile(userId, fetchErrors),
    fetchRemoteRows<RemoteMovementCheckupRow>(
      'movement_checkups',
      userId,
      fetchErrors,
      (query) => query.order('completed_at', { ascending: true }).order('created_at', { ascending: true })
    ),
  ]);

  return {
    profile,
    movementCheckups,
    fetchErrors,
  };
}

export function isLocalStateEmptyForRestore(local: LocalHaleStateForRestore): boolean {
  return !hasMeaningfulPreferences(local.preferences) && local.history.length === 0;
}

export function mapRemoteHaleSnapshotToLocal(
  snapshot: RemoteHaleSnapshot,
  local: LocalHaleStateForRestore
): { state: RestoredLocalState; gaps: string[] } {
  const preferences = mapRemoteProfileToLocal(snapshot.profile) ?? local.preferences;
  const history = mapRemoteCheckupsToLocal(snapshot.movementCheckups);

  return {
    state: {
      preferences,
      history,
    },
    gaps: [],
  };
}

export function mapRemoteProfileToLocal(profile: BackendProfile | null): Preferences | null {
  if (!profile) return null;
  const mapped = mergeRemoteProfileIntoLocal(profile, defaultPreferences(), { hydrateRoutingFields: true });
  return hasMeaningfulPreferences(mapped) ? mapped : null;
}

export function mapRemoteCheckupsToLocal(rows: readonly RemoteMovementCheckupRow[]): StoredCheckUp[] {
  const recordsByCheckUpId = new Map<string, StoredCheckUp>();

  for (const row of rows) {
    const record = storedCheckUpFromRemoteRow(row);
    if (!record) continue;
    const key = record.checkUp.startedAt;
    const existing = recordsByCheckUpId.get(key);
    recordsByCheckUpId.set(key, existing ? chooseRestoredCheckUp(existing, record) : record);
  }

  const records = Array.from(recordsByCheckUpId.values());
  return records.sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt));
}

function chooseRestoredCheckUp(existing: StoredCheckUp, next: StoredCheckUp): StoredCheckUp {
  const existingV2 = existing.movementProfileV2Snapshot;
  const nextV2 = next.movementProfileV2Snapshot;
  if (!existingV2 && nextV2) return next;
  if (existingV2 && nextV2 && existingV2.snapshotFingerprint !== nextV2.snapshotFingerprint) {
    return existing;
  }
  const existingAssessment = existing.movementProfileV2Assessment;
  const nextAssessment = next.movementProfileV2Assessment;
  if (!existingAssessment && nextAssessment) return next;
  if (
    existingAssessment &&
    nextAssessment &&
    existingAssessment.assessmentId === nextAssessment.assessmentId &&
    existingAssessment.assessmentFingerprint !== nextAssessment.assessmentFingerprint
  ) {
    return existing;
  }
  if (checkUpMeasurementMetadataRichness(next.checkUp) > checkUpMeasurementMetadataRichness(existing.checkUp)) {
    return next;
  }
  return existing;
}

async function fetchRemoteProfile(
  userId: string,
  fetchErrors: Partial<Record<RemoteTableName, unknown>>
): Promise<BackendProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      [
        'id',
        'local_user_id',
        'full_name',
        'birth_year',
        'sex',
        'profile_json',
        'onboarding_json',
        'preferences_json',
        'onboarding_completed_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    fetchErrors.profiles = error;
    console.warn('[restore] Profile fetch failed', error);
    addBreadcrumb('restore table fetch failed', { table: 'profiles' });
    return null;
  }

  return (data as BackendProfile | null) ?? null;
}

async function fetchRemoteRows<T>(
  table: Exclude<RemoteTableName, 'profiles'>,
  userId: string,
  fetchErrors: Partial<Record<RemoteTableName, unknown>>,
  order: (query: RemoteQueryBuilder) => RemoteQueryBuilder
): Promise<T[]> {
  const baseQuery = supabase.from(table).select('*').eq('user_id', userId) as RemoteQueryBuilder;
  const { data, error } = await order(baseQuery);

  if (error) {
    fetchErrors[table] = error;
    console.warn(`[restore] ${table} fetch failed`, error);
    addBreadcrumb('restore table fetch failed', { table });
    return [];
  }

  return Array.isArray(data) ? (data as T[]) : [];
}

interface RemoteQueryBuilder extends PromiseLike<{ data: unknown; error: unknown }> {
  order(column: string, options?: { ascending?: boolean }): RemoteQueryBuilder;
}

function persistRestoredLocalState(
  restored: RestoredLocalState,
  previous: LocalHaleStateForRestore,
  stores: RestoreStores
): void {
  if (hasMeaningfulPreferences(restored.preferences)) {
    safeWrite('profile preferences', () => stores.profileStore.save(restored.preferences));
  }

  if (restored.history.length > previous.history.length) {
    for (const record of restored.history) {
      safeWrite(`check-up ${record.checkUp.startedAt}`, () =>
        stores.historyStore.save(record.checkUp, {
          checkupType: record.checkupType,
          sourceAssessmentId: record.sourceAssessmentId,
          retryOfCheckUpId: record.retryOfCheckUpId,
          scoreSnapshot: record.scoreSnapshot ?? null,
          movementProfileV2Snapshot: record.movementProfileV2Snapshot ?? null,
          movementProfileV2Assessment: record.movementProfileV2Assessment ?? null,
        })
      );
    }
  }
}

function storedCheckUpFromRemoteRow(row: RemoteMovementCheckupRow): StoredCheckUp | null {
  const raw = asRecord(row.raw_checkup_json);
  const checkUp = raw.checkUp;
  if (!checkUp) return null;
  const checkupType = exactCheckupTypeFromRemote(row);
  const scoreSnapshot = scoreSnapshotCandidateFromRemoteRow(row);
  const movementProfileV2Snapshot = movementProfileV2SnapshotCandidateFromRemoteRow(row);
  const movementProfileV2Assessment = movementProfileV2AssessmentCandidateFromRemoteRow(row);

  return deserializeCheckUp(
    JSON.stringify({
      schemaVersion: raw.schemaVersion ?? HISTORY_SCHEMA_VERSION,
      checkupType,
      scoreSnapshot,
      movementProfileV2Snapshot,
      movementProfileV2Assessment,
      checkUp,
    })
  );
}

function scoreSnapshotCandidateFromRemoteRow(row: RemoteMovementCheckupRow): unknown {
  const derived = asRecord(row.derived_scores_json);
  const raw = asRecord(row.raw_checkup_json);
  return derived.scoreSnapshot ?? raw.scoreSnapshot ?? null;
}

function movementProfileV2SnapshotCandidateFromRemoteRow(row: RemoteMovementCheckupRow): unknown {
  const derived = asRecord(row.derived_scores_json);
  const raw = asRecord(row.raw_checkup_json);
  return derived.movementProfileV2Snapshot ?? raw.movementProfileV2Snapshot ?? null;
}

function movementProfileV2AssessmentCandidateFromRemoteRow(row: RemoteMovementCheckupRow): unknown {
  const derived = asRecord(row.derived_scores_json);
  const raw = asRecord(row.raw_checkup_json);
  return derived.movementProfileV2Assessment ?? raw.movementProfileV2Assessment ?? null;
}

function restoredCounts(mapped: { state: RestoredLocalState }, previous: LocalHaleStateForRestore): NonNullable<RestoreResult['restoredCounts']> {
  return {
    profile: hasMeaningfulPreferences(mapped.state.preferences) && !hasMeaningfulPreferences(previous.preferences) ? 1 : 0,
    checkups: mapped.state.history.length,
  };
}

function hasMeaningfulPreferences(prefs: Preferences): boolean {
  const defaults = defaultPreferences();
  return (
    hasText(prefs.profile.name) ||
    prefs.profile.dateOfBirth !== null ||
    prefs.profile.exactAge !== null ||
    prefs.profile.referenceSex !== null ||
    prefs.profile.age !== null ||
    prefs.profile.ageBand !== null ||
    hasText(prefs.profile.goal) ||
    prefs.profile.lifeGoal !== null ||
    JSON.stringify(prefs.settings) !== JSON.stringify(defaults.settings) ||
    prefs.onboarding.currentStep !== 'welcome' ||
    prefs.onboarding.baselineResultId !== null ||
    prefs.onboarding.completedAt !== null ||
    prefs.onboarding.updatedAt !== null
  );
}

function exactCheckupTypeFromRemote(row: RemoteMovementCheckupRow): CheckupType {
  const derived = asRecord(row.derived_scores_json);
  const raw = asRecord(row.raw_checkup_json);
  return (
    validCheckupType(derived.exactCheckupType) ??
    validCheckupType(derived.checkupType) ??
    validCheckupType(raw.checkupType) ??
    mapRemoteCheckupType(row.checkup_type)
  );
}

function mapRemoteCheckupType(value: unknown): CheckupType {
  if (value === 'baseline' || value === 'official_retest') return value;
  // The wire format still says manual_extra; locally that is the V2 practice check-up.
  if (value === 'manual_extra') return 'manual_extra_v2';
  return 'legacy_unknown';
}

function validCheckupType(value: unknown): CheckupType | null {
  return typeof value === 'string' && CHECKUP_TYPES.includes(value as CheckupType) ? (value as CheckupType) : null;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function safeWrite(label: string, write: () => void): void {
  try {
    write();
  } catch (error) {
    console.warn(`[restore] Failed to persist restored ${label}`, error);
    captureError(error, {
      area: 'restore',
      action: 'persist_restored_local_state',
      label,
    });
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && /timed out/i.test(error.message);
}
