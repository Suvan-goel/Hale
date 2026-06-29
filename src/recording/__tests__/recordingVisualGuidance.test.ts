import type { CameraAvailability } from '../../components/SafePoseDetectionView';
import fs from 'fs';
import path from 'path';
import type { PipelineFrameOutput, TrackingState } from '../../pose/pipeline';
import type { PreflightStatus } from '../../preflight/preflight';
import {
  buildCheckUpRecordingVisualGuidance,
  buildMicroCheckRecordingVisualGuidance,
  buildPipelineRecordingVisualGuidance,
  buildPreflightRecordingVisualGuidance,
  buildPreviewRecordingVisualGuidance,
  buildTrainingRecordingVisualGuidance,
} from '../recordingVisualGuidance';
import type { MicroCheckCameraSideSetupResult } from '../../training/microCheckSideSetup';
import type { TrainingFloorSetupSnapshot } from '../../training/sessionPlayer';

describe('recording visual guidance adapters', () => {
  it('prioritizes camera unavailable before preview-specific positioning copy', () => {
    const guidance = buildPreviewRecordingVisualGuidance({
      output: pipelineOutput('tracking', true),
      preflightStatus: preflightStatus('ready', 'ready'),
      cameraAvailability: 'unavailable',
      feetVisible: false,
    });

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'camera_unavailable',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      reason: 'camera_unavailable',
    });
  });

  it('keeps preview-only missing-feet guidance out of generic preflight mapping', () => {
    const preview = buildPreviewRecordingVisualGuidance({
      output: pipelineOutput('tracking', true),
      preflightStatus: preflightStatus('ready', 'ready'),
      feetVisible: false,
    });
    const preflight = buildPreflightRecordingVisualGuidance(
      preflightStatus('ready', 'ready')
    );

    expect(preview).toMatchObject({
      visualState: 'adjust',
      source: 'preview',
      primaryText: 'Step back until your feet are visible.',
      reason: 'preview:feet-not-visible',
    });
    expect(preflight).toMatchObject({
      visualState: 'ready',
      source: 'preflight',
      reason: 'preflight:ready',
    });
  });

  it('maps no-subject pipeline state to lost', () => {
    const guidance = buildPipelineRecordingVisualGuidance(
      pipelineOutput('no-subject', false)
    );

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'pipeline',
      primaryText: 'Step into view.',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-into-frame',
      reason: 'pipeline:no-subject',
    });
  });

  it('maps interrupted pipeline state to recovery without issuing a voice cue', () => {
    const guidance = buildPipelineRecordingVisualGuidance(
      pipelineOutput('interrupted', true)
    );

    expect(guidance).toMatchObject({
      visualState: 'recovery',
      source: 'pipeline',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      reason: 'pipeline:interrupted',
    });
  });

  it('maps adjusting preflight prompts to adjust', () => {
    const guidance = buildPreflightRecordingVisualGuidance(
      preflightStatus('framing', 'step-back')
    );

    expect(guidance).toMatchObject({
      visualState: 'adjust',
      source: 'preflight',
      primaryText: 'Step back slightly.',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-back',
      reason: 'preflight:step-back',
    });
  });

  it('maps ready preflight state to ready', () => {
    const guidance = buildPreflightRecordingVisualGuidance(
      preflightStatus('ready', 'ready')
    );

    expect(guidance).toMatchObject({
      visualState: 'ready',
      source: 'preflight',
      primaryText: 'Tracking stable.',
      blocksMeasurement: false,
      blocksAutoStart: false,
      voiceCue: 'framing-ready',
      reason: 'preflight:ready',
    });
  });

  it('maps tracking pipeline state to tracking', () => {
    const guidance = buildPipelineRecordingVisualGuidance(
      pipelineOutput('tracking', true)
    );

    expect(guidance).toMatchObject({
      visualState: 'tracking',
      source: 'pipeline',
      blocksMeasurement: false,
      blocksAutoStart: false,
      reason: 'pipeline:tracking',
    });
  });

  it('marks active tracking as metric-protected guidance', () => {
    const guidance = buildPipelineRecordingVisualGuidance(
      pipelineOutput('tracking', true),
      { active: true }
    );

    expect(guidance).toMatchObject({
      visualState: 'active',
      metricProtected: true,
      blocksMeasurement: false,
      blocksAutoStart: false,
      reason: 'pipeline:active',
    });
  });

  it('keeps edge-warning state out of visual guidance flow control', () => {
    const guidance = buildPipelineRecordingVisualGuidance(
      pipelineOutput('tracking', true),
      { active: true }
    );
    const text = source('src/recording/recordingVisualGuidance.ts');

    expect(guidance).toMatchObject({
      visualState: 'active',
      blocksMeasurement: false,
      blocksAutoStart: false,
      voiceCue: null,
    });
    expect(text).not.toMatch(/edgeFlags|activeEdgeFlags|fitFrameEdge|buildFitFramePoseTracePaths/);
  });

  it('maps camera unavailable to lost from every adapter', () => {
    const availability: CameraAvailability = 'unavailable';
    const pipeline = buildPipelineRecordingVisualGuidance(
      pipelineOutput('tracking', true),
      { cameraAvailability: availability }
    );
    const preflight = buildPreflightRecordingVisualGuidance(
      preflightStatus('ready', 'ready'),
      { cameraAvailability: availability }
    );

    expect(pipeline.visualState).toBe('lost');
    expect(preflight.visualState).toBe('lost');
    expect(pipeline.reason).toBe('camera_unavailable');
    expect(preflight.reason).toBe('camera_unavailable');
  });
});

describe('legacy Check-Up recording visual guidance adapter', () => {
  it('maps no-subject Check-Up state to lost without creating readiness rules', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      hasPose: false,
      pipelineState: 'no-subject',
      setupPrompt: 'step-into-frame',
    });

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'checkup_item',
      primaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-into-frame',
      reason: 'checkup:no-subject',
    });
  });

  it('maps interrupted Check-Up tracking to recovery', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      pipelineState: 'interrupted',
      itemPhase: 'active',
    });

    expect(guidance).toMatchObject({
      visualState: 'recovery',
      source: 'checkup_item',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: true,
      reason: 'checkup:interrupted',
    });
  });

  it('maps generic adjusting prompts to adjust', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      itemPhase: 'preflight',
      setupPrompt: 'center-yourself',
    });

    expect(guidance).toMatchObject({
      visualState: 'adjust',
      source: 'checkup_item',
      primaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'center-yourself',
      metricProtected: false,
      reason: 'checkup:center-yourself',
    });
  });

  it('maps movement-specific setup captions to visual adjustment without replacing Check-Up copy', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      itemPhase: 'preflight',
      setupPrompt: 'ready',
      setupCaption: 'Turn so your side faces the camera.',
    });

    expect(guidance).toMatchObject({
      visualState: 'adjust',
      source: 'checkup_item',
      primaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'framing-ready',
      reason: 'checkup:setup-caption',
    });
  });

  it('maps countdown to ready while protecting the metric footer', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      itemPhase: 'countdown',
      setupPrompt: null,
    });

    expect(guidance).toMatchObject({
      visualState: 'ready',
      source: 'checkup_item',
      blocksMeasurement: true,
      blocksAutoStart: false,
      metricProtected: true,
      reason: 'checkup:countdown',
    });
  });

  it('maps active measuring to active with metric protection', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      itemPhase: 'active',
      measuring: true,
      setupPrompt: null,
    });

    expect(guidance).toMatchObject({
      visualState: 'active',
      source: 'checkup_item',
      blocksMeasurement: false,
      blocksAutoStart: false,
      voiceCue: null,
      metricProtected: true,
      reason: 'checkup:active',
    });
  });

  it('maps camera unavailable to lost for Check-Up', () => {
    const guidance = buildCheckUpRecordingVisualGuidance({
      ...checkUpInput(),
      cameraAvailability: 'unavailable',
      itemPhase: 'active',
      measuring: true,
    });

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'camera_unavailable',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      reason: 'camera_unavailable',
    });
  });
});

describe('Micro-Check recording visual guidance adapter', () => {
  it('maps camera unavailable before any Micro-Check state', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      cameraAvailability: 'unavailable',
      runnerPhase: 'active',
      measuring: true,
    });

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'camera_unavailable',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      reason: 'camera_unavailable',
    });
  });

  it('maps no-subject side setup to lost without selecting a side', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      sideSetupActive: true,
      runnerPhase: null,
      pipelineState: 'no-subject',
      hasPose: false,
      setupPrompt: 'step-into-frame',
    });

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'micro_check_side_setup',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-into-frame',
      metricProtected: false,
      reason: 'micro_check:side-setup:no-subject',
    });
  });

  it('maps generic runner preflight adjustment from the existing setup prompt', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      runnerPhase: 'preflight',
      setupPrompt: 'step-back',
    });

    expect(guidance).toMatchObject({
      visualState: 'adjust',
      source: 'micro_check_active',
      primaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-back',
      reason: 'micro_check:active:step-back',
    });
  });

  it('maps hands-free side setup resolving from the existing resolver state', () => {
    const adjust = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      sideSetupActive: true,
      runnerPhase: null,
      sideSetupResult: sideSetupResult({ reason: 'waiting_for_side_view' }),
      setupPrompt: 'hold-still',
    });
    const tracking = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      sideSetupActive: true,
      runnerPhase: null,
      sideSetupResult: sideSetupResult({ reason: 'hold_still' }),
      setupPrompt: 'hold-still',
    });

    expect(adjust).toMatchObject({
      visualState: 'adjust',
      source: 'micro_check_side_setup',
      blocksMeasurement: true,
      blocksAutoStart: true,
      reason: 'micro_check:side-setup:waiting_for_side_view',
    });
    expect(tracking).toMatchObject({
      visualState: 'tracking',
      source: 'micro_check_side_setup',
      blocksMeasurement: true,
      blocksAutoStart: true,
      reason: 'micro_check:side-setup:hold_still',
    });
  });

  it('only maps side setup ready when the existing resolver reports ready', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      sideSetupActive: true,
      runnerPhase: null,
      sideSetupResult: sideSetupResult({
        ready: true,
        selectedSide: 'left',
        observedSide: 'left',
        source: 'camera_inferred',
        reason: 'ready',
      }),
      setupPrompt: 'ready',
    });

    expect(guidance).toMatchObject({
      visualState: 'ready',
      source: 'micro_check_side_setup',
      blocksMeasurement: true,
      blocksAutoStart: false,
      voiceCue: null,
      reason: 'micro_check:side-setup:ready',
    });
  });

  it('maps countdown to ready while preserving the tracked-go boundary', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      runnerPhase: 'countdown',
      setupPrompt: null,
    });

    expect(guidance).toMatchObject({
      visualState: 'ready',
      source: 'micro_check_active',
      blocksMeasurement: true,
      blocksAutoStart: false,
      metricProtected: true,
      voiceCue: null,
      reason: 'micro_check:active:countdown',
    });
  });

  it('maps active measurement to active only from the existing runner measuring flag', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      runnerPhase: 'active',
      measuring: true,
      setupPrompt: null,
    });

    expect(guidance).toMatchObject({
      visualState: 'active',
      source: 'micro_check_active',
      blocksMeasurement: false,
      blocksAutoStart: false,
      metricProtected: true,
      voiceCue: null,
      reason: 'micro_check:active:measuring',
    });
  });

  it('maps active tracking loss to recovery with metric protection', () => {
    const guidance = buildMicroCheckRecordingVisualGuidance({
      ...microCheckInput(),
      runnerPhase: 'active',
      pipelineState: 'interrupted',
      measuring: false,
    });

    expect(guidance).toMatchObject({
      visualState: 'recovery',
      source: 'micro_check_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      voiceCue: null,
      reason: 'micro_check:active:interrupted',
    });
  });
});

describe('Training recording visual guidance adapter', () => {
  it('maps camera unavailable before any Training state', () => {
    const guidance = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      cameraAvailability: 'unavailable',
      phase: 'set',
      measuring: true,
    });

    expect(guidance).toMatchObject({
      visualState: 'lost',
      source: 'camera_unavailable',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      reason: 'camera_unavailable',
    });
  });

  it('maps no-subject and interrupted tracking from pipeline state only', () => {
    const lost = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      pipelineState: 'no-subject',
      hasPose: false,
      setupPrompt: 'step-into-frame',
    });
    const recovery = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'set',
      pipelineState: 'interrupted',
      measuring: true,
    });

    expect(lost).toMatchObject({
      visualState: 'lost',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-into-frame',
      reason: 'training:active:no-subject',
    });
    expect(recovery).toMatchObject({
      visualState: 'recovery',
      source: 'training_active',
      metricProtected: true,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      reason: 'training:active:interrupted',
    });
  });

  it('maps generic preflight and setup prompts without replacing Training notice text', () => {
    const guidance = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'preflight',
      setupPrompt: 'step-back',
    });

    expect(guidance).toMatchObject({
      visualState: 'adjust',
      source: 'training_active',
      primaryText: null,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: 'step-back',
      reason: 'training:active:step-back',
    });
  });

  it('maps floor setup through the training_floor_setup source', () => {
    const adjust = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'instructions',
      floorSetup: floorSetup({ phase: 'movement_setup' }),
    });
    const tracking = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'instructions',
      floorSetup: floorSetup({ phase: 'stabilizing' }),
    });
    const ready = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'instructions',
      floorSetup: floorSetup({ phase: 'ready', movementReady: true }),
    });

    expect(adjust).toMatchObject({
      visualState: 'adjust',
      source: 'training_floor_setup',
      blocksMeasurement: true,
      blocksAutoStart: true,
      reason: 'training:floor:movement_setup',
    });
    expect(tracking).toMatchObject({
      visualState: 'tracking',
      source: 'training_floor_setup',
      reason: 'training:floor:stabilizing',
    });
    expect(ready).toMatchObject({
      visualState: 'ready',
      source: 'training_floor_setup',
      blocksMeasurement: true,
      blocksAutoStart: false,
      reason: 'training:floor:ready',
    });
  });

  it('maps countdown to ready while protecting footer metrics and preserving tracked-go ownership', () => {
    const guidance = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'countdown',
      setupPrompt: null,
    });

    expect(guidance).toMatchObject({
      visualState: 'ready',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: false,
      metricProtected: true,
      voiceCue: null,
      reason: 'training:active:countdown',
    });
  });

  it('maps active measurement to active from existing Training set state', () => {
    const guidance = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'set',
      measuring: true,
      setupPrompt: null,
    });

    expect(guidance).toMatchObject({
      visualState: 'active',
      source: 'training_active',
      blocksMeasurement: false,
      blocksAutoStart: false,
      metricProtected: true,
      voiceCue: null,
      reason: 'training:active:measuring',
    });
  });

  it('maps valid-time and step-up recovery states with metric protection', () => {
    const validTime = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'set',
      validTimeCaption: 'Tracking paused. Reset your position.',
    });
    const stepUp = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'set',
      stepUpCorrection: { code: 'wrong_lead', expectedLeadSide: 'left' },
    });

    expect(validTime).toMatchObject({
      visualState: 'recovery',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      reason: 'training:active:valid-time',
    });
    expect(stepUp).toMatchObject({
      visualState: 'adjust',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      reason: 'training:active:step-up:wrong_lead',
    });
  });

  it('maps rest and completed states without claiming measurement authority', () => {
    const rest = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'rest',
      setupPrompt: null,
    });
    const complete = buildTrainingRecordingVisualGuidance({
      ...trainingInput(),
      phase: 'complete',
      setupPrompt: null,
    });

    expect(rest).toMatchObject({
      visualState: 'tracking',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      reason: 'training:active:rest',
    });
    expect(complete).toMatchObject({
      visualState: 'tracking',
      source: 'training_active',
      blocksMeasurement: true,
      blocksAutoStart: true,
      reason: 'training:active:complete',
    });
  });
});

function pipelineOutput(state: TrackingState, hasPose: boolean): PipelineFrameOutput {
  return {
    state,
    rawFrame: { hasPose },
    displayFrame: { hasPose },
    frame: { hasPose, timestampMs: 1000 },
  } as PipelineFrameOutput;
}

function preflightStatus(
  phase: PreflightStatus['phase'],
  prompt: PreflightStatus['prompt']
): PreflightStatus {
  return {
    phase,
    prompt,
    bodyHeightFraction: 0.62,
    sampleProgress: phase === 'ready' ? 1 : 0,
  };
}

function checkUpInput(): Parameters<typeof buildCheckUpRecordingVisualGuidance>[0] {
  return {
    cameraAvailability: 'available',
    pipelineState: 'tracking',
    hasPose: true,
    checkUpPhase: 'item',
    itemPhase: 'preflight',
    setupIssue: false,
    setupPrompt: 'hold-still',
    setupCaption: null,
    measuring: false,
  };
}

function microCheckInput(): Parameters<typeof buildMicroCheckRecordingVisualGuidance>[0] {
  return {
    cameraAvailability: 'available',
    pipelineState: 'tracking',
    hasPose: true,
    sideSetupActive: false,
    sideSetupResult: null,
    runnerPhase: 'preflight',
    setupPrompt: 'hold-still',
    measuring: false,
  };
}

function trainingInput(): Parameters<typeof buildTrainingRecordingVisualGuidance>[0] {
  return {
    cameraAvailability: 'available',
    pipelineState: 'tracking',
    hasPose: true,
    phase: 'preflight',
    setupPrompt: 'hold-still',
    setupIssue: false,
    floorSetup: null,
    validTimeCaption: null,
    stepUpCorrection: null,
    measuring: false,
  };
}

function floorSetup(
  overrides: Partial<TrainingFloorSetupSnapshot> = {}
): TrainingFloorSetupSnapshot {
  return {
    exerciseId: 'glute-bridge',
    itemIndex: 0,
    setIndex: 0,
    setupEpoch: 1,
    phase: 'movement_setup',
    floorTransitionRequired: true,
    userConfirmed: false,
    movementReady: false,
    finalPositionReadyAtMs: null,
    stableForMs: 0,
    setupCaption: 'Move safely to the floor.',
    actionLabel: null,
    fallbackAvailable: false,
    readinessSource: null,
    ...overrides,
  };
}

function sideSetupResult(
  overrides: Partial<MicroCheckCameraSideSetupResult> = {}
): MicroCheckCameraSideSetupResult {
  return {
    ready: false,
    selectedSide: null,
    observedSide: null,
    source: null,
    stableForMs: 0,
    fallbackAvailable: false,
    reason: 'waiting_for_tracking',
    setupCaption: '',
    ...overrides,
  };
}

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
