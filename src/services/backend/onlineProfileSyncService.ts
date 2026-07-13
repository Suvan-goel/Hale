import {
  ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
  defaultPreferences,
  type OnlineProfileSyncStore,
  type Preferences,
} from '../../profile';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { getCurrentSession } from './authService';
import {
  hasMeaningfulOnlineProfile,
  loadRemoteProfile,
  mergeRemoteProfileIntoLocal,
  onlineProfileFingerprint,
  preferencesFromBackendProfile,
  preferencesToBackendProfileUpdate,
} from './profileSyncService';
import {
  insertCurrentProfileIfAbsent,
  updateCurrentProfileIfUnchanged,
} from './profileService';
import type { BackendProfile } from './types';

const ONLINE_PROFILE_REQUEST_TIMEOUT_MS = 8000;

export type OnlineProfileSyncStatus =
  | 'signed_out'
  | 'disabled'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'failed';

export type OnlineProfileConflictResolution = 'automatic' | 'device' | 'online';

export interface OnlineProfileSyncState {
  status: OnlineProfileSyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
}

export interface OnlineProfileReconcileResult extends OnlineProfileSyncState {
  preferences?: Preferences;
  profile?: BackendProfile | null;
  /** Persist sync metadata only after returned preferences are durably saved. */
  finalize?: () => void;
}

export interface ReconcileOnlineProfileInput {
  localPreferences: Preferences;
  metadataStore: OnlineProfileSyncStore;
  resolution?: OnlineProfileConflictResolution;
  nowIso?: string;
  /** False cancels the run before it can write remote or device state. */
  shouldContinue?: () => boolean;
}

export const SIGNED_OUT_ONLINE_PROFILE_STATE: OnlineProfileSyncState = {
  status: 'signed_out',
  lastSyncedAt: null,
  error: null,
};

export const SYNCING_ONLINE_PROFILE_STATE: OnlineProfileSyncState = {
  status: 'syncing',
  lastSyncedAt: null,
  error: null,
};

export const DISABLED_ONLINE_PROFILE_STATE: OnlineProfileSyncState = {
  status: 'disabled',
  lastSyncedAt: null,
  error: null,
};

/**
 * Three-way reconciliation using the last successfully synced fingerprint.
 * Local app use never waits on this function: a failure leaves the device
 * copy intact and retries can safely run later.
 */
export async function reconcileOnlineProfile(
  input: ReconcileOnlineProfileInput
): Promise<OnlineProfileReconcileResult> {
  const resolution = input.resolution ?? 'automatic';
  const nowIso = input.nowIso ?? new Date().toISOString();

  try {
    assertReconciliationActive(input);
    const session = await getCurrentSession();
    assertReconciliationActive(input);
    const userId = session?.user.id;
    if (!userId) return SIGNED_OUT_ONLINE_PROFILE_STATE;

    addBreadcrumb('online profile reconciliation started', { resolution });
    const [remoteProfile, metadata] = await Promise.all([
      withTimeout(loadRemoteProfile(userId), 'Online profile read'),
      input.metadataStore.load(userId),
    ]);
    assertReconciliationActive(input);
    const remotePreferences = remoteProfile
      ? preferencesFromBackendProfile(remoteProfile)
      : null;
    const localFingerprint = onlineProfileFingerprint(input.localPreferences);
    const remoteFingerprint = remotePreferences
      ? onlineProfileFingerprint(remotePreferences)
      : null;

    if (resolution === 'device') {
      return await uploadDeviceProfile(
        input,
        userId,
        localFingerprint,
        nowIso,
        remoteProfile,
        null
      );
    }

    if (!hasSyncedPayload(remoteProfile, remotePreferences)) {
      if (remoteProfile && remotePreferences) {
        // A signup trigger may have only the provider/name metadata and empty
        // versioned JSON. Fill missing device fields from that harmless stub,
        // then materialize the complete allowlisted shape without treating a
        // brand-new account as a conflict.
        const mergedPreferences = mergeRemoteProfileIntoLocal(
          remoteProfile,
          input.localPreferences,
          { hydrateRoutingFields: true }
        );
        const mergedFingerprint = onlineProfileFingerprint(mergedPreferences);
        const needsLocalHydration = mergedFingerprint !== localFingerprint;
        const uploaded = await uploadDeviceProfile(
          { ...input, localPreferences: mergedPreferences },
          userId,
          mergedFingerprint,
          nowIso,
          remoteProfile,
          metadata?.lastSuccessfulAt ?? null,
          needsLocalHydration
        );
        return needsLocalHydration && uploaded.status === 'synced'
          ? { ...uploaded, preferences: mergedPreferences }
          : uploaded;
      }
      return await uploadDeviceProfile(
        input,
        userId,
        localFingerprint,
        nowIso,
        remoteProfile,
        metadata?.lastSuccessfulAt ?? null
      );
    }

    if (resolution === 'online') {
      return hydrateOnlineProfile(
        input,
        userId,
        remoteProfile as BackendProfile,
        remoteFingerprint as string,
        nowIso
      );
    }

    if (!metadata) {
      if (
        hasMeaningfulOnlineProfile(input.localPreferences) &&
        remotePreferences &&
        hasMeaningfulOnlineProfile(remotePreferences) &&
        localFingerprint !== remoteFingerprint
      ) {
        return {
          status: 'conflict',
          lastSyncedAt: null,
          error: null,
          profile: remoteProfile,
        };
      }

      if (remoteProfile && remoteFingerprint && hasMeaningfulOnlineProfile(remotePreferences as Preferences)) {
        return hydrateOnlineProfile(input, userId, remoteProfile, remoteFingerprint, nowIso);
      }

      return await uploadDeviceProfile(
        input,
        userId,
        localFingerprint,
        nowIso,
        remoteProfile,
        null
      );
    }

    const localChanged = localFingerprint !== metadata.lastSyncedFingerprint;
    const remoteChanged = remoteFingerprint !== metadata.lastSyncedFingerprint;

    if (localChanged && remoteChanged && localFingerprint !== remoteFingerprint) {
      return {
        status: 'conflict',
        lastSyncedAt: metadata.lastSuccessfulAt,
        error: null,
        profile: remoteProfile,
      };
    }

    if (remoteChanged && !localChanged && remoteProfile && remoteFingerprint) {
      return hydrateOnlineProfile(input, userId, remoteProfile, remoteFingerprint, nowIso);
    }

    if (localChanged) {
      return await uploadDeviceProfile(
        input,
        userId,
        localFingerprint,
        nowIso,
        remoteProfile,
        metadata.lastSuccessfulAt
      );
    }

    const lastSyncedAt = remoteProfile?.updated_at ?? metadata.lastSuccessfulAt;
    assertReconciliationActive(input);
    input.metadataStore.save({
      schemaVersion: ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
      userId,
      lastSyncedFingerprint: localFingerprint,
      lastRemoteUpdatedAt: remoteProfile?.updated_at ?? null,
      lastSuccessfulAt: lastSyncedAt,
    });
    addBreadcrumb('online profile reconciliation completed', { status: 'synced' });
    return {
      status: 'synced',
      lastSyncedAt,
      error: null,
      profile: remoteProfile,
    };
  } catch (error) {
    if (error instanceof OnlineProfileReconciliationCancelledError) {
      return SIGNED_OUT_ONLINE_PROFILE_STATE;
    }
    const message = messageFromError(error);
    console.warn(`[online-profile] reconciliation failed: ${message}`);
    addBreadcrumb('online profile reconciliation failed');
    captureError(error, { area: 'online_profile', action: 'reconcile' });
    return {
      status: 'failed',
      lastSyncedAt: null,
      error: message,
    };
  }
}

async function uploadDeviceProfile(
  input: ReconcileOnlineProfileInput,
  userId: string,
  fingerprint: string,
  nowIso: string,
  observedRemoteProfile: BackendProfile | null,
  previousLastSuccessfulAt: string | null,
  deferMetadata = false
): Promise<OnlineProfileReconcileResult> {
  assertReconciliationActive(input);
  const update = preferencesToBackendProfileUpdate(input.localPreferences);
  const profile = await withTimeout(
    observedRemoteProfile
      ? updateCurrentProfileIfUnchanged(update, observedRemoteProfile.updated_at, userId)
      : insertCurrentProfileIfAbsent(update, userId),
    'Online profile save'
  );
  assertReconciliationActive(input);
  if (!profile) {
    // The row changed after reconciliation read it (or appeared after a
    // missing-row read). Re-read atomically and make the race visible instead
    // of silently applying a stale device overwrite.
    const latestProfile = await withTimeout(
      loadRemoteProfile(userId),
      'Online profile conflict read'
    );
    assertReconciliationActive(input);
    const latestPreferences = latestProfile
      ? preferencesFromBackendProfile(latestProfile)
      : null;
    if (
      latestProfile &&
      latestPreferences &&
      onlineProfileFingerprint(latestPreferences) === fingerprint
    ) {
      return recordSuccessfulSync(
        input,
        userId,
        fingerprint,
        latestProfile,
        nowIso,
        'matched_concurrent_write',
        deferMetadata
      );
    }
    return {
      status: 'conflict',
      lastSyncedAt: previousLastSuccessfulAt,
      error: null,
      profile: latestProfile,
    };
  }
  return recordSuccessfulSync(
    input,
    userId,
    fingerprint,
    profile,
    nowIso,
    'uploaded',
    deferMetadata
  );
}

function hydrateOnlineProfile(
  input: ReconcileOnlineProfileInput,
  userId: string,
  remoteProfile: BackendProfile,
  fingerprint: string,
  nowIso: string
): OnlineProfileReconcileResult {
  assertReconciliationActive(input);
  const preferences = mergeRemoteProfileIntoLocal(
    remoteProfile,
    input.localPreferences,
    { hydrateRoutingFields: true, preferRemote: true }
  );
  const lastSyncedAt = remoteProfile.updated_at ?? nowIso;
  let finalized = false;
  return {
    status: 'synced',
    lastSyncedAt,
    error: null,
    preferences,
    profile: remoteProfile,
    finalize: () => {
      if (finalized) return;
      assertReconciliationActive(input);
      input.metadataStore.save({
        schemaVersion: ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
        userId,
        lastSyncedFingerprint: fingerprint,
        lastRemoteUpdatedAt: remoteProfile.updated_at ?? null,
        lastSuccessfulAt: lastSyncedAt,
      });
      finalized = true;
      addBreadcrumb('online profile reconciliation completed', { status: 'hydrated' });
    },
  };
}

function recordSuccessfulSync(
  input: ReconcileOnlineProfileInput,
  userId: string,
  fingerprint: string,
  profile: BackendProfile,
  nowIso: string,
  breadcrumbStatus: string,
  deferMetadata = false
): OnlineProfileReconcileResult {
  const lastSyncedAt = profile.updated_at ?? nowIso;
  let finalized = false;
  const finalize = () => {
    if (finalized) return;
    assertReconciliationActive(input);
    input.metadataStore.save({
      schemaVersion: ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
      userId,
      lastSyncedFingerprint: fingerprint,
      lastRemoteUpdatedAt: profile.updated_at ?? null,
      lastSuccessfulAt: lastSyncedAt,
    });
    finalized = true;
    addBreadcrumb('online profile reconciliation completed', { status: breadcrumbStatus });
  };
  const result: OnlineProfileReconcileResult = {
    status: 'synced',
    lastSyncedAt,
    error: null,
    profile,
  };
  if (deferMetadata) return { ...result, finalize };
  finalize();
  return result;
}

class OnlineProfileReconciliationCancelledError extends Error {}

function assertReconciliationActive(input: ReconcileOnlineProfileInput): void {
  if (input.shouldContinue && !input.shouldContinue()) {
    throw new OnlineProfileReconciliationCancelledError('Online profile reconciliation cancelled.');
  }
}

function hasSyncedPayload(
  profile: BackendProfile | null,
  preferences: Preferences | null
): boolean {
  if (!profile || !preferences) return false;
  const profileJson = asObject(profile.profile_json);
  const preferencesJson = asObject(profile.preferences_json);
  const legacyJson = asObject(profile.onboarding_json);
  const hasVersionedEnvelope = (
    Object.keys(profileJson).length > 0 ||
    Object.keys(preferencesJson).length > 0 ||
    Object.keys(legacyJson).length > 0
  );
  if (!hasVersionedEnvelope) return false;

  // The database signup trigger creates a fully shaped row so RLS/profile
  // reads work immediately, but that row is not yet a device sync. Treat the
  // untouched default envelope as a stub even when the provider supplied a
  // display name; guest data can then be adopted without a false conflict,
  // while the provider name is still merged into an otherwise-empty device.
  const defaults = defaultPreferences();
  const untouchedSignupEnvelope =
    profile.updated_at === profile.created_at &&
    preferences.profile.dateOfBirth === null &&
    preferences.profile.referenceSex === null &&
    preferences.profile.lifeGoal === null &&
    preferences.settings.voiceId === defaults.settings.voiceId &&
    preferences.settings.comparisonOptIn === defaults.settings.comparisonOptIn;
  return !untouchedSignupEnvelope;
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${label} timed out. Your device copy is unchanged.`)),
      ONLINE_PROFILE_REQUEST_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
