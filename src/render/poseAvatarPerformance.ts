import type {
  PoseAvatarActiveDomain,
  PoseAvatarFrameSource,
  PoseAvatarMeasurementState,
  PoseAvatarRendererMode,
  PoseAvatarTrackingQuality,
} from './poseAvatarTypes';

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
  lineCount: number;
  measurementState: PoseAvatarMeasurementState | 'default';
  activeDomain: PoseAvatarActiveDomain | null;
  trackingQuality: PoseAvatarTrackingQuality;
  skippedLandmarks: number;
  updateFps: number;
  frameAgeMs: number | null;
  inferenceMs?: number | null;
  lowLatencyMode: boolean;
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
      `state=${snapshot.measurementState} domain=${snapshot.activeDomain ?? 'none'} ` +
      `quality=${snapshot.trackingQuality} lines=${snapshot.lineCount} ` +
      `updateFps=${snapshot.updateFps.toFixed(0)} ` +
      `inference=${snapshot.inferenceMs === null || snapshot.inferenceMs === undefined ? 'n/a' : `${snapshot.inferenceMs.toFixed(1)}ms`} ` +
      `frameAge=${snapshot.frameAgeMs === null ? 'n/a' : `${snapshot.frameAgeMs.toFixed(0)}ms`} ` +
      `skipped=${snapshot.skippedLandmarks}`
  );
}
