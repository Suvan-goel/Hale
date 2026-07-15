/**
 * Profile preferences sync — IDENTITY AND SETTINGS ONLY.
 *
 * 2026-07-06 ruling (health data local-only, app-wide): the safety profile,
 * menopause stage, and symptom picture are UK GDPR special-category data and
 * never leave the device — not uploaded, not hydrated from remote, not merged.
 * The legacy safety_json payload (which carried the safety profile, and with
 * it equipment/movement-capability sync) was removed under this ruling;
 * equipment re-confirms locally on a new device via the existing fail-closed
 * confirmation flow. Pinned by healthDataLocalOnly.test.ts. Sync of health
 * data, if ever wanted, is its own feature behind its own special-category
 * consent + encryption review.
 */

import {
  LIFE_GOAL_CATEGORIES,
  createLifeGoal,
} from '../../adherence/goalDomainMapping';
import {
  PREFERENCES_SCHEMA_VERSION,
  ageBandForAge,
  ageFromDateOfBirth,
  birthYearFromDateOfBirth,
  defaultPreferences,
  deserializePreferences,
  getVoice,
  type Preferences,
} from '../../profile';
import { getCurrentProfile } from './profileService';
import type { BackendJson, BackendProfile, BackendProfileUpdate } from './types';

type JsonObject = Record<string, unknown>;

export const ONLINE_PROFILE_SCHEMA_VERSION = 1;

/** Exact, versioned allowlist for values that may leave the device. */
export interface OnlineProfileProjection {
  schemaVersion: typeof ONLINE_PROFILE_SCHEMA_VERSION;
  name: string;
  dateOfBirth: string | null;
  referenceSex: Preferences['profile']['referenceSex'];
  lifeGoal: {
    category: NonNullable<Preferences['profile']['lifeGoal']>['category'];
    isPrimary: boolean;
  } | null;
  settings: {
    voiceId: string;
    comparisonOptIn: boolean;
  };
}

export async function loadRemoteProfile(expectedUserId?: string): Promise<BackendProfile | null> {
  return getCurrentProfile(expectedUserId);
}

export function preferencesToBackendProfileUpdate(prefs: Preferences): BackendProfileUpdate {
  const fullName = prefs.profile.name.trim();
  const birthYear = birthYearFromDateOfBirth(prefs.profile.dateOfBirth);
  const projection = onlineProfileProjection(prefs);

  return {
    local_user_id: null,
    full_name: fullName || null,
    birth_year: birthYear,
    sex: prefs.profile.referenceSex,
    profile_json: toBackendJson({
      schemaVersion: projection.schemaVersion,
      name: projection.name,
      dateOfBirth: projection.dateOfBirth,
      referenceSex: projection.referenceSex,
      lifeGoal: projection.lifeGoal,
    }),
    onboarding_json: toBackendJson({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
    }),
    preferences_json: toBackendJson({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
      settings: projection.settings,
    }),
    onboarding_completed_at: null,
  };
}

export function onlineProfileProjection(prefs: Preferences): OnlineProfileProjection {
  return {
    schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
    name: prefs.profile.name.trim(),
    dateOfBirth: prefs.profile.dateOfBirth,
    referenceSex: prefs.profile.referenceSex,
    lifeGoal: prefs.profile.lifeGoal
      ? {
          category: prefs.profile.lifeGoal.category,
          isPrimary: prefs.profile.lifeGoal.isPrimary,
        }
      : null,
    settings: {
      voiceId: getVoice(prefs.settings.voiceId).id,
      comparisonOptIn: prefs.settings.comparisonOptIn,
    },
  };
}

export function onlineProfileFingerprint(prefs: Preferences): string {
  return stableHash(JSON.stringify(onlineProfileProjection(prefs)));
}

export function hasMeaningfulOnlineProfile(prefs: Preferences): boolean {
  return onlineProfileFingerprint(prefs) !== onlineProfileFingerprint(defaultPreferences());
}

export function mergeRemoteProfileIntoLocal(
  remoteProfile: BackendProfile | null,
  localPrefs: Preferences,
  options: { hydrateRoutingFields?: boolean; preferRemote?: boolean } = {}
): Preferences {
  if (!remoteProfile) return localPrefs;
  const remotePrefs = preferencesFromBackendProfile(remoteProfile);
  if (!remotePrefs) return localPrefs;

  const hydrateRoutingFields = options.hydrateRoutingFields === true;
  const preferRemote = options.preferRemote === true;
  const dateOfBirth = preferRemote
    ? remotePrefs.profile.dateOfBirth
    : localPrefs.profile.dateOfBirth ?? remotePrefs.profile.dateOfBirth;
  const derivedAge = ageFromDateOfBirth(dateOfBirth);
  const exactAge = derivedAge ?? (preferRemote
    ? remotePrefs.profile.exactAge
    : localPrefs.profile.exactAge ?? remotePrefs.profile.exactAge);
  const remoteName = remotePrefs.profile.name.trim();

  return {
    profile: {
      // Local-first spread: the health fields ride through from local state
      // WITHOUT being named here — hydrating them from remote would require
      // naming them, which the healthDataLocalOnly scan forbids. Only
      // identity/routing fields below are remote-aware.
      ...localPrefs.profile,
      name: preferRemote
        ? remoteName
        : hasText(localPrefs.profile.name) ? localPrefs.profile.name : remoteName,
      dateOfBirth,
      exactAge,
      referenceSex: preferRemote
        ? remotePrefs.profile.referenceSex
        : localPrefs.profile.referenceSex ?? remotePrefs.profile.referenceSex,
      age: derivedAge ?? (preferRemote
        ? remotePrefs.profile.age
        : localPrefs.profile.age ?? remotePrefs.profile.age),
      ageBand:
        derivedAge !== null
          ? ageBandForAge(derivedAge)
          : preferRemote
            ? remotePrefs.profile.ageBand ?? ageBandForAge(exactAge)
            : localPrefs.profile.ageBand ?? remotePrefs.profile.ageBand ?? ageBandForAge(exactAge),
      // The retired free-text goal stays device-only because old values may
      // contain health information. Only the predefined LifeGoal category is
      // eligible for the online projection.
      goal: localPrefs.profile.goal,
      lifeGoal: hydrateRoutingFields
        ? preferRemote
          ? remotePrefs.profile.lifeGoal
          : localPrefs.profile.lifeGoal ?? remotePrefs.profile.lifeGoal
        : localPrefs.profile.lifeGoal,
    },
    settings: {
      ...localPrefs.settings,
      voiceId: getVoice(
        preferRemote ? remotePrefs.settings.voiceId : localPrefs.settings.voiceId
      ).id,
      comparisonOptIn: preferRemote
        ? remotePrefs.settings.comparisonOptIn
        : localPrefs.settings.comparisonOptIn,
    },
    onboarding: localPrefs.onboarding,
  };
}

export function preferencesFromBackendProfile(remoteProfile: BackendProfile): Preferences | null {
  const profileJson = asObject(remoteProfile.profile_json);
  const onboardingJson = asObject(remoteProfile.onboarding_json);
  const preferencesJson = asObject(remoteProfile.preferences_json);
  const jsonName = stringValue(profileJson.name);
  const profile = {
    name: jsonName && jsonName.trim().length > 0
      ? jsonName
      : remoteProfile.full_name ?? '',
    dateOfBirth: stringValue(profileJson.dateOfBirth),
    exactAge: numberValue(profileJson.exactAge) ?? numberValue(profileJson.age) ?? ageFromBirthYear(remoteProfile.birth_year),
    referenceSex: profileJson.referenceSex ?? remoteProfile.sex,
    age: numberValue(profileJson.age) ?? ageFromBirthYear(remoteProfile.birth_year),
    ageBand: profileJson.ageBand ?? null,
    goal: '',
    lifeGoal: lifeGoalFromBackend(
      profileJson.lifeGoal ?? onboardingJson.lifeGoal,
      remoteProfile.updated_at
    ),
    // Health fields deliberately absent: remote rows carry none (the legacy
    // safety column is never read), and the defensive parser defaults them.
  };

  const remoteSettings = asObject(preferencesJson.settings);
  const settings = {
    ...defaultPreferences().settings,
    voiceId: remoteSettings.voiceId,
    comparisonOptIn: remoteSettings.comparisonOptIn,
  };
  const raw = {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    profile,
    settings,
    onboarding: defaultPreferences().onboarding,
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

function lifeGoalFromBackend(value: unknown, updatedAt: string): Preferences['profile']['lifeGoal'] {
  const object = asObject(value);
  const category = stringValue(object.category);
  if (!category || !LIFE_GOAL_CATEGORIES.includes(category as NonNullable<Preferences['profile']['lifeGoal']>['category'])) {
    return null;
  }

  const legacyId = stringValue(object.id);
  const legacyUserId = stringValue(object.userId);
  const legacyCreatedAt = stringValue(object.createdAt);
  const legacyUpdatedAt = stringValue(object.updatedAt);
  if (legacyId && legacyUserId && legacyCreatedAt && legacyUpdatedAt) {
    return {
      id: legacyId,
      userId: legacyUserId,
      category: category as NonNullable<Preferences['profile']['lifeGoal']>['category'],
      createdAt: legacyCreatedAt,
      updatedAt: legacyUpdatedAt,
      isPrimary: object.isPrimary !== false,
    };
  }

  return {
    ...createLifeGoal({
      category: category as NonNullable<Preferences['profile']['lifeGoal']>['category'],
      nowIso: updatedAt,
    }),
    isPrimary: object.isPrimary !== false,
  };
}

function ageFromBirthYear(birthYear: number | null): number | null {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear;
  return age > 0 && age < 120 ? age : null;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
