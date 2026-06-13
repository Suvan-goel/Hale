/**
 * Timed Up and Go acceptance: synthetic side-lateral sessions (seated → stand →
 * walk → turn → walk → sit) through the full pipeline into the
 * TimedTaskTracker grader. Covers a clean standard trial, the short-path
 * non-standard flag, an abandoned trial (incomplete), and a mid-walk
 * tracking interruption (aborts, flagged).
 */

import { TUG_ID, TugResult } from '../index';
import { gradeRecording } from '../../replay/gradeRecording';
import { TugSessionOptions, tugSession } from '../../pose/testing/syntheticTug';

function grade(options: TugSessionOptions = {}) {
  const session = tugSession(options);
  return { ...gradeRecording<TugResult>(TUG_ID, session.frames), session };
}

describe('Timed Up and Go — acceptance', () => {
  it('times a clean standard trial seat-off to re-seated', () => {
    const { result } = grade({ seed: 11, walkDistance: 0.42 });
    expect(result.completed).toBe(true);
    expect(result.turnDetected).toBe(true);
    expect(result.nonStandardShortPath).toBe(false);
    expect(result.interruptions).toBe(0);
    expect(result.flags).not.toContain('incomplete');
    // Walk out (2.5s) + turn (0.8s) + walk back (2.5s) + stand/sit portions.
    expect(result.totalSec).toBeGreaterThan(4);
    expect(result.totalSec).toBeLessThan(14);
  });

  it('flags a short walk path as non-standard but still completes', () => {
    const { result } = grade({ seed: 22, walkDistance: 0.34 });
    expect(result.completed).toBe(true);
    expect(result.turnDetected).toBe(true);
    expect(result.nonStandardShortPath).toBe(true);
    expect(result.flags).toContain('short-path');
  });

  it('an abandoned trial is incomplete, never blocking', () => {
    const { result } = grade({ seed: 33, walkDistance: 0.42, abandonAfterWalkOut: true });
    expect(result.completed).toBe(false);
    expect(result.flags).toContain('incomplete');
  });

  it('a mid-walk interruption aborts and is flagged', () => {
    const dry = tugSession({ seed: 44, walkDistance: 0.42 });
    // Seat-off is ~4.5s calibration + 1.5s sit + 1.5s settle + ~1s stand ≈ 8.5s;
    // place the gone window during the walk-out that follows.
    const { result } = grade({
      seed: 44,
      walkDistance: 0.42,
      goneWindows: [{ startMs: 9000, endMs: 9800 }],
    });
    expect(result.interruptions).toBeGreaterThanOrEqual(1);
    expect(result.flags).toContain('tracking-interrupted');
    void dry;
  });
});
