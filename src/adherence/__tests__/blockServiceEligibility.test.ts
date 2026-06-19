import type { CheckUpScore, Domain, DomainResult } from '../../scoring';
import {
  IneligibleMovementBlockError,
  createLifeGoal,
  createMovementBlockFromAssessment,
  tryCreateMovementBlockFromAssessment,
} from '../index';
import type { MovementAssessment } from '../types';

const START = '2026-06-19T08:00:00.000Z';

function domainResult(domain: Domain, age: number, measured = true): DomainResult {
  return {
    domain,
    label: domain,
    measured,
    ageLow: measured ? age - 2 : NaN,
    ageHigh: measured ? age + 2 : NaN,
    estimated: false,
    interpretation: measured ? 'Measured.' : 'Not measured.',
    rows: [],
  };
}

function score(weakestDomain: Domain | null = 'balance'): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', weakestDomain === 'strength' ? 74 : 58),
      domainResult('balance', weakestDomain === 'balance' ? 74 : 57),
      domainResult('mobility', weakestDomain === 'mobility' ? 74 : 56),
    ],
  };
}

function assessmentFor(inputScore: CheckUpScore, status: MovementAssessment['status'] = 'completed'): MovementAssessment {
  return {
    id: `assessment-${status}`,
    userId: 'local-device-user',
    type: 'baseline',
    status,
    createdAt: inputScore.startedAt,
    completedAt: inputScore.startedAt,
    results: {
      strengthPowerScore: 58,
      balanceScore: 74,
      mobilityScore: 56,
      weakestDomain: 'balance',
      confidence: 'high',
      rawMetrics: { checkUpId: inputScore.startedAt, measuredDomains: 3 },
    },
    isOfficialForProgress: true,
  };
}

describe('movement block service eligibility', () => {
  it('returns a typed failure for an invalid assessment instead of creating a block', () => {
    const inputScore = score('balance');
    const result = tryCreateMovementBlockFromAssessment({
      latestAssessment: { score: inputScore, id: 'assessment-invalid', assessment: assessmentFor(inputScore, 'invalid') },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      startDate: START,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: 'assessment_not_completed',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('does not let a null focus become a strength block', () => {
    const result = tryCreateMovementBlockFromAssessment({
      latestAssessment: score(null),
      startDate: START,
    });

    expect(result).toEqual({
      ok: false,
      eligible: false,
      reason: 'missing_focus_domain',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('preserves valid block creation and focus selection', () => {
    const block = createMovementBlockFromAssessment({
      latestAssessment: { score: score('mobility'), id: 'assessment-valid' },
      lifeGoal: createLifeGoal({ category: 'gardening_hobbies', nowIso: START }),
      startDate: START,
    });

    expect(block.focusDomain).toBe('mobility');
    expect(block.sourceAssessmentId).toBe('assessment-valid');
    expect(block.totalPlannedSessions).toBe(12);
  });

  it('throws a named invariant error for direct callers that ignore the typed result', () => {
    expect(() => createMovementBlockFromAssessment({ latestAssessment: score(null), startDate: START })).toThrow(
      IneligibleMovementBlockError
    );
  });
});
