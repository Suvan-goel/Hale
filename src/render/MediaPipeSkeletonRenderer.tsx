import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import { LM, type PoseFrame } from '../pose/types';
import {
  createPoseAvatarPerformanceState,
  markPoseAvatarUpdate,
  maybeLogPoseAvatarPerformance,
} from './poseAvatarPerformance';
import {
  computeViewportTransform,
  mapLandmarkX,
  mapLandmarkY,
  type PoseScreenViewport,
} from './poseCoordinateMapper';
import type { PoseAvatarRendererHandle, PoseAvatarRendererProps } from './poseAvatarTypes';

interface MediaPipeSkeletonPaths {
  linePath: string;
  lineWidth: number;
}

interface MediaPipeSkeletonBuildResult {
  linePath: string;
  lineCount: number;
}

const EMPTY_D = 'M-9-9';
const EMPTY_PATHS: MediaPipeSkeletonPaths = {
  linePath: '',
  lineWidth: 4,
};
const SKELETON_STROKE = '#000000';

const MEDIAPIPE_POSE_CONNECTIONS: readonly (readonly [LM, LM])[] = [
  [LM.NOSE, LM.LEFT_EYE_INNER],
  [LM.LEFT_EYE_INNER, LM.LEFT_EYE],
  [LM.LEFT_EYE, LM.LEFT_EYE_OUTER],
  [LM.LEFT_EYE_OUTER, LM.LEFT_EAR],
  [LM.NOSE, LM.RIGHT_EYE_INNER],
  [LM.RIGHT_EYE_INNER, LM.RIGHT_EYE],
  [LM.RIGHT_EYE, LM.RIGHT_EYE_OUTER],
  [LM.RIGHT_EYE_OUTER, LM.RIGHT_EAR],
  [LM.MOUTH_LEFT, LM.MOUTH_RIGHT],
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  [LM.LEFT_WRIST, LM.LEFT_PINKY],
  [LM.LEFT_WRIST, LM.LEFT_INDEX],
  [LM.LEFT_WRIST, LM.LEFT_THUMB],
  [LM.LEFT_PINKY, LM.LEFT_INDEX],
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  [LM.RIGHT_WRIST, LM.RIGHT_PINKY],
  [LM.RIGHT_WRIST, LM.RIGHT_INDEX],
  [LM.RIGHT_WRIST, LM.RIGHT_THUMB],
  [LM.RIGHT_PINKY, LM.RIGHT_INDEX],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_HEEL],
  [LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX],
  [LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX],
];

export const MediaPipeSkeletonRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function MediaPipeSkeletonRenderer(
  {
    mirrored = true,
    fit = 'cover',
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
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const buildResult = React.useRef<MediaPipeSkeletonBuildResult>({
    linePath: '',
    lineCount: 0,
  });
  const lastRenderedTimestampRef = React.useRef<number | null>(null);
  const visibleRef = React.useRef(false);
  const [paths, setPaths] = React.useState<MediaPipeSkeletonPaths>(EMPTY_PATHS);

  React.useImperativeHandle(
    ref,
    () => ({
      update(output: PipelineFrameOutput, sourceAspect: number) {
        const { width, height } = sizeRef.current;
        const frame = frameSource === 'raw' ? output.rawFrame : output.displayFrame;
        const poseRenderable = frame.hasPose && width > 0 && height > 0 && sourceAspect > 0;

        if (!poseRenderable) {
          if (visibleRef.current) {
            visibleRef.current = false;
            setPaths(EMPTY_PATHS);
          }
          return;
        }
        if (
          !Number.isFinite(frame.timestampMs) ||
          (lastRenderedTimestampRef.current !== null &&
            frame.timestampMs <= lastRenderedTimestampRef.current)
        ) {
          onRendererScheduleEvent?.({
            type: 'rejected',
            mode: 'mediapipe_skeleton',
            frameTimestampMs: frame.timestampMs,
          });
          return;
        }
        lastRenderedTimestampRef.current = frame.timestampMs;

        const wallNow = Date.now();
        const updateTiming = markPoseAvatarUpdate(perf.current, frame.timestampMs, wallNow);
        buildMediaPipeSkeletonPath(
          frame,
          {
            width,
            height,
            sourceAspect,
            mirrored,
            fit,
          },
          minConfidence,
          buildResult.current
        );

        visibleRef.current = true;
        setPaths({
          linePath: buildResult.current.linePath,
          lineWidth: estimateSkeletonLineWidth(width, height),
        });

        onRendererScheduleEvent?.({
          type: 'published',
          mode: 'mediapipe_skeleton',
          frameTimestampMs: frame.timestampMs,
          geometryMs: 0,
          dotCount: 0,
          lineCount: buildResult.current.lineCount,
        });

        maybeLogPoseAvatarPerformance(
          perf.current,
          {
            timestampMs: frame.timestampMs,
            mode: 'mediapipe_skeleton',
            frameSource,
            dotCount: 0,
            lineCount: buildResult.current.lineCount,
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
            measurementStatesEnabled: false,
            setupGuidesEnabled: false,
            stateTransitionsEnabled: false,
            domainEmphasisEnabled: false,
            scanLineEnabled: false,
            measurementStateIntensity: 'off',
            setupGuideVisible: false,
            scanLineVisible: false,
            visualCalculationMs: 0,
            visualTrackingState: 'tracking',
            averageConfidence: 1,
            recognitionPulseActive: false,
            skippedLandmarks:
              MEDIAPIPE_POSE_CONNECTIONS.length - buildResult.current.lineCount,
            updateFps: updateTiming.updateFps,
            frameAgeMs: updateTiming.frameAgeMs,
            inferenceMs: output.inferenceMs,
          },
          debug
        );
      },
    }),
    [
      activeDomain,
      debug,
      fit,
      frameSource,
      lowLatencyMode,
      measurementState,
      minConfidence,
      mirrored,
      onRendererScheduleEvent,
      trackingQuality,
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
          d={paths.linePath || EMPTY_D}
          stroke={SKELETON_STROKE}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
});

function buildMediaPipeSkeletonPath(
  frame: PoseFrame,
  viewport: PoseScreenViewport,
  minConfidence: number,
  out: MediaPipeSkeletonBuildResult
): void {
  const transform = computeViewportTransform(viewport);
  let path = '';
  let lineCount = 0;

  for (let i = 0; i < MEDIAPIPE_POSE_CONNECTIONS.length; i++) {
    const [a, b] = MEDIAPIPE_POSE_CONNECTIONS[i];
    if (
      !landmarkRenderable(frame, a, minConfidence) ||
      !landmarkRenderable(frame, b, minConfidence)
    ) {
      continue;
    }
    path += `M${f(mapLandmarkX(frame, a, transform))} ${f(mapLandmarkY(frame, a, transform))}`;
    path += `L${f(mapLandmarkX(frame, b, transform))} ${f(mapLandmarkY(frame, b, transform))}`;
    lineCount++;
  }

  out.linePath = path;
  out.lineCount = lineCount;
}

function landmarkRenderable(frame: PoseFrame, lm: LM, minConfidence: number): boolean {
  const x = frame.xs[lm];
  const y = frame.ys[lm];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.min(clamp01(frame.visibility[lm]), clamp01(frame.presence[lm])) >= minConfidence;
}

function estimateSkeletonLineWidth(width: number, height: number): number {
  return Math.max(2.4, Math.min(5.2, Math.min(width, height) * 0.008));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function f(n: number): string {
  return n.toFixed(1);
}
