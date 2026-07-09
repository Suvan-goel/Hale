import type { TrainingSessionResult } from '../../training';
import type { PearlSessionPlan } from '../types';
import { evaluateSessionWorkEvidence } from '../sessionWorkEvidence';

function plan(): PearlSessionPlan {
  return {
    id: 'plan-1',
    blockId: 'block-1',
    title: 'Strength Session A',
    purposeCopy: 'Move comfortably.',
    sessionType: 'standard',
    estimatedMinutes: 20,
    focusDomain: 'strength_power',
    exercises: [
      {
        id: 'exercise-a',
        family: 'sit_to_stand',
        name: 'Exercise A',
        domain: 'strength_power',
        level: 1,
      },
      {
        id: 'exercise-b',
        family: 'row',
        name: 'Exercise B',
        domain: 'strength_power',
        level: 1,
      },
    ],
  };
}

function result(items: TrainingSessionResult['items']): TrainingSessionResult {
  return { startedAt: '2026-06-01T09:00:00.000Z', items };
}

describe('session work evidence', () => {
  it('requires at least one completed planned exercise', () => {
    expect(evaluateSessionWorkEvidence(plan(), null).hasCompletedPlannedExercise).toBe(false);
    expect(
      evaluateSessionWorkEvidence(
        plan(),
        result([
          { exerciseId: 'exercise-a', status: 'skipped', sets: [] },
          { exerciseId: 'exercise-b', status: 'skipped', sets: [] },
        ])
      ).hasCompletedPlannedExercise
    ).toBe(false);
    expect(
      evaluateSessionWorkEvidence(
        plan(),
        result([
          { exerciseId: 'exercise-a', status: 'completed', sets: [] },
          { exerciseId: 'exercise-b', status: 'skipped', sets: [] },
        ])
      ).hasCompletedPlannedExercise
    ).toBe(true);
  });

  it('fails closed for duplicate, unmatched, and malformed result items', () => {
    const evidence = evaluateSessionWorkEvidence(
      plan(),
      result([
        { exerciseId: 'exercise-a', status: 'completed', sets: [] },
        { exerciseId: 'exercise-a', status: 'completed', sets: [] },
        { exerciseId: 'not-planned', status: 'completed', sets: [] },
        { exerciseId: '', status: 'completed', sets: [] },
      ])
    );

    expect(evidence.hasCompletedPlannedExercise).toBe(false);
    expect(evidence.duplicateExerciseIds).toEqual(['exercise-a']);
    expect(evidence.unmatchedExerciseIds).toEqual(['not-planned']);
    expect(evidence.malformedResultCount).toBe(1);
  });
});
