/**
 * Body-unit scale calibration.
 *
 * Never use absolute pixels (or raw normalized units) for measurements:
 * camera distance varies between sessions, and the product's payload is
 * longitudinal trends. All distances/velocities are expressed in body units —
 * 1 body unit = the subject's hip-to-ankle length, captured as a median over
 * a stable standing window.
 */

import { ChainReliabilityTracker, RELIABLE_THRESHOLD } from './chains';
import { dist, LM, midpointX, midpointY, PoseFrame } from './types';

export interface CalibrationConfig {
  /** Samples collected before locking (45 ≈ 1.5s at 30fps). */
  sampleCount: number;
  /** Hip-midpoint speed (normalized units/sec) above which the stance is not "still". */
  maxHipSpeed: number;
  /** Minimum side-chain reliability to accept a sample. */
  minChainReliability: number;
}

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  sampleCount: 45,
  maxHipSpeed: 0.15,
  minChainReliability: RELIABLE_THRESHOLD,
};

/** EMA factor for the hip-speed estimate (see update()). */
const SPEED_EMA_ALPHA = 0.25;

export class BodyScaleCalibrator {
  /** Normalized units per body unit; null until calibrated. */
  bodyUnit: number | null = null;

  private readonly config: CalibrationConfig;
  private readonly samples: Float64Array;
  private sampleCursor = 0;
  private prevHipX = 0;
  private prevHipY = 0;
  private prevTimestampMs = -1;
  private speedEma = 0;

  constructor(config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG) {
    this.config = config;
    this.samples = new Float64Array(config.sampleCount);
  }

  get calibrated(): boolean {
    return this.bodyUnit !== null;
  }

  /**
   * Feed one smoothed frame. Returns true on the frame calibration locks.
   * Movement or an unreliable chain restarts the collection window —
   * a calibration sampled mid-stride would poison every later measurement.
   */
  update(frame: PoseFrame, chains: ChainReliabilityTracker): boolean {
    if (this.bodyUnit !== null || !frame.hasPose) return false;

    const hipX = midpointX(frame, LM.LEFT_HIP, LM.RIGHT_HIP);
    const hipY = midpointY(frame, LM.LEFT_HIP, LM.RIGHT_HIP);
    const hadPrev = this.prevTimestampMs >= 0;
    const dtSec = hadPrev ? (frame.timestampMs - this.prevTimestampMs) / 1000 : 0;
    if (hadPrev && dtSec > 0) {
      const dx = hipX - this.prevHipX;
      const dy = hipY - this.prevHipY;
      const instSpeed = Math.sqrt(dx * dx + dy * dy) / dtSec;
      // EMA, not instantaneous: frame-to-frame jitter produces speed spikes
      // even when the subject is perfectly still; only sustained movement
      // should restart the window.
      this.speedEma += SPEED_EMA_ALPHA * (instSpeed - this.speedEma);
    }
    this.prevHipX = hipX;
    this.prevHipY = hipY;
    this.prevTimestampMs = frame.timestampMs;
    if (!hadPrev) return false;

    const side = chains.bestSide();
    const sideReliable = chains.get(side) >= this.config.minChainReliability;
    if (!sideReliable || this.speedEma > this.config.maxHipSpeed) {
      this.sampleCursor = 0;
      return false;
    }

    const hipToAnkle =
      side === 'leftSide'
        ? dist(frame, LM.LEFT_HIP, LM.LEFT_ANKLE)
        : dist(frame, LM.RIGHT_HIP, LM.RIGHT_ANKLE);
    this.samples[this.sampleCursor++] = hipToAnkle;

    if (this.sampleCursor >= this.config.sampleCount) {
      this.bodyUnit = median(this.samples);
      return true;
    }
    return false;
  }

  /** Convert a normalized-unit distance to body units. */
  toBodyUnits(normalizedDistance: number): number {
    if (this.bodyUnit === null || this.bodyUnit <= 0) return NaN;
    return normalizedDistance / this.bodyUnit;
  }

  reset(): void {
    this.bodyUnit = null;
    this.sampleCursor = 0;
    this.prevTimestampMs = -1;
    this.speedEma = 0;
  }
}

function median(values: Float64Array): number {
  // Runs once per calibration, not per frame — allocation here is fine.
  const sorted = Array.from(values).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
