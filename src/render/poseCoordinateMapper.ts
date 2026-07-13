import { LANDMARK_COUNT, LM, PoseFrame } from '../pose/types';

export type PoseViewportFit = 'cover' | 'contain';

export interface PoseScreenViewport {
  width: number;
  height: number;
  /** Camera source aspect (w/h of the upright image), e.g. 480/640. */
  sourceAspect: number;
  /** Mirror x for front camera so the figure moves like a mirror image. */
  mirrored: boolean;
  /** `cover` fills the viewport; `contain` keeps the entire camera coordinate plane visible. */
  fit?: PoseViewportFit;
}

export interface PoseViewportTransform {
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

export function computeViewportTransform(viewport: PoseScreenViewport): PoseViewportTransform {
  const { width, height, sourceAspect, mirrored, fit = 'cover' } = viewport;
  const viewAspect = width / height;
  let sx: number;
  let sy: number;
  let ox = 0;
  let oy = 0;

  const useWidth = fit === 'cover' ? viewAspect > sourceAspect : viewAspect < sourceAspect;
  if (useWidth) {
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

export function computeCoverTransform(viewport: PoseScreenViewport): PoseViewportTransform {
  return computeViewportTransform({ ...viewport, fit: 'cover' });
}

export function computeContainTransform(viewport: PoseScreenViewport): PoseViewportTransform {
  return computeViewportTransform({ ...viewport, fit: 'contain' });
}

export function mapNormalizedX(x: number, transform: PoseViewportTransform): number {
  return (transform.mirrored ? 1 - x : x) * transform.sx + transform.ox;
}

export function mapNormalizedY(y: number, transform: PoseViewportTransform): number {
  return y * transform.sy + transform.oy;
}

export function mapLandmarkX(frame: PoseFrame, lm: LM, transform: PoseViewportTransform): number {
  return mapNormalizedX(frame.xs[lm], transform);
}

export function mapLandmarkY(frame: PoseFrame, lm: LM, transform: PoseViewportTransform): number {
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

  const transform = computeViewportTransform(viewport);
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    out.xs[i] = mapNormalizedX(frame.xs[i], transform);
    out.ys[i] = mapNormalizedY(frame.ys[i], transform);
    out.visibility[i] = frame.visibility[i];
    out.presence[i] = frame.presence[i];
  }
}
