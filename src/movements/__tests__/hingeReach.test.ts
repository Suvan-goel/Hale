/**
 * Hinge reach acceptance: synthetic side-view forward folds through the full
 * pipeline into the MaxRomTracker (direction 'min') grader. A deeper fold must
 * record a smaller wrist-to-floor distance; standing-only must record a large
 * one. Covers monotonicity, body-unit independence of camera distance, and a
 * mid-hold interruption.
 */

import { HINGE_REACH_ID, HingeReachResult } from '../index';
import { gradeRecording } from '../../replay/gradeRecording';
import { HingeReachSessionOptions, hingeReachSession } from '../../pose/testing/syntheticRom';

function grade(options: HingeReachSessionOptions = {}) {
  const session = hingeReachSession(options);
  return { ...gradeRecording<HingeReachResult>(HINGE_REACH_ID, session.frames), session };
}

describe('hinge reach — acceptance', () => {
  it('a deep fold records a small wrist-to-floor distance', () => {
    const { result } = grade({ seed: 11, peakFoldDeg: 88 });
    expect(result.flags).not.toContain('no-measurement');
    expect(result.reachBu).toBeGreaterThan(0);
    expect(result.reachBu).toBeLessThan(0.45); // close to the floor
    expect(result.validTime).toBeTruthy();
    expect(result.validTime?.accumulatedValidSeconds).toBeGreaterThan(0);
  });

  it('a deeper fold reaches lower than a shallow one', () => {
    const deep = grade({ seed: 22, peakFoldDeg: 88 });
    const shallow = grade({ seed: 22, peakFoldDeg: 45 });
    expect(deep.result.reachBu).toBeLessThan(shallow.result.reachBu);
  });

  it('standing only (no fold) records a large distance', () => {
    const { result } = grade({ seed: 33, peakFoldDeg: 0, foldMs: 100, holdMs: 100 });
    expect(result.reachBu).toBeGreaterThan(0.6);
  });

  it('is camera-distance invariant (body-unit normalized)', () => {
    const near = grade({ seed: 44, peakFoldDeg: 80, scale: 1.1 });
    const far = grade({ seed: 44, peakFoldDeg: 80, scale: 0.85 });
    expect(Math.abs(near.result.reachBu - far.result.reachBu)).toBeLessThan(0.06);
  });

  it('a mid-hold interruption is flagged but the reach survives', () => {
    const { result } = grade({
      seed: 55,
      peakFoldDeg: 85,
      goneWindows: [{ startMs: 8200, endMs: 9200 }],
    });
    expect(result.interruptions).toBeGreaterThanOrEqual(1);
    expect(result.flags).toContain('tracking-interrupted');
    expect(result.reachBu).toBeLessThan(0.45);
  });
});
