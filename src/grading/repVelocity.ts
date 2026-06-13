/**
 * RepVelocityTracker — the RepVelocity derivative layered on RepCycleTracker.
 *
 * Measures concentric-phase velocity per rep: the movement definition feeds a
 * cycle signal (e.g. knee angle) that drives rep segmentation, plus a position
 * signal in body units with INCREASING = concentric direction (e.g. negated
 * hip height for a chair stand, since image y grows downward). The window
 * between 'ascent-start' and 'rep' is the measured concentric phase:
 *
 *   per-rep mean = displacement / duration   (body units/sec)
 *   per-rep peak = max EMA-smoothed instantaneous velocity in the window
 *
 * Per-rep values jitter at 30fps (a rise spans ~25–45 frames); the session
 * mean over 10+ reps is the robust headline number.
 *
 * Allocation-free update(): per-rep stats land in preallocated arrays; the
 * output object is reused every frame.
 */

import { RepCycleConfig, RepCycleOutput, RepCycleTracker } from './repCycle';

export interface RepVelocityConfig {
  cycle: RepCycleConfig;
  /**
   * EMA factor for instantaneous velocity before peak detection (~0.3 at
   * 30fps ≈ a 6-frame window: spikes die, a real fast rise survives).
   */
  velocityEmaAlpha: number;
  /** Per-rep storage capacity (preallocated; reps beyond it keep counting,
   * velocities for them are dropped). */
  maxReps: number;
}

export interface RepVelocityOutput {
  cycle: RepCycleOutput;
  /** True only on the frame a rep was credited (drives the rep sound). */
  repCredited: boolean;
  /** Stats of the most recent credited rep; NaN before the first. */
  lastRepMeanVel: number;
  lastRepPeakVel: number;
  /** Mean of valid per-rep mean velocities so far; NaN until one exists. */
  sessionMeanVel: number;
}

export interface RepVelocityStats {
  meanVel: number;
  peakVel: number;
  durationMs: number;
}

export class RepVelocityTracker {
  readonly cycle: RepCycleTracker;

  private readonly config: RepVelocityConfig;
  private readonly output: RepVelocityOutput;
  private readonly repMeans: Float64Array;
  private readonly repPeaks: Float64Array;
  private readonly repDurations: Float64Array;
  private storedReps = 0;

  private prevPos = 0;
  private prevTs = 0;
  private hasPrev = false;
  private velEma = 0;
  private hasVelEma = false;

  private windowOpen = false;
  private windowStartPos = 0;
  private windowStartTs = 0;
  private windowPeak = 0;

  constructor(config: RepVelocityConfig) {
    this.config = config;
    this.cycle = new RepCycleTracker(config.cycle);
    this.repMeans = new Float64Array(config.maxReps);
    this.repPeaks = new Float64Array(config.maxReps);
    this.repDurations = new Float64Array(config.maxReps);
    this.output = {
      cycle: undefined as unknown as RepCycleOutput, // set on first update
      repCredited: false,
      lastRepMeanVel: NaN,
      lastRepPeakVel: NaN,
      sessionMeanVel: NaN,
    };
  }

  /**
   * Feed one frame. `positionBu` is in body units, increasing = concentric.
   * Returns the reused output object — consume synchronously.
   */
  update(cycleSignal: number, positionBu: number, timestampMs: number): RepVelocityOutput {
    const out = this.output;
    out.repCredited = false;

    // Instantaneous velocity, EMA-smoothed for peak detection.
    if (this.hasPrev) {
      const dtSec = (timestampMs - this.prevTs) / 1000;
      if (dtSec > 0) {
        const v = (positionBu - this.prevPos) / dtSec;
        if (!this.hasVelEma) {
          this.velEma = v;
          this.hasVelEma = true;
        } else {
          this.velEma += this.config.velocityEmaAlpha * (v - this.velEma);
        }
      }
    }
    this.prevPos = positionBu;
    this.prevTs = timestampMs;
    this.hasPrev = true;

    const cycleOut = this.cycle.update(cycleSignal, timestampMs);
    out.cycle = cycleOut;

    for (let i = 0; i < cycleOut.events.length; i++) {
      const ev = cycleOut.events[i];
      switch (ev.type) {
        case 'ascent-start':
          this.windowOpen = true;
          this.windowStartPos = positionBu;
          this.windowStartTs = timestampMs;
          this.windowPeak = this.hasVelEma ? this.velEma : 0;
          break;

        case 'rep': {
          out.repCredited = true;
          if (this.windowOpen) {
            const durationMs = timestampMs - this.windowStartTs;
            const displacement = positionBu - this.windowStartPos;
            const mean = durationMs > 0 ? (displacement / durationMs) * 1000 : NaN;
            const peak = this.windowPeak;
            out.lastRepMeanVel = mean;
            out.lastRepPeakVel = peak;
            if (this.storedReps < this.config.maxReps && Number.isFinite(mean)) {
              this.repMeans[this.storedReps] = mean;
              this.repPeaks[this.storedReps] = peak;
              this.repDurations[this.storedReps] = durationMs;
              this.storedReps++;
            }
            this.windowOpen = false;
          }
          break;
        }

        case 'ascent-abort':
          this.windowOpen = false;
          break;

        case 'bottom':
          break;
      }
    }

    if (this.windowOpen && this.hasVelEma && this.velEma > this.windowPeak) {
      this.windowPeak = this.velEma;
    }

    out.sessionMeanVel = this.computeSessionMean();
    return out;
  }

  private computeSessionMean(): number {
    if (this.storedReps === 0) return NaN;
    let sum = 0;
    for (let i = 0; i < this.storedReps; i++) sum += this.repMeans[i];
    return sum / this.storedReps;
  }

  get repCount(): number {
    return this.cycle.reps;
  }

  /** Reps with stored velocity stats (≤ repCount). */
  get storedRepCount(): number {
    return this.storedReps;
  }

  get sessionMeanVel(): number {
    return this.computeSessionMean();
  }

  /** Per-rep stats snapshot. Allocates — call at finish, never per frame. */
  repStats(): RepVelocityStats[] {
    const stats: RepVelocityStats[] = [];
    for (let i = 0; i < this.storedReps; i++) {
      stats.push({
        meanVel: this.repMeans[i],
        peakVel: this.repPeaks[i],
        durationMs: this.repDurations[i],
      });
    }
    return stats;
  }

  /**
   * Subject-gone handler: re-anchor the cycle, discard any half-measured rep
   * window, and forget the stale previous position (a velocity computed
   * across the gap would be garbage). Credited reps and stats survive.
   */
  resetState(): void {
    this.cycle.resetState();
    this.windowOpen = false;
    this.hasPrev = false;
    this.hasVelEma = false;
  }

  /** Full reset for a new session/item. */
  reset(): void {
    this.cycle.reset();
    this.resetState();
    this.storedReps = 0;
    this.output.repCredited = false;
    this.output.lastRepMeanVel = NaN;
    this.output.lastRepPeakVel = NaN;
    this.output.sessionMeanVel = NaN;
  }
}
