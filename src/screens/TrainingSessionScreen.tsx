/**
 * Training session screen — runs a whole voice-guided workout. Same product
 * laws and hot-path discipline as CheckUpScreen: no camera video (clean
 * skeleton on dark), audio-first (once propped, the player runs every item and
 * set by voice, while visible controls keep pause/help/skip/stop available),
 * pipeline + skeleton + player per frame, React state throttled to ~10fps,
 * audio triggered imperatively.
 */

import * as React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  type StyleProp,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
} from '../components/SafePoseDetectionView';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { getExercise, type ExerciseDefinition } from '../exercises';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import type { PreflightPrompt } from '../preflight/preflight';
import { FRAMING_READY_COPY, SETUP_HELP_TIPS } from '../preflight/setupCopy';
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
import type { SafetyCueId } from '../training/safetyCues';
import { poseEstimationWindowSize, recordingCameraViewportSize } from './recordingViewport';

const UI_UPDATE_INTERVAL_MS = 100;
const IOS_RECORDING_TOP_CLEARANCE = 44;

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
  setupPrompt: PreflightPrompt | null;
  safetyCueIds: readonly SafetyCueId[];
  safetyText: readonly string[];
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
  setupPrompt: null,
  safetyCueIds: [],
  safetyText: [],
};

const PHASE_CAPTION: Partial<Record<TrainingPhase, string>> = {
  preflight: 'Getting you framed…',
  instructions: FRAMING_READY_COPY,
  countdown: 'Get ready…',
  rest: 'Rest',
};

type StageDisplay = {
  mode: 'metric';
  value: string;
  label: string;
};

type FooterMeta = {
  exercise: string;
  set: string | null;
};

type TrainingSessionDebugScenario = 'busy';

type TrainingSessionNoticeAction = 'help';

type TrainingSessionNotice = {
  text: string;
  action: TrainingSessionNoticeAction | null;
};

const BUSY_DEBUG_SNAPSHOT: Snapshot = {
  phase: 'set',
  itemIndex: 1,
  totalItems: 4,
  exerciseId: 'balance-feet-together-hold',
  exerciseName: 'Feet-Together Hold',
  activeDomain: 'balance',
  setIndex: 1,
  totalSets: 3,
  kind: 'hold',
  repCount: 0,
  holdSec: 18,
  restSec: NaN,
  validTimeCaption: null,
  setupIssue: false,
  setupPrompt: 'step-back',
  safetyCueIds: [],
  safetyText: [
    'Keep fingertips near a chair or counter.',
    'Stop if you feel dizzy, sharp pain, or unsteady.',
  ],
};

const TRAINING_HELP_SAFETY_TIPS: readonly string[] = [
  'Keep fingertips near a chair or counter.',
  'Stop if you feel dizzy, sharp pain, or unsteady.',
];

export function TrainingSessionScreen({
  exerciseIds,
  sessionTitle,
  onComplete,
  onCancel,
  voiceId,
  debugScenario,
}: {
  exerciseIds: string[];
  sessionTitle?: string;
  onComplete: (result: TrainingSessionResult) => void;
  onCancel?: () => void;
  voiceId?: string;
  debugScenario?: TrainingSessionDebugScenario;
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
  const discardWasPausedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({ ...INITIAL, totalItems: exerciseIds.length });
  const [paused, setPaused] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [discardModalVisible, setDiscardModalVisible] = React.useState(false);
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const windowSize = useWindowDimensions();
  const recordingTopPadding = recordingScreenTopPadding();
  const exerciseDefinitions = React.useMemo(() => exerciseIds.map((id) => getExercise(id)), [exerciseIds]);

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
      const sourceAspect = event.sourceWidth / event.sourceHeight;
      if (resumePendingRef.current) {
        player.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) {
        skeletonRef.current?.update(out, sourceAspect);
        return;
      }
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
          setupPrompt: u.setupPrompt,
          safetyCueIds: u.safetyCueIds.slice(),
          safetyText: u.safetyText.slice(),
        };
        setSnapshot((prev) => {
          const hydratedNext =
            next.safetyText.length > 0 ||
            next.exerciseId !== prev.exerciseId ||
            next.phase === 'complete' ||
            next.phase === 'done'
              ? next
              : { ...next, safetyCueIds: prev.safetyCueIds, safetyText: prev.safetyText };
          return sameSnapshot(prev, hydratedNext) ? prev : hydratedNext;
        });
      }
      skeletonRef.current?.update(out, sourceAspect);
    },
    [pipeline, player, voice, sfx, recorder, onComplete, exerciseIds.length]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

  const busyDebug = debugScenario === 'busy';
  const visibleSnapshot = busyDebug ? BUSY_DEBUG_SNAPSHOT : snapshot;
  const visiblePaused = busyDebug ? false : paused;
  const visibleShowHelp = busyDebug ? false : showHelp;
  const visibleCameraAvailability: CameraAvailability = busyDebug ? 'available' : cameraAvailability;
  const sessionNotice = trainingSessionNotice(
    visibleSnapshot,
    visiblePaused,
    visibleShowHelp,
    visibleCameraAvailability,
    busyDebug
  );
  const sessionNoticeAction = sessionNotice?.action ?? null;
  const currentExerciseName = visibleSnapshot.exerciseName ?? exerciseDefinitions[0]?.displayName ?? 'Today\'s Hale session';
  const totalItems = visibleSnapshot.totalItems || exerciseDefinitions.length || exerciseIds.length;
  const visibleItemNumber = totalItems > 0 ? Math.min(visibleSnapshot.itemIndex + 1, totalItems) : 0;
  const footerMeta = trainingFooterMeta(visibleSnapshot, visibleItemNumber, totalItems);
  const stageDisplay = trainingStageDisplay(visibleSnapshot, visibleCameraAvailability);
  const avatarMeasurementState = trainingAvatarState(visibleSnapshot.phase);
  const avatarActiveBodyParts = React.useMemo(
    () =>
      visibleSnapshot.exerciseId
        ? pointCloudBodyPartsForTrainingExercise(getExercise(visibleSnapshot.exerciseId))
        : undefined,
    [visibleSnapshot.exerciseId]
  );
  const canControl =
    visibleCameraAvailability !== 'unavailable' && visibleSnapshot.phase !== 'complete' && visibleSnapshot.phase !== 'done';
  const canRepeat = visibleSnapshot.exerciseId !== null;
  const showRepeatControl = visiblePaused && canRepeat;
  const showSkipControl = canRepeat && (visiblePaused || visibleSnapshot.setupIssue || busyDebug);
  const showUnavailableAction = visibleCameraAvailability === 'unavailable' && !!onCancel;
  const viewportWidth = Math.max(1, Math.min(windowSize.width - spacing.md * 2, spacing.pageMaxWidth));
  const cameraViewport = React.useMemo(
    () => recordingCameraViewportSize(viewportWidth, windowSize.height, snapshot.setupIssue || showHelp),
    [showHelp, snapshot.setupIssue, viewportWidth, windowSize.height]
  );
  const poseWindow = React.useMemo(
    () => poseEstimationWindowSize(cameraViewport.width, cameraViewport.height),
    [cameraViewport.height, cameraViewport.width]
  );
  const recordingFooterFrame = React.useMemo(
    () => ({
      top: poseWindow.top + poseWindow.height,
      height: Math.max(1, cameraViewport.height - (poseWindow.top + poseWindow.height)),
    }),
    [cameraViewport.height, poseWindow.height, poseWindow.top]
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

  const requestDiscardSession = React.useCallback(() => {
    if (!onCancel) return;
    if (!shouldConfirmDiscardTrainingSession(snapshot, cameraAvailability)) {
      voice.stop();
      setShowHelp(false);
      onCancel();
      return;
    }
    discardWasPausedRef.current = pausedRef.current;
    if (!pausedRef.current) {
      pause();
    } else {
      voice.stop();
    }
    setDiscardModalVisible(true);
  }, [cameraAvailability, onCancel, pause, snapshot, voice]);

  const keepSession = React.useCallback(() => {
    setDiscardModalVisible(false);
    if (!discardWasPausedRef.current) {
      resume();
    }
  }, [resume]);

  const repeatInstructions = React.useCallback(() => {
    if (!snapshot.exerciseId) return;
    const cues = getExercise(snapshot.exerciseId).voice.instructions;
    const safetyCues = snapshot.safetyCueIds;
    if (cues.length > 0 || safetyCues.length > 0) voice.speak([...cues, ...safetyCues], 8);
  }, [snapshot.exerciseId, snapshot.safetyCueIds, voice]);

  const skipCurrent = React.useCallback(() => {
    voice.stop();
    setShowHelp(false);
    player.skipCurrentItem();
  }, [player, voice]);

  const discardSession = React.useCallback(() => {
    setDiscardModalVisible(false);
    voice.stop();
    onCancel?.();
  }, [onCancel, voice]);

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active={!busyDebug}
        modelVariant="lite"
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={setCameraAvailability}
      />
      <ScrollView
        style={styles.layout}
        contentContainerStyle={[styles.layoutContent, { paddingTop: recordingTopPadding }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topBar}>
          {onCancel ? (
            <BackArrowButton accessibilityLabel="Discard session" onPress={requestDiscardSession} style={styles.topBarBackButton} />
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            {sessionTitle?.trim() || 'Today\'s Hale session'}
          </Text>
        </View>

        <View style={styles.avatarSlot}>
          <View style={[styles.avatarViewport, cameraViewport]}>
            <View pointerEvents="box-none" style={styles.recordingChrome}>
              <HeaderLogo size={34} style={styles.recordingLogo} />
              <RecordingSetupNotice
                visible={sessionNotice !== null}
                text={sessionNotice?.text ?? ''}
                onPress={sessionNoticeAction ? () => setShowHelp(true) : undefined}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.helpIconButton,
                  showHelp && styles.helpIconButtonSelected,
                  pressed && styles.controlPressed,
                ]}
                onPress={() => setShowHelp(true)}
                accessibilityRole="button"
                accessibilityLabel="Open help"
                accessibilityState={{ selected: showHelp }}
              >
                <Text style={[styles.helpIconText, showHelp && styles.helpIconTextSelected]}>?</Text>
              </Pressable>
            </View>
            {visibleCameraAvailability === 'unavailable' ? (
              <CameraUnavailableNotice compact style={styles.recordingCameraUnavailableNotice} />
            ) : (
              <SkeletonView
                ref={skeletonRef}
                mirrored
                fit="contain"
                frameSource="raw"
                smoothingEnabled={false}
                pointCloudBodyDensity="high"
                pointCloudBodyMaxDots={900}
                pointCloudBodyDotScale={1.72}
                confidenceFadingEnabled={false}
                confidenceIntensityEnabled={false}
                reacquisitionFadeEnabled={false}
                recognitionPulseEnabled={false}
                pointCloudBodyActiveParts={avatarActiveBodyParts}
                measurementState={avatarMeasurementState}
                activeDomain={visibleSnapshot.activeDomain}
                setupGuidesEnabled={false}
                stateTransitionsEnabled={false}
              />
            )}
            <RecordingCardFooter
              exerciseName={currentExerciseName}
              meta={footerMeta}
              display={stageDisplay}
              style={recordingFooterFrame}
            />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          {showUnavailableAction ? (
            <View style={styles.controls}>
              <ControlButton title="Close session" onPress={() => onCancel?.()} primary />
            </View>
          ) : canControl ? (
            <View style={styles.controls}>
              <ControlButton title={visiblePaused ? 'Resume' : 'Pause'} onPress={visiblePaused ? resume : pause} />
              {showRepeatControl ? (
                <ControlButton title="Repeat" onPress={repeatInstructions} />
              ) : null}
              {showSkipControl ? <ControlButton title="Skip exercise" onPress={skipCurrent} /> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <DiscardSessionModal
        visible={discardModalVisible}
        onKeep={keepSession}
        onDiscard={discardSession}
      />
      <SessionHelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </View>
  );
}

function RecordingSetupNotice({
  visible,
  text,
  onPress,
}: {
  visible: boolean;
  text: string;
  onPress?: () => void;
}) {
  if (!visible) {
    return <View pointerEvents="none" style={styles.recordingSetupNoticeSlot} />;
  }

  return (
    <View style={styles.recordingSetupNoticeSlot}>
      <Pressable
        style={({ pressed }) => [styles.recordingSetupNotice, pressed && onPress && styles.controlPressed]}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={onPress ? 'Open setup help' : text}
      >
        <View style={styles.recordingSetupNoticeSignal}>
          <View style={styles.recordingSetupNoticeDot} />
        </View>
        <View style={styles.recordingSetupNoticeCopy}>
          <Text style={styles.recordingSetupNoticeTitle} numberOfLines={1}>
            {text}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function SessionHelpModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.helpModal}>
          <View style={styles.helpModalHeader}>
            <HeaderLogo size={26} />
            <Text style={styles.modalEyebrow}>Setup help</Text>
          </View>
          <View style={styles.helpIntro}>
            <Text style={styles.modalTitle}>Get the cleanest reading</Text>
            <Text style={styles.modalBody}>A few quick setup checks help Hale keep the skeleton steady.</Text>
          </View>
          <View style={styles.helpTipList}>
            {SETUP_HELP_TIPS.map((tip) => (
              <View key={tip} style={styles.helpTipRow}>
                <View style={styles.helpTipDot} />
                <Text style={styles.helpTip}>{tip}</Text>
              </View>
            ))}
          </View>
          <View style={styles.helpSafetyBlock}>
            <View style={styles.helpSafetyHeader}>
              <View style={styles.helpSafetyMark}>
                <View style={styles.helpSafetyMarkInner} />
              </View>
              <Text style={styles.helpSafetyLabel}>Safety</Text>
            </View>
            <Text style={styles.helpSafetyTitle}>Move with support nearby.</Text>
            {TRAINING_HELP_SAFETY_TIPS.map((tip) => (
              <View key={tip} style={styles.helpSafetyRow}>
                <View style={styles.helpSafetyRule} />
                <Text style={styles.helpSafetyText}>{tip}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close help"
          >
            <Text style={styles.modalKeepText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DiscardSessionModal({
  visible,
  onKeep,
  onDiscard,
}: {
  visible: boolean;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeep}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.discardModal}>
          <Text style={styles.modalEyebrow}>Discard session?</Text>
          <Text style={styles.modalTitle}>Leave without saving?</Text>
          <Text style={styles.modalBody}>
            This workout will stop and today's progress from this session will not be saved.
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
              onPress={onKeep}
              accessibilityRole="button"
              accessibilityLabel="Keep session"
            >
              <Text style={styles.modalKeepText}>Keep session</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalDiscardButton, pressed && styles.controlPressed]}
              onPress={onDiscard}
              accessibilityRole="button"
              accessibilityLabel="Discard session"
            >
              <Text style={styles.modalDiscardText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RecordingCardFooter({
  exerciseName,
  meta,
  display,
  style,
}: {
  exerciseName: string;
  meta: FooterMeta;
  display: StageDisplay | null;
  style: StyleProp<ViewStyle>;
}) {
  const displayValue = display ? (
    <Text
      style={styles.recordingFooterMetricValue}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.76}
    >
      {display.value}
    </Text>
  ) : null;
  const displayLabel = display ? (
    <Text style={styles.recordingFooterMetricLabel}>
      {display.label}
    </Text>
  ) : null;

  return (
    <View
      pointerEvents="none"
      style={[styles.recordingFooter, style]}
    >
      <View style={styles.recordingFooterMovement}>
        <Text style={styles.recordingFooterMovementMeta} numberOfLines={1}>
          {meta.exercise}
        </Text>
        <Text
          style={styles.recordingFooterMovementName}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {exerciseName}
        </Text>
        {meta.set ? (
          <Text style={styles.recordingFooterMovementSet} numberOfLines={1}>
            {meta.set}
          </Text>
        ) : null}
      </View>
      {display ? (
        <View style={styles.recordingFooterMetric}>
          <View style={styles.recordingFooterMetricDivider} />
          <View style={styles.recordingFooterMetricContent}>
            {displayValue}
            {displayLabel}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ControlButton({
  title,
  onPress,
  disabled,
  tone = 'normal',
  selected,
  primary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'normal' | 'danger';
  selected?: boolean;
  primary?: boolean;
}) {
  const isPrimary = primary || title === 'Pause' || title === 'Resume';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlButton,
        isPrimary && styles.controlPrimary,
        selected && styles.controlSelected,
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
      <Text
        style={[
          styles.controlText,
          isPrimary && styles.controlPrimaryText,
          disabled && styles.controlTextDisabled,
          tone === 'danger' && styles.controlDangerText,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
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
    a.setupIssue === b.setupIssue &&
    a.setupPrompt === b.setupPrompt &&
    sameList(a.safetyCueIds, b.safetyCueIds) &&
    sameList(a.safetyText, b.safetyText)
  );
}

function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let idx = 0; idx < a.length; idx++) {
    if (a[idx] !== b[idx]) return false;
  }
  return true;
}

function shouldConfirmDiscardTrainingSession(snapshot: Snapshot, cameraAvailability: CameraAvailability): boolean {
  if (cameraAvailability === 'unavailable') return false;
  if (snapshot.phase === 'set' || snapshot.phase === 'rest' || snapshot.phase === 'complete' || snapshot.phase === 'done') {
    return true;
  }
  return snapshot.itemIndex > 0 && snapshot.phase !== 'intro';
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

function recordingScreenTopPadding(): number {
  const statusBarHeight =
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 0
      : Platform.OS === 'ios'
        ? IOS_RECORDING_TOP_CLEARANCE
        : 0;
  return Math.max(spacing.lg, statusBarHeight + spacing.lg);
}

function trainingFooterMeta(snapshot: Snapshot, visibleItemNumber: number, totalItems: number): FooterMeta {
  return {
    exercise: `Exercise ${visibleItemNumber} of ${totalItems}`,
    set:
      snapshot.totalSets > 0
        ? `Set ${Math.min(snapshot.setIndex + 1, snapshot.totalSets)} of ${snapshot.totalSets}`
        : null,
  };
}

function trainingStageDisplay(
  snapshot: Snapshot,
  cameraAvailability: CameraAvailability
): StageDisplay | null {
  if (cameraAvailability === 'unavailable') {
    return null;
  }
  if (snapshot.phase === 'rest') {
    return {
      mode: 'metric',
      label: 'Rest',
      value: Number.isFinite(snapshot.restSec) ? `${snapshot.restSec}s` : '',
    };
  }
  if (snapshot.phase === 'set' && snapshot.kind === 'reps') {
    return { mode: 'metric', label: 'Reps', value: `${snapshot.repCount}` };
  }
  if (snapshot.phase === 'set' && (snapshot.kind === 'hold' || snapshot.kind === 'timer')) {
    return {
      mode: 'metric',
      label: snapshot.kind === 'timer' ? 'Time' : 'Hold',
      value: Number.isFinite(snapshot.holdSec) ? `${Math.floor(snapshot.holdSec)}s` : '-',
    };
  }
  return null;
}

function trainingSessionNotice(
  snapshot: Snapshot,
  paused: boolean,
  showHelp: boolean,
  cameraAvailability: CameraAvailability,
  forceSetupNotice: boolean
): TrainingSessionNotice | null {
  if (cameraAvailability === 'unavailable') {
    return null;
  }
  if (paused) {
    return { text: 'Paused', action: null };
  }
  if (showHelp) {
    return { text: 'Setup help', action: null };
  }
  if (snapshot.validTimeCaption) {
    return { text: snapshot.validTimeCaption, action: null };
  }
  if (snapshot.phase === 'complete' || snapshot.phase === 'done') {
    return { text: 'Saving session', action: null };
  }
  if (snapshot.phase === 'transition') {
    return { text: 'Next movement starting', action: null };
  }
  const setupText = trainingSetupNoticeText(snapshot);
  if (
    setupText &&
    (forceSetupNotice || snapshot.setupIssue || snapshot.phase === 'preflight' || snapshot.phase === 'instructions' || snapshot.phase === 'countdown')
  ) {
    return { text: setupText, action: 'help' };
  }
  if (snapshot.phase === 'preflight') {
    return { text: PHASE_CAPTION.preflight ?? 'Getting you framed', action: null };
  }
  if (snapshot.phase === 'instructions' || snapshot.phase === 'countdown') {
    return { text: PHASE_CAPTION[snapshot.phase] ?? 'Get ready', action: null };
  }
  if (snapshot.phase === 'set' && snapshot.kind === 'rom') {
    return { text: 'Measuring', action: null };
  }
  return null;
}

function trainingSetupNoticeText(snapshot: Snapshot): string | null {
  switch (snapshot.setupPrompt) {
    case 'step-into-frame':
      return 'Step into frame';
    case 'center-yourself':
      return 'Move to the center';
    case 'step-back':
      return 'Step back into frame';
    case 'step-closer':
      return 'Move a little closer';
    case 'hold-still':
      return 'Hold still for a moment';
    case 'turn-on-light':
      return 'More light needed';
    case 'ready':
      return null;
    case null:
    default:
      return snapshot.setupIssue ? 'Setup needs attention' : null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  layout: {
    flex: 1,
  },
  layoutContent: {
    minHeight: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  topBarBackButton: {
    width: 18,
    height: 36,
    marginBottom: 0,
    alignSelf: 'center',
  },
  topBarTitle: {
    ...type.pageTitle,
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
    color: colors.textPrimary,
  },
  avatarSlot: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarViewport: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  recordingCameraUnavailableNotice: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  recordingChrome: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordingLogo: {
    opacity: 0.92,
  },
  recordingSetupNoticeSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  recordingSetupNotice: {
    width: '100%',
    maxWidth: 228,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 0 18px rgba(17,20,18,0.055)',
  },
  recordingSetupNoticeSignal: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    backgroundColor: colors.bgGold,
  },
  recordingSetupNoticeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGold,
  },
  recordingSetupNoticeCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  recordingSetupNoticeTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  helpIconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  helpIconButtonSelected: {
    backgroundColor: 'transparent',
  },
  helpIconText: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
    fontSize: 24,
    lineHeight: 28,
  },
  helpIconTextSelected: {
    color: colors.accentDeep,
  },
  recordingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  recordingFooterMovement: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recordingFooterMovementName: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  recordingFooterMovementMeta: {
    ...type.bodySmall,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  recordingFooterMovementSet: {
    ...type.bodySmall,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  recordingFooterMetric: {
    width: 142,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  recordingFooterMetricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 66,
    backgroundColor: colors.borderHairline,
  },
  recordingFooterMetricContent: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
    gap: 0,
  },
  recordingFooterMetricLabel: {
    ...type.label,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  recordingFooterMetricValue: {
    ...type.cardTitle,
    fontSize: 42,
    lineHeight: 46,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  bottomPanel: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  controlStack: {
    gap: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controlButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  controlSelected: {
    backgroundColor: colors.bgGold,
    borderColor: colors.goldBorder,
  },
  controlDanger: { borderColor: colors.cautionBorder, backgroundColor: colors.cautionSoft },
  controlDisabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.76 },
  controlText: { ...type.cardRowTitle, color: colors.accentDeep, textAlign: 'center' },
  controlPrimaryText: { color: colors.onAccent },
  controlTextDisabled: { color: colors.textTertiary },
  controlDangerText: { color: colors.error },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(17,20,18,0.24)',
  },
  discardModal: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    boxShadow: '0 0 28px rgba(17,20,18,0.12)',
  },
  helpModal: {
    width: '100%',
    maxWidth: 380,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.modal,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 0 34px rgba(17,20,18,0.13)',
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  helpIntro: {
    gap: spacing.sm,
  },
  modalEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  modalTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  modalBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  modalActions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  helpTipList: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  helpTipRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  helpTipDot: {
    width: 6,
    height: 6,
    marginTop: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentDeep,
  },
  helpTip: {
    ...type.bodySmall,
    flex: 1,
    color: colors.textPrimary,
  },
  helpSafetyBlock: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    boxShadow: '0 1px 10px rgba(17,20,18,0.035)',
  },
  helpSafetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  helpSafetyMark: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  helpSafetyMarkInner: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGold,
  },
  helpSafetyLabel: {
    ...type.label,
    color: colors.accentDeep,
  },
  helpSafetyTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
  },
  helpSafetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  helpSafetyRule: {
    width: 2,
    alignSelf: 'stretch',
    minHeight: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.goldBorder,
  },
  helpSafetyText: {
    ...type.bodySmall,
    flex: 1,
    color: colors.textSecondary,
  },
  modalButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
  },
  modalKeepButton: {
    backgroundColor: colors.accent,
  },
  modalDiscardButton: {
    backgroundColor: colors.cautionSoft,
  },
  modalKeepText: {
    ...type.button,
    color: colors.onAccent,
  },
  modalDiscardText: {
    ...type.cardRowTitle,
    color: colors.error,
  },
});
