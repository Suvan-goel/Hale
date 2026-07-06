/**
 * Headless grading replay: feed a landmark recording through the full
 * PosePipeline AND a movement grader, exactly as the app would on-device.
 * Used by the acceptance tests and the noise-floor analysis CLI.
 *
 * The whole recording is the active window (recordings for analysis start at
 * the calibration stance and end after the last rep); tests wanting a timed
 * window slice the frame array first.
 */

import { getMovement, MovementResultBase } from '../movements';
import { DEFAULT_PIPELINE_CONFIG, PipelineConfig, PosePipeline } from '../pose/pipeline';
import { RawLandmarkEvent } from '../pose/types';

export interface GradedReplay<R extends MovementResultBase = MovementResultBase> {
  result: R;
  bodyUnit: number | null;
  frameCount: number;
  trackingFrames: number;
  /** Frames where the grader was actually measuring. */
  measuringFrames: number;
  /** Timestamp of the first measuring frame; NaN if none (corpus start-latency metric). */
  firstMeasuringTimestampMs: number;
  repCreditTimestampsMs: number[];
}

export function gradeRecording<R extends MovementResultBase = MovementResultBase>(
  movementId: string,
  frames: RawLandmarkEvent[],
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): GradedReplay<R> {
  const pipeline = new PosePipeline(config);
  const grader = getMovement(movementId).createGrader();

  let trackingFrames = 0;
  let measuringFrames = 0;
  let firstMeasuringTimestampMs = NaN;
  let bodyUnit: number | null = null;
  const repCreditTimestampsMs: number[] = [];

  for (const frame of frames) {
    const out = pipeline.process(frame);
    const update = grader.update(out);
    if (out.state === 'tracking') trackingFrames++;
    if (update.measuring) {
      measuringFrames++;
      if (Number.isNaN(firstMeasuringTimestampMs)) firstMeasuringTimestampMs = frame.timestampMs;
    }
    if (update.repCredited) repCreditTimestampsMs.push(frame.timestampMs);
    bodyUnit = out.bodyUnit;
  }

  const lastTs = frames.length > 0 ? frames[frames.length - 1].timestampMs : 0;
  return {
    result: grader.finish(lastTs) as R,
    bodyUnit,
    frameCount: frames.length,
    trackingFrames,
    measuringFrames,
    firstMeasuringTimestampMs,
    repCreditTimestampsMs,
  };
}
