import Constants from 'expo-constants';

import type { LandmarksEventPayload } from '../../modules/expo-pose-detection';

export const POSE_LATENCY_DIAGNOSTICS_ENV = 'EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS';
export const POSE_LATENCY_DIAGNOSTICS_RELEASE_ENV =
  'EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE';

type PoseLatencyDiagnosticsEnv = Partial<
  Record<
    typeof POSE_LATENCY_DIAGNOSTICS_ENV | typeof POSE_LATENCY_DIAGNOSTICS_RELEASE_ENV,
    string
  >
>;

type PoseLatencyDiagnosticsExpoConfig = {
  extra?: {
    enablePoseLatencyDiagnostics?: unknown;
    allowDiagnosticsInRelease?: unknown;
  };
};

export interface PoseLatencyDiagnosticsGateDetails {
  dev: boolean;
  envFlag: string | undefined;
  configFlag: boolean;
  allowReleaseEnvFlag: string | undefined;
  allowReleaseConfigFlag: boolean;
  releaseAllowed: boolean;
  enabled: boolean;
}

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

export interface PoseNativeRuntimeSnapshot {
  modelAsset: string | null;
  requestedDelegate: string | null;
  selectedDelegate: string | null;
  gpuDelegateFallback: boolean | null;
  gpuDelegateFailureMessage: string | null;
  runningMode: string | null;
  pipelineMode: string | null;
  rotationMode: string | null;
  analysisTargetWidth: number | null;
  analysisTargetHeight: number | null;
  imageProxyWidth: number | null;
  imageProxyHeight: number | null;
  imageProxyFormat: number | null;
  imageProxyFormatName: string | null;
  imageProxyRotationDegrees: number | null;
  cameraTargetRotation: number | null;
  mpImageWidth: number | null;
  mpImageHeight: number | null;
  numPoses: number | null;
  outputSegmentationMasks: boolean | null;
  cameraInputFps: number | null;
  acceptedFrameFps: number | null;
  submittedInferenceFps: number | null;
  resultFps: number | null;
  busyFrameDropCount: number | null;
  nativeEventScheduledCount: number | null;
  nativeEventCoalescedCount: number | null;
  nativeEventRejectedCount: number | null;
  nativeEventEmittedCount: number | null;
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
  nativeBitmapConversionMs: MetricSnapshot;
  nativeExplicitRotationMs: MetricSnapshot;
  nativeMpImageBuildMs: MetricSnapshot;
  nativeResultFlattenMs: MetricSnapshot;
  nativeEventPayloadBuildMs: MetricSnapshot;
  nativeSourceAgeAtMediapipeSubmitMs: MetricSnapshot;
  nativeSourceAgeAtMediapipeCallbackMs: MetricSnapshot;
  nativeSourceAgeAtEmitMs: MetricSnapshot;
  nativeRuntime: PoseNativeRuntimeSnapshot | null;
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
  private readonly nativeBitmapConversionMs: RollingMetric;
  private readonly nativeExplicitRotationMs: RollingMetric;
  private readonly nativeMpImageBuildMs: RollingMetric;
  private readonly nativeResultFlattenMs: RollingMetric;
  private readonly nativeEventPayloadBuildMs: RollingMetric;
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
  private nativeRuntime: PoseNativeRuntimeSnapshot | null = null;

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
    this.nativeBitmapConversionMs = new RollingMetric(windowSize);
    this.nativeExplicitRotationMs = new RollingMetric(windowSize);
    this.nativeMpImageBuildMs = new RollingMetric(windowSize);
    this.nativeResultFlattenMs = new RollingMetric(windowSize);
    this.nativeEventPayloadBuildMs = new RollingMetric(windowSize);
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
      pushOptionalMetric(this.nativeBitmapConversionMs, native.imageProxyToBitmapMs);
      pushOptionalMetric(this.nativeExplicitRotationMs, native.explicitRotationMs);
      pushOptionalMetric(this.nativeMpImageBuildMs, native.mpImageBuildMs);
      pushOptionalMetric(this.nativeResultFlattenMs, native.resultFlattenMs);
      pushOptionalMetric(this.nativeEventPayloadBuildMs, native.eventPayloadBuildMs);
      const runtime = nativeRuntimeSnapshot(native);
      if (runtime) this.nativeRuntime = runtime;
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
      nativeBitmapConversionMs: this.nativeBitmapConversionMs.snapshot(),
      nativeExplicitRotationMs: this.nativeExplicitRotationMs.snapshot(),
      nativeMpImageBuildMs: this.nativeMpImageBuildMs.snapshot(),
      nativeResultFlattenMs: this.nativeResultFlattenMs.snapshot(),
      nativeEventPayloadBuildMs: this.nativeEventPayloadBuildMs.snapshot(),
      nativeSourceAgeAtMediapipeSubmitMs: this.nativeSourceAgeAtMediapipeSubmitMs.snapshot(),
      nativeSourceAgeAtMediapipeCallbackMs: this.nativeSourceAgeAtMediapipeCallbackMs.snapshot(),
      nativeSourceAgeAtEmitMs: this.nativeSourceAgeAtEmitMs.snapshot(),
      nativeRuntime: this.nativeRuntime,
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

export function getPoseLatencyDiagnosticsGateDetails(
  env: PoseLatencyDiagnosticsEnv = getInlinePoseLatencyDiagnosticsEnv(),
  expoConfig: PoseLatencyDiagnosticsExpoConfig | null | undefined = Constants.expoConfig,
  dev = defaultDevMode()
): PoseLatencyDiagnosticsGateDetails {
  const envFlag = env[POSE_LATENCY_DIAGNOSTICS_ENV];
  const allowReleaseEnvFlag = env[POSE_LATENCY_DIAGNOSTICS_RELEASE_ENV];
  const configFlag = expoConfig?.extra?.enablePoseLatencyDiagnostics === true;
  const allowReleaseConfigFlag = expoConfig?.extra?.allowDiagnosticsInRelease === true;
  const releaseAllowed = dev || allowReleaseEnvFlag === '1' || allowReleaseConfigFlag;
  const enabled = (envFlag === '1' || configFlag) && releaseAllowed;

  return {
    dev,
    envFlag,
    configFlag,
    allowReleaseEnvFlag,
    allowReleaseConfigFlag,
    releaseAllowed,
    enabled,
  };
}

export function isPoseLatencyDiagnosticsEnabled(
  env: PoseLatencyDiagnosticsEnv = getInlinePoseLatencyDiagnosticsEnv(),
  expoConfig: PoseLatencyDiagnosticsExpoConfig | null | undefined = Constants.expoConfig,
  dev = defaultDevMode()
): boolean {
  return getPoseLatencyDiagnosticsGateDetails(env, expoConfig, dev).enabled;
}

export function defaultNowMs(): number {
  const perf = globalThis.performance;
  return perf && typeof perf.now === 'function' ? perf.now() : Date.now();
}

function pushOptionalMetric(metric: RollingMetric, value: number | undefined): void {
  if (typeof value === 'number') metric.push(value);
}

function nativeRuntimeSnapshot(
  native: LandmarksEventPayload['latency']
): PoseNativeRuntimeSnapshot | null {
  if (!native) return null;
  const hasRuntimeFields =
    native.modelAsset !== undefined ||
    native.requestedDelegate !== undefined ||
    native.selectedDelegate !== undefined ||
    native.gpuDelegateFallback !== undefined ||
    native.runningMode !== undefined ||
    native.pipelineMode !== undefined ||
    native.rotationMode !== undefined ||
    native.analysisTargetWidth !== undefined ||
    native.imageProxyWidth !== undefined ||
    native.cameraInputFps !== undefined ||
    native.nativeEventScheduledCount !== undefined;
  if (!hasRuntimeFields) return null;
  return {
    modelAsset: native?.modelAsset ?? null,
    requestedDelegate: native?.requestedDelegate ?? null,
    selectedDelegate: native?.selectedDelegate ?? null,
    gpuDelegateFallback:
      typeof native?.gpuDelegateFallback === 'boolean' ? native.gpuDelegateFallback : null,
    gpuDelegateFailureMessage: native?.gpuDelegateFailureMessage ?? null,
    runningMode: native?.runningMode ?? null,
    pipelineMode: native?.pipelineMode ?? null,
    rotationMode: native?.rotationMode ?? null,
    analysisTargetWidth: finiteOrNull(native?.analysisTargetWidth),
    analysisTargetHeight: finiteOrNull(native?.analysisTargetHeight),
    imageProxyWidth: finiteOrNull(native?.imageProxyWidth),
    imageProxyHeight: finiteOrNull(native?.imageProxyHeight),
    imageProxyFormat: finiteOrNull(native?.imageProxyFormat),
    imageProxyFormatName: native?.imageProxyFormatName ?? null,
    imageProxyRotationDegrees: finiteOrNull(native?.imageProxyRotationDegrees),
    cameraTargetRotation: finiteOrNull(native?.cameraTargetRotation),
    mpImageWidth: finiteOrNull(native?.mpImageWidth),
    mpImageHeight: finiteOrNull(native?.mpImageHeight),
    numPoses: finiteOrNull(native?.numPoses),
    outputSegmentationMasks:
      typeof native?.outputSegmentationMasks === 'boolean' ? native.outputSegmentationMasks : null,
    cameraInputFps: finiteOrNull(native?.cameraInputFps),
    acceptedFrameFps: finiteOrNull(native?.acceptedFrameFps),
    submittedInferenceFps: finiteOrNull(native?.submittedInferenceFps),
    resultFps: finiteOrNull(native?.resultFps),
    busyFrameDropCount: finiteOrNull(native?.busyFrameDropCount),
    nativeEventScheduledCount: finiteOrNull(native?.nativeEventScheduledCount),
    nativeEventCoalescedCount: finiteOrNull(native?.nativeEventCoalescedCount),
    nativeEventRejectedCount: finiteOrNull(native?.nativeEventRejectedCount),
    nativeEventEmittedCount: finiteOrNull(native?.nativeEventEmittedCount),
  };
}

function finiteOrNull(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getInlinePoseLatencyDiagnosticsEnv(): PoseLatencyDiagnosticsEnv {
  return {
    [POSE_LATENCY_DIAGNOSTICS_ENV]:
      process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS,
    [POSE_LATENCY_DIAGNOSTICS_RELEASE_ENV]:
      process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE,
  };
}

function defaultDevMode(): boolean {
  return typeof __DEV__ === 'boolean' && __DEV__;
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
