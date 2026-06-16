import type { PipelineFrameOutput } from '../pose/pipeline';
import type {
  ConfidenceAnimationStrength,
  PoseAvatarRecognitionEvent,
} from './confidenceVisuals';

export type PoseAvatarRendererMode = 'classic' | 'constellation';

export type PoseAvatarFrameSource = 'raw' | 'display';

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

export interface PoseAvatarRendererProps {
  mirrored?: boolean;
  mode?: PoseAvatarRendererMode;
  measurementState?: PoseAvatarMeasurementState;
  activeDomain?: PoseAvatarActiveDomain | null;
  trackingQuality?: PoseAvatarTrackingQuality;
  minConfidence?: number;
  smoothingEnabled?: boolean;
  adaptiveSmoothingEnabled?: boolean;
  smoothingAlpha?: number;
  smoothingMinAlpha?: number;
  smoothingMaxAlpha?: number;
  smoothingSlowSpeedPxPerSec?: number;
  smoothingFastSpeedPxPerSec?: number;
  smoothingSnapFrames?: number;
  sampledDotsEnabled?: boolean;
  maxDots?: number;
  sampleDensity?: number;
  bodyVolumeEnabled?: boolean;
  torsoVolumeEnabled?: boolean;
  headVolumeEnabled?: boolean;
  shoulderHipDensityEnabled?: boolean;
  maxVolumeDots?: number;
  torsoVolumeDots?: number;
  headVolumeDots?: number;
  shoulderHipDensityDots?: number;
  confidenceFadingEnabled?: boolean;
  confidenceIntensityEnabled?: boolean;
  reacquisitionFadeEnabled?: boolean;
  recognitionPulseEnabled?: boolean;
  confidenceAnimationStrength?: ConfidenceAnimationStrength;
  recognitionEvent?: PoseAvatarRecognitionEvent | null;
  measurementStatesEnabled?: boolean;
  setupGuidesEnabled?: boolean;
  stateTransitionsEnabled?: boolean;
  domainEmphasisEnabled?: boolean;
  scanLineEnabled?: boolean;
  measurementStateIntensity?: PoseAvatarMeasurementStateIntensity;
  frameSource?: PoseAvatarFrameSource;
  lowLatencyMode?: boolean;
  debug?: boolean;
}
