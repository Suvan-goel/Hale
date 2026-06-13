/**
 * Velocity autoregulation: the unit rule (>25% below the set best for 2
 * consecutive reps) plus an end-to-end check that a rep set fed decaying
 * velocity ends EARLY, marks the result autoregulated (a normal completion,
 * never a failure), and asks for the "that's your set" line.
 */

import { STS_STANDARD_ID } from '../index';
import { DEFAULT_AUTOREGULATOR_CONFIG, VelocityAutoregulator } from '../autoregulation';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { gradeExerciseSet } from '../testing/gradeExerciseSet';

describe('VelocityAutoregulator rule', () => {
  it('steady velocity never triggers', () => {
    const a = new VelocityAutoregulator();
    let triggered = false;
    for (let i = 0; i < 12; i++) triggered = a.addRep(1.0) || triggered;
    expect(triggered).toBe(false);
  });

  it('triggers after two consecutive reps >25% below the set best', () => {
    const a = new VelocityAutoregulator();
    expect(a.addRep(1.0)).toBe(false); // best = 1.0
    expect(a.addRep(1.0)).toBe(false);
    expect(a.addRep(0.95)).toBe(false); // within band
    expect(a.addRep(0.7)).toBe(false); // slow #1 (30% down)
    expect(a.addRep(0.7)).toBe(true); // slow #2 → stop
  });

  it('a recovered rep resets the consecutive-slow counter', () => {
    const a = new VelocityAutoregulator();
    a.addRep(1.0);
    a.addRep(1.0);
    a.addRep(0.7); // slow #1
    expect(a.addRep(0.95)).toBe(false); // recovered → counter reset
    expect(a.addRep(0.7)).toBe(false); // slow #1 again
    expect(a.addRep(0.7)).toBe(true); // slow #2 → stop
  });

  it('does not stop within the warm-up reps', () => {
    const a = new VelocityAutoregulator();
    // Two very slow reps immediately — but before minRepsBeforeStop elapses.
    for (let i = 0; i < DEFAULT_AUTOREGULATOR_CONFIG.minRepsBeforeStop; i++) {
      expect(a.addRep(0.1)).toBe(false);
    }
  });
});

describe('RepsSetGrader autoregulation end-to-end', () => {
  it('ends the set early on fading power and logs a normal completion', () => {
    // Four fast rises set the best; two slow rises trip autoregulation before
    // the remaining reps (and well before the rep target of 10).
    const session = chairStandSession({
      seed: 41,
      riseMsPerRep: [900, 900, 900, 900, 2200, 2200, 900, 900],
    });
    const g = gradeExerciseSet(STS_STANDARD_ID, session.frames);

    expect(g.autoregFiredAtMs).not.toBeNull();
    expect(g.result.autoregulated).toBe(true);
    expect(g.result.reps).toBeLessThan(8); // ended before the last rises
    expect(g.result.reps).toBeGreaterThanOrEqual(5);
    expect(g.result.flags).not.toContain('failed');
    expect(g.voiceCues).toContain('thats-your-set');
  });
});
