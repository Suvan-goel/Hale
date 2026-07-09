import * as React from 'react';
import { AppState, BackHandler, Platform } from 'react-native';

import type { LandmarksEventPayload, PoseErrorEventPayload } from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import type { CheckupType } from '../adherence';
import type { BodySide } from '../checkup/protocolSetup';
import type { CheckUp } from '../checkup/types';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { defaultNowMs } from '../diagnostics/poseLatencyDiagnostics';
import {
  createMovementProfileV2InternalFlow,
  movementProfileV2FlowBatterySequence,
  type MovementProfileV2BatteryMovement,
  type MovementProfileV2InternalFlowState,
} from '../movementProfileV2/internalCheckupFlow';
import { isMovementProfileV2DiagnosticsEnabled } from '../movementProfileV2/liveDiagnostics';
import {
  createMovementProfileV2LivePoseSample,
  MovementProfileV2LiveCoordinator,
  type MovementProfileV2LiveSnapshot,
  type MovementProfileV2LiveStage,
  type MovementProfileV2LiveTransitionSummary,
  type MovementProfileV2LiveUserAction,
} from '../movementProfileV2/liveCoordinator';
import {
  MovementProfileV2VoiceRuntime,
  type MovementProfileV2VoiceCoordinatorAction,
  type MovementProfileV2VoiceRuntimeState,
} from '../movementProfileV2/voiceRuntime';
import { PosePipeline } from '../pose/pipeline';
import { DEFAULT_VOICE_ID } from '../profile/voices';
import { RecordingVisualSurface } from '../recording/RecordingVisualSurface';
import { movementProfileV2InstructionTextForStage } from '../training/instructionProfiles';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarRendererHandle,
} from '../render/poseAvatarTypes';
import {
  CheckUpRecordingShell,
  type CheckUpRecordingAreaContext,
  type CheckUpShellControl,
  type CheckUpShellFooterMeta,
  type CheckUpShellModalMode,
  type CheckUpShellNotice,
  type CheckUpShellStageDisplay,
} from './CheckUpRecordingShell';

const LIVE_TIMER_TICK_MS = 250;
/**
 * iOS fires 'inactive' for transient overlays (call banner, control centre,
 * app switcher). Only treat it as a real backgrounding — which invalidates the
 * active measurement — if it persists this long or hardens to 'background'.
 */
const APP_STATE_INACTIVE_GRACE_MS = 2000;
const MPV2_MEASUREMENT_COMPLETE_TRANSITION_REASONS = new Set([
  'balance_valid_trial_rest',
  'balance_section_complete',
  'balance_user_accepted_best',
  'shoulder_section_complete',
]);

type MovementProfileV2CheckUpSourceType = Extract<
  CheckupType,
  'baseline' | 'baseline_retake' | 'official_retest' | 'manual_extra_v2'
>;

type OfficialSideFallbackKind = 'balance' | 'shoulder';

interface OfficialSideFallbackRequest {
  kind: OfficialSideFallbackKind;
  anchorSide: BodySide;
  fallbackSide: BodySide;
}

function movementProfileV2TransitionSfxKey(transition: MovementProfileV2LiveTransitionSummary): string {
  return `${transition.atMs}:${transition.from}:${transition.to}:${transition.reason}`;
}

function shouldPlayMovementProfileV2MeasurementCompleteSfx(
  snapshot: MovementProfileV2LiveSnapshot
): boolean {
  const transition = snapshot.lastTransition;
  if (!transition || !MPV2_MEASUREMENT_COMPLETE_TRANSITION_REASONS.has(transition.reason)) {
    return false;
  }
  if (transition.reason.startsWith('balance_')) return snapshot.balanceBestHoldSec !== null;
  if (transition.reason === 'shoulder_section_complete') return snapshot.shoulderPeakDeg !== null;
  return true;
}

const INITIAL_VOICE_RUNTIME_STATE: MovementProfileV2VoiceRuntimeState = {
  blocking: false,
  activeScopeId: null,
  activeRequirement: null,
  lastFailure: null,
  completionReady: false,
  desiredVoiceId: DEFAULT_VOICE_ID,
  activeVoiceId: DEFAULT_VOICE_ID,
  pendingVoiceId: null,
  diagnostics: [],
};

export function MovementProfileV2UnifiedCheckUpScreen({
  startedAt,
  sourceType,
  initialFlow,
  voiceId,
  onComplete,
  onRawCheckUpReady,
  onCancel,
}: {
  startedAt: string;
  sourceType: MovementProfileV2CheckUpSourceType;
  initialFlow?: MovementProfileV2InternalFlowState | null;
  voiceId?: string;
  onComplete: (input: { checkUp: CheckUp; sourceType: MovementProfileV2CheckUpSourceType }) => void;
  /**
   * Fired the moment the raw check-up exists (before the outro voice line).
   * The caller should persist it here so a crash, audio failure, or exit
   * between raw completion and the outro can never lose a measured battery.
   */
  onRawCheckUpReady?: (input: {
    checkUp: CheckUp;
    sourceType: MovementProfileV2CheckUpSourceType;
  }) => void;
  onCancel: () => void;
}) {
  const initialState = React.useMemo(
    () => initialFlow ?? { ...createMovementProfileV2InternalFlow({ startedAt }), sourceType },
    [initialFlow, sourceType, startedAt]
  );
  const coordinatorRef = React.useRef<MovementProfileV2LiveCoordinator | null>(null);
  if (coordinatorRef.current === null) {
    coordinatorRef.current = new MovementProfileV2LiveCoordinator(initialState, {
      // The check-up is hands-free and voice-led (the flag-off legacy button
      // path was retired 2026-07-09 — it never drove the coordinator's
      // voice-completed prerequisites and could not finish a battery).
      handsFreeMode: true,
      standingFrameCheckEnabled: true,
    });
  }
  const [pipeline] = React.useState(() => new PosePipeline());
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const [sfx] = React.useState(() => new SfxChannel());
  const voiceRuntimeRef = React.useRef<MovementProfileV2VoiceRuntime | null>(null);
  const [voiceRuntimeState, setVoiceRuntimeState] = React.useState<MovementProfileV2VoiceRuntimeState>(
    INITIAL_VOICE_RUNTIME_STATE
  );
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const [modalMode, setModalMode] = React.useState<CheckUpShellModalMode>(null);
  const [selectedLeg, setSelectedLeg] = React.useState<BodySide>(initialState.standingLeg);
  const [selectedShoulder, setSelectedShoulder] = React.useState<BodySide>(initialState.shoulderSide);
  const [pendingOfficialFallback, setPendingOfficialFallback] =
    React.useState<OfficialSideFallbackRequest | null>(null);
  const [live, setLive] = React.useState<MovementProfileV2LiveSnapshot>(() =>
    coordinatorRef.current!.snapshot(defaultNowMs())
  );
  const liveRef = React.useRef(live);
  const lastRepCreditCountRef = React.useRef(live.repCreditCount);
  const lastSfxTransitionKeyRef = React.useRef<string | null>(null);
  const completedRef = React.useRef(false);
  const rawNotifiedRef = React.useRef(false);
  const [confirmLeaveVisible, setConfirmLeaveVisible] = React.useState(false);
  const skeletonRef = React.useRef<PoseAvatarRendererHandle>(null);
  const diagnosticsEnabled = React.useMemo(() => isMovementProfileV2DiagnosticsEnabled(), []);

  const publishLive = React.useCallback(
    (next: MovementProfileV2LiveSnapshot) => {
      const previous = liveRef.current;
      if (next.repCreditCount > lastRepCreditCountRef.current) {
        sfx.play('rep-credit');
      }
      lastRepCreditCountRef.current = next.repCreditCount;
      const transitionKey = next.lastTransition ? movementProfileV2TransitionSfxKey(next.lastTransition) : null;
      if (
        next.lastTransition &&
        transitionKey !== lastSfxTransitionKeyRef.current
      ) {
        lastSfxTransitionKeyRef.current = transitionKey;
        if (next.lastTransition.to === 'raw_complete') {
          sfx.play('session-complete');
        } else if (shouldPlayMovementProfileV2MeasurementCompleteSfx(next)) {
          sfx.play('measurement-complete');
        }
      }
      if (!previous.recoveryEpisode && next.recoveryEpisode) {
        sfx.play('tracking-paused');
      } else if (
        previous.recoveryEpisode &&
        (
          (!next.recoveryEpisode && previous.recoveryEpisode.phase !== 'voice_completed') ||
          (
            next.recoveryEpisode &&
            previous.recoveryEpisode.id === next.recoveryEpisode.id &&
            previous.recoveryEpisode.phase !== 'voice_completed' &&
            next.recoveryEpisode.phase === 'voice_completed'
          )
        )
      ) {
        sfx.play('tracking-recovered');
      }
      liveRef.current = next;
      setLive(next);
    },
    [sfx]
  );

  const refreshLive = React.useCallback((nowMs: number = defaultNowMs()) => {
    const next = coordinatorRef.current?.snapshot(nowMs);
    if (!next) return null;
    publishLive(next);
    return next;
  }, [publishLive]);

  const applyVoiceCoordinatorAction = React.useCallback(
    (action: MovementProfileV2VoiceCoordinatorAction, atMs: number) => {
      coordinatorRef.current?.receiveUserAction(action, atMs);
      refreshLive(atMs);
    },
    [refreshLive]
  );

  const getVoiceRuntime = React.useCallback(() => {
    if (voiceRuntimeRef.current === null) {
      voiceRuntimeRef.current = new MovementProfileV2VoiceRuntime({
        voice,
        voiceId: voiceId ?? DEFAULT_VOICE_ID,
        createVoiceChannel: (nextVoiceId) => new VoiceChannel(nextVoiceId),
        nowMs: defaultNowMs,
        onStateChange: setVoiceRuntimeState,
        onCoordinatorAction: applyVoiceCoordinatorAction,
      });
    }
    return voiceRuntimeRef.current;
  }, [applyVoiceCoordinatorAction, voice, voiceId]);

  React.useEffect(() => {
    getVoiceRuntime().sync(liveRef.current);
    return () => {
      voiceRuntimeRef.current?.cancel('screen_unmounted');
      sfx.release();
    };
  }, [getVoiceRuntime, sfx]);

  React.useEffect(() => {
    getVoiceRuntime().setDesiredVoiceId(voiceId ?? DEFAULT_VOICE_ID, liveRef.current);
  }, [getVoiceRuntime, voiceId]);

  React.useEffect(() => {
    let inactiveGraceTimer: ReturnType<typeof setTimeout> | null = null;
    let backgroundedDispatched = false;
    const clearGrace = () => {
      if (inactiveGraceTimer !== null) {
        clearTimeout(inactiveGraceTimer);
        inactiveGraceTimer = null;
      }
    };
    const dispatchBackgrounded = () => {
      clearGrace();
      if (backgroundedDispatched) return;
      backgroundedDispatched = true;
      const nowMs = defaultNowMs();
      coordinatorRef.current?.receiveUserAction({ type: 'backgrounded' }, nowMs);
      voiceRuntimeRef.current?.cancel('app_backgrounded');
      refreshLive(nowMs);
    };
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        dispatchBackgrounded();
      } else if (state === 'inactive') {
        // Transient on iOS (call banner, control centre). Give it a grace
        // window before invalidating the active measurement.
        if (!backgroundedDispatched && inactiveGraceTimer === null) {
          inactiveGraceTimer = setTimeout(dispatchBackgrounded, APP_STATE_INACTIVE_GRACE_MS);
        }
      } else if (state === 'active') {
        clearGrace();
        if (backgroundedDispatched) {
          backgroundedDispatched = false;
          const nowMs = defaultNowMs();
          coordinatorRef.current?.receiveUserAction({ type: 'resumed' }, nowMs);
          refreshLive(nowMs);
        }
      }
    });
    return () => {
      clearGrace();
      sub.remove();
    };
  }, [refreshLive]);

  React.useEffect(() => {
    const id = setInterval(() => {
      const nowMs = defaultNowMs();
      coordinatorRef.current?.receiveTimerTick(nowMs);
      refreshLive(nowMs);
    }, LIVE_TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [refreshLive]);

  React.useEffect(() => {
    getVoiceRuntime().sync(live);
  }, [getVoiceRuntime, live, live.revision]);

  React.useEffect(() => {
    if (!live.checkUp || rawNotifiedRef.current) return;
    rawNotifiedRef.current = true;
    onRawCheckUpReady?.({ checkUp: live.checkUp, sourceType });
  }, [live.checkUp, onRawCheckUpReady, sourceType]);

  React.useEffect(() => {
    if (!live.checkUp || completedRef.current) return;
    if (!voiceRuntimeState.completionReady) return;
    completedRef.current = true;
    onComplete({ checkUp: live.checkUp, sourceType });
  }, [live.checkUp, onComplete, sourceType, voiceRuntimeState.completionReady]);

  /** User-driven completion when the outro voice failed: the measurements are
   * done, so exit forward to results instead of discarding the battery. */
  const finishNow = React.useCallback(() => {
    const checkUp = liveRef.current.checkUp;
    if (!checkUp || completedRef.current) return;
    completedRef.current = true;
    onComplete({ checkUp, sourceType });
  }, [onComplete, sourceType]);

  const onLandmarks = React.useCallback(
    (event: { nativeEvent: LandmarksEventPayload }) => {
      const payload = event.nativeEvent;
      const receivedAtMs = defaultNowMs();
      const out = pipeline.process(payload);
      const sourceAspect = payload.sourceWidth / payload.sourceHeight;
      skeletonRef.current?.update(out, sourceAspect);

      const active = liveRef.current;
      const sample = createMovementProfileV2LivePoseSample({
        frameId: payload.latency?.frameId,
        eventTimestampMs: payload.latency?.sourceTimestampMs ?? payload.timestampMs,
        receivedAtMs,
        sourceWidth: payload.sourceWidth,
        sourceHeight: payload.sourceHeight,
        movementEpochId: active.movementEpochId,
        attemptEpochId: active.attemptEpochId,
        output: out,
      });
      if (!sample) return;

      coordinatorRef.current?.receivePoseSample(sample);
      const next = coordinatorRef.current?.snapshot(receivedAtMs);
      if (next && next.revision !== liveRef.current.revision) {
        publishLive(next);
      }
    },
    [pipeline, publishLive]
  );

  const onPoseError = React.useCallback((event: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[movement-profile-v2-unified-pose]', event.nativeEvent.message);
  }, []);

  /** Leaving mid-battery discards completed tests; confirm unless there is
   * nothing to lose (nothing measured yet at a pre-measurement stage — frame
   * check or any first setup, whichever movement the sequence starts with).
   * With a COMPLETED battery, back exits FORWARD through onComplete: the
   * measurements exist, so leaving must apply them (placement + results),
   * never silently skip them because the outro was still speaking. */
  const requestClose = React.useCallback(() => {
    const snapshot = liveRef.current;
    if (snapshot.checkUp !== null) {
      finishNow();
      return;
    }
    const atPreMeasurementStage =
      snapshot.stage === 'standing_frame_check' || snapshot.stage.endsWith('_setup');
    if (atPreMeasurementStage && snapshot.flow.items.length === 0) {
      onCancel();
      return;
    }
    setConfirmLeaveVisible(true);
  }, [finishNow, onCancel]);

  const keepCheckUp = React.useCallback(() => setConfirmLeaveVisible(false), []);
  const discardCheckUp = React.useCallback(() => {
    setConfirmLeaveVisible(false);
    onCancel();
  }, [onCancel]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Registered after App's global handler, so it runs first (LIFO) and
    // routes hardware back through the same leave confirmation as the UI.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });
    return () => sub.remove();
  }, [requestClose]);

  const runLiveAction = React.useCallback(
    (action: MovementProfileV2LiveUserAction) => {
      const nowMs = defaultNowMs();
      if (!getVoiceRuntime().canDispatchAction(action, liveRef.current)) {
        return;
      }
      coordinatorRef.current?.receiveUserAction(action, nowMs);
      refreshLive(nowMs);
    },
    [getVoiceRuntime, refreshLive]
  );

  React.useEffect(() => {
    setPendingOfficialFallback(null);
  }, [live.stage]);

  React.useEffect(() => {
    setSelectedLeg(live.flow.standingLeg);
    setSelectedShoulder(live.flow.shoulderSide);
  }, [live.flow.shoulderSide, live.flow.standingLeg]);

  const actionDisabled = React.useCallback(
    (action: MovementProfileV2LiveUserAction) =>
      !getVoiceRuntime().canDispatchAction(action, liveRef.current),
    [getVoiceRuntime]
  );

  const retryAudio = React.useCallback(() => {
    getVoiceRuntime().retry(liveRef.current);
  }, [getVoiceRuntime]);

  const requestOfficialFallback = React.useCallback(
    (kind: OfficialSideFallbackKind, anchorSide: BodySide) => {
      setPendingOfficialFallback({ kind, anchorSide, fallbackSide: oppositeSide(anchorSide) });
    },
    []
  );

  const keepOfficialAnchor = React.useCallback(() => {
    if (!pendingOfficialFallback) return;
    if (pendingOfficialFallback.kind === 'balance') setSelectedLeg(pendingOfficialFallback.anchorSide);
    else setSelectedShoulder(pendingOfficialFallback.anchorSide);
    setPendingOfficialFallback(null);
  }, [pendingOfficialFallback]);

  const confirmOfficialFallback = React.useCallback(() => {
    if (!pendingOfficialFallback) return;
    const fallbackSide = pendingOfficialFallback.fallbackSide;
    if (pendingOfficialFallback.kind === 'balance') {
      setSelectedLeg(fallbackSide);
      runLiveAction({ type: 'confirm_balance_setup', standingLeg: fallbackSide });
    } else {
      setSelectedShoulder(fallbackSide);
      runLiveAction({ type: 'confirm_shoulder_setup', shoulderSide: fallbackSide });
    }
    setPendingOfficialFallback(null);
  }, [pendingOfficialFallback, runLiveAction]);

  const closeSupportModal = React.useCallback(() => {
    setModalMode(null);
  }, []);

  const replayCurrentInstruction = React.useCallback(() => {
    getVoiceRuntime().replayInstruction(liveRef.current);
  }, [getVoiceRuntime]);

  const openSupportModal = React.useCallback(
    (mode: Exclude<CheckUpShellModalMode, null>) => {
      if (mode === 'help') replayCurrentInstruction();
      setModalMode(mode);
    },
    [replayCurrentInstruction]
  );

  const controls = React.useMemo<CheckUpShellControl[]>(() => {
    if (cameraAvailability === 'unavailable') {
      return [{ id: 'close', title: 'Close check-up', onPress: requestClose, primary: true }];
    }
    if (voiceRuntimeState.lastFailure) {
      // With a completed battery, forward exit is always available: the
      // measurements exist and must never be hostage to the outro cue.
      if (live.checkUp) {
        return [
          { id: 'audio-retry', title: 'Try again', onPress: retryAudio, primary: true },
          { id: 'audio-continue', title: 'Continue to results', onPress: finishNow },
        ];
      }
      return [
        { id: 'audio-retry', title: 'Try again', onPress: retryAudio, primary: true },
        { id: 'audio-exit', title: 'Exit check-up', onPress: requestClose },
      ];
    }
    return movementProfileV2ShellControls({
      live,
      selectedLeg,
      selectedShoulder,
      pendingOfficialFallback,
      actionDisabled,
      runLiveAction,
      setSelectedLeg,
      setSelectedShoulder,
      requestOfficialFallback,
      keepOfficialAnchor,
      confirmOfficialFallback,
      onCancel: requestClose,
    });
  }, [
    actionDisabled,
    cameraAvailability,
    confirmOfficialFallback,
    finishNow,
    keepOfficialAnchor,
    live,
    pendingOfficialFallback,
    requestClose,
    requestOfficialFallback,
    retryAudio,
    runLiveAction,
    selectedLeg,
    selectedShoulder,
    voiceRuntimeState,
  ]);

  const renderFitFrameRecordingArea = React.useCallback(
    ({ cameraViewport, poseWindow }: CheckUpRecordingAreaContext) => (
      <RecordingVisualSurface
        rendererRef={skeletonRef}
        cameraAvailability={cameraAvailability}
        cameraViewport={cameraViewport}
        poseWindow={poseWindow}
        guidance={live.recordingVisualGuidance}
        mirrored
        frameSource="raw"
      />
    ),
    [cameraAvailability, live.recordingVisualGuidance]
  );

  return (
    <CheckUpRecordingShell
      title="Movement Check-Up"
      currentMovementName={movementProfileV2ShellTitle(live.stage)}
      cameraAvailability={cameraAvailability}
      cameraActive
      latencyDiagnosticsEnabled={diagnosticsEnabled}
      onLandmarks={onLandmarks}
      onPoseError={onPoseError}
      onAvailabilityChange={setCameraAvailability}
      skeletonRef={skeletonRef}
      sessionNotice={movementProfileV2ShellNotice({
        live,
        cameraAvailability,
        selectedShoulder,
        pendingOfficialFallback,
        voiceRuntimeState,
      })}
      modalMode={modalMode}
      setupIssue={false}
      footerMeta={movementProfileV2FooterMeta(live)}
      stageDisplay={movementProfileV2StageDisplay(live, cameraAvailability)}
      controls={controls}
      onRequestBack={requestClose}
      backAccessibilityLabel="Leave Movement Check-Up"
      onOpenSupportModal={openSupportModal}
      onCloseSupportModal={closeSupportModal}
      onTryAgain={closeSupportModal}
      onSkip={requestClose}
      discardModal={{
        visible: confirmLeaveVisible,
        onKeep: keepCheckUp,
        onDiscard: discardCheckUp,
      }}
      renderRecordingArea={renderFitFrameRecordingArea}
    />
  );
}

function movementProfileV2ShellControls({
  live,
  selectedLeg,
  selectedShoulder,
  pendingOfficialFallback,
  actionDisabled,
  runLiveAction,
  setSelectedLeg,
  setSelectedShoulder,
  requestOfficialFallback,
  keepOfficialAnchor,
  confirmOfficialFallback,
  onCancel,
}: {
  live: MovementProfileV2LiveSnapshot;
  selectedLeg: BodySide;
  selectedShoulder: BodySide;
  pendingOfficialFallback: OfficialSideFallbackRequest | null;
  actionDisabled: (action: MovementProfileV2LiveUserAction) => boolean;
  runLiveAction: (action: MovementProfileV2LiveUserAction) => void;
  setSelectedLeg: (side: BodySide) => void;
  setSelectedShoulder: (side: BodySide) => void;
  requestOfficialFallback: (kind: OfficialSideFallbackKind, anchorSide: BodySide) => void;
  keepOfficialAnchor: () => void;
  confirmOfficialFallback: () => void;
  onCancel: () => void;
}): CheckUpShellControl[] {
  // Hands-free is THE mode: manual controls surface only after the
  // hands-free timeout (live.handsFreeFallbackAvailable), as honest escapes.
  const cancel: CheckUpShellControl = { id: 'cancel', title: 'Cancel', onPress: onCancel };
  switch (live.stage) {
    case 'standing_frame_check':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'skip-frame-check',
          title: 'Skip camera check',
          onPress: () => runLiveAction({ type: 'skip_frame_check' }),
          disabled: actionDisabled({ type: 'skip_frame_check' }),
        },
        cancel,
      ];
    case 'chair_setup':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'confirm-chair',
          title: 'Use setup fallback',
          onPress: () => runLiveAction({ type: 'confirm_chair_setup' }),
          disabled: actionDisabled({ type: 'confirm_chair_setup' }),
          primary: true,
        },
        cancel,
      ];
    case 'chair_practice':
      // The practice rep can fail to credit in a marginal room; after the
      // hands-free timeout, let the user vouch for it. Teach-only — the
      // official 30-second window still requires camera-verified reps.
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'chair-practice-done',
          title: 'I did the practice stand',
          onPress: () => runLiveAction({ type: 'complete_chair_practice_fallback' }),
          disabled: actionDisabled({ type: 'complete_chair_practice_fallback' }),
          primary: true,
        },
        cancel,
      ];
    case 'chair_countdown':
    case 'chair_active':
      return [cancel];
    case 'balance_setup':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return balanceSetupControls({
        live,
        selectedLeg,
        pendingOfficialFallback,
        actionDisabled,
        runLiveAction,
        setSelectedLeg,
        requestOfficialFallback,
        keepOfficialAnchor,
        confirmOfficialFallback,
        cancel,
      });
    case 'balance_ready':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return live.balanceBestHoldSec !== null
        ? [
            {
              id: 'balance-use-result',
              title: 'Save best result',
              onPress: () => runLiveAction({ type: 'balance_use_result' }),
              disabled: actionDisabled({ type: 'balance_use_result' }),
              primary: true,
            },
            cancel,
          ]
        : [
            // No valid hold yet and the lift is not being detected (this
            // fallback only appears after the hands-free timeout). Never offer
            // a manual trial start — a trial without a camera-verified lift
            // could credit a hold that never happened. Skipping is honest.
            {
              id: 'balance-skip',
              title: 'Skip balance test',
              onPress: () => runLiveAction({ type: 'balance_skip' }),
              disabled: actionDisabled({ type: 'balance_skip' }),
            },
            cancel,
          ];
    case 'balance_trial':
      return [
        {
          id: 'balance-support',
          title: 'I touched support',
          onPress: () => runLiveAction({ type: 'balance_support_touched' }),
          primary: true,
        },
        { id: 'balance-stop', title: 'Stop attempt', onPress: () => runLiveAction({ type: 'balance_stop' }) },
        cancel,
      ];
    case 'balance_rest':
      // Rest auto-advances at the 30-second minimum (audio-first: the phone
      // is propped out of reach); no manual continue is offered.
      return [cancel];
    case 'shoulder_setup':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return shoulderSetupControls({
        live,
        selectedShoulder,
        pendingOfficialFallback,
        actionDisabled,
        runLiveAction,
        setSelectedShoulder,
        requestOfficialFallback,
        keepOfficialAnchor,
        confirmOfficialFallback,
        cancel,
      });
    case 'shoulder_ready':
    case 'shoulder_retry_ready':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'start-shoulder',
          title: 'Use reach fallback',
          onPress: () => runLiveAction({ type: 'start_shoulder_capture' }),
          disabled: actionDisabled({ type: 'start_shoulder_capture' }),
          primary: true,
        },
        cancel,
      ];
    case 'shoulder_active':
      return [
        {
          id: 'shoulder-limited',
          title: 'I felt limited',
          onPress: () => runLiveAction({ type: 'shoulder_pain_limited' }),
          primary: true,
        },
        cancel,
      ];
    case 'hinge_setup':
      if (!live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'start-hinge',
          title: 'Use capture fallback',
          onPress: () => runLiveAction({ type: 'start_hinge_capture' }),
          disabled: actionDisabled({ type: 'start_hinge_capture' }),
          primary: true,
        },
        cancel,
      ];
    case 'hinge_active':
      return [cancel];
    case 'raw_complete':
    default:
      return [];
  }
}

function balanceSetupControls({
  live,
  selectedLeg,
  pendingOfficialFallback,
  actionDisabled,
  runLiveAction,
  setSelectedLeg,
  requestOfficialFallback,
  keepOfficialAnchor,
  confirmOfficialFallback,
  cancel,
}: {
  live: MovementProfileV2LiveSnapshot;
  selectedLeg: BodySide;
  pendingOfficialFallback: OfficialSideFallbackRequest | null;
  actionDisabled: (action: MovementProfileV2LiveUserAction) => boolean;
  runLiveAction: (action: MovementProfileV2LiveUserAction) => void;
  setSelectedLeg: (side: BodySide) => void;
  requestOfficialFallback: (kind: OfficialSideFallbackKind, anchorSide: BodySide) => void;
  keepOfficialAnchor: () => void;
  confirmOfficialFallback: () => void;
  cancel: CheckUpShellControl;
}): CheckUpShellControl[] {
  if (live.flow.priorStandingLeg && pendingOfficialFallback?.kind === 'balance') {
    return [
      {
        id: 'balance-fallback',
        title: `Use ${sideName(pendingOfficialFallback.fallbackSide)} side`,
        onPress: confirmOfficialFallback,
        disabled: actionDisabled({
          type: 'confirm_balance_setup',
          standingLeg: pendingOfficialFallback.fallbackSide,
        }),
        primary: true,
      },
      { id: 'balance-keep-anchor', title: `Keep ${sideName(pendingOfficialFallback.anchorSide)} side`, onPress: keepOfficialAnchor },
      cancel,
    ];
  }
  if (live.flow.priorStandingLeg) {
    const standingLeg = live.flow.priorStandingLeg;
    return [
      {
        id: 'balance-continue',
        title: 'Continue',
        onPress: () => runLiveAction({ type: 'confirm_balance_setup', standingLeg }),
        disabled: actionDisabled({ type: 'confirm_balance_setup', standingLeg }),
        primary: true,
      },
      { id: 'balance-other-side', title: 'Use other side', onPress: () => requestOfficialFallback('balance', standingLeg) },
      cancel,
    ];
  }
  const controls: CheckUpShellControl[] = (['left', 'right'] as BodySide[]).map((standingLeg) => ({
    id: `balance-${standingLeg}`,
    title: `Stand ${sideName(standingLeg)}`,
    onPress: () => {
      setSelectedLeg(standingLeg);
      runLiveAction({ type: 'confirm_balance_setup', standingLeg });
    },
    disabled: actionDisabled({ type: 'confirm_balance_setup', standingLeg }),
    primary: selectedLeg === standingLeg,
  }));
  return [...controls, cancel];
}

function shoulderSetupControls({
  live,
  selectedShoulder,
  pendingOfficialFallback,
  actionDisabled,
  runLiveAction,
  setSelectedShoulder,
  requestOfficialFallback,
  keepOfficialAnchor,
  confirmOfficialFallback,
  cancel,
}: {
  live: MovementProfileV2LiveSnapshot;
  selectedShoulder: BodySide;
  pendingOfficialFallback: OfficialSideFallbackRequest | null;
  actionDisabled: (action: MovementProfileV2LiveUserAction) => boolean;
  runLiveAction: (action: MovementProfileV2LiveUserAction) => void;
  setSelectedShoulder: (side: BodySide) => void;
  requestOfficialFallback: (kind: OfficialSideFallbackKind, anchorSide: BodySide) => void;
  keepOfficialAnchor: () => void;
  confirmOfficialFallback: () => void;
  cancel: CheckUpShellControl;
}): CheckUpShellControl[] {
  if (live.flow.priorShoulderSide && pendingOfficialFallback?.kind === 'shoulder') {
    return [
      {
        id: 'shoulder-fallback',
        title: `Use ${sideName(pendingOfficialFallback.fallbackSide)} side`,
        onPress: confirmOfficialFallback,
        disabled: actionDisabled({
          type: 'confirm_shoulder_setup',
          shoulderSide: pendingOfficialFallback.fallbackSide,
        }),
        primary: true,
      },
      { id: 'shoulder-keep-anchor', title: `Keep ${sideName(pendingOfficialFallback.anchorSide)} side`, onPress: keepOfficialAnchor },
      cancel,
    ];
  }
  if (live.flow.priorShoulderSide) {
    const shoulderSide = live.flow.priorShoulderSide;
    return [
      {
        id: 'shoulder-continue',
        title: 'Continue',
        onPress: () => runLiveAction({ type: 'confirm_shoulder_setup', shoulderSide }),
        disabled: actionDisabled({ type: 'confirm_shoulder_setup', shoulderSide }),
        primary: true,
      },
      { id: 'shoulder-other-side', title: 'Use other side', onPress: () => requestOfficialFallback('shoulder', shoulderSide) },
      cancel,
    ];
  }
  const controls: CheckUpShellControl[] = (['left', 'right'] as BodySide[]).map((shoulderSide) => ({
    id: `shoulder-${shoulderSide}`,
    title: `${sideName(shoulderSide)} shoulder`,
    onPress: () => {
      setSelectedShoulder(shoulderSide);
      runLiveAction({ type: 'confirm_shoulder_setup', shoulderSide });
    },
    disabled: actionDisabled({ type: 'confirm_shoulder_setup', shoulderSide }),
    primary: selectedShoulder === shoulderSide,
  }));
  return [...controls, cancel];
}

function movementProfileV2ShellTitle(stage: MovementProfileV2LiveStage): string {
  switch (stage) {
    case 'standing_frame_check':
      return 'Camera Check';
    case 'chair_setup':
    case 'chair_practice':
    case 'chair_countdown':
    case 'chair_active':
      return 'Chair Rise';
    case 'balance_setup':
    case 'balance_ready':
    case 'balance_trial':
    case 'balance_rest':
      return 'One-Leg Balance';
    case 'shoulder_setup':
    case 'shoulder_ready':
    case 'shoulder_active':
    case 'shoulder_retry_ready':
      return 'Active Shoulder Reach';
    case 'hinge_setup':
    case 'hinge_active':
      return 'Forward Reach';
    case 'raw_complete':
    default:
      return 'Movement Check-Up';
  }
}

/** Test numbering derives from the battery sequence the flow actually runs
 * (default four-item battery OR the two-protocol Check-up #0), never from a
 * hardcoded battery shape. */
function movementProfileV2FooterMeta(live: MovementProfileV2LiveSnapshot): CheckUpShellFooterMeta {
  const stage = live.stage;
  if (stage === 'standing_frame_check') {
    return { progress: null, context: 'Camera setup' };
  }
  const sequence = movementProfileV2FlowBatterySequence(live.flow);
  if (stage === 'raw_complete') {
    return {
      progress: null,
      context: `${sequence.length} ${sequence.length === 1 ? 'test' : 'tests'} complete`,
    };
  }
  const movement = movementProfileV2MovementForStage(stage);
  const index = movement ? sequence.indexOf(movement) : -1;
  return {
    progress: index >= 0 ? `Test ${index + 1} of ${sequence.length}` : null,
    context: movementProfileV2DomainLabel(stage),
  };
}

function movementProfileV2MovementForStage(
  stage: MovementProfileV2LiveStage
): MovementProfileV2BatteryMovement | null {
  switch (stage) {
    case 'chair_setup':
    case 'chair_practice':
    case 'chair_countdown':
    case 'chair_active':
      return 'chair';
    case 'balance_setup':
    case 'balance_ready':
    case 'balance_trial':
    case 'balance_rest':
      return 'balance';
    case 'shoulder_setup':
    case 'shoulder_ready':
    case 'shoulder_active':
    case 'shoulder_retry_ready':
      return 'shoulder';
    case 'hinge_setup':
    case 'hinge_active':
      return 'hinge';
    default:
      return null;
  }
}

function movementProfileV2StageDisplay(
  live: MovementProfileV2LiveSnapshot,
  cameraAvailability: CameraAvailability
): CheckUpShellStageDisplay | null {
  if (cameraAvailability === 'unavailable') return null;
  if (live.stage === 'chair_active') {
    return { mode: 'metric', label: 'Reps', value: `${live.chairReps}` };
  }
  if (live.balanceTimerKind === 'rest') {
    return { mode: 'metric', label: 'Rest', value: formatCompactSeconds(live.restMinimumRemainingMs) };
  }
  if (live.timerRemainingMs !== null) {
    return { mode: 'metric', label: 'Time', value: formatCompactSeconds(live.timerRemainingMs) };
  }
  if (live.stage === 'balance_ready' && live.balanceBestHoldSec !== null) {
    return { mode: 'metric', label: 'Best', value: `${Math.round(live.balanceBestHoldSec)}s` };
  }
  if ((live.stage === 'shoulder_ready' || live.stage === 'shoulder_retry_ready') && live.shoulderPeakDeg !== null) {
    return { mode: 'metric', label: 'Peak', value: `${Math.round(live.shoulderPeakDeg)} deg` };
  }
  if (live.stage === 'hinge_setup' && live.hingeReachBu !== null) {
    return { mode: 'metric', label: 'Reach', value: `${live.hingeReachBu.toFixed(2)} BU` };
  }
  return null;
}

function movementProfileV2ShellNotice({
  live,
  cameraAvailability,
  selectedShoulder,
  pendingOfficialFallback,
  voiceRuntimeState,
}: {
  live: MovementProfileV2LiveSnapshot;
  cameraAvailability: CameraAvailability;
  selectedShoulder: BodySide;
  pendingOfficialFallback: OfficialSideFallbackRequest | null;
  voiceRuntimeState: MovementProfileV2VoiceRuntimeState;
}): CheckUpShellNotice | null {
  if (cameraAvailability === 'unavailable') return null;
  if (voiceRuntimeState.lastFailure) {
    return { text: 'Audio setup needed', action: null };
  }
  if (voiceRuntimeState.blocking) {
    return { text: 'Audio guidance', action: null };
  }
  if (live.backgrounded) {
    return { text: 'Capture interrupted', action: null };
  }
  // Only while the recovery is actually in progress (voice not yet done) —
  // afterwards the stage's own instruction is the honest notice.
  if (live.recoveryEpisode && live.recoveryEpisode.phase !== 'voice_completed') {
    return { text: 'Tracking reset', action: 'help' };
  }
  if (pendingOfficialFallback) {
    return { text: 'Side change affects comparison', action: null };
  }
  return {
    text: movementProfileV2InstructionTextForStage(live.stage, selectedShoulder) ?? 'Follow the voice guidance',
    action: 'help',
  };
}

function movementProfileV2AvatarDomain(stage: MovementProfileV2LiveStage): PoseAvatarActiveDomain | null {
  switch (stage) {
    case 'chair_setup':
    case 'chair_practice':
    case 'chair_countdown':
    case 'chair_active':
      return 'strength_power';
    case 'balance_setup':
    case 'balance_ready':
    case 'balance_trial':
    case 'balance_rest':
      return 'balance';
    case 'shoulder_setup':
    case 'shoulder_ready':
    case 'shoulder_active':
    case 'shoulder_retry_ready':
    case 'hinge_setup':
    case 'hinge_active':
      return 'mobility';
    default:
      return null;
  }
}

function movementProfileV2DomainLabel(stage: MovementProfileV2LiveStage): string | null {
  switch (movementProfileV2AvatarDomain(stage)) {
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

function oppositeSide(side: BodySide): BodySide {
  return side === 'left' ? 'right' : 'left';
}

function sideName(side: BodySide): string {
  return side === 'left' ? 'left' : 'right';
}

function formatCompactSeconds(ms: number | null): string {
  if (ms === null) return '0s';
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
}
