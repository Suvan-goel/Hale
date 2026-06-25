/**
 * Movement Check-Up screen — runs the whole voice-guided battery.
 *
 * Product laws on display: no camera video, audio-first operation, and a calm
 * skeleton-based measuring surface. The UI mirrors state for glanceability
 * while the orchestrator owns timing, pre-flight, scoring, and item advance.
 */

import * as React from 'react';

import {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { CheckUpOrchestrator, CheckUpPhase, DEFAULT_BATTERY, DEFAULT_CHECKUP_CONFIG } from '../checkup';
import { CheckUp } from '../checkup/types';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { PoseLatencyDiagnosticsOverlay } from '../diagnostics/PoseLatencyDiagnosticsOverlay';
import {
  createPoseLatencyDiagnostics,
  isPoseLatencyDiagnosticsEnabled,
} from '../diagnostics/poseLatencyDiagnostics';
import { AssessmentPhase } from '../assessment/sessionController';
import { getMovement } from '../movements';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonViewHandle } from '../render/SkeletonView';
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

const UI_UPDATE_INTERVAL_MS = 100;
const TOTAL_ITEMS = DEFAULT_BATTERY.length;

type ModalMode = CheckUpShellModalMode;

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

type FooterMeta = CheckUpShellFooterMeta;
type StageDisplay = CheckUpShellStageDisplay;

type CheckUpDebugScenario = 'metric';

type SessionNotice = CheckUpShellNotice;

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
  const poseLatencyDiagnostics = React.useMemo(
    () =>
      isPoseLatencyDiagnosticsEnabled()
        ? createPoseLatencyDiagnostics({ mode: 'checkup' })
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
        orchestrator.shiftTiming(Math.max(0, event.timestampMs - pauseStartedAtRef.current));
        resumePendingRef.current = false;
      }
      if (pausedRef.current) {
        skeletonRef.current?.update(out, sourceAspect);
        poseLatencyDiagnostics?.markRendererUpdateSubmitted(latencyFrame);
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
      poseLatencyDiagnostics?.markRendererUpdateSubmitted(latencyFrame);
    },
    [pipeline, poseLatencyDiagnostics, orchestrator, voice, sfx, recorder, onComplete]
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
    if (!shouldConfirmDiscardCheckup(snapshot, cameraAvailability)) {
      voice.stop();
      setModalMode(null);
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
  const sessionNotice = checkupSessionNotice(visibleSnapshot, visiblePaused, visibleCameraAvailability);
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
  const controls = React.useMemo<CheckUpShellControl[]>(() => {
    if (showUnavailableAction) {
      return [{ id: 'close', title: 'Close check-up', onPress: () => onCancel?.(), primary: true }];
    }
    if (!canControl) return [];
    const next: CheckUpShellControl[] = [
      {
        id: 'pause',
        title: paused ? 'Resume' : 'Pause',
        onPress: paused ? resume : pause,
        primary: true,
      },
    ];
    if (showRepeatControl) {
      next.push({ id: 'repeat', title: 'Repeat', onPress: repeatInstructions });
    }
    if (showSkipControl) {
      next.push({ id: 'skip', title: 'Skip this movement', onPress: skipCurrent });
    }
    return next;
  }, [
    canControl,
    onCancel,
    pause,
    paused,
    repeatInstructions,
    resume,
    showRepeatControl,
    showSkipControl,
    showUnavailableAction,
    skipCurrent,
  ]);

  return (
    <CheckUpRecordingShell
      title="Movement Check-Up"
      currentMovementName={currentMovementName}
      cameraAvailability={visibleCameraAvailability}
      cameraActive={!metricDebug}
      latencyDiagnosticsEnabled={poseLatencyDiagnostics !== null}
      onLandmarks={onLandmarks}
      onPoseError={onPoseError}
      onAvailabilityChange={metricDebug ? undefined : setCameraAvailability}
      skeletonRef={skeletonRef}
      sessionNotice={sessionNotice}
      modalMode={visibleModalMode}
      setupIssue={visibleSnapshot.setupIssue}
      footerMeta={footerMeta}
      stageDisplay={stageDisplay}
      avatarMeasurementState={avatarMeasurementState}
      avatarDomain={avatarDomain}
      controls={controls}
      onRequestBack={onCancel ? requestDiscardCheckup : undefined}
      backAccessibilityLabel="Leave Movement Check-Up"
      onOpenSupportModal={openSupportModal}
      onCloseSupportModal={closeSupportModal}
      onTryAgain={tryAgain}
      onSkip={skipCurrent}
      discardModal={{
        visible: discardModalVisible,
        onKeep: keepCheckup,
        onDiscard: discardCheckup,
      }}
      latencyOverlay={<PoseLatencyDiagnosticsOverlay diagnostics={poseLatencyDiagnostics} />}
    />
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

function shouldConfirmDiscardCheckup(snapshot: Snapshot, cameraAvailability: CameraAvailability): boolean {
  if (cameraAvailability === 'unavailable') return false;
  if (snapshot.phase === 'complete' || snapshot.phase === 'done') return true;
  if (snapshot.phase === 'transition') return snapshot.itemIndex > 0;
  if (snapshot.phase !== 'item') return false;
  return snapshot.itemPhase === 'active' || snapshot.itemPhase === 'result' || snapshot.itemPhase === 'done';
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
    return { text: 'Adjust your setup', action: 'setupIssue' };
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
