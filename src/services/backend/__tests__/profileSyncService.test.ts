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

function safety(
  availableEquipment: MovementSafetyProfile['availableEquipment'],
  overrides: Partial<MovementSafetyProfile> = {}
): MovementSafetyProfile {
  return {
    id: 'safety',
    userId: 'local-device-user',
    availableEquipment,
    equipmentStatus: 'confirmed',
    equipmentRevision: 1,
    equipmentUpdatedAt: START,
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function prefs(safetyProfile: MovementSafetyProfile | null): Preferences {
  return {
    ...defaultPreferences(),
    profile: {
      ...defaultPreferences().profile,
      safetyProfile,
    },
  };
}

function remoteProfile(safetyProfile: MovementSafetyProfile | null): BackendProfile {
  return {
    id: 'user-123',
    local_user_id: 'local-device-user',
    full_name: null,
    birth_year: null,
    sex: null,
    profile_json: backendJson({
      schemaVersion: 4,
      name: '',
      age: null,
      goal: '',
    }),
    onboarding_json: backendJson({
      schemaVersion: 4,
      onboarding: defaultPreferences().onboarding,
      lifeGoal: null,
    }),
    safety_json: backendJson({
      schemaVersion: 4,
      safetyProfile,
    }),
    preferences_json: backendJson({
      schemaVersion: 4,
      settings: defaultPreferences().settings,
    }),
    onboarding_completed_at: null,
    created_at: START,
    updated_at: START,
  };
}

function backendJson(value: unknown): BackendJson {
  return JSON.parse(JSON.stringify(value)) as BackendJson;
}

function confirmedMovementCapabilities(revision = 1, updatedAt = START): MovementSafetyProfile['movementCapabilities'] {
  return {
    schemaVersion: 1,
    floorTransfer: { status: 'confirmed' },
    stepUpEnvironment: {
      status: 'confirmed',
      lowStableStep: true,
      fixedSupport: true,
      clearDryArea: true,
      phoneOutOfPath: true,
    },
    singleLegBalance: { status: 'confirmed_with_support' },
    revision,
    updatedAt,
  };
}

describe('profile equipment sync merge', () => {
  it('uses newer valid remote canonical equipment during restore hydration', () => {
    const merged = mergeRemoteProfileIntoLocal(
      remoteProfile(safety(['wall'], { equipmentRevision: 3, equipmentUpdatedAt: '2026-06-21T09:00:00.000Z' })),
      prefs(safety(['chair'], { equipmentRevision: 2, equipmentUpdatedAt: '2026-06-21T08:00:00.000Z' })),
      { hydrateRoutingFields: true }
    );

    expect(merged.profile.safetyProfile?.availableEquipment).toEqual(['wall']);
    expect(merged.profile.safetyProfile?.equipmentRevision).toBe(3);
  });

  it('preserves local explicit equipment on equal markers or marker-less conflicts', () => {
    const merged = mergeRemoteProfileIntoLocal(
      remoteProfile(safety(['stairs'], { equipmentRevision: 2 })),
      prefs(safety(['none'], { equipmentRevision: 2 })),
      { hydrateRoutingFields: true }
    );

    expect(merged.profile.safetyProfile?.availableEquipment).toEqual(['none']);
  });

  it('does not hydrate current equipment when routing-field hydration is disabled', () => {
    const merged = mergeRemoteProfileIntoLocal(
      remoteProfile(safety(['wall'], { equipmentRevision: 3 })),
      prefs(safety(['chair'], { equipmentRevision: 2 })),
      { hydrateRoutingFields: false }
    );

    expect(merged.profile.safetyProfile?.availableEquipment).toEqual(['chair']);
  });

  it('syncs canonical equipment metadata through the profile payload', () => {
    const update = preferencesToBackendProfileUpdate(
      prefs(safety(['chair', 'resistance_band'], { equipmentRevision: 5 }))
    );
    const safetyJson = update.safety_json as unknown as { safetyProfile: MovementSafetyProfile };

    expect(safetyJson.safetyProfile.availableEquipment).toEqual(['chair', 'resistance_band']);
    expect(safetyJson.safetyProfile.equipmentStatus).toBe('confirmed');
    expect(safetyJson.safetyProfile.equipmentRevision).toBe(5);
  });

  it('syncs date of birth through profile json and backend birth year', () => {
    const localPrefs = prefs(null);
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

  it('hydrates explicit remote movement capability confirmations over legacy-missing local data', () => {
    const merged = mergeRemoteProfileIntoLocal(
      remoteProfile(safety(['chair'], { movementCapabilities: confirmedMovementCapabilities(3, '2026-06-21T09:00:00.000Z') })),
      prefs(safety(['chair'], { movementCapabilities: undefined, updatedAt: '2026-06-21T10:00:00.000Z' })),
      { hydrateRoutingFields: true }
    );

    expect(merged.profile.safetyProfile?.movementCapabilities?.floorTransfer.status).toBe('confirmed');
    expect(merged.profile.safetyProfile?.movementCapabilities?.stepUpEnvironment.lowStableStep).toBe(true);
    expect(merged.profile.safetyProfile?.movementCapabilities?.revision).toBe(3);
  });
});
