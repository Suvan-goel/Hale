import { VoiceCueKey } from '../audio/cues';
import {
  MovementProfileV2EvidenceStatus,
  ProtocolMeasurementWindow,
} from '../checkup/protocolEvidence';
import {
  ActiveShoulderReachV2Setup,
  BodySide,
  createActiveShoulderReachV2Setup,
  setupHasUserConfirmation,
} from '../checkup/protocolSetup';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../checkup/protocolPolicy';
import { angleAtDeg } from '../pose/geometry';
import { LM, PoseFrame } from '../pose/types';
import { MovementDefinition, MovementResultBase } from './types';
import { registerMovement } from './registry';
import { ProtocolOnlyGrader } from './protocolOnlyGrader';

export const ACTIVE_SHOULDER_REACH_V2_ID = 'active-shoulder-reach-v2';

export interface ShoulderReachLandmarks {
  hip: LM;
  shoulder: LM;
  elbow: LM;
}

export interface ActiveShoulderReachV2Result extends MovementResultBase {
  protocolPolicyId: typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  evidenceStatus: MovementProfileV2EvidenceStatus;
  setup: ActiveShoulderReachV2Setup | null;
  selectedSide: BodySide | null;
  setupConfidence: ActiveShoulderReachV2Setup['confidence'] | null;
  peakFlexionDeg: number;
  retryCount: number;
  painLimited: boolean;
  validTrackingMs: number;
  activeMeasurementWindows: ProtocolMeasurementWindow[];
  invalidReasons: string[];
}

export interface ActiveShoulderReachV2Config {
  captureWindowMs: number;
  validTrackingRequiredMs: number;
  maxInvalidRetries: number;
}

export type ActiveShoulderReachV2Phase = 'setup' | 'ready' | 'active' | 'retry_ready' | 'complete';

export const DEFAULT_ACTIVE_SHOULDER_REACH_V2_CONFIG: ActiveShoulderReachV2Config = {
  captureWindowMs: 9000,
  validTrackingRequiredMs: 3000,
  maxInvalidRetries: 1,
};

export class ActiveShoulderReachV2ProtocolController {
  private readonly config: ActiveShoulderReachV2Config;
  private phase_: ActiveShoulderReachV2Phase = 'setup';
  private setup_: ActiveShoulderReachV2Setup | null = null;
  private activeStartedAtMs: number | null = null;
  private peakFlexionDeg_ = NaN;
  private validTrackingMs_ = 0;
  private retryCount_ = 0;
  private painLimited_ = false;
  private windows: ProtocolMeasurementWindow[] = [];
  private invalidReasons_: string[] = [];

  constructor(config: ActiveShoulderReachV2Config = DEFAULT_ACTIVE_SHOULDER_REACH_V2_CONFIG) {
    this.config = config;
  }

  get phase(): ActiveShoulderReachV2Phase {
    return this.phase_;
  }

  confirmSetup(setup: ActiveShoulderReachV2Setup, _nowMs: number): boolean {
    if (this.phase_ !== 'setup') return false;
    this.setup_ = setup;
    if (!setupHasUserConfirmation(setup)) return false;
    this.phase_ = 'ready';
    return true;
  }

  startCapture(nowMs: number): boolean {
    if (this.phase_ !== 'ready' && this.phase_ !== 'retry_ready') return false;
    this.activeStartedAtMs = nowMs;
    this.phase_ = 'active';
    return true;
  }

  recordValidCapture({
    nowMs,
    peakFlexionDeg,
    validTrackingMs,
    painLimited = false,
  }: {
    nowMs: number;
    peakFlexionDeg: number;
    validTrackingMs: number;
    painLimited?: boolean;
  }): boolean {
    if (this.phase_ !== 'active' || this.activeStartedAtMs === null) return false;
    if (!Number.isFinite(peakFlexionDeg) || validTrackingMs < this.config.validTrackingRequiredMs) {
      return this.recordInvalidCapture(nowMs, 'invalid_capture');
    }
    this.peakFlexionDeg_ = peakFlexionDeg;
    this.validTrackingMs_ = validTrackingMs;
    this.painLimited_ = painLimited;
    this.windows.push({
      startedAtMs: this.activeStartedAtMs,
      endedAtMs: nowMs,
      valid: true,
      reason: painLimited ? 'pain_limited_valid_capture' : 'valid_capture',
    });
    this.activeStartedAtMs = null;
    this.phase_ = 'complete';
    return true;
  }

  recordPainLimitedCapture(input: { nowMs: number; peakFlexionDeg: number; validTrackingMs: number }): boolean {
    return this.recordValidCapture({ ...input, painLimited: true });
  }

  recordInvalidCapture(nowMs: number, reason: string): boolean {
    if (this.phase_ !== 'active' || this.activeStartedAtMs === null) return false;
    this.invalidReasons_.push(reason);
    this.windows.push({
      startedAtMs: this.activeStartedAtMs,
      endedAtMs: nowMs,
      valid: false,
      reason,
    });
    this.activeStartedAtMs = null;
    if (this.retryCount_ < this.config.maxInvalidRetries) {
      this.retryCount_++;
      this.phase_ = 'retry_ready';
    } else {
      this.phase_ = 'complete';
    }
    return true;
  }

  finish(nowMs: number): ActiveShoulderReachV2Result {
    if (this.phase_ === 'active') {
      this.recordInvalidCapture(nowMs, 'invalid_capture');
    }
    if (this.phase_ !== 'complete') {
      if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) {
        this.invalidReasons_.push('setup_not_confirmed');
      } else {
        this.invalidReasons_.push('protocol_incomplete');
      }
      this.phase_ = 'complete';
    }
    return this.result();
  }

  private result(): ActiveShoulderReachV2Result {
    const invalidReasons = unique(this.invalidReasons_);
    if (!Number.isFinite(this.peakFlexionDeg_)) invalidReasons.push('no_valid_measurement');
    const flags: string[] = [];
    if (!Number.isFinite(this.peakFlexionDeg_)) flags.push('no-measurement');
    if (this.evidenceStatus(invalidReasons) !== 'reference_protocol_complete') flags.push('protocol-incomplete');

    return {
      movementId: ACTIVE_SHOULDER_REACH_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      evidenceStatus: this.evidenceStatus(invalidReasons),
      setup: this.setup_,
      selectedSide: this.setup_?.selectedSide ?? null,
      setupConfidence: this.setup_?.confidence ?? null,
      peakFlexionDeg: this.peakFlexionDeg_,
      retryCount: this.retryCount_,
      painLimited: this.painLimited_,
      validTrackingMs: this.validTrackingMs_,
      activeMeasurementWindows: this.windows.slice(),
      invalidReasons,
      flags,
      interruptions: 0,
    };
  }

  private evidenceStatus(invalidReasons: readonly string[]): MovementProfileV2EvidenceStatus {
    if (!this.setup_ || !setupHasUserConfirmation(this.setup_)) return 'raw_only_setup_uncertain';
    if (this.painLimited_) return 'raw_only_pain_limited';
    if (Number.isFinite(this.peakFlexionDeg_)) return 'reference_protocol_complete';
    if (this.retryCount_ > 0 && invalidReasons.includes('invalid_capture')) return 'raw_only_tracking_uncertain';
    if (invalidReasons.includes('protocol_incomplete')) return 'raw_only_protocol_incomplete';
    return 'invalid_measurement';
  }
}

export function shoulderReachLandmarksForSide(side: BodySide): ShoulderReachLandmarks {
  return side === 'left'
    ? { hip: LM.LEFT_HIP, shoulder: LM.LEFT_SHOULDER, elbow: LM.LEFT_ELBOW }
    : { hip: LM.RIGHT_HIP, shoulder: LM.RIGHT_SHOULDER, elbow: LM.RIGHT_ELBOW };
}

export function shoulderReachAngleDegForSide(frame: PoseFrame, side: BodySide): number {
  const landmarks = shoulderReachLandmarksForSide(side);
  return angleAtDeg(frame, landmarks.hip, landmarks.shoulder, landmarks.elbow);
}

export const activeShoulderReachV2Definition: MovementDefinition<ActiveShoulderReachV2Result> = {
  id: ACTIVE_SHOULDER_REACH_V2_ID,
  displayName: 'Active Shoulder Reach',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['none'],
  durationMs: null,
  voice: {
    instructions: ['shoulder-intro', 'shoulder-setup'],
    endCue: 'relax-arm',
  },
  createGrader: () =>
    new ProtocolOnlyGrader(() => ({
      movementId: ACTIVE_SHOULDER_REACH_V2_ID,
      protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      evidenceStatus: 'invalid_measurement',
      setup: createActiveShoulderReachV2Setup({ selectedSide: 'left', confirmed: false, source: 'direct_call' }),
      selectedSide: null,
      setupConfidence: 'bypassed',
      peakFlexionDeg: NaN,
      retryCount: 0,
      painLimited: false,
      validTrackingMs: 0,
      activeMeasurementWindows: [],
      invalidReasons: ['protocol_controller_required'],
      flags: ['no-measurement', 'protocol-controller-required'],
      interruptions: 0,
    })),
  resultCues(): VoiceCueKey[] {
    return ['item-complete'];
  },
};

registerMovement(activeShoulderReachV2Definition);

function unique(values: readonly string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}
