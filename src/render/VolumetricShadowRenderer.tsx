import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  buildShadowSilhouetteGeometry,
  createShadowSilhouetteGeometry,
} from './shadowSilhouetteGeometry';
import {
  buildVolumetricShadowGeometry,
  createVolumetricShadowGeometry,
} from './volumetricShadowGeometry';

interface VolumetricShadowRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface VolumetricShadowRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface VolumetricShadowRenderState {
  hazeLimbPath: string;
  hazeBodyPath: string;
  hazeNeckPath: string;
  hazeEarPath: string;
  hazeHeadPath: string;
  haloPath: string;
  bodyPath: string;
  corePath: string;
  accentPath: string;
  opacity: number;
  dotCount: number;
  surfacePathCount: number;
  skippedPartCount: number;
}

const EMPTY_D = 'M-9-9';
const EMPTY_STATE: VolumetricShadowRenderState = {
  hazeLimbPath: '',
  hazeBodyPath: '',
  hazeNeckPath: '',
  hazeEarPath: '',
  hazeHeadPath: '',
  haloPath: '',
  bodyPath: '',
  corePath: '',
  accentPath: '',
  opacity: 0,
  dotCount: 0,
  surfacePathCount: 0,
  skippedPartCount: 0,
};

export const VolumetricShadowRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function VolumetricShadowRenderer(
  {
    mirrored = true,
    fit = 'contain',
    minConfidence = 0.35,
    frameSource = 'raw',
    pointCloudBodyMaxDots = 540,
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
  const geometry = React.useRef(createVolumetricShadowGeometry());
  const hazeGeometry = React.useRef(createShadowSilhouetteGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createVolumetricShadowRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<VolumetricShadowRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] =
    React.useState<VolumetricShadowRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<VolumetricShadowRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyVolumetricShadowRenderSnapshot(
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
            mode: 'volumetric_shadow',
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
        opacity: current.dotCount > 0 ? 0.24 : 0,
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
    buildVolumetricShadowGeometry(screenPose.current, geometry.current, {
      minConfidence,
      maxDots: pointCloudBodyMaxDots,
    });
    buildShadowSilhouetteGeometry(screenPose.current, hazeGeometry.current, {
      minConfidence,
    });
    const geometryMs = Date.now() - geometryStart;
    const hazePathCount = stippleHazePathCount(hazeGeometry.current);
    const surfacePathCount = geometry.current.surfacePathCount + hazePathCount;
    const shapeCount =
      geometry.current.haloDotCount +
      geometry.current.bodyDotCount +
      geometry.current.coreDotCount +
      geometry.current.accentDotCount +
      hazePathCount;

    visibleRef.current = true;
    setRenderState(snapshotVolumetricShadowRenderState(geometry.current, hazeGeometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'volumetric_shadow',
      frameTimestampMs: order,
      geometryMs,
      dotCount: geometry.current.dotCount,
      lineCount: 0,
      shapeCount,
      dynamicPathCount: surfacePathCount,
      staticTransformedShapeCount: 0,
      surfacePathCount,
      internalControlVertexCount: 0,
      virtualBoneCount: 0,
    });

    maybeLogPoseAvatarPerformance(
      perf.current,
      {
        timestampMs: frame.timestampMs,
        mode: 'volumetric_shadow',
        frameSource,
        dotCount: geometry.current.dotCount,
        lineCount: 0,
        geometryMs: __DEV__ && debug ? geometryMs : 0,
        smoothingEnabled: false,
        smoothingAlpha: 1,
        smoothingAlphaRange: [1, 1],
        adaptiveSmoothingEnabled: false,
        movementSpeedPxPerSec: 0,
        sampledDotsEnabled: true,
        bodyVolumeEnabled: true,
        torsoDotCount: 0,
        headDotCount: 0,
        volumeDotCount: geometry.current.dotCount,
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
    [dimFigureForTrackingLoss, fit, frameSource, minConfidence, mirrored, pointCloudBodyMaxDots]
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
          d={renderState.hazeLimbPath || EMPTY_D}
          fill={colors.sageDeep}
          opacity={renderState.opacity * 0.055}
        />
        <Path
          d={renderState.hazeBodyPath || EMPTY_D}
          fill={colors.sageDeep}
          opacity={renderState.opacity * 0.055}
        />
        <Path
          d={renderState.hazeNeckPath || EMPTY_D}
          fill={colors.sageDeep}
          opacity={renderState.opacity * 0.055}
        />
        <Path
          d={renderState.hazeEarPath || EMPTY_D}
          fill={colors.sageDeep}
          opacity={renderState.opacity * 0.055}
        />
        <Path
          d={renderState.hazeHeadPath || EMPTY_D}
          fill={colors.sageDeep}
          opacity={renderState.opacity * 0.055}
        />
        <Path
          d={renderState.haloPath || EMPTY_D}
          fill={colors.sageDeep}
          opacity={renderState.opacity * 0.34}
        />
        <Path
          d={renderState.bodyPath || EMPTY_D}
          fill="#26301F"
          opacity={renderState.opacity * 0.56}
        />
        <Path
          d={renderState.corePath || EMPTY_D}
          fill={colors.textPrimary}
          opacity={renderState.opacity * 0.74}
        />
        <Path
          d={renderState.accentPath || EMPTY_D}
          fill={colors.accentGold}
          opacity={renderState.opacity * 0.16}
        />
      </Svg>
    </View>
  );
});

function snapshotVolumetricShadowRenderState(
  source: ReturnType<typeof createVolumetricShadowGeometry>,
  haze: ReturnType<typeof createShadowSilhouetteGeometry>
): VolumetricShadowRenderState {
  return {
    hazeLimbPath: haze.limbPath,
    hazeBodyPath: haze.bodyPath,
    hazeNeckPath: haze.neckPath,
    hazeEarPath: haze.earPath,
    hazeHeadPath: haze.headPath,
    haloPath: source.haloPath,
    bodyPath: source.bodyPath,
    corePath: source.corePath,
    accentPath: source.accentPath,
    opacity: source.opacity,
    dotCount: source.dotCount,
    surfacePathCount: source.surfacePathCount,
    skippedPartCount: source.skippedPartCount,
  };
}

function stippleHazePathCount(source: ReturnType<typeof createShadowSilhouetteGeometry>): number {
  return (
    (source.limbPath ? 1 : 0) +
    (source.bodyPath ? 1 : 0) +
    (source.neckPath ? 1 : 0) +
    (source.earPath ? 1 : 0) +
    (source.headPath ? 1 : 0)
  );
}

function createVolumetricShadowRenderSnapshot(): VolumetricShadowRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyVolumetricShadowRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: VolumetricShadowRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
