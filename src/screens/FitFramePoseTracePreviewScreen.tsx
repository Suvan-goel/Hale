import * as React from 'react';

import type {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { PreflightCheck, type PreflightPrompt, type PreflightStatus } from '../preflight/preflight';
import { PosePipeline, type PipelineFrameOutput } from '../pose/pipeline';
import { LM, type PoseFrame } from '../pose/types';
import {
  FitFramePoseTraceRenderer,
  type FitFramePoseTraceVisualState,
} from '../render/FitFramePoseTraceRenderer';
import type { PoseAvatarRendererHandle } from '../render/poseAvatarTypes';
import {
  CheckUpRecordingShell,
  type CheckUpRecordingAreaContext,
  type CheckUpShellControl,
  type CheckUpShellModalMode,
  type CheckUpShellNotice,
} from './CheckUpRecordingShell';

const UI_UPDATE_INTERVAL_MS = 100;

interface PreviewSnapshot {
  instruction: string;
  visualState: FitFramePoseTraceVisualState;
  stageValue: string;
  setupIssue: boolean;
}

const INITIAL_SNAPSHOT: PreviewSnapshot = {
  instruction: 'Step into view.',
  visualState: 'lost',
  stageValue: 'Find',
  setupIssue: false,
};

export function FitFramePoseTracePreviewScreen({ onBack }: { onBack: () => void }) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const traceRef = React.useRef<PoseAvatarRendererHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const [snapshot, setSnapshot] = React.useState<PreviewSnapshot>(INITIAL_SNAPSHOT);
  const [cameraAvailability, setCameraAvailability] =
    React.useState<CameraAvailability>('checking');
  const [modalMode, setModalMode] = React.useState<CheckUpShellModalMode>(null);

  React.useEffect(() => {
    return () => {
      pipeline.reset();
      preflight.reset();
    };
  }, [pipeline, preflight]);

  const onLandmarks = React.useCallback(
    (event: { nativeEvent: LandmarksEventPayload }) => {
      const payload = event.nativeEvent;
      const out = pipeline.process(payload);
      const status = preflight.update(out);
      const sourceAspect = payload.sourceWidth / payload.sourceHeight;
      traceRef.current?.update(out, sourceAspect);

      if (payload.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = payload.timestampMs;
        const next = snapshotFromPose(out, status);
        setSnapshot((prev) => (samePreviewSnapshot(prev, next) ? prev : next));
      }
    },
    [pipeline, preflight]
  );

  const onPoseError = React.useCallback((event: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[fit-frame-preview]', event.nativeEvent.message);
  }, []);

  const closeSupportModal = React.useCallback(() => setModalMode(null), []);
  const tryAgain = React.useCallback(() => {
    pipeline.reset();
    preflight.reset();
    setSnapshot(INITIAL_SNAPSHOT);
    setModalMode(null);
  }, [pipeline, preflight]);

  const renderRecordingArea = React.useCallback(
    ({ poseWindow }: CheckUpRecordingAreaContext) => (
      <FitFramePoseTraceRenderer
        ref={traceRef}
        contentWindow={poseWindow}
        visualState={snapshot.visualState}
        mirrored
        frameSource="raw"
      />
    ),
    [snapshot.visualState]
  );

  const sessionNotice: CheckUpShellNotice | null =
    cameraAvailability === 'unavailable'
      ? null
      : {
          text: snapshot.instruction,
          action: snapshot.setupIssue ? 'setupIssue' : null,
        };
  const controls = React.useMemo<readonly CheckUpShellControl[]>(
    () => [
      {
        id: 'close',
        title: 'Close preview',
        onPress: onBack,
        primary: true,
      },
    ],
    [onBack]
  );

  return (
    <CheckUpRecordingShell
      title="Recording Preview"
      currentMovementName="Fit Frame Pose Trace"
      cameraAvailability={cameraAvailability}
      cameraActive
      onLandmarks={onLandmarks}
      onPoseError={onPoseError}
      onAvailabilityChange={setCameraAvailability}
      skeletonRef={traceRef}
      sessionNotice={sessionNotice}
      modalMode={modalMode}
      setupIssue={snapshot.setupIssue}
      footerMeta={{
        progress: 'Experimental preview',
        context: 'No results saved',
      }}
      stageDisplay={{
        mode: 'metric',
        label: 'Sensor',
        value: snapshot.stageValue,
      }}
      avatarMeasurementState={snapshot.visualState === 'ready' ? 'ready' : 'framing'}
      avatarDomain={null}
      controls={controls}
      onRequestBack={onBack}
      backAccessibilityLabel="Close Fit Frame preview"
      onOpenSupportModal={setModalMode}
      onCloseSupportModal={closeSupportModal}
      onTryAgain={tryAgain}
      onSkip={closeSupportModal}
      renderRecordingArea={renderRecordingArea}
    />
  );
}

function snapshotFromPose(
  out: PipelineFrameOutput,
  status: PreflightStatus
): PreviewSnapshot {
  const lowerBodyMissing = out.rawFrame.hasPose && !feetVisible(out.rawFrame);
  const instruction = lowerBodyMissing
    ? 'Step back until your feet are visible.'
    : instructionForStatus(out, status);
  const visualState = lowerBodyMissing ? 'adjust' : visualStateForStatus(out, status);
  return {
    instruction,
    visualState,
    stageValue: stageValueForVisualState(visualState),
    setupIssue: status.prompt === 'turn-on-light',
  };
}

function instructionForStatus(out: PipelineFrameOutput, status: PreflightStatus): string {
  if (!out.rawFrame.hasPose || out.state === 'no-subject' || out.state === 'interrupted') {
    return 'Step into view.';
  }

  switch (status.prompt) {
    case 'center-yourself':
      return 'Center yourself in the frame.';
    case 'step-back':
      return 'Step back slightly.';
    case 'step-closer':
      return 'Step closer.';
    case 'hold-still':
      return status.phase === 'sampling' ? 'Perfect - hold still.' : 'Hold still.';
    case 'turn-on-light':
      return 'Turn on the main light.';
    case 'ready':
      return 'Tracking stable.';
    case 'step-into-frame':
    default:
      return 'Step into view.';
  }
}

function visualStateForStatus(
  out: PipelineFrameOutput,
  status: PreflightStatus
): FitFramePoseTraceVisualState {
  if (!out.rawFrame.hasPose || out.state === 'no-subject' || out.state === 'interrupted') {
    return 'lost';
  }
  if (status.prompt === 'ready' || status.phase === 'ready') {
    return 'ready';
  }
  if (adjustPrompt(status.prompt)) {
    return 'adjust';
  }
  return 'tracking';
}

function adjustPrompt(prompt: PreflightPrompt): boolean {
  return (
    prompt === 'center-yourself' ||
    prompt === 'step-back' ||
    prompt === 'step-closer' ||
    prompt === 'turn-on-light'
  );
}

function stageValueForVisualState(state: FitFramePoseTraceVisualState): string {
  switch (state) {
    case 'ready':
      return 'Ready';
    case 'tracking':
      return 'Hold';
    case 'adjust':
      return 'Adjust';
    case 'lost':
    default:
      return 'Find';
  }
}

function feetVisible(frame: PoseFrame): boolean {
  return (
    lowerLandmarkConfidence(frame, LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX) >= 0.35 &&
    lowerLandmarkConfidence(frame, LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX) >= 0.35
  );
}

function lowerLandmarkConfidence(frame: PoseFrame, ankle: LM, heel: LM, foot: LM): number {
  return Math.max(
    landmarkConfidence(frame, ankle),
    landmarkConfidence(frame, heel),
    landmarkConfidence(frame, foot)
  );
}

function landmarkConfidence(frame: PoseFrame, lm: LM): number {
  return Math.min(clamp01(frame.visibility[lm]), clamp01(frame.presence[lm]));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function samePreviewSnapshot(a: PreviewSnapshot, b: PreviewSnapshot): boolean {
  return (
    a.instruction === b.instruction &&
    a.visualState === b.visualState &&
    a.stageValue === b.stageValue &&
    a.setupIssue === b.setupIssue
  );
}
