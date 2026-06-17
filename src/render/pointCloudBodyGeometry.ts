import { LANDMARK_COUNT, LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
  type TorsoEstimate,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export type PointCloudBodyDensity = 'low' | 'medium' | 'high';

export type PointCloudBodyPart =
  | 'torso'
  | 'head'
  | 'leftUpperArm'
  | 'rightUpperArm'
  | 'leftForearm'
  | 'rightForearm'
  | 'leftThigh'
  | 'rightThigh'
  | 'leftLowerLeg'
  | 'rightLowerLeg'
  | 'leftHand'
  | 'rightHand'
  | 'leftFoot'
  | 'rightFoot';

export interface PointCloudBodyCounts {
  torso: number;
  head: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  lowerLeg: number;
  hand: number;
  foot: number;
  maxDots: number;
  connectionMaxLines: number;
}

export interface PointCloudBodyGeometryOptions {
  minConfidence?: number;
  pointCloudBodyEnabled?: boolean;
  density?: PointCloudBodyDensity;
  maxDots?: number;
  lowLatencyMode?: boolean;
  showConnections?: boolean;
  connectionMaxLines?: number;
  showKeypoints?: boolean;
  opacity?: number;
  radiusMultiplier?: number;
}

export interface PointCloudBodyGeometry {
  torsoDotPath: string;
  softTorsoDotPath: string;
  headDotPath: string;
  softHeadDotPath: string;
  limbDotPath: string;
  softLimbDotPath: string;
  extremityDotPath: string;
  softExtremityDotPath: string;
  keypointDotPath: string;
  connectionPath: string;
  dotXs: Float64Array;
  dotYs: Float64Array;
  torsoXs: Float64Array;
  torsoYs: Float64Array;
  headXs: Float64Array;
  headYs: Float64Array;
  dotCount: number;
  torsoDotCount: number;
  headDotCount: number;
  upperArmDotCount: number;
  forearmDotCount: number;
  thighDotCount: number;
  lowerLegDotCount: number;
  handDotCount: number;
  footDotCount: number;
  keypointDotCount: number;
  connectionLineCount: number;
  skippedBodyPartCount: number;
  opacityScale: number;
  bodyPartDotCounts: Record<PointCloudBodyPart, number>;
}

export interface TorsoBodyDotSeed {
  u: number;
  v: number;
  radiusSeed: number;
  opacitySeed: number;
}

export interface CapsuleDotSeed {
  t: number;
  radial: number;
  tangentJitter: number;
  radiusSeed: number;
  opacitySeed: number;
}

export interface EllipseDotSeed {
  u: number;
  v: number;
  radiusSeed: number;
  opacitySeed: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const DEFAULT_MAX_DOTS = 800;
const LOW_LATENCY_MAX_DOTS = 400;
const ABSOLUTE_MAX_DOTS = 900;
const KEYPOINTS: readonly LM[] = [
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

const POINT_CLOUD_BODY_PARTS: readonly PointCloudBodyPart[] = [
  'torso',
  'head',
  'leftUpperArm',
  'rightUpperArm',
  'leftForearm',
  'rightForearm',
  'leftThigh',
  'rightThigh',
  'leftLowerLeg',
  'rightLowerLeg',
  'leftHand',
  'rightHand',
  'leftFoot',
  'rightFoot',
];

const COUNT_PRESETS: Record<PointCloudBodyDensity, PointCloudBodyCounts> = {
  low: {
    torso: 95,
    head: 34,
    upperArm: 18,
    forearm: 15,
    thigh: 30,
    lowerLeg: 22,
    hand: 8,
    foot: 9,
    maxDots: LOW_LATENCY_MAX_DOTS,
    connectionMaxLines: 0,
  },
  medium: {
    torso: 190,
    head: 65,
    upperArm: 34,
    forearm: 28,
    thigh: 58,
    lowerLeg: 46,
    hand: 16,
    foot: 18,
    maxDots: DEFAULT_MAX_DOTS,
    connectionMaxLines: 120,
  },
  high: {
    torso: 240,
    head: 85,
    upperArm: 44,
    forearm: 36,
    thigh: 74,
    lowerLeg: 58,
    hand: 22,
    foot: 24,
    maxDots: ABSOLUTE_MAX_DOTS,
    connectionMaxLines: 140,
  },
};

const TORSO_SEED_CACHE = new Map<number, readonly TorsoBodyDotSeed[]>();
const HEAD_SEED_CACHE = new Map<number, readonly EllipseDotSeed[]>();
const CAPSULE_SEED_CACHE = new Map<string, readonly CapsuleDotSeed[]>();
const CLUSTER_SEED_CACHE = new Map<number, readonly EllipseDotSeed[]>();

export function createPointCloudBodyGeometry(maxDots = ABSOLUTE_MAX_DOTS): PointCloudBodyGeometry {
  const capacity = Math.min(Math.max(0, Math.round(maxDots)), ABSOLUTE_MAX_DOTS);
  return {
    torsoDotPath: '',
    softTorsoDotPath: '',
    headDotPath: '',
    softHeadDotPath: '',
    limbDotPath: '',
    softLimbDotPath: '',
    extremityDotPath: '',
    softExtremityDotPath: '',
    keypointDotPath: '',
    connectionPath: '',
    dotXs: new Float64Array(capacity),
    dotYs: new Float64Array(capacity),
    torsoXs: new Float64Array(capacity),
    torsoYs: new Float64Array(capacity),
    headXs: new Float64Array(capacity),
    headYs: new Float64Array(capacity),
    dotCount: 0,
    torsoDotCount: 0,
    headDotCount: 0,
    upperArmDotCount: 0,
    forearmDotCount: 0,
    thighDotCount: 0,
    lowerLegDotCount: 0,
    handDotCount: 0,
    footDotCount: 0,
    keypointDotCount: 0,
    connectionLineCount: 0,
    skippedBodyPartCount: 0,
    opacityScale: 1,
    bodyPartDotCounts: createBodyPartCountMap(),
  };
}

export function emptyPointCloudBodyGeometry(out: PointCloudBodyGeometry): void {
  out.torsoDotPath = '';
  out.softTorsoDotPath = '';
  out.headDotPath = '';
  out.softHeadDotPath = '';
  out.limbDotPath = '';
  out.softLimbDotPath = '';
  out.extremityDotPath = '';
  out.softExtremityDotPath = '';
  out.keypointDotPath = '';
  out.connectionPath = '';
  out.dotCount = 0;
  out.torsoDotCount = 0;
  out.headDotCount = 0;
  out.upperArmDotCount = 0;
  out.forearmDotCount = 0;
  out.thighDotCount = 0;
  out.lowerLegDotCount = 0;
  out.handDotCount = 0;
  out.footDotCount = 0;
  out.keypointDotCount = 0;
  out.connectionLineCount = 0;
  out.skippedBodyPartCount = 0;
  out.opacityScale = 1;
  for (let i = 0; i < POINT_CLOUD_BODY_PARTS.length; i++) {
    out.bodyPartDotCounts[POINT_CLOUD_BODY_PARTS[i]] = 0;
  }
}

export function buildPointCloudBodyGeometry(
  pose: ScreenPoseLandmarks,
  out: PointCloudBodyGeometry,
  options: PointCloudBodyGeometryOptions = {}
): void {
  emptyPointCloudBodyGeometry(out);
  if (!pose.hasPose || options.pointCloudBodyEnabled === false) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const density = options.lowLatencyMode ? 'low' : options.density ?? 'medium';
  const showKeypoints = options.showKeypoints !== false;
  const requestedMaxDots = Math.min(
    options.maxDots ?? COUNT_PRESETS[density].maxDots,
    out.dotXs.length
  );
  const keypointReserve = showKeypoints ? KEYPOINTS.length : 0;
  const counts = resolvePointCloudBodyCounts({
    density,
    lowLatencyMode: options.lowLatencyMode,
    maxDots: Math.max(0, requestedMaxDots - keypointReserve),
    connectionMaxLines: options.connectionMaxLines,
  });
  const bodyRef = estimateBodyReference(pose);
  const radiusMultiplier = clamp(options.radiusMultiplier ?? 1, 0.65, 1.15);
  const showConnections = options.showConnections === true && !options.lowLatencyMode;
  const connectionMaxLines = showConnections ? counts.connectionMaxLines : 0;

  appendTorso(pose, out, counts.torso, minConfidence, bodyRef, radiusMultiplier, showConnections, connectionMaxLines);
  appendHead(pose, out, counts.head, minConfidence, bodyRef, radiusMultiplier, showConnections, connectionMaxLines);
  appendLimbCapsule(
    pose,
    out,
    'leftUpperArm',
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    counts.upperArm,
    minConfidence,
    bodyRef,
    0.052,
    0.045,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'rightUpperArm',
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    counts.upperArm,
    minConfidence,
    bodyRef,
    0.052,
    0.045,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'leftForearm',
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    counts.forearm,
    minConfidence,
    bodyRef,
    0.043,
    0.034,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'rightForearm',
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    counts.forearm,
    minConfidence,
    bodyRef,
    0.043,
    0.034,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'leftThigh',
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    counts.thigh,
    minConfidence,
    bodyRef,
    0.079,
    0.06,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'rightThigh',
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    counts.thigh,
    minConfidence,
    bodyRef,
    0.079,
    0.06,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'leftLowerLeg',
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    counts.lowerLeg,
    minConfidence,
    bodyRef,
    0.056,
    0.041,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendLimbCapsule(
    pose,
    out,
    'rightLowerLeg',
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    counts.lowerLeg,
    minConfidence,
    bodyRef,
    0.056,
    0.041,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendExtremityCluster(
    pose,
    out,
    'leftHand',
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    counts.hand,
    minConfidence,
    bodyRef,
    0.045,
    0.034,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendExtremityCluster(
    pose,
    out,
    'rightHand',
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    counts.hand,
    minConfidence,
    bodyRef,
    0.045,
    0.034,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendExtremityCluster(
    pose,
    out,
    'leftFoot',
    LM.LEFT_ANKLE,
    LM.LEFT_FOOT_INDEX,
    counts.foot,
    minConfidence,
    bodyRef,
    0.06,
    0.035,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );
  appendExtremityCluster(
    pose,
    out,
    'rightFoot',
    LM.RIGHT_ANKLE,
    LM.RIGHT_FOOT_INDEX,
    counts.foot,
    minConfidence,
    bodyRef,
    0.06,
    0.035,
    radiusMultiplier,
    showConnections,
    connectionMaxLines
  );

  if (showKeypoints) {
    appendKeypoints(pose, out, minConfidence, bodyRef, radiusMultiplier);
  }

  out.opacityScale *= clamp(options.opacity ?? 1, 0, 1);
}

export function resolvePointCloudBodyCounts(options: {
  density?: PointCloudBodyDensity;
  lowLatencyMode?: boolean;
  maxDots?: number;
  connectionMaxLines?: number;
} = {}): PointCloudBodyCounts {
  const density = options.lowLatencyMode ? 'low' : options.density ?? 'medium';
  const preset = COUNT_PRESETS[density];
  const maxDots = Math.round(
    clamp(options.maxDots ?? preset.maxDots, 0, options.lowLatencyMode ? LOW_LATENCY_MAX_DOTS : ABSOLUTE_MAX_DOTS)
  );
  const total =
    preset.torso +
    preset.head +
    2 *
      (preset.upperArm +
        preset.forearm +
        preset.thigh +
        preset.lowerLeg +
        preset.hand +
        preset.foot);
  const scale = total > maxDots && total > 0 ? maxDots / total : 1;
  return {
    torso: Math.floor(preset.torso * scale),
    head: Math.floor(preset.head * scale),
    upperArm: Math.floor(preset.upperArm * scale),
    forearm: Math.floor(preset.forearm * scale),
    thigh: Math.floor(preset.thigh * scale),
    lowerLeg: Math.floor(preset.lowerLeg * scale),
    hand: Math.floor(preset.hand * scale),
    foot: Math.floor(preset.foot * scale),
    maxDots,
    connectionMaxLines: Math.round(
      clamp(options.connectionMaxLines ?? preset.connectionMaxLines, 0, 160)
    ),
  };
}

export function generateTorsoBodyDotSeeds(count: number): readonly TorsoBodyDotSeed[] {
  const safeCount = Math.max(0, Math.round(count));
  const cached = TORSO_SEED_CACHE.get(safeCount);
  if (cached) return cached;
  const seeds: TorsoBodyDotSeed[] = [];
  for (let i = 0; i < safeCount; i++) {
    const v = 0.035 + hashUnit('body-torso:v', i) * 0.93;
    const lateral = (hashUnit('body-torso:u', i) - 0.5) * 2;
    const edgeScale = 0.78 + 0.16 * Math.sin(Math.PI * v);
    seeds.push({
      u: 0.5 + lateral * edgeScale * 0.5,
      v,
      radiusSeed: hashUnit('body-torso:r', i),
      opacitySeed: hashUnit('body-torso:o', i),
    });
  }
  TORSO_SEED_CACHE.set(safeCount, seeds);
  return seeds;
}

export function generateHeadBodyDotSeeds(count: number): readonly EllipseDotSeed[] {
  return getEllipseSeeds(HEAD_SEED_CACHE, count, 'body-head', 0.9);
}

export function generateCapsuleDotSeeds(
  count: number,
  namespace = 'capsule'
): readonly CapsuleDotSeed[] {
  const safeCount = Math.max(0, Math.round(count));
  const key = `${namespace}:${safeCount}`;
  const cached = CAPSULE_SEED_CACHE.get(key);
  if (cached) return cached;
  const seeds: CapsuleDotSeed[] = [];
  for (let i = 0; i < safeCount; i++) {
    const side = hashUnit(`${namespace}:side`, i) < 0.5 ? -1 : 1;
    const radial = Math.sqrt(hashUnit(`${namespace}:radial`, i)) * side;
    seeds.push({
      t: 0.04 + hashUnit(`${namespace}:t`, i) * 0.92,
      radial,
      tangentJitter: (hashUnit(`${namespace}:j`, i) - 0.5) * 0.028,
      radiusSeed: hashUnit(`${namespace}:r`, i),
      opacitySeed: hashUnit(`${namespace}:o`, i),
    });
  }
  CAPSULE_SEED_CACHE.set(key, seeds);
  return seeds;
}

export function mapPointCloudTorsoSeedToPoint(
  seed: TorsoBodyDotSeed,
  torso: TorsoEstimate
): Point {
  const left = lerpPoint(torso.leftShoulder, torso.leftHip, seed.v);
  const right = lerpPoint(torso.rightShoulder, torso.rightHip, seed.v);
  return lerpPoint(left, right, clamp(seed.u, 0, 1));
}

export function mapHeadBodySeedToPoint(seed: EllipseDotSeed, estimate: HeadEstimate): Point {
  return {
    x: estimate.center.x + (seed.u * 2 - 1) * estimate.rx,
    y: estimate.center.y + (seed.v * 2 - 1) * estimate.ry,
  };
}

export function mapCapsuleSeedToPoint(
  seed: CapsuleDotSeed,
  start: Point,
  end: Point,
  startHalfWidth: number,
  endHalfWidth: number
): Point {
  const t = clamp(seed.t + seed.tangentJitter, 0, 1);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const halfWidth = lerp(startHalfWidth, endHalfWidth, t);
  return {
    x: start.x + dx * t + nx * seed.radial * halfWidth,
    y: start.y + dy * t + ny * seed.radial * halfWidth,
  };
}

function appendTorso(
  pose: ScreenPoseLandmarks,
  out: PointCloudBodyGeometry,
  count: number,
  minConfidence: number,
  bodyRef: number,
  radiusMultiplier: number,
  showConnections: boolean,
  connectionMaxLines: number
): void {
  if (count <= 0) return;
  const torso = getTorsoEstimate(pose, minConfidence);
  if (torso === null || torso.confidence < minConfidence) {
    out.skippedBodyPartCount++;
    return;
  }

  const seeds = generateTorsoBodyDotSeeds(count);
  let previousX = 0;
  let previousY = 0;
  let hasPrevious = false;
  for (let i = 0; i < seeds.length && out.dotCount < out.dotXs.length; i++) {
    const point = mapPointCloudTorsoSeedToPoint(seeds[i], torso);
    const radius = clamp(bodyRef * (0.0036 + seeds[i].radiusSeed * 0.0032) * radiusMultiplier, 0.8, 2.55);
    const soft = seeds[i].opacitySeed < 0.26 || torso.estimated;
    addDot(out, 'torso', point.x, point.y, radius, soft);
    if (showConnections && hasPrevious && i % 5 === 0) {
      addConnection(out, previousX, previousY, point.x, point.y, connectionMaxLines);
    }
    previousX = point.x;
    previousY = point.y;
    hasPrevious = true;
  }
  out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(torso.confidence, minConfidence));
}

function appendHead(
  pose: ScreenPoseLandmarks,
  out: PointCloudBodyGeometry,
  count: number,
  minConfidence: number,
  bodyRef: number,
  radiusMultiplier: number,
  showConnections: boolean,
  connectionMaxLines: number
): void {
  if (count <= 0) return;
  const head = getHeadEstimate(pose, minConfidence);
  if (head === null || head.confidence < minConfidence * 0.45) {
    out.skippedBodyPartCount++;
    return;
  }

  const seeds = generateHeadBodyDotSeeds(count);
  let previousX = 0;
  let previousY = 0;
  let hasPrevious = false;
  for (let i = 0; i < seeds.length && out.dotCount < out.dotXs.length; i++) {
    const point = mapHeadBodySeedToPoint(seeds[i], head);
    const radius = clamp(bodyRef * (0.0035 + seeds[i].radiusSeed * 0.0025) * radiusMultiplier, 0.78, 2.25);
    const soft = seeds[i].opacitySeed < 0.32 || head.confidence < 0.58;
    addDot(out, 'head', point.x, point.y, radius, soft);
    if (showConnections && hasPrevious && i % 6 === 0) {
      addConnection(out, previousX, previousY, point.x, point.y, connectionMaxLines);
    }
    previousX = point.x;
    previousY = point.y;
    hasPrevious = true;
  }
  out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(head.confidence, minConfidence));
}

function appendLimbCapsule(
  pose: ScreenPoseLandmarks,
  out: PointCloudBodyGeometry,
  part: PointCloudBodyPart,
  startLm: LM,
  endLm: LM,
  count: number,
  minConfidence: number,
  bodyRef: number,
  startWidthFactor: number,
  endWidthFactor: number,
  radiusMultiplier: number,
  showConnections: boolean,
  connectionMaxLines: number
): void {
  if (count <= 0) return;
  if (!landmarkIsRenderable(pose, startLm, minConfidence) || !landmarkIsRenderable(pose, endLm, minConfidence)) {
    out.skippedBodyPartCount++;
    return;
  }

  const start = pointFor(pose, startLm);
  const end = pointFor(pose, endLm);
  const confidence = Math.min(landmarkConfidence(pose, startLm), landmarkConfidence(pose, endLm));
  const seeds = generateCapsuleDotSeeds(count, part);
  const startHalfWidth = bodyRef * startWidthFactor;
  const endHalfWidth = bodyRef * endWidthFactor;
  let previousX = 0;
  let previousY = 0;
  let hasPrevious = false;

  for (let i = 0; i < seeds.length && out.dotCount < out.dotXs.length; i++) {
    const seed = seeds[i];
    const t = clamp(seed.t + seed.tangentJitter, 0, 1);
    const point = mapCapsuleSeedToPoint(seed, start, end, startHalfWidth, endHalfWidth);
    const widthAtT = lerp(startHalfWidth, endHalfWidth, t);
    const radius = clamp(widthAtT * (0.085 + seed.radiusSeed * 0.06) * radiusMultiplier, 0.72, 2.1);
    const soft = seed.opacitySeed < 0.26 || confidence < 0.56;
    addDot(out, part, point.x, point.y, radius, soft);
    if (showConnections && hasPrevious && i % 5 === 0) {
      addConnection(out, previousX, previousY, point.x, point.y, connectionMaxLines);
    }
    previousX = point.x;
    previousY = point.y;
    hasPrevious = true;
  }
  out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(confidence, minConfidence));
}

function appendExtremityCluster(
  pose: ScreenPoseLandmarks,
  out: PointCloudBodyGeometry,
  part: PointCloudBodyPart,
  centerLm: LM,
  directionLm: LM,
  count: number,
  minConfidence: number,
  bodyRef: number,
  radiusXFactor: number,
  radiusYFactor: number,
  radiusMultiplier: number,
  showConnections: boolean,
  connectionMaxLines: number
): void {
  if (count <= 0) return;
  if (!landmarkIsRenderable(pose, centerLm, minConfidence)) {
    out.skippedBodyPartCount++;
    return;
  }

  const center = pointFor(pose, centerLm);
  const direction = landmarkIsRenderable(pose, directionLm, minConfidence * 0.75)
    ? normalize({
        x: pose.xs[directionLm] - center.x,
        y: pose.ys[directionLm] - center.y,
      })
    : { x: 1, y: 0 };
  const normal = { x: -direction.y, y: direction.x };
  const confidence = Math.min(
    landmarkConfidence(pose, centerLm),
    landmarkConfidence(pose, directionLm) > 0 ? Math.max(minConfidence, landmarkConfidence(pose, directionLm)) : 1
  );
  const rx = bodyRef * radiusXFactor;
  const ry = bodyRef * radiusYFactor;
  const seeds = getEllipseSeeds(CLUSTER_SEED_CACHE, count, `cluster-${count}`, 0.92);
  let previousX = 0;
  let previousY = 0;
  let hasPrevious = false;

  for (let i = 0; i < seeds.length && out.dotCount < out.dotXs.length; i++) {
    const localX = (seeds[i].u * 2 - 1) * rx;
    const localY = (seeds[i].v * 2 - 1) * ry;
    const x = center.x + direction.x * localX + normal.x * localY;
    const y = center.y + direction.y * localX + normal.y * localY;
    const radius = clamp(bodyRef * (0.0034 + seeds[i].radiusSeed * 0.0023) * radiusMultiplier, 0.7, 1.9);
    const soft = seeds[i].opacitySeed < 0.36 || confidence < 0.58;
    addDot(out, part, x, y, radius, soft);
    if (showConnections && hasPrevious && i % 4 === 0) {
      addConnection(out, previousX, previousY, x, y, connectionMaxLines);
    }
    previousX = x;
    previousY = y;
    hasPrevious = true;
  }
  out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(confidence, minConfidence));
}

function appendKeypoints(
  pose: ScreenPoseLandmarks,
  out: PointCloudBodyGeometry,
  minConfidence: number,
  bodyRef: number,
  radiusMultiplier: number
): void {
  const radius = clamp(bodyRef * 0.0062 * radiusMultiplier, 1.15, 2.65);
  for (let i = 0; i < KEYPOINTS.length && out.dotCount < out.dotXs.length; i++) {
    const lm = KEYPOINTS[i];
    if (!landmarkIsRenderable(pose, lm, minConfidence)) continue;
    out.dotXs[out.dotCount] = pose.xs[lm];
    out.dotYs[out.dotCount] = pose.ys[lm];
    out.dotCount++;
    out.keypointDotPath += circlePath(pose.xs[lm], pose.ys[lm], radius);
    out.keypointDotCount++;
  }
}

function addDot(
  out: PointCloudBodyGeometry,
  part: PointCloudBodyPart,
  x: number,
  y: number,
  radius: number,
  soft: boolean
): void {
  if (out.dotCount >= out.dotXs.length) return;
  out.dotXs[out.dotCount] = x;
  out.dotYs[out.dotCount] = y;
  out.dotCount++;
  out.bodyPartDotCounts[part]++;
  const path = circlePath(x, y, radius);
  switch (part) {
    case 'torso':
      out.torsoXs[out.torsoDotCount] = x;
      out.torsoYs[out.torsoDotCount] = y;
      out.torsoDotCount++;
      if (soft) out.softTorsoDotPath += path;
      else out.torsoDotPath += path;
      break;
    case 'head':
      out.headXs[out.headDotCount] = x;
      out.headYs[out.headDotCount] = y;
      out.headDotCount++;
      if (soft) out.softHeadDotPath += path;
      else out.headDotPath += path;
      break;
    case 'leftUpperArm':
    case 'rightUpperArm':
      out.upperArmDotCount++;
      if (soft) out.softLimbDotPath += path;
      else out.limbDotPath += path;
      break;
    case 'leftForearm':
    case 'rightForearm':
      out.forearmDotCount++;
      if (soft) out.softLimbDotPath += path;
      else out.limbDotPath += path;
      break;
    case 'leftThigh':
    case 'rightThigh':
      out.thighDotCount++;
      if (soft) out.softLimbDotPath += path;
      else out.limbDotPath += path;
      break;
    case 'leftLowerLeg':
    case 'rightLowerLeg':
      out.lowerLegDotCount++;
      if (soft) out.softLimbDotPath += path;
      else out.limbDotPath += path;
      break;
    case 'leftHand':
    case 'rightHand':
      out.handDotCount++;
      if (soft) out.softExtremityDotPath += path;
      else out.extremityDotPath += path;
      break;
    case 'leftFoot':
    case 'rightFoot':
      out.footDotCount++;
      if (soft) out.softExtremityDotPath += path;
      else out.extremityDotPath += path;
      break;
  }
}

function addConnection(
  out: PointCloudBodyGeometry,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  maxLines: number
): void {
  if (out.connectionLineCount >= maxLines) return;
  out.connectionPath += `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`;
  out.connectionLineCount++;
}

function estimateBodyReference(pose: ScreenPoseLandmarks): number {
  const leftShoulder = pointFor(pose, LM.LEFT_SHOULDER);
  const rightShoulder = pointFor(pose, LM.RIGHT_SHOULDER);
  const leftHip = pointFor(pose, LM.LEFT_HIP);
  const rightHip = pointFor(pose, LM.RIGHT_HIP);
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const hipWidth = distance(leftHip, rightHip);
  const torsoHeight = distance(midpoint(leftShoulder, rightShoulder), midpoint(leftHip, rightHip));
  return clamp(Math.max(shoulderWidth * 2.7, hipWidth * 2.5, torsoHeight * 1.4, 90), 90, 380);
}

function getEllipseSeeds(
  cache: Map<number, readonly EllipseDotSeed[]>,
  count: number,
  namespace: string,
  maxRadius: number
): readonly EllipseDotSeed[] {
  const safeCount = Math.max(0, Math.round(count));
  const cached = cache.get(safeCount);
  if (cached) return cached;
  const seeds: EllipseDotSeed[] = [];
  for (let i = 0; i < safeCount; i++) {
    const angle = hashUnit(`${namespace}:angle`, i) * Math.PI * 2;
    const radius = Math.sqrt(hashUnit(`${namespace}:distance`, i)) * maxRadius;
    seeds.push({
      u: 0.5 + Math.cos(angle) * radius * 0.5,
      v: 0.5 + Math.sin(angle) * radius * 0.5,
      radiusSeed: hashUnit(`${namespace}:r`, i),
      opacitySeed: hashUnit(`${namespace}:o`, i),
    });
  }
  cache.set(safeCount, seeds);
  return seeds;
}

function createBodyPartCountMap(): Record<PointCloudBodyPart, number> {
  return {
    torso: 0,
    head: 0,
    leftUpperArm: 0,
    rightUpperArm: 0,
    leftForearm: 0,
    rightForearm: 0,
    leftThigh: 0,
    rightThigh: 0,
    leftLowerLeg: 0,
    rightLowerLeg: 0,
    leftHand: 0,
    rightHand: 0,
    leftFoot: 0,
    rightFoot: 0,
  };
}

function landmarkIsRenderable(
  pose: ScreenPoseLandmarks,
  lm: LM,
  minConfidence: number
): boolean {
  return (
    lm >= 0 &&
    lm < LANDMARK_COUNT &&
    Number.isFinite(pose.xs[lm]) &&
    Number.isFinite(pose.ys[lm]) &&
    landmarkConfidence(pose, lm) >= minConfidence
  );
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(pose.visibility[lm], pose.presence[lm]);
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence) / Math.max(0.01, 1 - minConfidence), 0.2, 1);
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(point: Point): Point {
  const len = Math.hypot(point.x, point.y) || 1;
  return { x: point.x / len, y: point.y / len };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function circlePath(cx: number, cy: number, r: number): string {
  const R = f(r);
  return `M${f(cx - r)} ${f(cy)}a${R} ${R} 0 1 0 ${f(2 * r)} 0a${R} ${R} 0 1 0 ${f(-2 * r)} 0Z`;
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
