/**
 * Shoulder flexion acceptance: synthetic side-view raises through the full
 * pipeline into the MaxRomTracker grader. The graded shoulder angle equals the
 * driven arm angle θ by construction, so the captured peak is checkable
 * against ground truth. Covers clean capture, either facing side, a low ROM,
 * and a mid-hold tracking interruption (peak survives, flagged).
 */

import { SHOULDER_FLEXION_ID, ShoulderFlexionResult } from '../index';
import { gradeRecording } from '../../replay/gradeRecording';
import {
  ShoulderFlexionSessionOptions,
  shoulderFlexionSession,
} from '../../pose/testing/syntheticRom';

function grade(options: ShoulderFlexionSessionOptions = {}) {
  const session = shoulderFlexionSession(options);
  return { ...gradeRecording<ShoulderFlexionResult>(SHOULDER_FLEXION_ID, session.frames), session };
}

describe('shoulder flexion peak — acceptance', () => {
  it('captures the peak flexion angle close to ground truth', () => {
    const { result, session } = grade({ seed: 11, peakDeg: 165 });
    expect(result.interruptions).toBe(0);
    expect(result.flags).not.toContain('no-measurement');
    expect(Math.abs(result.peakFlexionDeg - session.truth.peakDeg)).toBeLessThan(8);
    expect(result.validTime).toBeTruthy();
    expect(result.validTime?.accumulatedValidSeconds).toBeGreaterThan(0);
    expect(result.validTime?.completedByValidTime).toBe(true);
  });

  it('measures from either facing side', () => {
    const right = grade({ seed: 22, nearSide: 'right', peakDeg: 150 });
    const left = grade({ seed: 22, nearSide: 'left', peakDeg: 150 });
    expect(Math.abs(right.result.peakFlexionDeg - left.result.peakFlexionDeg)).toBeLessThan(8);
  });

  it('tracks a reduced range of motion', () => {
    const { result } = grade({ seed: 33, peakDeg: 95 });
    expect(Math.abs(result.peakFlexionDeg - 95)).toBeLessThan(10);
  });

  it('does not publish a fallback peak when the valid capture window is too short', () => {
    const { result } = grade({ seed: 34, peakDeg: 165, riseMs: 200, holdMs: 100 });
    expect(result.validTime?.completedByValidTime).toBe(false);
    expect(result.flags).toContain('no-measurement');
    expect(Number.isNaN(result.peakFlexionDeg)).toBe(true);
  });

  it('a mid-hold interruption is flagged but the peak survives', () => {
    // Gone window inside the hold; the arm reached peak before it.
    const { result } = grade({
      seed: 44,
      peakDeg: 160,
      goneWindows: [{ startMs: 9500, endMs: 10500 }],
    });
    expect(result.interruptions).toBeGreaterThanOrEqual(1);
    expect(result.flags).toContain('tracking-interrupted');
    expect(Math.abs(result.peakFlexionDeg - 160)).toBeLessThan(10);
  });
});
