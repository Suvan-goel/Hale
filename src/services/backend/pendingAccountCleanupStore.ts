import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pearl/pending-deleted-account-cleanup/v2';
const LEGACY_STORAGE_KEY = '@pearl/pending-deleted-account-cleanup/v1';
const SCHEMA_VERSION = 2;
let markerMutation: Promise<unknown> = Promise.resolve();

export interface PendingAccountDeletionCleanup {
  userId: string;
  remoteState: 'uncertain' | 'confirmed_deleted';
  localCleanupPending: boolean;
}

interface PendingAccountCleanupEnvelope {
  schemaVersion: typeof SCHEMA_VERSION;
  entries: PendingAccountDeletionCleanup[];
}

/**
 * Durable deletion intents stored outside each user's file scope. The marker
 * is written before the Edge Function request, closing timeout/crash windows;
 * local cleanup can therefore resume even after the deleted auth session is
 * gone. No token or profile value is stored.
 */
export async function pendingAccountDeletionCleanups(): Promise<PendingAccountDeletionCleanup[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (value) {
    try {
      const parsed = JSON.parse(value) as Partial<PendingAccountCleanupEnvelope>;
      if (parsed.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.entries)) {
        return dedupeEntries(parsed.entries.filter(isValidEntry));
      }
    } catch {
      // Fall through to the legacy one-field envelope.
    }
  }

  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return [];
  try {
    const parsed = JSON.parse(legacy) as { userIds?: unknown };
    if (!Array.isArray(parsed.userIds)) return [];
    return parsed.userIds.filter(isValidUserId).map((userId) => ({
      userId,
      remoteState: 'confirmed_deleted' as const,
      localCleanupPending: true,
    }));
  } catch {
    return [];
  }
}

export function markAccountDeletionUncertain(userId: string): Promise<void> {
  return serializeMarkerMutation(() =>
    updateEntry(userId, {
      userId,
      remoteState: 'uncertain',
      localCleanupPending: true,
    })
  );
}

export function markAccountDeletionConfirmed(userId: string): Promise<void> {
  return serializeMarkerMutation(async () => {
    const current = (await pendingAccountDeletionCleanups()).find(
      (entry) => entry.userId === userId
    );
    await updateEntry(userId, {
      userId,
      remoteState: 'confirmed_deleted',
      localCleanupPending: current?.localCleanupPending ?? true,
    });
  });
}

export function markDeletedAccountCleanupComplete(userId: string): Promise<void> {
  return serializeMarkerMutation(async () => {
    const entries = await pendingAccountDeletionCleanups();
    const current = entries.find((entry) => entry.userId === userId);
    if (!current) return;
    if (current.remoteState === 'confirmed_deleted') {
      await save(entries.filter((entry) => entry.userId !== userId));
      return;
    }
    await save(entries.map((entry) =>
      entry.userId === userId ? { ...entry, localCleanupPending: false } : entry
    ));
  });
}

async function updateEntry(
  userId: string,
  next: PendingAccountDeletionCleanup
): Promise<void> {
  if (!isValidUserId(userId)) throw new Error('Invalid deleted-account cleanup owner.');
  const entries = (await pendingAccountDeletionCleanups()).filter(
    (entry) => entry.userId !== userId
  );
  entries.push(next);
  await save(entries);
}

async function save(entries: PendingAccountDeletionCleanup[]): Promise<void> {
  if (entries.length === 0) {
    await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_STORAGE_KEY]);
    return;
  }
  const envelope: PendingAccountCleanupEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    entries: dedupeEntries(entries),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
}

function dedupeEntries(
  entries: PendingAccountDeletionCleanup[]
): PendingAccountDeletionCleanup[] {
  return Array.from(
    new Map(entries.map((entry) => [entry.userId, entry])).values()
  );
}

function isValidEntry(value: unknown): value is PendingAccountDeletionCleanup {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<PendingAccountDeletionCleanup>;
  return (
    isValidUserId(entry.userId) &&
    (entry.remoteState === 'uncertain' || entry.remoteState === 'confirmed_deleted') &&
    typeof entry.localCleanupPending === 'boolean'
  );
}

function isValidUserId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200;
}

function serializeMarkerMutation<T>(work: () => Promise<T>): Promise<T> {
  const operation = markerMutation.then(work, work);
  markerMutation = operation.then(() => undefined, () => undefined);
  return operation;
}
