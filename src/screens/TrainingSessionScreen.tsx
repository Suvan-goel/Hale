/**
 * Training session screen — runs a whole voice-guided workout. Same product
 * laws and hot-path discipline as CheckUpScreen: no camera video (clean
 * skeleton on dark), audio-first (once propped, the player runs every item and
 * set by voice; the user never touches the screen), pipeline + skeleton + player
 * per frame, React state throttled to ~10fps, audio triggered imperatively.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { getExercise } from '../exercises';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import {
  TrainingPhase,
  TrainingSessionPlayer,
  TrainingSessionResult,
} from '../training/sessionPlayer';

const UI_UPDATE_INTERVAL_MS = 100;

interface Snapshot {
  phase: TrainingPhase;
  itemIndex: number;
  totalItems: number;
  exerciseName: string | null;
  setIndex: number;
  totalSets: number;
  kind: 'reps' | 'hold' | 'rom' | null;
  repCount: number;
  holdSec: number;
  restSec: number;
}

const INITIAL: Snapshot = {
  phase: 'intro',
  itemIndex: 0,
  totalItems: 0,
  exerciseName: null,
  setIndex: 0,
  totalSets: 0,
  kind: null,
  repCount: 0,
  holdSec: NaN,
  restSec: NaN,
};

const PHASE_CAPTION: Partial<Record<TrainingPhase, string>> = {
  preflight: 'Getting you framed…',
  instructions: 'Listen for your instructions',
  countdown: 'Get ready…',
  rest: 'Rest',
};

export function TrainingSessionScreen({
  exerciseIds,
  onComplete,
}: {
  exerciseIds: string[];
  onComplete: (result: TrainingSessionResult) => void;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [player] = React.useState(
    () => new TrainingSessionPlayer(new Date().toISOString(), exerciseIds, preflight)
  );
  const [voice] = React.useState(() => new VoiceChannel());
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const completedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({ ...INITIAL, totalItems: exerciseIds.length });

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
      const u = player.update(out, voice.busy);

      if (u.voice) voice.speak(u.voice.cues, u.voice.priority);
      if (u.playRepSound) sfx.play('rep-credit');

      if (u.phase === 'done' && !completedRef.current) {
        completedRef.current = true;
        const result = player.result;
        if (result) onComplete(result);
        return;
      }

      if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = event.timestampMs;
        const def = u.currentExerciseId ? getExercise(u.currentExerciseId) : null;
        const next: Snapshot = {
          phase: u.phase,
          itemIndex: u.itemIndex,
          totalItems: exerciseIds.length,
          exerciseName: def ? def.displayName : null,
          setIndex: u.setIndex,
          totalSets: u.totalSets,
          kind: def ? def.kind : null,
          repCount: u.repCount,
          holdSec: u.holdMs > 0 ? u.holdMs / 1000 : NaN,
          restSec: u.phase === 'rest' ? Math.ceil(u.remainingMs / 1000) : NaN,
        };
        setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
      }
    },
    [pipeline, player, voice, sfx, recorder, onComplete, exerciseIds.length]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

  const inSet = snapshot.phase === 'set';
  const showReps = inSet && snapshot.kind === 'reps';
  const showHold = inSet && snapshot.kind === 'hold';

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <SkeletonView ref={skeletonRef} mirrored />
      <View pointerEvents="none" style={styles.hud}>
        {snapshot.phase === 'intro' ? (
          <Text style={styles.caption}>Starting your session…</Text>
        ) : snapshot.phase === 'complete' || snapshot.phase === 'done' ? (
          <Text style={styles.caption}>Great work — that's your session.</Text>
        ) : (
          <>
            <Text style={styles.progress}>
              Exercise {Math.min(snapshot.itemIndex + 1, snapshot.totalItems)} of {snapshot.totalItems}
            </Text>
            {snapshot.exerciseName ? <Text style={styles.movement}>{snapshot.exerciseName}</Text> : null}
            {snapshot.totalSets > 0 ? (
              <Text style={styles.progress}>
                Set {Math.min(snapshot.setIndex + 1, snapshot.totalSets)} of {snapshot.totalSets}
              </Text>
            ) : null}
            {showReps ? (
              <Text style={styles.big}>{snapshot.repCount}</Text>
            ) : showHold ? (
              <Text style={styles.big}>{Number.isFinite(snapshot.holdSec) ? `${Math.floor(snapshot.holdSec)}s` : '—'}</Text>
            ) : snapshot.phase === 'rest' ? (
              <Text style={styles.big}>{Number.isFinite(snapshot.restSec) ? `${snapshot.restSec}s` : ''}</Text>
            ) : (
              <Text style={styles.caption}>{PHASE_CAPTION[snapshot.phase] ?? 'Measuring…'}</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.phase === b.phase &&
    a.itemIndex === b.itemIndex &&
    a.exerciseName === b.exerciseName &&
    a.setIndex === b.setIndex &&
    a.totalSets === b.totalSets &&
    a.repCount === b.repCount &&
    a.holdSec === b.holdSec &&
    a.restSec === b.restSec
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hud: { position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center' },
  progress: { color: '#6F8A77', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  movement: { color: '#E8F4EA', fontSize: 24, fontWeight: '300', marginTop: 6 },
  caption: { color: '#9DB8A4', fontSize: 18, marginTop: 10 },
  big: { color: '#E8F4EA', fontSize: 96, fontVariant: ['tabular-nums'], fontWeight: '200' },
});
