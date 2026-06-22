export const RECORDING_CARD_ASPECT = 9 / 16;

// Native camera analysis requests a 4:3 frame, delivered upright in portrait.
// The pose-estimation plane is therefore 3:4 inside the taller phone-shaped card.
export const POSE_ESTIMATION_SOURCE_ASPECT = 3 / 4;
export const POSE_ESTIMATION_TOP_OFFSET = 64;

export function recordingCameraViewportSize(
  screenWidth: number,
  _screenHeight: number,
  _compact = false
): { width: number; height: number } {
  const width = Math.max(1, Math.round(screenWidth));
  return {
    width,
    height: Math.round(width / RECORDING_CARD_ASPECT),
  };
}

export function poseEstimationWindowSize(
  cardWidth: number,
  cardHeight: number,
  sourceAspect = POSE_ESTIMATION_SOURCE_ASPECT
): { width: number; height: number; left: number; top: number } {
  const width = Math.max(1, Math.round(cardWidth));
  const height = Math.max(1, Math.round(cardHeight));
  const cardAspect = width / height;

  if (cardAspect < sourceAspect) {
    const windowHeight = Math.round(width / sourceAspect);
    const verticalSlack = height - windowHeight;
    return {
      width,
      height: windowHeight,
      left: 0,
      top: Math.min(POSE_ESTIMATION_TOP_OFFSET, Math.max(0, verticalSlack)),
    };
  }

  const windowWidth = Math.round(height * sourceAspect);
  return {
    width: windowWidth,
    height,
    left: Math.round((width - windowWidth) / 2),
    top: 0,
  };
}
