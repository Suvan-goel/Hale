import { requireNativeView } from 'expo';
import * as React from 'react';

import type { PoseDetectionViewProps } from './ExpoPoseDetection.types';

const NativeView: React.ComponentType<PoseDetectionViewProps> =
  requireNativeView('ExpoPoseDetection');

/**
 * Owns the camera and MediaPipe inference natively; emits one landmark-array
 * event per frame via `onLandmarks`. Renders nothing but black — camera video
 * is never shown (product law #1).
 */
export default function PoseDetectionView(props: PoseDetectionViewProps) {
  return (
    <NativeView
      active={props.active ?? false}
      cameraFacing={props.cameraFacing ?? 'front'}
      modelVariant={props.modelVariant ?? 'full'}
      minDetectionConfidence={props.minDetectionConfidence ?? 0.35}
      minTrackingConfidence={props.minTrackingConfidence ?? 0.35}
      minPresenceConfidence={props.minPresenceConfidence ?? 0.35}
      onLandmarks={props.onLandmarks}
      onCameraReady={props.onCameraReady}
      onPoseError={props.onPoseError}
      style={props.style}
    />
  );
}
