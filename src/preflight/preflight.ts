/**
 * Pre-flight check: before any assessment counts, the subject must be
 * framed correctly at the right distance, and the scene must support stable
 * detection (warm/dim domestic lighting degrades MediaPipe well before a
 * human would call the room dark).
 *
 * Phases:
 *   waiting-for-subject → framing (whole body in frame, distance band,
 *   roughly centered) → sampling (~2s of raw visibility + jitter stats) →
 *   ready | failed-lighting (prompt, pause, re-sample)
 *
 * Pure TS state machine driven by PipelineFrameOutput; all timing from frame
 * timestamps. Prompts are keys — the UI layer maps them to on-screen text
 * now and pre-generated voice lines later. This flow is measurement hygiene
 * (between-session setup variance is the #1 measurement threat), not just UX.
 */

import { PipelineFrameOutput } from '../pose/pipeline';
import { LM, PoseFrame } from '../pose/types';

export type PreflightPhase =
  | 'waiting-for-subject'
  | 'framing'
  | 'sampling'
  | 'failed-lighting'
  | 'ready';

export type PreflightPrompt =
  | 'step-into-frame'
  | 'center-yourself'
  | 'step-back'
  | 'step-closer'
  | 'hold-still'
  | 'turn-on-light'
  | 'ready';

export interface PreflightStatus {
  phase: PreflightPhase;
  prompt: PreflightPrompt;
  /** nose→ankle span as a fraction of frame height (distance proxy). */
  bodyHeightFraction: number;
  /** 0..1 progress through the stability sample. */
  sampleProgress: number;
}

export interface PreflightConfig {
  /** Core landmarks must sit inside [margin, 1-margin]. */
  edgeMargin: number;
  /** Acceptable nose→ankle span (fraction of frame height) ≈ 2.5–3.2 m at hip height. */
  minBodyHeightFraction: number;
  maxBodyHeightFraction: number;
  /** Hip midpoint x must stay within [center-band, center+band]. */
  centerBand: number;
  /** Continuous good framing required before sampling starts. */
  framingStableMs: number;
  /** Stability sample length. */
  sampleMs: number;
  /** Pass thresholds for the sample. */
  minMeanVisibility: number;
  /** Mean per-frame raw landmark displacement (normalized units at ~30fps). */
  maxMeanJitter: number;
  /** Pause on failure before re-sampling (gives the user time to act). */
  failRetryMs: number;
}

export const DEFAULT_PREFLIGHT_CONFIG: PreflightConfig = {
  edgeMargin: 0.04,
  minBodyHeightFraction: 0.45,
  maxBodyHeightFraction: 0.85,
  centerBand: 0.25,
  framingStableMs: 500,
  sampleMs: 2000,
  minMeanVisibility: 0.6,
  maxMeanJitter: 0.008,
  failRetryMs: 1500,
};

/** Landmarks that must be inside the frame and feed the sample stats. */
const FRAMING_LANDMARKS: readonly LM[] = [
  LM.NOSE,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
];

export class PreflightCheck {
  private readonly config: PreflightConfig;
  private readonly status: PreflightStatus = {
    phase: 'waiting-for-subject',
    prompt: 'step-into-frame',
    bodyHeightFraction: 0,
    sampleProgress: 0,
  };

  private framingGoodSinceMs = -1;
  private sampleStartMs = -1;
  private failedAtMs = -1;
  private sampleFrames = 0;
  private visibilitySum = 0;
  private jitterSum = 0;
  private jitterSamples = 0;
  private prevRawX = new Float64Array(FRAMING_LANDMARKS.length);
  private prevRawY = new Float64Array(FRAMING_LANDMARKS.length);
  private hasPrevRaw = false;

  constructor(config: PreflightConfig = DEFAULT_PREFLIGHT_CONFIG) {
    this.config = config;
  }

  /** Feed one pipeline output. Returns a reused status object. */
  update(out: PipelineFrameOutput): PreflightStatus {
    const status = this.status;
    const ts = out.frame.timestampMs;
    const subjectPresent =
      out.validity.valid && (out.state === 'warmup' || out.state === 'tracking');

    if (!subjectPresent) {
      // Includes pipeline interruptions: any subject loss restarts pre-flight.
      this.toWaiting();
      return status;
    }

    status.bodyHeightFraction = bodySpan(out.frame);

    switch (status.phase) {
      case 'waiting-for-subject':
        status.phase = 'framing';
        this.framingGoodSinceMs = -1;
        status.prompt = framingPrompt(out.frame, status.bodyHeightFraction, this.config);
        break;

      case 'framing': {
        const prompt = framingPrompt(out.frame, status.bodyHeightFraction, this.config);
        status.prompt = prompt;
        if (prompt === 'hold-still') {
          if (this.framingGoodSinceMs < 0) this.framingGoodSinceMs = ts;
          if (ts - this.framingGoodSinceMs >= this.config.framingStableMs) {
            this.startSample(ts);
          }
        } else {
          this.framingGoodSinceMs = -1;
        }
        break;
      }

      case 'sampling': {
        if (framingPrompt(out.frame, status.bodyHeightFraction, this.config) !== 'hold-still') {
          // Framing broke mid-sample: back to framing, sample discarded.
          status.phase = 'framing';
          this.framingGoodSinceMs = -1;
          break;
        }
        this.accumulateSample(out.rawFrame);
        status.prompt = 'hold-still';
        status.sampleProgress = Math.min(1, (ts - this.sampleStartMs) / this.config.sampleMs);
        if (ts - this.sampleStartMs >= this.config.sampleMs) {
          this.finishSample(ts);
        }
        break;
      }

      case 'failed-lighting':
        status.prompt = 'turn-on-light';
        if (ts - this.failedAtMs >= this.config.failRetryMs) {
          status.phase = 'framing';
          this.framingGoodSinceMs = -1;
        }
        break;

      case 'ready':
        status.prompt = 'ready';
        break;
    }

    return status;
  }

  private toWaiting(): void {
    this.status.phase = 'waiting-for-subject';
    this.status.prompt = 'step-into-frame';
    this.status.sampleProgress = 0;
    this.status.bodyHeightFraction = 0;
    this.framingGoodSinceMs = -1;
    this.hasPrevRaw = false;
  }

  private startSample(ts: number): void {
    this.status.phase = 'sampling';
    this.status.sampleProgress = 0;
    this.sampleStartMs = ts;
    this.sampleFrames = 0;
    this.visibilitySum = 0;
    this.jitterSum = 0;
    this.jitterSamples = 0;
    this.hasPrevRaw = false;
  }

  private accumulateSample(raw: PoseFrame): void {
    if (!raw.hasPose) return;
    let visibility = 0;
    let jitter = 0;
    for (let i = 0; i < FRAMING_LANDMARKS.length; i++) {
      const lm = FRAMING_LANDMARKS[i];
      visibility += raw.visibility[lm];
      if (this.hasPrevRaw) {
        const dx = raw.xs[lm] - this.prevRawX[i];
        const dy = raw.ys[lm] - this.prevRawY[i];
        jitter += Math.sqrt(dx * dx + dy * dy);
      }
      this.prevRawX[i] = raw.xs[lm];
      this.prevRawY[i] = raw.ys[lm];
    }
    this.visibilitySum += visibility / FRAMING_LANDMARKS.length;
    this.sampleFrames++;
    if (this.hasPrevRaw) {
      this.jitterSum += jitter / FRAMING_LANDMARKS.length;
      this.jitterSamples++;
    }
    this.hasPrevRaw = true;
  }

  private finishSample(ts: number): void {
    const meanVisibility = this.sampleFrames > 0 ? this.visibilitySum / this.sampleFrames : 0;
    const meanJitter = this.jitterSamples > 0 ? this.jitterSum / this.jitterSamples : Infinity;
    if (
      meanVisibility >= this.config.minMeanVisibility &&
      meanJitter <= this.config.maxMeanJitter
    ) {
      this.status.phase = 'ready';
      this.status.prompt = 'ready';
      this.status.sampleProgress = 1;
    } else {
      this.status.phase = 'failed-lighting';
      this.status.prompt = 'turn-on-light';
      this.status.sampleProgress = 0;
      this.failedAtMs = ts;
    }
  }

  reset(): void {
    this.toWaiting();
    this.status.phase = 'waiting-for-subject';
  }

  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    if (this.framingGoodSinceMs >= 0) this.framingGoodSinceMs += deltaMs;
    if (this.sampleStartMs >= 0) this.sampleStartMs += deltaMs;
    if (this.failedAtMs >= 0) this.failedAtMs += deltaMs;
  }
}

/** nose→lowest-ankle vertical span as a fraction of frame height. */
function bodySpan(frame: PoseFrame): number {
  const ankleY = Math.max(frame.ys[LM.LEFT_ANKLE], frame.ys[LM.RIGHT_ANKLE]);
  return Math.max(0, ankleY - frame.ys[LM.NOSE]);
}

function framingPrompt(
  frame: PoseFrame,
  bodyHeightFraction: number,
  config: PreflightConfig
): PreflightPrompt {
  // Vertical overflow / oversized body = too close (the common real cause);
  // horizontal overflow = off-center.
  if (bodyHeightFraction > config.maxBodyHeightFraction) return 'step-back';
  for (let i = 0; i < FRAMING_LANDMARKS.length; i++) {
    const lm = FRAMING_LANDMARKS[i];
    const y = frame.ys[lm];
    if (y < config.edgeMargin || y > 1 - config.edgeMargin) return 'step-back';
  }
  for (let i = 0; i < FRAMING_LANDMARKS.length; i++) {
    const lm = FRAMING_LANDMARKS[i];
    const x = frame.xs[lm];
    if (x < config.edgeMargin || x > 1 - config.edgeMargin) return 'center-yourself';
  }
  if (bodyHeightFraction < config.minBodyHeightFraction) return 'step-closer';
  const hipX = (frame.xs[LM.LEFT_HIP] + frame.xs[LM.RIGHT_HIP]) * 0.5;
  if (Math.abs(hipX - 0.5) > config.centerBand) return 'center-yourself';
  return 'hold-still';
}
