import {
  BALANCE_SINGLE_LEG_ID,
  SEATED_BAND_ROW_ID,
  STS_STANDARD_ID,
  STEP_UP_ID,
  getExerciseLadder,
} from '../../exercises';
import {
  discomfortConstraintForAreas,
  discomfortConstraintForContext,
  isExerciseExcludedByDiscomfort,
  normalizeDailyTrainingContext,
  painAreasFromSafetyProfile,
  progressionEvidencePolicyFor,
} from '../dailyTrainingContext';

describe('daily training context normalization', () => {
  it('normalizes every valid readiness state and explicit no-discomfort without mutating input', () => {
    const painAreas: unknown[] = [];
    for (const readiness of ['ready', 'a_bit_stiff', 'low_energy', 'something_hurts', 'short_on_time'] as const) {
      const context = normalizeDailyTrainingContext({ readiness, painAreas });
      expect(context.readiness).toBe(readiness);
      expect(context.inputStatus).toBe('valid');
      expect(context.discomfortAreas).toEqual([]);
      expect(context.discomfortReported).toBe(false);
    }
    expect(painAreas).toEqual([]);
  });

  it('dedupes and orders multiple discomfort areas deterministically', () => {
    const source = ['shoulder', 'knee', 'shoulder', 'ankle'] as const;
    const context = normalizeDailyTrainingContext({ readiness: 'ready', painAreas: source });

    expect(context.discomfortAreas).toEqual(['knee', 'shoulder', 'ankle']);
    expect(context.discomfortReported).toBe(true);
    expect(context.reasonCodes).toContain('discomfort_deduped');
    expect(source).toEqual(['shoulder', 'knee', 'shoulder', 'ankle']);
  });

  it('fails closed for unknown readiness or malformed discomfort data', () => {
    const malformedReadiness = normalizeDailyTrainingContext({ readiness: 'wired' });
    const malformedDiscomfort = normalizeDailyTrainingContext({ readiness: 'ready', painAreas: ['knee', 'elbow'] });

    expect(malformedReadiness).toMatchObject({
      readiness: 'low_energy',
      inputStatus: 'malformed_fail_closed',
    });
    expect(malformedDiscomfort.inputStatus).toBe('malformed_fail_closed');
    expect(malformedDiscomfort.discomfortAreas).toEqual(['knee', 'hip', 'back', 'shoulder', 'ankle', 'neck', 'other']);
  });

  it('maps legacy restored context cautiously', () => {
    const context = normalizeDailyTrainingContext({ source: 'legacy_unknown', readiness: undefined });

    expect(context.readiness).toBe('low_energy');
    expect(context.inputStatus).toBe('defaulted_cautious');
    expect(progressionEvidencePolicyFor({ context, source: 'block_generated' })).toBe('ineligible');
  });

  it('maps saved safety-profile discomfort notes into known pain areas when possible', () => {
    expect(painAreasFromSafetyProfile({ hasCurrentPain: true, painNotes: 'Left knee and lower back' })).toEqual(['knee', 'back']);
    expect(painAreasFromSafetyProfile({ hasCurrentPain: true, painNotes: 'foot feels stiff' })).toEqual(['ankle']);
    expect(painAreasFromSafetyProfile({ hasCurrentPain: false, painNotes: 'knee' })).toEqual([]);
    expect(painAreasFromSafetyProfile({ hasCurrentPain: true, painNotes: undefined })).toEqual(['other']);
    expect(painAreasFromSafetyProfile({ hasCurrentPain: true, painNotes: 'general soreness' })).toEqual(['other']);
  });
});

describe('discomfort movement-pattern policy', () => {
  it('blocks knee-sensitive strength and dynamic balance without blocking ordinary sit-to-stand', () => {
    const constraint = discomfortConstraintForAreas(['knee']);
    const sitToStand = getExerciseLadder('sit-to-stand');
    const stepUp = getExerciseLadder('step-up');

    expect(isExerciseExcludedByDiscomfort(sitToStand, sitToStand.levels.find((level) => level.id === STS_STANDARD_ID)!, constraint)).toBe(false);
    expect(isExerciseExcludedByDiscomfort(stepUp, stepUp.levels.find((level) => level.id === STEP_UP_ID)!, constraint)).toBe(true);
    expect(constraint.reasonCodes).toContain('knee_conservative_beta');
  });

  it('blocks hip/back hinge, bridge, step, squat, and deep reach patterns', () => {
    const constraint = discomfortConstraintForAreas(['hip', 'back']);

    expect(constraint.blockedLadderIds).toEqual(expect.arrayContaining(['hinge-glutes', 'squat', 'step-up']));
    expect(constraint.blockedExerciseIds).toEqual(expect.arrayContaining(['glute-bridge-hold', 'glute-bridge-reps', 'seated-hamstring-reach']));
  });

  it('blocks shoulder push, rows, pull-aparts, and overhead work', () => {
    const constraint = discomfortConstraintForAreas(['shoulder']);
    const row = getExerciseLadder('pull-upper-back');

    expect(isExerciseExcludedByDiscomfort(row, row.levels.find((level) => level.id === SEATED_BAND_ROW_ID)!, constraint)).toBe(true);
    expect(constraint.blockedLadderIds).toEqual(expect.arrayContaining(['push', 'pull-upper-back', 'shoulder-reach-press']));
  });

  it('blocks ankle/foot calf, step-up, dynamic balance, march, and single-leg balance patterns', () => {
    const constraint = discomfortConstraintForAreas(['ankle']);
    const balance = getExerciseLadder('balance');

    expect(constraint.blockedLadderIds).toEqual(expect.arrayContaining(['heel-toe-raise', 'lateral-stability', 'step-up']));
    expect(isExerciseExcludedByDiscomfort(balance, balance.levels.find((level) => level.id === BALANCE_SINGLE_LEG_ID)!, constraint)).toBe(true);
  });

  it('applies union constraints and marks malformed context fail-closed', () => {
    const context = normalizeDailyTrainingContext({ readiness: 'ready', painAreas: ['knee', 'nope'] });
    const constraint = discomfortConstraintForContext(context);

    expect(constraint.reasonCodes).toEqual(expect.arrayContaining(['malformed_discomfort_fail_closed', 'knee_conservative_beta']));
    expect(constraint.blockedLadderIds).toEqual(expect.arrayContaining(['pull-upper-back', 'step-up']));
  });
});
