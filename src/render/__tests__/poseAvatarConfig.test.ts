import fs from 'fs';
import path from 'path';

import {
  DEFAULT_POSE_AVATAR_RENDERER_MODE,
  resolvePoseAvatarConfig,
  resolvePoseAvatarRendererMode,
} from '../poseAvatarConfig';

describe('resolvePoseAvatarRendererMode', () => {
  it('accepts classic, constellation, point-cloud body, and MediaPipe skeleton', () => {
    expect(resolvePoseAvatarRendererMode('classic')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('constellation')).toBe('constellation');
    expect(resolvePoseAvatarRendererMode('point_cloud_body')).toBe('point_cloud_body');
    expect(resolvePoseAvatarRendererMode('mediapipe_skeleton')).toBe('mediapipe_skeleton');
  });

  it('keeps silhouette experiments out of env/default renderer selection', () => {
    expect(DEFAULT_POSE_AVATAR_RENDERER_MODE).toBe('point_cloud_body');
    expect(resolvePoseAvatarRendererMode('rigged_human_silhouette')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('shadow_silhouette')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('soft_digital_twin')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('soft_silhouette_avatar')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('sprite_limb_avatar')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('premium_constellation_human')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('volumetric_shadow')).toBe('classic');
    expect(resolvePoseAvatarRendererMode('contour_field')).toBe('classic');
    expect(resolvePoseAvatarConfig({ mode: 'rigged_human_silhouette' }, {}).mode).toBe(
      'rigged_human_silhouette'
    );
    expect(resolvePoseAvatarConfig({ mode: 'shadow_silhouette' }, {}).mode).toBe(
      'shadow_silhouette'
    );
    expect(resolvePoseAvatarConfig({ mode: 'soft_digital_twin' }, {}).mode).toBe(
      'soft_digital_twin'
    );
    expect(resolvePoseAvatarConfig({ mode: 'soft_silhouette_avatar' }, {}).mode).toBe(
      'soft_silhouette_avatar'
    );
    expect(resolvePoseAvatarConfig({ mode: 'sprite_limb_avatar' }, {}).mode).toBe(
      'sprite_limb_avatar'
    );
    expect(resolvePoseAvatarConfig({ mode: 'premium_constellation_human' }, {}).mode).toBe(
      'premium_constellation_human'
    );
    expect(resolvePoseAvatarConfig({ mode: 'volumetric_shadow' }, {}).mode).toBe(
      'volumetric_shadow'
    );
    expect(resolvePoseAvatarConfig({ mode: 'contour_field' }, {}).mode).toBe('contour_field');
  });

  it('defaults to point-cloud body when no explicit value is set', () => {
    expect(resolvePoseAvatarRendererMode(undefined, undefined)).toBe('point_cloud_body');
    expect(resolvePoseAvatarRendererMode('', undefined)).toBe('point_cloud_body');
  });

  it('can resolve the body style env to the point-cloud body renderer', () => {
    expect(resolvePoseAvatarRendererMode(undefined, 'point_cloud_body')).toBe(
      'point_cloud_body'
    );
    expect(resolvePoseAvatarRendererMode(undefined, 'mediapipe_skeleton')).toBe(
      'mediapipe_skeleton'
    );
    expect(resolvePoseAvatarRendererMode(undefined, 'skeleton_constellation')).toBe(
      'constellation'
    );
  });

  it('falls back to classic for invalid explicit values', () => {
    expect(resolvePoseAvatarRendererMode('mesh')).toBe('classic');
  });
});

describe('rigged human silhouette production isolation', () => {
  it('does not select rigged_human_silhouette from production camera screens', () => {
    const root = path.resolve(__dirname, '../../..');
    const productionScreens = [
      'src/screens/LiveSessionScreen.tsx',
      'src/screens/CheckUpScreen.tsx',
      'src/screens/MicroCheckScreen.tsx',
      'src/screens/MovementProfileV2CheckUpScreen.tsx',
      'src/screens/TrainingSessionScreen.tsx',
    ];

    for (const file of productionScreens) {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      expect(source).not.toContain('rigged_human_silhouette');
      expect(source).not.toContain('shadow_silhouette');
      expect(source).not.toContain('soft_digital_twin');
      expect(source).not.toContain('soft_silhouette_avatar');
      expect(source).not.toContain('sprite_limb_avatar');
      expect(source).not.toContain('premium_constellation_human');
      expect(source).not.toContain('volumetric_shadow');
      expect(source).not.toContain('contour_field');
      expect(source).not.toContain('matte_graphite_digital_twin');
      expect(source).not.toContain('sculpted_body');
    }
  });

  it('keeps rejected visual experiments out of the benchmark selector', () => {
    const root = path.resolve(__dirname, '../../..');
    const benchmarkSource = fs.readFileSync(
      path.join(root, 'src/screens/PoseOverlayBenchmarkScreen.tsx'),
      'utf8'
    );
    expect(benchmarkSource).not.toContain('rigged-human-silhouette');
    expect(benchmarkSource).not.toContain('rigged_human_silhouette');
    expect(benchmarkSource).not.toContain('shadow-silhouette');
    expect(benchmarkSource).not.toContain('shadow_silhouette');
    expect(benchmarkSource).not.toContain('stipple-sensor-shadow');
    expect(benchmarkSource).not.toContain('volumetric_shadow');
    expect(benchmarkSource).not.toContain('contour-field-avatar');
    expect(benchmarkSource).not.toContain('contour_field');
    expect(benchmarkSource).not.toContain('minimal-constellation');
    expect(benchmarkSource).not.toContain('full-constellation');
    expect(benchmarkSource).not.toContain('point-cloud-225');
    expect(benchmarkSource).not.toContain('point-cloud-450');
    expect(benchmarkSource).not.toContain('matte-graphite-digital-twin');
    expect(benchmarkSource).not.toContain('matte_graphite_digital_twin');
    expect(benchmarkSource).not.toContain('sculpted-figure');
    expect(benchmarkSource).not.toContain('sculpted_body');
  });
});

describe('resolvePoseAvatarConfig', () => {
  it('defaults to responsive point-cloud body rendering', () => {
    const config = resolvePoseAvatarConfig({}, {});

    expect(config.mode).toBe('point_cloud_body');
    expect(config.frameSource).toBe('raw');
    expect(config.smoothingEnabled).toBe(true);
    expect(config.adaptiveSmoothingEnabled).toBe(true);
    expect(config.smoothingAlpha).toBeGreaterThanOrEqual(0.75);
    expect(config.sampledDotsEnabled).toBe(true);
    expect(config.bodyVolumeEnabled).toBe(true);
    expect(config.pointCloudBodyEnabled).toBe(true);
    expect(config.pointCloudBodyDensity).toBe('high');
    expect(config.pointCloudBodyMaxDots).toBe(900);
    expect(config.pointCloudBodyShowConnections).toBe(false);
    expect(config.pointCloudBodyShowSkeletonLines).toBe(false);
    expect(config.pointCloudBodyShowKeypoints).toBe(true);
    expect(config.pointCloudBodyDotScale).toBe(1.72);
    expect(config.pointCloudBodyOpacity).toBe(1);
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
    expect(config.pointCloudBodyDensity).toBe('low');
    expect(config.pointCloudBodyMaxDots).toBeLessThanOrEqual(560);
    expect(config.pointCloudBodyShowConnections).toBe(false);
    expect(config.pointCloudBodyShowSkeletonLines).toBe(false);
    expect(config.pointCloudBodyDotScale).toBe(1.42);
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
    const pointCloud = resolvePoseAvatarConfig(
      {},
      { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'point-cloud-body-connections-on' }
    );
    expect(pointCloud.mode).toBe('point_cloud_body');
    expect(pointCloud.pointCloudBodyShowConnections).toBe(true);
    expect(
      resolvePoseAvatarConfig(
        {},
        { EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT: 'point-cloud-body-skeleton-lines-on' }
      ).pointCloudBodyShowSkeletonLines
    ).toBe(true);
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

  it('allows point-cloud body env overrides', () => {
    const config = resolvePoseAvatarConfig(
      {},
      {
        EXPO_PUBLIC_POSE_AVATAR_BODY_STYLE: 'point_cloud_body',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_DENSITY: 'high',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_MAX_DOTS: '720',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_CONNECTIONS: 'on',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_CONNECTION_OPACITY: '0.08',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_CONNECTION_MAX_LINES: '48',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_SKELETON_LINES: 'off',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_KEYPOINTS: 'off',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_DOT_SCALE: '1.4',
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_OPACITY: '0.7',
      }
    );

    expect(config.mode).toBe('point_cloud_body');
    expect(config.pointCloudBodyDensity).toBe('high');
    expect(config.pointCloudBodyMaxDots).toBe(720);
    expect(config.pointCloudBodyShowConnections).toBe(true);
    expect(config.pointCloudBodyConnectionOpacity).toBe(0.08);
    expect(config.pointCloudBodyConnectionMaxLines).toBe(48);
    expect(config.pointCloudBodyShowSkeletonLines).toBe(false);
    expect(config.pointCloudBodyShowKeypoints).toBe(false);
    expect(config.pointCloudBodyDotScale).toBe(1.4);
    expect(config.pointCloudBodyOpacity).toBe(0.7);
  });

  it('allows explicit benchmark props to exceed the production point-cloud dot cap', () => {
    const config = resolvePoseAvatarConfig(
      {
        mode: 'point_cloud_body',
        pointCloudBodyMaxDots: 2200,
        pointCloudBodyShapeProfile: 'organic',
      },
      {
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_MAX_DOTS: '2200',
      }
    );
    const envOnly = resolvePoseAvatarConfig(
      {},
      {
        EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_MAX_DOTS: '2200',
      }
    );

    expect(config.pointCloudBodyMaxDots).toBe(2200);
    expect(config.pointCloudBodyShapeProfile).toBe('organic');
    expect(envOnly.pointCloudBodyMaxDots).toBe(900);
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
