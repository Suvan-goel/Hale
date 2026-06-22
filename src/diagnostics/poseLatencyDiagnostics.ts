import type { LandmarksEventPayload } from '../../modules/expo-pose-detection';

export const POSE_LATENCY_DIAGNOSTICS_ENV = 'EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS';

export type PoseLatencyDiagnosticsMode =
  | 'live'
  | 'checkup'
  | 'training'
  | 'micro-check'
  | 'benchmark'
  | 'replay';

export interface PoseLatencyFrameToken {
  sequence: number;
  frameId: number | null;
  sourceTimestampMs: number;
  jsReceiptMs: number;
  approxPoseAgeAtReceiptMs: number | null;
}

export interface MetricSnapshot {
  count: number;
  p50: number | null;
  p90: number | null;
  p95: number | null;
  p99: number | null;
  max: number | null;
}

export interface PoseLatencyDiagnosticsSnapshot {
  mode: PoseLatencyDiagnosticsMode;
  framesReceived: number;
  rendererUpdateCalls: number;
  rendererPublishedFrames: number;
  rendererCoalescedFrames: number;
  rendererRejectedFrames: number;
  frameIdOutOfOrder: number;
  timestampOutOfOrder: number;
  staleAtReceipt: number;
  staleAtRenderSubmit: number;
  nativeClock: string | null;
  sourceClockOffsetMs: number | null;
  jsEventHz: number;
  rendererUpdateCallHz: number;
  inferenceMs: MetricSnapshot;
  nativePreprocessMs: MetricSnapshot;
  nativeInferenceWallMs: MetricSnapshot;
  nativePostprocessMs: MetricSnapshot;
  nativeEmitEnqueueMs: MetricSnapshot;
  nativeSourceAgeAtMediapipeSubmitMs: MetricSnapshot;
  nativeSourceAgeAtMediapipeCallbackMs: MetricSnapshot;
  nativeSourceAgeAtEmitMs: MetricSnapshot;
  jsTransformMs: MetricSnapshot;
  geometryMs: MetricSnapshot;
  approxPoseAgeAtReceiptMs: MetricSnapshot;
  approxPoseAgeAtRenderSubmitMs: MetricSnapshot;
  maxApproxPoseAgeMs: number | null;
  rendererPublishedHz: number;
}

export interface PoseLatencyDiagnosticsOptions {
  mode: PoseLatencyDiagnosticsMode;
  windowSize?: number;
  freshnessThresholdMs?: number;
  nowMs?: () => number;
}

export class PoseLatencyDiagnostics {
  private readonly mode: PoseLatencyDiagnosticsMode;
  private readonly freshnessThresholdMs: number;
  private readonly now: () => number;
  private readonly inferenceMs: RollingMetric;
  private readonly nativePreprocessMs: RollingMetric;
  private readonly nativeInferenceWallMs: RollingMetric;
  private readonly nativePostprocessMs: RollingMetric;
  private readonly nativeEmitEnqueueMs: RollingMetric;
  private readonly nativeSourceAgeAtMediapipeSubmitMs: RollingMetric;
  private readonly nativeSourceAgeAtMediapipeCallbackMs: RollingMetric;
  private readonly nativeSourceAgeAtEmitMs: RollingMetric;
  private readonly jsTransformMs: RollingMetric;
  private readonly geometryMs: RollingMetric;
  private readonly poseAgeAtReceiptMs: RollingMetric;
  private readonly poseAgeAtRenderSubmitMs: RollingMetric;
  private readonly eventTimes: RollingTimes;
  private readonly rendererTimes: RollingTimes;
  private readonly rendererPublishedTimes: RollingTimes;

  private framesReceived = 0;
  private rendererUpdateCalls = 0;
  private rendererPublishedFrames = 0;
  private rendererCoalescedFrames = 0;
  private rendererRejectedFrames = 0;
  private frameIdOutOfOrder = 0;
  private timestampOutOfOrder = 0;
  private staleAtReceipt = 0;
  private staleAtRenderSubmit = 0;
  private lastFrameId: number | null = null;
  private lastSourceTimestampMs: number | null = null;
  private sourceClockOffsetMs: number | null = null;
  private nativeClock: string | null = null;
  private maxApproxPoseAgeMs: number | null = null;

  constructor(options: PoseLatencyDiagnosticsOptions) {
    const windowSize = Math.max(16, Math.round(options.windowSize ?? 240));
    this.mode = options.mode;
    this.freshnessThresholdMs = options.freshnessThresholdMs ?? 180;
    this.now = options.nowMs ?? defaultNowMs;
    this.inferenceMs = new RollingMetric(windowSize);
    this.nativePreprocessMs = new RollingMetric(windowSize);
    this.nativeInferenceWallMs = new RollingMetric(windowSize);
    this.nativePostprocessMs = new RollingMetric(windowSize);
    this.nativeEmitEnqueueMs = new RollingMetric(windowSize);
    this.nativeSourceAgeAtMediapipeSubmitMs = new RollingMetric(windowSize);
    this.nativeSourceAgeAtMediapipeCallbackMs = new RollingMetric(windowSize);
    this.nativeSourceAgeAtEmitMs = new RollingMetric(windowSize);
    this.jsTransformMs = new RollingMetric(windowSize);
    this.geometryMs = new RollingMetric(windowSize);
    this.poseAgeAtReceiptMs = new RollingMetric(windowSize);
    this.poseAgeAtRenderSubmitMs = new RollingMetric(windowSize);
    this.eventTimes = new RollingTimes(windowSize);
    this.rendererTimes = new RollingTimes(windowSize);
    this.rendererPublishedTimes = new RollingTimes(windowSize);
  }

  beginFrame(event: LandmarksEventPayload, receiptNowMs = this.now()): PoseLatencyFrameToken {
    const native = event.latency;
    const frameId = native ? Math.round(native.frameId) : null;
    const sourceTimestampMs = native?.sourceTimestampMs ?? event.timestampMs;
    if (native?.nativeClock) this.nativeClock = native.nativeClock;

    this.framesReceived++;
    this.eventTimes.push(receiptNowMs);
    if (typeof event.inferenceMs === 'number') this.inferenceMs.push(event.inferenceMs);

    if (frameId !== null) {
      if (this.lastFrameId !== null && frameId <= this.lastFrameId) {
        this.frameIdOutOfOrder++;
      }
      this.lastFrameId = frameId;
    }
    if (this.lastSourceTimestampMs !== null && sourceTimestampMs < this.lastSourceTimestampMs) {
      this.timestampOutOfOrder++;
    }
    this.lastSourceTimestampMs = sourceTimestampMs;

    if (this.sourceClockOffsetMs === null) {
      this.sourceClockOffsetMs = receiptNowMs - sourceTimestampMs;
    }
    const approxAge = receiptNowMs - (sourceTimestampMs + this.sourceClockOffsetMs);
    const safeAge = Number.isFinite(approxAge) ? Math.max(0, approxAge) : null;
    if (safeAge !== null) {
      this.poseAgeAtReceiptMs.push(safeAge);
      this.maxApproxPoseAgeMs =
        this.maxApproxPoseAgeMs === null ? safeAge : Math.max(this.maxApproxPoseAgeMs, safeAge);
      if (safeAge > this.freshnessThresholdMs) this.staleAtReceipt++;
    }

    if (native) {
      this.nativePreprocessMs.push(native.preprocessingEndMs - native.preprocessingStartMs);
      this.nativeInferenceWallMs.push(native.mediapipeCallbackMs - native.mediapipeSubmitMs);
      this.nativePostprocessMs.push(native.nativePostprocessEndMs - native.mediapipeCallbackMs);
      this.nativeEmitEnqueueMs.push(native.nativeEventEmitMs - native.nativePostprocessEndMs);
      if (typeof native.sourceAgeAtMediapipeSubmitMs === 'number') {
        this.nativeSourceAgeAtMediapipeSubmitMs.push(native.sourceAgeAtMediapipeSubmitMs);
      }
      if (typeof native.sourceAgeAtMediapipeCallbackMs === 'number') {
        this.nativeSourceAgeAtMediapipeCallbackMs.push(native.sourceAgeAtMediapipeCallbackMs);
      }
      if (typeof native.sourceAgeAtNativeEventEmitMs === 'number') {
        this.nativeSourceAgeAtEmitMs.push(native.sourceAgeAtNativeEventEmitMs);
      }
    }

    return {
      sequence: this.framesReceived,
      frameId,
      sourceTimestampMs,
      jsReceiptMs: receiptNowMs,
      approxPoseAgeAtReceiptMs: safeAge,
    };
  }

  markJsTransformEnd(token: PoseLatencyFrameToken | null | undefined, endNowMs = this.now()): void {
    if (!token) return;
    this.jsTransformMs.push(endNowMs - token.jsReceiptMs);
  }

  markRendererUpdateSubmitted(
    token: PoseLatencyFrameToken | null | undefined,
    submitNowMs = this.now()
  ): void {
    if (!token) return;
    this.rendererUpdateCalls++;
    this.rendererTimes.push(submitNowMs);
    if (this.sourceClockOffsetMs === null) return;
    const approxAge = submitNowMs - (token.sourceTimestampMs + this.sourceClockOffsetMs);
    if (!Number.isFinite(approxAge)) return;
    const safeAge = Math.max(0, approxAge);
    this.poseAgeAtRenderSubmitMs.push(safeAge);
    this.maxApproxPoseAgeMs =
      this.maxApproxPoseAgeMs === null ? safeAge : Math.max(this.maxApproxPoseAgeMs, safeAge);
    if (safeAge > this.freshnessThresholdMs) this.staleAtRenderSubmit++;
  }

  recordGeometryWork(durationMs: number): void {
    this.geometryMs.push(durationMs);
  }

  markRendererPublished(durationMs: number | null | undefined, publishedNowMs = this.now()): void {
    this.rendererPublishedFrames++;
    this.rendererPublishedTimes.push(publishedNowMs);
    if (typeof durationMs === 'number') this.geometryMs.push(durationMs);
  }

  markRendererCoalesced(): void {
    this.rendererCoalescedFrames++;
  }

  markRendererRejected(): void {
    this.rendererRejectedFrames++;
  }

  snapshot(nowMs = this.now()): PoseLatencyDiagnosticsSnapshot {
    return {
      mode: this.mode,
      framesReceived: this.framesReceived,
      rendererUpdateCalls: this.rendererUpdateCalls,
      rendererPublishedFrames: this.rendererPublishedFrames,
      rendererCoalescedFrames: this.rendererCoalescedFrames,
      rendererRejectedFrames: this.rendererRejectedFrames,
      frameIdOutOfOrder: this.frameIdOutOfOrder,
      timestampOutOfOrder: this.timestampOutOfOrder,
      staleAtReceipt: this.staleAtReceipt,
      staleAtRenderSubmit: this.staleAtRenderSubmit,
      nativeClock: this.nativeClock,
      sourceClockOffsetMs: this.sourceClockOffsetMs,
      jsEventHz: this.eventTimes.hz(nowMs),
      rendererUpdateCallHz: this.rendererTimes.hz(nowMs),
      inferenceMs: this.inferenceMs.snapshot(),
      nativePreprocessMs: this.nativePreprocessMs.snapshot(),
      nativeInferenceWallMs: this.nativeInferenceWallMs.snapshot(),
      nativePostprocessMs: this.nativePostprocessMs.snapshot(),
      nativeEmitEnqueueMs: this.nativeEmitEnqueueMs.snapshot(),
      nativeSourceAgeAtMediapipeSubmitMs: this.nativeSourceAgeAtMediapipeSubmitMs.snapshot(),
      nativeSourceAgeAtMediapipeCallbackMs: this.nativeSourceAgeAtMediapipeCallbackMs.snapshot(),
      nativeSourceAgeAtEmitMs: this.nativeSourceAgeAtEmitMs.snapshot(),
      jsTransformMs: this.jsTransformMs.snapshot(),
      geometryMs: this.geometryMs.snapshot(),
      approxPoseAgeAtReceiptMs: this.poseAgeAtReceiptMs.snapshot(),
      approxPoseAgeAtRenderSubmitMs: this.poseAgeAtRenderSubmitMs.snapshot(),
      maxApproxPoseAgeMs: this.maxApproxPoseAgeMs,
      rendererPublishedHz: this.rendererPublishedTimes.hz(nowMs),
    };
  }
}

export function createPoseLatencyDiagnostics(
  options: PoseLatencyDiagnosticsOptions
): PoseLatencyDiagnostics {
  return new PoseLatencyDiagnostics(options);
}

export function isPoseLatencyDiagnosticsEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env[POSE_LATENCY_DIAGNOSTICS_ENV] === '1';
}

export function defaultNowMs(): number {
  const perf = globalThis.performance;
  return perf && typeof perf.now === 'function' ? perf.now() : Date.now();
}

class RollingMetric {
  private readonly values: number[];
  private index = 0;
  private count = 0;

  constructor(size: number) {
    this.values = new Array(size);
  }

  push(value: number): void {
    if (!Number.isFinite(value) || value < 0) return;
    this.values[this.index] = value;
    this.index = (this.index + 1) % this.values.length;
    this.count = Math.min(this.count + 1, this.values.length);
  }

  snapshot(): MetricSnapshot {
    if (this.count === 0) {
      return {
        count: 0,
        p50: null,
        p90: null,
        p95: null,
        p99: null,
        max: null,
      };
    }
    const sorted = this.values.slice(0, this.count).sort((a, b) => a - b);
    return {
      count: this.count,
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      max: sorted[sorted.length - 1],
    };
  }
}

class RollingTimes {
  private readonly times: number[];
  private index = 0;
  private count = 0;

  constructor(size: number) {
    this.times = new Array(size);
  }

  push(value: number): void {
    if (!Number.isFinite(value)) return;
    this.times[this.index] = value;
    this.index = (this.index + 1) % this.times.length;
    this.count = Math.min(this.count + 1, this.times.length);
  }

  hz(nowMs: number, windowMs = 1000): number {
    if (this.count <= 1) return 0;
    let hits = 0;
    for (let i = 0; i < this.count; i++) {
      if (nowMs - this.times[i] <= windowMs) hits++;
    }
    return hits > 1 ? (hits - 1) / (windowMs / 1000) : 0;
  }
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[idx];
}
