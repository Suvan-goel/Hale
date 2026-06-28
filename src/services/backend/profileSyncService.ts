import { LOCAL_USER_ID } from '../../adherence/types';
import { normalizeLifeGoalDisplayText } from '../../adherence/goalDomainMapping';
import {
  PREFERENCES_SCHEMA_VERSION,
  ageBandForAge,
  ageFromDateOfBirth,
  birthYearFromDateOfBirth,
  canonicalEquipmentFromSafetyProfile,
  canonicalEquipmentToAvailableEquipment,
  defaultPreferences,
  deserializePreferences,
  movementCapabilitiesFromSafetyProfile,
  movementCapabilityProfileForPersistence,
  resolveCanonicalEquipmentRecords,
  resolveMovementCapabilityRecords,
  type Preferences,
} from '../../profile';
import type { MovementSafetyProfile } from '../../adherence';
import { addBreadcrumb } from '../observability/sentry';
import { getCurrentSession } from './authService';
import { getCurrentProfile, upsertCurrentProfile } from './profileService';
import type { BackendJson, BackendProfile, BackendProfileUpdate } from './types';

type JsonObject = Record<string, unknown>;

export type ProfileSyncStatus = 'signed_out' | 'synced' | 'hydrated' | 'failed';

export interface ProfileSyncResult {
  status: ProfileSyncStatus;
  profile?: BackendProfile | null;
  preferences?: Preferences;
  error?: unknown;
}

export interface ProfileSyncOptions {
  hydrateLocalFromRemote?: boolean;
  hydrateRoutingFields?: boolean;
}

export async function loadRemoteProfile(): Promise<BackendProfile | null> {
  return getCurrentProfile();
}

export function preferencesToBackendProfileUpdate(prefs: Preferences): BackendProfileUpdate {
  const fullName = prefs.profile.name.trim();
  const birthYear = birthYearFromDateOfBirth(prefs.profile.dateOfBirth);
  const onboardingCompletedAt =
    prefs.onboarding.completedAt ?? (prefs.onboarding.currentStep === 'complete' ? prefs.onboarding.updatedAt : null);

  return {
    local_user_id: LOCAL_USER_ID,
    ...(fullName ? { full_name: fullName } : {}),
    ...(birthYear !== null ? { birth_year: birthYear } : {}),
    ...(prefs.profile.referenceSex ? { sex: prefs.profile.referenceSex } : {}),
    profile_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      name: prefs.profile.name,
      dateOfBirth: prefs.profile.dateOfBirth,
      exactAge: prefs.profile.exactAge,
      referenceSex: prefs.profile.referenceSex,
      age: prefs.profile.age,
      ageBand: prefs.profile.ageBand,
      goal: normalizeLifeGoalDisplayText(prefs.profile.goal),
    }),
    onboarding_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      onboarding: prefs.onboarding,
      lifeGoal: prefs.profile.lifeGoal,
    }),
    safety_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      safetyProfile: normalizedSafetyProfile(prefs.profile.safetyProfile, 'local_user'),
    }),
    preferences_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      settings: prefs.settings,
    }),
    ...(onboardingCompletedAt ? { onboarding_completed_at: onboardingCompletedAt } : {}),
  };
}

export function mergeRemoteProfileIntoLocal(
  remoteProfile: BackendProfile | null,
  localPrefs: Preferences,
  options: { hydrateRoutingFields?: boolean } = {}
): Preferences {
  if (!remoteProfile) return localPrefs;
  const remotePrefs = preferencesFromBackendProfile(remoteProfile);
  if (!remotePrefs) return localPrefs;

  const defaults = defaultPreferences();
  const hydrateRoutingFields = options.hydrateRoutingFields === true;
  const dateOfBirth = localPrefs.profile.dateOfBirth ?? remotePrefs.profile.dateOfBirth;
  const derivedAge = ageFromDateOfBirth(dateOfBirth);
  const exactAge = derivedAge ?? localPrefs.profile.exactAge ?? remotePrefs.profile.exactAge;

  return {
    profile: {
      name: hasText(localPrefs.profile.name) ? localPrefs.profile.name : remotePrefs.profile.name,
      dateOfBirth,
      exactAge,
      referenceSex: localPrefs.profile.referenceSex ?? remotePrefs.profile.referenceSex,
      age: derivedAge ?? localPrefs.profile.age ?? remotePrefs.profile.age,
      ageBand:
        derivedAge !== null
          ? ageBandForAge(derivedAge)
          : localPrefs.profile.ageBand ?? remotePrefs.profile.ageBand ?? ageBandForAge(exactAge),
      goal: normalizeLifeGoalDisplayText(
        hasText(localPrefs.profile.goal) ? localPrefs.profile.goal : remotePrefs.profile.goal
      ),
      lifeGoal:
        localPrefs.profile.lifeGoal ??
        (hydrateRoutingFields ? remotePrefs.profile.lifeGoal : localPrefs.profile.lifeGoal),
      safetyProfile: resolveSafetyProfileForMerge({
        local: localPrefs.profile.safetyProfile,
        remote: remotePrefs.profile.safetyProfile,
        hydrateRoutingFields,
      }),
    },
    settings: sameJson(localPrefs.settings, defaults.settings) ? remotePrefs.settings : localPrefs.settings,
    onboarding:
      hydrateRoutingFields && sameJson(localPrefs.onboarding, defaults.onboarding)
        ? remotePrefs.onboarding
        : localPrefs.onboarding,
  };
}

function resolveSafetyProfileForMerge({
  local,
  remote,
  hydrateRoutingFields,
}: {
  local: MovementSafetyProfile | null;
  remote: MovementSafetyProfile | null;
  hydrateRoutingFields: boolean;
}): MovementSafetyProfile | null {
  if (!hydrateRoutingFields) return local;
  if (!local && !remote) return null;
  if (!local) return normalizedSafetyProfile(remote, 'remote_profile');
  if (!remote) return normalizedSafetyProfile(local, 'local_user');

  const resolved = resolveCanonicalEquipmentRecords({
    local: canonicalEquipmentFromSafetyProfile(local, 'local_user'),
    remote: canonicalEquipmentFromSafetyProfile(remote, 'remote_profile'),
  });
  const resolvedCapabilities = resolveMovementCapabilityRecords({
    local: movementCapabilitiesFromSafetyProfile(local, 'local_user'),
    remote: movementCapabilitiesFromSafetyProfile(remote, 'remote_profile'),
  });
  const selectedBase = resolved.profile.source === 'remote_profile' ? remote : local;
  const selectedCapabilityBase = resolvedCapabilities.profile.source === 'remote_profile' ? remote : local;
  const normalized = {
    ...selectedBase,
    availableEquipment: canonicalEquipmentToAvailableEquipment(resolved.profile),
    equipmentStatus: resolved.profile.status,
    equipmentRevision: resolved.profile.revision,
    equipmentUpdatedAt: resolved.profile.updatedAt ?? selectedBase.equipmentUpdatedAt ?? selectedBase.updatedAt,
    movementCapabilities: movementCapabilityProfileForPersistence(resolvedCapabilities.profile, {
      source: resolvedCapabilities.profile.source,
      revision: resolvedCapabilities.profile.revision,
      updatedAt:
        resolvedCapabilities.profile.updatedAt ??
        selectedCapabilityBase.movementCapabilities?.updatedAt ??
        selectedCapabilityBase.updatedAt,
    }),
    updatedAt: resolved.profile.updatedAt ?? selectedBase.updatedAt,
  };

  for (const diagnostic of resolved.diagnostics) {
    if (diagnostic.reason.startsWith('equipment_conflict')) {
      addBreadcrumb('profile equipment conflict resolved', {
        category: 'profile_preferences',
        reason: diagnostic.reason,
        localUpdatedAt: diagnostic.localUpdatedAt,
        remoteUpdatedAt: diagnostic.remoteUpdatedAt,
        localRevision: diagnostic.localRevision,
        remoteRevision: diagnostic.remoteRevision,
      });
    }
  }
  for (const diagnostic of resolvedCapabilities.diagnostics) {
    if (diagnostic.reason.startsWith('movement_capability_conflict')) {
      addBreadcrumb('profile movement capability conflict resolved', {
        category: 'profile_preferences',
        reason: diagnostic.reason,
        localUpdatedAt: diagnostic.localUpdatedAt,
        remoteUpdatedAt: diagnostic.remoteUpdatedAt,
        localRevision: diagnostic.localRevision,
        remoteRevision: diagnostic.remoteRevision,
      });
    }
  }

  return normalized;
}

function normalizedSafetyProfile(
  safetyProfile: MovementSafetyProfile | null,
  source: 'local_user' | 'remote_profile'
): MovementSafetyProfile | null {
  if (!safetyProfile) return null;
  const canonical = canonicalEquipmentFromSafetyProfile(safetyProfile, source);
  const movementCapabilities = movementCapabilitiesFromSafetyProfile(safetyProfile, source);
  return {
    ...safetyProfile,
    availableEquipment: canonicalEquipmentToAvailableEquipment(canonical),
    equipmentStatus: canonical.status,
    equipmentRevision: canonical.revision,
    equipmentUpdatedAt: canonical.updatedAt ?? safetyProfile.equipmentUpdatedAt ?? safetyProfile.updatedAt,
    movementCapabilities: movementCapabilityProfileForPersistence(movementCapabilities, {
      source: movementCapabilities.source,
      revision: movementCapabilities.revision,
      updatedAt:
        movementCapabilities.updatedAt ??
        safetyProfile.movementCapabilities?.updatedAt ??
        safetyProfile.updatedAt,
    }),
  };
}

export async function syncLocalPreferencesToRemote(
  localPrefs: Preferences,
  options: ProfileSyncOptions = {}
): Promise<ProfileSyncResult> {
  try {
    const session = await getCurrentSession();
    if (!session) return { status: 'signed_out' };

    addBreadcrumb('sync category started', { category: 'profile_preferences' });
    const remoteProfile = await loadRemoteProfile();
    const remoteAwarePrefs = mergeRemoteProfileIntoLocal(remoteProfile, localPrefs, {
      hydrateRoutingFields: true,
    });
    const profile = await upsertCurrentProfile(preferencesToBackendProfileUpdate(remoteAwarePrefs));

    if (options.hydrateLocalFromRemote && remoteProfile) {
      const hydratedPrefs = mergeRemoteProfileIntoLocal(remoteProfile, localPrefs, {
        hydrateRoutingFields: options.hydrateRoutingFields === true,
      });
      if (!sameJson(hydratedPrefs, localPrefs)) {
        addBreadcrumb('sync category completed', {
          category: 'profile_preferences',
          status: 'hydrated',
        });
        return { status: 'hydrated', profile, preferences: hydratedPrefs };
      }
    }

    addBreadcrumb('sync category succeeded', { category: 'profile_preferences' });
    return { status: 'synced', profile };
  } catch (error) {
    console.warn('[profile-sync] Supabase profile sync failed', error);
    addBreadcrumb('sync category failed', { category: 'profile_preferences' });
    return { status: 'failed', error };
  }
}

export const syncLocalProfileToRemote = syncLocalPreferencesToRemote;

function preferencesFromBackendProfile(remoteProfile: BackendProfile): Preferences | null {
  const profileJson = asObject(remoteProfile.profile_json);
  const onboardingJson = asObject(remoteProfile.onboarding_json);
  const safetyJson = asObject(remoteProfile.safety_json);
  const preferencesJson = asObject(remoteProfile.preferences_json);
  const onboarding = asObject(onboardingJson.onboarding);
  const profile = {
    name: stringValue(profileJson.name) ?? remoteProfile.full_name ?? '',
    dateOfBirth: stringValue(profileJson.dateOfBirth),
    exactAge: numberValue(profileJson.exactAge) ?? numberValue(profileJson.age) ?? ageFromBirthYear(remoteProfile.birth_year),
    referenceSex: profileJson.referenceSex ?? remoteProfile.sex,
    age: numberValue(profileJson.age) ?? ageFromBirthYear(remoteProfile.birth_year),
    ageBand: profileJson.ageBand ?? null,
    goal: normalizeLifeGoalDisplayText(stringValue(profileJson.goal) ?? ''),
    lifeGoal: onboardingJson.lifeGoal ?? null,
    safetyProfile: safetyJson.safetyProfile ?? null,
  };

  const settings = asObject(preferencesJson.settings);
  const raw = {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    profile,
    settings,
    onboarding: Object.keys(onboarding).length > 0 ? onboarding : defaultPreferences().onboarding,
  };

  return deserializePreferences(JSON.stringify(raw));
}

function toBackendJson(value: unknown): BackendJson {
  return JSON.parse(JSON.stringify(value)) as BackendJson;
}

function asObject(value: unknown): JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function ageFromBirthYear(birthYear: number | null): number | null {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear;
  return age > 0 && age < 120 ? age : null;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
