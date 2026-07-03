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
  AppState,
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
import {
  nextMeasurementTrackingSfxState,
  type MeasurementTrackingSfxState,
} from '../audio/sessionSfx';
import { SfxChannel, VoiceChannel, type VoiceCueStartedEvent } from '../audio/voicePlayer';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
} from '../components/SafePoseDetectionView';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { useSystemInsets } from '../components/SystemInsetsProvider';
import {
  createPoseLatencyDiagnostics,
  isPoseLatencyDiagnosticsEnabled,
} from '../diagnostics/poseLatencyDiagnostics';
import { getExercise, type ExerciseDefinition } from '../exercises';
import { ANDROID_VIDEO_ROT_640_POSE_PROFILE } from '../pose/nativePoseProfiles';
import { PosePipeline } from '../pose/pipeline';
import type { TrackingState } from '../pose/pipeline';
import { PreflightCheck, TRAINING_PREFLIGHT_CONFIG } from '../preflight/preflight';
import type { PreflightPrompt } from '../preflight/preflight';
import { FRAMING_READY_COPY } from '../preflight/setupCopy';
import { RecordingVisualSurface } from '../recording/RecordingVisualSurface';
import { LandmarkRecorder } from '../recording/recorder';
import {
  buildTrainingRecordingVisualGuidance,
  type RecordingVisualGuidance,
} from '../recording/recordingVisualGuidance';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarRendererHandle,
} from '../render/poseAvatarTypes';
import { addBreadcrumb, captureError } from '../services/observability/sentry';
import { buildStoredSessionFunnel, SessionFunnelStore } from '../telemetry';
import { expoSessionFunnelFs } from '../telemetry/fsAdapter';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import {
  type TrainingFloorSetupSnapshot,
  type TrainingItemResult,
  TrainingPhase,
  TrainingSessionPlayer,
  TrainingSessionResult,
} from '../training/sessionPlayer';
import type { TrainingSetRuntimeGeneratedExercise } from '../training/setRuntime';
import type { SafetyCueId } from '../training/safetyCues';
import {
  getTrainingInstructionProfile,
  instructionCueIds,
  visibleInstructionText,
  type ExerciseInstructionProfile,
} from '../training/instructionProfiles';
import { poseEstimationWindowSize, recordingCameraViewportSize } from './recordingViewport';

const UI_UPDATE_INTERVAL_MS = 100;
const IOS_RECORDING_TOP_CLEARANCE = 44;
const TEMP_TRAINING_NATIVE_SKELETON_CANVAS = colors.card;
const TEMP_TRAINING_NATIVE_SKELETON_COLOR = colors.accent;

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
  measuring: boolean;
  trackingState: TrackingState | null;
  hasPose: boolean;
  validTimeCaption: string | null;
  setupIssue: boolean;
  setupPrompt: PreflightPrompt | null;
  floorSetup: TrainingFloorSetupSnapshot | null;
  safetyCueIds: readonly SafetyCueId[];
  safetyText: readonly string[];
  stepUpContext: {
    readonly expectedLeadSide: 'left' | 'right';
    readonly startLeadSide: 'left' | 'right';
    readonly acceptedRepCount: number;
    readonly leftLeadRepCount: number;
    readonly rightLeadRepCount: number;
    readonly targetTotalReps: number;
  } | null;
  stepUpCorrection: {
    readonly code: 'wrong_lead' | 'return_both_feet_to_floor' | 'insufficient_lead_evidence';
    readonly expectedLeadSide: 'left' | 'right';
  } | null;
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
  measuring: false,
  trackingState: null,
  hasPose: false,
  validTimeCaption: null,
  setupIssue: false,
  setupPrompt: null,
  floorSetup: null,
  safetyCueIds: [],
  safetyText: [],
  stepUpContext: null,
  stepUpCorrection: null,
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
  measuring: true,
  trackingState: 'tracking',
  hasPose: true,
  validTimeCaption: null,
  setupIssue: false,
  setupPrompt: 'step-back',
  floorSetup: null,
  safetyCueIds: [],
  safetyText: [
    'Keep fingertips near a chair or counter.',
    'Stop if you feel dizzy, sharp pain, or unsteady.',
  ],
  stepUpContext: null,
  stepUpCorrection: null,
};

const TRAINING_SETUP_HELP_STEPS: readonly { title: string; body: string }[] = [
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

const TRAINING_V21_COUNTDOWN = ['countdown-three', 'countdown-two', 'countdown-one', 'go'] as const;

function shouldSpeakTrainingVoiceCountdownTracked(
  internalRuntime: {
    readonly trainingVoiceMode?: 'legacy' | 'internal_v21';
    readonly trainingVoiceBehaviorReady?: boolean;
  } | undefined,
  cues: readonly string[]
): boolean {
  return (
    internalRuntime?.trainingVoiceMode === 'internal_v21' &&
    internalRuntime.trainingVoiceBehaviorReady === true &&
    cues.length === TRAINING_V21_COUNTDOWN.length &&
    cues.every((cue, index) => cue === TRAINING_V21_COUNTDOWN[index])
  );
}

export function TrainingSessionScreen({
  exerciseIds,
  sessionTitle,
  onComplete,
  onCancel,
  onItemCompleted,
  voiceId,
  debugScenario,
  generatedExercises,
  internalRuntime,
}: {
  exerciseIds: string[];
  sessionTitle?: string;
  onComplete: (result: TrainingSessionResult) => void;
  onCancel?: () => void;
  /** Fired at item boundaries with all items finished so far (resume snapshots). */
  onItemCompleted?: (completedItems: TrainingItemResult[]) => void;
  voiceId?: string;
  debugScenario?: TrainingSessionDebugScenario;
  generatedExercises?: readonly TrainingSetRuntimeGeneratedExercise[];
  internalRuntime?: {
    readonly stepUpAlternationReady?: boolean;
    readonly floorSetupReady?: boolean;
    readonly trainingVoiceBehaviorReady?: boolean;
    readonly trainingVoiceMode?: 'legacy' | 'internal_v21';
    readonly stepUpAlternationFeatureEnabled?: boolean;
    readonly floorV21FeatureEnabled?: boolean;
  };
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck(TRAINING_PREFLIGHT_CONFIG));
  const [sessionStartedAtIso] = React.useState(() => new Date().toISOString());
  const [funnelStore] = React.useState(() => new SessionFunnelStore(expoSessionFunnelFs));
  const [player] = React.useState(
    () =>
      new TrainingSessionPlayer(sessionStartedAtIso, exerciseIds, preflight, undefined, {
        generatedExercises,
        trainingVoiceMode: internalRuntime?.trainingVoiceMode,
        stepUpAlternationFeatureEnabled: internalRuntime?.stepUpAlternationFeatureEnabled,
        floorV21FeatureEnabled: internalRuntime?.floorV21FeatureEnabled,
        runtimeCapabilities: {
          internalStepUpAlternationReady: internalRuntime?.stepUpAlternationReady,
          internalFloorSetupReady: internalRuntime?.floorSetupReady,
          internalTrainingVoiceBehaviorReady: internalRuntime?.trainingVoiceBehaviorReady,
          poseEvidenceAdapterAvailable: internalRuntime?.stepUpAlternationReady,
        },
      })
  );
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const trainingRendererRef = React.useRef<PoseAvatarRendererHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const lastFrameTimestampRef = React.useRef(0);
  const pauseStartedAtRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const resumePendingRef = React.useRef(false);
  const completedRef = React.useRef(false);
  const discardWasPausedRef = React.useRef(false);
  const trackingSfxStateRef = React.useRef<MeasurementTrackingSfxState>('idle');
  const setupIssueSeenRef = React.useRef(false);
  const lastItemIndexRef = React.useRef(0);
  const lastTrainingPhaseRef = React.useRef<TrainingPhase | null>(null);
  const lastSetKindRef = React.useRef<ExerciseDefinition['kind'] | null>(null);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({ ...INITIAL, totalItems: exerciseIds.length });
  const [paused, setPaused] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [discardModalVisible, setDiscardModalVisible] = React.useState(false);
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const windowSize = useWindowDimensions();
  const responsive = useResponsiveLayout();
  const systemInsets = useSystemInsets();
  const recordingTopPadding = recordingScreenTopPadding();
  const exerciseDefinitions = React.useMemo(() => exerciseIds.map((id) => getExercise(id)), [exerciseIds]);
  const poseLatencyDiagnostics = React.useMemo(
    () =>
      isPoseLatencyDiagnosticsEnabled()
        ? createPoseLatencyDiagnostics({ mode: 'training' })
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

  const funnelRecordedRef = React.useRef(false);
  const recordFunnel = React.useCallback(
    (outcome: 'completed' | 'abandoned') => {
      if (funnelRecordedRef.current) return;
      funnelRecordedRef.current = true;
      const funnel = player.funnelSnapshot();
      try {
        funnelStore.save(
          buildStoredSessionFunnel({
            startedAt: sessionStartedAtIso,
            endedAt: new Date().toISOString(),
            outcome,
            funnel,
          })
        );
      } catch (error) {
        captureError(error, { area: 'telemetry', action: 'session_funnel_save' });
      }
      addBreadcrumb('training.session_funnel', {
        outcome,
        endedInPhase: funnel.endedInPhase,
        items: funnel.items.length,
        setupIssueCount: funnel.setupIssueCount,
        timeToFirstSetMs: funnel.timeToFirstSetMs,
        timeToFirstRepMs: funnel.timeToFirstRepMs,
      });
    },
    [funnelStore, player, sessionStartedAtIso]
  );

  // Any exit without a completed result is an abandonment; unmount covers
  // stop/back/navigation in one place (recordFunnel is idempotent, so a
  // completed session never double-records).
  React.useEffect(() => {
    return () => {
      recordFunnel('abandoned');
    };
  }, [recordFunnel]);

  const onLandmarks = React.useCallback(
    (e: { nativeEvent: LandmarksEventPayload }) => {
      const event = e.nativeEvent;
      const latencyFrame = poseLatencyDiagnostics?.beginFrame(event) ?? null;
      lastFrameTimestampRef.current = event.timestampMs;
      if (__DEV__) recorder.record(event);
      const out = pipeline.process(event);
      poseLatencyDiagnostics?.markJsTransformEnd(latencyFrame);
      const sourceAspect = event.sourceWidth / event.sourceHeight;
      trainingRendererRef.current?.update(out, sourceAspect);
      if (resumePendingRef.current) {
        player.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) {
        return;
      }
      const u = player.update(out, voice.busy);

      if (u.voice) {
        if (shouldSpeakTrainingVoiceCountdownTracked(internalRuntime, u.voice.cues)) {
          const request = voice.speakTracked(u.voice.cues, {
            priority: u.voice.priority,
            required: true,
            scopeId: `training-v21:item:${u.itemIndex}:set:${u.setIndex}:countdown`,
            onCueStarted: (started: VoiceCueStartedEvent) => {
              if (started.cueKey !== 'go') return;
              player.notifyCountdownGoPlaybackStarted({
                itemIndex: u.itemIndex,
                setIndex: u.setIndex,
                timestampMs: lastFrameTimestampRef.current,
              });
            },
          });
          if (!request.accepted) {
            // The player remains in countdown until Retry/Skip/Exit UI resolves the visible failure path.
          }
        } else {
          voice.speak(u.voice.cues, u.voice.priority);
        }
      }
      if (u.playRepSound) sfx.play('rep-credit');

      const currentSetDef = u.phase === 'set' && u.currentExerciseId ? getExercise(u.currentExerciseId) : null;
      if (
        u.phase !== 'done' &&
        lastTrainingPhaseRef.current === 'set' &&
        u.phase !== 'set' &&
        lastSetKindRef.current !== null &&
        lastSetKindRef.current !== 'reps'
      ) {
        sfx.play('measurement-complete');
      }
      const trackingSfx = nextMeasurementTrackingSfxState(trackingSfxStateRef.current, {
        measurementActive: u.phase === 'set',
        trackingOk: u.measuring === true && out.state === 'tracking',
      });
      trackingSfxStateRef.current = trackingSfx.state;
      if (trackingSfx.cue) sfx.play(trackingSfx.cue);

      if (u.phase === 'done' && !completedRef.current) {
        completedRef.current = true;
        recordFunnel('completed');
        sfx.play('session-complete');
        const result = player.result;
        if (result) onComplete(result);
        return;
      }
      if (u.phase !== lastTrainingPhaseRef.current) {
        addBreadcrumb('training.phase', { phase: u.phase, itemIndex: u.itemIndex });
      }
      // Item boundaries: an itemIndex advance or reaching 'complete' means the
      // previous item's result was just banked — snapshot for resume.
      if (
        onItemCompleted &&
        (u.itemIndex > lastItemIndexRef.current ||
          (u.phase === 'complete' && lastTrainingPhaseRef.current !== 'complete'))
      ) {
        onItemCompleted(player.completedItemsSnapshot());
      }
      lastItemIndexRef.current = u.itemIndex;
      if (u.setupIssue && !setupIssueSeenRef.current) {
        addBreadcrumb('training.setup_issue', { itemIndex: u.itemIndex, exerciseId: u.currentExerciseId });
      }
      setupIssueSeenRef.current = u.setupIssue;
      lastTrainingPhaseRef.current = u.phase;
      lastSetKindRef.current = currentSetDef?.kind ?? null;

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
          measuring: u.measuring,
          trackingState: out.state,
          hasPose: out.rawFrame.hasPose,
          validTimeCaption: u.validTimeCaption,
          setupIssue: u.setupIssue,
          setupPrompt: u.setupPrompt,
          floorSetup: u.floorSetup,
          safetyCueIds: u.safetyCueIds.slice(),
          safetyText: u.safetyText.slice(),
          stepUpContext: u.stepUpContext,
          stepUpCorrection: u.stepUpCorrection,
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
    },
    [pipeline, poseLatencyDiagnostics, player, voice, sfx, recorder, onComplete, onItemCompleted, recordFunnel, exerciseIds.length, internalRuntime]
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
  const currentInstructionProfile = visibleSnapshot.exerciseId
    ? getTrainingInstructionProfile(visibleSnapshot.exerciseId)
    : null;
  const totalItems = visibleSnapshot.totalItems || exerciseDefinitions.length || exerciseIds.length;
  const visibleItemNumber = totalItems > 0 ? Math.min(visibleSnapshot.itemIndex + 1, totalItems) : 0;
  const footerMeta = trainingFooterMeta(visibleSnapshot, visibleItemNumber, totalItems);
  const stageDisplay = trainingStageDisplay(visibleSnapshot, visibleCameraAvailability);
  const recordingVisualGuidance = React.useMemo<RecordingVisualGuidance>(
    () =>
      buildTrainingRecordingVisualGuidance({
        cameraAvailability: visibleCameraAvailability,
        pipelineState: visibleSnapshot.trackingState,
        hasPose: visibleSnapshot.hasPose,
        phase: visibleSnapshot.phase,
        setupPrompt: visibleSnapshot.setupPrompt,
        setupIssue: visibleSnapshot.setupIssue,
        floorSetup: visibleSnapshot.floorSetup,
        validTimeCaption: visibleSnapshot.validTimeCaption,
        stepUpCorrection: visibleSnapshot.stepUpCorrection,
        measuring: visibleSnapshot.measuring,
        paused: visiblePaused,
        showHelp: visibleShowHelp,
      }),
    [
      visibleCameraAvailability,
      visiblePaused,
      visibleShowHelp,
      visibleSnapshot,
    ]
  );
  const canControl =
    visibleCameraAvailability !== 'unavailable' && visibleSnapshot.phase !== 'complete' && visibleSnapshot.phase !== 'done';
  const canRepeat = visibleSnapshot.exerciseId !== null;
  const showFloorReadyControl =
    !visiblePaused &&
    !!visibleSnapshot.floorSetup &&
    visibleSnapshot.floorSetup.actionLabel !== null;
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
    player.pause(pauseStartedAtRef.current);
    voice.stop();
    setPaused(true);
  }, [player, voice]);

  const resume = React.useCallback(() => {
    pausedRef.current = false;
    player.resume(lastFrameTimestampRef.current);
    resumePendingRef.current = true;
    setPaused(false);
  }, [player]);

  // Backgrounding (calls, notification pulls) must pause the session: the
  // player is frame-timestamp driven and camera clocks keep advancing while
  // suspended, so an unpaused gap would silently complete sets and rests.
  // The user resumes explicitly — they may no longer be in position.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'background' && state !== 'inactive') return;
      if (pausedRef.current || completedRef.current) return;
      pause();
    });
    return () => sub.remove();
  }, [pause]);

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
    const profile = getTrainingInstructionProfile(snapshot.exerciseId);
    const cues = profile ? instructionCueIds(profile.help) : getExercise(snapshot.exerciseId).voice.instructions;
    const safetyCues = snapshot.safetyCueIds;
    if (cues.length > 0 || safetyCues.length > 0) voice.speak([...cues, ...safetyCues], 8);
  }, [snapshot.exerciseId, snapshot.safetyCueIds, voice]);

  const openHelp = React.useCallback(() => {
    setShowHelp(true);
    repeatInstructions();
  }, [repeatInstructions]);

  const confirmFloorStartPosition = React.useCallback(() => {
    const floorSetup = snapshot.floorSetup;
    if (!floorSetup) return;
    player.confirmFloorStartPosition({
      exerciseId: floorSetup.exerciseId,
      setIndex: floorSetup.setIndex,
      setupEpoch: floorSetup.setupEpoch,
    });
  }, [player, snapshot.floorSetup]);

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
            <BackArrowButton accessibilityLabel="Leave session" onPress={requestDiscardSession} style={styles.topBarBackButton} />
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            {sessionTitle?.trim() || 'Today\'s Hale session'}
          </Text>
        </View>

        <View style={styles.avatarSlot}>
          <View style={[styles.avatarViewport, cameraViewport]}>
            {!busyDebug ? (
              <SafePoseDetectionView
                active
                modelVariant="full"
                {...ANDROID_VIDEO_ROT_640_POSE_PROFILE}
                latencyDiagnosticsEnabled={poseLatencyDiagnostics !== null}
                nativeSkeletonOverlayEnabled={false}
                nativeSkeletonColor={TEMP_TRAINING_NATIVE_SKELETON_COLOR}
                canvasColor={TEMP_TRAINING_NATIVE_SKELETON_CANVAS}
                style={StyleSheet.absoluteFill}
                onLandmarks={onLandmarks}
                onPoseError={onPoseError}
                onAvailabilityChange={setCameraAvailability}
              />
            ) : null}
            <View pointerEvents="box-none" style={styles.recordingChrome}>
              <HeaderLogo size={34} style={styles.recordingLogo} />
              <RecordingSetupNotice
                visible={sessionNotice !== null}
                text={sessionNotice?.text ?? ''}
                onPress={sessionNoticeAction ? openHelp : undefined}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.helpIconButton,
                  showHelp && styles.helpIconButtonSelected,
                  pressed && styles.controlPressed,
                ]}
                onPress={openHelp}
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
              <RecordingVisualSurface
                rendererRef={trainingRendererRef}
                cameraAvailability={visibleCameraAvailability}
                cameraViewport={cameraViewport}
                poseWindow={poseWindow}
                guidance={recordingVisualGuidance}
                mirrored
                frameSource="raw"
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
              {showFloorReadyControl ? (
                <ControlButton
                  title={visibleSnapshot.floorSetup?.actionLabel ?? "I'm ready"}
                  onPress={confirmFloorStartPosition}
                  primary
                />
              ) : null}
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
      <SessionHelpModal
        visible={showHelp}
        instructionProfile={currentInstructionProfile}
        onClose={() => setShowHelp(false)}
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
          <Text style={styles.recordingSetupNoticeTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.84}>
            {text}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function SessionHelpModal({
  visible,
  instructionProfile,
  onClose,
}: {
  visible: boolean;
  instructionProfile: ExerciseInstructionProfile | null;
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
            <Text style={styles.modalTitle}>
              {instructionProfile ? instructionProfile.displayName : 'Help Hale see you clearly'}
            </Text>
            <Text style={styles.modalBody}>
              {instructionProfile
                ? visibleInstructionText(instructionProfile)
                : 'Use these quick checks before you start.'}
            </Text>
          </View>
          <View style={styles.helpStepList}>
            {TRAINING_SETUP_HELP_STEPS.map((step, index) => (
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

function DiscardSessionModal({
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
          <Text style={styles.modalEyebrow}>Leave session?</Text>
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
              accessibilityLabel="Leave session without saving"
            >
              <Text style={styles.modalDiscardText}>Leave without saving</Text>
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
  const responsive = useResponsiveLayout();
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
      style={[styles.recordingFooter, responsive.isCompactPhone && styles.compactCardPadding, style]}
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
    a.measuring === b.measuring &&
    a.trackingState === b.trackingState &&
    a.hasPose === b.hasPose &&
    a.validTimeCaption === b.validTimeCaption &&
    a.setupIssue === b.setupIssue &&
    a.setupPrompt === b.setupPrompt &&
    sameFloorSetup(a.floorSetup, b.floorSetup) &&
    sameList(a.safetyCueIds, b.safetyCueIds) &&
    sameList(a.safetyText, b.safetyText) &&
    sameStepUpContext(a.stepUpContext, b.stepUpContext) &&
    sameStepUpCorrection(a.stepUpCorrection, b.stepUpCorrection)
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
    if (snapshot.stepUpContext) {
      return {
        mode: 'metric',
        label: `Next: ${leadLabel(snapshot.stepUpContext.expectedLeadSide)} leg`,
        value: `${snapshot.stepUpContext.acceptedRepCount}/${snapshot.stepUpContext.targetTotalReps}`,
      };
    }
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
  if (snapshot.stepUpCorrection) {
    return { text: stepUpCorrectionText(snapshot.stepUpCorrection), action: null };
  }
  if (snapshot.floorSetup) {
    return { text: floorSetupNoticeText(snapshot.floorSetup), action: null };
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
    return {
      text: trainingInstructionNoticeText(snapshot.exerciseId) ?? PHASE_CAPTION[snapshot.phase] ?? 'Get ready',
      action: 'help',
    };
  }
  if (snapshot.phase === 'set' && snapshot.kind === 'rom') {
    return { text: 'Measuring', action: null };
  }
  return null;
}

function trainingInstructionNoticeText(exerciseId: string | null): string | null {
  if (!exerciseId) return null;
  const profile = getTrainingInstructionProfile(exerciseId);
  return profile ? visibleInstructionText(profile) : null;
}

function sameStepUpContext(a: Snapshot['stepUpContext'], b: Snapshot['stepUpContext']): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.expectedLeadSide === b.expectedLeadSide &&
    a.startLeadSide === b.startLeadSide &&
    a.acceptedRepCount === b.acceptedRepCount &&
    a.leftLeadRepCount === b.leftLeadRepCount &&
    a.rightLeadRepCount === b.rightLeadRepCount &&
    a.targetTotalReps === b.targetTotalReps
  );
}

function sameFloorSetup(a: TrainingFloorSetupSnapshot | null, b: TrainingFloorSetupSnapshot | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.exerciseId === b.exerciseId &&
    a.itemIndex === b.itemIndex &&
    a.setIndex === b.setIndex &&
    a.setupEpoch === b.setupEpoch &&
    a.phase === b.phase &&
    a.floorTransitionRequired === b.floorTransitionRequired &&
    a.userConfirmed === b.userConfirmed &&
    a.movementReady === b.movementReady &&
    a.finalPositionReadyAtMs === b.finalPositionReadyAtMs &&
    a.stableForMs === b.stableForMs &&
    a.setupCaption === b.setupCaption &&
    a.actionLabel === b.actionLabel &&
    a.fallbackAvailable === b.fallbackAvailable &&
    a.readinessSource === b.readinessSource
  );
}

function sameStepUpCorrection(a: Snapshot['stepUpCorrection'], b: Snapshot['stepUpCorrection']): boolean {
  if (a === null || b === null) return a === b;
  return a.code === b.code && a.expectedLeadSide === b.expectedLeadSide;
}

function leadLabel(side: 'left' | 'right'): string {
  return side === 'left' ? 'Left' : 'Right';
}

function stepUpCorrectionText(correction: NonNullable<Snapshot['stepUpCorrection']>): string {
  const lead = leadLabel(correction.expectedLeadSide).toLowerCase();
  if (correction.code === 'return_both_feet_to_floor') {
    return `Return both feet to the floor. Next, lead with your ${lead} leg.`;
  }
  if (correction.code === 'insufficient_lead_evidence') {
    return `Return both feet to the floor. Next, lead with your ${lead} leg.`;
  }
  return `Next, lead with your ${lead} leg.`;
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
      return snapshot.setupIssue ? 'Adjust your setup' : null;
  }
}

function floorSetupNoticeText(snapshot: TrainingFloorSetupSnapshot): string {
  if (snapshot.phase === 'ready') return 'Starting soon';
  if (
    snapshot.phase === 'movement_setup' ||
    snapshot.phase === 'awaiting_user_transition' ||
    snapshot.phase === 'awaiting_visibility' ||
    snapshot.phase === 'stabilizing'
  ) {
    return snapshot.setupCaption ?? 'Hold the start position';
  }
  if (snapshot.phase === 'cancelled') return 'Setup cancelled';
  return snapshot.setupCaption ?? 'Move safely to the floor';
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
    backgroundColor: TEMP_TRAINING_NATIVE_SKELETON_CANVAS,
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
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  helpSafetyLineText: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  helpSafetyLineStrong: {
    fontFamily: type.cardRowTitle.fontFamily,
    color: colors.textPrimary,
  },
  modalButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
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
