/**
 * Progression engine: the deterministic promote/hold/demote rules, level
 * clamping to the family ladder, velocity-trend gating, and the distillation of
 * a played item into a session summary. No ML — every path is a fixed rule and
 * fully covered here.
 */

import { BRIDGE_HOLD_ID, STS_STANDARD_ID, getExercise } from '../../exercises';
import {
  DEFAULT_PROGRESSION_CONFIG,
  ExerciseSessionSummary,
  applySession,
  decideLevel,
  initialProgressionState,
  summarizeItem,
} from '../progression';
import { SetResult } from '../../exercises';
import { TrainingItemResult } from '../sessionPlayer';

const STS_FAMILY = 'sit-to-stand'; // 4 levels

function summary(over: Partial<ExerciseSessionSummary> = {}): ExerciseSessionSummary {
  return {
    exerciseId: STS_STANDARD_ID,
    family: STS_FAMILY,
    level: 2,
    kind: 'reps',
    meanVel: 1.0,
    totalReps: 30,
    targetReps: 30,
    reachedAllTargets: true,
    autoregulated: false,
    measured: true,
    ...over,
  };
}

describe('decideLevel rules', () => {
  it('promotes on full completion when there is no trend yet', () => {
    expect(decideLevel(2, 4, summary(), NaN)).toEqual({ level: 3, action: 'promote' });
  });

  it('promotes when velocity is at/above the personal trend', () => {
    expect(decideLevel(2, 4, summary({ meanVel: 1.0 }), 1.0).action).toBe('promote');
  });

  it('holds a complete session whose velocity is below trend', () => {
    expect(decideLevel(2, 4, summary({ meanVel: 0.8 }), 1.0)).toEqual({ level: 2, action: 'hold' });
  });

  it('demotes when the user struggled with no autoregulation', () => {
    const s = summary({ reachedAllTargets: false, autoregulated: false });
    expect(decideLevel(2, 4, s, NaN)).toEqual({ level: 1, action: 'demote' });
  });

  it('demotes when autoregulation fires very early', () => {
    const s = summary({ reachedAllTargets: false, autoregulated: true, totalReps: 10, targetReps: 30 });
    expect(decideLevel(3, 4, s, NaN).action).toBe('demote');
  });

  it('holds a normal (not early) autoregulation stop', () => {
    const s = summary({ reachedAllTargets: false, autoregulated: true, totalReps: 26, targetReps: 30 });
    expect(decideLevel(2, 4, s, NaN)).toEqual({ level: 2, action: 'hold' });
  });

  it('holds when there was no usable measurement', () => {
    expect(decideLevel(2, 4, summary({ measured: false, reachedAllTargets: false }), NaN).action).toBe('hold');
  });

  it('clamps promotion at the top and demotion at the bottom of the ladder', () => {
    expect(decideLevel(4, 4, summary(), NaN)).toEqual({ level: 4, action: 'promote' });
    const s = summary({ reachedAllTargets: false, autoregulated: false });
    expect(decideLevel(1, 4, s, NaN)).toEqual({ level: 1, action: 'demote' });
  });
});

describe('applySession state', () => {
  it('records velocity history and gates the next promotion on it', () => {
    const s0 = initialProgressionState();
    // Session 1: a strong effort with no trend yet → promote and bank vel 1.0.
    const s1 = applySession(s0, [summary({ level: 2, meanVel: 1.0 })]);
    expect(s1.levels[STS_FAMILY]).toBe(3);
    expect(s1.velHistory[STS_STANDARD_ID]).toEqual([1.0]);

    // Session 2: complete but slower than the 1.0 trend → hold, not promote.
    const s2 = applySession(s1, [summary({ level: 3, meanVel: 0.8 })]);
    expect(s2.levels[STS_FAMILY]).toBe(3);
  });

  it('decides each family independently within one session', () => {
    const s0 = initialProgressionState();
    const next = applySession(s0, [
      summary({ family: STS_FAMILY, level: 2, meanVel: 1.0 }),
      summary({ exerciseId: 'push-up-incline', family: 'push-up', level: 2, reachedAllTargets: false, autoregulated: false }),
    ]);
    expect(next.levels[STS_FAMILY]).toBe(3); // promoted
    expect(next.levels['push-up']).toBe(1); // demoted
  });
});

describe('summarizeItem distillation', () => {
  it('summarises a completed reps item (sit-to-stand)', () => {
    const def = getExercise(STS_STANDARD_ID);
    const set = (reps: number, meanVel: number, reachedTarget: boolean): SetResult => ({
      exerciseId: STS_STANDARD_ID,
      reps,
      meanVel,
      holdSec: NaN,
      romPeak: NaN,
      autoregulated: false,
      reachedTarget,
      interruptions: 0,
      flags: [],
    });
    const item: TrainingItemResult = {
      exerciseId: STS_STANDARD_ID,
      status: 'completed',
      sets: [set(10, 0.9, true), set(10, 0.95, true), set(10, 0.85, true)],
    };
    const s = summarizeItem(item, def);
    expect(s.kind).toBe('reps');
    expect(s.totalReps).toBe(30);
    expect(s.targetReps).toBe(30);
    expect(s.reachedAllTargets).toBe(true);
    expect(s.measured).toBe(true);
    expect(s.meanVel).toBeCloseTo(0.9, 5);
  });

  it('summarises a hold item and never autoregulates it', () => {
    const def = getExercise(BRIDGE_HOLD_ID);
    const set = (holdSec: number, reachedTarget: boolean): SetResult => ({
      exerciseId: BRIDGE_HOLD_ID,
      reps: 0,
      meanVel: NaN,
      holdSec,
      romPeak: NaN,
      autoregulated: false,
      reachedTarget,
      interruptions: 0,
      flags: [],
    });
    const item: TrainingItemResult = {
      exerciseId: BRIDGE_HOLD_ID,
      status: 'completed',
      sets: [set(20, true), set(20, true), set(20, true)],
    };
    const s = summarizeItem(item, def);
    expect(s.kind).toBe('hold');
    expect(s.reachedAllTargets).toBe(true);
    expect(s.autoregulated).toBe(false);
    expect(s.measured).toBe(true);
  });

  it('a skipped item is unmeasured (holds the level)', () => {
    const def = getExercise(STS_STANDARD_ID);
    const item: TrainingItemResult = { exerciseId: STS_STANDARD_ID, status: 'skipped', sets: [] };
    expect(summarizeItem(item, def).measured).toBe(false);
  });
});
