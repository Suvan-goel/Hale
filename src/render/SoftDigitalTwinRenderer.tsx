import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

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
  buildSoftDigitalTwinGeometry,
  createSoftDigitalTwinGeometry,
  resolveSoftDigitalTwinVisualPreset,
  type SoftDigitalTwinConstructionLine,
  type SoftDigitalTwinConstructionPoint,
  type SoftDigitalTwinFillKey,
  type SoftDigitalTwinSurface,
} from './softDigitalTwinGeometry';

interface SoftDigitalTwinRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface SoftDigitalTwinRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface SoftDigitalTwinRenderState {
  opacity: number;
  surfaces: SoftDigitalTwinSurface[];
  constructionPoints: SoftDigitalTwinConstructionPoint[];
  constructionLines: SoftDigitalTwinConstructionLine[];
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
}

const SOFT_DIGITAL_TWIN_CORE_GRADIENT_ID = 'haleSoftDigitalTwinCore';
const SOFT_DIGITAL_TWIN_LIMB_GRADIENT_ID = 'haleSoftDigitalTwinLimb';
const SOFT_DIGITAL_TWIN_DISTAL_GRADIENT_ID = 'haleSoftDigitalTwinDistal';
const SOFT_DIGITAL_TWIN_SHADOW_FILL = '#182018';
const EMPTY_STATE: SoftDigitalTwinRenderState = {
  opacity: 0,
  surfaces: [],
  constructionPoints: [],
  constructionLines: [],
  surfacePathCount: 0,
  dynamicPathCount: 0,
  shapeCount: 0,
  skippedPartCount: 0,
};

export const SoftDigitalTwinRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function SoftDigitalTwinRenderer(
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
    softDigitalTwinVisualPreset = 'balanced',
    softDigitalTwinShowConstructionOverlay = false,
    onRendererScheduleEvent,
  },
  ref
) {
  const visualPreset = resolveSoftDigitalTwinVisualPreset(softDigitalTwinVisualPreset);
  const materialDepth = visualPreset.materialDepth;
  const lowContrastMaterial = visualPreset.materialContrast < 0.9;
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const geometry = React.useRef(createSoftDigitalTwinGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createSoftDigitalTwinRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<SoftDigitalTwinRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] =
    React.useState<SoftDigitalTwinRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<SoftDigitalTwinRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copySoftDigitalTwinRenderSnapshot(
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
            mode: 'soft_digital_twin',
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
        opacity: current.surfacePathCount > 0 ? 0.28 : 0,
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
    buildSoftDigitalTwinGeometry(screenPose.current, geometry.current, {
      minConfidence,
      visualPreset: softDigitalTwinVisualPreset,
    });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotSoftDigitalTwinRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'soft_digital_twin',
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
        mode: 'soft_digital_twin',
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
    [dimFigureForTrackingLoss, fit, frameSource, minConfidence, mirrored, softDigitalTwinVisualPreset]
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
            id={SOFT_DIGITAL_TWIN_CORE_GRADIENT_ID}
            x1="18%"
            y1="0%"
            x2="78%"
            y2="100%"
          >
            <Stop
              offset="0"
              stopColor={lowContrastMaterial ? '#66735F' : materialDepth > 0.5 ? '#61705C' : '#66745F'}
            />
            <Stop offset="0.38" stopColor={lowContrastMaterial ? '#4D5A45' : colors.sageDeep} />
            <Stop offset="0.68" stopColor={lowContrastMaterial ? '#3C4837' : colors.sageDeep} />
            <Stop
              offset="1"
              stopColor={lowContrastMaterial ? '#2D372A' : materialDepth > 0.5 ? '#202A20' : '#263126'}
            />
          </LinearGradient>
          <LinearGradient
            id={SOFT_DIGITAL_TWIN_LIMB_GRADIENT_ID}
            x1="10%"
            y1="0%"
            x2="88%"
            y2="100%"
          >
            <Stop offset="0" stopColor={lowContrastMaterial ? '#56654F' : '#55644F'} />
            <Stop offset="0.55" stopColor={lowContrastMaterial ? '#3B4737' : '#394635'} />
            <Stop offset="1" stopColor={lowContrastMaterial ? '#2D372A' : '#263126'} />
          </LinearGradient>
          <LinearGradient
            id={SOFT_DIGITAL_TWIN_DISTAL_GRADIENT_ID}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0" stopColor={lowContrastMaterial ? '#465442' : '#566450'} />
            <Stop offset="1" stopColor={lowContrastMaterial ? '#2C352A' : '#2A3529'} />
          </LinearGradient>
        </Defs>
        {renderState.surfaces.map((surface, index) => (
          <Path
            key={`${surface.id}-${index}`}
            d={surface.path}
            fill={fillForSurface(surface.fillKey)}
            opacity={renderState.opacity * surface.opacity}
          />
        ))}
        {softDigitalTwinShowConstructionOverlay ? (
          <G opacity={0.82}>
            {renderState.constructionLines.map((line) => (
              <Path
                key={line.id}
                d={`M${line.fromX.toFixed(1)} ${line.fromY.toFixed(1)}L${line.toX.toFixed(1)} ${line.toY.toFixed(1)}`}
                stroke="#6A5BA8"
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="3 4"
              />
            ))}
            {renderState.constructionPoints.map((point) => (
              <React.Fragment key={point.id}>
                <Circle cx={point.x} cy={point.y} r={3} fill="#6A5BA8" />
                <SvgText
                  x={point.x + 5}
                  y={point.y - 5}
                  fill="#493E78"
                  fontSize={9}
                  fontWeight="600"
                >
                  {point.label}
                </SvgText>
              </React.Fragment>
            ))}
          </G>
        ) : null}
      </Svg>
    </View>
  );
});

function fillForSurface(fillKey: SoftDigitalTwinFillKey): string {
  switch (fillKey) {
    case 'limb':
      return `url(#${SOFT_DIGITAL_TWIN_LIMB_GRADIENT_ID})`;
    case 'distal':
      return `url(#${SOFT_DIGITAL_TWIN_DISTAL_GRADIENT_ID})`;
    case 'shadow':
      return SOFT_DIGITAL_TWIN_SHADOW_FILL;
    case 'blend':
    case 'core':
      return `url(#${SOFT_DIGITAL_TWIN_CORE_GRADIENT_ID})`;
  }
}

function snapshotSoftDigitalTwinRenderState(
  source: ReturnType<typeof createSoftDigitalTwinGeometry>
): SoftDigitalTwinRenderState {
  return {
    opacity: source.opacity,
    surfaces: source.surfaces.map((surface) => ({ ...surface })),
    constructionPoints: source.constructionPoints.map((point) => ({ ...point })),
    constructionLines: source.constructionLines.map((line) => ({ ...line })),
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    shapeCount: source.shapeCount,
    skippedPartCount: source.skippedPartCount,
  };
}

function createSoftDigitalTwinRenderSnapshot(): SoftDigitalTwinRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copySoftDigitalTwinRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: SoftDigitalTwinRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
