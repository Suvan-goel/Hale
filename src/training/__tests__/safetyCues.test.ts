import {
  BAND_PULL_APART_ID,
  BRIDGE_HOLD_ID,
  OVERHEAD_PRESS_ID,
  SEATED_BAND_ROW_ID,
  STANDING_BAND_ROW_ID,
  STEP_UP_ID,
  listVisibleExerciseLadders,
} from '../../exercises';
import {
  REQUIRED_BALANCE_CUE_IDS,
  REQUIRED_BAND_CUE_IDS,
  REQUIRED_DOOR_ANCHOR_CUE_IDS,
  REQUIRED_FLOOR_CUE_IDS,
  REQUIRED_STEP_CUE_IDS,
  SESSION_GLOBAL_SAFETY_CUE_IDS,
  coreExerciseIdsMissingSafetyProfiles,
  plannedSafetyCueSnapshotForExercises,
  registeredExerciseIdsMissingSafetyProfiles,
  resolveExerciseSafetyCueProfile,
  safetyCueTexts,
  validateSafetyCueSnapshot,
} from '../safetyCues';

function profileIds(exerciseId: string): string[] {
  const profile = resolveExerciseSafetyCueProfile(exerciseId);
  if (!profile) throw new Error(`missing profile for ${exerciseId}`);
  return [
    ...profile.setupCueIds,
    ...profile.activeCueIds,
    ...profile.repeatedSetCueIds,
    ...profile.recoveryCueIds,
  ];
}

describe('training safety cue catalog', () => {
  it('gives every visible V1 core ladder level a canonical cue profile', () => {
    expect(coreExerciseIdsMissingSafetyProfiles()).toEqual([]);

    for (const level of listVisibleExerciseLadders(false).flatMap((ladder) => ladder.levels)) {
      const snapshot = plannedSafetyCueSnapshotForExercises([level.id]);
      expect(validateSafetyCueSnapshot({ exerciseIds: [level.id], snapshot })).toEqual({ valid: true });
      expect(snapshot.exerciseProfiles[0]).toMatchObject({
        schemaVersion: 1,
        exerciseId: level.id,
      });
    }
  });

  it('keeps registered optional levels covered too, without making them visible by default', () => {
    expect(registeredExerciseIdsMissingSafetyProfiles()).toEqual([]);
  });

  it('delivers global stop rules once from canonical cue ids', () => {
    expect(SESSION_GLOBAL_SAFETY_CUE_IDS).toEqual([
      'global_stop_sharp_or_increasing_pain',
      'global_stop_dizzy_or_lightheaded',
      'global_breathe_normally',
      'global_clear_space',
      'global_stop_if_support_moves',
      'global_pause_if_tracking_lost',
    ]);
    expect(safetyCueTexts(SESSION_GLOBAL_SAFETY_CUE_IDS).join(' ')).toMatch(/sharp pain/);
    expect(safetyCueTexts(SESSION_GLOBAL_SAFETY_CUE_IDS).join(' ')).toMatch(/tracking pauses/);
  });

  it('requires the complete band and door-anchor pack for standing band rows', () => {
    const ids = profileIds(STANDING_BAND_ROW_ID);
    for (const cueId of [...REQUIRED_BAND_CUE_IDS, ...REQUIRED_DOOR_ANCHOR_CUE_IDS]) {
      expect(ids).toContain(cueId);
    }
    expect(ids).toContain('band_stable_stance');
  });

  it('keeps seated rows, pull-aparts, and band overhead press specific to their setup', () => {
    const seated = profileIds(SEATED_BAND_ROW_ID);
    const pullApart = profileIds(BAND_PULL_APART_ID);
    const press = profileIds(OVERHEAD_PRESS_ID);

    for (const cueId of REQUIRED_BAND_CUE_IDS) {
      expect(seated).toContain(cueId);
      expect(pullApart).toContain(cueId);
      expect(press).toContain(cueId);
    }
    expect(seated).toContain('band_anchor_feet_secure');
    expect(seated).not.toContain('door_anchor_fully_closed');
    expect(pullApart).toContain('comfortable_range_only');
    expect(press).toContain('band_stable_stance');
  });

  it('covers step, floor, and balance hazard packs explicitly', () => {
    const step = profileIds(STEP_UP_ID);
    const bridge = profileIds(BRIDGE_HOLD_ID);
    const balance = profileIds('balance-single-leg-hold');

    for (const cueId of REQUIRED_STEP_CUE_IDS) expect(step).toContain(cueId);
    for (const cueId of REQUIRED_FLOOR_CUE_IDS) expect(bridge).toContain(cueId);
    for (const cueId of REQUIRED_BALANCE_CUE_IDS) expect(balance).toContain(cueId);
  });

  it('fails closed when a planned snapshot is missing or malformed', () => {
    expect(validateSafetyCueSnapshot({ exerciseIds: [STEP_UP_ID], snapshot: null })).toEqual({
      valid: false,
      issues: [{ reason: 'missing_safety_cue_profile' }],
    });

    const snapshot = plannedSafetyCueSnapshotForExercises([STEP_UP_ID]);
    const malformed = {
      ...snapshot,
      globalCueIds: snapshot.globalCueIds.filter((id) => id !== 'global_stop_dizzy_or_lightheaded'),
      fingerprint: 'stale',
    };
    const validation = validateSafetyCueSnapshot({ exerciseIds: [STEP_UP_ID], snapshot: malformed });
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.issues.map((issue) => issue.reason)).toEqual(
        expect.arrayContaining(['missing_required_stop_rules', 'missing_safety_cue_profile'])
      );
    }
  });
});
