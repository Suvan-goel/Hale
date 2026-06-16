import { LM } from '../pose/types';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
  PoseAvatarMeasurementStateIntensity,
  PoseAvatarTrackingQuality,
} from './poseAvatarTypes';

export interface MeasurementStateVisualOptions {
  measurementStatesEnabled?: boolean;
  setupGuidesEnabled?: boolean;
  stateTransitionsEnabled?: boolean;
  domainEmphasisEnabled?: boolean;
  scanLineEnabled?: boolean;
  lowLatencyMode?: boolean;
  intensity?: PoseAvatarMeasurementStateIntensity;
}

export interface MeasurementStateVisualConfig {
  keypointOpacityMultiplier: number;
  boneLineOpacityMultiplier: number;
  sampleDotOpacityMultiplier: number;
  bodyVolumeOpacityMultiplier: number;
  radiusMultiplier: number;
  showSetupGuide: boolean;
  setupGuideOpacity: number;
  showScanLine: boolean;
  scanLineOpacity: number;
  domainEmphasisStrength: number;
  recognitionPulseAllowed: boolean;
  transitionDurationMs: number;
  appliedState: PoseAvatarMeasurementState | 'default';
  activeDomain: PoseAvatarActiveDomain | null;
  trackingQuality: PoseAvatarTrackingQuality;
}

export interface MeasurementStateTransitionState {
  previous: MeasurementStateVisualConfig;
  target: MeasurementStateVisualConfig;
  current: MeasurementStateVisualConfig;
  key: string;
  startedAtMs: number;
}

const DEFAULT_TRACKING_QUALITY: PoseAvatarTrackingQuality = 'high';

export const DEFAULT_MEASUREMENT_VISUAL: MeasurementStateVisualConfig = {
  keypointOpacityMultiplier: 1,
  boneLineOpacityMultiplier: 1,
  sampleDotOpacityMultiplier: 1,
  bodyVolumeOpacityMultiplier: 1,
  radiusMultiplier: 1,
  showSetupGuide: false,
  setupGuideOpacity: 0,
  showScanLine: false,
  scanLineOpacity: 0,
  domainEmphasisStrength: 0,
  recognitionPulseAllowed: true,
  transitionDurationMs: 0,
  appliedState: 'default',
  activeDomain: null,
  trackingQuality: DEFAULT_TRACKING_QUALITY,
};

const CORE_LANDMARKS: readonly LM[] = [
  LM.NOSE,
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
];

const LOWER_BODY = new Set<LM>([
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
  LM.LEFT_FOOT_INDEX,
  LM.RIGHT_FOOT_INDEX,
]);

const BALANCE_LANDMARKS = new Set<LM>([
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
  LM.LEFT_FOOT_INDEX,
  LM.RIGHT_FOOT_INDEX,
]);

const MOBILITY_LANDMARKS = new Set<LM>([
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_ELBOW,
  LM.RIGHT_ELBOW,
  LM.LEFT_WRIST,
  LM.RIGHT_WRIST,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
]);

export function createMeasurementStateTransitionState(): MeasurementStateTransitionState {
  return {
    previous: { ...DEFAULT_MEASUREMENT_VISUAL },
    target: { ...DEFAULT_MEASUREMENT_VISUAL },
    current: { ...DEFAULT_MEASUREMENT_VISUAL },
    key: visualKey(DEFAULT_MEASUREMENT_VISUAL),
    startedAtMs: 0,
  };
}

export function getMeasurementStateVisualConfig(
  measurementState: PoseAvatarMeasurementState | undefined,
  activeDomain: PoseAvatarActiveDomain | null | undefined,
  trackingQuality: PoseAvatarTrackingQuality | undefined,
  options: MeasurementStateVisualOptions = {}
): MeasurementStateVisualConfig {
  const quality = trackingQuality ?? DEFAULT_TRACKING_QUALITY;
  const enabled = options.measurementStatesEnabled !== false;
  const intensity = options.intensity ?? 'subtle';
  if (!enabled || intensity === 'off' || measurementState === undefined) {
    return {
      ...DEFAULT_MEASUREMENT_VISUAL,
      activeDomain: activeDomain ?? null,
      trackingQuality: quality,
    };
  }

  const state = measurementState;
  const visual = baseVisualForState(state);
  const qualityScale = qualityMultiplier(quality);
  const intensityScale = intensity === 'medium' ? 1.18 : 1;
  const setupGuidesEnabled = options.setupGuidesEnabled !== false;
  const scanLineEnabled = options.scanLineEnabled === true && options.lowLatencyMode !== true;
  const domainEmphasisEnabled = options.domainEmphasisEnabled !== false;
  const lowLatency = options.lowLatencyMode === true;
  const showQualityGuide = quality === 'none' || quality === 'low';
  const shouldGuide = setupGuidesEnabled && (visual.showSetupGuide || showQualityGuide);
  const shouldScan = scanLineEnabled && visual.showScanLine;
  const domainStrength =
    activeDomain && domainEmphasisEnabled
      ? clamp(visual.domainEmphasisStrength * intensityScale, 0, lowLatency ? 0.75 : 1)
      : 0;

  return {
    keypointOpacityMultiplier: clamp(
      scaleAboveOne(visual.keypointOpacityMultiplier, intensityScale) * qualityScale.opacity,
      0,
      1.14
    ),
    boneLineOpacityMultiplier: clamp(
      scaleAboveOne(visual.boneLineOpacityMultiplier, intensityScale) * qualityScale.opacity,
      0,
      1.16
    ),
    sampleDotOpacityMultiplier: clamp(
      scaleAboveOne(visual.sampleDotOpacityMultiplier, intensityScale) * qualityScale.opacity,
      0,
      1.14
    ),
    bodyVolumeOpacityMultiplier: clamp(
      scaleAboveOne(visual.bodyVolumeOpacityMultiplier, intensityScale) * qualityScale.volumeOpacity,
      0,
      1.1
    ),
    radiusMultiplier: clamp(scaleAboveOne(visual.radiusMultiplier, intensityScale), 0.7, 1.16),
    showSetupGuide: shouldGuide,
    setupGuideOpacity: shouldGuide
      ? clamp(Math.max(visual.setupGuideOpacity, showQualityGuide ? 0.2 : 0) * qualityScale.guide, 0, 0.45)
      : 0,
    showScanLine: shouldScan,
    scanLineOpacity: shouldScan ? clamp(visual.scanLineOpacity, 0, 0.08) : 0,
    domainEmphasisStrength: domainStrength,
    recognitionPulseAllowed: shouldAllowRecognitionPulse(state),
    transitionDurationMs: getStateTransitionDuration(undefined, state, {
      measurementStatesEnabled: enabled,
      stateTransitionsEnabled: options.stateTransitionsEnabled,
      lowLatencyMode: lowLatency,
    }),
    appliedState: state,
    activeDomain: activeDomain ?? null,
    trackingQuality: quality,
  };
}

export function updateMeasurementStateTransition(
  state: MeasurementStateTransitionState,
  next: MeasurementStateVisualConfig,
  timestampMs: number
): MeasurementStateVisualConfig {
  const nextKey = visualKey(next);
  if (state.key !== nextKey) {
    copyVisual(state.current, state.previous);
    copyVisual(next, state.target);
    state.key = nextKey;
    state.startedAtMs = timestampMs;
  }

  const duration = next.transitionDurationMs;
  if (duration <= 0) {
    copyVisual(next, state.current);
    return state.current;
  }

  const progress = clamp((timestampMs - state.startedAtMs) / duration, 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  interpolateVisual(state.previous, state.target, eased, state.current);
  return state.current;
}

export function getStateTransitionDuration(
  _from: PoseAvatarMeasurementState | 'default' | undefined,
  _to: PoseAvatarMeasurementState | 'default' | undefined,
  options: MeasurementStateVisualOptions = {}
): number {
  if (options.measurementStatesEnabled === false) return 0;
  if (options.stateTransitionsEnabled === false) return 0;
  return options.lowLatencyMode ? 90 : 220;
}

export function shouldShowSetupGuide(
  measurementState: PoseAvatarMeasurementState | undefined,
  trackingQuality: PoseAvatarTrackingQuality | undefined,
  options: MeasurementStateVisualOptions = {}
): boolean {
  return getMeasurementStateVisualConfig(measurementState, null, trackingQuality, options)
    .showSetupGuide;
}

export function shouldAllowRecognitionPulse(
  measurementState: PoseAvatarMeasurementState | undefined,
  options: MeasurementStateVisualOptions = {}
): boolean {
  if (options.measurementStatesEnabled === false) return true;
  if (measurementState === undefined) return true;
  return measurementState === 'training' || measurementState === 'micro_check' || measurementState === 'success';
}

export function getDomainEmphasisForSegment(
  segmentId: string,
  activeDomain: PoseAvatarActiveDomain | null | undefined
): number {
  if (!activeDomain) return 1;
  if (activeDomain === 'strength_power') {
    if (matchesAny(segmentId, ['hip', 'thigh', 'shin', 'knee', 'ankle', 'foot'])) return 1.18;
    if (matchesAny(segmentId, ['torso'])) return 1.08;
    return 1;
  }
  if (activeDomain === 'balance') {
    if (matchesAny(segmentId, ['hip', 'shin', 'ankle', 'foot'])) return 1.18;
    if (matchesAny(segmentId, ['thigh', 'torso'])) return 1.1;
    return 1;
  }
  if (matchesAny(segmentId, ['shoulder', 'upper-arm', 'forearm', 'torso', 'hip'])) return 1.1;
  return 1.04;
}

export function getDomainEmphasisForLandmark(
  landmark: LM,
  activeDomain: PoseAvatarActiveDomain | null | undefined
): number {
  if (!activeDomain) return 1;
  if (activeDomain === 'strength_power') return LOWER_BODY.has(landmark) ? 1.16 : 1;
  if (activeDomain === 'balance') return BALANCE_LANDMARKS.has(landmark) ? 1.16 : 1;
  return MOBILITY_LANDMARKS.has(landmark) ? 1.1 : 1.03;
}

export function applyDomainEmphasis(domainMultiplier: number, strength: number): number {
  return 1 + (domainMultiplier - 1) * clamp(strength, 0, 1);
}

export function getTrackingQuality(pose: ScreenPoseLandmarks): PoseAvatarTrackingQuality {
  if (!pose.hasPose) return 'none';
  let visible = 0;
  let confidenceSum = 0;
  let coreConfidence = 1;

  for (let i = 0; i < CORE_LANDMARKS.length; i++) {
    const lm = CORE_LANDMARKS[i];
    const confidence = landmarkConfidence(pose, lm);
    confidenceSum += confidence;
    coreConfidence = Math.min(coreConfidence, confidence);
    if (confidence >= 0.35) visible++;
  }

  const average = confidenceSum / CORE_LANDMARKS.length;
  if (visible >= 8 && average >= 0.66 && coreConfidence >= 0.45) return 'high';
  if (visible >= 6 && average >= 0.48) return 'medium';
  if (visible > 0) return 'low';
  return 'none';
}

export function buildSetupGuidePath(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '';
  const cx = width * 0.5;
  const top = height * 0.15;
  const bottom = height * 0.87;
  const rx = Math.min(width * 0.26, 112);
  const floorY = height * 0.9;
  const floorLeft = Math.max(width * 0.18, cx - rx * 1.35);
  const floorRight = Math.min(width * 0.82, cx + rx * 1.35);
  return (
    `M${f(cx)} ${f(top)}` +
    `C${f(cx + rx)} ${f(top + height * 0.09)} ${f(cx + rx)} ${f(bottom - height * 0.1)} ${f(cx)} ${f(bottom)}` +
    `C${f(cx - rx)} ${f(bottom - height * 0.1)} ${f(cx - rx)} ${f(top + height * 0.09)} ${f(cx)} ${f(top)}` +
    `M${f(floorLeft)} ${f(floorY)}L${f(floorRight)} ${f(floorY)}`
  );
}

export function buildScanLinePath(width: number, height: number, timestampMs: number): string {
  if (width <= 0 || height <= 0) return '';
  const left = width * 0.22;
  const right = width * 0.78;
  const top = height * 0.22;
  const bottom = height * 0.82;
  const phase = (timestampMs % 2400) / 2400;
  const y = top + (bottom - top) * phase;
  return `M${f(left)} ${f(y)}L${f(right)} ${f(y)}`;
}

function baseVisualForState(state: PoseAvatarMeasurementState): Omit<
  MeasurementStateVisualConfig,
  'transitionDurationMs' | 'appliedState' | 'activeDomain' | 'trackingQuality'
> {
  switch (state) {
    case 'setup':
    case 'framing':
      return visual(0.78, 0.72, 0.76, 0.68, 0.96, true, 0.24, false, 0, 0, false);
    case 'ready':
      return visual(1.08, 1.02, 1.04, 0.95, 1.03, false, 0, false, 0, 0.25, false);
    case 'checkup':
      return visual(1.08, 1.12, 1.08, 0.78, 1.04, false, 0, true, 0.045, 0.85, false);
    case 'micro_check':
      return visual(1.04, 1.06, 1.04, 0.84, 1.03, false, 0, false, 0, 0.75, true);
    case 'training':
      return visual(1, 1, 1, 0.92, 1, false, 0, false, 0, 0.7, true);
    case 'rest':
      return visual(0.72, 0.62, 0.66, 0.55, 0.94, false, 0, false, 0, 0, false);
    case 'retest':
      return visual(1.12, 1.15, 1.1, 0.74, 1.05, true, 0.14, true, 0.05, 1, false);
    case 'paused':
      return visual(0.5, 0.45, 0.5, 0.42, 0.94, false, 0, false, 0, 0, false);
    case 'success':
      return visual(1.12, 1.1, 1.12, 0.95, 1.05, false, 0, false, 0, 0.3, true);
    case 'tracking_lost':
      return visual(0.42, 0.36, 0.4, 0.32, 0.92, true, 0.26, false, 0, 0, false);
    case 'low_confidence':
      return visual(0.62, 0.52, 0.56, 0.45, 0.95, true, 0.22, false, 0, 0, false);
    case 'idle':
    default:
      return visual(1, 1, 1, 1, 1, false, 0, false, 0, 0, false);
  }
}

function visual(
  keypointOpacityMultiplier: number,
  boneLineOpacityMultiplier: number,
  sampleDotOpacityMultiplier: number,
  bodyVolumeOpacityMultiplier: number,
  radiusMultiplier: number,
  showSetupGuide: boolean,
  setupGuideOpacity: number,
  showScanLine: boolean,
  scanLineOpacity: number,
  domainEmphasisStrength: number,
  recognitionPulseAllowed: boolean
): Omit<MeasurementStateVisualConfig, 'transitionDurationMs' | 'appliedState' | 'activeDomain' | 'trackingQuality'> {
  return {
    keypointOpacityMultiplier,
    boneLineOpacityMultiplier,
    sampleDotOpacityMultiplier,
    bodyVolumeOpacityMultiplier,
    radiusMultiplier,
    showSetupGuide,
    setupGuideOpacity,
    showScanLine,
    scanLineOpacity,
    domainEmphasisStrength,
    recognitionPulseAllowed,
  };
}

function qualityMultiplier(quality: PoseAvatarTrackingQuality): {
  opacity: number;
  volumeOpacity: number;
  guide: number;
} {
  switch (quality) {
    case 'none':
      return { opacity: 0.46, volumeOpacity: 0.36, guide: 1 };
    case 'low':
      return { opacity: 0.72, volumeOpacity: 0.56, guide: 0.9 };
    case 'medium':
      return { opacity: 0.94, volumeOpacity: 0.88, guide: 0.62 };
    case 'high':
    default:
      return { opacity: 1, volumeOpacity: 1, guide: 0.5 };
  }
}

function interpolateVisual(
  from: MeasurementStateVisualConfig,
  to: MeasurementStateVisualConfig,
  t: number,
  out: MeasurementStateVisualConfig
): void {
  out.keypointOpacityMultiplier = lerp(from.keypointOpacityMultiplier, to.keypointOpacityMultiplier, t);
  out.boneLineOpacityMultiplier = lerp(from.boneLineOpacityMultiplier, to.boneLineOpacityMultiplier, t);
  out.sampleDotOpacityMultiplier = lerp(from.sampleDotOpacityMultiplier, to.sampleDotOpacityMultiplier, t);
  out.bodyVolumeOpacityMultiplier = lerp(from.bodyVolumeOpacityMultiplier, to.bodyVolumeOpacityMultiplier, t);
  out.radiusMultiplier = lerp(from.radiusMultiplier, to.radiusMultiplier, t);
  out.setupGuideOpacity = lerp(from.setupGuideOpacity, to.setupGuideOpacity, t);
  out.scanLineOpacity = lerp(from.scanLineOpacity, to.scanLineOpacity, t);
  out.domainEmphasisStrength = lerp(from.domainEmphasisStrength, to.domainEmphasisStrength, t);
  out.showSetupGuide = t < 1 ? from.showSetupGuide || to.showSetupGuide : to.showSetupGuide;
  out.showScanLine = t < 1 ? from.showScanLine || to.showScanLine : to.showScanLine;
  out.recognitionPulseAllowed = to.recognitionPulseAllowed;
  out.transitionDurationMs = to.transitionDurationMs;
  out.appliedState = to.appliedState;
  out.activeDomain = to.activeDomain;
  out.trackingQuality = to.trackingQuality;
}

function copyVisual(from: MeasurementStateVisualConfig, to: MeasurementStateVisualConfig): void {
  to.keypointOpacityMultiplier = from.keypointOpacityMultiplier;
  to.boneLineOpacityMultiplier = from.boneLineOpacityMultiplier;
  to.sampleDotOpacityMultiplier = from.sampleDotOpacityMultiplier;
  to.bodyVolumeOpacityMultiplier = from.bodyVolumeOpacityMultiplier;
  to.radiusMultiplier = from.radiusMultiplier;
  to.showSetupGuide = from.showSetupGuide;
  to.setupGuideOpacity = from.setupGuideOpacity;
  to.showScanLine = from.showScanLine;
  to.scanLineOpacity = from.scanLineOpacity;
  to.domainEmphasisStrength = from.domainEmphasisStrength;
  to.recognitionPulseAllowed = from.recognitionPulseAllowed;
  to.transitionDurationMs = from.transitionDurationMs;
  to.appliedState = from.appliedState;
  to.activeDomain = from.activeDomain;
  to.trackingQuality = from.trackingQuality;
}

function visualKey(visual: MeasurementStateVisualConfig): string {
  return `${visual.appliedState}:${visual.activeDomain ?? 'none'}:${visual.trackingQuality}:` +
    `${visual.showSetupGuide ? 'guide' : 'noguide'}:${visual.showScanLine ? 'scan' : 'noscan'}:` +
    `${visual.recognitionPulseAllowed ? 'pulse' : 'nopulse'}`;
}

function matchesAny(value: string, needles: readonly string[]): boolean {
  for (let i = 0; i < needles.length; i++) {
    if (value.includes(needles[i])) return true;
  }
  return false;
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(pose.visibility[lm], pose.presence[lm]);
}

function scaleAboveOne(value: number, amount: number): number {
  return value >= 1 ? 1 + (value - 1) * amount : value / amount;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function f(value: number): string {
  return value.toFixed(1);
}
