export const VALID_TIME_TIMERS_ENABLED = true;

export type ValidTimeState =
  | 'waiting_for_position'
  | 'counting'
  | 'grace'
  | 'paused'
  | 'complete'
  | 'safety_cap';

export type TimerValidationMode =
  | 'strict_valid_position'
  | 'broad_setup_gated'
  | 'subject_visible_only';

export interface ValidTimeAccumulatorConfig {
  targetValidMs: number;
  startValidAfterMs: number;
  resumeValidAfterMs: number;
  invalidGraceMs: number;
  pauseAfterInvalidMs: number;
  safetyCapMs: number;
}

export interface ValidTimeAccumulatorInput {
  nowMs: number;
  isPositionValid: boolean;
  isTrackingReliable: boolean;
}

export interface ValidTimeAccumulatorSnapshot {
  state: ValidTimeState;
  accumulatedValidMs: number;
  wallClockMs: number;
  currentContinuousValidMs: number;
  longestContinuousValidMs: number;
  pauseCount: number;
  positionLostEvents: number;
  trackingLostMs: number;
  completedByValidTime: boolean;
  endedBySafetyCap: boolean;
}

export interface ValidTimeResult {
  targetValidSeconds: number;
  accumulatedValidSeconds: number;
  wallClockSeconds: number;
  pauseCount: number;
  longestContinuousValidSeconds: number;
  positionLostEvents: number;
  trackingLostSeconds: number;
  completedByValidTime: boolean;
  endedBySafetyCap: boolean;
  validationMode?: TimerValidationMode;
}

export const DEFAULT_VALID_TIME_TIMING = {
  startValidAfterMs: 750,
  resumeValidAfterMs: 500,
  invalidGraceMs: 1000,
  pauseAfterInvalidMs: 1500,
} as const;

export function validTimeConfigForTarget(targetValidMs: number): ValidTimeAccumulatorConfig {
  return {
    targetValidMs,
    safetyCapMs: targetValidMs * 3,
    ...DEFAULT_VALID_TIME_TIMING,
  };
}

export function broadSetupValidTimeConfigForTarget(targetValidMs: number): ValidTimeAccumulatorConfig {
  return {
    targetValidMs,
    safetyCapMs: targetValidMs * 3,
    startValidAfterMs: 500,
    resumeValidAfterMs: 500,
    invalidGraceMs: 1500,
    pauseAfterInvalidMs: 2000,
  };
}

export function createValidTimeAccumulator(
  config: ValidTimeAccumulatorConfig
): ValidTimeAccumulator {
  return new ValidTimeAccumulator(config);
}

export function getValidTimeResult(
  snapshot: ValidTimeAccumulatorSnapshot,
  targetValidMs: number,
  validationMode?: TimerValidationMode
): ValidTimeResult {
  const result: ValidTimeResult = {
    targetValidSeconds: targetValidMs / 1000,
    accumulatedValidSeconds: snapshot.accumulatedValidMs / 1000,
    wallClockSeconds: snapshot.wallClockMs / 1000,
    pauseCount: snapshot.pauseCount,
    longestContinuousValidSeconds: snapshot.longestContinuousValidMs / 1000,
    positionLostEvents: snapshot.positionLostEvents,
    trackingLostSeconds: snapshot.trackingLostMs / 1000,
    completedByValidTime: snapshot.completedByValidTime,
    endedBySafetyCap: snapshot.endedBySafetyCap,
  };
  if (validationMode) result.validationMode = validationMode;
  return result;
}

export function validTimeCaptionForState(
  state: ValidTimeState | null | undefined,
  validationMode: TimerValidationMode = 'strict_valid_position'
): string | null {
  switch (state) {
    case 'waiting_for_position':
      return 'Get into position';
    case 'counting':
    case 'grace':
      return validationMode === 'broad_setup_gated' ? 'Keep moving' : 'Hold steady';
    case 'paused':
      return 'Timer paused - return to position';
    case 'complete':
      return "That's your hold";
    case 'safety_cap':
      return 'Rest when ready';
    default:
      return null;
  }
}

export class ValidTimeAccumulator {
  private readonly config: ValidTimeAccumulatorConfig;
  private readonly snapshot_: ValidTimeAccumulatorSnapshot = {
    state: 'waiting_for_position',
    accumulatedValidMs: 0,
    wallClockMs: 0,
    currentContinuousValidMs: 0,
    longestContinuousValidMs: 0,
    pauseCount: 0,
    positionLostEvents: 0,
    trackingLostMs: 0,
    completedByValidTime: false,
    endedBySafetyCap: false,
  };

  private firstMs = -1;
  private lastMs = -1;
  private validRunStartMs = -1;
  private resumeRunStartMs = -1;
  private invalidSinceMs = -1;
  private wasEffectivelyValid = false;

  constructor(config: ValidTimeAccumulatorConfig) {
    this.config = config;
  }

  get snapshot(): ValidTimeAccumulatorSnapshot {
    return this.snapshot_;
  }

  update(input: ValidTimeAccumulatorInput): ValidTimeAccumulatorSnapshot {
    const s = this.snapshot_;
    const now = input.nowMs;
    if (this.firstMs < 0) {
      this.firstMs = now;
      this.lastMs = now;
    }

    const dt = Math.max(0, now - this.lastMs);
    this.lastMs = now;
    s.wallClockMs = Math.max(0, now - this.firstMs);
    if (!input.isTrackingReliable) s.trackingLostMs += dt;

    if (s.state === 'complete' || s.state === 'safety_cap') {
      return s;
    }

    const effectiveValid = input.isTrackingReliable && input.isPositionValid;
    if (this.wasEffectivelyValid && !effectiveValid) {
      s.positionLostEvents++;
      this.invalidSinceMs = now;
    }
    this.wasEffectivelyValid = effectiveValid;

    if (s.wallClockMs >= this.config.safetyCapMs) {
      this.endBySafetyCap();
      return s;
    }

    switch (s.state) {
      case 'waiting_for_position':
        this.updateWaiting(now, effectiveValid);
        break;
      case 'counting':
        this.updateCounting(now, dt, effectiveValid);
        break;
      case 'grace':
        this.updateGrace(now, effectiveValid);
        break;
      case 'paused':
        this.updatePaused(now, effectiveValid);
        break;
    }

    if (s.accumulatedValidMs >= this.config.targetValidMs) {
      s.accumulatedValidMs = this.config.targetValidMs;
      s.completedByValidTime = true;
      s.state = 'complete';
    }
    return s;
  }

  reset(): void {
    const s = this.snapshot_;
    s.state = 'waiting_for_position';
    s.accumulatedValidMs = 0;
    s.wallClockMs = 0;
    s.currentContinuousValidMs = 0;
    s.longestContinuousValidMs = 0;
    s.pauseCount = 0;
    s.positionLostEvents = 0;
    s.trackingLostMs = 0;
    s.completedByValidTime = false;
    s.endedBySafetyCap = false;
    this.firstMs = -1;
    this.lastMs = -1;
    this.validRunStartMs = -1;
    this.resumeRunStartMs = -1;
    this.invalidSinceMs = -1;
    this.wasEffectivelyValid = false;
  }

  private updateWaiting(now: number, effectiveValid: boolean): void {
    const s = this.snapshot_;
    if (!effectiveValid) {
      this.validRunStartMs = -1;
      return;
    }
    if (this.validRunStartMs < 0) this.validRunStartMs = now;
    if (now - this.validRunStartMs >= this.config.startValidAfterMs) {
      s.state = 'counting';
      s.currentContinuousValidMs = 0;
      this.invalidSinceMs = -1;
    }
  }

  private updateCounting(now: number, dt: number, effectiveValid: boolean): void {
    const s = this.snapshot_;
    if (!effectiveValid) {
      s.state = 'grace';
      if (this.invalidSinceMs < 0) this.invalidSinceMs = now;
      return;
    }
    this.invalidSinceMs = -1;
    s.accumulatedValidMs += dt;
    s.currentContinuousValidMs += dt;
    if (s.currentContinuousValidMs > s.longestContinuousValidMs) {
      s.longestContinuousValidMs = s.currentContinuousValidMs;
    }
  }

  private updateGrace(now: number, effectiveValid: boolean): void {
    const s = this.snapshot_;
    if (effectiveValid) {
      s.state = 'counting';
      this.invalidSinceMs = -1;
      return;
    }
    const invalidForMs = this.invalidSinceMs >= 0 ? now - this.invalidSinceMs : 0;
    const pauseAfterMs = Math.max(this.config.invalidGraceMs, this.config.pauseAfterInvalidMs);
    if (invalidForMs >= pauseAfterMs) {
      s.state = 'paused';
      s.pauseCount++;
      s.currentContinuousValidMs = 0;
      this.resumeRunStartMs = -1;
    }
  }

  private updatePaused(now: number, effectiveValid: boolean): void {
    const s = this.snapshot_;
    if (!effectiveValid) {
      this.resumeRunStartMs = -1;
      return;
    }
    if (this.resumeRunStartMs < 0) this.resumeRunStartMs = now;
    if (now - this.resumeRunStartMs >= this.config.resumeValidAfterMs) {
      s.state = 'counting';
      this.invalidSinceMs = -1;
      this.resumeRunStartMs = -1;
    }
  }

  private endBySafetyCap(): void {
    const s = this.snapshot_;
    s.endedBySafetyCap = true;
    s.state = 'safety_cap';
  }
}
