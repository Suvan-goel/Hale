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
      'matte-graphite-digital-twin',
      'minimal-constellation',
      'full-constellation',
      'full-point-cloud-body',
    ]);
    for (const summary of summaries) {
      expect(summary.frames).toBe(8);
      expect(summary.geometryMs.count).toBe(8);
    }
    expect(summaries[1].maxSurfacePathCount).toBeLessThanOrEqual(8);
    expect(summaries[1].maxDynamicPathCount).toBeLessThanOrEqual(8);
    expect(summaries[1].maxInternalVertexCount).toBe(92);
    expect(summaries[1].proportionCalibrationComplete).toBe(false);
    expect(summaries[4].maxDots).toBeGreaterThan(summaries[2].maxDots);
  });
});

function makeClock(): () => number {
  let now = 0;
  return () => {
    now += 0.25;
    return now;
  };
}
