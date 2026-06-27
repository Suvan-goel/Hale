import {
  createPoseLatencyDiagnostics,
  getPoseLatencyDiagnosticsGateDetails,
  isPoseLatencyDiagnosticsEnabled,
} from '../poseLatencyDiagnostics';
import { runPoseRendererReplaySuite } from '../poseRendererReplay';

describe('pose latency diagnostics', () => {
  it('is disabled unless explicitly enabled', () => {
    expect(isPoseLatencyDiagnosticsEnabled({}, null, true)).toBe(false);
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '0',
        },
        null,
        true
      )
    ).toBe(false);
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
        },
        null,
        true
      )
    ).toBe(true);
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: 'true',
        },
        null,
        true
      )
    ).toBe(false);
  });

  it('can be enabled from app config extra', () => {
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {},
        { extra: { enablePoseLatencyDiagnostics: true } },
        true
      )
    ).toBe(true);
  });

  it('requires explicit release allowance outside dev builds', () => {
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
        },
        null,
        false
      )
    ).toBe(false);
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
          EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE: '1',
        },
        null,
        false
      )
    ).toBe(true);
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
          EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE: 'true',
        },
        null,
        false
      )
    ).toBe(false);
    expect(
      isPoseLatencyDiagnosticsEnabled(
        {},
        {
          extra: {
            enablePoseLatencyDiagnostics: true,
            allowDiagnosticsInRelease: true,
          },
        },
        false
      )
    ).toBe(true);
  });

  it('reports gate details for the settings diagnostics line', () => {
    expect(
      getPoseLatencyDiagnosticsGateDetails(
        {
          EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
          EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE: '1',
        },
        { extra: { enablePoseLatencyDiagnostics: true } },
        false
      )
    ).toEqual({
      dev: false,
      envFlag: '1',
      configFlag: true,
      allowReleaseEnvFlag: '1',
      allowReleaseConfigFlag: false,
      releaseAllowed: true,
      enabled: true,
    });
  });

  it('keeps app config diagnostics defaults off unless the build env uses exact opt-ins', () => {
    const originalEnable = process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS;
    const originalAllow = process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE;
    const resolveExtra = (
      enable: string | undefined,
      allow: string | undefined
    ): { enablePoseLatencyDiagnostics: boolean; allowDiagnosticsInRelease: boolean } => {
      jest.resetModules();
      if (enable === undefined) {
        delete process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS;
      } else {
        process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS = enable;
      }
      if (allow === undefined) {
        delete process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE;
      } else {
        process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE = allow;
      }
      const buildConfig = require('../../../app.config.js') as (input: {
        config: { extra?: Record<string, unknown> };
      }) => { extra: { enablePoseLatencyDiagnostics: boolean; allowDiagnosticsInRelease: boolean } };
      return buildConfig({ config: { extra: {} } }).extra;
    };

    try {
      expect(resolveExtra(undefined, undefined)).toMatchObject({
        enablePoseLatencyDiagnostics: false,
        allowDiagnosticsInRelease: false,
      });
      expect(resolveExtra('true', 'true')).toMatchObject({
        enablePoseLatencyDiagnostics: false,
        allowDiagnosticsInRelease: false,
      });
      expect(resolveExtra('1', '1')).toMatchObject({
        enablePoseLatencyDiagnostics: true,
        allowDiagnosticsInRelease: true,
      });
    } finally {
      jest.resetModules();
      if (originalEnable === undefined) {
        delete process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS;
      } else {
        process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS = originalEnable;
      }
      if (originalAllow === undefined) {
        delete process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE;
      } else {
        process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE = originalAllow;
      }
    }
  });

  it('tracks native timings, JS transform cost, rates, stale frames, and ordering', () => {
    let now = 1_000;
    const diagnostics = createPoseLatencyDiagnostics({
      mode: 'live',
      freshnessThresholdMs: 20,
      nowMs: () => now,
    });

    const first = diagnostics.beginFrame({
      timestampMs: 500,
      inferenceMs: 10,
      sourceWidth: 480,
      sourceHeight: 640,
      landmarks: [],
      latency: {
        frameId: 1,
        nativeClock: 'android.elapsedRealtimeNanos',
        sourceTimestampMs: 500,
        preprocessingStartMs: 900,
        preprocessingEndMs: 903,
        mediapipeSubmitMs: 904,
        mediapipeCallbackMs: 914,
        nativePostprocessEndMs: 916,
        nativeEventEmitMs: 917,
        sourceAgeAtMediapipeSubmitMs: 404,
        sourceAgeAtMediapipeCallbackMs: 414,
        sourceAgeAtNativeEventEmitMs: 417,
        imageProxyToBitmapMs: 3,
        explicitRotationMs: 2,
        mpImageBuildMs: 1,
        resultFlattenMs: 0.5,
        eventPayloadBuildMs: 0.25,
        modelAsset: 'pose_landmarker_full.task',
        requestedDelegate: 'GPU',
        selectedDelegate: 'CPU',
        gpuDelegateFallback: true,
        gpuDelegateFailureMessage: 'delegate unavailable',
        runningMode: 'LIVE_STREAM',
        pipelineMode: 'full-live-stream',
        rotationMode: 'metadata',
        analysisTargetWidth: 512,
        analysisTargetHeight: 384,
        imageProxyWidth: 512,
        imageProxyHeight: 384,
        imageProxyFormat: 1,
        imageProxyFormatName: 'RGBA_8888',
        imageProxyRotationDegrees: 90,
        imageProcessingRotationDegrees: 90,
        emittedSourceWidth: 480,
        emittedSourceHeight: 640,
        landmarkRotationDegrees: 90,
        cameraTargetRotation: 0,
        cameraFacing: 'front',
        mirrorState: true,
        cameraId: '0',
        sensorTimestampSourceRaw: 1,
        sensorTimestampSourceName: 'REALTIME',
        sensorTimestampComparableToElapsedRealtime: true,
        mpImageWidth: 512,
        mpImageHeight: 384,
        numPoses: 1,
        outputSegmentationMasks: false,
        cameraInputFps: 30,
        acceptedFrameFps: 28,
        submittedInferenceFps: 24,
        resultFps: 23,
        busyFrameDropCount: 2,
        nativeEventScheduledCount: 3,
        nativeEventCoalescedCount: 1,
        nativeEventRejectedCount: 0,
        nativeEventEmittedCount: 2,
        nativeRenderer: {
          backend: 'android-native-canvas',
          mode: 'constellation-v2-900',
          requestedPointCount: 900,
          actualPointCount: 900,
          topologyBuildCount: 1,
          topologyBuildMs: 0.25,
          calibrationState: 'collecting',
          virtualRegionCount: 17,
          drawBatchCount: 7,
          pointBufferBytes: 50400,
          transformMs: { count: 1, p50: 0.4, p90: 0.4, p95: 0.4, p99: 0.4, max: 0.4 },
          drawMs: { count: 1, p50: 0.8, p90: 0.8, p95: 0.8, p99: 0.8, max: 0.8 },
          sourceAgeAtDrawStartMs: {
            count: 1,
            p50: 405,
            p90: 405,
            p95: 405,
            p99: 405,
            max: 405,
          },
          sourceAgeAtDrawEndMs: {
            count: 1,
            p50: 406,
            p90: 406,
            p95: 406,
            p99: 406,
            max: 406,
          },
          framesRequested: 1,
          framesDrawn: 1,
          framesCoalesced: 0,
          framesRejected: 0,
          latestFrameIdDrawn: 1,
          publishedHz: 13,
          droppedInvalidPointCount: 0,
          nonFiniteGeometryCount: 0,
          lastVisiblePointCount: 900,
          emeraldPointCount: 8,
        },
      },
    });
    now += 3;
    diagnostics.markJsTransformEnd(first);
    now += 4;
    diagnostics.markRendererUpdateSubmitted(first);
    diagnostics.markRendererCoalesced();
    diagnostics.markRendererPublished(2);

    now = 1_060;
    const second = diagnostics.beginFrame({
      timestampMs: 520,
      inferenceMs: 11,
      sourceWidth: 480,
      sourceHeight: 640,
      landmarks: [],
      latency: {
        frameId: 1,
        nativeClock: 'android.elapsedRealtimeNanos',
        sourceTimestampMs: 520,
        preprocessingStartMs: 940,
        preprocessingEndMs: 944,
        mediapipeSubmitMs: 945,
        mediapipeCallbackMs: 956,
        nativePostprocessEndMs: 957,
        nativeEventEmitMs: 958,
      },
    });
    diagnostics.markJsTransformEnd(second);
    diagnostics.markRendererUpdateSubmitted(second);

    const snapshot = diagnostics.snapshot(1_060);
    expect(snapshot.framesReceived).toBe(2);
    expect(snapshot.rendererUpdateCalls).toBe(2);
    expect(snapshot.rendererPublishedFrames).toBe(1);
    expect(snapshot.rendererCoalescedFrames).toBe(1);
    expect(snapshot.frameIdOutOfOrder).toBe(1);
    expect(snapshot.staleAtReceipt).toBe(1);
    expect(snapshot.nativeClock).toBe('android.elapsedRealtimeNanos');
    expect(snapshot.nativePreprocessMs.p50).toBe(3);
    expect(snapshot.nativeInferenceWallMs.p95).toBe(11);
    expect(snapshot.nativeSourceAgeAtEmitMs.p50).toBe(417);
    expect(snapshot.nativeBitmapConversionMs.p50).toBe(3);
    expect(snapshot.nativeExplicitRotationMs.p50).toBe(2);
    expect(snapshot.nativeMpImageBuildMs.p50).toBe(1);
    expect(snapshot.nativeRuntime).toMatchObject({
      modelAsset: 'pose_landmarker_full.task',
      selectedDelegate: 'CPU',
      gpuDelegateFallback: true,
      gpuDelegateFailureMessage: 'delegate unavailable',
      pipelineMode: 'full-live-stream',
      rotationMode: 'metadata',
      analysisTargetWidth: 512,
      imageProcessingRotationDegrees: 90,
      emittedSourceWidth: 480,
      emittedSourceHeight: 640,
      cameraFacing: 'front',
      mirrorState: true,
      cameraId: '0',
      sensorTimestampSourceRaw: 1,
      sensorTimestampSourceName: 'REALTIME',
      sensorTimestampComparableToElapsedRealtime: true,
      nativeEventCoalescedCount: 1,
      resultFps: 23,
    });
    expect(snapshot.nativeRenderer).toMatchObject({
      backend: 'android-native-canvas',
      requestedPointCount: 900,
      actualPointCount: 900,
      drawBatchCount: 7,
      calibrationState: 'collecting',
    });
    expect(snapshot.nativeRenderer?.transformMs.p95).toBe(0.4);
    expect(snapshot.rendererInputWidth).toBe(480);
    expect(snapshot.rendererInputHeight).toBe(640);
    expect(snapshot.jsTransformMs.count).toBe(2);
    expect(snapshot.geometryMs.p50).toBe(2);
    expect(snapshot.approxPoseAgeAtReceiptMs.max).toBe(40);
  });
});

describe('pose renderer replay diagnostics', () => {
  it('benchmarks every comparison mode against the same synthetic stream', () => {
    const summaries = runPoseRendererReplaySuite({
      frameCount: 8,
      nowMs: makeClock(),
    });
    expect(summaries.map((summary) => summary.mode)).toEqual([
      'raw-skeleton',
      'rigged-human-silhouette',
      'shadow-silhouette',
      'privacy-shadow',
      'soft-continuous-silhouette',
      'soft-digital-twin-lean',
      'soft-digital-twin',
      'premium-constellation-180',
      'premium-constellation-300',
      'premium-constellation-450',
      'sprite-limb-avatar',
      'stipple-sensor-shadow',
      'contour-field-avatar',
      'minimal-constellation',
      'full-constellation',
      'organic-balanced-point-cloud-body',
      'full-point-cloud-body',
    ]);
    for (const summary of summaries) {
      expect(summary.frames).toBe(8);
      expect(summary.geometryMs.count).toBe(8);
    }
    const byMode = new Map(summaries.map((summary) => [summary.mode, summary]));
    const rigged = byMode.get('rigged-human-silhouette');
    const shadow = byMode.get('shadow-silhouette');
    const privacyShadow = byMode.get('privacy-shadow');
    const softSilhouette = byMode.get('soft-continuous-silhouette');
    const softDigitalTwinLean = byMode.get('soft-digital-twin-lean');
    const softDigitalTwin = byMode.get('soft-digital-twin');
    const premium180 = byMode.get('premium-constellation-180');
    const premium300 = byMode.get('premium-constellation-300');
    const premium450 = byMode.get('premium-constellation-450');
    const sprite = byMode.get('sprite-limb-avatar');
    const stipple = byMode.get('stipple-sensor-shadow');
    const contour = byMode.get('contour-field-avatar');
    const minimal = byMode.get('minimal-constellation');
    const organic = byMode.get('organic-balanced-point-cloud-body');
    const full = byMode.get('full-point-cloud-body');

    expect(rigged?.maxSurfacePathCount).toBeLessThanOrEqual(8);
    expect(rigged?.maxDynamicPathCount).toBeLessThanOrEqual(8);
    expect(rigged?.maxInternalVertexCount).toBe(112);
    expect(rigged?.maxVirtualBoneCount).toBe(17);
    expect(rigged?.calibrationState).toBe('collecting');
    expect(rigged?.orientationProfile).toBeTruthy();
    expect(rigged?.proportionCalibrationComplete).toBe(false);
    expect(shadow?.maxSurfacePathCount).toBeLessThanOrEqual(6);
    expect(shadow?.maxDynamicPathCount).toBeLessThanOrEqual(6);
    expect(privacyShadow?.maxDots).toBe(0);
    expect(privacyShadow?.maxLines).toBe(0);
    expect(privacyShadow?.maxSurfacePathCount).toBeLessThanOrEqual(3);
    expect(privacyShadow?.maxDynamicPathCount).toBeLessThanOrEqual(3);
    expect(privacyShadow?.maxShapeCount).toBeLessThanOrEqual(18);
    expect(softSilhouette?.maxSurfacePathCount).toBeLessThanOrEqual(5);
    expect(softSilhouette?.maxDynamicPathCount).toBeLessThanOrEqual(5);
    expect(softDigitalTwinLean?.maxSurfacePathCount).toBeLessThanOrEqual(13);
    expect(softDigitalTwinLean?.maxDynamicPathCount).toBeLessThanOrEqual(13);
    expect(softDigitalTwin?.maxSurfacePathCount).toBeLessThanOrEqual(13);
    expect(softDigitalTwin?.maxDynamicPathCount).toBeLessThanOrEqual(13);
    expect(premium180?.maxDots).toBeLessThanOrEqual(180);
    expect(premium300?.maxDots).toBeLessThanOrEqual(300);
    expect(premium450?.maxDots).toBeLessThanOrEqual(450);
    expect(premium300?.maxDots).toBeGreaterThan(premium180?.maxDots ?? 0);
    expect(premium450?.maxDots).toBeGreaterThan(premium300?.maxDots ?? 0);
    expect(premium180?.maxLines).toBe(0);
    expect(premium300?.maxLines).toBe(0);
    expect(premium450?.maxLines).toBe(0);
    expect(sprite?.maxSurfacePathCount).toBeLessThanOrEqual(18);
    expect(sprite?.maxDynamicPathCount).toBe(0);
    expect(sprite?.maxStaticTransformedShapeCount).toBeLessThanOrEqual(18);
    expect(stipple?.maxSurfacePathCount).toBeLessThanOrEqual(9);
    expect(stipple?.maxDots).toBeLessThanOrEqual(3040);
    expect(contour?.maxSurfacePathCount).toBeLessThanOrEqual(4);
    expect(contour?.maxDynamicPathCount).toBeLessThanOrEqual(4);
    expect(contour?.maxLines).toBeLessThanOrEqual(180);
    expect(contour?.maxDots).toBeLessThanOrEqual(120);
    expect(organic?.maxDots).toBeGreaterThan(1200);
    expect(organic?.maxDots).toBeLessThanOrEqual(1400);
    expect(full?.maxDots).toBeGreaterThan(minimal?.maxDots ?? 0);
  });
});

function makeClock(): () => number {
  let now = 0;
  return () => {
    now += 0.25;
    return now;
  };
}
