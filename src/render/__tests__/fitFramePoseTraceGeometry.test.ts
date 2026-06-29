import { LANDMARK_COUNT, LM, createPoseFrame, type PoseFrame } from '../../pose/types';
import {
  buildFitFramePoseTracePaths,
  displayFitFrameTraceEdgeFlags,
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

  it('marks oversize coordinates at the frame edges', () => {
    const frame = makeStandingFrame(0.5);
    frame.ys[LM.NOSE] = -0.08;
    frame.ys[LM.LEFT_ANKLE] = 1.05;
    frame.ys[LM.RIGHT_ANKLE] = 1.05;
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, { sourceAspect: 3 / 4, mirrored: false }, out);

    expect(out.edgeFlags.top).toBe(true);
    expect(out.edgeFlags.bottom).toBe(true);
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

  it('uses visual confidence for trace visibility', () => {
    const frame = makeStandingFrame(0.5, 0.9);
    const visualConfidence = new Float64Array(LANDMARK_COUNT);
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, {
      sourceAspect: 3 / 4,
      mirrored: false,
      visualConfidence,
    }, out);

    expect(out.lineCount).toBe(0);
    expect(out.pointCount).toBe(0);
  });

  it('can keep a raw low-confidence trace visible during visual fade-out', () => {
    const frame = makeStandingFrame(0.5, 0.05);
    const visualConfidence = new Float64Array(LANDMARK_COUNT);
    visualConfidence.fill(0.4);
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, {
      sourceAspect: 3 / 4,
      mirrored: false,
      visualConfidence,
    }, out);

    expect(out.lineCount).toBeGreaterThan(0);
    expect(out.pointCount).toBeGreaterThan(0);
    expect(out.faintLinePath).toContain('M');
  });

  it('fades landmarks near the camera edge into ghost paths before clipping', () => {
    const frame = makeStandingFrame(0.5, 0.9);
    frame.xs[LM.LEFT_WRIST] = 0.985;
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, { sourceAspect: 3 / 4, mirrored: false }, out);

    expect(out.ghostLinePath).toContain('M');
    expect(out.ghostPointPath).toContain('M');
    expect(out.edgeFlags.right).toBe(true);
  });

  it('marks only the lower edge when feet are not confidently visible', () => {
    const frame = makeStandingFrame(0.5);
    frame.visibility[LM.LEFT_ANKLE] = 0.1;
    frame.presence[LM.LEFT_ANKLE] = 0.1;
    frame.visibility[LM.RIGHT_ANKLE] = 0.1;
    frame.presence[LM.RIGHT_ANKLE] = 0.1;
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, RECT, { sourceAspect: 3 / 4, mirrored: false }, out);

    expect(out.edgeFlags.bottom).toBe(true);
    expect(out.edgeFlags.top).toBe(false);
    expect(out.edgeFlags.left).toBe(false);
    expect(out.edgeFlags.right).toBe(false);
  });

  it('flips horizontal edge flags for mirrored display', () => {
    expect(
      displayFitFrameTraceEdgeFlags(
        { left: true, right: false, top: false, bottom: true },
        true
      )
    ).toEqual({ left: false, right: true, top: false, bottom: true });
    expect(
      displayFitFrameTraceEdgeFlags(
        { left: true, right: false, top: true, bottom: false },
        false
      )
    ).toEqual({ left: true, right: false, top: true, bottom: false });
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

  it('maps camera edges to the fit frame edges without internal padding', () => {
    const rect = resolveFitFrameRect(390, 680, 3 / 4, {
      left: 0,
      top: 64,
      width: 390,
      height: 520,
    });
    const frame = makeCameraEdgeFrame();
    const out = emptyFitFramePoseTracePaths();

    buildFitFramePoseTracePaths(frame, rect, {
      sourceAspect: 3 / 4,
      mirrored: false,
      edgeFadeMargin: 0,
    }, out);

    expect(out.bounds).not.toBeNull();
    expect(out.bounds!.minX).toBeCloseTo(rect.x, 6);
    expect(out.bounds!.maxX).toBeCloseTo(rect.x + rect.width, 6);
    expect(out.bounds!.minY).toBeCloseTo(rect.y, 6);
    expect(out.bounds!.maxY).toBeCloseTo(rect.y + rect.height, 6);
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

function makeCameraEdgeFrame(): PoseFrame {
  const frame = createPoseFrame();
  frame.hasPose = true;
  frame.timestampMs = 1000;
  setLandmark(frame, LM.NOSE, 0, 0, 0.9);
  setLandmark(frame, LM.RIGHT_FOOT_INDEX, 1, 1, 0.9);
  return frame;
}

function centerX(bounds: { minX: number; maxX: number }): number {
  return (bounds.minX + bounds.maxX) / 2;
}
