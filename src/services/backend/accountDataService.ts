import type { HistoryFs } from '../../history';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { BRAND } from '../../brand';
export interface LocalDataSummary {
  preferences: boolean;
  checkups: number;
  programmeState: boolean;
  trainingState: boolean;
  microChecks: number;
  adherenceState: boolean;
  sessionFunnels: number;
  recordings: number;
}

export interface ClearLocalPearlDataResult extends LocalDataSummary {
  deletedFiles: string[];
  failures: Array<{ area: string; name: string; error: unknown }>;
}

export interface LocalFileArea {
  list(): string[];
  delete(name: string): void;
}

export interface ClearLocalPearlDataOptions {
  fs?: HistoryFs;
  recordings?: LocalFileArea;
  sessionFunnels?: LocalFileArea[];
  userId?: string | null;
}

const PREFERENCES_FILE = 'preferences.json';
const PROGRAMME_STATE_FILE = 'programme.json';
const TRAINING_STATE_FILE = 'training-state.json';
const TRAINING_SESSION_IN_PROGRESS_FILE = 'training-session-in-progress.json';
const ADHERENCE_STATE_FILE = 'adherence-state.json';
const ONLINE_PROFILE_SYNC_FILE = 'online-profile-sync.json';
const CHECKUP_PREFIX = 'checkup-';
const MICROCHECK_PREFIX = 'microcheck-';

export async function getLocalDataSummary(options: ClearLocalPearlDataOptions = {}): Promise<LocalDataSummary> {
  const fs = options.fs ?? await defaultHistoryFs(options.userId);
  const recordings = options.recordings ?? await defaultRecordingArea();
  const sessionFunnels = await sessionFunnelAreas(options);
  const names = safeList(`local ${BRAND.appName} files`, fs);
  const recordingNames = safeList('recordings', recordings);
  const sessionFunnelNames = sessionFunnels.flatMap(({ area, files }) =>
    safeList(area, files)
  );

  return summarizeLocalData(names, recordingNames, sessionFunnelNames);
}

function summarizeLocalData(
  names: string[],
  recordingNames: string[],
  sessionFunnelNames: string[]
): LocalDataSummary {
  return {
    preferences: names.includes(PREFERENCES_FILE),
    checkups: names.filter(isCheckupFile).length,
    programmeState: names.includes(PROGRAMME_STATE_FILE),
    trainingState:
      names.includes(TRAINING_STATE_FILE) ||
      names.includes(TRAINING_SESSION_IN_PROGRESS_FILE),
    microChecks: names.filter(isMicroCheckFile).length,
    adherenceState: names.includes(ADHERENCE_STATE_FILE),
    sessionFunnels: sessionFunnelNames.length,
    recordings: recordingNames.length,
  };
}

export async function clearLocalPearlData(options: ClearLocalPearlDataOptions = {}): Promise<ClearLocalPearlDataResult> {
  const fs = options.fs ?? await defaultHistoryFs(options.userId);
  const recordings = options.recordings ?? await defaultRecordingArea();
  const sessionFunnels = await sessionFunnelAreas(options);
  const failures: ClearLocalPearlDataResult['failures'] = [];
  const deletedFiles: string[] = [];
  const mainArea = `local ${BRAND.appName} files`;
  const names = listForDeletion(mainArea, fs, failures);
  const recordingNames = listForDeletion('recordings', recordings, failures);
  const sessionFunnelListings = sessionFunnels.map(({ area, files }) => ({
    area,
    files,
    names: listForDeletion(area, files, failures),
  }));
  const summary = summarizeLocalData(
    names,
    recordingNames,
    sessionFunnelListings.flatMap((listing) => listing.names)
  );

  addBreadcrumb('local data deletion started', {
    checkups: summary.checkups,
    programmeState: summary.programmeState,
    microChecks: summary.microChecks,
    sessionFunnels: summary.sessionFunnels,
    recordings: summary.recordings,
  });

  for (const name of names.filter(isMainStoreClearTarget)) {
    tryDelete(mainArea, name, fs, deletedFiles, failures);
  }

  for (const name of recordingNames) {
    tryDelete('recordings', name, recordings, deletedFiles, failures);
  }

  for (const listing of sessionFunnelListings) {
    for (const name of listing.names) {
      tryDelete(listing.area, name, listing.files, deletedFiles, failures);
    }
  }

  verifyDeletedTargets(mainArea, fs, isMainStoreClearTarget, deletedFiles, failures);
  verifyDeletedTargets('recordings', recordings, () => true, deletedFiles, failures);
  for (const listing of sessionFunnelListings) {
    verifyDeletedTargets(listing.area, listing.files, () => true, deletedFiles, failures);
  }

  const result = {
    ...summary,
    deletedFiles,
    failures,
  };

  if (failures.length > 0) {
    captureError(new Error(`Local ${BRAND.appName} data deletion had failures.`), {
      area: 'account_data',
      action: 'clear_local_pearl_data',
      failures: failures.map((failure) => ({
        area: failure.area,
        message: failure.error instanceof Error ? failure.error.message : String(failure.error),
      })),
    });
  }

  addBreadcrumb('local data deletion completed', {
    deletedCount: deletedFiles.length,
    failures: failures.length,
  });

  return result;
}

function isMainStoreClearTarget(name: string): boolean {
  return (
    name === PREFERENCES_FILE ||
    name === PROGRAMME_STATE_FILE ||
    name === TRAINING_STATE_FILE ||
    name === TRAINING_SESSION_IN_PROGRESS_FILE ||
    name === ADHERENCE_STATE_FILE ||
    name === ONLINE_PROFILE_SYNC_FILE ||
    isCheckupFile(name) ||
    isMicroCheckFile(name)
  );
}

function isCheckupFile(name: string): boolean {
  return name.startsWith(CHECKUP_PREFIX) && name.endsWith('.json');
}

function isMicroCheckFile(name: string): boolean {
  return name.startsWith(MICROCHECK_PREFIX) && name.endsWith('.json');
}

function safeList(area: string, files: { list(): string[] }): string[] {
  try {
    return files.list();
  } catch (error) {
    console.warn(`[account-data] Could not list ${area}`, error);
    addBreadcrumb('local data listing failed', { area });
    return [];
  }
}

function listForDeletion(
  area: string,
  files: { list(): string[] },
  failures: ClearLocalPearlDataResult['failures']
): string[] {
  try {
    return files.list();
  } catch (error) {
    console.warn(`[account-data] Could not list ${area}`, error);
    addBreadcrumb('local data listing failed', { area });
    recordFailure(failures, area, '*', error);
    return [];
  }
}

function tryDelete(
  area: string,
  name: string,
  files: { delete?: (name: string) => void },
  deletedFiles: string[],
  failures: ClearLocalPearlDataResult['failures']
): void {
  if (!files.delete) {
    recordFailure(failures, area, name, new Error('File adapter does not support delete.'));
    return;
  }

  try {
    files.delete(name);
    deletedFiles.push(`${area}/${name}`);
  } catch (error) {
    recordFailure(failures, area, name, error);
  }
}

async function defaultHistoryFs(userId?: string | null): Promise<HistoryFs> {
  const [{ createExpoHistoryFs }, scopedUserId] = await Promise.all([
    import('../../history/fsAdapter'),
    userId === undefined ? currentAuthUserId() : Promise.resolve(userId),
  ]);
  return createExpoHistoryFs({ userId: scopedUserId, strictErrors: true });
}

async function currentAuthUserId(): Promise<string | null> {
  try {
    const { getCurrentSession } = await import('./authService');
    return (await getCurrentSession())?.user.id ?? null;
  } catch {
    return null;
  }
}

async function defaultRecordingArea(): Promise<LocalFileArea> {
  const { Directory, File, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, 'recordings');

  return {
    list() {
      if (!dir.exists) return [];
      return dir
        .list()
        .filter((entry): entry is InstanceType<typeof File> => entry instanceof File)
        .map((file) => file.name);
    },
    delete(name) {
      const file = new File(dir, name);
      if (file.exists) file.delete();
    },
  };
}

interface NamedLocalFileArea {
  area: string;
  files: LocalFileArea;
}

async function sessionFunnelAreas(
  options: ClearLocalPearlDataOptions
): Promise<NamedLocalFileArea[]> {
  if (options.sessionFunnels) {
    return options.sessionFunnels.map((files, index) => ({
      area: index === 0 ? 'session telemetry' : `session telemetry ${index + 1}`,
      files,
    }));
  }

  const { createExpoSessionFunnelFs } = await import('../../telemetry/fsAdapter');
  return [
    {
      area: 'session telemetry',
      files: createExpoSessionFunnelFs({
        userId: options.userId,
        strictErrors: true,
      }) as LocalFileArea,
    },
    {
      area: 'legacy session telemetry',
      files: createExpoSessionFunnelFs({
        legacyUnscoped: true,
        strictErrors: true,
      }) as LocalFileArea,
    },
  ];
}

function verifyDeletedTargets(
  area: string,
  files: { list(): string[] },
  isTarget: (name: string) => boolean,
  deletedFiles: string[],
  failures: ClearLocalPearlDataResult['failures']
): void {
  let remaining: string[];
  try {
    remaining = files.list().filter(isTarget);
  } catch (error) {
    // A successful return from delete is not proof when the verification read
    // itself failed. Keep the result conservative instead of reporting files
    // as deleted when their final state is unknown.
    removeAreaDeletionClaims(area, deletedFiles);
    recordFailure(failures, area, '*', error);
    return;
  }

  for (const name of remaining) {
    removeDeletionClaim(area, name, deletedFiles);
    recordFailure(failures, area, name, new Error('File still exists after deletion.'));
  }
}

function recordFailure(
  failures: ClearLocalPearlDataResult['failures'],
  area: string,
  name: string,
  error: unknown
): void {
  if (failures.some((failure) => failure.area === area && failure.name === name)) return;
  failures.push({ area, name, error });
}

function removeDeletionClaim(area: string, name: string, deletedFiles: string[]): void {
  const claimedIndex = deletedFiles.indexOf(`${area}/${name}`);
  if (claimedIndex >= 0) deletedFiles.splice(claimedIndex, 1);
}

function removeAreaDeletionClaims(area: string, deletedFiles: string[]): void {
  const prefix = `${area}/`;
  for (let index = deletedFiles.length - 1; index >= 0; index -= 1) {
    if (deletedFiles[index].startsWith(prefix)) deletedFiles.splice(index, 1);
  }
}
