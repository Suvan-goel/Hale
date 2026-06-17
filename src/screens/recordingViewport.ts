export const RECORDING_CAMERA_ASPECT = 3 / 4;

export function recordingCameraViewportSize(
  screenWidth: number,
  _screenHeight: number,
  _compact = false
): { width: number; height: number } {
  const width = Math.max(1, Math.round(screenWidth));
  return {
    width,
    height: Math.round(width / RECORDING_CAMERA_ASPECT),
  };
}
