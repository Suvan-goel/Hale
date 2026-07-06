/**
 * Dual-task appendix runtime (CLARITY_INSTRUMENTS_TDD §4, approved; DT2).
 * Pure, frame-driven, headless-testable — the screen owns camera/VAD/voice
 * and feeds this machine.
 *
 * Runs ONE extra balance hold — same standing leg, same lift/touchdown
 * detection (imported from the live coordinator, C7-style), same 45 s cap —
 * AFTER the check-up completes, in the same session. The comparison baseline
 * is the SAME session's protocol balance result, passed in by the caller;
 * this runtime never reads history and never fabricates.
 *
 * F5 rules of record are enforced here: the movement ending early under load
 * (touchdown) is VALID degradation — her real capacity; failing the verbal-
 * task speech floor is INVALID (`no_speech_detected`). Never conflated.
 *
 * v1 scope: supports the single-leg protocol only (`one-leg-balance-45s-v2`).
 * A ladder-protocol session reports `unavailable` (recorded limitation).
 */

import type { BodySide } from '../checkup/protocolSetup';
import {
  computeDualTaskCostPercent,
  DUAL_TASK_RESULT_SCHEMA_VERSION,
  type DualTaskResult,
} from '../checkup/clarityInstruments';
import { verbalTaskPerformed, type SpeechActivitySummary } from '../voice/speechActivity';
import {
  BALANCE_LIFT_CONFIRM_MS,
  BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES,
  selectedLegRaised,
  type MovementProfileV2LivePoseSample,
} from './liveCoordinator';

export type DualTaskPhase = 'setup' | 'hold' | 'complete';

export interface DualTaskRuntimeConfig {
  movementId: string;
  standingLeg: BodySide;
  singleTaskSeconds: number;
  /** Single-task run hit its protocol cap (F2 ceiling honesty). */
  singleTaskCeiling: boolean;
  maxTrialMs: number;
  /** No-stall: waiting for the lift can never hang the appendix. */
  setupTimeoutMs: number;
  trackingLossConfirmFrames: number;
}

export const DUAL_TASK_RUNTIME_DEFAULTS = {
  maxTrialMs: 45000,
  setupTimeoutMs: 45000,
  trackingLossConfirmFrames: 4,
} as const;

export type DualTaskRuntimeEvent =
  | { kind: 'phase'; phase: DualTaskPhase }
  | { kind: 'setup_timed_out' }
  | { kind: 'tracking_interrupted' };

export class DualTaskRuntime {
  private readonly config: DualTaskRuntimeConfig;
  private phase_: DualTaskPhase = 'setup';
  private setupStartedAtMs: number | null = null;
  private liftSinceMs: number | null = null;
  private holdStartedAtMs: number | null = null;
  private holdEndedAtMs: number | null = null;
  private touchdownFrames = 0;
  private touchdownStartedAtMs: number | null = null;
  private lostFrames = 0;
  private outcome: 'measured' | 'tracking_interrupted' | 'setup_timed_out' | null = null;
  private events: DualTaskRuntimeEvent[] = [];

  constructor(config: DualTaskRuntimeConfig) {
    this.config = config;
  }

  get phase(): DualTaskPhase {
    return this.phase_;
  }

  /** Drain queued events (screen consumes for voice/UI). */
  takeEvents(): DualTaskRuntimeEvent[] {
    const drained = this.events;
    this.events = [];
    return drained;
  }

  update(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (this.phase_ === 'complete') return;
    if (this.setupStartedAtMs === null) this.setupStartedAtMs = nowMs;

    if (sample.trackingQuality !== 'good') {
      this.liftSinceMs = null;
      if (this.phase_ === 'hold') {
        this.lostFrames++;
        if (this.lostFrames >= this.config.trackingLossConfirmFrames) {
          this.finishWith('tracking_interrupted', nowMs);
          this.events.push({ kind: 'tracking_interrupted' });
        }
      }
      return;
    }
    this.lostFrames = 0;

    const bodyUnit = sample.output.bodyUnit;
    if (bodyUnit === null) {
      // No calibrated body unit this frame: no lift/touchdown evidence either way.
      this.liftSinceMs = null;
      return;
    }

    if (this.phase_ === 'setup') {
      if (nowMs - this.setupStartedAtMs >= this.config.setupTimeoutMs) {
        this.finishWith('setup_timed_out', nowMs);
        this.events.push({ kind: 'setup_timed_out' });
        return;
      }
      const raised = selectedLegRaised(sample.output.frame, bodyUnit, this.config.standingLeg);
      if (!raised) {
        this.liftSinceMs = null;
        return;
      }
      if (this.liftSinceMs === null) this.liftSinceMs = nowMs;
      if (nowMs - this.liftSinceMs < BALANCE_LIFT_CONFIRM_MS) return;
      // Trial clock retro-dates to the first lift frame — same rule as level 1.
      this.holdStartedAtMs = this.liftSinceMs;
      this.touchdownFrames = 0;
      this.touchdownStartedAtMs = null;
      this.phase_ = 'hold';
      this.events.push({ kind: 'phase', phase: 'hold' });
      return;
    }

    // phase === 'hold'
    const holdStarted = this.holdStartedAtMs as number;
    if (nowMs - holdStarted >= this.config.maxTrialMs) {
      this.holdEndedAtMs = holdStarted + this.config.maxTrialMs;
      this.finishWith('measured', nowMs);
      return;
    }
    const raised = selectedLegRaised(sample.output.frame, bodyUnit, this.config.standingLeg);
    if (raised) {
      this.touchdownFrames = 0;
      this.touchdownStartedAtMs = null;
      return;
    }
    if (this.touchdownFrames === 0) this.touchdownStartedAtMs = nowMs;
    this.touchdownFrames++;
    if (this.touchdownFrames >= BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES) {
      // Touchdown = valid degradation under load (F5), never an error.
      this.holdEndedAtMs = this.touchdownStartedAtMs ?? nowMs;
      this.finishWith('measured', nowMs);
    }
  }

  /** The app left the foreground mid-run: honest invalidation. */
  appBackgrounded(nowMs: number): void {
    if (this.phase_ === 'complete') return;
    this.outcome = null;
    this.phase_ = 'complete';
    this.backgrounded = true;
    this.holdEndedAtMs = this.holdEndedAtMs ?? nowMs;
    this.events.push({ kind: 'phase', phase: 'complete' });
  }
  private backgrounded = false;

  private finishWith(outcome: 'measured' | 'tracking_interrupted' | 'setup_timed_out', _nowMs: number): void {
    this.outcome = outcome;
    this.phase_ = 'complete';
    this.events.push({ kind: 'phase', phase: 'complete' });
  }

  /**
   * Build the result once the run has completed. The speech summary comes
   * from the VAD monitor's stop(); the verbal-task floor decides validity
   * only for otherwise-measured runs (movement problems win the reason).
   */
  result(speech: SpeechActivitySummary): DualTaskResult {
    const base = {
      schemaVersion: DUAL_TASK_RESULT_SCHEMA_VERSION,
      movementId: this.config.movementId,
    } as const;
    if (this.backgrounded) {
      return { ...base, status: 'invalid', invalidReason: 'app_backgrounded' };
    }
    if (this.outcome === 'tracking_interrupted') {
      return { ...base, status: 'invalid', invalidReason: 'tracking_interrupted' };
    }
    if (this.outcome === 'setup_timed_out' || this.outcome === null) {
      // Never assumed the stance — recorded as a skip, not a failure.
      return { ...base, status: 'skipped' };
    }
    const holdMs = Math.max(0, (this.holdEndedAtMs as number) - (this.holdStartedAtMs as number));
    const dualTaskSeconds = Math.min(this.config.maxTrialMs, holdMs) / 1000;
    if (!verbalTaskPerformed(speech)) {
      // She left the VERBAL task — invalid, never scored as excellent movement.
      return {
        ...base,
        status: 'invalid',
        invalidReason: 'no_speech_detected',
        speechActiveMs: speech.speechActiveMs,
      };
    }
    const costPercent = computeDualTaskCostPercent({
      singleTaskSeconds: this.config.singleTaskSeconds,
      dualTaskSeconds,
    });
    const dualCeiling = holdMs >= this.config.maxTrialMs;
    return {
      ...base,
      status: 'measured',
      singleTaskSeconds: this.config.singleTaskSeconds,
      dualTaskSeconds,
      costPercent,
      ...(this.config.singleTaskCeiling || dualCeiling ? { ceilingLimited: true } : {}),
      speechActiveMs: speech.speechActiveMs,
    };
  }
}
