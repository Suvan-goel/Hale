/**
 * End-to-end voice-guided flow, fully headless: synthetic chair-stand
 * recording → PosePipeline + PreflightCheck + SessionController, with a fake
 * playback model (each cue "plays" for a fixed duration). Deterministic —
 * all timing comes from frame timestamps.
 */

import { VoiceCueKey } from '../../audio/cues';
import { CHAIR_STAND_ID, ChairStandResult, getMovement } from '../../movements';
import { PosePipeline } from '../../pose/pipeline';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { makeFrame, mulberry32, timestamps30fps } from '../../pose/testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent, RawLandmarkEvent } from '../../pose/types';
import type { MovementCameraReadinessResult } from '../../preflight/movementCameraReadiness';
import { MovementCameraReadinessTracker } from '../../preflight/movementCameraReadiness';
import { PreflightCheck } from '../../preflight/preflight';
import type { PreflightPrompt, PreflightStatus } from '../../preflight/preflight';
import { AssessmentPhase, SessionController } from '../sessionController';

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
});
