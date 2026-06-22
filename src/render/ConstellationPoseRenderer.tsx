import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import { colors, skeleton } from '../theme';
import { buildBodyVolumeGeometry, createBodyVolumeGeometry } from './bodyVolumeGeometry';
import {
  createAvatarVisualState,
  getPoseAverageConfidence,
  resetAvatarVisualState,
  updateAvatarVisualState,
} from './confidenceVisuals';
import {
  buildConstellationGeometry,
  CONSTELLATION_KEYPOINTS,
  createConstellationGeometry,
  estimateConstellationLineWidth,
} from './constellationGeometry';
import {
  buildScanLinePath,
  buildSetupGuidePath,
  createMeasurementStateTransitionState,
  getMeasurementStateVisualConfig,
  getTrackingQuality,
  updateMeasurementStateTransition,
} from './measurementStateVisuals';
import { createScreenPoseLandmarks, mapPoseFrameToScreenPose } from './poseCoordinateMapper';
import {
  createPoseAvatarPerformanceState,
  markPoseAvatarUpdate,
  maybeLogPoseAvatarPerformance,
} from './poseAvatarPerformance';
import type { PoseAvatarRendererHandle, PoseAvatarRendererProps } from './poseAvatarTypes';
import { createPoseSmoothingState, resetPoseSmoothing, smoothPoseLandmarks } from './poseSmoothing';

interface ConstellationPaths {
  linePath: string;
  mediumLinePath: string;
  lowLinePath: string;
  sampleDotPath: string;
  mediumSampleDotPath: string;
  lowSampleDotPath: string;
  softSampleDotPath: string;
  mediumSoftSampleDotPath: string;
  lowSoftSampleDotPath: string;
  jointDotPath: string;
  mediumJointDotPath: string;
  lowJointDotPath: string;
  emphasizedLinePath: string;
  emphasizedSampleDotPath: string;
  emphasizedSoftSampleDotPath: string;
  emphasizedJointDotPath: string;
  torsoDotPath: string;
  softTorsoDotPath: string;
  headDotPath: string;
  softHeadDotPath: string;
  accentDotPath: string;
  setupGuidePath: string;
  scanLinePath: string;
  volumeOpacity: number;
  avatarOpacity: number;
  pulse: number;
  lineWidth: number;
  keypointOpacityMultiplier: number;
  boneLineOpacityMultiplier: number;
  sampleDotOpacityMultiplier: number;
  bodyVolumeOpacityMultiplier: number;
  setupGuideOpacity: number;
  scanLineOpacity: number;
}

interface ConstellationPublishMeta {
  frameTimestampMs: number | null;
  geometryMs?: number;
  dotCount?: number;
  lineCount?: number;
}

const EMPTY_PATHS: ConstellationPaths = {
  linePath: '',
  mediumLinePath: '',
  lowLinePath: '',
  sampleDotPath: '',
  mediumSampleDotPath: '',
  lowSampleDotPath: '',
  softSampleDotPath: '',
  mediumSoftSampleDotPath: '',
  lowSoftSampleDotPath: '',
  jointDotPath: '',
  mediumJointDotPath: '',
  lowJointDotPath: '',
  emphasizedLinePath: '',
  emphasizedSampleDotPath: '',
  emphasizedSoftSampleDotPath: '',
  emphasizedJointDotPath: '',
  torsoDotPath: '',
  softTorsoDotPath: '',
  headDotPath: '',
  softHeadDotPath: '',
  accentDotPath: '',
  setupGuidePath: '',
  scanLinePath: '',
  volumeOpacity: 1,
  avatarOpacity: 1,
  pulse: 0,
  lineWidth: 1,
  keypointOpacityMultiplier: 1,
  boneLineOpacityMultiplier: 1,
  sampleDotOpacityMultiplier: 1,
  bodyVolumeOpacityMultiplier: 1,
  setupGuideOpacity: 0,
  scanLineOpacity: 0,
};

const EMPTY_D = 'M-9-9';

export const ConstellationPoseRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function ConstellationPoseRenderer(
  {
    mirrored = true,
    fit = 'cover',
    minConfidence = 0.35,
    smoothingEnabled = true,
    adaptiveSmoothingEnabled = true,
    smoothingAlpha = 0.78,
    smoothingMinAlpha = 0.58,
    smoothingMaxAlpha = 0.9,
    smoothingSlowSpeedPxPerSec = 90,
    smoothingFastSpeedPxPerSec = 650,
    smoothingSnapFrames = 2,
    sampledDotsEnabled = true,
    maxDots = 180,
    sampleDensity = 0.82,
    bodyVolumeEnabled = false,
    torsoVolumeEnabled = false,
    headVolumeEnabled = false,
    shoulderHipDensityEnabled = false,
    maxVolumeDots = 150,
    torsoVolumeDots = 86,
    headVolumeDots = 22,
    shoulderHipDensityDots = 16,
    confidenceFadingEnabled = true,
    confidenceIntensityEnabled = true,
    reacquisitionFadeEnabled = true,
    recognitionPulseEnabled = false,
    confidenceAnimationStrength = 'subtle',
    recognitionEvent = null,
    measurementState,
    activeDomain = null,
    trackingQuality,
    measurementStatesEnabled = true,
    setupGuidesEnabled = true,
    stateTransitionsEnabled = true,
    domainEmphasisEnabled = true,
    scanLineEnabled = false,
    measurementStateIntensity = 'subtle',
    frameSource = 'raw',
    lowLatencyMode = false,
    debug = false,
    onRendererScheduleEvent,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const smoothedPose = React.useRef(createScreenPoseLandmarks());
  const smoothing = React.useRef(createPoseSmoothingState());
  const geometry = React.useRef(createConstellationGeometry(300));
  const bodyVolume = React.useRef(createBodyVolumeGeometry(180));
  const visualState = React.useRef(createAvatarVisualState());
  const measurementVisualState = React.useRef(createMeasurementStateTransitionState());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const pendingPaths = React.useRef<ConstellationPaths>({ ...EMPTY_PATHS });
  const pendingPublishMeta = React.useRef<ConstellationPublishMeta>({
    frameTimestampMs: null,
  });
  const rafRef = React.useRef<number | null>(null);
  const visibleRef = React.useRef(false);
  const [paths, setPaths] = React.useState<ConstellationPaths>(EMPTY_PATHS);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const publishPaths = React.useCallback(
    (next: ConstellationPaths, meta: ConstellationPublishMeta) => {
      pendingPaths.current.linePath = next.linePath;
      pendingPaths.current.mediumLinePath = next.mediumLinePath;
      pendingPaths.current.lowLinePath = next.lowLinePath;
      pendingPaths.current.sampleDotPath = next.sampleDotPath;
      pendingPaths.current.mediumSampleDotPath = next.mediumSampleDotPath;
      pendingPaths.current.lowSampleDotPath = next.lowSampleDotPath;
      pendingPaths.current.softSampleDotPath = next.softSampleDotPath;
      pendingPaths.current.mediumSoftSampleDotPath = next.mediumSoftSampleDotPath;
      pendingPaths.current.lowSoftSampleDotPath = next.lowSoftSampleDotPath;
      pendingPaths.current.jointDotPath = next.jointDotPath;
      pendingPaths.current.mediumJointDotPath = next.mediumJointDotPath;
      pendingPaths.current.lowJointDotPath = next.lowJointDotPath;
      pendingPaths.current.emphasizedLinePath = next.emphasizedLinePath;
      pendingPaths.current.emphasizedSampleDotPath = next.emphasizedSampleDotPath;
      pendingPaths.current.emphasizedSoftSampleDotPath = next.emphasizedSoftSampleDotPath;
      pendingPaths.current.emphasizedJointDotPath = next.emphasizedJointDotPath;
      pendingPaths.current.torsoDotPath = next.torsoDotPath;
      pendingPaths.current.softTorsoDotPath = next.softTorsoDotPath;
      pendingPaths.current.headDotPath = next.headDotPath;
      pendingPaths.current.softHeadDotPath = next.softHeadDotPath;
      pendingPaths.current.accentDotPath = next.accentDotPath;
      pendingPaths.current.setupGuidePath = next.setupGuidePath;
      pendingPaths.current.scanLinePath = next.scanLinePath;
      pendingPaths.current.volumeOpacity = next.volumeOpacity;
      pendingPaths.current.avatarOpacity = next.avatarOpacity;
      pendingPaths.current.pulse = next.pulse;
      pendingPaths.current.lineWidth = next.lineWidth;
      pendingPaths.current.keypointOpacityMultiplier = next.keypointOpacityMultiplier;
      pendingPaths.current.boneLineOpacityMultiplier = next.boneLineOpacityMultiplier;
      pendingPaths.current.sampleDotOpacityMultiplier = next.sampleDotOpacityMultiplier;
      pendingPaths.current.bodyVolumeOpacityMultiplier = next.bodyVolumeOpacityMultiplier;
      pendingPaths.current.setupGuideOpacity = next.setupGuideOpacity;
      pendingPaths.current.scanLineOpacity = next.scanLineOpacity;
      const wasPending = rafRef.current !== null;
      pendingPublishMeta.current = meta;
      if (wasPending) {
        onRendererScheduleEvent?.({
          type: 'coalesced',
          mode: 'constellation',
          frameTimestampMs: meta.frameTimestampMs,
        });
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setPaths({ ...pendingPaths.current });
        onRendererScheduleEvent?.({
          type: 'published',
          mode: 'constellation',
          frameTimestampMs: pendingPublishMeta.current.frameTimestampMs,
          geometryMs: pendingPublishMeta.current.geometryMs,
          dotCount: pendingPublishMeta.current.dotCount,
          lineCount: pendingPublishMeta.current.lineCount,
        });
      });
      onRendererScheduleEvent?.({
        type: 'scheduled',
        mode: 'constellation',
        frameTimestampMs: meta.frameTimestampMs,
      });
    },
    [onRendererScheduleEvent]
  );

  const clearPaths = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingPaths.current = { ...EMPTY_PATHS };
    setPaths(EMPTY_PATHS);
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      update(output: PipelineFrameOutput, sourceAspect: number) {
        const { width, height } = sizeRef.current;
        const frame = frameSource === 'raw' ? output.rawFrame : output.displayFrame;
        const show =
          frame.hasPose &&
          width > 0 &&
          height > 0 &&
          sourceAspect > 0 &&
          (output.state === 'tracking' || output.state === 'warmup');

        if (!show) {
          const noPoseQuality = trackingQuality ?? 'none';
          const stateVisualStart = __DEV__ && debug ? Date.now() : 0;
          const nextMeasurementVisual = getMeasurementStateVisualConfig(
            measurementState,
            activeDomain,
            noPoseQuality,
            {
              measurementStatesEnabled,
              setupGuidesEnabled,
              stateTransitionsEnabled,
              domainEmphasisEnabled,
              scanLineEnabled,
              lowLatencyMode,
              intensity: measurementStateIntensity,
            }
          );
          const measurementVisual = updateMeasurementStateTransition(
            measurementVisualState.current,
            nextMeasurementVisual,
            frame.timestampMs
          );
          const visualCalculationMs = __DEV__ && debug ? Date.now() - stateVisualStart : 0;
          if (width > 0 && height > 0 && measurementVisual.showSetupGuide) {
            visibleRef.current = true;
            publishPaths(
              {
                ...EMPTY_PATHS,
                setupGuidePath: buildSetupGuidePath(width, height),
                scanLinePath: measurementVisual.showScanLine
                  ? buildScanLinePath(width, height, frame.timestampMs)
                  : '',
                setupGuideOpacity: measurementVisual.setupGuideOpacity,
                scanLineOpacity: measurementVisual.scanLineOpacity,
              },
              {
                frameTimestampMs: frame.timestampMs,
                geometryMs: 0,
                dotCount: 0,
                lineCount: 0,
              }
            );
            maybeLogPoseAvatarPerformance(
              perf.current,
              {
                timestampMs: frame.timestampMs,
                mode: 'constellation',
                frameSource,
                dotCount: 0,
                lineCount: 0,
                geometryMs: 0,
                smoothingEnabled,
                smoothingAlpha: 1,
                smoothingAlphaRange: [smoothingMinAlpha, smoothingMaxAlpha],
                adaptiveSmoothingEnabled,
                movementSpeedPxPerSec: 0,
                sampledDotsEnabled,
                bodyVolumeEnabled,
                torsoDotCount: 0,
                headDotCount: 0,
                volumeDotCount: 0,
                lowLatencyMode,
                confidenceFadingEnabled,
                confidenceIntensityEnabled,
                reacquisitionFadeEnabled,
                recognitionPulseEnabled: false,
                confidenceAnimationStrength,
                measurementState: measurementVisual.appliedState,
                activeDomain: measurementVisual.activeDomain,
                trackingQuality: measurementVisual.trackingQuality,
                measurementStatesEnabled,
                setupGuidesEnabled,
                stateTransitionsEnabled,
                domainEmphasisEnabled,
                scanLineEnabled,
                measurementStateIntensity,
                setupGuideVisible: measurementVisual.showSetupGuide,
                scanLineVisible: measurementVisual.showScanLine,
                visualCalculationMs,
                visualTrackingState: 'lost',
                averageConfidence: 0,
                recognitionPulseActive: false,
                skippedLandmarks: CONSTELLATION_KEYPOINTS.length,
                updateFps: 0,
                frameAgeMs: null,
              },
              debug
            );
          } else if (visibleRef.current) {
            visibleRef.current = false;
            clearPaths();
          }
          resetPoseSmoothing(smoothing.current);
          resetAvatarVisualState(visualState.current);
          return;
        }

        const wallNow = Date.now();
        const updateTiming = markPoseAvatarUpdate(perf.current, frame.timestampMs, wallNow);
        mapPoseFrameToScreenPose(
          frame,
          { width, height, sourceAspect, mirrored, fit },
          screenPose.current
        );

        const renderPose = smoothingEnabled ? smoothedPose.current : screenPose.current;
        let smoothingAlphaUsed = 1;
        let movementSpeedPxPerSec = 0;
        if (smoothingEnabled) {
          const result = smoothPoseLandmarks(
            smoothing.current,
            screenPose.current,
            smoothedPose.current,
            {
              alpha: smoothingAlpha,
              adaptive: adaptiveSmoothingEnabled,
              minAlpha: smoothingMinAlpha,
              maxAlpha: smoothingMaxAlpha,
              slowSpeedPxPerSec: smoothingSlowSpeedPxPerSec,
              fastSpeedPxPerSec: smoothingFastSpeedPxPerSec,
              snapFrames: smoothingSnapFrames,
            }
          );
          smoothingAlphaUsed = result.alpha;
          movementSpeedPxPerSec = result.movementSpeedPxPerSec;
        } else {
          resetPoseSmoothing(smoothing.current);
        }

        const resolvedTrackingQuality = trackingQuality ?? getTrackingQuality(renderPose);
        const stateVisualStart = __DEV__ && debug ? Date.now() : 0;
        const nextMeasurementVisual = getMeasurementStateVisualConfig(
          measurementState,
          activeDomain,
          resolvedTrackingQuality,
          {
            measurementStatesEnabled,
            setupGuidesEnabled,
            stateTransitionsEnabled,
            domainEmphasisEnabled,
            scanLineEnabled,
            lowLatencyMode,
            intensity: measurementStateIntensity,
          }
        );
        const measurementVisual = updateMeasurementStateTransition(
          measurementVisualState.current,
          nextMeasurementVisual,
          frame.timestampMs
        );
        const visualCalculationMs = __DEV__ && debug ? Date.now() - stateVisualStart : 0;
        const geometryStart = __DEV__ && debug ? Date.now() : 0;
        buildConstellationGeometry(renderPose, output.chainReliability, geometry.current, {
          minConfidence,
          maxDots,
          sampledDotsEnabled,
          sampleDensity,
          confidenceIntensityEnabled,
          confidenceAnimationStrength,
          radiusMultiplier: measurementVisual.radiusMultiplier,
          activeDomain: measurementVisual.activeDomain,
          domainEmphasisStrength: measurementVisual.domainEmphasisStrength,
        });
        buildBodyVolumeGeometry(renderPose, bodyVolume.current, {
          minConfidence,
          bodyVolumeEnabled,
          torsoVolumeEnabled,
          headVolumeEnabled,
          shoulderHipDensityEnabled,
          maxVolumeDots,
          torsoDotCount: torsoVolumeDots,
          headDotCount: headVolumeDots,
          shoulderHipDotCount: shoulderHipDensityDots,
          radiusMultiplier: measurementVisual.radiusMultiplier,
        });
        const lineWidth = estimateConstellationLineWidth(renderPose);
        const geometryMs = __DEV__ && debug ? Date.now() - geometryStart : 0;
        const averageConfidence = getPoseAverageConfidence(renderPose, CONSTELLATION_KEYPOINTS);
        const visual = updateAvatarVisualState(visualState.current, {
          hasPose: renderPose.hasPose,
          averageConfidence,
          timestampMs: frame.timestampMs,
          enabled: confidenceFadingEnabled || confidenceIntensityEnabled,
          reacquisitionFadeEnabled,
          recognitionPulseEnabled:
            recognitionPulseEnabled && measurementVisual.recognitionPulseAllowed && !lowLatencyMode,
          recognitionEvent,
        });

        maybeLogPoseAvatarPerformance(
          perf.current,
          {
            timestampMs: frame.timestampMs,
            mode: 'constellation',
            frameSource,
            dotCount: geometry.current.dotCount + bodyVolume.current.volumeDotCount,
            lineCount: geometry.current.lineCount,
            geometryMs,
            smoothingEnabled,
            smoothingAlpha: smoothingAlphaUsed,
            smoothingAlphaRange: [smoothingMinAlpha, smoothingMaxAlpha],
            adaptiveSmoothingEnabled,
            movementSpeedPxPerSec,
            sampledDotsEnabled,
            bodyVolumeEnabled,
            torsoDotCount: bodyVolume.current.torsoDotCount,
            headDotCount: bodyVolume.current.headDotCount,
            volumeDotCount: bodyVolume.current.volumeDotCount,
            lowLatencyMode,
            confidenceFadingEnabled,
            confidenceIntensityEnabled,
            reacquisitionFadeEnabled,
            recognitionPulseEnabled:
              recognitionPulseEnabled &&
              measurementVisual.recognitionPulseAllowed &&
              !lowLatencyMode,
            confidenceAnimationStrength,
            measurementState: measurementVisual.appliedState,
            activeDomain: measurementVisual.activeDomain,
            trackingQuality: measurementVisual.trackingQuality,
            measurementStatesEnabled,
            setupGuidesEnabled,
            stateTransitionsEnabled,
            domainEmphasisEnabled,
            scanLineEnabled,
            measurementStateIntensity,
            setupGuideVisible: measurementVisual.showSetupGuide,
            scanLineVisible: measurementVisual.showScanLine,
            visualCalculationMs,
            visualTrackingState: visual.trackingState,
            averageConfidence,
            recognitionPulseActive: visual.pulseActive,
            skippedLandmarks:
              geometry.current.skippedLandmarks + bodyVolume.current.skippedVolumeSections,
            updateFps: updateTiming.updateFps,
            frameAgeMs: updateTiming.frameAgeMs,
          },
          debug
        );

        visibleRef.current = true;
        publishPaths(
          {
            linePath: geometry.current.linePath,
            mediumLinePath: geometry.current.mediumLinePath,
            lowLinePath: geometry.current.lowLinePath,
            sampleDotPath: geometry.current.sampleDotPath,
            mediumSampleDotPath: geometry.current.mediumSampleDotPath,
            lowSampleDotPath: geometry.current.lowSampleDotPath,
            softSampleDotPath: geometry.current.softSampleDotPath,
            mediumSoftSampleDotPath: geometry.current.mediumSoftSampleDotPath,
            lowSoftSampleDotPath: geometry.current.lowSoftSampleDotPath,
            jointDotPath: geometry.current.jointDotPath,
            mediumJointDotPath: geometry.current.mediumJointDotPath,
            lowJointDotPath: geometry.current.lowJointDotPath,
            emphasizedLinePath: geometry.current.emphasizedLinePath,
            emphasizedSampleDotPath: geometry.current.emphasizedSampleDotPath,
            emphasizedSoftSampleDotPath: geometry.current.emphasizedSoftSampleDotPath,
            emphasizedJointDotPath: geometry.current.emphasizedJointDotPath,
            torsoDotPath: bodyVolume.current.torsoDotPath,
            softTorsoDotPath: bodyVolume.current.softTorsoDotPath,
            headDotPath: bodyVolume.current.headDotPath,
            softHeadDotPath: bodyVolume.current.softHeadDotPath,
            accentDotPath: bodyVolume.current.accentDotPath,
            setupGuidePath: measurementVisual.showSetupGuide
              ? buildSetupGuidePath(width, height)
              : '',
            scanLinePath: measurementVisual.showScanLine
              ? buildScanLinePath(width, height, frame.timestampMs)
              : '',
            volumeOpacity: bodyVolume.current.opacityScale,
            avatarOpacity: confidenceFadingEnabled ? visual.opacity : 1,
            pulse: visual.pulseProgress,
            lineWidth,
            keypointOpacityMultiplier: measurementVisual.keypointOpacityMultiplier,
            boneLineOpacityMultiplier: measurementVisual.boneLineOpacityMultiplier,
            sampleDotOpacityMultiplier: measurementVisual.sampleDotOpacityMultiplier,
            bodyVolumeOpacityMultiplier: measurementVisual.bodyVolumeOpacityMultiplier,
            setupGuideOpacity: measurementVisual.setupGuideOpacity,
            scanLineOpacity: measurementVisual.scanLineOpacity,
          },
          {
            frameTimestampMs: frame.timestampMs,
            geometryMs,
            dotCount: geometry.current.dotCount + bodyVolume.current.volumeDotCount,
            lineCount: geometry.current.lineCount,
          }
        );
      },
    }),
    [
      adaptiveSmoothingEnabled,
      activeDomain,
      bodyVolumeEnabled,
      confidenceAnimationStrength,
      confidenceFadingEnabled,
      confidenceIntensityEnabled,
      clearPaths,
      debug,
      frameSource,
      headVolumeDots,
      headVolumeEnabled,
      lowLatencyMode,
      maxDots,
      maxVolumeDots,
      minConfidence,
      mirrored,
      measurementState,
      measurementStateIntensity,
      measurementStatesEnabled,
      publishPaths,
      reacquisitionFadeEnabled,
      recognitionEvent,
      recognitionPulseEnabled,
      sampleDensity,
      sampledDotsEnabled,
      scanLineEnabled,
      setupGuidesEnabled,
      shoulderHipDensityDots,
      shoulderHipDensityEnabled,
      smoothingAlpha,
      smoothingEnabled,
      smoothingFastSpeedPxPerSec,
      smoothingMaxAlpha,
      smoothingMinAlpha,
      smoothingSlowSpeedPxPerSec,
      smoothingSnapFrames,
      stateTransitionsEnabled,
      torsoVolumeDots,
      torsoVolumeEnabled,
      trackingQuality,
      domainEmphasisEnabled,
    ]
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
          d={paths.setupGuidePath || EMPTY_D}
          stroke={colors.accentGold}
          strokeOpacity={paths.setupGuideOpacity}
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.scanLinePath || EMPTY_D}
          stroke={colors.accentGold}
          strokeOpacity={paths.scanLineOpacity}
          strokeWidth={1}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={paths.softTorsoDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            0.16 * paths.volumeOpacity * paths.avatarOpacity * paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.torsoDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            (0.27 + paths.pulse) *
            paths.volumeOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.softHeadDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={
            0.18 * paths.volumeOpacity * paths.avatarOpacity * paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.headDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            (0.31 + paths.pulse) *
            paths.volumeOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.accentDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={
            0.24 * paths.volumeOpacity * paths.avatarOpacity * paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.linePath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={0.24 * paths.avatarOpacity * paths.boneLineOpacityMultiplier}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.mediumLinePath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={0.18 * paths.avatarOpacity * paths.boneLineOpacityMultiplier}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.lowLinePath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={0.1 * paths.avatarOpacity * paths.boneLineOpacityMultiplier}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.emphasizedLinePath || EMPTY_D}
          stroke={colors.accentGold}
          strokeOpacity={0.12 * paths.avatarOpacity * paths.boneLineOpacityMultiplier}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.softSampleDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={0.34 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.mediumSoftSampleDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={0.24 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.lowSoftSampleDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={0.14 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.sampleDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={0.5 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.mediumSampleDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={0.36 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.lowSampleDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={0.2 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.emphasizedSoftSampleDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={0.12 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.emphasizedSampleDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={0.16 * paths.avatarOpacity * paths.sampleDotOpacityMultiplier}
        />
        <Path
          d={paths.jointDotPath || EMPTY_D}
          fill={skeleton.bright}
          fillOpacity={(0.86 + paths.pulse) * paths.avatarOpacity * paths.keypointOpacityMultiplier}
        />
        <Path
          d={paths.mediumJointDotPath || EMPTY_D}
          fill={skeleton.bright}
          fillOpacity={0.6 * paths.avatarOpacity * paths.keypointOpacityMultiplier}
        />
        <Path
          d={paths.lowJointDotPath || EMPTY_D}
          fill={skeleton.bright}
          fillOpacity={0.32 * paths.avatarOpacity * paths.keypointOpacityMultiplier}
        />
        <Path
          d={paths.emphasizedJointDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={0.18 * paths.avatarOpacity * paths.keypointOpacityMultiplier}
        />
      </Svg>
    </View>
  );
});
