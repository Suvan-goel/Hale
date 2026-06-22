import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import { skeleton } from '../theme';
import {
  createPoseAvatarPerformanceState,
  markPoseAvatarUpdate,
  maybeLogPoseAvatarPerformance,
} from './poseAvatarPerformance';
import { buildSkeletonPaths, emptySkeletonPaths, SkeletonPaths } from './skeletonGeometry';
import type { PoseAvatarRendererHandle, PoseAvatarRendererProps } from './poseAvatarTypes';

const DIM = skeleton.dim;
const FIGURE_FILL = 'url(#haleFigure)';

const EMPTY_D = 'M-9-9';

export const ClassicPoseRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function ClassicPoseRenderer(
  {
    mirrored = true,
    fit = 'cover',
    debug = false,
    measurementState,
    activeDomain = null,
    trackingQuality = 'high',
    lowLatencyMode = false,
    measurementStatesEnabled = false,
    setupGuidesEnabled = false,
    stateTransitionsEnabled = false,
    domainEmphasisEnabled = false,
    scanLineEnabled = false,
    measurementStateIntensity = 'off',
    frameSource = 'display',
    onRendererScheduleEvent,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const scratch = React.useRef<SkeletonPaths>(emptySkeletonPaths());
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const visibleRef = React.useRef(false);
  const [paths, setPaths] = React.useState<SkeletonPaths>(emptySkeletonPaths);

  React.useImperativeHandle(ref, () => ({
    update(output: PipelineFrameOutput, sourceAspect: number) {
      const { width, height } = sizeRef.current;
      // Default to the lighter-smoothed display frame for production
      // responsiveness, but allow raw landmarks for latency diagnostics.
      const frame = frameSource === 'raw' ? output.rawFrame : output.displayFrame;
      const show =
        frame.hasPose && width > 0 && (output.state === 'tracking' || output.state === 'warmup');

      if (show) {
        const timing = markPoseAvatarUpdate(perf.current, frame.timestampMs, Date.now());
        buildSkeletonPaths(
          frame,
          output.chainReliability,
          { width, height, sourceAspect, mirrored, fit },
          scratch.current
        );
        visibleRef.current = true;
        setPaths({
          bright: scratch.current.bright,
          dim: scratch.current.dim,
          head: scratch.current.head,
        });
        onRendererScheduleEvent?.({
          type: 'published',
          mode: 'classic',
          frameTimestampMs: frame.timestampMs,
          geometryMs: 0,
          dotCount: 0,
          lineCount: 0,
        });
        maybeLogPoseAvatarPerformance(
          perf.current,
          {
            timestampMs: frame.timestampMs,
            mode: 'classic',
            frameSource,
            dotCount: 0,
            lineCount: 0,
            geometryMs: 0,
            smoothingEnabled: false,
            smoothingAlpha: 1,
            smoothingAlphaRange: [1, 1],
            adaptiveSmoothingEnabled: false,
            movementSpeedPxPerSec: 0,
            sampledDotsEnabled: false,
            bodyVolumeEnabled: false,
            torsoDotCount: 0,
            headDotCount: 0,
            volumeDotCount: 0,
            lowLatencyMode,
            confidenceFadingEnabled: false,
            confidenceIntensityEnabled: false,
            reacquisitionFadeEnabled: false,
            recognitionPulseEnabled: false,
            confidenceAnimationStrength: 'off',
            measurementState: measurementState ?? 'default',
            activeDomain,
            trackingQuality,
            measurementStatesEnabled,
            setupGuidesEnabled,
            stateTransitionsEnabled,
            domainEmphasisEnabled,
            scanLineEnabled,
            measurementStateIntensity,
            setupGuideVisible: false,
            scanLineVisible: false,
            visualCalculationMs: 0,
            visualTrackingState: 'tracking',
            averageConfidence: 1,
            recognitionPulseActive: false,
            skippedLandmarks: 0,
            updateFps: timing.updateFps,
            frameAgeMs: timing.frameAgeMs,
          },
          debug
        );
      } else if (visibleRef.current) {
        visibleRef.current = false;
        setPaths(emptySkeletonPaths());
      }
    },
  }));

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
          <LinearGradient id="haleFigure" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skeleton.figureTop} />
            <Stop offset="1" stopColor={skeleton.figureBottom} />
          </LinearGradient>
        </Defs>
        <Path d={paths.dim || EMPTY_D} fill={DIM} />
        <Path d={paths.bright || EMPTY_D} fill={FIGURE_FILL} />
        <Path d={paths.head || EMPTY_D} fill={FIGURE_FILL} />
      </Svg>
    </View>
  );
});
