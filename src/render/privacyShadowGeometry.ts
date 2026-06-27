import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import {
  buildSoftDigitalTwinGeometry,
  createSoftDigitalTwinGeometry,
  type SoftDigitalTwinGeometry,
} from './softDigitalTwinGeometry';

export interface PrivacyShadowVisualConstants {
  shadowOpacity: number;
  shadowReadyOpacity: number;
  shadowLostOpacity: number;
  shadowSoftness: number;
  outerFeatherOpacity: number;
  innerCoreOpacity: number;
  torsoBlobWidth: number;
  torsoBlobHeightScale: number;
  headBlobScale: number;
  pelvisBlobScale: number;
  upperArmBlobWidth: number;
  forearmBlobWidth: number;
  thighBlobWidth: number;
  shinBlobWidth: number;
  handBlobScale: number;
  footBlobScale: number;
  confidenceFadeOpacity: number;
  trackingReadyOpacityBoost: number;
  trackingLostFade: number;
  motionTrailOpacity: number;
  motionTrailFrames: number;
  frameReadyColor: string;
  frameAdjustColor: string;
  frameNeutralColor: string;
}

export interface PrivacyShadowBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PrivacyShadowVisibility {
  headVisible: boolean;
  feetVisible: boolean;
  fullBodyVisible: boolean;
  trackingStable: boolean;
}

export interface PrivacyShadowGeometry {
  hasPose: boolean;
  outerPath: string;
  midPath: string;
  corePath: string;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
  opacity: number;
  readyScore: number;
  bounds: PrivacyShadowBounds;
  visibility: PrivacyShadowVisibility;
  humanSilhouette: SoftDigitalTwinGeometry;
}

export interface PrivacyShadowGeometryOptions {
  minConfidence?: number;
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
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const SOFT_MIN_CONFIDENCE = 0.12;
const MIN_BODY_REF = 120;
const SHADOW_OUTER_SCALE_X = 1.08;
const SHADOW_OUTER_SCALE_Y = 1.055;
const SHADOW_MID_SCALE_X = 1.02;
const SHADOW_MID_SCALE_Y = 1.01;
const SHADOW_CORE_SCALE_X = 0.965;
const SHADOW_CORE_SCALE_Y = 0.985;
const EMPTY_BOUNDS: PrivacyShadowBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
};

export const PRIVACY_SHADOW_VISUAL_CONSTANTS: PrivacyShadowVisualConstants = {
  shadowOpacity: 0.24,
  shadowReadyOpacity: 0.31,
  shadowLostOpacity: 0.08,
  shadowSoftness: 1.7,
  outerFeatherOpacity: 0.28,
  innerCoreOpacity: 0.045,
  torsoBlobWidth: 1.08,
  torsoBlobHeightScale: 1.08,
  headBlobScale: 0.96,
  pelvisBlobScale: 1.12,
  upperArmBlobWidth: 1.04,
  forearmBlobWidth: 0.9,
  thighBlobWidth: 1.08,
  shinBlobWidth: 0.86,
  handBlobScale: 0.82,
  footBlobScale: 0.82,
  confidenceFadeOpacity: 0.42,
  trackingReadyOpacityBoost: 0.08,
  trackingLostFade: 0.18,
  motionTrailOpacity: 0,
  motionTrailFrames: 0,
  frameReadyColor: '#414C34',
  frameAdjustColor: '#A98243',
  frameNeutralColor: '#D8D3C8',
};

export function createPrivacyShadowGeometry(): PrivacyShadowGeometry {
  return {
    hasPose: false,
    outerPath: '',
    midPath: '',
    corePath: '',
    surfacePathCount: 0,
    dynamicPathCount: 0,
    shapeCount: 0,
    skippedPartCount: 0,
    opacity: 0,
    readyScore: 0,
    bounds: { ...EMPTY_BOUNDS },
    visibility: emptyVisibility(),
    humanSilhouette: createSoftDigitalTwinGeometry(),
  };
}

export function emptyPrivacyShadowGeometry(out: PrivacyShadowGeometry): void {
  out.hasPose = false;
  out.outerPath = '';
  out.midPath = '';
  out.corePath = '';
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.shapeCount = 0;
  out.skippedPartCount = 0;
  out.opacity = 0;
  out.readyScore = 0;
  out.bounds.minX = 0;
  out.bounds.minY = 0;
  out.bounds.maxX = 0;
  out.bounds.maxY = 0;
  resetVisibility(out.visibility);
}

export function buildPrivacyShadowGeometry(
  pose: ScreenPoseLandmarks,
  out: PrivacyShadowGeometry,
  options: PrivacyShadowGeometryOptions = {}
): void {
  emptyPrivacyShadowGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const torso = getTorsoEstimate(pose, SOFT_MIN_CONFIDENCE);
  if (torso === null || torso.confidence < SOFT_MIN_CONFIDENCE) return;

  const axes = createBodyAxes(pose, torso);
  const head = getHeadEstimate(pose, SOFT_MIN_CONFIDENCE) ?? synthesizeHead(axes, torso.confidence);
  beginBounds(out.bounds);

  buildHumanShadowLayers(pose, out, axes, head, minConfidence);
  if (out.surfacePathCount === 0) {
    appendCoreRegions(out, axes, head, minConfidence);
    appendLimbRegions(pose, out, axes, minConfidence);
  }
  includeRenderableLandmarkBounds(out.bounds, pose, SOFT_MIN_CONFIDENCE);
  finishBounds(out.bounds);

  const headVisible = head.confidence >= minConfidence * 0.72;
  const feetVisible = areFeetVisible(pose, minConfidence * 0.55);
  const fullBodyVisible = headVisible && feetVisible && torso.confidence >= minConfidence * 0.72;
  const trackingStable = fullBodyVisible && out.skippedPartCount <= 2;
  out.visibility.headVisible = headVisible;
  out.visibility.feetVisible = feetVisible;
  out.visibility.fullBodyVisible = fullBodyVisible;
  out.visibility.trackingStable = trackingStable;
  out.readyScore =
    (headVisible ? 0.25 : 0) +
    (feetVisible ? 0.25 : 0) +
    (fullBodyVisible ? 0.25 : 0) +
    (trackingStable ? 0.25 : 0);

  out.surfacePathCount =
    (out.outerPath ? 1 : 0) +
    (out.midPath ? 1 : 0) +
    (out.corePath ? 1 : 0);
  out.dynamicPathCount = out.surfacePathCount;
  out.hasPose = out.surfacePathCount > 0;
  out.opacity = confidenceOpacity(
    Math.min(torso.confidence, head.confidence, out.humanSilhouette.opacity || torso.confidence),
    minConfidence
  );
}

export function isFinitePrivacyShadowGeometry(geometry: PrivacyShadowGeometry): boolean {
  const path = `${geometry.outerPath}${geometry.midPath}${geometry.corePath}`;
  return (
    Number.isFinite(geometry.surfacePathCount) &&
    Number.isFinite(geometry.dynamicPathCount) &&
    Number.isFinite(geometry.shapeCount) &&
    Number.isFinite(geometry.skippedPartCount) &&
    Number.isFinite(geometry.opacity) &&
    Number.isFinite(geometry.readyScore) &&
    Number.isFinite(geometry.bounds.minX) &&
    Number.isFinite(geometry.bounds.minY) &&
    Number.isFinite(geometry.bounds.maxX) &&
    Number.isFinite(geometry.bounds.maxY) &&
    !path.includes('NaN') &&
    !path.includes('Infinity')
  );
}

function buildHumanShadowLayers(
  pose: ScreenPoseLandmarks,
  out: PrivacyShadowGeometry,
  axes: BodyAxes,
  head: HeadEstimate,
  minConfidence: number
): void {
  buildSoftDigitalTwinGeometry(pose, out.humanSilhouette, {
    minConfidence,
    visualPreset: 'balanced',
  });
  if (!out.humanSilhouette.hasPose || out.humanSilhouette.surfacePathCount === 0) return;

  // Use the best pose-driven body envelope as the source for the privacy shadow,
  // then diffuse that same generated path into three low-contrast layers. This
  // avoids the old stacked capsule look while preserving exact skeleton mapping.
  const silhouettePath = silhouettePathFromHumanGeometry(out.humanSilhouette, axes, head);
  if (silhouettePath === '') return;

  const bounds = boundsFromGeneratedPath(silhouettePath);
  if (!bounds) return;
  const center = {
    x: (bounds.minX + bounds.maxX) * 0.5,
    y: (bounds.minY + bounds.maxY) * 0.5,
  };

  out.outerPath = transformGeneratedPath(
    silhouettePath,
    center,
    SHADOW_OUTER_SCALE_X,
    SHADOW_OUTER_SCALE_Y
  );
  out.midPath = transformGeneratedPath(
    silhouettePath,
    center,
    SHADOW_MID_SCALE_X,
    SHADOW_MID_SCALE_Y
  );
  out.corePath = transformGeneratedPath(
    silhouettePath,
    center,
    SHADOW_CORE_SCALE_X,
    SHADOW_CORE_SCALE_Y
  );
  out.shapeCount = out.humanSilhouette.surfacePathCount;
  out.skippedPartCount += out.humanSilhouette.skippedPartCount;
  includePathBounds(out.bounds, out.outerPath);
  out.surfacePathCount = 3;
  out.dynamicPathCount = 3;
}

function silhouettePathFromHumanGeometry(
  geometry: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  head: HeadEstimate
): string {
  let path = '';
  for (const surface of geometry.surfaces) {
    if (
      surface.opacity <= 0 ||
      surface.path === '' ||
      (surface.id !== 'balancedBodyEnvelope' && surface.id !== 'head')
    ) {
      continue;
    }
    path += surface.path;
  }
  if (path !== '') path += shadowNeckBridgePath(axes, head);
  return path;
}

function shadowNeckBridgePath(axes: BodyAxes, head: HeadEstimate): string {
  const { down, shoulderMid, bodyRef } = axes;
  const headCenter = add(head.center, scale(down, head.ry * 0.3));
  const start = add(headCenter, scale(down, head.ry * 0.7));
  const end = add(shoulderMid, scale(down, bodyRef * 0.018));
  return sameWindingCapsulePath(start, end, bodyRef * 0.045, bodyRef * 0.07);
}

function sameWindingCapsulePath(
  start: Point,
  end: Point,
  startWidth: number,
  endWidth: number
): string {
  const axis = normalize({ x: end.x - start.x, y: end.y - start.y });
  const normal = { x: axis.y, y: -axis.x };
  const a = add(start, scale(axis, -startWidth * 0.58));
  const b = add(end, scale(axis, endWidth * 0.58));
  const aLeft = add(a, scale(normal, startWidth));
  const aRight = add(a, scale(normal, -startWidth));
  const bLeft = add(b, scale(normal, endWidth));
  const bRight = add(b, scale(normal, -endWidth));
  const len = distance(a, b);
  return (
    `M${p(aLeft)}` +
    `C${p(add(aLeft, scale(axis, len * 0.32)))} ${p(add(bLeft, scale(axis, -len * 0.28)))} ${p(bLeft)}` +
    `Q${p(add(b, scale(axis, endWidth * 0.5)))} ${p(bRight)}` +
    `C${p(add(bRight, scale(axis, -len * 0.28)))} ${p(add(aRight, scale(axis, len * 0.32)))} ${p(aRight)}` +
    `Q${p(add(a, scale(axis, -startWidth * 0.5)))} ${p(aLeft)}Z`
  );
}

function transformGeneratedPath(
  path: string,
  center: Point,
  scaleX: number,
  scaleY: number
): string {
  let index = 0;
  return path.replace(/-?\d+(?:\.\d+)?/g, (token) => {
    const value = Number(token);
    const transformed =
      index % 2 === 0
        ? center.x + (value - center.x) * scaleX
        : center.y + (value - center.y) * scaleY;
    index++;
    return f(transformed);
  });
}

function boundsFromGeneratedPath(path: string): PrivacyShadowBounds | null {
  const bounds = { ...EMPTY_BOUNDS };
  beginBounds(bounds);
  let index = 0;
  let x = 0;
  let hasPoint = false;
  path.replace(/-?\d+(?:\.\d+)?/g, (token) => {
    const value = Number(token);
    if (index % 2 === 0) {
      x = value;
    } else {
      includePoint(bounds, { x, y: value });
      hasPoint = true;
    }
    index++;
    return token;
  });
  if (!hasPoint) return null;
  finishBounds(bounds);
  return bounds;
}

function includePathBounds(bounds: PrivacyShadowBounds, path: string): void {
  const pathBounds = boundsFromGeneratedPath(path);
  if (pathBounds === null) return;
  includePoint(bounds, { x: pathBounds.minX, y: pathBounds.minY });
  includePoint(bounds, { x: pathBounds.maxX, y: pathBounds.maxY });
}

function appendCoreRegions(
  out: PrivacyShadowGeometry,
  axes: BodyAxes,
  head: HeadEstimate,
  minConfidence: number
): void {
  const { down, shoulderMid, hipMid, shoulderWidth, hipWidth, torsoLength, bodyRef } = axes;
  const constants = PRIVACY_SHADOW_VISUAL_CONSTANTS;
  const torsoTop = add(shoulderMid, scale(down, -bodyRef * 0.012));
  const torsoBottom = add(hipMid, scale(down, bodyRef * 0.06 * constants.torsoBlobHeightScale));
  const torsoTopWidth = Math.max(shoulderWidth * 0.6, bodyRef * 0.115) * constants.torsoBlobWidth;
  const torsoBottomWidth = Math.max(hipWidth * 0.74, bodyRef * 0.105) * constants.pelvisBlobScale;
  appendCapsuleRegion(out, torsoTop, torsoBottom, torsoTopWidth, torsoBottomWidth, head.confidence, minConfidence);

  const pelvisCenter = add(hipMid, scale(down, bodyRef * 0.062));
  appendEllipseRegion(
    out,
    pelvisCenter,
    Math.max(hipWidth * 0.92, bodyRef * 0.118) * constants.pelvisBlobScale,
    bodyRef * 0.082 * constants.pelvisBlobScale,
    down,
    head.confidence,
    minConfidence
  );

  const headCenter = add(head.center, scale(down, torsoLength * 0.035));
  const headRy = Math.min(Math.max(head.ry * 0.96, bodyRef * 0.082), bodyRef * 0.13) * constants.headBlobScale;
  appendEllipseRegion(
    out,
    headCenter,
    Math.min(Math.max(head.rx * 0.95, bodyRef * 0.058), bodyRef * 0.092) * constants.headBlobScale,
    headRy,
    down,
    head.confidence,
    minConfidence
  );
  appendCapsuleRegion(
    out,
    add(headCenter, scale(down, headRy * 0.62)),
    add(shoulderMid, scale(down, -bodyRef * 0.022)),
    bodyRef * 0.04,
    bodyRef * 0.068,
    head.confidence,
    minConfidence
  );
}

function appendLimbRegions(
  pose: ScreenPoseLandmarks,
  out: PrivacyShadowGeometry,
  axes: BodyAxes,
  minConfidence: number
): void {
  appendArmRegions(pose, out, axes, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_INDEX, LM.LEFT_PINKY, minConfidence);
  appendArmRegions(pose, out, axes, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_INDEX, LM.RIGHT_PINKY, minConfidence);
  appendLegRegions(pose, out, axes, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX, minConfidence);
  appendLegRegions(pose, out, axes, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX, minConfidence);
}

function appendArmRegions(
  pose: ScreenPoseLandmarks,
  out: PrivacyShadowGeometry,
  axes: BodyAxes,
  shoulderLm: LM,
  elbowLm: LM,
  wristLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  minConfidence: number
): void {
  const constants = PRIVACY_SHADOW_VISUAL_CONSTANTS;
  const shoulderConfidence = landmarkConfidence(pose, shoulderLm);
  const elbowConfidence = landmarkConfidence(pose, elbowLm);
  if (!landmarkFinite(pose, shoulderLm) || !landmarkFinite(pose, elbowLm) || Math.min(shoulderConfidence, elbowConfidence) < SOFT_MIN_CONFIDENCE) {
    out.skippedPartCount++;
    return;
  }

  const shoulder = pointFor(pose, shoulderLm);
  const elbow = pointFor(pose, elbowLm);
  appendCapsuleRegion(
    out,
    lerpPoint(shoulder, elbow, 0.08),
    elbow,
    axes.bodyRef * 0.045 * constants.upperArmBlobWidth,
    axes.bodyRef * 0.036 * constants.upperArmBlobWidth,
    Math.min(shoulderConfidence, elbowConfidence),
    minConfidence
  );

  const wristConfidence = landmarkConfidence(pose, wristLm);
  if (!landmarkFinite(pose, wristLm) || wristConfidence < SOFT_MIN_CONFIDENCE) {
    out.skippedPartCount++;
    return;
  }
  const wrist = pointFor(pose, wristLm);
  appendCapsuleRegion(
    out,
    lerpPoint(elbow, wrist, 0.08),
    wrist,
    axes.bodyRef * 0.034 * constants.forearmBlobWidth,
    axes.bodyRef * 0.026 * constants.forearmBlobWidth,
    Math.min(elbowConfidence, wristConfidence),
    minConfidence
  );

  const palm = handPointOrFallback(pose, wrist, indexLm, pinkyLm);
  appendEllipseRegion(
    out,
    lerpPoint(wrist, palm.point, 0.52),
    axes.bodyRef * 0.028 * constants.handBlobScale,
    axes.bodyRef * 0.034 * constants.handBlobScale,
    normalize({ x: palm.point.x - wrist.x, y: palm.point.y - wrist.y }),
    Math.min(wristConfidence, palm.confidence),
    minConfidence
  );
}

function appendLegRegions(
  pose: ScreenPoseLandmarks,
  out: PrivacyShadowGeometry,
  axes: BodyAxes,
  hipLm: LM,
  kneeLm: LM,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  minConfidence: number
): void {
  const constants = PRIVACY_SHADOW_VISUAL_CONSTANTS;
  const hipConfidence = landmarkConfidence(pose, hipLm);
  const kneeConfidence = landmarkConfidence(pose, kneeLm);
  if (!landmarkFinite(pose, hipLm) || !landmarkFinite(pose, kneeLm) || Math.min(hipConfidence, kneeConfidence) < SOFT_MIN_CONFIDENCE) {
    out.skippedPartCount++;
    return;
  }

  const hip = pointFor(pose, hipLm);
  const knee = pointFor(pose, kneeLm);
  appendCapsuleRegion(
    out,
    lerpPoint(hip, knee, 0.04),
    knee,
    axes.bodyRef * 0.057 * constants.thighBlobWidth,
    axes.bodyRef * 0.043 * constants.thighBlobWidth,
    Math.min(hipConfidence, kneeConfidence),
    minConfidence
  );

  const ankleConfidence = landmarkConfidence(pose, ankleLm);
  if (!landmarkFinite(pose, ankleLm) || ankleConfidence < SOFT_MIN_CONFIDENCE) {
    out.skippedPartCount++;
    return;
  }
  const ankle = pointFor(pose, ankleLm);
  appendCapsuleRegion(
    out,
    lerpPoint(knee, ankle, 0.08),
    ankle,
    axes.bodyRef * 0.04 * constants.shinBlobWidth,
    axes.bodyRef * 0.027 * constants.shinBlobWidth,
    Math.min(kneeConfidence, ankleConfidence),
    minConfidence
  );

  const foot = footPointOrFallback(pose, ankle, heelLm, toeLm);
  appendEllipseRegion(
    out,
    lerpPoint(ankle, foot.point, 0.56),
    axes.bodyRef * 0.034 * constants.footBlobScale,
    axes.bodyRef * 0.048 * constants.footBlobScale,
    normalize({ x: foot.point.x - ankle.x, y: foot.point.y - ankle.y }),
    Math.min(ankleConfidence, foot.confidence),
    minConfidence
  );
}

function appendEllipseRegion(
  out: PrivacyShadowGeometry,
  center: Point,
  rx: number,
  ry: number,
  axis: Point,
  confidence: number,
  minConfidence: number
): void {
  if (confidence < SOFT_MIN_CONFIDENCE || !pointFinite(center)) {
    out.skippedPartCount++;
    return;
  }
  const constants = PRIVACY_SHADOW_VISUAL_CONSTANTS;
  const soft = constants.shadowSoftness;
  out.outerPath += ellipsePath(center, rx * soft, ry * soft, axis);
  if (confidence >= minConfidence * 0.48) out.midPath += ellipsePath(center, rx * 1.08, ry * 1.08, axis);
  if (confidence >= minConfidence * 0.78) out.corePath += ellipsePath(center, rx * 0.72, ry * 0.72, axis);
  out.shapeCount++;
  includeEllipseBounds(out.bounds, center, Math.max(rx, ry) * soft);
}

function appendCapsuleRegion(
  out: PrivacyShadowGeometry,
  start: Point,
  end: Point,
  startWidth: number,
  endWidth: number,
  confidence: number,
  minConfidence: number
): void {
  if (confidence < SOFT_MIN_CONFIDENCE || !pointFinite(start) || !pointFinite(end)) {
    out.skippedPartCount++;
    return;
  }
  const constants = PRIVACY_SHADOW_VISUAL_CONSTANTS;
  const soft = constants.shadowSoftness;
  out.outerPath += capsulePath(start, end, startWidth * soft, endWidth * soft);
  if (confidence >= minConfidence * 0.48) out.midPath += capsulePath(start, end, startWidth * 1.06, endWidth * 1.06);
  if (confidence >= minConfidence * 0.78) out.corePath += capsulePath(start, end, startWidth * 0.68, endWidth * 0.68);
  out.shapeCount++;
  includePoint(out.bounds, start);
  includePoint(out.bounds, end);
}

function createBodyAxes(
  pose: ScreenPoseLandmarks,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>
): BodyAxes {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const shoulderWidth = distance(torso.leftShoulder, torso.rightShoulder);
  const hipWidth = distance(torso.leftHip, torso.rightHip);
  const torsoLength = distance(shoulderMid, hipMid);
  const leftLeg = reliableLegLength(pose, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE);
  const rightLeg = reliableLegLength(pose, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const shoulderSide = normalize({ x: torso.leftShoulder.x - torso.rightShoulder.x, y: torso.leftShoulder.y - torso.rightShoulder.y });
  return {
    side: Math.hypot(shoulderSide.x, shoulderSide.y) > 0.01 ? shoulderSide : { x: down.y, y: -down.x },
    down,
    shoulderMid,
    hipMid,
    shoulderWidth,
    hipWidth,
    torsoLength,
    bodyRef: Math.max(MIN_BODY_REF, torsoLength, leftLeg, rightLeg, shoulderWidth * 2.1),
  };
}

function synthesizeHead(axes: BodyAxes, confidence: number): HeadEstimate {
  return {
    center: add(axes.shoulderMid, scale(axes.down, -axes.bodyRef * 0.22)),
    rx: axes.bodyRef * 0.07,
    ry: axes.bodyRef * 0.095,
    confidence: confidence * 0.62,
  };
}

function handPointOrFallback(
  pose: ScreenPoseLandmarks,
  wrist: Point,
  indexLm: LM,
  pinkyLm: LM
): { point: Point; confidence: number } {
  const indexConfidence = landmarkConfidence(pose, indexLm);
  const pinkyConfidence = landmarkConfidence(pose, pinkyLm);
  if (landmarkFinite(pose, indexLm) && landmarkFinite(pose, pinkyLm) && Math.min(indexConfidence, pinkyConfidence) >= SOFT_MIN_CONFIDENCE) {
    return {
      point: midpoint(pointFor(pose, indexLm), pointFor(pose, pinkyLm)),
      confidence: Math.min(indexConfidence, pinkyConfidence),
    };
  }
  return { point: add(wrist, { x: 0, y: 20 }), confidence: SOFT_MIN_CONFIDENCE };
}

function footPointOrFallback(
  pose: ScreenPoseLandmarks,
  ankle: Point,
  heelLm: LM,
  toeLm: LM
): { point: Point; confidence: number } {
  const heelConfidence = landmarkConfidence(pose, heelLm);
  const toeConfidence = landmarkConfidence(pose, toeLm);
  if (landmarkFinite(pose, heelLm) && landmarkFinite(pose, toeLm) && Math.min(heelConfidence, toeConfidence) >= SOFT_MIN_CONFIDENCE) {
    return {
      point: midpoint(pointFor(pose, heelLm), pointFor(pose, toeLm)),
      confidence: Math.min(heelConfidence, toeConfidence),
    };
  }
  return { point: add(ankle, { x: 0, y: 18 }), confidence: SOFT_MIN_CONFIDENCE };
}

function areFeetVisible(pose: ScreenPoseLandmarks, minConfidence: number): boolean {
  const left = Math.max(
    Math.min(landmarkConfidence(pose, LM.LEFT_ANKLE), landmarkConfidence(pose, LM.LEFT_HEEL)),
    Math.min(landmarkConfidence(pose, LM.LEFT_ANKLE), landmarkConfidence(pose, LM.LEFT_FOOT_INDEX))
  );
  const right = Math.max(
    Math.min(landmarkConfidence(pose, LM.RIGHT_ANKLE), landmarkConfidence(pose, LM.RIGHT_HEEL)),
    Math.min(landmarkConfidence(pose, LM.RIGHT_ANKLE), landmarkConfidence(pose, LM.RIGHT_FOOT_INDEX))
  );
  return left >= minConfidence && right >= minConfidence;
}

function reliableLegLength(pose: ScreenPoseLandmarks, hipLm: LM, kneeLm: LM, ankleLm: LM): number {
  if (!landmarkFinite(pose, hipLm) || !landmarkFinite(pose, kneeLm) || !landmarkFinite(pose, ankleLm)) return 0;
  return distance(pointFor(pose, hipLm), pointFor(pose, kneeLm)) + distance(pointFor(pose, kneeLm), pointFor(pose, ankleLm));
}

function capsulePath(start: Point, end: Point, startWidth: number, endWidth: number): string {
  const axis = normalize({ x: end.x - start.x, y: end.y - start.y });
  const normal = { x: -axis.y, y: axis.x };
  const a = add(start, scale(axis, -startWidth * 0.58));
  const b = add(end, scale(axis, endWidth * 0.58));
  const aLeft = add(a, scale(normal, startWidth));
  const aRight = add(a, scale(normal, -startWidth));
  const bLeft = add(b, scale(normal, endWidth));
  const bRight = add(b, scale(normal, -endWidth));
  const len = distance(a, b);
  return (
    `M${p(aLeft)}` +
    `C${p(add(aLeft, scale(axis, len * 0.32)))} ${p(add(bLeft, scale(axis, -len * 0.28)))} ${p(bLeft)}` +
    `Q${p(add(b, scale(axis, endWidth * 0.5)))} ${p(bRight)}` +
    `C${p(add(bRight, scale(axis, -len * 0.28)))} ${p(add(aRight, scale(axis, len * 0.32)))} ${p(aRight)}` +
    `Q${p(add(a, scale(axis, -startWidth * 0.5)))} ${p(aLeft)}Z`
  );
}

function ellipsePath(center: Point, rx: number, ry: number, axis: Point): string {
  const long = normalize(axis);
  const short = { x: -long.y, y: long.x };
  const top = add(center, scale(long, -ry));
  const right = add(center, scale(short, rx));
  const bottom = add(center, scale(long, ry));
  const left = add(center, scale(short, -rx));
  const k = 0.5523;
  return (
    `M${p(top)}` +
    `C${p(add(top, scale(short, rx * k)))} ${p(add(right, scale(long, -ry * k)))} ${p(right)}` +
    `C${p(add(right, scale(long, ry * k)))} ${p(add(bottom, scale(short, rx * k)))} ${p(bottom)}` +
    `C${p(add(bottom, scale(short, -rx * k)))} ${p(add(left, scale(long, ry * k)))} ${p(left)}` +
    `C${p(add(left, scale(long, -ry * k)))} ${p(add(top, scale(short, -rx * k)))} ${p(top)}Z`
  );
}

function emptyVisibility(): PrivacyShadowVisibility {
  return {
    headVisible: false,
    feetVisible: false,
    fullBodyVisible: false,
    trackingStable: false,
  };
}

function resetVisibility(visibility: PrivacyShadowVisibility): void {
  visibility.headVisible = false;
  visibility.feetVisible = false;
  visibility.fullBodyVisible = false;
  visibility.trackingStable = false;
}

function beginBounds(bounds: PrivacyShadowBounds): void {
  bounds.minX = Number.POSITIVE_INFINITY;
  bounds.minY = Number.POSITIVE_INFINITY;
  bounds.maxX = Number.NEGATIVE_INFINITY;
  bounds.maxY = Number.NEGATIVE_INFINITY;
}

function finishBounds(bounds: PrivacyShadowBounds): void {
  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY) || !Number.isFinite(bounds.maxX) || !Number.isFinite(bounds.maxY)) {
    bounds.minX = 0;
    bounds.minY = 0;
    bounds.maxX = 0;
    bounds.maxY = 0;
  }
}

function includeRenderableLandmarkBounds(bounds: PrivacyShadowBounds, pose: ScreenPoseLandmarks, minConfidence: number): void {
  for (let i = 0; i < pose.xs.length; i++) {
    if (Math.min(pose.visibility[i], pose.presence[i]) >= minConfidence && Number.isFinite(pose.xs[i]) && Number.isFinite(pose.ys[i])) {
      includePoint(bounds, { x: pose.xs[i], y: pose.ys[i] });
    }
  }
}

function includeEllipseBounds(bounds: PrivacyShadowBounds, center: Point, radius: number): void {
  includePoint(bounds, { x: center.x - radius, y: center.y - radius });
  includePoint(bounds, { x: center.x + radius, y: center.y + radius });
}

function includePoint(bounds: PrivacyShadowBounds, point: Point): void {
  if (!pointFinite(point)) return;
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function landmarkFinite(pose: ScreenPoseLandmarks, lm: LM): boolean {
  return pose.hasPose && Number.isFinite(pose.xs[lm]) && Number.isFinite(pose.ys[lm]);
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(pose.visibility[lm], pose.presence[lm]);
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
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

function normalize(point: Point): Point {
  const len = Math.hypot(point.x, point.y) || 1;
  return { x: point.x / len, y: point.y / len };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(point: Point, scalar: number): Point {
  return { x: point.x * scalar, y: point.y * scalar };
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  const low = Math.max(0.08, minConfidence * 0.38);
  if (confidence >= minConfidence) return 1;
  return clamp(PRIVACY_SHADOW_VISUAL_CONSTANTS.confidenceFadeOpacity + ((confidence - low) / Math.max(0.01, minConfidence - low)) * 0.4, 0.16, 0.82);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function p(point: Point): string {
  return `${f(point.x)} ${f(point.y)}`;
}

function f(value: number): string {
  return value.toFixed(1);
}
