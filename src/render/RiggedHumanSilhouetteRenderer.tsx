import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import { copyPoseFrame, createPoseFrame, type PoseFrame } from '../pose/types';
import { createLatestFrameRafScheduler } from './latestFrameRafScheduler';
import {
  RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID,
  RIGGED_HUMAN_SILHOUETTE_COLORS,
  RIGGED_HUMAN_SILHOUETTE_HIGHLIGHT_GRADIENT_ID,
  RIGGED_HUMAN_SILHOUETTE_REAR_GRADIENT_ID,
} from './riggedHumanSilhouetteConfig';
import {
  buildRiggedHumanSilhouetteGeometry,
  createRiggedHumanSilhouetteCalibration,
  createRiggedHumanSilhouetteGeometry,
  createRiggedHumanSilhouetteOrientationState,
  resetRiggedHumanSilhouetteCalibration,
  resetRiggedHumanSilhouetteOrientationState,
  type RiggedHumanSilhouetteSurface,
} from './riggedHumanSilhouetteGeometry';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
} from './poseCoordinateMapper';
import {
  createPoseAvatarPerformanceState,
  markPoseAvatarUpdate,
  maybeLogPoseAvatarPerformance,
} from './poseAvatarPerformance';
import type {
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps,
} from './poseAvatarTypes';

interface RiggedSilhouetteRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface RiggedSilhouetteRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface RiggedSilhouetteSurfaceRenderState {
  id: RiggedHumanSilhouetteSurface['id'];
  path: string;
  fill: string;
  opacity: number;
  visible: boolean;
}

interface RiggedSilhouetteRenderState {
  opacity: number;
  surfacePathCount: number;
  dynamicPathCount: number;
  internalControlVertexCount: number;
  virtualBoneCount: number;
  orientationFactor: number;
  orientationProfile: string;
  proportionCalibrationComplete: boolean;
  calibrationState: string;
  surfaces: RiggedSilhouetteSurfaceRenderState[];
}

const EMPTY_D = 'M-9-9';

const EMPTY_STATE: RiggedSilhouetteRenderState = {
  opacity: 1,
  surfacePathCount: 0,
  dynamicPathCount: 0,
  internalControlVertexCount: 0,
  virtualBoneCount: 0,
  orientationFactor: 0,
  orientationProfile: 'front',
  proportionCalibrationComplete: false,
  calibrationState: 'neutral',
  surfaces: [],
};

export const RiggedHumanSilhouetteRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function RiggedHumanSilhouetteRenderer(
  {
    mirrored = true,
    fit = 'contain',
    minConfidence = 0.35,
    frameSource = 'raw',
    lowLatencyMode = true,
    debug = false,
    onRendererScheduleEvent,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const geometry = React.useRef(createRiggedHumanSilhouetteGeometry());
  const calibration = React.useRef(createRiggedHumanSilhouetteCalibration());
  const orientation = React.useRef(createRiggedHumanSilhouetteOrientationState());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createRiggedSilhouetteRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<RiggedSilhouetteRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] = React.useState<RiggedSilhouetteRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<RiggedSilhouetteRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyRiggedSilhouetteRenderSnapshot(
          input.output,
          input.sourceAspect,
          latestRenderSnapshot.current
        );
      },
      renderLatest: (order) => renderLatestRef.current(order),
      onEvent: (event) => {
        if (
          event.type === 'scheduled' ||
          event.type === 'coalesced' ||
          event.type === 'rejected' ||
          event.type === 'cancelled'
        ) {
          rendererScheduleEventRef.current?.({
            type: event.type,
            mode: 'rigged_human_silhouette',
            frameTimestampMs: event.order,
          });
        }
      },
    });
  }

  const dimFigureForTrackingLoss = React.useCallback(() => {
    renderScheduler.current?.cancel();
    resetRiggedHumanSilhouetteCalibration(calibration.current);
    resetRiggedHumanSilhouetteOrientationState(orientation.current);
    if (visibleRef.current) {
      setRenderState((current) => ({
        ...current,
        opacity: current.surfacePathCount > 0 ? 0.32 : 0,
      }));
    }
  }, []);

  renderLatestRef.current = (order: number | null) => {
    const { width, height } = sizeRef.current;
    const snapshot = latestRenderSnapshot.current;
    const frame = frameSource === 'raw' ? snapshot.rawFrame : snapshot.displayFrame;
    const poseRenderable = frame.hasPose && width > 0 && height > 0 && snapshot.sourceAspect > 0;
    if (!poseRenderable) return;

    const timing = markPoseAvatarUpdate(perf.current, frame.timestampMs, Date.now());
    mapPoseFrameToScreenPose(
      frame,
      { width, height, sourceAspect: snapshot.sourceAspect, mirrored, fit },
      screenPose.current
    );

    const geometryStart = Date.now();
    buildRiggedHumanSilhouetteGeometry(screenPose.current, geometry.current, {
      minConfidence,
      calibration: calibration.current,
      orientationState: orientation.current,
    });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotRiggedSilhouetteRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'rigged_human_silhouette',
      frameTimestampMs: order,
      geometryMs,
      dotCount: 0,
      lineCount: 0,
      shapeCount: geometry.current.surfacePathCount,
      dynamicPathCount: geometry.current.dynamicPathCount,
      staticTransformedShapeCount: 0,
      surfacePathCount: geometry.current.surfacePathCount,
      internalControlVertexCount: geometry.current.internalControlVertexCount,
      virtualBoneCount: geometry.current.virtualBoneCount,
      orientationFactor: geometry.current.orientationFactor,
      orientationProfile: geometry.current.orientationProfile,
      proportionCalibrationComplete: geometry.current.proportionCalibrationComplete,
      proportionCalibrationState: geometry.current.calibrationState,
    });

    maybeLogPoseAvatarPerformance(
      perf.current,
      {
        timestampMs: frame.timestampMs,
        mode: 'rigged_human_silhouette',
        frameSource,
        dotCount: 0,
        lineCount: 0,
        geometryMs: __DEV__ && debug ? geometryMs : 0,
        smoothingEnabled: false,
        smoothingAlpha: 1,
        smoothingAlphaRange: [1, 1],
        adaptiveSmoothingEnabled: false,
        movementSpeedPxPerSec: 0,
        sampledDotsEnabled: false,
        bodyVolumeEnabled: true,
        torsoDotCount: 0,
        headDotCount: 0,
        volumeDotCount: geometry.current.surfacePathCount,
        lowLatencyMode,
        confidenceFadingEnabled: false,
        confidenceIntensityEnabled: false,
        reacquisitionFadeEnabled: false,
        recognitionPulseEnabled: false,
        confidenceAnimationStrength: 'off',
        measurementState: 'default',
        activeDomain: null,
        trackingQuality: geometry.current.hasPose ? 'high' : 'none',
        measurementStatesEnabled: false,
        setupGuidesEnabled: false,
        stateTransitionsEnabled: false,
        domainEmphasisEnabled: false,
        scanLineEnabled: false,
        measurementStateIntensity: 'off',
        setupGuideVisible: false,
        scanLineVisible: false,
        visualCalculationMs: 0,
        visualTrackingState: geometry.current.hasPose ? 'tracking' : 'lost',
        averageConfidence: 1,
        recognitionPulseActive: false,
        skippedLandmarks: 0,
        updateFps: timing.updateFps,
        frameAgeMs: timing.frameAgeMs,
        inferenceMs: snapshot.inferenceMs,
      },
      debug
    );
  };

  React.useImperativeHandle(
    ref,
    () => ({
      update(output: PipelineFrameOutput, sourceAspect: number) {
        const { width, height } = sizeRef.current;
        const frame = frameSource === 'raw' ? output.rawFrame : output.displayFrame;
        const poseRenderable = frame.hasPose && width > 0 && height > 0 && sourceAspect > 0;
        if (!poseRenderable) {
          dimFigureForTrackingLoss();
          return;
        }
        renderScheduler.current?.submit({
          output,
          sourceAspect,
          order: frame.timestampMs,
        });
      },
    }),
    [dimFigureForTrackingLoss, fit, frameSource, minConfidence, mirrored]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={styles.figureCard}
        onLayout={(e) => {
          sizeRef.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient
              id={RIGGED_HUMAN_SILHOUETTE_BODY_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.softGraphiteHighlight} />
              <Stop offset="0.45" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.primaryGraphite} />
              <Stop offset="1" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.deepGraphite} />
            </LinearGradient>
            <LinearGradient
              id={RIGGED_HUMAN_SILHOUETTE_REAR_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.farSideGraphite} />
              <Stop offset="1" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.deepGraphite} />
            </LinearGradient>
            <LinearGradient
              id={RIGGED_HUMAN_SILHOUETTE_HIGHLIGHT_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.softGraphiteHighlight} />
              <Stop offset="1" stopColor={RIGGED_HUMAN_SILHOUETTE_COLORS.midGraphite} />
            </LinearGradient>
          </Defs>
          {renderState.surfaces.map((surface) => (
            <Path
              key={surface.id}
              d={surface.path || EMPTY_D}
              fill={surface.fill}
              opacity={surface.visible ? surface.opacity * renderState.opacity : 0}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
});

function snapshotRiggedSilhouetteRenderState(
  source: ReturnType<typeof createRiggedHumanSilhouetteGeometry>
): RiggedSilhouetteRenderState {
  return {
    opacity: source.opacity,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    internalControlVertexCount: source.internalControlVertexCount,
    virtualBoneCount: source.virtualBoneCount,
    orientationFactor: source.orientationFactor,
    orientationProfile: source.orientationProfile,
    proportionCalibrationComplete: source.proportionCalibrationComplete,
    calibrationState: source.calibrationState,
    surfaces: source.surfaces.map((surface) => ({
      id: surface.id,
      path: surface.path,
      fill: surface.fill,
      opacity: surface.opacity,
      visible: surface.visible,
    })),
  };
}

function createRiggedSilhouetteRenderSnapshot(): RiggedSilhouetteRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyRiggedSilhouetteRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: RiggedSilhouetteRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}

const styles = StyleSheet.create({
  figureCard: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 168,
    bottom: 220,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RIGGED_HUMAN_SILHOUETTE_COLORS.cardBorder,
    borderRadius: 8,
    backgroundColor: RIGGED_HUMAN_SILHOUETTE_COLORS.cardBackground,
  },
});
