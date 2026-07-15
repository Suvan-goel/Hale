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
    category: 'stairs_walks',
    nowIso: '2026-06-16T08:00:00.000Z',
  });
  const sample: Preferences = {
    profile: {
      name: 'Margaret',
      dateOfBirth: null,
      exactAge: 58,
      referenceSex: 'female',
      menopauseStage: 'perimenopausal',
      symptomPicture: null,
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
      comparisonOptIn: false,
      voiceSetup: { promptShown: false, safetyLineShown: false },
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
    // v10: comparisonOptIn + stage taxonomy + symptom picture (2026-07-06).
    // v11: stage taxonomy gains 'surgical_medical' (programme-v2 C6 ruling,
    // 2026-07-06); additive, earlier records deserialize unchanged.
    expect(JSON.parse(serializePreferences(sample)).schemaVersion).toBe(11);
  });

  it('defaults comparisonOptIn to false and round-trips an opt-in (v10, reposition slice 5)', () => {
    // v9 records carry no comparisonOptIn — they deserialize to the default
    // (off: baseline-relative is the default everywhere).
    const v9 = JSON.parse(serializePreferences(sample));
    delete v9.settings.comparisonOptIn;
    v9.schemaVersion = 9;
    expect(deserializePreferences(JSON.stringify(v9))?.settings.comparisonOptIn).toBe(false);

    const optedIn = {
      ...sample,
      settings: { ...sample.settings, comparisonOptIn: true },
    };
    expect(
      deserializePreferences(serializePreferences(optedIn))?.settings.comparisonOptIn
    ).toBe(true);
  });

  it('drops unknown menopause-stage values instead of persisting them', () => {
    const parsed = deserializePreferences(
      JSON.stringify({ profile: { name: '', goal: '', menopauseStage: 'menopausal-typo' } })
    );
    expect(parsed?.profile.menopauseStage).toBeNull();
  });

  it("round-trips the v10 'menopausal' stage (F2 taxonomy, 2026-07-06)", () => {
    const parsed = deserializePreferences(
      serializePreferences({
        ...sample,
        profile: { ...sample.profile, menopauseStage: 'menopausal' },
      })
    );
    expect(parsed?.profile.menopauseStage).toBe('menopausal');
    // The v9 stored token behind "Not sure" still parses unchanged.
    expect(
      deserializePreferences(
        JSON.stringify({ profile: { name: '', goal: '', menopauseStage: 'neither_or_unsure' } })
      )?.profile.menopauseStage
    ).toBe('neither_or_unsure');
  });

  it('round-trips the symptom picture and parses defensively (v10)', () => {
    const withSymptoms = deserializePreferences(
      serializePreferences({
        ...sample,
        profile: {
          ...sample.profile,
          symptomPicture: { kind: 'selected', symptoms: ['brain_fog', 'sleep_disruption'] },
        },
      })
    );
    expect(withSymptoms?.profile.symptomPicture).toEqual({
      kind: 'selected',
      symptoms: ['brain_fog', 'sleep_disruption'],
    });

    // Unknown symptoms filter out; an empty selection is not a stored answer.
    const dirty = deserializePreferences(
      JSON.stringify({
        profile: {
          name: '',
          goal: '',
          symptomPicture: { kind: 'selected', symptoms: ['brain_fog', 'not-a-symptom'] },
        },
      })
    );
    expect(dirty?.profile.symptomPicture).toEqual({ kind: 'selected', symptoms: ['brain_fog'] });
    expect(
      deserializePreferences(
        JSON.stringify({ profile: { name: '', goal: '', symptomPicture: { kind: 'selected', symptoms: [] } } })
      )?.profile.symptomPicture
    ).toBeNull();
    expect(
      deserializePreferences(
        JSON.stringify({ profile: { name: '', goal: '', symptomPicture: { kind: 'prefer_not_to_say' } } })
      )?.profile.symptomPicture
    ).toEqual({ kind: 'prefer_not_to_say' });
    // v9 records (no field) parse to honest unanswered.
    expect(
      deserializePreferences(JSON.stringify({ profile: { name: '', goal: '' } }))?.profile
        .symptomPicture
    ).toBeNull();
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
    expect(parsed?.settings.voiceId).toBe('clara');
  });

  it('migrates the retired trainer voice to Clara', () => {
    const parsed = deserializePreferences(
      JSON.stringify({ settings: { voiceId: 'marcus', remindersEnabled: false } })
    );
    expect(parsed?.settings.voiceId).toBe('clara');
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
        menopauseStage: null,
        symptomPicture: null,
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
        voiceSetup: { promptShown: false, safetyLineShown: false },
        comparisonOptIn: false,
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
