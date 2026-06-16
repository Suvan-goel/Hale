import { LANDMARK_COUNT, LM } from '../../pose/types';
import {
  applyDomainEmphasis,
  createMeasurementStateTransitionState,
  DEFAULT_MEASUREMENT_VISUAL,
  getDomainEmphasisForSegment,
  getMeasurementStateVisualConfig,
  getStateTransitionDuration,
  getTrackingQuality,
  shouldAllowRecognitionPulse,
  shouldShowSetupGuide,
  updateMeasurementStateTransition,
} from '../measurementStateVisuals';
import { createScreenPoseLandmarks } from '../poseCoordinateMapper';

function pose(confidence = 0.9) {
  const out = createScreenPoseLandmarks();
  out.hasPose = true;
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    out.xs[i] = 100 + i;
    out.ys[i] = 200 + i;
    out.visibility[i] = confidence;
    out.presence[i] = confidence;
  }
  return out;
}

describe('measurement state visuals', () => {
  it('preserves Phase 3 visuals when no measurement state is provided', () => {
    const visual = getMeasurementStateVisualConfig(undefined, 'strength_power', 'high');

    expect(visual.keypointOpacityMultiplier).toBe(DEFAULT_MEASUREMENT_VISUAL.keypointOpacityMultiplier);
    expect(visual.boneLineOpacityMultiplier).toBe(DEFAULT_MEASUREMENT_VISUAL.boneLineOpacityMultiplier);
    expect(visual.sampleDotOpacityMultiplier).toBe(DEFAULT_MEASUREMENT_VISUAL.sampleDotOpacityMultiplier);
    expect(visual.bodyVolumeOpacityMultiplier).toBe(DEFAULT_MEASUREMENT_VISUAL.bodyVolumeOpacityMultiplier);
    expect(visual.radiusMultiplier).toBe(DEFAULT_MEASUREMENT_VISUAL.radiusMultiplier);
    expect(visual.showSetupGuide).toBe(false);
    expect(visual.domainEmphasisStrength).toBe(0);
  });

  it('enables setup guides for setup and framing states', () => {
    expect(shouldShowSetupGuide('setup', 'medium')).toBe(true);
    expect(shouldShowSetupGuide('framing', 'medium')).toBe(true);
    expect(shouldShowSetupGuide('training', 'high')).toBe(false);
  });

  it('makes checkup and retest states more precise without coordinate fields', () => {
    const checkup = getMeasurementStateVisualConfig('checkup', null, 'high');
    const retest = getMeasurementStateVisualConfig('retest', null, 'high');

    expect(checkup.boneLineOpacityMultiplier).toBeGreaterThan(1);
    expect(checkup.bodyVolumeOpacityMultiplier).toBeLessThan(1);
    expect(retest.keypointOpacityMultiplier).toBeGreaterThan(checkup.keypointOpacityMultiplier);
    expect(Object.keys(checkup).some((key) => key === 'x' || key === 'y' || key.includes('Path'))).toBe(false);
  });

  it('dims the avatar during rest', () => {
    const rest = getMeasurementStateVisualConfig('rest', null, 'high');

    expect(rest.keypointOpacityMultiplier).toBeLessThan(1);
    expect(rest.boneLineOpacityMultiplier).toBeLessThan(1);
    expect(rest.bodyVolumeOpacityMultiplier).toBeLessThan(1);
  });

  it('allows recognition pulse for training but not distracting states', () => {
    expect(shouldAllowRecognitionPulse('training')).toBe(true);
    expect(shouldAllowRecognitionPulse('micro_check')).toBe(true);
    expect(shouldAllowRecognitionPulse('success')).toBe(true);
    expect(shouldAllowRecognitionPulse('rest')).toBe(false);
    expect(shouldAllowRecognitionPulse('checkup')).toBe(false);
  });

  it('low-latency mode disables scan line and heavy transitions', () => {
    const visual = getMeasurementStateVisualConfig('checkup', null, 'high', {
      scanLineEnabled: true,
      lowLatencyMode: true,
    });

    expect(visual.showScanLine).toBe(false);
    expect(getStateTransitionDuration('idle', 'checkup', { lowLatencyMode: true })).toBe(90);
    expect(getStateTransitionDuration('idle', 'checkup', { stateTransitionsEnabled: false })).toBe(0);
  });

  it('emphasizes lower-body segments for strength and balance domains', () => {
    expect(getDomainEmphasisForSegment('left-thigh', 'strength_power')).toBeGreaterThan(1);
    expect(getDomainEmphasisForSegment('left-forearm', 'strength_power')).toBe(1);
    expect(getDomainEmphasisForSegment('left-foot', 'balance')).toBeGreaterThan(1);
    expect(getDomainEmphasisForSegment('left-upper-arm', 'balance')).toBe(1);
  });

  it('keeps mobility emphasis safe for unknown segments', () => {
    expect(getDomainEmphasisForSegment('unknown-segment', 'mobility')).toBeGreaterThanOrEqual(1);
    expect(applyDomainEmphasis(1.2, 0.5)).toBeCloseTo(1.1);
  });

  it('classifies representative tracking quality levels', () => {
    expect(getTrackingQuality(createScreenPoseLandmarks())).toBe('none');
    expect(getTrackingQuality(pose(0.9))).toBe('high');

    const medium = pose(0.3);
    for (const lm of [LM.NOSE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE]) {
      medium.visibility[lm] = 0.75;
      medium.presence[lm] = 0.75;
    }
    expect(getTrackingQuality(medium)).toBe('medium');

    const low = pose(0.05);
    low.visibility[LM.NOSE] = 0.5;
    low.presence[LM.NOSE] = 0.5;
    expect(getTrackingQuality(low)).toBe('low');
  });

  it('state transitions interpolate style only', () => {
    const transition = createMeasurementStateTransitionState();
    const from = getMeasurementStateVisualConfig('rest', null, 'high');
    const to = getMeasurementStateVisualConfig('checkup', null, 'high');

    updateMeasurementStateTransition(transition, from, 0);
    const mid = updateMeasurementStateTransition(transition, to, 110);

    expect(mid.keypointOpacityMultiplier).toBeGreaterThan(from.keypointOpacityMultiplier);
    expect(mid.radiusMultiplier).toBeGreaterThan(from.radiusMultiplier);
    expect(Object.keys(mid).some((key) => key === 'x' || key === 'y' || key.includes('Coordinate'))).toBe(false);
  });

  it('disabled Phase 4 returns Phase 3-style visuals', () => {
    const visual = getMeasurementStateVisualConfig('checkup', 'strength_power', 'low', {
      measurementStatesEnabled: false,
    });

    expect(visual.keypointOpacityMultiplier).toBe(1);
    expect(visual.radiusMultiplier).toBe(1);
    expect(visual.showSetupGuide).toBe(false);
    expect(visual.domainEmphasisStrength).toBe(0);
  });
});
