/**
 * Norm inversion + domain scoring. Verifies value→age mapping (interpolation,
 * ceiling/floor, estimate flagging) and that a CheckUp scores into three
 * domain ranges with a coherent weakest-domain pick — including when tests are
 * skipped or unmeasured.
 */

import { CheckUp } from '../../checkup/types';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  TUG_ID,
} from '../../movements';
import {
  CHAIR_STAND_REPS_NORM,
  SHOULDER_FLEXION_NORM,
  TUG_SECONDS_NORM,
  inferAge,
  scoreCheckUp,
} from '../index';

describe('norm inversion', () => {
  it('interpolates chair-stand reps to an age within the real table', () => {
    const e = inferAge(CHAIR_STAND_REPS_NORM, 14);
    expect(e.age).toBeGreaterThan(67);
    expect(e.age).toBeLessThan(72);
    expect(e.estimated).toBe(false);
    expect(e.ceiling).toBe(false);
  });

  it('flags an off-the-top measurement as ceiling + young', () => {
    const e = inferAge(CHAIR_STAND_REPS_NORM, 30);
    expect(e.ceiling).toBe(true);
    expect(e.age).toBeLessThanOrEqual(47);
    expect(e.estimated).toBe(true); // youngest anchor is in the extrapolated band
  });

  it('clamps a very low rep count to the oldest anchor (floor)', () => {
    const e = inferAge(CHAIR_STAND_REPS_NORM, 4);
    expect(e.floor).toBe(true);
    expect(e.age).toBe(92);
  });

  it('inverts TUG seconds (lower is younger)', () => {
    const fast = inferAge(TUG_SECONDS_NORM, 7.4);
    const slow = inferAge(TUG_SECONDS_NORM, 11.3);
    expect(fast.age).toBeLessThan(slow.age);
    expect(slow.floor).toBe(true);
  });

  it('always flags the estimated shoulder-flexion norm', () => {
    expect(inferAge(SHOULDER_FLEXION_NORM, 155).estimated).toBe(true);
  });
});

// ---- scoring fixtures -----------------------------------------------------

function measured(movementId: string, result: Record<string, unknown>): CheckUp['items'][number] {
  return {
    movementId,
    status: 'measured',
    result: { movementId, flags: [], interruptions: 0, ...result } as never,
  };
}

function checkUp(items: CheckUp['items']): CheckUp {
  return { startedAt: '2026-06-13T10:00:00.000Z', bodyUnit: 0.33, items };
}

const fullItems: CheckUp['items'] = [
  measured(CHAIR_STAND_ID, { reps: 14, repStats: [], sessionMeanVel: 0.22, sessionMeanPeakVel: 0.3, pushOffDetected: false }),
  measured(TUG_ID, { totalSec: 8.5, completed: true, turnDetected: true, peakExcursionBu: 1.9, nonStandardShortPath: false }),
  measured(BALANCE_LADDER_ID, { stages: [], singleLegEyesOpenSec: 12 }),
  measured(SHOULDER_FLEXION_ID, { peakFlexionDeg: 158 }),
  measured(HINGE_REACH_ID, { reachBu: 0.2 }),
];

describe('domain scoring', () => {
  it('scores all three domains with age ranges and interpretations', () => {
    const score = scoreCheckUp(checkUp(fullItems));
    expect(score.domains.map((d) => d.domain)).toEqual(['strength', 'balance', 'mobility']);
    for (const d of score.domains) {
      expect(d.measured).toBe(true);
      expect(d.ageLow).toBeLessThanOrEqual(d.ageHigh);
      expect(d.interpretation.length).toBeGreaterThan(0);
      expect(d.rows.length).toBeGreaterThanOrEqual(2);
    }
    // Mobility rests on the estimated shoulder norm.
    expect(score.domains.find((d) => d.domain === 'mobility')!.estimated).toBe(true);
  });

  it('never emits a medical claim or composite score', () => {
    const score = scoreCheckUp(checkUp(fullItems));
    const text = score.domains.map((d) => d.interpretation).join(' ').toLowerCase();
    expect(text).not.toMatch(/fall risk|diagnos|disease|sarcopenia/);
    expect(score).not.toHaveProperty('compositeScore');
  });

  it('picks the oldest measured domain as weakest', () => {
    // Short one-leg hold → balance reads old; strong chair stand → strength reads young.
    const items: CheckUp['items'] = [
      measured(CHAIR_STAND_ID, { reps: 18, repStats: [], sessionMeanVel: 0.3, sessionMeanPeakVel: 0.4, pushOffDetected: false }),
      measured(TUG_ID, { totalSec: 11.3, completed: true, turnDetected: true, peakExcursionBu: 1.9, nonStandardShortPath: false }),
      measured(BALANCE_LADDER_ID, { stages: [], singleLegEyesOpenSec: 6 }),
      measured(SHOULDER_FLEXION_ID, { peakFlexionDeg: 160 }),
    ];
    expect(scoreCheckUp(checkUp(items)).weakestDomain).toBe('balance');
  });

  it('skipped / unmeasured tests yield a coherent, partial result', () => {
    const items: CheckUp['items'] = [
      { movementId: CHAIR_STAND_ID, status: 'skipped', result: null },
      measured(TUG_ID, { totalSec: 8.1, completed: true, turnDetected: true, peakExcursionBu: 1.9, nonStandardShortPath: false }),
      measured(BALANCE_LADDER_ID, { stages: [], singleLegEyesOpenSec: 18 }),
      // shoulder present but unmeasured (no-measurement flag)
      { movementId: SHOULDER_FLEXION_ID, status: 'measured', result: { movementId: SHOULDER_FLEXION_ID, flags: ['no-measurement'], interruptions: 0, peakFlexionDeg: NaN } as never },
    ];
    const score = scoreCheckUp(checkUp(items));
    const strength = score.domains.find((d) => d.domain === 'strength')!;
    const balance = score.domains.find((d) => d.domain === 'balance')!;
    const mobility = score.domains.find((d) => d.domain === 'mobility')!;
    expect(strength.measured).toBe(false);
    expect(strength.interpretation).toMatch(/not measured/i);
    expect(balance.measured).toBe(true);
    expect(mobility.measured).toBe(false);
    expect(score.weakestDomain).toBe('balance'); // only measured domain
  });
});
