import type { VoiceCueKey } from '../audio/cues';
import type { CheckUpPhase } from '../checkup';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import type { AssessmentPhase } from '../assessment/sessionController';
import type { PipelineFrameOutput, TrackingState } from '../pose/pipeline';
import type { PreflightPrompt, PreflightStatus } from '../preflight/preflight';
import type { MicroCheckPhase } from '../training/microCheck';
import type { MicroCheckCameraSideSetupResult } from '../training/microCheckSideSetup';
import type {
  TrainingFloorSetupSnapshot,
  TrainingPhase,
} from '../training/sessionPlayer';

export type RecordingVisualState =
  | 'lost'
  | 'adjust'
  | 'tracking'
  | 'ready'
  | 'active'
  | 'recovery';

export type RecordingVisualGuidanceSource =
  | 'pipeline'
  | 'preflight'
  | 'movement_camera_readiness'
  | 'training_floor_setup'
  | 'training_active'
  | 'micro_check_side_setup'
  | 'micro_check_active'
  | 'checkup_item'
  | 'mpv2_live'
  | 'camera_unavailable'
  | 'preview';

export interface RecordingVisualGuidance {
  visualState: RecordingVisualState;
  source: RecordingVisualGuidanceSource;
  primaryText: string | null;
  secondaryText?: string | null;
  blocksMeasurement: boolean;
  blocksAutoStart: boolean;
  voiceCue: VoiceCueKey | null;
  metricProtected: boolean;
  reason: string;
}

export interface BuildPipelineRecordingVisualGuidanceOptions {
  cameraAvailability?: CameraAvailability;
  active?: boolean;
  primaryText?: string | null;
  secondaryText?: string | null;
}

export interface BuildPreflightRecordingVisualGuidanceOptions {
  cameraAvailability?: CameraAvailability;
}

export interface BuildCheckUpRecordingVisualGuidanceOptions {
  cameraAvailability?: CameraAvailability;
  pipelineState: TrackingState | null;
  hasPose: boolean;
  checkUpPhase: CheckUpPhase;
  itemPhase: AssessmentPhase | null;
  setupIssue: boolean;
  setupPrompt: PreflightPrompt | null;
  setupCaption: string | null;
  measuring: boolean;
  paused?: boolean;
}

export interface BuildMicroCheckRecordingVisualGuidanceOptions {
  cameraAvailability?: CameraAvailability;
  pipelineState: TrackingState | null;
  hasPose: boolean;
  sideSetupActive: boolean;
  sideSetupResult?: MicroCheckCameraSideSetupResult | null;
  runnerPhase: MicroCheckPhase | null;
  setupPrompt: PreflightPrompt | null;
  measuring: boolean;
  paused?: boolean;
}

export interface BuildTrainingRecordingVisualGuidanceOptions {
  cameraAvailability?: CameraAvailability;
  pipelineState: TrackingState | null;
  hasPose: boolean;
  phase: TrainingPhase;
  setupPrompt: PreflightPrompt | null;
  setupIssue: boolean;
  floorSetup: TrainingFloorSetupSnapshot | null;
  validTimeCaption: string | null;
  measuring: boolean;
  paused?: boolean;
  showHelp?: boolean;
}

export function buildPreflightRecordingVisualGuidance(
  status: PreflightStatus,
  options: BuildPreflightRecordingVisualGuidanceOptions = {}
): RecordingVisualGuidance {
  if (options.cameraAvailability === 'unavailable') {
    return cameraUnavailableGuidance();
  }

  switch (status.prompt) {
    case 'ready':
      return {
        visualState: 'ready',
        source: 'preflight',
        primaryText: 'Tracking stable.',
        secondaryText: null,
        blocksMeasurement: false,
        blocksAutoStart: false,
        voiceCue: 'framing-ready',
        metricProtected: false,
        reason: 'preflight:ready',
      };
    case 'center-yourself':
    case 'step-back':
    case 'step-closer':
    case 'turn-on-light':
      return {
        visualState: 'adjust',
        source: 'preflight',
        primaryText: preflightInstruction(status),
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: true,
        voiceCue: preflightPromptCue(status.prompt),
        metricProtected: false,
        reason: `preflight:${status.prompt}`,
      };
    case 'hold-still':
      return {
        visualState: 'tracking',
        source: 'preflight',
        primaryText: preflightInstruction(status),
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: true,
        voiceCue: 'hold-still',
        metricProtected: false,
        reason: 'preflight:hold-still',
      };
    case 'step-into-frame':
    default:
      return {
        visualState: 'lost',
        source: 'preflight',
        primaryText: 'Step into view.',
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: true,
        voiceCue: 'step-into-frame',
        metricProtected: false,
        reason: 'preflight:step-into-frame',
      };
  }
}

export function buildPipelineRecordingVisualGuidance(
  output: PipelineFrameOutput,
  options: BuildPipelineRecordingVisualGuidanceOptions = {}
): RecordingVisualGuidance {
  if (options.cameraAvailability === 'unavailable') {
    return cameraUnavailableGuidance();
  }

  if (!output.rawFrame.hasPose || output.state === 'no-subject') {
    return {
      visualState: 'lost',
      source: 'pipeline',
      primaryText: options.primaryText ?? 'Step into view.',
      secondaryText: options.secondaryText ?? null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-into-frame',
      metricProtected: false,
      reason: 'pipeline:no-subject',
    };
  }

  if (output.state === 'interrupted') {
    return {
      visualState: 'recovery',
      source: 'pipeline',
      primaryText: options.primaryText ?? 'Step into view.',
      secondaryText: options.secondaryText ?? null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'pipeline:interrupted',
    };
  }

  if (output.state === 'tracking' && options.active) {
    return {
      visualState: 'active',
      source: 'pipeline',
      primaryText: options.primaryText ?? null,
      secondaryText: options.secondaryText ?? null,
      blocksMeasurement: false,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: 'pipeline:active',
    };
  }

  return {
    visualState: 'tracking',
    source: 'pipeline',
    primaryText: options.primaryText ?? null,
    secondaryText: options.secondaryText ?? null,
    blocksMeasurement: output.state !== 'tracking',
    blocksAutoStart: output.state !== 'tracking',
    voiceCue: null,
    metricProtected: false,
    reason: `pipeline:${output.state}`,
  };
}

export function buildCheckUpRecordingVisualGuidance({
  cameraAvailability,
  pipelineState,
  hasPose,
  checkUpPhase,
  itemPhase,
  setupIssue,
  setupPrompt,
  setupCaption,
  measuring,
  paused = false,
}: BuildCheckUpRecordingVisualGuidanceOptions): RecordingVisualGuidance {
  if (cameraAvailability === 'unavailable') {
    return cameraUnavailableGuidance();
  }

  if (!hasPose || pipelineState === 'no-subject') {
    return {
      visualState: 'lost',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: setupPrompt === 'step-into-frame' ? 'step-into-frame' : null,
      metricProtected: false,
      reason: 'checkup:no-subject',
    };
  }

  if (pipelineState === 'interrupted') {
    return {
      visualState: 'recovery',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: itemPhase === 'active',
      reason: 'checkup:interrupted',
    };
  }

  if (paused) {
    return {
      visualState: pipelineState === 'tracking' ? 'tracking' : 'lost',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: itemPhase === 'active' || itemPhase === 'countdown',
      reason: 'checkup:paused',
    };
  }

  if (setupIssue) {
    return {
      visualState: 'adjust',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'checkup:setup-issue',
    };
  }

  if (itemPhase === 'active' && measuring) {
    return {
      visualState: 'active',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: false,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: 'checkup:active',
    };
  }

  if (itemPhase === 'active') {
    return {
      visualState: setupCaption ? 'adjust' : 'tracking',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: true,
      reason: setupCaption ? 'checkup:active-setup-caption' : 'checkup:active-not-measuring',
    };
  }

  if (setupCaption) {
    return {
      visualState: setupCaptionVisualState(setupCaption),
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: false,
      reason: 'checkup:setup-caption',
    };
  }

  if (itemPhase === 'instructions' || itemPhase === 'countdown') {
    return {
      visualState: 'ready',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: itemPhase === 'instructions',
      voiceCue: null,
      metricProtected: itemPhase === 'countdown',
      reason: `checkup:${itemPhase}`,
    };
  }

  if (itemPhase === 'result' || itemPhase === 'done') {
    return {
      visualState: 'ready',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: `checkup:${itemPhase}`,
    };
  }

  if (setupPrompt) {
    return checkUpGuidanceForPrompt(setupPrompt);
  }

  if (checkUpPhase === 'complete' || checkUpPhase === 'done') {
    return {
      visualState: 'ready',
      source: 'checkup_item',
      primaryText: null,
      secondaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: `checkup:${checkUpPhase}`,
    };
  }

  return {
    visualState: pipelineState === 'tracking' ? 'tracking' : 'adjust',
    source: 'checkup_item',
    primaryText: null,
    secondaryText: null,
    blocksMeasurement: true,
    blocksAutoStart: true,
    voiceCue: null,
    metricProtected: false,
    reason: `checkup:${checkUpPhase}`,
  };
}

export function buildMicroCheckRecordingVisualGuidance({
  cameraAvailability,
  pipelineState,
  hasPose,
  sideSetupActive,
  sideSetupResult = null,
  runnerPhase,
  setupPrompt,
  measuring,
  paused = false,
}: BuildMicroCheckRecordingVisualGuidanceOptions): RecordingVisualGuidance {
  if (cameraAvailability === 'unavailable') {
    return cameraUnavailableGuidance();
  }

  const source: RecordingVisualGuidanceSource =
    sideSetupActive && runnerPhase === null
      ? 'micro_check_side_setup'
      : 'micro_check_active';
  const activeMetricProtected = runnerPhase === 'active' || runnerPhase === 'countdown';

  if (!hasPose || pipelineState === 'no-subject') {
    return microCheckGuidance({
      visualState: 'lost',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: setupPrompt === 'step-into-frame' ? 'step-into-frame' : null,
      metricProtected: false,
      reason:
        source === 'micro_check_side_setup'
          ? 'micro_check:side-setup:no-subject'
          : 'micro_check:active:no-subject',
    });
  }

  if (pipelineState === 'interrupted') {
    return microCheckGuidance({
      visualState: 'recovery',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: activeMetricProtected,
      reason:
        source === 'micro_check_side_setup'
          ? 'micro_check:side-setup:interrupted'
          : 'micro_check:active:interrupted',
    });
  }

  if (source === 'micro_check_side_setup') {
    if (sideSetupResult?.ready) {
      return microCheckGuidance({
        visualState: 'ready',
        source,
        blocksMeasurement: true,
        blocksAutoStart: false,
        voiceCue: null,
        metricProtected: false,
        reason: 'micro_check:side-setup:ready',
      });
    }

    const visualState =
      sideSetupResult?.reason === 'hold_still'
        ? 'tracking'
        : sideSetupResult?.reason === 'waiting_for_tracking' && pipelineState === 'tracking'
          ? 'tracking'
          : 'adjust';
    return microCheckGuidance({
      visualState,
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: false,
      reason: `micro_check:side-setup:${sideSetupResult?.reason ?? setupPrompt ?? pipelineState ?? 'waiting'}`,
    });
  }

  if (paused) {
    return microCheckGuidance({
      visualState: pipelineState === 'tracking' ? 'tracking' : 'lost',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: activeMetricProtected,
      reason: 'micro_check:active:paused',
    });
  }

  if (runnerPhase === 'countdown') {
    return microCheckGuidance({
      visualState: 'ready',
      source,
      blocksMeasurement: true,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: 'micro_check:active:countdown',
    });
  }

  if (runnerPhase === 'active' && measuring) {
    return microCheckGuidance({
      visualState: 'active',
      source,
      blocksMeasurement: false,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: 'micro_check:active:measuring',
    });
  }

  if (runnerPhase === 'active') {
    return microCheckGuidance({
      visualState: setupPrompt ? microCheckVisualStateForPrompt(setupPrompt) : 'tracking',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: true,
      reason: setupPrompt
        ? `micro_check:active:${setupPrompt}`
        : 'micro_check:active:not-measuring',
    });
  }

  if (runnerPhase === 'instructions') {
    return microCheckGuidance({
      visualState: 'ready',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'micro_check:active:instructions',
    });
  }

  if (runnerPhase === 'done') {
    return microCheckGuidance({
      visualState: 'ready',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'micro_check:active:done',
    });
  }

  if (setupPrompt) {
    return microCheckGuidance({
      visualState: microCheckVisualStateForPrompt(setupPrompt),
      source,
      blocksMeasurement: true,
      blocksAutoStart: setupPrompt !== 'ready',
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: false,
      reason: `micro_check:active:${setupPrompt}`,
    });
  }

  return microCheckGuidance({
    visualState: pipelineState === 'tracking' ? 'tracking' : 'adjust',
    source,
    blocksMeasurement: true,
    blocksAutoStart: true,
    voiceCue: null,
    metricProtected: false,
    reason: `micro_check:active:${runnerPhase ?? pipelineState ?? 'waiting'}`,
  });
}

export function buildTrainingRecordingVisualGuidance({
  cameraAvailability,
  pipelineState,
  hasPose,
  phase,
  setupPrompt,
  setupIssue,
  floorSetup,
  validTimeCaption,
  measuring,
  paused = false,
  showHelp = false,
}: BuildTrainingRecordingVisualGuidanceOptions): RecordingVisualGuidance {
  if (cameraAvailability === 'unavailable') {
    return cameraUnavailableGuidance();
  }

  const source: RecordingVisualGuidanceSource = floorSetup
    ? 'training_floor_setup'
    : 'training_active';
  const metricProtected =
    phase === 'countdown' ||
    phase === 'set' ||
    validTimeCaption !== null;

  if (!hasPose || pipelineState === 'no-subject') {
    return trainingGuidance({
      visualState: 'lost',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: setupPrompt === 'step-into-frame' ? 'step-into-frame' : null,
      metricProtected,
      reason: floorSetup ? 'training:floor:no-subject' : 'training:active:no-subject',
    });
  }

  if (pipelineState === 'interrupted') {
    return trainingGuidance({
      visualState: 'recovery',
      source,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected,
      reason: floorSetup ? 'training:floor:interrupted' : 'training:active:interrupted',
    });
  }

  if (floorSetup) {
    if (floorSetup.phase === 'ready' || floorSetup.movementReady) {
      return trainingGuidance({
        visualState: 'ready',
        source: 'training_floor_setup',
        blocksMeasurement: true,
        blocksAutoStart: false,
        voiceCue: null,
        metricProtected: false,
        reason: `training:floor:${floorSetup.phase}`,
      });
    }

    return trainingGuidance({
      visualState: trainingFloorSetupVisualState(floorSetup),
      source: 'training_floor_setup',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: false,
      reason: `training:floor:${floorSetup.phase}`,
    });
  }

  if (paused || showHelp) {
    return trainingGuidance({
      visualState: pipelineState === 'tracking' ? 'tracking' : 'adjust',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected,
      reason: paused ? 'training:active:paused' : 'training:active:help',
    });
  }

  if (validTimeCaption) {
    return trainingGuidance({
      visualState: 'recovery',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: true,
      reason: 'training:active:valid-time',
    });
  }

  if (phase === 'countdown') {
    return trainingGuidance({
      visualState: 'ready',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: 'training:active:countdown',
    });
  }

  if (phase === 'set') {
    return trainingGuidance({
      visualState: measuring ? 'active' : 'tracking',
      source: 'training_active',
      blocksMeasurement: !measuring,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: measuring ? 'training:active:measuring' : 'training:active:set-not-measuring',
    });
  }

  if (phase === 'rest') {
    return trainingGuidance({
      visualState: pipelineState === 'tracking' ? 'tracking' : 'ready',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'training:active:rest',
    });
  }

  if (phase === 'complete' || phase === 'done') {
    return trainingGuidance({
      visualState: 'tracking',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: `training:active:${phase}`,
    });
  }

  if (setupIssue) {
    return trainingGuidance({
      visualState: 'adjust',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: false,
      reason: 'training:active:setup-issue',
    });
  }

  if (setupPrompt) {
    return trainingGuidance({
      visualState: trainingVisualStateForPrompt(setupPrompt),
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: setupPrompt !== 'ready',
      voiceCue: promptCueOrNull(setupPrompt),
      metricProtected: false,
      reason: `training:active:${setupPrompt}`,
    });
  }

  if (phase === 'instructions') {
    return trainingGuidance({
      visualState: 'ready',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'training:active:instructions',
    });
  }

  return trainingGuidance({
    visualState: pipelineState === 'tracking' ? 'tracking' : 'adjust',
    source: 'training_active',
    blocksMeasurement: true,
    blocksAutoStart: true,
    voiceCue: null,
    metricProtected: false,
    reason: `training:active:${phase}`,
  });
}

function cameraUnavailableGuidance(): RecordingVisualGuidance {
  return {
    visualState: 'lost',
    source: 'camera_unavailable',
    primaryText: 'Camera not available.',
    secondaryText: null,
    blocksMeasurement: true,
    blocksAutoStart: true,
    voiceCue: null,
    metricProtected: false,
    reason: 'camera_unavailable',
  };
}

function preflightInstruction(status: PreflightStatus): string {
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

function preflightPromptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
}

function promptCueOrNull(prompt: PreflightPrompt | null): VoiceCueKey | null {
  return prompt ? preflightPromptCue(prompt) : null;
}

function microCheckGuidance(input: {
  visualState: RecordingVisualState;
  source: RecordingVisualGuidanceSource;
  blocksMeasurement: boolean;
  blocksAutoStart: boolean;
  voiceCue: VoiceCueKey | null;
  metricProtected: boolean;
  reason: string;
}): RecordingVisualGuidance {
  return {
    visualState: input.visualState,
    source: input.source,
    primaryText: null,
    secondaryText: null,
    blocksMeasurement: input.blocksMeasurement,
    blocksAutoStart: input.blocksAutoStart,
    voiceCue: input.voiceCue,
    metricProtected: input.metricProtected,
    reason: input.reason,
  };
}

function microCheckVisualStateForPrompt(prompt: PreflightPrompt): RecordingVisualState {
  switch (prompt) {
    case 'ready':
      return 'ready';
    case 'hold-still':
      return 'tracking';
    case 'step-into-frame':
      return 'lost';
    case 'center-yourself':
    case 'step-back':
    case 'step-closer':
    case 'turn-on-light':
    default:
      return 'adjust';
  }
}

function trainingGuidance(input: {
  visualState: RecordingVisualState;
  source: RecordingVisualGuidanceSource;
  blocksMeasurement: boolean;
  blocksAutoStart: boolean;
  voiceCue: VoiceCueKey | null;
  metricProtected: boolean;
  reason: string;
}): RecordingVisualGuidance {
  return {
    visualState: input.visualState,
    source: input.source,
    primaryText: null,
    secondaryText: null,
    blocksMeasurement: input.blocksMeasurement,
    blocksAutoStart: input.blocksAutoStart,
    voiceCue: input.voiceCue,
    metricProtected: input.metricProtected,
    reason: input.reason,
  };
}

function trainingVisualStateForPrompt(prompt: PreflightPrompt): RecordingVisualState {
  switch (prompt) {
    case 'ready':
      return 'ready';
    case 'hold-still':
      return 'tracking';
    case 'step-into-frame':
      return 'lost';
    case 'center-yourself':
    case 'step-back':
    case 'step-closer':
    case 'turn-on-light':
    default:
      return 'adjust';
  }
}

function trainingFloorSetupVisualState(
  floorSetup: TrainingFloorSetupSnapshot
): RecordingVisualState {
  switch (floorSetup.phase) {
    case 'stabilizing':
      return 'tracking';
    case 'ready':
      return 'ready';
    case 'audio_failure':
    case 'cancelled':
      return 'recovery';
    case 'not_required':
      return 'tracking';
    case 'transition_instruction':
    case 'awaiting_user_transition':
    case 'movement_setup':
    case 'awaiting_visibility':
    default:
      return 'adjust';
  }
}

function checkUpGuidanceForPrompt(prompt: PreflightPrompt): RecordingVisualGuidance {
  switch (prompt) {
    case 'ready':
      return {
        visualState: 'ready',
        source: 'checkup_item',
        primaryText: null,
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: false,
        voiceCue: 'framing-ready',
        metricProtected: false,
        reason: 'checkup:ready',
      };
    case 'hold-still':
      return {
        visualState: 'tracking',
        source: 'checkup_item',
        primaryText: null,
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: true,
        voiceCue: 'hold-still',
        metricProtected: false,
        reason: 'checkup:hold-still',
      };
    case 'center-yourself':
    case 'step-back':
    case 'step-closer':
    case 'turn-on-light':
      return {
        visualState: 'adjust',
        source: 'checkup_item',
        primaryText: null,
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: true,
        voiceCue: preflightPromptCue(prompt),
        metricProtected: false,
        reason: `checkup:${prompt}`,
      };
    case 'step-into-frame':
    default:
      return {
        visualState: 'lost',
        source: 'checkup_item',
        primaryText: null,
        secondaryText: null,
        blocksMeasurement: true,
        blocksAutoStart: true,
        voiceCue: 'step-into-frame',
        metricProtected: false,
        reason: 'checkup:step-into-frame',
      };
  }
}

function setupCaptionVisualState(caption: string): RecordingVisualState {
  return caption.toLowerCase().includes('hold still') ? 'tracking' : 'adjust';
}
