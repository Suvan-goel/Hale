import { LM } from '../pose/types';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type HeadEstimate,
  type Point,
  type TorsoEstimate,
} from './bodyVolumeGeometry';

export type SoftDigitalTwinFillKey = 'core' | 'limb' | 'distal' | 'blend' | 'shadow';
export type SoftDigitalTwinVisualPresetName = 'balanced' | 'lean';

export interface SoftDigitalTwinVisualQualityPreset {
  headScale: number;
  neckWidth: number;
  shoulderSoftness: number;
  jointBlendOpacity: number;
  limbTaper: number;
  torsoSoftness: number;
  pelvisSoftness: number;
  pelvisContrast: number;
  selfShadowOpacity: number;
  edgeFeather: number;
  materialDepth: number;
  materialContrast: number;
  shoulderWidthScale: number;
  torsoWidthScale: number;
  hipWidthScale: number;
  lowerTorsoLength: number;
  neckLength: number;
  neckBaseWidth: number;
  limbMass: number;
  distalMass: number;
  thighRootSpacing: number;
  thighRootDrop: number;
  torsoWaistTaper: number;
  torsoHipBlend: number;
  lowerTorsoBlendOpacity: number;
  shoulderRoundness: number;
  pelvisOpacity: number;
  pelvisBlendHeight: number;
  limbOrganicCurve: number;
  handAttachment: number;
  footAttachment: number;
  headYOffset: number;
  shoulderSlope: number;
  ribcageWidth: number;
  waistTaper: number;
  hipBlendWidth: number;
  innerThighSplitDepth: number;
  armLengthScale: number;
  armTaper: number;
  handScale: number;
  thighWidth: number;
  kneeTaper: number;
  shinTaper: number;
  footScale: number;
  torsoSideCurve: number;
  lowerTorsoBlend: number;
  shoulderDrop: number;
  upperArmShoulderBlend: number;
  upperArmWidth: number;
  forearmTaper: number;
  pelvisBridgeOpacity: number;
  pelvisTriangleOpacity: number;
  pelvisSplitSoftness: number;
  thighRootWidth: number;
  thighTaper: number;
  kneeNarrowing: number;
  overlapShadowOpacity: number;
}

export interface SoftDigitalTwinSurface {
  id: string;
  path: string;
  fillKey: SoftDigitalTwinFillKey;
  opacity: number;
  confidence: number;
}

export interface SoftDigitalTwinConstructionPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface SoftDigitalTwinConstructionLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface SoftDigitalTwinGeometry {
  hasPose: boolean;
  opacity: number;
  surfaces: SoftDigitalTwinSurface[];
  constructionPoints: SoftDigitalTwinConstructionPoint[];
  constructionLines: SoftDigitalTwinConstructionLine[];
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
}

interface BodyAxes {
  side: Point;
  down: Point;
  shoulderMid: Point;
  hipMid: Point;
  shoulderWidth: number;
  hipWidth: number;
  torsoLength: number;
  legLength: number;
  bodyRef: number;
}

interface VisualTorsoAnchors {
  leftShoulder: Point;
  rightShoulder: Point;
  leftHip: Point;
  rightHip: Point;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const MIN_BODY_REF = 120;

export const SOFT_DIGITAL_TWIN_LEAN_VISUAL_PRESET: SoftDigitalTwinVisualQualityPreset = {
  headScale: 0.92,
  neckWidth: 0.82,
  shoulderSoftness: 0.9,
  jointBlendOpacity: 0.04,
  limbTaper: 1.06,
  torsoSoftness: 0.8,
  pelvisSoftness: 0.94,
  pelvisContrast: 0.16,
  selfShadowOpacity: 0.018,
  edgeFeather: 0.06,
  materialDepth: 0.36,
  materialContrast: 1,
  shoulderWidthScale: 1,
  torsoWidthScale: 1,
  hipWidthScale: 1,
  lowerTorsoLength: 1,
  neckLength: 1,
  neckBaseWidth: 1,
  limbMass: 1,
  distalMass: 1,
  thighRootSpacing: 1,
  thighRootDrop: 1,
  torsoWaistTaper: 1,
  torsoHipBlend: 1,
  lowerTorsoBlendOpacity: 1,
  shoulderRoundness: 1,
  pelvisOpacity: 1,
  pelvisBlendHeight: 1,
  limbOrganicCurve: 1,
  handAttachment: 1,
  footAttachment: 1,
  headYOffset: 0,
  shoulderSlope: 1,
  ribcageWidth: 1,
  waistTaper: 1,
  hipBlendWidth: 1,
  innerThighSplitDepth: 1,
  armLengthScale: 1,
  armTaper: 1,
  handScale: 1,
  thighWidth: 1,
  kneeTaper: 1,
  shinTaper: 1,
  footScale: 1,
  torsoSideCurve: 1,
  lowerTorsoBlend: 1,
  shoulderDrop: 1,
  upperArmShoulderBlend: 1,
  upperArmWidth: 1,
  forearmTaper: 1,
  pelvisBridgeOpacity: 1,
  pelvisTriangleOpacity: 1,
  pelvisSplitSoftness: 1,
  thighRootWidth: 1,
  thighTaper: 1,
  kneeNarrowing: 1,
  overlapShadowOpacity: 1,
};

export const SOFT_DIGITAL_TWIN_BALANCED_VISUAL_PRESET: SoftDigitalTwinVisualQualityPreset = {
  headScale: 0.9,
  neckWidth: 1.16,
  shoulderSoftness: 0.94,
  jointBlendOpacity: 0.025,
  limbTaper: 1.04,
  torsoSoftness: 1.2,
  pelvisSoftness: 1.14,
  pelvisContrast: 0.006,
  selfShadowOpacity: 0.012,
  edgeFeather: 0.06,
  materialDepth: 0.42,
  materialContrast: 0.7,
  shoulderWidthScale: 1.05,
  torsoWidthScale: 1.1,
  hipWidthScale: 1.02,
  lowerTorsoLength: 0.82,
  neckLength: 0.26,
  neckBaseWidth: 1.16,
  limbMass: 1.34,
  distalMass: 0.98,
  thighRootSpacing: 0.64,
  thighRootDrop: 0.42,
  torsoWaistTaper: 0.34,
  torsoHipBlend: 0.86,
  lowerTorsoBlendOpacity: 1,
  shoulderRoundness: 1.34,
  pelvisOpacity: 0.08,
  pelvisBlendHeight: 0.64,
  limbOrganicCurve: 1.48,
  handAttachment: 1.62,
  footAttachment: 1.46,
  headYOffset: 1.02,
  shoulderSlope: 1.04,
  ribcageWidth: 1,
  waistTaper: 0.9,
  hipBlendWidth: 0.94,
  innerThighSplitDepth: 0.46,
  armLengthScale: 1.1,
  armTaper: 0.88,
  handScale: 0.84,
  thighWidth: 1.2,
  kneeTaper: 0.92,
  shinTaper: 0.84,
  footScale: 1.02,
  torsoSideCurve: 1.32,
  lowerTorsoBlend: 1.18,
  shoulderDrop: 1.36,
  upperArmShoulderBlend: 1.28,
  upperArmWidth: 0.82,
  forearmTaper: 0.86,
  pelvisBridgeOpacity: 0.06,
  pelvisTriangleOpacity: 0,
  pelvisSplitSoftness: 1.54,
  thighRootWidth: 0.9,
  thighTaper: 0.9,
  kneeNarrowing: 1.18,
  overlapShadowOpacity: 0.85,
};

export const SOFT_DIGITAL_TWIN_VISUAL_PRESET = SOFT_DIGITAL_TWIN_BALANCED_VISUAL_PRESET;

export function resolveSoftDigitalTwinVisualPreset(
  name: SoftDigitalTwinVisualPresetName = 'balanced'
): SoftDigitalTwinVisualQualityPreset {
  return name === 'lean'
    ? SOFT_DIGITAL_TWIN_LEAN_VISUAL_PRESET
    : SOFT_DIGITAL_TWIN_BALANCED_VISUAL_PRESET;
}

export function createSoftDigitalTwinGeometry(): SoftDigitalTwinGeometry {
  return {
    hasPose: false,
    opacity: 0,
    surfaces: [],
    constructionPoints: [],
    constructionLines: [],
    surfacePathCount: 0,
    dynamicPathCount: 0,
    shapeCount: 0,
    skippedPartCount: 0,
  };
}

export function emptySoftDigitalTwinGeometry(out: SoftDigitalTwinGeometry): void {
  out.hasPose = false;
  out.opacity = 0;
  out.surfaces.length = 0;
  out.constructionPoints.length = 0;
  out.constructionLines.length = 0;
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.shapeCount = 0;
  out.skippedPartCount = 0;
}

export function buildSoftDigitalTwinGeometry(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  options: { minConfidence?: number; visualPreset?: SoftDigitalTwinVisualPresetName } = {}
): void {
  emptySoftDigitalTwinGeometry(out);
  if (!pose.hasPose) return;

  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const softMinConfidence = Math.max(0.08, minConfidence * 0.42);
  const torso = getTorsoEstimate(pose, softMinConfidence);
  if (torso === null) return;

  const axes = createBodyAxes(pose, torso);
  const visualPresetName = options.visualPreset ?? 'balanced';
  const preset = resolveSoftDigitalTwinVisualPreset(visualPresetName);
  const head = getHeadEstimate(pose, softMinConfidence);
  const torsoOpacity = confidenceOpacity(torso.confidence, minConfidence);
  out.hasPose = true;
  out.opacity = torsoOpacity;

  // Anatomy mapping: MediaPipe shoulders/hips define the core body volume;
  // separate MediaPipe bone chains then drive tapered limb capsules. Distal
  // hand/foot landmarks are optional so a bad wrist or ankle only fades that
  // local segment instead of pulling the whole figure apart.
  appendConstructionRig(pose, out, torso, head, axes, preset, softMinConfidence);
  if (visualPresetName === 'balanced') {
    appendBalancedVisualAnatomy(pose, out, torso, head, axes, preset, minConfidence, softMinConfidence);
  } else {
    appendSegmentedSoftDigitalTwin(pose, out, torso, head, axes, preset, minConfidence, softMinConfidence);
  }

  out.surfacePathCount = out.surfaces.length;
  out.dynamicPathCount = out.surfacePathCount;
  out.shapeCount = out.surfacePathCount;
  if (out.surfacePathCount === 0) out.opacity = 0;
}

function appendSegmentedSoftDigitalTwin(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  appendLegChains(pose, out, axes, preset, minConfidence, softMinConfidence);
  appendFeet(pose, out, axes, preset, minConfidence, softMinConfidence);
  appendArmChains(pose, out, axes, preset, minConfidence, softMinConfidence);
  appendHands(pose, out, axes, preset, minConfidence, softMinConfidence);
  appendSelfShadows(pose, out, torso, head, axes, preset, minConfidence, softMinConfidence);
  appendNeck(out, torso, head, axes, preset, minConfidence);
  appendPelvis(out, torso, axes, preset, minConfidence);
  appendCore(out, torso, axes, preset, minConfidence);
  appendHead(out, head, axes, preset, minConfidence);
}

function appendBalancedVisualAnatomy(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  appendBalancedLegSurfaces(pose, out, axes, preset, minConfidence, softMinConfidence);
  appendBalancedArmSurfaces(pose, out, torso, axes, preset, minConfidence, softMinConfidence);
  appendSelfShadows(pose, out, torso, head, axes, preset, minConfidence, softMinConfidence);
  appendBalancedNeck(out, torso, head, axes, preset, minConfidence);
  appendBalancedPelvis(out, torso, axes, preset, minConfidence);
  appendBalancedCore(out, torso, axes, preset, minConfidence);
  appendHead(out, head, axes, preset, minConfidence);
}

function appendConstructionRig(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  softMinConfidence: number
): void {
  const { side, down, shoulderMid, hipMid, bodyRef } = axes;
  const visual = createVisualTorsoAnchors(torso, axes, preset);
  const ribCentre = lerpPoint(shoulderMid, hipMid, 0.36);
  const waistCentre = lerpPoint(shoulderMid, hipMid, 0.66);
  const pelvisCentre = add(hipMid, scale(down, bodyRef * 0.042 * preset.pelvisBlendHeight));
  const neckBase = add(shoulderMid, scale(down, -bodyRef * 0.064 * preset.neckLength));
  const neckTop = head
    ? add(head.center, scale(down, head.ry * (0.66 + preset.headYOffset * 0.22) * preset.headScale))
    : add(shoulderMid, scale(down, -bodyRef * 0.16));
  const leftRib = add(lerpPoint(visual.leftShoulder, visual.leftHip, 0.36), scale(side, bodyRef * 0.034 * preset.ribcageWidth));
  const rightRib = add(lerpPoint(visual.rightShoulder, visual.rightHip, 0.36), scale(side, -bodyRef * 0.034 * preset.ribcageWidth));
  const leftWaist = add(lerpPoint(visual.leftShoulder, visual.leftHip, 0.66), scale(side, bodyRef * 0.018 * preset.waistTaper));
  const rightWaist = add(lerpPoint(visual.rightShoulder, visual.rightHip, 0.66), scale(side, -bodyRef * 0.018 * preset.waistTaper));

  addConstructionPoint(out, 'neckTop', 'neck top', neckTop);
  addConstructionPoint(out, 'neckBase', 'neck base', neckBase);
  addConstructionPoint(out, 'ribCentre', 'rib centre', ribCentre);
  addConstructionPoint(out, 'waistCentre', 'waist', waistCentre);
  addConstructionPoint(out, 'pelvisCentre', 'pelvis', pelvisCentre);
  addConstructionPoint(out, 'visualLeftShoulder', 'vis L shoulder', visual.leftShoulder);
  addConstructionPoint(out, 'visualRightShoulder', 'vis R shoulder', visual.rightShoulder);
  addConstructionPoint(out, 'visualLeftHip', 'vis L hip', visual.leftHip);
  addConstructionPoint(out, 'visualRightHip', 'vis R hip', visual.rightHip);
  addConstructionPoint(out, 'leftRibControl', 'L rib', leftRib);
  addConstructionPoint(out, 'rightRibControl', 'R rib', rightRib);
  addConstructionPoint(out, 'leftWaistControl', 'L waist', leftWaist);
  addConstructionPoint(out, 'rightWaistControl', 'R waist', rightWaist);
  if (head !== null) {
    addConstructionPoint(out, 'headCentre', 'head centre', head.center);
    addConstructionLine(
      out,
      'headRadiusX',
      add(head.center, scale(side, -head.rx * preset.headScale)),
      add(head.center, scale(side, head.rx * preset.headScale))
    );
    addConstructionLine(
      out,
      'headRadiusY',
      add(head.center, scale(down, -head.ry * preset.headScale)),
      add(head.center, scale(down, head.ry * preset.headScale))
    );
  }

  addConstructionLine(out, 'visualShoulders', visual.leftShoulder, visual.rightShoulder);
  addConstructionLine(out, 'visualLeftTorso', visual.leftShoulder, leftRib);
  addConstructionLine(out, 'visualRightTorso', visual.rightShoulder, rightRib);
  addConstructionLine(out, 'leftWaistToHip', leftWaist, visual.leftHip);
  addConstructionLine(out, 'rightWaistToHip', rightWaist, visual.rightHip);
  addConstructionLine(out, 'visualHips', visual.leftHip, visual.rightHip);
  addConstructionLine(out, 'neckAxis', neckTop, neckBase);

  appendConstructionLimbChain(
    pose,
    out,
    'leftArmRig',
    visual.leftShoulder,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    softMinConfidence
  );
  appendConstructionLimbChain(
    pose,
    out,
    'rightArmRig',
    visual.rightShoulder,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    softMinConfidence
  );
  appendConstructionLimbChain(
    pose,
    out,
    'leftLegRig',
    add(add(hipMid, scale(side, bodyRef * 0.048 * preset.thighRootSpacing)), scale(down, bodyRef * 0.052 * preset.thighRootDrop)),
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    softMinConfidence
  );
  appendConstructionLimbChain(
    pose,
    out,
    'rightLegRig',
    add(add(hipMid, scale(side, -bodyRef * 0.048 * preset.thighRootSpacing)), scale(down, bodyRef * 0.052 * preset.thighRootDrop)),
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    softMinConfidence
  );
}

function appendConstructionLimbChain(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  id: string,
  root: Point,
  midLm: LM,
  endLm: LM,
  softMinConfidence: number
): void {
  addConstructionPoint(out, `${id}Root`, `${id} root`, root);
  if (landmarkConfidence(pose, midLm) < softMinConfidence || !landmarkFinite(pose, midLm)) return;
  const mid = pointFor(pose, midLm);
  addConstructionPoint(out, `${id}Mid`, `${id} mid`, mid);
  addConstructionLine(out, `${id}RootToMid`, root, mid);
  if (landmarkConfidence(pose, endLm) < softMinConfidence || !landmarkFinite(pose, endLm)) return;
  const end = pointFor(pose, endLm);
  addConstructionPoint(out, `${id}End`, `${id} end`, end);
  addConstructionLine(out, `${id}MidToEnd`, mid, end);
}

function createVisualTorsoAnchors(
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset
): VisualTorsoAnchors {
  const shoulderInset = clamp(0.1 + (1 - preset.shoulderSoftness) * 0.05, 0.06, 0.16);
  const hipInset = clamp(0.1 + (1 - preset.hipWidthScale) * 0.08, 0.06, 0.18);
  const shoulderDrop = axes.bodyRef * 0.012 * preset.shoulderRoundness * preset.shoulderDrop;
  const hipLift = axes.bodyRef * 0.006;
  return {
    leftShoulder: add(lerpPoint(torso.leftShoulder, axes.shoulderMid, shoulderInset), scale(axes.down, shoulderDrop)),
    rightShoulder: add(lerpPoint(torso.rightShoulder, axes.shoulderMid, shoulderInset), scale(axes.down, shoulderDrop)),
    leftHip: add(lerpPoint(torso.leftHip, axes.hipMid, hipInset), scale(axes.down, -hipLift)),
    rightHip: add(lerpPoint(torso.rightHip, axes.hipMid, hipInset), scale(axes.down, -hipLift)),
  };
}

export function isFiniteSoftDigitalTwinGeometry(geometry: SoftDigitalTwinGeometry): boolean {
  if (!Number.isFinite(geometry.opacity)) return false;
  for (const surface of geometry.surfaces) {
    if (!Number.isFinite(surface.opacity) || !Number.isFinite(surface.confidence)) return false;
    if (surface.path.includes('NaN') || surface.path.includes('Infinity')) return false;
  }
  for (const point of geometry.constructionPoints) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  }
  for (const line of geometry.constructionLines) {
    if (
      !Number.isFinite(line.fromX) ||
      !Number.isFinite(line.fromY) ||
      !Number.isFinite(line.toX) ||
      !Number.isFinite(line.toY)
    ) {
      return false;
    }
  }
  return true;
}

function appendCore(
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  const { side, down, shoulderMid, bodyRef } = axes;
  const visual = createVisualTorsoAnchors(torso, axes, preset);
  const leftShoulder = visual.leftShoulder;
  const rightShoulder = visual.rightShoulder;
  const leftHip = visual.leftHip;
  const rightHip = visual.rightHip;
  const softness = preset.torsoSoftness;
  const shoulderSoftness = preset.shoulderSoftness;
  const shoulderRoundness = preset.shoulderRoundness;
  const shoulderCap = bodyRef * (0.044 + shoulderSoftness * 0.01) * preset.shoulderWidthScale;
  const shoulderDrop = bodyRef * (0.026 + shoulderSoftness * 0.011) * shoulderRoundness;
  const neckHalf = bodyRef * (0.046 * preset.neckWidth);
  const ribOut = bodyRef * (0.018 + softness * 0.013) * preset.torsoWidthScale;
  const waistOut = bodyRef * 0.024 * preset.torsoWidthScale * preset.torsoWaistTaper;
  const hipOut = bodyRef * 0.066 * preset.hipWidthScale;

  const neckLift = bodyRef * 0.125 * preset.neckLength;
  const neckLeft = add(add(shoulderMid, scale(side, neckHalf)), scale(down, -neckLift));
  const neckRight = add(add(shoulderMid, scale(side, -neckHalf)), scale(down, -neckLift));
  const neckSaddle = add(shoulderMid, scale(down, -bodyRef * 0.105 * preset.neckLength));
  const leftTrap = add(add(leftShoulder, scale(side, shoulderCap * 0.03)), scale(down, -bodyRef * 0.034 * shoulderRoundness));
  const rightTrap = add(add(rightShoulder, scale(side, -shoulderCap * 0.03)), scale(down, -bodyRef * 0.034 * shoulderRoundness));
  const leftShoulderOuter = add(add(leftShoulder, scale(side, shoulderCap * 0.62)), scale(down, shoulderDrop));
  const rightShoulderOuter = add(add(rightShoulder, scale(side, -shoulderCap * 0.62)), scale(down, shoulderDrop));
  const leftRib = add(lerpPoint(leftShoulder, leftHip, 0.34), scale(side, ribOut));
  const rightRib = add(lerpPoint(rightShoulder, rightHip, 0.34), scale(side, -ribOut));
  const leftWaist = add(lerpPoint(leftShoulder, leftHip, 0.67), scale(side, waistOut));
  const rightWaist = add(lerpPoint(rightShoulder, rightHip, 0.67), scale(side, -waistOut));
  const leftHipSoft = add(add(leftHip, scale(side, hipOut)), scale(down, -bodyRef * 0.02));
  const rightHipSoft = add(add(rightHip, scale(side, -hipOut)), scale(down, -bodyRef * 0.02));
  const lowerHipOut = bodyRef * 0.026 * preset.hipWidthScale * preset.torsoHipBlend;
  const leftLowerHip = add(add(leftHip, scale(side, lowerHipOut)), scale(down, bodyRef * 0.024 * preset.lowerTorsoLength));
  const rightLowerHip = add(add(rightHip, scale(side, -lowerHipOut)), scale(down, bodyRef * 0.024 * preset.lowerTorsoLength));
  const lowerBowl = add(midpoint(leftHip, rightHip), scale(down, bodyRef * 0.034 * preset.lowerTorsoLength));

  const path =
    `M${p(neckLeft)}` +
    `C${p(leftTrap)} ${p(add(leftTrap, scale(side, shoulderCap * 0.22)))} ${p(leftShoulderOuter)}` +
    `C${p(add(leftRib, scale(down, -bodyRef * 0.046)))} ${p(add(leftRib, scale(down, bodyRef * 0.064)))} ${p(leftWaist)}` +
    `C${p(add(leftWaist, scale(down, bodyRef * 0.07)))} ${p(add(leftHipSoft, scale(side, -bodyRef * 0.02)))} ${p(leftHipSoft)}` +
    `C${p(add(leftHipSoft, scale(down, bodyRef * 0.052)))} ${p(add(leftLowerHip, scale(down, -bodyRef * 0.014)))} ${p(leftLowerHip)}` +
    `C${p(add(leftLowerHip, scale(side, -bodyRef * 0.052)))} ${p(add(lowerBowl, scale(side, bodyRef * 0.052)))} ${p(lowerBowl)}` +
    `C${p(add(lowerBowl, scale(side, -bodyRef * 0.052)))} ${p(add(rightLowerHip, scale(side, bodyRef * 0.052)))} ${p(rightLowerHip)}` +
    `C${p(add(rightLowerHip, scale(down, -bodyRef * 0.014)))} ${p(add(rightHipSoft, scale(down, bodyRef * 0.052)))} ${p(rightHipSoft)}` +
    `C${p(add(rightHipSoft, scale(side, bodyRef * 0.012)))} ${p(add(rightWaist, scale(down, bodyRef * 0.058)))} ${p(rightWaist)}` +
    `C${p(add(rightRib, scale(down, bodyRef * 0.064)))} ${p(add(rightRib, scale(down, -bodyRef * 0.046)))} ${p(rightShoulderOuter)}` +
    `C${p(add(rightTrap, scale(side, -shoulderCap * 0.22)))} ${p(rightTrap)} ${p(neckRight)}` +
    `C${p(add(neckRight, scale(side, bodyRef * 0.02)))} ${p(add(neckSaddle, scale(side, -bodyRef * 0.026)))} ${p(neckSaddle)}` +
    `C${p(add(neckSaddle, scale(side, bodyRef * 0.026)))} ${p(add(neckLeft, scale(side, -bodyRef * 0.02)))} ${p(neckLeft)}Z`;

  addSurface(out, 'ribcageTorso', path, 'core', torso.confidence, minConfidence, 1);
}

function appendPelvis(
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  const { side, down, hipMid, bodyRef } = axes;
  const visual = createVisualTorsoAnchors(torso, axes, preset);
  const leftHip = visual.leftHip;
  const rightHip = visual.rightHip;
  const softness = preset.pelvisSoftness;
  const pelvisOut = bodyRef * (0.054 + softness * 0.016) * preset.hipWidthScale;
  const waistOut = bodyRef * 0.028 * preset.hipWidthScale;
  const bowlDrop = bodyRef * (0.056 + softness * 0.01) * preset.lowerTorsoLength * preset.pelvisBlendHeight;
  const leftWaist = add(add(leftHip, scale(side, waistOut)), scale(down, -bodyRef * 0.038));
  const rightWaist = add(add(rightHip, scale(side, -waistOut)), scale(down, -bodyRef * 0.038));
  const leftHipOuter = add(add(leftHip, scale(side, pelvisOut)), scale(down, -bodyRef * 0.004));
  const rightHipOuter = add(add(rightHip, scale(side, -pelvisOut)), scale(down, -bodyRef * 0.004));
  const leftLowerBowl = add(add(hipMid, scale(side, bodyRef * 0.064)), scale(down, bowlDrop));
  const rightLowerBowl = add(add(hipMid, scale(side, -bodyRef * 0.064)), scale(down, bowlDrop));
  const lowerBridge = add(hipMid, scale(down, bodyRef * 0.074));

  const path =
    `M${p(leftWaist)}` +
    `C${p(add(leftHipOuter, scale(down, -bodyRef * 0.034)))} ${p(add(leftHipOuter, scale(down, bodyRef * 0.028)))} ${p(leftLowerBowl)}` +
    `C${p(add(leftLowerBowl, scale(side, -bodyRef * 0.044)))} ${p(add(lowerBridge, scale(side, bodyRef * 0.036)))} ${p(lowerBridge)}` +
    `C${p(add(lowerBridge, scale(side, -bodyRef * 0.036)))} ${p(add(rightLowerBowl, scale(side, bodyRef * 0.044)))} ${p(rightLowerBowl)}` +
    `C${p(add(rightHipOuter, scale(down, bodyRef * 0.028)))} ${p(add(rightHipOuter, scale(down, -bodyRef * 0.034)))} ${p(rightWaist)}` +
    `C${p(add(rightWaist, scale(side, bodyRef * 0.052)))} ${p(add(leftWaist, scale(side, -bodyRef * 0.052)))} ${p(leftWaist)}Z`;

  addSurface(
    out,
    'pelvis',
    path,
    'blend',
    torso.confidence,
    minConfidence,
    preset.pelvisContrast * preset.pelvisOpacity * preset.lowerTorsoBlendOpacity
  );
}

function appendBalancedCore(
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  const { side, down, shoulderMid, hipMid, bodyRef } = axes;
  const spineAt = (t: number): Point => lerpPoint(shoulderMid, hipMid, t);
  const shoulderHalf = bodyRef * 0.15 * preset.shoulderWidthScale;
  const deltoidHalf = bodyRef * 0.185 * preset.shoulderWidthScale;
  const ribHalf = bodyRef * 0.15 * preset.torsoWidthScale * preset.ribcageWidth;
  const waistHalf = bodyRef * 0.11 * preset.torsoWidthScale * preset.waistTaper;
  const hipHalf = bodyRef * 0.145 * preset.hipWidthScale * preset.hipBlendWidth;
  const bridgeHalf = bodyRef * 0.07 * preset.pelvisSplitSoftness;
  const sideCurve = bodyRef * 0.036 * preset.torsoSideCurve;
  const neckHalf = bodyRef * 0.042 * preset.neckWidth;
  const topDrop = bodyRef * 0.012;
  const neckSaddle = add(shoulderMid, scale(down, -bodyRef * 0.018));
  const leftNeck = add(add(shoulderMid, scale(side, neckHalf)), scale(down, topDrop));
  const rightNeck = add(add(shoulderMid, scale(side, -neckHalf)), scale(down, topDrop));
  const leftShoulderSlope = add(add(spineAt(0.08), scale(side, shoulderHalf)), scale(down, bodyRef * 0.04));
  const rightShoulderSlope = add(add(spineAt(0.08), scale(side, -shoulderHalf)), scale(down, bodyRef * 0.04));
  const leftDeltoid = add(add(spineAt(0.15), scale(side, deltoidHalf)), scale(down, bodyRef * 0.03));
  const rightDeltoid = add(add(spineAt(0.15), scale(side, -deltoidHalf)), scale(down, bodyRef * 0.03));
  const leftRib = add(spineAt(0.34), scale(side, ribHalf));
  const rightRib = add(spineAt(0.34), scale(side, -ribHalf));
  const leftWaist = add(spineAt(0.66), scale(side, waistHalf));
  const rightWaist = add(spineAt(0.66), scale(side, -waistHalf));
  const leftHip = add(spineAt(0.9), scale(side, hipHalf));
  const rightHip = add(spineAt(0.9), scale(side, -hipHalf));
  const leftBridge = add(add(hipMid, scale(side, bridgeHalf)), scale(down, bodyRef * 0.06));
  const rightBridge = add(add(hipMid, scale(side, -bridgeHalf)), scale(down, bodyRef * 0.06));

  const path =
    `M${p(leftNeck)}` +
    `C${p(add(leftShoulderSlope, scale(side, -bodyRef * 0.026)))} ${p(add(leftShoulderSlope, scale(down, -bodyRef * 0.026)))} ${p(leftShoulderSlope)}` +
    `C${p(add(leftDeltoid, scale(down, -bodyRef * 0.026)))} ${p(add(leftDeltoid, scale(down, bodyRef * 0.046)))} ${p(leftRib)}` +
    `C${p(add(leftRib, scale(down, bodyRef * 0.08)))} ${p(add(add(leftWaist, scale(side, -sideCurve)), scale(down, -bodyRef * 0.03)))} ${p(leftWaist)}` +
    `C${p(add(add(leftWaist, scale(side, -sideCurve * 0.34)), scale(down, bodyRef * 0.08)))} ${p(add(leftHip, scale(down, -bodyRef * 0.05)))} ${p(leftHip)}` +
    `C${p(add(leftHip, scale(down, bodyRef * 0.048)))} ${p(add(leftBridge, scale(side, bodyRef * 0.036)))} ${p(leftBridge)}` +
    `C${p(add(leftBridge, scale(side, -bodyRef * 0.016)))} ${p(add(rightBridge, scale(side, bodyRef * 0.016)))} ${p(rightBridge)}` +
    `C${p(add(rightBridge, scale(side, -bodyRef * 0.036)))} ${p(add(rightHip, scale(down, bodyRef * 0.048)))} ${p(rightHip)}` +
    `C${p(add(rightHip, scale(down, -bodyRef * 0.05)))} ${p(add(add(rightWaist, scale(side, sideCurve * 0.34)), scale(down, bodyRef * 0.08)))} ${p(rightWaist)}` +
    `C${p(add(add(rightWaist, scale(side, sideCurve)), scale(down, -bodyRef * 0.03)))} ${p(add(rightRib, scale(down, bodyRef * 0.08)))} ${p(rightRib)}` +
    `C${p(add(rightDeltoid, scale(down, bodyRef * 0.046)))} ${p(add(rightDeltoid, scale(down, -bodyRef * 0.026)))} ${p(rightShoulderSlope)}` +
    `C${p(add(rightShoulderSlope, scale(down, -bodyRef * 0.026)))} ${p(add(rightShoulderSlope, scale(side, bodyRef * 0.026)))} ${p(rightNeck)}` +
    `C${p(add(rightNeck, scale(side, bodyRef * 0.02)))} ${p(add(neckSaddle, scale(side, -bodyRef * 0.024)))} ${p(neckSaddle)}` +
    `C${p(add(neckSaddle, scale(side, bodyRef * 0.024)))} ${p(add(leftNeck, scale(side, -bodyRef * 0.02)))} ${p(leftNeck)}Z`;

  addSurface(out, 'ribcageTorso', path, 'core', torso.confidence, minConfidence, 1);
}

function appendBalancedPelvis(
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  const { side, down, hipMid, bodyRef } = axes;
  const visual = createVisualTorsoAnchors(torso, axes, preset);
  const leftUpper = add(add(visual.leftHip, scale(side, bodyRef * 0.05 * preset.hipBlendWidth)), scale(down, -bodyRef * 0.008));
  const rightUpper = add(add(visual.rightHip, scale(side, -bodyRef * 0.05 * preset.hipBlendWidth)), scale(down, -bodyRef * 0.008));
  const leftLower = add(add(hipMid, scale(side, bodyRef * 0.092 * preset.hipBlendWidth)), scale(down, bodyRef * 0.058 * preset.pelvisBlendHeight));
  const rightLower = add(add(hipMid, scale(side, -bodyRef * 0.092 * preset.hipBlendWidth)), scale(down, bodyRef * 0.058 * preset.pelvisBlendHeight));
  const bridgeDrop = bodyRef * 0.07 * preset.pelvisBlendHeight;
  const bridgeHalf = bodyRef * 0.04 * preset.pelvisSplitSoftness;
  const leftBridge = add(add(hipMid, scale(side, bridgeHalf)), scale(down, bridgeDrop));
  const rightBridge = add(add(hipMid, scale(side, -bridgeHalf)), scale(down, bridgeDrop));

  const path =
    `M${p(leftUpper)}` +
    `C${p(add(leftUpper, scale(down, bodyRef * 0.048)))} ${p(add(leftLower, scale(side, bodyRef * 0.014)))} ${p(leftLower)}` +
    `C${p(add(leftLower, scale(side, -bodyRef * 0.052)))} ${p(add(leftBridge, scale(side, bodyRef * 0.04)))} ${p(leftBridge)}` +
    `C${p(add(leftBridge, scale(side, -bodyRef * 0.018)))} ${p(add(rightBridge, scale(side, bodyRef * 0.018)))} ${p(rightBridge)}` +
    `C${p(add(rightBridge, scale(side, -bodyRef * 0.04)))} ${p(add(rightLower, scale(side, bodyRef * 0.052)))} ${p(rightLower)}` +
    `C${p(add(rightLower, scale(side, -bodyRef * 0.014)))} ${p(add(rightUpper, scale(down, bodyRef * 0.048)))} ${p(rightUpper)}` +
    `C${p(add(rightUpper, scale(side, bodyRef * 0.05)))} ${p(add(leftUpper, scale(side, -bodyRef * 0.05)))} ${p(leftUpper)}Z`;

  addSurface(
    out,
    'pelvis',
    path,
    'blend',
    torso.confidence,
    minConfidence,
    preset.pelvisContrast *
      preset.pelvisBridgeOpacity *
      (0.04 + preset.pelvisTriangleOpacity) *
      preset.pelvisOpacity
  );
}

function appendBalancedArmSurfaces(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const visual = createVisualTorsoAnchors(torso, axes, preset);
  appendBalancedArmSurface(
    pose,
    out,
    axes,
    'left',
    visual.leftShoulder,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    LM.LEFT_PINKY,
    1,
    preset,
    minConfidence,
    softMinConfidence
  );
  appendBalancedArmSurface(
    pose,
    out,
    axes,
    'right',
    visual.rightShoulder,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    LM.RIGHT_PINKY,
    -1,
    preset,
    minConfidence,
    softMinConfidence
  );
}

function appendBalancedArmSurface(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  prefix: 'left' | 'right',
  shoulder: Point,
  elbowLm: LM,
  wristLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  sideMultiplier: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const elbowConfidence = landmarkConfidence(pose, elbowLm);
  if (elbowConfidence < softMinConfidence || !landmarkFinite(pose, elbowLm)) {
    out.skippedPartCount++;
    return;
  }

  const { side, down, bodyRef } = axes;
  const elbow = pointFor(pose, elbowLm);
  const shoulderRoot = add(
    add(lerpPoint(shoulder, elbow, 0.19), scale(side, bodyRef * 0.024 * sideMultiplier)),
    scale(down, bodyRef * 0.012 * preset.upperArmShoulderBlend)
  );
  const upperStartWidth = bodyRef * 0.047 * preset.limbMass * preset.upperArmWidth;
  const elbowWidth = bodyRef * 0.028 * preset.limbMass * preset.armTaper;
  const upperPath = organicLimbPath(
    shoulderRoot,
    elbow,
    upperStartWidth,
    elbowWidth,
    bodyRef * 0.034 * preset.upperArmShoulderBlend,
    bodyRef * 0.04,
    preset
  );
  addSurface(out, `${prefix}UpperArm`, upperPath, 'limb', elbowConfidence, minConfidence, 0.94);

  const wristConfidence = landmarkConfidence(pose, wristLm);
  if (wristConfidence < softMinConfidence || !landmarkFinite(pose, wristLm)) {
    out.skippedPartCount++;
    return;
  }

  const wrist = pointFor(pose, wristLm);
  const fallbackAxis = normalize({ x: wrist.x - elbow.x, y: wrist.y - elbow.y });
  let handEnd = add(wrist, scale(fallbackAxis, bodyRef * 0.034 * preset.armLengthScale));
  let distalConfidence = wristConfidence;
  if (
    landmarkConfidence(pose, indexLm) >= softMinConfidence &&
    landmarkConfidence(pose, pinkyLm) >= softMinConfidence &&
    landmarkFinite(pose, indexLm) &&
    landmarkFinite(pose, pinkyLm)
  ) {
    handEnd = lerpPoint(wrist, midpoint(pointFor(pose, indexLm), pointFor(pose, pinkyLm)), 0.56);
    distalConfidence = Math.min(wristConfidence, landmarkConfidence(pose, indexLm), landmarkConfidence(pose, pinkyLm));
  }

  appendBentLimbFromPoints(
    out,
    `${prefix}ForearmHand`,
    lerpPoint(elbow, wrist, -0.06),
    wrist,
    handEnd,
    elbowWidth * 0.96,
    bodyRef * 0.02 * preset.limbMass * preset.forearmTaper,
    bodyRef * 0.021 * preset.distalMass * preset.handScale,
    Math.min(elbowConfidence, distalConfidence),
    preset,
    minConfidence,
    0.92
  );
}

function appendBalancedLegSurfaces(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  appendBalancedLegSurface(
    pose,
    out,
    axes,
    'left',
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    LM.LEFT_HEEL,
    LM.LEFT_FOOT_INDEX,
    1,
    preset,
    minConfidence,
    softMinConfidence
  );
  appendBalancedLegSurface(
    pose,
    out,
    axes,
    'right',
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    LM.RIGHT_HEEL,
    LM.RIGHT_FOOT_INDEX,
    -1,
    preset,
    minConfidence,
    softMinConfidence
  );
}

function appendBalancedLegSurface(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  prefix: 'left' | 'right',
  hipLm: LM,
  kneeLm: LM,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  sideMultiplier: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const hipConfidence = landmarkConfidence(pose, hipLm);
  const kneeConfidence = landmarkConfidence(pose, kneeLm);
  if (
    hipConfidence < softMinConfidence ||
    kneeConfidence < softMinConfidence ||
    !landmarkFinite(pose, hipLm) ||
    !landmarkFinite(pose, kneeLm)
  ) {
    out.skippedPartCount++;
    return;
  }

  const { side, down, hipMid, bodyRef } = axes;
  const hip = pointFor(pose, hipLm);
  const knee = pointFor(pose, kneeLm);
  const thighRoot = add(
    add(lerpPoint(hipMid, hip, 0.9), scale(side, bodyRef * 0.01 * sideMultiplier * preset.thighRootSpacing)),
    scale(down, bodyRef * 0.11 * preset.thighRootDrop)
  );
  const thighWidth = bodyRef * 0.048 * preset.limbMass * preset.thighWidth * preset.thighRootWidth;
  const kneeWidth = bodyRef * 0.03 * preset.limbMass * preset.kneeTaper / preset.kneeNarrowing;
  const thighPath = organicLimbPath(
    thighRoot,
    knee,
    thighWidth,
    kneeWidth,
    bodyRef * 0.038 * preset.pelvisSplitSoftness,
    bodyRef * 0.042 * preset.thighTaper,
    preset
  );
  addSurface(
    out,
    `${prefix}Thigh`,
    thighPath,
    'limb',
    Math.min(hipConfidence, kneeConfidence),
    minConfidence,
    0.94
  );

  const ankleConfidence = landmarkConfidence(pose, ankleLm);
  if (ankleConfidence < softMinConfidence || !landmarkFinite(pose, ankleLm)) {
    out.skippedPartCount++;
    return;
  }

  const ankle = pointFor(pose, ankleLm);
  const lowerAxis = normalize({ x: ankle.x - knee.x, y: ankle.y - knee.y });
  let footEnd = add(
    add(ankle, scale(lowerAxis, bodyRef * 0.026)),
    scale(side, bodyRef * 0.018 * sideMultiplier * preset.footScale)
  );
  let distalConfidence = ankleConfidence;
  if (
    landmarkConfidence(pose, heelLm) >= softMinConfidence &&
    landmarkConfidence(pose, toeLm) >= softMinConfidence &&
    landmarkFinite(pose, heelLm) &&
    landmarkFinite(pose, toeLm)
  ) {
    footEnd = lerpPoint(pointFor(pose, heelLm), pointFor(pose, toeLm), 0.62);
    distalConfidence = Math.min(ankleConfidence, landmarkConfidence(pose, heelLm), landmarkConfidence(pose, toeLm));
  }

  appendBentLimbFromPoints(
    out,
    `${prefix}ShinFoot`,
    lerpPoint(knee, ankle, -0.04),
    ankle,
    footEnd,
    kneeWidth * 0.92,
    bodyRef * 0.023 * preset.limbMass * preset.shinTaper,
    bodyRef * 0.024 * preset.distalMass * preset.footScale,
    Math.min(kneeConfidence, distalConfidence),
    preset,
    minConfidence,
    0.92
  );
}

function appendBalancedNeck(
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  const { down, shoulderMid, bodyRef } = axes;
  const confidence = Math.min(torso.confidence, head?.confidence ?? torso.confidence * 0.72);
  const headCenter = head
    ? add(head.center, scale(down, head.ry * (0.018 + preset.headYOffset)))
    : null;
  const start = head
    ? add(headCenter!, scale(down, head.ry * 0.68 * preset.headScale))
    : add(shoulderMid, scale(down, -bodyRef * 0.11));
  const end = add(shoulderMid, scale(down, bodyRef * 0.018));
  const path = organicLimbPath(
    start,
    end,
    bodyRef * 0.036 * preset.neckWidth,
    bodyRef * 0.074 * preset.neckWidth * preset.neckBaseWidth,
    bodyRef * 0.006,
    bodyRef * 0.028,
    preset
  );
  addSurface(out, 'neck', path, 'core', confidence, minConfidence, 0.9);
}

function appendNeck(
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  const { down, shoulderMid, bodyRef } = axes;
  const headOverlap = 0.64 + Math.max(0, 1 - preset.neckLength) * 0.08;
  const headShift = head
    ? head.ry * (0.018 + preset.headYOffset)
    : 0;
  const headCenter = head ? add(head.center, scale(down, headShift)) : null;
  const headBottom = head
    ? add(headCenter!, scale(down, head.ry * headOverlap * preset.headScale))
    : add(shoulderMid, scale(down, -bodyRef * 0.34));
  const neckBase = add(shoulderMid, scale(down, -bodyRef * 0.064 * preset.neckLength));
  const neckWidth = preset.neckWidth;
  const confidence = Math.min(torso.confidence, head?.confidence ?? torso.confidence * 0.72);
  const path = taperedCapsulePath(
    headBottom,
    neckBase,
    bodyRef * (0.034 * neckWidth),
    bodyRef * (0.06 * neckWidth * preset.neckBaseWidth),
    bodyRef * 0.012,
    bodyRef * (0.018 + 0.012 * preset.neckLength)
  );
  addSurface(out, 'neck', path, 'core', confidence, minConfidence, 0.82);
}

function appendHead(
  out: SoftDigitalTwinGeometry,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number
): void {
  if (head === null) {
    out.skippedPartCount++;
    return;
  }
  addSurface(out, 'head', eggHeadPath(head, axes, preset), 'core', head.confidence, minConfidence, 1);
}

function appendArmChains(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const limbMass = preset.limbMass;
  appendBentLimb(
    pose,
    out,
    axes,
    'leftArm',
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    0.047 * limbMass,
    0.034 * limbMass * preset.armTaper,
    0.021 * limbMass * preset.handScale,
    preset,
    minConfidence,
    softMinConfidence
  );
  appendBentLimb(
    pose,
    out,
    axes,
    'rightArm',
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    0.047 * limbMass,
    0.034 * limbMass * preset.armTaper,
    0.021 * limbMass * preset.handScale,
    preset,
    minConfidence,
    softMinConfidence
  );
}

function appendBalancedArmChains(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  appendBalancedArmChain(
    pose,
    out,
    axes,
    'leftArm',
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    1,
    preset,
    minConfidence,
    softMinConfidence
  );
  appendBalancedArmChain(
    pose,
    out,
    axes,
    'rightArm',
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    -1,
    preset,
    minConfidence,
    softMinConfidence
  );
}

function appendBalancedArmChain(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  id: string,
  shoulderLm: LM,
  elbowLm: LM,
  wristLm: LM,
  sideMultiplier: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const shoulderConfidence = landmarkConfidence(pose, shoulderLm);
  const elbowConfidence = landmarkConfidence(pose, elbowLm);
  const wristConfidence = landmarkConfidence(pose, wristLm);
  if (
    shoulderConfidence < softMinConfidence ||
    elbowConfidence < softMinConfidence ||
    !landmarkFinite(pose, shoulderLm) ||
    !landmarkFinite(pose, elbowLm)
  ) {
    out.skippedPartCount++;
    return;
  }

  const shoulder = pointFor(pose, shoulderLm);
  const elbow = pointFor(pose, elbowLm);
  const start = add(
    lerpPoint(shoulder, elbow, 0.13),
    scale(axes.side, axes.bodyRef * 0.006 * sideMultiplier)
  );
  const confidence = Math.min(shoulderConfidence, elbowConfidence);
  const wrist = pointForOrFallback(pose, wristLm, add(elbow, scale(axes.down, axes.bodyRef * 0.28)));
  const forearmAxis = normalize({ x: wrist.x - elbow.x, y: wrist.y - elbow.y });
  const handEnd = add(wrist, scale(forearmAxis, axes.bodyRef * 0.062 * preset.armLengthScale));
  const startWidth = axes.bodyRef * 0.045 * preset.limbMass;
  const elbowWidth = axes.bodyRef * 0.031 * preset.limbMass * preset.armTaper;
  const handWidth = axes.bodyRef * 0.02 * preset.limbMass * preset.handScale;

  if (wristConfidence >= softMinConfidence && landmarkFinite(pose, wristLm)) {
    appendBentLimbFromPoints(
      out,
      id,
      start,
      elbow,
      handEnd,
      startWidth,
      elbowWidth,
      handWidth,
      Math.min(confidence, wristConfidence),
      preset,
      minConfidence,
      0.94
    );
    return;
  }

  appendStraightLimbFromPoints(
    out,
    id,
    start,
    elbow,
    startWidth,
    elbowWidth,
    confidence,
    preset,
    minConfidence,
    0.72
  );
}

function appendLegChains(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const limbMass = preset.limbMass;
  appendLegChain(
    pose,
    out,
    axes,
    'leftLeg',
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    0.062 * limbMass * preset.thighWidth,
    0.043 * limbMass * preset.kneeTaper,
    0.026 * limbMass * preset.shinTaper,
    preset,
    minConfidence,
    softMinConfidence
  );
  appendLegChain(
    pose,
    out,
    axes,
    'rightLeg',
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    0.062 * limbMass * preset.thighWidth,
    0.043 * limbMass * preset.kneeTaper,
    0.026 * limbMass * preset.shinTaper,
    preset,
    minConfidence,
    softMinConfidence
  );
}

function appendLegChain(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  id: string,
  hipLm: LM,
  kneeLm: LM,
  ankleLm: LM,
  startWidth: number,
  midWidth: number,
  endWidth: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const hipConfidence = landmarkConfidence(pose, hipLm);
  const kneeConfidence = landmarkConfidence(pose, kneeLm);
  const ankleConfidence = landmarkConfidence(pose, ankleLm);
  if (
    hipConfidence < softMinConfidence ||
    kneeConfidence < softMinConfidence ||
    !landmarkFinite(pose, hipLm) ||
    !landmarkFinite(pose, kneeLm)
  ) {
    out.skippedPartCount++;
    return;
  }
  const sideMultiplier = hipLm === LM.LEFT_HIP ? 1 : -1;
  const thighRoot = add(
    add(axes.hipMid, scale(axes.side, axes.bodyRef * 0.048 * preset.thighRootSpacing * sideMultiplier)),
    scale(axes.down, axes.bodyRef * 0.052 * preset.thighRootDrop)
  );
  const knee = pointFor(pose, kneeLm);
  const taper = preset.limbTaper;
  if (ankleConfidence >= softMinConfidence && landmarkFinite(pose, ankleLm)) {
    appendBentLimbFromPoints(
      out,
      id,
      thighRoot,
      knee,
      pointFor(pose, ankleLm),
      axes.bodyRef * startWidth,
      axes.bodyRef * midWidth,
      axes.bodyRef * (midWidth - (midWidth - endWidth) * taper),
      Math.min(hipConfidence, kneeConfidence, ankleConfidence),
      preset,
      minConfidence,
      0.9
    );
    return;
  }
  appendStraightLimbFromPoints(
    out,
    id,
    thighRoot,
    knee,
    axes.bodyRef * startWidth,
    axes.bodyRef * (startWidth - (startWidth - midWidth) * taper),
    Math.min(hipConfidence, kneeConfidence),
    preset,
    minConfidence,
    0.72
  );
}

function appendBalancedBodyEnvelope(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const required = [
    LM.LEFT_ELBOW,
    LM.RIGHT_ELBOW,
    LM.LEFT_KNEE,
    LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,
    LM.RIGHT_ANKLE,
  ] as const;
  for (const lm of required) {
    if (landmarkConfidence(pose, lm) < softMinConfidence || !landmarkFinite(pose, lm)) {
      out.skippedPartCount++;
      return;
    }
  }

  const { side, down, shoulderMid, hipMid, bodyRef } = axes;
  const confidence = Math.min(
    torso.confidence,
    landmarkConfidence(pose, LM.LEFT_ELBOW),
    landmarkConfidence(pose, LM.RIGHT_ELBOW),
    landmarkConfidence(pose, LM.LEFT_KNEE),
    landmarkConfidence(pose, LM.RIGHT_KNEE),
    landmarkConfidence(pose, LM.LEFT_ANKLE),
    landmarkConfidence(pose, LM.RIGHT_ANKLE)
  );
  const shoulderOut = bodyRef * 0.056 * preset.shoulderWidthScale;
  const ribOut = bodyRef * 0.044 * preset.torsoWidthScale * preset.ribcageWidth;
  const waistOut = bodyRef * 0.026 * preset.torsoWidthScale * preset.torsoWaistTaper * preset.waistTaper;
  const hipOut = bodyRef * 0.054 * preset.hipWidthScale * preset.hipBlendWidth;
  const upperArmOut = bodyRef * 0.05 * preset.limbMass;
  const elbowOut = bodyRef * 0.036 * preset.limbMass * preset.armTaper;
  const wristOut = bodyRef * 0.023 * preset.limbMass;
  const thighOut = bodyRef * 0.058 * preset.thighWidth;
  const ankleOut = bodyRef * 0.024 * preset.shinTaper;
  const innerThigh = bodyRef * 0.028 * preset.innerThighSplitDepth;
  const innerAnkle = bodyRef * 0.014 * preset.shinTaper;
  const collarHalf = bodyRef * 0.042 * preset.neckWidth;
  const leftCollar = add(add(shoulderMid, scale(side, collarHalf)), scale(down, -bodyRef * 0.012));
  const rightCollar = add(add(shoulderMid, scale(side, -collarHalf)), scale(down, -bodyRef * 0.012));
  const collarSaddle = add(shoulderMid, scale(down, -bodyRef * 0.018));
  const leftShoulderOuter = add(add(torso.leftShoulder, scale(side, shoulderOut * 0.78)), scale(down, bodyRef * 0.06 * preset.shoulderSlope));
  const rightShoulderOuter = add(add(torso.rightShoulder, scale(side, -shoulderOut * 0.78)), scale(down, bodyRef * 0.06 * preset.shoulderSlope));
  const leftRib = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.34), scale(side, ribOut));
  const rightRib = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.34), scale(side, -ribOut));
  const leftWaist = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.64), scale(side, waistOut));
  const rightWaist = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.64), scale(side, -waistOut));
  const leftArmpit = add(lerpPoint(torso.leftShoulder, torso.leftHip, 0.22), scale(side, bodyRef * 0.018));
  const rightArmpit = add(lerpPoint(torso.rightShoulder, torso.rightHip, 0.22), scale(side, -bodyRef * 0.018));
  const leftHip = add(add(torso.leftHip, scale(side, hipOut)), scale(down, bodyRef * 0.004));
  const rightHip = add(add(torso.rightHip, scale(side, -hipOut)), scale(down, bodyRef * 0.004));
  const leftElbow = pointFor(pose, LM.LEFT_ELBOW);
  const rightElbow = pointFor(pose, LM.RIGHT_ELBOW);
  const leftWrist = pointForOrFallback(pose, LM.LEFT_WRIST, add(leftElbow, scale(down, bodyRef * 0.3)));
  const rightWrist = pointForOrFallback(pose, LM.RIGHT_WRIST, add(rightElbow, scale(down, bodyRef * 0.3)));
  const leftUpperArmOuter = add(lerpPoint(torso.leftShoulder, leftElbow, 0.2), scale(side, upperArmOut));
  const leftElbowOuter = add(leftElbow, scale(side, elbowOut));
  const leftWristOuter = add(leftWrist, scale(side, wristOut));
  const leftHandOuter = add(
    add(leftWrist, scale(side, wristOut * 0.86 * preset.handScale)),
    scale(down, bodyRef * 0.034 * preset.armLengthScale)
  );
  const leftHandTip = add(
    add(leftWrist, scale(side, wristOut * 0.54 * preset.handScale)),
    scale(down, bodyRef * 0.052 * preset.armLengthScale)
  );
  const leftHandInner = add(
    add(leftWrist, scale(side, -wristOut * 0.42 * preset.handScale)),
    scale(down, bodyRef * 0.046 * preset.armLengthScale)
  );
  const leftWristInner = add(leftWrist, scale(side, -wristOut * 0.62));
  const leftElbowInner = add(leftElbow, scale(side, -elbowOut * 0.5));
  const rightUpperArmOuter = add(lerpPoint(torso.rightShoulder, rightElbow, 0.2), scale(side, -upperArmOut));
  const rightElbowOuter = add(rightElbow, scale(side, -elbowOut));
  const rightWristOuter = add(rightWrist, scale(side, -wristOut));
  const rightHandOuter = add(
    add(rightWrist, scale(side, -wristOut * 0.86 * preset.handScale)),
    scale(down, bodyRef * 0.034 * preset.armLengthScale)
  );
  const rightHandTip = add(
    add(rightWrist, scale(side, -wristOut * 0.54 * preset.handScale)),
    scale(down, bodyRef * 0.052 * preset.armLengthScale)
  );
  const rightHandInner = add(
    add(rightWrist, scale(side, wristOut * 0.42 * preset.handScale)),
    scale(down, bodyRef * 0.046 * preset.armLengthScale)
  );
  const rightWristInner = add(rightWrist, scale(side, wristOut * 0.62));
  const rightElbowInner = add(rightElbow, scale(side, elbowOut * 0.5));
  const leftKnee = pointFor(pose, LM.LEFT_KNEE);
  const rightKnee = pointFor(pose, LM.RIGHT_KNEE);
  const leftAnkle = pointFor(pose, LM.LEFT_ANKLE);
  const rightAnkle = pointFor(pose, LM.RIGHT_ANKLE);
  const leftKneeOuter = add(leftKnee, scale(side, thighOut * preset.kneeTaper));
  const leftKneeInner = add(leftKnee, scale(side, -innerThigh));
  const rightKneeOuter = add(rightKnee, scale(side, -thighOut * preset.kneeTaper));
  const rightKneeInner = add(rightKnee, scale(side, innerThigh));
  const leftAnkleOuter = add(leftAnkle, scale(side, ankleOut));
  const leftAnkleInner = add(leftAnkle, scale(side, -innerAnkle));
  const rightAnkleOuter = add(rightAnkle, scale(side, -ankleOut));
  const rightAnkleInner = add(rightAnkle, scale(side, innerAnkle));
  const leftFootOuter = add(add(leftAnkle, scale(side, ankleOut * 2.45 * preset.footScale)), scale(down, bodyRef * 0.044));
  const leftFootToe = add(add(leftAnkle, scale(side, ankleOut * 1.28 * preset.footScale)), scale(down, bodyRef * 0.066));
  const leftFootInner = add(add(leftAnkle, scale(side, -ankleOut * 0.74 * preset.footScale)), scale(down, bodyRef * 0.054));
  const rightFootOuter = add(add(rightAnkle, scale(side, -ankleOut * 2.45 * preset.footScale)), scale(down, bodyRef * 0.044));
  const rightFootToe = add(add(rightAnkle, scale(side, -ankleOut * 1.28 * preset.footScale)), scale(down, bodyRef * 0.066));
  const rightFootInner = add(add(rightAnkle, scale(side, ankleOut * 0.74 * preset.footScale)), scale(down, bodyRef * 0.054));
  const leftInnerThigh = add(add(hipMid, scale(side, innerThigh)), scale(down, bodyRef * 0.076));
  const rightInnerThigh = add(add(hipMid, scale(side, -innerThigh)), scale(down, bodyRef * 0.076));
  const bridge = add(hipMid, scale(down, bodyRef * 0.078));

  const path =
    `M${p(leftCollar)}` +
    `C${p(add(leftCollar, scale(side, bodyRef * 0.026)))} ${p(add(leftShoulderOuter, scale(down, -bodyRef * 0.034)))} ${p(leftShoulderOuter)}` +
    `C${p(add(leftShoulderOuter, scale(down, bodyRef * 0.034)))} ${p(add(leftUpperArmOuter, scale(down, -bodyRef * 0.026)))} ${p(leftUpperArmOuter)}` +
    `C${p(add(leftUpperArmOuter, scale(down, bodyRef * 0.072)))} ${p(add(leftElbowOuter, scale(down, -bodyRef * 0.07)))} ${p(leftElbowOuter)}` +
    `C${p(add(leftElbowOuter, scale(down, bodyRef * 0.074)))} ${p(add(leftWristOuter, scale(down, -bodyRef * 0.052)))} ${p(leftWristOuter)}` +
    `C${p(add(leftWristOuter, scale(down, bodyRef * 0.024)))} ${p(leftHandOuter)} ${p(leftHandTip)}` +
    `C${p(add(leftHandTip, scale(side, -wristOut * 0.42)))} ${p(leftHandInner)} ${p(leftWristInner)}` +
    `C${p(add(leftWristInner, scale(down, bodyRef * 0.018)))} ${p(add(leftWristInner, scale(down, -bodyRef * 0.034)))} ${p(leftWristInner)}` +
    `C${p(add(leftElbowInner, scale(down, bodyRef * 0.07)))} ${p(add(leftElbowInner, scale(down, -bodyRef * 0.07)))} ${p(leftElbowInner)}` +
    `C${p(add(leftArmpit, scale(down, bodyRef * 0.044)))} ${p(add(leftRib, scale(down, -bodyRef * 0.05)))} ${p(leftRib)}` +
    `C${p(add(leftRib, scale(down, -bodyRef * 0.05)))} ${p(add(leftRib, scale(down, bodyRef * 0.06)))} ${p(leftWaist)}` +
    `C${p(add(leftWaist, scale(down, bodyRef * 0.06)))} ${p(add(leftHip, scale(down, -bodyRef * 0.012)))} ${p(leftHip)}` +
    `C${p(add(leftHip, scale(down, bodyRef * 0.07)))} ${p(add(leftKneeOuter, scale(down, -bodyRef * 0.08)))} ${p(leftKneeOuter)}` +
    `C${p(add(leftKneeOuter, scale(down, bodyRef * 0.08)))} ${p(add(leftAnkleOuter, scale(down, -bodyRef * 0.08)))} ${p(leftAnkleOuter)}` +
    `C${p(add(leftAnkleOuter, scale(down, bodyRef * 0.026)))} ${p(leftFootOuter)} ${p(leftFootToe)}` +
    `C${p(add(leftFootToe, scale(side, -ankleOut * 0.42)))} ${p(leftFootInner)} ${p(leftFootInner)}` +
    `C${p(add(leftAnkleInner, scale(down, bodyRef * 0.018)))} ${p(add(leftAnkleInner, scale(down, -bodyRef * 0.02)))} ${p(leftAnkleInner)}` +
    `C${p(add(leftKneeInner, scale(down, bodyRef * 0.08)))} ${p(add(leftKneeInner, scale(down, -bodyRef * 0.08)))} ${p(leftKneeInner)}` +
    `C${p(add(leftInnerThigh, scale(down, bodyRef * 0.048)))} ${p(add(bridge, scale(side, bodyRef * 0.026)))} ${p(bridge)}` +
    `C${p(add(bridge, scale(side, -bodyRef * 0.026)))} ${p(add(rightInnerThigh, scale(down, bodyRef * 0.048)))} ${p(rightInnerThigh)}` +
    `C${p(add(rightKneeInner, scale(down, -bodyRef * 0.08)))} ${p(add(rightKneeInner, scale(down, bodyRef * 0.08)))} ${p(rightKneeInner)}` +
    `C${p(add(rightAnkleInner, scale(down, -bodyRef * 0.02)))} ${p(add(rightAnkleInner, scale(down, bodyRef * 0.018)))} ${p(rightFootInner)}` +
    `C${p(rightFootInner)} ${p(add(rightFootToe, scale(side, ankleOut * 0.42)))} ${p(rightFootToe)}` +
    `C${p(rightFootOuter)} ${p(add(rightAnkleOuter, scale(down, bodyRef * 0.026)))} ${p(rightAnkleOuter)}` +
    `C${p(add(rightAnkleOuter, scale(down, -bodyRef * 0.08)))} ${p(add(rightKneeOuter, scale(down, bodyRef * 0.08)))} ${p(rightKneeOuter)}` +
    `C${p(add(rightKneeOuter, scale(down, -bodyRef * 0.08)))} ${p(add(rightHip, scale(down, bodyRef * 0.07)))} ${p(rightHip)}` +
    `C${p(add(rightHip, scale(down, -bodyRef * 0.012)))} ${p(add(rightWaist, scale(down, bodyRef * 0.06)))} ${p(rightWaist)}` +
    `C${p(add(rightRib, scale(down, bodyRef * 0.06)))} ${p(add(rightRib, scale(down, -bodyRef * 0.05)))} ${p(rightRib)}` +
    `C${p(add(rightRib, scale(down, -bodyRef * 0.05)))} ${p(add(rightArmpit, scale(down, bodyRef * 0.044)))} ${p(rightElbowInner)}` +
    `C${p(add(rightElbowInner, scale(down, -bodyRef * 0.07)))} ${p(add(rightElbowInner, scale(down, bodyRef * 0.07)))} ${p(rightWristInner)}` +
    `C${p(add(rightWristInner, scale(down, -bodyRef * 0.034)))} ${p(add(rightWristInner, scale(down, bodyRef * 0.018)))} ${p(rightWristInner)}` +
    `C${p(rightHandInner)} ${p(add(rightHandTip, scale(side, wristOut * 0.42)))} ${p(rightHandTip)}` +
    `C${p(rightHandOuter)} ${p(add(rightWristOuter, scale(down, bodyRef * 0.024)))} ${p(rightWristOuter)}` +
    `C${p(add(rightWristOuter, scale(down, -bodyRef * 0.052)))} ${p(add(rightElbowOuter, scale(down, bodyRef * 0.074)))} ${p(rightElbowOuter)}` +
    `C${p(add(rightElbowOuter, scale(down, -bodyRef * 0.07)))} ${p(add(rightUpperArmOuter, scale(down, bodyRef * 0.072)))} ${p(rightUpperArmOuter)}` +
    `C${p(add(rightUpperArmOuter, scale(down, -bodyRef * 0.026)))} ${p(add(rightShoulderOuter, scale(down, bodyRef * 0.034)))} ${p(rightShoulderOuter)}` +
    `C${p(add(rightShoulderOuter, scale(down, -bodyRef * 0.034)))} ${p(add(rightCollar, scale(side, -bodyRef * 0.026)))} ${p(rightCollar)}` +
    `C${p(add(rightCollar, scale(side, bodyRef * 0.018)))} ${p(add(collarSaddle, scale(side, -bodyRef * 0.026)))} ${p(collarSaddle)}` +
    `C${p(add(collarSaddle, scale(side, bodyRef * 0.026)))} ${p(add(leftCollar, scale(side, -bodyRef * 0.018)))} ${p(leftCollar)}Z`;

  addSurface(
    out,
    'balancedBodyEnvelope',
    path,
    'core',
    confidence,
    minConfidence,
    preset.lowerTorsoBlendOpacity
  );
}

function appendBentLimb(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  id: string,
  startLm: LM,
  midLm: LM,
  endLm: LM,
  startWidth: number,
  midWidth: number,
  endWidth: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const startConfidence = landmarkConfidence(pose, startLm);
  const midConfidence = landmarkConfidence(pose, midLm);
  const endConfidence = landmarkConfidence(pose, endLm);
  if (
    startConfidence < softMinConfidence ||
    midConfidence < softMinConfidence ||
    !landmarkFinite(pose, startLm) ||
    !landmarkFinite(pose, midLm)
  ) {
    out.skippedPartCount++;
    return;
  }
  const confidence = Math.min(startConfidence, midConfidence);
  const taper = preset.limbTaper;
  if (endConfidence >= softMinConfidence && landmarkFinite(pose, endLm)) {
    appendBentLimbFromPoints(
      out,
      id,
      pointFor(pose, startLm),
      pointFor(pose, midLm),
      pointFor(pose, endLm),
      axes.bodyRef * startWidth,
      axes.bodyRef * midWidth,
      axes.bodyRef * (midWidth - (midWidth - endWidth) * taper),
      Math.min(confidence, endConfidence),
      preset,
      minConfidence,
      0.9
    );
    return;
  }
  appendStraightLimbFromPoints(
    out,
    id,
    pointFor(pose, startLm),
    pointFor(pose, midLm),
    axes.bodyRef * startWidth,
    axes.bodyRef * (startWidth - (startWidth - midWidth) * taper),
    confidence,
    preset,
    minConfidence,
    0.72
  );
}

function appendBentLimbFromPoints(
  out: SoftDigitalTwinGeometry,
  id: string,
  start: Point,
  joint: Point,
  end: Point,
  startWidth: number,
  jointWidth: number,
  endWidth: number,
  confidence: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  opacity: number
): void {
  const path = organicBentLimbPath(start, joint, end, startWidth, jointWidth, endWidth, preset);
  addSurface(out, id, path, 'limb', confidence, minConfidence, opacity);
}

function appendStraightLimbFromPoints(
  out: SoftDigitalTwinGeometry,
  id: string,
  start: Point,
  end: Point,
  startWidth: number,
  endWidth: number,
  confidence: number,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  opacity: number
): void {
  const path = organicLimbPath(
    start,
    end,
    startWidth,
    endWidth,
    startWidth * 0.18,
    endWidth * 0.5,
    preset
  );
  addSurface(out, id, path, 'limb', confidence, minConfidence, opacity);
}

function organicBentLimbPath(
  start: Point,
  joint: Point,
  end: Point,
  startWidth: number,
  jointWidth: number,
  endWidth: number,
  preset: SoftDigitalTwinVisualQualityPreset
): string {
  const firstAxis = normalize({ x: joint.x - start.x, y: joint.y - start.y });
  const secondAxis = normalize({ x: end.x - joint.x, y: end.y - joint.y });
  const firstNormal = { x: -firstAxis.y, y: firstAxis.x };
  const secondNormal = { x: -secondAxis.y, y: secondAxis.x };
  const jointNormal = normalize({
    x: firstNormal.x + secondNormal.x,
    y: firstNormal.y + secondNormal.y,
  });
  const jointBlend = 0.84 + preset.jointBlendOpacity * 0.25;
  const curve = preset.limbOrganicCurve;
  const startOuter = add(start, scale(firstNormal, startWidth));
  const startInner = add(start, scale(firstNormal, -startWidth * 0.9));
  const jointOuter = add(joint, scale(jointNormal, jointWidth * jointBlend * curve));
  const jointInner = add(joint, scale(jointNormal, -jointWidth * jointBlend * 0.92));
  const endOuter = add(end, scale(secondNormal, endWidth * 0.95));
  const endInner = add(end, scale(secondNormal, -endWidth));
  const firstLen = distance(start, joint);
  const secondLen = distance(joint, end);
  return (
    `M${p(startOuter)}` +
    `C${p(add(startOuter, scale(firstAxis, firstLen * 0.34)))} ${p(add(jointOuter, scale(firstAxis, -firstLen * 0.24)))} ${p(jointOuter)}` +
    `C${p(add(jointOuter, scale(secondAxis, secondLen * 0.24)))} ${p(add(endOuter, scale(secondAxis, -secondLen * 0.34)))} ${p(endOuter)}` +
    `Q${p(add(end, scale(secondAxis, endWidth * 0.42)))} ${p(endInner)}` +
    `C${p(add(endInner, scale(secondAxis, -secondLen * 0.34)))} ${p(add(jointInner, scale(secondAxis, secondLen * 0.22)))} ${p(jointInner)}` +
    `C${p(add(jointInner, scale(firstAxis, -firstLen * 0.22)))} ${p(add(startInner, scale(firstAxis, firstLen * 0.34)))} ${p(startInner)}` +
    `Q${p(add(start, scale(firstAxis, -startWidth * 0.36)))} ${p(startOuter)}Z`
    );
}

function appendHands(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  appendHand(pose, out, axes, 'leftHand', LM.LEFT_WRIST, LM.LEFT_INDEX, LM.LEFT_PINKY, preset, minConfidence, softMinConfidence);
  appendHand(pose, out, axes, 'rightHand', LM.RIGHT_WRIST, LM.RIGHT_INDEX, LM.RIGHT_PINKY, preset, minConfidence, softMinConfidence);
}

function appendHand(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  id: string,
  wristLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const wristConfidence = landmarkConfidence(pose, wristLm);
  if (wristConfidence < softMinConfidence || !landmarkFinite(pose, wristLm)) {
    out.skippedPartCount++;
    return;
  }
  const wrist = pointFor(pose, wristLm);
  let palm = add(wrist, scale(axes.down, axes.bodyRef * 0.045));
  let confidence = wristConfidence * 0.72;
  if (
    landmarkConfidence(pose, indexLm) >= softMinConfidence &&
    landmarkConfidence(pose, pinkyLm) >= softMinConfidence &&
    landmarkFinite(pose, indexLm) &&
    landmarkFinite(pose, pinkyLm)
  ) {
    palm = lerpPoint(pointFor(pose, indexLm), pointFor(pose, pinkyLm), 0.5);
    confidence = Math.min(wristConfidence, landmarkConfidence(pose, indexLm), landmarkConfidence(pose, pinkyLm));
  }
  const axis = normalize({ x: palm.x - wrist.x, y: palm.y - wrist.y });
  const path = roundedEllipsePath(
    lerpPoint(wrist, palm, 0.42 / preset.handAttachment),
    axes.bodyRef * 0.019 * preset.distalMass * preset.handScale,
    axes.bodyRef * 0.037 * preset.distalMass * preset.handScale,
    axis
  );
  addSurface(out, id, path, 'distal', confidence, minConfidence, 0.7);
}

function appendFeet(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  appendFoot(pose, out, axes, 'leftFoot', LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX, preset, minConfidence, softMinConfidence);
  appendFoot(pose, out, axes, 'rightFoot', LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX, preset, minConfidence, softMinConfidence);
}

function appendFoot(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  axes: BodyAxes,
  id: string,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  const ankleConfidence = landmarkConfidence(pose, ankleLm);
  if (ankleConfidence < softMinConfidence || !landmarkFinite(pose, ankleLm)) {
    out.skippedPartCount++;
    return;
  }
  const ankle = pointFor(pose, ankleLm);
  let heel = add(ankle, scale(axes.down, axes.bodyRef * 0.028));
  let toe = add(add(ankle, scale(axes.down, axes.bodyRef * 0.058)), scale(axes.side, axes.bodyRef * 0.018));
  let confidence = ankleConfidence * 0.68;
  if (
    landmarkConfidence(pose, heelLm) >= softMinConfidence &&
    landmarkConfidence(pose, toeLm) >= softMinConfidence &&
    landmarkFinite(pose, heelLm) &&
    landmarkFinite(pose, toeLm)
  ) {
    heel = pointFor(pose, heelLm);
    toe = pointFor(pose, toeLm);
    confidence = Math.min(ankleConfidence, landmarkConfidence(pose, heelLm), landmarkConfidence(pose, toeLm));
  }
  const footMid = lerpPoint(heel, toe, 0.58 / preset.footAttachment);
  const axis = normalize({ x: toe.x - heel.x, y: toe.y - heel.y });
  const path = roundedEllipsePath(
    footMid,
    axes.bodyRef * 0.021 * preset.distalMass * preset.footScale,
    axes.bodyRef * 0.044 * preset.distalMass * preset.footScale,
    axis
  );
  addSurface(out, id, path, 'distal', confidence, minConfidence, 0.76);
}

function appendSelfShadows(
  pose: ScreenPoseLandmarks,
  out: SoftDigitalTwinGeometry,
  torso: TorsoEstimate,
  head: HeadEstimate | null,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset,
  minConfidence: number,
  softMinConfidence: number
): void {
  let path = '';
  const { side, down, shoulderMid, bodyRef } = axes;
  let confidence = torso.confidence;
  const neckShadowCenter = add(shoulderMid, scale(down, -bodyRef * 0.064));
  path += roundedEllipsePath(neckShadowCenter, bodyRef * 0.036, bodyRef * 0.01, side);
  if (head !== null) confidence = Math.min(confidence, head.confidence);
  for (const [shoulderLm, hipLm, multiplier] of [
    [LM.LEFT_SHOULDER, LM.LEFT_HIP, 1] as const,
    [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, -1] as const,
  ]) {
    const shadowConfidence = Math.min(
      landmarkConfidence(pose, shoulderLm),
      landmarkConfidence(pose, hipLm)
    );
    if (shadowConfidence < softMinConfidence || !landmarkFinite(pose, shoulderLm) || !landmarkFinite(pose, hipLm)) {
      continue;
    }
    const shoulder = pointFor(pose, shoulderLm);
    const hip = pointFor(pose, hipLm);
    const armpit = add(lerpPoint(shoulder, hip, 0.2), scale(side, bodyRef * 0.038 * multiplier));
    const waist = add(lerpPoint(shoulder, hip, 0.56), scale(side, bodyRef * 0.018 * multiplier));
    path += taperedCapsulePath(armpit, waist, bodyRef * 0.012, bodyRef * 0.006, 0, 0);
    confidence = Math.min(confidence, shadowConfidence);
  }
  if (path === '') {
    out.skippedPartCount++;
    return;
  }
  addSurface(
    out,
    'softOcclusion',
    path,
    'shadow',
    confidence,
    minConfidence,
    preset.selfShadowOpacity * preset.overlapShadowOpacity
  );
}

function createBodyAxes(pose: ScreenPoseLandmarks, torso: TorsoEstimate): BodyAxes {
  const shoulderMid = midpoint(torso.leftShoulder, torso.rightShoulder);
  const hipMid = midpoint(torso.leftHip, torso.rightHip);
  const shoulderWidth = distance(torso.leftShoulder, torso.rightShoulder);
  const hipWidth = distance(torso.leftHip, torso.rightHip);
  const torsoLength = distance(shoulderMid, hipMid);
  const leftLeg = reliableLegLength(pose, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE);
  const rightLeg = reliableLegLength(pose, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE);
  const legLength = Math.max(leftLeg, rightLeg, torsoLength * 1.18);
  const down = normalize({ x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y });
  const shoulderSide = normalize({
    x: torso.leftShoulder.x - torso.rightShoulder.x,
    y: torso.leftShoulder.y - torso.rightShoulder.y,
  });
  const side = Math.hypot(shoulderSide.x, shoulderSide.y) > 0.01
    ? shoulderSide
    : { x: down.y, y: -down.x };
  const bodyRef = Math.max(MIN_BODY_REF, torsoLength, legLength, shoulderWidth * 2.1);
  return {
    side,
    down,
    shoulderMid,
    hipMid,
    shoulderWidth,
    hipWidth,
    torsoLength,
    legLength,
    bodyRef,
  };
}

function reliableLegLength(pose: ScreenPoseLandmarks, hipLm: LM, kneeLm: LM, ankleLm: LM): number {
  if (!landmarkFinite(pose, hipLm) || !landmarkFinite(pose, kneeLm) || !landmarkFinite(pose, ankleLm)) {
    return 0;
  }
  return distance(pointFor(pose, hipLm), pointFor(pose, kneeLm)) +
    distance(pointFor(pose, kneeLm), pointFor(pose, ankleLm));
}

function taperedCapsulePath(
  start: Point,
  end: Point,
  startWidth: number,
  endWidth: number,
  startOverlap: number,
  endOverlap: number
): string {
  const axis = normalize({ x: end.x - start.x, y: end.y - start.y });
  const a = add(start, scale(axis, -startOverlap));
  const b = add(end, scale(axis, endOverlap));
  const normal = { x: -axis.y, y: axis.x };
  const aLeft = add(a, scale(normal, startWidth));
  const aRight = add(a, scale(normal, -startWidth));
  const bLeft = add(b, scale(normal, endWidth));
  const bRight = add(b, scale(normal, -endWidth));
  const c1Left = lerpPoint(aLeft, bLeft, 0.34);
  const c2Left = lerpPoint(aLeft, bLeft, 0.68);
  const c1Right = lerpPoint(bRight, aRight, 0.32);
  const c2Right = lerpPoint(bRight, aRight, 0.66);
  return (
    `M${p(aLeft)}` +
    `C${p(c1Left)} ${p(c2Left)} ${p(bLeft)}` +
    `Q${p(add(b, scale(axis, endWidth * 0.45)))} ${p(bRight)}` +
    `C${p(c1Right)} ${p(c2Right)} ${p(aRight)}` +
    `Q${p(add(a, scale(axis, -startWidth * 0.45)))} ${p(aLeft)}Z`
  );
}

function organicLimbPath(
  start: Point,
  end: Point,
  startWidth: number,
  endWidth: number,
  startOverlap: number,
  endOverlap: number,
  preset: SoftDigitalTwinVisualQualityPreset
): string {
  const axis = normalize({ x: end.x - start.x, y: end.y - start.y });
  const a = add(start, scale(axis, -startOverlap));
  const b = add(end, scale(axis, endOverlap));
  const normal = { x: -axis.y, y: axis.x };
  const midLeft = lerpPoint(a, b, 0.43);
  const midRight = lerpPoint(a, b, 0.57);
  const fullness = Math.max(startWidth, endWidth) * 0.16 * preset.limbOrganicCurve;
  const aLeft = add(a, scale(normal, startWidth));
  const aRight = add(a, scale(normal, -startWidth * 0.92));
  const bLeft = add(b, scale(normal, endWidth * 0.94));
  const bRight = add(b, scale(normal, -endWidth));
  const leftBelly = add(midLeft, scale(normal, lerp(startWidth, endWidth, 0.43) + fullness));
  const rightBelly = add(midRight, scale(normal, -(lerp(startWidth, endWidth, 0.57) + fullness * 0.34)));
  return (
    `M${p(aLeft)}` +
    `C${p(add(aLeft, scale(axis, distance(a, b) * 0.16)))} ${p(leftBelly)} ${p(bLeft)}` +
    `Q${p(add(b, scale(axis, endWidth * 0.36)))} ${p(bRight)}` +
    `C${p(rightBelly)} ${p(add(aRight, scale(axis, distance(a, b) * 0.18)))} ${p(aRight)}` +
    `Q${p(add(a, scale(axis, -startWidth * 0.34)))} ${p(aLeft)}Z`
  );
}

function eggHeadPath(
  head: HeadEstimate,
  axes: BodyAxes,
  preset: SoftDigitalTwinVisualQualityPreset
): string {
  const { side, down } = axes;
  const headScale = preset.headScale;
  const rx = head.rx * 0.84 * headScale;
  const ry = head.ry * 0.9 * headScale;
  const center = add(head.center, scale(down, head.ry * (0.018 + preset.headYOffset)));
  const top = add(center, scale(down, -ry * 1.03));
  const leftTemple = add(add(center, scale(side, rx * 0.94)), scale(down, -ry * 0.24));
  const rightTemple = add(add(center, scale(side, -rx * 0.94)), scale(down, -ry * 0.24));
  const leftJaw = add(add(center, scale(side, rx * 0.62)), scale(down, ry * 0.5));
  const rightJaw = add(add(center, scale(side, -rx * 0.62)), scale(down, ry * 0.5));
  const chin = add(center, scale(down, ry * 0.84));
  return (
    `M${p(top)}` +
    `C${p(add(top, scale(side, rx * 0.58)))} ${p(add(leftTemple, scale(down, -ry * 0.16)))} ${p(leftTemple)}` +
    `C${p(add(leftTemple, scale(down, ry * 0.32)))} ${p(add(leftJaw, scale(side, rx * 0.07)))} ${p(leftJaw)}` +
    `C${p(add(leftJaw, scale(down, ry * 0.24)))} ${p(add(chin, scale(side, rx * 0.22)))} ${p(chin)}` +
    `C${p(add(chin, scale(side, -rx * 0.22)))} ${p(add(rightJaw, scale(down, ry * 0.24)))} ${p(rightJaw)}` +
    `C${p(add(rightJaw, scale(side, -rx * 0.07)))} ${p(add(rightTemple, scale(down, ry * 0.32)))} ${p(rightTemple)}` +
    `C${p(add(rightTemple, scale(down, -ry * 0.16)))} ${p(add(top, scale(side, -rx * 0.58)))} ${p(top)}Z`
  );
}

function roundedEllipsePath(center: Point, rx: number, ry: number, axis: Point): string {
  const long = normalize(axis);
  const short = { x: -long.y, y: long.x };
  const a = add(center, scale(long, -ry));
  const b = add(center, scale(short, rx));
  const c = add(center, scale(long, ry));
  const d = add(center, scale(short, -rx));
  const k = 0.5523;
  return (
    `M${p(a)}` +
    `C${p(add(a, scale(short, rx * k)))} ${p(add(b, scale(long, -ry * k)))} ${p(b)}` +
    `C${p(add(b, scale(long, ry * k)))} ${p(add(c, scale(short, rx * k)))} ${p(c)}` +
    `C${p(add(c, scale(short, -rx * k)))} ${p(add(d, scale(long, ry * k)))} ${p(d)}` +
    `C${p(add(d, scale(long, -ry * k)))} ${p(add(a, scale(short, -rx * k)))} ${p(a)}Z`
  );
}

function circlePath(center: Point, radius: number): string {
  return roundedEllipsePath(center, radius, radius, { x: 0, y: 1 });
}

function addSurface(
  out: SoftDigitalTwinGeometry,
  id: string,
  path: string,
  fillKey: SoftDigitalTwinFillKey,
  confidence: number,
  minConfidence: number,
  opacityMultiplier = 1
): void {
  if (path === '') return;
  out.surfaces.push({
    id,
    path,
    fillKey,
    opacity: confidenceOpacity(confidence, minConfidence) * opacityMultiplier,
    confidence,
  });
}

function addConstructionPoint(
  out: SoftDigitalTwinGeometry,
  id: string,
  label: string,
  point: Point
): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
  out.constructionPoints.push({
    id,
    label,
    x: point.x,
    y: point.y,
  });
}

function addConstructionLine(
  out: SoftDigitalTwinGeometry,
  id: string,
  from: Point,
  to: Point
): void {
  if (
    !Number.isFinite(from.x) ||
    !Number.isFinite(from.y) ||
    !Number.isFinite(to.x) ||
    !Number.isFinite(to.y)
  ) {
    return;
  }
  out.constructionLines.push({
    id,
    fromX: from.x,
    fromY: from.y,
    toX: to.x,
    toY: to.y,
  });
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

function pointForOrFallback(pose: ScreenPoseLandmarks, lm: LM, fallback: Point): Point {
  return landmarkFinite(pose, lm) ? pointFor(pose, lm) : fallback;
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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
  const low = Math.max(0.08, minConfidence * 0.42);
  if (confidence >= minConfidence) return 1;
  return clamp(0.22 + ((confidence - low) / Math.max(0.01, minConfidence - low)) * 0.58, 0.18, 0.8);
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
