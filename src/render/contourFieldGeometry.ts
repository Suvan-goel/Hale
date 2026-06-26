import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
  type TorsoEstimate,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';

export interface ContourFieldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ContourFieldGeometry {
  hasPose: boolean;
  primaryLinePath: string;
  softLinePath: string;
  accentLinePath: string;
  particlePath: string;
  lineCount: number;
  particleCount: number;
  shapeCount: number;
  surfacePathCount: number;
  dynamicPathCount: number;
  skippedPartCount: number;
  opacity: number;
  bounds: ContourFieldBounds;
}

export interface ContourFieldGeometryOptions {
  minConfidence?: number;
  particleCount?: number;
}

type ContourChannel = 'primary' | 'soft' | 'accent';

const DEFAULT_MIN_CONFIDENCE = 0.35;
const DEFAULT_PARTICLE_COUNT = 96;
const EMPTY_BOUNDS: ContourFieldBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
};

export function createContourFieldGeometry(): ContourFieldGeometry {
  return {
    hasPose: false,
    primaryLinePath: '',
    softLinePath: '',
    accentLinePath: '',
    particlePath: '',
    lineCount: 0,
    particleCount: 0,
    shapeCount: 0,
    surfacePathCount: 0,
    dynamicPathCount: 0,
    skippedPartCount: 0,
    opacity: 0,
    bounds: { ...EMPTY_BOUNDS },
  };
}

export function emptyContourFieldGeometry(out: ContourFieldGeometry): void {
  out.hasPose = false;
  out.primaryLinePath = '';
  out.softLinePath = '';
  out.accentLinePath = '';
  out.particlePath = '';
  out.lineCount = 0;
  out.particleCount = 0;
  out.shapeCount = 0;
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.skippedPartCount = 0;
  out.opacity = 0;
  out.bounds.minX = 0;
  out.bounds.minY = 0;
  out.bounds.maxX = 0;
  out.bounds.maxY = 0;
}

export function buildContourFieldGeometry(
  pose: ScreenPoseLandmarks,
  out: ContourFieldGeometry,
  options: ContourFieldGeometryOptions = {}
): void {
  emptyContourFieldGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const torso = getTorsoEstimate(pose, minConfidence);
  if (torso === null || torso.confidence < minConfidence * 0.72) return;

  const bodyRef = estimateBodyReference(torso);
  const head = getHeadEstimate(pose, minConfidence) ?? synthesizeHead(torso, bodyRef);
  if (head === null) return;

  beginBounds(out.bounds);

  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalizeOr(
    hipMid.x - shoulderMid.x,
    hipMid.y - shoulderMid.y,
    { x: 0, y: 1 }
  );
  const side = normalizeOr(
    torso.rightShoulder.x - torso.leftShoulder.x + torso.rightHip.x - torso.leftHip.x,
    torso.rightShoulder.y - torso.leftShoulder.y + torso.rightHip.y - torso.leftHip.y,
    { x: 1, y: 0 }
  );

  appendHeadContours(out, head, side, down, bodyRef);
  appendNeckAndCollarContours(out, torso, head, side, down, bodyRef);
  appendTorsoContours(out, torso, side, down, bodyRef);
  appendBodyOutlineContours(out, torso, head, side, down, bodyRef);
  appendArmField(out, pose, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, minConfidence, bodyRef);
  appendArmField(
    out,
    pose,
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    minConfidence,
    bodyRef
  );
  appendLegField(out, pose, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, minConfidence, bodyRef);
  appendLegField(out, pose, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, minConfidence, bodyRef);
  appendHandField(
    out,
    pose,
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    LM.LEFT_PINKY,
    LM.LEFT_THUMB,
    minConfidence,
    bodyRef
  );
  appendHandField(
    out,
    pose,
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    LM.RIGHT_PINKY,
    LM.RIGHT_THUMB,
    minConfidence,
    bodyRef
  );
  appendFootField(
    out,
    pose,
    LM.LEFT_ANKLE,
    LM.LEFT_HEEL,
    LM.LEFT_FOOT_INDEX,
    minConfidence,
    bodyRef
  );
  appendFootField(
    out,
    pose,
    LM.RIGHT_ANKLE,
    LM.RIGHT_HEEL,
    LM.RIGHT_FOOT_INDEX,
    minConfidence,
    bodyRef
  );
  appendSensorParticles(
    out,
    pose,
    torso,
    head,
    side,
    down,
    bodyRef,
    minConfidence,
    options.particleCount ?? DEFAULT_PARTICLE_COUNT
  );

  out.surfacePathCount =
    (out.primaryLinePath ? 1 : 0) +
    (out.softLinePath ? 1 : 0) +
    (out.accentLinePath ? 1 : 0) +
    (out.particlePath ? 1 : 0);
  out.dynamicPathCount = out.surfacePathCount;
  out.shapeCount = out.lineCount + out.particleCount;
  out.hasPose = out.shapeCount > 0;
  out.opacity = confidenceOpacity(Math.min(torso.confidence, head.confidence), minConfidence);
  finishBounds(out.bounds);
}

export function isFiniteContourFieldGeometry(geometry: ContourFieldGeometry): boolean {
  const path = `${geometry.primaryLinePath}${geometry.softLinePath}${geometry.accentLinePath}${geometry.particlePath}`;
  return (
    Number.isFinite(geometry.lineCount) &&
    Number.isFinite(geometry.particleCount) &&
    Number.isFinite(geometry.shapeCount) &&
    Number.isFinite(geometry.surfacePathCount) &&
    Number.isFinite(geometry.dynamicPathCount) &&
    Number.isFinite(geometry.opacity) &&
    Number.isFinite(geometry.bounds.minX) &&
    Number.isFinite(geometry.bounds.minY) &&
    Number.isFinite(geometry.bounds.maxX) &&
    Number.isFinite(geometry.bounds.maxY) &&
    !path.includes('NaN') &&
    !path.includes('Infinity')
  );
}

function appendHeadContours(
  out: ContourFieldGeometry,
  head: HeadEstimate,
  side: Point,
  down: Point,
  bodyRef: number
): void {
  const center = add(head.center, down, head.ry * 0.04);
  const rx = clamp(Math.min(head.rx * 0.98, bodyRef * 0.17), 14, bodyRef * 0.2);
  const ry = clamp(rx * 1.24, 18, bodyRef * 0.25);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const scale = 1 - t * 0.24;
    const offset = (t - 0.5) * ry * 0.14;
    const path = ellipseLinePath(add(center, down, offset), rx * scale, ry * scale);
    appendLine(out, i === 0 || i === 2 ? 'primary' : 'soft', path);
  }
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * rx * 0.28;
    const top = add(center, side, offset * 0.58, down, -ry * 0.78);
    const bottom = add(center, side, offset * 0.82, down, ry * 0.72);
    const bend = (hashSigned('head-flow', i) * 0.12 + offset / Math.max(rx, 1) * 0.24) * rx;
    appendLine(
      out,
      i === 2 ? 'primary' : 'soft',
      cubicPath(top, add(top, side, bend, down, ry * 0.35), add(bottom, side, -bend * 0.65, down, -ry * 0.35), bottom)
    );
  }
  includeEllipseBounds(out.bounds, center, rx, ry);
}

function appendNeckAndCollarContours(
  out: ContourFieldGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate,
  side: Point,
  down: Point,
  bodyRef: number
): void {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const headBase = add(head.center, down, head.ry * 0.77);
  const neckBase = add(shoulderMid, down, -bodyRef * 0.055);
  const neckHalfTop = clamp(bodyRef * 0.04, 6, 16);
  const neckHalfBottom = clamp(bodyRef * 0.074, 10, 25);

  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const offsetTop = (t - 0.5) * neckHalfTop * 2;
    const offsetBottom = (t - 0.5) * neckHalfBottom * 2;
    const start = add(headBase, side, offsetTop);
    const end = add(neckBase, side, offsetBottom);
    appendLine(
      out,
      i === 2 ? 'primary' : 'soft',
      cubicPath(start, add(start, down, bodyRef * 0.05), add(end, down, -bodyRef * 0.045), end)
    );
  }

  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const left = lerpPoint(add(torso.leftShoulder, down, -bodyRef * 0.01), add(neckBase, side, -neckHalfBottom), t);
    const right = lerpPoint(add(neckBase, side, neckHalfBottom), add(torso.rightShoulder, down, -bodyRef * 0.01), t);
    appendLine(
      out,
      i === 0 || i === 5 ? 'accent' : 'soft',
      cubicPath(left, add(left, side, bodyRef * 0.11), add(right, side, -bodyRef * 0.11), right)
    );
  }
}

function appendTorsoContours(
  out: ContourFieldGeometry,
  torso: TorsoEstimate,
  side: Point,
  down: Point,
  bodyRef: number
): void {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const shoulderHalf = distance(torso.leftShoulder, torso.rightShoulder) * 0.55;
  const hipHalf = distance(torso.leftHip, torso.rightHip) * 0.58;
  const torsoHeight = distance(shoulderMid, hipMid);

  for (let i = 0; i < 14; i++) {
    const v = (i + 0.48) / 14;
    const center = add(lerpPoint(shoulderMid, hipMid, v), down, torsoHeight * 0.008 * Math.sin(v * Math.PI * 2));
    const half = torsoHalfWidth(v, shoulderHalf, hipHalf, bodyRef);
    const left = add(center, side, -half * (0.88 + 0.06 * Math.sin(v * Math.PI)));
    const right = add(center, side, half * (0.88 + 0.04 * Math.cos(v * Math.PI)));
    const arch = bodyRef * (0.018 + 0.018 * Math.sin(v * Math.PI));
    appendLine(
      out,
      i % 5 === 0 ? 'primary' : 'soft',
      cubicPath(
        left,
        add(left, side, half * 0.5, down, -arch * (0.7 + v * 0.4)),
        add(right, side, -half * 0.52, down, arch * (1 - v * 0.25)),
        right
      )
    );
    includePoint(out.bounds, left);
    includePoint(out.bounds, right);
  }

  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const lateral = (t - 0.5) * 2;
    const topHalf = torsoHalfWidth(0.08, shoulderHalf, hipHalf, bodyRef);
    const lowerHalf = torsoHalfWidth(0.9, shoulderHalf, hipHalf, bodyRef);
    const start = add(
      lerpPoint(shoulderMid, hipMid, 0.04),
      side,
      lateral * topHalf * (0.56 + Math.abs(lateral) * 0.18)
    );
    const end = add(
      lerpPoint(shoulderMid, hipMid, 0.97),
      side,
      lateral * lowerHalf * (0.62 + Math.abs(lateral) * 0.2),
      down,
      bodyRef * 0.03
    );
    const waist = add(
      lerpPoint(shoulderMid, hipMid, 0.56),
      side,
      lateral *
        torsoHalfWidth(0.56, shoulderHalf, hipHalf, bodyRef) *
        (0.62 + Math.abs(lateral) * 0.22),
      down,
      hashSigned('torso-flow', i) * bodyRef * 0.016
    );
    appendLine(
      out,
      i === 6 || i % 4 === 0 ? 'primary' : 'soft',
      cubicPath(start, lerpPoint(start, waist, 0.58), lerpPoint(waist, end, 0.42), end)
    );
  }

  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const left = add(torso.leftHip, side, -bodyRef * (0.02 + t * 0.045), down, bodyRef * (0.035 + t * 0.035));
    const right = add(torso.rightHip, side, bodyRef * (0.02 + t * 0.045), down, bodyRef * (0.035 + t * 0.035));
    const center = add(hipMid, down, bodyRef * (0.11 + t * 0.03));
    appendLine(out, i % 3 === 0 ? 'primary' : 'soft', quadPath(left, center, right));
  }
}

function appendBodyOutlineContours(
  out: ContourFieldGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate,
  side: Point,
  down: Point,
  bodyRef: number
): void {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const leftNeck = add(head.center, side, -head.rx * 0.38, down, head.ry * 0.74);
  const rightNeck = add(head.center, side, head.rx * 0.38, down, head.ry * 0.74);
  const leftTrap = add(torso.leftShoulder, side, -bodyRef * 0.035, down, -bodyRef * 0.015);
  const rightTrap = add(torso.rightShoulder, side, bodyRef * 0.035, down, -bodyRef * 0.015);
  const leftRib = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.36), side, -bodyRef * 0.018);
  const rightRib = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.36), side, bodyRef * 0.018);
  const leftWaist = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.67), side, bodyRef * 0.018);
  const rightWaist = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.67), side, -bodyRef * 0.018);
  const leftHip = add(torso.leftHip, side, -bodyRef * 0.046, down, bodyRef * 0.035);
  const rightHip = add(torso.rightHip, side, bodyRef * 0.046, down, bodyRef * 0.035);
  const crotch = add(hipMid, down, bodyRef * 0.16);

  appendLine(
    out,
    'primary',
    cubicPath(
      leftNeck,
      add(leftNeck, side, -bodyRef * 0.035, down, bodyRef * 0.04),
      add(leftTrap, side, -bodyRef * 0.035),
      leftTrap
    )
  );
  appendLine(
    out,
    'primary',
    cubicPath(
      rightNeck,
      add(rightNeck, side, bodyRef * 0.035, down, bodyRef * 0.04),
      add(rightTrap, side, bodyRef * 0.035),
      rightTrap
    )
  );
  appendLine(
    out,
    'primary',
    cubicPath(leftTrap, add(leftRib, down, -bodyRef * 0.05), add(leftWaist, down, -bodyRef * 0.08), leftWaist)
  );
  appendLine(
    out,
    'primary',
    cubicPath(rightTrap, add(rightRib, down, -bodyRef * 0.05), add(rightWaist, down, -bodyRef * 0.08), rightWaist)
  );
  appendLine(
    out,
    'primary',
    cubicPath(leftWaist, add(leftWaist, down, bodyRef * 0.1), add(leftHip, down, -bodyRef * 0.06), leftHip)
  );
  appendLine(
    out,
    'primary',
    cubicPath(rightWaist, add(rightWaist, down, bodyRef * 0.1), add(rightHip, down, -bodyRef * 0.06), rightHip)
  );
  appendLine(out, 'primary', quadPath(leftHip, crotch, rightHip));
  appendLine(
    out,
    'accent',
    cubicPath(
      add(shoulderMid, side, -bodyRef * 0.12, down, -bodyRef * 0.018),
      add(shoulderMid, side, -bodyRef * 0.035, down, bodyRef * 0.015),
      add(shoulderMid, side, bodyRef * 0.035, down, bodyRef * 0.015),
      add(shoulderMid, side, bodyRef * 0.12, down, -bodyRef * 0.018)
    )
  );
  includePoint(out.bounds, leftNeck);
  includePoint(out.bounds, rightNeck);
  includePoint(out.bounds, leftTrap);
  includePoint(out.bounds, rightTrap);
  includePoint(out.bounds, leftHip);
  includePoint(out.bounds, rightHip);
  includePoint(out.bounds, crotch);
}

function appendArmField(
  out: ContourFieldGeometry,
  pose: ScreenPoseLandmarks,
  shoulderLm: LM,
  elbowLm: LM,
  wristLm: LM,
  minConfidence: number,
  bodyRef: number
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
  appendSegmentField(out, shoulder, elbow, bodyRef * 0.062, bodyRef * 0.047, 6, 2, 'arm-upper');
  appendSegmentField(out, elbow, wrist, bodyRef * 0.047, bodyRef * 0.031, 6, 2, 'arm-lower');
}

function appendLegField(
  out: ContourFieldGeometry,
  pose: ScreenPoseLandmarks,
  hipLm: LM,
  kneeLm: LM,
  ankleLm: LM,
  minConfidence: number,
  bodyRef: number
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
  appendSegmentField(out, hip, knee, bodyRef * 0.088, bodyRef * 0.056, 7, 3, 'leg-upper');
  appendSegmentField(out, knee, ankle, bodyRef * 0.056, bodyRef * 0.036, 7, 3, 'leg-lower');
}

function appendSegmentField(
  out: ContourFieldGeometry,
  a: Point,
  b: Point,
  startHalfWidth: number,
  endHalfWidth: number,
  longitudinalCount: number,
  crossCount: number,
  namespace: string
): void {
  const dir = normalizeOr(b.x - a.x, b.y - a.y, { x: 0, y: 1 });
  const normal = { x: -dir.y, y: dir.x };
  const length = distance(a, b);
  if (length < 5) return;

  for (let i = 0; i < longitudinalCount; i++) {
    const t = longitudinalCount === 1 ? 0.5 : i / (longitudinalCount - 1);
    const offsetNorm = (t - 0.5) * 1.68 + hashSigned(`${namespace}:long`, i) * 0.08;
    const start = add(a, normal, startHalfWidth * offsetNorm, dir, startHalfWidth * 0.05);
    const end = add(b, normal, endHalfWidth * offsetNorm, dir, -endHalfWidth * 0.05);
    const bow = hashSigned(`${namespace}:bow`, i) * Math.min(length * 0.04, 9);
    appendLine(
      out,
      Math.abs(offsetNorm) > 0.72 || Math.abs(offsetNorm) < 0.16 ? 'primary' : 'soft',
      cubicPath(start, add(start, dir, length * 0.34, normal, bow), add(end, dir, -length * 0.34, normal, -bow), end)
    );
    includePoint(out.bounds, start);
    includePoint(out.bounds, end);
  }

  for (let i = 0; i < crossCount; i++) {
    const t = (i + 0.62) / (crossCount + 0.45);
    const center = lerpPoint(a, b, t);
    const half = startHalfWidth + (endHalfWidth - startHalfWidth) * t;
    const left = add(center, normal, -half * 0.82);
    const right = add(center, normal, half * 0.82);
    appendLine(out, i === 0 ? 'accent' : 'soft', cubicPath(left, add(left, dir, half * 0.18), add(right, dir, -half * 0.18), right));
  }
}

function appendHandField(
  out: ContourFieldGeometry,
  pose: ScreenPoseLandmarks,
  wristLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  thumbLm: LM,
  minConfidence: number,
  bodyRef: number
): void {
  if (!landmarkRenderable(pose, wristLm, minConfidence)) return;
  const wrist = pointFor(pose, wristLm);
  const fingers = [indexLm, pinkyLm, thumbLm];
  let rendered = 0;
  for (let i = 0; i < fingers.length; i++) {
    const lm = fingers[i];
    if (!landmarkRenderable(pose, lm, minConfidence)) continue;
    const tip = pointFor(pose, lm);
    const dir = normalizeOr(tip.x - wrist.x, tip.y - wrist.y, { x: 0, y: 1 });
    const start = add(wrist, dir, bodyRef * 0.012);
    const end = add(tip, dir, bodyRef * 0.026);
    appendLine(
      out,
      i === 0 ? 'primary' : 'soft',
      cubicPath(start, lerpPoint(start, end, 0.35), lerpPoint(start, end, 0.72), end)
    );
    rendered++;
  }
  if (rendered === 0) {
    const radius = clamp(bodyRef * 0.026, 3, 10);
    appendLine(out, 'soft', ellipseLinePath(wrist, radius, radius * 1.2));
  }
}

function appendFootField(
  out: ContourFieldGeometry,
  pose: ScreenPoseLandmarks,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  minConfidence: number,
  bodyRef: number
): void {
  if (!landmarkRenderable(pose, ankleLm, minConfidence)) return;
  const ankle = pointFor(pose, ankleLm);
  const heel = landmarkRenderable(pose, heelLm, minConfidence) ? pointFor(pose, heelLm) : null;
  const toe = landmarkRenderable(pose, toeLm, minConfidence) ? pointFor(pose, toeLm) : null;
  if (heel !== null && toe !== null && distance(heel, toe) > 4) {
    appendSegmentField(
      out,
      heel,
      toe,
      clamp(bodyRef * 0.028, 3, 10),
      clamp(bodyRef * 0.034, 4, 12),
      3,
      2,
      'foot'
    );
    return;
  }
  appendLine(out, 'soft', ellipseLinePath(ankle, clamp(bodyRef * 0.03, 4, 11), clamp(bodyRef * 0.022, 3, 8)));
}

function appendSensorParticles(
  out: ContourFieldGeometry,
  pose: ScreenPoseLandmarks,
  torso: TorsoEstimate,
  head: HeadEstimate,
  side: Point,
  down: Point,
  bodyRef: number,
  minConfidence: number,
  requestedCount: number
): void {
  const count = clamp(Math.round(requestedCount), 0, 160);
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const anchors = [
    head.center,
    shoulderMid,
    lerpPoint(shoulderMid, hipMid, 0.45),
    hipMid,
    torso.leftShoulder,
    torso.rightShoulder,
    torso.leftHip,
    torso.rightHip,
  ];
  const limbAnchors = [
    LM.LEFT_ELBOW,
    LM.RIGHT_ELBOW,
    LM.LEFT_WRIST,
    LM.RIGHT_WRIST,
    LM.LEFT_KNEE,
    LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,
    LM.RIGHT_ANKLE,
  ];
  for (const lm of limbAnchors) {
    if (landmarkRenderable(pose, lm, minConfidence)) anchors.push(pointFor(pose, lm));
  }
  for (let i = 0; i < count; i++) {
    const anchor = anchors[i % anchors.length];
    const spread = bodyRef * (0.012 + hashUnit('particle-spread', i) * 0.045);
    const sx = hashSigned('particle-x', i) * spread;
    const sy = hashSigned('particle-y', i) * spread;
    const point = add(anchor, side, sx, down, sy);
    const radius = clamp(bodyRef * (0.0018 + hashUnit('particle-r', i) * 0.0021), 0.34, 1.1);
    out.particlePath += circlePath(point, radius);
    out.particleCount++;
    includePoint(out.bounds, point);
  }
}

function appendLine(out: ContourFieldGeometry, channel: ContourChannel, path: string): void {
  if (!path) return;
  if (channel === 'primary') out.primaryLinePath += path;
  else if (channel === 'accent') out.accentLinePath += path;
  else out.softLinePath += path;
  out.lineCount++;
}

function estimateBodyReference(torso: TorsoEstimate): number {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const shoulderWidth = distance(torso.leftShoulder, torso.rightShoulder);
  const hipWidth = distance(torso.leftHip, torso.rightHip);
  const torsoHeight = distance(shoulderMid, hipMid);
  return clamp(Math.max(shoulderWidth * 2.2, hipWidth * 2.6, torsoHeight * 1.35), 72, 420);
}

function torsoHalfWidth(v: number, shoulderHalf: number, hipHalf: number, bodyRef: number): number {
  const base = shoulderHalf + (hipHalf - shoulderHalf) * v;
  const chest = Math.sin(clamp01((v - 0.04) / 0.36) * Math.PI) * bodyRef * 0.038;
  const waist = Math.sin(clamp01((v - 0.42) / 0.28) * Math.PI) * bodyRef * 0.052;
  const pelvis = Math.sin(clamp01((v - 0.72) / 0.26) * Math.PI) * bodyRef * 0.054;
  return clamp(base + chest - waist + pelvis, bodyRef * 0.12, bodyRef * 0.3);
}

function synthesizeHead(torso: TorsoEstimate, bodyRef: number): HeadEstimate | null {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalizeOr(hipMid.x - shoulderMid.x, hipMid.y - shoulderMid.y, { x: 0, y: 1 });
  const rx = clamp(bodyRef * 0.13, 14, 36);
  return {
    center: add(shoulderMid, down, -bodyRef * 0.33),
    rx,
    ry: rx * 1.22,
    confidence: torso.confidence * 0.5,
  };
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

function cubicPath(a: Point, c1: Point, c2: Point, b: Point): string {
  return `M${p(a)}C${p(c1)} ${p(c2)} ${p(b)}`;
}

function quadPath(a: Point, c: Point, b: Point): string {
  return `M${p(a)}Q${p(c)} ${p(b)}`;
}

function ellipseLinePath(center: Point, rx: number, ry: number): string {
  const k = 0.5522847498;
  const left = { x: center.x - rx, y: center.y };
  const top = { x: center.x, y: center.y - ry };
  const right = { x: center.x + rx, y: center.y };
  const bottom = { x: center.x, y: center.y + ry };
  return (
    `M${p(top)}` +
    `C${p({ x: center.x + rx * k, y: center.y - ry })} ${p({
      x: center.x + rx,
      y: center.y - ry * k,
    })} ${p(right)}` +
    `C${p({ x: center.x + rx, y: center.y + ry * k })} ${p({
      x: center.x + rx * k,
      y: center.y + ry,
    })} ${p(bottom)}` +
    `C${p({ x: center.x - rx * k, y: center.y + ry })} ${p({
      x: center.x - rx,
      y: center.y + ry * k,
    })} ${p(left)}` +
    `C${p({ x: center.x - rx, y: center.y - ry * k })} ${p({
      x: center.x - rx * k,
      y: center.y - ry,
    })} ${p(top)}`
  );
}

function circlePath(center: Point, radius: number): string {
  const r = f(radius);
  return `M${f(center.x - radius)} ${f(center.y)}a${r} ${r} 0 1 0 ${f(radius * 2)} 0a${r} ${r} 0 1 0 ${f(-radius * 2)} 0Z`;
}

function add(a: Point, v1: Point, scale1: number, v2?: Point, scale2 = 0): Point {
  return {
    x: a.x + v1.x * scale1 + (v2?.x ?? 0) * scale2,
    y: a.y + v1.y * scale1 + (v2?.y ?? 0) * scale2,
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

function normalizeOr(x: number, y: number, fallback: Point): Point {
  const len = Math.hypot(x, y);
  if (!Number.isFinite(len) || len < 0.0001) return fallback;
  return { x: x / len, y: y / len };
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  return clamp((confidence - minConfidence) / Math.max(0.01, 1 - minConfidence), 0.18, 1);
}

function beginBounds(bounds: ContourFieldBounds): void {
  bounds.minX = Number.POSITIVE_INFINITY;
  bounds.minY = Number.POSITIVE_INFINITY;
  bounds.maxX = Number.NEGATIVE_INFINITY;
  bounds.maxY = Number.NEGATIVE_INFINITY;
}

function includePoint(bounds: ContourFieldBounds, point: Point): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function includeEllipseBounds(bounds: ContourFieldBounds, center: Point, rx: number, ry: number): void {
  includePoint(bounds, { x: center.x - rx, y: center.y - ry });
  includePoint(bounds, { x: center.x + rx, y: center.y + ry });
}

function finishBounds(bounds: ContourFieldBounds): void {
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

function hashSigned(namespace: string, index: number): number {
  return hashUnit(namespace, index) * 2 - 1;
}

function hashUnit(namespace: string, index: number): number {
  let h = 2166136261;
  for (let i = 0; i < namespace.length; i++) {
    h ^= namespace.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= Math.imul(index + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h >>> 0) % 10000) / 9999;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
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
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}
