import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  RIGGED_HUMAN_SILHOUETTE_CALIBRATION_SAMPLE_TARGET,
  RIGGED_HUMAN_SILHOUETTE_COLORS,
  RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT,
  RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT,
  RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP,
} from '../riggedHumanSilhouetteConfig';
import {
  buildRiggedHumanSilhouetteGeometry,
  createRiggedHumanSilhouetteCalibration,
  createRiggedHumanSilhouetteGeometry,
  createRiggedHumanSilhouetteOrientationState,
  getRiggedHumanSilhouetteSurface,
  RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS,
  RIGGED_HUMAN_SILHOUETTE_SIDE_TEMPLATE_POINTS,
  RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES,
  RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONES,
  isFiniteRiggedHumanSilhouetteGeometry,
  resetRiggedHumanSilhouetteCalibration,
  resetRiggedHumanSilhouetteOrientationState,
  skinRiggedHumanSilhouettePoint,
} from '../riggedHumanSilhouetteGeometry';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
  type ScreenPoseLandmarks,
} from '../poseCoordinateMapper';

const VIEWPORT = {
  width: 390,
  height: 520,
  sourceAspect: 480 / 640,
  mirrored: false,
  fit: 'contain' as const,
};

function mappedStandingPose(mirrored = false, sourceAspect = 480 / 640): ScreenPoseLandmarks {
  const frame = createPoseFrame();
  parseLandmarkEvent(makeFrame(0, mulberry32(912), { noiseAmp: 0 }), frame);
  const pose = createScreenPoseLandmarks();
  mapPoseFrameToScreenPose(frame, { ...VIEWPORT, mirrored, sourceAspect }, pose);
  return pose;
}

function collapseBodyWidth(pose: ScreenPoseLandmarks, factor: number): void {
  for (const [left, right] of [
    [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    [LM.LEFT_HIP, LM.RIGHT_HIP],
  ] as const) {
    const midX = (pose.xs[left] + pose.xs[right]) * 0.5;
    pose.xs[left] = midX + (pose.xs[left] - midX) * factor;
    pose.xs[right] = midX + (pose.xs[right] - midX) * factor;
  }
}

function centerX(surface: ReturnType<typeof getRiggedHumanSilhouetteSurface>): number {
  return (surface.bounds.minX + surface.bounds.maxX) * 0.5;
}

function visiblePaths(out: ReturnType<typeof createRiggedHumanSilhouetteGeometry>): string[] {
  return out.surfaces.filter((surface) => surface.visible).map((surface) => surface.path);
}

describe('rigged human silhouette geometry', () => {
  it('builds finite continuous low-complexity surfaces for neutral standing', () => {
    const out = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(), out);

    expect(isFiniteRiggedHumanSilhouetteGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBeLessThanOrEqual(RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.internalControlVertexCount).toBe(
      RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT
    );
    expect(out.internalControlPoints).toHaveLength(
      RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT
    );
    expect(out.virtualBoneCount).toBe(RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT);
    expect(out.orientationProfile).toBe('front');
    expect(getRiggedHumanSilhouetteSurface(out, 'centralShell').path).toContain('C');
    expect(out.continuity).toMatchObject({
      centralShellContinuous: true,
      headAttached: true,
      leftArmContinuous: true,
      rightArmContinuous: true,
      leftLegContinuous: true,
      rightLegContinuous: true,
      leftArmHasElbow: true,
      rightArmHasElbow: true,
      leftLegHasKnee: true,
      rightLegHasKnee: true,
    });
  });

  it('keeps fixed surface slots and internal topology across repeated builds', () => {
    const out = createRiggedHumanSilhouetteGeometry();
    const surfaceSlots = out.surfaces;
    const centralSlot = getRiggedHumanSilhouetteSurface(out, 'centralShell');

    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(), out);
    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(), out);

    expect(out.surfaces).toBe(surfaceSlots);
    expect(getRiggedHumanSilhouetteSurface(out, 'centralShell')).toBe(centralSlot);
    expect(out.surfaces).toHaveLength(RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP);
    expect(out.internalControlVertexCount).toBe(
      RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT
    );
    expect(out.maxVirtualBoneCount).toBe(RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT);
  });

  it('keeps compatible front and side rest-template topology with bounded influences', () => {
    expect(RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS).toHaveLength(
      RIGGED_HUMAN_SILHOUETTE_INTERNAL_CONTROL_VERTEX_COUNT
    );
    expect(RIGGED_HUMAN_SILHOUETTE_SIDE_TEMPLATE_POINTS).toHaveLength(
      RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS.length
    );
    expect(RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES).toHaveLength(
      RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS.length
    );
    expect(RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONES).toHaveLength(
      RIGGED_HUMAN_SILHOUETTE_VIRTUAL_BONE_COUNT
    );

    for (let i = 0; i < RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES.length; i++) {
      const front = RIGGED_HUMAN_SILHOUETTE_FRONT_TEMPLATE_POINTS[i];
      const side = RIGGED_HUMAN_SILHOUETTE_SIDE_TEMPLATE_POINTS[i];
      expect(Number.isFinite(front.x)).toBe(true);
      expect(Number.isFinite(front.y)).toBe(true);
      expect(Number.isFinite(side.x)).toBe(true);
      expect(Number.isFinite(side.y)).toBe(true);
      expect(RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES[i].length).toBeGreaterThanOrEqual(1);
      expect(RIGGED_HUMAN_SILHOUETTE_TEMPLATE_INFLUENCES[i].length).toBeLessThanOrEqual(2);
    }
  });

  it('skins one- and two-influence points deterministically', () => {
    const transforms = [
      {
        id: 'pelvisRoot' as const,
        origin: { x: 0, y: 0 },
        translation: { x: 2, y: 0 },
        rotationRad: 0,
        scale: 1,
      },
      {
        id: 'lowerSpine' as const,
        origin: { x: 0, y: 0 },
        translation: { x: 0, y: 4 },
        rotationRad: 0,
        scale: 1,
      },
    ];

    expect(
      skinRiggedHumanSilhouettePoint({ x: 1, y: 1 }, [{ boneIndex: 0, weight: 1 }], transforms)
    ).toEqual({ x: 3, y: 1 });
    expect(
      skinRiggedHumanSilhouettePoint(
        { x: 1, y: 1 },
        [
          { boneIndex: 0, weight: 0.25 },
          { boneIndex: 1, weight: 0.75 },
        ],
        transforms
      )
    ).toEqual({ x: 1.5, y: 4 });
  });

  it('uses neutral proportions, locks calibration, and resets calibration explicitly', () => {
    const calibration = createRiggedHumanSilhouetteCalibration();
    const out = createRiggedHumanSilhouetteGeometry();
    const pose = mappedStandingPose();

    buildRiggedHumanSilhouetteGeometry(pose, out, { calibration });
    expect(out.calibrationState).toBe('collecting');
    expect(out.proportionCalibrationComplete).toBe(false);

    for (let i = 1; i < RIGGED_HUMAN_SILHOUETTE_CALIBRATION_SAMPLE_TARGET; i++) {
      buildRiggedHumanSilhouetteGeometry(pose, out, { calibration });
    }
    expect(out.calibrationState).toBe('locked');
    expect(out.proportionCalibrationComplete).toBe(true);
    const lockedShoulderWidth = out.proportions.shoulderWidth;

    const distorted = mappedStandingPose();
    distorted.xs[LM.LEFT_SHOULDER] += 40;
    distorted.xs[LM.RIGHT_SHOULDER] -= 40;
    buildRiggedHumanSilhouetteGeometry(distorted, out, { calibration });
    expect(out.proportions.shoulderWidth).toBeCloseTo(lockedShoulderWidth, 5);

    resetRiggedHumanSilhouetteCalibration(calibration);
    buildRiggedHumanSilhouetteGeometry(distorted, out, { calibration });
    expect(out.calibrationState).toBe('collecting');
    expect(out.proportionCalibrationComplete).toBe(false);
  });

  it('blends front and side orientation with hysteresis and explicit reset', () => {
    const state = createRiggedHumanSilhouetteOrientationState();
    const out = createRiggedHumanSilhouetteGeometry();
    const front = mappedStandingPose();

    buildRiggedHumanSilhouetteGeometry(front, out, { orientationState: state });
    expect(out.orientationProfile).toBe('front');
    const frontFactor = out.orientationFactor;

    const side = mappedStandingPose();
    collapseBodyWidth(side, 0.18);
    for (let i = 0; i < 8; i++) {
      buildRiggedHumanSilhouetteGeometry(side, out, { orientationState: state });
    }
    expect(out.orientationFactor).toBeGreaterThan(frontFactor + 0.35);
    expect(['three-quarter', 'side']).toContain(out.orientationProfile);
    const heldFactor = out.orientationFactor;

    side.xs[LM.LEFT_SHOULDER] += 0.5;
    buildRiggedHumanSilhouetteGeometry(side, out, { orientationState: state });
    expect(Math.abs(out.orientationFactor - heldFactor)).toBeLessThan(0.06);

    resetRiggedHumanSilhouetteOrientationState(state);
    buildRiggedHumanSilhouetteGeometry(front, out, { orientationState: state });
    expect(out.orientationProfile).toBe('front');
  });

  it('keeps the head attached when face landmarks are missing', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR]) {
      pose.visibility[lm] = 0.02;
      pose.presence[lm] = 0.02;
    }
    const out = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(pose, out);

    expect(isFiniteRiggedHumanSilhouetteGeometry(out)).toBe(true);
    expect(getRiggedHumanSilhouetteSurface(out, 'centralShell').visible).toBe(true);
    expect(out.continuity.headAttached).toBe(true);
  });

  it('uses integrated hand and foot fallbacks when terminal landmarks are missing', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.LEFT_INDEX, LM.RIGHT_INDEX, LM.LEFT_FOOT_INDEX, LM.RIGHT_FOOT_INDEX]) {
      pose.visibility[lm] = 0.02;
      pose.presence[lm] = 0.02;
    }
    const out = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(pose, out);

    expect(getRiggedHumanSilhouetteSurface(out, 'leftArm').visible).toBe(true);
    expect(getRiggedHumanSilhouetteSurface(out, 'rightArm').visible).toBe(true);
    expect(getRiggedHumanSilhouetteSurface(out, 'leftLeg').visible).toBe(true);
    expect(getRiggedHumanSilhouetteSurface(out, 'rightLeg').visible).toBe(true);
    expect(isFiniteRiggedHumanSilhouetteGeometry(out)).toBe(true);
  });

  it('styles low-confidence limbs conservatively and hides unusable limbs', () => {
    const pose = mappedStandingPose();
    pose.visibility[LM.LEFT_ELBOW] = 0.22;
    pose.presence[LM.LEFT_ELBOW] = 0.22;
    pose.visibility[LM.RIGHT_ELBOW] = 0.05;
    pose.presence[LM.RIGHT_ELBOW] = 0.05;
    const out = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(pose, out);

    expect(getRiggedHumanSilhouetteSurface(out, 'leftArm').visible).toBe(true);
    expect(getRiggedHumanSilhouetteSurface(out, 'leftArm').fill).toBe(
      RIGGED_HUMAN_SILHOUETTE_COLORS.lowConfidenceGraphite
    );
    expect(getRiggedHumanSilhouetteSurface(out, 'rightArm').visible).toBe(false);
  });

  it('keeps zero-length bone segments finite', () => {
    const pose = mappedStandingPose();
    pose.xs[LM.LEFT_WRIST] = pose.xs[LM.LEFT_ELBOW];
    pose.ys[LM.LEFT_WRIST] = pose.ys[LM.LEFT_ELBOW];
    pose.xs[LM.RIGHT_KNEE] = pose.xs[LM.RIGHT_HIP];
    pose.ys[LM.RIGHT_KNEE] = pose.ys[LM.RIGHT_HIP];
    const out = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(pose, out);

    expect(isFiniteRiggedHumanSilhouetteGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBeLessThanOrEqual(RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP);
  });

  it('inherits front-camera mirroring from the coordinate mapper', () => {
    const normal = createRiggedHumanSilhouetteGeometry();
    const mirrored = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(false), normal);
    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(true), mirrored);

    expect(centerX(getRiggedHumanSilhouetteSurface(normal, 'leftArm'))).toBeGreaterThan(
      centerX(getRiggedHumanSilhouetteSurface(normal, 'rightArm'))
    );
    expect(centerX(getRiggedHumanSilhouetteSurface(mirrored, 'leftArm'))).toBeLessThan(
      centerX(getRiggedHumanSilhouetteSurface(mirrored, 'rightArm'))
    );
  });

  it('keeps upright coordinate assumptions finite for portrait and rotated source aspects', () => {
    for (const sourceAspect of [480 / 640, 640 / 480]) {
      const out = createRiggedHumanSilhouetteGeometry();
      buildRiggedHumanSilhouetteGeometry(mappedStandingPose(false, sourceAspect), out);
      expect(isFiniteRiggedHumanSilhouetteGeometry(out)).toBe(true);
      expect(out.bounds.maxY).toBeGreaterThan(out.bounds.minY);
    }
  });

  it('is deterministic for deterministic input and keeps stable draw ordering', () => {
    const first = createRiggedHumanSilhouetteGeometry();
    const second = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(), first);
    buildRiggedHumanSilhouetteGeometry(mappedStandingPose(), second);

    expect(visiblePaths(first)).toEqual(visiblePaths(second));
    expect(first.drawOrderKey).toBe('deterministic-limbs-under-core');
    expect(second.drawOrderKey).toBe(first.drawOrderKey);
  });

  it('handles crossed arms without unbounded path growth', () => {
    const pose = mappedStandingPose();
    pose.xs[LM.LEFT_WRIST] = pose.xs[LM.RIGHT_HIP];
    pose.ys[LM.LEFT_WRIST] = pose.ys[LM.RIGHT_HIP];
    pose.xs[LM.RIGHT_WRIST] = pose.xs[LM.LEFT_HIP];
    pose.ys[LM.RIGHT_WRIST] = pose.ys[LM.LEFT_HIP];
    const out = createRiggedHumanSilhouetteGeometry();

    buildRiggedHumanSilhouetteGeometry(pose, out);

    expect(isFiniteRiggedHumanSilhouetteGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBeLessThanOrEqual(RIGGED_HUMAN_SILHOUETTE_SURFACE_PATH_CAP);
  });
});
