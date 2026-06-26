import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
  type TorsoEstimate,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import type { PremiumConstellationVolumeConfig } from './premiumConstellationHumanPresets';

type DotGroup = 'torso' | 'head' | 'limb' | 'extremity';

interface TemplateDot {
  u: number;
  v: number;
  radial: number;
  side: number;
  radiusSeed: number;
  surface: boolean;
}

export interface PremiumConstellationHumanGeometry {
  torsoSurfacePath: string;
  torsoInternalPath: string;
  headSurfacePath: string;
  headInternalPath: string;
  limbSurfacePath: string;
  limbInternalPath: string;
  extremitySurfacePath: string;
  extremityInternalPath: string;
  guidePath: string;
  dotCount: number;
  torsoDotCount: number;
  headDotCount: number;
  neckDotCount: number;
  upperArmDotCount: number;
  forearmDotCount: number;
  thighDotCount: number;
  shinDotCount: number;
  handDotCount: number;
  footDotCount: number;
  guideLineCount: number;
  skippedPartCount: number;
  opacityScale: number;
  maxDots: number;
}

const TEMPLATE_CACHE = new Map<string, readonly TemplateDot[]>();
const DEFAULT_MIN_CONFIDENCE = 0.35;

export function createPremiumConstellationHumanGeometry(
  maxDots = 450
): PremiumConstellationHumanGeometry {
  return {
    torsoSurfacePath: '',
    torsoInternalPath: '',
    headSurfacePath: '',
    headInternalPath: '',
    limbSurfacePath: '',
    limbInternalPath: '',
    extremitySurfacePath: '',
    extremityInternalPath: '',
    guidePath: '',
    dotCount: 0,
    torsoDotCount: 0,
    headDotCount: 0,
    neckDotCount: 0,
    upperArmDotCount: 0,
    forearmDotCount: 0,
    thighDotCount: 0,
    shinDotCount: 0,
    handDotCount: 0,
    footDotCount: 0,
    guideLineCount: 0,
    skippedPartCount: 0,
    opacityScale: 1,
    maxDots,
  };
}

export function emptyPremiumConstellationHumanGeometry(
  out: PremiumConstellationHumanGeometry
): void {
  out.torsoSurfacePath = '';
  out.torsoInternalPath = '';
  out.headSurfacePath = '';
  out.headInternalPath = '';
  out.limbSurfacePath = '';
  out.limbInternalPath = '';
  out.extremitySurfacePath = '';
  out.extremityInternalPath = '';
  out.guidePath = '';
  out.dotCount = 0;
  out.torsoDotCount = 0;
  out.headDotCount = 0;
  out.neckDotCount = 0;
  out.upperArmDotCount = 0;
  out.forearmDotCount = 0;
  out.thighDotCount = 0;
  out.shinDotCount = 0;
  out.handDotCount = 0;
  out.footDotCount = 0;
  out.guideLineCount = 0;
  out.skippedPartCount = 0;
  out.opacityScale = 1;
}

export function buildPremiumConstellationHumanGeometry(
  pose: ScreenPoseLandmarks,
  out: PremiumConstellationHumanGeometry,
  config: PremiumConstellationVolumeConfig,
  options: {
    minConfidence?: number;
    showGuideStructure?: boolean;
  } = {}
): void {
  emptyPremiumConstellationHumanGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const bodyRef = estimateBodyReference(pose);
  const torso = getTorsoEstimate(pose, minConfidence);
  const head = getHeadEstimate(pose, minConfidence);

  if (torso !== null && torso.confidence >= minConfidence) {
    appendTorsoDots(out, torso, config.counts.torso, bodyRef, config.dotScale);
    out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(torso.confidence, minConfidence));
  } else {
    out.skippedPartCount++;
  }

  if (head !== null && head.confidence >= minConfidence * 0.45) {
    appendHeadDots(out, head, config.counts.head, bodyRef, config.dotScale, minConfidence);
    if (torso !== null) {
      appendNeckDots(out, torso, head, config.counts.neck, bodyRef, config.dotScale);
    } else {
      out.skippedPartCount++;
    }
    out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(head.confidence, minConfidence));
  } else {
    out.skippedPartCount++;
  }

  appendLimbDots(
    pose,
    out,
    'leftUpperArm',
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    config.counts.upperArm,
    bodyRef,
    0.053,
    0.041,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'rightUpperArm',
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    config.counts.upperArm,
    bodyRef,
    0.053,
    0.041,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'leftForearm',
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    config.counts.forearm,
    bodyRef,
    0.041,
    0.03,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'rightForearm',
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    config.counts.forearm,
    bodyRef,
    0.041,
    0.03,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'leftThigh',
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    config.counts.thigh,
    bodyRef,
    0.073,
    0.052,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'rightThigh',
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    config.counts.thigh,
    bodyRef,
    0.073,
    0.052,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'leftShin',
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    config.counts.shin,
    bodyRef,
    0.048,
    0.034,
    config.dotScale,
    minConfidence
  );
  appendLimbDots(
    pose,
    out,
    'rightShin',
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    config.counts.shin,
    bodyRef,
    0.048,
    0.034,
    config.dotScale,
    minConfidence
  );
  appendExtremityDots(
    pose,
    out,
    'leftHand',
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    LM.LEFT_ELBOW,
    config.counts.hand,
    bodyRef,
    0.038,
    0.025,
    config.dotScale,
    minConfidence
  );
  appendExtremityDots(
    pose,
    out,
    'rightHand',
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    LM.RIGHT_ELBOW,
    config.counts.hand,
    bodyRef,
    0.038,
    0.025,
    config.dotScale,
    minConfidence
  );
  appendExtremityDots(
    pose,
    out,
    'leftFoot',
    LM.LEFT_ANKLE,
    LM.LEFT_FOOT_INDEX,
    LM.LEFT_KNEE,
    config.counts.foot,
    bodyRef,
    0.046,
    0.022,
    config.dotScale,
    minConfidence
  );
  appendExtremityDots(
    pose,
    out,
    'rightFoot',
    LM.RIGHT_ANKLE,
    LM.RIGHT_FOOT_INDEX,
    LM.RIGHT_KNEE,
    config.counts.foot,
    bodyRef,
    0.046,
    0.022,
    config.dotScale,
    minConfidence
  );

  if (options.showGuideStructure === true && torso !== null) {
    appendGuideStructure(out, torso, bodyRef);
  }
}

function appendTorsoDots(
  out: PremiumConstellationHumanGeometry,
  torso: TorsoEstimate,
  count: number,
  bodyRef: number,
  dotScale: number
): void {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const side = torsoSide(torso, down);
  const height = Math.max(distance(shoulderMid, hipMid), bodyRef * 0.28);
  const shoulderHalf = distance(torso.leftShoulder, torso.rightShoulder) * 0.53;
  const hipHalf = distance(torso.leftHip, torso.rightHip) * 0.62;
  const dots = torsoTemplate(count);

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    const v = dot.v;
    const center = addPoint(
      lerpPoint(shoulderMid, hipMid, v),
      down,
      bodyRef * (0.01 + 0.028 * smoothstep(0.7, 1, v))
    );
    const halfWidth = torsoHalfWidth(v, shoulderHalf, hipHalf, bodyRef);
    const edge =
      dot.surface && dot.u > 0.5
        ? dot.radial * halfWidth * 0.88
        : dot.surface
          ? dot.side * halfWidth * (0.9 + dot.radial * 0.08)
          : dot.radial * halfWidth * 0.52;
    const depth = dot.surface ? 0 : (hashUnit('premium-torso-depth', i) - 0.5) * height * 0.018;
    const point = addPoint(center, side, edge, down, depth);
    const radius = dotRadius(bodyRef, dotScale, dot.surface ? 0.0057 : 0.0048, dot.radiusSeed, 1.02, 3.25);
    addDot(out, 'torso', point.x, point.y, radius, dot.surface);
  }
}

function appendHeadDots(
  out: PremiumConstellationHumanGeometry,
  head: HeadEstimate,
  count: number,
  bodyRef: number,
  dotScale: number,
  minConfidence: number
): void {
  const dots = ellipseTemplate(count, 'head');
  const rx = head.rx * 0.94;
  const ry = head.ry * 1.02;
  const lowConfidence = head.confidence < minConfidence * 1.65;

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    const point = {
      x: head.center.x + dot.u * rx,
      y: head.center.y + dot.v * ry,
    };
    const radius = dotRadius(bodyRef, dotScale, dot.surface ? 0.0049 : 0.0042, dot.radiusSeed, 0.88, 2.7);
    addDot(out, 'head', point.x, point.y, radius, dot.surface && !lowConfidence);
  }
}

function appendNeckDots(
  out: PremiumConstellationHumanGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate,
  count: number,
  bodyRef: number,
  dotScale: number
): void {
  const before = out.dotCount;
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const start = addPoint(shoulderMid, down, -bodyRef * 0.02);
  const end = addPoint(head.center, down, head.ry * 0.72);
  appendCapsuleTemplate(
    out,
    'torso',
    'neck',
    start,
    end,
    count,
    bodyRef * 0.025,
    bodyRef * 0.021,
    bodyRef,
    dotScale,
    true
  );
  out.neckDotCount += out.dotCount - before;
}

function appendLimbDots(
  pose: ScreenPoseLandmarks,
  out: PremiumConstellationHumanGeometry,
  part:
    | 'leftUpperArm'
    | 'rightUpperArm'
    | 'leftForearm'
    | 'rightForearm'
    | 'leftThigh'
    | 'rightThigh'
    | 'leftShin'
    | 'rightShin',
  startLm: LM,
  endLm: LM,
  count: number,
  bodyRef: number,
  startWidth: number,
  endWidth: number,
  dotScale: number,
  minConfidence: number
): void {
  if (!landmarkRenderable(pose, startLm, minConfidence) || !landmarkRenderable(pose, endLm, minConfidence)) {
    out.skippedPartCount++;
    return;
  }
  const start = pointFor(pose, startLm);
  const end = pointFor(pose, endLm);
  const confidence = Math.min(landmarkConfidence(pose, startLm), landmarkConfidence(pose, endLm));
  const before = out.dotCount;
  appendCapsuleTemplate(
    out,
    'limb',
    part,
    start,
    end,
    count,
    bodyRef * startWidth,
    bodyRef * endWidth,
    bodyRef,
    dotScale,
    confidence < minConfidence * 1.65
  );
  const added = out.dotCount - before;
  if (part === 'leftUpperArm' || part === 'rightUpperArm') out.upperArmDotCount += added;
  else if (part === 'leftForearm' || part === 'rightForearm') out.forearmDotCount += added;
  else if (part === 'leftThigh' || part === 'rightThigh') out.thighDotCount += added;
  else out.shinDotCount += added;
  out.opacityScale = Math.min(out.opacityScale, confidenceOpacity(confidence, minConfidence));
}

function appendExtremityDots(
  pose: ScreenPoseLandmarks,
  out: PremiumConstellationHumanGeometry,
  part: 'leftHand' | 'rightHand' | 'leftFoot' | 'rightFoot',
  rootLm: LM,
  directionLm: LM,
  fallbackLm: LM,
  count: number,
  bodyRef: number,
  lengthFactor: number,
  widthFactor: number,
  dotScale: number,
  minConfidence: number
): void {
  if (!landmarkRenderable(pose, rootLm, minConfidence)) {
    out.skippedPartCount++;
    return;
  }
  const root = pointFor(pose, rootLm);
  const hasDirection = landmarkRenderable(pose, directionLm, minConfidence * 0.7);
  const directionPoint = hasDirection ? pointFor(pose, directionLm) : pointFor(pose, fallbackLm);
  const direction = hasDirection
    ? normalize({ x: directionPoint.x - root.x, y: directionPoint.y - root.y })
    : normalize({ x: root.x - directionPoint.x, y: root.y - directionPoint.y });
  const center = addPoint(root, direction, bodyRef * lengthFactor * 0.42);
  const dots = ellipseTemplate(count, part);
  const normal = { x: -direction.y, y: direction.x };
  const rx = bodyRef * lengthFactor;
  const ry = bodyRef * widthFactor;
  const lowConfidence = landmarkConfidence(pose, rootLm) < minConfidence * 1.65;
  const before = out.dotCount;

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    const point = addPoint(center, direction, dot.u * rx, normal, dot.v * ry);
    const radius = dotRadius(bodyRef, dotScale, dot.surface ? 0.0036 : 0.003, dot.radiusSeed, 0.58, 1.85);
    addDot(out, 'extremity', point.x, point.y, radius, dot.surface && !lowConfidence);
  }
  const added = out.dotCount - before;
  if (part === 'leftHand' || part === 'rightHand') out.handDotCount += added;
  else out.footDotCount += added;
}

function appendCapsuleTemplate(
  out: PremiumConstellationHumanGeometry,
  group: DotGroup,
  namespace: string,
  start: Point,
  end: Point,
  count: number,
  startHalfWidth: number,
  endHalfWidth: number,
  bodyRef: number,
  dotScale: number,
  lowConfidence = false
): void {
  const dots = capsuleTemplate(count, namespace);
  const axis = normalize({ x: end.x - start.x, y: end.y - start.y });
  const normal = { x: -axis.y, y: axis.x };

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    const t = dot.u;
    const center = lerpPoint(start, end, t);
    const width = lerp(startHalfWidth, endHalfWidth, t);
    const point = addPoint(center, normal, dot.radial * width, axis, (dot.v - 0.5) * width * 0.16);
    const radius = dotRadius(bodyRef, dotScale, dot.surface ? 0.0038 : 0.0032, dot.radiusSeed, 0.58, 1.95);
    addDot(out, group, point.x, point.y, radius, dot.surface && !lowConfidence);
  }
}

function appendGuideStructure(
  out: PremiumConstellationHumanGeometry,
  torso: TorsoEstimate,
  bodyRef: number
): void {
  if (out.guideLineCount > 2) return;
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const top = lerpPoint(shoulderMid, hipMid, 0.12);
  const lower = lerpPoint(shoulderMid, hipMid, 0.9);
  out.guidePath += `M${f(top.x)} ${f(top.y)}L${f(lower.x)} ${f(lower.y)}`;
  out.guideLineCount++;
  const shoulderInset = bodyRef * 0.035;
  out.guidePath += `M${f(torso.leftShoulder.x + shoulderInset)} ${f(torso.leftShoulder.y)}L${f(torso.rightShoulder.x - shoulderInset)} ${f(torso.rightShoulder.y)}`;
  out.guideLineCount++;
}

function torsoTemplate(count: number): readonly TemplateDot[] {
  const key = `torso:${count}`;
  const cached = TEMPLATE_CACHE.get(key);
  if (cached) return cached;
  const dots = createTemplate(count, 'torso', 0.68, (i, surface) => {
    const lane = i % 2 === 0 ? -1 : 1;
    const progress = count <= 1 ? 0.5 : i / (count - 1);
    const surfaceBand = surface && i % 6 <= 1;
    const v = surface
      ? surfaceBand
        ? i % 6 === 0
          ? 0.1 + hashUnit('torso-shoulder-band', i) * 0.08
          : 0.78 + hashUnit('torso-pelvis-band', i) * 0.13
        : clamp(0.03 + progress * 0.94 + (hashUnit('torso-v-jitter', i) - 0.5) * 0.034, 0.02, 0.98)
      : 0.06 + hashUnit('torso-v', i) * 0.88;
    return {
      u: surfaceBand ? 1 : 0,
      v,
      radial: surfaceBand
        ? (hashUnit('torso-band-lateral', i) - 0.5) * 1.75
        : surface
          ? 0.78 + hashUnit('torso-radial', i) * 0.18
          : (hashUnit('torso-radial', i) - 0.5) * 2,
      side: surface ? lane : hashUnit('torso-side', i) < 0.5 ? -1 : 1,
      radiusSeed: hashUnit('torso-radius', i),
      surface,
    };
  });
  TEMPLATE_CACHE.set(key, dots);
  return dots;
}

function capsuleTemplate(count: number, namespace: string): readonly TemplateDot[] {
  const key = `capsule:${namespace}:${count}`;
  const cached = TEMPLATE_CACHE.get(key);
  if (cached) return cached;
  const dots = createTemplate(count, namespace, 0.68, (i, surface) => {
    const progress = count <= 1 ? 0.5 : i / (count - 1);
    const t = 0.06 + progress * 0.88 + (hashUnit(`${namespace}:t`, i) - 0.5) * 0.025;
    const side = i % 2 === 0 ? -1 : 1;
    return {
      u: clamp(t, 0.04, 0.96),
      v: hashUnit(`${namespace}:depth`, i),
      radial: surface
        ? side * (0.74 + hashUnit(`${namespace}:edge`, i) * 0.22)
        : (hashUnit(`${namespace}:inside`, i) - 0.5) * 0.78,
      side,
      radiusSeed: hashUnit(`${namespace}:radius`, i),
      surface,
    };
  });
  TEMPLATE_CACHE.set(key, dots);
  return dots;
}

function ellipseTemplate(count: number, namespace: string): readonly TemplateDot[] {
  const key = `ellipse:${namespace}:${count}`;
  const cached = TEMPLATE_CACHE.get(key);
  if (cached) return cached;
  const dots = createTemplate(count, namespace, 0.7, (i, surface) => {
    const angle = i * 2.399963229728653 + hashUnit(`${namespace}:angle`, i) * 0.12;
    const radius = surface
      ? 0.78 + hashUnit(`${namespace}:edge`, i) * 0.18
      : Math.sqrt(hashUnit(`${namespace}:inside`, i)) * 0.48;
    return {
      u: Math.cos(angle) * radius,
      v: Math.sin(angle) * radius,
      radial: radius,
      side: Math.cos(angle) < 0 ? -1 : 1,
      radiusSeed: hashUnit(`${namespace}:radius`, i),
      surface,
    };
  });
  TEMPLATE_CACHE.set(key, dots);
  return dots;
}

function createTemplate(
  count: number,
  namespace: string,
  surfaceRatio: number,
  create: (i: number, surface: boolean) => TemplateDot
): readonly TemplateDot[] {
  const surfaceCount = Math.round(count * surfaceRatio);
  const dots: TemplateDot[] = [];
  for (let i = 0; i < count; i++) {
    const surface = (i * 37) % Math.max(count, 1) < surfaceCount;
    dots.push(create(i, surface));
  }
  return dots;
}

function addDot(
  out: PremiumConstellationHumanGeometry,
  group: DotGroup,
  x: number,
  y: number,
  radius: number,
  surface: boolean
): void {
  if (out.dotCount >= out.maxDots || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const path = circlePath(x, y, radius);
  out.dotCount++;
  switch (group) {
    case 'torso':
      out.torsoDotCount++;
      if (surface) out.torsoSurfacePath += path;
      else out.torsoInternalPath += path;
      break;
    case 'head':
      out.headDotCount++;
      if (surface) out.headSurfacePath += path;
      else out.headInternalPath += path;
      break;
    case 'limb':
      out.limbSurfacePath += surface ? path : '';
      out.limbInternalPath += surface ? '' : path;
      break;
    case 'extremity':
      out.extremitySurfacePath += surface ? path : '';
      out.extremityInternalPath += surface ? '' : path;
      break;
  }
}

function dotRadius(
  bodyRef: number,
  dotScale: number,
  base: number,
  seed: number,
  min: number,
  max: number
): number {
  return clamp(bodyRef * (base + seed * base * 0.38) * dotScale, min, max);
}

function torsoHalfWidth(v: number, shoulderHalf: number, hipHalf: number, bodyRef: number): number {
  const shoulder = Math.sin(smoothstep(0, 0.32, v) * Math.PI) * bodyRef * 0.018;
  const waist = Math.sin(smoothstep(0.34, 0.68, v) * Math.PI) * bodyRef * 0.034;
  const pelvis = Math.sin(smoothstep(0.64, 1, v) * Math.PI) * bodyRef * 0.032;
  const base = lerp(shoulderHalf, hipHalf, smoothstep(0.08, 0.96, v));
  return clamp(base + shoulder - waist + pelvis, bodyRef * 0.12, bodyRef * 0.32);
}

function estimateBodyReference(pose: ScreenPoseLandmarks): number {
  const shoulderWidth = landmarkPairDistance(pose, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER);
  const hipWidth = landmarkPairDistance(pose, LM.LEFT_HIP, LM.RIGHT_HIP);
  const leftLeg = landmarkPairDistance(pose, LM.LEFT_HIP, LM.LEFT_ANKLE);
  const rightLeg = landmarkPairDistance(pose, LM.RIGHT_HIP, LM.RIGHT_ANKLE);
  return clamp(Math.max(shoulderWidth * 2.8, hipWidth * 2.7, leftLeg * 0.9, rightLeg * 0.9, 90), 90, 420);
}

function landmarkPairDistance(pose: ScreenPoseLandmarks, a: LM, b: LM): number {
  return distance(pointFor(pose, a), pointFor(pose, b));
}

function torsoSide(torso: TorsoEstimate, down: Point): Point {
  const side = normalize({
    x: torso.rightShoulder.x - torso.leftShoulder.x + torso.rightHip.x - torso.leftHip.x,
    y: torso.rightShoulder.y - torso.leftShoulder.y + torso.rightHip.y - torso.leftHip.y,
  });
  if (Math.abs(side.x) + Math.abs(side.y) > 0.0001) return side;
  return { x: -down.y, y: down.x };
}

function landmarkRenderable(
  pose: ScreenPoseLandmarks,
  landmark: LM,
  minConfidence: number
): boolean {
  return (
    Number.isFinite(pose.xs[landmark]) &&
    Number.isFinite(pose.ys[landmark]) &&
    landmarkConfidence(pose, landmark) >= minConfidence
  );
}

function landmarkConfidence(pose: ScreenPoseLandmarks, landmark: LM): number {
  return Math.min(pose.visibility[landmark] || 0, pose.presence[landmark] || 0);
}

function pointFor(pose: ScreenPoseLandmarks, landmark: LM): Point {
  return { x: pose.xs[landmark], y: pose.ys[landmark] };
}

function confidenceOpacity(confidence: number, minConfidence: number): number {
  if (confidence <= minConfidence) return 0.22;
  return clamp(0.28 + smoothstep(minConfidence, 0.86, confidence) * 0.72, 0.22, 1);
}

function circlePath(x: number, y: number, r: number): string {
  return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0`;
}

function addPoint(base: Point, axisA: Point, scaleA: number, axisB?: Point, scaleB = 0): Point {
  return {
    x: base.x + axisA.x * scaleA + (axisB?.x ?? 0) * scaleB,
    y: base.y + axisA.y * scaleA + (axisB?.y ?? 0) * scaleB,
  };
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y);
  if (!Number.isFinite(length) || length < 0.0001) return { x: 0, y: 1 };
  return { x: point.x / length, y: point.y / length };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(edge1 - edge0, 0.0001), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function hashUnit(namespace: string, index: number): number {
  let h = 2166136261;
  for (let i = 0; i < namespace.length; i++) {
    h ^= namespace.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= index;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function f(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}
