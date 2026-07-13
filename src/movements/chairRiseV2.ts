import { numberCue, VoiceCueKey } from '../audio/cues';
import {
  MovementProfileV2EvidenceStatus,
  ProtocolMeasurementWindow,
} from '../checkup/protocolEvidence';
import {
  ChairRiseV2Setup,
  createChairRiseV2Setup,
  setupHasUserConfirmation,
} from '../checkup/protocolSetup';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../checkup/protocolPolicy';
import { MovementDefinition, MovementResultBase } from './types';
import { registerMovement } from './registry';
import { ProtocolOnlyGrader } from './protocolOnlyGrader';

export const CHAIR_RISE_V2_ID = 'chair-rise-30s-v2';

export interface ChairRiseV2RepStat {
  completedAtMs: number;
  meanVel: number;
  peakVel: number;
  durationMs: number;
  pushOff: boolean;
  creditedAtWindowExpiry: boolean;
}

export interface ChairRiseV2Result extends MovementResultBase {
  protocolPolicyId: typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  evidenceStatus: MovementProfileV2EvidenceStatus;
  setup: ChairRiseV2Setup | null;
  setupConfidence: ChairRiseV2Setup['confidence'] | null;
  practiceRepCompleted: boolean;
  activeWindowMs: number;
  activeMeasurementWindows: ProtocolMeasurementWindow[];
  fullStandRule: 'stand_completed_at_or_before_window_end';
  reps: number;
  repStats: ChairRiseV2RepStat[];
  sessionMeanVel: number;
  sessionMeanPeakVel: number;
  pushOffDetected: boolean;
  fullStandAtExpiryCounted: boolean;
  invalidReasons: string[];
}

export interface ChairRiseV2Config {
  activeWindowMs: number;
}

export type ChairRiseV2Phase = 'setup' | 'practice' | 'countdown' | 'active' | 'complete';

export interface ChairRiseV2StandInput {
  completedAtMs: number;
  meanVel?: number;
  peakVel?: number;
  durationMs?: number;
  pushOff?: boolean;
}

export const DEFAULT_CHAIR_RISE_V2_CONFIG: ChairRiseV2Config = {
  activeWindowMs: 30000,
};

export class ChairRiseV2ProtocolController {
  private readonly config: ChairRiseV2Config;
  private phase_: ChairRiseV2Phase = 'setup';
  private setup_: ChairRiseV2Setup | null = null;
  private practiceRepCompleted_ = false;
  private activeStartedAtMs: number | null = null;
  private windows: ProtocolMeasurementWindow[] = [];
  private reps: ChairRiseV2RepStat[] = [];
  private interruptions = 0;

  constructor(config: ChairRiseV2Config = DEFAULT_CHAIR_RISE_V2_CONFIG) {
    this.config = config;
  }

  get phase(): ChairRiseV2Phase {
    return this.phase_;
  }

  confirmSetup(setup: ChairRiseV2Setup, _nowMs: number): boolean {
    if (this.phase_ !== 'setup') return false;
    this.setup_ = setup;
    if (!setupHasUserConfirmation(setup)) return false;
    this.phase_ = 'practice';
    return true;
  }

  completePracticeRep(_nowMs: number): boolean {
    if (this.phase_ !== 'practice') return false;
    this.practiceRepCompleted_ = true;
    this.phase_ = 'countdown';
    return true;
  }

  startActive(nowMs: number): boolean {
    if (this.phase_ !== 'countdown' || !this.practiceRepCompleted_) return false;
    this.activeStartedAtMs = nowMs;
    this.phase_ = 'active';
    this.windows.push({
      startedAtMs: nowMs,
      endedAtMs: nowMs + this.config.activeWindowMs,
      valid: true,
      reason: 'scheduled_active_window',
    });
    return true;
  }

  creditStand(input: ChairRiseV2StandInput): boolean {
    if (this.phase_ !== 'active' || this.activeStartedAtMs === null) return false;
    const elapsed = input.completedAtMs - this.activeStartedAtMs;
    if (elapsed < 0 || elapsed > this.config.activeWindowMs) return false;
    const creditedAtWindowExpiry = elapsed === this.config.activeWindowMs;
    this.reps.push({
      completedAtMs: input.completedAtMs,
      meanVel: finiteOrNaN(input.meanVel),
      peakVel: finiteOrNaN(input.peakVel),
      durationMs: finiteOrNaN(input.durationMs),
      pushOff: input.pushOff === true,
      creditedAtWindowExpiry,
    });
    return true;
  }

  trackingInterrupted(nowMs: number): void {
    if (this.phase_ !== 'active') return;
    this.interruptions++;
    this.windows.push({
      startedAtMs: nowMs,
      endedAtMs: nowMs,
      valid: false,
      reason: 'tracking_interrupted_state_reset',
    });
  }

  finish(_nowMs: number): ChairRiseV2Result {
    if (this.phase_ !== 'complete') {
      this.phase_ = 'complete';
    }
    return this.result();
  }

  private result(): ChairRiseV2Result {
    const invalidReasons: string[] = [];
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) invalidReasons.push('setup_not_confirmed');
    if (!this.practiceRepCompleted_) invalidReasons.push('practice_not_completed');
    if (this.activeStartedAtMs === null) invalidReasons.push('active_window_not_started');
    if (this.reps.length === 0) invalidReasons.push('no_valid_measurement');
    if (this.interruptions > 0) invalidReasons.push('tracking_interrupted');

    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    if (this.reps.length === 0) flags.push('no-measurement');
    if (invalidReasons.length > 0) flags.push('protocol-incomplete');

    return {
      movementId: CHAIR_RISE_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      evidenceStatus: this.evidenceStatus(invalidReasons),
      setup: this.setup_,
      setupConfidence: this.setup_?.confidence ?? null,
      practiceRepCompleted: this.practiceRepCompleted_,
      activeWindowMs: this.config.activeWindowMs,
      activeMeasurementWindows: this.windows.slice(),
      fullStandRule: 'stand_completed_at_or_before_window_end',
      reps: this.reps.length,
      repStats: this.reps.slice(),
      sessionMeanVel: mean(this.reps.map((rep) => rep.meanVel)),
      sessionMeanPeakVel: mean(this.reps.map((rep) => rep.peakVel)),
      pushOffDetected: this.reps.some((rep) => rep.pushOff),
      fullStandAtExpiryCounted: this.reps.some((rep) => rep.creditedAtWindowExpiry),
      invalidReasons,
      flags,
      interruptions: this.interruptions,
    };
  }

  private evidenceStatus(invalidReasons: readonly string[]): MovementProfileV2EvidenceStatus {
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) return 'raw_only_setup_uncertain';
    if (this.interruptions > 0) return 'raw_only_tracking_uncertain';
    if (invalidReasons.includes('practice_not_completed') || invalidReasons.includes('active_window_not_started')) {
      return 'raw_only_protocol_incomplete';
    }
    if (this.reps.length === 0) return 'invalid_measurement';
    return 'reference_protocol_complete';
  }
}

export const chairRiseV2Definition: MovementDefinition<ChairRiseV2Result> = {
  id: CHAIR_RISE_V2_ID,
  displayName: '30-Second Chair Rise',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['chair'],
  durationMs: null,
  voice: {
    instructions: ['chair-stand-intro', 'chair-stand-setup'],
    endCue: 'times-up',
  },
  createGrader: () =>
    new ProtocolOnlyGrader(() => ({
      movementId: CHAIR_RISE_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      evidenceStatus: 'invalid_measurement',
      setup: createChairRiseV2Setup({ confirmed: false, source: 'direct_call' }),
      setupConfidence: 'bypassed',
      practiceRepCompleted: false,
      activeWindowMs: DEFAULT_CHAIR_RISE_V2_CONFIG.activeWindowMs,
      activeMeasurementWindows: [],
      fullStandRule: 'stand_completed_at_or_before_window_end',
      reps: 0,
      repStats: [],
      sessionMeanVel: NaN,
      sessionMeanPeakVel: NaN,
      pushOffDetected: false,
      fullStandAtExpiryCounted: false,
      invalidReasons: ['protocol_controller_required'],
      flags: ['no-measurement', 'protocol-controller-required'],
      interruptions: 0,
    })),
  resultCues(result: ChairRiseV2Result): VoiceCueKey[] {
    if (result.reps <= 0) return ['no-reps'];
    return ['you-completed', numberCue(result.reps), 'stands-suffix'];
  },
};

registerMovement(chairRiseV2Definition);

function finiteOrNaN(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : NaN;
}

function mean(values: readonly number[]): number {
  let sum = 0;
  let count = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    sum += value;
    count++;
  }
  return count > 0 ? sum / count : NaN;
}
