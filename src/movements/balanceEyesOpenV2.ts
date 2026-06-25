import { VoiceCueKey } from '../audio/cues';
import {
  MovementProfileV2EvidenceStatus,
  ProtocolMeasurementWindow,
} from '../checkup/protocolEvidence';
import {
  type BodySide,
  type BalanceEyesOpenV2Setup,
  createBalanceEyesOpenV2Setup,
  setupHasUserConfirmation,
} from '../checkup/protocolSetup';
import type { MeasurementSideRole } from '../checkup/measurementContext';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../checkup/protocolPolicy';
import { ProtocolOnlyGrader } from './protocolOnlyGrader';
import { registerMovement } from './registry';
import type { MovementDefinition, MovementResultBase } from './types';

export const BALANCE_EYES_OPEN_V2_ID = 'balance-eyes-open-v2';
export const BALANCE_EYES_OPEN_V2_PROTOCOL_ID = 'home_balance_eyes_open_v2';
export const BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION = 2;

export type BalanceEyesOpenStageId =
  | 'feet_together_eyes_open_v2'
  | 'semi_tandem_eyes_open_v2'
  | 'tandem_eyes_open_v2'
  | 'single_leg_eyes_open_v2';

export type BalanceEyesOpenStageKind =
  | 'feet_together'
  | 'semi_tandem'
  | 'tandem'
  | 'single_leg';

export type BalanceStageEndReason =
  | 'completed_cap'
  | 'stance_lost'
  | 'step_detected'
  | 'touchdown'
  | 'support_touch_user_reported'
  | 'user_stopped'
  | 'tracking_interrupted'
  | 'cancelled'
  | 'invalid';

export type BalanceEyesOpenPhase =
  | 'setup'
  | 'stage_setup'
  | 'stage_ready'
  | 'stage_active'
  | 'tracking_recovery'
  | 'ladder_complete'
  | 'cancelled';

export type BalanceEyesOpenCompletionReason =
  | 'completed_all_stages'
  | 'stage_completed_early'
  | 'cancelled'
  | 'invalid';

export interface BalanceEyesOpenStageDescriptor {
  id: BalanceEyesOpenStageId;
  kind: BalanceEyesOpenStageKind;
  order: number;
  capMs: number;
  eyesOpen: true;
  sideRole: MeasurementSideRole;
}

export interface BalanceEyesOpenStageResult {
  stageId: BalanceEyesOpenStageId;
  order: number;
  capMs: number;
  maintainedMs: number;
  completedCap: boolean;
  endReason: BalanceStageEndReason;
  selectedSide: BodySide | null;
  sideRole: MeasurementSideRole;
  observedSide: BodySide | null;
  valid: boolean;
  startedAtMs: number;
  endedAtMs: number;
  supportingMetrics?: Record<string, number>;
}

export interface BalanceEyesOpenTrackingRetry {
  stageId: BalanceEyesOpenStageId;
  order: number;
  interruptedAtMs: number;
  discardedStartedAtMs: number;
  discardedPartialMs: number;
  reason: 'tracking_interrupted';
}

export interface BalanceEyesOpenV2Result extends MovementResultBase {
  protocolPolicyId: typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  protocolId: typeof BALANCE_EYES_OPEN_V2_PROTOCOL_ID;
  protocolVersion: typeof BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION;
  evidenceStatus: MovementProfileV2EvidenceStatus;
  setup: BalanceEyesOpenV2Setup | null;
  selectedStandingLeg: BodySide | null;
  setupConfidence: BalanceEyesOpenV2Setup['confidence'] | null;
  stages: BalanceEyesOpenStageResult[];
  trackingRetries: BalanceEyesOpenTrackingRetry[];
  highestCompletedStage: BalanceEyesOpenStageId | null;
  terminalStage: BalanceEyesOpenStageId | null;
  terminalStageMaintainedMs: number | null;
  completedStageCount: number;
  totalMaintainedMs: number;
  totalCapMs: number;
  completedAllStages: boolean;
  completionReason: BalanceEyesOpenCompletionReason;
  activeMeasurementWindows: ProtocolMeasurementWindow[];
  invalidReasons: string[];
}

export interface BalanceEyesOpenV2Config {
  stages: readonly BalanceEyesOpenStageDescriptor[];
}

export const BALANCE_EYES_OPEN_V2_STAGE_DESCRIPTORS = Object.freeze([
  Object.freeze({
    id: 'feet_together_eyes_open_v2',
    kind: 'feet_together',
    order: 1,
    capMs: 10000,
    eyesOpen: true,
    sideRole: 'not_applicable',
  }),
  Object.freeze({
    id: 'semi_tandem_eyes_open_v2',
    kind: 'semi_tandem',
    order: 2,
    capMs: 10000,
    eyesOpen: true,
    sideRole: 'lead_foot',
  }),
  Object.freeze({
    id: 'tandem_eyes_open_v2',
    kind: 'tandem',
    order: 3,
    capMs: 10000,
    eyesOpen: true,
    sideRole: 'lead_foot',
  }),
  Object.freeze({
    id: 'single_leg_eyes_open_v2',
    kind: 'single_leg',
    order: 4,
    capMs: 12000,
    eyesOpen: true,
    sideRole: 'standing_leg',
  }),
] as const satisfies readonly BalanceEyesOpenStageDescriptor[]);

export const DEFAULT_BALANCE_EYES_OPEN_V2_CONFIG: BalanceEyesOpenV2Config = {
  stages: BALANCE_EYES_OPEN_V2_STAGE_DESCRIPTORS,
};

export class BalanceEyesOpenV2ProtocolController {
  private readonly config: BalanceEyesOpenV2Config;
  private phase_: BalanceEyesOpenPhase = 'setup';
  private setup_: BalanceEyesOpenV2Setup | null = null;
  private currentStageIndex_ = 0;
  private activeStageStartedAtMs: number | null = null;
  private stageAttemptId = 0;
  private stages: BalanceEyesOpenStageResult[] = [];
  private retries: BalanceEyesOpenTrackingRetry[] = [];
  private windows: ProtocolMeasurementWindow[] = [];
  private completionReason_: BalanceEyesOpenCompletionReason = 'invalid';

  constructor(config: BalanceEyesOpenV2Config = DEFAULT_BALANCE_EYES_OPEN_V2_CONFIG) {
    this.config = {
      stages: config.stages.slice(),
    };
  }

  get phase(): BalanceEyesOpenPhase {
    return this.phase_;
  }

  get currentStageIndex(): number {
    return this.currentStageIndex_;
  }

  get currentStage(): BalanceEyesOpenStageDescriptor {
    return this.config.stages[this.currentStageIndex_];
  }

  get selectedStandingLeg(): BodySide | null {
    return this.setup_?.standingLeg ?? null;
  }

  get currentStageAttemptId(): number {
    return this.stageAttemptId;
  }

  confirmSetup(setup: BalanceEyesOpenV2Setup, _nowMs: number): boolean {
    if (this.phase_ !== 'setup') return false;
    this.setup_ = setup;
    if (!setupHasUserConfirmation(setup)) return false;
    this.phase_ = 'stage_setup';
    return true;
  }

  confirmCurrentStageSetup(nowMs: number): boolean {
    if (this.phase_ !== 'stage_setup' && this.phase_ !== 'tracking_recovery') return false;
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) return false;
    if (!this.currentStage) return false;
    this.stageAttemptId++;
    this.activeStageStartedAtMs = null;
    this.phase_ = 'stage_ready';
    this.windows.push({
      startedAtMs: nowMs,
      endedAtMs: nowMs,
      valid: true,
      reason: `setup_ready:${this.currentStage.id}`,
    });
    return true;
  }

  startCurrentStageFromGo(nowMs: number): boolean {
    if (this.phase_ !== 'stage_ready') return false;
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) return false;
    const stage = this.currentStage;
    if (!stage) return false;
    this.activeStageStartedAtMs = nowMs;
    this.phase_ = 'stage_active';
    this.windows.push({
      startedAtMs: nowMs,
      endedAtMs: nowMs + stage.capMs,
      valid: true,
      reason: `stage_window:${stage.id}`,
    });
    return true;
  }

  completeCurrentStageCap(nowMs: number, supportingMetrics?: Record<string, number>): boolean {
    if (this.phase_ !== 'stage_active' || this.activeStageStartedAtMs === null) return false;
    const stage = this.currentStage;
    const endedAtMs = this.activeStageStartedAtMs + stage.capMs;
    const result = this.stageResult({
      stage,
      nowMs: Math.min(nowMs, endedAtMs),
      maintainedMs: stage.capMs,
      endReason: 'completed_cap',
      valid: true,
      supportingMetrics,
    });
    this.stages.push(result);
    this.activeStageStartedAtMs = null;
    if (this.currentStageIndex_ >= this.config.stages.length - 1) {
      this.phase_ = 'ladder_complete';
      this.completionReason_ = 'completed_all_stages';
      return true;
    }
    this.currentStageIndex_++;
    this.phase_ = 'stage_setup';
    return true;
  }

  endCurrentStageEarly({
    nowMs,
    reason,
    supportingMetrics,
  }: {
    nowMs: number;
    reason: Exclude<BalanceStageEndReason, 'completed_cap' | 'tracking_interrupted' | 'invalid' | 'cancelled'>;
    supportingMetrics?: Record<string, number>;
  }): boolean {
    if (this.phase_ !== 'stage_active' || this.activeStageStartedAtMs === null) return false;
    const stage = this.currentStage;
    const maintainedMs = Math.max(0, Math.min(stage.capMs, nowMs - this.activeStageStartedAtMs));
    this.stages.push(this.stageResult({
      stage,
      nowMs,
      maintainedMs,
      endReason: reason,
      valid: true,
      supportingMetrics,
    }));
    this.activeStageStartedAtMs = null;
    this.phase_ = 'ladder_complete';
    this.completionReason_ = 'stage_completed_early';
    return true;
  }

  trackingInterrupted(nowMs: number): boolean {
    if (this.phase_ !== 'stage_active' || this.activeStageStartedAtMs === null) return false;
    const stage = this.currentStage;
    this.retries.push({
      stageId: stage.id,
      order: stage.order,
      interruptedAtMs: nowMs,
      discardedStartedAtMs: this.activeStageStartedAtMs,
      discardedPartialMs: Math.max(0, nowMs - this.activeStageStartedAtMs),
      reason: 'tracking_interrupted',
    });
    this.windows.push({
      startedAtMs: this.activeStageStartedAtMs,
      endedAtMs: nowMs,
      valid: false,
      reason: 'tracking_interrupted',
    });
    this.activeStageStartedAtMs = null;
    this.phase_ = 'tracking_recovery';
    return true;
  }

  cancel(nowMs: number): boolean {
    if (this.phase_ === 'cancelled' || this.phase_ === 'ladder_complete') return false;
    if (this.phase_ === 'stage_active' && this.activeStageStartedAtMs !== null) {
      const stage = this.currentStage;
      this.stages.push(this.stageResult({
        stage,
        nowMs,
        maintainedMs: Math.max(0, Math.min(stage.capMs, nowMs - this.activeStageStartedAtMs)),
        endReason: 'cancelled',
        valid: false,
      }));
      this.activeStageStartedAtMs = null;
    }
    this.phase_ = 'cancelled';
    this.completionReason_ = 'cancelled';
    return true;
  }

  finish(nowMs: number): BalanceEyesOpenV2Result {
    if (this.phase_ === 'stage_active' && this.activeStageStartedAtMs !== null) {
      const stage = this.currentStage;
      this.stages.push(this.stageResult({
        stage,
        nowMs,
        maintainedMs: Math.max(0, Math.min(stage.capMs, nowMs - this.activeStageStartedAtMs)),
        endReason: 'invalid',
        valid: false,
      }));
      this.activeStageStartedAtMs = null;
      this.phase_ = 'cancelled';
      this.completionReason_ = 'invalid';
    }
    return this.result();
  }

  private stageResult({
    stage,
    nowMs,
    maintainedMs,
    endReason,
    valid,
    supportingMetrics,
  }: {
    stage: BalanceEyesOpenStageDescriptor;
    nowMs: number;
    maintainedMs: number;
    endReason: BalanceStageEndReason;
    valid: boolean;
    supportingMetrics?: Record<string, number>;
  }): BalanceEyesOpenStageResult {
    const selectedSide =
      stage.sideRole === 'lead_foot' || stage.sideRole === 'standing_leg'
        ? this.setup_?.standingLeg ?? null
        : null;
    return {
      stageId: stage.id,
      order: stage.order,
      capMs: stage.capMs,
      maintainedMs: Math.max(0, Math.min(stage.capMs, maintainedMs)),
      completedCap: endReason === 'completed_cap',
      endReason,
      selectedSide,
      sideRole: stage.sideRole,
      observedSide: selectedSide,
      valid,
      startedAtMs: this.activeStageStartedAtMs ?? nowMs,
      endedAtMs: nowMs,
      ...(supportingMetrics && Object.keys(supportingMetrics).length > 0
        ? { supportingMetrics: sanitizeMetrics(supportingMetrics) }
        : {}),
    };
  }

  private result(): BalanceEyesOpenV2Result {
    const validStages = this.stages.filter((stage) => stage.valid);
    const completedStages = validStages.filter((stage) => stage.completedCap);
    const terminalStage = validStages.at(-1) ?? this.stages.at(-1) ?? null;
    const highestCompleted = completedStages.at(-1) ?? null;
    const invalidReasons: string[] = [];
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) invalidReasons.push('setup_not_confirmed');
    if (validStages.length === 0 && this.phase_ !== 'cancelled') invalidReasons.push('no_valid_measurement');
    if (this.phase_ === 'tracking_recovery') invalidReasons.push('tracking_interrupted');
    if (this.phase_ === 'cancelled') invalidReasons.push('user_cancelled');

    const completedAllStages =
      completedStages.length === this.config.stages.length &&
      this.phase_ === 'ladder_complete' &&
      this.completionReason_ === 'completed_all_stages';
    const evidenceStatus = this.evidenceStatus(validStages, completedAllStages);
    const flags: string[] = [];
    if (this.retries.length > 0) flags.push('tracking-interrupted');
    if (invalidReasons.includes('no_valid_measurement') || invalidReasons.includes('setup_not_confirmed')) {
      flags.push('no-measurement');
    }
    if (evidenceStatus !== 'reference_protocol_complete') flags.push('protocol-incomplete');

    return {
      movementId: BALANCE_EYES_OPEN_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      protocolId: BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
      protocolVersion: BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
      evidenceStatus,
      setup: this.setup_,
      selectedStandingLeg: this.setup_?.standingLeg ?? null,
      setupConfidence: this.setup_?.confidence ?? null,
      stages: this.stages.slice(),
      trackingRetries: this.retries.slice(),
      highestCompletedStage: highestCompleted?.stageId ?? null,
      terminalStage: terminalStage?.stageId ?? this.currentStage?.id ?? null,
      terminalStageMaintainedMs: terminalStage?.maintainedMs ?? null,
      completedStageCount: completedStages.length,
      totalMaintainedMs: validStages.reduce((sum, stage) => sum + stage.maintainedMs, 0),
      totalCapMs: this.config.stages.reduce((sum, stage) => sum + stage.capMs, 0),
      completedAllStages,
      completionReason: this.completionReason_,
      activeMeasurementWindows: this.windows.slice(),
      invalidReasons,
      flags,
      interruptions: this.retries.length,
    };
  }

  private evidenceStatus(
    validStages: readonly BalanceEyesOpenStageResult[],
    completedAllStages: boolean
  ): MovementProfileV2EvidenceStatus {
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) return 'raw_only_setup_uncertain';
    if (this.phase_ === 'tracking_recovery') return 'raw_only_tracking_uncertain';
    if (validStages.length === 0) return 'invalid_measurement';
    if (completedAllStages || this.completionReason_ === 'stage_completed_early') return 'reference_protocol_complete';
    return 'raw_only_protocol_incomplete';
  }
}

export function balanceEyesOpenStageSide(
  stage: BalanceEyesOpenStageDescriptor,
  selectedStandingLeg: BodySide
): BodySide | null {
  if (stage.sideRole === 'lead_foot' || stage.sideRole === 'standing_leg') return selectedStandingLeg;
  return null;
}

function sanitizeMetrics(metrics: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(metrics)) {
    if (Number.isFinite(value)) out[key] = value;
  }
  return out;
}

export const balanceEyesOpenV2Definition: MovementDefinition<BalanceEyesOpenV2Result> = {
  id: BALANCE_EYES_OPEN_V2_ID,
  displayName: 'Eyes-Open Balance',
  cameraView: { view: 'front', requiredReliableSideChains: 2 },
  equipment: ['counter'],
  durationMs: null,
  voice: {
    instructions: ['checkup-balance-intro-v21'],
  },
  createGrader: () =>
    new ProtocolOnlyGrader(() => ({
      movementId: BALANCE_EYES_OPEN_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      protocolId: BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
      protocolVersion: BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
      evidenceStatus: 'invalid_measurement',
      setup: createBalanceEyesOpenV2Setup({ standingLeg: 'left', confirmed: false, source: 'direct_call' }),
      selectedStandingLeg: null,
      setupConfidence: 'bypassed',
      stages: [],
      trackingRetries: [],
      highestCompletedStage: null,
      terminalStage: null,
      terminalStageMaintainedMs: null,
      completedStageCount: 0,
      totalMaintainedMs: 0,
      totalCapMs: DEFAULT_BALANCE_EYES_OPEN_V2_CONFIG.stages.reduce((sum, stage) => sum + stage.capMs, 0),
      completedAllStages: false,
      completionReason: 'invalid',
      activeMeasurementWindows: [],
      invalidReasons: ['protocol_controller_required'],
      flags: ['no-measurement', 'protocol-controller-required'],
      interruptions: 0,
    })),
  resultCues(): VoiceCueKey[] {
    return ['mpv2_balance_complete'];
  },
};

registerMovement(balanceEyesOpenV2Definition);
