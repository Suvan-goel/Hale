/**
 * Per-set grader acceptance: each of the three set graders fed synthetic
 * recordings through the full pipeline (the same ground-truth generators the
 * assessment graders use). Reps counting + velocity reuse the chair-stand
 * generator; holds reuse the balance generator; ROM reuses the hinge generator.
 */

import {
  BALANCE_SINGLE_LEG_ID,
  HAMSTRING_REACH_ID,
  STS_CUSHION_ID,
} from '../index';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { balanceSession } from '../../pose/testing/syntheticBalance';
import { hingeReachSession } from '../../pose/testing/syntheticRom';
import { gradeExerciseSet } from '../testing/gradeExerciseSet';

describe('RepsSetGrader (sit-to-stand)', () => {
  it('counts clean reps and measures concentric velocity', () => {
    const session = chairStandSession({ seed: 11, riseMsPerRep: [1200, 1200, 1200, 1200, 1200] });
    const g = gradeExerciseSet(STS_CUSHION_ID, session.frames);
    expect(g.result.reps).toBe(session.truth.expectedReps);
    expect(g.result.autoregulated).toBe(false);
    const trueVel = session.truth.repTrueMeanVelBu[0];
    expect(Math.abs(g.result.meanVel - trueVel)).toBeLessThan(trueVel * 0.12);
  });

  it('completes the set at the rep target (cushion STS target = 8)', () => {
    const session = chairStandSession({ seed: 12, riseMsPerRep: Array(8).fill(1200) });
    const g = gradeExerciseSet(STS_CUSHION_ID, session.frames);
    expect(g.result.reps).toBe(8);
    expect(g.result.reachedTarget).toBe(true);
    expect(g.completeAtMs).not.toBeNull();
  });

  it('a mid-set tracking interruption never double-counts', () => {
    const options = { seed: 13, riseMsPerRep: Array(6).fill(1200), restMs: 5000 } as const;
    const dry = chairStandSession(options);
    // Place a gone-window in rep index 2's seated rest.
    const restSegIndex = 3 + 2 * 4 + 3;
    let restStartMs = 0;
    for (let i = 0; i < restSegIndex; i++) restStartMs += dry.segments[i].durMs;
    const session = chairStandSession({
      ...options,
      goneWindows: [{ startMs: restStartMs + 200, endMs: restStartMs + 2500 }],
    });
    const g = gradeExerciseSet(STS_CUSHION_ID, session.frames);
    expect(g.result.reps).toBe(session.truth.expectedReps);
    expect(g.result.interruptions).toBeGreaterThan(0);
  });
});

describe('HoldSetGrader (single-leg balance)', () => {
  it('times a maintained single-leg hold', () => {
    const session = balanceSession({
      seed: 21,
      stages: [{ stance: 'single-leg', windowMs: 12000, outcome: 'completed' }],
    });
    const g = gradeExerciseSet(BALANCE_SINGLE_LEG_ID, session.frames);
    expect(g.result.flags).not.toContain('no-measurement');
    expect(g.result.holdSec).toBeGreaterThan(5);
  });
});

describe('RomSetGrader (seated hamstring reach)', () => {
  it('captures a peak trunk-flexion angle', () => {
    const session = hingeReachSession({ seed: 31, peakFoldDeg: 80 });
    const g = gradeExerciseSet(HAMSTRING_REACH_ID, session.frames);
    expect(g.result.flags).not.toContain('no-measurement');
    expect(Number.isFinite(g.result.romPeak)).toBe(true);
    // A real fold drops the hip angle well below an upright ~170°.
    expect(g.result.romPeak).toBeLessThan(150);
  });
});
