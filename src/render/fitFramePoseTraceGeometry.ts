import { LM, type PoseFrame } from '../pose/types';
import {
  computeViewportTransform,
  mapNormalizedX,
  mapNormalizedY,
  type PoseViewportFit,
} from './poseCoordinateMapper';

export interface FitFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface FitFrameContentWindow {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FitFrameTraceEdgeFlags {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

export interface FitFrameTraceBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface FitFramePoseTracePaths {
  strongLinePath: string;
  faintLinePath: string;
  ghostLinePath: string;
  majorPointPath: string;
  minorPointPath: string;
  faintPointPath: string;
  ghostPointPath: string;
  lineCount: number;
  pointCount: number;
  averageConfidence: number;
  bounds: FitFrameTraceBounds | null;
  edgeFlags: FitFrameTraceEdgeFlags;
}

export interface FitFramePoseTraceBuildOptions {
  sourceAspect: number;
  mirrored?: boolean;
  fit?: PoseViewportFit;
  visualConfidence?: ArrayLike<number>;
  edgeFadeMargin?: number;
  minConfidence?: number;
  strongConfidence?: number;
  footConfidence?: number;
}

const DEFAULT_SOURCE_ASPECT = 3 / 4;
const MIN_CONFIDENCE = 0.06;
const FAINT_CONFIDENCE = 0.18;
const STRONG_CONFIDENCE = 0.55;
const FOOT_CONFIDENCE = 0.35;
const EDGE_MARGIN = 0.055;
const EDGE_VISUAL_FADE_MARGIN = 0.07;

const TRACE_CONNECTIONS: readonly (readonly [LM, LM])[] = [
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_HEEL],
  [LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
];

const TRACE_POINTS: readonly LM[] = [
  LM.NOSE,
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_ELBOW,
  LM.RIGHT_ELBOW,
  LM.LEFT_WRIST,
  LM.RIGHT_WRIST,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
  LM.LEFT_HEEL,
  LM.RIGHT_HEEL,
  LM.LEFT_FOOT_INDEX,
  LM.RIGHT_FOOT_INDEX,
];

const MAJOR_POINTS = new Set<LM>([
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
]);

export function emptyFitFramePoseTracePaths(): FitFramePoseTracePaths {
  return {
    strongLinePath: '',
    faintLinePath: '',
    ghostLinePath: '',
    majorPointPath: '',
    minorPointPath: '',
    faintPointPath: '',
    ghostPointPath: '',
    lineCount: 0,
    pointCount: 0,
    averageConfidence: 0,
    bounds: null,
    edgeFlags: { left: false, right: false, top: false, bottom: false },
  };
}

export function displayFitFrameTraceEdgeFlags(
  flags: FitFrameTraceEdgeFlags,
  mirrored: boolean
): FitFrameTraceEdgeFlags {
  if (!mirrored) {
    return flags;
  }
  return {
    left: flags.right,
    right: flags.left,
    top: flags.top,
    bottom: flags.bottom,
  };
}

export function resolveFitFrameRect(
  viewportWidth: number,
  viewportHeight: number,
  sourceAspect = DEFAULT_SOURCE_ASPECT,
  contentWindow?: FitFrameContentWindow
): FitFrameRect {
  const source = positiveFinite(sourceAspect) ? sourceAspect : DEFAULT_SOURCE_ASPECT;
  const window = contentWindow ?? {
    left: 0,
    top: 0,
    width: viewportWidth,
    height: viewportHeight,
  };
  const width = Math.max(1, window.width);
  const height = Math.max(1, window.height);
  const sideInset = Math.min(Math.max(10, width * 0.04), width * 0.1);
  const verticalInset = Math.min(Math.max(8, height * 0.015), height * 0.06);
  const maxFrameWidth = Math.max(1, width - sideInset * 2);
  const maxFrameHeight = Math.max(1, height - verticalInset * 2);
  let frameWidth = Math.min(maxFrameWidth, maxFrameHeight * source);
  let frameHeight = frameWidth / source;

  if (frameHeight > maxFrameHeight) {
    frameHeight = maxFrameHeight;
    frameWidth = frameHeight * source;
  }

  return {
    x: window.left + (width - frameWidth) / 2,
    y: window.top + (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
    rx: Math.max(24, Math.min(38, frameWidth * 0.12)),
  };
}

export function buildFitFramePoseTracePaths(
  frame: PoseFrame,
  frameRect: FitFrameRect,
  options: FitFramePoseTraceBuildOptions,
  out: FitFramePoseTracePaths
): void {
  resetPaths(out);

  if (!frame.hasPose || frameRect.width <= 0 || frameRect.height <= 0) {
    return;
  }

  const sourceAspect = positiveFinite(options.sourceAspect)
    ? options.sourceAspect
    : DEFAULT_SOURCE_ASPECT;
  const minConfidence = options.minConfidence ?? MIN_CONFIDENCE;
  const strongConfidence = options.strongConfidence ?? STRONG_CONFIDENCE;
  const footConfidence = options.footConfidence ?? FOOT_CONFIDENCE;
  const visualConfidence = options.visualConfidence;
  const edgeFadeMargin = options.edgeFadeMargin ?? EDGE_VISUAL_FADE_MARGIN;
  const transform = computeViewportTransform({
    width: frameRect.width,
    height: frameRect.height,
    sourceAspect,
    mirrored: options.mirrored ?? true,
    fit: options.fit ?? 'contain',
  });
  const majorRadius = estimatePointRadius(frameRect) * 0.98;
  const minorRadius = estimatePointRadius(frameRect) * 0.66;
  const faintRadius = estimatePointRadius(frameRect) * 0.58;
  let confidenceSum = 0;
  let confidenceSamples = 0;
  let minEdgeNormX = Infinity;
  let maxEdgeNormX = -Infinity;
  let minEdgeNormY = Infinity;
  let maxEdgeNormY = -Infinity;
  let edgeSamples = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const mapX = (lm: LM): number => frameRect.x + mapNormalizedX(frame.xs[lm], transform);
  const mapY = (lm: LM): number => frameRect.y + mapNormalizedY(frame.ys[lm], transform);
  const notePoint = (lm: LM, x: number, y: number, confidence: number) => {
    confidenceSum += confidence;
    confidenceSamples++;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  const noteEdgeCandidate = (lm: LM, confidence: number) => {
    if (confidence < minConfidence || !landmarkFinite(frame, lm)) return;
    edgeSamples++;
    minEdgeNormX = Math.min(minEdgeNormX, frame.xs[lm]);
    maxEdgeNormX = Math.max(maxEdgeNormX, frame.xs[lm]);
    minEdgeNormY = Math.min(minEdgeNormY, frame.ys[lm]);
    maxEdgeNormY = Math.max(maxEdgeNormY, frame.ys[lm]);
  };

  for (let i = 0; i < TRACE_CONNECTIONS.length; i++) {
    const [a, b] = TRACE_CONNECTIONS[i];
    const aConfidence = landmarkVisualConfidence(frame, a, visualConfidence, edgeFadeMargin);
    const bConfidence = landmarkVisualConfidence(frame, b, visualConfidence, edgeFadeMargin);
    const confidence = Math.min(aConfidence, bConfidence);
    if (
      confidence < minConfidence ||
      !landmarkFinite(frame, a) ||
      !landmarkFinite(frame, b)
    ) {
      continue;
    }

    const ax = mapX(a);
    const ay = mapY(a);
    const bx = mapX(b);
    const by = mapY(b);
    const path = `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`;
    if (confidence >= strongConfidence) {
      out.strongLinePath += path;
    } else if (confidence >= FAINT_CONFIDENCE) {
      out.faintLinePath += path;
    } else {
      out.ghostLinePath += path;
    }
    out.lineCount++;
  }

  for (let i = 0; i < TRACE_POINTS.length; i++) {
    const lm = TRACE_POINTS[i];
    if (!landmarkFinite(frame, lm)) continue;
    noteEdgeCandidate(lm, rawLandmarkConfidence(frame, lm));
    const confidence = landmarkVisualConfidence(frame, lm, visualConfidence, edgeFadeMargin);
    if (confidence < minConfidence) continue;
    const x = mapX(lm);
    const y = mapY(lm);
    notePoint(lm, x, y, confidence);

    if (confidence < FAINT_CONFIDENCE) {
      out.ghostPointPath += circlePath(x, y, faintRadius);
    } else if (confidence < strongConfidence) {
      out.faintPointPath += circlePath(x, y, faintRadius);
    } else if (MAJOR_POINTS.has(lm)) {
      out.majorPointPath += circlePath(x, y, majorRadius);
    } else {
      out.minorPointPath += circlePath(x, y, minorRadius);
    }
    out.pointCount++;
  }

  if (confidenceSamples > 0) {
    out.averageConfidence = confidenceSum / confidenceSamples;
    out.bounds = { minX, maxX, minY, maxY };
  }

  if (edgeSamples > 0) {
    out.edgeFlags.left = minEdgeNormX < EDGE_MARGIN;
    out.edgeFlags.right = maxEdgeNormX > 1 - EDGE_MARGIN;
    out.edgeFlags.top =
      minEdgeNormY < EDGE_MARGIN || rawLandmarkConfidence(frame, LM.NOSE) < footConfidence;
    out.edgeFlags.bottom =
      maxEdgeNormY > 1 - EDGE_MARGIN ||
      rawLandmarkConfidence(frame, LM.LEFT_ANKLE) < footConfidence ||
      rawLandmarkConfidence(frame, LM.RIGHT_ANKLE) < footConfidence;
  }
}

function resetPaths(out: FitFramePoseTracePaths): void {
  out.strongLinePath = '';
  out.faintLinePath = '';
  out.ghostLinePath = '';
  out.majorPointPath = '';
  out.minorPointPath = '';
  out.faintPointPath = '';
  out.ghostPointPath = '';
  out.lineCount = 0;
  out.pointCount = 0;
  out.averageConfidence = 0;
  out.bounds = null;
  out.edgeFlags.left = false;
  out.edgeFlags.right = false;
  out.edgeFlags.top = false;
  out.edgeFlags.bottom = false;
}

function landmarkFinite(frame: PoseFrame, lm: LM): boolean {
  return Number.isFinite(frame.xs[lm]) && Number.isFinite(frame.ys[lm]);
}

function landmarkVisualConfidence(
  frame: PoseFrame,
  lm: LM,
  visualConfidence: ArrayLike<number> | undefined,
  edgeFadeMargin: number
): number {
  if (visualConfidence && lm < visualConfidence.length) {
    return clamp01(visualConfidence[lm]) * landmarkEdgeAlpha(frame, lm, edgeFadeMargin);
  }
  return rawLandmarkConfidence(frame, lm) * landmarkEdgeAlpha(frame, lm, edgeFadeMargin);
}

function rawLandmarkConfidence(frame: PoseFrame, lm: LM): number {
  return Math.min(clamp01(frame.visibility[lm]), clamp01(frame.presence[lm]));
}

function landmarkEdgeAlpha(frame: PoseFrame, lm: LM, margin: number): number {
  const x = frame.xs[lm];
  const y = frame.ys[lm];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
  if (margin <= 0) {
    return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0;
  }
  const distanceToEdge = Math.min(x, 1 - x, y, 1 - y);
  if (distanceToEdge <= 0) return 0;
  if (distanceToEdge >= EDGE_VISUAL_FADE_MARGIN) return 1;
  const t = distanceToEdge / EDGE_VISUAL_FADE_MARGIN;
  return t * t * (3 - 2 * t);
}

function estimatePointRadius(rect: FitFrameRect): number {
  return Math.max(2.4, Math.min(5.6, Math.min(rect.width, rect.height) * 0.013));
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0`;
}

function positiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
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
