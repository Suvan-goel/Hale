import type { PipelineFrameOutput } from '../pose/pipeline';
import type { ConfidenceAnimationStrength, PoseAvatarRecognitionEvent } from './confidenceVisuals';
import type {
  PointCloudBodyDensity,
  PointCloudBodyPart,
  PointCloudBodyShapeProfile,
} from './pointCloudBodyGeometry';
import type { SoftDigitalTwinVisualPresetName } from './softDigitalTwinGeometry';

export type PoseAvatarRendererMode =
  | 'art_directed_human'
  | 'classic'
  | 'constellation'
  | 'contour_field'
  | 'point_cloud_body'
  | 'premium_constellation_human'
  | 'privacy_shadow'
  | 'rigged_human_silhouette'
  | 'shadow_silhouette'
  | 'soft_digital_twin'
  | 'soft_silhouette_avatar'
  | 'sprite_limb_avatar'
  | 'volumetric_shadow'
  | 'mediapipe_skeleton';

export type PoseAvatarFrameSource = 'raw' | 'display';

export type PoseAvatarFit = 'cover' | 'contain';

export type MediaPipeSkeletonConnectionSet = 'full' | 'body';

export type PremiumConstellationVolumePreset =
  | 'constellationVolume180'
  | 'constellationVolume300'
  | 'constellationVolume450';

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
  dynamicPathCount?: number;
  staticTransformedShapeCount?: number;
  surfacePathCount?: number;
  internalControlVertexCount?: number;
  virtualBoneCount?: number;
  orientationFactor?: number;
  orientationProfile?: string;
  proportionCalibrationComplete?: boolean;
  proportionCalibrationState?: string;
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
  pointCloudBodyEnabled?: boolean;
  pointCloudBodyDensity?: PointCloudBodyDensity;
  pointCloudBodyMaxDots?: number;
  pointCloudBodyShowConnections?: boolean;
  pointCloudBodyConnectionOpacity?: number;
  pointCloudBodyConnectionMaxLines?: number;
  pointCloudBodyShowSkeletonLines?: boolean;
  pointCloudBodyShowKeypoints?: boolean;
  pointCloudBodyActiveParts?: readonly PointCloudBodyPart[];
  pointCloudBodyDotScale?: number;
  pointCloudBodyOpacity?: number;
  pointCloudBodyShapeProfile?: PointCloudBodyShapeProfile;
  premiumConstellationVolumePreset?: PremiumConstellationVolumePreset;
  premiumConstellationShowConnections?: boolean;
  softDigitalTwinVisualPreset?: SoftDigitalTwinVisualPresetName;
  softDigitalTwinShowConstructionOverlay?: boolean;
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
  measurementStatesEnabled?: boolean;
  setupGuidesEnabled?: boolean;
  stateTransitionsEnabled?: boolean;
  domainEmphasisEnabled?: boolean;
  scanLineEnabled?: boolean;
  measurementStateIntensity?: PoseAvatarMeasurementStateIntensity;
  frameSource?: PoseAvatarFrameSource;
  lowLatencyMode?: boolean;
  debug?: boolean;
  onRendererScheduleEvent?: (event: PoseAvatarRendererScheduleEvent) => void;
}
