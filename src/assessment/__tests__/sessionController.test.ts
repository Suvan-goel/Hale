/**
 * End-to-end voice-guided flow, fully headless: synthetic chair-stand
 * recording → PosePipeline + PreflightCheck + SessionController, with a fake
 * playback model (each cue "plays" for a fixed duration). Deterministic —
 * all timing comes from frame timestamps.
 */

import { VoiceCueKey } from '../../audio/cues';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  ChairStandResult,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  getMovement,
} from '../../movements';
import type { MovementDefinition, MovementResultBase } from '../../movements/types';
import { PosePipeline } from '../../pose/pipeline';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { makeFrame, mulberry32, timestamps30fps } from '../../pose/testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent, RawLandmarkEvent } from '../../pose/types';
import type { MovementCameraReadinessResult } from '../../preflight/movementCameraReadiness';
import { MovementCameraReadinessTracker } from '../../preflight/movementCameraReadiness';
import { PreflightCheck } from '../../preflight/preflight';
import type { PreflightPrompt, PreflightStatus } from '../../preflight/preflight';
import { AssessmentPhase, DEFAULT_SESSION_CONFIG, SessionController } from '../sessionController';

const CUE_PLAY_MS = 1800; // fake per-line playback duration

interface FlowRun {
  phases: AssessmentPhase[];
  spoken: VoiceCueKey[];
  repSounds: number;
  finalRepCount: number;
  controller: SessionController<ChairStandResult>;
}

function runFlow(frames: RawLandmarkEvent[]): FlowRun {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const definition = getMovement(CHAIR_STAND_ID);
  const controller = new SessionController<ChairStandResult>(definition as never);
  const cameraReadiness = new MovementCameraReadinessTracker();

  const phases: AssessmentPhase[] = [];
  const spoken: VoiceCueKey[] = [];
  let repSounds = 0;
  let finalRepCount = 0;
  let voiceBusyUntil = -1;

  for (const frame of frames) {
    const out = pipeline.process(frame);
    const status = preflight.update(out);
    const cameraStatus = cameraReadiness.update(out, definition.cameraView);
    const voiceBusy = frame.timestampMs < voiceBusyUntil;
    const update = controller.update(out, status, cameraStatus, voiceBusy);

    if (update.voice) {
      spoken.push(...update.voice.cues);
      voiceBusyUntil = frame.timestampMs + update.voice.cues.length * CUE_PLAY_MS;
    }
    if (update.playRepSound) repSounds++;
    finalRepCount = update.repCount;
    if (phases[phases.length - 1] !== update.phase) phases.push(update.phase);
  }
  return { phases, spoken, repSounds, finalRepCount, controller };
}

function outputAt(timestampMs: number): PipelineFrameOutput {
  return {
    frame: { timestampMs },
    bodyUnit: null,
  } as PipelineFrameOutput;
}

function trackingOutputAt(timestampMs: number): PipelineFrameOutput {
  return outputFromRaw(makeFrame(timestampMs, mulberry32(500 + timestampMs), { noiseAmp: 0 }));
}

function framingStatus(prompt: PreflightPrompt): PreflightStatus {
  return {
    phase: 'framing',
    prompt,
    bodyHeightFraction: 0.7,
    sampleProgress: 0,
  };
}

function readyStatus(): PreflightStatus {
  return {
    phase: 'ready',
    prompt: 'ready',
    bodyHeightFraction: 0.7,
    sampleProgress: 1,
  };
}

function cameraReady(overrides: Partial<MovementCameraReadinessResult> = {}): MovementCameraReadinessResult {
  return {
    ready: true,
    requiredView: 'side',
    detectedView: 'side',
    requiredReliableSideChains: 1,
    reliableSideChains: 1,
    stableForMs: 500,
    reason: 'ready',
    promptCue: 'hold-still',
    setupCaption: null,
    ...overrides,
  };
}

function cameraBlocked(overrides: Partial<MovementCameraReadinessResult>): MovementCameraReadinessResult {
  return cameraReady({
    ready: false,
    stableForMs: 0,
    ...overrides,
  });
}

function outputFromRaw(raw: RawLandmarkEvent): PipelineFrameOutput {
  const frame = createPoseFrame();
  parseLandmarkEvent(raw, frame);
  return {
    state: 'tracking',
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability: new Float64Array([0.95, 0.95]),
    reliableSideChains: 2,
    validity: { valid: true, reason: 'ok' },
    bodyUnit: 0.32,
    events: [],
    fps: 30,
  };
}

describe('SessionController — voice-guided chair stand', () => {
  it('runs the full flow: preflight → instructions → countdown → active → result → done', () => {
    // The subject stands (listening) for 15s, then performs 8 reps; the 30s
    // active window opens at ~14s and covers all 8 rises.
    const session = chairStandSession({
      seed: 909,
      calibrationMs: 15000,
      riseMsPerRep: [1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200],
      tailMs: 9000,
    });
    const run = runFlow(session.frames);

    expect(run.phases).toEqual([
      'preflight', 'instructions', 'countdown', 'active', 'result', 'done',
    ]);

    // Voice script in order: framing-ready + instructions, full countdown,
    // time call, stitched result sentence.
    const ordered: VoiceCueKey[] = [
      'framing-ready', 'chair-stand-intro', 'chair-stand-setup',
      'countdown-three', 'countdown-two', 'countdown-one', 'go',
      'times-up', 'you-completed', 'num-8', 'stands-suffix',
    ];
    const indices = ordered.map((cue) => run.spoken.indexOf(cue));
    for (let i = 0; i < indices.length; i++) {
      expect({ cue: ordered[i], at: indices[i] }).toEqual({ cue: ordered[i], at: expect.any(Number) });
      expect(indices[i]).toBeGreaterThanOrEqual(0);
      if (i > 0) expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }

    expect(run.repSounds).toBe(8);
    expect(run.finalRepCount).toBe(8);
    const result = run.controller.result as ChairStandResult;
    expect(result.reps).toBe(8);
    expect(result.sessionMeanVel).toBeGreaterThan(0);
  });

  it('throttles an unchanged framing prompt', () => {
    // 12s of empty frames: 'step-into-frame' repeats at promptRepeatMs (10s),
    // not per frame.
    const frames: RawLandmarkEvent[] = timestamps30fps(0, 360).map((t) => ({
      timestampMs: t,
      landmarks: [],
    }));
    const run = runFlow(frames);
    expect(run.phases).toEqual(['preflight']);
    const prompts = run.spoken.filter((c) => c === 'step-into-frame');
    expect(prompts.length).toBeGreaterThanOrEqual(1);
    expect(prompts.length).toBeLessThanOrEqual(2); // ~12s / 10s + first
  });

  it('speaks a changed prompt after the gentle framing-prompt gap', () => {
    const controller = new SessionController<ChairStandResult>(
      getMovement(CHAIR_STAND_ID) as never
    );
    const spoken: VoiceCueKey[] = [];
    const update = (timestampMs: number, prompt: PreflightPrompt) => {
      const result = controller.update(outputAt(timestampMs), framingStatus(prompt), cameraReady(), false);
      if (result.voice) spoken.push(...result.voice.cues);
    };

    update(0, 'step-back');
    update(4999, 'step-closer');
    update(5000, 'step-closer');

    expect(spoken).toEqual(['step-back', 'step-closer']);
  });

  it('does not enter instructions when the movement-specific view is wrong', () => {
    const definition = getMovement(CHAIR_STAND_ID);
    const controller = new SessionController<ChairStandResult>(definition as never);
    const readiness = new MovementCameraReadinessTracker({ stableMs: 500 });
    const front = outputFromRaw(makeFrame(0, mulberry32(5), { noiseAmp: 0 }));
    const cameraStatus = readiness.update(front, definition.cameraView);

    const update = controller.update(front, readyStatus(), cameraStatus, false);

    expect(update.phase).toBe('preflight');
    expect(update.setupCaption).toBe('Turn so your side faces the camera.');
    expect(update.voice?.cues).toEqual(['turn-side-on']);
  });

  it.each([
    [
      'chair stand side-view countdown',
      CHAIR_STAND_ID,
      cameraBlocked({
        requiredView: 'side',
        detectedView: 'front',
        reason: 'turn-side-on',
        promptCue: 'turn-side-on',
        setupCaption: 'Turn so your side faces the camera.',
      }),
    ],
    [
      'balance ladder front-view countdown',
      BALANCE_LADDER_ID,
      cameraBlocked({
        requiredView: 'front',
        detectedView: 'side',
        requiredReliableSideChains: 2,
        reason: 'face-camera',
        promptCue: 'face-forward',
        setupCaption: 'Turn to face the camera.',
      }),
    ],
    [
      'shoulder flexion ambiguous side-view countdown',
      SHOULDER_FLEXION_ID,
      cameraBlocked({
        requiredView: 'side',
        detectedView: 'ambiguous',
        reason: 'ambiguous-view',
        promptCue: 'turn-side-on',
        setupCaption: 'Turn a little more so your side faces the camera.',
      }),
    ],
    [
      'hinge reach chain-loss countdown',
      HINGE_REACH_ID,
      cameraBlocked({
        requiredView: 'side',
        detectedView: 'side',
        reliableSideChains: 0,
        reason: 'insufficient-reliable-chains',
        promptCue: 'step-into-frame',
        setupCaption: 'Make sure your whole body is visible.',
      }),
    ],
  ])('invalidates %s and requires setup again before active measurement', (_name, movementId, invalidCamera) => {
    const definition = getMovement(movementId);
    const controller = new SessionController(definition as never, {
      ...DEFAULT_SESSION_CONFIG,
      postInstructionsDwellMs: 0,
    });
    const readyCamera = cameraReady({
      requiredView: definition.cameraView.view,
      requiredReliableSideChains: definition.cameraView.requiredReliableSideChains,
    });

    expect(controller.update(trackingOutputAt(0), readyStatus(), readyCamera, false).phase).toBe('instructions');
    expect(controller.update(trackingOutputAt(1000), readyStatus(), readyCamera, false)).toMatchObject({
      phase: 'countdown',
      voice: { cues: ['countdown-three'] },
    });

    const invalidated = controller.update(trackingOutputAt(1500), readyStatus(), invalidCamera, false);
    expect(invalidated).toMatchObject({
      phase: 'preflight',
      setupCaption: invalidCamera.setupCaption,
      voice: { cues: [invalidCamera.promptCue] },
      measuring: false,
    });

    const staleGoTime = controller.update(trackingOutputAt(5000), readyStatus(), invalidCamera, false);
    expect(staleGoTime.phase).toBe('preflight');
    expect(staleGoTime.measuring).toBe(false);
    expect(controller.result).toBeNull();
  });

  it('passes active camera failures to the grader only as tracking-interrupted frames until reacquired', () => {
    const seen: Array<{ state: string; eventTypes: string[]; timestampMs: number }> = [];
    const result: MovementResultBase = { movementId: 'probe', flags: [], interruptions: 0 };
    const definition: MovementDefinition<MovementResultBase> = {
      id: 'probe',
      displayName: 'Probe',
      cameraView: { view: 'side', requiredReliableSideChains: 1 },
      equipment: ['none'],
      durationMs: 2000,
      voice: { instructions: [] },
      createGrader: () => ({
        update: (out) => {
          seen.push({
            state: out.state,
            eventTypes: out.events.map((event) => event.type),
            timestampMs: out.frame.timestampMs,
          });
          return {
            repCredited: false,
            repCount: 0,
            measuring: out.state === 'tracking',
            complete: false,
            voice: null,
          };
        },
        finish: () => result,
        reset: () => {},
      }),
      resultCues: () => [],
    };
    const controller = new SessionController(definition, {
      ...DEFAULT_SESSION_CONFIG,
      postInstructionsDwellMs: 0,
    });
    const readyCamera = cameraReady();
    const blockedCamera = cameraBlocked({
      requiredView: 'side',
      detectedView: 'front',
      reason: 'turn-side-on',
      promptCue: 'turn-side-on',
      setupCaption: 'Turn so your side faces the camera.',
    });

    controller.update(trackingOutputAt(0), readyStatus(), readyCamera, false);
    controller.update(trackingOutputAt(1000), readyStatus(), readyCamera, false);
    controller.update(trackingOutputAt(2000), readyStatus(), readyCamera, false);
    controller.update(trackingOutputAt(3000), readyStatus(), readyCamera, false);
    expect(controller.update(trackingOutputAt(4000), readyStatus(), readyCamera, false)).toMatchObject({
      phase: 'active',
      voice: { cues: ['go'] },
    });

    expect(controller.update(trackingOutputAt(4100), readyStatus(), readyCamera, false)).toMatchObject({
      phase: 'active',
      measuring: true,
    });
    const firstBlocked = { ...controller.update(trackingOutputAt(4200), readyStatus(), blockedCamera, false) };
    const stillBlocked = { ...controller.update(trackingOutputAt(4300), readyStatus(), blockedCamera, false) };
    const reacquired = { ...controller.update(trackingOutputAt(4400), readyStatus(), readyCamera, false) };

    expect(firstBlocked).toMatchObject({ phase: 'active', measuring: false, setupCaption: blockedCamera.setupCaption });
    expect(stillBlocked).toMatchObject({ phase: 'active', measuring: false, setupCaption: blockedCamera.setupCaption });
    expect(reacquired).toMatchObject({ phase: 'active', measuring: true, setupCaption: null });
    expect(seen).toEqual([
      { state: 'tracking', eventTypes: [], timestampMs: 4100 },
      { state: 'interrupted', eventTypes: ['tracking-interrupted'], timestampMs: 4200 },
      { state: 'interrupted', eventTypes: [], timestampMs: 4300 },
      { state: 'tracking', eventTypes: [], timestampMs: 4400 },
    ]);
  });
});
