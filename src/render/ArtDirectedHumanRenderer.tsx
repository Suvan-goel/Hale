import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import { copyPoseFrame, createPoseFrame, type PoseFrame } from '../pose/types';
import {
  buildArtDirectedHumanGeometry,
  createArtDirectedHumanGeometry,
  type ArtDirectedHumanFillKey,
  type ArtDirectedHumanSurface,
} from './artDirectedHumanGeometry';
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

interface ArtDirectedHumanRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface ArtDirectedHumanRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface ArtDirectedHumanSurfaceRenderState {
  id: ArtDirectedHumanSurface['id'];
  path: string;
  fillKey: ArtDirectedHumanFillKey;
  opacity: number;
  visible: boolean;
}

interface ArtDirectedHumanRenderState {
  opacity: number;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
  surfaces: ArtDirectedHumanSurfaceRenderState[];
}

const EMPTY_D = 'M-9 -9';
const ART_DIRECTED_HUMAN_GRADIENT_ID = 'haleArtDirectedHumanGlobalMatte';

const EMPTY_STATE: ArtDirectedHumanRenderState = {
  opacity: 0,
  surfacePathCount: 0,
  dynamicPathCount: 0,
  shapeCount: 0,
  skippedPartCount: 0,
  surfaces: [],
};

export const ArtDirectedHumanRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function ArtDirectedHumanRenderer(
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
    artDirectedHumanJointStyle = 'connected',
    onRendererScheduleEvent,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const geometry = React.useRef(createArtDirectedHumanGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createArtDirectedHumanRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<ArtDirectedHumanRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] =
    React.useState<ArtDirectedHumanRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<ArtDirectedHumanRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyArtDirectedHumanRenderSnapshot(
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
            mode: 'art_directed_human',
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
    buildArtDirectedHumanGeometry(screenPose.current, geometry.current, {
      minConfidence,
      jointStyle: artDirectedHumanJointStyle,
    });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotArtDirectedHumanRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'art_directed_human',
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
        mode: 'art_directed_human',
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
    [artDirectedHumanJointStyle, dimFigureForTrackingLoss, fit, frameSource, minConfidence, mirrored]
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
            id={ART_DIRECTED_HUMAN_GRADIENT_ID}
            x1="0"
            y1="0"
            x2="0"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#52604E" />
            <Stop offset="0.46" stopColor="#354236" />
            <Stop offset="1" stopColor="#263129" />
          </LinearGradient>
        </Defs>
        {renderState.surfaces.map((surface) => (
          <Path
            key={surface.id}
            d={surface.path || EMPTY_D}
            fill={`url(#${ART_DIRECTED_HUMAN_GRADIENT_ID})`}
            opacity={surface.visible ? surface.opacity * renderState.opacity : 0}
          />
        ))}
      </Svg>
    </View>
  );
});

function snapshotArtDirectedHumanRenderState(
  source: ReturnType<typeof createArtDirectedHumanGeometry>
): ArtDirectedHumanRenderState {
  return {
    opacity: source.opacity,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    shapeCount: source.shapeCount,
    skippedPartCount: source.skippedPartCount,
    surfaces: source.surfaces.map((surface) => ({
      id: surface.id,
      path: surface.path,
      fillKey: surface.fillKey,
      opacity: surface.opacity,
      visible: surface.visible,
    })),
  };
}

function createArtDirectedHumanRenderSnapshot(): ArtDirectedHumanRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyArtDirectedHumanRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: ArtDirectedHumanRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
