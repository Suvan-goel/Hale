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
  buildPremiumConstellationHumanGeometry,
  createPremiumConstellationHumanGeometry,
  type PremiumConstellationHumanGeometry,
} from './premiumConstellationHumanGeometry';
import {
  createPoseAvatarPerformanceState,
  markPoseAvatarUpdate,
  maybeLogPoseAvatarPerformance,
} from './poseAvatarPerformance';
import type { PoseAvatarRendererHandle, PoseAvatarRendererProps } from './poseAvatarTypes';
import { resolvePremiumConstellationVolumeConfig } from './premiumConstellationHumanPresets';

interface PremiumConstellationRenderInput {
  output: PipelineFrameOutput;
  sourceAspect: number;
  order: number;
}

interface PremiumConstellationRenderSnapshot {
  rawFrame: PoseFrame;
  displayFrame: PoseFrame;
  state: TrackingState;
  inferenceMs: number | null;
  sourceAspect: number;
}

interface PremiumConstellationRenderState {
  opacity: number;
  bodyOpacity: number;
  torsoDotPath: string;
  softTorsoDotPath: string;
  headDotPath: string;
  softHeadDotPath: string;
  limbDotPath: string;
  internalLimbDotPath: string;
  extremityDotPath: string;
  internalExtremityDotPath: string;
  connectionPath: string;
  dotCount: number;
  lineCount: number;
  skippedPartCount: number;
}

const EMPTY_D = 'M-9-9';
const PREMIUM_CONSTELLATION_CORE = '#243020';
const PREMIUM_CONSTELLATION_LIMB = '#32402E';
const PREMIUM_CONSTELLATION_EDGE = '#6C7568';
const PREMIUM_CONSTELLATION_DISTAL = '#4E5B49';
const EMPTY_STATE: PremiumConstellationRenderState = {
  opacity: 0,
  bodyOpacity: 0,
  torsoDotPath: '',
  softTorsoDotPath: '',
  headDotPath: '',
  softHeadDotPath: '',
  limbDotPath: '',
  internalLimbDotPath: '',
  extremityDotPath: '',
  internalExtremityDotPath: '',
  connectionPath: '',
  dotCount: 0,
  lineCount: 0,
  skippedPartCount: 0,
};

export const PremiumConstellationHumanRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function PremiumConstellationHumanRenderer(
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
    premiumConstellationVolumePreset,
    premiumConstellationShowConnections = false,
    onRendererScheduleEvent,
  },
  ref
) {
  const preset = resolvePremiumConstellationVolumeConfig(premiumConstellationVolumePreset);
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const geometry = React.useRef(createPremiumConstellationHumanGeometry(preset.maxDots));
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const latestRenderSnapshot = React.useRef(createPremiumConstellationRenderSnapshot());
  const rendererScheduleEventRef = React.useRef(onRendererScheduleEvent);
  const renderLatestRef = React.useRef<(order: number | null) => void>(() => undefined);
  const renderScheduler = React.useRef<ReturnType<
    typeof createLatestFrameRafScheduler<PremiumConstellationRenderInput>
  > | null>(null);
  const visibleRef = React.useRef(false);
  const [renderState, setRenderState] =
    React.useState<PremiumConstellationRenderState>(EMPTY_STATE);
  rendererScheduleEventRef.current = onRendererScheduleEvent;

  React.useEffect(
    () => () => {
      renderScheduler.current?.cancel();
    },
    []
  );

  React.useEffect(() => {
    if (geometry.current.maxDots < preset.maxDots) {
      geometry.current = createPremiumConstellationHumanGeometry(preset.maxDots);
    }
  }, [preset.maxDots]);

  if (renderScheduler.current === null) {
    renderScheduler.current = createLatestFrameRafScheduler<PremiumConstellationRenderInput>({
      requestFrame: requestAnimationFrame,
      cancelFrame: cancelAnimationFrame,
      getOrder: (input) => input.order,
      storeLatest: (input) => {
        copyPremiumConstellationRenderSnapshot(
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
            mode: 'premium_constellation_human',
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
    if (geometry.current.maxDots < preset.maxDots) {
      geometry.current = createPremiumConstellationHumanGeometry(preset.maxDots);
    }
    buildPremiumConstellationHumanGeometry(screenPose.current, geometry.current, preset, {
      minConfidence,
      showGuideStructure: premiumConstellationShowConnections,
    });
    const geometryMs = Date.now() - geometryStart;

    visibleRef.current = true;
    setRenderState(snapshotPremiumConstellationRenderState(geometry.current));
    rendererScheduleEventRef.current?.({
      type: 'published',
      mode: 'premium_constellation_human',
      frameTimestampMs: order,
      geometryMs,
      dotCount: geometry.current.dotCount,
      lineCount: geometry.current.guideLineCount,
    });

    maybeLogPoseAvatarPerformance(
      perf.current,
      {
        timestampMs: frame.timestampMs,
        mode: 'premium_constellation_human',
        frameSource,
        dotCount: geometry.current.dotCount,
        lineCount: geometry.current.guideLineCount,
        geometryMs: __DEV__ && debug ? geometryMs : 0,
        smoothingEnabled: false,
        smoothingAlpha: 1,
        smoothingAlphaRange: [1, 1],
        adaptiveSmoothingEnabled: false,
        movementSpeedPxPerSec: 0,
        sampledDotsEnabled: false,
        bodyVolumeEnabled: true,
        torsoDotCount: geometry.current.torsoDotCount,
        headDotCount: geometry.current.headDotCount,
        volumeDotCount: geometry.current.dotCount,
        bodyStyle: 'point_cloud_body',
        pointCloudBodyDensity: 'high',
        pointCloudBodyMaxDots: preset.maxDots,
        pointCloudBodyShowConnections: premiumConstellationShowConnections,
        pointCloudBodyShowSkeletonLines: false,
        pointCloudBodyShowKeypoints: false,
        pointCloudBodyDotScale: preset.dotScale,
        pointCloudBodyOpacity: 1,
        pointCloudBodyShapeProfile: 'organic',
        upperArmDotCount: geometry.current.upperArmDotCount,
        forearmDotCount: geometry.current.forearmDotCount,
        thighDotCount: geometry.current.thighDotCount,
        lowerLegDotCount: geometry.current.shinDotCount,
        handDotCount: geometry.current.handDotCount,
        footDotCount: geometry.current.footDotCount,
        keypointDotCount: 0,
        connectionLineCount: geometry.current.guideLineCount,
        skippedBodyPartCount: geometry.current.skippedPartCount,
        lowLatencyMode,
        confidenceFadingEnabled: false,
        confidenceIntensityEnabled: false,
        reacquisitionFadeEnabled: false,
        recognitionPulseEnabled: false,
        confidenceAnimationStrength: 'off',
        measurementState: measurementState ?? 'default',
        activeDomain,
        trackingQuality: geometry.current.dotCount > 0 ? trackingQuality : 'none',
        measurementStatesEnabled: false,
        setupGuidesEnabled: false,
        stateTransitionsEnabled: false,
        domainEmphasisEnabled: false,
        scanLineEnabled: false,
        measurementStateIntensity: 'off',
        setupGuideVisible: false,
        scanLineVisible: false,
        visualCalculationMs: 0,
        visualTrackingState: geometry.current.dotCount > 0 ? 'tracking' : 'lost',
        averageConfidence: geometry.current.opacityScale,
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
    [dimFigureForTrackingLoss, fit, frameSource, mirrored]
  );

  const materialOpacity = renderState.opacity * renderState.bodyOpacity;
  const softOpacity = materialOpacity * preset.softOpacity;
  const coreOpacity = materialOpacity * preset.coreOpacity;
  const limbOpacity = materialOpacity * preset.limbOpacity;
  const extremityOpacity = materialOpacity * preset.extremityOpacity;

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
          d={renderState.connectionPath || EMPTY_D}
          stroke={colors.sageDeep}
          strokeOpacity={premiumConstellationShowConnections ? materialOpacity * 0.035 : 0}
          strokeWidth={0.55}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={renderState.softTorsoDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_CORE}
          fillOpacity={softOpacity * 0.74}
        />
        <Path
          d={renderState.internalLimbDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_LIMB}
          fillOpacity={softOpacity * 0.64}
        />
        <Path
          d={renderState.softHeadDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_CORE}
          fillOpacity={softOpacity * 0.68}
        />
        <Path
          d={renderState.internalExtremityDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_DISTAL}
          fillOpacity={softOpacity * 0.52}
        />
        <Path
          d={renderState.torsoDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_CORE}
          fillOpacity={coreOpacity}
        />
        <Path
          d={renderState.headDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_CORE}
          fillOpacity={coreOpacity * 0.9}
        />
        <Path
          d={renderState.limbDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_LIMB}
          fillOpacity={limbOpacity}
        />
        <Path
          d={renderState.extremityDotPath || EMPTY_D}
          fill={PREMIUM_CONSTELLATION_DISTAL}
          fillOpacity={extremityOpacity}
        />
      </Svg>
    </View>
  );
});

function snapshotPremiumConstellationRenderState(
  source: PremiumConstellationHumanGeometry
): PremiumConstellationRenderState {
  return {
    opacity: source.dotCount > 0 ? 1 : 0,
    bodyOpacity: source.opacityScale,
    torsoDotPath: source.torsoSurfacePath,
    softTorsoDotPath: source.torsoInternalPath,
    headDotPath: source.headSurfacePath,
    softHeadDotPath: source.headInternalPath,
    limbDotPath: source.limbSurfacePath,
    internalLimbDotPath: source.limbInternalPath,
    extremityDotPath: source.extremitySurfacePath,
    internalExtremityDotPath: source.extremityInternalPath,
    connectionPath: source.guidePath,
    dotCount: source.dotCount,
    lineCount: source.guideLineCount,
    skippedPartCount: source.skippedPartCount,
  };
}

function createPremiumConstellationRenderSnapshot(): PremiumConstellationRenderSnapshot {
  return {
    rawFrame: createPoseFrame(),
    displayFrame: createPoseFrame(),
    state: 'no-subject',
    inferenceMs: null,
    sourceAspect: 0,
  };
}

function copyPremiumConstellationRenderSnapshot(
  output: PipelineFrameOutput,
  sourceAspect: number,
  snapshot: PremiumConstellationRenderSnapshot
): void {
  snapshot.sourceAspect = sourceAspect;
  snapshot.state = output.state;
  snapshot.inferenceMs = output.inferenceMs ?? null;
  copyPoseFrame(output.rawFrame, snapshot.rawFrame);
  copyPoseFrame(output.displayFrame, snapshot.displayFrame);
}
