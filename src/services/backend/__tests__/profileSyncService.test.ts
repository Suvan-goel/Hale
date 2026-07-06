/**
 * Profile sync is IDENTITY AND SETTINGS ONLY (2026-07-06 ruling: health data
 * local-only, app-wide). These tests pin both directions: uploads carry no
 * health fields, and hydration/merge never consumes them from remote — even
 * from a legacy pre-ruling row that still has them.
 */

import { defaultPreferences, type Preferences } from '../../../profile';
import type { MovementSafetyProfile } from '../../../adherence';
import type { BackendJson, BackendProfile } from '../types';
import {
  mergeRemoteProfileIntoLocal,
  preferencesToBackendProfileUpdate,
} from '../profileSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const START = '2026-06-21T08:00:00.000Z';

function safety(): MovementSafetyProfile {
  return {
    id: 'safety',
    userId: 'local-device-user',
    availableEquipment: ['chair'],
    equipmentStatus: 'confirmed',
    equipmentRevision: 1,
    equipmentUpdatedAt: START,
    hasCurrentPain: true,
    painNotes: 'left knee twinges',
    createdAt: START,
    updatedAt: START,
  };
}

function healthyLocalPrefs(): Preferences {
  const prefs = defaultPreferences();
  return {
    ...prefs,
    profile: {
      ...prefs.profile,
      name: 'Ada',
      menopauseStage: 'perimenopausal',
      symptomPicture: { kind: 'selected', symptoms: ['sleep_disruption'] },
      safetyProfile: safety(),
    },
  };
}

function remoteProfileRow(extra: Record<string, unknown> = {}): BackendProfile {
  const base = {
    id: 'user-123',
    local_user_id: 'local-device-user',
    full_name: 'Remote Ada',
    birth_year: null,
    sex: null,
    profile_json: backendJson({
      schemaVersion: 4,
      name: 'Remote Ada',
      age: null,
      goal: '',
    }),
    onboarding_json: backendJson({
      schemaVersion: 4,
      onboarding: defaultPreferences().onboarding,
      lifeGoal: null,
    }),
    preferences_json: backendJson({
      schemaVersion: 4,
      settings: defaultPreferences().settings,
    }),
    onboarding_completed_at: null,
    created_at: START,
    updated_at: START,
    ...extra,
  };
  return base as unknown as BackendProfile;
}

function backendJson(value: unknown): BackendJson {
  return JSON.parse(JSON.stringify(value)) as BackendJson;
}

describe('upload shape: no health data ever leaves the device', () => {
  it('builds an update with no safety payload and no health tokens', () => {
    const update = preferencesToBackendProfileUpdate(healthyLocalPrefs());

    expect('safety_json' in update).toBe(false);
    const serialized = JSON.stringify(update);
    for (const token of [
      'safetyProfile',
      'menopauseStage',
      'symptomPicture',
      'hasCurrentPain',
      'painNotes',
      'left knee twinges',
      'perimenopausal',
      'sleep_disruption',
    ]) {
      expect({ token, present: serialized.includes(token) }).toEqual({ token, present: false });
    }
  });

  it('still syncs identity fields (date of birth, birth year, sex)', () => {
    const localPrefs = healthyLocalPrefs();
    localPrefs.profile.dateOfBirth = '1968-07-01';
    localPrefs.profile.exactAge = 57;
    localPrefs.profile.referenceSex = 'female';
    localPrefs.profile.age = 57;
    localPrefs.profile.ageBand = '55_64';

    const update = preferencesToBackendProfileUpdate(localPrefs);
    const profileJson = update.profile_json as unknown as { dateOfBirth: string };

    expect(update.birth_year).toBe(1968);
    expect(update.sex).toBe('female');
    expect(profileJson.dateOfBirth).toBe('1968-07-01');
  });
});

describe('merge/hydration: health fields never arrive from remote', () => {
  it('keeps local health fields untouched and ignores a legacy remote safety_json row', () => {
    const localPrefs = healthyLocalPrefs();
    const merged = mergeRemoteProfileIntoLocal(
      remoteProfileRow({
        safety_json: backendJson({
          schemaVersion: 4,
          safetyProfile: { ...safety(), id: 'safety-remote', painNotes: 'remote-only note' },
        }),
      }),
      localPrefs,
      { hydrateRoutingFields: true }
    );

    expect(merged.profile.safetyProfile).toEqual(localPrefs.profile.safetyProfile);
    expect(merged.profile.menopauseStage).toBe('perimenopausal');
    expect(JSON.stringify(merged)).not.toContain('remote-only note');
  });

  it('leaves absent local health fields absent even when a legacy row offers them', () => {
    const merged = mergeRemoteProfileIntoLocal(
      remoteProfileRow({
        profile_json: backendJson({
          schemaVersion: 4,
          name: 'Remote Ada',
          age: null,
          goal: '',
          menopauseStage: 'postmenopausal',
          symptomPicture: { kind: 'selected', symptoms: ['hot_flushes'] },
        }),
        safety_json: backendJson({ schemaVersion: 4, safetyProfile: safety() }),
      }),
      defaultPreferences(),
      { hydrateRoutingFields: true }
    );

    expect(merged.profile.safetyProfile).toBeNull();
    expect(merged.profile.menopauseStage).toBeNull();
    expect(merged.profile.symptomPicture).toBeNull();
    // Non-health hydration still works.
    expect(merged.profile.name).toBe('Remote Ada');
  });
});
