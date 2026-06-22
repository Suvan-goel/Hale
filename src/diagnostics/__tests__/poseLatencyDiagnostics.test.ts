import {
  createPoseLatencyDiagnostics,
  isPoseLatencyDiagnosticsEnabled,
} from '../poseLatencyDiagnostics';
import { runPoseRendererReplaySuite } from '../poseRendererReplay';

describe('pose latency diagnostics', () => {
  it('is disabled unless explicitly enabled', () => {
    expect(isPoseLatencyDiagnosticsEnabled({})).toBe(false);
    expect(
      isPoseLatencyDiagnosticsEnabled({
        EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '0',
      })
    ).toBe(false);
    expect(
      isPoseLatencyDiagnosticsEnabled({
        EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
      })
    ).toBe(true);
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
      'minimal-constellation',
      'full-constellation',
      'full-point-cloud-body',
    ]);
    for (const summary of summaries) {
      expect(summary.frames).toBe(8);
      expect(summary.geometryMs.count).toBe(8);
    }
    expect(summaries[3].maxDots).toBeGreaterThan(summaries[1].maxDots);
  });
});

function makeClock(): () => number {
  let now = 0;
  return () => {
    now += 0.25;
    return now;
  };
}
