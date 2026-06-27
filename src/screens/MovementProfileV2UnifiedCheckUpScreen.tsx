import * as React from 'react';
import { AppState } from 'react-native';

import type { LandmarksEventPayload, PoseErrorEventPayload } from '../../modules/expo-pose-detection';
import { VoiceChannel } from '../audio/voicePlayer';
import type { CheckupType } from '../adherence';
import type { BodySide } from '../checkup/protocolSetup';
import type { CheckUp } from '../checkup/types';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED } from '../config/movementProfileV2VoiceRuntimeFoundation';
import type { VoiceExperienceMode } from '../config/voiceExperienceTypes';
import { defaultNowMs } from '../diagnostics/poseLatencyDiagnostics';
import {
  createMovementProfileV2InternalFlow,
  type MovementProfileV2InternalFlowState,
} from '../movementProfileV2/internalCheckupFlow';
import { isMovementProfileV2DiagnosticsEnabled } from '../movementProfileV2/liveDiagnostics';
import {
  createMovementProfileV2LivePoseSample,
  MovementProfileV2LiveCoordinator,
  type MovementProfileV2LiveSnapshot,
  type MovementProfileV2LiveStage,
  type MovementProfileV2LiveUserAction,
} from '../movementProfileV2/liveCoordinator';
import {
  MovementProfileV2VoiceSequencer,
  initialMovementProfileV2VoiceEvent,
  movementProfileV2VisibleCueForStage,
} from '../movementProfileV2/voiceCues';
import {
  MovementProfileV2VoiceRuntime,
  type MovementProfileV2VoiceCoordinatorAction,
  type MovementProfileV2VoiceRuntimeState,
} from '../movementProfileV2/voiceRuntime';
import { PosePipeline } from '../pose/pipeline';
import { DEFAULT_VOICE_ID } from '../profile/voices';
import type { SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import {
  CheckUpRecordingShell,
  type CheckUpShellControl,
  type CheckUpShellFooterMeta,
  type CheckUpShellModalMode,
  type CheckUpShellNotice,
  type CheckUpShellStageDisplay,
} from './CheckUpRecordingShell';

const LIVE_TIMER_TICK_MS = 250;
const TOTAL_V2_ITEMS = 4;

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
  voiceExperienceMode = 'v21_beta',
  entryMode = 'public_checkup',
  onComplete,
  onCancel,
}: {
  startedAt: string;
  sourceType: MovementProfileV2CheckUpSourceType;
  initialFlow?: MovementProfileV2InternalFlowState | null;
  voiceId?: string;
  voiceExperienceMode?: VoiceExperienceMode;
  entryMode?: 'internal_comparison' | 'public_checkup';
  onComplete: (input: { checkUp: CheckUp; sourceType: MovementProfileV2CheckUpSourceType }) => void;
  onCancel: () => void;
}) {
  const voiceRuntimeEnabled =
    voiceExperienceMode === 'v21_beta' && MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED;
  const handsFreeMode = entryMode === 'public_checkup' && voiceRuntimeEnabled;
  const initialState = React.useMemo(
    () => initialFlow ?? { ...createMovementProfileV2InternalFlow({ startedAt }), sourceType },
    [initialFlow, sourceType, startedAt]
  );
  const coordinatorRef = React.useRef<MovementProfileV2LiveCoordinator | null>(null);
  if (coordinatorRef.current === null) {
    coordinatorRef.current = new MovementProfileV2LiveCoordinator(initialState, { handsFreeMode });
  }
  const [pipeline] = React.useState(() => new PosePipeline());
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const voiceSequencerRef = React.useRef(new MovementProfileV2VoiceSequencer());
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
  const completedRef = React.useRef(false);
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const diagnosticsEnabled = React.useMemo(() => isMovementProfileV2DiagnosticsEnabled(), []);

  const refreshLive = React.useCallback((nowMs: number = defaultNowMs()) => {
    const next = coordinatorRef.current?.snapshot(nowMs);
    if (!next) return null;
    liveRef.current = next;
    setLive(next);
    return next;
  }, []);

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
    if (voiceRuntimeEnabled) {
      getVoiceRuntime().sync(liveRef.current);
    } else {
      const intro = initialMovementProfileV2VoiceEvent();
      voice.speak(intro.cues, intro.priority);
    }
    return () => {
      voiceSequencerRef.current.dispose();
      if (voiceRuntimeEnabled) {
        voiceRuntimeRef.current?.cancel('screen_unmounted');
      } else {
        voice.stop();
      }
    };
  }, [getVoiceRuntime, voice, voiceRuntimeEnabled]);

  React.useEffect(() => {
    if (!voiceRuntimeEnabled) return;
    getVoiceRuntime().setDesiredVoiceId(voiceId ?? DEFAULT_VOICE_ID, liveRef.current);
  }, [getVoiceRuntime, voiceId, voiceRuntimeEnabled]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const nowMs = defaultNowMs();
      if (state === 'background' || state === 'inactive') {
        coordinatorRef.current?.receiveUserAction({ type: 'backgrounded' }, nowMs);
        if (voiceRuntimeEnabled) {
          voiceRuntimeRef.current?.cancel('app_backgrounded');
        } else {
          voice.stop();
        }
      } else if (state === 'active') {
        coordinatorRef.current?.receiveUserAction({ type: 'resumed' }, nowMs);
      }
      refreshLive(nowMs);
    });
    return () => sub.remove();
  }, [refreshLive, voice, voiceRuntimeEnabled]);

  React.useEffect(() => {
    const id = setInterval(() => {
      const nowMs = defaultNowMs();
      coordinatorRef.current?.receiveTimerTick(nowMs);
      refreshLive(nowMs);
    }, LIVE_TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [refreshLive]);

  React.useEffect(() => {
    if (voiceRuntimeEnabled) return;
    const cue = voiceSequencerRef.current.next(live);
    if (cue) voice.speak(cue.cues, cue.priority);
  }, [live, live.revision, voice, voiceRuntimeEnabled]);

  React.useEffect(() => {
    if (!voiceRuntimeEnabled) return;
    getVoiceRuntime().sync(live);
  }, [getVoiceRuntime, live, live.revision, voiceRuntimeEnabled]);

  React.useEffect(() => {
    if (!live.checkUp || completedRef.current) return;
    if (voiceRuntimeEnabled && !voiceRuntimeState.completionReady) return;
    completedRef.current = true;
    onComplete({ checkUp: live.checkUp, sourceType });
  }, [live.checkUp, onComplete, sourceType, voiceRuntimeState.completionReady, voiceRuntimeEnabled]);

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
        liveRef.current = next;
        setLive(next);
      }
    },
    [pipeline]
  );

  const onPoseError = React.useCallback((event: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[movement-profile-v2-unified-pose]', event.nativeEvent.message);
  }, []);

  const runLiveAction = React.useCallback(
    (action: MovementProfileV2LiveUserAction) => {
      const nowMs = defaultNowMs();
      if (
        voiceRuntimeEnabled &&
        !getVoiceRuntime().canDispatchAction(action, liveRef.current)
      ) {
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
      voiceRuntimeEnabled &&
      !getVoiceRuntime().canDispatchAction(action, liveRef.current),
    [getVoiceRuntime, voiceRuntimeEnabled]
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

  const controls = React.useMemo<CheckUpShellControl[]>(() => {
    if (cameraAvailability === 'unavailable') {
      return [{ id: 'close', title: 'Close check-up', onPress: onCancel, primary: true }];
    }
    if (voiceRuntimeEnabled && voiceRuntimeState.lastFailure) {
      return [
        { id: 'audio-retry', title: 'Try again', onPress: retryAudio, primary: true },
        { id: 'audio-exit', title: 'Exit check-up', onPress: onCancel },
      ];
    }
    return movementProfileV2ShellControls({
      live,
      handsFreeMode,
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
    });
  }, [
    actionDisabled,
    cameraAvailability,
    confirmOfficialFallback,
    handsFreeMode,
    keepOfficialAnchor,
    live,
    onCancel,
    pendingOfficialFallback,
    requestOfficialFallback,
    retryAudio,
    runLiveAction,
    selectedLeg,
    selectedShoulder,
    voiceRuntimeEnabled,
    voiceRuntimeState.lastFailure,
  ]);

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
        voiceRuntimeEnabled,
        voiceRuntimeState,
      })}
      modalMode={modalMode}
      setupIssue={false}
      footerMeta={movementProfileV2FooterMeta(live.stage)}
      stageDisplay={movementProfileV2StageDisplay(live, cameraAvailability)}
      avatarMeasurementState={movementProfileV2AvatarState(live)}
      avatarDomain={movementProfileV2AvatarDomain(live.stage)}
      controls={controls}
      onRequestBack={onCancel}
      backAccessibilityLabel={
        entryMode === 'internal_comparison' ? 'Leave Movement Profile' : 'Leave Movement Check-Up'
      }
      onOpenSupportModal={setModalMode}
      onCloseSupportModal={closeSupportModal}
      onTryAgain={closeSupportModal}
      onSkip={onCancel}
      pointCloudBodyDotScale={1.72}
    />
  );
}

function movementProfileV2ShellControls({
  live,
  handsFreeMode,
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
  handsFreeMode: boolean;
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
  const cancel: CheckUpShellControl = { id: 'cancel', title: 'Cancel', onPress: onCancel };
  switch (live.stage) {
    case 'chair_setup':
      if (handsFreeMode && !live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'confirm-chair',
          title: handsFreeMode ? 'Use setup fallback' : 'Confirm setup',
          onPress: () => runLiveAction({ type: 'confirm_chair_setup' }),
          disabled: actionDisabled({ type: 'confirm_chair_setup' }),
          primary: true,
        },
        cancel,
      ];
    case 'chair_practice':
    case 'chair_countdown':
    case 'chair_active':
      return [cancel];
    case 'balance_setup':
      if (handsFreeMode && !live.handsFreeFallbackAvailable) return [cancel];
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
      if (handsFreeMode && !live.handsFreeFallbackAvailable) return [cancel];
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
        : [cancel];
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
      if (handsFreeMode) return [cancel];
      return [
        {
          id: 'balance-ready',
          title: live.canContinueAfterRest ? 'Ready now' : `Rest ${formatCompactSeconds(live.restMinimumRemainingMs)}`,
          onPress: () => runLiveAction({ type: 'balance_ready' }),
          disabled: !live.canContinueAfterRest || actionDisabled({ type: 'balance_ready' }),
          primary: true,
        },
        ...(live.balanceBestHoldSec !== null
          ? [{
              id: 'balance-use-result',
              title: 'Save best result',
              onPress: () => runLiveAction({ type: 'balance_use_result' }),
              disabled: actionDisabled({ type: 'balance_use_result' }),
            }]
          : []),
        cancel,
      ];
    case 'shoulder_setup':
      if (handsFreeMode && !live.handsFreeFallbackAvailable) return [cancel];
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
      if (handsFreeMode && !live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'start-shoulder',
          title: handsFreeMode ? 'Use reach fallback' : 'Start reach',
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
      if (handsFreeMode && !live.handsFreeFallbackAvailable) return [cancel];
      return [
        {
          id: 'start-hinge',
          title: handsFreeMode ? 'Use capture fallback' : 'Start capture',
          onPress: () => runLiveAction({ type: 'start_hinge_capture' }),
          disabled: actionDisabled({ type: 'start_hinge_capture' }),
          primary: true,
        },
        cancel,
      ];
    case 'hinge_active':
      if (handsFreeMode) return [cancel];
      return [
        {
          id: 'finish-hinge',
          title: 'Finish capture',
          onPress: () => runLiveAction({ type: 'finish_hinge_capture' }),
          primary: true,
        },
        cancel,
      ];
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

function movementProfileV2FooterMeta(stage: MovementProfileV2LiveStage): CheckUpShellFooterMeta {
  const itemNumber = movementProfileV2ItemNumber(stage);
  if (stage === 'raw_complete') {
    return { progress: null, context: `${TOTAL_V2_ITEMS} tests complete` };
  }
  return {
    progress: `Test ${itemNumber} of ${TOTAL_V2_ITEMS}`,
    context: movementProfileV2DomainLabel(stage),
  };
}

function movementProfileV2StageDisplay(
  live: MovementProfileV2LiveSnapshot,
  cameraAvailability: CameraAvailability
): CheckUpShellStageDisplay | null {
  if (cameraAvailability === 'unavailable') return null;
  if (live.stage === 'chair_active') {
    return { mode: 'metric', label: 'Reps', value: `${live.chairReps}` };
  }
  if (live.stage === 'balance_rest') {
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
  voiceRuntimeEnabled,
  voiceRuntimeState,
}: {
  live: MovementProfileV2LiveSnapshot;
  cameraAvailability: CameraAvailability;
  selectedShoulder: BodySide;
  pendingOfficialFallback: OfficialSideFallbackRequest | null;
  voiceRuntimeEnabled: boolean;
  voiceRuntimeState: MovementProfileV2VoiceRuntimeState;
}): CheckUpShellNotice | null {
  if (cameraAvailability === 'unavailable') return null;
  if (voiceRuntimeEnabled && voiceRuntimeState.lastFailure) {
    return { text: 'Audio setup needed', action: null };
  }
  if (voiceRuntimeEnabled && voiceRuntimeState.blocking) {
    return { text: 'Audio guidance', action: null };
  }
  if (live.backgrounded) {
    return { text: 'Capture interrupted', action: null };
  }
  if (live.recoveryEpisode) {
    return { text: 'Tracking reset', action: 'help' };
  }
  if (pendingOfficialFallback) {
    return { text: 'Side change affects comparison', action: null };
  }
  return { text: compactVisibleCue(movementProfileV2VisibleCueForStage(live.stage, selectedShoulder).text), action: 'help' };
}

function compactVisibleCue(text: string): string {
  const sentence = text.split(/[.!?]/)[0]?.trim();
  if (!sentence) return text;
  if (sentence.length <= 28) return sentence;
  return `${sentence.slice(0, 27).trim()}...`;
}

function movementProfileV2AvatarState(live: MovementProfileV2LiveSnapshot): PoseAvatarMeasurementState {
  if (live.recoveryEpisode || live.backgrounded) return 'tracking_lost';
  switch (live.stage) {
    case 'raw_complete':
      return 'success';
    case 'chair_setup':
    case 'balance_setup':
    case 'shoulder_setup':
    case 'hinge_setup':
      return 'setup';
    case 'chair_practice':
    case 'chair_countdown':
    case 'balance_ready':
    case 'shoulder_ready':
    case 'shoulder_retry_ready':
      return 'ready';
    case 'balance_rest':
      return 'rest';
    case 'chair_active':
    case 'balance_trial':
    case 'shoulder_active':
    case 'hinge_active':
    default:
      return 'checkup';
  }
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

function movementProfileV2ItemNumber(stage: MovementProfileV2LiveStage): number {
  switch (movementProfileV2AvatarDomain(stage)) {
    case 'strength_power':
      return 1;
    case 'balance':
      return 2;
    case 'mobility':
      return stage === 'hinge_setup' || stage === 'hinge_active' ? 4 : 3;
    default:
      return TOTAL_V2_ITEMS;
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
