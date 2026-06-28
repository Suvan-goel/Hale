import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type Point,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export type ArtDirectedHumanSurfaceId =
  | 'rightLeg'
  | 'leftLeg'
  | 'rightFoot'
  | 'leftFoot'
  | 'rightArm'
  | 'leftArm'
  | 'rightHand'
  | 'leftHand'
  | 'body'
  | 'head';

export type ArtDirectedHumanFillKey = 'body' | 'limb';

export interface ArtDirectedHumanSurface {
  id: ArtDirectedHumanSurfaceId;
  path: string;
  fillKey: ArtDirectedHumanFillKey;
  opacity: number;
  confidence: number;
  visible: boolean;
  bounds: Bounds;
}

export interface ArtDirectedHumanGeometry {
  hasPose: boolean;
  opacity: number;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
  bounds: Bounds;
  surfaces: ArtDirectedHumanSurface[];
}

export interface ArtDirectedHumanGeometryOptions {
  minConfidence?: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface BodyAxes {
  side: Point;
  down: Point;
  shoulderMid: Point;
  hipMid: Point;
  shoulderWidth: number;
  hipWidth: number;
  torsoLength: number;
  bodyRef: number;
  shoulderHalf: number;
  hipHalf: number;
}

interface HeadAnchor {
  center: Point;
  rx: number;
  ry: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const MIN_RENDER_CONFIDENCE = 0.12;
const SURFACE_IDS: readonly ArtDirectedHumanSurfaceId[] = [
  'body',
  'rightLeg',
  'leftLeg',
  'rightArm',
  'leftArm',
  'rightFoot',
  'leftFoot',
  'rightHand',
  'leftHand',
  'head',
];
const EMPTY_BOUNDS: Bounds = {
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
};

export const ART_DIRECTED_HUMAN_SURFACE_CAP = SURFACE_IDS.length;

export function createArtDirectedHumanGeometry(): ArtDirectedHumanGeometry {
  return {
    hasPose: false,
    opacity: 0,
    surfacePathCount: 0,
    dynamicPathCount: 0,
    shapeCount: 0,
    skippedPartCount: 0,
    bounds: emptyBounds(),
    surfaces: SURFACE_IDS.map((id) => ({
      id,
      path: '',
      fillKey: fillKeyForSurface(id),
      opacity: 0,
      confidence: 0,
      visible: false,
      bounds: emptyBounds(),
    })),
  };
}

export function emptyArtDirectedHumanGeometry(out: ArtDirectedHumanGeometry): void {
  out.hasPose = false;
  out.opacity = 0;
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.shapeCount = 0;
  out.skippedPartCount = 0;
  out.bounds = emptyBounds();
  for (let i = 0; i < out.surfaces.length; i++) {
    const surface = out.surfaces[i];
    surface.path = '';
    surface.fillKey = fillKeyForSurface(surface.id);
    surface.opacity = 0;
    surface.confidence = 0;
    surface.visible = false;
    surface.bounds = emptyBounds();
  }
}

export function buildArtDirectedHumanGeometry(
  pose: ScreenPoseLandmarks,
  out: ArtDirectedHumanGeometry,
  options: ArtDirectedHumanGeometryOptions = {}
): void {
  emptyArtDirectedHumanGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const torso = getTorsoEstimate(pose, MIN_RENDER_CONFIDENCE);
  if (torso === null || torso.confidence < MIN_RENDER_CONFIDENCE) return;

  const axes = createBodyAxes(pose, torso);
  out.hasPose = true;
  out.opacity = confidenceOpacity(torso.confidence, minConfidence);

  // Art direction: the torso/head template owns the neutral proportions; landmarks
  // only anchor it in the frame. Limbs then bend toward MediaPipe joints with
  // clamped lengths so tracking jitter does not destroy the human silhouette.
  buildLeg(pose, out, axes, 'right', minConfidence);
  buildLeg(pose, out, axes, 'left', minConfidence);
  buildArm(pose, out, axes, 'right', minConfidence);
  buildArm(pose, out, axes, 'left', minConfidence);
  buildBody(pose, out, axes, torso.confidence, minConfidence);
  buildHead(pose, out, axes, torso.confidence, minConfidence);

  let visible = 0;
  let bounds = emptyBounds();
  for (let i = 0; i < out.surfaces.length; i++) {
    const surface = out.surfaces[i];
    if (!surface.visible) continue;
    visible++;
    bounds = includeBounds(bounds, surface.bounds);
  }
  out.surfacePathCount = visible;
  out.dynamicPathCount = visible;
  out.shapeCount = visible;
  out.bounds = finiteBounds(bounds) ? bounds : emptyBounds();
}

export function isFiniteArtDirectedHumanGeometry(
  geometry: ArtDirectedHumanGeometry
): boolean {
  if (
    !Number.isFinite(geometry.opacity) ||
    !Number.isFinite(geometry.surfacePathCount) ||
    !Number.isFinite(geometry.dynamicPathCount) ||
    !Number.isFinite(geometry.shapeCount) ||
    !Number.isFinite(geometry.skippedPartCount)
  ) {
    return false;
  }
  for (const surface of geometry.surfaces) {
    if (
      !Number.isFinite(surface.opacity) ||
      !Number.isFinite(surface.confidence) ||
      surface.path.includes('NaN') ||
      surface.path.includes('Infinity')
    ) {
      return false;
    }
    if (surface.visible && (!finiteBounds(surface.bounds) || surface.path === '')) return false;
  }
  return true;
}

function buildBody(
  pose: ScreenPoseLandmarks,
  out: ArtDirectedHumanGeometry,
  axes: BodyAxes,
  confidence: number,
  minConfidence: number
): void {
  const { side, down, shoulderMid, hipMid, bodyRef, shoulderHalf, hipHalf } = axes;
  const head = resolveHeadAnchor(pose, axes);
  const neckTop = add(head.center, scale(down, head.ry * 0.9));
  const neckBase = add(shoulderMid, scale(down, -bodyRef * 0.036));
  const neckTopHalf = bodyRef * 0.038;
  const neckBaseHalf = bodyRef * 0.122;
  const ribHalf = shoulderHalf * 0.76;
  const waistHalf = Math.max(bodyRef * 0.158, shoulderHalf * 0.59);
  const lowerWaistHalf = Math.max(bodyRef * 0.21, shoulderHalf * 0.76);
  const hipBridgeHalf = Math.max(hipHalf * 1.2, bodyRef * 0.288);

  const neckTopLeft = add(neckTop, scale(side, neckTopHalf));
  const neckLeft = add(neckBase, scale(side, neckBaseHalf));
  const trapLeft = add(add(shoulderMid, scale(down, bodyRef * 0.004)), scale(side, shoulderHalf * 0.36));
  const shoulderLeft = add(add(shoulderMid, scale(down, bodyRef * 0.052)), scale(side, shoulderHalf * 0.72));
  const deltoidLeft = add(add(shoulderMid, scale(down, bodyRef * 0.152)), scale(side, shoulderHalf * 0.94));
  const underArmLeft = add(add(shoulderMid, scale(down, bodyRef * 0.285)), scale(side, shoulderHalf * 0.72));
  const ribLeft = add(add(shoulderMid, scale(down, bodyRef * 0.355)), scale(side, ribHalf));
  const waistLeft = add(add(shoulderMid, scale(down, bodyRef * 0.61)), scale(side, waistHalf));
  const lowWaistLeft = add(add(shoulderMid, scale(down, bodyRef * 0.74)), scale(side, lowerWaistHalf));
  const hipLeft = add(add(hipMid, scale(down, bodyRef * 0.018)), scale(side, hipBridgeHalf));
  const pelvisLeft = add(add(hipMid, scale(down, bodyRef * 0.106)), scale(side, hipHalf * 0.42));
  const pelvisBottom = add(hipMid, scale(down, bodyRef * 0.135));

  const points = [
    neckTopLeft,
    neckLeft,
    trapLeft,
    shoulderLeft,
    deltoidLeft,
    underArmLeft,
    ribLeft,
    waistLeft,
    lowWaistLeft,
    hipLeft,
    pelvisLeft,
    pelvisBottom,
    mirrorPoint(pelvisLeft, hipMid, side),
    mirrorPoint(hipLeft, hipMid, side),
    mirrorPoint(lowWaistLeft, shoulderMid, side),
    mirrorPoint(waistLeft, shoulderMid, side),
    mirrorPoint(ribLeft, shoulderMid, side),
    mirrorPoint(underArmLeft, shoulderMid, side),
    mirrorPoint(deltoidLeft, shoulderMid, side),
    mirrorPoint(shoulderLeft, shoulderMid, side),
    mirrorPoint(trapLeft, shoulderMid, side),
    mirrorPoint(neckLeft, neckBase, side),
    mirrorPoint(neckTopLeft, neckTop, side),
  ];
  setSurface(out, 'body', smoothClosedPath(points, 0.16), 'body', confidence, minConfidence, 1);
}

function buildHead(
  pose: ScreenPoseLandmarks,
  out: ArtDirectedHumanGeometry,
  axes: BodyAxes,
  confidence: number,
  minConfidence: number
): void {
  const head = resolveHeadAnchor(pose, axes);
  setSurface(out, 'head', headPath(head.center, head.rx, head.ry, axes.down), 'body', confidence, minConfidence, 1);
}

function buildArm(
  pose: ScreenPoseLandmarks,
  out: ArtDirectedHumanGeometry,
  axes: BodyAxes,
  sideName: 'left' | 'right',
  minConfidence: number
): void {
  const shoulderLm = sideName === 'left' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const elbowLm = sideName === 'left' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const wristLm = sideName === 'left' ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
  const indexLm = sideName === 'left' ? LM.LEFT_INDEX : LM.RIGHT_INDEX;
  const pinkyLm = sideName === 'left' ? LM.LEFT_PINKY : LM.RIGHT_PINKY;
  if (!landmarkUsable(pose, shoulderLm) || !landmarkUsable(pose, elbowLm)) {
    out.skippedPartCount++;
    return;
  }

  const sideSign = sideName === 'left' ? 1 : -1;
  const root = add(
    add(pointFor(pose, shoulderLm), scale(axes.down, axes.bodyRef * 0.13)),
    scale(axes.side, axes.bodyRef * 0.078 * sideSign)
  );
  const rawElbow = pointFor(pose, elbowLm);
  const elbow = constrainFrom(root, rawElbow, axes.bodyRef * 0.24, axes.bodyRef * 0.6);
  const wristFallback = add(elbow, scale(normalize(sub(elbow, root)), axes.bodyRef * 0.42));
  const wrist = landmarkUsable(pose, wristLm)
    ? constrainFrom(elbow, pointFor(pose, wristLm), axes.bodyRef * 0.22, axes.bodyRef * 0.56)
    : wristFallback;
  const handTarget = handTargetFromLandmarks(pose, wrist, elbow, indexLm, pinkyLm, axes.bodyRef);
  const confidence = Math.min(
    landmarkConfidence(pose, shoulderLm),
    landmarkConfidence(pose, elbowLm),
    landmarkUsable(pose, wristLm) ? landmarkConfidence(pose, wristLm) : MIN_RENDER_CONFIDENCE
  );
  const upperMid = lerpPoint(root, elbow, 0.46);
  const forearmMid = lerpPoint(elbow, wrist, 0.56);
  const path = ribbonPath(
    [root, upperMid, elbow, forearmMid, wrist],
    [
      axes.bodyRef * 0.044,
      axes.bodyRef * 0.074,
      axes.bodyRef * 0.054,
      axes.bodyRef * 0.052,
      axes.bodyRef * 0.032,
    ],
    0.13
  );
  setSurface(out, `${sideName}Arm`, path, 'limb', confidence, minConfidence, 1);
  setSurface(
    out,
    `${sideName}Hand`,
    handPath(wrist, handTarget, elbow, axes.bodyRef, sideSign),
    'limb',
    confidence,
    minConfidence,
    1
  );
}

function buildLeg(
  pose: ScreenPoseLandmarks,
  out: ArtDirectedHumanGeometry,
  axes: BodyAxes,
  sideName: 'left' | 'right',
  minConfidence: number
): void {
  const hipLm = sideName === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const kneeLm = sideName === 'left' ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
  const ankleLm = sideName === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
  const heelLm = sideName === 'left' ? LM.LEFT_HEEL : LM.RIGHT_HEEL;
  const toeLm = sideName === 'left' ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX;
  if (!landmarkUsable(pose, hipLm) || !landmarkUsable(pose, kneeLm)) {
    out.skippedPartCount++;
    return;
  }

  const sideSign = sideName === 'left' ? 1 : -1;
  const hip = pointFor(pose, hipLm);
  const root = add(
    add(lerpPoint(axes.hipMid, hip, 0.62), scale(axes.side, axes.bodyRef * 0.006 * sideSign)),
    scale(axes.down, axes.bodyRef * 0.052)
  );
  const knee = constrainFrom(root, pointFor(pose, kneeLm), axes.bodyRef * 0.34, axes.bodyRef * 0.92);
  const ankleFallback = add(knee, scale(normalize(sub(knee, root)), axes.bodyRef * 0.62));
  const ankle = landmarkUsable(pose, ankleLm)
    ? constrainFrom(knee, pointFor(pose, ankleLm), axes.bodyRef * 0.34, axes.bodyRef * 0.92)
    : ankleFallback;
  const footTarget = footTargetFromLandmarks(pose, ankle, knee, heelLm, toeLm, axes, sideSign);
  const confidence = Math.min(
    landmarkConfidence(pose, hipLm),
    landmarkConfidence(pose, kneeLm),
    landmarkUsable(pose, ankleLm) ? landmarkConfidence(pose, ankleLm) : MIN_RENDER_CONFIDENCE
  );
  const thighMid = lerpPoint(root, knee, 0.42);
  const calfMid = lerpPoint(knee, ankle, 0.52);
  const path = ribbonPath(
    [root, thighMid, knee, calfMid, ankle],
    [
      axes.bodyRef * 0.17,
      axes.bodyRef * 0.138,
      axes.bodyRef * 0.074,
      axes.bodyRef * 0.09,
      axes.bodyRef * 0.044,
    ],
    0.13
  );
  setSurface(out, `${sideName}Leg`, path, 'limb', confidence, minConfidence, 1);
  setSurface(
    out,
    `${sideName}Foot`,
    footPath(ankle, footTarget, knee, axes.bodyRef, sideSign),
    'limb',
    confidence,
    minConfidence,
    1
  );
}

function createBodyAxes(
  pose: ScreenPoseLandmarks,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>
): BodyAxes {
  const leftShoulder = torso.leftShoulder;
  const rightShoulder = torso.rightShoulder;
  const leftHip = torso.leftHip;
  const rightHip = torso.rightHip;
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const torsoLength = distance(shoulderMid, hipMid);
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const hipWidth = distance(leftHip, rightHip);
  const leftLeg = reliableLegLength(pose, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE);
  const rightLeg = reliableLegLength(pose, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE);
  const bodyRef = clamp(
    Math.max(torsoLength, shoulderWidth * 1.55, hipWidth * 2.1, leftLeg * 0.56, rightLeg * 0.56, 92),
    72,
    520
  );
  const down = normalizeOr(sub(hipMid, shoulderMid), { x: 0, y: 1 });
  const side = normalizeOr(sub(leftShoulder, rightShoulder), { x: -down.y, y: down.x });
  const shoulderHalf = clamp(Math.max(shoulderWidth * 0.82, bodyRef * 0.345), bodyRef * 0.31, bodyRef * 0.43);
  const hipHalf = clamp(Math.max(hipWidth * 1.0, bodyRef * 0.29), bodyRef * 0.255, shoulderHalf * 0.98);
  return {
    side,
    down,
    shoulderMid,
    hipMid,
    shoulderWidth,
    hipWidth,
    torsoLength,
    bodyRef,
    shoulderHalf,
    hipHalf,
  };
}

function handTargetFromLandmarks(
  pose: ScreenPoseLandmarks,
  wrist: Point,
  elbow: Point,
  indexLm: LM,
  pinkyLm: LM,
  bodyRef: number
): Point {
  const axis = normalizeOr(sub(wrist, elbow), { x: 0, y: 1 });
  if (landmarkUsable(pose, indexLm) && landmarkUsable(pose, pinkyLm)) {
    const palm = midpoint(pointFor(pose, indexLm), pointFor(pose, pinkyLm));
    return constrainFrom(wrist, palm, bodyRef * 0.16, bodyRef * 0.23);
  }
  return add(wrist, scale(axis, bodyRef * 0.17));
}

function footTargetFromLandmarks(
  pose: ScreenPoseLandmarks,
  ankle: Point,
  knee: Point,
  heelLm: LM,
  toeLm: LM,
  axes: BodyAxes,
  sideSign: number
): Point {
  const axis = normalizeOr(sub(ankle, knee), { x: 0, y: 1 });
  const templateFoot = add(
    add(ankle, scale(axes.down, axes.bodyRef * 0.118)),
    scale(axes.side, axes.bodyRef * 0.004 * sideSign)
  );
  if (landmarkUsable(pose, heelLm) && landmarkUsable(pose, toeLm)) {
    const foot = midpoint(pointFor(pose, heelLm), pointFor(pose, toeLm));
    const trackedFoot = constrainFrom(ankle, foot, axes.bodyRef * 0.105, axes.bodyRef * 0.18);
    return lerpPoint(templateFoot, trackedFoot, 0.12);
  }
  return lerpPoint(templateFoot, add(ankle, scale(axis, axes.bodyRef * 0.08)), 0.1);
}

function resolveHeadAnchor(pose: ScreenPoseLandmarks, axes: BodyAxes): HeadAnchor {
  const { down, side, shoulderMid, bodyRef } = axes;
  const estimate = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE);
  const ry = clamp((estimate?.ry ?? bodyRef * 0.18) * 0.99, bodyRef * 0.154, bodyRef * 0.22);
  const rx = clamp((estimate?.rx ?? ry * 0.78) * 0.98, bodyRef * 0.116, bodyRef * 0.168);
  const templateCenter = add(shoulderMid, scale(down, -(ry * 1.72 + bodyRef * 0.02)));
  const trackedCenter =
    estimate && pointFinite(estimate.center)
      ? add(estimate.center, scale(down, estimate.ry * 0.46))
      : templateCenter;
  const center = clampPointToBodyAxes(
    lerpPoint(templateCenter, trackedCenter, 0.62),
    templateCenter,
    down,
    side,
    bodyRef * 0.08,
    bodyRef * 0.06
  );
  return { center: add(center, scale(down, bodyRef * 0.054)), rx, ry };
}

function headPath(center: Point, rx: number, ry: number, down: Point): string {
  const side = { x: -down.y, y: down.x };
  const top = add(center, scale(down, -ry));
  const browRight = add(add(center, scale(down, -ry * 0.56)), scale(side, -rx * 0.88));
  const cheekRight = add(add(center, scale(down, ry * 0.02)), scale(side, -rx));
  const jawRight = add(add(center, scale(down, ry * 0.66)), scale(side, -rx * 0.58));
  const bottom = add(center, scale(down, ry * 0.96));
  const jawLeft = add(add(center, scale(down, ry * 0.66)), scale(side, rx * 0.58));
  const cheekLeft = add(add(center, scale(down, ry * 0.02)), scale(side, rx));
  const browLeft = add(add(center, scale(down, -ry * 0.56)), scale(side, rx * 0.88));
  return smoothClosedPath(
    [top, browRight, cheekRight, jawRight, bottom, jawLeft, cheekLeft, browLeft],
    0.18
  );
}

function ribbonPath(points: readonly Point[], widths: readonly number[], tension: number): string {
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const previous = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const tangent = normalizeOr(sub(next, previous), { x: 0, y: 1 });
    const normal = { x: -tangent.y, y: tangent.x };
    left.push(add(points[i], scale(normal, widths[i])));
    right.push(add(points[i], scale(normal, -widths[i])));
  }
  return smoothClosedPath([...left, ...right.reverse()], tension);
}

function handPath(
  wrist: Point,
  target: Point,
  elbow: Point,
  bodyRef: number,
  sideSign: number
): string {
  const axis = normalizeOr(sub(target, wrist), normalizeOr(sub(wrist, elbow), { x: 0, y: 1 }));
  const normal = { x: -axis.y * sideSign, y: axis.x * sideSign };
  const outer = normal;
  const inner = scale(normal, -1);
  const wristHalf = bodyRef * 0.03;
  const palmLength = bodyRef * 0.098;
  const fingerLength = bodyRef * 0.082;
  const palmHalf = bodyRef * 0.05;
  const fingerSpread = bodyRef * 0.043;
  const baseOuter = add(wrist, scale(outer, wristHalf));
  const baseInner = add(wrist, scale(inner, wristHalf * 0.92));
  const thumbBase = add(add(wrist, scale(axis, palmLength * 0.42)), scale(outer, palmHalf * 0.78));
  const thumbTip = add(add(wrist, scale(axis, palmLength * 0.62)), scale(outer, bodyRef * 0.07));
  const palmOuter = add(add(wrist, scale(axis, palmLength * 0.86)), scale(outer, palmHalf * 0.9));
  const indexTip = add(add(wrist, scale(axis, palmLength + fingerLength * 0.7)), scale(outer, fingerSpread));
  const middleTip = add(add(wrist, scale(axis, palmLength + fingerLength)), scale(outer, fingerSpread * 0.16));
  const ringTip = add(add(wrist, scale(axis, palmLength + fingerLength * 0.88)), scale(inner, fingerSpread * 0.36));
  const littleTip = add(add(wrist, scale(axis, palmLength + fingerLength * 0.62)), scale(inner, fingerSpread * 0.82));
  const palmInner = add(add(wrist, scale(axis, palmLength * 0.54)), scale(inner, palmHalf));
  return smoothClosedPath(
    [
      baseOuter,
      thumbBase,
      thumbTip,
      palmOuter,
      indexTip,
      middleTip,
      ringTip,
      littleTip,
      palmInner,
      baseInner,
    ],
    0.12
  );
}

function footPath(
  ankle: Point,
  target: Point,
  knee: Point,
  bodyRef: number,
  sideSign: number
): string {
  const axis = normalizeOr(sub(target, ankle), normalizeOr(sub(ankle, knee), { x: 0, y: 1 }));
  const normal = { x: -axis.y * sideSign, y: axis.x * sideSign };
  const outer = normal;
  const inner = scale(normal, -1);
  const ankleHalf = bodyRef * 0.034;
  const instepHalf = bodyRef * 0.056;
  const toeHalf = bodyRef * 0.092;
  const length = bodyRef * 0.132;
  const heelOuter = add(ankle, scale(outer, ankleHalf));
  const heelInner = add(ankle, scale(inner, ankleHalf * 0.92));
  const instepOuter = add(add(ankle, scale(axis, length * 0.5)), scale(outer, instepHalf));
  const instepInner = add(add(ankle, scale(axis, length * 0.5)), scale(inner, instepHalf * 0.9));
  const toeLine = add(ankle, scale(axis, length));
  const bigToe = add(add(toeLine, scale(axis, bodyRef * 0.012)), scale(outer, toeHalf * 0.62));
  const toeOuter = add(add(toeLine, scale(axis, bodyRef * 0.018)), scale(outer, toeHalf * 0.28));
  const toeCenter = add(toeLine, scale(axis, bodyRef * 0.02));
  const toeInner = add(add(toeLine, scale(axis, bodyRef * 0.014)), scale(inner, toeHalf * 0.36));
  const smallToe = add(add(toeLine, scale(axis, bodyRef * 0.004)), scale(inner, toeHalf * 0.72));
  return smoothClosedPath(
    [
      heelOuter,
      instepOuter,
      bigToe,
      toeOuter,
      toeCenter,
      toeInner,
      smallToe,
      instepInner,
      heelInner,
    ],
    0.12
  );
}

function smoothClosedPath(points: readonly Point[], tension: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${p(points[0])}Z`;
  let path = `M${p(points[0])}`;
  const t = clamp(tension, 0.04, 0.22);
  for (let i = 0; i < points.length; i++) {
    const previous = points[(i - 1 + points.length) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const afterNext = points[(i + 2) % points.length];
    const controlA = {
      x: current.x + (next.x - previous.x) * t,
      y: current.y + (next.y - previous.y) * t,
    };
    const controlB = {
      x: next.x - (afterNext.x - current.x) * t,
      y: next.y - (afterNext.y - current.y) * t,
    };
    path += `C${p(controlA)} ${p(controlB)} ${p(next)}`;
  }
  return `${path}Z`;
}

function setSurface(
  out: ArtDirectedHumanGeometry,
  id: ArtDirectedHumanSurfaceId,
  path: string,
  _fillKey: ArtDirectedHumanFillKey,
  confidence: number,
  minConfidence: number,
  opacityMultiplier: number
): void {
  const surface = out.surfaces.find((candidate) => candidate.id === id);
  if (!surface || path === '') return;
  surface.path = path;
  surface.fillKey = fillKeyForSurface(id);
  surface.opacity = confidenceOpacity(confidence, minConfidence) * opacityMultiplier;
  surface.confidence = confidence;
  surface.visible = surface.opacity > 0.08;
  surface.bounds = boundsFromPath(path);
}

function fillKeyForSurface(_id: ArtDirectedHumanSurfaceId): ArtDirectedHumanFillKey {
  return 'body';
}

function constrainFrom(origin: Point, target: Point, minLength: number, maxLength: number): Point {
  if (!pointFinite(target)) return origin;
  const delta = sub(target, origin);
  const len = Math.hypot(delta.x, delta.y);
  if (len < 0.001) return add(origin, { x: 0, y: minLength });
  const clamped = clamp(len, minLength, maxLength);
  return add(origin, scale(delta, clamped / len));
}

function clampPointToBodyAxes(
  point: Point,
  center: Point,
  down: Point,
  side: Point,
  maxSideOffset: number,
  maxDownOffset: number
): Point {
  const delta = sub(point, center);
  const sideOffset = dot(delta, side);
  const downOffset = dot(delta, down);
  return add(
    add(center, scale(side, clamp(sideOffset, -maxSideOffset, maxSideOffset))),
    scale(down, clamp(downOffset, -maxDownOffset, maxDownOffset))
  );
}

function boundsFromPath(path: string): Bounds {
  const bounds = emptyBounds();
  let index = 0;
  let x = 0;
  path.replace(/-?\d+(?:\.\d+)?/g, (token) => {
    const value = Number(token);
    if (index % 2 === 0) {
      x = value;
    } else {
      includePoint(bounds, { x, y: value });
    }
    index++;
    return token;
  });
  return finiteBounds(bounds) ? bounds : emptyBounds();
}

function reliableLegLength(pose: ScreenPoseLandmarks, hipLm: LM, kneeLm: LM, ankleLm: LM): number {
  if (!landmarkUsable(pose, hipLm) || !landmarkUsable(pose, kneeLm) || !landmarkUsable(pose, ankleLm)) return 0;
  return distance(pointFor(pose, hipLm), pointFor(pose, kneeLm)) + distance(pointFor(pose, kneeLm), pointFor(pose, ankleLm));
}

function landmarkUsable(pose: ScreenPoseLandmarks, lm: LM): boolean {
  return (
    pose.hasPose &&
    Number.isFinite(pose.xs[lm]) &&
    Number.isFinite(pose.ys[lm]) &&
    landmarkConfidence(pose, lm) >= MIN_RENDER_CONFIDENCE
  );
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(pose.visibility[lm], pose.presence[lm]);
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
}

function mirrorPoint(point: Point, center: Point, side: Point): Point {
  const delta = sub(point, center);
  return sub(point, scale(side, dot(delta, side) * 2));
}

function includeBounds(a: Bounds, b: Bounds): Bounds {
  if (!finiteBounds(a)) return { ...b };
  if (!finiteBounds(b)) return { ...a };
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function includePoint(bounds: Bounds, point: Point): void {
  if (!pointFinite(point)) return;
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function emptyBounds(): Bounds {
  return { ...EMPTY_BOUNDS };
}

function finiteBounds(bounds: Bounds): boolean {
  return (
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.minY) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.maxY)
  );
}

function pointFinite(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
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

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(point: Point, scalar: number): Point {
  return { x: point.x * scalar, y: point.y * scalar };
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function normalize(point: Point): Point {
  const len = Math.hypot(point.x, point.y) || 1;
  return { x: point.x / len, y: point.y / len };
}

function normalizeOr(point: Point, fallback: Point): Point {
  const len = Math.hypot(point.x, point.y);
  if (len < 0.001) return normalize(fallback);
  return { x: point.x / len, y: point.y / len };
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  if (confidence >= minConfidence) return 1;
  const low = Math.max(0.06, minConfidence * 0.34);
  return clamp(0.22 + ((confidence - low) / Math.max(0.01, minConfidence - low)) * 0.5, 0.16, 0.82);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function p(point: Point): string {
  return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
}
