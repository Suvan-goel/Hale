import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

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
  pointPath: string;
  lineWidth: number;
  pointRadius: number;
  labels: MediaPipeSkeletonLabel[];
}

interface MediaPipeSkeletonBuildResult {
  linePath: string;
  pointPath: string;
  lineCount: number;
  pointCount: number;
  labels: MediaPipeSkeletonLabel[];
}

interface MediaPipeSkeletonLabel {
  id: string;
  label: string;
  x: number;
  y: number;
}

const EMPTY_D = 'M-9-9';
const EMPTY_PATHS: MediaPipeSkeletonPaths = {
  linePath: '',
  pointPath: '',
  lineWidth: 4,
  pointRadius: 2,
  labels: [],
};
const SKELETON_STROKE = '#EEE2DC';
const SKELETON_POINT = '#CBA89D';

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

const MEDIAPIPE_BODY_CONNECTIONS: readonly (readonly [LM, LM])[] = [
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

const KEY_LANDMARK_LABELS: readonly (readonly [LM, string])[] = [
  [LM.NOSE, 'nose'],
  [LM.LEFT_SHOULDER, 'L shoulder'],
  [LM.RIGHT_SHOULDER, 'R shoulder'],
  [LM.LEFT_ELBOW, 'L elbow'],
  [LM.RIGHT_ELBOW, 'R elbow'],
  [LM.LEFT_WRIST, 'L wrist'],
  [LM.RIGHT_WRIST, 'R wrist'],
  [LM.LEFT_HIP, 'L hip'],
  [LM.RIGHT_HIP, 'R hip'],
  [LM.LEFT_KNEE, 'L knee'],
  [LM.RIGHT_KNEE, 'R knee'],
  [LM.LEFT_ANKLE, 'L ankle'],
  [LM.RIGHT_ANKLE, 'R ankle'],
  [LM.LEFT_HEEL, 'L heel'],
  [LM.RIGHT_HEEL, 'R heel'],
  [LM.LEFT_FOOT_INDEX, 'L foot'],
  [LM.RIGHT_FOOT_INDEX, 'R foot'],
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
    mediapipeSkeletonStroke = SKELETON_STROKE,
    mediapipeSkeletonOpacity = 1,
    mediapipeSkeletonLineWidthScale = 1,
    mediapipeSkeletonConnectionSet = 'full',
    mediapipeSkeletonShowLandmarks = false,
    mediapipeSkeletonShowLabels = false,
    mediapipeSkeletonPointColor = SKELETON_POINT,
    mediapipeSkeletonLabelColor = SKELETON_POINT,
    onRendererScheduleEvent,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const perf = React.useRef(createPoseAvatarPerformanceState());
  const buildResult = React.useRef<MediaPipeSkeletonBuildResult>({
    linePath: '',
    pointPath: '',
    lineCount: 0,
    pointCount: 0,
    labels: [],
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
          {
            connectionSet: mediapipeSkeletonConnectionSet,
            showLandmarks: mediapipeSkeletonShowLandmarks,
            showLabels: mediapipeSkeletonShowLabels,
          },
          buildResult.current
        );

        visibleRef.current = true;
        setPaths({
          linePath: buildResult.current.linePath,
          pointPath: buildResult.current.pointPath,
          lineWidth: estimateSkeletonLineWidth(width, height) * mediapipeSkeletonLineWidthScale,
          pointRadius: estimateSkeletonPointRadius(width, height),
          labels: buildResult.current.labels.map((label) => ({ ...label })),
        });

        onRendererScheduleEvent?.({
          type: 'published',
          mode: 'mediapipe_skeleton',
          frameTimestampMs: frame.timestampMs,
          geometryMs: 0,
          dotCount: 0,
          lineCount: buildResult.current.lineCount + buildResult.current.pointCount,
        });

        maybeLogPoseAvatarPerformance(
          perf.current,
          {
            timestampMs: frame.timestampMs,
            mode: 'mediapipe_skeleton',
            frameSource,
            lineCount: buildResult.current.lineCount,
            lowLatencyMode,
            measurementState: measurementState ?? 'default',
            activeDomain,
            trackingQuality,
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
      mediapipeSkeletonConnectionSet,
      mediapipeSkeletonShowLabels,
      mediapipeSkeletonShowLandmarks,
      mediapipeSkeletonLineWidthScale,
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
          stroke={mediapipeSkeletonStroke}
          strokeWidth={paths.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={mediapipeSkeletonOpacity}
        />
        {paths.pointPath ? (
          <Path
            d={paths.pointPath}
            fill={mediapipeSkeletonPointColor}
            opacity={mediapipeSkeletonOpacity}
          />
        ) : null}
        {paths.labels.map((label) => (
          <SvgText
            key={label.id}
            x={label.x}
            y={label.y}
            fill={mediapipeSkeletonLabelColor}
            fontSize={10}
            fontWeight="600"
            opacity={mediapipeSkeletonOpacity}
          >
            {label.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
});

function buildMediaPipeSkeletonPath(
  frame: PoseFrame,
  viewport: PoseScreenViewport,
  minConfidence: number,
  options: {
    connectionSet: 'full' | 'body';
    showLandmarks: boolean;
    showLabels: boolean;
  },
  out: MediaPipeSkeletonBuildResult
): void {
  const transform = computeViewportTransform(viewport);
  let path = '';
  let pointPath = '';
  let lineCount = 0;
  let pointCount = 0;
  out.labels.length = 0;
  const connections =
    options.connectionSet === 'body' ? MEDIAPIPE_BODY_CONNECTIONS : MEDIAPIPE_POSE_CONNECTIONS;

  for (let i = 0; i < connections.length; i++) {
    const [a, b] = connections[i];
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

  if (options.showLandmarks) {
    for (let lm = 0; lm < frame.xs.length; lm++) {
      if (!landmarkRenderable(frame, lm as LM, minConfidence)) continue;
      pointPath += circlePath(
        mapLandmarkX(frame, lm as LM, transform),
        mapLandmarkY(frame, lm as LM, transform),
        estimatePointRadiusFromTransform(transform)
      );
      pointCount++;
    }
  }

  if (options.showLabels) {
    for (const [lm, label] of KEY_LANDMARK_LABELS) {
      if (!landmarkRenderable(frame, lm, minConfidence)) continue;
      out.labels.push({
        id: `${lm}`,
        label,
        x: mapLandmarkX(frame, lm, transform) + 5,
        y: mapLandmarkY(frame, lm, transform) - 5,
      });
    }
  }

  out.linePath = path;
  out.pointPath = pointPath;
  out.lineCount = lineCount;
  out.pointCount = pointCount;
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

function estimateSkeletonPointRadius(width: number, height: number): number {
  return Math.max(2, Math.min(4.4, Math.min(width, height) * 0.006));
}

function estimatePointRadiusFromTransform(transform: { sx: number; sy: number }): number {
  return Math.max(2, Math.min(4.4, Math.min(transform.sx, transform.sy) * 0.006));
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0`;
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
