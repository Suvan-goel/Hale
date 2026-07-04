import { DEFAULT_BATTERY } from '../../checkup';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import type { CheckUp } from '../../checkup/types';
import { BALANCE_LADDER_ID, CHAIR_STAND_ID } from '../../movements';
import { createMovementBlockFromAssessment, tryCreateMovementBlockFromAssessment } from '../../adherence';
import type { MovementAssessment } from '../../adherence/types';
import type { CheckUpScore, Domain, DomainResult, VersionedCheckUpScoreSnapshot } from '../../scoring';
import {
  FOCUS_SELECTION_POLICY_VERSION,
  INTERIM_NEAR_TIE_MARGIN_YEARS,
  parseStoredScoreSnapshot,
  scoreCheckUp,
  toStoredScoreSnapshot,
} from '../../scoring';
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
    primaryMetricValue: measured ? age : NaN,
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

function exactTieScore(weakestDomain: Domain = 'strength'): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', 76),
      domainResult('balance', 76),
      domainResult('mobility', 55),
    ],
  };
}

function nearTieScore(weakestDomain: Domain = 'strength'): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', 76),
      domainResult('balance', 72),
      domainResult('mobility', 55),
    ],
  };
}

function scoreFromSnapshot(snapshot: VersionedCheckUpScoreSnapshot): CheckUpScore {
  const parsed = parseStoredScoreSnapshot(snapshot);
  if (!parsed.ok) throw new Error('Expected current snapshot in test setup');
  return parsed.score;
}

function assessment(inputScore: CheckUpScore, overrides: Partial<MovementAssessment> = {}): MovementAssessment {
  const scoreSnapshot = scoreSnapshotFor(inputScore);
  return {
    ...createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    }),
    ...overrides,
  };
}

function scoreSnapshotFor(inputScore: CheckUpScore): VersionedCheckUpScoreSnapshot {
  return toStoredScoreSnapshot(inputScore)!;
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
    const result = getBlockCreationEligibility({
      score: inputScore,
      scoreSnapshot: scoreSnapshotFor(inputScore),
      assessment: assessment(inputScore),
    });

    expect(result).toMatchObject({
      eligible: true,
      focusDomain: 'mobility',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('accepts an exact tie only when current focus metadata is present', () => {
    const inputScore = exactTieScore();
    const snapshot = scoreSnapshotFor(inputScore);
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: snapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const result = getBlockCreationEligibility({
      score: inputScore,
      scoreSnapshot: snapshot,
      assessment: resultAssessment,
    });
    const block = createMovementBlockFromAssessment({
      latestAssessment: { score: inputScore, scoreSnapshot: snapshot, id: START, assessment: resultAssessment },
    });

    expect(result).toMatchObject({
      eligible: true,
      focusDomain: 'strength_power',
      focusSelection: {
        kind: 'exact_tie',
        focusDomain: 'strength',
        tiedDomains: ['strength', 'balance'],
        tieBreakReason: 'deterministic_fallback',
      },
    });
    expect(resultAssessment.results?.rawMetrics?.focusTieBreakReason).toBe('deterministic_fallback');
    expect(block).toMatchObject({
      focusDomain: 'strength_power',
      focusSelectionKind: 'exact_tie',
      focusTiedDomains: ['strength_power', 'balance'],
      focusTieBreakReason: 'deterministic_fallback',
    });
  });

  it('preserves an active tied domain for official re-test focus metadata', () => {
    const snapshot = toStoredScoreSnapshot(exactTieScore('strength'), { activeFocusDomain: 'balance' })!;
    const inputScore = scoreFromSnapshot(snapshot);
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'official_retest',
      score: inputScore,
      scoreSnapshot: snapshot,
      sourceBlockId: 'movement-block-active',
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const block = createMovementBlockFromAssessment({
      latestAssessment: { score: inputScore, scoreSnapshot: snapshot, id: START, assessment: resultAssessment },
    });

    expect(inputScore.weakestDomain).toBe('balance');
    expect(resultAssessment.results?.weakestDomain).toBe('balance');
    expect(resultAssessment.results?.rawMetrics?.focusTieBreakReason).toBe('preserve_current_focus');
    expect(block).toMatchObject({
      focusDomain: 'balance',
      focusSelectionKind: 'exact_tie',
      focusTieBreakReason: 'preserve_current_focus',
    });
  });

  it('accepts a near tie only when current focus metadata is present', () => {
    const inputScore = nearTieScore();
    const snapshot = scoreSnapshotFor(inputScore);
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: snapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const result = getBlockCreationEligibility({
      score: inputScore,
      scoreSnapshot: snapshot,
      assessment: resultAssessment,
    });

    expect(result).toMatchObject({
      eligible: true,
      focusDomain: 'strength_power',
      focusSelection: {
        kind: 'near_tie',
        focusDomain: 'strength',
        tiedDomains: ['strength', 'balance'],
        nearTiedDomains: ['strength', 'balance'],
        nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
        policyVersion: FOCUS_SELECTION_POLICY_VERSION,
        tieBreakReason: 'near_tie_deterministic_fallback',
      },
    });
    expect(resultAssessment.results?.rawMetrics?.nearTiedScoreDomains).toEqual(['strength', 'balance']);
    expect(resultAssessment.results?.rawMetrics?.nearTieMarginYears).toBe(INTERIM_NEAR_TIE_MARGIN_YEARS);
    expect(resultAssessment.results?.rawMetrics?.focusSelectionPolicyVersion).toBe(FOCUS_SELECTION_POLICY_VERSION);
  });

  it('preserves an active near-tied domain for official re-test focus metadata', () => {
    const snapshot = toStoredScoreSnapshot(nearTieScore('balance'), { activeFocusDomain: 'balance' })!;
    const inputScore = scoreFromSnapshot(snapshot);
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'official_retest',
      score: inputScore,
      scoreSnapshot: snapshot,
      sourceBlockId: 'movement-block-active',
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const block = createMovementBlockFromAssessment({
      latestAssessment: { score: inputScore, scoreSnapshot: snapshot, id: START, assessment: resultAssessment },
    });

    expect(inputScore.weakestDomain).toBe('balance');
    expect(resultAssessment.results?.weakestDomain).toBe('balance');
    expect(resultAssessment.results?.rawMetrics?.focusTieBreakReason).toBe('near_tie_preserve_current_focus');
    expect(block).toMatchObject({
      focusDomain: 'balance',
      focusSelectionKind: 'near_tie',
      focusTieBreakReason: 'near_tie_preserve_current_focus',
      focusNearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      focusSelectionPolicyVersion: FOCUS_SELECTION_POLICY_VERSION,
    });
  });

  it('fails closed when an exact-tie official score has no focus metadata', () => {
    const inputScore = exactTieScore();
    const snapshot = scoreSnapshotFor(inputScore);
    const { focusSelection: _focusSelection, ...legacySnapshot } = snapshot;
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: legacySnapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: legacySnapshot,
        assessment: resultAssessment,
      })
    ).toEqual({
      eligible: false,
      reason: 'missing_focus_metadata',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('fails closed when a near-tie official score has no focus metadata', () => {
    const inputScore = nearTieScore();
    const snapshot = scoreSnapshotFor(inputScore);
    const { focusSelection: _focusSelection, ...legacySnapshot } = snapshot;
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: legacySnapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: legacySnapshot,
        assessment: resultAssessment,
      })
    ).toEqual({
      eligible: false,
      reason: 'missing_focus_metadata',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('keeps manual near-tie assessments display-only for block creation', () => {
    const inputScore = nearTieScore();
    const snapshot = scoreSnapshotFor(inputScore);
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'manual_extra_v2',
      score: inputScore,
      scoreSnapshot: snapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: false,
    });

    expect(resultAssessment.results?.rawMetrics?.focusSelectionKind).toBe('near_tie');
    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: snapshot,
        assessment: resultAssessment,
      })
    ).toMatchObject({
      eligible: false,
      reason: 'non_official_assessment',
    });
  });

  it('rejects exact-tie metadata that disagrees between the snapshot and assessment', () => {
    const inputScore = exactTieScore();
    const snapshot = scoreSnapshotFor(inputScore);
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: snapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const mismatchedAssessment: MovementAssessment = {
      ...resultAssessment,
      results: {
        ...resultAssessment.results,
        rawMetrics: {
          ...resultAssessment.results?.rawMetrics,
          focusSelection: {
            kind: 'exact_tie',
            focusDomain: 'balance',
            tiedDomains: ['strength', 'balance'],
            tieBreakReason: 'preserve_current_focus',
          },
        },
      },
    };

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: snapshot,
        assessment: mismatchedAssessment,
      })
    ).toEqual({
      eligible: false,
      reason: 'score_assessment_mismatch',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('rejects a realistic no-measurement CheckUp after real scoring and assessment creation', () => {
    const inputScore = scoreCheckUp(noMeasurementCheckUp());
    const resultAssessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot: scoreSnapshotFor(inputScore),
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const eligibility = getBlockCreationEligibility({
      score: inputScore,
      scoreSnapshot: scoreSnapshotFor(inputScore),
      assessment: resultAssessment,
    });

    expect(inputScore.weakestDomain).toBeNull();
    expect(resultAssessment.status).toBe('invalid');
    expect(resultAssessment.results?.weakestDomain).toBeUndefined();
    expect(eligibility).toEqual({ eligible: false, reason: 'assessment_invalid', measuredDomains: [] });
    expect(
      tryCreateMovementBlockFromAssessment({
        latestAssessment: {
          score: inputScore,
          scoreSnapshot: scoreSnapshotFor(inputScore),
          id: START,
          assessment: resultAssessment,
        },
      })
    ).toMatchObject({
      ok: false,
      reason: 'assessment_invalid',
      measuredDomains: [],
    });
  });

  it('rejects Movement Profile V2 raw assessments with a stable unsupported protocol reason', () => {
    const inputScore = score('balance');
    const resultAssessment = assessment(inputScore);
    const v2Assessment: MovementAssessment = {
      ...resultAssessment,
      results: {
        ...resultAssessment.results,
        rawMetrics: {
          ...resultAssessment.results?.rawMetrics,
          checkUpProtocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
        },
      },
    };

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        assessment: v2Assessment,
      })
    ).toEqual({
      eligible: false,
      reason: 'unsupported_checkup_protocol',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('rejects all-skipped check-ups as no measured domains', () => {
    const inputScore = scoreCheckUp(skippedCheckUp());

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'non_official_assessment',
      measuredDomains: [],
    });
  });

  it('rejects no-measurement flags as no measured domains without a strength fallback', () => {
    const inputScore = scoreCheckUp(noMeasurementCheckUp());
    const result = getBlockCreationEligibility({ score: inputScore });

    expect(result).toEqual({ eligible: false, reason: 'non_official_assessment', measuredDomains: [] });
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
      scoreSnapshot: scoreSnapshotFor(inputScore),
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    expect(inputScore.weakestDomain).toBeNull();
    expect(resultAssessment.status).toBe('invalid');
    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        assessment: resultAssessment,
      })
    ).toEqual({
      eligible: false,
      reason: 'assessment_invalid',
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
      scoreSnapshot: scoreSnapshotFor(inputScore),
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });

    expect(inputScore.weakestDomain).toBe('balance');
    expect(resultAssessment.status).toBe('incomplete');
    expect(resultAssessment.results?.weakestDomain).toBeUndefined();
    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        assessment: resultAssessment,
      })
    ).toMatchObject({
      eligible: false,
      reason: 'assessment_incomplete',
      measuredDomains: ['balance'],
    });
  });

  it('rejects a null weakest domain even when another domain is measured', () => {
    const inputScore = { ...partialScore(), weakestDomain: null };

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'non_official_assessment',
      measuredDomains: ['strength_power'],
    });
  });

  it('rejects unsupported weakest-domain values without crashing', () => {
    const inputScore = { ...partialScore(), weakestDomain: 'cardio' as unknown as Domain };

    expect(getBlockCreationEligibility({ score: inputScore })).toEqual({
      eligible: false,
      reason: 'non_official_assessment',
      measuredDomains: ['strength_power'],
    });
  });

  it('rejects invalid assessment status even when a partial score exists', () => {
    const inputScore = partialScore();

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        assessment: assessment(inputScore, { status: 'invalid' }),
      })
    ).toEqual({
      eligible: false,
      reason: 'assessment_invalid',
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
      reason: 'non_official_assessment',
      measuredDomains: ['strength_power'],
    });
  });

  it('rejects score and assessment pairs from different Check-Up attempts', () => {
    const inputScore = score('balance');
    const mismatchedAssessment = assessment({
      ...inputScore,
      startedAt: '2026-06-20T08:00:00.000Z',
    });

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: scoreSnapshotFor(inputScore),
        assessment: mismatchedAssessment,
      })
    ).toEqual({
      eligible: false,
      reason: 'score_version_mismatch',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
    });
  });

  it('rejects snapshots whose source Check-Up id does not match the score', () => {
    const inputScore = score('balance');
    const mismatchedSnapshot = {
      ...scoreSnapshotFor(inputScore),
      sourceCheckUpId: '2026-06-20T08:00:00.000Z',
    };

    expect(
      getBlockCreationEligibility({
        score: inputScore,
        scoreSnapshot: mismatchedSnapshot,
        assessment: assessment(inputScore),
      })
    ).toEqual({
      eligible: false,
      reason: 'score_version_mismatch',
      measuredDomains: ['strength_power', 'balance', 'mobility'],
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
      scoreSnapshot: scoreSnapshotFor(scoreCheckUp(noMeasurementCheckUp())),
      completedAt: '2026-06-20T08:00:00.000Z',
      isOfficialForProgress: true,
    });

    expect(latestOfficialAssessmentAttempt([older, newer])?.id).toBe(newer.id);
    expect(latestUsableOfficialAssessment([older, newer])?.id).toBe('older-valid');
  });

  it('rejects completed block creation from partial headline evidence', () => {
    const inputScore = partialScore();
    const result = getBlockCreationEligibility({
      score: inputScore,
      scoreSnapshot: scoreSnapshotFor(inputScore),
      assessment: assessment(inputScore),
    });

    expect(result).toMatchObject({
      eligible: false,
      reason: 'assessment_incomplete',
      measuredDomains: ['strength_power'],
    });
  });
});
