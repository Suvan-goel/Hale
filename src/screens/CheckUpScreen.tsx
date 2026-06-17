/**
 * Movement Check-Up screen — runs the whole voice-guided battery.
 *
 * Product laws on display: no camera video (clean skeleton on dark); audio-
 * first (once propped, the orchestrator runs by voice, while visible controls
 * keep pause/help/skip/stop available); the HUD mirrors state for glanceability.
 *
 * Hot-path discipline matches AssessmentScreen: pipeline + skeleton +
 * orchestrator per frame; React state throttled to ~10fps; audio triggered
 * imperatively. The orchestrator owns the pre-flight check internally.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { CheckUp } from '../checkup/types';
import { CheckUpOrchestrator, CheckUpPhase, DEFAULT_BATTERY } from '../checkup';
import { checkupIntroCaption } from '../checkup/copy';
import { getMovement } from '../movements';
import { AssessmentPhase } from '../assessment/sessionController';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { SetupHelpPanel } from '../preflight/SetupHelpPanel';
import { FRAMING_READY_COPY } from '../preflight/setupCopy';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
import { recordingCameraViewportSize } from './recordingViewport';

const UI_UPDATE_INTERVAL_MS = 100;
const TOTAL_ITEMS = DEFAULT_BATTERY.length;

interface Snapshot {
  phase: CheckUpPhase;
  itemIndex: number;
  movementId: string | null;
  movementName: string | null;
  itemPhase: AssessmentPhase | null;
  repCount: number;
  remainingSec: number;
  setupIssue: boolean;
  totalItems: number;
}

const INITIAL: Snapshot = {
  phase: 'intro',
  itemIndex: 0,
  movementId: null,
  movementName: null,
  itemPhase: null,
  repCount: 0,
  remainingSec: NaN,
  setupIssue: false,
  totalItems: TOTAL_ITEMS,
};

const ITEM_CAPTION: Record<AssessmentPhase, string> = {
  preflight: 'Getting you framed…',
  instructions: FRAMING_READY_COPY,
  countdown: 'Get ready…',
  active: 'Measuring…',
  result: '',
  done: '',
};

export function CheckUpScreen({
  onComplete,
  onCancel,
  voiceId,
}: {
  onComplete: (checkUp: CheckUp) => void;
  onCancel?: () => void;
  voiceId?: string;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [orchestrator] = React.useState(
    () => new CheckUpOrchestrator(new Date().toISOString(), preflight)
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
  const [snapshot, setSnapshot] = React.useState<Snapshot>(INITIAL);
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
        orchestrator.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) return;
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
          movementId: u.currentMovementId,
          movementName,
          itemPhase: u.item ? u.item.phase : null,
          repCount: u.item ? u.item.repCount : 0,
          remainingSec: u.item ? Math.ceil(u.item.remainingMs / 1000) : NaN,
          setupIssue: u.setupIssue,
          totalItems: u.totalItems,
        };
        setSnapshot((prev) =>
          prev.phase === next.phase &&
          prev.itemIndex === next.itemIndex &&
          prev.movementId === next.movementId &&
          prev.movementName === next.movementName &&
          prev.itemPhase === next.itemPhase &&
          prev.repCount === next.repCount &&
          prev.remainingSec === next.remainingSec &&
          prev.setupIssue === next.setupIssue &&
          prev.totalItems === next.totalItems
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
  const avatarMeasurementState = checkupAvatarState(snapshot);
  const avatarDomain = domainForCheckupMovement(snapshot.movementId);
  const canControl = snapshot.phase !== 'complete' && snapshot.phase !== 'done';
  const canRepeat = snapshot.movementId !== null;
  const canSkip = snapshot.phase === 'item' && snapshot.movementId !== null;
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
    if (!snapshot.movementId) return;
    const cues = getMovement(snapshot.movementId).voice.instructions;
    if (cues.length > 0) voice.speak(cues, 8);
  }, [snapshot.movementId, voice]);

  const skipCurrent = React.useCallback(() => {
    voice.stop();
    setShowHelp(false);
    orchestrator.skipCurrentItem();
  }, [orchestrator, voice]);

  const tryAgain = React.useCallback(() => {
    voice.stop();
    setShowHelp(false);
    orchestrator.retrySetup();
  }, [orchestrator, voice]);

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
            <>
              <Text style={styles.caption}>Starting your Movement Check-Up…</Text>
              <Text style={styles.intro}>{checkupIntroCaption(snapshot.totalItems)}</Text>
            </>
          ) : snapshot.phase === 'complete' || snapshot.phase === 'done' ? (
            <Text style={styles.caption}>All done — preparing your results…</Text>
          ) : (
            <>
              <Text style={styles.progress}>
                Test {Math.min(snapshot.itemIndex + 1, snapshot.totalItems)} of {snapshot.totalItems}
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

        <View style={styles.avatarSlot}>
          <View style={[styles.avatarViewport, cameraViewport]}>
            <SkeletonView
              ref={skeletonRef}
              mirrored
              fit="contain"
              lowLatencyMode
              pointCloudBodyMaxDots={260}
              measurementState={avatarMeasurementState}
              activeDomain={avatarDomain}
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
              mode="checkup"
              onTryAgain={tryAgain}
              onClose={() => setShowHelp(false)}
              onSkip={skipCurrent}
              skipLabel="Skip for now"
            />
          ) : showHelp ? (
            <SetupHelpPanel mode="help" onClose={() => setShowHelp(false)} />
          ) : null}
          {canControl ? (
            <View style={styles.controls}>
              <ControlButton title={paused ? 'Resume' : 'Pause'} onPress={paused ? resume : pause} />
              <ControlButton title="Repeat" onPress={repeatInstructions} disabled={!canRepeat} />
              <ControlButton title="Help" onPress={() => setShowHelp((value) => !value)} />
              <ControlButton title="Skip for now" onPress={skipCurrent} disabled={!canSkip} />
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

function checkupAvatarState(snapshot: Snapshot): PoseAvatarMeasurementState {
  if (snapshot.phase === 'complete' || snapshot.phase === 'done') return 'success';
  if (snapshot.phase === 'intro' || snapshot.phase === 'transition') return 'setup';
  if (snapshot.itemPhase === 'preflight') return 'framing';
  if (snapshot.itemPhase === 'instructions' || snapshot.itemPhase === 'countdown') return 'ready';
  if (snapshot.itemPhase === 'active') return 'checkup';
  if (snapshot.itemPhase === 'result' || snapshot.itemPhase === 'done') return 'success';
  return 'checkup';
}

function domainForCheckupMovement(movementId: string | null): PoseAvatarActiveDomain | null {
  switch (movementId) {
    case 'chair-stand-30s':
      return 'strength_power';
    case 'balance-ladder':
    case 'timed-up-and-go':
      return 'balance';
    case 'shoulder-flexion-peak':
    case 'hinge-reach':
      return 'mobility';
    default:
      return null;
  }
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
  progress: { ...type.label, color: colors.sageDeep },
  movement: { ...type.h1, marginTop: 6, textAlign: 'center' },
  caption: { ...type.body, color: colors.textSecondary, marginTop: 10 },
  intro: { ...type.bodySmall, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' },
  repCount: { ...type.metric },
  timer: { ...type.metricSmall, marginTop: 4 },
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
