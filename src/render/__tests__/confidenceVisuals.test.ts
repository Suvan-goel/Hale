import { LANDMARK_COUNT, LM } from '../../pose/types';
import {
  computeFadeOpacity,
  createAvatarVisualState,
  getBoneConfidence,
  getConfidenceBucket,
  getConfidenceVisual,
  getLandmarkConfidence,
  getScreenLandmarkConfidence,
  maybeStartPulse,
  updateAvatarVisualState,
} from '../confidenceVisuals';
import { createScreenPoseLandmarks } from '../poseCoordinateMapper';

function makePose(confidence = 0.9) {
  const pose = createScreenPoseLandmarks();
  pose.hasPose = true;
  pose.timestampMs = 0;
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    pose.xs[i] = i;
    pose.ys[i] = i;
    pose.visibility[i] = confidence;
    pose.presence[i] = confidence;
  }
  return pose;
}

describe('confidence visuals', () => {
  it('extracts confidence-like fields from landmark objects', () => {
    expect(getLandmarkConfidence({ confidence: 0.8 })).toBe(0.8);
    expect(getLandmarkConfidence({ score: 0.7 })).toBe(0.7);
    expect(getLandmarkConfidence({ visibility: 0.6 })).toBe(0.6);
    expect(getLandmarkConfidence({ presence: 0.5 })).toBe(0.5);
    expect(getLandmarkConfidence({ probability: 0.4 })).toBe(0.4);
    expect(getLandmarkConfidence({})).toBeUndefined();
  });

  it('maps confidence buckets at expected thresholds', () => {
    expect(getConfidenceBucket(0.8)).toBe('high');
    expect(getConfidenceBucket(0.5)).toBe('medium');
    expect(getConfidenceBucket(0.2)).toBe('low');
    expect(getConfidenceBucket(0.1)).toBe('very_low');
    expect(getConfidenceBucket(undefined)).toBe('unknown');
  });

  it('maps confidence to visual rendering decisions', () => {
    expect(getConfidenceVisual(0.8).shouldRender).toBe(true);
    expect(getConfidenceVisual(0.5).opacityMultiplier).toBeLessThan(1);
    expect(getConfidenceVisual(0.2).radiusMultiplier).toBeLessThan(1);
    expect(getConfidenceVisual(0.1).shouldRender).toBe(false);
    expect(getConfidenceVisual(0.1, 'off').shouldRender).toBe(true);
  });

  it('derives screen landmark and bone confidence safely', () => {
    const pose = makePose(0.9);
    pose.visibility[LM.LEFT_SHOULDER] = 0.8;
    pose.presence[LM.LEFT_SHOULDER] = 0.7;
    pose.visibility[LM.LEFT_ELBOW] = 0.4;

    expect(getScreenLandmarkConfidence(pose, LM.LEFT_SHOULDER)).toBe(0.7);
    expect(getBoneConfidence(pose, LM.LEFT_SHOULDER, LM.LEFT_ELBOW)).toBe(0.4);
  });

  it('fades toward target opacity without overshooting', () => {
    expect(
      computeFadeOpacity({
        previousOpacity: 0.2,
        targetOpacity: 1,
        deltaMs: 50,
        fadeInMs: 200,
        fadeOutMs: 100,
      })
    ).toBeCloseTo(0.45);
    expect(
      computeFadeOpacity({
        previousOpacity: 0.9,
        targetOpacity: 0.1,
        deltaMs: 50,
        fadeInMs: 200,
        fadeOutMs: 100,
      })
    ).toBeCloseTo(0.4);
  });

  it('detects lost and reacquired visual states without positional state', () => {
    const state = createAvatarVisualState();
    const lost = updateAvatarVisualState(state, {
      hasPose: false,
      averageConfidence: 0,
      timestampMs: 0,
      enabled: true,
      reacquisitionFadeEnabled: true,
      recognitionPulseEnabled: false,
    });
    const reacquired = updateAvatarVisualState(state, {
      hasPose: true,
      averageConfidence: 0.9,
      timestampMs: 33,
      enabled: true,
      reacquisitionFadeEnabled: true,
      recognitionPulseEnabled: false,
    });

    expect(lost.trackingState).toBe('lost');
    expect(reacquired.trackingState).toBe('reacquired');
    expect(reacquired.opacity).toBeGreaterThan(0);
    expect(reacquired.opacity).toBeLessThan(1);
  });

  it('does not trigger recognition pulse repeatedly for the same event id', () => {
    const state = createAvatarVisualState();
    const event = { type: 'rep_completed' as const, id: 'rep-1', timestampMs: 100 };

    expect(maybeStartPulse(state, { timestampMs: 100, recognitionPulseEnabled: true, recognitionEvent: event })).toBe(true);
    expect(maybeStartPulse(state, { timestampMs: 120, recognitionPulseEnabled: true, recognitionEvent: event })).toBe(false);
  });
});
