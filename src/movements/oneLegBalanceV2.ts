import { VoiceCueKey } from '../audio/cues';
import {
  MovementProfileV2EvidenceStatus,
  ProtocolMeasurementWindow,
} from '../checkup/protocolEvidence';
import {
  BodySide,
  OneLegBalanceV2Setup,
  createOneLegBalanceV2Setup,
  setupHasUserConfirmation,
} from '../checkup/protocolSetup';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../checkup/protocolPolicy';
import { MovementDefinition, MovementResultBase } from './types';
import { registerMovement } from './registry';
import { ProtocolOnlyGrader } from './protocolOnlyGrader';

export const ONE_LEG_BALANCE_V2_ID = 'one-leg-balance-45s-v2';

export type OneLegBalanceV2TrialTermination =
  | 'ceiling'
  | 'touchdown'
  | 'support_touched'
  | 'user_stopped'
  | 'tracking_invalid'
  | 'app_backgrounded'
  | 'hard_cap';

export interface OneLegBalanceV2TrialResult {
  attemptNumber: number;
  validTrialNumber: number | null;
  startedAtMs: number;
  endedAtMs: number;
  holdSec: number;
  swaySd: number | null;
  termination: OneLegBalanceV2TrialTermination;
  valid: boolean;
}

export interface OneLegBalanceV2RestEvent {
  startedAtMs: number;
  endedAtMs: number;
  reason: 'between_trials' | 'retry_after_invalid' | 'declined';
}

export interface OneLegBalanceV2Result extends MovementResultBase {
  protocolPolicyId: typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  evidenceStatus: MovementProfileV2EvidenceStatus;
  setup: OneLegBalanceV2Setup | null;
  standingLeg: BodySide | null;
  setupConfidence: OneLegBalanceV2Setup['confidence'] | null;
  bestHoldSec: number;
  bestTrialNumber: number | null;
  validTrialCount: number;
  attemptedTrialCount: number;
  trials: OneLegBalanceV2TrialResult[];
  rests: OneLegBalanceV2RestEvent[];
  retryCount: number;
  declinedRemainingTrials: boolean;
  hardCapReached: boolean;
  activeMeasurementWindows: ProtocolMeasurementWindow[];
  invalidReasons: string[];
}

export interface OneLegBalanceV2Config {
  maxTrialMs: number;
  maxValidTrials: number;
  restMs: number;
  hardCapMs: number;
}

export type OneLegBalanceV2Phase = 'setup' | 'ready' | 'trial' | 'rest' | 'complete';

export const DEFAULT_ONE_LEG_BALANCE_V2_CONFIG: OneLegBalanceV2Config = {
  maxTrialMs: 45000,
  maxValidTrials: 3,
  restMs: 30000,
  hardCapMs: 360000,
};

export class OneLegBalanceV2ProtocolController {
  private readonly config: OneLegBalanceV2Config;
  private phase_: OneLegBalanceV2Phase = 'setup';
  private setup_: OneLegBalanceV2Setup | null = null;
  private setupAtMs: number | null = null;
  private activeTrialStartedAtMs: number | null = null;
  private trials: OneLegBalanceV2TrialResult[] = [];
  private rests: OneLegBalanceV2RestEvent[] = [];
  private windows: ProtocolMeasurementWindow[] = [];
  private retryCount_ = 0;
  private restUntilMs: number | null = null;
  private declinedRemainingTrials_ = false;
  private hardCapReached_ = false;

  constructor(config: OneLegBalanceV2Config = DEFAULT_ONE_LEG_BALANCE_V2_CONFIG) {
    this.config = config;
  }

  get phase(): OneLegBalanceV2Phase {
    return this.phase_;
  }

  confirmSetup(setup: OneLegBalanceV2Setup, nowMs: number): boolean {
    if (this.phase_ !== 'setup') return false;
    this.setup_ = setup;
    this.setupAtMs = nowMs;
    if (!setupHasUserConfirmation(setup)) return false;
    this.phase_ = 'ready';
    return true;
  }

  updateSetupBeforeFirstTrial(setup: OneLegBalanceV2Setup): boolean {
    if (this.phase_ !== 'ready' || this.activeTrialStartedAtMs !== null || this.trials.length > 0) {
      return false;
    }
    if (!setupHasUserConfirmation(setup)) return false;
    this.setup_ = setup;
    return true;
  }

  startTrial(nowMs: number): boolean {
    if (!this.canContinue(nowMs)) return false;
    if (this.phase_ !== 'ready' && this.phase_ !== 'rest') return false;
    if (this.phase_ === 'rest' && this.restUntilMs !== null && nowMs < this.restUntilMs) return false;
    this.activeTrialStartedAtMs = nowMs;
    this.phase_ = 'trial';
    this.windows.push({
      startedAtMs: nowMs,
      endedAtMs: nowMs + this.config.maxTrialMs,
      valid: true,
      reason: 'trial_window',
    });
    return true;
  }

  completeTrial({
    nowMs,
    holdMs,
    swaySd = null,
    termination,
  }: {
    nowMs: number;
    holdMs: number;
    swaySd?: number | null;
    termination: 'touchdown' | 'support_touched' | 'user_stopped' | 'ceiling';
  }): boolean {
    if (this.phase_ !== 'trial' || this.activeTrialStartedAtMs === null) return false;
    const clampedHoldMs = Math.max(0, Math.min(this.config.maxTrialMs, holdMs));
    const ceiling = termination === 'ceiling' || clampedHoldMs >= this.config.maxTrialMs;
    const validTrialNumber = this.validTrialCount() + 1;
    this.trials.push({
      attemptNumber: this.trials.length + 1,
      validTrialNumber,
      startedAtMs: this.activeTrialStartedAtMs,
      endedAtMs: nowMs,
      holdSec: clampedHoldMs / 1000,
      swaySd: typeof swaySd === 'number' && Number.isFinite(swaySd) ? swaySd : null,
      termination: ceiling ? 'ceiling' : termination,
      valid: true,
    });
    this.activeTrialStartedAtMs = null;
    if (ceiling || validTrialNumber >= this.config.maxValidTrials) {
      this.phase_ = 'complete';
      return true;
    }
    this.enterRest(nowMs, 'between_trials');
    return true;
  }

  invalidateTrial(nowMs: number, reason: Extract<OneLegBalanceV2TrialTermination, 'tracking_invalid' | 'app_backgrounded'>): boolean {
    if (this.phase_ !== 'trial' || this.activeTrialStartedAtMs === null) return false;
    this.retryCount_++;
    this.trials.push({
      attemptNumber: this.trials.length + 1,
      validTrialNumber: null,
      startedAtMs: this.activeTrialStartedAtMs,
      endedAtMs: nowMs,
      holdSec: 0,
      swaySd: null,
      termination: reason,
      valid: false,
    });
    this.windows.push({
      startedAtMs: this.activeTrialStartedAtMs,
      endedAtMs: nowMs,
      valid: false,
      reason,
    });
    this.activeTrialStartedAtMs = null;
    this.enterRest(nowMs, 'retry_after_invalid');
    return true;
  }

  appBackgrounded(nowMs: number): boolean {
    return this.invalidateTrial(nowMs, 'app_backgrounded');
  }

  declineRemainingTrials(nowMs: number): boolean {
    if (this.phase_ !== 'rest' && this.phase_ !== 'ready') return false;
    this.declinedRemainingTrials_ = true;
    if (this.phase_ === 'rest') {
      this.closeOpenRest(nowMs, 'declined');
    }
    this.phase_ = 'complete';
    return true;
  }

  finish(nowMs: number): OneLegBalanceV2Result {
    if (this.phase_ === 'trial' && this.activeTrialStartedAtMs !== null) {
      this.trials.push({
        attemptNumber: this.trials.length + 1,
        validTrialNumber: null,
        startedAtMs: this.activeTrialStartedAtMs,
        endedAtMs: nowMs,
        holdSec: 0,
        swaySd: null,
        termination: this.hardCapElapsed(nowMs) ? 'hard_cap' : 'tracking_invalid',
        valid: false,
      });
      this.activeTrialStartedAtMs = null;
    }
    if (this.phase_ === 'rest') this.closeOpenRest(nowMs, 'between_trials');
    if (this.hardCapElapsed(nowMs)) this.hardCapReached_ = true;
    this.phase_ = 'complete';
    return this.result();
  }

  private canContinue(nowMs: number): boolean {
    if (this.hardCapElapsed(nowMs)) {
      this.hardCapReached_ = true;
      this.phase_ = 'complete';
      return false;
    }
    return true;
  }

  private enterRest(nowMs: number, reason: OneLegBalanceV2RestEvent['reason']): void {
    this.phase_ = 'rest';
    this.restUntilMs = nowMs + this.config.restMs;
    this.rests.push({ startedAtMs: nowMs, endedAtMs: this.restUntilMs, reason });
  }

  private closeOpenRest(nowMs: number, reason: OneLegBalanceV2RestEvent['reason']): void {
    const last = this.rests[this.rests.length - 1];
    if (!last) return;
    this.rests[this.rests.length - 1] = { ...last, endedAtMs: nowMs, reason };
  }

  private hardCapElapsed(nowMs: number): boolean {
    return this.setupAtMs !== null && nowMs - this.setupAtMs >= this.config.hardCapMs;
  }

  private validTrialCount(): number {
    return this.trials.filter((trial) => trial.valid).length;
  }

  private result(): OneLegBalanceV2Result {
    const validTrials = this.trials.filter((trial) => trial.valid);
    const best = validTrials.slice().sort((a, b) => b.holdSec - a.holdSec)[0] ?? null;
    const invalidReasons: string[] = [];
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) invalidReasons.push('setup_not_confirmed');
    if (validTrials.length === 0) invalidReasons.push('no_valid_measurement');
    if (this.retryCount_ > 0 && validTrials.length === 0) invalidReasons.push('tracking_interrupted');
    if (this.declinedRemainingTrials_) invalidReasons.push('user_declined_retry');
    if (this.hardCapReached_) invalidReasons.push('hard_cap_reached');

    const flags: string[] = [];
    if (this.retryCount_ > 0) flags.push('tracking-interrupted');
    if (validTrials.length === 0) flags.push('no-measurement');
    if (this.evidenceStatus(validTrials) !== 'reference_protocol_complete') flags.push('protocol-incomplete');

    return {
      movementId: ONE_LEG_BALANCE_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      evidenceStatus: this.evidenceStatus(validTrials),
      setup: this.setup_,
      standingLeg: this.setup_?.standingLeg ?? null,
      setupConfidence: this.setup_?.confidence ?? null,
      bestHoldSec: best ? best.holdSec : NaN,
      bestTrialNumber: best?.validTrialNumber ?? null,
      validTrialCount: validTrials.length,
      attemptedTrialCount: this.trials.length,
      trials: this.trials.slice(),
      rests: this.rests.slice(),
      retryCount: this.retryCount_,
      declinedRemainingTrials: this.declinedRemainingTrials_,
      hardCapReached: this.hardCapReached_,
      activeMeasurementWindows: this.windows.slice(),
      invalidReasons,
      flags,
      interruptions: this.retryCount_,
    };
  }

  private evidenceStatus(validTrials: readonly OneLegBalanceV2TrialResult[]): MovementProfileV2EvidenceStatus {
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) return 'raw_only_setup_uncertain';
    if (validTrials.length === 0 && this.retryCount_ > 0) return 'raw_only_tracking_uncertain';
    if (validTrials.length === 0) return 'invalid_measurement';
    if (this.hardCapReached_ || this.declinedRemainingTrials_) return 'raw_only_protocol_incomplete';
    if (validTrials.some((trial) => trial.termination === 'ceiling')) return 'reference_protocol_complete';
    if (validTrials.length >= this.config.maxValidTrials) return 'reference_protocol_complete';
    return 'raw_only_protocol_incomplete';
  }
}

export const oneLegBalanceV2Definition: MovementDefinition<OneLegBalanceV2Result> = {
  id: ONE_LEG_BALANCE_V2_ID,
  displayName: 'One-Leg Balance',
  cameraView: { view: 'front', requiredReliableSideChains: 2 },
  equipment: ['counter'],
  durationMs: null,
  voice: {
    instructions: ['balance-intro', 'balance-setup', 'balance-single-leg'],
  },
  createGrader: () =>
    new ProtocolOnlyGrader(() => ({
      movementId: ONE_LEG_BALANCE_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      evidenceStatus: 'invalid_measurement',
      setup: createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: false, source: 'direct_call' }),
      standingLeg: null,
      setupConfidence: 'bypassed',
      bestHoldSec: NaN,
      bestTrialNumber: null,
      validTrialCount: 0,
      attemptedTrialCount: 0,
      trials: [],
      rests: [],
      retryCount: 0,
      declinedRemainingTrials: false,
      hardCapReached: false,
      activeMeasurementWindows: [],
      invalidReasons: ['protocol_controller_required'],
      flags: ['no-measurement', 'protocol-controller-required'],
      interruptions: 0,
    })),
  resultCues(): VoiceCueKey[] {
    return ['item-complete'];
  },
};

registerMovement(oneLegBalanceV2Definition);
