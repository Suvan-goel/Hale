import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
  type TorsoEstimate,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export interface VolumetricShadowGeometry {
  hasPose: boolean;
  haloPath: string;
  bodyPath: string;
  corePath: string;
  accentPath: string;
  dotCount: number;
  haloDotCount: number;
  bodyDotCount: number;
  coreDotCount: number;
  accentDotCount: number;
  surfacePathCount: number;
  skippedPartCount: number;
  opacity: number;
}

export interface VolumetricShadowGeometryOptions {
  minConfidence?: number;
  maxDots?: number;
}

interface RegionSeed {
  u: number;
  v: number;
  radial: number;
  tangent: number;
  radius: number;
  layer: number;
}

type Layer = 'halo' | 'body' | 'core' | 'accent';

const DEFAULT_MIN_CONFIDENCE = 0.35;
const DEFAULT_MAX_DOTS = 564;
const ABSOLUTE_MAX_DOTS = 3600;
const REGION_SEED_CACHE = new Map<string, readonly RegionSeed[]>();

const DEFAULT_COUNTS = {
  torso: 230,
  neck: 24,
  head: 86,
  upperArm: 20,
  forearm: 18,
  thigh: 34,
  lowerLeg: 24,
  hand: 8,
  foot: 8,
} as const;

export function createVolumetricShadowGeometry(): VolumetricShadowGeometry {
  return {
    hasPose: false,
    haloPath: '',
    bodyPath: '',
    corePath: '',
    accentPath: '',
    dotCount: 0,
    haloDotCount: 0,
    bodyDotCount: 0,
    coreDotCount: 0,
    accentDotCount: 0,
    surfacePathCount: 0,
    skippedPartCount: 0,
    opacity: 0,
  };
}

export function emptyVolumetricShadowGeometry(out: VolumetricShadowGeometry): void {
  out.hasPose = false;
  out.haloPath = '';
  out.bodyPath = '';
  out.corePath = '';
  out.accentPath = '';
  out.dotCount = 0;
  out.haloDotCount = 0;
  out.bodyDotCount = 0;
  out.coreDotCount = 0;
  out.accentDotCount = 0;
  out.surfacePathCount = 0;
  out.skippedPartCount = 0;
  out.opacity = 0;
}

export function buildVolumetricShadowGeometry(
  pose: ScreenPoseLandmarks,
  out: VolumetricShadowGeometry,
  options: VolumetricShadowGeometryOptions = {}
): void {
  emptyVolumetricShadowGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const maxDots = clamp(Math.round(options.maxDots ?? DEFAULT_MAX_DOTS), 80, ABSOLUTE_MAX_DOTS);
  const scale = maxDots / DEFAULT_MAX_DOTS;
  const torso = getTorsoEstimate(pose, minConfidence);
  if (torso === null || torso.confidence < minConfidence * 0.72) return;

  const bodyRef = estimateBodyReference(torso);
  const head = getHeadEstimate(pose, minConfidence) ?? synthesizeHead(torso, bodyRef);
  appendTorsoVolume(torso, bodyRef, Math.round(DEFAULT_COUNTS.torso * scale), out);
  appendHeadVolume(head, bodyRef, Math.round(DEFAULT_COUNTS.head * scale), out);
  appendNeckVolume(torso, head, bodyRef, Math.round(DEFAULT_COUNTS.neck * scale), out);

  appendArmVolume(
    pose,
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.upperArm * scale),
    Math.round(DEFAULT_COUNTS.forearm * scale),
    out
  );
  appendArmVolume(
    pose,
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.upperArm * scale),
    Math.round(DEFAULT_COUNTS.forearm * scale),
    out
  );
  appendLegVolume(
    pose,
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.thigh * scale),
    Math.round(DEFAULT_COUNTS.lowerLeg * scale),
    out
  );
  appendLegVolume(
    pose,
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.thigh * scale),
    Math.round(DEFAULT_COUNTS.lowerLeg * scale),
    out
  );
  appendHandVolume(
    pose,
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    LM.LEFT_PINKY,
    LM.LEFT_THUMB,
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.hand * scale),
    out
  );
  appendHandVolume(
    pose,
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    LM.RIGHT_PINKY,
    LM.RIGHT_THUMB,
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.hand * scale),
    out
  );
  appendExtremityVolume(
    pose,
    LM.LEFT_ANKLE,
    [LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX],
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.foot * scale),
    out,
    'foot'
  );
  appendExtremityVolume(
    pose,
    LM.RIGHT_ANKLE,
    [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
    minConfidence,
    bodyRef,
    Math.round(DEFAULT_COUNTS.foot * scale),
    out,
    'foot'
  );

  out.surfacePathCount =
    (out.haloPath ? 1 : 0) +
    (out.bodyPath ? 1 : 0) +
    (out.corePath ? 1 : 0) +
    (out.accentPath ? 1 : 0);
  out.hasPose = out.dotCount > 0;
  out.opacity = confidenceOpacity(torso.confidence, minConfidence);
}

export function isFiniteVolumetricShadowGeometry(geometry: VolumetricShadowGeometry): boolean {
  const path = `${geometry.haloPath}${geometry.bodyPath}${geometry.corePath}${geometry.accentPath}`;
  return (
    Number.isFinite(geometry.dotCount) &&
    Number.isFinite(geometry.surfacePathCount) &&
    Number.isFinite(geometry.opacity) &&
    !path.includes('NaN') &&
    !path.includes('Infinity')
  );
}

function appendTorsoVolume(
  torso: TorsoEstimate,
  bodyRef: number,
  count: number,
  out: VolumetricShadowGeometry
): void {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const side = normalize({
    x: torso.rightShoulder.x - torso.leftShoulder.x,
    y: torso.rightShoulder.y - torso.leftShoulder.y,
  });
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const seeds = seedsFor('torso', count);

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const v = seed.v;
    const center = lerpPoint(shoulderMid, hipMid, v);
    const halfWidth =
      distance(
        lerpPoint(torso.leftShoulder, torso.leftHip, v),
        lerpPoint(torso.rightShoulder, torso.rightHip, v)
      ) *
      0.5 *
      torsoWidthProfile(v);
    const radial = seed.radial * halfWidth;
    const point = add(center, side, radial, down, seed.tangent * bodyRef * 0.018);
    const edge = Math.abs(seed.radial);
    const radius = stippleRadius(bodyRef, seed, edge, 1);
    addDot(out, point, radius, layerFor(seed, edge, 'torso'));
  }
}

function appendHeadVolume(
  head: HeadEstimate,
  bodyRef: number,
  count: number,
  out: VolumetricShadowGeometry
): void {
  const seeds = seedsFor('head', count);
  const rx = clamp(head.rx * 0.96, bodyRef * 0.13, bodyRef * 0.22);
  const ry = clamp(head.ry * 0.96, rx * 1.12, rx * 1.32);
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const angle = seed.u * Math.PI * 2;
    const r = Math.sqrt(seed.v) * 0.92;
    const point = {
      x: head.center.x + Math.cos(angle) * r * rx,
      y: head.center.y + Math.sin(angle) * r * ry,
    };
    addDot(
      out,
      point,
      stippleRadius(bodyRef, seed, r, 0.96),
      layerFor(seed, r, 'head')
    );
  }
}

function appendNeckVolume(
  torso: TorsoEstimate,
  head: HeadEstimate,
  bodyRef: number,
  count: number,
  out: VolumetricShadowGeometry
): void {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const a = add(head.center, down, head.ry * 0.62);
  const b = add(shoulderMid, down, -bodyRef * 0.08);
  appendCapsuleDots(a, b, bodyRef * 0.052, bodyRef * 0.07, seedsFor('neck', count), bodyRef, out, 'neck');
}

function appendHandVolume(
  pose: ScreenPoseLandmarks,
  wristLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  thumbLm: LM,
  minConfidence: number,
  bodyRef: number,
  count: number,
  out: VolumetricShadowGeometry
): void {
  if (!landmarkRenderable(pose, wristLm, minConfidence)) {
    out.skippedPartCount++;
    return;
  }

  const wrist = pointFor(pose, wristLm);
  let distalX = 0;
  let distalY = 0;
  let distalCount = 0;
  if (landmarkRenderable(pose, indexLm, minConfidence)) {
    distalX += pose.xs[indexLm];
    distalY += pose.ys[indexLm];
    distalCount++;
  }
  if (landmarkRenderable(pose, pinkyLm, minConfidence)) {
    distalX += pose.xs[pinkyLm];
    distalY += pose.ys[pinkyLm];
    distalCount++;
  }
  if (landmarkRenderable(pose, thumbLm, minConfidence)) {
    distalX += pose.xs[thumbLm];
    distalY += pose.ys[thumbLm];
    distalCount++;
  }

  if (distalCount === 0) {
    appendCapsuleDots(
      wrist,
      add(wrist, { x: 0, y: 1 }, bodyRef * 0.038),
      bodyRef * 0.028,
      bodyRef * 0.022,
      seedsFor(`hand-fallback-${wristLm}`, count),
      bodyRef,
      out,
      'extremity'
    );
    return;
  }

  const distalMid = { x: distalX / distalCount, y: distalY / distalCount };
  const palmCenter = lerpPoint(wrist, distalMid, 0.48);
  const palmCount = Math.max(2, Math.round(count * 0.42));
  appendCapsuleDots(
    wrist,
    palmCenter,
    bodyRef * 0.028,
    bodyRef * 0.036,
    seedsFor(`hand-palm-${wristLm}`, palmCount),
    bodyRef,
    out,
    'extremity'
  );

  const branchCount = Math.max(1, Math.round((count - palmCount) / distalCount));
  appendHandBranch(pose, palmCenter, indexLm, minConfidence, bodyRef, branchCount, wristLm, out);
  appendHandBranch(pose, palmCenter, pinkyLm, minConfidence, bodyRef, branchCount, wristLm, out);
  appendHandBranch(pose, palmCenter, thumbLm, minConfidence, bodyRef, branchCount, wristLm, out);
}

function appendHandBranch(
  pose: ScreenPoseLandmarks,
  palmCenter: Point,
  distalLm: LM,
  minConfidence: number,
  bodyRef: number,
  count: number,
  namespaceLm: LM,
  out: VolumetricShadowGeometry
): void {
  if (!landmarkRenderable(pose, distalLm, minConfidence)) return;
  appendCapsuleDots(
    palmCenter,
    pointFor(pose, distalLm),
    bodyRef * 0.014,
    bodyRef * 0.006,
    seedsFor(`hand-branch-${namespaceLm}-${distalLm}`, count),
    bodyRef,
    out,
    'extremity'
  );
}

function appendArmVolume(
  pose: ScreenPoseLandmarks,
  shoulderLm: LM,
  elbowLm: LM,
  wristLm: LM,
  minConfidence: number,
  bodyRef: number,
  upperCount: number,
  lowerCount: number,
  out: VolumetricShadowGeometry
): void {
  if (
    !landmarkRenderable(pose, shoulderLm, minConfidence) ||
    !landmarkRenderable(pose, elbowLm, minConfidence) ||
    !landmarkRenderable(pose, wristLm, minConfidence)
  ) {
    out.skippedPartCount++;
    return;
  }
  const shoulder = pointFor(pose, shoulderLm);
  const elbow = pointFor(pose, elbowLm);
  const wrist = pointFor(pose, wristLm);
  appendCapsuleDots(shoulder, elbow, bodyRef * 0.06, bodyRef * 0.047, seedsFor(`upper-arm-${shoulderLm}`, upperCount), bodyRef, out, 'limb');
  appendCapsuleDots(elbow, wrist, bodyRef * 0.047, bodyRef * 0.032, seedsFor(`forearm-${shoulderLm}`, lowerCount), bodyRef, out, 'limb');
}

function appendLegVolume(
  pose: ScreenPoseLandmarks,
  hipLm: LM,
  kneeLm: LM,
  ankleLm: LM,
  minConfidence: number,
  bodyRef: number,
  thighCount: number,
  lowerCount: number,
  out: VolumetricShadowGeometry
): void {
  if (
    !landmarkRenderable(pose, hipLm, minConfidence) ||
    !landmarkRenderable(pose, kneeLm, minConfidence) ||
    !landmarkRenderable(pose, ankleLm, minConfidence)
  ) {
    out.skippedPartCount++;
    return;
  }
  const hip = pointFor(pose, hipLm);
  const knee = pointFor(pose, kneeLm);
  const ankle = pointFor(pose, ankleLm);
  appendCapsuleDots(hip, knee, bodyRef * 0.082, bodyRef * 0.052, seedsFor(`thigh-${hipLm}`, thighCount), bodyRef, out, 'limb');
  appendCapsuleDots(knee, ankle, bodyRef * 0.058, bodyRef * 0.034, seedsFor(`lower-leg-${hipLm}`, lowerCount), bodyRef, out, 'limb');
}

function appendExtremityVolume(
  pose: ScreenPoseLandmarks,
  rootLm: LM,
  distalLms: readonly LM[],
  minConfidence: number,
  bodyRef: number,
  count: number,
  out: VolumetricShadowGeometry,
  namespace: string
): void {
  if (!landmarkRenderable(pose, rootLm, minConfidence)) {
    out.skippedPartCount++;
    return;
  }
  const root = pointFor(pose, rootLm);
  const distal = averageRenderablePoints(pose, distalLms, minConfidence) ?? root;
  const size = namespace === 'foot' ? bodyRef * 0.045 : bodyRef * 0.034;
  appendCapsuleDots(root, distal, size, size * 0.9, seedsFor(`${namespace}-${rootLm}`, count), bodyRef, out, 'extremity');
}

function appendCapsuleDots(
  a: Point,
  b: Point,
  startWidth: number,
  endWidth: number,
  seeds: readonly RegionSeed[],
  bodyRef: number,
  out: VolumetricShadowGeometry,
  role: string
): void {
  const dir = normalize({ x: b.x - a.x, y: b.y - a.y });
  const n = normal(dir);
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const t = seed.v;
    const center = lerpPoint(a, b, t);
    const width = startWidth + (endWidth - startWidth) * t;
    const point = add(center, n, seed.radial * width, dir, seed.tangent * bodyRef * 0.012);
    const edge = Math.abs(seed.radial);
    const radius = stippleRadius(bodyRef, seed, edge, role === 'extremity' ? 0.82 : 0.94);
    addDot(out, point, radius, layerFor(seed, edge, role));
  }
}

function addDot(out: VolumetricShadowGeometry, point: Point, radius: number, layer: Layer): void {
  out.dotCount++;
  const path = circlePath(point.x, point.y, radius);
  if (layer === 'halo') {
    out.haloPath += path;
    out.haloDotCount++;
  } else if (layer === 'core') {
    out.corePath += path;
    out.coreDotCount++;
  } else if (layer === 'accent') {
    out.accentPath += path;
    out.accentDotCount++;
  } else {
    out.bodyPath += path;
    out.bodyDotCount++;
  }
}

function layerFor(seed: RegionSeed, edge: number, role: string): Layer {
  if ((role === 'torso' || role === 'head') && seed.layer > 0.992 && edge < 0.46) return 'accent';
  if (edge > 0.88 || seed.layer < 0.08) return 'halo';
  if (edge < 0.52 && seed.layer > 0.5) return 'core';
  return 'body';
}

function stippleRadius(
  bodyRef: number,
  seed: RegionSeed,
  edge: number,
  scale: number
): number {
  const centerBoost = 1 - Math.min(0.5, Math.abs(edge) * 0.28);
  return clamp(bodyRef * (0.0039 + seed.radius * 0.0062) * centerBoost * scale, 0.34, 1.08);
}

function seedsFor(namespace: string, count: number): readonly RegionSeed[] {
  const safeCount = Math.max(0, Math.round(count));
  const key = `${namespace}:${safeCount}`;
  const cached = REGION_SEED_CACHE.get(key);
  if (cached) return cached;
  const seeds: RegionSeed[] = [];
  for (let i = 0; i < safeCount; i++) {
    const radialRaw = hashUnit(`${namespace}:radial`, i) * 2 - 1;
    const radialSign = radialRaw < 0 ? -1 : 1;
    const radial = radialSign * Math.pow(Math.abs(radialRaw), 0.82);
    seeds.push({
      u: hashUnit(`${namespace}:u`, i),
      v: hashUnit(`${namespace}:v`, i),
      radial,
      tangent: (hashUnit(`${namespace}:tangent`, i) - 0.5) * 2,
      radius: hashUnit(`${namespace}:radius`, i),
      layer: hashUnit(`${namespace}:layer`, i),
    });
  }
  REGION_SEED_CACHE.set(key, seeds);
  return seeds;
}

function torsoWidthProfile(v: number): number {
  const chest = gaussian(v, 0.18, 0.18) * 0.12;
  const waist = gaussian(v, 0.63, 0.18) * 0.22;
  const hip = gaussian(v, 0.93, 0.16) * 0.16;
  return clamp(0.9 + chest + hip - waist, 0.64, 1.08);
}

function synthesizeHead(torso: TorsoEstimate, bodyRef: number): HeadEstimate {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const rx = clamp(distance(torso.leftShoulder, torso.rightShoulder) * 0.22, 15, 36);
  return {
    center: add(shoulderMid, down, -bodyRef * 0.52),
    rx,
    ry: rx * 1.22,
    confidence: torso.confidence * 0.52,
  };
}

function estimateBodyReference(torso: TorsoEstimate): number {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  return Math.max(
    distance(torso.leftShoulder, torso.rightShoulder) * 1.35,
    distance(torso.leftHip, torso.rightHip) * 1.4,
    distance(shoulderMid, hipMid),
    80
  );
}

function landmarkRenderable(pose: ScreenPoseLandmarks, lm: LM, minConfidence: number): boolean {
  const x = pose.xs[lm];
  const y = pose.ys[lm];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.min(clamp01(pose.visibility[lm]), clamp01(pose.presence[lm])) >= minConfidence;
}

function averageRenderablePoints(
  pose: ScreenPoseLandmarks,
  lms: readonly LM[],
  minConfidence: number
): Point | null {
  let x = 0;
  let y = 0;
  let count = 0;
  for (let i = 0; i < lms.length; i++) {
    const lm = lms[i];
    if (!landmarkRenderable(pose, lm, minConfidence)) continue;
    x += pose.xs[lm];
    y += pose.ys[lm];
    count++;
  }
  return count > 0 ? { x: x / count, y: y / count } : null;
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

function add(point: Point, axis: Point, amount: number): Point;
function add(point: Point, axisA: Point, amountA: number, axisB: Point, amountB: number): Point;
function add(
  point: Point,
  axisA: Point,
  amountA: number,
  axisB?: Point,
  amountB = 0
): Point {
  return {
    x: point.x + axisA.x * amountA + (axisB?.x ?? 0) * amountB,
    y: point.y + axisA.y * amountA + (axisB?.y ?? 0) * amountB,
  };
}

function normal(point: Point): Point {
  return { x: -point.y, y: point.x };
}

function normalize(point: Point): Point {
  const len = Math.hypot(point.x, point.y);
  if (!Number.isFinite(len) || len < 0.0001) return { x: 0, y: 1 };
  return { x: point.x / len, y: point.y / len };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence * 0.56) / Math.max(0.01, 1 - minConfidence), 0.32, 1);
}

function gaussian(x: number, center: number, width: number): number {
  const z = (x - center) / width;
  return Math.exp(-z * z);
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

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function f(value: number): string {
  return value.toFixed(1);
}
