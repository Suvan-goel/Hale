/**
 * Training session screen — runs a whole voice-guided workout. Same product
 * laws and hot-path discipline as CheckUpScreen: no camera video (clean
 * skeleton on dark), audio-first (once propped, the player runs every item and
 * set by voice, while visible controls keep pause/help/skip/stop available),
 * pipeline + skeleton + player per frame, React state throttled to ~10fps,
 * audio triggered imperatively.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { getExercise, type ExerciseDefinition } from '../exercises';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { SetupHelpPanel } from '../preflight/SetupHelpPanel';
import { FRAMING_READY_COPY } from '../preflight/setupCopy';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import { pointCloudBodyPartsForTrainingExercise } from '../render/poseAvatarMuscleFocus';
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
import { recordingCameraViewportSize } from './recordingViewport';

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
  validTimeCaption: string | null;
  setupIssue: boolean;
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
  validTimeCaption: null,
  setupIssue: false,
};

const PHASE_CAPTION: Partial<Record<TrainingPhase, string>> = {
  preflight: 'Getting you framed…',
  instructions: FRAMING_READY_COPY,
  countdown: 'Get ready…',
  rest: 'Rest',
};

export function TrainingSessionScreen({
  exerciseIds,
  onComplete,
  onCancel,
  voiceId,
}: {
  exerciseIds: string[];
  onComplete: (result: TrainingSessionResult) => void;
  onCancel?: () => void;
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
  const lastFrameTimestampRef = React.useRef(0);
  const pauseStartedAtRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const resumePendingRef = React.useRef(false);
  const completedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({ ...INITIAL, totalItems: exerciseIds.length });
  const [paused, setPaused] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const windowSize = useWindowDimensions();

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
      lastFrameTimestampRef.current = event.timestampMs;
      if (__DEV__) recorder.record(event);
      const out = pipeline.process(event);
      skeletonRef.current?.update(out, event.sourceWidth / event.sourceHeight);
      if (resumePendingRef.current) {
        player.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) return;
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
          validTimeCaption: u.validTimeCaption,
          setupIssue: u.setupIssue,
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
  const showHold = inSet && (snapshot.kind === 'hold' || snapshot.kind === 'timer' || !!snapshot.validTimeCaption);
  const avatarMeasurementState = trainingAvatarState(snapshot.phase);
  const avatarActiveBodyParts = React.useMemo(
    () =>
      snapshot.exerciseId
        ? pointCloudBodyPartsForTrainingExercise(getExercise(snapshot.exerciseId))
        : undefined,
    [snapshot.exerciseId]
  );
  const canControl = snapshot.phase !== 'complete' && snapshot.phase !== 'done';
  const canRepeat = snapshot.exerciseId !== null;
  const canSkip =
    snapshot.exerciseId !== null &&
    snapshot.phase !== 'intro' &&
    snapshot.phase !== 'transition' &&
    snapshot.phase !== 'complete' &&
    snapshot.phase !== 'done';
  const cameraViewport = React.useMemo(
    () => recordingCameraViewportSize(windowSize.width, windowSize.height, snapshot.setupIssue || showHelp),
    [showHelp, snapshot.setupIssue, windowSize.height, windowSize.width]
  );

  const pause = React.useCallback(() => {
    pausedRef.current = true;
    pauseStartedAtRef.current = lastFrameTimestampRef.current;
    voice.stop();
    setPaused(true);
  }, [voice]);

  const resume = React.useCallback(() => {
    pausedRef.current = false;
    resumePendingRef.current = true;
    setPaused(false);
  }, []);

  const repeatInstructions = React.useCallback(() => {
    if (!snapshot.exerciseId) return;
    const cues = getExercise(snapshot.exerciseId).voice.instructions;
    if (cues.length > 0) voice.speak(cues, 8);
  }, [snapshot.exerciseId, voice]);

  const skipCurrent = React.useCallback(() => {
    voice.stop();
    setShowHelp(false);
    player.skipCurrentItem();
  }, [player, voice]);

  const tryAgain = React.useCallback(() => {
    voice.stop();
    setShowHelp(false);
    player.retrySetup();
  }, [player, voice]);

  const stop = React.useCallback(() => {
    voice.stop();
    onCancel?.();
  }, [onCancel, voice]);

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <View style={styles.layout}>
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
                <>
                  <Text style={styles.big}>{Number.isFinite(snapshot.holdSec) ? `${Math.floor(snapshot.holdSec)}s` : '-'}</Text>
                  {snapshot.validTimeCaption ? <Text style={styles.caption}>{snapshot.validTimeCaption}</Text> : null}
                </>
              ) : snapshot.phase === 'rest' ? (
                <Text style={styles.big}>{Number.isFinite(snapshot.restSec) ? `${snapshot.restSec}s` : ''}</Text>
              ) : (
                <Text style={styles.caption}>{PHASE_CAPTION[snapshot.phase] ?? 'Measuring…'}</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.avatarSlot}>
          <View style={[styles.avatarViewport, cameraViewport]}>
            <SkeletonView
              ref={skeletonRef}
              mirrored
              fit="contain"
              lowLatencyMode
              pointCloudBodyMaxDots={260}
              pointCloudBodyActiveParts={avatarActiveBodyParts}
              measurementState={avatarMeasurementState}
              activeDomain={snapshot.activeDomain}
            />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          {paused ? (
            <View style={styles.pausedBanner}>
              <Text style={styles.caption}>Paused</Text>
            </View>
          ) : null}
          {snapshot.setupIssue ? (
            <SetupHelpPanel
              mode="workout"
              onTryAgain={tryAgain}
              onClose={() => setShowHelp(false)}
              onSkip={skipCurrent}
              skipLabel="Skip exercise"
            />
          ) : showHelp ? (
            <SetupHelpPanel mode="help" onClose={() => setShowHelp(false)} />
          ) : null}
          {canControl ? (
            <View style={styles.controls}>
              <ControlButton title={paused ? 'Resume' : 'Pause'} onPress={paused ? resume : pause} />
              <ControlButton title="Repeat" onPress={repeatInstructions} disabled={!canRepeat} />
              <ControlButton title="Help" onPress={() => setShowHelp((value) => !value)} />
              <ControlButton title="Skip exercise" onPress={skipCurrent} disabled={!canSkip} />
              {onCancel ? <ControlButton title="Stop" onPress={stop} tone="danger" /> : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ControlButton({
  title,
  onPress,
  disabled,
  tone = 'normal',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'normal' | 'danger';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlButton,
        tone === 'danger' && styles.controlDanger,
        disabled && styles.controlDisabled,
        pressed && !disabled && styles.controlPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.controlText, tone === 'danger' && styles.controlDangerText]}>{title}</Text>
    </Pressable>
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
    a.restSec === b.restSec &&
    a.validTimeCaption === b.validTimeCaption &&
    a.setupIssue === b.setupIssue
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
  layout: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  hud: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.panel,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    ...shadow.soft,
  },
  progress: { ...type.label, color: colors.sageDeep, marginTop: 4 },
  movement: { ...type.h1, marginTop: 6, textAlign: 'center' },
  caption: { ...type.body, color: colors.textSecondary, marginTop: 10 },
  big: { ...type.metric },
  avatarSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  avatarViewport: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.panel,
    backgroundColor: colors.bgBase,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  bottomPanel: {
    gap: spacing.md,
    alignItems: 'stretch',
  },
  pausedBanner: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  controlButton: {
    minHeight: 48,
    minWidth: 76,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  controlDanger: { borderColor: colors.cautionBorder, backgroundColor: colors.cautionSoft },
  controlDisabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.76 },
  controlText: { ...type.button, color: colors.accentDeep },
  controlDangerText: { color: colors.error },
});
