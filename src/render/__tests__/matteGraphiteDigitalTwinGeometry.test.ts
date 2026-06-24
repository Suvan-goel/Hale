import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { createPoseFrame, LM, parseLandmarkEvent } from '../../pose/types';
import {
  MATTE_GRAPHITE_DIGITAL_TWIN_CALIBRATION_SAMPLE_TARGET,
  MATTE_GRAPHITE_DIGITAL_TWIN_COLORS,
  MATTE_GRAPHITE_DIGITAL_TWIN_INTERNAL_CONTROL_VERTEX_COUNT,
  MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP,
} from '../matteGraphiteDigitalTwinConfig';
import {
  buildMatteGraphiteDigitalTwinGeometry,
  createMatteGraphiteDigitalTwinCalibration,
  createMatteGraphiteDigitalTwinGeometry,
  getMatteGraphiteDigitalTwinSurface,
  isFiniteMatteGraphiteDigitalTwinGeometry,
  resetMatteGraphiteDigitalTwinCalibration,
} from '../matteGraphiteDigitalTwinGeometry';
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

function centerX(surface: ReturnType<typeof getMatteGraphiteDigitalTwinSurface>): number {
  return (surface.bounds.minX + surface.bounds.maxX) * 0.5;
}

function visiblePaths(out: ReturnType<typeof createMatteGraphiteDigitalTwinGeometry>): string[] {
  return out.surfaces.filter((surface) => surface.visible).map((surface) => surface.path);
}

describe('matte graphite digital twin geometry', () => {
  it('builds finite continuous low-complexity surfaces for neutral standing', () => {
    const out = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(), out);

    expect(isFiniteMatteGraphiteDigitalTwinGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBeLessThanOrEqual(MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP);
    expect(out.dynamicPathCount).toBe(out.surfacePathCount);
    expect(out.internalControlVertexCount).toBe(
      MATTE_GRAPHITE_DIGITAL_TWIN_INTERNAL_CONTROL_VERTEX_COUNT
    );
    expect(getMatteGraphiteDigitalTwinSurface(out, 'centralShell').path).toContain('C');
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
    const out = createMatteGraphiteDigitalTwinGeometry();
    const surfaceSlots = out.surfaces;
    const centralSlot = getMatteGraphiteDigitalTwinSurface(out, 'centralShell');

    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(), out);
    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(), out);

    expect(out.surfaces).toBe(surfaceSlots);
    expect(getMatteGraphiteDigitalTwinSurface(out, 'centralShell')).toBe(centralSlot);
    expect(out.surfaces).toHaveLength(MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP);
    expect(out.internalControlVertexCount).toBe(
      MATTE_GRAPHITE_DIGITAL_TWIN_INTERNAL_CONTROL_VERTEX_COUNT
    );
  });

  it('uses fallback proportions, locks calibration, and resets calibration explicitly', () => {
    const calibration = createMatteGraphiteDigitalTwinCalibration();
    const out = createMatteGraphiteDigitalTwinGeometry();
    const pose = mappedStandingPose();

    buildMatteGraphiteDigitalTwinGeometry(pose, out, { calibration });
    expect(out.calibrationState).toBe('collecting');
    expect(out.proportionCalibrationComplete).toBe(false);

    for (let i = 1; i < MATTE_GRAPHITE_DIGITAL_TWIN_CALIBRATION_SAMPLE_TARGET; i++) {
      buildMatteGraphiteDigitalTwinGeometry(pose, out, { calibration });
    }
    expect(out.calibrationState).toBe('locked');
    expect(out.proportionCalibrationComplete).toBe(true);
    const lockedShoulderWidth = out.proportions.shoulderWidth;

    const distorted = mappedStandingPose();
    distorted.xs[LM.LEFT_SHOULDER] += 40;
    distorted.xs[LM.RIGHT_SHOULDER] -= 40;
    buildMatteGraphiteDigitalTwinGeometry(distorted, out, { calibration });
    expect(out.proportions.shoulderWidth).toBeCloseTo(lockedShoulderWidth, 5);

    resetMatteGraphiteDigitalTwinCalibration(calibration);
    buildMatteGraphiteDigitalTwinGeometry(distorted, out, { calibration });
    expect(out.calibrationState).toBe('collecting');
    expect(out.proportionCalibrationComplete).toBe(false);
  });

  it('keeps the head attached when face landmarks are missing', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR]) {
      pose.visibility[lm] = 0.02;
      pose.presence[lm] = 0.02;
    }
    const out = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(pose, out);

    expect(isFiniteMatteGraphiteDigitalTwinGeometry(out)).toBe(true);
    expect(getMatteGraphiteDigitalTwinSurface(out, 'centralShell').visible).toBe(true);
    expect(out.continuity.headAttached).toBe(true);
  });

  it('uses integrated hand and foot fallbacks when terminal landmarks are missing', () => {
    const pose = mappedStandingPose();
    for (const lm of [LM.LEFT_INDEX, LM.RIGHT_INDEX, LM.LEFT_FOOT_INDEX, LM.RIGHT_FOOT_INDEX]) {
      pose.visibility[lm] = 0.02;
      pose.presence[lm] = 0.02;
    }
    const out = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(pose, out);

    expect(getMatteGraphiteDigitalTwinSurface(out, 'leftArm').visible).toBe(true);
    expect(getMatteGraphiteDigitalTwinSurface(out, 'rightArm').visible).toBe(true);
    expect(getMatteGraphiteDigitalTwinSurface(out, 'leftLeg').visible).toBe(true);
    expect(getMatteGraphiteDigitalTwinSurface(out, 'rightLeg').visible).toBe(true);
    expect(isFiniteMatteGraphiteDigitalTwinGeometry(out)).toBe(true);
  });

  it('styles low-confidence limbs conservatively and hides unusable limbs', () => {
    const pose = mappedStandingPose();
    pose.visibility[LM.LEFT_ELBOW] = 0.22;
    pose.presence[LM.LEFT_ELBOW] = 0.22;
    pose.visibility[LM.RIGHT_ELBOW] = 0.05;
    pose.presence[LM.RIGHT_ELBOW] = 0.05;
    const out = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(pose, out);

    expect(getMatteGraphiteDigitalTwinSurface(out, 'leftArm').visible).toBe(true);
    expect(getMatteGraphiteDigitalTwinSurface(out, 'leftArm').fill).toBe(
      MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.lowConfidenceGraphite
    );
    expect(getMatteGraphiteDigitalTwinSurface(out, 'rightArm').visible).toBe(false);
  });

  it('keeps zero-length bone segments finite', () => {
    const pose = mappedStandingPose();
    pose.xs[LM.LEFT_WRIST] = pose.xs[LM.LEFT_ELBOW];
    pose.ys[LM.LEFT_WRIST] = pose.ys[LM.LEFT_ELBOW];
    pose.xs[LM.RIGHT_KNEE] = pose.xs[LM.RIGHT_HIP];
    pose.ys[LM.RIGHT_KNEE] = pose.ys[LM.RIGHT_HIP];
    const out = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(pose, out);

    expect(isFiniteMatteGraphiteDigitalTwinGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBeLessThanOrEqual(MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP);
  });

  it('inherits front-camera mirroring from the coordinate mapper', () => {
    const normal = createMatteGraphiteDigitalTwinGeometry();
    const mirrored = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(false), normal);
    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(true), mirrored);

    expect(centerX(getMatteGraphiteDigitalTwinSurface(normal, 'leftArm'))).toBeGreaterThan(
      centerX(getMatteGraphiteDigitalTwinSurface(normal, 'rightArm'))
    );
    expect(centerX(getMatteGraphiteDigitalTwinSurface(mirrored, 'leftArm'))).toBeLessThan(
      centerX(getMatteGraphiteDigitalTwinSurface(mirrored, 'rightArm'))
    );
  });

  it('keeps upright coordinate assumptions finite for portrait and rotated source aspects', () => {
    for (const sourceAspect of [480 / 640, 640 / 480]) {
      const out = createMatteGraphiteDigitalTwinGeometry();
      buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(false, sourceAspect), out);
      expect(isFiniteMatteGraphiteDigitalTwinGeometry(out)).toBe(true);
      expect(out.bounds.maxY).toBeGreaterThan(out.bounds.minY);
    }
  });

  it('is deterministic for deterministic input and keeps stable draw ordering', () => {
    const first = createMatteGraphiteDigitalTwinGeometry();
    const second = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(), first);
    buildMatteGraphiteDigitalTwinGeometry(mappedStandingPose(), second);

    expect(visiblePaths(first)).toEqual(visiblePaths(second));
    expect(first.drawOrderKey).toBe('deterministic-right-rear-left-front');
    expect(second.drawOrderKey).toBe(first.drawOrderKey);
  });

  it('handles crossed arms without unbounded path growth', () => {
    const pose = mappedStandingPose();
    pose.xs[LM.LEFT_WRIST] = pose.xs[LM.RIGHT_HIP];
    pose.ys[LM.LEFT_WRIST] = pose.ys[LM.RIGHT_HIP];
    pose.xs[LM.RIGHT_WRIST] = pose.xs[LM.LEFT_HIP];
    pose.ys[LM.RIGHT_WRIST] = pose.ys[LM.LEFT_HIP];
    const out = createMatteGraphiteDigitalTwinGeometry();

    buildMatteGraphiteDigitalTwinGeometry(pose, out);

    expect(isFiniteMatteGraphiteDigitalTwinGeometry(out)).toBe(true);
    expect(out.surfacePathCount).toBeLessThanOrEqual(MATTE_GRAPHITE_DIGITAL_TWIN_SURFACE_PATH_CAP);
  });
});
