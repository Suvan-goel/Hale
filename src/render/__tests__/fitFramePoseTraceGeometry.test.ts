import { LANDMARK_COUNT, LM, createPoseFrame, type PoseFrame } from '../../pose/types';
import {
  buildFitFramePoseTracePaths,
  emptyFitFramePoseTracePaths,
  resolveFitFrameRect,
  type FitFrameRect,
} from '../fitFramePoseTraceGeometry';

const RECT: FitFrameRect = { x: 50, y: 20, width: 300, height: 400, rx: 32 };

describe('fit frame pose trace geometry', () => {
  it('keeps the detected pose position instead of recentering it', () => {
    const leftFrame = makeStandingFrame(0.25);
    const rightFrame = makeStandingFrame(0.75);
    const left = emptyFitFramePoseTracePaths();
    const right = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(leftFrame, RECT, { sourceAspect: 3 / 4, mirrored: false }, left);
    buildFitFramePoseTracePaths(rightFrame, RECT, { sourceAspect: 3 / 4, mirrored: false }, right);

    expect(left.bounds).not.toBeNull();
    expect(right.bounds).not.toBeNull();
    expect(centerX(left.bounds!)).toBeLessThan(RECT.x + RECT.width * 0.5);
    expect(centerX(right.bounds!)).toBeGreaterThan(RECT.x + RECT.width * 0.5);
  });

  it('preserves oversize/clipped coordinates at the frame edges', () => {
    const frame = makeStandingFrame(0.5);
    frame.ys[LM.NOSE] = -0.08;
    frame.ys[LM.LEFT_ANKLE] = 1.05;
    frame.ys[LM.RIGHT_ANKLE] = 1.05;
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, { sourceAspect: 3 / 4, mirrored: false }, out);

    expect(out.edgeFlags.top).toBe(true);
    expect(out.edgeFlags.bottom).toBe(true);
    expect(out.bounds!.minY).toBeLessThan(RECT.y);
    expect(out.bounds!.maxY).toBeGreaterThan(RECT.y + RECT.height);
  });

  it('fades low-confidence landmarks into faint paths', () => {
    const frame = makeStandingFrame(0.5, 0.25);
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, { sourceAspect: 3 / 4, mirrored: false }, out);

    expect(out.strongLinePath).toBe('');
    expect(out.majorPointPath).toBe('');
    expect(out.minorPointPath).toBe('');
    expect(out.faintLinePath).toContain('M');
    expect(out.faintPointPath).toContain('M');
  });

  it('marks the lower edge when feet are not confidently visible', () => {
    const frame = makeStandingFrame(0.5);
    frame.visibility[LM.LEFT_ANKLE] = 0.1;
    frame.presence[LM.LEFT_ANKLE] = 0.1;
    frame.visibility[LM.RIGHT_ANKLE] = 0.1;
    frame.presence[LM.RIGHT_ANKLE] = 0.1;
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, { sourceAspect: 3 / 4, mirrored: false }, out);

    expect(out.edgeFlags.bottom).toBe(true);
  });

  it('resolves a camera-aspect fit frame inside the recording window', () => {
    const rect = resolveFitFrameRect(390, 680, 3 / 4, {
      left: 0,
      top: 64,
      width: 390,
      height: 520,
    });

    expect(rect.x).toBeGreaterThan(0);
    expect(rect.y).toBeGreaterThan(64);
    expect(rect.width / rect.height).toBeCloseTo(3 / 4, 3);
  });
});

function makeStandingFrame(centerXValue: number, confidence = 0.9): PoseFrame {
  const frame = createPoseFrame();
  frame.hasPose = true;
  frame.timestampMs = 1000;
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    frame.xs[i] = centerXValue;
    frame.ys[i] = 0.5;
    frame.visibility[i] = confidence;
    frame.presence[i] = confidence;
  }

  setLandmark(frame, LM.NOSE, centerXValue, 0.16, confidence);
  setLandmark(frame, LM.LEFT_SHOULDER, centerXValue - 0.08, 0.31, confidence);
  setLandmark(frame, LM.RIGHT_SHOULDER, centerXValue + 0.08, 0.31, confidence);
  setLandmark(frame, LM.LEFT_ELBOW, centerXValue - 0.13, 0.45, confidence);
  setLandmark(frame, LM.RIGHT_ELBOW, centerXValue + 0.13, 0.45, confidence);
  setLandmark(frame, LM.LEFT_WRIST, centerXValue - 0.15, 0.58, confidence);
  setLandmark(frame, LM.RIGHT_WRIST, centerXValue + 0.15, 0.58, confidence);
  setLandmark(frame, LM.LEFT_HIP, centerXValue - 0.06, 0.55, confidence);
  setLandmark(frame, LM.RIGHT_HIP, centerXValue + 0.06, 0.55, confidence);
  setLandmark(frame, LM.LEFT_KNEE, centerXValue - 0.055, 0.74, confidence);
  setLandmark(frame, LM.RIGHT_KNEE, centerXValue + 0.055, 0.74, confidence);
  setLandmark(frame, LM.LEFT_ANKLE, centerXValue - 0.05, 0.91, confidence);
  setLandmark(frame, LM.RIGHT_ANKLE, centerXValue + 0.05, 0.91, confidence);
  setLandmark(frame, LM.LEFT_HEEL, centerXValue - 0.055, 0.95, confidence);
  setLandmark(frame, LM.RIGHT_HEEL, centerXValue + 0.055, 0.95, confidence);
  setLandmark(frame, LM.LEFT_FOOT_INDEX, centerXValue - 0.08, 0.96, confidence);
  setLandmark(frame, LM.RIGHT_FOOT_INDEX, centerXValue + 0.08, 0.96, confidence);
  return frame;
}

function setLandmark(frame: PoseFrame, lm: LM, x: number, y: number, confidence: number): void {
  frame.xs[lm] = x;
  frame.ys[lm] = y;
  frame.visibility[lm] = confidence;
  frame.presence[lm] = confidence;
}

function centerX(bounds: { minX: number; maxX: number }): number {
  return (bounds.minX + bounds.maxX) / 2;
}
