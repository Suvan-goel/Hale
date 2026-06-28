import { supabase } from '../../lib/supabase';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { getCurrentSession } from './authService';
import type { AuthUser, BackendJson } from './types';

type JsonRecord = Record<string, BackendJson>;

export interface HaleDataExport {
  exportVersion: 1;
  app: 'Hale';
  appVersion: string;
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
  };
  data: {
    profile: BackendJson;
    movementCheckups: BackendJson[];
    movementBlocks: BackendJson[];
    trainingState: BackendJson;
    trainingSessionCompletions: BackendJson[];
    microChecks: BackendJson[];
    movementBlockReports: BackendJson[];
  };
}

export interface BuildHaleDataExportInput {
  user: Pick<AuthUser, 'id' | 'email'>;
  exportedAt?: string;
  appVersion?: string;
  data: HaleDataExport['data'];
}

export interface ShareHaleDataExportResult {
  exportData: HaleDataExport;
  filename: string;
  fileUri: string;
  shareAction?: string;
}

type ExportTableName =
  | 'movement_checkups'
  | 'movement_blocks'
  | 'training_state'
  | 'training_session_completions'
  | 'micro_checks'
  | 'movement_block_reports';

const EXPORT_VERSION = 1;
const APP_VERSION = '0.1.0';
const SENSITIVE_KEY_EXACT = new Set([
  'video',
  'videos',
  'image',
  'images',
  'frame',
  'frames',
  'landmark',
  'landmarks',
  'uri',
  'path',
  'file',
  'files',
  'token',
  'refresh_token',
  'access_token',
  'id_token',
  'secret',
  ['service', 'role'].join('_'),
]);
const HEALTH_FREE_TEXT_KEY_EXACT = new Set([
  'painnotes',
  'injurynotes',
  'notes',
  'note',
  'freetext',
  'description',
  'details',
  'symptoms',
  'medicalnotes',
  'healthnotes',
  'injurydescription',
  'paindescription',
]);
const MAX_EXPORT_SANITIZE_DEPTH = 32;

export async function exportCurrentUserData(): Promise<HaleDataExport> {
  const session = await getCurrentSession();
  const user = session?.user;
  if (!user) {
    throw new Error('Sign in to export your Hale data.');
  }

  addBreadcrumb('export started', { userId: user.id });

  const [
    profile,
    movementCheckups,
    movementBlocks,
    trainingState,
    trainingSessionCompletions,
    microChecks,
    movementBlockReports,
  ] = await Promise.all([
    fetchProfile(user.id),
    fetchUserRows('movement_checkups', user.id, ['completed_at', 'created_at']),
    fetchUserRows('movement_blocks', user.id, ['started_at', 'created_at']),
    fetchTrainingState(user.id),
    fetchUserRows('training_session_completions', user.id, ['completed_at', 'created_at']),
    fetchUserRows('micro_checks', user.id, ['completed_at', 'created_at']),
    fetchUserRows('movement_block_reports', user.id, ['created_at']),
  ]);

  const exportData = buildHaleDataExport({
    user,
    data: {
      profile,
      movementCheckups,
      movementBlocks,
      trainingState,
      trainingSessionCompletions,
      microChecks,
      movementBlockReports,
    },
  });

  addBreadcrumb('export succeeded', {
    movementCheckups: movementCheckups.length,
    movementBlocks: movementBlocks.length,
    trainingSessionCompletions: trainingSessionCompletions.length,
    microChecks: microChecks.length,
    movementBlockReports: movementBlockReports.length,
  });

  return exportData;
}

export function buildHaleDataExport(input: BuildHaleDataExportInput): HaleDataExport {
  const exportedAt = validIsoLike(input.exportedAt) ?? new Date().toISOString();

  return {
    exportVersion: EXPORT_VERSION,
    app: 'Hale',
    appVersion: input.appVersion ?? APP_VERSION,
    exportedAt,
    user: {
      id: input.user.id,
      email: typeof input.user.email === 'string' ? input.user.email : null,
    },
    data: {
      profile: sanitizeForDataExport(input.data.profile),
      movementCheckups: sanitizeExportArray(input.data.movementCheckups),
      movementBlocks: sanitizeExportArray(input.data.movementBlocks),
      trainingState: sanitizeForDataExport(input.data.trainingState),
      trainingSessionCompletions: sanitizeExportArray(input.data.trainingSessionCompletions),
      microChecks: sanitizeExportArray(input.data.microChecks),
      movementBlockReports: sanitizeExportArray(input.data.movementBlockReports),
    },
  };
}

export async function shareHaleDataExport(exportData?: HaleDataExport): Promise<ShareHaleDataExportResult> {
  try {
    const nextExport = exportData ?? await exportCurrentUserData();
    const filename = exportFilenameFor(nextExport.exportedAt);
    const fileUri = await writeHaleDataExportFile(nextExport, filename);

    const { Share, Platform } = await import('react-native');
    const message = `Hale data export created: ${filename}`;
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { title: filename, url: fileUri, message }
        : { title: filename, url: fileUri, message: `${message}\n${fileUri}` },
      { dialogTitle: 'Export Hale data', subject: filename }
    );

    addBreadcrumb('export shared', { filename, shareAction: result.action });

    return {
      exportData: nextExport,
      filename,
      fileUri,
      shareAction: result.action,
    };
  } catch (error) {
    addBreadcrumb('export failed');
    captureError(error, { area: 'export', action: 'share_hale_data_export' });
    throw error;
  }
}

export function sanitizeForDataExport(
  value: unknown,
  key = '',
  depth = 0,
  seen: WeakSet<object> = new WeakSet<object>()
): BackendJson {
  if (isOmittedExportKey(key)) return null;
  if (depth > MAX_EXPORT_SANITIZE_DEPTH) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return isSensitiveStringValue(value) ? null : value;
  if (Array.isArray(value)) return value.map((item) => sanitizeForDataExport(item, '', depth + 1, seen));
  if (typeof value === 'object') {
    if (seen.has(value)) return null;
    seen.add(value);
    const out: JsonRecord = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (isOmittedExportKey(childKey)) continue;
      out[childKey] = sanitizeForDataExport(childValue, childKey, depth + 1, seen);
    }
    return out;
  }
  return null;
}

export function exportFilenameFor(exportedAt: string): string {
  const date = validIsoLike(exportedAt)?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `hale-data-export-${date}.json`;
}

async function fetchProfile(userId: string): Promise<BackendJson> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw exportFetchError('profiles', error);
  return sanitizeForDataExport(data);
}

async function fetchTrainingState(userId: string): Promise<BackendJson> {
  const { data, error } = await supabase
    .from('training_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw exportFetchError('training_state', error);
  return sanitizeForDataExport(data);
}

async function fetchUserRows(
  table: ExportTableName,
  userId: string,
  orderColumns: readonly string[]
): Promise<BackendJson[]> {
  let query = supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);

  for (const column of orderColumns) {
    query = query.order(column, { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw exportFetchError(table, error);
  return sanitizeExportArray(Array.isArray(data) ? data : []);
}

async function writeHaleDataExportFile(exportData: HaleDataExport, filename: string): Promise<string> {
  const { Directory, File, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, 'exports');
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, filename);
  file.write(`${JSON.stringify(exportData, null, 2)}\n`);
  return file.uri;
}

function sanitizeExportArray(value: unknown): BackendJson[] {
  return Array.isArray(value)
    ? value.map((item) => sanitizeForDataExport(item))
    : [];
}

function exportFetchError(table: string, error: unknown): Error {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message)
      : String(error);
  return new Error(`Could not export ${table}: ${message}`);
}

function isSensitiveExportKey(key: string): boolean {
  if (!key) return false;
  const lower = key.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9]/g, '');
  return (
    SENSITIVE_KEY_EXACT.has(lower) ||
    SENSITIVE_KEY_EXACT.has(normalized) ||
    normalized.includes('base64') ||
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('servicerole') ||
    normalized.endsWith('uri') ||
    normalized.endsWith('path') ||
    (normalized.endsWith('file') && !normalized.endsWith('profile')) ||
    normalized.endsWith('files') ||
    normalized.includes('frame') ||
    normalized.includes('landmark') ||
    normalized.includes('video') ||
    normalized.includes('image')
  );
}

function isHealthFreeTextExportKey(key: string): boolean {
  if (!key) return false;
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return HEALTH_FREE_TEXT_KEY_EXACT.has(normalized);
}

function isOmittedExportKey(key: string): boolean {
  return isSensitiveExportKey(key) || isHealthFreeTextExportKey(key);
}

function isSensitiveStringValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('file://') || trimmed.startsWith('content://') || /^data:.*;base64/.test(trimmed);
}

function validIsoLike(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
