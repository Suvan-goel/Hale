import type { PipelineFrameOutput } from '../pose/pipeline';
import type { GraderUpdate, MovementGrader, MovementResultBase } from './types';

const UPDATE: GraderUpdate = {
  repCredited: false,
  repCount: 0,
  measuring: false,
  complete: false,
  voice: null,
};

/**
 * V2 protocol movements require typed setup/practice/retry controllers before
 * camera preflight. This fallback prevents accidental generic SessionController
 * use from creating a usable measurement.
 */
export class ProtocolOnlyGrader<R extends MovementResultBase> implements MovementGrader<R> {
  private readonly resultFactory: () => R;

  constructor(resultFactory: () => R) {
    this.resultFactory = resultFactory;
  }

  update(_out: PipelineFrameOutput): GraderUpdate {
    return UPDATE;
  }

  finish(): R {
    return this.resultFactory();
  }

  reset(): void {
    // Stateless by design.
  }
}
