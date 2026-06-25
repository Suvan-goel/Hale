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
  | 'sternumAccent';

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
  drawOrderKey: 'deterministic-right-rear-left-front';
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
  'rightLeg',
  'centralShell',
  'leftLeg',
  'leftArm',
  'torsoHighlight',
  'sideShade',
  'sternumAccent',
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
    drawOrderKey: 'deterministic-right-rear-left-front',
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

  const rightArm = buildArmSurface(pose, 'rightArm', out.proportions, minConfidence, orientation);
  const rightLeg = buildLegSurface(pose, 'rightLeg', out.proportions, minConfidence, orientation);
  const leftLeg = buildLegSurface(pose, 'leftLeg', out.proportions, minConfidence, orientation);
  const leftArm = buildArmSurface(pose, 'leftArm', out.proportions, minConfidence, orientation);

  applyLimb(out, rightArm);
  applyLimb(out, rightLeg);
  applyLimb(out, leftLeg);
  applyLimb(out, leftArm);

  const overlays = buildTonalOverlays(pose, out.proportions, central, orientation);
  setSurface(
    out,
    'torsoHighlight',
    overlays.highlightPath,
    `url(#${RIGGED_HUMAN_SILHOUETTE_HIGHLIGHT_GRADIENT_ID})`,
    overlays.highlightPath ? 0.34 : 0,
    central.confidence,
    overlays.highlightBounds
  );
  setSurface(
    out,
    'sideShade',
    overlays.shadePath,
    RIGGED_HUMAN_SILHOUETTE_COLORS.deepGraphite,
    overlays.shadePath ? 0.22 : 0,
    central.confidence,
    overlays.shadeBounds
  );
  setSurface(
    out,
    'sternumAccent',
    overlays.accentPath,
    RIGGED_HUMAN_SILHOUETTE_COLORS.softGraphiteHighlight,
    overlays.accentPath ? 0.48 : 0,
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
    proportions.shoulderWidth * 0.58 * widthCompression,
    proportions.bodyScale * 0.2,
    proportions.bodyScale * 0.9
  );
  const hipHalf = clamp(
    proportions.hipWidth * 0.62 * widthCompression,
    proportions.bodyScale * 0.16,
    shoulderHalf * 0.92
  );
  const waistHalf = clamp((shoulderHalf + hipHalf) * 0.43, proportions.bodyScale * 0.24, shoulderHalf * 0.72);
  const neckHalf = clamp(proportions.headRx * 0.34, proportions.bodyScale * 0.12, proportions.bodyScale * 0.22);
  const head = getHeadEstimate(pose, MIN_RENDER_CONFIDENCE);
  const headRx = clamp(
    (head ? blend(proportions.headRx, head.rx, 0.18) : proportions.headRx) *
      blend(1, 0.66, orientation.factor),
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
    fill: `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`,
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
      torsoLength,
      shoulderHalf,
      hipHalf,
    },
  };
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
  const baseFill = left
    ? `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`
    : `url(#${RIGGED_HUMAN_SILHOUETTE_REAR_GRADIENT_ID})`;
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
  const widthCompression = blend(1, 0.72, orientation.factor);
  const widths: [number, number, number, number] = [
    clamp(proportions.bodyScale * 0.2 * widthCompression, 7, 25),
    clamp(proportions.bodyScale * 0.17 * widthCompression, 6, 22),
    clamp(proportions.bodyScale * 0.12 * widthCompression, 5, 17),
    clamp(proportions.bodyScale * 0.07 * widthCompression, 3, 12),
  ];
  return buildLimbModel(side, [p0, p1, p2, hand.point], widths, confidence, minConfidence, baseFill);
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
  const baseFill = left
    ? `url(#${RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID})`
    : `url(#${RIGGED_HUMAN_SILHOUETTE_REAR_GRADIENT_ID})`;
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
  const widthCompression = blend(1, 0.76, orientation.factor);
  const widths: [number, number, number, number] = [
    clamp(proportions.bodyScale * 0.26 * widthCompression, 10, 32),
    clamp(proportions.bodyScale * 0.2 * widthCompression, 8, 26),
    clamp(proportions.bodyScale * 0.13 * widthCompression, 6, 18),
    clamp(proportions.bodyScale * 0.1 * widthCompression, 5, 16),
  ];
  return buildLimbModel(side, [p0, p1, p2, footTip.point], widths, confidence, minConfidence, baseFill);
}

function buildLimbModel(
  surface: RiggedHumanSilhouetteSurfaceId,
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
  return add(add(fallback, scale(axis, clamp(along, -ry * 0.42, ry * 0.42))), scale(sideAxis, clamp(side, -rx * 0.58, rx * 0.58)));
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
