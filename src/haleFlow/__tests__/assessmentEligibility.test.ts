import { DEFAULT_BATTERY } from '../../checkup';
import type { CheckUp } from '../../checkup/types';
import { BALANCE_LADDER_ID, CHAIR_STAND_ID } from '../../movements';
import { createMovementBlockFromAssessment, tryCreateMovementBlockFromAssessment } from '../../adherence';
import type { MovementAssessment } from '../../adherence/types';
import type { CheckUpScore, Domain, DomainResult } from '../../scoring';
import { scoreCheckUp } from '../../scoring';
import {
  createMovementAssessment,
  latestOfficialAssessmentAttempt,
  latestUsableOfficialAssessment,
} from '../assessments';
import { getBlockCreationEligibility } from '../assessmentEligibility';

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
      domainResult('strength', weakestDomain === 'strength' ? 76 : 58),
      domainResult('balance', weakestDomain === 'balance' ? 76 : 56),
      domainResult('mobility', weakestDomain === 'mobility' ? 76 : 55),
    ],
  };
}

function partialScore(): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain: 'strength',
    domains: [
      domainResult('strength', 72),
      domainResult('balance', 60, false),
      domainResult('mobility', 60, false),
    ],
  };
}

function assessment(inputScore: CheckUpScore, overrides: Partial<MovementAssessment> = {}): MovementAssessment {
  return {
    ...createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    }),
    ...overrides,
  };
}

function skippedCheckUp(): CheckUp {
  return {
    startedAt: START,
    bodyUnit: 1,
    items: DEFAULT_BATTERY.map((movementId) => ({ movementId, status: 'skipped' as const, result: null })),
  };
}

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

function measuredItem(movementId: string, result: Record<string, unknown>): CheckUp['items'][number] {
  return {
    movementId,
    status: 'measured',
    result: { movementId, flags: [], interruptions: 0, ...result } as never,
  };
}

describe('assessment block-creation eligibility', () => {
  it('accepts a fully valid score and preserves the explicit focus domain', () => {
    const inputScore = score('mobility');
    const result = getBlockCreationEligibility({ score: inputScore, assessment: assessment(inputScore) });

    expect(result).toMatchObject({
      eligible: true,
      focusDomain: 'mobility',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('rejects a realistic no-measurement CheckUp after real scoring and assessment creation', () => {
    const inputScore = scoreCheckUp(noMeasurementCheckUp());
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const eligibility = getBlockCreationEligibility({ score: inputScore, assessment: resultAssessment });

    expect(inputScore.weakestDomain).toBeNull();
    expect(resultAssessment.status).toBe('invalid');
    expect(resultAssessment.results?.weakestDomain).toBeUndefined();
    expect(eligibility).toEqual({ eligible: false, reason: 'assessment_not_completed', measuredDomains: [] });
    expect(tryCreateMovementBlockFromAssessment({ latestAssessment: { score: inputScore, id: START, assessment: resultAssessment } })).toMatchObject({
      ok: false,
      reason: 'assessment_not_completed',
      measuredDomains: [],
    });
  });

  it('rejects all-skipped check-ups as no measured domains', () => {
    const inputScore = scoreCheckUp(skippedCheckUp());

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'no_measured_domains',
      measuredDomains: [],
    });
  });

  it('rejects no-measurement flags as no measured domains without a strength fallback', () => {
    const inputScore = scoreCheckUp(noMeasurementCheckUp());
    const result = getBlockCreationEligibility({ score: inputScore });

    expect(result).toEqual({ eligible: false, reason: 'no_measured_domains', measuredDomains: [] });
    expect(() => createMovementBlockFromAssessment({ latestAssessment: inputScore })).toThrow(
      'Cannot create movement block from ineligible assessment'
    );
  });

  it('rejects malformed scoring inputs before block eligibility', () => {
    const inputScore = scoreCheckUp({
      startedAt: START,
      bodyUnit: 1,
      items: [
        measuredItem(CHAIR_STAND_ID, {
          reps: '14',
          repStats: [],
          sessionMeanVel: 0.22,
          sessionMeanPeakVel: 0.3,
          pushOffDetected: false,
        }),
      ],
    });
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    expect(inputScore.weakestDomain).toBeNull();
    expect(resultAssessment.status).toBe('invalid');
    expect(getBlockCreationEligibility({ score: inputScore, assessment: resultAssessment })).toEqual({
      eligible: false,
      reason: 'assessment_not_completed',
      measuredDomains: [],
    });
  });

  it('preserves valid domains when a sibling movement is malformed', () => {
    const inputScore = scoreCheckUp({
      startedAt: START,
      bodyUnit: 1,
      items: [
        measuredItem(CHAIR_STAND_ID, {
          reps: '14',
          repStats: [],
          sessionMeanVel: 0.22,
          sessionMeanPeakVel: 0.3,
          pushOffDetected: false,
        }),
        measuredItem(BALANCE_LADDER_ID, { stages: [], singleLegEyesOpenSec: 9 }),
      ],
    });
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    expect(inputScore.weakestDomain).toBe('balance');
    expect(resultAssessment.status).toBe('completed');
    expect(getBlockCreationEligibility({ score: inputScore, assessment: resultAssessment })).toMatchObject({
      eligible: true,
      focusDomain: 'balance',
      measuredDomains: ['balance'],
    });
  });

  it('rejects a null weakest domain even when another domain is measured', () => {
    const inputScore = { ...partialScore(), weakestDomain: null };

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'missing_focus_domain',
      measuredDomains: ['strength_power'],
    });
  });

  it('rejects unsupported weakest-domain values without crashing', () => {
    const inputScore = { ...partialScore(), weakestDomain: 'cardio' as unknown as Domain };

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'missing_focus_domain',
      measuredDomains: ['strength_power'],
    });
  });

  it('rejects invalid assessment status even when a partial score exists', () => {
    const inputScore = partialScore();

    expect(getBlockCreationEligibility({ score: inputScore, assessment: assessment(inputScore, { status: 'invalid' }) })).toEqual({
      eligible: false,
      reason: 'assessment_not_completed',
      measuredDomains: ['strength_power'],
    });
  });

  it('rejects a completed assessment with a non-finite focus measurement', () => {
    const inputScore: CheckUpScore = {
      startedAt: START,
      weakestDomain: 'balance',
      domains: [
        domainResult('strength', 62),
        { ...domainResult('balance', 72), ageLow: NaN, ageHigh: NaN },
        domainResult('mobility', 62, false),
      ],
    };

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'invalid_focus_measurement',
      measuredDomains: ['strength_power'],
    });
  });

  it('keeps an older valid official assessment usable when a newer official attempt is invalid', () => {
    const older = assessment(score('balance'), {
      id: 'older-valid',
      completedAt: '2026-06-01T08:00:00.000Z',
    });
    const newer = createMovementAssessment({
      checkUpId: '2026-06-20T08:00:00.000Z',
      type: 'official_retest',
      score: scoreCheckUp(noMeasurementCheckUp()),
      completedAt: '2026-06-20T08:00:00.000Z',
      isOfficialForProgress: true,
    });

    expect(latestOfficialAssessmentAttempt([older, newer])?.id).toBe(newer.id);
    expect(latestUsableOfficialAssessment([older, newer])?.id).toBe('older-valid');
  });

  it('preserves current completed partial-evidence behaviour', () => {
    const inputScore = partialScore();
    const result = getBlockCreationEligibility({ score: inputScore, assessment: assessment(inputScore) });

    expect(result).toMatchObject({
      eligible: true,
      focusDomain: 'strength_power',
      measuredDomains: ['strength_power'],
    });
  });
});
