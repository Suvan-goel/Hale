/**
 * TimedTaskTracker — sequential phase state machine with wall-clock per phase
 * (Timed Up and Go, floor get-up).
 *
 * The movement definition detects poses/transitions; the tracker owns
 * sequencing, debouncing, and timing. Each frame the definition reports
 * whether the ENTRY condition for the next phase currently holds (for TUG:
 * waiting→rising = seat-off, rising→walk-out = fully up, walk-out→turn =
 * hip-x velocity reversal, …, last phase → complete = re-seated).
 *
 * Entering phases[0] starts the clock; "completing" the final phase stops
 * it. Transitions commit after `debounceFrames` consecutive frames but are
 * timestamped at the FIRST frame of the run, so debouncing never inflates a
 * phase's wall-clock.
 */

export interface TimedTaskConfig {
  /** Phase names in order. */
  phases: readonly string[];
  /** Consecutive frames the next-phase entry condition must hold. */
  debounceFrames: number;
}

export interface TimedTaskOutput {
  started: boolean;
  complete: boolean;
  aborted: boolean;
  /** Index into phases; -1 before start; phases.length-1 stays final. */
  phaseIndex: number;
  phaseName: string | null;
  /** Start → now while running; start → end once complete. */
  totalMs: number;
}

export class TimedTaskTracker {
  private readonly config: TimedTaskConfig;
  private readonly output: TimedTaskOutput = {
    started: false,
    complete: false,
    aborted: false,
    phaseIndex: -1,
    phaseName: null,
    totalMs: 0,
  };

  /** transitionTs[i] = entry into phases[i]; last slot = completion. */
  private readonly transitionTs: Float64Array;
  private runFrames = 0;
  private runStartTs = 0;
  private lastTs = 0;

  constructor(config: TimedTaskConfig) {
    if (config.phases.length === 0) {
      throw new Error('TimedTaskTracker: needs at least one phase');
    }
    this.config = config;
    this.transitionTs = new Float64Array(config.phases.length + 1);
  }

  /**
   * Feed one frame. `nextEntryMet` = the entry condition for the next
   * transition (start, next phase, or completion) holds right now.
   * Returns the reused output object.
   */
  update(nextEntryMet: boolean, timestampMs: number): TimedTaskOutput {
    const out = this.output;
    this.lastTs = timestampMs;
    if (out.complete || out.aborted) return out;

    if (nextEntryMet) {
      if (this.runFrames === 0) this.runStartTs = timestampMs;
      this.runFrames++;
      if (this.runFrames >= this.config.debounceFrames) {
        this.commitTransition();
      }
    } else {
      this.runFrames = 0;
    }

    if (out.started) {
      const endIndex = out.complete ? this.config.phases.length : -1;
      out.totalMs =
        (endIndex >= 0 ? this.transitionTs[endIndex] : timestampMs) - this.transitionTs[0];
    }
    return out;
  }

  private commitTransition(): void {
    const out = this.output;
    const next = out.phaseIndex + 1;
    this.runFrames = 0;

    if (next < this.config.phases.length) {
      this.transitionTs[next] = this.runStartTs;
      out.phaseIndex = next;
      out.phaseName = this.config.phases[next];
      out.started = true;
    } else {
      this.transitionTs[this.config.phases.length] = this.runStartTs;
      out.complete = true;
    }
  }

  /** Wall-clock spent in phases[i]; NaN if that phase never closed. */
  phaseDurationMs(i: number): number {
    const out = this.output;
    const closed = out.complete ? this.config.phases.length : out.phaseIndex;
    if (i < 0 || i >= this.config.phases.length || i >= closed) return NaN;
    return this.transitionTs[i + 1] - this.transitionTs[i];
  }

  /** Subject-gone / failed task. Times for closed phases remain readable. */
  abort(): void {
    if (!this.output.complete) {
      this.output.aborted = true;
      if (this.output.started) {
        this.output.totalMs = this.lastTs - this.transitionTs[0];
      }
    }
  }

  reset(): void {
    this.output.started = false;
    this.output.complete = false;
    this.output.aborted = false;
    this.output.phaseIndex = -1;
    this.output.phaseName = null;
    this.output.totalMs = 0;
    this.transitionTs.fill(0);
    this.runFrames = 0;
    this.lastTs = 0;
  }
}
