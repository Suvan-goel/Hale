import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import { colors, skeleton } from '../theme';
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
import {
  buildPointCloudBodyGeometry,
  createPointCloudBodyGeometry,
} from './pointCloudBodyGeometry';
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
  createPoseSmoothingState,
  resetPoseSmoothing,
  smoothPoseLandmarks,
} from './poseSmoothing';

interface PointCloudBodyPaths {
  torsoDotPath: string;
  softTorsoDotPath: string;
  headDotPath: string;
  softHeadDotPath: string;
  limbDotPath: string;
  softLimbDotPath: string;
  extremityDotPath: string;
  softExtremityDotPath: string;
  activeDotPath: string;
  softActiveDotPath: string;
  keypointDotPath: string;
  connectionPath: string;
  skeletonLinePath: string;
  skeletonMediumLinePath: string;
  skeletonLowLinePath: string;
  setupGuidePath: string;
  scanLinePath: string;
  avatarOpacity: number;
  bodyOpacity: number;
  pulse: number;
  lineWidth: number;
  keypointOpacityMultiplier: number;
  bodyVolumeOpacityMultiplier: number;
  connectionOpacity: number;
  skeletonLineOpacity: number;
  activeDotOpacityMultiplier: number;
  setupGuideOpacity: number;
  scanLineOpacity: number;
}

const EMPTY_PATHS: PointCloudBodyPaths = {
  torsoDotPath: '',
  softTorsoDotPath: '',
  headDotPath: '',
  softHeadDotPath: '',
  limbDotPath: '',
  softLimbDotPath: '',
  extremityDotPath: '',
  softExtremityDotPath: '',
  activeDotPath: '',
  softActiveDotPath: '',
  keypointDotPath: '',
  connectionPath: '',
  skeletonLinePath: '',
  skeletonMediumLinePath: '',
  skeletonLowLinePath: '',
  setupGuidePath: '',
  scanLinePath: '',
  avatarOpacity: 1,
  bodyOpacity: 1,
  pulse: 0,
  lineWidth: 1,
  keypointOpacityMultiplier: 1,
  bodyVolumeOpacityMultiplier: 1,
  connectionOpacity: 0,
  skeletonLineOpacity: 0,
  activeDotOpacityMultiplier: 1,
  setupGuideOpacity: 0,
  scanLineOpacity: 0,
};

const EMPTY_D = 'M-9-9';

export const PointCloudBodyPoseRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function PointCloudBodyPoseRenderer(
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
    pointCloudBodyEnabled = true,
    pointCloudBodyDensity = 'medium',
    pointCloudBodyMaxDots = 800,
    pointCloudBodyShowConnections = false,
    pointCloudBodyConnectionOpacity = 0.055,
    pointCloudBodyConnectionMaxLines = 120,
    pointCloudBodyShowSkeletonLines = false,
    pointCloudBodyShowKeypoints = true,
    pointCloudBodyActiveParts,
    pointCloudBodyDotScale = 1.26,
    pointCloudBodyOpacity = 1,
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
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const screenPose = React.useRef(createScreenPoseLandmarks());
  const smoothedPose = React.useRef(createScreenPoseLandmarks());
  const smoothing = React.useRef(createPoseSmoothingState());
  const bodyGeometry = React.useRef(createPointCloudBodyGeometry(900));
  const skeletonGeometry = React.useRef(createConstellationGeometry(0));
  const visualState = React.useRef(createAvatarVisualState());
  const measurementVisualState = React.useRef(createMeasurementStateTransitionState());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const pendingPaths = React.useRef<PointCloudBodyPaths>({ ...EMPTY_PATHS });
  const rafRef = React.useRef<number | null>(null);
  const visibleRef = React.useRef(false);
  const [paths, setPaths] = React.useState<PointCloudBodyPaths>(EMPTY_PATHS);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const publishPaths = React.useCallback((next: PointCloudBodyPaths) => {
    pendingPaths.current.torsoDotPath = next.torsoDotPath;
    pendingPaths.current.softTorsoDotPath = next.softTorsoDotPath;
    pendingPaths.current.headDotPath = next.headDotPath;
    pendingPaths.current.softHeadDotPath = next.softHeadDotPath;
    pendingPaths.current.limbDotPath = next.limbDotPath;
    pendingPaths.current.softLimbDotPath = next.softLimbDotPath;
    pendingPaths.current.extremityDotPath = next.extremityDotPath;
    pendingPaths.current.softExtremityDotPath = next.softExtremityDotPath;
    pendingPaths.current.activeDotPath = next.activeDotPath;
    pendingPaths.current.softActiveDotPath = next.softActiveDotPath;
    pendingPaths.current.keypointDotPath = next.keypointDotPath;
    pendingPaths.current.connectionPath = next.connectionPath;
    pendingPaths.current.skeletonLinePath = next.skeletonLinePath;
    pendingPaths.current.skeletonMediumLinePath = next.skeletonMediumLinePath;
    pendingPaths.current.skeletonLowLinePath = next.skeletonLowLinePath;
    pendingPaths.current.setupGuidePath = next.setupGuidePath;
    pendingPaths.current.scanLinePath = next.scanLinePath;
    pendingPaths.current.avatarOpacity = next.avatarOpacity;
    pendingPaths.current.bodyOpacity = next.bodyOpacity;
    pendingPaths.current.pulse = next.pulse;
    pendingPaths.current.lineWidth = next.lineWidth;
    pendingPaths.current.keypointOpacityMultiplier = next.keypointOpacityMultiplier;
    pendingPaths.current.bodyVolumeOpacityMultiplier = next.bodyVolumeOpacityMultiplier;
    pendingPaths.current.connectionOpacity = next.connectionOpacity;
    pendingPaths.current.skeletonLineOpacity = next.skeletonLineOpacity;
    pendingPaths.current.activeDotOpacityMultiplier = next.activeDotOpacityMultiplier;
    pendingPaths.current.setupGuideOpacity = next.setupGuideOpacity;
    pendingPaths.current.scanLineOpacity = next.scanLineOpacity;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setPaths({ ...pendingPaths.current });
    });
  }, []);

  const clearPaths = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingPaths.current = { ...EMPTY_PATHS };
    setPaths(EMPTY_PATHS);
  }, []);

  React.useImperativeHandle(ref, () => ({
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
          publishPaths({
            ...EMPTY_PATHS,
            setupGuidePath: buildSetupGuidePath(width, height),
            scanLinePath: measurementVisual.showScanLine ? buildScanLinePath(width, height, frame.timestampMs) : '',
            setupGuideOpacity: measurementVisual.setupGuideOpacity,
            scanLineOpacity: measurementVisual.scanLineOpacity,
          });
          maybeLogPoseAvatarPerformance(
            perf.current,
            {
              timestampMs: frame.timestampMs,
              mode: 'point_cloud_body',
              frameSource,
              dotCount: 0,
              lineCount: 0,
              geometryMs: 0,
              smoothingEnabled,
              smoothingAlpha: 1,
              smoothingAlphaRange: [smoothingMinAlpha, smoothingMaxAlpha],
              adaptiveSmoothingEnabled,
              movementSpeedPxPerSec: 0,
              sampledDotsEnabled: false,
              bodyVolumeEnabled: pointCloudBodyEnabled,
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
              bodyStyle: 'point_cloud_body',
              pointCloudBodyDensity,
              pointCloudBodyMaxDots,
              pointCloudBodyShowConnections,
              pointCloudBodyShowSkeletonLines,
              pointCloudBodyShowKeypoints,
              pointCloudBodyDotScale,
              pointCloudBodyOpacity,
              connectionLineCount: 0,
              skippedBodyPartCount: 0,
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
        const result = smoothPoseLandmarks(smoothing.current, screenPose.current, smoothedPose.current, {
          alpha: smoothingAlpha,
          adaptive: adaptiveSmoothingEnabled,
          minAlpha: smoothingMinAlpha,
          maxAlpha: smoothingMaxAlpha,
          slowSpeedPxPerSec: smoothingSlowSpeedPxPerSec,
          fastSpeedPxPerSec: smoothingFastSpeedPxPerSec,
          snapFrames: smoothingSnapFrames,
        });
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
      buildPointCloudBodyGeometry(renderPose, bodyGeometry.current, {
        minConfidence,
        pointCloudBodyEnabled,
        density: pointCloudBodyDensity,
        maxDots: pointCloudBodyMaxDots,
        lowLatencyMode,
        showConnections: pointCloudBodyShowConnections,
        connectionMaxLines: pointCloudBodyConnectionMaxLines,
        showKeypoints: pointCloudBodyShowKeypoints,
        activeBodyParts: pointCloudBodyActiveParts,
        dotScale: pointCloudBodyDotScale,
        opacity: pointCloudBodyOpacity,
        radiusMultiplier: measurementVisual.radiusMultiplier,
      });
      if (pointCloudBodyShowSkeletonLines) {
        buildConstellationGeometry(renderPose, output.chainReliability, skeletonGeometry.current, {
          minConfidence,
          maxDots: 0,
          sampledDotsEnabled: false,
          sampleDensity: 0,
          confidenceIntensityEnabled: false,
          confidenceAnimationStrength: 'off',
          radiusMultiplier: measurementVisual.radiusMultiplier,
          activeDomain: null,
          domainEmphasisStrength: 0,
        });
      }
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
          mode: 'point_cloud_body',
          frameSource,
          dotCount: bodyGeometry.current.dotCount,
          lineCount: bodyGeometry.current.connectionLineCount + (pointCloudBodyShowSkeletonLines ? skeletonGeometry.current.lineCount : 0),
          geometryMs,
          smoothingEnabled,
          smoothingAlpha: smoothingAlphaUsed,
          smoothingAlphaRange: [smoothingMinAlpha, smoothingMaxAlpha],
          adaptiveSmoothingEnabled,
          movementSpeedPxPerSec,
          sampledDotsEnabled: false,
          bodyVolumeEnabled: pointCloudBodyEnabled,
          torsoDotCount: bodyGeometry.current.torsoDotCount,
          headDotCount: bodyGeometry.current.headDotCount,
          volumeDotCount: bodyGeometry.current.dotCount,
          lowLatencyMode,
          confidenceFadingEnabled,
          confidenceIntensityEnabled,
          reacquisitionFadeEnabled,
          recognitionPulseEnabled:
            recognitionPulseEnabled && measurementVisual.recognitionPulseAllowed && !lowLatencyMode,
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
          skippedLandmarks: bodyGeometry.current.skippedBodyPartCount,
          updateFps: updateTiming.updateFps,
          frameAgeMs: updateTiming.frameAgeMs,
          bodyStyle: 'point_cloud_body',
          pointCloudBodyDensity,
          pointCloudBodyMaxDots,
          pointCloudBodyShowConnections,
          pointCloudBodyShowSkeletonLines,
          pointCloudBodyShowKeypoints,
          pointCloudBodyDotScale,
          pointCloudBodyOpacity,
          upperArmDotCount: bodyGeometry.current.upperArmDotCount,
          forearmDotCount: bodyGeometry.current.forearmDotCount,
          thighDotCount: bodyGeometry.current.thighDotCount,
          lowerLegDotCount: bodyGeometry.current.lowerLegDotCount,
          handDotCount: bodyGeometry.current.handDotCount,
          footDotCount: bodyGeometry.current.footDotCount,
          keypointDotCount: bodyGeometry.current.keypointDotCount,
          activeDotCount: bodyGeometry.current.activeDotCount,
          connectionLineCount: bodyGeometry.current.connectionLineCount,
          skippedBodyPartCount: bodyGeometry.current.skippedBodyPartCount,
        },
        debug
      );

      visibleRef.current = true;
      publishPaths({
        torsoDotPath: bodyGeometry.current.torsoDotPath,
        softTorsoDotPath: bodyGeometry.current.softTorsoDotPath,
        headDotPath: bodyGeometry.current.headDotPath,
        softHeadDotPath: bodyGeometry.current.softHeadDotPath,
        limbDotPath: bodyGeometry.current.limbDotPath,
        softLimbDotPath: bodyGeometry.current.softLimbDotPath,
        extremityDotPath: bodyGeometry.current.extremityDotPath,
        softExtremityDotPath: bodyGeometry.current.softExtremityDotPath,
        activeDotPath: bodyGeometry.current.activeDotPath,
        softActiveDotPath: bodyGeometry.current.softActiveDotPath,
        keypointDotPath: bodyGeometry.current.keypointDotPath,
        connectionPath: bodyGeometry.current.connectionPath,
        skeletonLinePath: pointCloudBodyShowSkeletonLines ? skeletonGeometry.current.linePath : '',
        skeletonMediumLinePath: pointCloudBodyShowSkeletonLines ? skeletonGeometry.current.mediumLinePath : '',
        skeletonLowLinePath: pointCloudBodyShowSkeletonLines ? skeletonGeometry.current.lowLinePath : '',
        setupGuidePath: measurementVisual.showSetupGuide ? buildSetupGuidePath(width, height) : '',
        scanLinePath: measurementVisual.showScanLine ? buildScanLinePath(width, height, frame.timestampMs) : '',
        avatarOpacity: confidenceFadingEnabled ? visual.opacity : 1,
        bodyOpacity: bodyGeometry.current.opacityScale,
        pulse: visual.pulseProgress,
        lineWidth,
        keypointOpacityMultiplier: measurementVisual.keypointOpacityMultiplier,
        bodyVolumeOpacityMultiplier: measurementVisual.bodyVolumeOpacityMultiplier,
        connectionOpacity: pointCloudBodyConnectionOpacity,
        skeletonLineOpacity: pointCloudBodyShowSkeletonLines ? 0.055 : 0,
        activeDotOpacityMultiplier: pointCloudBodyActiveParts && pointCloudBodyActiveParts.length > 0 ? 1 : 0,
        setupGuideOpacity: measurementVisual.setupGuideOpacity,
        scanLineOpacity: measurementVisual.scanLineOpacity,
      });
    },
  }), [
    activeDomain,
    adaptiveSmoothingEnabled,
    clearPaths,
    confidenceAnimationStrength,
    confidenceFadingEnabled,
    confidenceIntensityEnabled,
    debug,
    domainEmphasisEnabled,
    frameSource,
    lowLatencyMode,
    measurementState,
    measurementStateIntensity,
    measurementStatesEnabled,
    minConfidence,
    mirrored,
    pointCloudBodyConnectionMaxLines,
    pointCloudBodyConnectionOpacity,
    pointCloudBodyActiveParts,
    pointCloudBodyDensity,
    pointCloudBodyDotScale,
    pointCloudBodyEnabled,
    pointCloudBodyMaxDots,
    pointCloudBodyOpacity,
    pointCloudBodyShowConnections,
    pointCloudBodyShowKeypoints,
    pointCloudBodyShowSkeletonLines,
    publishPaths,
    reacquisitionFadeEnabled,
    recognitionEvent,
    recognitionPulseEnabled,
    scanLineEnabled,
    setupGuidesEnabled,
    smoothingAlpha,
    smoothingEnabled,
    smoothingFastSpeedPxPerSec,
    smoothingMaxAlpha,
    smoothingMinAlpha,
    smoothingSlowSpeedPxPerSec,
    smoothingSnapFrames,
    stateTransitionsEnabled,
    trackingQuality,
  ]);

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
      <Svg style={StyleSheet.absoluteFill}>
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
          d={paths.connectionPath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={paths.connectionOpacity * paths.avatarOpacity * paths.bodyVolumeOpacityMultiplier}
          strokeWidth={0.8}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={paths.skeletonLinePath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={paths.skeletonLineOpacity * paths.avatarOpacity}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.skeletonMediumLinePath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={paths.skeletonLineOpacity * 0.7 * paths.avatarOpacity}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.skeletonLowLinePath || EMPTY_D}
          stroke={skeleton.figureTop}
          strokeOpacity={paths.skeletonLineOpacity * 0.45 * paths.avatarOpacity}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={paths.softTorsoDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            0.28 *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.torsoDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            (0.7 + paths.pulse) *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.softLimbDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            0.24 *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.limbDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            (0.62 + paths.pulse * 0.8) *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.softHeadDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={
            0.24 *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.headDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            (0.68 + paths.pulse * 0.75) *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.softExtremityDotPath || EMPTY_D}
          fill={colors.accentGold}
          fillOpacity={
            0.2 *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.extremityDotPath || EMPTY_D}
          fill={skeleton.figureTop}
          fillOpacity={
            (0.58 + paths.pulse * 0.65) *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.softActiveDotPath || EMPTY_D}
          fill={colors.restorativeGreen}
          fillOpacity={
            0.34 *
            paths.activeDotOpacityMultiplier *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.activeDotPath || EMPTY_D}
          fill={colors.restorativeGreen}
          fillOpacity={
            (0.82 + paths.pulse * 0.5) *
            paths.activeDotOpacityMultiplier *
            paths.bodyOpacity *
            paths.avatarOpacity *
            paths.bodyVolumeOpacityMultiplier
          }
        />
        <Path
          d={paths.keypointDotPath || EMPTY_D}
          fill={skeleton.bright}
          fillOpacity={0.26 * paths.avatarOpacity * paths.keypointOpacityMultiplier}
        />
      </Svg>
    </View>
  );
});
