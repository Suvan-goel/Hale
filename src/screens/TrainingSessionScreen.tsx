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
import { getExercise, type ExerciseDefinition } from '../exercises';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
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
  exerciseId: string | null;
  exerciseName: string | null;
  activeDomain: PoseAvatarActiveDomain | null;
  setIndex: number;
  totalSets: number;
  kind: 'reps' | 'hold' | 'rom' | 'timer' | null;
  repCount: number;
  holdSec: number;
  restSec: number;
}

const INITIAL: Snapshot = {
  phase: 'intro',
  itemIndex: 0,
  totalItems: 0,
  exerciseId: null,
  exerciseName: null,
  activeDomain: null,
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
  voiceId,
}: {
  exerciseIds: string[];
  onComplete: (result: TrainingSessionResult) => void;
  voiceId?: string;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [player] = React.useState(
    () => new TrainingSessionPlayer(new Date().toISOString(), exerciseIds, preflight)
  );
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
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
          exerciseId: u.currentExerciseId,
          exerciseName: def ? def.displayName : null,
          activeDomain: def ? domainForTrainingExercise(def) : null,
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
  const showHold = inSet && (snapshot.kind === 'hold' || snapshot.kind === 'timer');
  const avatarMeasurementState = trainingAvatarState(snapshot.phase);

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <SkeletonView
        ref={skeletonRef}
        mirrored
        measurementState={avatarMeasurementState}
        activeDomain={snapshot.activeDomain}
      />
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
    a.exerciseId === b.exerciseId &&
    a.exerciseName === b.exerciseName &&
    a.activeDomain === b.activeDomain &&
    a.setIndex === b.setIndex &&
    a.totalSets === b.totalSets &&
    a.repCount === b.repCount &&
    a.holdSec === b.holdSec &&
    a.restSec === b.restSec
  );
}

function trainingAvatarState(phase: TrainingPhase): PoseAvatarMeasurementState {
  switch (phase) {
    case 'preflight':
      return 'framing';
    case 'instructions':
    case 'countdown':
      return 'ready';
    case 'set':
      return 'training';
    case 'rest':
      return 'rest';
    case 'complete':
    case 'done':
      return 'success';
    case 'intro':
    case 'transition':
    default:
      return 'setup';
  }
}

function domainForTrainingExercise(definition: ExerciseDefinition): PoseAvatarActiveDomain {
  if (definition.slot === 'balance') return 'balance';
  if (definition.slot === 'mobility') return 'mobility';
  if (definition.family.includes('mobility') || definition.family.includes('reach')) return 'mobility';
  return 'strength_power';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  hud: {
    position: 'absolute',
    top: spacing.huge,
    left: spacing.xxl,
    right: spacing.xxl,
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  progress: { ...type.label, color: colors.sageDeep, marginTop: 4 },
  movement: { ...type.h1, marginTop: 6, textAlign: 'center' },
  caption: { ...type.body, color: colors.textSecondary, marginTop: 10 },
  big: { ...type.metric },
});
