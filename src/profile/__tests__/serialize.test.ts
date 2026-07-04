import { ProfileStore } from '../store';
import { createMemoryFs } from '../../history';
import { createLifeGoal } from '../../adherence';
import {
  ageBandForAge,
  ageFromDateOfBirth,
  defaultPreferences,
  deserializePreferences,
  serializePreferences,
} from '..';
import { Preferences } from '../types';

describe('preferences serialize', () => {
  const lifeGoal = createLifeGoal({
    category: 'stairs',
    nowIso: '2026-06-16T08:00:00.000Z',
  });
  const sample: Preferences = {
    profile: {
      name: 'Margaret',
      dateOfBirth: null,
      exactAge: 58,
      referenceSex: 'female',
      age: 58,
      ageBand: '55_64',
      goal: 'Stay steady on the stairs',
      lifeGoal,
      safetyProfile: null,
    },
    settings: {
      voiceId: 'clara',
      remindersEnabled: true,
      phoneStandAvailable: true,
    },
    onboarding: {
      currentStep: 'complete',
      baselineResultId: 'checkup-1',
      completedAt: '2026-06-16T09:00:00.000Z',
      updatedAt: '2026-06-16T09:00:00.000Z',
    },
  };

  it('round-trips a full record', () => {
    expect(deserializePreferences(serializePreferences(sample))).toEqual(sample);
  });

  it('writes a schema version', () => {
    expect(JSON.parse(serializePreferences(sample)).schemaVersion).toBe(8);
  });

  it('resumes retired onboarding steps at the single camera setup screen', () => {
    for (const retiredStep of ['equipment', 'camera_explanation']) {
      const parsed = deserializePreferences(
        JSON.stringify({
          profile: { name: '', goal: '' },
          onboarding: { currentStep: retiredStep },
        })
      );
      expect(parsed?.onboarding.currentStep).toBe('camera_setup');
    }
  });

  it('derives current exact age from date of birth', () => {
    const dateOfBirth = '1968-07-01';
    const parsed = deserializePreferences(JSON.stringify({
      profile: {
        name: 'Margaret',
        dateOfBirth,
        exactAge: 99,
        age: 99,
        goal: '',
      },
    }));
    const expectedAge = ageFromDateOfBirth(dateOfBirth);

    expect(parsed?.profile.dateOfBirth).toBe(dateOfBirth);
    expect(parsed?.profile.exactAge).toBe(expectedAge);
    expect(parsed?.profile.age).toBe(expectedAge);
    expect(parsed?.profile.ageBand).toBe(ageBandForAge(expectedAge));
  });

  it('migrates legacy exact ages into exact profile details and age bands', () => {
    const parsed = deserializePreferences(JSON.stringify({
      profile: {
        name: 'Margaret',
        age: 58,
        goal: '',
        lifeGoal,
        safetyProfile: {
          id: 'safety-1',
          userId: 'local-device-user',
          age: 58,
          availableEquipment: ['chair', 'wall'],
          createdAt: '2026-06-21T08:00:00.000Z',
          updatedAt: '2026-06-21T08:00:00.000Z',
        },
      },
    }));

    expect(parsed?.profile.exactAge).toBe(58);
    expect(parsed?.profile.referenceSex).toBeNull();
    expect(parsed?.profile.age).toBe(58);
    expect(parsed?.profile.ageBand).toBe('55_64');
    expect(parsed?.profile.safetyProfile).toMatchObject({
      age: 58,
      ageBand: '55_64',
    });
  });

  it('returns null on malformed JSON', () => {
    expect(deserializePreferences('not json')).toBeNull();
  });

  it('falls back to defaults for missing/foreign fields', () => {
    const parsed = deserializePreferences(JSON.stringify({ profile: { name: 7 }, settings: {} }));
    expect(parsed).toEqual(defaultPreferences());
  });

  it('drops an unknown voice id back to the default', () => {
    const parsed = deserializePreferences(
      JSON.stringify({ settings: { voiceId: 'does-not-exist', remindersEnabled: false } })
    );
    expect(parsed?.settings.voiceId).toBe('marcus');
  });

  it('backfills newer local settings for older records', () => {
    const parsed = deserializePreferences(
      JSON.stringify({ settings: { voiceId: 'clara', remindersEnabled: true } })
    );
    expect(parsed?.settings).toMatchObject({
      voiceId: 'clara',
      remindersEnabled: true,
      phoneStandAvailable: false,
    });
  });

  it('round-trips movement capability setup in the safety profile', () => {
    const parsed = deserializePreferences(serializePreferences({
      ...sample,
      profile: {
        ...sample.profile,
        safetyProfile: {
          id: 'safety-1',
          userId: 'local-device-user',
          availableEquipment: ['chair', 'wall', 'stairs', 'floor_space'],
          movementCapabilities: {
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
            revision: 3,
            updatedAt: '2026-06-21T08:00:00.000Z',
          },
          createdAt: '2026-06-21T08:00:00.000Z',
          updatedAt: '2026-06-21T08:00:00.000Z',
        },
      },
    }));

    expect(parsed?.profile.safetyProfile?.movementCapabilities).toMatchObject({
      floorTransfer: { status: 'confirmed' },
      stepUpEnvironment: {
        status: 'confirmed',
        lowStableStep: true,
        fixedSupport: true,
        clearDryArea: true,
        phoneOutOfPath: true,
      },
      singleLegBalance: { status: 'confirmed_with_support' },
      revision: 3,
    });
  });

  it('backfills missing legacy movement capability fields as unconfirmed', () => {
    const parsed = deserializePreferences(JSON.stringify({
      profile: {
        name: 'Margaret',
        age: 58,
        goal: '',
        lifeGoal,
        safetyProfile: {
          id: 'safety-1',
          userId: 'local-device-user',
          availableEquipment: ['floor_space', 'stairs', 'wall'],
          createdAt: '2026-06-21T08:00:00.000Z',
          updatedAt: '2026-06-21T08:00:00.000Z',
        },
      },
    }));

    expect(parsed?.profile.safetyProfile?.movementCapabilities).toMatchObject({
      floorTransfer: { status: 'not_confirmed' },
      stepUpEnvironment: {
        status: 'not_confirmed',
        lowStableStep: false,
        fixedSupport: false,
        clearDryArea: false,
        phoneOutOfPath: false,
      },
      singleLegBalance: { status: 'not_confirmed' },
    });
  });
});

describe('ProfileStore', () => {
  it('returns defaults when nothing is stored', async () => {
    const store = new ProfileStore(createMemoryFs());
    expect(await store.load()).toEqual(defaultPreferences());
  });

  it('persists and reloads (survives restart)', async () => {
    const fs = createMemoryFs();
    const prefs: Preferences = {
      profile: {
        name: 'David',
        dateOfBirth: null,
        exactAge: 68,
        referenceSex: 'male',
        age: 68,
        ageBand: '65_74',
        goal: '',
        lifeGoal: null,
        safetyProfile: null,
      },
      settings: {
        voiceId: 'clara',
        remindersEnabled: true,
        phoneStandAvailable: false,
      },
      onboarding: {
        currentStep: 'welcome',
        baselineResultId: null,
        completedAt: null,
        updatedAt: null,
      },
    };
    new ProfileStore(fs).save(prefs);
    expect(await new ProfileStore(fs).load()).toEqual(prefs);
  });
});
