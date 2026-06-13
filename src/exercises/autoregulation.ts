/**
 * VelocityAutoregulation — the leg-power-aware "stop the set" rule (CLAUDE.md
 * "CV is the sensor; adherence is the product": training intensity is governed
 * by measured velocity, not a fixed rep count). During a rep-based strength
 * set, once concentric velocity has fallen >25% below the SET'S OWN BEST for
 * two consecutive reps, the set is done — the user gets "good, that's your
 * set", and it is logged as a NORMAL completion, never a failure.
 *
 * Pure scalar logic (consumes per-rep mean velocities), so it is trivially
 * unit-testable and replays deterministically. The set grader feeds it each
 * credited rep's velocity; the player relays the stop.
 */

export interface AutoregulatorConfig {
  /** Fractional drop below the set best that marks a rep "slow" (0.25 = 25%). */
  dropFraction: number;
  /** Consecutive slow reps that end the set. */
  consecutiveReps: number;
  /**
   * Reps that must be credited before a stop can fire, so the best is anchored
   * on real efforts and a single soft opening rep can't end the set early.
   */
  minRepsBeforeStop: number;
}

export const DEFAULT_AUTOREGULATOR_CONFIG: AutoregulatorConfig = {
  dropFraction: 0.25,
  consecutiveReps: 2,
  minRepsBeforeStop: 2,
};

export class VelocityAutoregulator {
  private readonly config: AutoregulatorConfig;
  private best = -Infinity;
  private consecutiveSlow = 0;
  private reps = 0;
  private stopped = false;

  constructor(config: AutoregulatorConfig = DEFAULT_AUTOREGULATOR_CONFIG) {
    this.config = config;
  }

  /**
   * Feed one credited rep's mean concentric velocity (body units/sec). Returns
   * true once the stop condition is met (and stays true thereafter). A
   * non-finite/non-positive velocity (a rep with no usable velocity window) is
   * counted but never treated as a new best or a slow rep.
   */
  addRep(meanVel: number): boolean {
    if (this.stopped) return true;
    this.reps++;

    const usable = Number.isFinite(meanVel) && meanVel > 0;
    if (usable && meanVel > this.best) this.best = meanVel;

    if (this.reps > this.config.minRepsBeforeStop && this.best > 0 && usable) {
      if (meanVel < this.best * (1 - this.config.dropFraction)) {
        this.consecutiveSlow++;
      } else {
        this.consecutiveSlow = 0;
      }
      if (this.consecutiveSlow >= this.config.consecutiveReps) {
        this.stopped = true;
      }
    }
    return this.stopped;
  }

  get triggered(): boolean {
    return this.stopped;
  }

  reset(): void {
    this.best = -Infinity;
    this.consecutiveSlow = 0;
    this.reps = 0;
    this.stopped = false;
  }
}
