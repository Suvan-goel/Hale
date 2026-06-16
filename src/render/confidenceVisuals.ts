import { LM } from '../pose/types';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export type ConfidenceBucket = 'high' | 'medium' | 'low' | 'very_low' | 'unknown';
export type ConfidenceAnimationStrength = 'off' | 'subtle' | 'medium';
export type PoseVisualTrackingState = 'tracking' | 'degraded' | 'lost' | 'reacquired';

export interface ConfidenceVisual {
  opacityMultiplier: number;
  radiusMultiplier: number;
  lineOpacityMultiplier: number;
  shouldRender: boolean;
  bucket: ConfidenceBucket;
}

export interface AvatarVisualState {
  previousHadPose: boolean;
  previousTrackingState: PoseVisualTrackingState;
  previousTimestampMs: number;
  opacity: number;
  seenEventIds: Set<string>;
  activePulseId: string | null;
  pulseStartedAtMs: number;
}

export interface AvatarVisualUpdate {
  trackingState: PoseVisualTrackingState;
  opacity: number;
  targetOpacity: number;
  pulseProgress: number;
  pulseActive: boolean;
}

export interface PoseAvatarRecognitionEvent {
  type: 'rep_completed' | 'hold_completed' | 'set_completed';
  id: string;
  timestampMs: number;
}

export function createAvatarVisualState(): AvatarVisualState {
  return {
    previousHadPose: false,
    previousTrackingState: 'lost',
    previousTimestampMs: -1,
    opacity: 0,
    seenEventIds: new Set<string>(),
    activePulseId: null,
    pulseStartedAtMs: -1,
  };
}

export function resetAvatarVisualState(state: AvatarVisualState): void {
  state.previousHadPose = false;
  state.previousTrackingState = 'lost';
  state.previousTimestampMs = -1;
  state.opacity = 0;
  state.activePulseId = null;
  state.pulseStartedAtMs = -1;
}

export function getLandmarkConfidence(landmark: unknown): number | undefined {
  if (landmark === undefined || landmark === null || typeof landmark !== 'object') return undefined;
  const record = landmark as Record<string, unknown>;
  for (const key of ['confidence', 'score', 'visibility', 'presence', 'probability']) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return clamp01(value);
    }
  }
  return undefined;
}

export function getScreenLandmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  if (!pose.hasPose) return 0;
  return Math.min(clamp01(pose.visibility[lm] ?? 1), clamp01(pose.presence[lm] ?? 1));
}

export function getBoneConfidence(pose: ScreenPoseLandmarks, a: LM, b: LM): number {
  return Math.min(getScreenLandmarkConfidence(pose, a), getScreenLandmarkConfidence(pose, b));
}

export function getPoseAverageConfidence(
  pose: ScreenPoseLandmarks,
  landmarks: readonly LM[]
): number {
  if (!pose.hasPose || landmarks.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < landmarks.length; i++) {
    sum += getScreenLandmarkConfidence(pose, landmarks[i]);
  }
  return sum / landmarks.length;
}

export function getConfidenceBucket(confidence: number | undefined): ConfidenceBucket {
  if (confidence === undefined || !Number.isFinite(confidence)) return 'unknown';
  if (confidence >= 0.65) return 'high';
  if (confidence >= 0.35) return 'medium';
  if (confidence >= 0.15) return 'low';
  return 'very_low';
}

export function getConfidenceVisual(
  confidence: number | undefined,
  strength: ConfidenceAnimationStrength = 'subtle'
): ConfidenceVisual {
  const bucket = getConfidenceBucket(confidence);
  if (strength === 'off' || bucket === 'unknown') {
    return {
      opacityMultiplier: 1,
      radiusMultiplier: 1,
      lineOpacityMultiplier: 1,
      shouldRender: true,
      bucket,
    };
  }
  const medium = strength === 'medium';
  switch (bucket) {
    case 'high':
      return { opacityMultiplier: 1, radiusMultiplier: 1, lineOpacityMultiplier: 1, shouldRender: true, bucket };
    case 'medium':
      return {
        opacityMultiplier: medium ? 0.68 : 0.78,
        radiusMultiplier: medium ? 0.94 : 0.97,
        lineOpacityMultiplier: medium ? 0.7 : 0.82,
        shouldRender: true,
        bucket,
      };
    case 'low':
      return {
        opacityMultiplier: medium ? 0.34 : 0.43,
        radiusMultiplier: medium ? 0.84 : 0.9,
        lineOpacityMultiplier: medium ? 0.32 : 0.42,
        shouldRender: true,
        bucket,
      };
    case 'very_low':
      return {
        opacityMultiplier: 0,
        radiusMultiplier: 0.8,
        lineOpacityMultiplier: 0,
        shouldRender: false,
        bucket,
      };
  }
}

export function computeFadeOpacity({
  previousOpacity,
  targetOpacity,
  deltaMs,
  fadeInMs,
  fadeOutMs,
}: {
  previousOpacity: number;
  targetOpacity: number;
  deltaMs: number;
  fadeInMs: number;
  fadeOutMs: number;
}): number {
  if (deltaMs <= 0) return previousOpacity;
  const duration = targetOpacity > previousOpacity ? fadeInMs : fadeOutMs;
  if (duration <= 0) return targetOpacity;
  const step = deltaMs / duration;
  if (targetOpacity > previousOpacity) return Math.min(targetOpacity, previousOpacity + step);
  return Math.max(targetOpacity, previousOpacity - step);
}

export function updateAvatarVisualState(
  state: AvatarVisualState,
  params: {
    hasPose: boolean;
    averageConfidence: number;
    timestampMs: number;
    enabled: boolean;
    reacquisitionFadeEnabled: boolean;
    recognitionPulseEnabled: boolean;
    recognitionEvent?: PoseAvatarRecognitionEvent | null;
  }
): AvatarVisualUpdate {
  const deltaMs =
    state.previousTimestampMs >= 0 ? Math.max(0, params.timestampMs - state.previousTimestampMs) : 0;
  let trackingState: PoseVisualTrackingState = 'lost';
  if (params.hasPose) {
    if (!state.previousHadPose) trackingState = 'reacquired';
    else trackingState = params.averageConfidence >= 0.5 ? 'tracking' : 'degraded';
  }

  const confidenceTarget = params.enabled
    ? getAvatarTargetOpacity(params.hasPose, params.averageConfidence)
    : params.hasPose
      ? 1
      : 0;
  const targetOpacity =
    trackingState === 'reacquired' && params.reacquisitionFadeEnabled
      ? confidenceTarget
      : confidenceTarget;
  const nextOpacity = params.enabled
    ? computeFadeOpacity({
        previousOpacity: state.previousHadPose ? state.opacity : 0,
        targetOpacity,
        deltaMs: deltaMs || 33,
        fadeInMs: params.reacquisitionFadeEnabled ? 190 : 0,
        fadeOutMs: 130,
      })
    : targetOpacity;

  maybeStartPulse(state, params);
  const pulseProgress = getPulseProgress(state, params.timestampMs);

  state.opacity = nextOpacity;
  state.previousHadPose = params.hasPose;
  state.previousTrackingState = trackingState;
  state.previousTimestampMs = params.timestampMs;

  return {
    trackingState,
    opacity: nextOpacity,
    targetOpacity,
    pulseProgress,
    pulseActive: pulseProgress > 0,
  };
}

export function maybeStartPulse(
  state: AvatarVisualState,
  params: {
    timestampMs: number;
    recognitionPulseEnabled: boolean;
    recognitionEvent?: PoseAvatarRecognitionEvent | null;
  }
): boolean {
  const event = params.recognitionEvent;
  if (!params.recognitionPulseEnabled || !event || state.seenEventIds.has(event.id)) return false;
  state.seenEventIds.add(event.id);
  state.activePulseId = event.id;
  state.pulseStartedAtMs = params.timestampMs;
  return true;
}

function getPulseProgress(state: AvatarVisualState, timestampMs: number): number {
  if (state.activePulseId === null || state.pulseStartedAtMs < 0) return 0;
  const elapsed = timestampMs - state.pulseStartedAtMs;
  if (elapsed < 0 || elapsed > 360) {
    state.activePulseId = null;
    state.pulseStartedAtMs = -1;
    return 0;
  }
  const t = elapsed / 360;
  return Math.sin(Math.PI * t) * 0.08;
}

function getAvatarTargetOpacity(hasPose: boolean, confidence: number): number {
  if (!hasPose) return 0;
  if (confidence >= 0.65) return 1;
  if (confidence >= 0.35) return 0.82;
  if (confidence >= 0.15) return 0.46;
  return 0;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
