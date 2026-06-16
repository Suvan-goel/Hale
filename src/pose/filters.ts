/**
 * One-Euro filter (Casiez et al. 2012) — adaptive low-pass: heavy smoothing
 * at low speeds (kills landmark jitter), light smoothing at high speeds (no
 * lag on a fast chair-stand rise). Time comes from frame timestamps, never
 * the wall clock, so replays are deterministic.
 */

import { LANDMARK_COUNT, PoseFrame } from './types';

export interface OneEuroConfig {
  /** Hz. Lower = smoother at rest. */
  minCutoff: number;
  /** Speed coefficient. Higher = less lag during fast movement. */
  beta: number;
  /** Hz. Cutoff for the derivative estimate. */
  dCutoff: number;
}

/**
 * Starting point for 30fps normalized pose landmarks; tune via replay
 * recordings, not on-device guesswork. This is the MEASUREMENT smoothing —
 * stability-biased, since rep counts and rise velocity ride on it.
 */
export const DEFAULT_ONE_EURO: OneEuroConfig = {
  minCutoff: 1.2,
  beta: 0.6,
  dCutoff: 1.0,
};

/**
 * Lighter One-Euro for the on-screen FIGURE only (never feeds grading). The
 * display wants responsiveness — low lag between a real move and the figure
 * moving — not the stability the measurement path needs. A higher rest cutoff
 * and stronger speed coefficient cut perceived latency; the bold filled
 * silhouette hides the small extra jitter a thin skeleton would have shown.
 */
export const DISPLAY_ONE_EURO: OneEuroConfig = {
  minCutoff: 2.6,
  beta: 1.5,
  dCutoff: 1.0,
};

function smoothingFactor(dtSec: number, cutoff: number): number {
  const r = 2 * Math.PI * cutoff * dtSec;
  return r / (r + 1);
}

export class OneEuroFilter {
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;
  private hasPrev = false;
  private prevValue = 0;
  private prevDeriv = 0;
  private prevTimeSec = 0;

  constructor(config: OneEuroConfig = DEFAULT_ONE_EURO) {
    this.minCutoff = config.minCutoff;
    this.beta = config.beta;
    this.dCutoff = config.dCutoff;
  }

  filter(value: number, timeSec: number): number {
    if (!this.hasPrev) {
      this.hasPrev = true;
      this.prevValue = value;
      this.prevDeriv = 0;
      this.prevTimeSec = timeSec;
      return value;
    }
    let dt = timeSec - this.prevTimeSec;
    if (dt <= 0) dt = 1 / 30; // duplicate/non-monotonic timestamp guard
    this.prevTimeSec = timeSec;

    const rawDeriv = (value - this.prevValue) / dt;
    const aD = smoothingFactor(dt, this.dCutoff);
    const deriv = aD * rawDeriv + (1 - aD) * this.prevDeriv;
    this.prevDeriv = deriv;

    const cutoff = this.minCutoff + this.beta * Math.abs(deriv);
    const a = smoothingFactor(dt, cutoff);
    const filtered = a * value + (1 - a) * this.prevValue;
    this.prevValue = filtered;
    return filtered;
  }

  reset(): void {
    this.hasPrev = false;
    this.prevValue = 0;
    this.prevDeriv = 0;
    this.prevTimeSec = 0;
  }
}

/**
 * Smooths all 33 landmarks (x, y, z) with per-coordinate One-Euro filters.
 * visibility/presence pass through untouched — reliability windows do their
 * own smoothing. Writes into a caller-owned frame; allocation-free per frame.
 */
export class PoseSmoother {
  private readonly fx: OneEuroFilter[] = [];
  private readonly fy: OneEuroFilter[] = [];
  private readonly fz: OneEuroFilter[] = [];

  constructor(config: OneEuroConfig = DEFAULT_ONE_EURO) {
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      this.fx.push(new OneEuroFilter(config));
      this.fy.push(new OneEuroFilter(config));
      this.fz.push(new OneEuroFilter(config));
    }
  }

  apply(src: PoseFrame, dst: PoseFrame): void {
    dst.timestampMs = src.timestampMs;
    dst.hasPose = src.hasPose;
    if (!src.hasPose) return;
    const t = src.timestampMs / 1000;
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      dst.xs[i] = this.fx[i].filter(src.xs[i], t);
      dst.ys[i] = this.fy[i].filter(src.ys[i], t);
      dst.zs[i] = this.fz[i].filter(src.zs[i], t);
      dst.visibility[i] = src.visibility[i];
      dst.presence[i] = src.presence[i];
    }
  }

  reset(): void {
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      this.fx[i].reset();
      this.fy[i].reset();
      this.fz[i].reset();
    }
  }
}
