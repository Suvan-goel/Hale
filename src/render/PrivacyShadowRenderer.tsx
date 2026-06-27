import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import { copyPoseFrame, createPoseFrame, type PoseFrame } from '../pose/types';
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
  buildPrivacyShadowGeometry,
  createPrivacyShadowGeometry,
  PRIVACY_SHADOW_VISUAL_CONSTANTS,
  type PrivacyShadowVisibility,
} from './privacyShadowGeometry';

interface PrivacyShadowRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface PrivacyShadowRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface PrivacyShadowRenderState {
  opacity: number;
  readyScore: number;
  outerPath: string;
  midPath: string;
  corePath: string;
  surfacePathCount: number;
  dynamicPathCount: number;
  shapeCount: number;
  skippedPartCount: number;
  visibility: PrivacyShadowVisibility;
}

const EMPTY_D = 'M-9-9';
const SHADOW_GRADIENT_ID = 'halePrivacyShadowFill';
const EMPTY_VISIBILITY: PrivacyShadowVisibility = {
  headVisible: false,
  feetVisible: false,
  fullBodyVisible: false,
  trackingStable: false,
};
const EMPTY_STATE: PrivacyShadowRenderState = {
  opacity: 0,
  readyScore: 0,
  outerPath: '',
  midPath: '',
  corePath: '',
  surfacePathCount: 0,
  dynamicPathCount: 0,
  shapeCount: 0,
  skippedPartCount: 0,
  visibility: EMPTY_VISIBILITY,
};

export const PrivacyShadowRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function PrivacyShadowRenderer(
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
  const geometry = React.useRef(createPrivacyShadowGeometry());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createPrivacyShadowRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<PrivacyShadowRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] = React.useState<PrivacyShadowRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<PrivacyShadowRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyPrivacyShadowRenderSnapshot(
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
            mode: 'privacy_shadow',
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
        opacity: current.surfacePathCount > 0 ? PRIVACY_SHADOW_VISUAL_CONSTANTS.shadowLostOpacity : 0,
        readyScore: 0,
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
    buildPrivacyShadowGeometry(screenPose.current, geometry.current, { minConfidence });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotPrivacyShadowRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'privacy_shadow',
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
        mode: 'privacy_shadow',
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

  const frameColor = frameColorForReadyScore(renderState.readyScore);
  const shadowOpacity =
    PRIVACY_SHADOW_VISUAL_CONSTANTS.shadowOpacity +
    renderState.readyScore * PRIVACY_SHADOW_VISUAL_CONSTANTS.trackingReadyOpacityBoost;

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
            x1="15%"
            y1="0%"
            x2="78%"
            y2="100%"
          >
            <Stop offset="0" stopColor="#66735F" />
            <Stop offset="0.52" stopColor="#414C34" />
            <Stop offset="1" stopColor="#1F271D" />
          </LinearGradient>
        </Defs>
        <Path
          d={renderState.outerPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity * shadowOpacity * PRIVACY_SHADOW_VISUAL_CONSTANTS.outerFeatherOpacity}
        />
        <Path
          d={renderState.midPath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity * shadowOpacity}
        />
        <Path
          d={renderState.corePath || EMPTY_D}
          fill={`url(#${SHADOW_GRADIENT_ID})`}
          opacity={renderState.opacity * PRIVACY_SHADOW_VISUAL_CONSTANTS.innerCoreOpacity}
        />
      </Svg>
      <View
        style={[
          styles.fitFrame,
          {
            borderColor: frameColor,
            opacity: renderState.opacity > 0 ? 0.9 : 0.34,
          },
        ]}
      >
        <View
          style={[
            styles.topGuide,
            {
              backgroundColor: renderState.visibility.headVisible
                ? PRIVACY_SHADOW_VISUAL_CONSTANTS.frameReadyColor
                : PRIVACY_SHADOW_VISUAL_CONSTANTS.frameAdjustColor,
              opacity: renderState.opacity > 0 ? 0.52 : 0.18,
            },
          ]}
        />
        <View
          style={[
            styles.bottomGuide,
            {
              backgroundColor: renderState.visibility.feetVisible
                ? PRIVACY_SHADOW_VISUAL_CONSTANTS.frameReadyColor
                : PRIVACY_SHADOW_VISUAL_CONSTANTS.frameAdjustColor,
              opacity: renderState.opacity > 0 ? 0.52 : 0.18,
            },
          ]}
        />
      </View>
    </View>
  );
});

function snapshotPrivacyShadowRenderState(
  source: ReturnType<typeof createPrivacyShadowGeometry>
): PrivacyShadowRenderState {
  return {
    opacity: source.opacity,
    readyScore: source.readyScore,
    outerPath: source.outerPath,
    midPath: source.midPath,
    corePath: source.corePath,
    surfacePathCount: source.surfacePathCount,
    dynamicPathCount: source.dynamicPathCount,
    shapeCount: source.shapeCount,
    skippedPartCount: source.skippedPartCount,
    visibility: { ...source.visibility },
  };
}

function createPrivacyShadowRenderSnapshot(): PrivacyShadowRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyPrivacyShadowRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: PrivacyShadowRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}

function frameColorForReadyScore(readyScore: number): string {
  if (readyScore >= 0.95) return PRIVACY_SHADOW_VISUAL_CONSTANTS.frameReadyColor;
  if (readyScore >= 0.35) return PRIVACY_SHADOW_VISUAL_CONSTANTS.frameAdjustColor;
  return PRIVACY_SHADOW_VISUAL_CONSTANTS.frameNeutralColor;
}

const styles = StyleSheet.create({
  fitFrame: {
    position: 'absolute',
    left: '11%',
    right: '11%',
    top: '5%',
    bottom: '5%',
    borderWidth: 1.5,
    borderRadius: 34,
    backgroundColor: 'rgba(255,253,249,0.035)',
  },
  topGuide: {
    position: 'absolute',
    left: '33%',
    right: '33%',
    top: 14,
    height: 3,
    borderRadius: 999,
  },
  bottomGuide: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    bottom: 14,
    height: 3,
    borderRadius: 999,
  },
});
