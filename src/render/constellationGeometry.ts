import { CHAIN_IDS, ChainId, RELIABLE_THRESHOLD } from '../pose/chains';
import { LANDMARK_COUNT, LM } from '../pose/types';
import {
  ConfidenceAnimationStrength,
  getBoneConfidence,
  getConfidenceVisual,
  getScreenLandmarkConfidence,
} from './confidenceVisuals';
import {
  applyDomainEmphasis,
  getDomainEmphasisForLandmark,
  getDomainEmphasisForSegment,
} from './measurementStateVisuals';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import type { PoseAvatarActiveDomain } from './poseAvatarTypes';

export interface ConstellationConnection {
  id: string;
  a: LM;
  b: LM;
  chain: ChainId | 'side' | null;
  samples: number;
}

export interface ConstellationGeometryOptions {
  minConfidence?: number;
  maxDots?: number;
  reliabilityThreshold?: number;
  sampledDotsEnabled?: boolean;
  sampleDensity?: number;
  confidenceIntensityEnabled?: boolean;
  confidenceAnimationStrength?: ConfidenceAnimationStrength;
  radiusMultiplier?: number;
  activeDomain?: PoseAvatarActiveDomain | null;
  domainEmphasisStrength?: number;
}

export interface ConstellationGeometry {
  linePath: string;
  mediumLinePath: string;
  lowLinePath: string;
  sampleDotPath: string;
  mediumSampleDotPath: string;
  lowSampleDotPath: string;
  softSampleDotPath: string;
  mediumSoftSampleDotPath: string;
  lowSoftSampleDotPath: string;
  jointDotPath: string;
  mediumJointDotPath: string;
  lowJointDotPath: string;
  emphasizedLinePath: string;
  emphasizedSampleDotPath: string;
  emphasizedSoftSampleDotPath: string;
  emphasizedJointDotPath: string;
  sampleXs: Float64Array;
  sampleYs: Float64Array;
  jointXs: Float64Array;
  jointYs: Float64Array;
  sampleCount: number;
  jointCount: number;
  dotCount: number;
  lineCount: number;
  skippedLandmarks: number;
  skippedSegments: number;
}

export const CONSTELLATION_MAX_DOTS = 220;
export const CONSTELLATION_MIN_CONFIDENCE = 0.35;

export const CONSTELLATION_KEYPOINTS: readonly LM[] = [
  LM.NOSE,
  LM.LEFT_EAR,
  LM.RIGHT_EAR,
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_ELBOW,
  LM.RIGHT_ELBOW,
  LM.LEFT_WRIST,
  LM.RIGHT_WRIST,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
  LM.LEFT_FOOT_INDEX,
  LM.RIGHT_FOOT_INDEX,
];

export const CONSTELLATION_CONNECTIONS: readonly ConstellationConnection[] = [
  { id: 'ear-line', a: LM.LEFT_EAR, b: LM.RIGHT_EAR, chain: 'head', samples: 3 },
  { id: 'nose-left-ear', a: LM.NOSE, b: LM.LEFT_EAR, chain: 'head', samples: 3 },
  { id: 'nose-right-ear', a: LM.NOSE, b: LM.RIGHT_EAR, chain: 'head', samples: 3 },
  { id: 'shoulders', a: LM.LEFT_SHOULDER, b: LM.RIGHT_SHOULDER, chain: 'side', samples: 10 },
  { id: 'left-upper-arm', a: LM.LEFT_SHOULDER, b: LM.LEFT_ELBOW, chain: 'leftArm', samples: 6 },
  { id: 'left-forearm', a: LM.LEFT_ELBOW, b: LM.LEFT_WRIST, chain: 'leftArm', samples: 6 },
  { id: 'right-upper-arm', a: LM.RIGHT_SHOULDER, b: LM.RIGHT_ELBOW, chain: 'rightArm', samples: 6 },
  { id: 'right-forearm', a: LM.RIGHT_ELBOW, b: LM.RIGHT_WRIST, chain: 'rightArm', samples: 6 },
  { id: 'left-torso', a: LM.LEFT_SHOULDER, b: LM.LEFT_HIP, chain: 'leftSide', samples: 12 },
  { id: 'right-torso', a: LM.RIGHT_SHOULDER, b: LM.RIGHT_HIP, chain: 'rightSide', samples: 12 },
  { id: 'hips', a: LM.LEFT_HIP, b: LM.RIGHT_HIP, chain: 'side', samples: 10 },
  { id: 'left-thigh', a: LM.LEFT_HIP, b: LM.LEFT_KNEE, chain: 'leftSide', samples: 10 },
  { id: 'left-shin', a: LM.LEFT_KNEE, b: LM.LEFT_ANKLE, chain: 'leftSide', samples: 10 },
  { id: 'right-thigh', a: LM.RIGHT_HIP, b: LM.RIGHT_KNEE, chain: 'rightSide', samples: 10 },
  { id: 'right-shin', a: LM.RIGHT_KNEE, b: LM.RIGHT_ANKLE, chain: 'rightSide', samples: 10 },
  { id: 'left-foot', a: LM.LEFT_ANKLE, b: LM.LEFT_FOOT_INDEX, chain: 'leftSide', samples: 4 },
  { id: 'right-foot', a: LM.RIGHT_ANKLE, b: LM.RIGHT_FOOT_INDEX, chain: 'rightSide', samples: 4 },
];

const LEFT_SIDE_IDX = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_IDX = CHAIN_IDS.indexOf('rightSide');

const SAMPLE_PROFILES = CONSTELLATION_CONNECTIONS.map((connection) =>
  createSampleProfile(connection.id, connection.samples)
);

export function createConstellationGeometry(maxDots = CONSTELLATION_MAX_DOTS): ConstellationGeometry {
  return {
    linePath: '',
    mediumLinePath: '',
    lowLinePath: '',
    sampleDotPath: '',
    mediumSampleDotPath: '',
    lowSampleDotPath: '',
    softSampleDotPath: '',
    mediumSoftSampleDotPath: '',
    lowSoftSampleDotPath: '',
    jointDotPath: '',
    mediumJointDotPath: '',
    lowJointDotPath: '',
    emphasizedLinePath: '',
    emphasizedSampleDotPath: '',
    emphasizedSoftSampleDotPath: '',
    emphasizedJointDotPath: '',
    sampleXs: new Float64Array(maxDots),
    sampleYs: new Float64Array(maxDots),
    jointXs: new Float64Array(CONSTELLATION_KEYPOINTS.length),
    jointYs: new Float64Array(CONSTELLATION_KEYPOINTS.length),
    sampleCount: 0,
    jointCount: 0,
    dotCount: 0,
    lineCount: 0,
    skippedLandmarks: 0,
    skippedSegments: 0,
  };
}

export function emptyConstellationGeometry(out: ConstellationGeometry): void {
  out.linePath = '';
  out.mediumLinePath = '';
  out.lowLinePath = '';
  out.sampleDotPath = '';
  out.mediumSampleDotPath = '';
  out.lowSampleDotPath = '';
  out.softSampleDotPath = '';
  out.mediumSoftSampleDotPath = '';
  out.lowSoftSampleDotPath = '';
  out.jointDotPath = '';
  out.mediumJointDotPath = '';
  out.lowJointDotPath = '';
  out.emphasizedLinePath = '';
  out.emphasizedSampleDotPath = '';
  out.emphasizedSoftSampleDotPath = '';
  out.emphasizedJointDotPath = '';
  out.sampleCount = 0;
  out.jointCount = 0;
  out.dotCount = 0;
  out.lineCount = 0;
  out.skippedLandmarks = 0;
  out.skippedSegments = 0;
}

export function buildConstellationGeometry(
  pose: ScreenPoseLandmarks,
  chainReliability: Float64Array | ArrayLike<number>,
  out: ConstellationGeometry,
  options: ConstellationGeometryOptions = {}
): void {
  emptyConstellationGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? CONSTELLATION_MIN_CONFIDENCE;
  const maxDots = Math.min(options.maxDots ?? CONSTELLATION_MAX_DOTS, out.sampleXs.length);
  const reliabilityThreshold = options.reliabilityThreshold ?? RELIABLE_THRESHOLD;
  const sampledDotsEnabled = options.sampledDotsEnabled ?? true;
  const sampleDensity = clamp(options.sampleDensity ?? 1, 0, 1);
  const confidenceIntensityEnabled = options.confidenceIntensityEnabled ?? false;
  const confidenceAnimationStrength = confidenceIntensityEnabled
    ? options.confidenceAnimationStrength ?? 'subtle'
    : 'off';
  const radiusMultiplier = clamp(options.radiusMultiplier ?? 1, 0.7, 1.2);
  const activeDomain = options.activeDomain ?? null;
  const domainEmphasisStrength = clamp(options.domainEmphasisStrength ?? 0, 0, 1);
  const renderConfidenceFloor = confidenceIntensityEnabled ? 0.15 : minConfidence;
  const bodyRef = estimateBodyReference(pose);
  const sampleBase = clamp(bodyRef * 0.0065 * radiusMultiplier, 1.05, 2.1);
  const jointBase = clamp(bodyRef * 0.011 * radiusMultiplier, 1.9, 3.65);
  const offsetAmp = clamp(bodyRef * 0.004, 0.45, 1.6);

  for (let i = 0; i < CONSTELLATION_CONNECTIONS.length; i++) {
    const connection = CONSTELLATION_CONNECTIONS[i];
    const aValid = landmarkIsRenderable(pose, connection.a, renderConfidenceFloor);
    const bValid = landmarkIsRenderable(pose, connection.b, renderConfidenceFloor);
    if (
      !aValid ||
      !bValid ||
      !connectionIsReliable(connection, chainReliability, reliabilityThreshold)
    ) {
      out.skippedSegments++;
      continue;
    }

    const ax = pose.xs[connection.a];
    const ay = pose.ys[connection.a];
    const bx = pose.xs[connection.b];
    const by = pose.ys[connection.b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 4) {
      out.skippedSegments++;
      continue;
    }

    const boneConfidence = getBoneConfidence(pose, connection.a, connection.b);
    const boneVisual = getConfidenceVisual(boneConfidence, confidenceAnimationStrength);
    if (!boneVisual.shouldRender) {
      out.skippedSegments++;
      continue;
    }
    appendLinePath(out, `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`, boneVisual.bucket);
    out.lineCount++;
    const segmentEmphasis = applyDomainEmphasis(
      getDomainEmphasisForSegment(connection.id, activeDomain),
      domainEmphasisStrength
    );
    if (segmentEmphasis > 1.01) {
      out.emphasizedLinePath += `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`;
    }

    const nx = -dy / len;
    const ny = dx / len;
    if (sampledDotsEnabled && sampleDensity > 0) {
      const profile = SAMPLE_PROFILES[i];
      const baseSamples = Math.max(2, Math.min(connection.samples, Math.round(len / 14)));
      const samples = Math.max(1, Math.round(baseSamples * sampleDensity));
      for (let s = 0; s < samples && out.dotCount < maxDots; s++) {
        const t = (s + 1) / (samples + 1);
        const x = ax + dx * t + nx * profile.wave[s] * offsetAmp;
        const y = ay + dy * t + ny * profile.wave[s] * offsetAmp;
        const radius =
          sampleBase * profile.radiusJitter[s] * boneVisual.radiusMultiplier * segmentEmphasis;
        addSampleDot(out, x, y, radius, profile.soft[s], boneVisual.bucket, segmentEmphasis > 1.01);
      }
    }
  }

  for (let i = 0; i < CONSTELLATION_KEYPOINTS.length && out.dotCount < maxDots; i++) {
    const lm = CONSTELLATION_KEYPOINTS[i];
    if (!landmarkIsRenderable(pose, lm, renderConfidenceFloor)) {
      out.skippedLandmarks++;
      continue;
    }
    const visual = getConfidenceVisual(
      getScreenLandmarkConfidence(pose, lm),
      confidenceAnimationStrength
    );
    if (!visual.shouldRender) {
      out.skippedLandmarks++;
      continue;
    }
    const landmarkEmphasis = applyDomainEmphasis(
      getDomainEmphasisForLandmark(lm, activeDomain),
      domainEmphasisStrength
    );
    const radius = jointRadius(lm, jointBase) * visual.radiusMultiplier * landmarkEmphasis;
    addJointDot(out, pose.xs[lm], pose.ys[lm], radius, visual.bucket, landmarkEmphasis > 1.01);
  }

}

export function landmarkIsRenderable(
  pose: ScreenPoseLandmarks,
  lm: LM,
  minConfidence = CONSTELLATION_MIN_CONFIDENCE
): boolean {
  if (!pose.hasPose) return false;
  return (
    lm >= 0 &&
    lm < LANDMARK_COUNT &&
    Number.isFinite(pose.xs[lm]) &&
    Number.isFinite(pose.ys[lm]) &&
    pose.visibility[lm] >= minConfidence &&
    pose.presence[lm] >= minConfidence
  );
}

export function estimateConstellationLineWidth(pose: ScreenPoseLandmarks): number {
  return clamp(estimateBodyReference(pose) * 0.0032, 0.7, 1.2);
}

function connectionIsReliable(
  connection: ConstellationConnection,
  reliability: Float64Array | ArrayLike<number>,
  threshold: number
): boolean {
  if (connection.chain === null) return true;
  if (connection.chain === 'side') {
    return (
      Math.max(reliability[LEFT_SIDE_IDX] ?? 1, reliability[RIGHT_SIDE_IDX] ?? 1) >= threshold
    );
  }
  const idx = CHAIN_IDS.indexOf(connection.chain);
  return idx < 0 ? true : (reliability[idx] ?? 1) >= threshold;
}

function estimateBodyReference(pose: ScreenPoseLandmarks): number {
  if (!pose.hasPose) return 160;
  const shx = (pose.xs[LM.LEFT_SHOULDER] + pose.xs[LM.RIGHT_SHOULDER]) * 0.5;
  const shy = (pose.ys[LM.LEFT_SHOULDER] + pose.ys[LM.RIGHT_SHOULDER]) * 0.5;
  const hx = (pose.xs[LM.LEFT_HIP] + pose.xs[LM.RIGHT_HIP]) * 0.5;
  const hy = (pose.ys[LM.LEFT_HIP] + pose.ys[LM.RIGHT_HIP]) * 0.5;
  const torso = Math.hypot(shx - hx, shy - hy);
  const leg = Math.max(
    Math.hypot(pose.xs[LM.LEFT_HIP] - pose.xs[LM.LEFT_ANKLE], pose.ys[LM.LEFT_HIP] - pose.ys[LM.LEFT_ANKLE]),
    Math.hypot(pose.xs[LM.RIGHT_HIP] - pose.xs[LM.RIGHT_ANKLE], pose.ys[LM.RIGHT_HIP] - pose.ys[LM.RIGHT_ANKLE])
  );
  return Math.max(torso, leg * 0.72, 120);
}

function addSampleDot(
  out: ConstellationGeometry,
  x: number,
  y: number,
  radius: number,
  soft: boolean,
  bucket: string,
  emphasized = false
): void {
  out.sampleXs[out.sampleCount] = x;
  out.sampleYs[out.sampleCount] = y;
  out.sampleCount++;
  out.dotCount++;
  const path = circlePath(x, y, radius);
  if (bucket === 'medium') {
    if (soft) out.mediumSoftSampleDotPath += path;
    else out.mediumSampleDotPath += path;
  } else if (bucket === 'low') {
    if (soft) out.lowSoftSampleDotPath += path;
    else out.lowSampleDotPath += path;
  } else if (soft) out.softSampleDotPath += path;
  else out.sampleDotPath += path;
  if (emphasized) {
    if (soft) out.emphasizedSoftSampleDotPath += path;
    else out.emphasizedSampleDotPath += path;
  }
}

function addJointDot(
  out: ConstellationGeometry,
  x: number,
  y: number,
  radius: number,
  bucket: string,
  emphasized = false
): void {
  out.jointXs[out.jointCount] = x;
  out.jointYs[out.jointCount] = y;
  out.jointCount++;
  out.dotCount++;
  const path = circlePath(x, y, radius);
  if (bucket === 'medium') out.mediumJointDotPath += path;
  else if (bucket === 'low') out.lowJointDotPath += path;
  else out.jointDotPath += path;
  if (emphasized) out.emphasizedJointDotPath += path;
}

function appendLinePath(out: ConstellationGeometry, path: string, bucket: string): void {
  if (bucket === 'medium') out.mediumLinePath += path;
  else if (bucket === 'low') out.lowLinePath += path;
  else out.linePath += path;
}

function jointRadius(lm: LM, base: number): number {
  switch (lm) {
    case LM.LEFT_SHOULDER:
    case LM.RIGHT_SHOULDER:
    case LM.LEFT_HIP:
    case LM.RIGHT_HIP:
      return base * 1.08;
    case LM.LEFT_WRIST:
    case LM.RIGHT_WRIST:
    case LM.LEFT_FOOT_INDEX:
    case LM.RIGHT_FOOT_INDEX:
    case LM.NOSE:
    case LM.LEFT_EAR:
    case LM.RIGHT_EAR:
      return base * 0.82;
    default:
      return base;
  }
}

function circlePath(cx: number, cy: number, r: number): string {
  const R = f(r);
  return `M${f(cx - r)} ${f(cy)}a${R} ${R} 0 1 0 ${f(2 * r)} 0a${R} ${R} 0 1 0 ${f(-2 * r)} 0Z`;
}

function createSampleProfile(id: string, count: number) {
  const wave = new Float64Array(count);
  const radiusJitter = new Float64Array(count);
  const soft: boolean[] = new Array(count);
  for (let i = 0; i < count; i++) {
    wave[i] = (hashUnit(id, i) - 0.5) * 2;
    radiusJitter[i] = 0.82 + hashUnit(`${id}:r`, i) * 0.32;
    soft[i] = hashUnit(`${id}:soft`, i) < 0.42;
  }
  return { wave, radiusJitter, soft };
}

function hashUnit(id: string, sampleIndex: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= Math.imul(sampleIndex + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h >>> 0) % 10000) / 9999;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function f(value: number): string {
  return value.toFixed(1);
}
