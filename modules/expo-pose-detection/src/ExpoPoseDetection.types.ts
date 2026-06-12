import type { StyleProp, ViewStyle } from 'react-native';

/** MediaPipe PoseLandmarker emits 33 landmarks per pose. */
export const LANDMARK_COUNT = 33;

/** Each landmark is flattened as [x, y, z, visibility, presence]. */
export const LANDMARK_STRIDE = 5;

export type CameraFacing = 'front' | 'back';

export type ModelVariant = 'lite' | 'full';

/**
 * One event per camera frame, ~30fps.
 *
 * `landmarks` is a flat array of LANDMARK_COUNT * LANDMARK_STRIDE numbers
 * ([x, y, z, visibility, presence] per landmark), or an EMPTY array when no
 * pose was detected in the frame. x/y are normalized [0..1] in upright
 * portrait image space, unmirrored (mirroring for front camera is the
 * renderer's job). Timestamps are monotonic milliseconds from the camera
 * clock — comparable within a session, not across sessions.
 */
export type LandmarksEventPayload = {
  timestampMs: number;
  landmarks: number[];
  inferenceMs: number;
  sourceWidth: number;
  sourceHeight: number;
};

export type PoseErrorEventPayload = {
  message: string;
};

export type PermissionResponse = {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
};

export type PoseDetectionViewProps = {
  /** Camera + inference run only while true. */
  active?: boolean;
  /** Default 'front' — the user props the phone facing themselves. */
  cameraFacing?: CameraFacing;
  /** Default 'lite' — 30fps on mid-range devices. 'full' only if profiling allows. */
  modelVariant?: ModelVariant;
  /** Default 0.35 — the 0.5 MediaPipe default misses side-on poses. */
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  minPresenceConfidence?: number;
  onLandmarks?: (event: { nativeEvent: LandmarksEventPayload }) => void;
  onCameraReady?: (event: { nativeEvent: object }) => void;
  onPoseError?: (event: { nativeEvent: PoseErrorEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
