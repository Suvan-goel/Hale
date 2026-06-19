/**
 * Movement-specific camera readiness.
 *
 * Generic preflight answers "is a stable, well-framed human present?". This
 * layer answers the movement contract: front vs side view, required reliable
 * side chains, and a short stable dwell before measurement may start.
 */

import type { VoiceCueKey } from '../audio/cues';
import type { CameraViewSpec } from '../movements/types';
import type { PipelineFrameOutput } from '../pose/pipeline';
import { LM, PoseFrame } from '../pose/types';

export type DetectedCameraView = 'front' | 'side' | 'ambiguous';

export type MovementCameraReadinessReason =
  | 'ready'
  | 'invalid-pose'
  | 'turn-side-on'
  | 'face-camera'
  | 'ambiguous-view'
  | 'insufficient-reliable-chains'
  | 'hold-still';

export interface MovementCameraReadinessConfig {
  stableMs: number;
}

export const DEFAULT_MOVEMENT_CAMERA_READINESS_CONFIG: MovementCameraReadinessConfig = {
  stableMs: 500,
};

export interface MovementCameraReadinessResult {
  ready: boolean;
  requiredView: CameraViewSpec['view'];
  detectedView: DetectedCameraView;
  requiredReliableSideChains: CameraViewSpec['requiredReliableSideChains'];
  reliableSideChains: number;
  stableForMs: number;
  reason: MovementCameraReadinessReason;
  promptCue: VoiceCueKey;
  setupCaption: string | null;
}

const CORE_VIEW_LANDMARKS: readonly LM[] = [
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
];

export class MovementCameraReadinessTracker {
  private readonly config: MovementCameraReadinessConfig;
  private readonly status: MovementCameraReadinessResult = {
    ready: false,
    requiredView: 'side',
    detectedView: 'ambiguous',
    requiredReliableSideChains: 1,
    reliableSideChains: 0,
    stableForMs: 0,
    reason: 'invalid-pose',
    promptCue: 'step-into-frame',
    setupCaption: 'Make sure your whole body is visible.',
  };

  private stableSinceMs = -1;

  constructor(config: MovementCameraReadinessConfig = DEFAULT_MOVEMENT_CAMERA_READINESS_CONFIG) {
    this.config = config;
  }

  update(out: PipelineFrameOutput, spec: CameraViewSpec): MovementCameraReadinessResult {
    const status = this.status;
    const ts = out.frame.timestampMs;
    const poseUsable =
      out.state === 'tracking' && out.frame.hasPose && out.validity.valid && coreViewGeometryUsable(out.frame);
    const detectedView = poseUsable ? detectCameraView(out.frame) : 'ambiguous';
    const viewMatches =
      spec.view === 'not_required' ||
      spec.view === 'side_oblique' ||
      detectedView === spec.view;
    const reliableEnough = out.reliableSideChains >= spec.requiredReliableSideChains;
    const baseReady =
      poseUsable &&
      detectedView !== 'ambiguous' &&
      viewMatches &&
      reliableEnough;

    if (baseReady) {
      if (this.stableSinceMs < 0) this.stableSinceMs = ts;
      status.stableForMs = Math.max(0, ts - this.stableSinceMs);
    } else {
      this.stableSinceMs = -1;
      status.stableForMs = 0;
    }

    status.requiredView = spec.view;
    status.detectedView = detectedView;
    status.requiredReliableSideChains = spec.requiredReliableSideChains;
    status.reliableSideChains = out.reliableSideChains;
    status.ready = baseReady && status.stableForMs >= this.config.stableMs;
    status.reason = readinessReason(poseUsable, detectedView, spec, reliableEnough, status.ready);
    status.promptCue = movementCameraPromptCue(status.reason, spec.view);
    status.setupCaption = movementCameraCaption(status.reason, spec.view);
    return status;
  }

  reset(): void {
    this.stableSinceMs = -1;
    this.status.ready = false;
    this.status.detectedView = 'ambiguous';
    this.status.stableForMs = 0;
    this.status.reason = 'invalid-pose';
    this.status.promptCue = 'step-into-frame';
    this.status.setupCaption = 'Make sure your whole body is visible.';
  }

  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    if (this.stableSinceMs >= 0) this.stableSinceMs += deltaMs;
  }
}

export function detectCameraView(frame: PoseFrame): DetectedCameraView {
  if (!frame.hasPose || !coreViewLandmarksFinite(frame)) return 'ambiguous';

  const shoulderWidth = Math.abs(frame.xs[LM.LEFT_SHOULDER] - frame.xs[LM.RIGHT_SHOULDER]);
  const hipWidth = Math.abs(frame.xs[LM.LEFT_HIP] - frame.xs[LM.RIGHT_HIP]);
  const shoulderMidX = (frame.xs[LM.LEFT_SHOULDER] + frame.xs[LM.RIGHT_SHOULDER]) * 0.5;
  const shoulderMidY = (frame.ys[LM.LEFT_SHOULDER] + frame.ys[LM.RIGHT_SHOULDER]) * 0.5;
  const hipMidX = (frame.xs[LM.LEFT_HIP] + frame.xs[LM.RIGHT_HIP]) * 0.5;
  const hipMidY = (frame.ys[LM.LEFT_HIP] + frame.ys[LM.RIGHT_HIP]) * 0.5;
  const torsoLen = Math.hypot(shoulderMidX - hipMidX, shoulderMidY - hipMidY);
  if (!Number.isFinite(torsoLen) || torsoLen < 0.05) return 'ambiguous';

  const shoulderRatio = shoulderWidth / torsoLen;
  const hipRatio = hipWidth / torsoLen;
  if (shoulderRatio >= 0.38 && hipRatio >= 0.22) return 'front';
  if (shoulderRatio <= 0.22 && hipRatio <= 0.18) return 'side';
  return 'ambiguous';
}

function readinessReason(
  poseUsable: boolean,
  detectedView: DetectedCameraView,
  spec: CameraViewSpec,
  reliableEnough: boolean,
  ready: boolean
): MovementCameraReadinessReason {
  if (ready) return 'ready';
  if (!poseUsable) return 'invalid-pose';
  if (spec.view === 'side' && detectedView === 'front') return 'turn-side-on';
  if (spec.view === 'front' && detectedView === 'side') return 'face-camera';
  if (detectedView === 'ambiguous') return 'ambiguous-view';
  if (!reliableEnough) return 'insufficient-reliable-chains';
  return 'hold-still';
}

function movementCameraPromptCue(
  reason: MovementCameraReadinessReason,
  requiredView: CameraViewSpec['view']
): VoiceCueKey {
  switch (reason) {
    case 'turn-side-on':
      return 'turn-side-on';
    case 'face-camera':
      return 'face-forward';
    case 'ambiguous-view':
      if (requiredView === 'front') return 'face-forward';
      if (requiredView === 'side' || requiredView === 'side_oblique') return 'turn-side-on';
      return 'step-into-frame';
    case 'hold-still':
    case 'ready':
      return 'hold-still';
    case 'insufficient-reliable-chains':
    case 'invalid-pose':
    default:
      return 'step-into-frame';
  }
}

function movementCameraCaption(
  reason: MovementCameraReadinessReason,
  requiredView: CameraViewSpec['view']
): string | null {
  switch (reason) {
    case 'ready':
      return null;
    case 'turn-side-on':
      return 'Turn so your side faces the camera.';
    case 'face-camera':
      return 'Turn to face the camera.';
    case 'ambiguous-view':
      if (requiredView === 'front') return 'Turn a little more to face the camera.';
      if (requiredView === 'side' || requiredView === 'side_oblique') {
        return 'Turn a little more so your side faces the camera.';
      }
      return 'Make sure your whole body is visible.';
    case 'hold-still':
      return 'Hold that position for a moment.';
    case 'insufficient-reliable-chains':
    case 'invalid-pose':
    default:
      return 'Make sure your whole body is visible.';
  }
}

function coreViewLandmarksFinite(frame: PoseFrame): boolean {
  for (let i = 0; i < CORE_VIEW_LANDMARKS.length; i++) {
    const lm = CORE_VIEW_LANDMARKS[i];
    if (!Number.isFinite(frame.xs[lm]) || !Number.isFinite(frame.ys[lm])) return false;
  }
  return true;
}

function coreViewGeometryUsable(frame: PoseFrame): boolean {
  if (!coreViewLandmarksFinite(frame)) return false;
  const shoulderMidX = (frame.xs[LM.LEFT_SHOULDER] + frame.xs[LM.RIGHT_SHOULDER]) * 0.5;
  const shoulderMidY = (frame.ys[LM.LEFT_SHOULDER] + frame.ys[LM.RIGHT_SHOULDER]) * 0.5;
  const hipMidX = (frame.xs[LM.LEFT_HIP] + frame.xs[LM.RIGHT_HIP]) * 0.5;
  const hipMidY = (frame.ys[LM.LEFT_HIP] + frame.ys[LM.RIGHT_HIP]) * 0.5;
  const torsoLen = Math.hypot(shoulderMidX - hipMidX, shoulderMidY - hipMidY);
  return Number.isFinite(torsoLen) && torsoLen >= 0.05;
}
