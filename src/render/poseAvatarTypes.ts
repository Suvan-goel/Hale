import type { PipelineFrameOutput } from '../pose/pipeline';
import type { ConfidenceAnimationStrength, PoseAvatarRecognitionEvent } from './confidenceVisuals';

export type PoseAvatarRendererMode = 'mediapipe_skeleton';

export type PoseAvatarFrameSource = 'raw' | 'display';

export type PoseAvatarFit = 'cover' | 'contain';

export type MediaPipeSkeletonConnectionSet = 'full' | 'body';

export type PoseAvatarMeasurementState =
  | 'idle'
  | 'setup'
  | 'framing'
  | 'ready'
  | 'training'
  | 'checkup'
  | 'micro_check'
  | 'rest'
  | 'retest'
  | 'paused'
  | 'success'
  | 'tracking_lost'
  | 'low_confidence';

export type PoseAvatarActiveDomain = 'strength_power' | 'balance' | 'mobility';

export type PoseAvatarTrackingQuality = 'none' | 'low' | 'medium' | 'high';

export type PoseAvatarMeasurementStateIntensity = 'off' | 'subtle' | 'medium';

export interface PoseAvatarRendererHandle {
  /** Feed one pipeline output frame. Safe to call at full frame rate. */
  update(output: PipelineFrameOutput, sourceAspect: number): void;
}

export type PoseAvatarRendererScheduleEventType =
  | 'scheduled'
  | 'coalesced'
  | 'rejected'
  | 'published'
  | 'cancelled';

export interface PoseAvatarRendererScheduleEvent {
  type: PoseAvatarRendererScheduleEventType;
  mode: PoseAvatarRendererMode;
  frameTimestampMs: number | null;
  geometryMs?: number;
  dotCount?: number;
  lineCount?: number;
  shapeCount?: number;
}

export interface PoseAvatarRendererProps {
  mirrored?: boolean;
  fit?: PoseAvatarFit;
  mode?: PoseAvatarRendererMode;
  measurementState?: PoseAvatarMeasurementState;
  activeDomain?: PoseAvatarActiveDomain | null;
  trackingQuality?: PoseAvatarTrackingQuality;
  minConfidence?: number;
  smoothingEnabled?: boolean;
  mediapipeSkeletonStroke?: string;
  mediapipeSkeletonOpacity?: number;
  mediapipeSkeletonLineWidthScale?: number;
  mediapipeSkeletonConnectionSet?: MediaPipeSkeletonConnectionSet;
  mediapipeSkeletonShowLandmarks?: boolean;
  mediapipeSkeletonShowLabels?: boolean;
  mediapipeSkeletonPointColor?: string;
  mediapipeSkeletonLabelColor?: string;
  confidenceFadingEnabled?: boolean;
  confidenceIntensityEnabled?: boolean;
  reacquisitionFadeEnabled?: boolean;
  recognitionPulseEnabled?: boolean;
  confidenceAnimationStrength?: ConfidenceAnimationStrength;
  recognitionEvent?: PoseAvatarRecognitionEvent | null;
  frameSource?: PoseAvatarFrameSource;
  lowLatencyMode?: boolean;
  debug?: boolean;
  onRendererScheduleEvent?: (event: PoseAvatarRendererScheduleEvent) => void;
}
