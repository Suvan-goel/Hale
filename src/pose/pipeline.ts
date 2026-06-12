/**
 * PosePipeline: raw landmark events → trustworthy, smoothed, gated pose state.
 *
 *   parse → smooth (One-Euro) → per-chain reliability windows → subject
 *   validity → presence state machine (warmup gate / subject-gone) →
 *   body-unit calibration
 *
 * Pure TS, no React/Expo imports. The process() hot path is synchronous and
 * allocation-free: every structure is preallocated and mutated in place. All
 * time comes from frame timestamps, so feeding a recording through process()
 * reproduces on-device behavior exactly.
 *
 * State machine (the painful Forma lessons, encoded):
 * - warmup gate: detection is unstable for the first ~1.5s — nothing
 *   downstream may count reps/holds until 'tracking'.
 * - subject-gone: when the subject leaves mid-activity an explicit event
 *   fires so rep/hold state machines RESET — otherwise re-entry
 *   double-counts. Re-acquisition goes through warmup again.
 */

import { BodyScaleCalibrator, CalibrationConfig, DEFAULT_CALIBRATION_CONFIG } from './calibration';
import { ChainReliabilityTracker, RELIABLE_THRESHOLD } from './chains';
import { DEFAULT_ONE_EURO, OneEuroConfig, PoseSmoother } from './filters';
import {
  checkSubjectValidity,
  DEFAULT_VALIDITY_CONFIG,
  ValidityConfig,
  ValidityResult,
} from './subjectValidity';
import { createPoseFrame, parseLandmarkEvent, PoseFrame, RawLandmarkEvent } from './types';

export type TrackingState = 'no-subject' | 'warmup' | 'tracking' | 'interrupted';

export type PoseEventType =
  | 'subject-acquired'
  | 'tracking-started'
  | 'subject-gone'
  | 'calibration-complete';

export interface PoseEvent {
  type: PoseEventType;
  timestampMs: number;
}

export interface PipelineConfig {
  oneEuro: OneEuroConfig;
  validity: ValidityConfig;
  calibration: CalibrationConfig;
  /** Frames in the chain-reliability window (15 ≈ 500ms at 30fps). */
  reliabilityWindowFrames: number;
  /** Windowed chain reliability needed for the subject to count as present. */
  reliabilityThreshold: number;
  /** Side chains required for presence (1 = side view suffices). */
  minReliableSideChains: number;
  /** Warmup gate duration. */
  warmupMs: number;
  /** Consecutive absent frames during tracking before subject-gone fires. */
  subjectGoneFrames: number;
  /** Consecutive absent frames during warmup before silently dropping out. */
  warmupAbsenceFrames: number;
  /** A timestamp jump larger than this is a stream interruption. */
  frameGapMs: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  oneEuro: DEFAULT_ONE_EURO,
  validity: DEFAULT_VALIDITY_CONFIG,
  calibration: DEFAULT_CALIBRATION_CONFIG,
  reliabilityWindowFrames: 15,
  reliabilityThreshold: RELIABLE_THRESHOLD,
  minReliableSideChains: 1,
  warmupMs: 1500,
  subjectGoneFrames: 10,
  warmupAbsenceFrames: 8,
  frameGapMs: 500,
};

export interface PipelineFrameOutput {
  state: TrackingState;
  /** Smoothed frame. Valid only when frame.hasPose. */
  frame: PoseFrame;
  /** Windowed reliability per chain, indexed by CHAIN_IDS order. */
  chainReliability: Float64Array;
  reliableSideChains: number;
  validity: ValidityResult;
  /** Normalized units per body unit; null until calibrated. */
  bodyUnit: number | null;
  /** Events fired by THIS frame (array reused — consume synchronously). */
  events: PoseEvent[];
  /** EMA of observed frame rate. */
  fps: number;
}

export class PosePipeline {
  readonly config: PipelineConfig;
  readonly chains: ChainReliabilityTracker;
  readonly calibrator: BodyScaleCalibrator;

  private readonly smoother: PoseSmoother;
  private readonly rawFrame = createPoseFrame();
  private readonly smoothedFrame = createPoseFrame();
  private readonly output: PipelineFrameOutput;

  private state: TrackingState = 'no-subject';
  private warmupStartMs = 0;
  private consecutiveAbsent = 0;
  private lastTimestampMs = -1;
  private fpsEma = 0;

  constructor(config: PipelineConfig = DEFAULT_PIPELINE_CONFIG) {
    this.config = config;
    this.smoother = new PoseSmoother(config.oneEuro);
    this.chains = new ChainReliabilityTracker(config.reliabilityWindowFrames);
    this.calibrator = new BodyScaleCalibrator(config.calibration);
    this.output = {
      state: 'no-subject',
      frame: this.smoothedFrame,
      chainReliability: this.chains.reliability,
      reliableSideChains: 0,
      validity: { valid: false, reason: 'no-pose' },
      bodyUnit: null,
      events: [],
      fps: 0,
    };
  }

  /**
   * Feed one raw frame. Returns the pipeline's single, reused output object —
   * read it synchronously; never retain it across frames.
   */
  process(event: RawLandmarkEvent): PipelineFrameOutput {
    const out = this.output;
    out.events.length = 0;
    const ts = event.timestampMs;

    // Stream gap (camera stall, app backgrounded) = interruption: stale
    // filter/window state must not bleed across the gap.
    if (this.lastTimestampMs >= 0) {
      const dt = ts - this.lastTimestampMs;
      if (dt > 0) {
        const instFps = 1000 / dt;
        this.fpsEma = this.fpsEma === 0 ? instFps : 0.9 * this.fpsEma + 0.1 * instFps;
      }
      if (dt > this.config.frameGapMs) {
        this.handleStreamGap(ts, out);
      }
    }
    this.lastTimestampMs = ts;

    parseLandmarkEvent(event, this.rawFrame);
    this.smoother.apply(this.rawFrame, this.smoothedFrame);
    this.chains.update(this.smoothedFrame);
    checkSubjectValidity(this.smoothedFrame, out.validity, this.config.validity);

    const reliableSides = this.chains.reliableSideChains(this.config.reliabilityThreshold);
    const present = out.validity.valid && reliableSides >= this.config.minReliableSideChains;

    if (present) {
      this.consecutiveAbsent = 0;
    } else {
      this.consecutiveAbsent++;
    }

    switch (this.state) {
      case 'no-subject':
      case 'interrupted':
        if (present) {
          this.state = 'warmup';
          this.warmupStartMs = ts;
          this.pushEvent(out, 'subject-acquired', ts);
        }
        break;

      case 'warmup':
        if (!present && this.consecutiveAbsent > this.config.warmupAbsenceFrames) {
          // Never tracked yet — drop out silently, no interruption event.
          this.state = 'no-subject';
          this.smoother.reset();
        } else if (present && ts - this.warmupStartMs >= this.config.warmupMs) {
          this.state = 'tracking';
          this.pushEvent(out, 'tracking-started', ts);
        }
        break;

      case 'tracking':
        if (!present && this.consecutiveAbsent > this.config.subjectGoneFrames) {
          this.state = 'interrupted';
          this.smoother.reset();
          this.pushEvent(out, 'subject-gone', ts);
        }
        break;
    }

    if (this.state === 'tracking' && !this.calibrator.calibrated) {
      if (this.calibrator.update(this.smoothedFrame, this.chains)) {
        this.pushEvent(out, 'calibration-complete', ts);
      }
    }

    out.state = this.state;
    out.reliableSideChains = reliableSides;
    out.bodyUnit = this.calibrator.bodyUnit;
    out.fps = this.fpsEma;
    return out;
  }

  private handleStreamGap(ts: number, out: PipelineFrameOutput): void {
    if (this.state === 'tracking') {
      this.pushEvent(out, 'subject-gone', ts);
    }
    if (this.state !== 'no-subject') {
      this.state = 'interrupted';
    }
    this.smoother.reset();
    this.chains.reset();
    this.consecutiveAbsent = 0;
  }

  private pushEvent(out: PipelineFrameOutput, type: PoseEventType, timestampMs: number): void {
    out.events.push({ type, timestampMs });
  }

  get trackingState(): TrackingState {
    return this.state;
  }

  /** Full reset, including the body-unit scale (new session / new setup). */
  reset(): void {
    this.state = 'no-subject';
    this.warmupStartMs = 0;
    this.consecutiveAbsent = 0;
    this.lastTimestampMs = -1;
    this.fpsEma = 0;
    this.smoother.reset();
    this.chains.reset();
    this.calibrator.reset();
    this.output.events.length = 0;
  }
}
