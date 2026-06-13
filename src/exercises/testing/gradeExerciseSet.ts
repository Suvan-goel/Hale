/**
 * Headless per-set grading replay — the exercise analogue of
 * replay/gradeRecording.ts. Feeds a landmark recording through the full
 * PosePipeline and one exercise's set grader exactly as the app would on-device,
 * surfacing the facts the training tests assert on (reps, velocity, hold time,
 * autoregulation timing, set completion). Importing this registers the catalog.
 */

import { DEFAULT_PIPELINE_CONFIG, PipelineConfig, PosePipeline } from '../../pose/pipeline';
import { RawLandmarkEvent } from '../../pose/types';
import { getExercise } from '../index';
import { SetResult } from '../types';

export interface GradedSet {
  result: SetResult;
  bodyUnit: number | null;
  measuringFrames: number;
  repCreditTimestampsMs: number[];
  /** Timestamp the autoregulation stop first fired, or null. */
  autoregFiredAtMs: number | null;
  /** Timestamp the set first reported complete (grader-terminated), or null. */
  completeAtMs: number | null;
  /** Every voice cue the grader requested, in order. */
  voiceCues: string[];
}

export function gradeExerciseSet(
  exerciseId: string,
  frames: RawLandmarkEvent[],
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): GradedSet {
  const pipeline = new PosePipeline(config);
  const grader = getExercise(exerciseId).createGrader();

  let bodyUnit: number | null = null;
  let measuringFrames = 0;
  const repCreditTimestampsMs: number[] = [];
  let autoregFiredAtMs: number | null = null;
  let completeAtMs: number | null = null;
  const voiceCues: string[] = [];

  for (const frame of frames) {
    const out = pipeline.process(frame);
    const u = grader.update(out);
    if (u.measuring) measuringFrames++;
    if (u.repCredited) repCreditTimestampsMs.push(frame.timestampMs);
    if (u.autoregulationStop && autoregFiredAtMs === null) autoregFiredAtMs = frame.timestampMs;
    if (u.complete && completeAtMs === null) completeAtMs = frame.timestampMs;
    if (u.voice) voiceCues.push(...u.voice.cues);
    bodyUnit = out.bodyUnit;
  }

  const lastTs = frames.length > 0 ? frames[frames.length - 1].timestampMs : 0;
  return {
    result: grader.finish(lastTs),
    bodyUnit,
    measuringFrames,
    repCreditTimestampsMs,
    autoregFiredAtMs,
    completeAtMs,
    voiceCues,
  };
}
