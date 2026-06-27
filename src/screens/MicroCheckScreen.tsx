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

import { VoiceCueKey, voicePriority } from '../audio/cues';
import {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel, type VoiceCueStartedEvent } from '../audio/voicePlayer';
import type { BodySide, MeasurementSideSource } from '../checkup';
import type { VoiceExperienceMode } from '../config/voiceExperienceTypes';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { useSystemInsets } from '../components/SystemInsetsProvider';
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
import { ANDROID_VIDEO_ROT_640_POSE_PROFILE } from '../pose/nativePoseProfiles';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt } from '../preflight/preflight';
import { shouldSpeakFramingPrompt } from '../preflight/promptTiming';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { MicroCheckPhase, MicroCheckResult, MicroCheckRunner, MicroCheckType } from '../training/microCheck';
import {
  MicroCheckCameraSideResolver,
  createMicroCheckMeasurementContextForSide,
  deriveMicroCheckSideSetup,
  oppositeMicroCheckSide,
  type MicroCheckSideSetup,
} from '../training/microCheckSideSetup';
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

const MICRO_CHECK_V21_COUNTDOWN_SUFFIX = ['countdown-three', 'countdown-two', 'countdown-one', 'go'] as const;

function shouldSpeakMicroCheckVoiceCountdownTracked(
  voiceExperienceMode: VoiceExperienceMode,
  cues: readonly string[]
): boolean {
  if (voiceExperienceMode !== 'v21_beta') return false;
  if (cues.length < MICRO_CHECK_V21_COUNTDOWN_SUFFIX.length) return false;
  const suffix = cues.slice(cues.length - MICRO_CHECK_V21_COUNTDOWN_SUFFIX.length);
  return suffix.every((cue, index) => cue === MICRO_CHECK_V21_COUNTDOWN_SUFFIX[index]);
}

export function MicroCheckScreen({
  type: microCheckType,
  sideSetup,
  onComplete,
  onCancel,
  voiceId,
  voiceExperienceMode = 'legacy',
  handsFreeMode = true,
  debugScenario,
}: {
  type: MicroCheckType;
  sideSetup?: MicroCheckSideSetup | null;
  onComplete: (result: MicroCheckResult) => void;
  onCancel?: () => void;
  voiceId?: string;
  voiceExperienceMode?: VoiceExperienceMode;
  handsFreeMode?: boolean;
  debugScenario?: MicroCheckDebugScenario;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [sideResolver] = React.useState(() => new MicroCheckCameraSideResolver());
  const [startedAtIso] = React.useState(() => new Date().toISOString());
  const effectiveSideSetup = React.useMemo(
    () =>
      sideSetup ??
      deriveMicroCheckSideSetup({
        microCheckType,
        history: [],
        officialCheckUps: [],
      }),
    [microCheckType, sideSetup]
  );
  const [runner, setRunner] = React.useState<MicroCheckRunner | null>(() =>
    effectiveSideSetup.sideRequired
      ? null
      : new MicroCheckRunner(microCheckType, startedAtIso, preflight, undefined, null, {
          voiceMode: voiceExperienceMode === 'v21_beta' ? 'v21_beta' : 'legacy',
        })
  );
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const lastFrameTimestampRef = React.useRef(0);
  const sideSelectionPinnedRef = React.useRef(false);
  const setupLastPromptCueRef = React.useRef<VoiceCueKey | null>(null);
  const setupLastPromptAtMsRef = React.useRef(-Infinity);
  const pauseStartedAtRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const resumePendingRef = React.useRef(false);
  const completedRef = React.useRef(false);
  const discardWasPausedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>(INITIAL);
  const [paused, setPaused] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [discardModalVisible, setDiscardModalVisible] = React.useState(false);
  const [handsFreeSetupNotice, setHandsFreeSetupNotice] = React.useState<string | null>(null);
  const [manualSideFallbackAvailable, setManualSideFallbackAvailable] = React.useState(false);
  const [manualSideFallbackVisible, setManualSideFallbackVisible] = React.useState(false);
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const windowSize = useWindowDimensions();
  const responsive = useResponsiveLayout();
  const systemInsets = useSystemInsets();
  const poseLatencyDiagnostics = React.useMemo(
    () =>
      isPoseLatencyDiagnosticsEnabled()
        ? createPoseLatencyDiagnostics({ mode: 'micro-check' })
        : null,
    []
  );
  const metricDebug = debugScenario === 'metric';

  const pinMicroCheckSide = React.useCallback(
    (
      selectedSide: BodySide,
      options: {
        observedSide?: BodySide | null;
        source?: MeasurementSideSource | null;
        userConfirmed?: boolean;
      } = {}
    ) => {
      if (runner || sideSelectionPinnedRef.current) return;
      sideSelectionPinnedRef.current = true;
      setHandsFreeSetupNotice(null);
      setManualSideFallbackAvailable(false);
      const measurementContext = createMicroCheckMeasurementContextForSide({
        microCheckType,
        startedAt: startedAtIso,
        setup: effectiveSideSetup,
        selectedSide,
        observedSide: options.observedSide ?? selectedSide,
        source: options.source ?? undefined,
        userConfirmed: options.userConfirmed ?? true,
      });
      setRunner(
        new MicroCheckRunner(microCheckType, startedAtIso, preflight, undefined, measurementContext, {
          voiceMode: voiceExperienceMode === 'v21_beta' ? 'v21_beta' : 'legacy',
          selectedSide,
        })
      );
    },
    [effectiveSideSetup, microCheckType, preflight, runner, startedAtIso, voiceExperienceMode]
  );

  React.useEffect(() => {
    sideResolver.reset();
    sideSelectionPinnedRef.current = false;
    setupLastPromptCueRef.current = null;
    setupLastPromptAtMsRef.current = -Infinity;
    setHandsFreeSetupNotice(null);
    setManualSideFallbackAvailable(false);
    setManualSideFallbackVisible(false);
  }, [effectiveSideSetup, microCheckType, sideResolver]);

  React.useEffect(() => {
    if (__DEV__) recorder.start();
    return () => {
      void recorder.stop();
      voice.stop();
      sfx.release();
    };
  }, [recorder, voice, sfx]);

  const handsFreeSideSetupActive =
    !metricDebug &&
    handsFreeMode &&
    effectiveSideSetup.sideRequired &&
    runner === null &&
    !manualSideFallbackVisible;

  const onLandmarks = React.useCallback(
    (e: { nativeEvent: LandmarksEventPayload }) => {
      const event = e.nativeEvent;
      const latencyFrame = poseLatencyDiagnostics?.beginFrame(event) ?? null;
      lastFrameTimestampRef.current = event.timestampMs;
      if (__DEV__) recorder.record(event);
      const out = pipeline.process(event);
      poseLatencyDiagnostics?.markJsTransformEnd(latencyFrame);
      const sourceAspect = event.sourceWidth / event.sourceHeight;
      if (!runner) {
        if (handsFreeSideSetupActive) {
          const preflightStatus = preflight.update(out);
          const sideStatus = sideResolver.update(out, microCheckType, effectiveSideSetup);
          if (!sideStatus.ready && preflightStatus.prompt !== 'ready') {
            const cue = preflightPromptCue(preflightStatus.prompt);
            if (
              shouldSpeakFramingPrompt({
                cue,
                lastCue: setupLastPromptCueRef.current,
                lastSpokenAtMs: setupLastPromptAtMsRef.current,
                nowMs: event.timestampMs,
                repeatMs: 10000,
              })
            ) {
              setupLastPromptCueRef.current = cue;
              setupLastPromptAtMsRef.current = event.timestampMs;
              voice.speak([cue], voicePriority(cue));
            }
          }
          if (sideStatus.ready && sideStatus.selectedSide) {
            pinMicroCheckSide(sideStatus.selectedSide, {
              observedSide: sideStatus.observedSide,
              source: sideStatus.source,
              userConfirmed: false,
            });
          }
          if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
            lastUiUpdateRef.current = event.timestampMs;
            const next: Snapshot = {
              ...INITIAL,
              phase: 'preflight',
              setupPrompt: preflightStatus.prompt,
            };
            setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
            setHandsFreeSetupNotice(sideStatus.setupCaption || null);
            setManualSideFallbackAvailable(sideStatus.fallbackAvailable);
          }
        }
        skeletonRef.current?.update(out, sourceAspect);
        poseLatencyDiagnostics?.markRendererUpdateSubmitted(latencyFrame);
        return;
      }

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

      if (u.voice) {
        if (shouldSpeakMicroCheckVoiceCountdownTracked(voiceExperienceMode, u.voice.cues)) {
          const request = voice.speakTracked(u.voice.cues, {
            priority: u.voice.priority,
            required: true,
            scopeId: `micro-check-v21:${microCheckType}:countdown`,
            onCueStarted: (started: VoiceCueStartedEvent) => {
              if (started.cueKey !== 'go') return;
              runner.notifyCountdownGoPlaybackStarted(lastFrameTimestampRef.current);
            },
          });
          if (!request.accepted) {
            // The runner remains in countdown until the next frame/retry path resolves the audible boundary.
          }
        } else {
          voice.speak(u.voice.cues, u.voice.priority);
        }
      }
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
    [
      effectiveSideSetup,
      handsFreeSideSetupActive,
      microCheckType,
      onComplete,
      pinMicroCheckSide,
      pipeline,
      poseLatencyDiagnostics,
      preflight,
      recorder,
      runner,
      sideResolver,
      sfx,
      voice,
      voiceExperienceMode,
    ]
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
    visibleCameraAvailability,
    handsFreeSideSetupActive ? handsFreeSetupNotice : null
  );
  const sessionNoticeAction = sessionNotice?.action ?? null;
  const footerMeta = microCheckFooterMeta(microCheckType);
  const stageDisplay = microCheckStageDisplay(microCheckType, visibleSnapshot, visibleCameraAvailability);
  const avatarMeasurementState = microCheckAvatarState(visibleSnapshot.phase);
  const avatarDomain = domainForMicroCheck(microCheckType);
  const canControl =
    runner !== null && visibleCameraAvailability !== 'unavailable' && visibleSnapshot.phase !== 'done';
  const showManualSideFallbackAction =
    handsFreeSideSetupActive && visibleCameraAvailability !== 'unavailable' && manualSideFallbackAvailable;
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

  if (
    !metricDebug &&
    effectiveSideSetup.sideRequired &&
    runner === null &&
    (!handsFreeMode || manualSideFallbackVisible)
  ) {
    return (
      <MicroCheckSideSetupScreen
        microCheckType={microCheckType}
        setup={effectiveSideSetup}
        onConfirm={(side) =>
          pinMicroCheckSide(side, {
            source: handsFreeMode ? 'user_fallback_selected' : undefined,
            userConfirmed: true,
          })
        }
        onCancel={onCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active={!metricDebug && (runner !== null || handsFreeSideSetupActive)}
        modelVariant="full"
        {...ANDROID_VIDEO_ROT_640_POSE_PROFILE}
        latencyDiagnosticsEnabled={poseLatencyDiagnostics !== null}
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={metricDebug ? undefined : setCameraAvailability}
      />
      <ScrollView
        style={styles.layout}
        contentContainerStyle={[
          styles.layoutContent,
          responsive.isCompactPhone && styles.compactScreenPadding,
          { paddingTop: recordingTopPadding, paddingBottom: spacing.xl + systemInsets.bottom },
        ]}
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
          ) : showManualSideFallbackAction ? (
            <View style={styles.controls}>
              <ControlButton title="Choose side manually" onPress={() => setManualSideFallbackVisible(true)} />
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

function MicroCheckSideSetupScreen({
  microCheckType,
  setup,
  onConfirm,
  onCancel,
}: {
  microCheckType: MicroCheckType;
  setup: MicroCheckSideSetup;
  onConfirm: (side: BodySide) => void;
  onCancel?: () => void;
}) {
  const [confirmOppositeSide, setConfirmOppositeSide] = React.useState<BodySide | null>(null);
  const responsive = useResponsiveLayout();
  const systemInsets = useSystemInsets();
  const copy = microCheckSideSetupCopy(microCheckType, setup);
  const recommendedSide = setup.selectedSide;
  const oppositeSide = recommendedSide ? oppositeMicroCheckSide(recommendedSide) : null;

  const confirmRecommended = React.useCallback(() => {
    if (recommendedSide) onConfirm(recommendedSide);
  }, [onConfirm, recommendedSide]);

  const useOppositeSide = React.useCallback(() => {
    if (oppositeSide) onConfirm(oppositeSide);
  }, [onConfirm, oppositeSide]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.layout}
        contentContainerStyle={[
          styles.sideSetupContent,
          responsive.isCompactPhone && styles.compactScreenPadding,
          { paddingTop: recordingScreenTopPadding(), paddingBottom: spacing.xl + systemInsets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topBar}>
          {onCancel ? (
            <BackArrowButton
              accessibilityLabel="Leave micro-check"
              onPress={onCancel}
              style={styles.topBarBackButton}
            />
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            {TITLE[microCheckType]}
          </Text>
        </View>

        <View style={[styles.sideSetupPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <View style={styles.sideSetupHeader}>
            <HeaderLogo size={30} />
            <Text style={styles.modalEyebrow}>Side setup</Text>
          </View>
          <Text style={styles.modalTitle}>{copy.title}</Text>
          <Text style={styles.modalBody}>{copy.body}</Text>

          {copy.mode === 'choice' ? (
            <View style={styles.sideSetupActions}>
              <ControlButton title="Left leg" onPress={() => onConfirm('left')} primary />
              <ControlButton title="Right leg" onPress={() => onConfirm('right')} />
            </View>
          ) : confirmOppositeSide && recommendedSide ? (
            <View style={styles.sideSetupWarning}>
              <Text style={styles.modalTitle}>Use the other side?</Text>
              <Text style={styles.modalBody}>
                This check will start or continue a separate side comparison. Your usual side will stay unchanged.
              </Text>
              <View style={styles.sideSetupActions}>
                <ControlButton title={`Use ${sideLabel(confirmOppositeSide)} leg`} onPress={useOppositeSide} primary />
                <ControlButton
                  title={`Keep ${sideLabel(recommendedSide)} leg`}
                  onPress={() => setConfirmOppositeSide(null)}
                />
              </View>
            </View>
          ) : (
            <View style={styles.sideSetupActions}>
              <ControlButton title="Continue" onPress={confirmRecommended} primary />
              {oppositeSide ? (
                <ControlButton
                  title={`Use ${sideLabel(oppositeSide)} leg instead`}
                  onPress={() =>
                    setup.recommendationSource === 'existing_microcheck_series'
                      ? setConfirmOppositeSide(oppositeSide)
                      : onConfirm(oppositeSide)
                  }
                />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

type MicroCheckSideSetupCopy =
  | { mode: 'choice'; title: string; body: string }
  | { mode: 'recommendation'; title: string; body: string };

function microCheckSideSetupCopy(
  microCheckType: MicroCheckType,
  setup: MicroCheckSideSetup
): MicroCheckSideSetupCopy {
  if (!setup.selectedSide) {
    return {
      mode: 'choice',
      title: 'Which side will you use?',
      body:
        microCheckType === 'mobility-reach'
          ? 'Choose the leg you can extend comfortably. Use the same leg each time for clearer progress.'
          : 'Choose the leg you can hold most comfortably today. Use the same leg each time for clearer progress.',
    };
  }
  return {
    mode: 'recommendation',
    title: `Use your ${sideLabel(setup.selectedSide)} leg`,
    body:
      setup.recommendationSource === 'compatible_official_anchor'
        ? 'This matches your Movement Check-Up.'
        : 'This matches your earlier micro checks.',
  };
}

function sideLabel(side: BodySide): string {
  return side === 'left' ? 'left' : 'right';
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
  const responsive = useResponsiveLayout();
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
    <View pointerEvents="none" style={[styles.recordingFooter, responsive.isCompactPhone && styles.compactCardPadding, style]}>
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
  const responsive = useResponsiveLayout();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, responsive.isCompactPhone && styles.compactModalBackdrop]}>
        <View style={[styles.helpModal, responsive.isCompactPhone && styles.compactCardPadding]}>
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
  const responsive = useResponsiveLayout();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeep}
    >
      <View style={[styles.modalBackdrop, responsive.isCompactPhone && styles.compactModalBackdrop]}>
        <View style={[styles.discardModal, responsive.isCompactPhone && styles.compactCardPadding]}>
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
  cameraAvailability: CameraAvailability,
  handsFreeSetupNotice: string | null = null
): MicroCheckNotice | null {
  if (cameraAvailability === 'unavailable') return null;
  if (paused) return { text: 'Paused', action: null };
  if (showHelp) return { text: 'Setup help', action: null };
  if (snapshot.phase === 'done') return { text: 'Logged', action: null };
  if (handsFreeSetupNotice) return { text: handsFreeSetupNotice, action: 'help' };
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

function preflightPromptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
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
  compactScreenPadding: {
    paddingHorizontal: 16,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  compactModalBackdrop: {
    paddingHorizontal: 16,
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
  sideSetupContent: {
    minHeight: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSetupPanel: {
    width: '100%',
    maxWidth: 520,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  sideSetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sideSetupActions: {
    gap: spacing.sm,
  },
  sideSetupWarning: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgBase,
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
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
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
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
  },
  modalKeepButton: { backgroundColor: colors.accent },
  modalDiscardButton: {
    backgroundColor: colors.cautionSoft,
    borderWidth: 1,
    borderColor: colors.cautionBorder,
  },
  modalKeepText: { ...type.button, color: colors.onAccent },
  modalDiscardText: { ...type.cardRowTitle, color: colors.error },
});
