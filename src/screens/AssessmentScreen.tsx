/**
 * Voice-guided assessment screen (V1: 30s chair stand).
 *
 * Product laws on display: no camera video — clean skeleton on dark;
 * audio-first — once the phone is propped the session runs itself
 * (auto-start when framed, spoken countdown, rep chimes, spoken result);
 * the screen only mirrors state for glanceability.
 *
 * Hot-path discipline matches LiveSessionScreen: pipeline + skeleton +
 * controller per frame; React state at ~10fps; audio triggered imperatively.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { AssessmentPhase, SessionController } from '../assessment/sessionController';
import { CHAIR_STAND_ID, ChairStandResult, getMovement } from '../movements';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';

const UI_UPDATE_INTERVAL_MS = 100;

interface ScreenSnapshot {
  phase: AssessmentPhase;
  repCount: number;
  remainingSec: number;
  measuring: boolean;
  result: ChairStandResult | null;
}

const INITIAL_SNAPSHOT: ScreenSnapshot = {
  phase: 'preflight',
  repCount: 0,
  remainingSec: NaN,
  measuring: false,
  result: null,
};

const PHASE_CAPTIONS: Record<AssessmentPhase, string> = {
  preflight: 'Getting you framed…',
  instructions: 'Listen for your instructions',
  countdown: 'Get ready…',
  active: '',
  result: '',
  done: 'Session complete',
};

export function AssessmentScreen() {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [controller] = React.useState(
    () => new SessionController<ChairStandResult>(getMovement(CHAIR_STAND_ID) as never)
  );
  const [voice] = React.useState(() => new VoiceChannel());
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const [snapshot, setSnapshot] = React.useState<ScreenSnapshot>(INITIAL_SNAPSHOT);

  React.useEffect(() => {
    if (__DEV__) recorder.start();
    return () => {
      void recorder.stop();
      voice.stop();
      sfx.release();
    };
  }, [recorder, voice, sfx]);

  const onLandmarks = React.useCallback(
    (e: { nativeEvent: LandmarksEventPayload }) => {
      const event = e.nativeEvent;
      if (__DEV__) recorder.record(event);
      const out = pipeline.process(event);
      skeletonRef.current?.update(out, event.sourceWidth / event.sourceHeight);
      const status = preflight.update(out);
      const update = controller.update(out, status, voice.busy);

      if (update.voice) voice.speak(update.voice.cues, update.voice.priority);
      if (update.playRepSound) sfx.play('rep-credit');

      if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = event.timestampMs;
        const next: ScreenSnapshot = {
          phase: update.phase,
          repCount: update.repCount,
          remainingSec: Math.ceil(update.remainingMs / 1000),
          measuring: update.measuring,
          result: controller.result,
        };
        setSnapshot((prev) =>
          prev.phase === next.phase &&
          prev.repCount === next.repCount &&
          prev.remainingSec === next.remainingSec &&
          prev.measuring === next.measuring &&
          prev.result === next.result
            ? prev
            : next
        );
      }
    },
    [pipeline, preflight, controller, voice, sfx, recorder]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <SkeletonView ref={skeletonRef} mirrored />
      {snapshot.phase === 'active' ? (
        <View pointerEvents="none" style={styles.hud}>
          <Text style={styles.repCount}>{snapshot.repCount}</Text>
          <Text style={styles.timer}>
            {Number.isFinite(snapshot.remainingSec) ? `${snapshot.remainingSec}s` : ''}
          </Text>
        </View>
      ) : snapshot.phase === 'done' && snapshot.result ? (
        <View pointerEvents="none" style={styles.hud}>
          <Text style={styles.caption}>{PHASE_CAPTIONS.done}</Text>
          <Text style={styles.repCount}>{snapshot.result.reps}</Text>
          <Text style={styles.caption}>chair stands</Text>
        </View>
      ) : (
        <View pointerEvents="none" style={styles.hud}>
          <Text style={styles.caption}>{PHASE_CAPTIONS[snapshot.phase]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hud: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  caption: {
    color: '#9DB8A4',
    fontSize: 18,
  },
  repCount: {
    color: '#E8F4EA',
    fontSize: 96,
    fontVariant: ['tabular-nums'],
    fontWeight: '200',
  },
  timer: {
    color: '#9DB8A4',
    fontSize: 28,
    fontVariant: ['tabular-nums'],
  },
});
