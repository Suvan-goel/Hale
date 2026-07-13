import { createMemoryFs } from '../../history';
import {
  ONLINE_PROFILE_SYNC_FILE,
  ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
  OnlineProfileSyncStore,
  type OnlineProfileSyncMetadata,
} from '../onlineProfileSyncStore';

const USER_A = 'user-a';
const USER_B = 'user-b';
const LAST_REMOTE_UPDATE = '2026-07-12T09:15:00.000Z';
const LAST_SUCCESS = '2026-07-12T09:15:02.000Z';

function validMetadata(
  overrides: Partial<OnlineProfileSyncMetadata> = {}
): OnlineProfileSyncMetadata {
  return {
    schemaVersion: ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
    userId: USER_A,
    lastSyncedFingerprint: 'fingerprint-a',
    lastRemoteUpdatedAt: LAST_REMOTE_UPDATE,
    lastSuccessfulAt: LAST_SUCCESS,
    ...overrides,
  };
}

describe('OnlineProfileSyncStore', () => {
  it('round-trips valid sync metadata without storing profile values', async () => {
    const files = new Map<string, string>();
    const store = new OnlineProfileSyncStore(createMemoryFs(files));
    const metadata = validMetadata();

    store.save(metadata);

    await expect(store.load(USER_A)).resolves.toEqual(metadata);
    expect(JSON.parse(files.get(ONLINE_PROFILE_SYNC_FILE) as string)).toEqual(metadata);
    expect(files.get(ONLINE_PROFILE_SYNC_FILE)).not.toMatch(
      /name|dateOfBirth|menopauseStage|symptomPicture|safetyProfile|lifeGoal/
    );
  });

  it.each([
    ['malformed JSON', '{not-json'],
    [
      'unknown schema',
      JSON.stringify(validMetadata({ schemaVersion: 99 as never })),
    ],
    [
      'missing fingerprint',
      JSON.stringify({
        ...validMetadata(),
        lastSyncedFingerprint: undefined,
      }),
    ],
    [
      'invalid remote timestamp type',
      JSON.stringify({
        ...validMetadata(),
        lastRemoteUpdatedAt: 123,
      }),
    ],
    [
      'invalid success timestamp type',
      JSON.stringify({
        ...validMetadata(),
        lastSuccessfulAt: false,
      }),
    ],
  ])('returns null for %s', async (_label, storedValue) => {
    const files = new Map([[ONLINE_PROFILE_SYNC_FILE, storedValue]]);
    const store = new OnlineProfileSyncStore(createMemoryFs(files));

    await expect(store.load(USER_A)).resolves.toBeNull();
  });

  it('rejects metadata belonging to another account scope', async () => {
    const files = new Map<string, string>();
    const store = new OnlineProfileSyncStore(createMemoryFs(files));

    store.save(validMetadata());

    await expect(store.load(USER_B)).resolves.toBeNull();
    await expect(store.load(USER_A)).resolves.toEqual(validMetadata());
  });

  it('clears metadata idempotently', async () => {
    const files = new Map<string, string>();
    const store = new OnlineProfileSyncStore(createMemoryFs(files));
    store.save(validMetadata());

    store.clear();
    store.clear();

    expect(files.has(ONLINE_PROFILE_SYNC_FILE)).toBe(false);
    await expect(store.load(USER_A)).resolves.toBeNull();
  });
});
