import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CameraAvailability } from '../components/SafePoseDetectionView';
import {
  FitFramePoseTraceRenderer,
  type FitFramePoseTraceVisualState,
} from '../render/FitFramePoseTraceRenderer';
import type { FitFrameContentWindow } from '../render/fitFramePoseTraceGeometry';
import type {
  RecordingFrameSource,
  RecordingRendererHandle,
} from '../render/recordingRendererTypes';
import type { RecordingVisualGuidance, RecordingVisualState } from './recordingVisualGuidance';

export interface RecordingVisualSurfaceProps {
  rendererRef: React.Ref<RecordingRendererHandle>;
  cameraAvailability?: CameraAvailability;
  poseWindow: FitFrameContentWindow;
  guidance: RecordingVisualGuidance;
  mirrored?: boolean;
  frameSource?: RecordingFrameSource;
}

export function RecordingVisualSurface({
  rendererRef,
  cameraAvailability = 'available',
  poseWindow,
  guidance,
  mirrored = true,
  frameSource = 'raw',
}: RecordingVisualSurfaceProps) {
  if (cameraAvailability === 'unavailable') {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <FitFramePoseTraceRenderer
        ref={rendererRef}
        contentWindow={poseWindow}
        visualState={fitFrameVisualStateForRecording(guidance.visualState)}
        mirrored={mirrored}
        frameSource={frameSource}
      />
    </View>
  );
}

export function fitFrameVisualStateForRecording(
  state: RecordingVisualState
): FitFramePoseTraceVisualState {
  switch (state) {
    case 'ready':
      return 'ready';
    case 'adjust':
      return 'adjust';
    case 'active':
      return 'active';
    case 'tracking':
      return 'tracking';
    case 'recovery':
    case 'lost':
    default:
      return 'lost';
  }
}
