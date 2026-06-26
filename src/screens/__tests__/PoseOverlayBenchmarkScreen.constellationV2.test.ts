import {
  CONSTELLATION_V2_600_MODE_ID,
  CONSTELLATION_V2_900_MODE_ID,
  CURRENT_900_DOT_BASELINE_MODE_ID,
  createPoseOverlayBenchmarkModes,
} from '../PoseOverlayBenchmarkScreen';

describe('pose overlay benchmark Constellation V2 modes', () => {
  it('keeps the benchmark selector focused on current production candidates', () => {
    const androidModes = createPoseOverlayBenchmarkModes('android').map((mode) => mode.id);
    const iosModes = createPoseOverlayBenchmarkModes('ios').map((mode) => mode.id);

    expect(androidModes).toEqual([
      'no-overlay',
      'raw-skeleton',
      'point-cloud-900',
      'organic-balanced-dot-1400',
      'premium-constellation-180',
      'premium-constellation-300',
      'premium-constellation-450',
      'soft-continuous-silhouette',
      'soft-digital-twin-lean',
      'soft-digital-twin',
      'sprite-limb-avatar',
      'production-point-cloud',
      'production-point-cloud-no-transitions',
      CONSTELLATION_V2_900_MODE_ID,
      CONSTELLATION_V2_600_MODE_ID,
    ]);
    expect(iosModes).toEqual([
      'no-overlay',
      'raw-skeleton',
      'point-cloud-900',
      'organic-balanced-dot-1400',
      'premium-constellation-180',
      'premium-constellation-300',
      'premium-constellation-450',
      'soft-continuous-silhouette',
      'soft-digital-twin-lean',
      'soft-digital-twin',
      'sprite-limb-avatar',
      'production-point-cloud',
      'production-point-cloud-no-transitions',
    ]);
  });

  it('keeps the current 900-dot SVG baseline unchanged and separately selectable', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const baseline = modes.find((mode) => mode.id === CURRENT_900_DOT_BASELINE_MODE_ID);

    expect(baseline).toMatchObject({
      id: 'point-cloud-900',
      title: 'Current 900-dot SVG',
      configuredDotCount: 900,
    });
    expect(baseline?.nativeBenchmarkOverlayMode).toBeUndefined();
    expect(baseline?.rendererProps).toMatchObject({
      mode: 'point_cloud_body',
      frameSource: 'raw',
      fit: 'contain',
      smoothingEnabled: false,
      pointCloudBodyDensity: 'high',
      pointCloudBodyMaxDots: 900,
      pointCloudBodyDotScale: 1.72,
      pointCloudBodyShowConnections: false,
      pointCloudBodyShowSkeletonLines: false,
      pointCloudBodyShowKeypoints: true,
    });
  });

  it('adds Android-only native V2 modes without mounting the JS renderer', () => {
    const androidModes = createPoseOverlayBenchmarkModes('android');
    const v2_900 = androidModes.find((mode) => mode.id === CONSTELLATION_V2_900_MODE_ID);
    const v2_600 = androidModes.find((mode) => mode.id === CONSTELLATION_V2_600_MODE_ID);

    expect(v2_900).toMatchObject({
      title: 'Constellation V2 · 900',
      configuredDotCount: 900,
      rendererProps: null,
      nativeBenchmarkOverlayMode: 'constellation-v2-900',
      nativeRendererBackend: 'android-native-canvas',
    });
    expect(v2_600).toMatchObject({
      title: 'Constellation V2 · 600',
      configuredDotCount: 600,
      rendererProps: null,
      nativeBenchmarkOverlayMode: 'constellation-v2-600',
      nativeRendererBackend: 'android-native-canvas',
    });

    const iosModes = createPoseOverlayBenchmarkModes('ios');
    expect(iosModes.some((mode) => mode.id === CONSTELLATION_V2_900_MODE_ID)).toBe(false);
    expect(iosModes.some((mode) => mode.id === CONSTELLATION_V2_600_MODE_ID)).toBe(false);
  });

  it('adds the balanced organic dot SVG variant without replacing the baseline', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const organic = modes.find((mode) => mode.id === 'organic-balanced-dot-1400');

    expect(organic).toMatchObject({
      title: 'Balanced organic dot SVG',
      configuredDotCount: 1400,
      rendererProps: {
        mode: 'point_cloud_body',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
        pointCloudBodyDensity: 'high',
        pointCloudBodyMaxDots: 1400,
        pointCloudBodyDotScale: 1.48,
        pointCloudBodyShapeProfile: 'organic',
        pointCloudBodyShowConnections: false,
        pointCloudBodyShowSkeletonLines: false,
        pointCloudBodyShowKeypoints: false,
      },
    });
    expect(organic?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('adds premium constellation volume presets for dot-count latency comparison', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const preset180 = modes.find((mode) => mode.id === 'premium-constellation-180');
    const preset300 = modes.find((mode) => mode.id === 'premium-constellation-300');
    const preset450 = modes.find((mode) => mode.id === 'premium-constellation-450');

    expect(preset180).toMatchObject({
      title: 'Constellation volume · 180',
      configuredDotCount: 180,
      rendererProps: {
        mode: 'premium_constellation_human',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
        premiumConstellationVolumePreset: 'constellationVolume180',
        premiumConstellationShowConnections: false,
      },
    });
    expect(preset300).toMatchObject({
      title: 'Constellation volume · 300',
      configuredDotCount: 300,
      rendererProps: {
        mode: 'premium_constellation_human',
        premiumConstellationVolumePreset: 'constellationVolume300',
      },
    });
    expect(preset450).toMatchObject({
      title: 'Constellation volume · 450',
      configuredDotCount: 450,
      rendererProps: {
        mode: 'premium_constellation_human',
        premiumConstellationVolumePreset: 'constellationVolume450',
      },
    });
    expect(preset180?.nativeBenchmarkOverlayMode).toBeUndefined();
    expect(preset300?.nativeBenchmarkOverlayMode).toBeUndefined();
    expect(preset450?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('adds the matte limb sprite experiment as a low-shape benchmark option', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const sprite = modes.find((mode) => mode.id === 'sprite-limb-avatar');

    expect(sprite).toMatchObject({
      title: 'Matte limb sprites',
      configuredDotCount: 0,
      configuredShapeCount: 18,
      rendererProps: {
        mode: 'sprite_limb_avatar',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
      },
    });
    expect(sprite?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('adds the soft digital twin presets as segmented low-shape benchmark options', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const leanTwin = modes.find((mode) => mode.id === 'soft-digital-twin-lean');
    const digitalTwin = modes.find((mode) => mode.id === 'soft-digital-twin');

    expect(leanTwin).toMatchObject({
      title: 'Premium Human · Lean',
      configuredDotCount: 0,
      configuredShapeCount: 13,
      rendererProps: {
        mode: 'soft_digital_twin',
        softDigitalTwinVisualPreset: 'lean',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
      },
    });
    expect(digitalTwin).toMatchObject({
      title: 'Premium Human Balanced',
      configuredDotCount: 0,
      configuredShapeCount: 13,
      rendererProps: {
        mode: 'soft_digital_twin',
        softDigitalTwinVisualPreset: 'balanced',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
      },
    });
    expect(leanTwin?.nativeBenchmarkOverlayMode).toBeUndefined();
    expect(digitalTwin?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('adds the soft continuous silhouette experiment as a low-path benchmark option', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const silhouette = modes.find((mode) => mode.id === 'soft-continuous-silhouette');

    expect(silhouette).toMatchObject({
      title: 'Soft continuous silhouette',
      configuredDotCount: 0,
      configuredShapeCount: 2,
      rendererProps: {
        mode: 'soft_silhouette_avatar',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
      },
    });
    expect(silhouette?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('keeps rejected visual experiments out of the benchmark selector', () => {
    const modes = createPoseOverlayBenchmarkModes('android').map((mode) => mode.id);

    expect(modes).not.toContain('rigged-human-silhouette');
    expect(modes).not.toContain('shadow-silhouette');
    expect(modes).not.toContain('stipple-sensor-shadow');
    expect(modes).not.toContain('contour-field-avatar');
    expect(modes).not.toContain('minimal-constellation');
    expect(modes).not.toContain('full-constellation');
    expect(modes).not.toContain('point-cloud-225');
    expect(modes).not.toContain('point-cloud-450');
    expect(modes).not.toContain('refined-point-cloud-900');
    expect(modes).not.toContain('organic-dense-dot-2200');
  });
});
