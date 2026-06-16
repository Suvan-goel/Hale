import { LANDMARK_COUNT, LM, PoseFrame } from '../pose/types';

export interface PoseScreenViewport {
  width: number;
  height: number;
  /** Camera source aspect (w/h of the upright image), e.g. 480/640. */
  sourceAspect: number;
  /** Mirror x for front camera so the figure moves like a mirror image. */
  mirrored: boolean;
}

export interface PoseCoverTransform {
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  mirrored: boolean;
}

export interface ScreenPoseLandmarks {
  timestampMs: number;
  hasPose: boolean;
  xs: Float64Array;
  ys: Float64Array;
  visibility: Float64Array;
  presence: Float64Array;
}

export function createScreenPoseLandmarks(): ScreenPoseLandmarks {
  return {
    timestampMs: 0,
    hasPose: false,
    xs: new Float64Array(LANDMARK_COUNT),
    ys: new Float64Array(LANDMARK_COUNT),
    visibility: new Float64Array(LANDMARK_COUNT),
    presence: new Float64Array(LANDMARK_COUNT),
  };
}

export function copyScreenPoseLandmarks(src: ScreenPoseLandmarks, dst: ScreenPoseLandmarks): void {
  dst.timestampMs = src.timestampMs;
  dst.hasPose = src.hasPose;
  dst.xs.set(src.xs);
  dst.ys.set(src.ys);
  dst.visibility.set(src.visibility);
  dst.presence.set(src.presence);
}

export function computeCoverTransform(viewport: PoseScreenViewport): PoseCoverTransform {
  const { width, height, sourceAspect, mirrored } = viewport;
  const viewAspect = width / height;
  let sx: number;
  let sy: number;
  let ox = 0;
  let oy = 0;

  if (viewAspect > sourceAspect) {
    sx = width;
    sy = width / sourceAspect;
    oy = (height - sy) / 2;
  } else {
    sy = height;
    sx = height * sourceAspect;
    ox = (width - sx) / 2;
  }

  return { sx, sy, ox, oy, mirrored };
}

export function mapNormalizedX(x: number, transform: PoseCoverTransform): number {
  return (transform.mirrored ? 1 - x : x) * transform.sx + transform.ox;
}

export function mapNormalizedY(y: number, transform: PoseCoverTransform): number {
  return y * transform.sy + transform.oy;
}

export function mapLandmarkX(frame: PoseFrame, lm: LM, transform: PoseCoverTransform): number {
  return mapNormalizedX(frame.xs[lm], transform);
}

export function mapLandmarkY(frame: PoseFrame, lm: LM, transform: PoseCoverTransform): number {
  return mapNormalizedY(frame.ys[lm], transform);
}

export function mapPoseFrameToScreenPose(
  frame: PoseFrame,
  viewport: PoseScreenViewport,
  out: ScreenPoseLandmarks
): void {
  out.timestampMs = frame.timestampMs;
  out.hasPose = frame.hasPose;
  if (!frame.hasPose) return;

  const transform = computeCoverTransform(viewport);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    out.xs[i] = mapNormalizedX(frame.xs[i], transform);
    out.ys[i] = mapNormalizedY(frame.ys[i], transform);
    out.visibility[i] = frame.visibility[i];
    out.presence[i] = frame.presence[i];
  }
}
