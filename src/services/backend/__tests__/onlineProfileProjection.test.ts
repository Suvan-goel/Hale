import type { MovementSafetyProfile } from '../../../adherence';
import { defaultPreferences, type Preferences } from '../../../profile';
import {
  ONLINE_PROFILE_SCHEMA_VERSION,
  onlineProfileFingerprint,
  onlineProfileProjection,
  preferencesToBackendProfileUpdate,
} from '../profileSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const CREATED_AT = '2026-07-01T08:00:00.000Z';
const UPDATED_AT = '2026-07-12T08:00:00.000Z';

function localSafetyProfile(): MovementSafetyProfile {
  return {
    id: 'device-safety-profile',
    userId: 'local-device-user',
    age: 56,
    ageBand: '55_64',
    activityLevel: 'lightly_active',
    hasCurrentPain: true,
    painNotes: 'private knee note',
    hasRecentInjury: true,
    injuryNotes: 'private injury note',
    availableEquipment: ['chair'],
    equipmentStatus: 'confirmed',
    equipmentRevision: 3,
    equipmentUpdatedAt: UPDATED_AT,
    preferredWorkoutDays: ['mon', 'thu'],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
}

function fullPreferences(): Preferences {
  const defaults = defaultPreferences();
  return {
    profile: {
      ...defaults.profile,
      name: '  Ada Lovelace  ',
      dateOfBirth: '1969-05-04',
      exactAge: 57,
      referenceSex: 'female',
      menopauseStage: 'perimenopausal',
      symptomPicture: { kind: 'selected', symptoms: ['brain_fog', 'sleep_disruption'] },
      age: 57,
      ageBand: '55_64',
      goal: 'I want to carry shopping with ease',
      lifeGoal: {
        id: 'local-life-goal-id',
        userId: 'local-device-user',
        category: 'bend_reach_carry',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        isPrimary: true,
      },
      safetyProfile: localSafetyProfile(),
    },
    settings: {
      voiceId: 'clara',
      comparisonOptIn: true,
      remindersEnabled: true,
      phoneStandAvailable: true,
      voiceSetup: { promptShown: true, safetyLineShown: true },
    },
    onboarding: {
      currentStep: 'complete',
      baselineResultId: 'private-checkup-id',
      completedAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
  };
}

describe('online profile projection allowlist', () => {
  it('projects exactly the approved online values and no device-only fields', () => {
    const projection = onlineProfileProjection(fullPreferences());

    expect(projection).toStrictEqual({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
      name: 'Ada Lovelace',
      dateOfBirth: '1969-05-04',
      referenceSex: 'female',
      lifeGoal: {
        category: 'bend_reach_carry',
        isPrimary: true,
      },
      settings: {
        voiceId: 'clara',
        comparisonOptIn: true,
      },
    });

    expect(Object.keys(projection)).toEqual([
      'schemaVersion',
      'name',
      'dateOfBirth',
      'referenceSex',
      'lifeGoal',
      'settings',
    ]);
    expect(Object.keys(projection.settings)).toEqual(['voiceId', 'comparisonOptIn']);

    const serialized = JSON.stringify(projection);
    for (const localOnlyValue of [
      'menopauseStage',
      'perimenopausal',
      'symptomPicture',
      'brain_fog',
      'safetyProfile',
      'private knee note',
      'private injury note',
      'preferredWorkoutDays',
      'remindersEnabled',
      'phoneStandAvailable',
      'voiceSetup',
      'private-checkup-id',
      'I want to carry shopping with ease',
      'local-life-goal-id',
      'local-device-user',
      CREATED_AT,
      UPDATED_AT,
    ]) {
      expect({ localOnlyValue, present: serialized.includes(localOnlyValue) }).toEqual({
        localOnlyValue,
        present: false,
      });
    }
  });

  it('writes the same exact allowlist to backend JSON', () => {
    const update = preferencesToBackendProfileUpdate(fullPreferences());

    expect(update.profile_json).toStrictEqual({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
      name: 'Ada Lovelace',
      dateOfBirth: '1969-05-04',
      referenceSex: 'female',
      lifeGoal: {
        category: 'bend_reach_carry',
        isPrimary: true,
      },
    });
    expect(update.preferences_json).toStrictEqual({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
      settings: {
        voiceId: 'clara',
        comparisonOptIn: true,
      },
    });
    expect(update.onboarding_json).toStrictEqual({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
    });
  });

  it('sends explicit nulls when online profile values are cleared', () => {
    const cleared = defaultPreferences();
    const update = preferencesToBackendProfileUpdate(cleared);

    expect(update).toEqual(
      expect.objectContaining({
        full_name: null,
        local_user_id: null,
        birth_year: null,
        sex: null,
        onboarding_completed_at: null,
      })
    );
    expect(update.profile_json).toStrictEqual({
      schemaVersion: ONLINE_PROFILE_SCHEMA_VERSION,
      name: '',
      dateOfBirth: null,
      referenceSex: null,
      lifeGoal: null,
    });
  });

  it('fingerprints only the approved projection, including explicit clears', () => {
    const original = fullPreferences();
    const deviceOnlyChanged: Preferences = {
      ...original,
      profile: {
        ...original.profile,
        exactAge: 99,
        age: 99,
        ageBand: '75_plus',
        menopauseStage: 'postmenopausal',
        symptomPicture: { kind: 'selected', symptoms: ['hot_flushes'] },
        safetyProfile: {
          ...localSafetyProfile(),
          painNotes: 'a different private note',
        },
        lifeGoal: original.profile.lifeGoal
          ? {
              ...original.profile.lifeGoal,
              id: 'new-local-id',
              userId: 'another-local-owner',
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2026-12-01T00:00:00.000Z',
            }
          : null,
      },
      settings: {
        ...original.settings,
        remindersEnabled: false,
        phoneStandAvailable: false,
        voiceSetup: { promptShown: false, safetyLineShown: false },
      },
      onboarding: defaultPreferences().onboarding,
    };

    expect(onlineProfileFingerprint(deviceOnlyChanged)).toBe(
      onlineProfileFingerprint(original)
    );

    const clearedReferenceSex: Preferences = {
      ...original,
      profile: { ...original.profile, referenceSex: null },
    };
    expect(onlineProfileFingerprint(clearedReferenceSex)).not.toBe(
      onlineProfileFingerprint(original)
    );
    expect(onlineProfileProjection(clearedReferenceSex).referenceSex).toBeNull();
  });
});
