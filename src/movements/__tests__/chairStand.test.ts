/**
 * Stage 2 acceptance tests: synthetic chair-stand sessions through the FULL
 * pipeline (parse → One-Euro → reliability → validity → state machine →
 * calibration) into the chair-stand grader. Covers: clean reps, jittery reps
 * (no double counts), partial rises (not counted), subject leaves & returns
 * (no double count, state reset), and the known-velocity ramp (velocity
 * within tolerance of ground truth).
 */

import { CHAIR_STAND_ID, ChairStandResult, getMovement } from '../index';
import {
  ChairStandSessionOptions,
  chairStandSession,
} from '../../pose/testing/syntheticChairStand';
import { gradeRecording } from '../../replay/gradeRecording';

function grade(options: ChairStandSessionOptions = {}) {
  const session = chairStandSession(options);
  return { ...gradeRecording<ChairStandResult>(CHAIR_STAND_ID, session.frames), session };
}

describe('30s chair stand — acceptance', () => {
  it('counts clean reps and measures their velocity', () => {
    const { result, session, bodyUnit } = grade({ seed: 101 });
    expect(result.reps).toBe(session.truth.expectedReps);
    expect(result.interruptions).toBe(0);
    expect(result.pushOffDetected).toBe(false);
    expect(result.repStats).toHaveLength(result.reps);

    // Body-unit calibration locked close to the geometric ground truth.
    expect(bodyUnit).not.toBeNull();
    expect(Math.abs((bodyUnit as number) - session.truth.bodyUnit)).toBeLessThan(
      session.truth.bodyUnit * 0.02
    );

    const trueVel = session.truth.repTrueMeanVelBu[0];
    expect(Math.abs(result.sessionMeanVel - trueVel)).toBeLessThan(trueVel * 0.1);
  });

  it('jittery landmarks never double-count (high noise, same reps)', () => {
    const { result, session } = grade({ seed: 202, noiseAmp: 0.009 });
    expect(result.reps).toBe(session.truth.expectedReps);
  });

  it('partial rises are never counted', () => {
    const { result, session } = grade({
      seed: 303,
      riseMsPerRep: [1200, 1200, 1200, 1200],
      partials: [
        { afterRep: 0, fraction: 0.5 },
        { afterRep: 2, fraction: 0.45 },
      ],
    });
    expect(result.reps).toBe(session.truth.expectedReps); // partials add zero
  });

  it('subject leaves and returns: state resets, credited reps survive, no double count', () => {
    // Build once to learn the timeline, then re-build with a gone-window
    // placed inside the third rep's seated rest (same options ⇒ same timing).
    const options: ChairStandSessionOptions = {
      seed: 404,
      riseMsPerRep: [1200, 1200, 1200, 1200, 1200, 1200],
      restMs: 5000, // room for re-acquisition warmup before the next rise
    };
    const dry = chairStandSession(options);
    // Segments: cal, sit, settle, then per rep [rise, top, descend, rest].
    const restSegIndex = 3 + 2 * 4 + 3; // rep index 2's rest
    let restStartMs = 0;
    for (let i = 0; i < restSegIndex; i++) restStartMs += dry.segments[i].durMs;

    const { result, session } = grade({
      ...options,
      goneWindows: [{ startMs: restStartMs + 300, endMs: restStartMs + 1800 }],
    });
    expect(result.reps).toBe(session.truth.expectedReps); // 3 before + 3 after
    expect(result.interruptions).toBeGreaterThanOrEqual(1);
    expect(result.flags).toContain('tracking-interrupted');
  });

  it('known-velocity ramp: per-rep and session means within tolerance', () => {
    const { result, session } = grade({
      seed: 505,
      riseMsPerRep: [1500, 1200, 1000, 900, 1400],
    });
    expect(result.reps).toBe(5);
    for (let i = 0; i < result.repStats.length; i++) {
      const trueVel = session.truth.repTrueMeanVelBu[i];
      const measured = result.repStats[i].meanVel;
      expect(Math.abs(measured - trueVel)).toBeLessThan(trueVel * 0.12);
      // Constant-velocity rise ⇒ peak ≈ mean; a peak far above mean would
      // mean the EMA is amplifying noise.
      expect(result.repStats[i].peakVel).toBeGreaterThan(measured * 0.8);
      expect(result.repStats[i].peakVel).toBeLessThan(trueVel * 1.3);
    }
    const trueSessionMean =
      session.truth.repTrueMeanVelBu.reduce((a, b) => a + b, 0) /
      session.truth.repTrueMeanVelBu.length;
    expect(Math.abs(result.sessionMeanVel - trueSessionMean)).toBeLessThan(
      trueSessionMean * 0.08
    );
  });

  it('flags hand-push-off reps without ever voicing them', () => {
    const { result } = grade({ seed: 606, pushOffReps: [1, 3] });
    expect(result.repStats.map((s) => s.pushOff)).toEqual([false, true, false, true, false]);
    expect(result.pushOffDetected).toBe(true);
    // The spoken result composes count words only — no critique lines exist.
    const cues = getMovement(CHAIR_STAND_ID).resultCues(result as never);
    expect(cues).toEqual(['you-completed', `num-${result.reps}`, 'stands-suffix']);
  });

  it('works from either facing side (dynamic near-side selection)', () => {
    const right = grade({ seed: 707, nearSide: 'right' });
    const left = grade({ seed: 707, nearSide: 'left' });
    expect(right.result.reps).toBe(right.session.truth.expectedReps);
    expect(left.result.reps).toBe(left.session.truth.expectedReps);
    expect(
      Math.abs(left.result.sessionMeanVel - right.result.sessionMeanVel)
    ).toBeLessThan(right.result.sessionMeanVel * 0.05);
  });

  it('zero reps yields NaN velocity and the no-reps result line', () => {
    // Standing only — nobody ever sits.
    const { frames } = chairStandSession({ seed: 808, riseMsPerRep: [] });
    const replay = gradeRecording<ChairStandResult>(CHAIR_STAND_ID, frames);
    expect(replay.result.reps).toBe(0);
    expect(Number.isNaN(replay.result.sessionMeanVel)).toBe(true);
    const cues = getMovement(CHAIR_STAND_ID).resultCues(replay.result as never);
    expect(cues).toEqual(['no-reps']);
  });
});
