import { CHAIN_COUNT } from '../pose/chains';
import { makeFrame, mulberry32 } from '../pose/testing/syntheticPose';
import { createPoseFrame, LANDMARK_STRIDE, LM, parseLandmarkEvent, RawLandmarkEvent } from '../pose/types';
import {
  buildBodyVolumeGeometry,
  createBodyVolumeGeometry,
} from '../render/bodyVolumeGeometry';
import {
  buildConstellationGeometry,
  createConstellationGeometry,
} from '../render/constellationGeometry';
import {
  createPointCloudBodyGeometry,
  buildPointCloudBodyGeometry,
} from '../render/pointCloudBodyGeometry';
import {
  createScreenPoseLandmarks,
  mapPoseFrameToScreenPose,
} from '../render/poseCoordinateMapper';
import { buildSkeletonPaths, emptySkeletonPaths } from '../render/skeletonGeometry';
import { defaultNowMs, type MetricSnapshot } from './poseLatencyDiagnostics';

export type PoseRendererReplayMode =
  | 'raw-skeleton'
  | 'minimal-constellation'
  | 'full-constellation'
  | 'full-point-cloud-body';

export interface PoseRendererReplaySummary {
  mode: PoseRendererReplayMode;
  frames: number;
  geometryMs: MetricSnapshot;
  averageDots: number;
  maxDots: number;
  averageLines: number;
  maxLines: number;
}

export interface PoseRendererReplayOptions {
  frames?: readonly RawLandmarkEvent[];
  frameCount?: number;
  width?: number;
  height?: number;
  nowMs?: () => number;
}

const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 844;
const SOURCE_ASPECT = 480 / 640;

export function runPoseRendererReplaySuite(
  options: PoseRendererReplayOptions = {}
): PoseRendererReplaySummary[] {
  const modes: readonly PoseRendererReplayMode[] = [
    'raw-skeleton',
    'minimal-constellation',
    'full-constellation',
    'full-point-cloud-body',
  ];
  return modes.map((mode) => runPoseRendererReplay(mode, options));
}

export function runPoseRendererReplay(
  mode: PoseRendererReplayMode,
  options: PoseRendererReplayOptions = {}
): PoseRendererReplaySummary {
  const frames =
    options.frames ?? createSyntheticRendererReplayFrames(options.frameCount ?? 180);
  const now = options.nowMs ?? defaultNowMs;
  const viewport = {
    width: options.width ?? DEFAULT_WIDTH,
    height: options.height ?? DEFAULT_HEIGHT,
    sourceAspect: SOURCE_ASPECT,
    mirrored: true,
    fit: 'contain' as const,
  };
  const chainReliability = new Float64Array(CHAIN_COUNT).fill(0.95);
  const poseFrame = createPoseFrame();
  const screenPose = createScreenPoseLandmarks();
  const skeleton = emptySkeletonPaths();
  const constellation = createConstellationGeometry(300);
  const bodyVolume = createBodyVolumeGeometry(180);
  const pointCloud = createPointCloudBodyGeometry(900);
  const geometryMs = new ReplayMetric();
  let totalDots = 0;
  let maxDots = 0;
  let totalLines = 0;
  let maxLines = 0;

  for (let i = 0; i < frames.length; i++) {
    parseLandmarkEvent(frames[i], poseFrame);
    const start = now();

    if (mode === 'raw-skeleton') {
      buildSkeletonPaths(poseFrame, chainReliability, viewport, skeleton);
      totalDots += 0;
      totalLines += pathMoveCount(skeleton.bright) + pathMoveCount(skeleton.dim);
      maxLines = Math.max(maxLines, pathMoveCount(skeleton.bright) + pathMoveCount(skeleton.dim));
    } else {
      mapPoseFrameToScreenPose(poseFrame, viewport, screenPose);
      if (mode === 'minimal-constellation') {
        buildConstellationGeometry(screenPose, chainReliability, constellation, {
          maxDots: 64,
          sampledDotsEnabled: true,
          sampleDensity: 0.35,
          confidenceIntensityEnabled: false,
        });
        totalDots += constellation.dotCount;
        maxDots = Math.max(maxDots, constellation.dotCount);
        totalLines += constellation.lineCount;
        maxLines = Math.max(maxLines, constellation.lineCount);
      } else if (mode === 'full-constellation') {
        buildConstellationGeometry(screenPose, chainReliability, constellation, {
          maxDots: 180,
          sampledDotsEnabled: true,
          sampleDensity: 0.82,
          confidenceIntensityEnabled: true,
          confidenceAnimationStrength: 'subtle',
        });
        buildBodyVolumeGeometry(screenPose, bodyVolume, {
          bodyVolumeEnabled: true,
          torsoVolumeEnabled: true,
          headVolumeEnabled: true,
          maxVolumeDots: 150,
          torsoDotCount: 86,
          headDotCount: 22,
        });
        const dots = constellation.dotCount + bodyVolume.volumeDotCount;
        totalDots += dots;
        maxDots = Math.max(maxDots, dots);
        totalLines += constellation.lineCount;
        maxLines = Math.max(maxLines, constellation.lineCount);
      } else {
        buildPointCloudBodyGeometry(screenPose, pointCloud, {
          pointCloudBodyEnabled: true,
          density: 'high',
          maxDots: 900,
          dotScale: 1.72,
          showConnections: false,
          showKeypoints: true,
          lowLatencyMode: false,
        });
        totalDots += pointCloud.dotCount;
        maxDots = Math.max(maxDots, pointCloud.dotCount);
        totalLines += pointCloud.connectionLineCount;
        maxLines = Math.max(maxLines, pointCloud.connectionLineCount);
      }
    }

    geometryMs.push(now() - start);
  }

  return {
    mode,
    frames: frames.length,
    geometryMs: geometryMs.snapshot(),
    averageDots: frames.length > 0 ? totalDots / frames.length : 0,
    maxDots,
    averageLines: frames.length > 0 ? totalLines / frames.length : 0,
    maxLines,
  };
}

export function createSyntheticRendererReplayFrames(frameCount: number): RawLandmarkEvent[] {
  const rng = mulberry32(8102);
  const frames: RawLandmarkEvent[] = [];
  const count = Math.max(1, Math.round(frameCount));
  for (let i = 0; i < count; i++) {
    const timestampMs = Math.round((i * 1000) / 30);
    const phase = (i / count) * Math.PI * 4;
    const event = makeFrame(timestampMs, rng, {
      noiseAmp: 0.0015,
      xOffset: Math.sin(phase * 0.5) * 0.035,
      yOffset: Math.sin(phase) * 0.025,
      scale: 1 + Math.sin(phase * 0.25) * 0.05,
    });
    applyArmSweep(event, phase);
    frames.push(event);
  }
  return frames;
}

function applyArmSweep(event: RawLandmarkEvent, phase: number): void {
  const landmarks = event.landmarks as number[];
  const lift = (Math.sin(phase) + 1) * 0.5;
  setLandmark(landmarks, LM.LEFT_ELBOW, 0.6, 0.42 - lift * 0.18);
  setLandmark(landmarks, LM.LEFT_WRIST, 0.62, 0.52 - lift * 0.34);
  setLandmark(landmarks, LM.RIGHT_ELBOW, 0.4, 0.42 - (1 - lift) * 0.18);
  setLandmark(landmarks, LM.RIGHT_WRIST, 0.38, 0.52 - (1 - lift) * 0.34);
}

function setLandmark(landmarks: number[], lm: LM, x: number, y: number): void {
  const base = lm * LANDMARK_STRIDE;
  landmarks[base] = x;
  landmarks[base + 1] = y;
}

function pathMoveCount(path: string): number {
  return path.length === 0 ? 0 : path.split('M').length - 1;
}

class ReplayMetric {
  private readonly values: number[] = [];

  push(value: number): void {
    if (Number.isFinite(value) && value >= 0) this.values.push(value);
  }

  snapshot(): MetricSnapshot {
    if (this.values.length === 0) {
      return { count: 0, p50: null, p90: null, p95: null, p99: null, max: null };
    }
    const sorted = [...this.values].sort((a, b) => a - b);
    return {
      count: sorted.length,
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      max: sorted[sorted.length - 1],
    };
  }
}

function percentile(sorted: readonly number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[idx];
}
