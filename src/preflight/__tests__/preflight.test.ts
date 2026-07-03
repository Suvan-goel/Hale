import { PosePipeline } from '../../pose/pipeline';
import { makeFrame, mulberry32, SyntheticFrameOptions, timestamps30fps } from '../../pose/testing/syntheticPose';
import {
  PreflightCheck,
  PreflightPhase,
  PreflightPrompt,
  TRAINING_PREFLIGHT_CONFIG,
} from '../preflight';

interface Trace {
  phases: PreflightPhase[];
  prompts: PreflightPrompt[];
  last: { phase: PreflightPhase; prompt: PreflightPrompt; sampleProgress: number };
}

function runPreflight(
  segments: Array<{ startMs: number; frames: number; options?: SyntheticFrameOptions; seed?: number }>
): Trace {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const phases: PreflightPhase[] = [];
  const prompts: PreflightPrompt[] = [];
  let last = { phase: 'waiting-for-subject' as PreflightPhase, prompt: 'step-into-frame' as PreflightPrompt, sampleProgress: 0 };
  for (const segment of segments) {
    const rng = mulberry32(segment.seed ?? 99);
    for (const t of timestamps30fps(segment.startMs, segment.frames)) {
      const out = pipeline.process(makeFrame(t, rng, segment.options));
      const status = preflight.update(out);
      phases.push(status.phase);
      prompts.push(status.prompt);
      last = {
        phase: status.phase,
        prompt: status.prompt,
        sampleProgress: status.sampleProgress,
      };
    }
  }
  return { phases, prompts, last };
}

describe('PreflightCheck', () => {
  it('walks waiting → framing → sampling → ready for a well-framed stable subject', () => {
    const trace = runPreflight([{ startMs: 0, frames: 200, options: { noiseAmp: 0.002 } }]);
    expect(trace.phases).toContain('waiting-for-subject');
    expect(trace.phases).toContain('framing');
    expect(trace.phases).toContain('sampling');
    expect(trace.last.phase).toBe('ready');
    expect(trace.last.prompt).toBe('ready');
    // pre-flight overlaps pipeline warmup on purpose (warmup gates counting,
    // not framing guidance), so the floor is: subject acquisition (~233ms
    // reliability ramp) + framing stability (0.5s) + full sample (2s)
    const readyIndex = trace.phases.indexOf('ready');
    expect(readyIndex).toBeGreaterThanOrEqual(Math.floor((233 + 500 + 2000) / 33.4));
  });

  it('asks a too-distant subject to step closer', () => {
    const trace = runPreflight([
      { startMs: 0, frames: 120, options: { scale: 0.55, noiseAmp: 0.002 } },
    ]);
    expect(trace.last.phase).toBe('framing');
    expect(trace.last.prompt).toBe('step-closer');
  });

  it('asks a too-close subject to step back', () => {
    const trace = runPreflight([
      { startMs: 0, frames: 120, options: { scale: 1.3, noiseAmp: 0.002 } },
    ]);
    expect(trace.last.phase).toBe('framing');
    expect(trace.last.prompt).toBe('step-back');
  });

  it('asks an off-center subject to center themselves', () => {
    const trace = runPreflight([
      { startMs: 0, frames: 120, options: { xOffset: 0.34, noiseAmp: 0.002 } },
    ]);
    expect(trace.last.phase).toBe('framing');
    expect(trace.last.prompt).toBe('center-yourself');
  });

  it('fails the lighting sample on jittery detection and prompts for light', () => {
    // noiseAmp 0.02 ≈ dim-room jitter: validity holds but jitter sample fails
    const trace = runPreflight([{ startMs: 0, frames: 220, options: { noiseAmp: 0.02 } }]);
    expect(trace.phases).toContain('sampling');
    expect(trace.phases).toContain('failed-lighting');
    expect(trace.prompts).toContain('turn-on-light');
    expect(trace.last.phase).not.toBe('ready');
  });

  it('restarts from waiting when the subject leaves mid-sample', () => {
    const trace = runPreflight([
      { startMs: 0, frames: 80, options: { noiseAmp: 0.002 } }, // into sampling
      { startMs: 2700, frames: 15, options: { present: false } },
      { startMs: 3200, frames: 30, options: { noiseAmp: 0.002 } },
    ]);
    const sampleIdx = trace.phases.indexOf('sampling');
    expect(sampleIdx).toBeGreaterThan(0);
    expect(trace.phases.slice(sampleIdx)).toContain('waiting-for-subject');
    // after returning, preflight is re-running, not stuck ready
    expect(['framing', 'sampling', 'waiting-for-subject']).toContain(trace.last.phase);
  });

  it('re-samples and passes once lighting improves', () => {
    const trace = runPreflight([
      { startMs: 0, frames: 220, options: { noiseAmp: 0.02 } }, // fails sample
      { startMs: 7400, frames: 150, options: { noiseAmp: 0.002 } }, // light on
    ]);
    expect(trace.phases).toContain('failed-lighting');
    expect(trace.last.phase).toBe('ready');
  });
});

describe('PreflightCheck — short re-verification sample (training config)', () => {
  const FRAME_MS = 1000 / 30;
  // Full path per run: framing stability (0.5s) + full sample (2s); the short
  // path swaps the sample for 0.5s. Acquisition only applies to the first run
  // because the feed (and pipeline) keep going between resets.
  const FULL_RUN_FLOOR_FRAMES = Math.floor((500 + 2000) / FRAME_MS);
  const SHORT_RUN_CEIL_FRAMES = Math.floor((500 + 500) / FRAME_MS) + 15;

  function makeContinuousRunner(preflight: PreflightCheck) {
    const pipeline = new PosePipeline();
    const rng = mulberry32(99);
    let ts = 0;
    return function framesToReady(): number {
      let frames = 0;
      for (; frames < 400; frames++, ts += FRAME_MS) {
        const out = pipeline.process(makeFrame(Math.round(ts), rng, { noiseAmp: 0.002 }));
        if (preflight.update(out).phase === 'ready') return frames;
      }
      throw new Error('never became ready');
    };
  }

  it('after one full pass, later resets re-verify with the short sample', () => {
    const preflight = new PreflightCheck(TRAINING_PREFLIGHT_CONFIG);
    const framesToReady = makeContinuousRunner(preflight);
    expect(framesToReady()).toBeGreaterThanOrEqual(FULL_RUN_FLOOR_FRAMES);
    preflight.reset();
    expect(framesToReady()).toBeLessThanOrEqual(SHORT_RUN_CEIL_FRAMES);
  });

  it('requireFullSample restores the full sample', () => {
    const preflight = new PreflightCheck(TRAINING_PREFLIGHT_CONFIG);
    const framesToReady = makeContinuousRunner(preflight);
    framesToReady();
    preflight.requireFullSample();
    preflight.reset();
    expect(framesToReady()).toBeGreaterThanOrEqual(FULL_RUN_FLOOR_FRAMES);
  });

  it('the default (measurement) config always runs the full sample', () => {
    const preflight = new PreflightCheck();
    const framesToReady = makeContinuousRunner(preflight);
    framesToReady();
    preflight.reset();
    expect(framesToReady()).toBeGreaterThanOrEqual(FULL_RUN_FLOOR_FRAMES);
  });
});
