/**
 * End-to-end voice-guided flow, fully headless: synthetic chair-stand
 * recording → PosePipeline + PreflightCheck + SessionController, with a fake
 * playback model (each cue "plays" for a fixed duration). Deterministic —
 * all timing comes from frame timestamps.
 */

import { VoiceCueKey } from '../../audio/cues';
import { CHAIR_STAND_ID, ChairStandResult, getMovement } from '../../movements';
import { PosePipeline } from '../../pose/pipeline';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { makeFrame, mulberry32, timestamps30fps } from '../../pose/testing/syntheticPose';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
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
  const controller = new SessionController<ChairStandResult>(
    getMovement(CHAIR_STAND_ID) as never
  );

  const phases: AssessmentPhase[] = [];
  const spoken: VoiceCueKey[] = [];
  let repSounds = 0;
  let finalRepCount = 0;
  let voiceBusyUntil = -1;

  for (const frame of frames) {
    const out = pipeline.process(frame);
    const status = preflight.update(out);
    const voiceBusy = frame.timestampMs < voiceBusyUntil;
    const update = controller.update(out, status, voiceBusy);

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
    // 12s of empty frames: 'step-into-frame' repeats at promptRepeatMs (4s),
    // not per frame.
    const frames: RawLandmarkEvent[] = timestamps30fps(0, 360).map((t) => ({
      timestampMs: t,
      landmarks: [],
    }));
    const run = runFlow(frames);
    expect(run.phases).toEqual(['preflight']);
    const prompts = run.spoken.filter((c) => c === 'step-into-frame');
    expect(prompts.length).toBeGreaterThanOrEqual(2);
    expect(prompts.length).toBeLessThanOrEqual(4); // ~12s / 4s + first
  });

  it('speaks a changed prompt after the gentle framing-prompt gap', () => {
    const rng = mulberry32(11);
    const frames: RawLandmarkEvent[] = [
      // Subject appears but stands too close for two seconds…
      ...timestamps30fps(0, 60).map((t) => makeFrame(t, rng, { scale: 1.35 })),
      // …then steps back to a good distance long enough for the gentle prompt gap.
      ...timestamps30fps(2000, 120).map((t) => makeFrame(t, rng)),
    ];
    const run = runFlow(frames);
    expect(run.spoken).toContain('step-back');
    expect(run.spoken).toContain('hold-still');
    expect(run.spoken.indexOf('hold-still')).toBeGreaterThan(run.spoken.indexOf('step-back'));
  });
});
