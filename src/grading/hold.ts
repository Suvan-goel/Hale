/**
 * HoldTracker — timed hold with configurable termination (balance ladder:
 * raised-foot touchdown via ankle separation/height; future: wall sit).
 *
 * The movement definition evaluates its own hold condition per frame and
 * feeds a boolean; the tracker owns debouncing, timing, and the sway proxy.
 * Both edges are debounced against per-frame landmark flicker, but the
 * recorded times are flicker-free: the hold starts at the FIRST frame of the
 * confirming run and ends at the FIRST frame of the terminating run.
 *
 * Sway proxy: population SD of the sway signal (e.g. pelvis-midpoint x in
 * body units) across the hold, via Welford's algorithm — allocation-free.
 */

export interface HoldConfig {
  /** Consecutive condition-met frames required to start the hold. */
  startDebounceFrames: number;
  /** Consecutive condition-lost frames required to terminate. */
  endDebounceFrames: number;
  /** Cap (protocol max, e.g. 30s balance hold); Infinity = uncapped. */
  maxHoldMs: number;
}

export type HoldPhase = 'waiting' | 'holding' | 'ended';

export type HoldEndReason = 'condition-lost' | 'max-duration' | 'interrupted';

export interface HoldOutput {
  phase: HoldPhase;
  /** Running duration while holding; final duration once ended. */
  holdMs: number;
  /** Population SD of the sway signal over the hold; NaN until holding. */
  swaySd: number;
  endReason: HoldEndReason | null;
}

export class HoldTracker {
  private readonly config: HoldConfig;
  private readonly output: HoldOutput = {
    phase: 'waiting',
    holdMs: 0,
    swaySd: NaN,
    endReason: null,
  };

  private metRunFrames = 0;
  private metRunStartTs = 0;
  private lostRunFrames = 0;
  private lostRunStartTs = 0;
  private startTs = 0;
  private lastTs = 0;

  // Welford accumulators for the sway signal.
  private swayCount = 0;
  private swayMean = 0;
  private swayM2 = 0;

  constructor(config: HoldConfig) {
    this.config = config;
  }

  /** Feed one frame. Returns the reused output object. */
  update(conditionMet: boolean, swaySignal: number, timestampMs: number): HoldOutput {
    const out = this.output;
    this.lastTs = timestampMs;

    switch (out.phase) {
      case 'waiting':
        if (conditionMet) {
          if (this.metRunFrames === 0) this.metRunStartTs = timestampMs;
          this.metRunFrames++;
          if (this.metRunFrames >= this.config.startDebounceFrames) {
            out.phase = 'holding';
            this.startTs = this.metRunStartTs;
            this.lostRunFrames = 0;
            this.accumulateSway(swaySignal);
          }
        } else {
          this.metRunFrames = 0;
        }
        break;

      case 'holding':
        if (conditionMet) {
          this.lostRunFrames = 0;
          this.accumulateSway(swaySignal);
          out.holdMs = timestampMs - this.startTs;
          if (out.holdMs >= this.config.maxHoldMs) {
            out.holdMs = this.config.maxHoldMs;
            this.end('max-duration');
          }
        } else {
          if (this.lostRunFrames === 0) this.lostRunStartTs = timestampMs;
          this.lostRunFrames++;
          if (this.lostRunFrames >= this.config.endDebounceFrames) {
            out.holdMs = this.lostRunStartTs - this.startTs;
            this.end('condition-lost');
          }
        }
        break;

      case 'ended':
        break;
    }

    return out;
  }

  /**
   * Subject-gone / external stop. A hold in progress ends at the last frame
   * actually observed (or at the touchdown candidate if one was pending).
   */
  interrupt(): void {
    const out = this.output;
    if (out.phase === 'holding') {
      const endTs = this.lostRunFrames > 0 ? this.lostRunStartTs : this.lastTs;
      out.holdMs = Math.max(0, endTs - this.startTs);
      this.end('interrupted');
    } else if (out.phase === 'waiting') {
      this.metRunFrames = 0;
    }
  }

  private end(reason: HoldEndReason): void {
    this.output.phase = 'ended';
    this.output.endReason = reason;
  }

  private accumulateSway(value: number): void {
    this.swayCount++;
    const delta = value - this.swayMean;
    this.swayMean += delta / this.swayCount;
    this.swayM2 += delta * (value - this.swayMean);
    this.output.swaySd = this.swayCount > 1 ? Math.sqrt(this.swayM2 / this.swayCount) : 0;
  }

  reset(): void {
    this.output.phase = 'waiting';
    this.output.holdMs = 0;
    this.output.swaySd = NaN;
    this.output.endReason = null;
    this.metRunFrames = 0;
    this.lostRunFrames = 0;
    this.startTs = 0;
    this.lastTs = 0;
    this.swayCount = 0;
    this.swayMean = 0;
    this.swayM2 = 0;
  }
}
