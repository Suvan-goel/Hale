import type { PipelineFrameOutput } from '../pose/pipeline';

export type RecordingFrameSource = 'raw' | 'display';

export interface RecordingRendererHandle {
  /** Feed one pipeline output frame. Safe to call at full frame rate. */
  update(output: PipelineFrameOutput, sourceAspect: number): void;
}
