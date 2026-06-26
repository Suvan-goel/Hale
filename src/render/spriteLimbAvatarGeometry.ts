import { LM } from '../pose/types';
import { getHeadEstimate, getTorsoEstimate, type Point } from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export type SpriteLimbAvatarSurfaceId =
  | 'rightUpperArm'
  | 'rightForearm'
  | 'rightHand'
  | 'rightThigh'
  | 'rightLowerLeg'
  | 'rightFoot'
  | 'centralShell'
  | 'leftThigh'
  | 'leftLowerLeg'
  | 'leftFoot'
  | 'leftUpperArm'
  | 'leftForearm'
  | 'leftHand'
  | 'leftShoulderCap'
  | 'rightShoulderCap'
  | 'leftHipCap'
  | 'rightHipCap'
  | 'coreHighlight';

export type SpriteLimbAvatarFillKey = 'rear' | 'core' | 'front' | 'cap' | 'highlight';

export interface SpriteLimbAvatarSurface {
  id: SpriteLimbAvatarSurfaceId;
  path: string;
  transform: string;
  fillKey: SpriteLimbAvatarFillKey;
  opacity: number;
  confidence: number;
  visible: boolean;
  bounds: Bounds;
}

export interface SpriteLimbAvatarGeometry {
  hasPose: boolean;
  opacity: number;
  surfacePathCount: number;
  dynamicPathCount: number;
  staticTransformedShapeCount: number;
  maxSurfacePathCount: number;
  skippedPartCount: number;
  bounds: Bounds;
  surfaces: SpriteLimbAvatarSurface[];
}

export interface SpriteLimbAvatarGeometryOptions {
  minConfidence?: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const MIN_RENDER_CONFIDENCE = 0.12;
const EMPTY_BOUNDS: Bounds = {
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
};

const SURFACE_IDS: readonly SpriteLimbAvatarSurfaceId[] = [
  'rightUpperArm',
  'rightForearm',
  'rightHand',
  'rightThigh',
  'rightLowerLeg',
  'rightFoot',
  'centralShell',
  'leftThigh',
  'leftLowerLeg',
  'leftFoot',
  'leftUpperArm',
  'leftForearm',
  'leftHand',
  'leftShoulderCap',
  'rightShoulderCap',
  'leftHipCap',
  'rightHipCap',
  'coreHighlight',
];

export const SPRITE_LIMB_AVATAR_SURFACE_CAP = SURFACE_IDS.length;

export const SPRITE_LIMB_AVATAR_PATHS = {
  core:
    'M -0.075 -0.43 C -0.13 -0.5 -0.17 -0.6 -0.17 -0.72 C -0.17 -0.88 -0.08 -0.99 0 -0.99 C 0.08 -0.99 0.17 -0.88 0.17 -0.72 C 0.17 -0.6 0.13 -0.5 0.075 -0.43 C 0.075 -0.34 0.09 -0.25 0.12 -0.16 C 0.25 -0.11 0.4 -0.03 0.49 0.08 C 0.43 0.18 0.38 0.35 0.34 0.52 C 0.31 0.68 0.37 0.83 0.43 0.99 C 0.33 1.1 0.15 1.14 0 1.11 C -0.15 1.14 -0.33 1.1 -0.43 0.99 C -0.37 0.83 -0.31 0.68 -0.34 0.52 C -0.38 0.35 -0.43 0.18 -0.49 0.08 C -0.4 -0.03 -0.25 -0.11 -0.12 -0.16 C -0.09 -0.25 -0.075 -0.34 -0.075 -0.43 Z',
  upperArm:
    'M -0.86 -0.41 C -0.58 -0.54 0.58 -0.54 0.86 -0.41 C 0.76 -0.1 0.58 0.25 0.5 0.43 C 0.27 0.55 -0.27 0.55 -0.5 0.43 C -0.58 0.25 -0.76 -0.1 -0.86 -0.41 Z',
  forearm:
    'M -0.74 -0.43 C -0.45 -0.54 0.45 -0.54 0.74 -0.43 C 0.67 -0.09 0.5 0.25 0.42 0.44 C 0.2 0.54 -0.2 0.54 -0.42 0.44 C -0.5 0.25 -0.67 -0.09 -0.74 -0.43 Z',
  thigh:
    'M -0.96 -0.42 C -0.64 -0.55 0.64 -0.55 0.96 -0.42 C 0.88 -0.03 0.7 0.28 0.6 0.43 C 0.33 0.55 -0.33 0.55 -0.6 0.43 C -0.7 0.28 -0.88 -0.03 -0.96 -0.42 Z',
  lowerLeg:
    'M -0.72 -0.43 C -0.44 -0.55 0.44 -0.55 0.72 -0.43 C 0.64 -0.05 0.47 0.29 0.34 0.45 C 0.15 0.55 -0.15 0.55 -0.34 0.45 C -0.47 0.29 -0.64 -0.05 -0.72 -0.43 Z',
  hand:
    'M -0.58 -0.32 C -0.36 -0.47 0.36 -0.47 0.58 -0.32 C 0.64 -0.02 0.5 0.31 0.24 0.48 C 0.08 0.58 -0.08 0.58 -0.24 0.48 C -0.5 0.31 -0.64 -0.02 -0.58 -0.32 Z',
  foot:
    'M -0.54 -0.35 C -0.18 -0.5 0.52 -0.42 0.78 -0.17 C 0.66 0.18 0.19 0.39 -0.44 0.43 C -0.7 0.27 -0.78 -0.09 -0.54 -0.35 Z',
  cap: 'M -1 0 C -1 -0.55 -0.55 -1 0 -1 C 0.55 -1 1 -0.55 1 0 C 1 0.55 0.55 1 0 1 C -0.55 1 -1 0.55 -1 0 Z',
  highlight:
    'M -0.025 -0.1 C 0.03 0.08 0.035 0.37 0.008 0.68 C -0.03 0.44 -0.035 0.13 -0.025 -0.1 Z',
} as const;

export function createSpriteLimbAvatarGeometry(): SpriteLimbAvatarGeometry {
  return {
    hasPose: false,
    opacity: 1,
    surfacePathCount: 0,
    dynamicPathCount: 0,
    staticTransformedShapeCount: 0,
    maxSurfacePathCount: SPRITE_LIMB_AVATAR_SURFACE_CAP,
    skippedPartCount: 0,
    bounds: emptyBounds(),
    surfaces: SURFACE_IDS.map((id) => ({
      id,
      path: '',
      transform: '',
      fillKey: fillKeyForSurface(id),
      opacity: 0,
      confidence: 0,
      visible: false,
      bounds: emptyBounds(),
    })),
  };
}

export function emptySpriteLimbAvatarGeometry(out: SpriteLimbAvatarGeometry): void {
  out.hasPose = false;
  out.opacity = 1;
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.staticTransformedShapeCount = 0;
  out.skippedPartCount = 0;
  out.bounds = emptyBounds();
  for (let i = 0; i < out.surfaces.length; i++) {
    const surface = out.surfaces[i];
    surface.path = '';
    surface.transform = '';
    surface.fillKey = fillKeyForSurface(surface.id);
    surface.opacity = 0;
    surface.confidence = 0;
    surface.visible = false;
    surface.bounds = emptyBounds();
  }
}

export function buildSpriteLimbAvatarGeometry(
  pose: ScreenPoseLandmarks,
  out: SpriteLimbAvatarGeometry,
  options: SpriteLimbAvatarGeometryOptions = {}
): void {
  emptySpriteLimbAvatarGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const torso = getTorsoEstimate(pose, MIN_RENDER_CONFIDENCE);
  if (torso === null || torso.confidence < MIN_RENDER_CONFIDENCE) return;

  const leftShoulder = torso.leftShoulder;
  const rightShoulder = torso.rightShoulder;
  const leftHip = torso.leftHip;
  const rightHip = torso.rightHip;
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const bodyRef = clamp(distance(shoulderMid, hipMid), 36, 520);
  const axis = normalizeOr(sub(hipMid, shoulderMid), { x: 0, y: 1 });
  const sideAxis = normalizeOr(sub(leftShoulder, rightShoulder), { x: -axis.y, y: axis.x });
  const centralConfidence = Math.min(
    torso.confidence,
    landmarkConfidence(pose, LM.LEFT_SHOULDER),
    landmarkConfidence(pose, LM.RIGHT_SHOULDER),
    landmarkConfidence(pose, LM.LEFT_HIP),
    landmarkConfidence(pose, LM.RIGHT_HIP)
  );
  const head = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE);
  const headConfidence = head?.confidence ?? centralConfidence * 0.62;
  const coreConfidence = Math.min(1, Math.max(centralConfidence, headConfidence * 0.82));

  out.hasPose = true;
  out.opacity = opacityForConfidence(coreConfidence, minConfidence);

  setSurface(
    out,
    'centralShell',
    SPRITE_LIMB_AVATAR_PATHS.core,
    matrix(sideAxis, bodyRef, axis, bodyRef, shoulderMid),
    'core',
    Math.max(0.72, opacityForConfidence(coreConfidence, minConfidence)),
    coreConfidence,
    transformedBounds([
      { x: -0.44, y: -0.99 },
      { x: 0.44, y: -0.99 },
      { x: -0.44, y: 1.13 },
      { x: 0.44, y: 1.13 },
    ], sideAxis, bodyRef, axis, bodyRef, shoulderMid)
  );
  setSurface(
    out,
    'coreHighlight',
    SPRITE_LIMB_AVATAR_PATHS.highlight,
    matrix(sideAxis, bodyRef, axis, bodyRef, shoulderMid),
    'highlight',
    0.22 * out.opacity,
    coreConfidence,
    transformedBounds([
      { x: -0.04, y: -0.12 },
      { x: 0.04, y: -0.12 },
      { x: -0.04, y: 0.7 },
      { x: 0.04, y: 0.7 },
    ], sideAxis, bodyRef, axis, bodyRef, shoulderMid)
  );

  buildArm(pose, out, 'left', bodyRef, minConfidence);
  buildArm(pose, out, 'right', bodyRef, minConfidence);
  buildLeg(pose, out, 'left', bodyRef, minConfidence);
  buildLeg(pose, out, 'right', bodyRef, minConfidence);
  buildJointCaps(out, bodyRef, axis, sideAxis, minConfidence, {
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
    confidence: centralConfidence,
  });

  let visible = 0;
  let bounds = emptyBounds();
  for (let i = 0; i < out.surfaces.length; i++) {
    const surface = out.surfaces[i];
    if (!surface.visible) continue;
    visible++;
    bounds = includeBounds(bounds, surface.bounds);
  }
  out.surfacePathCount = visible;
  out.staticTransformedShapeCount = visible;
  out.dynamicPathCount = 0;
  out.bounds = finiteBounds(bounds) ? bounds : emptyBounds();
}

export function isFiniteSpriteLimbAvatarGeometry(geometry: SpriteLimbAvatarGeometry): boolean {
  if (
    !Number.isFinite(geometry.opacity) ||
    !Number.isFinite(geometry.surfacePathCount) ||
    !Number.isFinite(geometry.dynamicPathCount) ||
    !Number.isFinite(geometry.staticTransformedShapeCount)
  ) {
    return false;
  }
  for (let i = 0; i < geometry.surfaces.length; i++) {
    const surface = geometry.surfaces[i];
    if (
      !Number.isFinite(surface.opacity) ||
      !Number.isFinite(surface.confidence) ||
      !finiteTransform(surface.transform)
    ) {
      return false;
    }
    if (surface.visible && (!finiteBounds(surface.bounds) || surface.path.length === 0)) {
      return false;
    }
  }
  return true;
}

function buildArm(
  pose: ScreenPoseLandmarks,
  out: SpriteLimbAvatarGeometry,
  side: 'left' | 'right',
  bodyRef: number,
  minConfidence: number
): void {
  const shoulderLm = side === 'left' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const elbowLm = side === 'left' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const wristLm = side === 'left' ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
  const indexLm = side === 'left' ? LM.LEFT_INDEX : LM.RIGHT_INDEX;
  const pinkyLm = side === 'left' ? LM.LEFT_PINKY : LM.RIGHT_PINKY;
  const shoulder = pointFor(pose, shoulderLm);
  const elbow = pointFor(pose, elbowLm);
  const wrist = pointFor(pose, wristLm);
  const upperConfidence = chainConfidence(pose, shoulderLm, elbowLm);
  const forearmConfidence = chainConfidence(pose, elbowLm, wristLm);
  appendSegment(out, `${side}UpperArm`, SPRITE_LIMB_AVATAR_PATHS.upperArm, shoulder, elbow, {
    halfWidth: bodyRef * 0.07,
    gapStart: bodyRef * 0.02,
    gapEnd: bodyRef * 0.026,
    fillKey: side === 'left' ? 'front' : 'rear',
    confidence: upperConfidence,
    minConfidence,
  });
  appendSegment(out, `${side}Forearm`, SPRITE_LIMB_AVATAR_PATHS.forearm, elbow, wrist, {
    halfWidth: bodyRef * 0.056,
    gapStart: bodyRef * 0.026,
    gapEnd: bodyRef * 0.014,
    fillKey: side === 'left' ? 'front' : 'rear',
    confidence: forearmConfidence,
    minConfidence,
  });

  const handEnd = terminalPoint(
    pose,
    wrist,
    elbow,
    indexLm,
    pinkyLm,
    bodyRef * 0.14
  );
  appendSegment(out, `${side}Hand`, SPRITE_LIMB_AVATAR_PATHS.hand, wrist, handEnd.point, {
    halfWidth: bodyRef * 0.058,
    gapStart: bodyRef * 0.012,
    gapEnd: 0,
    fillKey: side === 'left' ? 'front' : 'rear',
    confidence: Math.min(forearmConfidence, handEnd.confidence),
    minConfidence,
  });
}

function buildLeg(
  pose: ScreenPoseLandmarks,
  out: SpriteLimbAvatarGeometry,
  side: 'left' | 'right',
  bodyRef: number,
  minConfidence: number
): void {
  const hipLm = side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const kneeLm = side === 'left' ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
  const ankleLm = side === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
  const heelLm = side === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL;
  const footLm = side === 'left' ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX;
  const hip = pointFor(pose, hipLm);
  const knee = pointFor(pose, kneeLm);
  const ankle = pointFor(pose, ankleLm);
  const thighConfidence = chainConfidence(pose, hipLm, kneeLm);
  const lowerLegConfidence = chainConfidence(pose, kneeLm, ankleLm);
  appendSegment(out, `${side}Thigh`, SPRITE_LIMB_AVATAR_PATHS.thigh, hip, knee, {
    halfWidth: bodyRef * 0.084,
    gapStart: bodyRef * 0.02,
    gapEnd: bodyRef * 0.028,
    fillKey: side === 'left' ? 'front' : 'rear',
    confidence: thighConfidence,
    minConfidence,
  });
  appendSegment(out, `${side}LowerLeg`, SPRITE_LIMB_AVATAR_PATHS.lowerLeg, knee, ankle, {
    halfWidth: bodyRef * 0.058,
    gapStart: bodyRef * 0.028,
    gapEnd: bodyRef * 0.012,
    fillKey: side === 'left' ? 'front' : 'rear',
    confidence: lowerLegConfidence,
    minConfidence,
  });

  const footEnd = terminalPoint(pose, ankle, knee, footLm, heelLm, bodyRef * 0.18);
  appendSegment(out, `${side}Foot`, SPRITE_LIMB_AVATAR_PATHS.foot, ankle, footEnd.point, {
    halfWidth: bodyRef * 0.064,
    gapStart: bodyRef * 0.012,
    gapEnd: 0,
    fillKey: side === 'left' ? 'front' : 'rear',
    confidence: Math.min(lowerLegConfidence, footEnd.confidence),
    minConfidence,
  });
}

function buildJointCaps(
  out: SpriteLimbAvatarGeometry,
  bodyRef: number,
  axis: Point,
  sideAxis: Point,
  minConfidence: number,
  anchors: {
    leftShoulder: Point;
    rightShoulder: Point;
    leftHip: Point;
    rightHip: Point;
    confidence: number;
  }
): void {
  const opacity = opacityForConfidence(anchors.confidence, minConfidence) * 0.88;
  appendCap(out, 'leftShoulderCap', anchors.leftShoulder, sideAxis, bodyRef * 0.074, axis, bodyRef * 0.052, opacity, anchors.confidence);
  appendCap(out, 'rightShoulderCap', anchors.rightShoulder, sideAxis, bodyRef * 0.074, axis, bodyRef * 0.052, opacity * 0.86, anchors.confidence);
  appendCap(out, 'leftHipCap', anchors.leftHip, sideAxis, bodyRef * 0.068, axis, bodyRef * 0.05, opacity, anchors.confidence);
  appendCap(out, 'rightHipCap', anchors.rightHip, sideAxis, bodyRef * 0.068, axis, bodyRef * 0.05, opacity * 0.86, anchors.confidence);
}

function appendCap(
  out: SpriteLimbAvatarGeometry,
  id: SpriteLimbAvatarSurfaceId,
  center: Point,
  xAxis: Point,
  xScale: number,
  yAxis: Point,
  yScale: number,
  opacity: number,
  confidence: number
): void {
  setSurface(
    out,
    id,
    SPRITE_LIMB_AVATAR_PATHS.cap,
    matrix(xAxis, xScale, yAxis, yScale, center),
    'cap',
    opacity,
    confidence,
    transformedBounds([
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ], xAxis, xScale, yAxis, yScale, center)
  );
}

function appendSegment(
  out: SpriteLimbAvatarGeometry,
  id: string,
  path: string,
  start: Point,
  end: Point,
  options: {
    halfWidth: number;
    gapStart: number;
    gapEnd: number;
    fillKey: SpriteLimbAvatarFillKey;
    confidence: number;
    minConfidence: number;
  }
): void {
  if (
    options.confidence < MIN_RENDER_CONFIDENCE ||
    !pointFinite(start) ||
    !pointFinite(end)
  ) {
    out.skippedPartCount++;
    return;
  }
  const rawAxis = sub(end, start);
  const rawLength = distance(start, end);
  if (!Number.isFinite(rawLength) || rawLength < 8) {
    out.skippedPartCount++;
    return;
  }
  const axis = normalize(rawAxis);
  const shortenedStart = add(start, scale(axis, Math.min(options.gapStart, rawLength * 0.28)));
  const shortenedEnd = add(end, scale(axis, -Math.min(options.gapEnd, rawLength * 0.28)));
  const length = distance(shortenedStart, shortenedEnd);
  if (length < 6) {
    out.skippedPartCount++;
    return;
  }
  const center = midpoint(shortenedStart, shortenedEnd);
  const normal = { x: -axis.y, y: axis.x };
  const surfaceId = id as SpriteLimbAvatarSurfaceId;
  setSurface(
    out,
    surfaceId,
    path,
    matrix(normal, options.halfWidth, axis, length, center),
    options.fillKey,
    opacityForConfidence(options.confidence, options.minConfidence),
    options.confidence,
    transformedBounds([
      { x: -1, y: -0.55 },
      { x: 1, y: -0.55 },
      { x: -1, y: 0.55 },
      { x: 1, y: 0.55 },
    ], normal, options.halfWidth, axis, length, center)
  );
}

function terminalPoint(
  pose: ScreenPoseLandmarks,
  base: Point,
  previous: Point,
  primaryLm: LM,
  secondaryLm: LM,
  fallbackLength: number
): { point: Point; confidence: number } {
  const primaryConfidence = landmarkConfidence(pose, primaryLm);
  const secondaryConfidence = landmarkConfidence(pose, secondaryLm);
  if (
    primaryConfidence >= MIN_RENDER_CONFIDENCE &&
    secondaryConfidence >= MIN_RENDER_CONFIDENCE &&
    landmarkFinite(pose, primaryLm) &&
    landmarkFinite(pose, secondaryLm)
  ) {
    return {
      point: midpoint(pointFor(pose, primaryLm), pointFor(pose, secondaryLm)),
      confidence: Math.min(primaryConfidence, secondaryConfidence),
    };
  }
  const direction = normalizeOr(sub(base, previous), { x: 0, y: 1 });
  return {
    point: add(base, scale(direction, fallbackLength)),
    confidence: Math.max(primaryConfidence, secondaryConfidence, MIN_RENDER_CONFIDENCE),
  };
}

function setSurface(
  out: SpriteLimbAvatarGeometry,
  id: SpriteLimbAvatarSurfaceId,
  path: string,
  transform: string,
  fillKey: SpriteLimbAvatarFillKey,
  opacity: number,
  confidence: number,
  bounds: Bounds
): void {
  const surface = out.surfaces.find((candidate) => candidate.id === id);
  if (!surface) return;
  surface.path = path;
  surface.transform = transform;
  surface.fillKey = fillKey;
  surface.opacity = clamp(opacity, 0, 1);
  surface.confidence = clamp(confidence, 0, 1);
  surface.visible = path.length > 0 && transform.length > 0 && surface.opacity > 0;
  surface.bounds = bounds;
}

function fillKeyForSurface(id: SpriteLimbAvatarSurfaceId): SpriteLimbAvatarFillKey {
  if (id === 'centralShell') return 'core';
  if (id === 'coreHighlight') return 'highlight';
  if (id.endsWith('Cap')) return 'cap';
  if (id.startsWith('right')) return 'rear';
  return 'front';
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
}

function landmarkFinite(pose: ScreenPoseLandmarks, lm: LM): boolean {
  return pose.hasPose && Number.isFinite(pose.xs[lm]) && Number.isFinite(pose.ys[lm]);
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(pose.visibility[lm], pose.presence[lm]);
}

function chainConfidence(pose: ScreenPoseLandmarks, a: LM, b: LM): number {
  return Math.min(landmarkConfidence(pose, a), landmarkConfidence(pose, b));
}

function opacityForConfidence(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence) / Math.max(0.01, 1 - minConfidence), 0.28, 1);
}

function transformedBounds(
  localPoints: readonly Point[],
  xAxis: Point,
  xScale: number,
  yAxis: Point,
  yScale: number,
  translate: Point
): Bounds {
  let bounds = emptyBounds();
  for (let i = 0; i < localPoints.length; i++) {
    const point = localPoints[i];
    bounds = includePoint(bounds, {
      x: translate.x + xAxis.x * xScale * point.x + yAxis.x * yScale * point.y,
      y: translate.y + xAxis.y * xScale * point.x + yAxis.y * yScale * point.y,
    });
  }
  return bounds;
}

function matrix(xAxis: Point, xScale: number, yAxis: Point, yScale: number, translate: Point): string {
  return `matrix(${f(xAxis.x * xScale)} ${f(xAxis.y * xScale)} ${f(yAxis.x * yScale)} ${f(
    yAxis.y * yScale
  )} ${f(translate.x)} ${f(translate.y)})`;
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(point: Point, amount: number): Point {
  return { x: point.x * amount, y: point.y * amount };
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(point: Point): Point {
  const len = Math.hypot(point.x, point.y) || 1;
  return { x: point.x / len, y: point.y / len };
}

function normalizeOr(point: Point, fallback: Point): Point {
  const len = Math.hypot(point.x, point.y);
  if (!Number.isFinite(len) || len < 0.001) return normalize(fallback);
  return { x: point.x / len, y: point.y / len };
}

function pointFinite(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function emptyBounds(): Bounds {
  return { ...EMPTY_BOUNDS };
}

function includePoint(bounds: Bounds, point: Point): Bounds {
  return {
    minX: Math.min(bounds.minX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxX: Math.max(bounds.maxX, point.x),
    maxY: Math.max(bounds.maxY, point.y),
  };
}

function includeBounds(bounds: Bounds, next: Bounds): Bounds {
  if (!finiteBounds(next)) return bounds;
  return {
    minX: Math.min(bounds.minX, next.minX),
    minY: Math.min(bounds.minY, next.minY),
    maxX: Math.max(bounds.maxX, next.maxX),
    maxY: Math.max(bounds.maxY, next.maxY),
  };
}

function finiteBounds(bounds: Bounds): boolean {
  return (
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.minY) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.maxY)
  );
}

function finiteTransform(transform: string): boolean {
  if (transform === '') return true;
  const values = transform.match(/-?\d+(?:\.\d+)?/g);
  return values !== null && values.length === 6 && values.every((value) => Number.isFinite(Number(value)));
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function f(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}
