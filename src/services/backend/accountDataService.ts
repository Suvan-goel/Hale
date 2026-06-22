import type { HistoryFs } from '../../history';
import { addBreadcrumb, captureError } from '../observability/sentry';

export interface LocalDataSummary {
  preferences: boolean;
  checkups: number;
  trainingState: boolean;
  microChecks: number;
  adherenceState: boolean;
  recordings: number;
}

export interface ClearLocalHaleDataResult extends LocalDataSummary {
  deletedFiles: string[];
  failures: Array<{ area: string; name: string; error: unknown }>;
}

export interface LocalFileArea {
  list(): string[];
  delete(name: string): void;
}

export interface ClearLocalHaleDataOptions {
  fs?: HistoryFs;
  recordings?: LocalFileArea;
  userId?: string | null;
}

const PREFERENCES_FILE = 'preferences.json';
const TRAINING_STATE_FILE = 'training-state.json';
const ADHERENCE_STATE_FILE = 'adherence-state.json';
const CHECKUP_PREFIX = 'checkup-';
const MICROCHECK_PREFIX = 'microcheck-';

export const CLOUD_ACCOUNT_DELETION_DEFERRED_MESSAGE =
  'Cloud account deletion needs a secure Hale server function before it can run from the app. No local data was cleared.';

export async function getLocalDataSummary(options: ClearLocalHaleDataOptions = {}): Promise<LocalDataSummary> {
  const fs = options.fs ?? await defaultHistoryFs(options.userId);
  const recordings = options.recordings ?? await defaultRecordingArea();
  const names = safeList('local Hale files', fs);
  const recordingNames = safeList('recordings', recordings);

  return {
    preferences: names.includes(PREFERENCES_FILE),
    checkups: names.filter(isCheckupFile).length,
    trainingState: names.includes(TRAINING_STATE_FILE),
    microChecks: names.filter(isMicroCheckFile).length,
    adherenceState: names.includes(ADHERENCE_STATE_FILE),
    recordings: recordingNames.length,
  };
}

export async function clearLocalHaleData(options: ClearLocalHaleDataOptions = {}): Promise<ClearLocalHaleDataResult> {
  const fs = options.fs ?? await defaultHistoryFs(options.userId);
  const recordings = options.recordings ?? await defaultRecordingArea();
  const failures: ClearLocalHaleDataResult['failures'] = [];
  const deletedFiles: string[] = [];
  const summary = await getLocalDataSummary({ fs, recordings });

  addBreadcrumb('local data deletion started', {
    checkups: summary.checkups,
    microChecks: summary.microChecks,
    recordings: summary.recordings,
  });

  for (const name of safeList('local Hale files', fs).filter(isMainStoreClearTarget)) {
    tryDelete('local Hale files', name, fs, deletedFiles, failures);
  }

  for (const name of safeList('recordings', recordings)) {
    tryDelete('recordings', name, recordings, deletedFiles, failures);
  }

  const result = {
    ...summary,
    deletedFiles,
    failures,
  };

  if (failures.length > 0) {
    captureError(new Error('Local Hale data deletion had failures.'), {
      area: 'account_data',
      action: 'clear_local_hale_data',
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

export async function signOutAndClearLocalData(
  options: ClearLocalHaleDataOptions = {}
): Promise<ClearLocalHaleDataResult> {
  const result = await clearLocalHaleData(options);
  if (result.failures.length > 0) return result;

  const { signOut } = await import('./authService');
  await signOut();
  return result;
}

export async function requestCloudAccountDeletion(): Promise<never> {
  throw new Error(CLOUD_ACCOUNT_DELETION_DEFERRED_MESSAGE);
}

function isMainStoreClearTarget(name: string): boolean {
  return (
    name === PREFERENCES_FILE ||
    name === TRAINING_STATE_FILE ||
    name === ADHERENCE_STATE_FILE ||
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

function tryDelete(
  area: string,
  name: string,
  files: { delete?: (name: string) => void },
  deletedFiles: string[],
  failures: ClearLocalHaleDataResult['failures']
): void {
  if (!files.delete) {
    failures.push({ area, name, error: new Error('File adapter does not support delete.') });
    return;
  }

  try {
    files.delete(name);
    deletedFiles.push(`${area}/${name}`);
  } catch (error) {
    failures.push({ area, name, error });
  }
}

async function defaultHistoryFs(userId?: string | null): Promise<HistoryFs> {
  const [{ createExpoHistoryFs }, scopedUserId] = await Promise.all([
    import('../../history/fsAdapter'),
    userId === undefined ? currentAuthUserId() : Promise.resolve(userId),
  ]);
  return createExpoHistoryFs({ userId: scopedUserId });
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
      try {
        if (!dir.exists) return [];
        return dir
          .list()
          .filter((entry): entry is InstanceType<typeof File> => entry instanceof File)
          .map((file) => file.name);
      } catch {
        return [];
      }
    },
    delete(name) {
      const file = new File(dir, name);
      if (file.exists) file.delete();
    },
  };
}
