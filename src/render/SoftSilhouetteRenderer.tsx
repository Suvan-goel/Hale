import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import { copyPoseFrame, createPoseFrame, type PoseFrame } from '../pose/types';
import { colors } from '../theme';
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
import {
  buildSoftSilhouetteGeometry,
  createSoftSilhouetteGeometry,
} from './softSilhouetteGeometry';

interface SoftSilhouetteRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface SoftSilhouetteRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface SoftSilhouetteRenderState {
  opacity: number;
  corePath: string;
  limbPath: string;
  blendPath: string;
  rimPath: string;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
}

const EMPTY_D = 'M-9-9';
const SOFT_SILHOUETTE_GRADIENT_ID = 'haleSoftSilhouetteFill';
const EMPTY_STATE: SoftSilhouetteRenderState = {
  opacity: 0,
  corePath: '',
  limbPath: '',
  blendPath: '',
  rimPath: '',
  surfacePathCount: 0,
  dynamicPathCount: 0,
  shapeCount: 0,
  skippedPartCount: 0,
};

export const SoftSilhouetteRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function SoftSilhouetteRenderer(
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
  const geometry = React.useRef(createSoftSilhouetteGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createSoftSilhouetteRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<SoftSilhouetteRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] =
    React.useState<SoftSilhouetteRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<SoftSilhouetteRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copySoftSilhouetteRenderSnapshot(
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
            mode: 'soft_silhouette_avatar',
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
        opacity: current.surfacePathCount > 0 ? 0.3 : 0,
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
    buildSoftSilhouetteGeometry(screenPose.current, geometry.current, { minConfidence });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotSoftSilhouetteRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'soft_silhouette_avatar',
      frameTimestampMs: order,
      geometryMs,
      dotCount: 0,
      lineCount: 0,
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
        mode: 'soft_silhouette_avatar',
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
        <Defs>
          <LinearGradient
            id={SOFT_SILHOUETTE_GRADIENT_ID}
            x1="0%"
            y1="0%"
            x2="80%"
            y2="100%"
          >
            <Stop offset="0" stopColor="#65715F" />
            <Stop offset="0.42" stopColor={colors.sageDeep} />
            <Stop offset="1" stopColor="#1E271D" />
          </LinearGradient>
        </Defs>
        <Path
          d={renderState.rimPath || EMPTY_D}
          fill="none"
          stroke="#8A9589"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={renderState.opacity * 0.035}
        />
        <Path
          d={renderState.limbPath || EMPTY_D}
          fill={`url(#${SOFT_SILHOUETTE_GRADIENT_ID})`}
          opacity={renderState.opacity * 0.98}
        />
        <Path
          d={renderState.corePath || EMPTY_D}
          fill={`url(#${SOFT_SILHOUETTE_GRADIENT_ID})`}
          opacity={renderState.opacity}
        />
        <Path
          d={renderState.blendPath || EMPTY_D}
          fill={`url(#${SOFT_SILHOUETTE_GRADIENT_ID})`}
          opacity={renderState.opacity * 0.08}
        />
      </Svg>
    </View>
  );
});

function snapshotSoftSilhouetteRenderState(
  source: ReturnType<typeof createSoftSilhouetteGeometry>
): SoftSilhouetteRenderState {
  return {
    opacity: source.opacity,
    corePath: source.corePath,
    limbPath: source.limbPath,
    blendPath: source.blendPath,
    rimPath: source.rimPath,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    shapeCount: source.shapeCount,
    skippedPartCount: source.skippedPartCount,
  };
}

function createSoftSilhouetteRenderSnapshot(): SoftSilhouetteRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copySoftSilhouetteRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: SoftSilhouetteRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
