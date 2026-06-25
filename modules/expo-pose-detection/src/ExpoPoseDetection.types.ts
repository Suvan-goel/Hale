import type { StyleProp, ViewStyle } from 'react-native';

/** MediaPipe PoseLandmarker emits 33 landmarks per pose. */
export const LANDMARK_COUNT = 33;

/** Each landmark is flattened as [x, y, z, visibility, presence]. */
export const LANDMARK_STRIDE = 5;

export type CameraFacing = 'front' | 'back';
export type AndroidNavigationMode = 'button' | 'gesture' | 'unknown';

export type ModelVariant = 'lite' | 'full';

export type AndroidPosePipelineMode = 'full-video-sync' | 'full-live-stream';

export type AndroidPoseRotationMode = 'rotated-bitmap' | 'metadata';

export type AndroidPoseAnalysisResolution = '640x480' | '512x384' | '480x360';

export type PoseLatencyNativeClock = 'android.elapsedRealtimeNanos' | 'ios.CACurrentMediaTime';

export type NativeBenchmarkOverlayMode =
  | 'off'
  | 'constellation-v2-900'
  | 'constellation-v2-600';

export type AndroidSensorTimestampSourceName =
  | 'REALTIME'
  | 'UNKNOWN'
  | 'UNAVAILABLE'
  | 'UNRECOGNISED';

export type PoseLatencyNativeDiagnostics = {
  frameId: number;
  nativeClock: PoseLatencyNativeClock;
  sourceTimestampMs: number;
  preprocessingStartMs: number;
  preprocessingEndMs: number;
  mediapipeSubmitMs: number;
  mediapipeCallbackMs: number;
  nativePostprocessEndMs: number;
  nativeEventEmitMs: number;
  sourceAgeAtMediapipeSubmitMs?: number;
  sourceAgeAtMediapipeCallbackMs?: number;
  sourceAgeAtNativeEventEmitMs?: number;
  imageProxyToBitmapMs?: number;
  explicitRotationMs?: number;
  mpImageBuildMs?: number;
  resultFlattenMs?: number;
  eventPayloadBuildMs?: number;
  modelAsset?: string;
  requestedDelegate?: string;
  selectedDelegate?: string;
  gpuDelegateFallback?: boolean;
  gpuDelegateFailureMessage?: string | null;
  runningMode?: string;
  pipelineMode?: AndroidPosePipelineMode | string;
  rotationMode?: AndroidPoseRotationMode | string;
  analysisTargetWidth?: number;
  analysisTargetHeight?: number;
  imageProxyWidth?: number;
  imageProxyHeight?: number;
  imageProxyFormat?: number;
  imageProxyFormatName?: string;
  imageProxyRotationDegrees?: number;
  imageProcessingRotationDegrees?: number;
  emittedSourceWidth?: number;
  emittedSourceHeight?: number;
  landmarkRotationDegrees?: number;
  cameraTargetRotation?: number;
  cameraFacing?: CameraFacing | string;
  mirrorState?: boolean;
  cameraId?: string | null;
  sensorTimestampSourceRaw?: number | null;
  sensorTimestampSourceName?: AndroidSensorTimestampSourceName;
  sensorTimestampComparableToElapsedRealtime?: boolean;
  mpImageWidth?: number;
  mpImageHeight?: number;
  numPoses?: number;
  outputSegmentationMasks?: boolean;
  cameraInputFps?: number;
  acceptedFrameFps?: number;
  submittedInferenceFps?: number;
  resultFps?: number;
  busyFrameDropCount?: number;
  nativeEventScheduledCount?: number;
  nativeEventCoalescedCount?: number;
  nativeEventRejectedCount?: number;
  nativeEventEmittedCount?: number;
  nativeRenderer?: PoseLatencyNativeRendererDiagnostics;
};

export type PoseLatencyMetricSnapshot = {
  count: number;
  p50: number | null;
  p90: number | null;
  p95: number | null;
  p99: number | null;
  max: number | null;
};

export type PoseLatencyNativeRendererDiagnostics = {
  backend: string;
  mode: NativeBenchmarkOverlayMode | string;
  requestedPointCount: number;
  actualPointCount: number;
  topologyBuildCount: number;
  topologyBuildMs: number;
  calibrationState: 'neutral' | 'collecting' | 'locked' | string;
  virtualRegionCount: number;
  drawBatchCount: number;
  pointBufferBytes: number;
  transformMs: PoseLatencyMetricSnapshot;
  drawMs: PoseLatencyMetricSnapshot;
  sourceAgeAtDrawStartMs: PoseLatencyMetricSnapshot;
  sourceAgeAtDrawEndMs: PoseLatencyMetricSnapshot;
  framesRequested: number;
  framesDrawn: number;
  framesCoalesced: number;
  framesRejected: number;
  latestFrameIdDrawn: number | null;
  publishedHz: number;
  droppedInvalidPointCount: number;
  nonFiniteGeometryCount: number;
  lastVisiblePointCount: number;
  emeraldPointCount: number;
};

/**
 * One event per camera frame, ~30fps.
 *
 * `landmarks` is a flat array of LANDMARK_COUNT * LANDMARK_STRIDE numbers
 * ([x, y, z, visibility, presence] per landmark), or an EMPTY array when no
 * pose was detected in the frame. x/y are normalized [0..1] in upright
 * portrait image space, unmirrored (mirroring for front camera is the
 * renderer's job). Timestamps are monotonic milliseconds from the camera
 * clock — comparable within a session, not across sessions.
 */
export type LandmarksEventPayload = {
  timestampMs: number;
  landmarks: number[];
  inferenceMs: number;
  sourceWidth: number;
  sourceHeight: number;
  latency?: PoseLatencyNativeDiagnostics;
};

export type PoseErrorEventPayload = {
  message: string;
};

export type PermissionResponse = {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
};

export type PoseDetectionViewProps = {
  /** Camera + inference run only while true. */
  active?: boolean;
  /** Default 'front' — the user props the phone facing themselves. */
  cameraFacing?: CameraFacing;
  /** Default 'full' — Hale's production assessment model. */
  modelVariant?: ModelVariant;
  /** Default 0.35 — the 0.5 MediaPipe default misses side-on poses. */
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  minPresenceConfidence?: number;
  latencyDiagnosticsEnabled?: boolean;
  androidPipelineMode?: AndroidPosePipelineMode;
  androidRotationMode?: AndroidPoseRotationMode;
  androidAnalysisResolution?: AndroidPoseAnalysisResolution;
  nativeSkeletonOverlayEnabled?: boolean;
  nativeSkeletonColor?: string;
  nativeBenchmarkOverlayMode?: NativeBenchmarkOverlayMode;
  nativeBenchmarkOverlayResetKey?: number;
  canvasColor?: string;
  onLandmarks?: (event: { nativeEvent: LandmarksEventPayload }) => void;
  onCameraReady?: (event: { nativeEvent: object }) => void;
  onPoseError?: (event: { nativeEvent: PoseErrorEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
