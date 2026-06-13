/**
 * Headless replay: feed recorded landmark frames through the full
 * PosePipeline and summarize what it did. Pure TS — used by the replay CLI,
 * Jest fixture tests, and (later) threshold-tuning scripts.
 *
 * This is how pose thresholds get tuned and regressions get caught without a
 * human performing chair stands at every code change.
 */

import { CHAIN_IDS, ChainId } from '../pose/chains';
import {
  DEFAULT_PIPELINE_CONFIG,
  PipelineConfig,
  PoseEvent,
  PosePipeline,
  TrackingState,
} from '../pose/pipeline';
import { RawLandmarkEvent } from '../pose/types';

export interface ReplaySummary {
  frameCount: number;
  durationMs: number;
  meanFps: number;
  finalState: TrackingState;
  bodyUnit: number | null;
  events: PoseEvent[];
  /** Frames spent in each state. */
  stateFrames: Record<TrackingState, number>;
  meanChainReliability: Record<ChainId, number>;
}

export function replayRecording(
  frames: RawLandmarkEvent[],
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): ReplaySummary {
  const pipeline = new PosePipeline(config);
  const events: PoseEvent[] = [];
  const stateFrames: Record<TrackingState, number> = {
    'no-subject': 0,
    warmup: 0,
    tracking: 0,
    interrupted: 0,
  };
  const reliabilitySums = new Float64Array(CHAIN_IDS.length);
  let finalState: TrackingState = 'no-subject';
  let bodyUnit: number | null = null;

  for (const frame of frames) {
    const out = pipeline.process(frame);
    for (const e of out.events) events.push({ ...e });
    stateFrames[out.state]++;
    for (let c = 0; c < CHAIN_IDS.length; c++) {
      reliabilitySums[c] += out.chainReliability[c];
    }
    finalState = out.state;
    bodyUnit = out.bodyUnit;
  }

  const frameCount = frames.length;
  const durationMs =
    frameCount > 1 ? frames[frameCount - 1].timestampMs - frames[0].timestampMs : 0;
  const meanChainReliability = {} as Record<ChainId, number>;
  for (let c = 0; c < CHAIN_IDS.length; c++) {
    meanChainReliability[CHAIN_IDS[c]] =
      frameCount > 0 ? round6(reliabilitySums[c] / frameCount) : 0;
  }

  return {
    frameCount,
    durationMs,
    meanFps: durationMs > 0 ? round6(((frameCount - 1) * 1000) / durationMs) : 0,
    finalState,
    bodyUnit: bodyUnit === null ? null : round6(bodyUnit),
    events,
    stateFrames,
    meanChainReliability,
  };
}

/**
 * Compares an expected summary (e.g. a committed .expected.json) against an
 * actual replay. Returns human-readable mismatch strings; empty = pass.
 * Numbers compare with a small epsilon so committed JSON (6-decimal rounding)
 * never false-fails.
 */
export function compareSummaries(
  expected: ReplaySummary,
  actual: ReplaySummary,
  epsilon = 1e-6
): string[] {
  const problems: string[] = [];
  const num = (name: string, e: number | null, a: number | null) => {
    if (e === null || a === null) {
      if (e !== a) problems.push(`${name}: expected ${e}, got ${a}`);
      return;
    }
    if (Math.abs(e - a) > epsilon) problems.push(`${name}: expected ${e}, got ${a}`);
  };

  num('frameCount', expected.frameCount, actual.frameCount);
  num('durationMs', expected.durationMs, actual.durationMs);
  num('meanFps', expected.meanFps, actual.meanFps);
  num('bodyUnit', expected.bodyUnit, actual.bodyUnit);
  if (expected.finalState !== actual.finalState) {
    problems.push(`finalState: expected ${expected.finalState}, got ${actual.finalState}`);
  }

  const expectedEvents = expected.events.map((e) => `${e.type}@${e.timestampMs}`).join(', ');
  const actualEvents = actual.events.map((e) => `${e.type}@${e.timestampMs}`).join(', ');
  if (expectedEvents !== actualEvents) {
    problems.push(`events: expected [${expectedEvents}], got [${actualEvents}]`);
  }

  for (const state of Object.keys(expected.stateFrames) as TrackingState[]) {
    num(`stateFrames.${state}`, expected.stateFrames[state], actual.stateFrames[state]);
  }
  for (const chain of CHAIN_IDS) {
    num(
      `meanChainReliability.${chain}`,
      expected.meanChainReliability[chain],
      actual.meanChainReliability[chain]
    );
  }
  return problems;
}

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
