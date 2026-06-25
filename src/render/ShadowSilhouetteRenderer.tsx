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
  buildShadowSilhouetteGeometry,
  createShadowSilhouetteGeometry,
} from './shadowSilhouetteGeometry';

interface ShadowSilhouetteRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface ShadowSilhouetteRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface ShadowSilhouetteRenderState {
  opacity: number;
  bodyPath: string;
  neckPath: string;
  headPath: string;
  earPath: string;
  limbPath: string;
  accentPath: string;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
}

const EMPTY_D = 'M-9-9';
const SHADOW_GRADIENT_ID = 'haleShadowSilhouetteFill';
const EMPTY_STATE: ShadowSilhouetteRenderState = {
  opacity: 0,
  bodyPath: '',
  neckPath: '',
  headPath: '',
  earPath: '',
  limbPath: '',
  accentPath: '',
  surfacePathCount: 0,
  dynamicPathCount: 0,
  shapeCount: 0,
  skippedPartCount: 0,
};

export const ShadowSilhouetteRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function ShadowSilhouetteRenderer(
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
  const geometry = React.useRef(createShadowSilhouetteGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createShadowSilhouetteRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<ShadowSilhouetteRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] =
    React.useState<ShadowSilhouetteRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<ShadowSilhouetteRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyShadowSilhouetteRenderSnapshot(
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
            mode: 'shadow_silhouette',
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
        opacity: current.surfacePathCount > 0 ? 0.24 : 0,
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
    buildShadowSilhouetteGeometry(screenPose.current, geometry.current, { minConfidence });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotShadowSilhouetteRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'shadow_silhouette',
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
        mode: 'shadow_silhouette',
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
            id={SHADOW_GRADIENT_ID}
            x1="0%"
            y1="0%"
            x2="88%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={colors.sageDeep} />
            <Stop offset="0.54" stopColor="#26301F" />
            <Stop offset="1" stopColor={colors.textPrimary} />
          </LinearGradient>
        </Defs>
        <Path
          d={renderState.limbPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity}
        />
        <Path
          d={renderState.bodyPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity}
        />
        <Path
          d={renderState.neckPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity}
        />
        <Path
          d={renderState.earPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity}
        />
        <Path
          d={renderState.headPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity}
        />
        <Path
          d={renderState.accentPath || EMPTY_D}
          fill={colors.surface}
          opacity={renderState.opacity * 0.035}
        />
      </Svg>
    </View>
  );
});

function snapshotShadowSilhouetteRenderState(
  source: ReturnType<typeof createShadowSilhouetteGeometry>
): ShadowSilhouetteRenderState {
  return {
    opacity: source.opacity,
    bodyPath: source.bodyPath,
    neckPath: source.neckPath,
    headPath: source.headPath,
    earPath: source.earPath,
    limbPath: source.limbPath,
    accentPath: source.accentPath,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    shapeCount: source.shapeCount,
    skippedPartCount: source.skippedPartCount,
  };
}

function createShadowSilhouetteRenderSnapshot(): ShadowSilhouetteRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyShadowSilhouetteRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: ShadowSilhouetteRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
