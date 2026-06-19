import type { CheckUp } from '../../checkup/types';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  TUG_ID,
} from '../../movements';
import {
  BALANCE_SINGLE_LEG_EYES_OPEN_MAX_SEC_FOR_SCORING,
  CHAIR_STAND_MAX_REPS_FOR_SCORING,
  scoreCheckUp,
  scoreCheckUpWithDiagnostics,
  validateCheckUpForScoring,
  type Domain,
  type ScoringInputIssue,
} from '../index';

function measured(movementId: string, result: Record<string, unknown>): CheckUp['items'][number] {
  return {
    movementId,
    status: 'measured',
    result: { movementId, flags: [], interruptions: 0, ...result } as never,
  };
}

function checkUp(items: CheckUp['items']): CheckUp {
  return { startedAt: '2026-06-19T08:00:00.000Z', bodyUnit: 0.33, items };
}

function chair(result: Record<string, unknown> = {}): CheckUp['items'][number] {
  return measured(CHAIR_STAND_ID, {
    reps: 14,
    repStats: [],
    sessionMeanVel: 0.28,
    sessionMeanPeakVel: 0.42,
    pushOffDetected: false,
    ...result,
  });
}

function balance(result: Record<string, unknown> = {}): CheckUp['items'][number] {
  return measured(BALANCE_LADDER_ID, {
    stages: [],
    singleLegEyesOpenSec: 10,
    ...result,
  });
}

function tug(result: Record<string, unknown> = {}): CheckUp['items'][number] {
  return measured(TUG_ID, {
    totalSec: 8.5,
    completed: true,
    turnDetected: true,
    peakExcursionBu: 1.9,
    nonStandardShortPath: false,
    ...result,
  });
}

function shoulder(result: Record<string, unknown> = {}): CheckUp['items'][number] {
  return measured(SHOULDER_FLEXION_ID, {
    peakFlexionDeg: 152,
    ...result,
  });
}

function hinge(result: Record<string, unknown> = {}): CheckUp['items'][number] {
  return measured(HINGE_REACH_ID, {
    reachBu: 0.18,
    ...result,
  });
}

function fullCheckUp(): CheckUp {
  return checkUp([chair(), tug(), balance(), shoulder(), hinge()]);
}

function domain(score: ReturnType<typeof scoreCheckUp>, name: Domain) {
  return score.domains.find((item) => item.domain === name)!;
}

function codes(issues: readonly ScoringInputIssue[]): string[] {
  return issues.map((issue) => issue.code);
}

function issueFieldsAreSafe(issues: readonly ScoringInputIssue[]): boolean {
  return issues.every((issue) => Object.keys(issue).every((key) => key === 'code' || key === 'movementId' || key === 'field'));
}

describe('scoring input validation', () => {
  it('leaves a valid production-shaped check-up unchanged and issue-free', () => {
    const plainScore = scoreCheckUp(fullCheckUp());
    const withDiagnostics = scoreCheckUpWithDiagnostics(fullCheckUp());

    expect(withDiagnostics.score).toEqual(plainScore);
    expect(withDiagnostics.issues).toEqual([]);
    expect(withDiagnostics.score.domains.every((item) => item.measured)).toBe(true);
    expect(withDiagnostics.score.weakestDomain).toMatch(/strength|balance|mobility/);
  });

  it('fails closed for missing, malformed, non-finite, fractional, and impossible chair reps', () => {
    const malformedReps = [
      undefined,
      null,
      '14',
      true,
      {},
      NaN,
      Infinity,
      -Infinity,
      -1,
      0,
      1.5,
      CHAIR_STAND_MAX_REPS_FOR_SCORING + 1,
    ];

    for (const reps of malformedReps) {
      const chairItem = chair(reps === undefined ? {} : { reps });
      if (reps === undefined) delete (chairItem.result as unknown as Record<string, unknown>).reps;
      const { score, issues } = scoreCheckUpWithDiagnostics(checkUp([chairItem, balance(), shoulder()]));
      const strength = domain(score, 'strength');

      expect(strength.measured).toBe(false);
      expect(strength.rows[0]).toMatchObject({ display: '—', measured: false });
      expect(score.weakestDomain).not.toBe('strength');
      expect(domain(score, 'balance').measured).toBe(true);
      expect(domain(score, 'mobility').measured).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      expect(issueFieldsAreSafe(issues)).toBe(true);
    }
  });

  it('accepts the chair protocol cap exactly and rejects values above it', () => {
    const atCap = scoreCheckUpWithDiagnostics(checkUp([chair({ reps: CHAIR_STAND_MAX_REPS_FOR_SCORING })]));
    const aboveCap = scoreCheckUpWithDiagnostics(checkUp([chair({ reps: CHAIR_STAND_MAX_REPS_FOR_SCORING + 1 })]));

    expect(domain(atCap.score, 'strength').measured).toBe(true);
    expect(domain(aboveCap.score, 'strength').measured).toBe(false);
    expect(codes(aboveCap.issues)).toContain('out_of_protocol_range');
  });

  it('keeps valid chair reps while omitting malformed rise velocity as supporting detail', () => {
    const { score, issues } = scoreCheckUpWithDiagnostics(checkUp([chair({ sessionMeanVel: 'fast' })]));
    const strength = domain(score, 'strength');

    expect(strength.measured).toBe(true);
    expect(strength.rows.find((row) => row.label === 'Chair stands in 30s')).toMatchObject({
      display: '14 reps',
      measured: true,
    });
    expect(strength.rows.find((row) => row.label === 'Rise velocity')).toMatchObject({
      display: '—',
      measured: false,
    });
    expect(codes(issues)).toContain('invalid_metric_type');
  });

  it('does not assume missing or malformed flags are an empty safe flag list', () => {
    const missingFlags = chair();
    delete (missingFlags.result as unknown as Record<string, unknown>).flags;
    const malformedFlags = chair();
    (malformedFlags.result as unknown as Record<string, unknown>).flags = 'no-measurement';

    for (const item of [missingFlags, malformedFlags]) {
      const { score, issues } = scoreCheckUpWithDiagnostics(checkUp([item]));
      expect(domain(score, 'strength').measured).toBe(false);
      expect(issues.length).toBeGreaterThan(0);
      expect(issueFieldsAreSafe(issues)).toBe(true);
    }
  });

  it('treats skipped, unmeasured, unknown-status, and no-measurement items as unusable even with valid-looking results', () => {
    const skippedWithResult = { ...chair(), status: 'skipped' as const };
    const unmeasuredWithResult = { ...chair(), status: 'unmeasured' as const };
    const unknownStatus = { ...chair(), status: 'restored' as never };
    const noMeasurement = chair();
    (noMeasurement.result as unknown as Record<string, unknown>).flags = ['no-measurement'];

    for (const item of [skippedWithResult, unmeasuredWithResult, unknownStatus, noMeasurement]) {
      const { score } = scoreCheckUpWithDiagnostics(checkUp([item]));
      expect(domain(score, 'strength').measured).toBe(false);
    }
  });

  it('invalidates duplicate known movement IDs instead of selecting first or last', () => {
    const duplicateChair = checkUp([
      chair({ reps: 64 }),
      chair({ reps: 1 }),
      balance(),
      shoulder(),
    ]);
    const { score, issues } = scoreCheckUpWithDiagnostics(duplicateChair);

    expect(domain(score, 'strength').measured).toBe(false);
    expect(domain(score, 'balance').measured).toBe(true);
    expect(domain(score, 'mobility').measured).toBe(true);
    expect(issues).toContainEqual({ code: 'duplicate_movement', movementId: CHAIR_STAND_ID });
  });

  it('applies duplicate known movement rules to every scoring item', () => {
    const primaryCases: Array<[string, string, CheckUp['items']]> = [
      [CHAIR_STAND_ID, 'strength', [chair(), chair({ reps: 12 }), balance(), shoulder()]],
      [BALANCE_LADDER_ID, 'balance', [balance(), balance({ singleLegEyesOpenSec: 8 }), chair(), shoulder()]],
      [SHOULDER_FLEXION_ID, 'mobility', [shoulder(), shoulder({ peakFlexionDeg: 140 }), chair(), balance()]],
    ];

    for (const [movementId, affectedDomain, items] of primaryCases) {
      const { score, issues } = scoreCheckUpWithDiagnostics(checkUp(items));
      expect(domain(score, affectedDomain as Domain).measured).toBe(false);
      expect(issues).toContainEqual({ code: 'duplicate_movement', movementId });
    }

    const duplicateTug = scoreCheckUpWithDiagnostics(checkUp([tug(), tug({ totalSec: 10 }), balance()]));
    expect(domain(duplicateTug.score, 'balance').measured).toBe(true);
    expect(domain(duplicateTug.score, 'balance').rows.find((row) => row.label === 'Up-and-go time')).toMatchObject({
      display: '—',
      measured: false,
    });
    expect(duplicateTug.issues).toContainEqual({ code: 'duplicate_movement', movementId: TUG_ID });

    const duplicateHinge = scoreCheckUpWithDiagnostics(checkUp([shoulder(), hinge(), hinge({ reachBu: 0.3 })]));
    expect(domain(duplicateHinge.score, 'mobility').measured).toBe(true);
    expect(domain(duplicateHinge.score, 'mobility').rows.find((row) => row.label === 'Forward reach to floor')).toMatchObject({
      display: '—',
      measured: false,
    });
    expect(duplicateHinge.issues).toContainEqual({ code: 'duplicate_movement', movementId: HINGE_REACH_ID });
  });

  it('ignores unknown movement IDs safely', () => {
    const { score, issues } = scoreCheckUpWithDiagnostics(
      checkUp([
        measured('unknown-movement', { reps: 999 }),
        chair(),
      ])
    );

    expect(domain(score, 'strength').measured).toBe(true);
    expect(issues).toEqual([]);
  });

  it('rejects impossible balance headline values before norm lookup', () => {
    for (const singleLegEyesOpenSec of [-1, 0, BALANCE_SINGLE_LEG_EYES_OPEN_MAX_SEC_FOR_SCORING + 0.1, 999]) {
      const { score, issues } = scoreCheckUpWithDiagnostics(checkUp([balance({ singleLegEyesOpenSec }), chair(), shoulder()]));
      expect(domain(score, 'balance').measured).toBe(false);
      expect(domain(score, 'strength').measured).toBe(true);
      expect(domain(score, 'mobility').measured).toBe(true);
      expect(codes(issues)).toContain('out_of_protocol_range');
    }

    const atMax = scoreCheckUpWithDiagnostics(
      checkUp([balance({ singleLegEyesOpenSec: BALANCE_SINGLE_LEG_EYES_OPEN_MAX_SEC_FOR_SCORING })])
    );
    expect(domain(atMax.score, 'balance').measured).toBe(true);
  });

  it('omits malformed TUG support without invalidating a valid balance hold', () => {
    const { score, issues } = scoreCheckUpWithDiagnostics(
      checkUp([tug({ totalSec: '8.5' }), balance({ singleLegEyesOpenSec: 9 })])
    );
    const balanceDomain = domain(score, 'balance');

    expect(balanceDomain.measured).toBe(true);
    expect(balanceDomain.rows.find((row) => row.label === 'Up-and-go time')).toMatchObject({
      display: '—',
      measured: false,
    });
    expect(codes(issues)).toContain('invalid_metric_type');
  });

  it('rejects shoulder values outside the production capture envelope', () => {
    for (const peakFlexionDeg of [-1, 34.99, 181, 999]) {
      const { score, issues } = scoreCheckUpWithDiagnostics(checkUp([shoulder({ peakFlexionDeg }), chair(), balance()]));
      expect(domain(score, 'mobility').measured).toBe(false);
      expect(domain(score, 'strength').measured).toBe(true);
      expect(domain(score, 'balance').measured).toBe(true);
      expect(codes(issues)).toContain('out_of_protocol_range');
    }

    expect(domain(scoreCheckUp(checkUp([shoulder({ peakFlexionDeg: 35 })])), 'mobility').measured).toBe(true);
    expect(domain(scoreCheckUp(checkUp([shoulder({ peakFlexionDeg: 180 })])), 'mobility').measured).toBe(true);
  });

  it('keeps valid shoulder scoring while omitting malformed hinge support; negative hinge reach remains valid', () => {
    const malformedHinge = scoreCheckUpWithDiagnostics(checkUp([shoulder(), hinge({ reachBu: '0.2' })]));
    const negativeHinge = scoreCheckUpWithDiagnostics(checkUp([shoulder(), hinge({ reachBu: -0.05 })]));

    expect(domain(malformedHinge.score, 'mobility').measured).toBe(true);
    expect(domain(malformedHinge.score, 'mobility').rows.find((row) => row.label === 'Forward reach to floor')).toMatchObject({
      display: '—',
      measured: false,
    });
    expect(codes(malformedHinge.issues)).toContain('invalid_metric_type');
    expect(domain(negativeHinge.score, 'mobility').rows.find((row) => row.label === 'Forward reach to floor')).toMatchObject({
      display: '-0.05 bu',
      measured: true,
    });
  });

  it('handles malformed whole-checkup shapes without throwing or inventing a score', () => {
    for (const malformed of [null, {}, { startedAt: 'x', items: null }, { startedAt: 'x', items: [null] }]) {
      const validated = validateCheckUpForScoring(malformed);
      expect(validated.issues.length).toBeGreaterThan(0);
      expect(issueFieldsAreSafe(validated.issues)).toBe(true);
    }
  });
});
