import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export interface SoftSilhouetteGeometry {
  hasPose: boolean;
  corePath: string;
  limbPath: string;
  blendPath: string;
  rimPath: string;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
  opacity: number;
  bounds: SoftSilhouetteBounds;
}

export interface SoftSilhouetteBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SoftSilhouetteGeometryOptions {
  minConfidence?: number;
}

interface LimbSurfacePoints {
  outer: Point[];
  inner: Point[];
  cap: Point;
  rootBridge: Point;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const MIN_RENDER_CONFIDENCE = 0.12;
const EMPTY_BOUNDS: SoftSilhouetteBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
};

export function createSoftSilhouetteGeometry(): SoftSilhouetteGeometry {
  return {
    hasPose: false,
    corePath: '',
    limbPath: '',
    blendPath: '',
    rimPath: '',
    surfacePathCount: 0,
    dynamicPathCount: 0,
    shapeCount: 0,
    skippedPartCount: 0,
    opacity: 0,
    bounds: { ...EMPTY_BOUNDS },
  };
}

export function emptySoftSilhouetteGeometry(out: SoftSilhouetteGeometry): void {
  out.hasPose = false;
  out.corePath = '';
  out.limbPath = '';
  out.blendPath = '';
  out.rimPath = '';
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.shapeCount = 0;
  out.skippedPartCount = 0;
  out.opacity = 0;
  out.bounds.minX = 0;
  out.bounds.minY = 0;
  out.bounds.maxX = 0;
  out.bounds.maxY = 0;
}

export function buildSoftSilhouetteGeometry(
  pose: ScreenPoseLandmarks,
  out: SoftSilhouetteGeometry,
  options: SoftSilhouetteGeometryOptions = {}
): void {
  emptySoftSilhouetteGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const torso = getTorsoEstimate(pose, MIN_RENDER_CONFIDENCE);
  if (torso === null || torso.confidence < MIN_RENDER_CONFIDENCE) return;

  const bodyRef = estimateBodyReference(torso);
  const head = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE) ?? synthesizeHead(torso, bodyRef);
  if (head === null) return;

  beginBounds(out.bounds);
  includeTorsoBounds(out.bounds, torso);
  includeHeadBounds(out.bounds, head);

  const core = buildCorePath(pose, torso, head, bodyRef, minConfidence);
  const limbs = core.coversLimbs
    ? { path: '', shapeCount: 0 }
    : buildLimbPath(pose, torso, bodyRef, minConfidence, out);
  const blends = core.coversLimbs ? '' : buildBlendPath(torso, bodyRef);

  out.corePath = core.path;
  out.limbPath = limbs.path;
  out.blendPath = blends;
  out.rimPath = `${out.limbPath}${out.corePath}${out.blendPath}`;
  includeRenderableLandmarkBounds(out.bounds, pose, minConfidence);
  out.shapeCount =
    core.shapeCount +
    limbs.shapeCount +
    (out.blendPath ? 4 : 0);
  out.surfacePathCount =
    (out.limbPath ? 1 : 0) +
    (out.corePath ? 1 : 0) +
    (out.blendPath ? 1 : 0) +
    (out.rimPath ? 1 : 0);
  out.dynamicPathCount = out.surfacePathCount;
  out.hasPose = out.surfacePathCount > 0;
  out.opacity = confidenceOpacity(Math.min(torso.confidence, head.confidence), minConfidence);
  finishBounds(out.bounds);
}

export function isFiniteSoftSilhouetteGeometry(geometry: SoftSilhouetteGeometry): boolean {
  const path = `${geometry.corePath}${geometry.limbPath}${geometry.blendPath}${geometry.rimPath}`;
  return (
    Number.isFinite(geometry.surfacePathCount) &&
    Number.isFinite(geometry.dynamicPathCount) &&
    Number.isFinite(geometry.shapeCount) &&
    Number.isFinite(geometry.opacity) &&
    Number.isFinite(geometry.bounds.minX) &&
    Number.isFinite(geometry.bounds.minY) &&
    Number.isFinite(geometry.bounds.maxX) &&
    Number.isFinite(geometry.bounds.maxY) &&
    !path.includes('NaN') &&
    !path.includes('Infinity')
  );
}

function buildCorePath(
  pose: ScreenPoseLandmarks,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>,
  head: HeadEstimate,
  bodyRef: number,
  minConfidence: number
): {
  path: string;
  shapeCount: number;
  coversLimbs: boolean;
  anchors: {
    shoulderMid: Point;
    hipMid: Point;
    leftOut: Point;
    rightOut: Point;
    down: Point;
  };
} {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({
    x: hipMid.x - shoulderMid.x,
    y: hipMid.y - shoulderMid.y,
  });
  const leftOut = normalizeOr(
    { x: torso.leftShoulder.x - shoulderMid.x, y: torso.leftShoulder.y - shoulderMid.y },
    { x: -down.y, y: down.x }
  );
  const rightOut = normalizeOr(
    { x: torso.rightShoulder.x - shoulderMid.x, y: torso.rightShoulder.y - shoulderMid.y },
    { x: down.y, y: -down.x }
  );

  const headRx = clamp(Math.min(head.rx * 0.88, bodyRef * 0.155), 16, 34);
  const headRy = clamp(headRx * 1.34, 22, bodyRef * 0.285);
  const headCenter = add(head.center, down, bodyRef * 0.135);
  const neckHalfTop = clamp(bodyRef * 0.048, 7, 12);
  const neckHalfBottom = clamp(bodyRef * 0.072, 10, 16);
  const shoulderSoft = clamp(bodyRef * 0.092, 14, 29);
  const ribSoft = clamp(bodyRef * 0.058, 8, 18);
  const waistSoft = clamp(bodyRef * 0.018, 3, 7);
  const pelvisSoft = clamp(bodyRef * 0.082, 13, 26);

  const headTop = add(headCenter, down, -headRy);
  const leftTemple = add(headCenter, leftOut, headRx * 0.8, down, -headRy * 0.38);
  const leftCheek = add(headCenter, leftOut, headRx * 0.78, down, headRy * 0.08);
  const leftJawAngle = add(headCenter, leftOut, headRx * 0.56, down, headRy * 0.52);
  const leftJaw = add(headCenter, leftOut, headRx * 0.34, down, headRy * 0.76);
  const leftNeckTop = add(headCenter, leftOut, neckHalfTop, down, headRy * 0.88);
  const leftNeck = add(shoulderMid, leftOut, neckHalfBottom, down, -bodyRef * 0.072);
  const leftTrap = add(shoulderMid, leftOut, bodyRef * 0.145, down, -bodyRef * 0.032);
  const leftShoulder = add(torso.leftShoulder, leftOut, shoulderSoft, down, bodyRef * 0.066);
  const leftRib = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.4), leftOut, ribSoft);
  const leftWaist = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.68), leftOut, waistSoft);
  const leftHip = add(torso.leftHip, leftOut, pelvisSoft, down, bodyRef * 0.052);
  const leftGroin = add(hipMid, leftOut, bodyRef * 0.018, down, bodyRef * 0.112);
  const crotch = add(hipMid, down, bodyRef * 0.128);
  const rightGroin = add(hipMid, rightOut, bodyRef * 0.018, down, bodyRef * 0.112);
  const rightHip = add(torso.rightHip, rightOut, pelvisSoft, down, bodyRef * 0.052);
  const rightWaist = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.68), rightOut, waistSoft);
  const rightRib = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.4), rightOut, ribSoft);
  const rightShoulder = add(torso.rightShoulder, rightOut, shoulderSoft, down, bodyRef * 0.066);
  const rightTrap = add(shoulderMid, rightOut, bodyRef * 0.145, down, -bodyRef * 0.032);
  const rightNeck = add(shoulderMid, rightOut, neckHalfBottom, down, -bodyRef * 0.072);
  const rightJaw = add(headCenter, rightOut, headRx * 0.34, down, headRy * 0.76);
  const rightJawAngle = add(headCenter, rightOut, headRx * 0.56, down, headRy * 0.52);
  const rightNeckTop = add(headCenter, rightOut, neckHalfTop, down, headRy * 0.88);
  const rightCheek = add(headCenter, rightOut, headRx * 0.78, down, headRy * 0.08);
  const rightTemple = add(headCenter, rightOut, headRx * 0.8, down, -headRy * 0.38);

  const leftArm = buildLimbSurfacePoints(
    pose,
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    LM.LEFT_PINKY,
    shoulderMid,
    bodyRef,
    minConfidence,
    true
  );
  const rightArm = buildLimbSurfacePoints(
    pose,
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    LM.RIGHT_PINKY,
    shoulderMid,
    bodyRef,
    minConfidence,
    true
  );
  const leftLeg = buildLimbSurfacePoints(
    pose,
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    LM.LEFT_FOOT_INDEX,
    LM.LEFT_HEEL,
    hipMid,
    bodyRef,
    minConfidence,
    false
  );
  const rightLeg = buildLimbSurfacePoints(
    pose,
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    LM.RIGHT_FOOT_INDEX,
    LM.RIGHT_HEEL,
    hipMid,
    bodyRef,
    minConfidence,
    false
  );
  const unifiedPath =
    leftArm && rightArm && leftLeg && rightLeg
      ? buildUnifiedFigurePath({
          headTop,
          leftTemple,
          leftCheek,
          leftJawAngle,
          leftJaw,
          leftNeckTop,
          leftNeck,
          leftTrap,
          leftShoulder,
          leftRib,
          leftWaist,
          leftHip,
          leftGroin,
          crotch,
          rightGroin,
          rightHip,
          rightWaist,
          rightRib,
          rightShoulder,
          rightTrap,
          rightNeck,
          rightNeckTop,
          rightJaw,
          rightJawAngle,
          rightCheek,
          rightTemple,
          leftOut,
          rightOut,
          down,
          bodyRef,
          headRx,
          headRy,
          leftArm,
          rightArm,
          leftLeg,
          rightLeg,
        })
      : '';

  const path =
    unifiedPath ||
    `M${p(headTop)}` +
    `C${p(add(headTop, leftOut, headRx * 0.38))} ${p(add(leftTemple, down, -headRy * 0.16))} ${p(leftTemple)}` +
    `C${p(add(leftTemple, down, headRy * 0.3))} ${p(add(leftCheek, down, -headRy * 0.16))} ${p(leftCheek)}` +
    `C${p(add(leftCheek, down, headRy * 0.2))} ${p(add(leftJawAngle, leftOut, headRx * 0.05, down, -headRy * 0.06))} ${p(leftJawAngle)}` +
    `C${p(add(leftJawAngle, down, headRy * 0.08))} ${p(add(leftJaw, leftOut, headRx * 0.03, down, -headRy * 0.04))} ${p(leftJaw)}` +
    `C${p(add(leftJaw, leftOut, -bodyRef * 0.004, down, bodyRef * 0.024))} ${p(add(leftNeckTop, leftOut, -bodyRef * 0.003, down, -bodyRef * 0.012))} ${p(leftNeckTop)}` +
    `C${p(add(leftNeckTop, down, bodyRef * 0.026))} ${p(add(leftNeck, leftOut, -bodyRef * 0.008, down, -bodyRef * 0.024))} ${p(leftNeck)}` +
    `C${p(add(leftNeck, leftOut, bodyRef * 0.028, down, bodyRef * 0.024))} ${p(add(leftTrap, leftOut, -bodyRef * 0.04, down, -bodyRef * 0.018))} ${p(leftTrap)}` +
    `C${p(add(leftTrap, leftOut, bodyRef * 0.07, down, bodyRef * 0.018))} ${p(add(leftShoulder, leftOut, -bodyRef * 0.044, down, -bodyRef * 0.018))} ${p(leftShoulder)}` +
    `C${p(add(leftShoulder, leftOut, -bodyRef * 0.012, down, bodyRef * 0.14))} ${p(add(leftRib, leftOut, bodyRef * 0.012, down, -bodyRef * 0.1))} ${p(leftRib)}` +
    `C${p(add(leftRib, leftOut, -bodyRef * 0.01, down, bodyRef * 0.13))} ${p(add(leftWaist, leftOut, bodyRef * 0.012, down, -bodyRef * 0.08))} ${p(leftWaist)}` +
    `C${p(add(leftWaist, leftOut, -bodyRef * 0.012, down, bodyRef * 0.12))} ${p(add(leftHip, leftOut, -bodyRef * 0.045, down, -bodyRef * 0.08))} ${p(leftHip)}` +
    `C${p(add(leftHip, down, bodyRef * 0.07))} ${p(add(leftGroin, leftOut, bodyRef * 0.015))} ${p(leftGroin)}` +
    `Q${p(crotch)} ${p(rightGroin)}` +
    `C${p(add(rightGroin, rightOut, bodyRef * 0.015))} ${p(add(rightHip, down, bodyRef * 0.07))} ${p(rightHip)}` +
    `C${p(add(rightHip, rightOut, -bodyRef * 0.045, down, -bodyRef * 0.08))} ${p(add(rightWaist, rightOut, -bodyRef * 0.012, down, bodyRef * 0.12))} ${p(rightWaist)}` +
    `C${p(add(rightWaist, rightOut, bodyRef * 0.012, down, -bodyRef * 0.08))} ${p(add(rightRib, rightOut, -bodyRef * 0.01, down, bodyRef * 0.13))} ${p(rightRib)}` +
    `C${p(add(rightRib, rightOut, bodyRef * 0.012, down, -bodyRef * 0.1))} ${p(add(rightShoulder, rightOut, -bodyRef * 0.012, down, bodyRef * 0.14))} ${p(rightShoulder)}` +
    `C${p(add(rightShoulder, rightOut, -bodyRef * 0.044, down, -bodyRef * 0.018))} ${p(add(rightTrap, rightOut, bodyRef * 0.07, down, bodyRef * 0.018))} ${p(rightTrap)}` +
    `C${p(add(rightTrap, rightOut, -bodyRef * 0.04, down, -bodyRef * 0.018))} ${p(add(rightNeck, rightOut, bodyRef * 0.028, down, bodyRef * 0.024))} ${p(rightNeck)}` +
    `C${p(add(rightNeck, rightOut, -bodyRef * 0.008, down, -bodyRef * 0.024))} ${p(add(rightNeckTop, down, bodyRef * 0.026))} ${p(rightNeckTop)}` +
    `C${p(add(rightNeckTop, rightOut, -bodyRef * 0.003, down, -bodyRef * 0.012))} ${p(add(rightJaw, rightOut, -bodyRef * 0.004, down, bodyRef * 0.024))} ${p(rightJaw)}` +
    `C${p(add(rightJaw, rightOut, headRx * 0.03, down, -headRy * 0.04))} ${p(add(rightJawAngle, down, headRy * 0.08))} ${p(rightJawAngle)}` +
    `C${p(add(rightJawAngle, rightOut, headRx * 0.05, down, -headRy * 0.06))} ${p(add(rightCheek, down, headRy * 0.2))} ${p(rightCheek)}` +
    `C${p(add(rightCheek, down, -headRy * 0.16))} ${p(add(rightTemple, down, headRy * 0.3))} ${p(rightTemple)}` +
    `C${p(add(rightTemple, down, -headRy * 0.16))} ${p(add(headTop, rightOut, headRx * 0.38))} ${p(headTop)}Z`;

  return {
    path,
    shapeCount: 1,
    coversLimbs: unifiedPath !== '',
    anchors: { shoulderMid, hipMid, leftOut, rightOut, down },
  };
}

function buildLimbPath(
  pose: ScreenPoseLandmarks,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>,
  bodyRef: number,
  minConfidence: number,
  out: SoftSilhouetteGeometry
): { path: string; shapeCount: number } {
  let path = '';
  let shapeCount = 0;

  const limbSpecs = [
    [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_INDEX, LM.LEFT_PINKY, true],
    [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_INDEX, LM.RIGHT_PINKY, true],
    [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX, LM.LEFT_HEEL, false],
    [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX, LM.RIGHT_HEEL, false],
  ] as const;

  for (let i = 0; i < limbSpecs.length; i++) {
    const [rootLm, jointLm, endLm, terminalLm, terminalAltLm, arm] = limbSpecs[i];
    const rootMid = arm
      ? midpoint(torso.leftShoulder, torso.rightShoulder)
      : midpoint(torso.leftHip, torso.rightHip);
    const limb = buildLimbCapsule(
      pose,
      rootLm,
      jointLm,
      endLm,
      terminalLm,
      terminalAltLm,
      rootMid,
      bodyRef,
      minConfidence,
      arm
    );
    if (!limb) {
      out.skippedPartCount++;
      continue;
    }
    path += limb;
    shapeCount++;
  }

  includeRenderableLandmarkBounds(out.bounds, pose, minConfidence);
  return { path, shapeCount };
}

function buildLimbCapsule(
  pose: ScreenPoseLandmarks,
  rootLm: LM,
  jointLm: LM,
  endLm: LM,
  terminalLm: LM,
  terminalAltLm: LM,
  rootMid: Point,
  bodyRef: number,
  minConfidence: number,
  arm: boolean
): string {
  const surface = buildLimbSurfacePoints(
    pose,
    rootLm,
    jointLm,
    endLm,
    terminalLm,
    terminalAltLm,
    rootMid,
    bodyRef,
    minConfidence,
    arm
  );
  return surface ? organicLimbPath(surface) : '';
}

function buildUnifiedFigurePath(parts: {
  headTop: Point;
  leftTemple: Point;
  leftCheek: Point;
  leftJawAngle: Point;
  leftJaw: Point;
  leftNeckTop: Point;
  leftNeck: Point;
  leftTrap: Point;
  leftShoulder: Point;
  leftRib: Point;
  leftWaist: Point;
  leftHip: Point;
  leftGroin: Point;
  crotch: Point;
  rightGroin: Point;
  rightHip: Point;
  rightWaist: Point;
  rightRib: Point;
  rightShoulder: Point;
  rightTrap: Point;
  rightNeck: Point;
  rightNeckTop: Point;
  rightJaw: Point;
  rightJawAngle: Point;
  rightCheek: Point;
  rightTemple: Point;
  leftOut: Point;
  rightOut: Point;
  down: Point;
  bodyRef: number;
  headRx: number;
  headRy: number;
  leftArm: LimbSurfacePoints;
  rightArm: LimbSurfacePoints;
  leftLeg: LimbSurfacePoints;
  rightLeg: LimbSurfacePoints;
}): string {
  const {
    headTop,
    leftTemple,
    leftCheek,
    leftJawAngle,
    leftJaw,
    leftNeckTop,
    leftNeck,
    leftTrap,
    leftShoulder,
    leftRib,
    leftWaist,
    leftHip,
    leftGroin,
    crotch,
    rightGroin,
    rightHip,
    rightWaist,
    rightRib,
    rightShoulder,
    rightTrap,
    rightNeck,
    rightNeckTop,
    rightJaw,
    rightJawAngle,
    rightCheek,
    rightTemple,
    leftOut,
    rightOut,
    down,
    bodyRef,
    headRx,
    headRy,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  } = parts;

  return (
    `M${p(headTop)}` +
    `C${p(add(headTop, leftOut, headRx * 0.38))} ${p(add(leftTemple, down, -headRy * 0.16))} ${p(leftTemple)}` +
    `C${p(add(leftTemple, down, headRy * 0.3))} ${p(add(leftCheek, down, -headRy * 0.16))} ${p(leftCheek)}` +
    `C${p(add(leftCheek, down, headRy * 0.2))} ${p(add(leftJawAngle, leftOut, headRx * 0.05, down, -headRy * 0.06))} ${p(leftJawAngle)}` +
    `C${p(add(leftJawAngle, down, headRy * 0.08))} ${p(add(leftJaw, leftOut, headRx * 0.03, down, -headRy * 0.04))} ${p(leftJaw)}` +
    `C${p(add(leftJaw, leftOut, -bodyRef * 0.004, down, bodyRef * 0.024))} ${p(add(leftNeckTop, leftOut, -bodyRef * 0.003, down, -bodyRef * 0.012))} ${p(leftNeckTop)}` +
    `C${p(add(leftNeckTop, down, bodyRef * 0.026))} ${p(add(leftNeck, leftOut, -bodyRef * 0.008, down, -bodyRef * 0.024))} ${p(leftNeck)}` +
    `C${p(add(leftNeck, leftOut, bodyRef * 0.028, down, bodyRef * 0.024))} ${p(add(leftTrap, leftOut, -bodyRef * 0.04, down, -bodyRef * 0.018))} ${p(leftTrap)}` +
    `C${p(add(leftTrap, leftOut, bodyRef * 0.07, down, bodyRef * 0.018))} ${p(add(leftShoulder, leftOut, -bodyRef * 0.044, down, -bodyRef * 0.018))} ${p(leftShoulder)}` +
    `C${p(add(leftShoulder, down, bodyRef * 0.045))} ${p(add(leftArm.outer[0], leftOut, bodyRef * 0.012))} ${p(leftArm.outer[0])}` +
    cubicThrough(leftArm.outer[0], leftArm.outer[1]) +
    cubicThrough(leftArm.outer[1], leftArm.outer[2]) +
    cubicThrough(leftArm.outer[2], leftArm.outer[3]) +
    cubicThrough(leftArm.outer[3], leftArm.outer[4]) +
    `Q${p(leftArm.cap)} ${p(leftArm.inner[4])}` +
    cubicThrough(leftArm.inner[4], leftArm.inner[3]) +
    cubicThrough(leftArm.inner[3], leftArm.inner[2]) +
    cubicThrough(leftArm.inner[2], leftArm.inner[1]) +
    cubicThrough(leftArm.inner[1], leftArm.inner[0]) +
    `C${p(add(leftArm.inner[0], leftOut, -bodyRef * 0.016, down, bodyRef * 0.07))} ${p(add(leftRib, leftOut, bodyRef * 0.01, down, -bodyRef * 0.09))} ${p(leftRib)}` +
    `C${p(add(leftRib, leftOut, -bodyRef * 0.01, down, bodyRef * 0.13))} ${p(add(leftWaist, leftOut, bodyRef * 0.012, down, -bodyRef * 0.08))} ${p(leftWaist)}` +
    `C${p(add(leftWaist, leftOut, -bodyRef * 0.014, down, bodyRef * 0.13))} ${p(add(leftHip, leftOut, bodyRef * 0.01, down, -bodyRef * 0.042))} ${p(leftHip)}` +
    `C${p(add(leftHip, leftOut, -bodyRef * 0.01, down, bodyRef * 0.042))} ${p(add(leftLeg.outer[0], leftOut, -bodyRef * 0.002, down, -bodyRef * 0.008))} ${p(leftLeg.outer[0])}` +
    cubicThrough(leftLeg.outer[0], leftLeg.outer[1]) +
    cubicThrough(leftLeg.outer[1], leftLeg.outer[2]) +
    cubicThrough(leftLeg.outer[2], leftLeg.outer[3]) +
    cubicThrough(leftLeg.outer[3], leftLeg.outer[4]) +
    `Q${p(leftLeg.cap)} ${p(leftLeg.inner[4])}` +
    cubicThrough(leftLeg.inner[4], leftLeg.inner[3]) +
    cubicThrough(leftLeg.inner[3], leftLeg.inner[2]) +
    cubicThrough(leftLeg.inner[2], leftLeg.inner[1]) +
    cubicThrough(leftLeg.inner[1], leftLeg.inner[0]) +
    `C${p(add(leftLeg.inner[0], leftOut, -bodyRef * 0.004, down, bodyRef * 0.028))} ${p(add(crotch, leftOut, bodyRef * 0.022, down, -bodyRef * 0.008))} ${p(crotch)}` +
    `C${p(add(crotch, rightOut, bodyRef * 0.022, down, -bodyRef * 0.008))} ${p(add(rightLeg.inner[0], rightOut, -bodyRef * 0.004, down, bodyRef * 0.028))} ${p(rightLeg.inner[0])}` +
    cubicThrough(rightLeg.inner[0], rightLeg.inner[1]) +
    cubicThrough(rightLeg.inner[1], rightLeg.inner[2]) +
    cubicThrough(rightLeg.inner[2], rightLeg.inner[3]) +
    cubicThrough(rightLeg.inner[3], rightLeg.inner[4]) +
    `Q${p(rightLeg.cap)} ${p(rightLeg.outer[4])}` +
    cubicThrough(rightLeg.outer[4], rightLeg.outer[3]) +
    cubicThrough(rightLeg.outer[3], rightLeg.outer[2]) +
    cubicThrough(rightLeg.outer[2], rightLeg.outer[1]) +
    cubicThrough(rightLeg.outer[1], rightLeg.outer[0]) +
    `C${p(add(rightLeg.outer[0], rightOut, -bodyRef * 0.002, down, -bodyRef * 0.008))} ${p(add(rightHip, rightOut, -bodyRef * 0.01, down, bodyRef * 0.042))} ${p(rightHip)}` +
    `C${p(add(rightHip, rightOut, bodyRef * 0.01, down, -bodyRef * 0.042))} ${p(add(rightWaist, rightOut, -bodyRef * 0.014, down, bodyRef * 0.13))} ${p(rightWaist)}` +
    `C${p(add(rightWaist, rightOut, bodyRef * 0.012, down, -bodyRef * 0.08))} ${p(add(rightRib, rightOut, -bodyRef * 0.01, down, bodyRef * 0.13))} ${p(rightRib)}` +
    `C${p(add(rightRib, rightOut, bodyRef * 0.01, down, -bodyRef * 0.09))} ${p(add(rightArm.inner[0], rightOut, -bodyRef * 0.016, down, bodyRef * 0.07))} ${p(rightArm.inner[0])}` +
    cubicThrough(rightArm.inner[0], rightArm.inner[1]) +
    cubicThrough(rightArm.inner[1], rightArm.inner[2]) +
    cubicThrough(rightArm.inner[2], rightArm.inner[3]) +
    cubicThrough(rightArm.inner[3], rightArm.inner[4]) +
    `Q${p(rightArm.cap)} ${p(rightArm.outer[4])}` +
    cubicThrough(rightArm.outer[4], rightArm.outer[3]) +
    cubicThrough(rightArm.outer[3], rightArm.outer[2]) +
    cubicThrough(rightArm.outer[2], rightArm.outer[1]) +
    cubicThrough(rightArm.outer[1], rightArm.outer[0]) +
    `C${p(add(rightArm.outer[0], rightOut, bodyRef * 0.012))} ${p(add(rightShoulder, down, bodyRef * 0.045))} ${p(rightShoulder)}` +
    `C${p(add(rightShoulder, rightOut, -bodyRef * 0.044, down, -bodyRef * 0.018))} ${p(add(rightTrap, rightOut, bodyRef * 0.07, down, bodyRef * 0.018))} ${p(rightTrap)}` +
    `C${p(add(rightTrap, rightOut, -bodyRef * 0.04, down, -bodyRef * 0.018))} ${p(add(rightNeck, rightOut, bodyRef * 0.028, down, bodyRef * 0.024))} ${p(rightNeck)}` +
    `C${p(add(rightNeck, rightOut, -bodyRef * 0.008, down, -bodyRef * 0.024))} ${p(add(rightNeckTop, down, bodyRef * 0.026))} ${p(rightNeckTop)}` +
    `C${p(add(rightNeckTop, rightOut, -bodyRef * 0.003, down, -bodyRef * 0.012))} ${p(add(rightJaw, rightOut, -bodyRef * 0.004, down, bodyRef * 0.024))} ${p(rightJaw)}` +
    `C${p(add(rightJaw, rightOut, headRx * 0.03, down, -headRy * 0.04))} ${p(add(rightJawAngle, down, headRy * 0.08))} ${p(rightJawAngle)}` +
    `C${p(add(rightJawAngle, rightOut, headRx * 0.05, down, -headRy * 0.06))} ${p(add(rightCheek, down, headRy * 0.2))} ${p(rightCheek)}` +
    `C${p(add(rightCheek, down, -headRy * 0.16))} ${p(add(rightTemple, down, headRy * 0.3))} ${p(rightTemple)}` +
    `C${p(add(rightTemple, down, -headRy * 0.16))} ${p(add(headTop, rightOut, headRx * 0.38))} ${p(headTop)}Z`
  );
}

function buildLimbSurfacePoints(
  pose: ScreenPoseLandmarks,
  rootLm: LM,
  jointLm: LM,
  endLm: LM,
  terminalLm: LM,
  terminalAltLm: LM,
  rootMid: Point,
  bodyRef: number,
  minConfidence: number,
  arm: boolean
): LimbSurfacePoints | null {
  if (
    !landmarkRenderable(pose, rootLm, minConfidence) ||
    !landmarkRenderable(pose, jointLm, minConfidence) ||
    !landmarkRenderable(pose, endLm, minConfidence)
  ) {
    return null;
  }
  const root = pointFor(pose, rootLm);
  const joint = pointFor(pose, jointLm);
  const end = pointFor(pose, endLm);
  const rootDir = normalize({ x: joint.x - root.x, y: joint.y - root.y });
  const endDir = normalize({ x: end.x - joint.x, y: end.y - joint.y });
  const terminal = terminalPoint(pose, end, joint, terminalLm, terminalAltLm, bodyRef * (arm ? 0.11 : 0.15), minConfidence);
  const p0 = add(root, rootDir, arm ? bodyRef * 0.115 : bodyRef * 0.07);
  const p1 = lerpPoint(root, joint, arm ? 0.35 : 0.26);
  const p2 = add(joint, rootDir, arm ? bodyRef * 0.004 : bodyRef * 0.004);
  const p3 = lerpPoint(joint, end, arm ? 0.5 : 0.48);
  const p4 = add(terminal, endDir, arm ? bodyRef * 0.052 : bodyRef * 0.022);
  const centerline = [p0, p1, p2, p3, p4];
  const widths = arm
    ? [
        bodyRef * 0.084,
        bodyRef * 0.09,
        bodyRef * 0.044,
        bodyRef * 0.062,
        bodyRef * 0.048,
      ]
    : [
        bodyRef * 0.098,
        bodyRef * 0.132,
        bodyRef * 0.066,
        bodyRef * 0.092,
        bodyRef * 0.074,
      ];
  const outer = normalizeOr({ x: root.x - rootMid.x, y: root.y - rootMid.y }, normal(rootDir));
  return limbSurfaceFromCenterline(centerline, widths, outer, arm);
}

function buildBlendPath(
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>,
  bodyRef: number
): string {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const leftOut = normalizeOr(
    { x: torso.leftShoulder.x - shoulderMid.x, y: torso.leftShoulder.y - shoulderMid.y },
    { x: -down.y, y: down.x }
  );
  const rightOut = normalizeOr(
    { x: torso.rightShoulder.x - shoulderMid.x, y: torso.rightShoulder.y - shoulderMid.y },
    { x: down.y, y: -down.x }
  );
  return (
    ellipsePath(add(torso.leftShoulder, leftOut, bodyRef * 0.028, down, bodyRef * 0.04), bodyRef * 0.072, bodyRef * 0.06, leftOut, down) +
    ellipsePath(add(torso.rightShoulder, rightOut, bodyRef * 0.028, down, bodyRef * 0.04), bodyRef * 0.072, bodyRef * 0.06, rightOut, down) +
    ellipsePath(add(torso.leftHip, leftOut, bodyRef * 0.02, down, bodyRef * 0.08), bodyRef * 0.068, bodyRef * 0.072, leftOut, down) +
    ellipsePath(add(torso.rightHip, rightOut, bodyRef * 0.02, down, bodyRef * 0.08), bodyRef * 0.068, bodyRef * 0.072, rightOut, down)
  );
}

function terminalPoint(
  pose: ScreenPoseLandmarks,
  base: Point,
  previous: Point,
  primaryLm: LM,
  secondaryLm: LM,
  fallbackLength: number,
  minConfidence: number
): Point {
  const primary = landmarkRenderable(pose, primaryLm, minConfidence) ? pointFor(pose, primaryLm) : null;
  const secondary = landmarkRenderable(pose, secondaryLm, minConfidence) ? pointFor(pose, secondaryLm) : null;
  if (primary && secondary) return midpoint(primary, secondary);
  if (primary) return primary;
  if (secondary) return secondary;
  const direction = normalizeOr({ x: base.x - previous.x, y: base.y - previous.y }, { x: 0, y: 1 });
  return add(base, direction, fallbackLength);
}

function limbSurfaceFromCenterline(
  centerline: Point[],
  widths: number[],
  outward: Point,
  arm: boolean
): LimbSurfacePoints {
  const outerPoints: Point[] = [];
  const innerPoints: Point[] = [];
  for (let i = 0; i < centerline.length; i++) {
    const prev = centerline[Math.max(0, i - 1)];
    const next = centerline[Math.min(centerline.length - 1, i + 1)];
    const tangent = normalizeOr({ x: next.x - prev.x, y: next.y - prev.y }, { x: 0, y: 1 });
    const n = normal(tangent);
    const signedNormal = dot(n, outward) >= 0 ? n : { x: -n.x, y: -n.y };
    const outerScale = arm ? [1.08, 1.04, 0.84, 0.96, 0.62][i] : [1.04, 1.08, 0.88, 1.08, 0.94][i];
    const innerScale = arm ? [0.84, 0.78, 0.72, 0.82, 0.52][i] : [0.86, 0.84, 0.76, 0.88, 0.78][i];
    outerPoints.push(add(centerline[i], signedNormal, widths[i] * outerScale));
    innerPoints.push(add(centerline[i], signedNormal, -widths[i] * innerScale));
  }

  const terminalForward = normalizeOr(
    {
      x: centerline[centerline.length - 1].x - centerline[centerline.length - 2].x,
      y: centerline[centerline.length - 1].y - centerline[centerline.length - 2].y,
    },
    { x: 0, y: 1 }
  );
  const startBack = normalizeOr(
    { x: centerline[0].x - centerline[1].x, y: centerline[0].y - centerline[1].y },
    { x: 0, y: -1 }
  );
  const toeOrHand = add(centerline[centerline.length - 1], terminalForward, widths[widths.length - 1] * (arm ? 1.45 : 1.62));
  const rootBridge = add(centerline[0], startBack, widths[0] * 0.38);

  return {
    outer: outerPoints,
    inner: innerPoints,
    cap: toeOrHand,
    rootBridge,
  };
}

function organicLimbPath(surface: LimbSurfacePoints): string {
  const { outer: outerPoints, inner: innerPoints, cap, rootBridge } = surface;
  return (
    `M${p(outerPoints[0])}` +
    cubicThrough(outerPoints[0], outerPoints[1]) +
    cubicThrough(outerPoints[1], outerPoints[2]) +
    cubicThrough(outerPoints[2], outerPoints[3]) +
    cubicThrough(outerPoints[3], outerPoints[4]) +
    `Q${p(cap)} ${p(innerPoints[4])}` +
    cubicThrough(innerPoints[4], innerPoints[3]) +
    cubicThrough(innerPoints[3], innerPoints[2]) +
    cubicThrough(innerPoints[2], innerPoints[1]) +
    cubicThrough(innerPoints[1], innerPoints[0]) +
    `Q${p(rootBridge)} ${p(outerPoints[0])}Z`
  );
}

function cubicThrough(from: Point, to: Point): string {
  return `C${p(lerpPoint(from, to, 0.48))} ${p(lerpPoint(to, from, 0.28))} ${p(to)}`;
}

function ellipsePath(center: Point, rx: number, ry: number, side: Point, down: Point): string {
  const top = add(center, down, -ry);
  const right = add(center, side, rx);
  const bottom = add(center, down, ry);
  const left = add(center, side, -rx);
  return (
    `M${p(top)}` +
    `C${p(add(top, side, rx * 0.55))} ${p(add(right, down, -ry * 0.55))} ${p(right)}` +
    `C${p(add(right, down, ry * 0.55))} ${p(add(bottom, side, rx * 0.55))} ${p(bottom)}` +
    `C${p(add(bottom, side, -rx * 0.55))} ${p(add(left, down, ry * 0.55))} ${p(left)}` +
    `C${p(add(left, down, -ry * 0.55))} ${p(add(top, side, -rx * 0.55))} ${p(top)}Z`
  );
}

function synthesizeHead(
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>,
  bodyRef: number
): HeadEstimate | null {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const shoulderWidth = distance(torso.leftShoulder, torso.rightShoulder);
  const rx = clamp(Math.max(shoulderWidth * 0.28, bodyRef * 0.15), 15, 48);
  return {
    center: add(shoulderMid, down, -bodyRef * 0.53),
    rx,
    ry: rx * 1.22,
    confidence: torso.confidence * 0.52,
  };
}

function estimateBodyReference(torso: NonNullable<ReturnType<typeof getTorsoEstimate>>): number {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  return Math.max(
    distance(torso.leftShoulder, torso.rightShoulder) * 1.22,
    distance(torso.leftHip, torso.rightHip) * 1.28,
    distance(shoulderMid, hipMid),
    80
  );
}

function landmarkRenderable(pose: ScreenPoseLandmarks, lm: LM, minConfidence: number): boolean {
  return (
    pose.hasPose &&
    Number.isFinite(pose.xs[lm]) &&
    Number.isFinite(pose.ys[lm]) &&
    Math.min(pose.visibility[lm], pose.presence[lm]) >= minConfidence
  );
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
}

function includeRenderableLandmarkBounds(
  bounds: SoftSilhouetteBounds,
  pose: ScreenPoseLandmarks,
  minConfidence: number
): void {
  for (let lm = 0; lm < pose.xs.length; lm++) {
    if (
      Number.isFinite(pose.xs[lm]) &&
      Number.isFinite(pose.ys[lm]) &&
      Math.min(pose.visibility[lm], pose.presence[lm]) >= minConfidence
    ) {
      includePoint(bounds, { x: pose.xs[lm], y: pose.ys[lm] });
    }
  }
}

function includeTorsoBounds(
  bounds: SoftSilhouetteBounds,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>
): void {
  includePoint(bounds, torso.leftShoulder);
  includePoint(bounds, torso.rightShoulder);
  includePoint(bounds, torso.leftHip);
  includePoint(bounds, torso.rightHip);
}

function includeHeadBounds(bounds: SoftSilhouetteBounds, head: HeadEstimate): void {
  includePoint(bounds, { x: head.center.x - head.rx, y: head.center.y - head.ry });
  includePoint(bounds, { x: head.center.x + head.rx, y: head.center.y + head.ry });
}

function beginBounds(bounds: SoftSilhouetteBounds): void {
  bounds.minX = Number.POSITIVE_INFINITY;
  bounds.minY = Number.POSITIVE_INFINITY;
  bounds.maxX = Number.NEGATIVE_INFINITY;
  bounds.maxY = Number.NEGATIVE_INFINITY;
}

function finishBounds(bounds: SoftSilhouetteBounds): void {
  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.maxY)
  ) {
    bounds.minX = 0;
    bounds.minY = 0;
    bounds.maxX = 0;
    bounds.maxY = 0;
  }
}

function includePoint(bounds: SoftSilhouetteBounds, point: Point): void {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function add(base: Point, dirA: Point, amountA: number, dirB?: Point, amountB = 0): Point {
  return {
    x: base.x + dirA.x * amountA + (dirB ? dirB.x * amountB : 0),
    y: base.y + dirA.y * amountA + (dirB ? dirB.y * amountB : 0),
  };
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

function normal(dir: Point): Point {
  return { x: -dir.y, y: dir.x };
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
  if (!Number.isFinite(len) || len < 0.001) return normalize(fallback);
  return { x: point.x / len, y: point.y / len };
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence) / Math.max(0.01, 1 - minConfidence), 0.28, 1);
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
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}
