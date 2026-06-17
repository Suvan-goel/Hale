import { LM } from '../pose/types';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export interface Point {
  x: number;
  y: number;
}

export interface VolumeDotSeed {
  u: number;
  v: number;
  offsetXNorm: number;
  offsetYNorm: number;
  radiusSeed: number;
  opacitySeed: number;
}

export interface HeadEstimate {
  center: Point;
  rx: number;
  ry: number;
  confidence: number;
}

export interface TorsoEstimate {
  leftShoulder: Point;
  rightShoulder: Point;
  leftHip: Point;
  rightHip: Point;
  confidence: number;
  estimated: boolean;
}

export interface BodyVolumeGeometryOptions {
  minConfidence?: number;
  bodyVolumeEnabled?: boolean;
  torsoVolumeEnabled?: boolean;
  headVolumeEnabled?: boolean;
  shoulderHipDensityEnabled?: boolean;
  maxVolumeDots?: number;
  torsoDotCount?: number;
  headDotCount?: number;
  shoulderHipDotCount?: number;
  radiusMultiplier?: number;
}

export interface BodyVolumeGeometry {
  torsoDotPath: string;
  softTorsoDotPath: string;
  headDotPath: string;
  softHeadDotPath: string;
  accentDotPath: string;
  torsoXs: Float64Array;
  torsoYs: Float64Array;
  headXs: Float64Array;
  headYs: Float64Array;
  accentXs: Float64Array;
  accentYs: Float64Array;
  torsoDotCount: number;
  headDotCount: number;
  accentDotCount: number;
  volumeDotCount: number;
  skippedVolumeSections: number;
  opacityScale: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const TORSO_SEED_CACHE = new Map<number, readonly VolumeDotSeed[]>();
const HEAD_SEED_CACHE = new Map<number, readonly VolumeDotSeed[]>();
const ACCENT_SEED_CACHE = new Map<number, readonly VolumeDotSeed[]>();

export function createBodyVolumeGeometry(maxVolumeDots = 180): BodyVolumeGeometry {
  return {
    torsoDotPath: '',
    softTorsoDotPath: '',
    headDotPath: '',
    softHeadDotPath: '',
    accentDotPath: '',
    torsoXs: new Float64Array(maxVolumeDots),
    torsoYs: new Float64Array(maxVolumeDots),
    headXs: new Float64Array(maxVolumeDots),
    headYs: new Float64Array(maxVolumeDots),
    accentXs: new Float64Array(maxVolumeDots),
    accentYs: new Float64Array(maxVolumeDots),
    torsoDotCount: 0,
    headDotCount: 0,
    accentDotCount: 0,
    volumeDotCount: 0,
    skippedVolumeSections: 0,
    opacityScale: 1,
  };
}

export function emptyBodyVolumeGeometry(out: BodyVolumeGeometry): void {
  out.torsoDotPath = '';
  out.softTorsoDotPath = '';
  out.headDotPath = '';
  out.softHeadDotPath = '';
  out.accentDotPath = '';
  out.torsoDotCount = 0;
  out.headDotCount = 0;
  out.accentDotCount = 0;
  out.volumeDotCount = 0;
  out.skippedVolumeSections = 0;
  out.opacityScale = 1;
}

export function buildBodyVolumeGeometry(
  pose: ScreenPoseLandmarks,
  out: BodyVolumeGeometry,
  options: BodyVolumeGeometryOptions = {}
): void {
  emptyBodyVolumeGeometry(out);
  if (!pose.hasPose || options.bodyVolumeEnabled !== true) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const maxVolumeDots = Math.min(options.maxVolumeDots ?? 150, out.torsoXs.length);
  const radiusMultiplier = clamp(options.radiusMultiplier ?? 1, 0.7, 1.2);
  let remaining = maxVolumeDots;

  if (options.torsoVolumeEnabled !== false && remaining > 0) {
    const torso = getTorsoEstimate(pose, minConfidence);
    if (torso !== null && torso.confidence >= minConfidence) {
      const requested = Math.min(options.torsoDotCount ?? 86, remaining);
      appendTorsoDots(torso, out, requested, radiusMultiplier);
      remaining -= out.torsoDotCount;
      out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(torso.confidence, minConfidence));
    } else {
      out.skippedVolumeSections++;
    }
  }

  if (options.headVolumeEnabled !== false && remaining > 0) {
    const head = getHeadEstimate(pose, minConfidence);
    if (head !== null && head.confidence >= minConfidence) {
      const requested = Math.min(options.headDotCount ?? 22, remaining);
      appendHeadDots(head, out, requested, radiusMultiplier);
      remaining -= out.headDotCount;
      out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(head.confidence, minConfidence));
    } else {
      out.skippedVolumeSections++;
    }
  }

  if (options.shoulderHipDensityEnabled === true && remaining > 0) {
    const torso = getTorsoEstimate(pose, minConfidence);
    if (torso !== null && torso.confidence >= minConfidence) {
      const requested = Math.min(options.shoulderHipDotCount ?? 16, remaining);
      appendShoulderHipAccents(torso, out, requested, radiusMultiplier);
    } else {
      out.skippedVolumeSections++;
    }
  }
}

export function generateTorsoDotSeeds(count: number): readonly VolumeDotSeed[] {
  return getCachedSeeds(TORSO_SEED_CACHE, count, 'torso', true);
}

export function generateHeadDotSeeds(count: number): readonly VolumeDotSeed[] {
  return getCachedSeeds(HEAD_SEED_CACHE, count, 'head', false);
}

export function getTorsoConfidence(pose: ScreenPoseLandmarks): number {
  if (!pose.hasPose) return 0;
  return Math.min(
    landmarkConfidence(pose, LM.LEFT_SHOULDER),
    landmarkConfidence(pose, LM.RIGHT_SHOULDER),
    landmarkConfidence(pose, LM.LEFT_HIP),
    landmarkConfidence(pose, LM.RIGHT_HIP)
  );
}

export function getTorsoEstimate(
  pose: ScreenPoseLandmarks,
  minConfidence = DEFAULT_MIN_CONFIDENCE
): TorsoEstimate | null {
  if (!pose.hasPose) return null;
  const leftShoulderConfidence = landmarkConfidence(pose, LM.LEFT_SHOULDER);
  const rightShoulderConfidence = landmarkConfidence(pose, LM.RIGHT_SHOULDER);
  const leftHipConfidence = landmarkConfidence(pose, LM.LEFT_HIP);
  const rightHipConfidence = landmarkConfidence(pose, LM.RIGHT_HIP);
  const fullConfidence = Math.min(
    leftShoulderConfidence,
    rightShoulderConfidence,
    leftHipConfidence,
    rightHipConfidence
  );

  if (fullConfidence >= minConfidence && torsoLandmarksFinite(pose)) {
    return {
      leftShoulder: pointFor(pose, LM.LEFT_SHOULDER),
      rightShoulder: pointFor(pose, LM.RIGHT_SHOULDER),
      leftHip: pointFor(pose, LM.LEFT_HIP),
      rightHip: pointFor(pose, LM.RIGHT_HIP),
      confidence: fullConfidence,
      estimated: false,
    };
  }

  const leftSideConfidence = Math.min(leftShoulderConfidence, leftHipConfidence);
  const rightSideConfidence = Math.min(rightShoulderConfidence, rightHipConfidence);
  const useLeft =
    leftSideConfidence >= minConfidence &&
    (leftSideConfidence >= rightSideConfidence || rightSideConfidence < minConfidence);
  const useRight = !useLeft && rightSideConfidence >= minConfidence;
  if (!useLeft && !useRight) return null;

  const shoulderLm = useLeft ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const hipLm = useLeft ? LM.LEFT_HIP : LM.RIGHT_HIP;
  if (!landmarkFinite(pose, shoulderLm) || !landmarkFinite(pose, hipLm)) return null;

  const shoulder = pointFor(pose, shoulderLm);
  const hip = pointFor(pose, hipLm);
  const torsoLen = distance(shoulder, hip);
  if (!Number.isFinite(torsoLen) || torsoLen < 12) return null;

  const axis = normalize({ x: hip.x - shoulder.x, y: hip.y - shoulder.y });
  const normal = { x: -axis.y, y: axis.x };
  const width = clamp(torsoLen * 0.24, 18, 56);
  const shoulderHalf = width * 0.56;
  const hipHalf = width * 0.5;

  return {
    leftShoulder: {
      x: shoulder.x - normal.x * shoulderHalf,
      y: shoulder.y - normal.y * shoulderHalf,
    },
    rightShoulder: {
      x: shoulder.x + normal.x * shoulderHalf,
      y: shoulder.y + normal.y * shoulderHalf,
    },
    leftHip: {
      x: hip.x - normal.x * hipHalf,
      y: hip.y - normal.y * hipHalf,
    },
    rightHip: {
      x: hip.x + normal.x * hipHalf,
      y: hip.y + normal.y * hipHalf,
    },
    confidence: Math.max(leftSideConfidence, rightSideConfidence) * 0.82,
    estimated: true,
  };
}

export function getHeadEstimate(
  pose: ScreenPoseLandmarks,
  minConfidence = DEFAULT_MIN_CONFIDENCE
): HeadEstimate | null {
  if (!pose.hasPose) return null;
  const leftShoulder = pointFor(pose, LM.LEFT_SHOULDER);
  const rightShoulder = pointFor(pose, LM.RIGHT_SHOULDER);
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const shoulderConfidence = Math.min(
    landmarkConfidence(pose, LM.LEFT_SHOULDER),
    landmarkConfidence(pose, LM.RIGHT_SHOULDER)
  );

  const noseConfidence = landmarkConfidence(pose, LM.NOSE);
  const leftEarConfidence = landmarkConfidence(pose, LM.LEFT_EAR);
  const rightEarConfidence = landmarkConfidence(pose, LM.RIGHT_EAR);
  const earsReliable = leftEarConfidence >= minConfidence && rightEarConfidence >= minConfidence;
  const noseReliable = noseConfidence >= minConfidence;

  if (earsReliable) {
    const leftEar = pointFor(pose, LM.LEFT_EAR);
    const rightEar = pointFor(pose, LM.RIGHT_EAR);
    const earMid = midpoint(leftEar, rightEar);
    const earSpan = distance(leftEar, rightEar);
    const rx = Math.max(earSpan * 0.62, shoulderWidth * 0.18, 16);
    return {
      center: noseReliable
        ? { x: (earMid.x * 2 + pose.xs[LM.NOSE]) / 3, y: (earMid.y * 2 + pose.ys[LM.NOSE]) / 3 }
        : earMid,
      rx,
      ry: rx * 1.18,
      confidence: Math.min(leftEarConfidence, rightEarConfidence, noseReliable ? noseConfidence : 1),
    };
  }

  if (noseReliable && shoulderConfidence >= minConfidence) {
    const rx = Math.max(shoulderWidth * 0.18, 16);
    return {
      center: { x: pose.xs[LM.NOSE], y: pose.ys[LM.NOSE] + rx * 0.18 },
      rx,
      ry: rx * 1.22,
      confidence: Math.min(noseConfidence, shoulderConfidence) * 0.78,
    };
  }

  if (shoulderConfidence >= minConfidence) {
    const leftHip = pointFor(pose, LM.LEFT_HIP);
    const rightHip = pointFor(pose, LM.RIGHT_HIP);
    const hipMid = midpoint(leftHip, rightHip);
    const axis = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
    const rx = Math.max(shoulderWidth * 0.18, 16);
    return {
      center: {
        x: shoulderMid.x - axis.x * shoulderWidth * 0.48,
        y: shoulderMid.y - axis.y * shoulderWidth * 0.48,
      },
      rx,
      ry: rx * 1.22,
      confidence: shoulderConfidence * 0.48,
    };
  }

  return null;
}

export function mapTorsoSeedToScreenPoint(
  seed: VolumeDotSeed,
  leftShoulder: Point,
  rightShoulder: Point,
  leftHip: Point,
  rightHip: Point
): Point {
  const top = lerpPoint(leftShoulder, rightShoulder, seed.u);
  const bottom = lerpPoint(leftHip, rightHip, seed.u);
  const base = lerpPoint(top, bottom, seed.v);
  const width = distance(top, bottom) * 0.02 + distance(leftShoulder, rightShoulder) * 0.012;
  const height = Math.max(distance(top, bottom), 1);
  const side = normalize({
    x: rightShoulder.x - leftShoulder.x + rightHip.x - leftHip.x,
    y: rightShoulder.y - leftShoulder.y + rightHip.y - leftHip.y,
  });
  const down = normalize({
    x: (leftHip.x + rightHip.x) * 0.5 - (leftShoulder.x + rightShoulder.x) * 0.5,
    y: (leftHip.y + rightHip.y) * 0.5 - (leftShoulder.y + rightShoulder.y) * 0.5,
  });
  return {
    x: base.x + side.x * seed.offsetXNorm * width + down.x * seed.offsetYNorm * height * 0.012,
    y: base.y + side.y * seed.offsetXNorm * width + down.y * seed.offsetYNorm * height * 0.012,
  };
}

export function mapHeadSeedToScreenPoint(seed: VolumeDotSeed, estimate: HeadEstimate): Point {
  return {
    x: estimate.center.x + (seed.u * 2 - 1) * estimate.rx,
    y: estimate.center.y + (seed.v * 2 - 1) * estimate.ry,
  };
}

function appendTorsoDots(
  torso: TorsoEstimate,
  out: BodyVolumeGeometry,
  count: number,
  radiusMultiplier: number
): void {
  const { leftShoulder, rightShoulder, leftHip, rightHip, confidence } = torso;
  const torsoRef = Math.max(distance(leftShoulder, leftHip), distance(rightShoulder, rightHip), 80);
  const seeds = generateTorsoDotSeeds(count);
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const edgeFalloff = torsoEdgeFalloff(seed.u, seed.v);
    if (edgeFalloff <= 0) continue;
    const point = mapTorsoSeedToScreenPoint(seed, leftShoulder, rightShoulder, leftHip, rightHip);
    const radius = clamp(torsoRef * (0.0038 + seed.radiusSeed * 0.003) * radiusMultiplier, 0.8, 2.35);
    addTorsoDot(out, point, radius, seed.opacitySeed < 0.44 || confidence < 0.58);
  }
}

function appendHeadDots(
  estimate: HeadEstimate,
  out: BodyVolumeGeometry,
  count: number,
  radiusMultiplier: number
): void {
  const seeds = generateHeadDotSeeds(count);
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const point = mapHeadSeedToScreenPoint(seed, estimate);
    const radius = clamp(estimate.rx * (0.034 + seed.radiusSeed * 0.018) * radiusMultiplier, 0.8, 2.2);
    addHeadDot(out, point, radius, seed.opacitySeed < 0.48 || estimate.confidence < 0.58);
  }
}

function appendShoulderHipAccents(
  torso: TorsoEstimate,
  out: BodyVolumeGeometry,
  count: number,
  radiusMultiplier: number
): void {
  const seeds = getCachedSeeds(ACCENT_SEED_CACHE, count, 'accent', true);
  const half = Math.ceil(seeds.length / 2);
  for (let i = 0; i < seeds.length; i++) {
    const shoulder = i < half;
    const a = shoulder ? torso.leftShoulder : torso.leftHip;
    const b = shoulder ? torso.rightShoulder : torso.rightHip;
    const line = lerpPoint(a, b, seeds[i].u);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / len, y: dx / len };
    const point = {
      x: line.x + normal.x * seeds[i].offsetYNorm * 2.4,
      y: line.y + normal.y * seeds[i].offsetYNorm * 2.4,
    };
    addAccentDot(out, point, (1.15 + seeds[i].radiusSeed * 0.75) * radiusMultiplier);
  }
}

function addTorsoDot(out: BodyVolumeGeometry, point: Point, radius: number, soft: boolean): void {
  out.torsoXs[out.torsoDotCount] = point.x;
  out.torsoYs[out.torsoDotCount] = point.y;
  out.torsoDotCount++;
  out.volumeDotCount++;
  const path = circlePath(point.x, point.y, radius);
  if (soft) out.softTorsoDotPath += path;
  else out.torsoDotPath += path;
}

function addHeadDot(out: BodyVolumeGeometry, point: Point, radius: number, soft: boolean): void {
  out.headXs[out.headDotCount] = point.x;
  out.headYs[out.headDotCount] = point.y;
  out.headDotCount++;
  out.volumeDotCount++;
  const path = circlePath(point.x, point.y, radius);
  if (soft) out.softHeadDotPath += path;
  else out.headDotPath += path;
}

function addAccentDot(out: BodyVolumeGeometry, point: Point, radius: number): void {
  out.accentXs[out.accentDotCount] = point.x;
  out.accentYs[out.accentDotCount] = point.y;
  out.accentDotCount++;
  out.volumeDotCount++;
  out.accentDotPath += circlePath(point.x, point.y, radius);
}

function getCachedSeeds(
  cache: Map<number, readonly VolumeDotSeed[]>,
  count: number,
  namespace: string,
  torsoBias: boolean
): readonly VolumeDotSeed[] {
  const safeCount = Math.max(0, Math.round(count));
  const cached = cache.get(safeCount);
  if (cached) return cached;
  const seeds: VolumeDotSeed[] = [];
  for (let i = 0; i < safeCount; i++) {
    let uRaw = hashUnit(`${namespace}:u`, i);
    let vRaw = hashUnit(`${namespace}:v`, i);
    if (namespace === 'head') {
      const angle = hashUnit(`${namespace}:angle`, i) * Math.PI * 2;
      const radius = Math.sqrt(hashUnit(`${namespace}:distance`, i)) * 0.46;
      uRaw = 0.5 + Math.cos(angle) * radius;
      vRaw = 0.5 + Math.sin(angle) * radius;
    }
    const edgeInset = torsoBias ? 0.08 : 0.04;
    const u = edgeInset + uRaw * (1 - edgeInset * 2);
    const v = edgeInset + vRaw * (1 - edgeInset * 2);
    seeds.push({
      u: torsoBias ? 0.5 + (u - 0.5) * (0.82 + 0.18 * Math.sin(Math.PI * v)) : u,
      v,
      offsetXNorm: (hashUnit(`${namespace}:ox`, i) - 0.5) * 2,
      offsetYNorm: (hashUnit(`${namespace}:oy`, i) - 0.5) * 2,
      radiusSeed: hashUnit(`${namespace}:r`, i),
      opacitySeed: hashUnit(`${namespace}:o`, i),
    });
  }
  cache.set(safeCount, seeds);
  return seeds;
}

function torsoLandmarksFinite(pose: ScreenPoseLandmarks): boolean {
  return (
    landmarkFinite(pose, LM.LEFT_SHOULDER) &&
    landmarkFinite(pose, LM.RIGHT_SHOULDER) &&
    landmarkFinite(pose, LM.LEFT_HIP) &&
    landmarkFinite(pose, LM.RIGHT_HIP)
  );
}

function landmarkFinite(pose: ScreenPoseLandmarks, lm: LM): boolean {
  return pose.hasPose && Number.isFinite(pose.xs[lm]) && Number.isFinite(pose.ys[lm]);
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(pose.visibility[lm], pose.presence[lm]);
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence) / Math.max(0.01, 1 - minConfidence), 0.22, 1);
}

function torsoEdgeFalloff(u: number, v: number): number {
  const edge = Math.min(u, 1 - u, v, 1 - v);
  return clamp(edge / 0.14, 0, 1);
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
