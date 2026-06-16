import { ProfileStore } from '../store';
import { createMemoryFs } from '../../history';
import { createLifeGoal } from '../../adherence';
import {
  defaultPreferences,
  deserializePreferences,
  serializePreferences,
} from '../serialize';
import { Preferences } from '../types';

describe('preferences serialize', () => {
  const lifeGoal = createLifeGoal({
    category: 'stairs',
    nowIso: '2026-06-16T08:00:00.000Z',
  });
  const sample: Preferences = {
    profile: { name: 'Margaret', age: 58, goal: 'Stay steady on the stairs', lifeGoal, safetyProfile: null },
    settings: { voiceId: 'clara', remindersEnabled: true },
    onboarding: {
      currentStep: 'complete',
      selectedEquipment: ['chair', 'wall'],
      baselineResultId: 'checkup-1',
      completedAt: '2026-06-16T09:00:00.000Z',
      updatedAt: '2026-06-16T09:00:00.000Z',
    },
  };

  it('round-trips a full record', () => {
    expect(deserializePreferences(serializePreferences(sample))).toEqual(sample);
  });

  it('writes a schema version', () => {
    expect(JSON.parse(serializePreferences(sample)).schemaVersion).toBe(4);
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
});

describe('ProfileStore', () => {
  it('returns defaults when nothing is stored', async () => {
    const store = new ProfileStore(createMemoryFs());
    expect(await store.load()).toEqual(defaultPreferences());
  });

  it('persists and reloads (survives restart)', async () => {
    const fs = createMemoryFs();
    const prefs: Preferences = {
      profile: { name: 'David', age: 66, goal: '', lifeGoal: null, safetyProfile: null },
      settings: { voiceId: 'clara', remindersEnabled: true },
      onboarding: {
        currentStep: 'welcome',
        selectedEquipment: [],
        baselineResultId: null,
        completedAt: null,
        updatedAt: null,
      },
    };
    new ProfileStore(fs).save(prefs);
    expect(await new ProfileStore(fs).load()).toEqual(prefs);
  });
});
