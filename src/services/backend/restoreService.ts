import {
  LOCAL_USER_ID,
  defaultAdherenceStoreState,
  type AdherenceStoreState,
  type CheckupStatus,
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type MovementBlockReport,
  type TrainingSessionCompletion,
} from '../../adherence';
import type { CheckUp } from '../../checkup';
import { createMovementAssessment, checkupStatusFromHeadlineEvidence, headlineEvidenceFromScore } from '../../haleFlow';
import { HISTORY_SCHEMA_VERSION, deserializeCheckUp, type StoredCheckUp, type StoredCheckUpMetadata } from '../../history';
import {
  TRAINING_SCHEMA_VERSION,
  defaultTrainingState,
  deserializeMicroCheck,
  deserializeTrainingState,
  type MicroCheckResult,
  type TrainingState,
} from '../../training';
import { deserializeAdherenceState } from '../../adherence/serialize';
import { defaultPreferences, type Preferences } from '../../profile';
import {
  parseStoredScoreSnapshot,
  type CheckUpScore,
} from '../../scoring';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { getCurrentSession } from './authService';
import { mergeRemoteProfileIntoLocal } from './profileSyncService';
import type { BackendJson, BackendProfile } from './types';

type JsonRecord = Record<string, unknown>;

type RemoteTableName =
  | 'profiles'
  | 'movement_checkups'
  | 'movement_blocks'
  | 'training_state'
  | 'training_session_completions'
  | 'micro_checks'
  | 'movement_block_reports';

export interface RemoteHaleSnapshot {
  profile: BackendProfile | null;
  movementCheckups: RemoteMovementCheckupRow[];
  movementBlocks: RemoteMovementBlockRow[];
  trainingState: RemoteTrainingStateRow | null;
  trainingSessionCompletions: RemoteTrainingSessionCompletionRow[];
  microChecks: RemoteMicroCheckRow[];
  movementBlockReports: RemoteMovementBlockReportRow[];
  fetchErrors: Partial<Record<RemoteTableName, unknown>>;
}

export interface LocalHaleStateForRestore {
  preferences: Preferences;
  history: StoredCheckUp[];
  training: TrainingState;
  microChecks: MicroCheckResult[];
  adherence: AdherenceStoreState;
}

export interface RestoreStores {
  profileStore: { save(prefs: Preferences): void };
  historyStore: { save(checkUp: CheckUp, metadata?: StoredCheckUpMetadata): void };
  trainingStore: {
    saveState(state: TrainingState): void;
    saveMicroCheck(result: MicroCheckResult): void;
  };
  adherenceStore: { save(state: AdherenceStoreState): void };
}

export interface RestoredLocalState {
  preferences: Preferences;
  history: StoredCheckUp[];
  training: TrainingState;
  microChecks: MicroCheckResult[];
  adherence: AdherenceStoreState;
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
    movementBlocks: number;
    assessments: number;
    trainingState: number;
    sessionCompletions: number;
    microChecks: number;
    blockReports: number;
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

interface RemoteMovementBlockRow {
  id?: string | null;
  local_block_id?: string | null;
  source_checkup_id?: string | null;
  block_number?: number | null;
  focus_domain?: string | null;
  status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  block_json?: BackendJson | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface RemoteTrainingStateRow {
  user_id?: string | null;
  state_json?: BackendJson | null;
  updated_at?: string | null;
}

interface RemoteTrainingSessionCompletionRow {
  id?: string | null;
  movement_block_id?: string | null;
  local_session_id?: string | null;
  status?: string | null;
  summary_json?: BackendJson | null;
  raw_result_json?: BackendJson | null;
  completed_at?: string | null;
  created_at?: string | null;
}

interface RemoteMicroCheckRow {
  id?: string | null;
  movement_block_id?: string | null;
  local_micro_check_id?: string | null;
  domain?: string | null;
  result_json?: BackendJson | null;
  completed_at?: string | null;
  created_at?: string | null;
}

interface RemoteMovementBlockReportRow {
  id?: string | null;
  movement_block_id?: string | null;
  local_report_id?: string | null;
  report_json?: BackendJson | null;
  created_at?: string | null;
}

const RESTORE_TIMEOUT_MS = 8000;
const CHECKUP_TYPES: CheckupType[] = [
  'baseline',
  'baseline_retake',
  'manual_extra',
  'official_retest',
  'quick_recheck',
  'micro_check',
  'legacy_unknown',
];
const CHECKUP_STATUSES: CheckupStatus[] = ['not_started', 'in_progress', 'completed', 'incomplete', 'invalid', 'cancelled'];

export async function restoreRemoteStateIfLocalEmpty(input: RestoreRemoteStateInput): Promise<RestoreResult> {
  if (!isLocalStateEmptyForRestore(input.local)) {
    addBreadcrumb('restore skipped', { status: 'skipped_local_not_empty' });
    return {
      status: 'skipped_local_not_empty',
      skippedReason: 'Local Hale state already has profile, check-up, block, training, or progress data.',
      gaps: [],
    };
  }

  try {
    const snapshot =
      input.snapshot ??
      (await withTimeout(fetchRemoteHaleSnapshot(), input.timeoutMs ?? RESTORE_TIMEOUT_MS, 'remote Hale restore'));

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
      await persistRestoredLocalState(mapped.state, input.local, input.stores);
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
  const [profile, movementCheckups, movementBlocks, trainingState, sessionCompletions, microChecks, reports] =
    await Promise.all([
      fetchRemoteProfile(userId, fetchErrors),
      fetchRemoteRows<RemoteMovementCheckupRow>(
        'movement_checkups',
        userId,
        fetchErrors,
        (query) => query.order('completed_at', { ascending: true }).order('created_at', { ascending: true })
      ),
      fetchRemoteRows<RemoteMovementBlockRow>(
        'movement_blocks',
        userId,
        fetchErrors,
        (query) => query.order('started_at', { ascending: true }).order('created_at', { ascending: true })
      ),
      fetchRemoteTrainingState(userId, fetchErrors),
      fetchRemoteRows<RemoteTrainingSessionCompletionRow>(
        'training_session_completions',
        userId,
        fetchErrors,
        (query) => query.order('completed_at', { ascending: true }).order('created_at', { ascending: true })
      ),
      fetchRemoteRows<RemoteMicroCheckRow>(
        'micro_checks',
        userId,
        fetchErrors,
        (query) => query.order('completed_at', { ascending: true }).order('created_at', { ascending: true })
      ),
      fetchRemoteRows<RemoteMovementBlockReportRow>(
        'movement_block_reports',
        userId,
        fetchErrors,
        (query) => query.order('created_at', { ascending: true })
      ),
    ]);

  return {
    profile,
    movementCheckups,
    movementBlocks,
    trainingState,
    trainingSessionCompletions: sessionCompletions,
    microChecks,
    movementBlockReports: reports,
    fetchErrors,
  };
}

export function isLocalStateEmptyForRestore(local: LocalHaleStateForRestore): boolean {
  return (
    !hasMeaningfulPreferences(local.preferences) &&
    local.history.length === 0 &&
    !isTrainingStateMeaningfulForRestore(local.training) &&
    local.microChecks.length === 0 &&
    !hasMeaningfulAdherenceState(local.adherence)
  );
}

export function mapRemoteHaleSnapshotToLocal(
  snapshot: RemoteHaleSnapshot,
  local: LocalHaleStateForRestore
): { state: RestoredLocalState; gaps: string[] } {
  const gaps: string[] = [];
  const preferences = mapRemoteProfileToLocal(snapshot.profile) ?? local.preferences;
  const history = mapRemoteCheckupsToLocal(snapshot.movementCheckups);
  const assessments = mapRemoteAssessmentsToLocal(snapshot.movementCheckups, history);
  const movementBlocks = mapRemoteMovementBlocksToLocal(snapshot.movementBlocks);
  const training = mapRemoteTrainingStateToLocal(snapshot.trainingState) ?? local.training;
  const completions = mapRemoteSessionCompletionsToLocal(snapshot.trainingSessionCompletions, gaps);
  const microChecks = mapRemoteMicroChecksToLocal(snapshot.microChecks);
  const reports = mapRemoteBlockReportsToLocal(snapshot.movementBlockReports);

  if (snapshot.trainingSessionCompletions.some((row) => row.raw_result_json)) {
    gaps.push('Session raw_result_json has no current local file-backed store, so only completion summaries are restored.');
  }
  if (snapshot.trainingState?.state_json) {
    gaps.push(
      'Training state restore uses the compact training_state snapshot; older snapshots may only include recent generated sessions.'
    );
  }

  return {
    state: {
      preferences,
      history,
      training,
      microChecks,
      adherence: {
        ...defaultAdherenceStoreState(),
        assessments,
        blocks: movementBlocks,
        completions,
        reports,
      },
    },
    gaps: uniqueStrings(gaps),
  };
}

export function mapRemoteProfileToLocal(profile: BackendProfile | null): Preferences | null {
  if (!profile) return null;
  const mapped = mergeRemoteProfileIntoLocal(profile, defaultPreferences(), { hydrateRoutingFields: true });
  return hasMeaningfulPreferences(mapped) ? mapped : null;
}

export function mapRemoteCheckupsToLocal(rows: readonly RemoteMovementCheckupRow[]): StoredCheckUp[] {
  const records: StoredCheckUp[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const record = storedCheckUpFromRemoteRow(row);
    if (!record) continue;
    const key = record.checkUp.startedAt;
    if (seen.has(key)) continue;
    seen.add(key);
    records.push(record);
  }

  return records.sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt));
}

export function mapRemoteMovementBlocksToLocal(rows: readonly RemoteMovementBlockRow[]): MovementBlock[] {
  const blocks: MovementBlock[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const block = validMovementBlock(asRecord(row.block_json)?.movementBlock);
    if (!block || seen.has(block.id)) continue;
    seen.add(block.id);
    blocks.push(block);
  }

  return blocks.sort((a, b) => (a.startDate || a.createdAt).localeCompare(b.startDate || b.createdAt));
}

export function mapRemoteTrainingStateToLocal(row: RemoteTrainingStateRow | null): TrainingState | null {
  const stateJson = asRecord(row?.state_json);
  if (Object.keys(stateJson).length === 0) return null;

  const generatedSessionContext = asRecord(stateJson.generatedSessionContext);
  const recentSummaries = Array.isArray(generatedSessionContext.recentSummaries)
    ? generatedSessionContext.recentSummaries
    : [];

  const candidate = {
    block: stateJson.block ?? stateJson.activeLegacyTrainingBlock ?? null,
    progression: stateJson.progression,
    equipment: stateJson.equipment,
    progress: stateJson.progress,
    ladderProgressById: stateJson.ladderProgressById,
    generatedSessionSummaries: stateJson.generatedSessionSummaries ?? recentSummaries,
    lastPostSessionFeedback: stateJson.lastPostSessionFeedback ?? null,
    planPreferences: stateJson.planPreferences,
  };

  const restored = deserializeTrainingState(
    JSON.stringify({
      schemaVersion: TRAINING_SCHEMA_VERSION,
      payload: candidate,
    })
  );

  return restored && isTrainingStateMeaningfulForRestore(restored) ? restored : null;
}

export function mapRemoteSessionCompletionsToLocal(
  rows: readonly RemoteTrainingSessionCompletionRow[],
  gaps: string[] = []
): TrainingSessionCompletion[] {
  const completions: TrainingSessionCompletion[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const summary = asRecord(row.summary_json);
    const completion = validTrainingSessionCompletion(summary.completion);
    if (!completion) {
      if (row.raw_result_json) {
        gaps.push('A session row had raw_result_json but no restorable summary_json.completion.');
      }
      continue;
    }
    if (seen.has(completion.id)) continue;
    seen.add(completion.id);
    completions.push(completion);
  }

  return completions.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

export function mapRemoteMicroChecksToLocal(rows: readonly RemoteMicroCheckRow[]): MicroCheckResult[] {
  const results: MicroCheckResult[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const result = microCheckFromRemoteRow(row);
    if (!result) continue;
    const key = `${result.type}:${result.startedAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(result);
  }

  return results.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export function mapRemoteBlockReportsToLocal(rows: readonly RemoteMovementBlockReportRow[]): MovementBlockReport[] {
  const reports: MovementBlockReport[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const report = validMovementBlockReport(normalizeRestoredBlockReport(asRecord(row.report_json)?.report));
    if (!report || seen.has(report.id)) continue;
    seen.add(report.id);
    reports.push(report);
  }

  return reports.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function normalizeRestoredBlockReport(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const report = value as Partial<MovementBlockReport>;
  if (report.comparison) return value;
  return {
    ...report,
    comparison: {
      status: 'legacy_unversioned',
    },
  };
}

function mapRemoteAssessmentsToLocal(
  rows: readonly RemoteMovementCheckupRow[],
  restoredHistory: readonly StoredCheckUp[]
): MovementAssessment[] {
  const checkupsById = new Map(restoredHistory.map((record) => [record.checkUp.startedAt, record]));
  const assessments: MovementAssessment[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const localCheckupId = normalizedString(row.local_checkup_id) ?? normalizedString(row.created_locally_at);
    if (!localCheckupId) continue;
    const record = checkupsById.get(localCheckupId);
    if (!record) continue;
    const checkUp = record.checkUp;
    const derivedAssessment = asRecord(asRecord(row.derived_scores_json).assessment);
    const derived = asRecord(row.derived_scores_json);
    const raw = asRecord(row.raw_checkup_json);
    const type = validCheckupType(derivedAssessment.type) ?? exactCheckupTypeFromRemote(row, derived, raw);
    const completedAt = normalizedString(derivedAssessment.completedAt) ?? normalizedString(row.completed_at) ?? checkUp.startedAt;
    const parsedSnapshot = parseStoredScoreSnapshot(record.scoreSnapshot);
    const score = parsedSnapshot.ok ? parsedSnapshot.score : null;
    const scoreSnapshot = parsedSnapshot.ok ? parsedSnapshot.snapshot : null;
    const restoredStatus = restoredAssessmentStatus(
      validCheckupStatus(derivedAssessment.status) ?? validCheckupStatus(row.status),
      score
    );
    const assessment = createMovementAssessment({
      checkUpId: checkUp.startedAt,
      type,
      score,
      scoreSnapshot,
      sourceBlockId: normalizedString(derivedAssessment.sourceBlockId),
      completedAt,
      status: restoredStatus,
      isOfficialForProgress:
        typeof derivedAssessment.isOfficialForProgress === 'boolean'
          ? derivedAssessment.isOfficialForProgress
          : undefined,
    });

    const restored = validMovementAssessment({
      ...assessment,
      userId: LOCAL_USER_ID,
      results: {
        ...assessment.results,
        rawMetrics: {
          ...(assessment.results?.rawMetrics ?? {}),
          remoteMovementCheckupId: normalizedString(row.id),
        },
      },
    });

    if (!restored || seen.has(restored.id)) continue;
    seen.add(restored.id);
    assessments.push(restored);
  }

  return assessments.sort((a, b) => (a.completedAt ?? a.createdAt).localeCompare(b.completedAt ?? b.createdAt));
}

function restoredAssessmentStatus(
  remoteStatus: CheckupStatus | null,
  score: CheckUpScore | null
): CheckupStatus | undefined {
  if (remoteStatus === 'not_started' || remoteStatus === 'in_progress' || remoteStatus === 'cancelled') {
    return remoteStatus;
  }
  if (remoteStatus === 'invalid') return 'invalid';
  if (!score) return 'invalid';
  return checkupStatusFromHeadlineEvidence(headlineEvidenceFromScore(score));
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
        'safety_json',
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

async function fetchRemoteTrainingState(
  userId: string,
  fetchErrors: Partial<Record<RemoteTableName, unknown>>
): Promise<RemoteTrainingStateRow | null> {
  const { data, error } = await supabase
    .from('training_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    fetchErrors.training_state = error;
    console.warn('[restore] Training state fetch failed', error);
    addBreadcrumb('restore table fetch failed', { table: 'training_state' });
    return null;
  }

  return (data as RemoteTrainingStateRow | null) ?? null;
}

async function fetchRemoteRows<T>(
  table: Exclude<RemoteTableName, 'profiles' | 'training_state'>,
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

async function persistRestoredLocalState(
  restored: RestoredLocalState,
  previous: LocalHaleStateForRestore,
  stores: RestoreStores
): Promise<void> {
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
        })
      );
    }
  }

  if (isTrainingStateMeaningfulForRestore(restored.training)) {
    safeWrite('training state', () => stores.trainingStore.saveState(restored.training));
  }

  if (restored.microChecks.length > previous.microChecks.length) {
    for (const microCheck of restored.microChecks) {
      safeWrite(`micro-check ${microCheck.startedAt}`, () => stores.trainingStore.saveMicroCheck(microCheck));
    }
  }

  if (hasMeaningfulAdherenceState(restored.adherence)) {
    safeWrite('adherence state', () => stores.adherenceStore.save(restored.adherence));
  }
}

function storedCheckUpFromRemoteRow(row: RemoteMovementCheckupRow): StoredCheckUp | null {
  const raw = asRecord(row.raw_checkup_json);
  const derived = asRecord(row.derived_scores_json);
  const checkUp = raw.checkUp;
  if (!checkUp) return null;
  const checkupType = exactCheckupTypeFromRemote(row, derived, raw);
  const scoreSnapshot = scoreSnapshotCandidateFromRemoteRow(row);

  return deserializeCheckUp(
    JSON.stringify({
      schemaVersion: raw.schemaVersion ?? HISTORY_SCHEMA_VERSION,
      checkupType,
      scoreSnapshot,
      checkUp,
    })
  );
}

function scoreSnapshotCandidateFromRemoteRow(row: RemoteMovementCheckupRow): unknown {
  const derived = asRecord(row.derived_scores_json);
  const raw = asRecord(row.raw_checkup_json);
  return derived.scoreSnapshot ?? raw.scoreSnapshot ?? null;
}

function microCheckFromRemoteRow(row: RemoteMicroCheckRow): MicroCheckResult | null {
  const resultJson = asRecord(row.result_json);
  const result = resultJson.result;
  if (!result) return null;

  return deserializeMicroCheck(
    JSON.stringify({
      schemaVersion: TRAINING_SCHEMA_VERSION,
      payload: result,
    })
  );
}

function validMovementBlock(value: unknown): MovementBlock | null {
  const restored = deserializeAdherenceWith({
    ...defaultAdherenceStoreState(),
    blocks: [value as never],
  });
  return restored?.blocks[0] ?? null;
}

function validMovementAssessment(value: unknown): MovementAssessment | null {
  const restored = deserializeAdherenceWith({
    ...defaultAdherenceStoreState(),
    assessments: [value as never],
  });
  return restored?.assessments[0] ?? null;
}

function validTrainingSessionCompletion(value: unknown): TrainingSessionCompletion | null {
  const restored = deserializeAdherenceWith({
    ...defaultAdherenceStoreState(),
    completions: [value as never],
  });
  return restored?.completions[0] ?? null;
}

function validMovementBlockReport(value: unknown): MovementBlockReport | null {
  const restored = deserializeAdherenceWith({
    ...defaultAdherenceStoreState(),
    reports: [value as never],
  });
  return restored?.reports[0] ?? null;
}

function deserializeAdherenceWith(payload: AdherenceStoreState): AdherenceStoreState | null {
  const json = JSON.stringify({
    schemaVersion: 2,
    payload,
  });
  return deserializeAdherenceState(json);
}

function restoredCounts(mapped: { state: RestoredLocalState }, previous: LocalHaleStateForRestore): NonNullable<RestoreResult['restoredCounts']> {
  return {
    profile: hasMeaningfulPreferences(mapped.state.preferences) && !hasMeaningfulPreferences(previous.preferences) ? 1 : 0,
    checkups: mapped.state.history.length,
    movementBlocks: mapped.state.adherence.blocks.length,
    assessments: mapped.state.adherence.assessments.length,
    trainingState: isTrainingStateMeaningfulForRestore(mapped.state.training) ? 1 : 0,
    sessionCompletions: mapped.state.adherence.completions.length,
    microChecks: mapped.state.microChecks.length,
    blockReports: mapped.state.adherence.reports.length,
  };
}

function hasMeaningfulPreferences(prefs: Preferences): boolean {
  const defaults = defaultPreferences();
  return (
    hasText(prefs.profile.name) ||
    prefs.profile.age !== null ||
    hasText(prefs.profile.goal) ||
    prefs.profile.lifeGoal !== null ||
    prefs.profile.safetyProfile !== null ||
    JSON.stringify(prefs.settings) !== JSON.stringify(defaults.settings) ||
    prefs.onboarding.currentStep !== 'welcome' ||
    prefs.onboarding.selectedEquipment.length > 0 ||
    prefs.onboarding.baselineResultId !== null ||
    prefs.onboarding.completedAt !== null ||
    prefs.onboarding.updatedAt !== null
  );
}

export function isTrainingStateMeaningfulForRestore(training: TrainingState): boolean {
  const defaults = defaultTrainingState();
  return (
    training.block !== null ||
    training.progress.completedSessions > 0 ||
    training.progress.lastSessionAt !== null ||
    training.progress.retestDueAt !== null ||
    Object.keys(training.progression.levels).length > 0 ||
    Object.values(training.progression.velHistory).some((values) => values.length > 0) ||
    JSON.stringify(training.equipment) !== JSON.stringify(defaults.equipment) ||
    Object.keys(training.ladderProgressById).length > 0 ||
    training.generatedSessionSummaries.length > 0 ||
    training.lastPostSessionFeedback !== null ||
    JSON.stringify(training.planPreferences) !== JSON.stringify(defaults.planPreferences)
  );
}

function hasMeaningfulAdherenceState(adherence: AdherenceStoreState): boolean {
  return (
    adherence.blocks.length > 0 ||
    adherence.assessments.length > 0 ||
    adherence.reports.length > 0 ||
    adherence.completions.length > 0 ||
    adherence.milestones.length > 0 ||
    adherence.supportConnections.length > 0 ||
    adherence.notificationEvents.length > 0 ||
    adherence.weeklySummaries.length > 0
  );
}

function exactCheckupTypeFromRemote(
  row: RemoteMovementCheckupRow,
  derived: JsonRecord = asRecord(row.derived_scores_json),
  raw: JsonRecord = asRecord(row.raw_checkup_json)
): CheckupType {
  return (
    validCheckupType(derived.exactCheckupType) ??
    validCheckupType(derived.checkupType) ??
    validCheckupType(raw.checkupType) ??
    mapRemoteCheckupType(row.checkup_type)
  );
}

function mapRemoteCheckupType(value: unknown): CheckupType {
  if (value === 'baseline' || value === 'official_retest' || value === 'manual_extra') return value;
  return 'legacy_unknown';
}

function validCheckupType(value: unknown): CheckupType | null {
  return typeof value === 'string' && CHECKUP_TYPES.includes(value as CheckupType) ? (value as CheckupType) : null;
}

function validCheckupStatus(value: unknown): CheckupStatus | null {
  return typeof value === 'string' && CHECKUP_STATUSES.includes(value as CheckupStatus)
    ? (value as CheckupStatus)
    : null;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function normalizedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
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
