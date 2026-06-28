import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import { colors } from '../theme';
import {
  buildFitFramePoseTracePaths,
  emptyFitFramePoseTracePaths,
  resolveFitFrameRect,
  type FitFrameContentWindow,
  type FitFramePoseTracePaths,
  type FitFrameRect,
  type FitFrameTraceEdgeFlags,
} from './fitFramePoseTraceGeometry';
import type {
  PoseAvatarFrameSource,
  PoseAvatarRendererHandle,
} from './poseAvatarTypes';

export type FitFramePoseTraceVisualState = 'lost' | 'adjust' | 'tracking' | 'ready';

export interface FitFramePoseTraceRendererProps {
  visualState?: FitFramePoseTraceVisualState;
  mirrored?: boolean;
  frameSource?: PoseAvatarFrameSource;
  contentWindow?: FitFrameContentWindow;
}

const EMPTY_PATHS = emptyFitFramePoseTracePaths();
const TRACE_STROKE = 'rgba(65,76,52,0.72)';
const TRACE_STROKE_FAINT = 'rgba(65,76,52,0.28)';
const TRACE_POINT = 'rgba(17,20,18,0.64)';
const TRACE_POINT_MAJOR = 'rgba(65,76,52,0.82)';
const TRACE_POINT_FAINT = 'rgba(65,76,52,0.28)';
const GUIDE_STROKE = 'rgba(104,112,106,0.22)';
const SAFE_GUIDE_STROKE = 'rgba(104,112,106,0.14)';
const EMPTY_D = 'M-9-9';

export const FitFramePoseTraceRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  FitFramePoseTraceRendererProps
>(function FitFramePoseTraceRenderer(
  {
    visualState = 'lost',
    mirrored = true,
    frameSource = 'raw',
    contentWindow,
  },
  ref
) {
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const lastSourceAspectRef = React.useRef(3 / 4);
  const visibleRef = React.useRef(false);
  const scratchPaths = React.useRef(emptyFitFramePoseTracePaths());
  const [frameRect, setFrameRect] = React.useState<FitFrameRect | null>(null);
  const [paths, setPaths] = React.useState<FitFramePoseTracePaths>(EMPTY_PATHS);

  const refreshFrameRect = React.useCallback(
    (sourceAspect = lastSourceAspectRef.current) => {
      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) return null;
      const next = resolveFitFrameRect(width, height, sourceAspect, contentWindow);
      setFrameRect((prev) => (sameRect(prev, next) ? prev : next));
      return next;
    },
    [contentWindow]
  );

  React.useEffect(() => {
    refreshFrameRect();
  }, [refreshFrameRect]);

  React.useImperativeHandle(
    ref,
    () => ({
      update(output: PipelineFrameOutput, sourceAspect: number) {
        if (Number.isFinite(sourceAspect) && sourceAspect > 0) {
          lastSourceAspectRef.current = sourceAspect;
        }
        const rect = refreshFrameRect(lastSourceAspectRef.current);
        const frame = frameSource === 'raw' ? output.rawFrame : output.displayFrame;
        const poseRenderable =
          !!rect &&
          frame.hasPose &&
          lastSourceAspectRef.current > 0 &&
          (output.state === 'warmup' || output.state === 'tracking' || output.state === 'interrupted');

        if (!poseRenderable) {
          if (visibleRef.current) {
            visibleRef.current = false;
            setPaths(EMPTY_PATHS);
          }
          return;
        }

        buildFitFramePoseTracePaths(
          frame,
          rect,
          {
            sourceAspect: lastSourceAspectRef.current,
            mirrored,
            fit: 'contain',
          },
          scratchPaths.current
        );
        visibleRef.current = true;
        setPaths(clonePaths(scratchPaths.current));
      },
    }),
    [frameSource, mirrored, refreshFrameRect]
  );

  const frameStyle = visualStyleForState(visualState);
  const lineWidth = frameRect ? estimateLineWidth(frameRect) : 1.6;
  const majorPointOpacity = visualState === 'ready' ? 1 : 0.92;
  const guideOpacity = visualState === 'lost' ? 0.7 : 1;
  const showReadyGlow = visualState === 'ready';

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(event) => {
        sizeRef.current = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
        refreshFrameRect();
      }}
    >
      {frameRect ? (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <ClipPath id="fitFramePoseTraceClip">
              <Rect
                x={frameRect.x}
                y={frameRect.y}
                width={frameRect.width}
                height={frameRect.height}
                rx={frameRect.rx}
                ry={frameRect.rx}
              />
            </ClipPath>
          </Defs>
          <Rect
            x={frameRect.x}
            y={frameRect.y}
            width={frameRect.width}
            height={frameRect.height}
            rx={frameRect.rx}
            ry={frameRect.rx}
            fill={colors.bgBase}
            stroke={frameStyle.border}
            strokeWidth={frameStyle.borderWidth}
            opacity={frameStyle.frameOpacity}
          />
          {showReadyGlow ? (
            <Rect
              x={frameRect.x + 3}
              y={frameRect.y + 3}
              width={Math.max(1, frameRect.width - 6)}
              height={Math.max(1, frameRect.height - 6)}
              rx={Math.max(1, frameRect.rx - 3)}
              ry={Math.max(1, frameRect.rx - 3)}
              fill="none"
              stroke={colors.accentDeep}
              strokeWidth={7}
              opacity={0.08}
            />
          ) : null}
          <FitFrameGuides rect={frameRect} opacity={guideOpacity} />
          <G clipPath="url(#fitFramePoseTraceClip)">
            <Path
              d={paths.faintLinePath || EMPTY_D}
              stroke={TRACE_STROKE_FAINT}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={paths.strongLinePath || EMPTY_D}
              stroke={TRACE_STROKE}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path d={paths.faintPointPath || EMPTY_D} fill={TRACE_POINT_FAINT} />
            <Path d={paths.minorPointPath || EMPTY_D} fill={TRACE_POINT} opacity={0.84} />
            <Path d={paths.majorPointPath || EMPTY_D} fill={TRACE_POINT_MAJOR} opacity={majorPointOpacity} />
          </G>
          <FitFrameEdgeHighlights
            rect={frameRect}
            flags={paths.edgeFlags}
            active={visualState === 'adjust'}
          />
        </Svg>
      ) : null}
    </View>
  );
});

function FitFrameGuides({ rect, opacity }: { rect: FitFrameRect; opacity: number }) {
  const centerX = rect.x + rect.width / 2;
  const headY = rect.y + rect.height * 0.14;
  const feetY = rect.y + rect.height * 0.91;
  const tick = rect.width * 0.16;
  const inset = rect.width * 0.105;

  return (
    <>
      <Line
        x1={centerX}
        y1={rect.y + rect.height * 0.09}
        x2={centerX}
        y2={rect.y + rect.height * 0.94}
        stroke={SAFE_GUIDE_STROKE}
        strokeWidth={1}
        strokeDasharray="5 9"
        opacity={opacity}
      />
      <Rect
        x={rect.x + inset}
        y={rect.y + rect.height * 0.07}
        width={Math.max(1, rect.width - inset * 2)}
        height={rect.height * 0.86}
        rx={Math.max(1, rect.rx - 12)}
        ry={Math.max(1, rect.rx - 12)}
        fill="none"
        stroke={SAFE_GUIDE_STROKE}
        strokeWidth={1}
        strokeDasharray="6 10"
        opacity={opacity}
      />
      <Line
        x1={centerX - tick}
        y1={headY}
        x2={centerX + tick}
        y2={headY}
        stroke={GUIDE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={opacity}
      />
      <Line
        x1={centerX - tick * 1.12}
        y1={feetY}
        x2={centerX + tick * 1.12}
        y2={feetY}
        stroke={GUIDE_STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={opacity}
      />
    </>
  );
}

function FitFrameEdgeHighlights({
  rect,
  flags,
  active,
}: {
  rect: FitFrameRect;
  flags: FitFrameTraceEdgeFlags;
  active: boolean;
}) {
  if (!active || (!flags.left && !flags.right && !flags.top && !flags.bottom)) {
    return null;
  }

  const color = colors.caution;
  const inset = 4;
  const verticalStart = rect.y + rect.rx;
  const verticalEnd = rect.y + rect.height - rect.rx;
  const horizontalStart = rect.x + rect.rx;
  const horizontalEnd = rect.x + rect.width - rect.rx;

  return (
    <>
      {flags.left ? (
        <Line
          x1={rect.x + inset}
          y1={verticalStart}
          x2={rect.x + inset}
          y2={verticalEnd}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.48}
        />
      ) : null}
      {flags.right ? (
        <Line
          x1={rect.x + rect.width - inset}
          y1={verticalStart}
          x2={rect.x + rect.width - inset}
          y2={verticalEnd}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.48}
        />
      ) : null}
      {flags.top ? (
        <Line
          x1={horizontalStart}
          y1={rect.y + inset}
          x2={horizontalEnd}
          y2={rect.y + inset}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.48}
        />
      ) : null}
      {flags.bottom ? (
        <Line
          x1={horizontalStart}
          y1={rect.y + rect.height - inset}
          x2={horizontalEnd}
          y2={rect.y + rect.height - inset}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.48}
        />
      ) : null}
    </>
  );
}

function visualStyleForState(state: FitFramePoseTraceVisualState): {
  border: string;
  borderWidth: number;
  frameOpacity: number;
} {
  switch (state) {
    case 'ready':
      return { border: colors.accentDeep, borderWidth: 1.8, frameOpacity: 1 };
    case 'adjust':
      return { border: colors.caution, borderWidth: 1.5, frameOpacity: 1 };
    case 'tracking':
      return { border: 'rgba(65,76,52,0.48)', borderWidth: 1.25, frameOpacity: 1 };
    case 'lost':
    default:
      return { border: colors.border, borderWidth: 1.1, frameOpacity: 0.92 };
  }
}

function sameRect(a: FitFrameRect | null, b: FitFrameRect): boolean {
  if (!a) return false;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5 &&
    Math.abs(a.rx - b.rx) < 0.5
  );
}

function clonePaths(paths: FitFramePoseTracePaths): FitFramePoseTracePaths {
  return {
    strongLinePath: paths.strongLinePath,
    faintLinePath: paths.faintLinePath,
    majorPointPath: paths.majorPointPath,
    minorPointPath: paths.minorPointPath,
    faintPointPath: paths.faintPointPath,
    lineCount: paths.lineCount,
    pointCount: paths.pointCount,
    averageConfidence: paths.averageConfidence,
    bounds: paths.bounds ? { ...paths.bounds } : null,
    edgeFlags: { ...paths.edgeFlags },
  };
}

function estimateLineWidth(rect: FitFrameRect): number {
  return Math.max(1.4, Math.min(2.8, Math.min(rect.width, rect.height) * 0.0065));
}
