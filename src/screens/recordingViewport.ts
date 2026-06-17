import { spacing } from '../theme';

export const RECORDING_CAMERA_ASPECT = 3 / 4;

export function recordingCameraViewportSize(
  screenWidth: number,
  screenHeight: number,
  compact = false
): { width: number; height: number } {
  const horizontalRoom = Math.max(180, screenWidth - spacing.lg * 2);
  const preferredWidth = Math.min(horizontalRoom, screenWidth * 0.72, 330);
  const maxHeight = screenHeight * (compact ? 0.34 : 0.42);
  const height = Math.max(180, Math.min(preferredWidth / RECORDING_CAMERA_ASPECT, maxHeight));
  return {
    width: Math.round(height * RECORDING_CAMERA_ASPECT),
    height: Math.round(height),
  };
}
