import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import { LANDMARK_COUNT, type PoseFrame } from '../pose/types';
import { colors } from '../theme';
import {
  buildFitFramePoseTracePaths,
  displayFitFrameTraceEdgeFlags,
  emptyFitFramePoseTracePaths,
  resolveFitFrameRect,
  type FitFrameContentWindow,
  type FitFramePoseTraceBuildOptions,
  type FitFramePoseTracePaths,
  type FitFrameRect,
  type FitFrameTraceEdgeFlags,
} from './fitFramePoseTraceGeometry';
import type {
  PoseAvatarFrameSource,
  PoseAvatarRendererHandle,
} from './poseAvatarTypes';

export type FitFramePoseTraceVisualState =
  | 'lost'
  | 'adjust'
  | 'tracking'
  | 'ready'
  | 'active';

export type FitFrameEdgeWarningIntensity = 'none' | 'setup' | 'active';

export interface FitFrameEdgeWarningPolicy {
  flags: FitFrameTraceEdgeFlags;
  intensity: FitFrameEdgeWarningIntensity;
}

export interface FitFramePoseTraceRendererProps {
  visualState?: FitFramePoseTraceVisualState;
  mirrored?: boolean;
  frameSource?: PoseAvatarFrameSource;
  contentWindow?: FitFrameContentWindow;
}

const EMPTY_PATHS = emptyFitFramePoseTracePaths();
const TRACE_STROKE = 'rgba(65,76,52,0.72)';
const TRACE_STROKE_FAINT = 'rgba(65,76,52,0.28)';
const TRACE_STROKE_GHOST = 'rgba(65,76,52,0.12)';
const TRACE_POINT = 'rgba(17,20,18,0.44)';
const TRACE_POINT_MINOR_HALO = 'rgba(65,76,52,0.07)';
const TRACE_POINT_MAJOR_HALO = 'rgba(65,76,52,0.13)';
const TRACE_POINT_MAJOR = 'rgba(65,76,52,0.66)';
const TRACE_POINT_FAINT = 'rgba(65,76,52,0.18)';
const TRACE_POINT_GHOST = 'rgba(65,76,52,0.08)';
const TRACE_POINT_HEAD_HALO = 'rgba(65,76,52,0.12)';
const TRACE_POINT_HEAD = 'rgba(65,76,52,0.72)';
const DEFAULT_SOURCE_ASPECT = 3 / 4;
const FRAME_BORDER = 'rgba(65,76,52,0.48)';
const EDGE_CAUTION = '#F26A1B';
const CONFIDENCE_ATTACK_MS = 70;
const CONFIDENCE_RELEASE_MS = 260;
const CONFIDENCE_RESET_GAP_MS = 700;
const EDGE_GRADIENT_IDS = {
  left: 'fitFramePoseTraceEdgeLeftGradient',
  right: 'fitFramePoseTraceEdgeRightGradient',
  top: 'fitFramePoseTraceEdgeTopGradient',
  bottom: 'fitFramePoseTraceEdgeBottomGradient',
} as const;
const EDGE_OVERLAY_GRADIENT_IDS = {
  left: 'fitFramePoseTraceEdgeLeftOverlayGradient',
  right: 'fitFramePoseTraceEdgeRightOverlayGradient',
  top: 'fitFramePoseTraceEdgeTopOverlayGradient',
  bottom: 'fitFramePoseTraceEdgeBottomOverlayGradient',
} as const;
const EMPTY_D = 'M-9-9';
const NO_EDGE_FLAGS: FitFrameTraceEdgeFlags = {
  left: false,
  right: false,
  top: false,
  bottom: false,
};

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
  const lastSourceAspectRef = React.useRef(DEFAULT_SOURCE_ASPECT);
  const visibleRef = React.useRef(false);
  const visualConfidenceRef = React.useRef(new Float64Array(LANDMARK_COUNT));
  const buildOptionsRef = React.useRef<FitFramePoseTraceBuildOptions>({
    sourceAspect: DEFAULT_SOURCE_ASPECT,
    mirrored,
    fit: 'contain',
    visualConfidence: visualConfidenceRef.current,
  });
  const lastConfidenceTimestampRef = React.useRef<number | null>(null);
  const scratchPaths = React.useRef(emptyFitFramePoseTracePaths());
  const frameRectRef = React.useRef<FitFrameRect | null>(null);
  const renderedFrameRectRef = React.useRef<FitFrameRect | null>(null);
  const frameRectInputsRef = React.useRef(emptyRectInputs());
  const [frameRect, setFrameRect] = React.useState<FitFrameRect | null>(null);
  const [paths, setPaths] = React.useState<FitFramePoseTracePaths>(EMPTY_PATHS);

  const refreshFrameRect = React.useCallback(
    (sourceAspect = lastSourceAspectRef.current) => {
      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) return null;
      const resolvedSourceAspect =
        Number.isFinite(sourceAspect) && sourceAspect > 0
          ? sourceAspect
          : DEFAULT_SOURCE_ASPECT;
      const windowLeft = contentWindow?.left ?? 0;
      const windowTop = contentWindow?.top ?? 0;
      const windowWidth = contentWindow?.width ?? width;
      const windowHeight = contentWindow?.height ?? height;
      const cachedInputs = frameRectInputsRef.current;
      if (
        frameRectRef.current &&
        cachedInputs.viewportWidth === width &&
        cachedInputs.viewportHeight === height &&
        cachedInputs.sourceAspect === resolvedSourceAspect &&
        cachedInputs.windowLeft === windowLeft &&
        cachedInputs.windowTop === windowTop &&
        cachedInputs.windowWidth === windowWidth &&
        cachedInputs.windowHeight === windowHeight
      ) {
        return frameRectRef.current;
      }
      cachedInputs.viewportWidth = width;
      cachedInputs.viewportHeight = height;
      cachedInputs.sourceAspect = resolvedSourceAspect;
      cachedInputs.windowLeft = windowLeft;
      cachedInputs.windowTop = windowTop;
      cachedInputs.windowWidth = windowWidth;
      cachedInputs.windowHeight = windowHeight;
      const next = resolveFitFrameRect(width, height, resolvedSourceAspect, contentWindow);
      frameRectRef.current = next;
      if (!sameRect(renderedFrameRectRef.current, next)) {
        renderedFrameRectRef.current = next;
        setFrameRect(next);
      }
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
          resetVisualConfidence(visualConfidenceRef.current, lastConfidenceTimestampRef);
          return;
        }

        updateVisualConfidence(
          frame,
          visualConfidenceRef.current,
          lastConfidenceTimestampRef
        );
        const buildOptions = buildOptionsRef.current;
        buildOptions.sourceAspect = lastSourceAspectRef.current;
        buildOptions.mirrored = mirrored;
        buildOptions.visualConfidence = visualConfidenceRef.current;
        buildFitFramePoseTracePaths(
          frame,
          rect,
          buildOptions,
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
  const showReadyGlow = visualState === 'ready';
  const edgeWarning = fitFrameEdgeWarningPolicyForState(visualState, paths, mirrored);
  const edgeHighlightsActive = edgeWarning.intensity !== 'none';

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
            <FitFrameEdgeHighlightGradients
              rect={frameRect}
              flags={edgeWarning.flags}
              active={edgeHighlightsActive}
              baseColor={frameStyle.border}
              intensity={edgeWarning.intensity}
            />
            <FitFrameEdgeOverlayGradients
              rect={frameRect}
              flags={edgeWarning.flags}
              active={edgeHighlightsActive}
              intensity={edgeWarning.intensity}
            />
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
          <FitFrameEdgeOverlays
            rect={frameRect}
            flags={edgeWarning.flags}
            active={edgeHighlightsActive}
            intensity={edgeWarning.intensity}
          />
          <G clipPath="url(#fitFramePoseTraceClip)">
            <Path
              d={paths.ghostLinePath || EMPTY_D}
              stroke={TRACE_STROKE_GHOST}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
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
            <Path d={paths.ghostPointPath || EMPTY_D} fill={TRACE_POINT_GHOST} />
            <Path d={paths.faintPointPath || EMPTY_D} fill={TRACE_POINT_FAINT} />
            <Path d={paths.minorPointHaloPath || EMPTY_D} fill={TRACE_POINT_MINOR_HALO} />
            <Path d={paths.majorPointHaloPath || EMPTY_D} fill={TRACE_POINT_MAJOR_HALO} />
            <Path d={paths.headPointHaloPath || EMPTY_D} fill={TRACE_POINT_HEAD_HALO} />
            <Path d={paths.minorPointPath || EMPTY_D} fill={TRACE_POINT} opacity={0.68} />
            <Path d={paths.majorPointPath || EMPTY_D} fill={TRACE_POINT_MAJOR} opacity={majorPointOpacity} />
            <Path d={paths.headPointPath || EMPTY_D} fill={TRACE_POINT_HEAD} opacity={majorPointOpacity} />
          </G>
          <FitFrameEdgeHighlights
            rect={frameRect}
            flags={edgeWarning.flags}
            active={edgeHighlightsActive}
            intensity={edgeWarning.intensity}
          />
        </Svg>
      ) : null}
    </View>
  );
});

export function fitFrameEdgeWarningPolicyForState(
  visualState: FitFramePoseTraceVisualState,
  paths: FitFramePoseTracePaths,
  mirrored = true
): FitFrameEdgeWarningPolicy {
  if (visualState === 'adjust') {
    return {
      flags: displayFitFrameTraceEdgeFlags(paths.edgeFlags, mirrored),
      intensity: 'setup',
    };
  }

  if (visualState === 'active') {
    return {
      flags: displayFitFrameTraceEdgeFlags(paths.activeEdgeFlags, mirrored),
      intensity: 'active',
    };
  }

  return { flags: NO_EDGE_FLAGS, intensity: 'none' };
}

function updateVisualConfidence(
  frame: PoseFrame,
  visualConfidence: Float64Array,
  lastTimestampRef: React.MutableRefObject<number | null>
): void {
  const previousTimestamp = lastTimestampRef.current;
  lastTimestampRef.current = frame.timestampMs;

  if (
    previousTimestamp === null ||
    !Number.isFinite(previousTimestamp) ||
    !Number.isFinite(frame.timestampMs) ||
    frame.timestampMs <= previousTimestamp ||
    frame.timestampMs - previousTimestamp > CONFIDENCE_RESET_GAP_MS
  ) {
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      visualConfidence[i] = landmarkConfidence(frame, i);
    }
    return;
  }

  const dt = Math.min(100, frame.timestampMs - previousTimestamp);
  const attackAlpha = 1 - Math.exp(-dt / CONFIDENCE_ATTACK_MS);
  const releaseAlpha = 1 - Math.exp(-dt / CONFIDENCE_RELEASE_MS);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    const target = landmarkConfidence(frame, i);
    const current = visualConfidence[i];
    const alpha = target > current ? attackAlpha : releaseAlpha;
    visualConfidence[i] = current + (target - current) * alpha;
  }
}

function resetVisualConfidence(
  visualConfidence: Float64Array,
  lastTimestampRef: React.MutableRefObject<number | null>
): void {
  visualConfidence.fill(0);
  lastTimestampRef.current = null;
}

function landmarkConfidence(frame: PoseFrame, index: number): number {
  return Math.min(clamp01(frame.visibility[index]), clamp01(frame.presence[index]));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function FitFrameEdgeOverlayGradients({
  rect,
  flags,
  active,
  intensity,
}: {
  rect: FitFrameRect;
  flags: FitFrameTraceEdgeFlags;
  active: boolean;
  intensity: FitFrameEdgeWarningIntensity;
}) {
  if (!active || (!flags.left && !flags.right && !flags.top && !flags.bottom)) {
    return null;
  }

  const depth = edgeOverlayDepth(rect);
  return (
    <>
      <EdgeOverlayGradient
        id={EDGE_OVERLAY_GRADIENT_IDS.left}
        x1={rect.x}
        y1={rect.y}
        x2={rect.x + depth}
        y2={rect.y}
        intensity={intensity}
      />
      <EdgeOverlayGradient
        id={EDGE_OVERLAY_GRADIENT_IDS.right}
        x1={rect.x + rect.width}
        y1={rect.y}
        x2={rect.x + rect.width - depth}
        y2={rect.y}
        intensity={intensity}
      />
      <EdgeOverlayGradient
        id={EDGE_OVERLAY_GRADIENT_IDS.top}
        x1={rect.x}
        y1={rect.y}
        x2={rect.x}
        y2={rect.y + depth}
        intensity={intensity}
      />
      <EdgeOverlayGradient
        id={EDGE_OVERLAY_GRADIENT_IDS.bottom}
        x1={rect.x}
        y1={rect.y + rect.height}
        x2={rect.x}
        y2={rect.y + rect.height - depth}
        intensity={intensity}
      />
    </>
  );
}

function EdgeOverlayGradient({
  id,
  x1,
  y1,
  x2,
  y2,
  intensity,
}: {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  intensity: FitFrameEdgeWarningIntensity;
}) {
  const startOpacity = intensity === 'active' ? 0.08 : 0.22;
  const midOpacity = intensity === 'active' ? 0.035 : 0.1;
  return (
    <LinearGradient
      id={id}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      gradientUnits="userSpaceOnUse"
    >
      <Stop offset="0%" stopColor={EDGE_CAUTION} stopOpacity={startOpacity} />
      <Stop offset="42%" stopColor={EDGE_CAUTION} stopOpacity={midOpacity} />
      <Stop offset="100%" stopColor={EDGE_CAUTION} stopOpacity={0} />
    </LinearGradient>
  );
}

function FitFrameEdgeOverlays({
  rect,
  flags,
  active,
  intensity,
}: {
  rect: FitFrameRect;
  flags: FitFrameTraceEdgeFlags;
  active: boolean;
  intensity: FitFrameEdgeWarningIntensity;
}) {
  if (
    !active ||
    intensity === 'none' ||
    (!flags.left && !flags.right && !flags.top && !flags.bottom)
  ) {
    return null;
  }

  const depth = edgeOverlayDepth(rect);
  return (
    <G clipPath="url(#fitFramePoseTraceClip)">
      {flags.left ? (
        <Rect
          x={rect.x}
          y={rect.y}
          width={depth}
          height={rect.height}
          fill={`url(#${EDGE_OVERLAY_GRADIENT_IDS.left})`}
        />
      ) : null}
      {flags.right ? (
        <Rect
          x={rect.x + rect.width - depth}
          y={rect.y}
          width={depth}
          height={rect.height}
          fill={`url(#${EDGE_OVERLAY_GRADIENT_IDS.right})`}
        />
      ) : null}
      {flags.top ? (
        <Rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={depth}
          fill={`url(#${EDGE_OVERLAY_GRADIENT_IDS.top})`}
        />
      ) : null}
      {flags.bottom ? (
        <Rect
          x={rect.x}
          y={rect.y + rect.height - depth}
          width={rect.width}
          height={depth}
          fill={`url(#${EDGE_OVERLAY_GRADIENT_IDS.bottom})`}
        />
      ) : null}
    </G>
  );
}

function FitFrameEdgeHighlightGradients({
  rect,
  flags,
  active,
  baseColor,
  intensity,
}: {
  rect: FitFrameRect;
  flags: FitFrameTraceEdgeFlags;
  active: boolean;
  baseColor: string;
  intensity: FitFrameEdgeWarningIntensity;
}) {
  if (
    !active ||
    intensity === 'none' ||
    (!flags.left && !flags.right && !flags.top && !flags.bottom)
  ) {
    return null;
  }

  const r = resolvedCornerRadius(rect);
  const k = Math.SQRT1_2;
  const horizontalFade = cornerFadeRatio(rect.width, r);
  const verticalFade = cornerFadeRatio(rect.height, r);
  const leftX = rect.x + r - r * k;
  const rightX = rect.x + rect.width - r + r * k;
  const topY = rect.y + r - r * k;
  const bottomY = rect.y + rect.height - r + r * k;

  return (
    <>
      <EdgeLinearGradient
        id={EDGE_GRADIENT_IDS.left}
        x1={rect.x}
        y1={topY}
        x2={rect.x}
        y2={bottomY}
        baseColor={baseColor}
        startActive={flags.top}
        endActive={flags.bottom}
        fade={verticalFade}
      />
      <EdgeLinearGradient
        id={EDGE_GRADIENT_IDS.right}
        x1={rect.x + rect.width}
        y1={topY}
        x2={rect.x + rect.width}
        y2={bottomY}
        baseColor={baseColor}
        startActive={flags.top}
        endActive={flags.bottom}
        fade={verticalFade}
      />
      <EdgeLinearGradient
        id={EDGE_GRADIENT_IDS.top}
        x1={leftX}
        y1={rect.y}
        x2={rightX}
        y2={rect.y}
        baseColor={baseColor}
        startActive={flags.left}
        endActive={flags.right}
        fade={horizontalFade}
      />
      <EdgeLinearGradient
        id={EDGE_GRADIENT_IDS.bottom}
        x1={leftX}
        y1={rect.y + rect.height}
        x2={rightX}
        y2={rect.y + rect.height}
        baseColor={baseColor}
        startActive={flags.left}
        endActive={flags.right}
        fade={horizontalFade}
      />
    </>
  );
}

function EdgeLinearGradient({
  id,
  x1,
  y1,
  x2,
  y2,
  baseColor,
  startActive,
  endActive,
  fade,
}: {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  baseColor: string;
  startActive: boolean;
  endActive: boolean;
  fade: number;
}) {
  return (
    <LinearGradient
      id={id}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      gradientUnits="userSpaceOnUse"
    >
      <Stop
        offset="0%"
        stopColor={startActive ? EDGE_CAUTION : baseColor}
        stopOpacity={startActive ? 1 : 0}
      />
      <Stop offset={formatPercent(fade)} stopColor={EDGE_CAUTION} />
      <Stop offset={formatPercent(1 - fade)} stopColor={EDGE_CAUTION} />
      <Stop
        offset="100%"
        stopColor={endActive ? EDGE_CAUTION : baseColor}
        stopOpacity={endActive ? 1 : 0}
      />
    </LinearGradient>
  );
}

function FitFrameEdgeHighlights({
  rect,
  flags,
  active,
  intensity,
}: {
  rect: FitFrameRect;
  flags: FitFrameTraceEdgeFlags;
  active: boolean;
  intensity: FitFrameEdgeWarningIntensity;
}) {
  if (
    !active ||
    intensity === 'none' ||
    (!flags.left && !flags.right && !flags.top && !flags.bottom)
  ) {
    return null;
  }

  const strokeWidth = intensity === 'active' ? 2 : 3.2;
  const opacity = intensity === 'active' ? 0.42 : 0.92;

  return (
    <>
      {flags.left ? (
        <Path
          d={edgePath(rect, 'left')}
          stroke={`url(#${EDGE_GRADIENT_IDS.left})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={opacity}
        />
      ) : null}
      {flags.right ? (
        <Path
          d={edgePath(rect, 'right')}
          stroke={`url(#${EDGE_GRADIENT_IDS.right})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={opacity}
        />
      ) : null}
      {flags.top ? (
        <Path
          d={edgePath(rect, 'top')}
          stroke={`url(#${EDGE_GRADIENT_IDS.top})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={opacity}
        />
      ) : null}
      {flags.bottom ? (
        <Path
          d={edgePath(rect, 'bottom')}
          stroke={`url(#${EDGE_GRADIENT_IDS.bottom})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={opacity}
        />
      ) : null}
    </>
  );
}

function edgePath(rect: FitFrameRect, edge: keyof FitFrameTraceEdgeFlags): string {
  const x = rect.x;
  const y = rect.y;
  const w = rect.width;
  const h = rect.height;
  const r = resolvedCornerRadius(rect);
  const k = Math.SQRT1_2;
  const right = x + w;
  const bottom = y + h;
  const leftMidCorner = { x: x + r - r * k, y: y + r - r * k };
  const rightTopMidCorner = { x: right - r + r * k, y: y + r - r * k };
  const rightBottomMidCorner = { x: right - r + r * k, y: bottom - r + r * k };
  const leftBottomMidCorner = { x: x + r - r * k, y: bottom - r + r * k };
  switch (edge) {
    case 'left':
      return [
        moveTo(leftMidCorner.x, leftMidCorner.y),
        arcTo(r, x, y + r, 0),
        lineTo(x, bottom - r),
        arcTo(r, leftBottomMidCorner.x, leftBottomMidCorner.y, 0),
      ].join('');
    case 'right':
      return [
        moveTo(rightTopMidCorner.x, rightTopMidCorner.y),
        arcTo(r, right, y + r, 1),
        lineTo(right, bottom - r),
        arcTo(r, rightBottomMidCorner.x, rightBottomMidCorner.y, 1),
      ].join('');
    case 'top':
      return [
        moveTo(leftMidCorner.x, leftMidCorner.y),
        arcTo(r, x + r, y, 1),
        lineTo(right - r, y),
        arcTo(r, rightTopMidCorner.x, rightTopMidCorner.y, 1),
      ].join('');
    case 'bottom':
    default:
      return [
        moveTo(leftBottomMidCorner.x, leftBottomMidCorner.y),
        arcTo(r, x + r, bottom, 0),
        lineTo(right - r, bottom),
        arcTo(r, rightBottomMidCorner.x, rightBottomMidCorner.y, 0),
      ].join('');
  }
}

function resolvedCornerRadius(rect: FitFrameRect): number {
  return Math.min(rect.rx, rect.width / 2, rect.height / 2);
}

function cornerFadeRatio(length: number, radius: number): number {
  const span = Math.max(1, length - 2 * radius + 2 * radius * Math.SQRT1_2);
  return Math.max(0.04, Math.min(0.28, (radius * Math.SQRT1_2) / span));
}

function edgeOverlayDepth(rect: FitFrameRect): number {
  return Math.max(28, Math.min(76, Math.min(rect.width, rect.height) * 0.18));
}

function moveTo(x: number, y: number): string {
  return `M${formatPathNumber(x)} ${formatPathNumber(y)}`;
}

function lineTo(x: number, y: number): string {
  return `L${formatPathNumber(x)} ${formatPathNumber(y)}`;
}

function arcTo(radius: number, x: number, y: number, sweepFlag: 0 | 1): string {
  const r = formatPathNumber(radius);
  return `A${r} ${r} 0 0 ${sweepFlag} ${formatPathNumber(x)} ${formatPathNumber(y)}`;
}

function formatPathNumber(value: number): string {
  return value.toFixed(1);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
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
      return { border: FRAME_BORDER, borderWidth: 1.25, frameOpacity: 1 };
    case 'tracking':
    case 'active':
      return { border: FRAME_BORDER, borderWidth: 1.25, frameOpacity: 1 };
    case 'lost':
    default:
      return { border: colors.border, borderWidth: 1.1, frameOpacity: 0.92 };
  }
}

interface FitFrameRectInputs {
  viewportWidth: number;
  viewportHeight: number;
  sourceAspect: number;
  windowLeft: number;
  windowTop: number;
  windowWidth: number;
  windowHeight: number;
}

function emptyRectInputs(): FitFrameRectInputs {
  return {
    viewportWidth: Number.NaN,
    viewportHeight: Number.NaN,
    sourceAspect: Number.NaN,
    windowLeft: Number.NaN,
    windowTop: Number.NaN,
    windowWidth: Number.NaN,
    windowHeight: Number.NaN,
  };
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
    ghostLinePath: paths.ghostLinePath,
    headPointHaloPath: paths.headPointHaloPath,
    headPointPath: paths.headPointPath,
    majorPointHaloPath: paths.majorPointHaloPath,
    minorPointHaloPath: paths.minorPointHaloPath,
    majorPointPath: paths.majorPointPath,
    minorPointPath: paths.minorPointPath,
    faintPointPath: paths.faintPointPath,
    ghostPointPath: paths.ghostPointPath,
    lineCount: paths.lineCount,
    pointCount: paths.pointCount,
    averageConfidence: paths.averageConfidence,
    bounds: paths.bounds ? { ...paths.bounds } : null,
    edgeFlags: { ...paths.edgeFlags },
    activeEdgeFlags: { ...paths.activeEdgeFlags },
  };
}

function estimateLineWidth(rect: FitFrameRect): number {
  return Math.max(1.4, Math.min(2.8, Math.min(rect.width, rect.height) * 0.0065));
}
