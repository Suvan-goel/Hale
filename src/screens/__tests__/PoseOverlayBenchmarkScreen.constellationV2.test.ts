import {
  CONSTELLATION_V2_600_MODE_ID,
  CONSTELLATION_V2_900_MODE_ID,
  CURRENT_900_DOT_BASELINE_MODE_ID,
  createPoseOverlayBenchmarkModes,
} from '../PoseOverlayBenchmarkScreen';

describe('pose overlay benchmark Constellation V2 modes', () => {
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

  it('adds the refined 900-dot SVG variant without replacing the baseline', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const refined = modes.find((mode) => mode.id === 'refined-point-cloud-900');

    expect(refined).toMatchObject({
      title: 'Refined organic 900-dot SVG',
      configuredDotCount: 900,
      rendererProps: {
        mode: 'point_cloud_body',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
        pointCloudBodyDensity: 'high',
        pointCloudBodyMaxDots: 900,
        pointCloudBodyDotScale: 2.35,
        pointCloudBodyShapeProfile: 'refined',
        pointCloudBodyShowConnections: false,
        pointCloudBodyShowSkeletonLines: false,
        pointCloudBodyShowKeypoints: false,
      },
    });
    expect(refined?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('adds the shadow silhouette as a JS benchmark renderer', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const shadow = modes.find((mode) => mode.id === 'shadow-silhouette');

    expect(shadow).toMatchObject({
      title: 'Shadow silhouette',
      configuredDotCount: 0,
      configuredShapeCount: 6,
      rendererProps: {
        mode: 'shadow_silhouette',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
      },
    });
    expect(shadow?.nativeBenchmarkOverlayMode).toBeUndefined();
  });

  it('adds the stipple sensor shadow as a JS benchmark renderer', () => {
    const modes = createPoseOverlayBenchmarkModes('android');
    const stippleSensor = modes.find((mode) => mode.id === 'stipple-sensor-shadow');

    expect(stippleSensor).toMatchObject({
      title: 'Stipple sensor shadow',
      configuredDotCount: 3000,
      configuredShapeCount: 9,
      rendererProps: {
        mode: 'volumetric_shadow',
        frameSource: 'raw',
        fit: 'contain',
        smoothingEnabled: false,
        pointCloudBodyMaxDots: 3000,
      },
    });
    expect(stippleSensor?.nativeBenchmarkOverlayMode).toBeUndefined();
  });
});
