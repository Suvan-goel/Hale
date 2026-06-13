/**
 * Guards the measurement chain's noise floor: the synthetic dry run holds
 * true velocity constant and varies ONLY camera setup (distance, placement,
 * slight angle offset, facing side, jitter). If a pipeline/grader change
 * pushes the between-session CV up, the velocity trend product breaks before
 * any user would notice — this test notices first.
 */

import { analyzeSessions, cvPct, syntheticNoiseFloorSessions } from '../noiseFloor';

describe('noise floor (synthetic setup-variance dry run)', () => {
  // Generating + grading 6 full sessions is the cost of the guarantee.
  const summary = analyzeSessions(syntheticNoiseFloorSessions());

  it('every session is usable (calibrates, counts all 10 reps)', () => {
    expect(summary.usableSessions).toBe(6);
    for (const s of summary.sessions) expect(s.reps).toBe(10);
  });

  it('between-session CV of the normalized metric stays ≤ 2%', () => {
    // Measured 0.44% at introduction; 2% leaves headroom for benign drift
    // while staying far inside the 10% product budget.
    expect(summary.betweenSessionCvPct).toBeLessThanOrEqual(2);
  });

  it('body-unit normalization beats the unnormalized control by ≥ 5×', () => {
    expect(summary.betweenSessionCvRawPct).toBeGreaterThan(
      summary.betweenSessionCvPct * 5
    );
  });
});

describe('cvPct', () => {
  it('computes sample CV in percent', () => {
    expect(cvPct([10, 10, 10])).toBe(0);
    expect(cvPct([9, 11])).toBeCloseTo((Math.sqrt(2) / 10) * 100, 6);
    expect(Number.isNaN(cvPct([5]))).toBe(true);
  });
});
