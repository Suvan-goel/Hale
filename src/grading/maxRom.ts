/**
 * MaxRomTracker — peak angle/distance capture per session (shoulder flexion
 * peak angle: direction 'max'; hinge-reach wrist-to-floor distance:
 * direction 'min').
 *
 * EMA smoothing before peak capture is the spike guard: a single-frame
 * landmark glitch must never become the session's recorded best.
 */

export interface MaxRomConfig {
  /** EMA factor on the value (1 = none). ~0.3 at 30fps suits ROM holds. */
  emaAlpha: number;
  direction: 'max' | 'min';
}

export interface MaxRomOutput {
  /** Best smoothed value so far; NaN until the first sample. */
  peak: number;
  peakTimestampMs: number;
  /** Current smoothed value; NaN until the first sample. */
  current: number;
}

export class MaxRomTracker {
  private readonly config: MaxRomConfig;
  private readonly output: MaxRomOutput = {
    peak: NaN,
    peakTimestampMs: 0,
    current: NaN,
  };

  private ema = 0;
  private hasEma = false;

  constructor(config: MaxRomConfig) {
    this.config = config;
  }

  /** Feed one value sample. Returns the reused output object. */
  update(value: number, timestampMs: number): MaxRomOutput {
    const out = this.output;
    if (!this.hasEma) {
      this.ema = value;
      this.hasEma = true;
    } else {
      this.ema += this.config.emaAlpha * (value - this.ema);
    }
    out.current = this.ema;

    const better = Number.isNaN(out.peak)
      ? true
      : this.config.direction === 'max'
        ? this.ema > out.peak
        : this.ema < out.peak;
    if (better) {
      out.peak = this.ema;
      out.peakTimestampMs = timestampMs;
    }
    return out;
  }

  /**
   * Subject-gone handler: forget the EMA seed (stale smoothing across a gap
   * lags the re-acquired pose) but keep the session peak — a ROM already
   * reached stays earned.
   */
  resetState(): void {
    this.hasEma = false;
  }

  /** Full reset for a new session/item. */
  reset(): void {
    this.hasEma = false;
    this.output.peak = NaN;
    this.output.peakTimestampMs = 0;
    this.output.current = NaN;
  }
}
