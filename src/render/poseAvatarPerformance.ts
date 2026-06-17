import type {
  PoseAvatarActiveDomain,
  PoseAvatarFrameSource,
  PoseAvatarMeasurementState,
  PoseAvatarMeasurementStateIntensity,
  PoseAvatarRendererMode,
  PoseAvatarTrackingQuality,
} from './poseAvatarTypes';
import type { PointCloudBodyDensity } from './pointCloudBodyGeometry';
import type {
  ConfidenceAnimationStrength,
  PoseVisualTrackingState,
} from './confidenceVisuals';

export interface PoseAvatarPerformanceState {
  lastLogTimestampMs: number;
  lastUpdateWallMs: number;
  updateFps: number;
  clockOffsetMs: number | null;
}

export interface PoseAvatarPerformanceSnapshot {
  timestampMs: number;
  mode: PoseAvatarRendererMode;
  frameSource: PoseAvatarFrameSource;
  dotCount: number;
  lineCount: number;
  geometryMs: number;
  smoothingEnabled: boolean;
  smoothingAlpha: number;
  smoothingAlphaRange: readonly [number, number];
  adaptiveSmoothingEnabled: boolean;
  movementSpeedPxPerSec: number;
  sampledDotsEnabled: boolean;
  bodyVolumeEnabled: boolean;
  torsoDotCount: number;
  headDotCount: number;
  volumeDotCount: number;
  bodyStyle?: 'classic' | 'constellation' | 'point_cloud_body';
  pointCloudBodyDensity?: PointCloudBodyDensity;
  pointCloudBodyMaxDots?: number;
  pointCloudBodyShowConnections?: boolean;
  pointCloudBodyShowSkeletonLines?: boolean;
  pointCloudBodyShowKeypoints?: boolean;
  pointCloudBodyDotScale?: number;
  pointCloudBodyOpacity?: number;
  upperArmDotCount?: number;
  forearmDotCount?: number;
  thighDotCount?: number;
  lowerLegDotCount?: number;
  handDotCount?: number;
  footDotCount?: number;
  keypointDotCount?: number;
  activeDotCount?: number;
  connectionLineCount?: number;
  skippedBodyPartCount?: number;
  lowLatencyMode: boolean;
  confidenceFadingEnabled: boolean;
  confidenceIntensityEnabled: boolean;
  reacquisitionFadeEnabled: boolean;
  recognitionPulseEnabled: boolean;
  confidenceAnimationStrength: ConfidenceAnimationStrength;
  measurementState: PoseAvatarMeasurementState | 'default';
  activeDomain: PoseAvatarActiveDomain | null;
  trackingQuality: PoseAvatarTrackingQuality;
  measurementStatesEnabled: boolean;
  setupGuidesEnabled: boolean;
  stateTransitionsEnabled: boolean;
  domainEmphasisEnabled: boolean;
  scanLineEnabled: boolean;
  measurementStateIntensity: PoseAvatarMeasurementStateIntensity;
  setupGuideVisible: boolean;
  scanLineVisible: boolean;
  visualCalculationMs: number;
  visualTrackingState: PoseVisualTrackingState;
  averageConfidence: number;
  recognitionPulseActive: boolean;
  skippedLandmarks: number;
  updateFps: number;
  frameAgeMs: number | null;
  inferenceMs?: number | null;
}

const LOG_INTERVAL_MS = 3000;

export function createPoseAvatarPerformanceState(): PoseAvatarPerformanceState {
  return {
    lastLogTimestampMs: -1,
    lastUpdateWallMs: -1,
    updateFps: 0,
    clockOffsetMs: null,
  };
}

export function markPoseAvatarUpdate(
  state: PoseAvatarPerformanceState,
  frameTimestampMs: number,
  wallNowMs: number
): { updateFps: number; frameAgeMs: number | null } {
  if (state.lastUpdateWallMs >= 0) {
    const dt = wallNowMs - state.lastUpdateWallMs;
    if (dt > 0) {
      const fps = 1000 / dt;
      state.updateFps = state.updateFps === 0 ? fps : state.updateFps * 0.85 + fps * 0.15;
    }
  }
  state.lastUpdateWallMs = wallNowMs;

  if (state.clockOffsetMs === null) {
    state.clockOffsetMs = wallNowMs - frameTimestampMs;
  }
  const frameAgeMs = wallNowMs - (frameTimestampMs + state.clockOffsetMs);
  return { updateFps: state.updateFps, frameAgeMs };
}

export function maybeLogPoseAvatarPerformance(
  state: PoseAvatarPerformanceState,
  snapshot: PoseAvatarPerformanceSnapshot,
  debug: boolean
): void {
  if (!__DEV__ || !debug) return;
  if (
    state.lastLogTimestampMs >= 0 &&
    snapshot.timestampMs - state.lastLogTimestampMs < LOG_INTERVAL_MS
  ) {
    return;
  }
  state.lastLogTimestampMs = snapshot.timestampMs;
  console.log(
    `[pose-avatar] mode=${snapshot.mode} source=${snapshot.frameSource} ` +
      `lowLatency=${snapshot.lowLatencyMode ? 'on' : 'off'} ` +
      `smoothing=${snapshot.smoothingEnabled ? 'on' : 'off'} ` +
      `adaptive=${snapshot.adaptiveSmoothingEnabled ? 'on' : 'off'} ` +
      `alpha=${snapshot.smoothingAlpha.toFixed(2)} ` +
      `range=${snapshot.smoothingAlphaRange[0].toFixed(2)}-${snapshot.smoothingAlphaRange[1].toFixed(2)} ` +
      `speed=${snapshot.movementSpeedPxPerSec.toFixed(0)}px/s ` +
      `samples=${snapshot.sampledDotsEnabled ? 'on' : 'off'} ` +
      `volume=${snapshot.bodyVolumeEnabled ? 'on' : 'off'} ` +
      (snapshot.bodyStyle
        ? `bodyStyle=${snapshot.bodyStyle} density=${snapshot.pointCloudBodyDensity ?? 'n/a'} ` +
          `bodyMax=${snapshot.pointCloudBodyMaxDots ?? 'n/a'} ` +
          `bodyConn=${snapshot.pointCloudBodyShowConnections ? 'on' : 'off'} ` +
          `bodySkeleton=${snapshot.pointCloudBodyShowSkeletonLines ? 'on' : 'off'} ` +
          `bodyKeys=${snapshot.pointCloudBodyShowKeypoints ? 'on' : 'off'} ` +
          `bodyDotScale=${(snapshot.pointCloudBodyDotScale ?? 1).toFixed(2)} ` +
          `bodyOpacity=${(snapshot.pointCloudBodyOpacity ?? 1).toFixed(2)} `
        : '') +
      `confFade=${snapshot.confidenceFadingEnabled ? 'on' : 'off'} ` +
      `confIntensity=${snapshot.confidenceIntensityEnabled ? 'on' : 'off'} ` +
      `reacqFade=${snapshot.reacquisitionFadeEnabled ? 'on' : 'off'} ` +
      `strength=${snapshot.confidenceAnimationStrength} ` +
      `state=${snapshot.measurementState} domain=${snapshot.activeDomain ?? 'none'} ` +
      `quality=${snapshot.trackingQuality} phase4=${snapshot.measurementStatesEnabled ? 'on' : 'off'} ` +
      `guides=${snapshot.setupGuidesEnabled ? 'on' : 'off'}/${snapshot.setupGuideVisible ? 'visible' : 'hidden'} ` +
      `transitions=${snapshot.stateTransitionsEnabled ? 'on' : 'off'} ` +
      `domainEmphasis=${snapshot.domainEmphasisEnabled ? 'on' : 'off'} ` +
      `scan=${snapshot.scanLineEnabled ? 'on' : 'off'}/${snapshot.scanLineVisible ? 'visible' : 'hidden'} ` +
      `stateIntensity=${snapshot.measurementStateIntensity} visual=${snapshot.visualCalculationMs.toFixed(1)}ms ` +
      `track=${snapshot.visualTrackingState} avgConf=${snapshot.averageConfidence.toFixed(2)} ` +
      `pulse=${snapshot.recognitionPulseActive ? 'on' : 'off'} ` +
      `torso=${snapshot.torsoDotCount} head=${snapshot.headDotCount} ` +
      (snapshot.upperArmDotCount !== undefined
        ? `upperArm=${snapshot.upperArmDotCount} forearm=${snapshot.forearmDotCount ?? 0} ` +
          `thigh=${snapshot.thighDotCount ?? 0} lowerLeg=${snapshot.lowerLegDotCount ?? 0} ` +
          `hand=${snapshot.handDotCount ?? 0} foot=${snapshot.footDotCount ?? 0} ` +
          `keys=${snapshot.keypointDotCount ?? 0} active=${snapshot.activeDotCount ?? 0} ` +
          `connections=${snapshot.connectionLineCount ?? 0} `
        : '') +
      `volumeDots=${snapshot.volumeDotCount} dots=${snapshot.dotCount} ` +
      `lines=${snapshot.lineCount} geometry=${snapshot.geometryMs.toFixed(1)}ms ` +
      `updateFps=${snapshot.updateFps.toFixed(0)} ` +
      `inference=${snapshot.inferenceMs === null || snapshot.inferenceMs === undefined ? 'n/a' : `${snapshot.inferenceMs.toFixed(1)}ms`} ` +
      `frameAge=${snapshot.frameAgeMs === null ? 'n/a' : `${snapshot.frameAgeMs.toFixed(0)}ms`} ` +
      `skipped=${snapshot.skippedLandmarks}` +
      (snapshot.skippedBodyPartCount !== undefined ? ` bodySkipped=${snapshot.skippedBodyPartCount}` : '')
  );
}
