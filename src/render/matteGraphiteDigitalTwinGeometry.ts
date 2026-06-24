import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type Point,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import {
  MATTE_GRAPHITE_DIGITAL_TWIN_CALIBRATION_SAMPLE_TARGET,
  MATTE_GRAPHITE_DIGITAL_TWIN_COLORS,
  MATTE_GRAPHITE_DIGITAL_TWIN_DYNAMIC_PATH_CAP,
  MATTE_GRAPHITE_DIGITAL_TWIN_INTERNAL_CONTROL_VERTEX_COUNT,
  MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP,
} from './matteGraphiteDigitalTwinConfig';

export type MatteGraphiteDigitalTwinSurfaceId =
  | 'rightArm'
  | 'rightLeg'
  | 'centralShell'
  | 'leftLeg'
  | 'leftArm'
  | 'torsoHighlight'
  | 'sideShade'
  | 'sternumAccent';

export type MatteGraphiteDigitalTwinCalibrationState =
  | 'fallback'
  | 'collecting'
  | 'locked';

export interface MatteGraphiteDigitalTwinSurface {
  id: MatteGraphiteDigitalTwinSurfaceId;
  path: string;
  fill: string;
  opacity: number;
  confidence: number;
  visible: boolean;
  bounds: Bounds;
}

export interface MatteGraphiteDigitalTwinProportions {
  bodyScale: number;
  shoulderWidth: number;
  hipWidth: number;
  torsoLength: number;
  headRx: number;
  headRy: number;
  upperArmLength: number;
  forearmLength: number;
  thighLength: number;
  lowerLegLength: number;
}

export interface MatteGraphiteDigitalTwinContinuity {
  centralShellContinuous: boolean;
  headAttached: boolean;
  leftArmContinuous: boolean;
  rightArmContinuous: boolean;
  leftLegContinuous: boolean;
  rightLegContinuous: boolean;
  leftArmHasElbow: boolean;
  rightArmHasElbow: boolean;
  leftLegHasKnee: boolean;
  rightLegHasKnee: boolean;
}

export interface MatteGraphiteDigitalTwinGeometry {
  hasPose: boolean;
  opacity: number;
  surfacePathCount: number;
  maxSurfacePathCount: number;
  dynamicPathCount: number;
  maxDynamicPathCount: number;
  internalControlVertexCount: number;
  maxInternalControlVertexCount: number;
  proportionCalibrationComplete: boolean;
  calibrationState: MatteGraphiteDigitalTwinCalibrationState;
  proportions: MatteGraphiteDigitalTwinProportions;
  bounds: Bounds;
  drawOrderKey: 'deterministic-right-rear-left-front';
  continuity: MatteGraphiteDigitalTwinContinuity;
  surfaces: MatteGraphiteDigitalTwinSurface[];
}

export interface MatteGraphiteDigitalTwinGeometryOptions {
  minConfidence?: number;
  calibration?: MatteGraphiteDigitalTwinCalibration;
}

export interface MatteGraphiteDigitalTwinCalibration {
  samples: ProportionSample[];
  locked: boolean;
  proportions: MatteGraphiteDigitalTwinProportions;
}

interface ProportionSample {
  bodyScale: number;
  shoulderWidth: number;
  hipWidth: number;
  torsoLength: number;
  headRx: number;
  headRy: number;
  upperArmLength: number;
  forearmLength: number;
  thighLength: number;
  lowerLegLength: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface LimbModel {
  surface: MatteGraphiteDigitalTwinSurfaceId;
  confidence: number;
  visible: boolean;
  continuous: boolean;
  jointContinuous: boolean;
  path: string;
  bounds: Bounds;
  fill: string;
  opacity: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const MIN_RENDER_CONFIDENCE = 0.12;
const EMPTY_BOUNDS: Bounds = {
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
};

const SURFACE_IDS: readonly MatteGraphiteDigitalTwinSurfaceId[] = [
  'rightArm',
  'rightLeg',
  'centralShell',
  'leftLeg',
  'leftArm',
  'torsoHighlight',
  'sideShade',
  'sternumAccent',
];

const DEFAULT_PROPORTIONS: MatteGraphiteDigitalTwinProportions = {
  bodyScale: 52,
  shoulderWidth: 70,
  hipWidth: 48,
  torsoLength: 124,
  headRx: 20,
  headRy: 25,
  upperArmLength: 58,
  forearmLength: 51,
  thighLength: 82,
  lowerLegLength: 78,
};

export function createMatteGraphiteDigitalTwinCalibration(): MatteGraphiteDigitalTwinCalibration {
  return {
    samples: [],
    locked: false,
    proportions: { ...DEFAULT_PROPORTIONS },
  };
}

export function resetMatteGraphiteDigitalTwinCalibration(
  calibration: MatteGraphiteDigitalTwinCalibration
): void {
  calibration.samples.length = 0;
  calibration.locked = false;
  calibration.proportions = { ...DEFAULT_PROPORTIONS };
}

export function createMatteGraphiteDigitalTwinGeometry(): MatteGraphiteDigitalTwinGeometry {
  return {
    hasPose: false,
    opacity: 1,
    surfacePathCount: 0,
    maxSurfacePathCount: MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP,
    dynamicPathCount: 0,
    maxDynamicPathCount: MATTE_GRAPHITE_DIGITAL_TWIN_DYNAMIC_PATH_CAP,
    internalControlVertexCount: 0,
    maxInternalControlVertexCount: MATTE_GRAPHITE_DIGITAL_TWIN_INTERNAL_CONTROL_VERTEX_COUNT,
    proportionCalibrationComplete: false,
    calibrationState: 'fallback',
    proportions: { ...DEFAULT_PROPORTIONS },
    bounds: emptyBounds(),
    drawOrderKey: 'deterministic-right-rear-left-front',
    continuity: emptyContinuity(),
    surfaces: SURFACE_IDS.map((id) => ({
      id,
      path: '',
      fill: MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.primaryGraphite,
      opacity: 0,
      confidence: 0,
      visible: false,
      bounds: emptyBounds(),
    })),
  };
}

export function emptyMatteGraphiteDigitalTwinGeometry(
  out: MatteGraphiteDigitalTwinGeometry
): void {
  out.hasPose = false;
  out.opacity = 1;
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.internalControlVertexCount = 0;
  out.proportionCalibrationComplete = false;
  out.calibrationState = 'fallback';
  out.proportions = { ...DEFAULT_PROPORTIONS };
  out.bounds = emptyBounds();
  out.continuity = emptyContinuity();
  for (let i = 0; i < out.surfaces.length; i++) {
    const surface = out.surfaces[i];
    surface.path = '';
    surface.fill = MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.primaryGraphite;
    surface.opacity = 0;
    surface.confidence = 0;
    surface.visible = false;
    surface.bounds = emptyBounds();
  }
}

export function buildMatteGraphiteDigitalTwinGeometry(
  pose: ScreenPoseLandmarks,
  out: MatteGraphiteDigitalTwinGeometry,
  options: MatteGraphiteDigitalTwinGeometryOptions = {}
): void {
  emptyMatteGraphiteDigitalTwinGeometry(out);
  if (!pose.hasPose) return;
  out.hasPose = true;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const calibration = options.calibration;
  const currentSample = measureProportions(pose);
  if (calibration) {
    updateCalibration(calibration, currentSample);
    out.proportions = { ...resolveProportions(calibration, currentSample) };
    out.proportionCalibrationComplete = calibration.locked;
    out.calibrationState = calibration.locked
      ? 'locked'
      : calibration.samples.length > 0
        ? 'collecting'
        : 'fallback';
  } else {
    out.proportions = currentSample ?? { ...DEFAULT_PROPORTIONS };
    out.calibrationState = currentSample ? 'collecting' : 'fallback';
  }

  const centralConfidence = centralConfidenceForPose(pose);
  out.opacity = centralConfidence >= minConfidence ? 1 : 0.7;
  out.internalControlVertexCount = MATTE_GRAPHITE_DIGITAL_TWIN_INTERNAL_CONTROL_VERTEX_COUNT;

  const central = buildCentralShell(pose, out.proportions, minConfidence);
  setSurface(out, 'centralShell', central.path, central.fill, central.opacity, central.confidence, central.bounds);
  out.continuity.centralShellContinuous = central.visible;
  out.continuity.headAttached = central.headAttached;

  const rightArm = buildArmSurface(pose, 'rightArm', out.proportions, minConfidence);
  const rightLeg = buildLegSurface(pose, 'rightLeg', out.proportions, minConfidence);
  const leftLeg = buildLegSurface(pose, 'leftLeg', out.proportions, minConfidence);
  const leftArm = buildArmSurface(pose, 'leftArm', out.proportions, minConfidence);

  applyLimb(out, rightArm);
  applyLimb(out, rightLeg);
  applyLimb(out, leftLeg);
  applyLimb(out, leftArm);

  const overlays = buildTonalOverlays(pose, out.proportions, central);
  setSurface(
    out,
    'torsoHighlight',
    overlays.highlightPath,
    `url(#${'matteGraphiteHighlight'})`,
    overlays.highlightPath ? 0.34 : 0,
    central.confidence,
    overlays.highlightBounds
  );
  setSurface(
    out,
    'sideShade',
    overlays.shadePath,
    MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.deepGraphite,
    overlays.shadePath ? 0.22 : 0,
    central.confidence,
    overlays.shadeBounds
  );
  setSurface(
    out,
    'sternumAccent',
    overlays.accentPath,
    MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.haleEmeraldAccent,
    overlays.accentPath ? 0.94 : 0,
    central.confidence,
    overlays.accentBounds
  );

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
  out.bounds = finiteBounds(bounds) ? bounds : emptyBounds();
}

export function getMatteGraphiteDigitalTwinSurface(
  geometry: MatteGraphiteDigitalTwinGeometry,
  id: MatteGraphiteDigitalTwinSurfaceId
): MatteGraphiteDigitalTwinSurface {
  const surface = geometry.surfaces.find((candidate) => candidate.id === id);
  if (!surface) throw new Error(`Unknown matte graphite surface: ${id}`);
  return surface;
}

export function isFiniteMatteGraphiteDigitalTwinGeometry(
  geometry: MatteGraphiteDigitalTwinGeometry
): boolean {
  if (
    !Number.isFinite(geometry.opacity) ||
    !Number.isFinite(geometry.surfacePathCount) ||
    !Number.isFinite(geometry.dynamicPathCount) ||
    !Number.isFinite(geometry.internalControlVertexCount)
  ) {
    return false;
  }
  for (const value of Object.values(geometry.proportions)) {
    if (!Number.isFinite(value)) return false;
  }
  for (let i = 0; i < geometry.surfaces.length; i++) {
    const surface = geometry.surfaces[i];
    if (
      !Number.isFinite(surface.opacity) ||
      !Number.isFinite(surface.confidence) ||
      !finitePath(surface.path)
    ) {
      return false;
    }
    if (surface.visible && !finiteBounds(surface.bounds)) return false;
  }
  return true;
}

function buildCentralShell(
  pose: ScreenPoseLandmarks,
  proportions: MatteGraphiteDigitalTwinProportions,
  minConfidence: number
): {
  path: string;
  fill: string;
  opacity: number;
  confidence: number;
  bounds: Bounds;
  visible: boolean;
  headAttached: boolean;
  anchors: {
    shoulderMid: Point;
    hipMid: Point;
    axis: Point;
    sideAxis: Point;
    neckCenter: Point;
    headCenter: Point;
  };
} {
  const torso = getTorsoEstimate(pose, MIN_RENDER_CONFIDENCE);
  const fallback = fallbackCentralAnchors(pose, proportions);
  const leftShoulder = torso?.leftShoulder ?? fallback.leftShoulder;
  const rightShoulder = torso?.rightShoulder ?? fallback.rightShoulder;
  const leftHip = torso?.leftHip ?? fallback.leftHip;
  const rightHip = torso?.rightHip ?? fallback.rightHip;
  const confidence = torso?.confidence ?? centralConfidenceForPose(pose) * 0.72;
  if (
    !pointFinite(leftShoulder) ||
    !pointFinite(rightShoulder) ||
    !pointFinite(leftHip) ||
    !pointFinite(rightHip) ||
    confidence < MIN_RENDER_CONFIDENCE
  ) {
    return emptyCentralShell();
  }

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const torsoLength = clamp(distance(shoulderMid, hipMid), proportions.torsoLength * 0.72, proportions.torsoLength * 1.28);
  const axis = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const sideAxis = normalizeOr(
    { x: leftShoulder.x - rightShoulder.x, y: leftShoulder.y - rightShoulder.y },
    { x: -axis.y, y: axis.x }
  );
  const shoulderHalf = clamp(proportions.shoulderWidth * 0.58, proportions.bodyScale * 0.42, proportions.bodyScale * 0.9);
  const hipHalf = clamp(proportions.hipWidth * 0.62, proportions.bodyScale * 0.28, shoulderHalf * 0.92);
  const waistHalf = clamp((shoulderHalf + hipHalf) * 0.43, proportions.bodyScale * 0.24, shoulderHalf * 0.72);
  const neckHalf = clamp(proportions.headRx * 0.34, proportions.bodyScale * 0.12, proportions.bodyScale * 0.22);
  const head = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE);
  const headRx = clamp(
    head ? blend(proportions.headRx, head.rx, 0.18) : proportions.headRx,
    proportions.bodyScale * 0.24,
    proportions.bodyScale * 0.48
  );
  const headRy = clamp(
    head ? blend(proportions.headRy, head.ry, 0.14) : proportions.headRy,
    headRx * 1.12,
    headRx * 1.42
  );
  const headCenterFallback = add(shoulderMid, scale(axis, -(headRy + proportions.bodyScale * 0.2)));
  const headCenter = head && pointFinite(head.center)
    ? clampHeadCenter(head.center, headCenterFallback, axis, sideAxis, headRx, headRy)
    : headCenterFallback;
  const neckCenter = add(shoulderMid, scale(axis, -proportions.bodyScale * 0.08));
  const upperNeck = add(headCenter, scale(axis, headRy * 0.58));

  const headTop = add(headCenter, scale(axis, -headRy));
  const headLeft = add(add(headCenter, scale(axis, -headRy * 0.12)), scale(sideAxis, headRx));
  const headRight = add(add(headCenter, scale(axis, -headRy * 0.12)), scale(sideAxis, -headRx));
  const jawLeft = add(add(upperNeck, scale(axis, -headRy * 0.05)), scale(sideAxis, neckHalf * 0.9));
  const jawRight = add(add(upperNeck, scale(axis, -headRy * 0.05)), scale(sideAxis, -neckHalf * 0.9));
  const neckLeft = add(neckCenter, scale(sideAxis, neckHalf));
  const neckRight = add(neckCenter, scale(sideAxis, -neckHalf));
  const shoulderLeft = add(shoulderMid, scale(sideAxis, shoulderHalf));
  const shoulderRight = add(shoulderMid, scale(sideAxis, -shoulderHalf));
  const waist = add(shoulderMid, scale(axis, torsoLength * 0.56));
  const waistLeft = add(waist, scale(sideAxis, waistHalf));
  const waistRight = add(waist, scale(sideAxis, -waistHalf));
  const hipLeft = add(add(hipMid, scale(axis, torsoLength * 0.08)), scale(sideAxis, hipHalf));
  const hipRight = add(add(hipMid, scale(axis, torsoLength * 0.08)), scale(sideAxis, -hipHalf));
  const pelvisBottom = add(hipMid, scale(axis, torsoLength * 0.18));

  const points = [
    headTop, headLeft, jawLeft, neckLeft, shoulderLeft, waistLeft, hipLeft, pelvisBottom,
    hipRight, waistRight, shoulderRight, neckRight, jawRight, headRight,
  ];
  const path = [
    `M${pointPath(neckLeft)}`,
    `C${pointPath(jawLeft)} ${pointPath(headLeft)} ${pointPath(headTop)}`,
    `C${pointPath(headRight)} ${pointPath(jawRight)} ${pointPath(neckRight)}`,
    `C${pointPath(add(neckRight, scale(sideAxis, -shoulderHalf * 0.3)))} ${pointPath(add(shoulderRight, scale(axis, -torsoLength * 0.08)))} ${pointPath(shoulderRight)}`,
    `C${pointPath(add(shoulderRight, scale(axis, torsoLength * 0.2)))} ${pointPath(add(waistRight, scale(axis, -torsoLength * 0.16)))} ${pointPath(waistRight)}`,
    `C${pointPath(add(waistRight, scale(axis, torsoLength * 0.14)))} ${pointPath(add(hipRight, scale(axis, -torsoLength * 0.08)))} ${pointPath(hipRight)}`,
    `Q${pointPath(pelvisBottom)} ${pointPath(hipLeft)}`,
    `C${pointPath(add(hipLeft, scale(axis, -torsoLength * 0.08)))} ${pointPath(add(waistLeft, scale(axis, torsoLength * 0.14)))} ${pointPath(waistLeft)}`,
    `C${pointPath(add(waistLeft, scale(axis, -torsoLength * 0.16)))} ${pointPath(add(shoulderLeft, scale(axis, torsoLength * 0.2)))} ${pointPath(shoulderLeft)}`,
    `C${pointPath(add(shoulderLeft, scale(axis, -torsoLength * 0.08)))} ${pointPath(add(neckLeft, scale(sideAxis, shoulderHalf * 0.3)))} ${pointPath(neckLeft)} Z`,
  ].join(' ');

  return {
    path,
    fill: `url(#${'matteGraphiteBody'})`,
    opacity: opacityForConfidence(confidence, minConfidence),
    confidence,
    bounds: boundsForPoints(points),
    visible: true,
    headAttached: true,
    anchors: {
      shoulderMid,
      hipMid,
      axis,
      sideAxis,
      neckCenter,
      headCenter,
    },
  };
}

function buildArmSurface(
  pose: ScreenPoseLandmarks,
  side: 'leftArm' | 'rightArm',
  proportions: MatteGraphiteDigitalTwinProportions,
  minConfidence: number
): LimbModel {
  const left = side === 'leftArm';
  const shoulder = left ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const elbow = left ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const wrist = left ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
  const index = left ? LM.LEFT_INDEX : LM.RIGHT_INDEX;
  const baseFill = left
    ? `url(#${'matteGraphiteBody'})`
    : `url(#${'matteGraphiteRear'})`;
  const p0 = pointFor(pose, shoulder);
  const p1 = pointFor(pose, elbow);
  const p2 = pointFor(pose, wrist);
  const confidence = Math.min(
    landmarkConfidence(pose, shoulder),
    landmarkConfidence(pose, elbow),
    landmarkConfidence(pose, wrist)
  );
  if (!pointFinite(p0) || !pointFinite(p1) || !pointFinite(p2) || confidence < MIN_RENDER_CONFIDENCE) {
    return emptyLimb(side);
  }
  const hand = terminalPoint(pose, wrist, index, proportions.upperArmLength * 0.32, confidence);
  const widths: [number, number, number, number] = [
    clamp(proportions.bodyScale * 0.2, 8, 25),
    clamp(proportions.bodyScale * 0.17, 7, 22),
    clamp(proportions.bodyScale * 0.12, 5, 17),
    clamp(proportions.bodyScale * 0.07, 3, 12),
  ];
  return buildLimbModel(side, [p0, p1, p2, hand.point], widths, confidence, minConfidence, baseFill);
}

function buildLegSurface(
  pose: ScreenPoseLandmarks,
  side: 'leftLeg' | 'rightLeg',
  proportions: MatteGraphiteDigitalTwinProportions,
  minConfidence: number
): LimbModel {
  const left = side === 'leftLeg';
  const hip = left ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const knee = left ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
  const ankle = left ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
  const foot = left ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX;
  const baseFill = left
    ? `url(#${'matteGraphiteBody'})`
    : `url(#${'matteGraphiteRear'})`;
  const p0 = pointFor(pose, hip);
  const p1 = pointFor(pose, knee);
  const p2 = pointFor(pose, ankle);
  const confidence = Math.min(
    landmarkConfidence(pose, hip),
    landmarkConfidence(pose, knee),
    landmarkConfidence(pose, ankle)
  );
  if (!pointFinite(p0) || !pointFinite(p1) || !pointFinite(p2) || confidence < MIN_RENDER_CONFIDENCE) {
    return emptyLimb(side);
  }
  const footTip = terminalPoint(pose, ankle, foot, proportions.lowerLegLength * 0.24, confidence);
  const widths: [number, number, number, number] = [
    clamp(proportions.bodyScale * 0.26, 11, 32),
    clamp(proportions.bodyScale * 0.2, 9, 26),
    clamp(proportions.bodyScale * 0.13, 6, 18),
    clamp(proportions.bodyScale * 0.1, 5, 16),
  ];
  return buildLimbModel(side, [p0, p1, p2, footTip.point], widths, confidence, minConfidence, baseFill);
}

function buildLimbModel(
  surface: MatteGraphiteDigitalTwinSurfaceId,
  centers: readonly [Point, Point, Point, Point],
  widths: readonly [number, number, number, number],
  confidence: number,
  minConfidence: number,
  baseFill: string
): LimbModel {
  const cleaned = cleanCenterline(centers);
  if (!cleaned.valid) return emptyLimb(surface);
  const leftSide: Point[] = [];
  const rightSide: Point[] = [];
  for (let i = 0; i < cleaned.points.length; i++) {
    const tangent = tangentAt(cleaned.points, i);
    const normal = { x: -tangent.y, y: tangent.x };
    const half = widths[i] * 0.5;
    leftSide.push(add(cleaned.points[i], scale(normal, half)));
    rightSide.push(add(cleaned.points[i], scale(normal, -half)));
  }
  const reversedRight = [...rightSide].reverse();
  const path = [
    smoothPath(leftSide),
    `C${pointPath(add(leftSide[3], scale(normalize({ x: centers[3].x - centers[2].x, y: centers[3].y - centers[2].y }), widths[3] * 0.18)))} ${pointPath(add(rightSide[3], scale(normalize({ x: centers[3].x - centers[2].x, y: centers[3].y - centers[2].y }), widths[3] * 0.18)))} ${pointPath(rightSide[3])}`,
    smoothPath(reversedRight, false),
    `Q${pointPath(centers[0])} ${pointPath(leftSide[0])} Z`,
  ].join(' ');
  const jointContinuous =
    distance(cleaned.points[0], cleaned.points[1]) > 1 &&
    distance(cleaned.points[1], cleaned.points[2]) > 1;
  return {
    surface,
    confidence,
    visible: true,
    continuous: true,
    jointContinuous,
    path,
    bounds: boundsForPoints([...leftSide, ...rightSide]),
    fill: fillForConfidence(confidence, minConfidence, baseFill),
    opacity: opacityForConfidence(confidence, minConfidence),
  };
}

function buildTonalOverlays(
  pose: ScreenPoseLandmarks,
  proportions: MatteGraphiteDigitalTwinProportions,
  central: ReturnType<typeof buildCentralShell>
): {
  highlightPath: string;
  highlightBounds: Bounds;
  shadePath: string;
  shadeBounds: Bounds;
  accentPath: string;
  accentBounds: Bounds;
} {
  if (!central.visible) {
    return {
      highlightPath: '',
      highlightBounds: emptyBounds(),
      shadePath: '',
      shadeBounds: emptyBounds(),
      accentPath: '',
      accentBounds: emptyBounds(),
    };
  }
  const { shoulderMid, hipMid, axis, sideAxis } = central.anchors;
  const torsoLength = distance(shoulderMid, hipMid);
  const highlightTop = add(add(shoulderMid, scale(axis, torsoLength * 0.18)), scale(sideAxis, -proportions.bodyScale * 0.12));
  const highlightMid = add(add(shoulderMid, scale(axis, torsoLength * 0.44)), scale(sideAxis, -proportions.bodyScale * 0.05));
  const highlightBottom = add(add(hipMid, scale(axis, torsoLength * 0.02)), scale(sideAxis, proportions.bodyScale * 0.01));
  const highlightPath = [
    `M${pointPath(highlightTop)}`,
    `C${pointPath(add(highlightTop, scale(axis, torsoLength * 0.16)))} ${pointPath(add(highlightMid, scale(axis, -torsoLength * 0.1)))} ${pointPath(highlightMid)}`,
    `C${pointPath(add(highlightMid, scale(axis, torsoLength * 0.1)))} ${pointPath(add(highlightBottom, scale(axis, -torsoLength * 0.08)))} ${pointPath(highlightBottom)}`,
    `C${pointPath(add(highlightBottom, scale(sideAxis, proportions.bodyScale * 0.13)))} ${pointPath(add(highlightTop, scale(sideAxis, proportions.bodyScale * 0.13)))} ${pointPath(highlightTop)} Z`,
  ].join(' ');

  const shadeTop = add(add(shoulderMid, scale(axis, torsoLength * 0.1)), scale(sideAxis, proportions.bodyScale * 0.28));
  const shadeBottom = add(add(hipMid, scale(axis, torsoLength * 0.08)), scale(sideAxis, proportions.bodyScale * 0.18));
  const shadeInnerTop = add(shadeTop, scale(sideAxis, -proportions.bodyScale * 0.16));
  const shadeInnerBottom = add(shadeBottom, scale(sideAxis, -proportions.bodyScale * 0.12));
  const shadePath = [
    `M${pointPath(shadeTop)}`,
    `C${pointPath(add(shadeTop, scale(axis, torsoLength * 0.25)))} ${pointPath(add(shadeBottom, scale(axis, -torsoLength * 0.08)))} ${pointPath(shadeBottom)}`,
    `L${pointPath(shadeInnerBottom)}`,
    `C${pointPath(add(shadeInnerBottom, scale(axis, -torsoLength * 0.1)))} ${pointPath(add(shadeInnerTop, scale(axis, torsoLength * 0.18)))} ${pointPath(shadeInnerTop)} Z`,
  ].join(' ');

  const sternum = add(shoulderMid, scale(axis, torsoLength * 0.28));
  const accentA = add(sternum, scale(sideAxis, -proportions.bodyScale * 0.02));
  const accentB = add(add(sternum, scale(axis, torsoLength * 0.06)), scale(sideAxis, proportions.bodyScale * 0.04));
  const accentC = add(add(sternum, scale(axis, torsoLength * 0.12)), scale(sideAxis, -proportions.bodyScale * 0.01));
  const accentWidth = clamp(proportions.bodyScale * 0.035, 1.6, 3.2);
  const accentPath = smallCapsulePath(accentA, accentB, accentC, accentWidth);
  void pose;
  return {
    highlightPath,
    highlightBounds: boundsForPoints([highlightTop, highlightMid, highlightBottom]),
    shadePath,
    shadeBounds: boundsForPoints([shadeTop, shadeBottom, shadeInnerTop, shadeInnerBottom]),
    accentPath,
    accentBounds: boundsForPoints([accentA, accentB, accentC]),
  };
}

function updateCalibration(
  calibration: MatteGraphiteDigitalTwinCalibration,
  sample: ProportionSample | null
): void {
  if (calibration.locked || sample === null) return;
  calibration.samples.push(sample);
  calibration.proportions = medianProportions(calibration.samples);
  if (calibration.samples.length >= MATTE_GRAPHITE_DIGITAL_TWIN_CALIBRATION_SAMPLE_TARGET) {
    calibration.locked = true;
  }
}

function resolveProportions(
  calibration: MatteGraphiteDigitalTwinCalibration,
  sample: ProportionSample | null
): MatteGraphiteDigitalTwinProportions {
  if (calibration.samples.length > 0) return calibration.proportions;
  return sample ?? { ...DEFAULT_PROPORTIONS };
}

function measureProportions(pose: ScreenPoseLandmarks): ProportionSample | null {
  const leftShoulder = pointFor(pose, LM.LEFT_SHOULDER);
  const rightShoulder = pointFor(pose, LM.RIGHT_SHOULDER);
  const leftHip = pointFor(pose, LM.LEFT_HIP);
  const rightHip = pointFor(pose, LM.RIGHT_HIP);
  if (
    !landmarkReliable(pose, LM.LEFT_SHOULDER) ||
    !landmarkReliable(pose, LM.RIGHT_SHOULDER) ||
    !landmarkReliable(pose, LM.LEFT_HIP) ||
    !landmarkReliable(pose, LM.RIGHT_HIP) ||
    !pointFinite(leftShoulder) ||
    !pointFinite(rightShoulder) ||
    !pointFinite(leftHip) ||
    !pointFinite(rightHip)
  ) {
    return null;
  }

  const shoulderWidth = clamp(distance(leftShoulder, rightShoulder), 28, 150);
  const hipWidth = clamp(distance(leftHip, rightHip), 22, 130);
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const torsoLength = clamp(distance(shoulderMid, hipMid), 48, 260);
  const bodyScale = estimateBodyScale(pose);
  const head = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE);

  return {
    bodyScale,
    shoulderWidth,
    hipWidth,
    torsoLength,
    headRx: clamp(head?.rx ?? shoulderWidth * 0.28, bodyScale * 0.24, bodyScale * 0.48),
    headRy: clamp(head?.ry ?? shoulderWidth * 0.35, bodyScale * 0.3, bodyScale * 0.62),
    upperArmLength: averageReliableDistance(pose, [LM.LEFT_SHOULDER, LM.LEFT_ELBOW], [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW]) ?? bodyScale * 1.15,
    forearmLength: averageReliableDistance(pose, [LM.LEFT_ELBOW, LM.LEFT_WRIST], [LM.RIGHT_ELBOW, LM.RIGHT_WRIST]) ?? bodyScale,
    thighLength: averageReliableDistance(pose, [LM.LEFT_HIP, LM.LEFT_KNEE], [LM.RIGHT_HIP, LM.RIGHT_KNEE]) ?? bodyScale * 1.58,
    lowerLegLength: averageReliableDistance(pose, [LM.LEFT_KNEE, LM.LEFT_ANKLE], [LM.RIGHT_KNEE, LM.RIGHT_ANKLE]) ?? bodyScale * 1.5,
  };
}

function medianProportions(samples: readonly ProportionSample[]): MatteGraphiteDigitalTwinProportions {
  return {
    bodyScale: median(samples.map((sample) => sample.bodyScale)),
    shoulderWidth: median(samples.map((sample) => sample.shoulderWidth)),
    hipWidth: median(samples.map((sample) => sample.hipWidth)),
    torsoLength: median(samples.map((sample) => sample.torsoLength)),
    headRx: median(samples.map((sample) => sample.headRx)),
    headRy: median(samples.map((sample) => sample.headRy)),
    upperArmLength: median(samples.map((sample) => sample.upperArmLength)),
    forearmLength: median(samples.map((sample) => sample.forearmLength)),
    thighLength: median(samples.map((sample) => sample.thighLength)),
    lowerLegLength: median(samples.map((sample) => sample.lowerLegLength)),
  };
}

function fallbackCentralAnchors(
  pose: ScreenPoseLandmarks,
  proportions: MatteGraphiteDigitalTwinProportions
): {
  leftShoulder: Point;
  rightShoulder: Point;
  leftHip: Point;
  rightHip: Point;
} {
  const shoulderMid = midpoint(pointFor(pose, LM.LEFT_SHOULDER), pointFor(pose, LM.RIGHT_SHOULDER));
  const hipMid = midpoint(pointFor(pose, LM.LEFT_HIP), pointFor(pose, LM.RIGHT_HIP));
  const axis = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const sideAxis = { x: -axis.y, y: axis.x };
  return {
    leftShoulder: add(shoulderMid, scale(sideAxis, proportions.shoulderWidth * 0.5)),
    rightShoulder: add(shoulderMid, scale(sideAxis, -proportions.shoulderWidth * 0.5)),
    leftHip: add(hipMid, scale(sideAxis, proportions.hipWidth * 0.5)),
    rightHip: add(hipMid, scale(sideAxis, -proportions.hipWidth * 0.5)),
  };
}

function applyLimb(out: MatteGraphiteDigitalTwinGeometry, model: LimbModel): void {
  setSurface(out, model.surface, model.path, model.fill, model.opacity, model.confidence, model.bounds);
  if (model.surface === 'leftArm') {
    out.continuity.leftArmContinuous = model.continuous;
    out.continuity.leftArmHasElbow = model.jointContinuous;
  } else if (model.surface === 'rightArm') {
    out.continuity.rightArmContinuous = model.continuous;
    out.continuity.rightArmHasElbow = model.jointContinuous;
  } else if (model.surface === 'leftLeg') {
    out.continuity.leftLegContinuous = model.continuous;
    out.continuity.leftLegHasKnee = model.jointContinuous;
  } else if (model.surface === 'rightLeg') {
    out.continuity.rightLegContinuous = model.continuous;
    out.continuity.rightLegHasKnee = model.jointContinuous;
  }
}

function setSurface(
  out: MatteGraphiteDigitalTwinGeometry,
  id: MatteGraphiteDigitalTwinSurfaceId,
  path: string,
  fill: string,
  opacity: number,
  confidence: number,
  bounds: Bounds
): void {
  const surface = getMatteGraphiteDigitalTwinSurface(out, id);
  surface.path = path;
  surface.fill = fill;
  surface.opacity = opacity;
  surface.confidence = confidence;
  surface.visible = path.length > 0 && opacity > 0;
  surface.bounds = bounds;
}

function terminalPoint(
  pose: ScreenPoseLandmarks,
  anchorLm: LM,
  tipLm: LM,
  fallbackLength: number,
  anchorConfidence: number
): { point: Point; confidence: number } {
  const anchor = pointFor(pose, anchorLm);
  const tip = pointFor(pose, tipLm);
  const tipConfidence = landmarkConfidence(pose, tipLm);
  if (pointFinite(tip) && tipConfidence >= MIN_RENDER_CONFIDENCE) {
    const rawLength = distance(anchor, tip);
    if (rawLength > 1) {
      const maxLength = fallbackLength * 1.25;
      const len = clamp(rawLength, fallbackLength * 0.42, maxLength);
      const dir = normalize({ x: tip.x - anchor.x, y: tip.y - anchor.y });
      return {
        point: add(anchor, scale(dir, len)),
        confidence: Math.min(anchorConfidence, tipConfidence),
      };
    }
  }
  const fallbackDir = { x: 0, y: 1 };
  return {
    point: add(anchor, scale(fallbackDir, fallbackLength * 0.62)),
    confidence: anchorConfidence * 0.72,
  };
}

function cleanCenterline(points: readonly Point[]): { valid: boolean; points: [Point, Point, Point, Point] } {
  const cleaned = points.map((point) => ({ ...point })) as [Point, Point, Point, Point];
  for (let i = 0; i < cleaned.length; i++) {
    if (!pointFinite(cleaned[i])) return { valid: false, points: cleaned };
    if (i > 0 && distance(cleaned[i], cleaned[i - 1]) < 1) {
      const dir = i >= 2
        ? normalize({ x: cleaned[i - 1].x - cleaned[i - 2].x, y: cleaned[i - 1].y - cleaned[i - 2].y })
        : { x: 0, y: 1 };
      cleaned[i] = add(cleaned[i - 1], scale(dir, 1.25));
    }
  }
  return { valid: true, points: cleaned };
}

function smoothPath(points: readonly Point[], includeMove = true): string {
  if (points.length === 0) return '';
  const parts: string[] = includeMove ? [`M${pointPath(points[0])}`] : [`L${pointPath(points[0])}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = add(p1, scale({ x: p2.x - p0.x, y: p2.y - p0.y }, 1 / 6));
    const c2 = add(p2, scale({ x: p1.x - p3.x, y: p1.y - p3.y }, 1 / 6));
    parts.push(`C${pointPath(c1)} ${pointPath(c2)} ${pointPath(p2)}`);
  }
  return parts.join(' ');
}

function smallCapsulePath(a: Point, b: Point, c: Point, width: number): string {
  const tangentA = normalize({ x: b.x - a.x, y: b.y - a.y });
  const tangentC = normalize({ x: c.x - b.x, y: c.y - b.y });
  const normalA = { x: -tangentA.y, y: tangentA.x };
  const normalC = { x: -tangentC.y, y: tangentC.x };
  const a1 = add(a, scale(normalA, width));
  const a2 = add(a, scale(normalA, -width));
  const c1 = add(c, scale(normalC, width * 0.72));
  const c2 = add(c, scale(normalC, -width * 0.72));
  return [
    `M${pointPath(a1)}`,
    `C${pointPath(add(b, scale(normalA, width)))} ${pointPath(add(b, scale(normalC, width * 0.72)))} ${pointPath(c1)}`,
    `Q${pointPath(c)} ${pointPath(c2)}`,
    `C${pointPath(add(b, scale(normalC, -width * 0.72)))} ${pointPath(add(b, scale(normalA, -width)))} ${pointPath(a2)}`,
    `Q${pointPath(a)} ${pointPath(a1)} Z`,
  ].join(' ');
}

function tangentAt(points: readonly Point[], index: number): Point {
  const prev = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  return normalize({ x: next.x - prev.x, y: next.y - prev.y });
}

function emptyCentralShell(): ReturnType<typeof buildCentralShell> {
  const zero = { x: 0, y: 0 };
  return {
    path: '',
    fill: MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.primaryGraphite,
    opacity: 0,
    confidence: 0,
    bounds: emptyBounds(),
    visible: false,
    headAttached: false,
    anchors: {
      shoulderMid: zero,
      hipMid: zero,
      axis: { x: 0, y: 1 },
      sideAxis: { x: 1, y: 0 },
      neckCenter: zero,
      headCenter: zero,
    },
  };
}

function emptyLimb(surface: MatteGraphiteDigitalTwinSurfaceId): LimbModel {
  return {
    surface,
    confidence: 0,
    visible: false,
    continuous: false,
    jointContinuous: false,
    path: '',
    bounds: emptyBounds(),
    fill: MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.lowConfidenceGraphite,
    opacity: 0,
  };
}

function emptyContinuity(): MatteGraphiteDigitalTwinContinuity {
  return {
    centralShellContinuous: false,
    headAttached: false,
    leftArmContinuous: false,
    rightArmContinuous: false,
    leftLegContinuous: false,
    rightLegContinuous: false,
    leftArmHasElbow: false,
    rightArmHasElbow: false,
    leftLegHasKnee: false,
    rightLegHasKnee: false,
  };
}

function centralConfidenceForPose(pose: ScreenPoseLandmarks): number {
  return Math.min(
    landmarkConfidence(pose, LM.LEFT_SHOULDER),
    landmarkConfidence(pose, LM.RIGHT_SHOULDER),
    landmarkConfidence(pose, LM.LEFT_HIP),
    landmarkConfidence(pose, LM.RIGHT_HIP)
  );
}

function averageReliableDistance(
  pose: ScreenPoseLandmarks,
  a: readonly [LM, LM],
  b: readonly [LM, LM]
): number | null {
  const values: number[] = [];
  if (landmarkReliable(pose, a[0]) && landmarkReliable(pose, a[1])) {
    values.push(distance(pointFor(pose, a[0]), pointFor(pose, a[1])));
  }
  if (landmarkReliable(pose, b[0]) && landmarkReliable(pose, b[1])) {
    values.push(distance(pointFor(pose, b[0]), pointFor(pose, b[1])));
  }
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function estimateBodyScale(pose: ScreenPoseLandmarks): number {
  const leftShoulder = pointFor(pose, LM.LEFT_SHOULDER);
  const rightShoulder = pointFor(pose, LM.RIGHT_SHOULDER);
  const leftHip = pointFor(pose, LM.LEFT_HIP);
  const rightHip = pointFor(pose, LM.RIGHT_HIP);
  const leftAnkle = pointFor(pose, LM.LEFT_ANKLE);
  const rightAnkle = pointFor(pose, LM.RIGHT_ANKLE);
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const values = [
    pointFinite(leftShoulder) && pointFinite(rightShoulder) ? distance(leftShoulder, rightShoulder) * 0.74 : NaN,
    pointFinite(leftHip) && pointFinite(rightHip) ? distance(leftHip, rightHip) * 1.06 : NaN,
    pointFinite(shoulderMid) && pointFinite(hipMid) ? distance(shoulderMid, hipMid) * 0.43 : NaN,
    pointFinite(leftHip) && pointFinite(leftAnkle) ? distance(leftHip, leftAnkle) * 0.31 : NaN,
    pointFinite(rightHip) && pointFinite(rightAnkle) ? distance(rightHip, rightAnkle) * 0.31 : NaN,
  ].filter(Number.isFinite) as number[];
  if (values.length === 0) return DEFAULT_PROPORTIONS.bodyScale;
  return clamp(median(values), 32, 96);
}

function clampHeadCenter(
  raw: Point,
  fallback: Point,
  axis: Point,
  sideAxis: Point,
  rx: number,
  ry: number
): Point {
  const delta = { x: raw.x - fallback.x, y: raw.y - fallback.y };
  const along = delta.x * axis.x + delta.y * axis.y;
  const side = delta.x * sideAxis.x + delta.y * sideAxis.y;
  return add(add(fallback, scale(axis, clamp(along, -ry * 0.42, ry * 0.42))), scale(sideAxis, clamp(side, -rx * 0.58, rx * 0.58)));
}

function fillForConfidence(confidence: number, minConfidence: number, baseFill: string): string {
  return confidence >= minConfidence ? baseFill : MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.lowConfidenceGraphite;
}

function opacityForConfidence(confidence: number, minConfidence: number): number {
  if (confidence >= minConfidence) return 1;
  return clamp(0.5 + confidence / Math.max(minConfidence, 0.01) * 0.3, 0.5, 0.8);
}

function landmarkReliable(pose: ScreenPoseLandmarks, lm: LM): boolean {
  return landmarkConfidence(pose, lm) >= DEFAULT_MIN_CONFIDENCE && pointFinite(pointFor(pose, lm));
}

function landmarkConfidence(pose: ScreenPoseLandmarks, lm: LM): number {
  return Math.min(finiteOrZero(pose.visibility[lm]), finiteOrZero(pose.presence[lm]));
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(point: Point, amount: number): Point {
  return { x: point.x * amount, y: point.y * amount };
}

function blend(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(point: Point): Point {
  const len = Math.sqrt(point.x * point.x + point.y * point.y);
  if (!Number.isFinite(len) || len < 0.0001) return { x: 0, y: 1 };
  return { x: point.x / len, y: point.y / len };
}

function normalizeOr(point: Point, fallback: Point): Point {
  const len = Math.sqrt(point.x * point.x + point.y * point.y);
  if (!Number.isFinite(len) || len < 0.0001) return normalize(fallback);
  return { x: point.x / len, y: point.y / len };
}

function pointFinite(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function median(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finite.length === 0) return 0;
  const mid = Math.floor(finite.length / 2);
  return finite.length % 2 === 0 ? (finite[mid - 1] + finite[mid]) * 0.5 : finite[mid];
}

function emptyBounds(): Bounds {
  return { ...EMPTY_BOUNDS };
}

function boundsForPoints(points: readonly Point[]): Bounds {
  let bounds = emptyBounds();
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!pointFinite(point)) continue;
    bounds = includePoint(bounds, point);
  }
  return bounds;
}

function includePoint(bounds: Bounds, point: Point): Bounds {
  return {
    minX: Math.min(bounds.minX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxX: Math.max(bounds.maxX, point.x),
    maxY: Math.max(bounds.maxY, point.y),
  };
}

function includeBounds(a: Bounds, b: Bounds): Bounds {
  if (!finiteBounds(a)) return b;
  if (!finiteBounds(b)) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function finiteBounds(bounds: Bounds): boolean {
  return (
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.minY) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.maxY) &&
    bounds.maxX >= bounds.minX &&
    bounds.maxY >= bounds.minY
  );
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function pointPath(point: Point): string {
  return `${fmt(point.x)},${fmt(point.y)}`;
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finitePath(path: string): boolean {
  return !/(NaN|Infinity|-Infinity)/.test(path);
}
