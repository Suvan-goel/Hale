import type { ConfidenceAnimationStrength } from './confidenceVisuals';
import type {
  PoseAvatarFrameSource,
  PoseAvatarMeasurementStateIntensity,
  PoseAvatarRendererMode,
  PoseAvatarRendererProps,
} from './poseAvatarTypes';

export type PoseAvatarDebugVariant =
  | 'classic'
  | 'constellation-smoothing-off'
  | 'constellation-smoothing-on'
  | 'constellation-sampled-dots-off'
  | 'constellation-sampled-dots-on'
  | 'constellation-volume-off'
  | 'constellation-volume-on'
  | 'constellation-measurement-states-off'
  | 'constellation-measurement-states-on'
  | 'constellation-setup-guides-off'
  | 'constellation-setup-guides-on'
  | 'constellation-domain-emphasis-off'
  | 'constellation-domain-emphasis-on'
  | 'constellation-low-latency';

export interface PoseAvatarResolvedConfig {
  mode: PoseAvatarRendererMode;
  debugVariant: PoseAvatarDebugVariant | null;
  debug: boolean;
  debugControlsEnabled: boolean;
  lowLatencyMode: boolean;
  smoothingEnabled: boolean;
  adaptiveSmoothingEnabled: boolean;
  smoothingAlpha: number;
  smoothingMinAlpha: number;
  smoothingMaxAlpha: number;
  smoothingSlowSpeedPxPerSec: number;
  smoothingFastSpeedPxPerSec: number;
  smoothingSnapFrames: number;
  sampledDotsEnabled: boolean;
  maxDots: number;
  sampleDensity: number;
  bodyVolumeEnabled: boolean;
  torsoVolumeEnabled: boolean;
  headVolumeEnabled: boolean;
  shoulderHipDensityEnabled: boolean;
  maxVolumeDots: number;
  torsoVolumeDots: number;
  headVolumeDots: number;
  shoulderHipDensityDots: number;
  confidenceFadingEnabled: boolean;
  confidenceIntensityEnabled: boolean;
  reacquisitionFadeEnabled: boolean;
  recognitionPulseEnabled: boolean;
  confidenceAnimationStrength: ConfidenceAnimationStrength;
  measurementStatesEnabled: boolean;
  setupGuidesEnabled: boolean;
  stateTransitionsEnabled: boolean;
  domainEmphasisEnabled: boolean;
  scanLineEnabled: boolean;
  measurementStateIntensity: PoseAvatarMeasurementStateIntensity;
  frameSource: PoseAvatarFrameSource;
}

type Env = Record<string, string | undefined>;

export const DEFAULT_POSE_AVATAR_RENDERER_MODE: PoseAvatarRendererMode = 'constellation';
export const INVALID_POSE_AVATAR_RENDERER_MODE_FALLBACK: PoseAvatarRendererMode = 'classic';

export const POSE_AVATAR_RENDERER_ENV = 'EXPO_PUBLIC_POSE_AVATAR_RENDERER';
export const POSE_AVATAR_DEBUG_VARIANT_ENV = 'EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT';
export const POSE_AVATAR_LOW_LATENCY_ENV = 'POSE_AVATAR_LOW_LATENCY_MODE';
export const POSE_AVATAR_PUBLIC_LOW_LATENCY_ENV = 'EXPO_PUBLIC_POSE_AVATAR_LOW_LATENCY_MODE';

export const POSE_AVATAR_DEBUG_VARIANTS: readonly PoseAvatarDebugVariant[] = [
  'classic',
  'constellation-smoothing-off',
  'constellation-smoothing-on',
  'constellation-sampled-dots-off',
  'constellation-sampled-dots-on',
  'constellation-volume-off',
  'constellation-volume-on',
  'constellation-measurement-states-off',
  'constellation-measurement-states-on',
  'constellation-setup-guides-off',
  'constellation-setup-guides-on',
  'constellation-domain-emphasis-off',
  'constellation-domain-emphasis-on',
  'constellation-low-latency',
];

export function resolvePoseAvatarRendererMode(
  value = process.env.EXPO_PUBLIC_POSE_AVATAR_RENDERER
): PoseAvatarRendererMode {
  if (value === undefined || value === '') return DEFAULT_POSE_AVATAR_RENDERER_MODE;
  return value === 'constellation' || value === 'classic'
    ? value
    : INVALID_POSE_AVATAR_RENDERER_MODE_FALLBACK;
}

export function resolvePoseAvatarConfig(
  props: PoseAvatarRendererProps = {},
  env: Env = process.env,
  debugVariantOverride?: PoseAvatarDebugVariant | null
): PoseAvatarResolvedConfig {
  const explicitVariant =
    debugVariantOverride !== undefined
      ? debugVariantOverride
      : parseDebugVariant(env.EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT);
  let lowLatencyMode =
    props.lowLatencyMode ??
    parseBool(env.EXPO_PUBLIC_POSE_AVATAR_LOW_LATENCY_MODE) ??
    parseBool(env.POSE_AVATAR_LOW_LATENCY_MODE) ??
    false;
  const phase3Enabled = parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_PHASE3) ?? true;
  const phase4Enabled = parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_PHASE4) ?? true;

  let mode = props.mode ?? resolvePoseAvatarRendererMode(env.EXPO_PUBLIC_POSE_AVATAR_RENDERER);
  let smoothingEnabled =
    props.smoothingEnabled ??
    parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING) ??
    !lowLatencyMode;
  let sampledDotsEnabled =
    props.sampledDotsEnabled ??
    parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_SAMPLED_DOTS) ??
    true;
  let bodyVolumeEnabled =
    props.bodyVolumeEnabled ??
    parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_BODY_VOLUME) ??
    true;
  let measurementStatesEnabled =
    props.measurementStatesEnabled ??
    (phase4Enabled
      ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_MEASUREMENT_STATES) ?? true
      : false);
  let setupGuidesEnabled =
    props.setupGuidesEnabled ??
    (phase4Enabled ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_SETUP_GUIDES) ?? true : false);
  let stateTransitionsEnabled =
    props.stateTransitionsEnabled ??
    (phase4Enabled
      ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_STATE_TRANSITIONS) ?? !lowLatencyMode
      : false);
  let domainEmphasisEnabled =
    props.domainEmphasisEnabled ??
    (phase4Enabled ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_DOMAIN_EMPHASIS) ?? true : false);
  let scanLineEnabled =
    props.scanLineEnabled ??
    (phase4Enabled
      ? (parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_SCAN_LINE) ?? false) && !lowLatencyMode
      : false);

  if (explicitVariant !== null) {
    mode = explicitVariant === 'classic' ? 'classic' : 'constellation';
    if (explicitVariant === 'constellation-smoothing-off') smoothingEnabled = false;
    if (explicitVariant === 'constellation-smoothing-on') smoothingEnabled = true;
    if (explicitVariant === 'constellation-sampled-dots-off') sampledDotsEnabled = false;
    if (explicitVariant === 'constellation-sampled-dots-on') sampledDotsEnabled = true;
    if (explicitVariant === 'constellation-volume-off') bodyVolumeEnabled = false;
    if (explicitVariant === 'constellation-volume-on') bodyVolumeEnabled = true;
    if (explicitVariant === 'constellation-measurement-states-off') measurementStatesEnabled = false;
    if (explicitVariant === 'constellation-measurement-states-on') measurementStatesEnabled = true;
    if (explicitVariant === 'constellation-setup-guides-off') setupGuidesEnabled = false;
    if (explicitVariant === 'constellation-setup-guides-on') setupGuidesEnabled = true;
    if (explicitVariant === 'constellation-domain-emphasis-off') domainEmphasisEnabled = false;
    if (explicitVariant === 'constellation-domain-emphasis-on') domainEmphasisEnabled = true;
    if (explicitVariant === 'constellation-low-latency') {
      lowLatencyMode = true;
      smoothingEnabled = false;
      sampledDotsEnabled = true;
      stateTransitionsEnabled = false;
      scanLineEnabled = false;
    }
  }

  const adaptiveSmoothingEnabled =
    props.adaptiveSmoothingEnabled ??
    parseBool(env.EXPO_PUBLIC_POSE_AVATAR_ADAPTIVE_SMOOTHING) ??
    true;

  const smoothingAlpha = resolveNumber(
    props.smoothingAlpha,
    env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_ALPHA,
    lowLatencyMode ? 0.86 : 0.78,
    0,
    1
  );
  const smoothingMinAlpha = resolveNumber(
    props.smoothingMinAlpha,
    env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_MIN_ALPHA,
    lowLatencyMode ? 0.72 : 0.58,
    0,
    1
  );
  const smoothingMaxAlpha = resolveNumber(
    props.smoothingMaxAlpha,
    env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_MAX_ALPHA,
    lowLatencyMode ? 0.95 : 0.9,
    0,
    1
  );

  return {
    mode,
    debugVariant: explicitVariant,
    debug: props.debug ?? parseBool(env.EXPO_PUBLIC_POSE_AVATAR_DEBUG) ?? false,
    debugControlsEnabled:
      parseBool(env.EXPO_PUBLIC_POSE_AVATAR_DEBUG_CONTROLS) ??
      parseBool(env.EXPO_PUBLIC_POSE_AVATAR_DEBUG) ??
      false,
    lowLatencyMode,
    smoothingEnabled,
    adaptiveSmoothingEnabled,
    smoothingAlpha,
    smoothingMinAlpha,
    smoothingMaxAlpha,
    smoothingSlowSpeedPxPerSec: resolveNumber(
      undefined,
      env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_SLOW_SPEED,
      90,
      1,
      5000
    ),
    smoothingFastSpeedPxPerSec: resolveNumber(
      undefined,
      env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_FAST_SPEED,
      650,
      1,
      5000
    ),
    smoothingSnapFrames: Math.round(
      resolveNumber(
        undefined,
        env.EXPO_PUBLIC_POSE_AVATAR_SMOOTHING_SNAP_FRAMES,
        lowLatencyMode ? 3 : 2,
        0,
        10
      )
    ),
    sampledDotsEnabled,
    maxDots: Math.round(
      resolveNumber(
        props.maxDots,
        env.EXPO_PUBLIC_POSE_AVATAR_MAX_DOTS,
        lowLatencyMode ? 90 : 180,
        20,
        300
      )
    ),
    sampleDensity: resolveNumber(
      props.sampleDensity,
      env.EXPO_PUBLIC_POSE_AVATAR_SAMPLE_DENSITY,
      lowLatencyMode ? 0.58 : 0.82,
      0,
      1
    ),
    bodyVolumeEnabled,
    torsoVolumeEnabled:
      props.torsoVolumeEnabled ??
      parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_TORSO_VOLUME) ??
      bodyVolumeEnabled,
    headVolumeEnabled:
      props.headVolumeEnabled ??
      parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_HEAD_VOLUME) ??
      bodyVolumeEnabled,
    shoulderHipDensityEnabled:
      props.shoulderHipDensityEnabled ??
      parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_SHOULDER_HIP_DENSITY) ??
      false,
    maxVolumeDots: Math.round(
      resolveNumber(
        props.maxVolumeDots,
        env.EXPO_PUBLIC_POSE_AVATAR_MAX_VOLUME_DOTS,
        lowLatencyMode ? 60 : 150,
        0,
        180
      )
    ),
    torsoVolumeDots: Math.round(
      resolveNumber(
        props.torsoVolumeDots,
        env.EXPO_PUBLIC_POSE_AVATAR_TORSO_VOLUME_DOTS,
        lowLatencyMode ? 32 : 86,
        0,
        120
      )
    ),
    headVolumeDots: Math.round(
      resolveNumber(
        props.headVolumeDots,
        env.EXPO_PUBLIC_POSE_AVATAR_HEAD_VOLUME_DOTS,
        lowLatencyMode ? 10 : 22,
        0,
        40
      )
    ),
    shoulderHipDensityDots: Math.round(
      resolveNumber(
        props.shoulderHipDensityDots,
        env.EXPO_PUBLIC_POSE_AVATAR_SHOULDER_HIP_DENSITY_DOTS,
        lowLatencyMode ? 0 : 16,
        0,
        40
      )
    ),
    confidenceFadingEnabled:
      props.confidenceFadingEnabled ??
      (phase3Enabled
        ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_FADING) ??
          parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_ANIMATION) ??
          true
        : false),
    confidenceIntensityEnabled:
      props.confidenceIntensityEnabled ??
      (phase3Enabled
        ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_INTENSITY) ??
          parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_ANIMATION) ??
          true
        : false),
    reacquisitionFadeEnabled:
      props.reacquisitionFadeEnabled ??
      (phase3Enabled
        ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_REACQUISITION_FADE) ??
          !lowLatencyMode
        : false),
    recognitionPulseEnabled:
      props.recognitionPulseEnabled ??
      (phase3Enabled
        ? parseOnOff(env.EXPO_PUBLIC_POSE_AVATAR_RECOGNITION_PULSE) ??
          false
        : false),
    confidenceAnimationStrength:
      props.confidenceAnimationStrength ??
      parseConfidenceAnimationStrength(env.EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_STRENGTH) ??
      (phase3Enabled ? 'subtle' : 'off'),
    measurementStatesEnabled,
    setupGuidesEnabled,
    stateTransitionsEnabled,
    domainEmphasisEnabled,
    scanLineEnabled,
    measurementStateIntensity:
      props.measurementStateIntensity ??
      parseMeasurementStateIntensity(env.EXPO_PUBLIC_POSE_AVATAR_MEASUREMENT_STATE_INTENSITY) ??
      (phase4Enabled ? 'subtle' : 'off'),
    frameSource:
      props.frameSource ??
      parseFrameSource(env.EXPO_PUBLIC_POSE_AVATAR_FRAME_SOURCE) ??
      'raw',
  };
}

function parseMeasurementStateIntensity(
  value: string | undefined
): PoseAvatarMeasurementStateIntensity | null {
  if (value === 'off' || value === 'subtle' || value === 'medium') return value;
  return null;
}

function parseConfidenceAnimationStrength(value: string | undefined): ConfidenceAnimationStrength | null {
  if (value === 'off' || value === 'subtle' || value === 'medium') return value;
  return null;
}

function parseDebugVariant(value: string | undefined): PoseAvatarDebugVariant | null {
  return POSE_AVATAR_DEBUG_VARIANTS.includes(value as PoseAvatarDebugVariant)
    ? (value as PoseAvatarDebugVariant)
    : null;
}

function parseFrameSource(value: string | undefined): PoseAvatarFrameSource | null {
  if (value === 'raw' || value === 'display') return value;
  return null;
}

function parseOnOff(value: string | undefined): boolean | null {
  if (value === undefined || value === '') return null;
  if (value === 'on' || value === 'true' || value === '1') return true;
  if (value === 'off' || value === 'false' || value === '0') return false;
  return null;
}

function parseBool(value: string | undefined): boolean | null {
  return parseOnOff(value);
}

function resolveNumber(
  propValue: number | undefined,
  envValue: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = propValue ?? (envValue !== undefined && envValue !== '' ? Number(envValue) : NaN);
  const value = Number.isFinite(raw) ? raw : fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
