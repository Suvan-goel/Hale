/**
 * Weekly micro-check screen — a ~60-second single-item check. Same product laws
 * and hot-path discipline as the other camera screens (no video, audio-first,
 * pipeline + skeleton + runner per frame, 10fps HUD, imperative audio).
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
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
} from '../components/SafePoseDetectionView';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { PoseLatencyDiagnosticsOverlay } from '../diagnostics/PoseLatencyDiagnosticsOverlay';
import {
  createPoseLatencyDiagnostics,
  isPoseLatencyDiagnosticsEnabled,
} from '../diagnostics/poseLatencyDiagnostics';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
import { MicroCheckPhase, MicroCheckResult, MicroCheckRunner, MicroCheckType } from '../training/microCheck';
import { poseEstimationWindowSize, recordingCameraViewportSize } from './recordingViewport';

const UI_UPDATE_INTERVAL_MS = 100;
const IOS_RECORDING_TOP_CLEARANCE = 44;

const TITLE: Record<MicroCheckType, string> = {
  'chair-power': 'Quick Power Check',
  'single-leg-balance': 'Quick Balance Check',
  'mobility-reach': 'Quick Mobility Check',
};

const MOVEMENT_NAME: Record<MicroCheckType, string> = {
  'chair-power': 'Chair Power',
  'single-leg-balance': 'Single-Leg Balance',
  'mobility-reach': 'Mobility Reach',
};

const DOMAIN_LABEL: Record<MicroCheckType, string> = {
  'chair-power': 'Power',
  'single-leg-balance': 'Balance',
  'mobility-reach': 'Mobility',
};

const PHASE_CAPTION: Partial<Record<MicroCheckPhase, string>> = {
  preflight: 'Getting you framed...',
  instructions: 'Listen for your instructions',
  countdown: 'Get ready...',
};

interface Snapshot {
  phase: MicroCheckPhase;
  repCount: number;
  holdSec: number;
  remainingSec: number;
  measuring: boolean;
  setupPrompt: PreflightPrompt | null;
}

interface FooterMeta {
  progress: string;
  context: string;
}

interface StageDisplay {
  mode: 'metric';
  label: string;
  value: string;
}

type MicroCheckNoticeAction = 'help';

interface MicroCheckNotice {
  text: string;
  action: MicroCheckNoticeAction | null;
}

type MicroCheckDebugScenario = 'metric';

const INITIAL: Snapshot = {
  phase: 'preflight',
  repCount: 0,
  holdSec: NaN,
  remainingSec: NaN,
  measuring: false,
  setupPrompt: null,
};

const MICRO_CHECK_SETUP_HELP_STEPS: readonly { title: string; body: string }[] = [
  {
    title: 'Step back',
    body: 'Make sure your whole body is in view.',
  },
  {
    title: 'Keep the phone still',
    body: 'Place it on a steady stand or shelf.',
  },
  {
    title: 'Use good light',
    body: 'Turn on the main light if the room is dim.',
  },
];

export function MicroCheckScreen({
  type: microCheckType,
  onComplete,
  onCancel,
  voiceId,
  debugScenario,
}: {
  type: MicroCheckType;
  onComplete: (result: MicroCheckResult) => void;
  onCancel?: () => void;
  voiceId?: string;
  debugScenario?: MicroCheckDebugScenario;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [runner] = React.useState(() => new MicroCheckRunner(microCheckType, new Date().toISOString(), preflight));
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
  const [snapshot, setSnapshot] = React.useState<Snapshot>(INITIAL);
  const [paused, setPaused] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [discardModalVisible, setDiscardModalVisible] = React.useState(false);
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const windowSize = useWindowDimensions();
  const poseLatencyDiagnostics = React.useMemo(
    () =>
      isPoseLatencyDiagnosticsEnabled()
        ? createPoseLatencyDiagnostics({ mode: 'micro-check' })
        : null,
    []
  );

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
      const latencyFrame = poseLatencyDiagnostics?.beginFrame(event) ?? null;
      lastFrameTimestampRef.current = event.timestampMs;
      if (__DEV__) recorder.record(event);
      const out = pipeline.process(event);
      poseLatencyDiagnostics?.markJsTransformEnd(latencyFrame);
      const sourceAspect = event.sourceWidth / event.sourceHeight;

      if (resumePendingRef.current) {
        runner.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) {
        skeletonRef.current?.update(out, sourceAspect);
        poseLatencyDiagnostics?.markRendererUpdateSubmitted(latencyFrame);
        return;
      }

      const u = runner.update(out, voice.busy);

      if (u.voice) voice.speak(u.voice.cues, u.voice.priority);
      if (u.playRepSound) sfx.play('rep-credit');

      if (u.phase === 'done' && !completedRef.current) {
        completedRef.current = true;
        const result = runner.result;
        if (result) onComplete(result);
        return;
      }

      if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = event.timestampMs;
        const next: Snapshot = {
          phase: u.phase,
          repCount: u.repCount,
          holdSec: u.holdSec,
          remainingSec: Number.isFinite(u.remainingMs) ? Math.ceil(u.remainingMs / 1000) : NaN,
          measuring: u.measuring,
          setupPrompt: u.setupPrompt,
        };
        setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
      }
      skeletonRef.current?.update(out, sourceAspect);
      poseLatencyDiagnostics?.markRendererUpdateSubmitted(latencyFrame);
    },
    [pipeline, poseLatencyDiagnostics, runner, voice, sfx, recorder, onComplete]
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

  const requestDiscardMicroCheck = React.useCallback(() => {
    if (!onCancel) return;
    if (!shouldConfirmDiscardMicroCheck(snapshot, cameraAvailability)) {
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

  const keepMicroCheck = React.useCallback(() => {
    setDiscardModalVisible(false);
    if (!discardWasPausedRef.current) {
      resume();
    }
  }, [resume]);

  const discardMicroCheck = React.useCallback(() => {
    setDiscardModalVisible(false);
    voice.stop();
    onCancel?.();
  }, [onCancel, voice]);

  const metricDebug = debugScenario === 'metric';
  const visibleSnapshot = metricDebug ? metricDebugSnapshot(microCheckType) : snapshot;
  const visiblePaused = metricDebug ? false : paused;
  const visibleShowHelp = metricDebug ? false : showHelp;
  const visibleCameraAvailability: CameraAvailability = metricDebug ? 'available' : cameraAvailability;
  const recordingTopPadding = recordingScreenTopPadding();
  const sessionNotice = microCheckSessionNotice(
    microCheckType,
    visibleSnapshot,
    visiblePaused,
    visibleShowHelp,
    visibleCameraAvailability
  );
  const sessionNoticeAction = sessionNotice?.action ?? null;
  const footerMeta = microCheckFooterMeta(microCheckType);
  const stageDisplay = microCheckStageDisplay(microCheckType, visibleSnapshot, visibleCameraAvailability);
  const avatarMeasurementState = microCheckAvatarState(visibleSnapshot.phase);
  const avatarDomain = domainForMicroCheck(microCheckType);
  const canControl =
    visibleCameraAvailability !== 'unavailable' && visibleSnapshot.phase !== 'done';
  const showUnavailableAction = visibleCameraAvailability === 'unavailable' && !!onCancel;
  const viewportWidth = Math.max(1, Math.min(windowSize.width - spacing.md * 2, spacing.pageMaxWidth));
  const cameraViewport = React.useMemo(
    () => recordingCameraViewportSize(viewportWidth, windowSize.height, visibleShowHelp),
    [viewportWidth, windowSize.height, visibleShowHelp]
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
        latencyDiagnosticsEnabled={poseLatencyDiagnostics !== null}
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
              accessibilityLabel="Leave micro-check"
              onPress={requestDiscardMicroCheck}
              style={styles.topBarBackButton}
            />
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            {TITLE[microCheckType]}
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
                measurementState={avatarMeasurementState}
                activeDomain={avatarDomain}
                setupGuidesEnabled={false}
                stateTransitionsEnabled={false}
              />
            )}
            <MicroCheckCardFooter
              movementName={MOVEMENT_NAME[microCheckType]}
              meta={footerMeta}
              display={stageDisplay}
              style={recordingFooterFrame}
            />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          {showUnavailableAction ? (
            <View style={styles.controls}>
              <ControlButton title="Close micro-check" onPress={() => onCancel?.()} primary />
            </View>
          ) : canControl ? (
            <View style={styles.controls}>
              <ControlButton title={visiblePaused ? 'Resume' : 'Pause'} onPress={visiblePaused ? resume : pause} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <MicroCheckHelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <DiscardMicroCheckModal
        visible={discardModalVisible}
        onKeep={keepMicroCheck}
        onDiscard={discardMicroCheck}
      />
      <PoseLatencyDiagnosticsOverlay diagnostics={poseLatencyDiagnostics} />
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

function MicroCheckCardFooter({
  movementName,
  meta,
  display,
  style,
}: {
  movementName: string;
  meta: FooterMeta;
  display: StageDisplay | null;
  style: StyleProp<ViewStyle>;
}) {
  const metaLine = `${meta.progress} · ${meta.context}`;
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
    <Text style={styles.recordingFooterMetricLabel}>{display.label}</Text>
  ) : null;

  return (
    <View pointerEvents="none" style={[styles.recordingFooter, style]}>
      <View style={styles.recordingFooterMovement}>
        <Text
          style={styles.recordingFooterMovementName}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {movementName}
        </Text>
        <Text style={styles.recordingFooterMovementMeta} numberOfLines={1}>
          {metaLine}
        </Text>
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
  primary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const isPrimary = primary || title === 'Pause' || title === 'Resume';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlButton,
        isPrimary && styles.controlPrimary,
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
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function MicroCheckHelpModal({
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
            <Text style={styles.modalTitle}>Help Hale see you clearly</Text>
            <Text style={styles.modalBody}>Use these quick checks before you start.</Text>
          </View>
          <View style={styles.helpStepList}>
            {MICRO_CHECK_SETUP_HELP_STEPS.map((step, index) => (
              <View key={step.title} style={styles.helpStepRow}>
                <Text style={styles.helpStepNumber}>{index + 1}</Text>
                <View style={styles.helpStepCopy}>
                  <Text style={styles.helpStepTitle}>{step.title}</Text>
                  <Text style={styles.helpStepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.helpSafetyLine}>
            <Text style={styles.helpSafetyLineText}>
              <Text style={styles.helpSafetyLineStrong}>Keep support nearby. </Text>
              Stop if you feel dizzy, sharp pain, or unsteady.
            </Text>
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

function DiscardMicroCheckModal({
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
          <Text style={styles.modalEyebrow}>Leave micro-check?</Text>
          <Text style={styles.modalTitle}>Leave without saving?</Text>
          <Text style={styles.modalBody}>
            This micro-check will stop and the result will not be saved.
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
              onPress={onKeep}
              accessibilityRole="button"
              accessibilityLabel="Keep micro-check"
            >
              <Text style={styles.modalKeepText}>Keep micro-check</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalDiscardButton, pressed && styles.controlPressed]}
              onPress={onDiscard}
              accessibilityRole="button"
              accessibilityLabel="Leave micro-check without saving"
            >
              <Text style={styles.modalDiscardText}>Leave without saving</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.phase === b.phase &&
    a.repCount === b.repCount &&
    a.holdSec === b.holdSec &&
    a.remainingSec === b.remainingSec &&
    a.measuring === b.measuring &&
    a.setupPrompt === b.setupPrompt
  );
}

function shouldConfirmDiscardMicroCheck(snapshot: Snapshot, cameraAvailability: CameraAvailability): boolean {
  if (cameraAvailability === 'unavailable') return false;
  return snapshot.phase === 'active' || snapshot.phase === 'done';
}

function microCheckAvatarState(phase: MicroCheckPhase): PoseAvatarMeasurementState {
  switch (phase) {
    case 'preflight':
      return 'framing';
    case 'instructions':
    case 'countdown':
      return 'ready';
    case 'active':
      return 'micro_check';
    case 'done':
      return 'success';
  }
}

function domainForMicroCheck(microCheckType: MicroCheckType): PoseAvatarActiveDomain {
  if (microCheckType === 'chair-power') return 'strength_power';
  if (microCheckType === 'single-leg-balance') return 'balance';
  return 'mobility';
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

function metricDebugSnapshot(microCheckType: MicroCheckType): Snapshot {
  if (microCheckType === 'chair-power') {
    return { ...INITIAL, phase: 'active', repCount: 3, remainingSec: 31, measuring: true };
  }
  if (microCheckType === 'single-leg-balance') {
    return { ...INITIAL, phase: 'active', holdSec: 18, remainingSec: 27, measuring: true };
  }
  return { ...INITIAL, phase: 'active', remainingSec: 24, measuring: true };
}

function microCheckFooterMeta(microCheckType: MicroCheckType): FooterMeta {
  return {
    progress: 'Micro-check',
    context: DOMAIN_LABEL[microCheckType],
  };
}

function microCheckStageDisplay(
  microCheckType: MicroCheckType,
  snapshot: Snapshot,
  cameraAvailability: CameraAvailability
): StageDisplay | null {
  if (cameraAvailability === 'unavailable' || snapshot.phase !== 'active') return null;
  if (microCheckType === 'chair-power') {
    return { mode: 'metric', label: 'Reps', value: `${snapshot.repCount}` };
  }
  if (microCheckType === 'single-leg-balance') {
    return {
      mode: 'metric',
      label: 'Hold',
      value: Number.isFinite(snapshot.holdSec) ? `${Math.floor(snapshot.holdSec)}s` : '-',
    };
  }
  return {
    mode: 'metric',
    label: 'Time',
    value: Number.isFinite(snapshot.remainingSec) ? `${snapshot.remainingSec}s` : '-',
  };
}

function microCheckSessionNotice(
  microCheckType: MicroCheckType,
  snapshot: Snapshot,
  paused: boolean,
  showHelp: boolean,
  cameraAvailability: CameraAvailability
): MicroCheckNotice | null {
  if (cameraAvailability === 'unavailable') return null;
  if (paused) return { text: 'Paused', action: null };
  if (showHelp) return { text: 'Setup help', action: null };
  if (snapshot.phase === 'done') return { text: 'Logged', action: null };
  const setupText = microCheckSetupNoticeText(snapshot.setupPrompt);
  if (setupText) return { text: setupText, action: 'help' };
  if (snapshot.phase === 'preflight') return { text: PHASE_CAPTION.preflight ?? 'Getting you framed', action: null };
  if (snapshot.phase === 'instructions' || snapshot.phase === 'countdown') {
    return { text: PHASE_CAPTION[snapshot.phase] ?? 'Get ready', action: null };
  }
  if (snapshot.phase === 'active' && microCheckType === 'mobility-reach') {
    return { text: 'Reach comfortably and return tall', action: null };
  }
  return null;
}

function microCheckSetupNoticeText(prompt: PreflightPrompt | null): string | null {
  switch (prompt) {
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
    case null:
    default:
      return null;
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
    alignItems: 'center',
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
  controlDisabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.76 },
  controlText: { ...type.cardRowTitle, color: colors.accentDeep, textAlign: 'center' },
  controlPrimaryText: { color: colors.onAccent },
  controlTextDisabled: { color: colors.textTertiary },
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
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  helpModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  helpIntro: {
    gap: spacing.xs,
  },
  modalEyebrow: { ...type.label, color: colors.accentDeep },
  modalTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  modalBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  helpStepList: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  helpStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  helpStepNumber: {
    ...type.cardCaption,
    width: 26,
    height: 26,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  helpStepCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  helpStepTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
  },
  helpStepBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  helpSafetyLine: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  helpSafetyLineText: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  helpSafetyLineStrong: {
    fontFamily: type.cardRowTitle.fontFamily,
    color: colors.textPrimary,
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalKeepButton: { backgroundColor: colors.accent },
  modalDiscardButton: {
    backgroundColor: colors.cautionSoft,
    borderWidth: 1,
    borderColor: colors.cautionBorder,
  },
  modalKeepText: { ...type.cardRowTitle, color: colors.onAccent },
  modalDiscardText: { ...type.cardRowTitle, color: colors.error },
});
