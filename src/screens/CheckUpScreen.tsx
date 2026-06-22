/**
 * Movement Check-Up screen — runs the whole voice-guided battery.
 *
 * Product laws on display: no camera video, audio-first operation, and a calm
 * skeleton-based measuring surface. The UI mirrors state for glanceability
 * while the orchestrator owns timing, pre-flight, scoring, and item advance.
 */

import * as React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { CheckUpOrchestrator, CheckUpPhase, DEFAULT_BATTERY, DEFAULT_CHECKUP_CONFIG } from '../checkup';
import { CheckUp } from '../checkup/types';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
} from '../components/SafePoseDetectionView';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { AssessmentPhase } from '../assessment/sessionController';
import { getMovement } from '../movements';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt } from '../preflight/preflight';
import {
  CHECKUP_SETUP_ISSUE_BODY,
  CHECKUP_SETUP_ISSUE_TITLE,
  SETUP_HELP_TIPS,
} from '../preflight/setupCopy';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
import { poseEstimationWindowSize, recordingCameraViewportSize } from './recordingViewport';

const UI_UPDATE_INTERVAL_MS = 100;
const TOTAL_ITEMS = DEFAULT_BATTERY.length;
const IOS_RECORDING_TOP_CLEARANCE = 44;

type ModalMode = 'help' | 'setupIssue' | null;

interface Snapshot {
  phase: CheckUpPhase;
  itemIndex: number;
  movementId: string | null;
  movementName: string | null;
  itemPhase: AssessmentPhase | null;
  repCount: number;
  remainingSec: number;
  setupIssue: boolean;
  setupPrompt: PreflightPrompt | null;
  setupCaption: string | null;
  totalItems: number;
}

interface FooterMeta {
  progress: string | null;
  context: string | null;
}

interface StageDisplay {
  mode: 'metric';
  label: string;
  value: string;
}

type CheckUpDebugScenario = 'metric';

type SessionNoticeAction = 'help' | 'setupIssue';

interface SessionNotice {
  text: string;
  action: SessionNoticeAction | null;
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
  setupPrompt: null,
  setupCaption: null,
  totalItems: TOTAL_ITEMS,
};

const METRIC_DEBUG_SNAPSHOT: Snapshot = {
  phase: 'item',
  itemIndex: 1,
  movementId: 'balance-ladder',
  movementName: 'Feet-Together Hold',
  itemPhase: 'active',
  repCount: 0,
  remainingSec: 18,
  setupIssue: false,
  setupPrompt: null,
  setupCaption: null,
  totalItems: TOTAL_ITEMS,
};

const CHECKUP_HELP_SAFETY_TIPS: readonly string[] = [
  'Keep a counter, wall, or sturdy chair within reach.',
  'Stop if a movement feels unsafe or uncomfortable.',
  'Move at a calm pace and listen for the voice cues.',
];

export function CheckUpScreen({
  onComplete,
  onCancel,
  voiceId,
  battery = DEFAULT_BATTERY,
  debugScenario,
}: {
  onComplete: (checkUp: CheckUp) => void;
  onCancel?: () => void;
  voiceId?: string;
  battery?: readonly string[];
  debugScenario?: CheckUpDebugScenario;
}) {
  const totalItems = battery.length;
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [orchestrator] = React.useState(
    () => new CheckUpOrchestrator(new Date().toISOString(), preflight, { ...DEFAULT_CHECKUP_CONFIG, battery })
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
  const [snapshot, setSnapshot] = React.useState<Snapshot>(() => ({ ...INITIAL, totalItems }));
  const [paused, setPaused] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<ModalMode>(null);
  const [discardModalVisible, setDiscardModalVisible] = React.useState(false);
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
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
      const sourceAspect = event.sourceWidth / event.sourceHeight;

      if (resumePendingRef.current) {
        orchestrator.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) {
        skeletonRef.current?.update(out, sourceAspect);
        return;
      }

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
          setupPrompt: u.setupPrompt,
          setupCaption: u.item ? u.item.setupCaption : null,
          totalItems: u.totalItems,
        };
        setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
      }
      skeletonRef.current?.update(out, sourceAspect);
    },
    [pipeline, orchestrator, voice, sfx, recorder, onComplete]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

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

  const openSupportModal = React.useCallback(
    (mode: Exclude<ModalMode, null>) => {
      setModalMode(mode);
    },
    []
  );

  const closeSupportModal = React.useCallback(() => {
    setModalMode(null);
  }, []);

  const tryAgain = React.useCallback(() => {
    voice.stop();
    orchestrator.retrySetup();
    setModalMode(null);
  }, [orchestrator, voice]);

  const skipCurrent = React.useCallback(
    () => {
      voice.stop();
      setModalMode(null);
      orchestrator.skipCurrentItem();
    },
    [orchestrator, voice]
  );

  const repeatInstructions = React.useCallback(() => {
    if (!snapshot.movementId) return;
    const cues = getMovement(snapshot.movementId).voice.instructions;
    if (cues.length > 0) voice.speak(cues, 8);
  }, [snapshot.movementId, voice]);

  const requestDiscardCheckup = React.useCallback(() => {
    if (!onCancel) return;
    discardWasPausedRef.current = pausedRef.current;
    if (!pausedRef.current) {
      pause();
    } else {
      voice.stop();
    }
    setDiscardModalVisible(true);
  }, [onCancel, pause, voice]);

  const keepCheckup = React.useCallback(() => {
    setDiscardModalVisible(false);
    if (!discardWasPausedRef.current) {
      resume();
    }
  }, [resume]);

  const discardCheckup = React.useCallback(() => {
    setDiscardModalVisible(false);
    voice.stop();
    onCancel?.();
  }, [onCancel, voice]);

  const metricDebug = debugScenario === 'metric';
  const visibleSnapshot = metricDebug ? { ...METRIC_DEBUG_SNAPSHOT, totalItems } : snapshot;
  const visiblePaused = paused;
  const visibleModalMode = modalMode;
  const visibleCameraAvailability: CameraAvailability = metricDebug ? 'available' : cameraAvailability;
  const recordingTopPadding = recordingScreenTopPadding();
  const sessionNotice = checkupSessionNotice(visibleSnapshot, visiblePaused, visibleCameraAvailability);
  const sessionNoticeAction = sessionNotice?.action ?? null;
  const currentMovementName =
    visibleSnapshot.phase === 'complete' || visibleSnapshot.phase === 'done'
      ? 'Movement Check-Up'
      : visibleSnapshot.movementName ?? 'Movement Check-Up';
  const visibleItemNumber = totalItems > 0 ? Math.min(visibleSnapshot.itemIndex + 1, totalItems) : 0;
  const footerMeta = checkupFooterMeta(visibleSnapshot, visibleItemNumber, totalItems);
  const stageDisplay = checkupStageDisplay(visibleSnapshot, visiblePaused, visibleModalMode, visibleCameraAvailability);
  const avatarMeasurementState = checkupAvatarState(visibleSnapshot);
  const avatarDomain = domainForCheckupMovement(visibleSnapshot.movementId);
  const canControl =
    visibleCameraAvailability !== 'unavailable' && visibleSnapshot.phase !== 'complete' && visibleSnapshot.phase !== 'done';
  const canRepeat = visibleSnapshot.movementId !== null;
  const canSkip = visibleSnapshot.phase === 'item' && visibleSnapshot.movementId !== null;
  const showRepeatControl = visiblePaused && canRepeat;
  const showSkipControl = canSkip && (visiblePaused || visibleSnapshot.setupIssue);
  const showUnavailableAction = visibleCameraAvailability === 'unavailable' && !!onCancel;
  const viewportWidth = Math.max(1, Math.min(windowSize.width - spacing.md * 2, spacing.pageMaxWidth));
  const cameraViewport = React.useMemo(
    () => recordingCameraViewportSize(viewportWidth, windowSize.height, visibleSnapshot.setupIssue || visibleModalMode !== null),
    [visibleModalMode, visibleSnapshot.setupIssue, viewportWidth, windowSize.height]
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

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active={!metricDebug}
        modelVariant="lite"
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={metricDebug ? undefined : setCameraAvailability}
      />
      <ScrollView
        style={styles.layout}
        contentContainerStyle={[styles.layoutContent, { paddingTop: recordingTopPadding }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topBar}>
          {onCancel ? (
            <BackArrowButton
              accessibilityLabel="Discard Movement Check-Up"
              onPress={requestDiscardCheckup}
              style={styles.topBarBackButton}
            />
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            Movement Check-Up
          </Text>
        </View>

        <View style={styles.avatarSlot}>
          <View style={[styles.avatarViewport, cameraViewport]}>
            <View pointerEvents="box-none" style={styles.recordingChrome}>
              <HeaderLogo size={34} style={styles.recordingLogo} />
              <RecordingSetupNotice
                visible={sessionNotice !== null}
                text={sessionNotice?.text ?? ''}
                onPress={
                  sessionNoticeAction
                    ? () => openSupportModal(sessionNoticeAction)
                    : undefined
                }
              />
              <Pressable
                style={({ pressed }) => [
                  styles.helpIconButton,
                  modalMode !== null && styles.helpIconButtonSelected,
                  pressed && styles.controlPressed,
                ]}
                onPress={() => openSupportModal(snapshot.setupIssue ? 'setupIssue' : 'help')}
                accessibilityRole="button"
                accessibilityLabel="Open help"
                accessibilityState={{ selected: modalMode !== null }}
              >
                <Text style={[styles.helpIconText, modalMode !== null && styles.helpIconTextSelected]}>?</Text>
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
                measurementState={avatarMeasurementState}
                activeDomain={avatarDomain}
                setupGuidesEnabled={false}
                stateTransitionsEnabled={false}
              />
            )}
            <CheckupCardFooter
              title={currentMovementName}
              meta={footerMeta}
              display={stageDisplay}
              style={recordingFooterFrame}
            />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          {showUnavailableAction ? (
            <View style={styles.controls}>
              <ControlButton title="Back to Today" onPress={() => onCancel?.()} primary />
            </View>
          ) : canControl ? (
            <View style={styles.controls}>
              <ControlButton title={paused ? 'Resume' : 'Pause'} onPress={paused ? resume : pause} />
              {showRepeatControl ? <ControlButton title="Repeat" onPress={repeatInstructions} /> : null}
              {showSkipControl ? (
                <ControlButton title="Skip for now" onPress={skipCurrent} />
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <CheckupSupportModal
        visible={modalMode !== null}
        mode={modalMode ?? 'help'}
        onClose={closeSupportModal}
        onTryAgain={tryAgain}
        onSkip={skipCurrent}
      />
      <DiscardCheckupModal
        visible={discardModalVisible}
        onKeep={keepCheckup}
        onDiscard={discardCheckup}
      />
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

function CheckupSupportModal({
  visible,
  mode,
  onClose,
  onTryAgain,
  onSkip,
}: {
  visible: boolean;
  mode: Exclude<ModalMode, null>;
  onClose: () => void;
  onTryAgain: () => void;
  onSkip: () => void;
}) {
  const [expanded, setExpanded] = React.useState(mode === 'help');
  const isSetupIssue = mode === 'setupIssue';

  React.useEffect(() => {
    if (visible) {
      setExpanded(mode === 'help');
    }
  }, [mode, visible]);

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
            <Text style={styles.modalEyebrow}>{isSetupIssue ? 'Setup issue' : 'Setup help'}</Text>
          </View>
          <View style={styles.helpIntro}>
            <Text style={styles.modalTitle}>
              {isSetupIssue ? CHECKUP_SETUP_ISSUE_TITLE : 'Get the cleanest reading'}
            </Text>
            <Text style={styles.modalBody}>
              {isSetupIssue
                ? CHECKUP_SETUP_ISSUE_BODY
                : 'A few quick setup checks help Hale keep the skeleton steady during your check-up.'}
            </Text>
          </View>

          {expanded ? (
            <>
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
                {CHECKUP_HELP_SAFETY_TIPS.map((tip) => (
                  <View key={tip} style={styles.helpSafetyRow}>
                    <View style={styles.helpSafetyRule} />
                    <Text style={styles.helpSafetyText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.modalActions}>
            {isSetupIssue ? (
              <>
                <Pressable
                  style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
                  onPress={onTryAgain}
                  accessibilityRole="button"
                  accessibilityLabel="Try setup again"
                >
                  <Text style={styles.modalKeepText}>Try again</Text>
                </Pressable>
                {!expanded ? (
                  <Pressable
                    style={({ pressed }) => [styles.modalButton, styles.modalSecondaryButton, pressed && styles.controlPressed]}
                    onPress={() => setExpanded(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Show setup tips"
                  >
                    <Text style={styles.modalSecondaryText}>Setup tips</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.modalButton, styles.modalSecondaryButton, pressed && styles.controlPressed]}
                  onPress={onSkip}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this check-up test for now"
                >
                  <Text style={styles.modalSecondaryText}>Skip for now</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close help"
              >
                <Text style={styles.modalKeepText}>Close</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DiscardCheckupModal({
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
          <Text style={styles.modalEyebrow}>Discard check-up?</Text>
          <Text style={styles.modalTitle}>Leave without saving?</Text>
          <Text style={styles.modalBody}>
            This Movement Check-Up will stop and any unfinished results from this check-up will not be saved.
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
              onPress={onKeep}
              accessibilityRole="button"
              accessibilityLabel="Keep Movement Check-Up"
            >
              <Text style={styles.modalKeepText}>Keep check-up</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalDiscardButton, pressed && styles.controlPressed]}
              onPress={onDiscard}
              accessibilityRole="button"
              accessibilityLabel="Discard Movement Check-Up"
            >
              <Text style={styles.modalDiscardText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CheckupCardFooter({
  title,
  meta,
  display,
  style,
}: {
  title: string;
  meta: FooterMeta;
  display: StageDisplay | null;
  style: StyleProp<ViewStyle>;
}) {
  const compactMeta = meta.progress !== null && meta.context !== null;
  const metaLine = compactMeta ? `${meta.progress} · ${meta.context}` : meta.progress;
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
    <View pointerEvents="none" style={[styles.recordingFooter, style]}>
      <View style={styles.recordingFooterMovement}>
        <Text
          style={styles.recordingFooterMovementName}
          numberOfLines={meta.progress ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {title}
        </Text>
        {metaLine ? (
          <Text style={styles.recordingFooterMovementMeta} numberOfLines={1}>
            {metaLine}
          </Text>
        ) : null}
        {meta.context && !compactMeta ? (
          <Text style={styles.recordingFooterMovementSet} numberOfLines={1}>
            {meta.context}
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
  primary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'normal' | 'danger';
  primary?: boolean;
}) {
  const isPrimary = primary || title === 'Pause' || title === 'Resume';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlButton,
        isPrimary && styles.controlPrimary,
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
    a.movementId === b.movementId &&
    a.movementName === b.movementName &&
    a.itemPhase === b.itemPhase &&
    a.repCount === b.repCount &&
    a.remainingSec === b.remainingSec &&
    a.setupIssue === b.setupIssue &&
    a.setupPrompt === b.setupPrompt &&
    a.setupCaption === b.setupCaption &&
    a.totalItems === b.totalItems
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

function recordingScreenTopPadding(): number {
  const statusBarHeight =
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 0
      : Platform.OS === 'ios'
        ? IOS_RECORDING_TOP_CLEARANCE
        : 0;
  return Math.max(spacing.lg, statusBarHeight + spacing.lg);
}

function checkupFooterMeta(snapshot: Snapshot, visibleItemNumber: number, totalItems: number): FooterMeta {
  if (snapshot.phase === 'intro') {
    return {
      progress: null,
      context: `${totalItems} guided ${totalItems === 1 ? 'test' : 'tests'}`,
    };
  }
  if (snapshot.phase === 'complete' || snapshot.phase === 'done') {
    return {
      progress: null,
      context: `${totalItems} tests complete`,
    };
  }
  return {
    progress: `Test ${visibleItemNumber} of ${totalItems}`,
    context: checkupDomainLabel(snapshot.movementId),
  };
}

function checkupDomainLabel(movementId: string | null): string | null {
  switch (domainForCheckupMovement(movementId)) {
    case 'strength_power':
      return 'Strength & power';
    case 'balance':
      return 'Balance';
    case 'mobility':
      return 'Mobility';
    default:
      return null;
  }
}

function checkupStageDisplay(
  snapshot: Snapshot,
  _paused: boolean,
  _modalMode: ModalMode,
  cameraAvailability: CameraAvailability
): StageDisplay | null {
  if (cameraAvailability === 'unavailable') {
    return null;
  }
  if (snapshot.itemPhase === 'active' && snapshot.movementId === 'chair-stand-30s') {
    return { mode: 'metric', label: 'Reps', value: `${snapshot.repCount}` };
  }
  if (snapshot.itemPhase === 'active' && Number.isFinite(snapshot.remainingSec)) {
    return { mode: 'metric', label: 'Time', value: `${snapshot.remainingSec}s` };
  }
  return null;
}

function checkupSessionNotice(
  snapshot: Snapshot,
  paused: boolean,
  cameraAvailability: CameraAvailability
): SessionNotice | null {
  if (cameraAvailability === 'unavailable') {
    return null;
  }
  if (paused) {
    return { text: 'Paused', action: null };
  }
  if (snapshot.setupIssue) {
    return { text: 'Setup needs attention', action: 'setupIssue' };
  }
  if (snapshot.setupCaption) {
    return { text: compactSetupCaption(snapshot.setupCaption), action: 'help' };
  }
  if (snapshot.itemPhase === 'result' || snapshot.itemPhase === 'done') {
    return { text: 'Saved', action: null };
  }
  if (snapshot.phase === 'transition') {
    return { text: 'Next test starting', action: null };
  }
  switch (snapshot.setupPrompt) {
    case 'step-into-frame':
      return { text: 'Step into frame', action: 'help' };
    case 'center-yourself':
      return { text: 'Move to the center', action: 'help' };
    case 'step-back':
      return { text: 'Step back into frame', action: 'help' };
    case 'step-closer':
      return { text: 'Move a little closer', action: 'help' };
    case 'hold-still':
      return { text: 'Hold still for a moment', action: 'help' };
    case 'turn-on-light':
      return { text: 'More light needed', action: 'help' };
    case 'ready':
    case null:
    default:
      return null;
  }
}

function compactSetupCaption(caption: string): string {
  switch (caption) {
    case 'Turn so your side faces the camera.':
      return 'Turn side-on';
    case 'Turn to face the camera.':
      return 'Face the camera';
    case 'Turn a little more to face the camera.':
      return 'Face the camera';
    case 'Turn a little more so your side faces the camera.':
      return 'Turn side-on';
    case 'Hold that position for a moment.':
    case 'Hold still while we calibrate your body scale.':
      return 'Hold still for a moment';
    case 'Make sure your whole body is visible.':
      return 'Show your full body';
    default:
      return caption;
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
  modalButton: {
    minHeight: 56,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalKeepButton: {
    backgroundColor: colors.accent,
  },
  modalSecondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDiscardButton: {
    backgroundColor: colors.cautionSoft,
    borderWidth: 1,
    borderColor: colors.cautionBorder,
  },
  modalKeepText: {
    ...type.button,
    color: colors.onAccent,
  },
  modalSecondaryText: {
    ...type.button,
    color: colors.accentDeep,
  },
  modalDiscardText: {
    ...type.button,
    color: colors.error,
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
    ...type.caption,
    flex: 1,
    color: colors.textPrimary,
  },
});
