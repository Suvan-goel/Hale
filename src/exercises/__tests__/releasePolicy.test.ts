import {
  CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS,
  availableLevelsForRelease,
  effectiveLevelForRelease,
  exerciseLevelAvailability,
  listExerciseLadders,
  listVisibleExerciseLadders,
  plannedTrainingReleasePolicySnapshotForExercises,
  releasePolicyFingerprint,
} from '../index';

describe('controlled beta release policy', () => {
  it('keeps the exact seven optional levels hidden and registered', () => {
    const allLevels = listExerciseLadders().flatMap((ladder) => ladder.levels);
    const optional = allLevels.filter((level) => level.releaseStatus === 'v1_optional');

    expect(optional.map((level) => level.id).sort()).toEqual([...CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS].sort());
    expect(optional).toHaveLength(7);
    for (const level of optional) {
      expect(exerciseLevelAvailability(level)).toMatchObject({ available: false });
    }
  });

  it('does not let the legacy includeOptional argument change visible catalogue availability', () => {
    const visibleDefault = listVisibleExerciseLadders().flatMap((ladder) => ladder.levels);
    const visibleWithLegacyFlag = listVisibleExerciseLadders(true).flatMap((ladder) => ladder.levels);

    expect(visibleDefault.map((level) => level.id).sort()).toEqual(visibleWithLegacyFlag.map((level) => level.id).sort());
    expect(visibleDefault.some((level) => level.releaseStatus === 'v1_optional')).toBe(false);
  });

  it('chooses the nearest lower beta level when restored progress points to a hidden optional level', () => {
    const sitToStand = listExerciseLadders().find((ladder) => ladder.id === 'sit-to-stand')!;
    const squat = listExerciseLadders().find((ladder) => ladder.id === 'squat')!;

    expect(effectiveLevelForRelease(sitToStand, 'loaded-sit-to-stand')).toMatchObject({
      requestedLevelId: 'loaded-sit-to-stand',
      selectedLevel: expect.objectContaining({ id: 'sts-power' }),
      releaseCapped: true,
    });
    expect(effectiveLevelForRelease(squat, 'squat-slow-eccentric')).toMatchObject({
      requestedLevelId: 'squat-slow-eccentric',
      selectedLevel: expect.objectContaining({ id: 'squat-free' }),
      releaseCapped: true,
    });
  });

  it('builds deterministic plan snapshots from controlled beta availability', () => {
    const snapshot = plannedTrainingReleasePolicySnapshotForExercises([
      {
        exerciseId: 'loaded-sit-to-stand',
        ladderId: 'sit-to-stand',
        levelId: 'loaded-sit-to-stand',
        releaseStatus: 'v1_optional',
      },
    ]);

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.policyFingerprint).toBe(releasePolicyFingerprint());
    expect(snapshot.exercises[0]).toMatchObject({
      levelId: 'loaded-sit-to-stand',
      availability: { available: false, reason: 'load_policy_not_approved' },
    });
  });

  it('exposes only beta-available levels through release helpers', () => {
    for (const ladder of listExerciseLadders()) {
      const available = availableLevelsForRelease(ladder);
      expect(available.every((level) => level.releaseStatus === 'v1_core')).toBe(true);
      for (const level of available) {
        expect(exerciseLevelAvailability(level)).toEqual({ available: true, channel: 'controlled_beta', reason: 'v1_core' });
      }
    }
  });
});
