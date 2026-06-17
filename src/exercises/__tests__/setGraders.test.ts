/**
 * Per-set grader acceptance: each of the three set graders fed synthetic
 * recordings through the full pipeline (the same ground-truth generators the
 * assessment graders use). Reps counting + velocity reuse the chair-stand
 * generator; holds reuse the balance generator; ROM reuses the hinge generator.
 */

import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
  BAND_PULL_APART_ID,
  BRIDGE_HOLD_ID,
  HEEL_RAISE_FREE_ID,
  HEEL_RAISE_SUPPORTED_ID,
  HAMSTRING_REACH_ID,
  HIP_FLEXOR_STRETCH_ID,
  LATERAL_WALK_MINI_BAND_ID,
  LOADED_MARCH_ID,
  NECK_ROTATION_ID,
  OVERHEAD_PRESS_ID,
  OVERHEAD_REACH_ID,
  SEATED_BAND_ROW_ID,
  SIDE_STEP_SUPPORTED_ID,
  STS_CUSHION_ID,
  STANDING_BAND_ROW_ID,
  THORACIC_ROTATION_ID,
  TOE_RAISE_SUPPORTED_ID,
  WALL_CALF_STRETCH_ID,
  getExercise,
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

  it('uses valid-time metadata for all Phase 1 balance holds', () => {
    const cases = [
      { id: BALANCE_FEET_TOGETHER_ID, stance: 'feet-together' as const, targetSec: 20 },
      { id: BALANCE_TANDEM_ID, stance: 'tandem' as const, targetSec: 20 },
      { id: BALANCE_SINGLE_LEG_ID, stance: 'single-leg' as const, targetSec: 15 },
    ];
    for (const c of cases) {
      const session = balanceSession({
        seed: 22,
        stages: [{ stance: c.stance, windowMs: (c.targetSec + 3) * 1000, outcome: 'completed' }],
      });
      const g = gradeExerciseSet(c.id, session.frames);
      expect(getExercise(c.id).timing?.mode).toBe('valid_time');
      expect(g.result.validTime).toBeTruthy();
      expect(g.result.validTime?.completedByValidTime).toBe(true);
      expect(g.result.holdSec).toBeGreaterThanOrEqual(c.targetSec - 0.1);
    }
  });

  it('uses valid-time metadata for bridge hold', () => {
    const session = balanceSession({
      seed: 23,
      stages: [{ stance: 'feet-together', windowMs: 3000, outcome: 'completed' }],
    });
    const g = gradeExerciseSet(BRIDGE_HOLD_ID, session.frames);
    expect(getExercise(BRIDGE_HOLD_ID).timing?.mode).toBe('valid_time');
    expect(g.result.validTime).toBeTruthy();
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

  it('uses valid-time metadata for seated hamstring reach only', () => {
    const session = hingeReachSession({ seed: 32, peakFoldDeg: 82, holdMs: 13000 });
    const g = gradeExerciseSet(HAMSTRING_REACH_ID, session.frames);
    expect(getExercise(HAMSTRING_REACH_ID).timing?.mode).toBe('valid_time');
    expect(g.result.validTime).toBeTruthy();
    expect(g.result.validTime?.accumulatedValidSeconds).toBeGreaterThan(0);
    expect(getExercise(NECK_ROTATION_ID).timing).toBeUndefined();
  });
});

describe('TimerSetGrader broad valid-time mode', () => {
  it('counts broad setup-gated time for the Phase 2 timer drills', () => {
    const front = balanceSession({
      seed: 51,
      stages: [{ stance: 'feet-together', windowMs: 40000, outcome: 'completed' }],
    });
    const side = hingeReachSession({
      seed: 52,
      peakFoldDeg: 0,
      foldMs: 100,
      holdMs: 40000,
    });
    const cases = [
      { id: THORACIC_ROTATION_ID, frames: front.frames },
      { id: HIP_FLEXOR_STRETCH_ID, frames: side.frames },
      { id: WALL_CALF_STRETCH_ID, frames: side.frames },
      { id: SIDE_STEP_SUPPORTED_ID, frames: front.frames },
      { id: LATERAL_WALK_MINI_BAND_ID, frames: front.frames },
    ];

    for (const c of cases) {
      const g = gradeExerciseSet(c.id, c.frames);
      expect(getExercise(c.id).timing?.mode).toBe('valid_time');
      expect(g.completeAtMs).not.toBeNull();
      expect(g.result.validTime?.validationMode).toBe('broad_setup_gated');
      expect(g.result.validTime?.completedByValidTime).toBe(true);
      expect(g.result.holdSec).toBeGreaterThanOrEqual(29.9);
      expect(g.result.flags).not.toContain('no-measurement');
    }
  });

  it('pauses on sustained subject loss and resumes after reacquisition', () => {
    const session = balanceSession({
      seed: 53,
      stages: [{ stance: 'feet-together', windowMs: 47000, outcome: 'completed' }],
      goneWindows: [{ startMs: 10000, endMs: 13000 }],
    });
    const g = gradeExerciseSet(SIDE_STEP_SUPPORTED_ID, session.frames);
    expect(g.result.validTime?.validationMode).toBe('broad_setup_gated');
    expect(g.result.validTime?.pauseCount).toBeGreaterThan(0);
    expect(g.result.validTime?.trackingLostSeconds).toBeGreaterThan(2);
    expect(g.result.interruptions).toBeGreaterThan(0);
    expect(g.result.validTime?.completedByValidTime).toBe(true);
  });
});

describe('valid-time opt-in guardrails', () => {
  it('leaves rep-based and explicitly excluded timer candidates unchanged', () => {
    const session = chairStandSession({ seed: 41, riseMsPerRep: Array(8).fill(1200) });
    const reps = gradeExerciseSet(STS_CUSHION_ID, session.frames);
    expect(getExercise(STS_CUSHION_ID).timing).toBeUndefined();
    expect(reps.result.validTime).toBeUndefined();
    expect(getExercise(LOADED_MARCH_ID).timing).toBeUndefined();
    expect(getExercise(OVERHEAD_REACH_ID).timing).toBeUndefined();
    expect(getExercise(OVERHEAD_PRESS_ID).timing).toBeUndefined();
    expect(getExercise(HEEL_RAISE_SUPPORTED_ID).timing).toBeUndefined();
    expect(getExercise(HEEL_RAISE_FREE_ID).timing).toBeUndefined();
    expect(getExercise(TOE_RAISE_SUPPORTED_ID).timing).toBeUndefined();
    expect(getExercise(BAND_PULL_APART_ID).timing).toBeUndefined();
    expect(getExercise(SEATED_BAND_ROW_ID).timing).toBeUndefined();
    expect(getExercise(STANDING_BAND_ROW_ID).timing).toBeUndefined();
    expect(getExercise(NECK_ROTATION_ID).timing).toBeUndefined();
  });
});
