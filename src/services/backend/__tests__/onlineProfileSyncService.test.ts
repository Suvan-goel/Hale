import type { MovementSafetyProfile } from '../../../adherence';
import { createMemoryFs } from '../../../history';
import {
  ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
  OnlineProfileSyncStore,
  defaultPreferences,
  type Preferences,
} from '../../../profile';
import { captureError } from '../../observability/sentry';
import { getCurrentSession } from '../authService';
import {
  reconcileOnlineProfile,
} from '../onlineProfileSyncService';
import {
  insertCurrentProfileIfAbsent,
  updateCurrentProfileIfUnchanged,
} from '../profileService';
import {
  loadRemoteProfile,
  onlineProfileFingerprint,
  preferencesToBackendProfileUpdate,
} from '../profileSyncService';
import type { BackendProfile } from '../types';

jest.mock('../../observability/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

jest.mock('../profileService', () => ({
  insertCurrentProfileIfAbsent: jest.fn(),
  updateCurrentProfileIfUnchanged: jest.fn(),
}));

jest.mock('../profileSyncService', () => {
  const actual = jest.requireActual('../profileSyncService');
  return {
    ...actual,
    loadRemoteProfile: jest.fn(),
  };
});

const USER_ID = 'profile-user-123';
const CREATED_AT = '2026-07-01T09:00:00.000Z';
const BASELINE_SYNC_AT = '2026-07-05T09:00:00.000Z';
const REMOTE_UPDATED_AT = '2026-07-12T09:00:00.000Z';
const NOW_ISO = '2026-07-12T09:00:10.000Z';

const mockGetCurrentSession = jest.mocked(getCurrentSession);
const mockLoadRemoteProfile = jest.mocked(loadRemoteProfile);
const mockInsertCurrentProfileIfAbsent = jest.mocked(insertCurrentProfileIfAbsent);
const mockUpdateCurrentProfileIfUnchanged = jest.mocked(updateCurrentProfileIfUnchanged);
const mockCaptureError = jest.mocked(captureError);

function onlinePreferences(name: string): Preferences {
  const defaults = defaultPreferences();
  return {
    ...defaults,
    profile: {
      ...defaults.profile,
      name,
      dateOfBirth: '1969-05-04',
      exactAge: 57,
      referenceSex: 'female',
      age: 57,
      ageBand: '55_64',
      goal: `${name}'s everyday goal`,
      lifeGoal: {
        id: `life-goal-${name}`,
        userId: 'local-device-user',
        category: 'independence',
        createdAt: CREATED_AT,
        updatedAt: REMOTE_UPDATED_AT,
        isPrimary: true,
      },
    },
    settings: {
      ...defaults.settings,
      voiceId: name === 'Remote' ? 'clara' : 'marcus',
      comparisonOptIn: name === 'Remote',
    },
  };
}

function localSafetyProfile(): MovementSafetyProfile {
  return {
    id: 'device-only-safety',
    userId: 'local-device-user',
    hasCurrentPain: true,
    painNotes: 'device-only pain note',
    availableEquipment: ['chair'],
    equipmentStatus: 'confirmed',
    equipmentRevision: 1,
    equipmentUpdatedAt: NOW_ISO,
    createdAt: CREATED_AT,
    updatedAt: NOW_ISO,
  };
}

function withDeviceOnlyFields(prefs: Preferences): Preferences {
  return {
    ...prefs,
    profile: {
      ...prefs.profile,
      menopauseStage: 'perimenopausal',
      symptomPicture: { kind: 'selected', symptoms: ['sleep_disruption'] },
      safetyProfile: localSafetyProfile(),
    },
    settings: {
      ...prefs.settings,
      remindersEnabled: true,
      phoneStandAvailable: true,
      voiceSetup: { promptShown: true, safetyLineShown: true },
    },
    onboarding: {
      currentStep: 'complete',
      baselineResultId: 'device-only-checkup',
      completedAt: CREATED_AT,
      updatedAt: NOW_ISO,
    },
  };
}

function remoteProfileFor(
  prefs: Preferences,
  updatedAt = REMOTE_UPDATED_AT
): BackendProfile {
  const update = preferencesToBackendProfileUpdate(prefs);
  return {
    id: USER_ID,
    local_user_id: update.local_user_id ?? null,
    full_name: update.full_name ?? null,
    birth_year: update.birth_year ?? null,
    sex: update.sex ?? null,
    profile_json: update.profile_json ?? null,
    onboarding_json: update.onboarding_json ?? null,
    preferences_json: update.preferences_json ?? null,
    onboarding_completed_at: update.onboarding_completed_at ?? null,
    created_at: CREATED_AT,
    updated_at: updatedAt,
  };
}

function createMetadataStore(): OnlineProfileSyncStore {
  return new OnlineProfileSyncStore(createMemoryFs());
}

async function seedMetadata(
  store: OnlineProfileSyncStore,
  prefs: Preferences
): Promise<void> {
  store.save({
    schemaVersion: ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
    userId: USER_ID,
    lastSyncedFingerprint: onlineProfileFingerprint(prefs),
    lastRemoteUpdatedAt: BASELINE_SYNC_AT,
    lastSuccessfulAt: BASELINE_SYNC_AT,
  });
}

describe('reconcileOnlineProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentSession.mockResolvedValue({ user: { id: USER_ID } } as never);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads the first meaningful device profile and records the successful fingerprint', async () => {
    const local = onlinePreferences('Device');
    const metadataStore = createMetadataStore();
    const savedRemote = remoteProfileFor(local);
    mockLoadRemoteProfile.mockResolvedValue(null);
    mockInsertCurrentProfileIfAbsent.mockResolvedValue(savedRemote);

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result).toEqual({
      status: 'synced',
      lastSyncedAt: REMOTE_UPDATED_AT,
      error: null,
      profile: savedRemote,
    });
    expect(mockInsertCurrentProfileIfAbsent).toHaveBeenCalledWith(
      preferencesToBackendProfileUpdate(local),
      USER_ID
    );
    await expect(metadataStore.load(USER_ID)).resolves.toEqual({
      schemaVersion: ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
      userId: USER_ID,
      lastSyncedFingerprint: onlineProfileFingerprint(local),
      lastRemoteUpdatedAt: REMOTE_UPDATED_AT,
      lastSuccessfulAt: REMOTE_UPDATED_AT,
    });
  });

  it('keeps a provider/signup name when materializing a new profile row', async () => {
    const local = defaultPreferences();
    const metadataStore = createMetadataStore();
    const stub: BackendProfile = {
      id: USER_ID,
      local_user_id: null,
      full_name: 'Provider Name',
      birth_year: null,
      sex: null,
      profile_json: {},
      onboarding_json: {},
      preferences_json: {},
      onboarding_completed_at: null,
      created_at: CREATED_AT,
      updated_at: REMOTE_UPDATED_AT,
    };
    const expected = {
      ...local,
      profile: { ...local.profile, name: 'Provider Name' },
    };
    mockLoadRemoteProfile.mockResolvedValue(stub);
    mockUpdateCurrentProfileIfUnchanged.mockResolvedValue(remoteProfileFor(expected));

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('synced');
    expect(result.preferences?.profile.name).toBe('Provider Name');
    expect(mockUpdateCurrentProfileIfUnchanged).toHaveBeenCalledWith(
      preferencesToBackendProfileUpdate(expected),
      REMOTE_UPDATED_AT,
      USER_ID
    );
    await expect(metadataStore.load(USER_ID)).resolves.toBeNull();
    result.finalize?.();
    await expect(metadataStore.load(USER_ID)).resolves.not.toBeNull();
  });

  it('treats the untouched versioned signup-trigger envelope as a stub', async () => {
    const local = defaultPreferences();
    const metadataStore = createMetadataStore();
    const providerPreferences = {
      ...local,
      profile: { ...local.profile, name: 'Provider Name' },
    };
    const triggerStub = remoteProfileFor(providerPreferences, CREATED_AT);
    const savedRemote = remoteProfileFor(providerPreferences);
    mockLoadRemoteProfile.mockResolvedValue(triggerStub);
    mockUpdateCurrentProfileIfUnchanged.mockResolvedValue(savedRemote);

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('synced');
    expect(result.preferences?.profile.name).toBe('Provider Name');
    expect(mockUpdateCurrentProfileIfUnchanged).toHaveBeenCalledWith(
      preferencesToBackendProfileUpdate(providerPreferences),
      CREATED_AT,
      USER_ID
    );
    result.finalize?.();
  });

  it('hydrates an existing online profile while preserving every device-only field', async () => {
    const local = withDeviceOnlyFields(defaultPreferences());
    const remote = onlinePreferences('Remote');
    const remoteProfile = remoteProfileFor(remote);
    const metadataStore = createMetadataStore();
    mockLoadRemoteProfile.mockResolvedValue(remoteProfile);

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('synced');
    expect(result.preferences).toEqual(
      expect.objectContaining({
        profile: expect.objectContaining({
          name: 'Remote',
          dateOfBirth: remote.profile.dateOfBirth,
          referenceSex: remote.profile.referenceSex,
          goal: local.profile.goal,
          lifeGoal: expect.objectContaining({ category: 'independence' }),
          menopauseStage: local.profile.menopauseStage,
          symptomPicture: local.profile.symptomPicture,
          safetyProfile: local.profile.safetyProfile,
        }),
        settings: {
          voiceId: remote.settings.voiceId,
          comparisonOptIn: remote.settings.comparisonOptIn,
          remindersEnabled: local.settings.remindersEnabled,
          phoneStandAvailable: local.settings.phoneStandAvailable,
          voiceSetup: local.settings.voiceSetup,
        },
        onboarding: local.onboarding,
      })
    );
    expect(mockInsertCurrentProfileIfAbsent).not.toHaveBeenCalled();
    expect(mockUpdateCurrentProfileIfUnchanged).not.toHaveBeenCalled();
    await expect(metadataStore.load(USER_ID)).resolves.toBeNull();
    result.finalize?.();
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(remote),
        lastRemoteUpdatedAt: REMOTE_UPDATED_AT,
      })
    );
  });

  it('reports a conflict when both device and online projections diverged from the last sync', async () => {
    const baseline = onlinePreferences('Baseline');
    const local = onlinePreferences('Device');
    const remote = onlinePreferences('Remote');
    const remoteProfile = remoteProfileFor(remote);
    const metadataStore = createMetadataStore();
    await seedMetadata(metadataStore, baseline);
    mockLoadRemoteProfile.mockResolvedValue(remoteProfile);

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result).toEqual({
      status: 'conflict',
      lastSyncedAt: BASELINE_SYNC_AT,
      error: null,
      profile: remoteProfile,
    });
    expect(mockInsertCurrentProfileIfAbsent).not.toHaveBeenCalled();
    expect(mockUpdateCurrentProfileIfUnchanged).not.toHaveBeenCalled();
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(baseline),
        lastSuccessfulAt: BASELINE_SYNC_AT,
      })
    );
  });

  it('resolves a conflict in favour of this device and advances metadata', async () => {
    const baseline = onlinePreferences('Baseline');
    const local = onlinePreferences('Device');
    const remote = onlinePreferences('Remote');
    const metadataStore = createMetadataStore();
    await seedMetadata(metadataStore, baseline);
    mockLoadRemoteProfile.mockResolvedValue(remoteProfileFor(remote));
    mockUpdateCurrentProfileIfUnchanged.mockResolvedValue(remoteProfileFor(local));

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      resolution: 'device',
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('synced');
    expect(result.preferences).toBeUndefined();
    expect(mockUpdateCurrentProfileIfUnchanged).toHaveBeenCalledWith(
      preferencesToBackendProfileUpdate(local),
      REMOTE_UPDATED_AT,
      USER_ID
    );
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(local),
        lastSuccessfulAt: REMOTE_UPDATED_AT,
      })
    );
  });

  it('resolves a conflict in favour of online values without replacing device-only data', async () => {
    const baseline = onlinePreferences('Baseline');
    const local = withDeviceOnlyFields(onlinePreferences('Device'));
    const remote = onlinePreferences('Remote');
    const metadataStore = createMetadataStore();
    await seedMetadata(metadataStore, baseline);
    mockLoadRemoteProfile.mockResolvedValue(remoteProfileFor(remote));

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      resolution: 'online',
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('synced');
    expect(result.preferences?.profile.name).toBe('Remote');
    expect(result.preferences?.profile.menopauseStage).toBe(local.profile.menopauseStage);
    expect(result.preferences?.profile.symptomPicture).toEqual(local.profile.symptomPicture);
    expect(result.preferences?.profile.safetyProfile).toEqual(local.profile.safetyProfile);
    expect(result.preferences?.onboarding).toEqual(local.onboarding);
    expect(mockInsertCurrentProfileIfAbsent).not.toHaveBeenCalled();
    expect(mockUpdateCurrentProfileIfUnchanged).not.toHaveBeenCalled();
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(baseline),
      })
    );
    result.finalize?.();
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(remote),
        lastSuccessfulAt: REMOTE_UPDATED_AT,
      })
    );
  });

  it('returns failed on a network error and retains the previous sync metadata', async () => {
    const baseline = onlinePreferences('Baseline');
    const local = onlinePreferences('Device');
    const metadataStore = createMetadataStore();
    await seedMetadata(metadataStore, baseline);
    mockLoadRemoteProfile.mockRejectedValue(new Error('network unavailable'));

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result).toEqual({
      status: 'failed',
      lastSyncedAt: null,
      error: 'network unavailable',
    });
    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'network unavailable' }),
      { area: 'online_profile', action: 'reconcile' }
    );
    expect(mockInsertCurrentProfileIfAbsent).not.toHaveBeenCalled();
    expect(mockUpdateCurrentProfileIfUnchanged).not.toHaveBeenCalled();
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(baseline),
        lastSuccessfulAt: BASELINE_SYNC_AT,
      })
    );
  });

  it('never records success when the authenticated account disappears before upload', async () => {
    const local = onlinePreferences('Device');
    const metadataStore = createMetadataStore();
    mockLoadRemoteProfile.mockResolvedValue(null);
    mockInsertCurrentProfileIfAbsent.mockRejectedValue(
      new Error('The authenticated account changed before the online profile was saved.')
    );

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/authenticated account changed/i);
    await expect(metadataStore.load(USER_ID)).resolves.toBeNull();
  });

  it('reports a conflict when another device changes the row between read and write', async () => {
    const baseline = onlinePreferences('Baseline');
    const local = onlinePreferences('Device');
    const firstRemote = remoteProfileFor(baseline, BASELINE_SYNC_AT);
    const latestRemote = remoteProfileFor(onlinePreferences('Remote'));
    const metadataStore = createMetadataStore();
    await seedMetadata(metadataStore, baseline);
    mockLoadRemoteProfile
      .mockResolvedValueOnce(firstRemote)
      .mockResolvedValueOnce(latestRemote);
    mockUpdateCurrentProfileIfUnchanged.mockResolvedValue(null);

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(mockUpdateCurrentProfileIfUnchanged).toHaveBeenCalledWith(
      preferencesToBackendProfileUpdate(local),
      BASELINE_SYNC_AT,
      USER_ID
    );
    expect(result).toEqual({
      status: 'conflict',
      lastSyncedAt: BASELINE_SYNC_AT,
      error: null,
      profile: latestRemote,
    });
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(baseline),
        lastRemoteUpdatedAt: BASELINE_SYNC_AT,
      })
    );
  });

  it('accepts a concurrent write when it produced the same allowlisted profile', async () => {
    const baseline = onlinePreferences('Baseline');
    const local = onlinePreferences('Device');
    const firstRemote = remoteProfileFor(baseline, BASELINE_SYNC_AT);
    const latestRemote = remoteProfileFor(local);
    const metadataStore = createMetadataStore();
    await seedMetadata(metadataStore, baseline);
    mockLoadRemoteProfile
      .mockResolvedValueOnce(firstRemote)
      .mockResolvedValueOnce(latestRemote);
    mockUpdateCurrentProfileIfUnchanged.mockResolvedValue(null);

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
    });

    expect(result.status).toBe('synced');
    expect(result.profile).toBe(latestRemote);
    await expect(metadataStore.load(USER_ID)).resolves.toEqual(
      expect.objectContaining({
        lastSyncedFingerprint: onlineProfileFingerprint(local),
        lastRemoteUpdatedAt: REMOTE_UPDATED_AT,
      })
    );
  });

  it('cancels after a remote read without writing remote or device sync state', async () => {
    const local = onlinePreferences('Device');
    const metadataStore = createMetadataStore();
    let active = true;
    mockLoadRemoteProfile.mockImplementation(async () => {
      active = false;
      return null;
    });

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
      shouldContinue: () => active,
    });

    expect(result.status).toBe('signed_out');
    expect(mockInsertCurrentProfileIfAbsent).not.toHaveBeenCalled();
    expect(mockUpdateCurrentProfileIfUnchanged).not.toHaveBeenCalled();
    await expect(metadataStore.load(USER_ID)).resolves.toBeNull();
  });

  it('does not finalize hydrated metadata after the caller supersedes the revision', async () => {
    const local = defaultPreferences();
    const remote = onlinePreferences('Remote');
    const metadataStore = createMetadataStore();
    let active = true;
    mockLoadRemoteProfile.mockResolvedValue(remoteProfileFor(remote));

    const result = await reconcileOnlineProfile({
      localPreferences: local,
      metadataStore,
      nowIso: NOW_ISO,
      shouldContinue: () => active,
    });
    expect(result.preferences?.profile.name).toBe('Remote');

    active = false;
    expect(() => result.finalize?.()).toThrow(/cancelled/i);
    await expect(metadataStore.load(USER_ID)).resolves.toBeNull();
  });
});
