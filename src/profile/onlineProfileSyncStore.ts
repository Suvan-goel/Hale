import type { HistoryFs } from '../history';

export const ONLINE_PROFILE_SYNC_FILE = 'online-profile-sync.json';
export const ONLINE_PROFILE_SYNC_SCHEMA_VERSION = 1;

export interface OnlineProfileSyncMetadata {
  schemaVersion: typeof ONLINE_PROFILE_SYNC_SCHEMA_VERSION;
  userId: string;
  lastSyncedFingerprint: string;
  lastRemoteUpdatedAt: string | null;
  lastSuccessfulAt: string;
}

/**
 * Per-account device metadata used to distinguish an offline local edit from
 * a newer online profile. It contains hashes/timestamps only, never profile
 * values, and lives beside the account-scoped local stores.
 */
export class OnlineProfileSyncStore {
  constructor(private readonly fs: HistoryFs) {}

  async load(userId: string): Promise<OnlineProfileSyncMetadata | null> {
    const json = await this.fs.read(ONLINE_PROFILE_SYNC_FILE);
    if (!json) return null;

    try {
      const value = JSON.parse(json) as Partial<OnlineProfileSyncMetadata>;
      if (
        value.schemaVersion !== ONLINE_PROFILE_SYNC_SCHEMA_VERSION ||
        value.userId !== userId ||
        typeof value.lastSyncedFingerprint !== 'string' ||
        (value.lastRemoteUpdatedAt !== null && typeof value.lastRemoteUpdatedAt !== 'string') ||
        typeof value.lastSuccessfulAt !== 'string'
      ) {
        return null;
      }

      return value as OnlineProfileSyncMetadata;
    } catch {
      return null;
    }
  }

  save(metadata: OnlineProfileSyncMetadata): void {
    this.fs.write(ONLINE_PROFILE_SYNC_FILE, JSON.stringify(metadata));
  }

  clear(): void {
    this.fs.delete?.(ONLINE_PROFILE_SYNC_FILE);
  }
}
