import { DEFAULT_BATTERY } from '../../checkup';
import type { CheckUp } from '../../checkup/types';
import { scoreCheckUp } from '../../scoring';
import { getAssessmentResultState } from '../assessmentResultState';

const START = '2026-06-19T08:00:00.000Z';

function noMeasurementCheckUp(): CheckUp {
  return {
    startedAt: START,
    bodyUnit: 1,
    items: DEFAULT_BATTERY.map((movementId) => ({
      movementId,
      status: 'measured' as const,
      result: { movementId, flags: ['no-measurement'], interruptions: 0 },
    })),
  };
}

describe('assessment result state', () => {
  it('presents retake recovery instead of block creation for invalid baseline results', () => {
    const state = getAssessmentResultState({ score: scoreCheckUp(noMeasurementCheckUp()) });

    expect(state.canCreateBlock).toBe(false);
    expect(state.primaryAction).toBe('retake_checkup');
    expect(state.recoveryTitle).toBe('Hale needs a clearer check-up to build your plan.');
  });
});
