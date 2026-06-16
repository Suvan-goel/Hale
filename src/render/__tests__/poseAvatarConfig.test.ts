import { resolvePoseAvatarConfig, resolvePoseAvatarRendererMode } from '../poseAvatarConfig';

describe('resolvePoseAvatarRendererMode', () => {
  it('accepts classic and constellation', () => {
    expect(resolvePoseAvatarRendererMode('classic')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('constellation')).toBe('constellation');
  });

  it('defaults to constellation when no explicit value is set', () => {
    expect(resolvePoseAvatarRendererMode(undefined)).toBe('constellation');
    expect(resolvePoseAvatarRendererMode('')).toBe('constellation');
  });

  it('falls back to classic for invalid explicit values', () => {
    expect(resolvePoseAvatarRendererMode('mesh')).toBe('classic');
  });
});

describe('resolvePoseAvatarConfig', () => {
  it('defaults to responsive constellation rendering', () => {
    const config = resolvePoseAvatarConfig({}, {});

    expect(config.mode).toBe('constellation');
    expect(config.frameSource).toBe('raw');
    expect(config.smoothingEnabled).toBe(true);
    expect(config.adaptiveSmoothingEnabled).toBe(true);
    expect(config.smoothingAlpha).toBeGreaterThanOrEqual(0.75);
    expect(config.sampledDotsEnabled).toBe(true);
    expect(config.bodyVolumeEnabled).toBe(true);
    expect(config.confidenceFadingEnabled).toBe(true);
    expect(config.confidenceIntensityEnabled).toBe(true);
    expect(config.reacquisitionFadeEnabled).toBe(true);
    expect(config.recognitionPulseEnabled).toBe(false);
    expect(config.confidenceAnimationStrength).toBe('subtle');
    expect(config.measurementStatesEnabled).toBe(true);
    expect(config.setupGuidesEnabled).toBe(true);
    expect(config.stateTransitionsEnabled).toBe(true);
    expect(config.domainEmphasisEnabled).toBe(true);
    expect(config.scanLineEnabled).toBe(false);
    expect(config.measurementStateIntensity).toBe('subtle');
  });

  it('enables low-latency mode from the requested non-public env name', () => {
    const config = resolvePoseAvatarConfig({}, { POSE_AVATAR_LOW_LATENCY_MODE: 'true' });

    expect(config.lowLatencyMode).toBe(true);
    expect(config.smoothingEnabled).toBe(false);
    expect(config.maxDots).toBeLessThan(120);
    expect(config.sampleDensity).toBeLessThan(0.7);
    expect(config.maxVolumeDots).toBeLessThanOrEqual(60);
    expect(config.torsoVolumeDots).toBeLessThan(40);
    expect(config.headVolumeDots).toBeLessThan(16);
    expect(config.reacquisitionFadeEnabled).toBe(false);
    expect(config.recognitionPulseEnabled).toBe(false);
    expect(config.measurementStatesEnabled).toBe(true);
    expect(config.setupGuidesEnabled).toBe(true);
    expect(config.stateTransitionsEnabled).toBe(false);
    expect(config.scanLineEnabled).toBe(false);
  });

  it('lets debug variants toggle comparison modes', () => {
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'classic' }
      ).mode
    ).toBe('classic');
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'constellation-smoothing-off' }
      ).smoothingEnabled
    ).toBe(false);
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'constellation-sampled-dots-off' }
      ).sampledDotsEnabled
    ).toBe(false);
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'constellation-volume-on' }
      ).bodyVolumeEnabled
    ).toBe(true);
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'constellation-measurement-states-off' }
      ).measurementStatesEnabled
    ).toBe(false);
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'constellation-domain-emphasis-off' }
      ).domainEmphasisEnabled
    ).toBe(false);
    const lowLatency = resolvePoseAvatarConfig(
      {},
      { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'constellation-low-latency' }
    );
    expect(lowLatency.lowLatencyMode).toBe(true);
    expect(lowLatency.stateTransitionsEnabled).toBe(false);
    expect(lowLatency.scanLineEnabled).toBe(false);
  });

  it('allows explicit env overrides for smoothing and sampled dots', () => {
    const config = resolvePoseAvatarConfig(
      {},
      {
        EXPO_PUBLIC_POSE_AVATAR_SMOOTHING: 'off',
        EXPO_PUBLIC_POSE_AVATAR_SAMPLED_DOTS: 'off',
        EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_ALPHA: '0.85',
        EXPO_PUBLIC_POSE_AVATAR_FRAME_SOURCE: 'display',
      }
    );

    expect(config.smoothingEnabled).toBe(false);
    expect(config.sampledDotsEnabled).toBe(false);
    expect(config.smoothingAlpha).toBe(0.85);
    expect(config.frameSource).toBe('display');
  });

  it('can disable Phase 3 confidence effects as a group', () => {
    const config = resolvePoseAvatarConfig(
      {},
      { EXPO_PUBLIC_POSE_AVATAR_PHASE3: '0' }
    );

    expect(config.confidenceFadingEnabled).toBe(false);
    expect(config.confidenceIntensityEnabled).toBe(false);
    expect(config.reacquisitionFadeEnabled).toBe(false);
    expect(config.recognitionPulseEnabled).toBe(false);
    expect(config.confidenceAnimationStrength).toBe('off');
  });

  it('allows explicit Phase 3 overrides', () => {
    const config = resolvePoseAvatarConfig(
      {},
      {
        EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_FADING: 'off',
        EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_INTENSITY: 'off',
        EXPO_PUBLIC_POSE_AVATAR_REACQUISITION_FADE: 'off',
        EXPO_PUBLIC_POSE_AVATAR_RECOGNITION_PULSE: '1',
        EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_STRENGTH: 'medium',
      }
    );

    expect(config.confidenceFadingEnabled).toBe(false);
    expect(config.confidenceIntensityEnabled).toBe(false);
    expect(config.reacquisitionFadeEnabled).toBe(false);
    expect(config.recognitionPulseEnabled).toBe(true);
    expect(config.confidenceAnimationStrength).toBe('medium');
  });

  it('can disable Phase 4 as a group', () => {
    const config = resolvePoseAvatarConfig(
      {},
      { EXPO_PUBLIC_POSE_AVATAR_PHASE4: '0' }
    );

    expect(config.measurementStatesEnabled).toBe(false);
    expect(config.setupGuidesEnabled).toBe(false);
    expect(config.stateTransitionsEnabled).toBe(false);
    expect(config.domainEmphasisEnabled).toBe(false);
    expect(config.scanLineEnabled).toBe(false);
    expect(config.measurementStateIntensity).toBe('off');
  });

  it('allows explicit Phase 4 overrides', () => {
    const config = resolvePoseAvatarConfig(
      {},
      {
        EXPO_PUBLIC_POSE_AVATAR_MEASUREMENT_STATES: '0',
        EXPO_PUBLIC_POSE_AVATAR_SETUP_GUIDES: 'off',
        EXPO_PUBLIC_POSE_AVATAR_STATE_TRANSITIONS: 'off',
        EXPO_PUBLIC_POSE_AVATAR_DOMAIN_EMPHASIS: 'off',
        EXPO_PUBLIC_POSE_AVATAR_SCAN_LINE: '1',
        EXPO_PUBLIC_POSE_AVATAR_MEASUREMENT_STATE_INTENSITY: 'medium',
      }
    );

    expect(config.measurementStatesEnabled).toBe(false);
    expect(config.setupGuidesEnabled).toBe(false);
    expect(config.stateTransitionsEnabled).toBe(false);
    expect(config.domainEmphasisEnabled).toBe(false);
    expect(config.scanLineEnabled).toBe(true);
    expect(config.measurementStateIntensity).toBe('medium');
  });
});

describe('resolvePoseAvatarConfig body volume', () => {
  it('enables Phase 2 volume by default and can disable it by flag', () => {
    expect(resolvePoseAvatarConfig({}, {}).bodyVolumeEnabled).toBe(true);
    expect(
      resolvePoseAvatarConfig({}, { EXPO_PUBLIC_POSE_AVATAR_BODY_VOLUME: '0' })
        .bodyVolumeEnabled
    ).toBe(false);
    const config = resolvePoseAvatarConfig(
      {},
      { EXPO_PUBLIC_POSE_AVATAR_BODY_VOLUME: '1' }
    );

    expect(config.bodyVolumeEnabled).toBe(true);
    expect(config.torsoVolumeEnabled).toBe(true);
    expect(config.headVolumeEnabled).toBe(true);
    expect(config.shoulderHipDensityEnabled).toBe(false);
    expect(config.maxVolumeDots).toBeLessThanOrEqual(150);
  });

  it('can independently disable torso or head volume', () => {
    const config = resolvePoseAvatarConfig(
      {},
      {
        EXPO_PUBLIC_POSE_AVATAR_BODY_VOLUME: '1',
        EXPO_PUBLIC_POSE_AVATAR_TORSO_VOLUME: 'off',
        EXPO_PUBLIC_POSE_AVATAR_HEAD_VOLUME: 'off',
      }
    );

    expect(config.bodyVolumeEnabled).toBe(true);
    expect(config.torsoVolumeEnabled).toBe(false);
    expect(config.headVolumeEnabled).toBe(false);
  });
});
