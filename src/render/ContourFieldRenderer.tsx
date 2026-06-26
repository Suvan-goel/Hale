import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import { copyPoseFrame, createPoseFrame, type PoseFrame } from '../pose/types';
import { colors } from '../theme';
import {
  buildContourFieldGeometry,
  createContourFieldGeometry,
} from './contourFieldGeometry';
import { createLatestFrameRafScheduler } from './latestFrameRafScheduler';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
} from './poseCoordinateMapper';
import {
  createPoseAvatarPerformanceState,
  markPoseAvatarUpdate,
  maybeLogPoseAvatarPerformance,
} from './poseAvatarPerformance';
import type { PoseAvatarRendererHandle, PoseAvatarRendererProps } from './poseAvatarTypes';

interface ContourFieldRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface ContourFieldRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface ContourFieldRenderState {
  opacity: number;
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
}

const EMPTY_D = 'M-9-9';
const EMPTY_STATE: ContourFieldRenderState = {
  opacity: 0,
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
};

export const ContourFieldRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function ContourFieldRenderer(
  {
    mirrored = true,
    fit = 'contain',
    minConfidence = 0.35,
    frameSource = 'raw',
    lowLatencyMode = true,
    debug = false,
    measurementState,
    activeDomain = null,
    trackingQuality = 'high',
    onRendererScheduleEvent,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const geometry = React.useRef(createContourFieldGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createContourFieldRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<ContourFieldRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] = React.useState<ContourFieldRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<ContourFieldRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyContourFieldRenderSnapshot(
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
            mode: 'contour_field',
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
        opacity: current.shapeCount > 0 ? 0.2 : 0,
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
    buildContourFieldGeometry(screenPose.current, geometry.current, { minConfidence });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotContourFieldRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'contour_field',
      frameTimestampMs: order,
      geometryMs,
      dotCount: geometry.current.particleCount,
      lineCount: geometry.current.lineCount,
      shapeCount: geometry.current.shapeCount,
      dynamicPathCount: geometry.current.dynamicPathCount,
      staticTransformedShapeCount: 0,
      surfacePathCount: geometry.current.surfacePathCount,
      internalControlVertexCount: 0,
      virtualBoneCount: 0,
    });

    maybeLogPoseAvatarPerformance(
      perf.current,
      {
        timestampMs: frame.timestampMs,
        mode: 'contour_field',
        frameSource,
        dotCount: geometry.current.particleCount,
        lineCount: geometry.current.lineCount,
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
        volumeDotCount: geometry.current.shapeCount,
        lowLatencyMode,
        confidenceFadingEnabled: false,
        confidenceIntensityEnabled: false,
        reacquisitionFadeEnabled: false,
        recognitionPulseEnabled: false,
        confidenceAnimationStrength: 'off',
        measurementState: measurementState ?? 'default',
        activeDomain,
        trackingQuality: geometry.current.hasPose ? trackingQuality : 'none',
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
        skippedLandmarks: geometry.current.skippedPartCount,
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
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        sizeRef.current = {
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        };
      }}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Path
          d={renderState.softLinePath || EMPTY_D}
          fill="none"
          stroke={colors.textSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.24 * renderState.opacity}
          strokeWidth={0.58}
        />
        <Path
          d={renderState.primaryLinePath || EMPTY_D}
          fill="none"
          stroke={colors.sageDeep}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.68 * renderState.opacity}
          strokeWidth={0.78}
        />
        <Path
          d={renderState.accentLinePath || EMPTY_D}
          fill="none"
          stroke={colors.accentGold}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.26 * renderState.opacity}
          strokeWidth={0.56}
        />
        <Path
          d={renderState.particlePath || EMPTY_D}
          fill={colors.sageDeep}
          fillOpacity={0.34 * renderState.opacity}
        />
      </Svg>
    </View>
  );
});

function snapshotContourFieldRenderState(
  source: ReturnType<typeof createContourFieldGeometry>
): ContourFieldRenderState {
  return {
    opacity: source.opacity,
    primaryLinePath: source.primaryLinePath,
    softLinePath: source.softLinePath,
    accentLinePath: source.accentLinePath,
    particlePath: source.particlePath,
    lineCount: source.lineCount,
    particleCount: source.particleCount,
    shapeCount: source.shapeCount,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    skippedPartCount: source.skippedPartCount,
  };
}

function createContourFieldRenderSnapshot(): ContourFieldRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyContourFieldRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: ContourFieldRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
