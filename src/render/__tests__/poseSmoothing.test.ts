import { LANDMARK_COUNT, LM } from '../../pose/types';
import { createScreenPoseLandmarks } from '../poseCoordinateMapper';
import { createPoseSmoothingState, smoothPoseLandmarks } from '../poseSmoothing';

function makePose(timestampMs: number, x: number, y: number) {
  const pose = createScreenPoseLandmarks();
  pose.timestampMs = timestampMs;
  pose.hasPose = true;
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    pose.xs[i] = x;
    pose.ys[i] = y;
    pose.visibility[i] = 0.95;
    pose.presence[i] = 0.95;
  }
  return pose;
}

describe('smoothPoseLandmarks', () => {
  it('reduces a sudden screen-space jump with EMA smoothing', () => {
    const state = createPoseSmoothingState();
    const out = createScreenPoseLandmarks();

    smoothPoseLandmarks(state, makePose(0, 100, 200), out, {
      alpha: 0.25,
      adaptive: false,
      snapFrames: 0,
    });
    smoothPoseLandmarks(state, makePose(33, 140, 240), out, {
      alpha: 0.25,
      adaptive: false,
      snapFrames: 0,
    });

    expect(out.xs[LM.NOSE]).toBe(110);
    expect(out.ys[LM.NOSE]).toBe(210);
    expect(out.xs[LM.NOSE]).toBeLessThan(140);
  });

  it('resets when the pose is absent', () => {
    const state = createPoseSmoothingState();
    const out = createScreenPoseLandmarks();
    const missing = createScreenPoseLandmarks();
    missing.timestampMs = 66;
    missing.hasPose = false;

    smoothPoseLandmarks(state, makePose(0, 100, 200), out);
    const result = smoothPoseLandmarks(state, missing, out);

    expect(result.reset).toBe(true);
    expect(out.hasPose).toBe(false);
    expect(state.initialized).toBe(false);
  });

  it('does not blend across a long timestamp gap', () => {
    const state = createPoseSmoothingState();
    const out = createScreenPoseLandmarks();

    smoothPoseLandmarks(state, makePose(0, 100, 200), out, {
      alpha: 0.25,
      adaptive: false,
      snapFrames: 0,
      resetAfterMs: 500,
    });
    const result = smoothPoseLandmarks(
      state,
      makePose(800, 160, 260),
      out,
      { alpha: 0.25, adaptive: false, snapFrames: 0, resetAfterMs: 500 }
    );

    expect(result.reset).toBe(true);
    expect(out.xs[LM.NOSE]).toBe(160);
    expect(out.ys[LM.NOSE]).toBe(260);
  });

  it('uses higher alpha for fast movement than slow movement', () => {
    const slowState = createPoseSmoothingState();
    const fastState = createPoseSmoothingState();
    const slowOut = createScreenPoseLandmarks();
    const fastOut = createScreenPoseLandmarks();
    const options = {
      adaptive: true,
      minAlpha: 0.5,
      maxAlpha: 0.9,
      slowSpeedPxPerSec: 50,
      fastSpeedPxPerSec: 500,
      snapFrames: 0,
    };

    smoothPoseLandmarks(slowState, makePose(0, 100, 200), slowOut, options);
    const slow = smoothPoseLandmarks(slowState, makePose(33, 102, 202), slowOut, options);
    smoothPoseLandmarks(fastState, makePose(0, 100, 200), fastOut, options);
    const fast = smoothPoseLandmarks(fastState, makePose(33, 150, 250), fastOut, options);

    expect(fast.alpha).toBeGreaterThan(slow.alpha);
    expect(fast.alpha).toBeCloseTo(0.9);
    expect(slow.alpha).toBeGreaterThanOrEqual(0.5);
  });

  it('snaps for configured frames after reacquisition', () => {
    const state = createPoseSmoothingState();
    const out = createScreenPoseLandmarks();
    const options = { alpha: 0.25, adaptive: false, snapFrames: 2 };

    const first = smoothPoseLandmarks(state, makePose(0, 100, 200), out, options);
    const second = smoothPoseLandmarks(state, makePose(33, 140, 240), out, options);
    const third = smoothPoseLandmarks(state, makePose(66, 180, 280), out, options);

    expect(first.snapped).toBe(true);
    expect(second.snapped).toBe(true);
    expect(second.alpha).toBe(1);
    expect(third.alpha).toBe(0.25);
    expect(out.xs[LM.NOSE]).toBe(150);
  });
});
