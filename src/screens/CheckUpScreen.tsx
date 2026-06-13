/**
 * Movement Check-Up screen — runs the whole voice-guided battery.
 *
 * Product laws on display: no camera video (clean skeleton on dark); audio-
 * first (once propped, the orchestrator runs all five items by voice and the
 * user never touches the screen); the HUD only mirrors state for glanceability.
 *
 * Hot-path discipline matches AssessmentScreen: pipeline + skeleton +
 * orchestrator per frame; React state throttled to ~10fps; audio triggered
 * imperatively. The orchestrator owns the pre-flight check internally.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { CheckUp } from '../checkup/types';
import { CheckUpOrchestrator, CheckUpPhase, DEFAULT_BATTERY } from '../checkup';
import { getMovement } from '../movements';
import { AssessmentPhase } from '../assessment/sessionController';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';

const UI_UPDATE_INTERVAL_MS = 100;
const TOTAL_ITEMS = DEFAULT_BATTERY.length;

interface Snapshot {
  phase: CheckUpPhase;
  itemIndex: number;
  movementName: string | null;
  itemPhase: AssessmentPhase | null;
  repCount: number;
  remainingSec: number;
}

const INITIAL: Snapshot = {
  phase: 'intro',
  itemIndex: 0,
  movementName: null,
  itemPhase: null,
  repCount: 0,
  remainingSec: NaN,
};

const ITEM_CAPTION: Record<AssessmentPhase, string> = {
  preflight: 'Getting you framed…',
  instructions: 'Listen for your instructions',
  countdown: 'Get ready…',
  active: 'Measuring…',
  result: '',
  done: '',
};

export function CheckUpScreen({ onComplete }: { onComplete: (checkUp: CheckUp) => void }) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [orchestrator] = React.useState(
    () => new CheckUpOrchestrator(new Date().toISOString(), preflight)
  );
  const [voice] = React.useState(() => new VoiceChannel());
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const completedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>(INITIAL);

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
      const u = orchestrator.update(out, voice.busy);

      if (u.voice) voice.speak(u.voice.cues, u.voice.priority);
      if (u.playRepSound) sfx.play('rep-credit');

      if (u.phase === 'done' && !completedRef.current) {
        completedRef.current = true;
        const result = orchestrator.result;
        if (result) onComplete(result);
        return;
      }

      if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = event.timestampMs;
        const movementName = u.currentMovementId ? getMovement(u.currentMovementId).displayName : null;
        const next: Snapshot = {
          phase: u.phase,
          itemIndex: u.itemIndex,
          movementName,
          itemPhase: u.item ? u.item.phase : null,
          repCount: u.item ? u.item.repCount : 0,
          remainingSec: u.item ? Math.ceil(u.item.remainingMs / 1000) : NaN,
        };
        setSnapshot((prev) =>
          prev.phase === next.phase &&
          prev.itemIndex === next.itemIndex &&
          prev.movementName === next.movementName &&
          prev.itemPhase === next.itemPhase &&
          prev.repCount === next.repCount &&
          prev.remainingSec === next.remainingSec
            ? prev
            : next
        );
      }
    },
    [pipeline, orchestrator, voice, sfx, recorder, onComplete]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

  const isChairStandActive =
    snapshot.movementName === '30-Second Chair Stand' && snapshot.itemPhase === 'active';

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <SkeletonView ref={skeletonRef} mirrored />
      <View pointerEvents="none" style={styles.hud}>
        {snapshot.phase === 'intro' ? (
          <Text style={styles.caption}>Starting your check-up…</Text>
        ) : snapshot.phase === 'complete' || snapshot.phase === 'done' ? (
          <Text style={styles.caption}>All done — preparing your results…</Text>
        ) : (
          <>
            <Text style={styles.progress}>
              Exercise {Math.min(snapshot.itemIndex + 1, TOTAL_ITEMS)} of {TOTAL_ITEMS}
            </Text>
            {snapshot.movementName ? <Text style={styles.movement}>{snapshot.movementName}</Text> : null}
            {isChairStandActive ? (
              <>
                <Text style={styles.repCount}>{snapshot.repCount}</Text>
                {Number.isFinite(snapshot.remainingSec) ? (
                  <Text style={styles.timer}>{snapshot.remainingSec}s</Text>
                ) : null}
              </>
            ) : snapshot.itemPhase ? (
              <Text style={styles.caption}>{ITEM_CAPTION[snapshot.itemPhase]}</Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hud: { position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center' },
  progress: { color: '#6F8A77', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
  movement: { color: '#E8F4EA', fontSize: 24, fontWeight: '300', marginTop: 6 },
  caption: { color: '#9DB8A4', fontSize: 18, marginTop: 10 },
  repCount: { color: '#E8F4EA', fontSize: 96, fontVariant: ['tabular-nums'], fontWeight: '200' },
  timer: { color: '#9DB8A4', fontSize: 28, fontVariant: ['tabular-nums'] },
});
