import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export interface ShadowSilhouetteContinuity {
  coreContinuous: boolean;
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

export interface ShadowSilhouetteBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ShadowSilhouetteGeometry {
  hasPose: boolean;
  bodyPath: string;
  neckPath: string;
  headPath: string;
  earPath: string;
  limbPath: string;
  accentPath: string;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
  opacity: number;
  bounds: ShadowSilhouetteBounds;
  continuity: ShadowSilhouetteContinuity;
}

export interface ShadowSilhouetteGeometryOptions {
  minConfidence?: number;
}

interface ShadowSilhouetteBodySurface {
  torsoPath: string;
  neckPath: string;
  headPath: string;
  earPath: string;
  accentPath: string;
  shapeCount: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const EMPTY_BOUNDS: ShadowSilhouetteBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
};

export function createShadowSilhouetteGeometry(): ShadowSilhouetteGeometry {
  return {
    hasPose: false,
    bodyPath: '',
    neckPath: '',
    headPath: '',
    earPath: '',
    limbPath: '',
    accentPath: '',
    surfacePathCount: 0,
    dynamicPathCount: 0,
    shapeCount: 0,
    skippedPartCount: 0,
    opacity: 0,
    bounds: { ...EMPTY_BOUNDS },
    continuity: emptyContinuity(),
  };
}

export function emptyShadowSilhouetteGeometry(out: ShadowSilhouetteGeometry): void {
  out.hasPose = false;
  out.bodyPath = '';
  out.neckPath = '';
  out.headPath = '';
  out.earPath = '';
  out.limbPath = '';
  out.accentPath = '';
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.shapeCount = 0;
  out.skippedPartCount = 0;
  out.opacity = 0;
  out.bounds.minX = 0;
  out.bounds.minY = 0;
  out.bounds.maxX = 0;
  out.bounds.maxY = 0;
  resetContinuity(out.continuity);
}

export function buildShadowSilhouetteGeometry(
  pose: ScreenPoseLandmarks,
  out: ShadowSilhouetteGeometry,
  options: ShadowSilhouetteGeometryOptions = {}
): void {
  emptyShadowSilhouetteGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const torso = getTorsoEstimate(pose, minConfidence);
  if (torso === null || torso.confidence < minConfidence * 0.72) return;

  const bodyRef = estimateBodyReference(torso);
  const head = getHeadEstimate(pose, minConfidence) ?? synthesizeHead(torso, bodyRef);
  if (head === null) return;

  beginBounds(out.bounds);
  includeTorsoBounds(out.bounds, torso);
  includeHeadBounds(out.bounds, head);

  const limb = buildLimbSurface(pose, bodyRef, minConfidence, out);
  const body = buildBodySurface(pose, torso, head, bodyRef, minConfidence, out);

  out.bodyPath = body.torsoPath;
  out.neckPath = body.neckPath;
  out.headPath = body.headPath;
  out.earPath = body.earPath;
  out.limbPath = limb.path;
  out.accentPath = body.accentPath;
  out.shapeCount = body.shapeCount + limb.shapeCount;
  out.surfacePathCount =
    (out.bodyPath ? 1 : 0) +
    (out.neckPath ? 1 : 0) +
    (out.headPath ? 1 : 0) +
    (out.earPath ? 1 : 0) +
    (out.limbPath ? 1 : 0) +
    (out.accentPath ? 1 : 0);
  out.dynamicPathCount = out.surfacePathCount;
  out.hasPose = out.surfacePathCount > 0;
  out.opacity = confidenceOpacity(Math.min(torso.confidence, head.confidence), minConfidence);
  finishBounds(out.bounds);
}

export function isFiniteShadowSilhouetteGeometry(geometry: ShadowSilhouetteGeometry): boolean {
  const path = `${geometry.bodyPath}${geometry.neckPath}${geometry.headPath}${geometry.earPath}${geometry.limbPath}${geometry.accentPath}`;
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

function buildBodySurface(
  pose: ScreenPoseLandmarks,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>,
  head: HeadEstimate,
  bodyRef: number,
  minConfidence: number,
  out: ShadowSilhouetteGeometry
): ShadowSilhouetteBodySurface {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({
    x: hipMid.x - shoulderMid.x,
    y: hipMid.y - shoulderMid.y,
  });
  const leftOut = normalize({
    x: torso.leftShoulder.x - shoulderMid.x,
    y: torso.leftShoulder.y - shoulderMid.y,
  });
  const rightOut = normalize({
    x: torso.rightShoulder.x - shoulderMid.x,
    y: torso.rightShoulder.y - shoulderMid.y,
  });
  const side = normalize({
    x: torso.rightShoulder.x - torso.leftShoulder.x,
    y: torso.rightShoulder.y - torso.leftShoulder.y,
  });

  const headRx = clamp(Math.min(head.rx * 0.92, bodyRef * 0.175), 14, 34);
  const headRy = clamp(headRx * 1.22, 18, bodyRef * 0.255);
  const headCenter = add(head.center, down, bodyRef * 0.055);
  const visualHead: HeadEstimate = {
    center: headCenter,
    rx: headRx,
    ry: headRy,
    confidence: head.confidence,
  };

  const leftNeck = add(shoulderMid, leftOut, bodyRef * 0.078, down, -bodyRef * 0.095);
  const rightNeck = add(shoulderMid, rightOut, bodyRef * 0.078, down, -bodyRef * 0.095);
  const leftTrap = add(torso.leftShoulder, leftOut, -bodyRef * 0.03, down, -bodyRef * 0.014);
  const rightTrap = add(torso.rightShoulder, rightOut, -bodyRef * 0.03, down, -bodyRef * 0.014);
  const leftShoulder = add(torso.leftShoulder, leftOut, bodyRef * 0.062, down, bodyRef * 0.02);
  const rightShoulder = add(torso.rightShoulder, rightOut, bodyRef * 0.062, down, bodyRef * 0.02);
  const leftDeltoid = add(torso.leftShoulder, leftOut, bodyRef * 0.088, down, bodyRef * 0.088);
  const rightDeltoid = add(torso.rightShoulder, rightOut, bodyRef * 0.088, down, bodyRef * 0.088);
  const leftSide = lerpPoint(torso.leftShoulder, torso.leftHip, 0.62);
  const rightSide = lerpPoint(torso.rightShoulder, torso.rightHip, 0.62);
  const waistMid = lerpPoint(shoulderMid, hipMid, 0.62);
  const leftArmpit = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.26), leftOut, bodyRef * 0.038);
  const rightArmpit = add(
    lerpPoint(torso.rightShoulder, torso.rightHip, 0.26),
    rightOut,
    bodyRef * 0.038
  );
  const leftRib = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.48), leftOut, bodyRef * 0.025);
  const rightRib = add(
    lerpPoint(torso.rightShoulder, torso.rightHip, 0.48),
    rightOut,
    bodyRef * 0.025
  );
  const leftWaist = lerpPoint(leftSide, waistMid, 0.22);
  const rightWaist = lerpPoint(rightSide, waistMid, 0.22);
  const leftHip = add(torso.leftHip, leftOut, bodyRef * 0.072, down, bodyRef * 0.034);
  const rightHip = add(torso.rightHip, rightOut, bodyRef * 0.072, down, bodyRef * 0.034);
  const leftGroin = add(hipMid, leftOut, bodyRef * 0.03, down, bodyRef * 0.145);
  const rightGroin = add(hipMid, rightOut, bodyRef * 0.03, down, bodyRef * 0.145);
  const crotch = add(hipMid, down, bodyRef * 0.17);

  const neckTop = add(visualHead.center, down, visualHead.ry * 0.64);
  const neckBottom = add(shoulderMid, down, -bodyRef * 0.08);
  const neckHalfTop = clamp(bodyRef * 0.054, 8, 19);
  const neckHalfBottom = clamp(bodyRef * 0.074, 11, 24);

  const torsoPath =
    `M${p(leftNeck)}` +
    `C${p(add(leftNeck, leftOut, bodyRef * 0.035))} ${p(leftTrap)} ${p(leftShoulder)}` +
    `C${p(add(leftShoulder, down, bodyRef * 0.018))} ${p(
      add(leftDeltoid, down, -bodyRef * 0.018)
    )} ${p(leftDeltoid)}` +
    `C${p(add(leftDeltoid, down, bodyRef * 0.11))} ${p(
      add(leftArmpit, down, -bodyRef * 0.045)
    )} ${p(leftArmpit)}` +
    `C${p(add(leftRib, down, -bodyRef * 0.035))} ${p(
      add(leftWaist, down, -bodyRef * 0.04)
    )} ${p(leftWaist)}` +
    `C${p(add(leftWaist, down, bodyRef * 0.14))} ${p(
      add(leftHip, down, -bodyRef * 0.085)
    )} ${p(leftHip)}` +
    `C${p(add(leftHip, down, bodyRef * 0.075))} ${p(
      add(leftGroin, leftOut, bodyRef * 0.012)
    )} ${p(leftGroin)}` +
    `Q${p(crotch)} ${p(rightGroin)}` +
    `C${p(add(rightGroin, rightOut, bodyRef * 0.012))} ${p(
      add(rightHip, down, bodyRef * 0.075)
    )} ${p(rightHip)}` +
    `C${p(add(rightHip, down, -bodyRef * 0.085))} ${p(
      add(rightWaist, down, bodyRef * 0.14)
    )} ${p(rightWaist)}` +
    `C${p(add(rightWaist, down, -bodyRef * 0.04))} ${p(
      add(rightRib, down, -bodyRef * 0.035)
    )} ${p(rightArmpit)}` +
    `C${p(add(rightArmpit, down, -bodyRef * 0.045))} ${p(
      add(rightDeltoid, down, bodyRef * 0.11)
    )} ${p(rightDeltoid)}` +
    `C${p(add(rightDeltoid, down, -bodyRef * 0.018))} ${p(
      add(rightShoulder, down, bodyRef * 0.018)
    )} ${p(rightShoulder)}` +
    `C${p(rightTrap)} ${p(add(rightNeck, rightOut, bodyRef * 0.035))} ${p(rightNeck)}` +
    `Q${p(add(shoulderMid, down, -bodyRef * 0.135))} ${p(leftNeck)}Z`;

  const neckPath = capsulePath(neckTop, neckBottom, neckHalfTop, neckHalfBottom);
  const headPath = headSilhouettePath(visualHead, side, down);
  const earPath = buildEarPath(pose, visualHead, side, down, bodyRef, minConfidence);
  const accentPath = torsoAccentPath(shoulderMid, hipMid, leftOut, down, bodyRef);

  out.continuity.coreContinuous = true;
  out.continuity.headAttached = true;
  return {
    torsoPath,
    neckPath,
    headPath,
    earPath,
    accentPath,
    shapeCount: earPath ? 6 : 4,
  };
}

function buildLimbSurface(
  pose: ScreenPoseLandmarks,
  bodyRef: number,
  minConfidence: number,
  out: ShadowSilhouetteGeometry
): { path: string; shapeCount: number } {
  let path = '';
  let shapeCount = 0;

  const leftArm = buildArmPath(
    pose,
    LM.LEFT_SHOULDER,
    LM.RIGHT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    minConfidence,
    bodyRef
  );
  if (leftArm) {
    path += leftArm;
    path += buildHandPath(
      pose,
      LM.LEFT_WRIST,
      LM.LEFT_ELBOW,
      LM.LEFT_INDEX,
      LM.LEFT_PINKY,
      LM.LEFT_THUMB,
      bodyRef,
      minConfidence
    );
    out.continuity.leftArmContinuous = true;
    out.continuity.leftArmHasElbow = true;
    shapeCount += 2;
  } else {
    out.skippedPartCount++;
  }

  const rightArm = buildArmPath(
    pose,
    LM.RIGHT_SHOULDER,
    LM.LEFT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    minConfidence,
    bodyRef
  );
  if (rightArm) {
    path += rightArm;
    path += buildHandPath(
      pose,
      LM.RIGHT_WRIST,
      LM.RIGHT_ELBOW,
      LM.RIGHT_INDEX,
      LM.RIGHT_PINKY,
      LM.RIGHT_THUMB,
      bodyRef,
      minConfidence
    );
    out.continuity.rightArmContinuous = true;
    out.continuity.rightArmHasElbow = true;
    shapeCount += 2;
  } else {
    out.skippedPartCount++;
  }

  const leftLeg = buildLegPath(
    pose,
    LM.LEFT_HIP,
    LM.RIGHT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    minConfidence,
    bodyRef
  );
  if (leftLeg) {
    path += leftLeg;
    path += buildFootPath(
      pose,
      LM.LEFT_ANKLE,
      LM.LEFT_HEEL,
      LM.LEFT_FOOT_INDEX,
      LM.LEFT_KNEE,
      bodyRef,
      minConfidence
    );
    out.continuity.leftLegContinuous = true;
    out.continuity.leftLegHasKnee = true;
    shapeCount += 2;
  } else {
    out.skippedPartCount++;
  }

  const rightLeg = buildLegPath(
    pose,
    LM.RIGHT_HIP,
    LM.LEFT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    minConfidence,
    bodyRef
  );
  if (rightLeg) {
    path += rightLeg;
    path += buildFootPath(
      pose,
      LM.RIGHT_ANKLE,
      LM.RIGHT_HEEL,
      LM.RIGHT_FOOT_INDEX,
      LM.RIGHT_KNEE,
      bodyRef,
      minConfidence
    );
    out.continuity.rightLegContinuous = true;
    out.continuity.rightLegHasKnee = true;
    shapeCount += 2;
  } else {
    out.skippedPartCount++;
  }

  includeRenderableLandmarkBounds(out.bounds, pose, minConfidence);
  return { path, shapeCount };
}

function buildArmPath(
  pose: ScreenPoseLandmarks,
  shoulderLm: LM,
  oppositeShoulderLm: LM,
  elbowLm: LM,
  wristLm: LM,
  minConfidence: number,
  bodyRef: number
): string {
  if (
    !landmarkRenderable(pose, shoulderLm, minConfidence) ||
    !landmarkRenderable(pose, elbowLm, minConfidence) ||
    !landmarkRenderable(pose, wristLm, minConfidence)
  ) {
    return '';
  }

  const shoulder = pointFor(pose, shoulderLm);
  const elbow = pointFor(pose, elbowLm);
  const wrist = pointFor(pose, wristLm);
  const oppositeShoulder = landmarkRenderable(pose, oppositeShoulderLm, minConfidence)
    ? pointFor(pose, oppositeShoulderLm)
    : null;
  const upperDir = normalize({ x: elbow.x - shoulder.x, y: elbow.y - shoulder.y });
  const foreDir = normalize({ x: wrist.x - elbow.x, y: wrist.y - elbow.y });
  const outward =
    oppositeShoulder !== null
      ? normalize({ x: shoulder.x - oppositeShoulder.x, y: shoulder.y - oppositeShoulder.y })
      : normal(upperDir);
  const root = add(shoulder, upperDir, bodyRef * 0.07, outward, bodyRef * 0.062);
  const upperArm = add(lerpPoint(shoulder, elbow, 0.44), outward, bodyRef * 0.008);
  const forearm = add(lerpPoint(elbow, wrist, 0.52), outward, bodyRef * 0.004);
  const handJoin = add(wrist, foreDir, bodyRef * 0.012);

  return fourJointCapsulePath(
    root,
    upperArm,
    forearm,
    handJoin,
    bodyRef * 0.056,
    bodyRef * 0.054,
    bodyRef * 0.045,
    bodyRef * 0.032
  );
}

function buildLegPath(
  pose: ScreenPoseLandmarks,
  hipLm: LM,
  oppositeHipLm: LM,
  kneeLm: LM,
  ankleLm: LM,
  minConfidence: number,
  bodyRef: number
): string {
  if (
    !landmarkRenderable(pose, hipLm, minConfidence) ||
    !landmarkRenderable(pose, kneeLm, minConfidence) ||
    !landmarkRenderable(pose, ankleLm, minConfidence)
  ) {
    return '';
  }

  const hip = pointFor(pose, hipLm);
  const knee = pointFor(pose, kneeLm);
  const ankle = pointFor(pose, ankleLm);
  const oppositeHip = landmarkRenderable(pose, oppositeHipLm, minConfidence)
    ? pointFor(pose, oppositeHipLm)
    : null;
  const thighDir = normalize({ x: knee.x - hip.x, y: knee.y - hip.y });
  const shinDir = normalize({ x: ankle.x - knee.x, y: ankle.y - knee.y });
  const outward =
    oppositeHip !== null ? normalize({ x: hip.x - oppositeHip.x, y: hip.y - oppositeHip.y }) : normal(thighDir);
  const root = add(hip, thighDir, -bodyRef * 0.006, outward, bodyRef * 0.036);
  const kneePoint = add(knee, outward, bodyRef * 0.012);
  const calf = add(lerpPoint(knee, ankle, 0.52), outward, bodyRef * 0.006);
  const anklePoint = add(ankle, shinDir, bodyRef * 0.012);

  return fourJointCapsulePath(
    root,
    kneePoint,
    calf,
    anklePoint,
    bodyRef * 0.092,
    bodyRef * 0.052,
    bodyRef * 0.064,
    bodyRef * 0.034
  );
}

function buildHandPath(
  pose: ScreenPoseLandmarks,
  wristLm: LM,
  elbowLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  thumbLm: LM,
  bodyRef: number,
  minConfidence: number
): string {
  if (!landmarkRenderable(pose, wristLm, minConfidence)) return '';

  const wrist = pointFor(pose, wristLm);
  const fallbackDir = landmarkRenderable(pose, elbowLm, minConfidence)
    ? normalize({ x: wrist.x - pose.xs[elbowLm], y: wrist.y - pose.ys[elbowLm] })
    : { x: 0, y: 1 };
  const distal = averageRenderablePoints(pose, [indexLm, pinkyLm, thumbLm], minConfidence);
  const tip = distal ?? add(wrist, fallbackDir, bodyRef * 0.075);
  const dir = normalize({ x: tip.x - wrist.x, y: tip.y - wrist.y });
  return capsulePath(
    add(wrist, dir, -bodyRef * 0.014),
    add(tip, dir, bodyRef * 0.025),
    clamp(bodyRef * 0.034, 4, 12),
    clamp(bodyRef * 0.046, 5, 15)
  );
}

function buildFootPath(
  pose: ScreenPoseLandmarks,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  kneeLm: LM,
  bodyRef: number,
  minConfidence: number
): string {
  if (!landmarkRenderable(pose, ankleLm, minConfidence)) return '';
  const ankle = pointFor(pose, ankleLm);
  const heel = landmarkRenderable(pose, heelLm, minConfidence) ? pointFor(pose, heelLm) : null;
  const toe = landmarkRenderable(pose, toeLm, minConfidence) ? pointFor(pose, toeLm) : null;

  if (heel !== null && toe !== null && distance(heel, toe) > 2) {
    return capsulePath(
      add(heel, normalize({ x: heel.x - ankle.x, y: heel.y - ankle.y }), bodyRef * 0.012),
      add(toe, normalize({ x: toe.x - heel.x, y: toe.y - heel.y }), bodyRef * 0.025),
      clamp(bodyRef * 0.026, 3, 10),
      clamp(bodyRef * 0.036, 4, 13)
    );
  }

  const dir = landmarkRenderable(pose, kneeLm, minConfidence)
    ? normalize({ x: ankle.x - pose.xs[kneeLm], y: ankle.y - pose.ys[kneeLm] })
    : { x: 1, y: 0 };
  return capsulePath(
    add(ankle, dir, -bodyRef * 0.01),
    add(ankle, dir, bodyRef * 0.078),
    clamp(bodyRef * 0.027, 3, 10),
    clamp(bodyRef * 0.034, 4, 12)
  );
}

function buildEarPath(
  pose: ScreenPoseLandmarks,
  head: HeadEstimate,
  side: Point,
  down: Point,
  bodyRef: number,
  minConfidence: number
): string {
  let path = '';
  const rx = clamp(bodyRef * 0.017, 3, 7);
  const ry = clamp(bodyRef * 0.03, 5, 11);
  if (landmarkRenderable(pose, LM.LEFT_EAR, minConfidence)) {
    const ear = pointFor(pose, LM.LEFT_EAR);
    const outward = normalize({ x: ear.x - head.center.x, y: ear.y - head.center.y });
    path += ellipsePath(add(ear, outward, rx * 0.18), rx, ry);
  }
  if (landmarkRenderable(pose, LM.RIGHT_EAR, minConfidence)) {
    const ear = pointFor(pose, LM.RIGHT_EAR);
    const outward = normalize({ x: ear.x - head.center.x, y: ear.y - head.center.y });
    path += ellipsePath(add(ear, outward, rx * 0.18), rx, ry);
  }
  if (!path && head.rx > 0) {
    path += ellipsePath(add(head.center, side, head.rx * 0.96, down, -head.ry * 0.05), rx, ry);
    path += ellipsePath(add(head.center, side, -head.rx * 0.96, down, -head.ry * 0.05), rx, ry);
  }
  return path;
}

function headSilhouettePath(head: HeadEstimate, side: Point, down: Point): string {
  const top = add(head.center, down, -head.ry);
  const leftTemple = add(head.center, side, -head.rx * 0.86, down, -head.ry * 0.45);
  const leftCheek = add(head.center, side, -head.rx * 0.98, down, head.ry * 0.08);
  const leftJaw = add(head.center, side, -head.rx * 0.54, down, head.ry * 0.68);
  const chin = add(head.center, down, head.ry * 0.96);
  const rightJaw = add(head.center, side, head.rx * 0.54, down, head.ry * 0.68);
  const rightCheek = add(head.center, side, head.rx * 0.98, down, head.ry * 0.08);
  const rightTemple = add(head.center, side, head.rx * 0.86, down, -head.ry * 0.45);

  return (
    `M${p(top)}` +
    `C${p(add(top, side, -head.rx * 0.38))} ${p(
      add(leftTemple, down, -head.ry * 0.18)
    )} ${p(leftTemple)}` +
    `C${p(add(leftTemple, down, head.ry * 0.25))} ${p(
      add(leftCheek, down, -head.ry * 0.18)
    )} ${p(leftCheek)}` +
    `C${p(add(leftCheek, down, head.ry * 0.28))} ${p(
      add(leftJaw, side, -head.rx * 0.05)
    )} ${p(leftJaw)}` +
    `C${p(add(leftJaw, down, head.ry * 0.2))} ${p(
      add(chin, side, -head.rx * 0.22)
    )} ${p(chin)}` +
    `C${p(add(chin, side, head.rx * 0.22))} ${p(
      add(rightJaw, down, head.ry * 0.2)
    )} ${p(rightJaw)}` +
    `C${p(add(rightJaw, side, head.rx * 0.05))} ${p(
      add(rightCheek, down, head.ry * 0.28)
    )} ${p(rightCheek)}` +
    `C${p(add(rightCheek, down, -head.ry * 0.18))} ${p(
      add(rightTemple, down, head.ry * 0.25)
    )} ${p(rightTemple)}` +
    `C${p(add(rightTemple, down, -head.ry * 0.18))} ${p(
      add(top, side, head.rx * 0.38)
    )} ${p(top)}Z`
  );
}

function torsoAccentPath(
  shoulderMid: Point,
  hipMid: Point,
  leftOut: Point,
  down: Point,
  bodyRef: number
): string {
  const upper = lerpPoint(shoulderMid, hipMid, 0.16);
  const mid = lerpPoint(shoulderMid, hipMid, 0.43);
  const lower = lerpPoint(shoulderMid, hipMid, 0.7);
  const p0 = add(upper, leftOut, bodyRef * 0.08, down, -bodyRef * 0.012);
  const p1 = add(mid, leftOut, bodyRef * 0.125);
  const p2 = add(lower, leftOut, bodyRef * 0.06, down, -bodyRef * 0.01);
  const p3 = add(lower, leftOut, bodyRef * 0.025, down, bodyRef * 0.015);
  const p4 = add(mid, leftOut, bodyRef * 0.055);
  const p5 = add(upper, leftOut, bodyRef * 0.035, down, bodyRef * 0.006);

  return (
    `M${p(p0)}` +
    `C${p(add(p0, down, bodyRef * 0.08))} ${p(add(p1, down, -bodyRef * 0.08))} ${p(p1)}` +
    `C${p(add(p1, down, bodyRef * 0.1))} ${p(add(p2, down, -bodyRef * 0.08))} ${p(p2)}` +
    `C${p(add(p2, leftOut, -bodyRef * 0.015))} ${p(add(p3, down, bodyRef * 0.005))} ${p(
      p3
    )}` +
    `C${p(add(p4, down, bodyRef * 0.06))} ${p(add(p5, down, bodyRef * 0.08))} ${p(p5)}` +
    `C${p(add(p5, down, -bodyRef * 0.04))} ${p(add(p0, leftOut, -bodyRef * 0.012))} ${p(
      p0
    )}Z`
  );
}

function jointCapsulePath(
  a: Point,
  b: Point,
  c: Point,
  w0: number,
  w1: number,
  w2: number
): string {
  const d0 = normalize({ x: b.x - a.x, y: b.y - a.y });
  const d1 = normalize({ x: c.x - b.x, y: c.y - b.y });
  const n0 = normal(d0);
  const n1 = normal(d1);
  const jointNormal = normalizeOr(n0.x + n1.x, n0.y + n1.y, n0);
  const leftA = add(a, n0, w0);
  const leftB = add(b, jointNormal, w1);
  const leftC = add(c, n1, w2);
  const rightC = add(c, n1, -w2);
  const rightB = add(b, jointNormal, -w1);
  const rightA = add(a, n0, -w0);
  const capEnd = add(c, d1, w2);
  const capStart = add(a, d0, -w0);

  return (
    `M${p(leftA)}` +
    `C${p(lerpPoint(leftA, leftB, 0.52))} ${p(lerpPoint(leftB, leftA, 0.18))} ${p(leftB)}` +
    `C${p(lerpPoint(leftB, leftC, 0.18))} ${p(lerpPoint(leftC, leftB, 0.52))} ${p(leftC)}` +
    `Q${p(capEnd)} ${p(rightC)}` +
    `C${p(lerpPoint(rightC, rightB, 0.52))} ${p(lerpPoint(rightB, rightC, 0.18))} ${p(rightB)}` +
    `C${p(lerpPoint(rightB, rightA, 0.18))} ${p(lerpPoint(rightA, rightB, 0.52))} ${p(rightA)}` +
    `Q${p(capStart)} ${p(leftA)}Z`
  );
}

function fourJointCapsulePath(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  w0: number,
  w1: number,
  w2: number,
  w3: number
): string {
  const d0 = normalize({ x: b.x - a.x, y: b.y - a.y });
  const d1 = normalize({ x: c.x - b.x, y: c.y - b.y });
  const d2 = normalize({ x: d.x - c.x, y: d.y - c.y });
  const n0 = normal(d0);
  const n1 = normal(d1);
  const n2 = normal(d2);
  const nB = normalizeOr(n0.x + n1.x, n0.y + n1.y, n0);
  const nC = normalizeOr(n1.x + n2.x, n1.y + n2.y, n1);
  const leftA = add(a, n0, w0);
  const leftB = add(b, nB, w1);
  const leftC = add(c, nC, w2);
  const leftD = add(d, n2, w3);
  const rightD = add(d, n2, -w3);
  const rightC = add(c, nC, -w2);
  const rightB = add(b, nB, -w1);
  const rightA = add(a, n0, -w0);

  return (
    `M${p(leftA)}` +
    `C${p(lerpPoint(leftA, leftB, 0.55))} ${p(lerpPoint(leftB, leftA, 0.2))} ${p(leftB)}` +
    `C${p(lerpPoint(leftB, leftC, 0.32))} ${p(lerpPoint(leftC, leftB, 0.28))} ${p(leftC)}` +
    `C${p(lerpPoint(leftC, leftD, 0.28))} ${p(lerpPoint(leftD, leftC, 0.55))} ${p(leftD)}` +
    `Q${p(add(d, d2, w3))} ${p(rightD)}` +
    `C${p(lerpPoint(rightD, rightC, 0.55))} ${p(lerpPoint(rightC, rightD, 0.28))} ${p(
      rightC
    )}` +
    `C${p(lerpPoint(rightC, rightB, 0.28))} ${p(lerpPoint(rightB, rightC, 0.32))} ${p(
      rightB
    )}` +
    `C${p(lerpPoint(rightB, rightA, 0.2))} ${p(lerpPoint(rightA, rightB, 0.55))} ${p(
      rightA
    )}` +
    `Q${p(add(a, d0, -w0))} ${p(leftA)}Z`
  );
}

function capsulePath(a: Point, b: Point, startHalfWidth: number, endHalfWidth: number): string {
  const dir = normalize({ x: b.x - a.x, y: b.y - a.y });
  const n = normal(dir);
  const leftA = add(a, n, startHalfWidth);
  const leftB = add(b, n, endHalfWidth);
  const rightB = add(b, n, -endHalfWidth);
  const rightA = add(a, n, -startHalfWidth);
  return (
    `M${p(leftA)}` +
    `C${p(lerpPoint(leftA, leftB, 0.42))} ${p(lerpPoint(leftB, leftA, 0.18))} ${p(leftB)}` +
    `Q${p(add(b, dir, endHalfWidth))} ${p(rightB)}` +
    `C${p(lerpPoint(rightB, rightA, 0.42))} ${p(lerpPoint(rightA, rightB, 0.18))} ${p(rightA)}` +
    `Q${p(add(a, dir, -startHalfWidth))} ${p(leftA)}Z`
  );
}

function ellipsePath(center: Point, rx: number, ry: number): string {
  const k = 0.5522847498;
  return (
    `M${f(center.x)} ${f(center.y - ry)}` +
    `C${f(center.x + rx * k)} ${f(center.y - ry)} ${f(center.x + rx)} ${f(
      center.y - ry * k
    )} ${f(center.x + rx)} ${f(center.y)}` +
    `C${f(center.x + rx)} ${f(center.y + ry * k)} ${f(center.x + rx * k)} ${f(
      center.y + ry
    )} ${f(center.x)} ${f(center.y + ry)}` +
    `C${f(center.x - rx * k)} ${f(center.y + ry)} ${f(center.x - rx)} ${f(
      center.y + ry * k
    )} ${f(center.x - rx)} ${f(center.y)}` +
    `C${f(center.x - rx)} ${f(center.y - ry * k)} ${f(center.x - rx * k)} ${f(
      center.y - ry
    )} ${f(center.x)} ${f(center.y - ry)}Z`
  );
}

function synthesizeHead(
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>,
  bodyRef: number
): HeadEstimate | null {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({
    x: hipMid.x - shoulderMid.x,
    y: hipMid.y - shoulderMid.y,
  });
  const shoulderWidth = distance(torso.leftShoulder, torso.rightShoulder);
  const rx = clamp(Math.max(shoulderWidth * 0.28, bodyRef * 0.15), 15, 48);
  return {
    center: add(shoulderMid, down, -bodyRef * 0.53),
    rx,
    ry: rx * 1.2,
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
  if (count === 0) return null;
  return { x: x / count, y: y / count };
}

function landmarkRenderable(pose: ScreenPoseLandmarks, lm: LM, minConfidence: number): boolean {
  const x = pose.xs[lm];
  const y = pose.ys[lm];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.min(clamp01(pose.visibility[lm]), clamp01(pose.presence[lm])) >= minConfidence;
}

function pointFor(pose: ScreenPoseLandmarks, lm: LM): Point {
  return { x: pose.xs[lm], y: pose.ys[lm] };
}

function includeRenderableLandmarkBounds(
  bounds: ShadowSilhouetteBounds,
  pose: ScreenPoseLandmarks,
  minConfidence: number
): void {
  for (let i = 0; i < pose.xs.length; i++) {
    if (!landmarkRenderable(pose, i as LM, minConfidence)) continue;
    includePoint(bounds, { x: pose.xs[i], y: pose.ys[i] });
  }
}

function includeTorsoBounds(
  bounds: ShadowSilhouetteBounds,
  torso: NonNullable<ReturnType<typeof getTorsoEstimate>>
): void {
  includePoint(bounds, torso.leftShoulder);
  includePoint(bounds, torso.rightShoulder);
  includePoint(bounds, torso.leftHip);
  includePoint(bounds, torso.rightHip);
}

function includeHeadBounds(bounds: ShadowSilhouetteBounds, head: HeadEstimate): void {
  includePoint(bounds, { x: head.center.x - head.rx, y: head.center.y - head.ry });
  includePoint(bounds, { x: head.center.x + head.rx, y: head.center.y + head.ry });
}

function beginBounds(bounds: ShadowSilhouetteBounds): void {
  bounds.minX = Infinity;
  bounds.minY = Infinity;
  bounds.maxX = -Infinity;
  bounds.maxY = -Infinity;
}

function finishBounds(bounds: ShadowSilhouetteBounds): void {
  if (!Number.isFinite(bounds.minX)) {
    bounds.minX = 0;
    bounds.minY = 0;
    bounds.maxX = 0;
    bounds.maxY = 0;
  }
}

function includePoint(bounds: ShadowSilhouetteBounds, point: Point): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function emptyContinuity(): ShadowSilhouetteContinuity {
  return {
    coreContinuous: false,
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

function resetContinuity(value: ShadowSilhouetteContinuity): void {
  value.coreContinuous = false;
  value.headAttached = false;
  value.leftArmContinuous = false;
  value.rightArmContinuous = false;
  value.leftLegContinuous = false;
  value.rightLegContinuous = false;
  value.leftArmHasElbow = false;
  value.rightArmHasElbow = false;
  value.leftLegHasKnee = false;
  value.rightLegHasKnee = false;
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence * 0.62) / Math.max(0.01, 1 - minConfidence), 0.38, 1);
}

function normal(point: Point): Point {
  return { x: -point.y, y: point.x };
}

function normalize(point: Point): Point {
  return normalizeOr(point.x, point.y, { x: 0, y: 1 });
}

function normalizeOr(x: number, y: number, fallback: Point): Point {
  const len = Math.hypot(x, y);
  if (!Number.isFinite(len) || len < 0.0001) return fallback;
  return { x: x / len, y: y / len };
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

function p(point: Point): string {
  return `${f(point.x)} ${f(point.y)}`;
}

function f(value: number): string {
  return value.toFixed(1);
}
