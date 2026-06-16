import { LANDMARK_COUNT } from '../pose/types';
import {
  copyScreenPoseLandmarks,
  createScreenPoseLandmarks,
  ScreenPoseLandmarks,
} from './poseCoordinateMapper';

export interface PoseSmoothingOptions {
  /** 0..1. Higher follows the current frame faster; lower is steadier. */
  alpha?: number;
  adaptive?: boolean;
  minAlpha?: number;
  maxAlpha?: number;
  slowSpeedPxPerSec?: number;
  fastSpeedPxPerSec?: number;
  snapFrames?: number;
  /** Timestamp gap that resets smoothing instead of blending stale positions. */
  resetAfterMs?: number;
}

export interface PoseSmoothingState {
  previous: ScreenPoseLandmarks;
  initialized: boolean;
  lastTimestampMs: number;
  snapFramesRemaining: number;
}

export interface PoseSmoothingResult {
  reset: boolean;
  alpha: number;
  movementSpeedPxPerSec: number;
  snapped: boolean;
}

const DEFAULT_ALPHA = 0.78;
const DEFAULT_MIN_ALPHA = 0.58;
const DEFAULT_MAX_ALPHA = 0.9;
const DEFAULT_SLOW_SPEED = 90;
const DEFAULT_FAST_SPEED = 650;
const DEFAULT_SNAP_FRAMES = 2;
const DEFAULT_RESET_AFTER_MS = 500;

export function createPoseSmoothingState(): PoseSmoothingState {
  return {
    previous: createScreenPoseLandmarks(),
    initialized: false,
    lastTimestampMs: -1,
    snapFramesRemaining: 0,
  };
}

export function resetPoseSmoothing(state: PoseSmoothingState): void {
  state.initialized = false;
  state.lastTimestampMs = -1;
  state.snapFramesRemaining = 0;
  state.previous.hasPose = false;
}

export function smoothPoseLandmarks(
  state: PoseSmoothingState,
  current: ScreenPoseLandmarks,
  out: ScreenPoseLandmarks,
  options: PoseSmoothingOptions = {}
): PoseSmoothingResult {
  const alpha = clamp01(options.alpha ?? DEFAULT_ALPHA);
  const adaptive = options.adaptive ?? true;
  const minAlpha = clamp01(options.minAlpha ?? DEFAULT_MIN_ALPHA);
  const maxAlpha = clamp01(options.maxAlpha ?? DEFAULT_MAX_ALPHA);
  const slowSpeed = Math.max(1, options.slowSpeedPxPerSec ?? DEFAULT_SLOW_SPEED);
  const fastSpeed = Math.max(slowSpeed + 1, options.fastSpeedPxPerSec ?? DEFAULT_FAST_SPEED);
  const snapFrames = Math.max(0, Math.round(options.snapFrames ?? DEFAULT_SNAP_FRAMES));
  const resetAfterMs = options.resetAfterMs ?? DEFAULT_RESET_AFTER_MS;

  if (!current.hasPose) {
    out.timestampMs = current.timestampMs;
    out.hasPose = false;
    resetPoseSmoothing(state);
    return { reset: true, alpha: 1, movementSpeedPxPerSec: 0, snapped: true };
  }

  const gapMs =
    state.lastTimestampMs >= 0 ? current.timestampMs - state.lastTimestampMs : 0;
  const shouldReset =
    !state.initialized || gapMs < 0 || (resetAfterMs > 0 && gapMs > resetAfterMs);
  if (shouldReset) {
    state.snapFramesRemaining = snapFrames;
  }

  out.timestampMs = current.timestampMs;
  out.hasPose = true;

  const movementSpeedPxPerSec =
    shouldReset || gapMs <= 0
      ? 0
      : estimateMovementSpeedPxPerSec(state.previous, current, gapMs);
  const adaptiveAlpha = adaptive
    ? interpolateAlpha(movementSpeedPxPerSec, slowSpeed, fastSpeed, minAlpha, maxAlpha)
    : alpha;
  const effectiveAlpha = shouldReset || state.snapFramesRemaining > 0 ? 1 : adaptiveAlpha;
  const snapped = shouldReset || state.snapFramesRemaining > 0;

  if (effectiveAlpha >= 0.999) {
    copyScreenPoseLandmarks(current, out);
  } else {
    const prev = state.previous;
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      out.xs[i] = effectiveAlpha * current.xs[i] + (1 - effectiveAlpha) * prev.xs[i];
      out.ys[i] = effectiveAlpha * current.ys[i] + (1 - effectiveAlpha) * prev.ys[i];
      out.visibility[i] = current.visibility[i];
      out.presence[i] = current.presence[i];
    }
  }

  copyScreenPoseLandmarks(out, state.previous);
  state.initialized = true;
  state.lastTimestampMs = current.timestampMs;
  if (state.snapFramesRemaining > 0) state.snapFramesRemaining--;
  return {
    reset: shouldReset,
    alpha: effectiveAlpha,
    movementSpeedPxPerSec,
    snapped,
  };
}

function estimateMovementSpeedPxPerSec(
  previous: ScreenPoseLandmarks,
  current: ScreenPoseLandmarks,
  gapMs: number
): number {
  const dtSec = gapMs / 1000;
  let maxDist = 0;
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const dx = current.xs[i] - previous.xs[i];
    const dy = current.ys[i] - previous.ys[i];
    const dist = Math.hypot(dx, dy);
    if (dist > maxDist) maxDist = dist;
  }
  return maxDist / dtSec;
}

function interpolateAlpha(
  speed: number,
  slowSpeed: number,
  fastSpeed: number,
  minAlpha: number,
  maxAlpha: number
): number {
  if (speed <= slowSpeed) return minAlpha;
  if (speed >= fastSpeed) return maxAlpha;
  const t = (speed - slowSpeed) / (fastSpeed - slowSpeed);
  return minAlpha + (maxAlpha - minAlpha) * t;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
