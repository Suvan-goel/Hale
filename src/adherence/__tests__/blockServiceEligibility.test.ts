import type { CheckUpScore, Domain, DomainResult, VersionedCheckUpScoreSnapshot } from '../../scoring';
import {
  FOCUS_SELECTION_POLICY_VERSION,
  INTERIM_NEAR_TIE_MARGIN_YEARS,
  toStoredScoreSnapshot,
} from '../../scoring';
import {
  IneligibleMovementBlockError,
  createLifeGoal,
  createMovementBlockFromAssessment,
  tryCreateMovementBlockFromAssessment,
} from '../index';
import type { MovementAssessment } from '../types';
import { createMovementAssessment } from '../../pearlFlow';

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
    primaryMetricValue: measured ? age : NaN,
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

function scoreFromMidpoints(
  midpoints: Record<Domain, number>,
  weakestDomain: Domain | null = null
): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', midpoints.strength),
      domainResult('balance', midpoints.balance),
      domainResult('mobility', midpoints.mobility),
    ],
  };
}

function assessmentFor(inputScore: CheckUpScore, status: MovementAssessment['status'] = 'completed'): MovementAssessment {
  const scoreSnapshot = scoreSnapshotFor(inputScore);
  const assessment = createMovementAssessment({
    checkUpId: inputScore.startedAt,
    type: 'baseline',
    score: inputScore,
    scoreSnapshot,
    completedAt: inputScore.startedAt,
    isOfficialForProgress: true,
  });
  return {
    ...assessment,
    status,
  };
}

function scoreSnapshotFor(inputScore: CheckUpScore): VersionedCheckUpScoreSnapshot {
  return toStoredScoreSnapshot(inputScore)!;
}

describe('movement block service eligibility', () => {
  it('returns a typed failure for an invalid assessment instead of creating a block', () => {
    const inputScore = score('balance');
    const result = tryCreateMovementBlockFromAssessment({
      latestAssessment: {
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        id: 'assessment-invalid',
        assessment: assessmentFor(inputScore, 'invalid'),
      },
      lifeGoal: createLifeGoal({ category: 'stairs_walks', nowIso: START }),
      startDate: START,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: 'assessment_invalid',
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
      reason: 'non_official_assessment',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('preserves valid block creation and focus selection', () => {
    const inputScore = score('mobility');
    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        sourceCheckUpId: 'checkup-valid',
        assessment: assessmentFor(inputScore),
      },
      lifeGoal: createLifeGoal({ category: 'bend_reach_carry', nowIso: START }),
      startDate: START,
    });

    expect(block.focusDomain).toBe('mobility');
    expect(block.sourceCheckUpId).toBe('checkup-valid');
    expect(block.totalPlannedSessions).toBe(12);
  });

  it('fails closed when a current near-tie snapshot lacks focus metadata', () => {
    const inputScore = scoreFromMidpoints({ strength: 74, balance: 70, mobility: 60 }, 'strength');
    const currentSnapshot = scoreSnapshotFor(inputScore);
    const { focusSelection: _focusSelection, ...snapshotWithoutFocus } = currentSnapshot;
    const assessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: snapshotWithoutFocus,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    const result = tryCreateMovementBlockFromAssessment({
      latestAssessment: {
        score: inputScore,
        scoreSnapshot: snapshotWithoutFocus,
        id: 'assessment-near-without-focus',
        assessment,
      },
      startDate: START,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: 'missing_focus_metadata',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('preserves active focus for official near-tie re-tests and stores the policy metadata on the block', () => {
    const inputScore = scoreFromMidpoints({ strength: 60, balance: 74, mobility: 70 }, 'mobility');
    const scoreSnapshot = toStoredScoreSnapshot(inputScore, { activeFocusDomain: 'mobility' })!;
    const assessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'official_retest',
      score: inputScore,
      scoreSnapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        score: inputScore,
        scoreSnapshot,
        id: 'assessment-near-preserve',
        assessment,
      },
      startDate: START,
    });

    expect(block).toMatchObject({
      focusDomain: 'mobility',
      focusSelectionKind: 'near_tie',
      focusTiedDomains: ['balance', 'mobility'],
      focusTieBreakReason: 'near_tie_preserve_current_focus',
      focusNearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      focusSelectionPolicyVersion: FOCUS_SELECTION_POLICY_VERSION,
    });
  });

  it('throws a named invariant error for direct callers that ignore the typed result', () => {
    expect(() => createMovementBlockFromAssessment({ latestAssessment: score(null), startDate: START })).toThrow(
      IneligibleMovementBlockError
    );
  });
});
