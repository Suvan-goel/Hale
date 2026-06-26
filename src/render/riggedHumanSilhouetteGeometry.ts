import { LM } from '../pose/types';
import {
  getHeadEstimate,
  getTorsoEstimate,
  type Point,
} from './bodyVolumeGeometry';
import type { ScreenPoseLandmarks } from './poseCoordinateMapper';
import {
  RIGGED_HUMAN_SILHOUETTE_CALIBRATION_SAMPLE_TARGET,
  RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID,
  RIGGED_HUMAN_SILHOUETTE_COLORS,
  RIGGED_HUMAN_SILHOUETTE_DYNAMIC_PATH_CAP,
  RIGGED_HUMAN_SILHOUETTE_HIGHLIGHT_GRADIENT_ID,
  RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT,
  RIGGED_HUMAN_SILHOUETTE_REAR_GRADIENT_ID,
  RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP,
  RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT,
} from './riggedHumanSilhouetteConfig';

export type RiggedHumanSilhouetteSurfaceId =
  | 'rightArm'
  | 'rightLeg'
  | 'centralShell'
  | 'leftLeg'
  | 'leftArm'
  | 'torsoHighlight'
  | 'sideShade'
  | 'pelvisBridge';

export type RiggedHumanSilhouetteCalibrationState = 'neutral' | 'collecting' | 'locked';

export type RiggedHumanSilhouetteOrientationProfile = 'front' | 'three-quarter' | 'side';

export interface RiggedHumanSilhouetteSurface {
  id: RiggedHumanSilhouetteSurfaceId;
  path: string;
  fill: string;
  opacity: number;
  confidence: number;
  visible: boolean;
  bounds: Bounds;
}

export interface RiggedHumanSilhouetteProportions {
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

export interface RiggedHumanSilhouetteContinuity {
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

export interface RiggedHumanSilhouetteGeometry {
  hasPose: boolean;
  opacity: number;
  surfacePathCount: number;
  maxSurfacePathCount: number;
  dynamicPathCount: number;
  maxDynamicPathCount: number;
  internalControlVertexCount: number;
  maxInternalControlVertexCount: number;
  virtualBoneCount: number;
  maxVirtualBoneCount: number;
  orientationFactor: number;
  orientationProfile: RiggedHumanSilhouetteOrientationProfile;
  proportionCalibrationComplete: boolean;
  calibrationState: RiggedHumanSilhouetteCalibrationState;
  proportions: RiggedHumanSilhouetteProportions;
  bounds: Bounds;
  drawOrderKey: 'deterministic-natural-human-blend';
  continuity: RiggedHumanSilhouetteContinuity;
  internalControlPoints: Point[];
  surfaces: RiggedHumanSilhouetteSurface[];
}

export interface RiggedHumanSilhouetteGeometryOptions {
  minConfidence?: number;
  calibration?: RiggedHumanSilhouetteCalibration;
  orientationState?: RiggedHumanSilhouetteOrientationState;
}

export interface RiggedHumanSilhouetteCalibration {
  samples: ProportionSample[];
  locked: boolean;
  proportions: RiggedHumanSilhouetteProportions;
}

export interface RiggedHumanSilhouetteOrientationState {
  initialized: boolean;
  factor: number;
  profile: RiggedHumanSilhouetteOrientationProfile;
}

export interface RiggedHumanSilhouetteBoneTransform {
  id: RiggedHumanSilhouetteVirtualBoneId;
  origin: Point;
  translation: Point;
  rotationRad: number;
  scale: number;
}

export interface RiggedHumanSilhouetteSkinInfluence {
  boneIndex: number;
  weight: number;
}

export type RiggedHumanSilhouetteVirtualBoneId =
  | 'pelvisRoot'
  | 'lowerSpine'
  | 'upperSpine'
  | 'neck'
  | 'head'
  | 'leftClavicle'
  | 'rightClavicle'
  | 'leftUpperArm'
  | 'leftForearm'
  | 'rightUpperArm'
  | 'rightForearm'
  | 'leftThigh'
  | 'leftLowerLeg'
  | 'leftFoot'
  | 'rightThigh'
  | 'rightLowerLeg'
  | 'rightFoot';

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
  surface: RiggedHumanSilhouetteSurfaceId;
  confidence: number;
  visible: boolean;
  continuous: boolean;
  jointContinuous: boolean;
  path: string;
  bounds: Bounds;
  fill: string;
  opacity: number;
}

interface RiggedHumanSilhouetteOrientation {
  factor: number;
  profile: RiggedHumanSilhouetteOrientationProfile;
  widthCompression: number;
}

const DEFAULT_MIN_CONFIDENCE = 0.35;
const MIN_RENDER_CONFIDENCE = 0.12;
const EMPTY_BOUNDS: Bounds = {
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
};

const SURFACE_IDS: readonly RiggedHumanSilhouetteSurfaceId[] = [
  'rightArm',
  'leftArm',
  'centralShell',
  'rightLeg',
  'leftLeg',
  'pelvisBridge',
  'torsoHighlight',
  'sideShade',
];

const DEFAULT_PROPORTIONS: RiggedHumanSilhouetteProportions = {
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

export const RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONES: readonly RiggedHumanSilhouetteVirtualBoneId[] =
  [
    'pelvisRoot',
    'lowerSpine',
    'upperSpine',
    'neck',
    'head',
    'leftClavicle',
    'rightClavicle',
    'leftUpperArm',
    'leftForearm',
    'rightUpperArm',
    'rightForearm',
    'leftThigh',
    'leftLowerLeg',
    'leftFoot',
    'rightThigh',
    'rightLowerLeg',
    'rightFoot',
  ];

interface RestRing {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const REST_RINGS_FRONT: readonly RestRing[] = [
  { cx: 0, cy: -0.98, rx: 0.12, ry: 0.1 },
  { cx: 0, cy: -0.82, rx: 0.16, ry: 0.12 },
  { cx: 0, cy: -0.63, rx: 0.1, ry: 0.08 },
  { cx: 0, cy: -0.43, rx: 0.31, ry: 0.1 },
  { cx: 0, cy: -0.2, rx: 0.24, ry: 0.1 },
  { cx: 0, cy: 0.02, rx: 0.2, ry: 0.09 },
  { cx: 0, cy: 0.24, rx: 0.24, ry: 0.09 },
  { cx: -0.17, cy: 0.47, rx: 0.13, ry: 0.09 },
  { cx: 0.17, cy: 0.47, rx: 0.13, ry: 0.09 },
  { cx: -0.17, cy: 0.78, rx: 0.1, ry: 0.12 },
  { cx: 0.17, cy: 0.78, rx: 0.1, ry: 0.12 },
  { cx: -0.17, cy: 1.08, rx: 0.08, ry: 0.1 },
  { cx: 0.17, cy: 1.08, rx: 0.08, ry: 0.1 },
  { cx: 0, cy: 1.26, rx: 0.25, ry: 0.06 },
];

const REST_RINGS_SIDE: readonly RestRing[] = REST_RINGS_FRONT.map((ring) => ({
  cx: ring.cx * 0.32,
  cy: ring.cy,
  rx: Math.max(0.045, ring.rx * 0.42),
  ry: ring.ry,
}));

export const RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS: readonly Point[] =
  createRestTemplatePoints(REST_RINGS_FRONT);
export const RIGGED_HUMAN_SILHOUETTE_SIDE_TEMPLATE_POINTS: readonly Point[] =
  createRestTemplatePoints(REST_RINGS_SIDE);
export const RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES: readonly (readonly RiggedHumanSilhouetteSkinInfluence[])[] =
  createRestTemplateInfluences(RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS);

if (RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONES.length !== RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT) {
  throw new Error('Rigged human silhouette virtual bone count mismatch');
}
if (
  RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS.length !==
    RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT ||
  RIGGED_HUMAN_SILHOUETTE_SIDE_TEMPLATE_POINTS.length !==
    RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT
) {
  throw new Error('Rigged human silhouette rest template topology mismatch');
}

export function createRiggedHumanSilhouetteCalibration(): RiggedHumanSilhouetteCalibration {
  return {
    samples: [],
    locked: false,
    proportions: { ...DEFAULT_PROPORTIONS },
  };
}

export function resetRiggedHumanSilhouetteCalibration(
  calibration: RiggedHumanSilhouetteCalibration
): void {
  calibration.samples.length = 0;
  calibration.locked = false;
  calibration.proportions = { ...DEFAULT_PROPORTIONS };
}

export function createRiggedHumanSilhouetteOrientationState(): RiggedHumanSilhouetteOrientationState {
  return {
    initialized: false,
    factor: 0,
    profile: 'front',
  };
}

export function resetRiggedHumanSilhouetteOrientationState(
  state: RiggedHumanSilhouetteOrientationState
): void {
  state.initialized = false;
  state.factor = 0;
  state.profile = 'front';
}

export function skinRiggedHumanSilhouettePoint(
  restPoint: Point,
  influences: readonly RiggedHumanSilhouetteSkinInfluence[],
  boneTransforms: readonly RiggedHumanSilhouetteBoneTransform[]
): Point {
  if (influences.length === 0) return { ...restPoint };
  let totalWeight = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < influences.length; i++) {
    const influence = influences[i];
    const bone = boneTransforms[influence.boneIndex];
    if (!bone || influence.weight <= 0) continue;
    const transformed = applyBoneTransform(restPoint, bone);
    totalWeight += influence.weight;
    x += transformed.x * influence.weight;
    y += transformed.y * influence.weight;
  }
  if (totalWeight <= 0) return { ...restPoint };
  return { x: x / totalWeight, y: y / totalWeight };
}

export function createRiggedHumanSilhouetteGeometry(): RiggedHumanSilhouetteGeometry {
  return {
    hasPose: false,
    opacity: 1,
    surfacePathCount: 0,
    maxSurfacePathCount: RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP,
    dynamicPathCount: 0,
    maxDynamicPathCount: RIGGED_HUMAN_SILHOUETTE_DYNAMIC_PATH_CAP,
    internalControlVertexCount: 0,
    maxInternalControlVertexCount: RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT,
    virtualBoneCount: RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT,
    maxVirtualBoneCount: RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT,
    orientationFactor: 0,
    orientationProfile: 'front',
    proportionCalibrationComplete: false,
    calibrationState: 'neutral',
    proportions: { ...DEFAULT_PROPORTIONS },
    bounds: emptyBounds(),
    drawOrderKey: 'deterministic-natural-human-blend',
    continuity: emptyContinuity(),
    internalControlPoints: createControlPointBuffer(),
    surfaces: SURFACE_IDS.map((id) => ({
      id,
      path: '',
      fill: RIGGED_HUMAN_SILHOUETTE_COLORS.primaryGraphite,
      opacity: 0,
      confidence: 0,
      visible: false,
      bounds: emptyBounds(),
    })),
  };
}

export function emptyRiggedHumanSilhouetteGeometry(
  out: RiggedHumanSilhouetteGeometry
): void {
  out.hasPose = false;
  out.opacity = 1;
  out.surfacePathCount = 0;
  out.dynamicPathCount = 0;
  out.internalControlVertexCount = 0;
  out.virtualBoneCount = RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT;
  out.orientationFactor = 0;
  out.orientationProfile = 'front';
  out.proportionCalibrationComplete = false;
  out.calibrationState = 'neutral';
  out.proportions = { ...DEFAULT_PROPORTIONS };
  out.bounds = emptyBounds();
  out.continuity = emptyContinuity();
  clearControlPoints(out.internalControlPoints);
  for (let i = 0; i < out.surfaces.length; i++) {
    const surface = out.surfaces[i];
    surface.path = '';
    surface.fill = RIGGED_HUMAN_SILHOUETTE_COLORS.primaryGraphite;
    surface.opacity = 0;
    surface.confidence = 0;
    surface.visible = false;
    surface.bounds = emptyBounds();
  }
}

export function buildRiggedHumanSilhouetteGeometry(
  pose: ScreenPoseLandmarks,
  out: RiggedHumanSilhouetteGeometry,
  options: RiggedHumanSilhouetteGeometryOptions = {}
): void {
  emptyRiggedHumanSilhouetteGeometry(out);
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
        : 'neutral';
  } else {
    out.proportions = currentSample ?? { ...DEFAULT_PROPORTIONS };
    out.calibrationState = currentSample ? 'collecting' : 'neutral';
  }

  const centralConfidence = centralConfidenceForPose(pose);
  out.opacity = centralConfidence >= minConfidence ? 1 : 0.7;
  out.internalControlVertexCount = RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT;
  out.virtualBoneCount = RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT;
  const orientation = resolveOrientation(pose, out.proportions, options.orientationState);
  out.orientationFactor = orientation.factor;
  out.orientationProfile = orientation.profile;

  const central = buildCentralShell(pose, out.proportions, minConfidence, orientation);
  updateSkinnedControlPoints(out.internalControlPoints, central, orientation);
  setSurface(
    out,
    'centralShell',
    central.path,
    central.fill,
    central.opacity,
    central.confidence,
    central.bounds
  );
  out.continuity.centralShellContinuous = central.visible;
  out.continuity.headAttached = central.headAttached;

  if (central.fullBodyEnvelope) {
    out.continuity.leftArmContinuous = true;
    out.continuity.rightArmContinuous = true;
    out.continuity.leftLegContinuous = true;
    out.continuity.rightLegContinuous = true;
    out.continuity.leftArmHasElbow = true;
    out.continuity.rightArmHasElbow = true;
    out.continuity.leftLegHasKnee = true;
    out.continuity.rightLegHasKnee = true;
  } else {
    const rightArm = buildArmSurface(pose, 'rightArm', out.proportions, minConfidence, orientation);
    const leftArm = buildArmSurface(pose, 'leftArm', out.proportions, minConfidence, orientation);
    const rightLeg = buildLegSurface(pose, 'rightLeg', out.proportions, minConfidence, orientation);
    const leftLeg = buildLegSurface(pose, 'leftLeg', out.proportions, minConfidence, orientation);

    applyLimb(out, rightArm);
    applyLimb(out, leftArm);
    applyLimb(out, rightLeg);
    applyLimb(out, leftLeg);
  }

  const overlays = buildTonalOverlays(pose, out.proportions, central, orientation);
  setSurface(
    out,
    'torsoHighlight',
    overlays.highlightPath,
    `url(#${RIGGED_HUMAN_SILHOUETTE_HIGHLIGHT_GRADIENT_ID})`,
    overlays.highlightPath ? 0.16 : 0,
    central.confidence,
    overlays.highlightBounds
  );
  setSurface(
    out,
    'sideShade',
    overlays.shadePath,
    RIGGED_HUMAN_SILHOUETTE_COLORS.deepGraphite,
    overlays.shadePath ? 0.04 : 0,
    central.confidence,
    overlays.shadeBounds
  );
  setSurface(
    out,
    'pelvisBridge',
    overlays.accentPath,
    `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`,
    overlays.accentPath ? 1 : 0,
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

export function getRiggedHumanSilhouetteSurface(
  geometry: RiggedHumanSilhouetteGeometry,
  id: RiggedHumanSilhouetteSurfaceId
): RiggedHumanSilhouetteSurface {
  const surface = geometry.surfaces.find((candidate) => candidate.id === id);
  if (!surface) throw new Error(`Unknown rigged human silhouette surface: ${id}`);
  return surface;
}

export function isFiniteRiggedHumanSilhouetteGeometry(
  geometry: RiggedHumanSilhouetteGeometry
): boolean {
  if (
    !Number.isFinite(geometry.opacity) ||
    !Number.isFinite(geometry.surfacePathCount) ||
    !Number.isFinite(geometry.dynamicPathCount) ||
    !Number.isFinite(geometry.internalControlVertexCount) ||
    !Number.isFinite(geometry.virtualBoneCount) ||
    !Number.isFinite(geometry.orientationFactor)
  ) {
    return false;
  }
  if (
    geometry.internalControlPoints.length !==
    RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT
  ) {
    return false;
  }
  for (let i = 0; i < geometry.internalControlPoints.length; i++) {
    if (!pointFinite(geometry.internalControlPoints[i])) return false;
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

function resolveOrientation(
  pose: ScreenPoseLandmarks,
  proportions: RiggedHumanSilhouetteProportions,
  state?: RiggedHumanSilhouetteOrientationState
): RiggedHumanSilhouetteOrientation {
  const target = estimateOrientationFactor(pose, proportions);
  let factor = target;
  if (state) {
    if (!state.initialized) {
      state.initialized = true;
      state.factor = target;
    } else {
      const delta = target - state.factor;
      if (Math.abs(delta) >= 0.06) {
        state.factor = clamp(state.factor + delta * 0.35, 0, 1);
      }
    }
    factor = state.factor;
    state.profile = profileForOrientationFactor(factor);
  }
  const profile = state?.profile ?? profileForOrientationFactor(factor);
  return {
    factor,
    profile,
    widthCompression: blend(1, 0.44, factor),
  };
}

function estimateOrientationFactor(
  pose: ScreenPoseLandmarks,
  proportions: RiggedHumanSilhouetteProportions
): number {
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
    return 0;
  }
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const torsoLength = Math.max(1, distance(shoulderMid, hipMid));
  const shoulderRatio = distance(leftShoulder, rightShoulder) / torsoLength;
  const hipRatio = distance(leftHip, rightHip) / torsoLength;
  const calibratedShoulderRatio = clamp(
    proportions.shoulderWidth / Math.max(proportions.torsoLength, 1),
    0.34,
    0.72
  );
  const calibratedHipRatio = clamp(
    proportions.hipWidth / Math.max(proportions.torsoLength, 1),
    0.22,
    0.56
  );
  const shoulderNarrowing = 1 - shoulderRatio / calibratedShoulderRatio;
  const hipNarrowing = 1 - hipRatio / calibratedHipRatio;
  return clamp((shoulderNarrowing * 0.72 + hipNarrowing * 0.28) / 0.58, 0, 1);
}

function profileForOrientationFactor(
  factor: number
): RiggedHumanSilhouetteOrientationProfile {
  if (factor >= 0.68) return 'side';
  if (factor >= 0.28) return 'three-quarter';
  return 'front';
}

function updateSkinnedControlPoints(
  out: Point[],
  central: ReturnType<typeof buildCentralShell>,
  orientation: RiggedHumanSilhouetteOrientation
): void {
  if (!central.visible) {
    clearControlPoints(out);
    return;
  }
  const transforms = createInternalBoneTransforms(orientation);
  for (let i = 0; i < out.length; i++) {
    const front = RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS[i];
    const side = RIGGED_HUMAN_SILHOUETTE_SIDE_TEMPLATE_POINTS[i];
    const rest = {
      x: blend(front.x, side.x, orientation.factor),
      y: blend(front.y, side.y, orientation.factor),
    };
    const skinned = skinRiggedHumanSilhouettePoint(
      rest,
      RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES[i],
      transforms
    );
    const screen = templatePointToScreen(skinned, central);
    out[i].x = screen.x;
    out[i].y = screen.y;
  }
}

function createInternalBoneTransforms(
  orientation: RiggedHumanSilhouetteOrientation
): RiggedHumanSilhouetteBoneTransform[] {
  return RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONES.map((id) => ({
    id,
    origin: restBoneOrigin(id),
    translation: restBoneTranslation(id, orientation),
    rotationRad: restBoneRotation(id, orientation),
    scale: restBoneScale(id, orientation),
  }));
}

function templatePointToScreen(
  point: Point,
  central: ReturnType<typeof buildCentralShell>
): Point {
  const { shoulderMid, axis, sideAxis, torsoLength, shoulderHalf } = central.anchors;
  const t = (point.y + 0.43) / 0.67;
  const sideScale = shoulderHalf * 1.58;
  return add(add(shoulderMid, scale(axis, torsoLength * t)), scale(sideAxis, point.x * sideScale));
}

function createRestTemplatePoints(rings: readonly RestRing[]): Point[] {
  const points: Point[] = [];
  for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
    const ring = rings[ringIndex];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      points.push({
        x: ring.cx + Math.cos(angle) * ring.rx,
        y: ring.cy + Math.sin(angle) * ring.ry,
      });
    }
  }
  return points;
}

function createRestTemplateInfluences(
  points: readonly Point[]
): (readonly RiggedHumanSilhouetteSkinInfluence[])[] {
  return points.map((point) => {
    const primary = boneIndexForRestPoint(point);
    const secondary = secondaryBoneIndexForRestPoint(point, primary);
    if (secondary === primary) return [{ boneIndex: primary, weight: 1 }];
    return [
      { boneIndex: primary, weight: 0.78 },
      { boneIndex: secondary, weight: 0.22 },
    ];
  });
}

function boneIndexForRestPoint(point: Point): number {
  if (point.y < -0.88) return boneIndex('head');
  if (point.y < -0.68) return boneIndex('neck');
  if (point.y < -0.28) {
    if (point.x < -0.22) return boneIndex('leftClavicle');
    if (point.x > 0.22) return boneIndex('rightClavicle');
    return boneIndex('upperSpine');
  }
  if (point.y < 0.18) return boneIndex('lowerSpine');
  if (point.y < 0.36) return boneIndex('pelvisRoot');
  if (point.x < 0) {
    if (point.y < 0.74) return boneIndex('leftThigh');
    if (point.y < 1.08) return boneIndex('leftLowerLeg');
    return boneIndex('leftFoot');
  }
  if (point.y < 0.74) return boneIndex('rightThigh');
  if (point.y < 1.08) return boneIndex('rightLowerLeg');
  return boneIndex('rightFoot');
}

function secondaryBoneIndexForRestPoint(point: Point, primary: number): number {
  if (point.y < -0.88) return boneIndex('neck');
  if (point.y < -0.68) return boneIndex('upperSpine');
  if (point.y < -0.28) return boneIndex('lowerSpine');
  if (point.y < 0.18) return boneIndex('upperSpine');
  if (point.y < 0.36) return boneIndex('lowerSpine');
  if (point.x < 0) {
    if (point.y < 0.74) return boneIndex('pelvisRoot');
    if (point.y < 1.08) return boneIndex('leftThigh');
    return boneIndex('leftLowerLeg');
  }
  if (point.y < 0.74) return boneIndex('pelvisRoot');
  if (point.y < 1.08) return boneIndex('rightThigh');
  const fallback = boneIndex('rightLowerLeg');
  return fallback === primary ? primary : fallback;
}

function boneIndex(id: RiggedHumanSilhouetteVirtualBoneId): number {
  return RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONES.indexOf(id);
}

function restBoneOrigin(id: RiggedHumanSilhouetteVirtualBoneId): Point {
  switch (id) {
    case 'head':
      return { x: 0, y: -0.9 };
    case 'neck':
      return { x: 0, y: -0.62 };
    case 'upperSpine':
      return { x: 0, y: -0.34 };
    case 'lowerSpine':
      return { x: 0, y: -0.05 };
    case 'pelvisRoot':
      return { x: 0, y: 0.26 };
    case 'leftClavicle':
      return { x: -0.24, y: -0.42 };
    case 'rightClavicle':
      return { x: 0.24, y: -0.42 };
    case 'leftUpperArm':
      return { x: -0.36, y: -0.2 };
    case 'rightUpperArm':
      return { x: 0.36, y: -0.2 };
    case 'leftForearm':
      return { x: -0.42, y: 0.08 };
    case 'rightForearm':
      return { x: 0.42, y: 0.08 };
    case 'leftThigh':
      return { x: -0.17, y: 0.48 };
    case 'rightThigh':
      return { x: 0.17, y: 0.48 };
    case 'leftLowerLeg':
      return { x: -0.17, y: 0.86 };
    case 'rightLowerLeg':
      return { x: 0.17, y: 0.86 };
    case 'leftFoot':
      return { x: -0.2, y: 1.22 };
    case 'rightFoot':
      return { x: 0.2, y: 1.22 };
  }
}

function restBoneTranslation(
  id: RiggedHumanSilhouetteVirtualBoneId,
  orientation: RiggedHumanSilhouetteOrientation
): Point {
  const sideBias = orientation.factor * 0.035;
  if (id.startsWith('left')) return { x: -sideBias, y: 0 };
  if (id.startsWith('right')) return { x: sideBias, y: 0 };
  return { x: 0, y: 0 };
}

function restBoneRotation(
  id: RiggedHumanSilhouetteVirtualBoneId,
  orientation: RiggedHumanSilhouetteOrientation
): number {
  const amount = orientation.factor * 0.05;
  if (id.startsWith('left')) return -amount;
  if (id.startsWith('right')) return amount;
  return 0;
}

function restBoneScale(
  id: RiggedHumanSilhouetteVirtualBoneId,
  orientation: RiggedHumanSilhouetteOrientation
): number {
  if (id === 'head' || id === 'neck') return blend(1, 0.94, orientation.factor);
  if (id.includes('Foot')) return blend(1, 0.9, orientation.factor);
  return 1;
}

function applyBoneTransform(point: Point, bone: RiggedHumanSilhouetteBoneTransform): Point {
  const dx = (point.x - bone.origin.x) * bone.scale;
  const dy = (point.y - bone.origin.y) * bone.scale;
  const cos = Math.cos(bone.rotationRad);
  const sin = Math.sin(bone.rotationRad);
  return {
    x: bone.origin.x + dx * cos - dy * sin + bone.translation.x,
    y: bone.origin.y + dx * sin + dy * cos + bone.translation.y,
  };
}

function createControlPointBuffer(): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT; i++) {
    points.push({ x: 0, y: 0 });
  }
  return points;
}

function clearControlPoints(points: Point[]): void {
  for (let i = 0; i < points.length; i++) {
    points[i].x = 0;
    points[i].y = 0;
  }
}

function buildCentralShell(
  pose: ScreenPoseLandmarks,
  proportions: RiggedHumanSilhouetteProportions,
  minConfidence: number,
  orientation: RiggedHumanSilhouetteOrientation
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
    torsoLength: number;
    shoulderHalf: number;
    hipHalf: number;
  };
  fullBodyEnvelope: boolean;
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
  const widthCompression = orientation.widthCompression;
  const shoulderHalf = clamp(
    proportions.shoulderWidth * 1.08 * widthCompression,
    proportions.bodyScale * 0.56,
    proportions.bodyScale * 1.42
  );
  const hipHalf = clamp(
    proportions.hipWidth * 1.58 * widthCompression,
    proportions.bodyScale * 0.54,
    shoulderHalf * 1.02
  );
  const ribHalf = clamp(shoulderHalf * 0.82, hipHalf * 0.82, shoulderHalf * 0.94);
  const waistHalf = clamp((ribHalf + hipHalf) * 0.42, proportions.bodyScale * 0.42, shoulderHalf * 0.74);
  const neckHalf = clamp(proportions.headRx * 0.78, proportions.bodyScale * 0.2, proportions.bodyScale * 0.32);
  const head = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE);
  const rawHeadRx = head ? blend(proportions.headRx, head.rx, 0.18) : proportions.headRx;
  const headRx = clamp(
    rawHeadRx * 1.14 * blend(1, 0.74, orientation.factor),
    proportions.shoulderWidth * 0.3,
    proportions.shoulderWidth * 0.46
  );
  const headRy = clamp(
    (head ? blend(proportions.headRy, head.ry, 0.08) : proportions.headRy) * 1.18,
    headRx * 1.28,
    headRx * 1.48
  );
  const headCenterFallback = add(shoulderMid, scale(axis, -(headRy * 1.02 + torsoLength * 0.004)));
  const rawHeadCenter = head && pointFinite(head.center)
    ? add(head.center, scale(axis, headRy * 0.54))
    : null;
  const headCenter = head && pointFinite(head.center)
    ? clampHeadCenter(
        interpolatePoint(headCenterFallback, rawHeadCenter!, 0.22),
        headCenterFallback,
        axis,
        sideAxis,
        headRx,
        headRy
      )
    : headCenterFallback;
  const neckBase = add(shoulderMid, scale(axis, -torsoLength * 0.006));
  const upperNeck = add(headCenter, scale(axis, headRy * 0.72));

  const headTop = add(headCenter, scale(axis, -headRy));
  const headLeft = add(add(headCenter, scale(axis, -headRy * 0.12)), scale(sideAxis, headRx));
  const headRight = add(add(headCenter, scale(axis, -headRy * 0.12)), scale(sideAxis, -headRx));
  const earLeft = add(add(headCenter, scale(axis, headRy * 0.16)), scale(sideAxis, headRx * 1.08));
  const earRight = add(add(headCenter, scale(axis, headRy * 0.16)), scale(sideAxis, -headRx * 1.08));
  const jawLeft = add(add(headCenter, scale(axis, headRy * 0.54)), scale(sideAxis, headRx * 0.5));
  const jawRight = add(add(headCenter, scale(axis, headRy * 0.54)), scale(sideAxis, -headRx * 0.5));
  const neckTopLeft = add(upperNeck, scale(sideAxis, neckHalf * 0.78));
  const neckTopRight = add(upperNeck, scale(sideAxis, -neckHalf * 0.78));
  const neckLeft = add(neckBase, scale(sideAxis, neckHalf * 1.72));
  const neckRight = add(neckBase, scale(sideAxis, -neckHalf * 1.72));
  const trapLeft = add(add(shoulderMid, scale(axis, torsoLength * 0.018)), scale(sideAxis, shoulderHalf * 0.34));
  const trapRight = add(add(shoulderMid, scale(axis, torsoLength * 0.018)), scale(sideAxis, -shoulderHalf * 0.34));
  const shoulderLeft = add(add(shoulderMid, scale(axis, torsoLength * 0.074)), scale(sideAxis, shoulderHalf * 0.86));
  const shoulderRight = add(add(shoulderMid, scale(axis, torsoLength * 0.074)), scale(sideAxis, -shoulderHalf * 0.86));
  const deltoidLeft = add(add(shoulderMid, scale(axis, torsoLength * 0.158)), scale(sideAxis, shoulderHalf * 0.94));
  const deltoidRight = add(add(shoulderMid, scale(axis, torsoLength * 0.158)), scale(sideAxis, -shoulderHalf * 0.94));
  const rib = add(shoulderMid, scale(axis, torsoLength * 0.32));
  const ribLeft = add(rib, scale(sideAxis, ribHalf));
  const ribRight = add(rib, scale(sideAxis, -ribHalf));
  const waist = add(shoulderMid, scale(axis, torsoLength * 0.6));
  const waistLeft = add(waist, scale(sideAxis, waistHalf));
  const waistRight = add(waist, scale(sideAxis, -waistHalf));
  const hipLeft = add(add(hipMid, scale(axis, -torsoLength * 0.01)), scale(sideAxis, hipHalf));
  const hipRight = add(add(hipMid, scale(axis, -torsoLength * 0.01)), scale(sideAxis, -hipHalf));
  const pelvisBottom = add(hipMid, scale(axis, torsoLength * 0.118));

  const points = [
    headTop, headLeft, earLeft, jawLeft, neckTopLeft, neckLeft, trapLeft, shoulderLeft, deltoidLeft,
    ribLeft, waistLeft, hipLeft, pelvisBottom, hipRight, waistRight, ribRight, deltoidRight,
    shoulderRight, trapRight, neckRight, neckTopRight, jawRight, earRight, headRight,
  ];
  let path = [
    `M${pointPath(headTop)}`,
    `C${pointPath(add(headTop, scale(sideAxis, headRx * 0.76)))} ${pointPath(add(headLeft, scale(axis, -headRy * 0.48)))} ${pointPath(headLeft)}`,
    `C${pointPath(add(headLeft, scale(axis, headRy * 0.18)))} ${pointPath(add(earLeft, scale(axis, -headRy * 0.12)))} ${pointPath(earLeft)}`,
    `C${pointPath(add(earLeft, scale(axis, headRy * 0.2)))} ${pointPath(add(jawLeft, scale(sideAxis, headRx * 0.18)))} ${pointPath(jawLeft)}`,
    `C${pointPath(add(jawLeft, scale(axis, headRy * 0.18)))} ${pointPath(add(neckTopLeft, scale(axis, -headRy * 0.02)))} ${pointPath(neckTopLeft)}`,
    `C${pointPath(add(neckTopLeft, scale(axis, headRy * 0.12)))} ${pointPath(add(neckLeft, scale(sideAxis, -neckHalf * 0.02)))} ${pointPath(neckLeft)}`,
    `C${pointPath(add(neckLeft, scale(sideAxis, shoulderHalf * 0.1)))} ${pointPath(add(trapLeft, scale(axis, -torsoLength * 0.016)))} ${pointPath(trapLeft)}`,
    `C${pointPath(add(shoulderLeft, scale(axis, -torsoLength * 0.05)))} ${pointPath(add(deltoidLeft, scale(axis, -torsoLength * 0.052)))} ${pointPath(deltoidLeft)}`,
    `C${pointPath(add(deltoidLeft, scale(axis, torsoLength * 0.084)))} ${pointPath(add(ribLeft, scale(axis, -torsoLength * 0.126)))} ${pointPath(ribLeft)}`,
    `C${pointPath(add(ribLeft, scale(axis, torsoLength * 0.104)))} ${pointPath(add(waistLeft, scale(axis, -torsoLength * 0.084)))} ${pointPath(waistLeft)}`,
    `C${pointPath(add(waistLeft, scale(axis, torsoLength * 0.118)))} ${pointPath(add(hipLeft, scale(axis, -torsoLength * 0.072)))} ${pointPath(hipLeft)}`,
    `C${pointPath(add(hipLeft, scale(axis, torsoLength * 0.058)))} ${pointPath(add(pelvisBottom, scale(sideAxis, hipHalf * 0.24)))} ${pointPath(pelvisBottom)}`,
    `C${pointPath(add(pelvisBottom, scale(sideAxis, -hipHalf * 0.24)))} ${pointPath(add(hipRight, scale(axis, torsoLength * 0.058)))} ${pointPath(hipRight)}`,
    `C${pointPath(add(hipRight, scale(axis, -torsoLength * 0.072)))} ${pointPath(add(waistRight, scale(axis, torsoLength * 0.118)))} ${pointPath(waistRight)}`,
    `C${pointPath(add(waistRight, scale(axis, -torsoLength * 0.084)))} ${pointPath(add(ribRight, scale(axis, torsoLength * 0.104)))} ${pointPath(ribRight)}`,
    `C${pointPath(add(ribRight, scale(axis, -torsoLength * 0.126)))} ${pointPath(add(deltoidRight, scale(axis, torsoLength * 0.084)))} ${pointPath(deltoidRight)}`,
    `C${pointPath(add(deltoidRight, scale(axis, -torsoLength * 0.052)))} ${pointPath(add(shoulderRight, scale(axis, -torsoLength * 0.05)))} ${pointPath(trapRight)}`,
    `C${pointPath(add(trapRight, scale(axis, -torsoLength * 0.016)))} ${pointPath(add(neckRight, scale(sideAxis, -shoulderHalf * 0.1)))} ${pointPath(neckRight)}`,
    `C${pointPath(add(neckRight, scale(sideAxis, neckHalf * 0.02)))} ${pointPath(add(neckTopRight, scale(axis, headRy * 0.12)))} ${pointPath(neckTopRight)}`,
    `C${pointPath(add(neckTopRight, scale(axis, -headRy * 0.02)))} ${pointPath(add(jawRight, scale(axis, headRy * 0.18)))} ${pointPath(jawRight)}`,
    `C${pointPath(add(jawRight, scale(sideAxis, -headRx * 0.18)))} ${pointPath(add(earRight, scale(axis, headRy * 0.2)))} ${pointPath(earRight)}`,
    `C${pointPath(add(earRight, scale(axis, -headRy * 0.12)))} ${pointPath(add(headRight, scale(axis, headRy * 0.18)))} ${pointPath(headRight)}`,
    `C${pointPath(add(headRight, scale(axis, -headRy * 0.48)))} ${pointPath(add(headTop, scale(sideAxis, -headRx * 0.76)))} ${pointPath(headTop)} Z`,
  ].join(' ');
  let boundsPoints = points;
  const fullBody = buildNaturalHumanEnvelopePath(pose, proportions.bodyScale, minConfidence, {
    axis,
    sideAxis,
    shoulderMid,
    hipMid,
    shoulderHalf,
    hipHalf,
    headCenter,
    headRx,
    headRy,
    headTop,
    headLeft,
    earLeft,
    jawLeft,
    neckTopLeft,
    neckLeft,
    trapLeft,
    shoulderLeft,
    deltoidLeft,
    ribLeft,
    waistLeft,
    hipLeft,
    pelvisBottom,
    hipRight,
    waistRight,
    ribRight,
    deltoidRight,
    shoulderRight,
    trapRight,
    neckRight,
    neckTopRight,
    jawRight,
    earRight,
    headRight,
  });
  if (fullBody !== null) {
    path = fullBody.path;
    boundsPoints = fullBody.points;
  }

  return {
    path,
    fill: `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`,
    opacity: opacityForConfidence(confidence, minConfidence),
    confidence,
    bounds: boundsForPoints(boundsPoints),
    visible: true,
    headAttached: true,
    fullBodyEnvelope: fullBody !== null,
    anchors: {
      shoulderMid,
      hipMid,
      axis,
      sideAxis,
      neckCenter: neckBase,
      headCenter,
      torsoLength,
      shoulderHalf,
      hipHalf,
    },
  };
}

function buildNaturalHumanEnvelopePath(
  pose: ScreenPoseLandmarks,
  bodyScale: number,
  minConfidence: number,
  torso: {
    axis: Point;
    sideAxis: Point;
    shoulderMid: Point;
    hipMid: Point;
    shoulderHalf: number;
    hipHalf: number;
    headCenter: Point;
    headRx: number;
    headRy: number;
    headTop: Point;
    headLeft: Point;
    earLeft: Point;
    jawLeft: Point;
    neckTopLeft: Point;
    neckLeft: Point;
    trapLeft: Point;
    shoulderLeft: Point;
    deltoidLeft: Point;
    ribLeft: Point;
    waistLeft: Point;
    hipLeft: Point;
    pelvisBottom: Point;
    hipRight: Point;
    waistRight: Point;
    ribRight: Point;
    deltoidRight: Point;
    shoulderRight: Point;
    trapRight: Point;
    neckRight: Point;
    neckTopRight: Point;
    jawRight: Point;
    earRight: Point;
    headRight: Point;
  }
): { path: string; points: Point[] } | null {
  const required = [
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
  ];
  for (let i = 0; i < required.length; i++) {
    const lm = required[i];
    if (landmarkConfidence(pose, lm) < minConfidence || !pointFinite(pointFor(pose, lm))) {
      return null;
    }
  }

  const leftShoulder = pointFor(pose, LM.LEFT_SHOULDER);
  const leftElbow = pointFor(pose, LM.LEFT_ELBOW);
  const leftWrist = pointFor(pose, LM.LEFT_WRIST);
  const rightShoulder = pointFor(pose, LM.RIGHT_SHOULDER);
  const rightElbow = pointFor(pose, LM.RIGHT_ELBOW);
  const rightWrist = pointFor(pose, LM.RIGHT_WRIST);
  const leftHip = pointFor(pose, LM.LEFT_HIP);
  const leftKnee = pointFor(pose, LM.LEFT_KNEE);
  const leftAnkle = pointFor(pose, LM.LEFT_ANKLE);
  const rightHip = pointFor(pose, LM.RIGHT_HIP);
  const rightKnee = pointFor(pose, LM.RIGHT_KNEE);
  const rightAnkle = pointFor(pose, LM.RIGHT_ANKLE);
  const leftOut = torso.sideAxis;
  const rightOut = scale(torso.sideAxis, -1);
  const leftElbowDisplay = ensureOutwardFromSpine(
    leftElbow,
    torso.shoulderMid,
    torso.axis,
    leftOut,
    Math.max(torso.shoulderHalf * 0.98, bodyScale * 1.18)
  );
  const leftWristDisplay = ensureOutwardFromSpine(
    leftWrist,
    torso.shoulderMid,
    torso.axis,
    leftOut,
    Math.max(torso.shoulderHalf * 1.16, bodyScale * 1.44)
  );
  const rightElbowDisplay = ensureOutwardFromSpine(
    rightElbow,
    torso.shoulderMid,
    torso.axis,
    rightOut,
    Math.max(torso.shoulderHalf * 0.98, bodyScale * 1.18)
  );
  const rightWristDisplay = ensureOutwardFromSpine(
    rightWrist,
    torso.shoulderMid,
    torso.axis,
    rightOut,
    Math.max(torso.shoulderHalf * 1.16, bodyScale * 1.44)
  );
  const leftGroin = add(add(torso.pelvisBottom, scale(leftOut, bodyScale * 0.08)), scale(torso.axis, -bodyScale * 0.026));
  const rightGroin = add(add(torso.pelvisBottom, scale(rightOut, bodyScale * 0.08)), scale(torso.axis, -bodyScale * 0.026));
  const crotch = add(torso.pelvisBottom, scale(torso.axis, -bodyScale * 0.006));

  const leftArmOuter = [
    offsetJoint(leftElbowDisplay, leftShoulder, leftWristDisplay, bodyScale * 0.15, leftOut),
    offsetJoint(leftWristDisplay, leftElbowDisplay, add(leftWristDisplay, scale(normalize({ x: leftWristDisplay.x - leftElbowDisplay.x, y: leftWristDisplay.y - leftElbowDisplay.y }), bodyScale * 0.08)), bodyScale * 0.082, leftOut),
  ];
  const leftHand = handContourPoints(pose, LM.LEFT_WRIST, LM.LEFT_ELBOW, LM.LEFT_INDEX, LM.LEFT_PINKY, LM.LEFT_THUMB, bodyScale, leftOut, leftWristDisplay, leftElbowDisplay);
  const leftArmInner = [
    offsetJoint(leftWristDisplay, leftElbowDisplay, add(leftWristDisplay, scale(normalize({ x: leftWristDisplay.x - leftElbowDisplay.x, y: leftWristDisplay.y - leftElbowDisplay.y }), bodyScale * 0.08)), bodyScale * 0.072, scale(leftOut, -1)),
    offsetJoint(leftElbowDisplay, leftShoulder, leftWristDisplay, bodyScale * 0.102, scale(leftOut, -1)),
    add(add(leftShoulder, scale(torso.axis, bodyScale * 0.12)), scale(leftOut, bodyScale * 0.08)),
  ];

  const rightArmInner = [
    add(add(rightShoulder, scale(torso.axis, bodyScale * 0.12)), scale(rightOut, bodyScale * 0.08)),
    offsetJoint(rightElbowDisplay, rightShoulder, rightWristDisplay, bodyScale * 0.102, scale(rightOut, -1)),
    offsetJoint(rightWristDisplay, rightElbowDisplay, add(rightWristDisplay, scale(normalize({ x: rightWristDisplay.x - rightElbowDisplay.x, y: rightWristDisplay.y - rightElbowDisplay.y }), bodyScale * 0.08)), bodyScale * 0.072, scale(rightOut, -1)),
  ];
  const rightHand = handContourPoints(pose, LM.RIGHT_WRIST, LM.RIGHT_ELBOW, LM.RIGHT_INDEX, LM.RIGHT_PINKY, LM.RIGHT_THUMB, bodyScale, rightOut, rightWristDisplay, rightElbowDisplay);
  const rightArmOuter = [
    offsetJoint(rightWristDisplay, rightElbowDisplay, add(rightWristDisplay, scale(normalize({ x: rightWristDisplay.x - rightElbowDisplay.x, y: rightWristDisplay.y - rightElbowDisplay.y }), bodyScale * 0.08)), bodyScale * 0.082, rightOut),
    offsetJoint(rightElbowDisplay, rightShoulder, rightWristDisplay, bodyScale * 0.15, rightOut),
  ];

  const leftFoot = footContourPoints(pose, LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX, LM.LEFT_KNEE, bodyScale, leftOut);
  const rightFoot = footContourPoints(pose, LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX, LM.RIGHT_KNEE, bodyScale, rightOut);
  const leftCalf = interpolatePoint(leftKnee, leftAnkle, 0.55);
  const rightCalf = interpolatePoint(rightKnee, rightAnkle, 0.55);
  const leftLegOuter = [
    add(leftHip, scale(leftOut, bodyScale * 0.34)),
    offsetJoint(leftKnee, leftHip, leftAnkle, bodyScale * 0.27, leftOut),
    offsetJoint(leftCalf, leftKnee, leftAnkle, bodyScale * 0.24, leftOut),
    offsetJoint(leftAnkle, leftKnee, add(leftAnkle, scale(torso.axis, bodyScale * 0.08)), bodyScale * 0.12, leftOut),
  ];
  const leftLegInner = [
    offsetJoint(leftAnkle, leftKnee, add(leftAnkle, scale(torso.axis, bodyScale * 0.08)), bodyScale * 0.09, rightOut),
    offsetJoint(leftCalf, leftKnee, leftAnkle, bodyScale * 0.15, rightOut),
    offsetJoint(leftKnee, leftHip, leftAnkle, bodyScale * 0.19, rightOut),
    leftGroin,
  ];
  const rightLegInner = [
    rightGroin,
    offsetJoint(rightKnee, rightHip, rightAnkle, bodyScale * 0.19, leftOut),
    offsetJoint(rightCalf, rightKnee, rightAnkle, bodyScale * 0.15, leftOut),
    offsetJoint(rightAnkle, rightKnee, add(rightAnkle, scale(torso.axis, bodyScale * 0.08)), bodyScale * 0.09, leftOut),
  ];
  const rightLegOuter = [
    offsetJoint(rightAnkle, rightKnee, add(rightAnkle, scale(torso.axis, bodyScale * 0.08)), bodyScale * 0.12, rightOut),
    offsetJoint(rightCalf, rightKnee, rightAnkle, bodyScale * 0.24, rightOut),
    offsetJoint(rightKnee, rightHip, rightAnkle, bodyScale * 0.27, rightOut),
    add(rightHip, scale(rightOut, bodyScale * 0.34)),
  ];

  const leftArmpit = add(add(torso.ribLeft, scale(torso.axis, -bodyScale * 0.05)), scale(leftOut, -bodyScale * 0.02));
  const rightArmpit = add(add(torso.ribRight, scale(torso.axis, -bodyScale * 0.05)), scale(rightOut, -bodyScale * 0.02));
  const headUpperLeft = add(add(torso.headCenter, scale(torso.axis, -torso.headRy * 0.72)), scale(leftOut, torso.headRx * 0.72));
  const headTempleLeft = add(add(torso.headCenter, scale(torso.axis, -torso.headRy * 0.14)), scale(leftOut, torso.headRx * 1.02));
  const cheekLeft = add(add(torso.headCenter, scale(torso.axis, torso.headRy * 0.26)), scale(leftOut, torso.headRx * 0.88));
  const jawBlendLeft = add(add(torso.headCenter, scale(torso.axis, torso.headRy * 0.62)), scale(leftOut, torso.headRx * 0.42));
  const neckBlendLeft = interpolatePoint(torso.neckTopLeft, torso.neckLeft, 0.46);
  const headUpperRight = add(add(torso.headCenter, scale(torso.axis, -torso.headRy * 0.72)), scale(rightOut, torso.headRx * 0.72));
  const headTempleRight = add(add(torso.headCenter, scale(torso.axis, -torso.headRy * 0.14)), scale(rightOut, torso.headRx * 1.02));
  const cheekRight = add(add(torso.headCenter, scale(torso.axis, torso.headRy * 0.26)), scale(rightOut, torso.headRx * 0.88));
  const jawBlendRight = add(add(torso.headCenter, scale(torso.axis, torso.headRy * 0.62)), scale(rightOut, torso.headRx * 0.42));
  const neckBlendRight = interpolatePoint(torso.neckTopRight, torso.neckRight, 0.46);

  const referenceContour = buildReferenceHumanContour({
    torso,
    bodyScale,
    leftWrist: leftWristDisplay,
    rightWrist: rightWristDisplay,
    leftAnkle,
    rightAnkle,
  });
  return {
    path: closedSmoothPath(referenceContour),
    points: referenceContour,
  };

  const contour = [
    torso.headTop,
    headUpperLeft,
    headTempleLeft,
    cheekLeft,
    jawBlendLeft,
    neckBlendLeft,
    torso.neckLeft,
    torso.trapLeft,
    torso.shoulderLeft,
    torso.ribLeft,
    torso.waistLeft,
    torso.hipLeft,
    ...leftLegOuter,
    ...leftFoot,
    ...leftLegInner,
    crotch,
    ...rightLegInner,
    ...rightFoot.slice().reverse(),
    ...rightLegOuter,
    torso.hipRight,
    torso.waistRight,
    torso.ribRight,
    torso.shoulderRight,
    torso.trapRight,
    torso.neckRight,
    neckBlendRight,
    jawBlendRight,
    cheekRight,
    headTempleRight,
    headUpperRight,
  ];

  return {
    path: closedSmoothPath(contour),
    points: contour,
  };
}

function offsetJoint(joint: Point, previous: Point, next: Point, amount: number, preferredNormal: Point): Point {
  const incoming = normalizeOr({ x: joint.x - previous.x, y: joint.y - previous.y }, {
    x: -preferredNormal.y,
    y: preferredNormal.x,
  });
  const outgoing = normalizeOr({ x: next.x - joint.x, y: next.y - joint.y }, incoming);
  const tangent = normalizeOr({ x: incoming.x + outgoing.x, y: incoming.y + outgoing.y }, outgoing);
  let normal = normalizeOr({ x: -tangent.y, y: tangent.x }, preferredNormal);
  if (normal.x * preferredNormal.x + normal.y * preferredNormal.y < 0) {
    normal = scale(normal, -1);
  }
  return add(joint, scale(normal, amount));
}

function buildReferenceHumanContour({
  torso,
  bodyScale,
  leftWrist,
  rightWrist,
  leftAnkle,
  rightAnkle,
}: {
  torso: {
    axis: Point;
    sideAxis: Point;
    shoulderMid: Point;
    hipMid: Point;
    shoulderHalf: number;
    hipHalf: number;
    headCenter: Point;
    headRx: number;
    headRy: number;
  };
  bodyScale: number;
  leftWrist: Point;
  rightWrist: Point;
  leftAnkle: Point;
  rightAnkle: Point;
}): Point[] {
  const torsoLength = Math.max(1, distance(torso.shoulderMid, torso.hipMid));
  const sideUnit = torso.sideAxis;
  const axis = torso.axis;
  const alongFor = (point: Point): number => (
    (point.x - torso.shoulderMid.x) * axis.x + (point.y - torso.shoulderMid.y) * axis.y
  ) / torsoLength;
  const sideFor = (point: Point, outward: Point): number => (
    (point.x - torso.shoulderMid.x) * outward.x + (point.y - torso.shoulderMid.y) * outward.y
  ) / torsoLength;
  const p = (along: number, side: number): Point =>
    add(add(torso.shoulderMid, scale(axis, torsoLength * along)), scale(sideUnit, torsoLength * side));
  const headPoint = (along: number, side: number): Point =>
    add(add(torso.headCenter, scale(axis, torso.headRy * along)), scale(sideUnit, torso.headRx * side));

  const shoulderSide = clamp((torso.shoulderHalf / torsoLength) * 0.78, 0.34, 0.48);
  const ribSide = shoulderSide * 0.72;
  const waistSide = clamp((torso.hipHalf / torsoLength) * 0.58, 0.22, 0.29);
  const hipSide = clamp((torso.hipHalf / torsoLength) * 0.82, 0.3, 0.38);
  const leftOut = sideUnit;
  const rightOut = scale(sideUnit, -1);
  const leftWristAlong = blend(1.08, clamp(alongFor(leftWrist), 0.92, 1.32), 0.35);
  const rightWristAlong = blend(1.08, clamp(alongFor(rightWrist), 0.92, 1.32), 0.35);
  const leftWristSide = Math.max(shoulderSide + 0.2, clamp(sideFor(leftWrist, leftOut), shoulderSide + 0.12, shoulderSide + 0.34));
  const rightWristSide = Math.max(shoulderSide + 0.2, clamp(sideFor(rightWrist, rightOut), shoulderSide + 0.12, shoulderSide + 0.34));
  const ankleAlong = clamp((alongFor(midpoint(leftAnkle, rightAnkle)) + bodyScale / torsoLength * 0.1), 2.25, 2.92);
  const kneeAlong = blend(1, ankleAlong, 0.56);
  const calfAlong = blend(1, ankleAlong, 0.78);
  const footAlong = ankleAlong + 0.08;

  const leftHand: Point[] = [
    p(leftWristAlong - 0.04, leftWristSide + 0.024),
    p(leftWristAlong + 0.02, leftWristSide + 0.1),
    p(leftWristAlong + 0.14, leftWristSide + 0.074),
    p(leftWristAlong + 0.19, leftWristSide + 0.026),
    p(leftWristAlong + 0.17, leftWristSide - 0.022),
    p(leftWristAlong + 0.11, leftWristSide - 0.064),
    p(leftWristAlong - 0.02, leftWristSide - 0.05),
  ];
  const rightHand: Point[] = [
    p(rightWristAlong - 0.02, -rightWristSide + 0.05),
    p(rightWristAlong + 0.11, -rightWristSide + 0.064),
    p(rightWristAlong + 0.17, -rightWristSide + 0.022),
    p(rightWristAlong + 0.19, -rightWristSide - 0.026),
    p(rightWristAlong + 0.14, -rightWristSide - 0.074),
    p(rightWristAlong + 0.02, -rightWristSide - 0.1),
    p(rightWristAlong - 0.04, -rightWristSide - 0.024),
  ];

  return [
    headPoint(-1.02, 0),
    headPoint(-0.78, 0.72),
    headPoint(-0.18, 1.04),
    headPoint(0.34, 0.86),
    headPoint(0.72, 0.42),
    p(-0.05, 0.16),
    p(0.08, 0.27),
    p(0.14, shoulderSide),
    p(0.28, shoulderSide + 0.05),
    p(0.62, shoulderSide + 0.08),
    p(leftWristAlong - 0.12, leftWristSide + 0.04),
    ...leftHand,
    p(leftWristAlong - 0.08, leftWristSide - 0.08),
    p(0.64, shoulderSide - 0.08),
    p(0.26, ribSide),
    p(0.58, waistSide),
    p(0.88, hipSide),
    p(1.08, hipSide * 0.9),
    p(kneeAlong, hipSide * 0.54),
    p(calfAlong, hipSide * 0.46),
    p(ankleAlong, hipSide * 0.2),
    p(footAlong, hipSide * 0.34),
    p(footAlong + 0.018, hipSide * 0.12),
    p(ankleAlong, hipSide * 0.06),
    p(calfAlong, hipSide * 0.13),
    p(kneeAlong, hipSide * 0.18),
    p(1.07, 0.09),
    p(1.02, 0.03),
    p(1.07, -0.03),
    p(kneeAlong, -hipSide * 0.18),
    p(calfAlong, -hipSide * 0.13),
    p(ankleAlong, -hipSide * 0.06),
    p(footAlong + 0.018, -hipSide * 0.12),
    p(footAlong, -hipSide * 0.34),
    p(ankleAlong, -hipSide * 0.2),
    p(calfAlong, -hipSide * 0.46),
    p(kneeAlong, -hipSide * 0.54),
    p(1.08, -hipSide * 0.9),
    p(0.88, -hipSide),
    p(0.58, -waistSide),
    p(0.26, -ribSide),
    p(0.64, -(shoulderSide - 0.08)),
    p(rightWristAlong - 0.08, -(rightWristSide - 0.08)),
    ...rightHand,
    p(rightWristAlong - 0.12, -(rightWristSide + 0.04)),
    p(0.62, -(shoulderSide + 0.08)),
    p(0.28, -(shoulderSide + 0.05)),
    p(0.14, -shoulderSide),
    p(0.08, -0.27),
    p(-0.05, -0.16),
    headPoint(0.72, -0.42),
    headPoint(0.34, -0.86),
    headPoint(-0.18, -1.04),
    headPoint(-0.78, -0.72),
  ];
}

function ensureOutwardFromSpine(
  point: Point,
  spineOrigin: Point,
  axis: Point,
  outward: Point,
  minOffset: number
): Point {
  const delta = { x: point.x - spineOrigin.x, y: point.y - spineOrigin.y };
  const along = delta.x * axis.x + delta.y * axis.y;
  const spinePoint = add(spineOrigin, scale(axis, along));
  const offset = (point.x - spinePoint.x) * outward.x + (point.y - spinePoint.y) * outward.y;
  if (offset >= minOffset) return point;
  return add(point, scale(outward, minOffset - offset));
}

function handContourPoints(
  pose: ScreenPoseLandmarks,
  wristLm: LM,
  elbowLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  thumbLm: LM,
  bodyScale: number,
  preferredOuter: Point,
  displayWrist?: Point,
  displayElbow?: Point
): Point[] {
  const wrist = displayWrist ?? pointFor(pose, wristLm);
  const elbow = displayElbow ?? pointFor(pose, elbowLm);
  if (!pointFinite(wrist) || !pointFinite(elbow)) return [];

  const armAxis = normalizeOr({ x: wrist.x - elbow.x, y: wrist.y - elbow.y }, preferredOuter);
  const index = pointFor(pose, indexLm);
  const pinky = pointFor(pose, pinkyLm);
  const hasFingerSpan =
    pointFinite(index) &&
    pointFinite(pinky) &&
    landmarkConfidence(pose, indexLm) >= MIN_RENDER_CONFIDENCE &&
    landmarkConfidence(pose, pinkyLm) >= MIN_RENDER_CONFIDENCE;
  const fallbackFingerMid = add(wrist, scale(armAxis, bodyScale * 0.18));
  const rawFingerMid = hasFingerSpan
    ? interpolatePoint(fallbackFingerMid, midpoint(index, pinky), 0.18)
    : fallbackFingerMid;
  const handAxis = normalizeOr({ x: rawFingerMid.x - wrist.x, y: rawFingerMid.y - wrist.y }, armAxis);
  const handNormal = { x: -handAxis.y, y: handAxis.x };
  let outer = handNormal;
  if (outer.x * preferredOuter.x + outer.y * preferredOuter.y < 0) {
    outer = scale(outer, -1);
  }
  const inner = scale(outer, -1);
  const thumb = pointFor(pose, thumbLm);
  const thumbBump = pointFinite(thumb) && landmarkConfidence(pose, thumbLm) >= MIN_RENDER_CONFIDENCE
    ? interpolatePoint(
        add(wrist, scale(handAxis, bodyScale * 0.12)),
        thumb,
        0.2
      )
    : add(add(wrist, scale(handAxis, bodyScale * 0.14)), scale(outer, bodyScale * 0.065));
  const handLength = clamp(distance(wrist, rawFingerMid), bodyScale * 0.2, bodyScale * 0.32);
  const wristOuter = add(wrist, scale(outer, bodyScale * 0.046));
  const palmOuter = add(add(wrist, scale(handAxis, handLength * 0.5)), scale(outer, bodyScale * 0.092));
  const fingerOuter = add(add(wrist, scale(handAxis, handLength * 0.92)), scale(outer, bodyScale * 0.07));
  const fingerTip = add(wrist, scale(handAxis, handLength * 1.08));
  const fingerInner = add(add(wrist, scale(handAxis, handLength * 0.9)), scale(inner, bodyScale * 0.066));
  const palmInner = add(add(wrist, scale(handAxis, handLength * 0.46)), scale(inner, bodyScale * 0.078));
  const wristInner = add(wrist, scale(inner, bodyScale * 0.042));

  return [wristOuter, palmOuter, thumbBump, fingerOuter, fingerTip, fingerInner, palmInner, wristInner];
}

function footContourPoints(
  pose: ScreenPoseLandmarks,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  kneeLm: LM,
  bodyScale: number,
  preferredOuter: Point
): Point[] {
  const ankle = pointFor(pose, ankleLm);
  const knee = pointFor(pose, kneeLm);
  if (!pointFinite(ankle) || !pointFinite(knee)) return [];

  const legAxis = normalizeOr({ x: ankle.x - knee.x, y: ankle.y - knee.y }, preferredOuter);
  const heel = pointFor(pose, heelLm);
  const toe = pointFor(pose, toeLm);
  const hasFootDirection =
    pointFinite(heel) &&
    pointFinite(toe) &&
    landmarkConfidence(pose, heelLm) >= MIN_RENDER_CONFIDENCE &&
    landmarkConfidence(pose, toeLm) >= MIN_RENDER_CONFIDENCE &&
    distance(heel, toe) > 1;
  const footAxis = hasFootDirection
    ? normalize({ x: toe.x - heel.x, y: toe.y - heel.y })
    : legAxis;
  const footNormal = { x: -footAxis.y, y: footAxis.x };
  let outer = footNormal;
  if (outer.x * preferredOuter.x + outer.y * preferredOuter.y < 0) {
    outer = scale(outer, -1);
  }
  const inner = scale(outer, -1);
  const footLength = clamp(
    hasFootDirection ? distance(ankle, toe) + bodyScale * 0.08 : bodyScale * 0.26,
    bodyScale * 0.22,
    bodyScale * 0.38
  );
  const ankleOuter = add(ankle, scale(outer, bodyScale * 0.074));
  const instepOuter = add(add(ankle, scale(footAxis, footLength * 0.42)), scale(outer, bodyScale * 0.108));
  const toeOuter = add(add(ankle, scale(footAxis, footLength * 0.9)), scale(outer, bodyScale * 0.16));
  const bigToe = add(add(ankle, scale(footAxis, footLength * 1.08)), scale(outer, bodyScale * 0.1));
  const toeTip = add(ankle, scale(footAxis, footLength * 1.16));
  const smallToe = add(add(ankle, scale(footAxis, footLength * 1.02)), scale(inner, bodyScale * 0.14));
  const toeInner = add(add(ankle, scale(footAxis, footLength * 0.86)), scale(inner, bodyScale * 0.13));
  const instepInner = add(add(ankle, scale(footAxis, footLength * 0.36)), scale(inner, bodyScale * 0.084));
  const ankleInner = add(ankle, scale(inner, bodyScale * 0.062));

  return [ankleOuter, instepOuter, toeOuter, bigToe, toeTip, smallToe, toeInner, instepInner, ankleInner];
}

function buildArmSurface(
  pose: ScreenPoseLandmarks,
  side: 'leftArm' | 'rightArm',
  proportions: RiggedHumanSilhouetteProportions,
  minConfidence: number,
  orientation: RiggedHumanSilhouetteOrientation
): LimbModel {
  const left = side === 'leftArm';
  const shoulder = left ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const elbow = left ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const wrist = left ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
  const index = left ? LM.LEFT_INDEX : LM.RIGHT_INDEX;
  const pinky = left ? LM.LEFT_PINKY : LM.RIGHT_PINKY;
  const thumb = left ? LM.LEFT_THUMB : LM.RIGHT_THUMB;
  const baseFill = `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`;
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
  const oppositeShoulder = pointFor(pose, left ? LM.RIGHT_SHOULDER : LM.LEFT_SHOULDER);
  const sameHip = pointFor(pose, left ? LM.LEFT_HIP : LM.RIGHT_HIP);
  const oppositeHip = pointFor(pose, left ? LM.RIGHT_HIP : LM.LEFT_HIP);
  const spineOrigin = pointFinite(oppositeShoulder)
    ? midpoint(p0, oppositeShoulder)
    : p0;
  const sideAxis = pointFinite(oppositeShoulder)
    ? normalizeOr({ x: p0.x - oppositeShoulder.x, y: p0.y - oppositeShoulder.y }, { x: left ? -1 : 1, y: 0 })
    : { x: left ? -1 : 1, y: 0 };
  const bodyAxis = pointFinite(sameHip) && pointFinite(oppositeHip)
    ? normalizeOr({
        x: midpoint(sameHip, oppositeHip).x - spineOrigin.x,
        y: midpoint(sameHip, oppositeHip).y - spineOrigin.y,
      }, { x: 0, y: 1 })
    : normalizeOr({ x: p2.x - p0.x, y: p2.y - p0.y }, { x: 0, y: 1 });
  const p1Display = ensureOutwardFromSpine(
    p1,
    spineOrigin,
    bodyAxis,
    sideAxis,
    Math.max(proportions.shoulderWidth * 0.66, proportions.bodyScale * 1.06)
  );
  const p2Wide = ensureOutwardFromSpine(
    p2,
    spineOrigin,
    bodyAxis,
    sideAxis,
    Math.max(proportions.shoulderWidth * 0.8, proportions.bodyScale * 1.34)
  );
  const p2Display = add(p2Wide, scale(bodyAxis, proportions.bodyScale * 0.16));
  const root = interpolatePoint(p0, p1Display, 0.18);
  const forearmMid = interpolatePoint(p1Display, p2Display, 0.5);
  const wristEnd = add(p2Display, scale(normalize({ x: p2Display.x - p1Display.x, y: p2Display.y - p1Display.y }), proportions.bodyScale * 0.04));
  const widthCompression = blend(1, 0.72, orientation.factor);
  const widths = [
    clamp(proportions.bodyScale * 0.3 * widthCompression, 12, 32),
    clamp(proportions.bodyScale * 0.27 * widthCompression, 11, 29),
    clamp(proportions.bodyScale * 0.2 * widthCompression, 8, 22),
    clamp(proportions.bodyScale * 0.145 * widthCompression, 6, 17),
    clamp(proportions.bodyScale * 0.115 * widthCompression, 5, 14),
  ];
  const model = buildLimbModel(side, [root, p1Display, forearmMid, p2Display, wristEnd], widths, confidence, minConfidence, baseFill);
  const handPath = buildHandTerminalPath(pose, wrist, elbow, index, pinky, thumb, proportions.bodyScale, p2Display, p1Display);
  if (model.visible && handPath.path.length > 0) {
    model.path = `${model.path} ${handPath.path}`;
    model.bounds = includeBounds(model.bounds, handPath.bounds);
  }
  return model;
}

function buildLegSurface(
  pose: ScreenPoseLandmarks,
  side: 'leftLeg' | 'rightLeg',
  proportions: RiggedHumanSilhouetteProportions,
  minConfidence: number,
  orientation: RiggedHumanSilhouetteOrientation
): LimbModel {
  const left = side === 'leftLeg';
  const hip = left ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const knee = left ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
  const ankle = left ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
  const foot = left ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX;
  const heel = left ? LM.LEFT_HEEL : LM.RIGHT_HEEL;
  const baseFill = `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`;
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
  const root = p0;
  const calf = interpolatePoint(p1, p2, 0.52);
  const ankleEnd = add(p2, scale(normalize({ x: p2.x - p1.x, y: p2.y - p1.y }), proportions.bodyScale * 0.014));
  const widthCompression = blend(1, 0.76, orientation.factor);
  const widths = [
    clamp(proportions.bodyScale * 0.66 * widthCompression, 22, 58),
    clamp(proportions.bodyScale * 0.38 * widthCompression, 14, 38),
    clamp(proportions.bodyScale * 0.34 * widthCompression, 12, 34),
    clamp(proportions.bodyScale * 0.2 * widthCompression, 8, 23),
    clamp(proportions.bodyScale * 0.14 * widthCompression, 5, 16),
  ];
  const model = buildLimbModel(side, [root, p1, calf, p2, ankleEnd], widths, confidence, minConfidence, baseFill);
  const footPath = buildFootTerminalPath(pose, ankle, heel, foot, knee, proportions.bodyScale);
  if (model.visible && footPath.path.length > 0) {
    model.path = `${model.path} ${footPath.path}`;
    model.bounds = includeBounds(model.bounds, footPath.bounds);
  }
  return model;
}

function buildLimbModel(
  surface: RiggedHumanSilhouetteSurfaceId,
  centers: readonly Point[],
  widths: readonly number[],
  confidence: number,
  minConfidence: number,
  baseFill: string
): LimbModel {
  const cleaned = cleanCenterline(centers);
  if (!cleaned.valid || cleaned.points.length < 2 || cleaned.points.length !== widths.length) {
    return emptyLimb(surface);
  }
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
  const terminalIndex = cleaned.points.length - 1;
  const terminalTangent = normalize({
    x: cleaned.points[terminalIndex].x - cleaned.points[terminalIndex - 1].x,
    y: cleaned.points[terminalIndex].y - cleaned.points[terminalIndex - 1].y,
  });
  const terminalRound = widths[terminalIndex] * 0.08;
  const path = [
    smoothPath(leftSide),
    `C${pointPath(add(leftSide[terminalIndex], scale(terminalTangent, terminalRound)))} ${pointPath(add(rightSide[terminalIndex], scale(terminalTangent, terminalRound)))} ${pointPath(rightSide[terminalIndex])}`,
    smoothPath(reversedRight, false),
    `Q${pointPath(centers[0])} ${pointPath(leftSide[0])} Z`,
  ].join(' ');
  const jointContinuous =
    distance(cleaned.points[0], cleaned.points[1]) > 1 &&
    cleaned.points.length > 2 &&
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

function buildHandTerminalPath(
  pose: ScreenPoseLandmarks,
  wristLm: LM,
  elbowLm: LM,
  indexLm: LM,
  pinkyLm: LM,
  thumbLm: LM,
  bodyScale: number,
  displayWrist?: Point,
  displayElbow?: Point
): { path: string; bounds: Bounds } {
  const wrist = displayWrist ?? pointFor(pose, wristLm);
  const elbow = displayElbow ?? pointFor(pose, elbowLm);
  if (!pointFinite(wrist) || !pointFinite(elbow)) {
    return { path: '', bounds: emptyBounds() };
  }

  const armAxis = normalize({ x: wrist.x - elbow.x, y: wrist.y - elbow.y });
  const index = pointFor(pose, indexLm);
  const pinky = pointFor(pose, pinkyLm);
  const hasFingerSpan =
    pointFinite(index) &&
    pointFinite(pinky) &&
    landmarkConfidence(pose, indexLm) >= MIN_RENDER_CONFIDENCE &&
    landmarkConfidence(pose, pinkyLm) >= MIN_RENDER_CONFIDENCE;
  const fallbackFingerMid = add(wrist, scale(armAxis, bodyScale * 0.38));
  const rawFingerMid = hasFingerSpan
    ? interpolatePoint(fallbackFingerMid, midpoint(index, pinky), 0.18)
    : fallbackFingerMid;
  const handAxis = normalizeOr({ x: rawFingerMid.x - wrist.x, y: rawFingerMid.y - wrist.y }, armAxis);
  const normal = { x: -handAxis.y, y: handAxis.x };
  const thumb = pointFor(pose, thumbLm);
  const thumbProjection = pointFinite(thumb)
    ? (thumb.x - wrist.x) * normal.x + (thumb.y - wrist.y) * normal.y
    : 1;
  const outer = thumbProjection >= 0 ? normal : scale(normal, -1);
  const inner = scale(outer, -1);
  const rawLength = distance(wrist, rawFingerMid);
  const handLength = clamp(rawLength, bodyScale * 0.42, bodyScale * 0.68);
  const wristHalf = bodyScale * 0.07;
  const palmHalf = bodyScale * 0.2;
  const fingerHalf = bodyScale * 0.17;
  const palmCenter = add(wrist, scale(handAxis, handLength * 0.5));
  const fingerCenter = add(wrist, scale(handAxis, handLength * 0.94));
  const wristOuter = add(wrist, scale(outer, wristHalf));
  const wristInner = add(wrist, scale(inner, wristHalf * 0.9));
  const thumbTip = add(add(palmCenter, scale(outer, palmHalf * 1.72)), scale(handAxis, handLength * 0.02));
  const indexTip = add(add(wrist, scale(handAxis, handLength * 0.94)), scale(outer, fingerHalf * 0.56));
  const middleTip = add(add(wrist, scale(handAxis, handLength * 1.16)), scale(outer, fingerHalf * 0.14));
  const ringTip = add(add(wrist, scale(handAxis, handLength * 1.1)), scale(inner, fingerHalf * 0.22));
  const pinkyTip = add(add(wrist, scale(handAxis, handLength * 0.98)), scale(inner, fingerHalf * 0.62));
  const fingerOuter = add(fingerCenter, scale(outer, fingerHalf));
  const indexValley = add(add(wrist, scale(handAxis, handLength * 0.88)), scale(outer, fingerHalf * 0.16));
  const middleValley = add(add(wrist, scale(handAxis, handLength * 0.96)), scale(inner, fingerHalf * 0.02));
  const ringValley = add(add(wrist, scale(handAxis, handLength * 0.9)), scale(inner, fingerHalf * 0.38));
  const palmInner = add(palmCenter, scale(inner, palmHalf));

  const path = [
    `M${pointPath(wristOuter)}`,
    `C${pointPath(add(wristOuter, scale(handAxis, handLength * 0.24)))} ${pointPath(add(thumbTip, scale(handAxis, -handLength * 0.18)))} ${pointPath(thumbTip)}`,
    `C${pointPath(add(thumbTip, scale(handAxis, handLength * 0.16)))} ${pointPath(add(fingerOuter, scale(handAxis, -handLength * 0.18)))} ${pointPath(fingerOuter)}`,
    `L${pointPath(indexTip)}`,
    `Q${pointPath(indexValley)} ${pointPath(middleTip)}`,
    `Q${pointPath(middleValley)} ${pointPath(ringTip)}`,
    `Q${pointPath(ringValley)} ${pointPath(pinkyTip)}`,
    `C${pointPath(add(pinkyTip, scale(handAxis, -handLength * 0.12)))} ${pointPath(add(palmInner, scale(handAxis, handLength * 0.18)))} ${pointPath(palmInner)}`,
    `C${pointPath(add(palmInner, scale(handAxis, -handLength * 0.24)))} ${pointPath(add(wristInner, scale(handAxis, handLength * 0.18)))} ${pointPath(wristInner)}`,
    `Q${pointPath(add(wrist, scale(handAxis, -handLength * 0.04)))} ${pointPath(wristOuter)} Z`,
  ].join(' ');

  return {
    path,
    bounds: boundsForPoints([
      wristOuter,
      wristInner,
      thumbTip,
      fingerOuter,
      indexTip,
      middleTip,
      ringTip,
      pinkyTip,
      palmInner,
    ]),
  };
}

function buildFootTerminalPath(
  pose: ScreenPoseLandmarks,
  ankleLm: LM,
  heelLm: LM,
  toeLm: LM,
  kneeLm: LM,
  bodyScale: number
): { path: string; bounds: Bounds } {
  const ankle = pointFor(pose, ankleLm);
  const knee = pointFor(pose, kneeLm);
  if (!pointFinite(ankle) || !pointFinite(knee)) {
    return { path: '', bounds: emptyBounds() };
  }

  const legAxis = normalize({ x: ankle.x - knee.x, y: ankle.y - knee.y });
  const heel = pointFor(pose, heelLm);
  const toe = pointFor(pose, toeLm);
  const hasFootDirection =
    pointFinite(heel) &&
    pointFinite(toe) &&
    landmarkConfidence(pose, heelLm) >= MIN_RENDER_CONFIDENCE &&
    landmarkConfidence(pose, toeLm) >= MIN_RENDER_CONFIDENCE &&
    distance(heel, toe) > 1;
  const footAxis = hasFootDirection
    ? normalize({ x: toe.x - heel.x, y: toe.y - heel.y })
    : legAxis;
  const footLength = clamp(
    hasFootDirection ? distance(ankle, toe) + bodyScale * 0.02 : bodyScale * 0.18,
    bodyScale * 0.14,
    bodyScale * 0.24
  );
  const normal = { x: -footAxis.y, y: footAxis.x };
  const ankleHalf = bodyScale * 0.052;
  const instepHalf = bodyScale * 0.082;
  const toeHalf = bodyScale * 0.13;
  const ankleOuter = add(ankle, scale(normal, ankleHalf));
  const ankleInner = add(ankle, scale(normal, -ankleHalf));
  const instep = add(ankle, scale(footAxis, footLength * 0.45));
  const toeCenter = add(ankle, scale(footAxis, footLength));
  const toeTip = add(ankle, scale(footAxis, footLength * 1.02));
  const outerInstep = add(instep, scale(normal, instepHalf));
  const innerInstep = add(instep, scale(normal, -instepHalf * 0.84));
  const toeOuter = add(toeCenter, scale(normal, toeHalf));
  const toeInner = add(toeCenter, scale(normal, -toeHalf * 0.82));

  const path = [
    `M${pointPath(ankleOuter)}`,
    `C${pointPath(add(ankleOuter, scale(footAxis, footLength * 0.16)))} ${pointPath(add(outerInstep, scale(footAxis, -footLength * 0.12)))} ${pointPath(outerInstep)}`,
    `C${pointPath(add(outerInstep, scale(footAxis, footLength * 0.18)))} ${pointPath(add(toeOuter, scale(footAxis, -footLength * 0.12)))} ${pointPath(toeOuter)}`,
    `C${pointPath(add(toeOuter, scale(footAxis, footLength * 0.08)))} ${pointPath(add(toeInner, scale(footAxis, footLength * 0.08)))} ${pointPath(toeInner)}`,
    `C${pointPath(add(toeInner, scale(footAxis, -footLength * 0.14)))} ${pointPath(add(innerInstep, scale(footAxis, footLength * 0.14)))} ${pointPath(innerInstep)}`,
    `C${pointPath(add(innerInstep, scale(footAxis, -footLength * 0.18)))} ${pointPath(add(ankleInner, scale(footAxis, footLength * 0.14)))} ${pointPath(ankleInner)}`,
    `Q${pointPath(add(ankle, scale(legAxis, -bodyScale * 0.018)))} ${pointPath(ankleOuter)} Z`,
  ].join(' ');

  return {
    path,
    bounds: boundsForPoints([
      ankleOuter,
      ankleInner,
      outerInstep,
      innerInstep,
      toeOuter,
      toeInner,
      toeTip,
    ]),
  };
}

function buildTonalOverlays(
  pose: ScreenPoseLandmarks,
  proportions: RiggedHumanSilhouetteProportions,
  central: ReturnType<typeof buildCentralShell>,
  orientation: RiggedHumanSilhouetteOrientation
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
  const highlightWidth = proportions.bodyScale * blend(0.13, 0.07, orientation.factor);
  const highlightTop = add(
    add(shoulderMid, scale(axis, torsoLength * 0.18)),
    scale(sideAxis, -highlightWidth * 0.8)
  );
  const highlightMid = add(
    add(shoulderMid, scale(axis, torsoLength * 0.44)),
    scale(sideAxis, -highlightWidth * 0.35)
  );
  const highlightBottom = add(
    add(hipMid, scale(axis, torsoLength * 0.02)),
    scale(sideAxis, highlightWidth * 0.1)
  );
  const highlightPath = [
    `M${pointPath(highlightTop)}`,
    `C${pointPath(add(highlightTop, scale(axis, torsoLength * 0.16)))} ${pointPath(add(highlightMid, scale(axis, -torsoLength * 0.1)))} ${pointPath(highlightMid)}`,
    `C${pointPath(add(highlightMid, scale(axis, torsoLength * 0.1)))} ${pointPath(add(highlightBottom, scale(axis, -torsoLength * 0.08)))} ${pointPath(highlightBottom)}`,
    `C${pointPath(add(highlightBottom, scale(sideAxis, highlightWidth)))} ${pointPath(add(highlightTop, scale(sideAxis, highlightWidth)))} ${pointPath(highlightTop)} Z`,
  ].join(' ');

  const shadeWidth = proportions.bodyScale * blend(0.16, 0.08, orientation.factor);
  const shadeTop = add(
    add(shoulderMid, scale(axis, torsoLength * 0.1)),
    scale(sideAxis, proportions.bodyScale * blend(0.28, 0.12, orientation.factor))
  );
  const shadeBottom = add(
    add(hipMid, scale(axis, torsoLength * 0.08)),
    scale(sideAxis, proportions.bodyScale * blend(0.18, 0.08, orientation.factor))
  );
  const shadeInnerTop = add(shadeTop, scale(sideAxis, -shadeWidth));
  const shadeInnerBottom = add(shadeBottom, scale(sideAxis, -shadeWidth * 0.74));
  const shadePath = [
    `M${pointPath(shadeTop)}`,
    `C${pointPath(add(shadeTop, scale(axis, torsoLength * 0.25)))} ${pointPath(add(shadeBottom, scale(axis, -torsoLength * 0.08)))} ${pointPath(shadeBottom)}`,
    `L${pointPath(shadeInnerBottom)}`,
    `C${pointPath(add(shadeInnerBottom, scale(axis, -torsoLength * 0.1)))} ${pointPath(add(shadeInnerTop, scale(axis, torsoLength * 0.18)))} ${pointPath(shadeInnerTop)} Z`,
  ].join(' ');

  void pose;
  return {
    highlightPath,
    highlightBounds: boundsForPoints([highlightTop, highlightMid, highlightBottom]),
    shadePath,
    shadeBounds: boundsForPoints([shadeTop, shadeBottom, shadeInnerTop, shadeInnerBottom]),
    accentPath: '',
    accentBounds: emptyBounds(),
  };
}

function updateCalibration(
  calibration: RiggedHumanSilhouetteCalibration,
  sample: ProportionSample | null
): void {
  if (calibration.locked || sample === null) return;
  calibration.samples.push(sample);
  calibration.proportions = medianProportions(calibration.samples);
  if (calibration.samples.length >= RIGGED_HUMAN_SILHOUETTE_CALIBRATION_SAMPLE_TARGET) {
    calibration.locked = true;
  }
}

function resolveProportions(
  calibration: RiggedHumanSilhouetteCalibration,
  sample: ProportionSample | null
): RiggedHumanSilhouetteProportions {
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

function medianProportions(samples: readonly ProportionSample[]): RiggedHumanSilhouetteProportions {
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
  proportions: RiggedHumanSilhouetteProportions
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

function applyLimb(out: RiggedHumanSilhouetteGeometry, model: LimbModel): void {
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
  out: RiggedHumanSilhouetteGeometry,
  id: RiggedHumanSilhouetteSurfaceId,
  path: string,
  fill: string,
  opacity: number,
  confidence: number,
  bounds: Bounds
): void {
  const surface = getRiggedHumanSilhouetteSurface(out, id);
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

function cleanCenterline(points: readonly Point[]): { valid: boolean; points: Point[] } {
  const cleaned = points.map((point) => ({ ...point }));
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

function closedSmoothPath(points: readonly Point[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) return `${smoothPath(points)} Z`;
  const parts = [`M${pointPath(points[0])}`];
  const count = points.length;
  for (let i = 0; i < count; i++) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];
    const c1 = add(p1, scale({ x: p2.x - p0.x, y: p2.y - p0.y }, 1 / 6));
    const c2 = add(p2, scale({ x: p1.x - p3.x, y: p1.y - p3.y }, 1 / 6));
    parts.push(`C${pointPath(c1)} ${pointPath(c2)} ${pointPath(p2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
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
    fill: RIGGED_HUMAN_SILHOUETTE_COLORS.primaryGraphite,
    opacity: 0,
    confidence: 0,
    bounds: emptyBounds(),
    visible: false,
    headAttached: false,
    fullBodyEnvelope: false,
    anchors: {
      shoulderMid: zero,
      hipMid: zero,
      axis: { x: 0, y: 1 },
      sideAxis: { x: 1, y: 0 },
      neckCenter: zero,
      headCenter: zero,
      torsoLength: 0,
      shoulderHalf: 0,
      hipHalf: 0,
    },
  };
}

function emptyLimb(surface: RiggedHumanSilhouetteSurfaceId): LimbModel {
  return {
    surface,
    confidence: 0,
    visible: false,
    continuous: false,
    jointContinuous: false,
    path: '',
    bounds: emptyBounds(),
    fill: RIGGED_HUMAN_SILHOUETTE_COLORS.lowConfidenceGraphite,
    opacity: 0,
  };
}

function emptyContinuity(): RiggedHumanSilhouetteContinuity {
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
  return add(add(fallback, scale(axis, clamp(along, -ry * 0.34, ry * 0.42))), scale(sideAxis, clamp(side, -rx * 0.46, rx * 0.46)));
}

function fillForConfidence(confidence: number, minConfidence: number, baseFill: string): string {
  return confidence >= minConfidence ? baseFill : RIGGED_HUMAN_SILHOUETTE_COLORS.lowConfidenceGraphite;
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

function interpolatePoint(a: Point, b: Point, amount: number): Point {
  return {
    x: blend(a.x, b.x, amount),
    y: blend(a.y, b.y, amount),
  };
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
