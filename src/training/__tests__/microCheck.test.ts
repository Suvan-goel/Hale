/**
 * Weekly micro-check: the runner produces a usable result from a short
 * recording (5 fast chair stands → rise velocity; a single-leg hold → seconds),
 * and that result feeds the EXISTING trend line (computeTrends merges the
 * micro-check point into rise-velocity / single-leg-balance and re-sorts).
 */

import { computeTrends } from '../../history';
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
  microCheckTrendPoints,
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

describe('MicroCheckRunner', () => {
  it('chair-power: measures rise velocity from a few fast stands', () => {
    const session = chairStandSession({ seed: 71, calibrationMs: 16000, riseMsPerRep: [800, 800, 800, 800, 800, 800] });
    const result = runMicroCheck('chair-power', pad(session.frames, 2000));
    expect(result).not.toBeNull();
    expect(result!.measured).toBe(true);
    expect(result!.reps).toBeGreaterThanOrEqual(DEFAULT_MICROCHECK_CONFIG.chairTargetReps);
    expect(Number.isFinite(result!.value)).toBe(true);
    expect(result!.value).toBeGreaterThan(0);
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

  it('mobility-reach: captures a comfortable reach angle', () => {
    const session = hingeReachSession({ seed: 73, calibrationMs: 14000, peakFoldDeg: 82 });
    const result = runMicroCheck('mobility-reach', pad(session.frames, 2600));
    expect(result).not.toBeNull();
    expect(result!.measured).toBe(true);
    expect(result!.reps).toBe(0);
    expect(result!.value).toBeLessThan(150);
  });
});

describe('micro-checks feed the trend line', () => {
  it('maps results to the right metric keys and skips unmeasured ones', () => {
    const results: MicroCheckResult[] = [
      { type: 'chair-power', startedAt: '2026-06-21T08:00:00.000Z', value: 0.42, reps: 5, measured: true },
      { type: 'single-leg-balance', startedAt: '2026-06-21T08:05:00.000Z', value: 18, reps: 0, measured: true },
      { type: 'mobility-reach', startedAt: '2026-06-21T08:08:00.000Z', value: 126, reps: 0, measured: true },
      { type: 'chair-power', startedAt: '2026-06-21T08:10:00.000Z', value: NaN, reps: 0, measured: false },
    ];
    const points = microCheckTrendPoints(results);
    expect(points).toHaveLength(3);
    expect(points.find((p) => p.key === 'rise-velocity')!.value).toBeCloseTo(0.42, 5);
    expect(points.find((p) => p.key === 'single-leg-balance')!.value).toBe(18);
    expect(points.find((p) => p.key === 'seated-reach-angle')!.value).toBe(126);
  });

  it('merges micro-check points into computeTrends, chronologically', () => {
    const extra = microCheckTrendPoints([
      { type: 'chair-power', startedAt: '2026-06-10T08:00:00.000Z', value: 0.40, reps: 5, measured: true },
      { type: 'chair-power', startedAt: '2026-06-21T08:00:00.000Z', value: 0.46, reps: 5, measured: true },
    ]);
    const trends = computeTrends([], extra);
    const rise = trends.find((t) => t.key === 'rise-velocity')!;
    expect(rise.points.map((p) => p.value)).toEqual([0.4, 0.46]); // sorted by time
    expect(rise.delta).toBeCloseTo(0.06, 5);
  });

  it('merges mobility micro-checks into a mobility trend', () => {
    const extra = microCheckTrendPoints([
      { type: 'mobility-reach', startedAt: '2026-06-10T08:00:00.000Z', value: 132, reps: 0, measured: true },
      { type: 'mobility-reach', startedAt: '2026-06-21T08:00:00.000Z', value: 124, reps: 0, measured: true },
    ]);
    const trends = computeTrends([], extra);
    const reach = trends.find((t) => t.key === 'seated-reach-angle')!;
    expect(reach.label).toBe('Seated reach');
    expect(reach.betterIsHigher).toBe(false);
    expect(reach.delta).toBe(-8);
  });
});
