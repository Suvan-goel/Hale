/**
 * Live skeleton screen — Stage 1's proving ground for the camera→pipeline→
 * renderer loop.
 *
 * Hot-path discipline: onLandmarks runs at ~30fps and does pipeline.process +
 * imperative skeleton update only. React state (dev overlay) updates at
 * ~10fps, gated by frame timestamps. No allocations besides the throttled
 * overlay snapshot and SVG path strings.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { CHAIN_COUNT } from '../pose/chains';
import { PosePipeline } from '../pose/pipeline';
import { LandmarkRecorder } from '../recording/recorder';
import { DevOverlay, OverlaySnapshot } from '../render/DevOverlay';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';

const UI_UPDATE_INTERVAL_MS = 100; // ~10fps for React state

const INITIAL_SNAPSHOT: OverlaySnapshot = {
  state: 'no-subject',
  fps: 0,
  inferenceMs: 0,
  chainReliability: new Array<number>(CHAIN_COUNT).fill(0),
  bodyUnit: null,
  recording: false,
  recordedFrames: 0,
};

export function LiveSessionScreen() {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const inferenceMsRef = React.useRef(0);
  const [snapshot, setSnapshot] = React.useState<OverlaySnapshot>(INITIAL_SNAPSHOT);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const onLandmarks = React.useCallback(
    (e: { nativeEvent: LandmarksEventPayload }) => {
      const event = e.nativeEvent;
      recorder.record(event);
      const out = pipeline.process(event);
      skeletonRef.current?.update(out, event.sourceWidth / event.sourceHeight);
      inferenceMsRef.current = event.inferenceMs;

      if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = event.timestampMs;
        if (__DEV__) {
          setSnapshot({
            state: out.state,
            fps: out.fps,
            inferenceMs: inferenceMsRef.current,
            chainReliability: Array.from(out.chainReliability),
            bodyUnit: out.bodyUnit,
            recording: recorder.isRecording,
            recordedFrames: recorder.frameCount,
          });
        }
      }
    },
    [pipeline, recorder]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
    setLastError(e.nativeEvent.message);
  }, []);

  const onToggleRecording = React.useCallback(() => {
    if (recorder.isRecording) {
      void recorder.stop();
    } else {
      recorder.start();
    }
  }, [recorder]);

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <SkeletonView ref={skeletonRef} mirrored />
      <DevOverlay snapshot={snapshot} onToggleRecording={onToggleRecording} />
      {lastError !== null && __DEV__ && (
        <Text style={styles.error} numberOfLines={2}>
          {lastError}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  error: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    color: '#E07A5F',
    fontSize: 12,
    textAlign: 'center',
  },
});
