import { LOCAL_USER_ID } from '../../adherence/types';
import {
  PREFERENCES_SCHEMA_VERSION,
  defaultPreferences,
  deserializePreferences,
  type Preferences,
} from '../../profile';
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
  const onboardingCompletedAt =
    prefs.onboarding.completedAt ?? (prefs.onboarding.currentStep === 'complete' ? prefs.onboarding.updatedAt : null);

  return {
    local_user_id: LOCAL_USER_ID,
    ...(fullName ? { full_name: fullName } : {}),
    profile_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      name: prefs.profile.name,
      age: prefs.profile.age,
      goal: prefs.profile.goal,
    }),
    onboarding_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      onboarding: prefs.onboarding,
      lifeGoal: prefs.profile.lifeGoal,
    }),
    safety_json: toBackendJson({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      safetyProfile: prefs.profile.safetyProfile,
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

  return {
    profile: {
      name: hasText(localPrefs.profile.name) ? localPrefs.profile.name : remotePrefs.profile.name,
      age: localPrefs.profile.age ?? remotePrefs.profile.age,
      goal: hasText(localPrefs.profile.goal) ? localPrefs.profile.goal : remotePrefs.profile.goal,
      lifeGoal:
        localPrefs.profile.lifeGoal ??
        (hydrateRoutingFields ? remotePrefs.profile.lifeGoal : localPrefs.profile.lifeGoal),
      safetyProfile:
        localPrefs.profile.safetyProfile ??
        (hydrateRoutingFields ? remotePrefs.profile.safetyProfile : localPrefs.profile.safetyProfile),
    },
    settings: sameJson(localPrefs.settings, defaults.settings) ? remotePrefs.settings : localPrefs.settings,
    onboarding:
      hydrateRoutingFields && sameJson(localPrefs.onboarding, defaults.onboarding)
        ? remotePrefs.onboarding
        : localPrefs.onboarding,
  };
}

export async function syncLocalPreferencesToRemote(
  localPrefs: Preferences,
  options: ProfileSyncOptions = {}
): Promise<ProfileSyncResult> {
  try {
    const session = await getCurrentSession();
    if (!session) return { status: 'signed_out' };

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
        return { status: 'hydrated', profile, preferences: hydratedPrefs };
      }
    }

    return { status: 'synced', profile };
  } catch (error) {
    console.warn('[profile-sync] Supabase profile sync failed', error);
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
    age: numberValue(profileJson.age) ?? ageFromBirthYear(remoteProfile.birth_year),
    goal: stringValue(profileJson.goal) ?? '',
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
