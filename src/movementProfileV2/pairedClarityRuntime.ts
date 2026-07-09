/**
 * Headless foundation for Pearl's matched cognitive-motor balance pair.
 *
 * The pair is deliberately separate from the official Balance result:
 * one solo hold establishes a local comparator, a fixed rest follows, then
 * the same hold is repeated with a cognitive task. Both trials share the
 * official one-leg lift/touchdown predicates and the same immutable protocol
 * metadata. Nothing here reads history, owns a camera, or performs speech
 * recognition.
 */

import type { BodySide } from '../checkup/protocolSetup';
import {
  DEFAULT_ONE_LEG_BALANCE_V2_CONFIG,
  ONE_LEG_BALANCE_V2_ID,
} from '../movements/oneLegBalanceV2';
import { computeDualTaskCostPercent } from '../checkup/clarityInstruments';
import { DUAL_TASK_RUNTIME_DEFAULTS } from './dualTaskRuntime';
import {
  BALANCE_LIFT_CONFIRM_MS,
  BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES,
  selectedLegRaised,
  type MovementProfileV2LivePoseSample,
} from './liveCoordinator';

export const PAIRED_CLARITY_PROTOCOL_ID = 'pearl_paired_clarity_balance_v1' as const;
export const PAIRED_CLARITY_PROTOCOL_VERSION = 1 as const;
export const PAIRED_CLARITY_STANCE_ID = 'single_leg_eyes_open_v1' as const;
export const PAIRED_CLARITY_ORDER = 'solo_then_dual' as const;

export type PairedClarityPhase =
  | 'solo_setup'
  | 'solo_hold'
  | 'standardized_rest'
  | 'dual_setup'
  | 'dual_hold'
  | 'awaiting_cognitive_outcome'
  | 'complete';

/**
 * These thresholds are supplied by the caller and frozen into every result.
 * The runtime intentionally has no undocumented "scientific" defaults; the
 * release protocol must choose them from target-user validation.
 */
export interface PairedClarityValidityPolicy {
  /** Solo holds below this duration are too close to the floor to compare. */
  readonly minSoloHoldMs: number;
  /** Solo holds within this distance of the cap are treated as saturated. */
  readonly ceilingExclusionMarginMs: number;
  /** Minimum number of scorable cognitive responses during the dual hold. */
  readonly minCognitiveAttempts: number;
  /** Inclusive correct / attempted threshold, from 0 to 1. */
  readonly minCognitiveAccuracy: number;
}

export interface PairedClarityProtocolMetadata {
  readonly protocolId: typeof PAIRED_CLARITY_PROTOCOL_ID;
  readonly protocolVersion: typeof PAIRED_CLARITY_PROTOCOL_VERSION;
  readonly movementId: typeof ONE_LEG_BALANCE_V2_ID;
  readonly stanceId: typeof PAIRED_CLARITY_STANCE_ID;
  readonly standingSide: BodySide;
  readonly order: typeof PAIRED_CLARITY_ORDER;
  readonly trialCapMs: number;
  readonly standardizedRestMs: number;
  readonly liftConfirmMs: number;
  readonly touchdownDebounceFrames: number;
  readonly trackingLossConfirmFrames: number;
  readonly validityPolicy: PairedClarityValidityPolicy;
}

export interface PairedClarityCognitiveAggregateInput {
  readonly attempts: number;
  readonly correct: number;
  readonly errors: number;
}

export interface PairedClarityCognitiveAggregate {
  readonly attempts: number;
  readonly correct: number;
  readonly errors: number;
  readonly accuracy: number;
}

export type PairedClarityTrialTermination = 'touchdown' | 'ceiling';

export interface PairedClarityTrialResult {
  readonly kind: 'solo' | 'dual';
  readonly startedAtMs: number;
  readonly endedAtMs: number;
  readonly durationMs: number;
  readonly durationSec: number;
  readonly termination: PairedClarityTrialTermination;
}

export type PairedClarityIneligibleReason =
  | 'solo_below_floor'
  | 'solo_at_or_near_ceiling';

export type PairedClarityInvalidReason =
  | 'solo_setup_timed_out'
  | 'dual_setup_timed_out'
  | 'solo_tracking_interrupted'
  | 'dual_tracking_interrupted'
  | 'app_backgrounded'
  | 'cognitive_aggregate_invalid'
  | 'cognitive_participation_below_floor'
  | 'cognitive_accuracy_below_floor'
  | 'cognitive_unavailable'
  | 'cognitive_interrupted';

interface PairedClarityResultBase {
  protocol: PairedClarityProtocolMetadata;
}

export type PairedClarityResult =
  | (PairedClarityResultBase & {
      status: 'measured';
      solo: PairedClarityTrialResult;
      dual: PairedClarityTrialResult;
      cognitive: PairedClarityCognitiveAggregate;
      /** (solo - dual) / solo * 100. Negative values are preserved. */
      motorCostPercent: number;
      ceilingLimited: boolean;
    })
  | (PairedClarityResultBase & {
      status: 'ineligible';
      reason: PairedClarityIneligibleReason;
      solo: PairedClarityTrialResult;
    })
  | (PairedClarityResultBase & {
      status: 'invalid';
      reason: PairedClarityInvalidReason;
      solo?: PairedClarityTrialResult;
      dual?: PairedClarityTrialResult;
      cognitive?: PairedClarityCognitiveAggregate;
    });

export interface PairedClarityRuntimeInput {
  readonly standingSide: BodySide;
  readonly validityPolicy: PairedClarityValidityPolicy;
}

type ActiveTrialKind = 'solo' | 'dual';

/**
 * One-use state machine. A fresh instance is required for every official
 * check-up so no state can cross sessions.
 */
export class PairedClarityRuntime {
  readonly protocol: PairedClarityProtocolMetadata;

  private phase_: PairedClarityPhase = 'solo_setup';
  private result_: PairedClarityResult | null = null;
  private setupStartedAtMs: number | null = null;
  private liftSinceMs: number | null = null;
  private holdStartedAtMs: number | null = null;
  private restUntilMs: number | null = null;
  private touchdownFrames = 0;
  private touchdownStartedAtMs: number | null = null;
  private lostFrames = 0;
  private lastNowMs: number | null = null;
  private solo_: PairedClarityTrialResult | null = null;
  private dual_: PairedClarityTrialResult | null = null;

  constructor(input: PairedClarityRuntimeInput) {
    assertValidityPolicy(input.validityPolicy, DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs);
    this.protocol = Object.freeze({
      protocolId: PAIRED_CLARITY_PROTOCOL_ID,
      protocolVersion: PAIRED_CLARITY_PROTOCOL_VERSION,
      movementId: ONE_LEG_BALANCE_V2_ID,
      stanceId: PAIRED_CLARITY_STANCE_ID,
      standingSide: input.standingSide,
      order: PAIRED_CLARITY_ORDER,
      trialCapMs: DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs,
      standardizedRestMs: DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.restMs,
      liftConfirmMs: BALANCE_LIFT_CONFIRM_MS,
      touchdownDebounceFrames: BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES,
      trackingLossConfirmFrames: DUAL_TASK_RUNTIME_DEFAULTS.trackingLossConfirmFrames,
      validityPolicy: Object.freeze({ ...input.validityPolicy }),
    });
  }

  get phase(): PairedClarityPhase {
    return this.phase_;
  }

  get result(): PairedClarityResult | null {
    return this.result_;
  }

  restRemainingMs(nowMs: number): number {
    if (this.phase_ !== 'standardized_rest' || this.restUntilMs === null) return 0;
    return Math.max(0, this.restUntilMs - nowMs);
  }

  /** Absolute monotonic deadline for the fixed rest, or null outside it. */
  get standardizedRestEndsAtMs(): number | null {
    return this.phase_ === 'standardized_rest' ? this.restUntilMs : null;
  }

  /** Feed one pose sample with its monotonic receive timestamp. */
  update(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (!Number.isFinite(nowMs)) return;
    if (this.lastNowMs !== null && nowMs < this.lastNowMs) return;
    this.lastNowMs = nowMs;
    if (this.phase_ === 'complete' || this.phase_ === 'awaiting_cognitive_outcome') return;

    if (this.phase_ === 'standardized_rest') {
      if (this.restUntilMs !== null && nowMs >= this.restUntilMs) {
        this.enterSetup('dual', nowMs);
      }
      return;
    }

    const trialKind = this.activeTrialKind();
    if (!trialKind) return;

    if (this.setupStartedAtMs === null) this.setupStartedAtMs = nowMs;
    if (this.isSetupPhase()) {
      if (nowMs - this.setupStartedAtMs >= DUAL_TASK_RUNTIME_DEFAULTS.setupTimeoutMs) {
        this.finishInvalid(trialKind === 'solo' ? 'solo_setup_timed_out' : 'dual_setup_timed_out');
        return;
      }
      this.updateSetup(sample, nowMs, trialKind);
      return;
    }

    this.updateHold(sample, nowMs, trialKind);
  }

  /** A foreground interruption invalidates the whole matched pair. */
  appBackgrounded(): void {
    if (this.phase_ === 'complete') return;
    this.finishInvalid('app_backgrounded');
  }

  /**
   * Finalize the dual run with an already-sanitized numeric aggregate.
   * Unknown properties on a runtime object are ignored: only these three
   * numbers are copied into the persisted local result.
   */
  completeCognitiveOutcome(input: PairedClarityCognitiveAggregateInput): boolean {
    if (this.phase_ !== 'awaiting_cognitive_outcome' || !this.solo_ || !this.dual_) return false;
    if (!validCognitiveAggregateInput(input)) {
      this.finishInvalid('cognitive_aggregate_invalid');
      return true;
    }

    const cognitive: PairedClarityCognitiveAggregate = {
      attempts: input.attempts,
      correct: input.correct,
      errors: input.errors,
      accuracy: input.attempts > 0 ? input.correct / input.attempts : 0,
    };
    const policy = this.protocol.validityPolicy;
    if (cognitive.attempts < policy.minCognitiveAttempts) {
      this.finishInvalid('cognitive_participation_below_floor', cognitive);
      return true;
    }
    if (cognitive.accuracy < policy.minCognitiveAccuracy) {
      this.finishInvalid('cognitive_accuracy_below_floor', cognitive);
      return true;
    }

    this.result_ = {
      status: 'measured',
      protocol: this.protocol,
      solo: this.solo_,
      dual: this.dual_,
      cognitive,
      motorCostPercent: computeDualTaskCostPercent({
        singleTaskSeconds: this.solo_.durationSec,
        dualTaskSeconds: this.dual_.durationSec,
      }),
      ceilingLimited: this.dual_.termination === 'ceiling',
    };
    this.phase_ = 'complete';
    return true;
  }

  /** Closed, non-content-bearing error path for an unavailable scorer. */
  invalidateCognitiveOutcome(reason: 'cognitive_unavailable' | 'cognitive_interrupted'): boolean {
    if (this.phase_ !== 'awaiting_cognitive_outcome') return false;
    this.finishInvalid(reason);
    return true;
  }

  private updateSetup(
    sample: MovementProfileV2LivePoseSample,
    nowMs: number,
    trialKind: ActiveTrialKind
  ): void {
    if (sample.trackingQuality !== 'good' || sample.output.bodyUnit === null) {
      this.liftSinceMs = null;
      return;
    }
    const raised = selectedLegRaised(
      sample.output.frame,
      sample.output.bodyUnit,
      this.protocol.standingSide
    );
    if (!raised) {
      this.liftSinceMs = null;
      return;
    }
    if (this.liftSinceMs === null) this.liftSinceMs = nowMs;
    if (nowMs - this.liftSinceMs < this.protocol.liftConfirmMs) return;

    this.holdStartedAtMs = this.liftSinceMs;
    this.touchdownFrames = 0;
    this.touchdownStartedAtMs = null;
    this.lostFrames = 0;
    this.phase_ = trialKind === 'solo' ? 'solo_hold' : 'dual_hold';
  }

  private updateHold(
    sample: MovementProfileV2LivePoseSample,
    nowMs: number,
    trialKind: ActiveTrialKind
  ): void {
    if (sample.trackingQuality !== 'good') {
      this.lostFrames++;
      if (this.lostFrames >= this.protocol.trackingLossConfirmFrames) {
        this.finishInvalid(
          trialKind === 'solo' ? 'solo_tracking_interrupted' : 'dual_tracking_interrupted'
        );
      }
      return;
    }
    this.lostFrames = 0;
    const bodyUnit = sample.output.bodyUnit;
    if (bodyUnit === null || this.holdStartedAtMs === null) return;

    if (nowMs - this.holdStartedAtMs >= this.protocol.trialCapMs) {
      this.finishTrial(trialKind, this.holdStartedAtMs + this.protocol.trialCapMs, 'ceiling');
      return;
    }

    const raised = selectedLegRaised(sample.output.frame, bodyUnit, this.protocol.standingSide);
    if (raised) {
      this.touchdownFrames = 0;
      this.touchdownStartedAtMs = null;
      return;
    }
    if (this.touchdownFrames === 0) this.touchdownStartedAtMs = nowMs;
    this.touchdownFrames++;
    if (this.touchdownFrames >= this.protocol.touchdownDebounceFrames) {
      this.finishTrial(trialKind, this.touchdownStartedAtMs ?? nowMs, 'touchdown');
    }
  }

  private finishTrial(
    kind: ActiveTrialKind,
    endedAtMs: number,
    termination: PairedClarityTrialTermination
  ): void {
    const startedAtMs = this.holdStartedAtMs as number;
    const durationMs = Math.max(0, Math.min(this.protocol.trialCapMs, endedAtMs - startedAtMs));
    const trial: PairedClarityTrialResult = {
      kind,
      startedAtMs,
      endedAtMs: startedAtMs + durationMs,
      durationMs,
      durationSec: durationMs / 1000,
      termination,
    };

    if (kind === 'solo') {
      this.solo_ = trial;
      const policy = this.protocol.validityPolicy;
      if (durationMs < policy.minSoloHoldMs) {
        this.result_ = {
          status: 'ineligible',
          reason: 'solo_below_floor',
          protocol: this.protocol,
          solo: trial,
        };
        this.phase_ = 'complete';
        return;
      }
      if (durationMs >= this.protocol.trialCapMs - policy.ceilingExclusionMarginMs) {
        this.result_ = {
          status: 'ineligible',
          reason: 'solo_at_or_near_ceiling',
          protocol: this.protocol,
          solo: trial,
        };
        this.phase_ = 'complete';
        return;
      }
      this.phase_ = 'standardized_rest';
      this.restUntilMs = trial.endedAtMs + this.protocol.standardizedRestMs;
      this.resetTrialState();
      return;
    }

    this.dual_ = trial;
    this.phase_ = 'awaiting_cognitive_outcome';
    this.resetTrialState();
  }

  private enterSetup(kind: ActiveTrialKind, nowMs: number): void {
    this.phase_ = kind === 'solo' ? 'solo_setup' : 'dual_setup';
    this.setupStartedAtMs = nowMs;
    this.restUntilMs = null;
    this.resetTrialState();
  }

  private resetTrialState(): void {
    this.liftSinceMs = null;
    this.holdStartedAtMs = null;
    this.touchdownFrames = 0;
    this.touchdownStartedAtMs = null;
    this.lostFrames = 0;
  }

  private activeTrialKind(): ActiveTrialKind | null {
    if (this.phase_ === 'solo_setup' || this.phase_ === 'solo_hold') return 'solo';
    if (this.phase_ === 'dual_setup' || this.phase_ === 'dual_hold') return 'dual';
    return null;
  }

  private isSetupPhase(): boolean {
    return this.phase_ === 'solo_setup' || this.phase_ === 'dual_setup';
  }

  private finishInvalid(
    reason: PairedClarityInvalidReason,
    cognitive?: PairedClarityCognitiveAggregate
  ): void {
    this.result_ = {
      status: 'invalid',
      reason,
      protocol: this.protocol,
      ...(this.solo_ ? { solo: this.solo_ } : {}),
      ...(this.dual_ ? { dual: this.dual_ } : {}),
      ...(cognitive ? { cognitive } : {}),
    };
    this.phase_ = 'complete';
    this.resetTrialState();
  }
}

function assertValidityPolicy(policy: PairedClarityValidityPolicy, trialCapMs: number): void {
  const floorValid =
    Number.isFinite(policy.minSoloHoldMs) &&
    policy.minSoloHoldMs > 0 &&
    policy.minSoloHoldMs < trialCapMs;
  const ceilingValid =
    Number.isFinite(policy.ceilingExclusionMarginMs) &&
    policy.ceilingExclusionMarginMs >= 0 &&
    policy.ceilingExclusionMarginMs < trialCapMs - policy.minSoloHoldMs;
  const attemptsValid =
    Number.isInteger(policy.minCognitiveAttempts) && policy.minCognitiveAttempts > 0;
  const accuracyValid =
    Number.isFinite(policy.minCognitiveAccuracy) &&
    policy.minCognitiveAccuracy >= 0 &&
    policy.minCognitiveAccuracy <= 1;
  if (!floorValid || !ceilingValid || !attemptsValid || !accuracyValid) {
    throw new Error('invalid paired Clarity validity policy');
  }
}

function validCognitiveAggregateInput(input: PairedClarityCognitiveAggregateInput): boolean {
  return (
    !!input &&
    typeof input === 'object' &&
    Number.isInteger(input.attempts) &&
    Number.isInteger(input.correct) &&
    Number.isInteger(input.errors) &&
    input.attempts >= 0 &&
    input.correct >= 0 &&
    input.errors >= 0 &&
    input.correct + input.errors === input.attempts
  );
}
