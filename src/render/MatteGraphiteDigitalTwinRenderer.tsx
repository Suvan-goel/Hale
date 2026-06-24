import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import { copyPoseFrame, createPoseFrame, type PoseFrame } from '../pose/types';
import { createLatestFrameRafScheduler } from './latestFrameRafScheduler';
import {
  MATTE_GRAPHITE_DIGITAL_TWIN_BODY_GRADIENT_ID,
  MATTE_GRAPHITE_DIGITAL_TWIN_COLORS,
  MATTE_GRAPHITE_DIGITAL_TWIN_HIGHLIGHT_GRADIENT_ID,
  MATTE_GRAPHITE_DIGITAL_TWIN_REAR_GRADIENT_ID,
} from './matteGraphiteDigitalTwinConfig';
import {
  buildMatteGraphiteDigitalTwinGeometry,
  createMatteGraphiteDigitalTwinCalibration,
  createMatteGraphiteDigitalTwinGeometry,
  type MatteGraphiteDigitalTwinSurface,
} from './matteGraphiteDigitalTwinGeometry';
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

interface MatteGraphiteRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface MatteGraphiteRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface MatteGraphiteSurfaceRenderState {
  id: MatteGraphiteDigitalTwinSurface['id'];
  path: string;
  fill: string;
  opacity: number;
  visible: boolean;
}

interface MatteGraphiteRenderState {
  opacity: number;
  surfacePathCount: number;
  dynamicPathCount: number;
  internalControlVertexCount: number;
  proportionCalibrationComplete: boolean;
  calibrationState: string;
  surfaces: MatteGraphiteSurfaceRenderState[];
}

const EMPTY_D = 'M-9-9';

const EMPTY_STATE: MatteGraphiteRenderState = {
  opacity: 1,
  surfacePathCount: 0,
  dynamicPathCount: 0,
  internalControlVertexCount: 0,
  proportionCalibrationComplete: false,
  calibrationState: 'fallback',
  surfaces: [],
};

export const MatteGraphiteDigitalTwinRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function MatteGraphiteDigitalTwinRenderer(
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
  const geometry = React.useRef(createMatteGraphiteDigitalTwinGeometry());
  const calibration = React.useRef(createMatteGraphiteDigitalTwinCalibration());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createMatteGraphiteRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<MatteGraphiteRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] = React.useState<MatteGraphiteRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<MatteGraphiteRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyMatteGraphiteRenderSnapshot(
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
            mode: 'matte_graphite_digital_twin',
            frameTimestampMs: event.order,
          });
        }
      },
    });
  }

  const dimFigureForTrackingLoss = React.useCallback(() => {
    renderScheduler.current?.cancel();
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
    buildMatteGraphiteDigitalTwinGeometry(screenPose.current, geometry.current, {
      minConfidence,
      calibration: calibration.current,
    });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotMatteGraphiteRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'matte_graphite_digital_twin',
      frameTimestampMs: order,
      geometryMs,
      dotCount: 0,
      lineCount: 0,
      shapeCount: geometry.current.surfacePathCount,
      dynamicPathCount: geometry.current.dynamicPathCount,
      staticTransformedShapeCount: 0,
      surfacePathCount: geometry.current.surfacePathCount,
      internalControlVertexCount: geometry.current.internalControlVertexCount,
      proportionCalibrationComplete: geometry.current.proportionCalibrationComplete,
      proportionCalibrationState: geometry.current.calibrationState,
    });

    maybeLogPoseAvatarPerformance(
      perf.current,
      {
        timestampMs: frame.timestampMs,
        mode: 'matte_graphite_digital_twin',
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
              id={MATTE_GRAPHITE_DIGITAL_TWIN_BODY_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.softGraphiteHighlight} />
              <Stop offset="0.45" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.primaryGraphite} />
              <Stop offset="1" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.deepGraphite} />
            </LinearGradient>
            <LinearGradient
              id={MATTE_GRAPHITE_DIGITAL_TWIN_REAR_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.farSideGraphite} />
              <Stop offset="1" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.deepGraphite} />
            </LinearGradient>
            <LinearGradient
              id={MATTE_GRAPHITE_DIGITAL_TWIN_HIGHLIGHT_GRADIENT_ID}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <Stop offset="0" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.softGraphiteHighlight} />
              <Stop offset="1" stopColor={MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.midGraphite} />
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

function snapshotMatteGraphiteRenderState(
  source: ReturnType<typeof createMatteGraphiteDigitalTwinGeometry>
): MatteGraphiteRenderState {
  return {
    opacity: source.opacity,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    internalControlVertexCount: source.internalControlVertexCount,
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

function createMatteGraphiteRenderSnapshot(): MatteGraphiteRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyMatteGraphiteRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: MatteGraphiteRenderSnapshot
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
    borderColor: MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.cardBorder,
    borderRadius: 8,
    backgroundColor: MATTE_GRAPHITE_DIGITAL_TWIN_COLORS.cardBackground,
  },
});
