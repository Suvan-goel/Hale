/**
 * Weekly micro-check: the runner produces a usable result from a short
 * recording (5 fast chair stands → rise velocity; a single-leg hold → seconds),
 * and that result feeds the EXISTING trend line (computeTrends merges the
 * micro-check point into rise-velocity / single-leg-balance and re-sorts).
 */

import type { VoiceCueKey } from '../../audio/cues';
import { PosePipeline } from '../../pose/pipeline';
import { balanceSession } from '../../pose/testing/syntheticBalance';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { hingeReachSession } from '../../pose/testing/syntheticRom';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
import {
  DEFAULT_MICROCHECK_CONFIG,
  MicroCheckResult,
  MicroCheckRunner,
  MicroCheckType,
} from '../microCheck';

const FRAME_STEP_MS = Math.round(1000 / 30);

function pad(rec: RawLandmarkEvent[], totalFrames: number): RawLandmarkEvent[] {
  const out = rec.slice();
  let ts = out.length > 0 ? out[out.length - 1].timestampMs : 0;
  const last = out.length > 0 ? out[out.length - 1].landmarks : [];
  while (out.length < totalFrames) {
    ts += FRAME_STEP_MS;
    out.push({ timestampMs: ts, landmarks: last });
  }
  return out;
}

function runMicroCheck(type: MicroCheckType, frames: RawLandmarkEvent[]): MicroCheckResult | null {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const runner = new MicroCheckRunner(type, '2026-06-21T08:00:00.000Z', preflight, DEFAULT_MICROCHECK_CONFIG);
  let voiceBusyUntil = -1;
  for (const frame of frames) {
    const out = pipeline.process(frame);
    const u = runner.update(out, frame.timestampMs < voiceBusyUntil);
    if (u.voice) voiceBusyUntil = frame.timestampMs + u.voice.cues.length * 1200;
    if (u.phase === 'done') break;
  }
  return runner.result;
}

function firstInstructionCues(
  type: MicroCheckType,
  frames: RawLandmarkEvent[],
  options: ConstructorParameters<typeof MicroCheckRunner>[5] = {}
): VoiceCueKey[] {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const runner = new MicroCheckRunner(
    type,
    '2026-06-21T08:00:00.000Z',
    preflight,
    DEFAULT_MICROCHECK_CONFIG,
    null,
    options
  );
  for (const frame of frames) {
    const out = pipeline.process(frame);
    const u = runner.update(out, false);
    if (u.phase === 'instructions' && u.voice) return u.voice.cues as VoiceCueKey[];
  }
  return [];
}

describe('MicroCheckRunner', () => {
  it('chair-power: measures rise velocity from a few fast stands', () => {
    const session = chairStandSession({ seed: 71, calibrationMs: 16000, riseMsPerRep: [800, 800, 800, 800, 800, 800] });
    const result = runMicroCheck('chair-power', pad(session.frames, 2000));
    expect(result).not.toBeNull();
    expect(result!.measured).toBe(true);
    expect(result!.reps).toBeGreaterThanOrEqual(DEFAULT_MICROCHECK_CONFIG.chairTargetReps);
    expect(Number.isFinite(result!.value)).toBe(true);
    expect(result!.value).toBeGreaterThan(0);
    expect(result!.measurementContext).toMatchObject({
      protocol: { protocolId: 'micro_chair_power_5_reps_v1', protocolVersion: 1 },
      side: { role: 'not_applicable' },
      comparability: { sideStatus: 'not_side_dependent' },
    });
  });

  it('single-leg-balance: measures a hold in seconds', () => {
    const session = balanceSession({
      seed: 72,
      calibrationMs: 14000,
      stages: [{ stance: 'single-leg', windowMs: 12000, outcome: 'completed' }],
    });
    const result = runMicroCheck('single-leg-balance', pad(session.frames, 2500));
    expect(result).not.toBeNull();
    expect(result!.measured).toBe(true);
    expect(result!.value).toBeGreaterThan(4);
  });

  it('mobility-reach: captures the official standing forward reach distance', () => {
    const session = hingeReachSession({ seed: 73, calibrationMs: 14000, peakFoldDeg: 82 });
    const result = runMicroCheck('mobility-reach', pad(session.frames, 2600));
    expect(result).not.toBeNull();
    expect(result!.measured).toBe(true);
    expect(result!.reps).toBe(0);
    expect(result!.value).toBeGreaterThan(0);
    expect(result!.value).toBeLessThan(0.45);
    expect(result!.measurementContext).toMatchObject({
      protocol: { protocolId: 'micro_mobility_reach_v1', protocolVersion: 1 },
      side: { role: 'not_applicable' },
    });
  });

  it('mobility-reach uses the exact Micro-Check V2.1 setup cue when V2.1 is selected', () => {
    const session = hingeReachSession({ seed: 74, calibrationMs: 14000, peakFoldDeg: 70 });
    expect(
      firstInstructionCues('mobility-reach', pad(session.frames, 400), { voiceMode: 'v21_beta' })
    ).toEqual(['framing-ready', 'micro-mobility-left-v21']);
    expect(
      firstInstructionCues('mobility-reach', pad(session.frames, 400))
    ).toEqual(['framing-ready', 'hinge-intro', 'hinge-setup']);
  });
});

describe('micro-check pause measurement integrity', () => {
  it('a paused single-leg measurement restarts fresh and is not inflated by the gap', () => {
    const session = balanceSession({
      seed: 75,
      calibrationMs: 14000,
      stages: [{ stance: 'single-leg', windowMs: 25000, outcome: 'completed' }],
    });
    const frames = pad(session.frames, 3500);
    const pipeline = new PosePipeline();
    const preflight = new PreflightCheck();
    const runner = new MicroCheckRunner(
      'single-leg-balance',
      '2026-06-21T08:00:00.000Z',
      preflight,
      DEFAULT_MICROCHECK_CONFIG
    );
    const PAUSE_MS = 45000;
    let voiceBusyUntil = -1;
    let offset = 0;
    let pausedOnce = false;
    let sawInstructionsAfterReset = false;

    for (const raw of frames) {
      const frame = offset === 0 ? raw : { ...raw, timestampMs: raw.timestampMs + offset };
      const out = pipeline.process(frame);
      const u = runner.update(out, frame.timestampMs < voiceBusyUntil);
      if (u.voice) voiceBusyUntil = frame.timestampMs + u.voice.cues.length * 1200;
      if (pausedOnce && u.phase === 'instructions') sawInstructionsAfterReset = true;
      if (!pausedOnce && u.phase === 'active' && Number.isFinite(u.holdSec) && u.holdSec > 1) {
        // Screen pause mid-hold: measurement discarded; a long wall-clock gap
        // passes; on resume the screen shifts the runner's clocks by the gap.
        expect(runner.resetActiveMeasurement(frame.timestampMs)).toBe(true);
        runner.shiftTiming(PAUSE_MS);
        offset = PAUSE_MS;
        pausedOnce = true;
      }
      if (u.phase === 'done') break;
    }

    expect(pausedOnce).toBe(true);
    expect(sawInstructionsAfterReset).toBe(true);
    const result = runner.result;
    expect(result).not.toBeNull();
    expect(result!.measured).toBe(true);
    // The redone hold is a fresh measurement: nowhere near the 45s pause gap
    // (nor the 40s target cap a stitched hold would have been credited to).
    expect(result!.value).toBeGreaterThan(1);
    expect(result!.value).toBeLessThan(30);
  });
});
