import { MaxRomTracker, RepVelocityTracker } from '../grading';
import { CHAIN_IDS } from '../pose/chains';
import { angleAtDeg, pointToSegmentDist } from '../pose/geometry';
import type { PipelineFrameOutput } from '../pose/pipeline';
import { LM, midpointX, type PoseFrame } from '../pose/types';
import type { RecordingVisualGuidance } from '../recording/recordingVisualGuidance';
import {
  type BodySide,
  type ChairRiseV2Setup,
  type ProtocolSetupSource,
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../checkup/protocolSetup';
import type { CheckUp } from '../checkup/types';
import {
  ActiveShoulderReachV2ProtocolController,
  DEFAULT_ACTIVE_SHOULDER_REACH_V2_CONFIG,
  shoulderReachAngleDegForSide,
  type ActiveShoulderReachV2Result,
} from '../movements/activeShoulderReachV2';
import {
  ChairRiseV2ProtocolController,
  DEFAULT_CHAIR_RISE_V2_CONFIG,
  type ChairRiseV2Result,
} from '../movements/chairRiseV2';
import { HINGE_REACH_ID, type HingeReachResult } from '../movements/hingeReach';
import {
  DEFAULT_ONE_LEG_BALANCE_V2_CONFIG,
  OneLegBalanceV2ProtocolController,
  type OneLegBalanceV2Result,
} from '../movements/oneLegBalanceV2';
import {
  movementProfileV2FlowBatterySequence,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
  validateMovementProfileV2BatterySequence,
  type MovementProfileV2BatteryMovement,
  type MovementProfileV2InternalFlowState,
} from './internalCheckupFlow';
import type { MovementProfileV2CueId } from './voiceCues';

import { BRAND } from '../brand';
const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');
const LEFT_ARM_CHAIN = CHAIN_IDS.indexOf('leftArm');
const RIGHT_ARM_CHAIN = CHAIN_IDS.indexOf('rightArm');

const FRAME_STALE_MS = 750;
export const MPV2_CHAIR_COUNTDOWN_CADENCE_MS = 1000;
export const MPV2_CHAIR_COUNTDOWN_TOTAL_MS = 3000;
const BALANCE_REST_MIN_MS = 30000;
// Exported (C7-style shared predicate rule): the dual-task runtime re-runs a
// balance hold with EXACTLY this detection so level 2 measures the same way
// level 1 did. Values change together or the comparison lies.
export const BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES = 4;
/** Continuous lift evidence required before a trial starts (anti-jitter; the
 * trial clock is retro-dated to the first lift frame so no hold time is lost). */
export const BALANCE_LIFT_CONFIRM_MS = 150;
const ACTIVE_TRACKING_LOSS_CONFIRM_FRAMES = 4;
const BALANCE_LIFT_BU = 0.14;
const CHAIR_MAX_REPS = 64;
/** Bounded tracking-loss restarts: after this many full restarts of an item,
 * record the flagged partial result instead of looping the user forever. */
const CHAIR_MAX_RECOVERIES = 2;
const HINGE_MAX_RECOVERIES = 2;
const PUSH_OFF_WRIST_THIGH_BU = 0.15;
const PUSH_OFF_FRAME_FRACTION = 0.5;
const HINGE_CAPTURE_MS = 9000;
const HINGE_VALID_TRACKING_MS = 3000;
const MAX_TRANSITIONS = 80;
const MAX_SEEN_FRAME_IDS = 256;
const HANDS_FREE_SETUP_DWELL_MS = 1200;
const HANDS_FREE_FALLBACK_TIMEOUT_MS = 10000;
/** Wall-clock deadlines may only credit results while pose frames are flowing. */
const FRAME_STALL_INVALID_MS = 1500;
const SETUP_CHAIN_RELIABILITY = 0.45;
const CHAIR_SETUP_SEATED_KNEE_MAX_DEG = 145;
/** Near-extended knee on the reliable side = plausibly standing (raw space). */
const FRAME_CHECK_STANDING_KNEE_MIN_DEG = 150;
const SHOULDER_CAPTURE_ARM_MIN_DEG = 35;
const HINGE_FOLDED_TRUNK_MAX_DEG = 165;

export type MovementProfileV2TrackingQuality = 'good' | 'uncertain' | 'lost';

export type MovementProfileV2RecoveryItem = 'chair' | 'balance' | 'shoulder' | 'hinge';

export type Mpv2TrackingLossPhase =
  | 'loss_detected'
  | 'attempt_invalidated'
  | 'stable_ready'
  | 'voice_completed';

export interface Mpv2RecoveryEpisode {
  id: string;
  item: MovementProfileV2RecoveryItem;
  phase: Mpv2TrackingLossPhase;
  startedAtMs: number;
  updatedAtMs: number;
  lossStage: MovementProfileV2LiveStage;
  targetStage: MovementProfileV2LiveStage;
  lossAttemptEpochId: string | null;
  recoveryAttemptEpochId: string | null;
  reason: 'tracking_invalid';
  partialAttemptInvalidated: true;
  freshStartRequired: true;
  itemSpecificCue: Extract<
    MovementProfileV2CueId,
    'mpv2_balance_tracking_retry' | 'mpv2_shoulder_tracking_retry'
  > | null;
  duplicateLossEvents: number;
  precedence: 'terminal_event_before_loss' | 'loss_before_terminal_event';
}

export type MovementProfileV2LiveStage =
  | 'standing_frame_check'
  | 'chair_setup'
  | 'chair_practice'
  | 'chair_countdown'
  | 'chair_active'
  | 'balance_setup'
  | 'balance_ready'
  | 'balance_trial'
  | 'balance_rest'
  | 'shoulder_setup'
  | 'shoulder_ready'
  | 'shoulder_active'
  | 'shoulder_retry_ready'
  | 'hinge_setup'
  | 'hinge_active'
  | 'raw_complete';

export type MovementProfileV2BalanceTimerKind = 'active_trial' | 'rest' | 'none';

export interface MovementProfileV2LivePoseSample {
  frameId: number | string;
  timestampMs: number;
  receivedAtMs: number;
  sourceWidth: number;
  sourceHeight: number;
  rotationDegrees: 0 | 90 | 180 | 270;
  mirrored: boolean;
  movementEpochId: string;
  attemptEpochId?: string | null;
  trackingQuality: MovementProfileV2TrackingQuality;
  output: PipelineFrameOutput;
}

export type MovementProfileV2LiveUserAction =
  | { type: 'frame_check_voice_completed' }
  | { type: 'skip_frame_check' }
  | { type: 'confirm_chair_setup'; source?: ProtocolSetupSource }
  | { type: 'chair_setup_voice_completed' }
  | { type: 'chair_practice_voice_completed' }
  | { type: 'complete_chair_practice_fallback' }
  | { type: 'chair_official_ready_voice_completed' }
  | { type: 'chair_countdown_started' }
  | { type: 'chair_go_playback_started' }
  | { type: 'confirm_balance_setup'; standingLeg: BodySide; source?: ProtocolSetupSource }
  | { type: 'balance_setup_voice_completed' }
  | { type: 'balance_attempt_voice_completed' }
  | { type: 'balance_support_touched' }
  | { type: 'balance_stop' }
  | { type: 'balance_use_result' }
  | { type: 'balance_skip' }
  | { type: 'confirm_shoulder_setup'; shoulderSide: BodySide; source?: ProtocolSetupSource }
  | { type: 'shoulder_transition_voice_completed' }
  | { type: 'shoulder_setup_voice_completed' }
  | { type: 'start_shoulder_capture' }
  | { type: 'shoulder_pain_limited' }
  | { type: 'start_hinge_capture' }
  | { type: 'hinge_setup_voice_completed' }
  | { type: 'finish_hinge_capture' }
  | { type: 'recovery_voice_completed'; recoveryId: string }
  | { type: 'backgrounded' }
  | { type: 'resumed' };

export interface MovementProfileV2LiveTransitionSummary {
  atMs: number;
  from: MovementProfileV2LiveStage;
  to: MovementProfileV2LiveStage;
  reason: string;
}

export interface MovementProfileV2LiveDiagnostics {
  schemaVersion: 1;
  framesReceived: number;
  framesAccepted: number;
  staleFramesDropped: number;
  duplicateFramesDropped: number;
  outOfOrderFramesDropped: number;
  epochMismatchFramesDropped: number;
  malformedFramesDropped: number;
  trackingGoodFrames: number;
  trackingUncertainFrames: number;
  trackingLostFrames: number;
  trackingInterruptions: number;
  recovery: {
    episodeCount: number;
    duplicateLossEvents: number;
    lastEpisodeId: string | null;
    lastItem: MovementProfileV2RecoveryItem | null;
  };
  stateTransitions: readonly MovementProfileV2LiveTransitionSummary[];
  chair: {
    practiceReps: number;
    practiceCompleted: boolean;
    officialReps: number;
    trackingInterruptions: number;
    deadlineDriftMs: number | null;
  };
  balance: {
    attemptedTrials: number;
    validTrials: number;
    invalidTrials: number;
    retryCount: number;
    ceilingReached: boolean;
    restCount: number;
    hardCapReached: boolean;
  };
  shoulder: {
    attempts: number;
    selectedSide: BodySide | null;
    peakFlexionDeg: number | null;
    validTrackingMs: number;
    retryCount: number;
    painLimited: boolean;
  };
  hinge: {
    captureValid: boolean;
    reachBu: number | null;
  };
  artifactOutcome: 'none' | 'raw_complete';
}

export interface MovementProfileV2LiveSnapshot {
  stage: MovementProfileV2LiveStage;
  flow: MovementProfileV2InternalFlowState;
  movementEpochId: string;
  attemptEpochId: string | null;
  checkUp: CheckUp | null;
  statusText: string;
  recordingVisualGuidance: RecordingVisualGuidance;
  timerRemainingMs: number | null;
  balanceTimerKind: MovementProfileV2BalanceTimerKind;
  restMinimumRemainingMs: number | null;
  chairReps: number;
  repCreditCount: number;
  balanceValidTrials: number;
  balanceBestHoldSec: number | null;
  /** A sustained wrong-leg lift is being ignored; the user needs correcting. */
  balanceWrongLegNoticed: boolean;
  /** Frame check has struggled long enough that a lighting hint is warranted. */
  frameCheckLightingHintAvailable: boolean;
  shoulderPeakDeg: number | null;
  hingeReachBu: number | null;
  backgrounded: boolean;
  recoveryEpisode: Mpv2RecoveryEpisode | null;
  handsFreeMode: boolean;
  handsFreeFallbackAvailable: boolean;
  diagnostics: MovementProfileV2LiveDiagnostics;
  revision: number;
  lastTransition: MovementProfileV2LiveTransitionSummary | null;
}

export interface MovementProfileV2LiveCoordinatorOptions {
  handsFreeMode?: boolean;
  handsFreeSetupDwellMs?: number;
  handsFreeFallbackTimeoutMs?: number;
  /**
   * Opens the check-up with a standing "get in frame" gate before the chair
   * item: lighting/stability check + a guaranteed STANDING body-unit
   * calibration lock at the session's camera spot (measurement hygiene).
   */
  standingFrameCheckEnabled?: boolean;
}

export function movementProfileV2TrackingQualityFromPipeline(
  output: PipelineFrameOutput
): MovementProfileV2TrackingQuality {
  if (output.state === 'tracking' && output.frame.hasPose) return 'good';
  if (output.frame.hasPose) return 'uncertain';
  return 'lost';
}

export function createMovementProfileV2LivePoseSample(input: {
  frameId?: number | string | null;
  eventTimestampMs: number;
  receivedAtMs: number;
  sourceWidth: number;
  sourceHeight: number;
  movementEpochId: string;
  attemptEpochId?: string | null;
  output: PipelineFrameOutput;
  rotationDegrees?: 0 | 90 | 180 | 270;
  mirrored?: boolean;
}): MovementProfileV2LivePoseSample | null {
  if (
    !Number.isFinite(input.eventTimestampMs) ||
    !Number.isFinite(input.receivedAtMs) ||
    !Number.isFinite(input.sourceWidth) ||
    !Number.isFinite(input.sourceHeight) ||
    input.sourceWidth <= 0 ||
    input.sourceHeight <= 0
  ) {
    return null;
  }
  return {
    frameId: input.frameId ?? `ts:${input.eventTimestampMs}`,
    timestampMs: input.eventTimestampMs,
    receivedAtMs: input.receivedAtMs,
    sourceWidth: input.sourceWidth,
    sourceHeight: input.sourceHeight,
    rotationDegrees: input.rotationDegrees ?? 0,
    mirrored: input.mirrored ?? false,
    movementEpochId: input.movementEpochId,
    attemptEpochId: input.attemptEpochId ?? null,
    trackingQuality: movementProfileV2TrackingQualityFromPipeline(input.output),
    output: input.output,
  };
}

const BATTERY_MOVEMENT_SETUP_STAGE: Record<MovementProfileV2BatteryMovement, MovementProfileV2LiveStage> = {
  chair: 'chair_setup',
  balance: 'balance_setup',
  shoulder: 'shoulder_setup',
  hinge: 'hinge_setup',
};

export class MovementProfileV2LiveCoordinator {
  private flow: MovementProfileV2InternalFlowState;
  private readonly batterySequence: readonly MovementProfileV2BatteryMovement[];
  private stage: MovementProfileV2LiveStage = 'chair_setup';
  private revision = 0;
  private movementEpochCounter = 0;
  private attemptEpochCounter = 0;
  private movementEpochId = this.nextMovementEpoch('chair');
  private attemptEpochId: string | null = null;
  private backgrounded = false;
  private completedCheckUp: CheckUp | null = null;

  private readonly clockBridge = new MonotonicFrameClockBridge();
  private readonly seenFrameIds = new BoundedFrameIdSet(MAX_SEEN_FRAME_IDS);
  private lastSourceTimestampMs: number | null = null;
  private lastAcceptedFrameAppMs: number | null = null;
  private lastTrackingQuality: MovementProfileV2TrackingQuality | null = null;

  private readonly standingFrameCheckEnabled: boolean;
  private frameCheckVoiceCompleted = false;

  private chair = new ChairRiseV2ProtocolController();
  private chairAdapter = new ChairLiveAdapter();
  private chairConfirmedSetup: ChairRiseV2Setup | null = null;
  private chairCountdownStartedAtMs: number | null = null;
  private chairActiveStartedAtMs: number | null = null;
  private chairSetupVoiceCompleted = false;
  private chairPracticeVoiceCompleted = false;
  private chairOfficialReadyVoiceCompleted = false;
  private chairResult: ChairRiseV2Result | null = null;
  private chairLostFrames = 0;
  private chairRecoveryCount = 0;
  private repCreditCount = 0;

  private readonly balance = new OneLegBalanceV2ProtocolController();
  private balanceTrialStartedAtMs: number | null = null;
  private balanceRestMinUntilMs: number | null = null;
  private balanceSetupConfirmedAtMs: number | null = null;
  private balanceSetupSource: ProtocolSetupSource | null = null;
  private balanceSetupVoiceCompleted = false;
  private balanceAttemptVoiceCompleted = false;
  private balanceLostFrames = 0;
  private balanceTouchdownFrames = 0;
  private balanceTouchdownStartedAtMs: number | null = null;
  private balanceWrongLegNoticed = false;
  private balanceRaisedFrames = 0;
  private balanceReadyRaisedSinceMs: number | null = null;
  private balanceReadyRaisedStandingLeg: BodySide | null = null;
  private balanceSway = createWelford();
  private balanceValidTrials = 0;
  private balanceInvalidTrials = 0;
  private balanceAttemptedTrials = 0;
  private balanceBestHoldSec: number | null = null;
  private balanceCeilingReached = false;
  private balanceResult: OneLegBalanceV2Result | null = null;

  private readonly shoulder = new ActiveShoulderReachV2ProtocolController();
  private shoulderCaptureStartedAtMs: number | null = null;
  private shoulderTransitionVoiceCompleted = false;
  private shoulderSetupVoiceCompleted = false;
  private shoulderAttemptCount = 0;
  private shoulderPainLimited = false;
  private shoulderPeak = new MaxRomTracker({ emaAlpha: 0.3, direction: 'max' });
  private shoulderPeakDeg: number | null = null;
  private shoulderValidTrackingStartedAtMs: number | null = null;
  private shoulderValidTrackingMs = 0;
  private shoulderResult: ActiveShoulderReachV2Result | null = null;
  private shoulderLostFrames = 0;

  private hingeStartedAtMs: number | null = null;
  private hingeRecoveryCount = 0;
  private hingeSetupVoiceCompleted = false;
  private hingePeak = new MaxRomTracker({ emaAlpha: 0.3, direction: 'min' });
  private hingeValidTrackingStartedAtMs: number | null = null;
  private hingeValidTrackingMs = 0;
  private hingeReachBu: number | null = null;
  private hingeResult: HingeReachResult | null = null;
  private hingeLostFrames = 0;

  private diagnostics: MutableDiagnostics = createMutableDiagnostics();
  private recoveryCounter = 0;
  private activeRecoveryEpisode: Mpv2RecoveryEpisode | null = null;
  private readonly handsFreeMode: boolean;
  private readonly handsFreeSetupDwellMs: number;
  private readonly handsFreeFallbackTimeoutMs: number;
  private handsFreeWaitingStage: MovementProfileV2LiveStage | null = null;
  private handsFreeWaitingSinceMs: number | null = null;
  private handsFreeReadyStage: MovementProfileV2LiveStage | null = null;
  private handsFreeReadyKey: string | null = null;
  private handsFreeReadySinceMs: number | null = null;
  private handsFreeFallbackAvailable = false;

  constructor(
    initialFlow: MovementProfileV2InternalFlowState,
    options: MovementProfileV2LiveCoordinatorOptions = {}
  ) {
    this.flow = initialFlow;
    // Battery order derives from the flow state (single owner — Option 1
    // ruling 2026-07-06); absent = the default full battery, byte-identical.
    this.batterySequence = validateMovementProfileV2BatterySequence(
      movementProfileV2FlowBatterySequence(initialFlow)
    );
    this.handsFreeMode = options.handsFreeMode === true;
    this.handsFreeSetupDwellMs = options.handsFreeSetupDwellMs ?? HANDS_FREE_SETUP_DWELL_MS;
    this.handsFreeFallbackTimeoutMs = options.handsFreeFallbackTimeoutMs ?? HANDS_FREE_FALLBACK_TIMEOUT_MS;
    this.standingFrameCheckEnabled = options.standingFrameCheckEnabled === true;
    if (this.standingFrameCheckEnabled) {
      this.stage = 'standing_frame_check';
      this.movementEpochId = this.nextMovementEpoch('frame-check');
    } else if (this.batterySequence[0] !== 'chair') {
      this.stage = BATTERY_MOVEMENT_SETUP_STAGE[this.batterySequence[0]];
      this.movementEpochId = this.nextMovementEpoch(this.batterySequence[0]);
    }
  }

  /**
   * Sequence-driven movement handoff: transitions to the next sequenced
   * movement's setup stage, or assembles the raw CheckUp when the sequence is
   * exhausted. For the default battery this reproduces today's hardcoded
   * chair→balance→shoulder→hinge→raw_complete path with identical stages,
   * epochs, and reasons.
   */
  private advanceAfterMovement(
    movement: MovementProfileV2BatteryMovement,
    nowMs: number,
    reason: string
  ): void {
    // The item is over — any recovery episode it carried is resolved, even if
    // its voice never completed (e.g. retry-limit recorded a partial result).
    this.activeRecoveryEpisode = null;
    const index = this.batterySequence.indexOf(movement);
    const next = index >= 0 ? this.batterySequence[index + 1] : undefined;
    if (next) {
      this.transition(BATTERY_MOVEMENT_SETUP_STAGE[next], nowMs, reason);
      this.movementEpochId = this.nextMovementEpoch(next);
      this.attemptEpochId = null;
      return;
    }
    this.completedCheckUp = movementProfileV2RawCheckUpFromFlow(this.flow);
    this.diagnostics.artifactOutcome = this.completedCheckUp ? 'raw_complete' : 'none';
    this.transition('raw_complete', nowMs, reason);
    this.attemptEpochId = null;
  }

  snapshot(nowMs: number | null = null): MovementProfileV2LiveSnapshot {
    const timer = typeof nowMs === 'number' ? this.timerRemaining(nowMs) : null;
    const restMin = typeof nowMs === 'number' ? this.remainingUntil(this.balanceRestMinUntilMs, nowMs) : null;
    const statusText = this.statusText();
    const recoveryEpisode = this.activeRecoveryEpisode ? { ...this.activeRecoveryEpisode } : null;
    return {
      stage: this.stage,
      flow: this.flow,
      movementEpochId: this.movementEpochId,
      attemptEpochId: this.attemptEpochId,
      checkUp: this.completedCheckUp,
      statusText,
      recordingVisualGuidance: buildMovementProfileV2RecordingVisualGuidance({
        stage: this.stage,
        statusText,
        trackingQuality: this.lastTrackingQuality,
        backgrounded: this.backgrounded,
        recoveryEpisode,
        handsFreeMode: this.handsFreeMode,
        handsFreeWaitingStage: this.handsFreeWaitingStage,
        handsFreeReadyStage: this.handsFreeReadyStage,
        handsFreeFallbackAvailable: this.handsFreeFallbackAvailable,
        voicePrerequisitePending: this.voicePrerequisitePending(),
        metricProtected: this.recordingVisualMetricProtected(),
        chairCountdownStarted: this.chairCountdownStartedAtMs !== null,
      }),
      timerRemainingMs: timer,
      balanceTimerKind: this.balanceTimerKind(),
      restMinimumRemainingMs: restMin,
      chairReps: this.diagnostics.chair.officialReps,
      repCreditCount: this.repCreditCount,
      balanceValidTrials: this.balanceValidTrials,
      balanceBestHoldSec: this.balanceBestHoldSec,
      balanceWrongLegNoticed: this.balanceWrongLegNoticed,
      frameCheckLightingHintAvailable: this.frameCheckLightingHintNeeded(),
      shoulderPeakDeg: this.shoulderPeakDeg,
      hingeReachBu: this.hingeReachBu,
      backgrounded: this.backgrounded,
      recoveryEpisode,
      handsFreeMode: this.handsFreeMode,
      handsFreeFallbackAvailable: this.handsFreeFallbackAvailable,
      diagnostics: freezeDiagnostics(this.diagnostics),
      revision: this.revision,
      lastTransition: this.diagnostics.stateTransitions.at(-1) ?? null,
    };
  }

  receiveUserAction(action: MovementProfileV2LiveUserAction, nowMs: number): boolean {
    const before = this.stage;
    switch (action.type) {
      case 'frame_check_voice_completed':
        if (this.stage !== 'standing_frame_check') return false;
        this.frameCheckVoiceCompleted = true;
        this.bump();
        break;
      case 'skip_frame_check':
        // Explicit escape (fallback button): calibration will lock later in
        // whatever posture the user first holds still — the segment-sum scale
        // keeps that comparable, so skipping degrades nothing structurally.
        if (this.stage !== 'standing_frame_check') return false;
        this.passFrameCheck(nowMs, 'frame_check_skipped');
        break;
      case 'confirm_chair_setup':
        if (this.stage !== 'chair_setup') return false;
        const chairSetup = createChairRiseV2Setup({ confirmed: true, source: action.source ?? 'user' });
        if (!this.chair.confirmSetup(chairSetup, nowMs)) {
          return false;
        }
        this.chairConfirmedSetup = chairSetup;
        this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'confirm_chair_setup' });
        this.transition('chair_practice', nowMs, 'chair_setup_confirmed');
        this.attemptEpochId = this.nextAttemptEpoch('chair-practice');
        break;
      case 'chair_setup_voice_completed':
        if (this.stage !== 'chair_setup') return false;
        this.chairSetupVoiceCompleted = true;
        this.bump();
        break;
      case 'chair_practice_voice_completed':
        if (this.stage !== 'chair_practice') return false;
        this.chairPracticeVoiceCompleted = true;
        this.bump();
        break;
      case 'complete_chair_practice_fallback':
        // Explicit user escape when the practice stand is never credited
        // (dim room, occluded knee, too-shallow stand). The practice rep is
        // teach-only — the official window still requires camera-verified
        // reps — so confirming it by hand degrades no measurement.
        if (this.stage !== 'chair_practice' || !this.chairPracticeVoiceCompleted) return false;
        if (!this.chair.completePracticeRep(nowMs)) return false;
        this.diagnostics.chair.practiceCompleted = true;
        this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'complete_chair_practice' });
        this.chairAdapter = new ChairLiveAdapter();
        this.chairCountdownStartedAtMs = null;
        this.transition('chair_countdown', nowMs, 'chair_practice_fallback');
        this.attemptEpochId = this.nextAttemptEpoch('chair-countdown');
        break;
      case 'chair_official_ready_voice_completed':
        if (this.stage !== 'chair_countdown') return false;
        this.chairOfficialReadyVoiceCompleted = true;
        this.bump();
        break;
      case 'chair_countdown_started':
        if (this.stage !== 'chair_countdown' || !this.chairOfficialReadyVoiceCompleted) return false;
        this.chairCountdownStartedAtMs = nowMs;
        this.bump();
        break;
      case 'chair_go_playback_started':
        if (
          this.stage !== 'chair_countdown' ||
          !this.chairOfficialReadyVoiceCompleted ||
          this.chairActiveStartedAtMs !== null
        ) {
          return false;
        }
        // A controller that rejects the start must never leave the coordinator
        // in chair_active with a dead measurement window.
        if (!this.chair.startActive(nowMs)) return false;
        this.chairActiveStartedAtMs = nowMs;
        this.chairAdapter = new ChairLiveAdapter();
        this.chairLostFrames = 0;
        this.transition('chair_active', nowMs, 'chair_go_playback_started');
        this.attemptEpochId = this.nextAttemptEpoch('chair-active');
        break;
      case 'confirm_balance_setup':
        if (this.stage !== 'balance_setup') return false;
        const balanceSetupSource = action.source ?? 'user';
        if (
          !this.balance.confirmSetup(
            createOneLegBalanceV2Setup({
              standingLeg: action.standingLeg,
              priorStandingLeg: this.flow.priorStandingLeg,
              confirmed: true,
              source: balanceSetupSource,
            }),
            nowMs
          )
        ) {
          return false;
        }
        this.flow = movementProfileV2InternalFlowReducer(this.flow, {
          type: 'confirm_balance_setup',
          standingLeg: action.standingLeg,
        });
        this.balanceSetupConfirmedAtMs = nowMs;
        this.balanceSetupSource = balanceSetupSource;
        this.transition('balance_ready', nowMs, 'balance_setup_confirmed');
        this.attemptEpochId = this.nextAttemptEpoch('balance-ready');
        break;
      case 'balance_setup_voice_completed':
        if (this.stage !== 'balance_setup') return false;
        this.balanceSetupVoiceCompleted = true;
        this.bump();
        break;
      case 'balance_attempt_voice_completed':
        if (this.stage !== 'balance_ready') return false;
        this.balanceAttemptVoiceCompleted = true;
        this.bump();
        break;
      case 'balance_support_touched':
      case 'balance_stop':
        if (this.stage !== 'balance_trial' || this.balanceTrialStartedAtMs === null) return false;
        this.completeBalanceTrial(
          nowMs,
          action.type === 'balance_support_touched' ? 'support_touched' : 'user_stopped'
        );
        break;
      case 'balance_use_result':
        if ((this.stage !== 'balance_rest' && this.stage !== 'balance_ready') || this.balanceBestHoldSec === null) {
          return false;
        }
        this.balance.declineRemainingTrials(nowMs);
        this.recordBalanceResult(this.balance.finish(nowMs), nowMs, 'balance_user_accepted_best');
        break;
      case 'balance_skip':
        // Explicit user escape when the foot-lift is never detected (occluded
        // ankles, unusual clothing). Records honestly as declined/no-measurement
        // instead of stranding the user until the hard cap.
        if (this.stage !== 'balance_rest' && this.stage !== 'balance_ready') return false;
        this.balance.declineRemainingTrials(nowMs);
        this.recordBalanceResult(this.balance.finish(nowMs), nowMs, 'balance_skipped_by_user');
        break;
      case 'confirm_shoulder_setup':
        if (this.stage !== 'shoulder_setup') return false;
        if (
          !this.shoulder.confirmSetup(
            createActiveShoulderReachV2Setup({
              selectedSide: action.shoulderSide,
              priorSelectedSide: this.flow.priorShoulderSide,
              confirmed: true,
              source: action.source ?? 'user',
            }),
            nowMs
          )
        ) {
          return false;
        }
        this.flow = movementProfileV2InternalFlowReducer(this.flow, {
          type: 'confirm_shoulder_setup',
          shoulderSide: action.shoulderSide,
        });
        this.diagnostics.shoulder.selectedSide = action.shoulderSide;
        this.transition('shoulder_ready', nowMs, 'shoulder_setup_confirmed');
        this.attemptEpochId = this.nextAttemptEpoch('shoulder-ready');
        break;
      case 'shoulder_transition_voice_completed':
        if (this.stage !== 'shoulder_setup') return false;
        this.shoulderTransitionVoiceCompleted = true;
        this.bump();
        break;
      case 'shoulder_setup_voice_completed':
        if (this.stage !== 'shoulder_ready' && this.stage !== 'shoulder_retry_ready') return false;
        this.shoulderSetupVoiceCompleted = true;
        this.bump();
        break;
      case 'start_shoulder_capture':
        if (this.stage !== 'shoulder_ready' && this.stage !== 'shoulder_retry_ready') return false;
        if (!this.shoulderSetupVoiceCompleted) return false;
        if (!this.shoulder.startCapture(nowMs)) return false;
        this.shoulderAttemptCount++;
        this.diagnostics.shoulder.attempts = this.shoulderAttemptCount;
        this.shoulderCaptureStartedAtMs = nowMs;
        this.shoulderPainLimited = false;
        this.shoulderPeak.reset();
        this.shoulderPeakDeg = null;
        this.shoulderValidTrackingStartedAtMs = null;
        this.shoulderValidTrackingMs = 0;
        this.shoulderLostFrames = 0;
        this.transition('shoulder_active', nowMs, 'shoulder_capture_started');
        this.attemptEpochId = this.nextAttemptEpoch('shoulder-active');
        break;
      case 'shoulder_pain_limited':
        if (this.stage !== 'shoulder_active') return false;
        this.shoulderPainLimited = true;
        this.diagnostics.shoulder.painLimited = true;
        this.bump();
        break;
      case 'start_hinge_capture':
        if (this.stage !== 'hinge_setup') return false;
        if (!this.hingeSetupVoiceCompleted) return false;
        this.hingeStartedAtMs = nowMs;
        this.hingePeak.reset();
        this.hingeValidTrackingStartedAtMs = null;
        this.hingeValidTrackingMs = 0;
        this.hingeLostFrames = 0;
        this.transition('hinge_active', nowMs, 'hinge_capture_started');
        this.attemptEpochId = this.nextAttemptEpoch('hinge-active');
        break;
      case 'hinge_setup_voice_completed':
        if (this.stage !== 'hinge_setup') return false;
        this.hingeSetupVoiceCompleted = true;
        this.bump();
        break;
      case 'finish_hinge_capture':
        if (this.stage !== 'hinge_active') return false;
        this.finishHinge(nowMs, 'user_stopped');
        break;
      case 'recovery_voice_completed':
        if (!this.activeRecoveryEpisode || this.activeRecoveryEpisode.id !== action.recoveryId) return false;
        this.activeRecoveryEpisode = {
          ...this.activeRecoveryEpisode,
          phase: 'voice_completed',
          updatedAtMs: nowMs,
        };
        this.bump();
        break;
      case 'backgrounded':
        this.backgrounded = true;
        this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'backgrounded' });
        this.handleBackground(nowMs);
        this.bump();
        break;
      case 'resumed':
        this.backgrounded = false;
        this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'resumed' });
        this.bump();
        break;
      default:
        return false;
    }
    return before !== this.stage ||
      isVoiceBoundaryAction(action) ||
      action.type === 'recovery_voice_completed' ||
      action.type === 'shoulder_pain_limited' ||
      action.type === 'backgrounded' ||
      action.type === 'resumed';
  }

  receiveTimerTick(nowMs: number): boolean {
    const before = this.revision;
    this.updateHandsFreeWaiting(nowMs);
    if (this.stage === 'chair_active' && this.chairActiveStartedAtMs !== null) {
      const deadline = this.chairActiveStartedAtMs + DEFAULT_CHAIR_RISE_V2_CONFIG.activeWindowMs;
      if (nowMs >= deadline) {
        if (this.framesStalledAt(nowMs)) {
          // A stalled camera means part of the window was never observed —
          // restart rather than record a silently truncated official result.
          this.recoverChairFromTrackingLoss(nowMs);
        } else {
          this.diagnostics.chair.deadlineDriftMs = Math.max(0, nowMs - deadline);
          this.recordChairResult(this.chair.finish(deadline), deadline, 'chair_deadline');
        }
      }
    }
    if (this.stage === 'balance_trial' && this.balanceTrialStartedAtMs !== null) {
      const deadline = this.balanceTrialStartedAtMs + DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs;
      if (nowMs >= deadline) {
        // Never credit a ceiling hold the camera did not actually observe.
        if (this.framesStalledAt(nowMs)) this.invalidateBalanceTrial(nowMs, 'tracking_invalid');
        else this.completeBalanceTrial(deadline, 'ceiling');
      }
    }
    if (this.completeBalanceAtHardCapIfNeeded(nowMs)) return this.revision !== before;
    if (this.stage === 'balance_rest') {
      if (this.balanceRestMinUntilMs !== null && nowMs >= this.balanceRestMinUntilMs) {
        this.transition('balance_ready', this.balanceRestMinUntilMs, 'balance_rest_ready');
        this.attemptEpochId = this.nextAttemptEpoch('balance-ready');
      } else {
        this.bump();
      }
    }
    if (this.stage === 'shoulder_active' && this.shoulderCaptureStartedAtMs !== null) {
      const deadline = this.shoulderCaptureStartedAtMs + DEFAULT_ACTIVE_SHOULDER_REACH_V2_CONFIG.captureWindowMs;
      if (nowMs >= deadline) this.finishShoulderAttempt(deadline, 'shoulder_deadline');
    }
    if (this.stage === 'hinge_active' && this.hingeStartedAtMs !== null) {
      const deadline = this.hingeStartedAtMs + HINGE_CAPTURE_MS;
      if (nowMs >= deadline) this.finishHinge(deadline, 'hinge_deadline');
    }
    return this.revision !== before;
  }

  receivePoseSample(sample: MovementProfileV2LivePoseSample): boolean {
    this.diagnostics.framesReceived++;
    const accepted = this.acceptFrame(sample);
    if (!accepted.accepted) return true;
    const nowMs = accepted.nowMs;
    this.diagnostics.framesAccepted++;
    if (sample.trackingQuality === 'good') this.diagnostics.trackingGoodFrames++;
    else if (sample.trackingQuality === 'uncertain') this.diagnostics.trackingUncertainFrames++;
    else this.diagnostics.trackingLostFrames++;
    this.lastTrackingQuality = sample.trackingQuality;
    // Capture the session's body-unit scale into the flow so the saved
    // CheckUp carries it (comparability metadata; V2 previously stored null).
    if (this.flow.bodyUnit === null && sample.output.bodyUnit !== null) {
      this.flow = movementProfileV2InternalFlowReducer(this.flow, {
        type: 'record_body_unit',
        bodyUnit: sample.output.bodyUnit,
      });
      this.bump();
    }

    const before = this.revision;
    this.updateHandsFreeFromPose(sample, nowMs);
    switch (this.stage) {
      case 'chair_practice':
        this.updateChairPractice(sample, nowMs);
        break;
      case 'chair_active':
        this.updateChairOfficial(sample, nowMs);
        break;
      case 'balance_ready':
      case 'balance_trial':
        this.updateBalance(sample, nowMs);
        break;
      case 'shoulder_active':
        this.updateShoulder(sample, nowMs);
        break;
      case 'hinge_active':
        this.updateHinge(sample, nowMs);
        break;
    }
    return this.revision !== before || accepted.accepted;
  }

  exportDiagnostics(): MovementProfileV2LiveDiagnostics {
    return freezeDiagnostics(this.diagnostics);
  }

  private acceptFrame(sample: MovementProfileV2LivePoseSample): { accepted: true; nowMs: number } | { accepted: false } {
    if (!Number.isFinite(sample.timestampMs) || !Number.isFinite(sample.receivedAtMs)) {
      this.diagnostics.malformedFramesDropped++;
      return { accepted: false };
    }
    if (sample.movementEpochId !== this.movementEpochId) {
      this.diagnostics.epochMismatchFramesDropped++;
      return { accepted: false };
    }
    if (this.attemptEpochId !== null && sample.attemptEpochId !== this.attemptEpochId) {
      this.diagnostics.epochMismatchFramesDropped++;
      return { accepted: false };
    }
    if (this.completedCheckUp) {
      this.diagnostics.epochMismatchFramesDropped++;
      return { accepted: false };
    }
    const frameKey = `${sample.frameId}`;
    if (this.seenFrameIds.has(frameKey)) {
      this.diagnostics.duplicateFramesDropped++;
      return { accepted: false };
    }
    if (this.lastSourceTimestampMs !== null && sample.timestampMs <= this.lastSourceTimestampMs) {
      this.diagnostics.outOfOrderFramesDropped++;
      return { accepted: false };
    }
    const normalized = this.clockBridge.toAppMs(sample.timestampMs, sample.receivedAtMs);
    if (sample.receivedAtMs - normalized > FRAME_STALE_MS) {
      this.diagnostics.staleFramesDropped++;
      return { accepted: false };
    }
    this.seenFrameIds.add(frameKey);
    this.lastSourceTimestampMs = sample.timestampMs;
    this.lastAcceptedFrameAppMs = normalized;
    return { accepted: true, nowMs: normalized };
  }

  private framesStalledAt(nowMs: number): boolean {
    return this.lastAcceptedFrameAppMs === null || nowMs - this.lastAcceptedFrameAppMs > FRAME_STALL_INVALID_MS;
  }

  private updateHandsFreeFromPose(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (!this.handsFreeMode) return;
    this.updateHandsFreeWaiting(nowMs);
    switch (this.stage) {
      case 'standing_frame_check': {
        const ready = this.frameCheckVoiceCompleted && standingFrameCheckReady(sample.output);
        if (this.noteHandsFreeReadiness('standing_frame_check', 'frame', ready, nowMs)) {
          this.passFrameCheck(nowMs, 'frame_check_passed');
        }
        break;
      }
      case 'chair_setup': {
        const ready = this.chairSetupVoiceCompleted && chairSetupReady(sample.output);
        if (this.noteHandsFreeReadiness('chair_setup', 'chair', ready, nowMs)) {
          this.receiveUserAction({ type: 'confirm_chair_setup', source: 'camera_inferred' }, nowMs);
        }
        break;
      }
      case 'balance_setup': {
        if (!this.balanceSetupVoiceCompleted) {
          this.noteHandsFreeReadiness('balance_setup', 'voice', false, nowMs);
          this.clearBalanceReadyLiftEvidence();
          break;
        }
        const standingLeg = this.flow.priorStandingLeg ?? this.flow.standingLeg;
        const ready = this.noteHandsFreeReadiness(
          'balance_setup',
          `standing:${standingLeg}`,
          balanceSetupPoseReady(sample.output),
          nowMs
        );
        if (!ready) {
          this.clearBalanceReadyLiftEvidence();
          break;
        }
        this.receiveUserAction({
          type: 'confirm_balance_setup',
          standingLeg,
          source: sourceForBalanceSetupPose(this.flow.priorStandingLeg, standingLeg),
        }, nowMs);
        break;
      }
      case 'shoulder_setup': {
        if (!this.shoulderTransitionVoiceCompleted) {
          this.noteHandsFreeReadiness('shoulder_setup', 'voice', false, nowMs);
          break;
        }
        const inferred = inferShoulderSide(sample.output, this.flow.priorShoulderSide);
        if (this.noteHandsFreeReadiness('shoulder_setup', inferred ?? 'none', inferred !== null, nowMs) && inferred) {
          this.receiveUserAction({
            type: 'confirm_shoulder_setup',
            shoulderSide: inferred,
            source: sourceForCameraInferredSide(this.flow.priorShoulderSide, inferred),
          }, nowMs);
        }
        break;
      }
      case 'shoulder_ready':
      case 'shoulder_retry_ready': {
        const ready =
          this.shoulderSetupVoiceCompleted && shoulderReadyForAutoCapture(sample.output, this.flow.shoulderSide);
        if (this.noteHandsFreeReadiness(this.stage, this.flow.shoulderSide, ready, nowMs)) {
          this.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs);
        }
        break;
      }
      case 'hinge_setup': {
        const ready = this.hingeSetupVoiceCompleted && hingeSetupFolded(sample.output);
        if (this.noteHandsFreeReadiness('hinge_setup', 'hinge', ready, nowMs)) {
          this.receiveUserAction({ type: 'start_hinge_capture' }, nowMs);
        }
        break;
      }
      case 'balance_ready':
        // Lift detection in updateBalance starts the trial; no pose-driven
        // auto-action here. Crucially, do NOT fall through to the default
        // clear: it would wipe the waiting clock every frame and the manual
        // fallback controls ("Save best result" / "Skip") could never appear.
        break;
      case 'chair_practice':
        // Practice-rep detection in updateChairPractice advances the stage;
        // same rule as balance_ready — the waiting clock must survive so the
        // "I did the practice stand" fallback can appear if detection fails.
        break;
      default:
        this.clearHandsFreeReadiness();
    }
  }

  private updateHandsFreeWaiting(nowMs: number): void {
    if (!this.handsFreeMode || !isHandsFreeWaitingStage(this.stage)) {
      this.clearHandsFreeReadiness();
      return;
    }
    if (this.handsFreeWaitingStage !== this.stage || this.handsFreeWaitingSinceMs === null) {
      this.handsFreeWaitingStage = this.stage;
      this.handsFreeWaitingSinceMs = nowMs;
      this.handsFreeFallbackAvailable = false;
      this.handsFreeReadyStage = null;
      this.handsFreeReadyKey = null;
      this.handsFreeReadySinceMs = null;
      return;
    }
    const fallbackReady = nowMs - this.handsFreeWaitingSinceMs >= this.handsFreeFallbackTimeoutMs;
    if (fallbackReady !== this.handsFreeFallbackAvailable) {
      this.handsFreeFallbackAvailable = fallbackReady;
      this.bump();
    }
  }

  private noteHandsFreeReadiness(
    stage: MovementProfileV2LiveStage,
    key: string,
    ready: boolean,
    nowMs: number
  ): boolean {
    if (!ready) {
      this.handsFreeReadyStage = null;
      this.handsFreeReadyKey = null;
      this.handsFreeReadySinceMs = null;
      return false;
    }
    if (
      this.handsFreeReadyStage !== stage ||
      this.handsFreeReadyKey !== key ||
      this.handsFreeReadySinceMs === null
    ) {
      this.handsFreeReadyStage = stage;
      this.handsFreeReadyKey = key;
      this.handsFreeReadySinceMs = nowMs;
      return false;
    }
    return nowMs - this.handsFreeReadySinceMs >= this.handsFreeSetupDwellMs;
  }

  private clearHandsFreeReadiness(): void {
    this.handsFreeWaitingStage = null;
    this.handsFreeWaitingSinceMs = null;
    this.handsFreeReadyStage = null;
    this.handsFreeReadyKey = null;
    this.handsFreeReadySinceMs = null;
    this.handsFreeFallbackAvailable = false;
  }

  private updateChairPractice(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (!this.chairPracticeVoiceCompleted) return;
    if (sample.trackingQuality === 'lost') {
      this.chairAdapter.resetState();
      return;
    }
    const update = this.chairAdapter.update(sample.output);
    if (!update.repCredited) return;
    this.repCreditCount++;
    this.diagnostics.chair.practiceReps++;
    this.diagnostics.chair.practiceCompleted = true;
    this.chair.completePracticeRep(nowMs);
    this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'complete_chair_practice' });
    this.chairAdapter = new ChairLiveAdapter();
    this.chairCountdownStartedAtMs = null;
    this.transition('chair_countdown', nowMs, 'chair_practice_completed');
    this.attemptEpochId = this.nextAttemptEpoch('chair-countdown');
  }

  private updateChairOfficial(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (sample.trackingQuality !== 'good') {
      this.chairLostFrames++;
      if (this.chairLostFrames >= ACTIVE_TRACKING_LOSS_CONFIRM_FRAMES) {
        this.recoverChairFromTrackingLoss(nowMs);
      } else {
        this.chairAdapter.resetState();
        this.bump();
      }
      return;
    }
    this.chairLostFrames = 0;
    const update = this.chairAdapter.update(sample.output);
    if (!update.repCredited) return;
    const stats = update.repStats;
    const credited = this.chair.creditStand({
      completedAtMs: nowMs,
      meanVel: stats?.meanVel,
      peakVel: stats?.peakVel,
      durationMs: stats?.durationMs,
      pushOff: update.pushOff,
    });
    if (!credited) return;
    this.repCreditCount++;
    this.diagnostics.chair.officialReps++;
    this.bump();
  }

  private updateBalance(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    let leg = this.flow.standingLeg;
    if (sample.trackingQuality !== 'good' || sample.output.bodyUnit === null) {
      if (this.stage === 'balance_ready') this.clearBalanceReadyLiftEvidence();
      if (this.stage === 'balance_trial') {
        this.balanceLostFrames++;
        if (this.balanceLostFrames >= BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES) {
          this.invalidateBalanceTrial(nowMs, 'tracking_invalid');
        }
      }
      return;
    }
    // Tracking-loss and touchdown evidence use SEPARATE counters: a good frame
    // clears loss evidence, and only consecutive leg-down frames (never
    // tracking glitches) may end a trial as a valid touchdown.
    this.balanceLostFrames = 0;
    if (this.stage === 'balance_ready') {
      const liftedStandingLeg = inferBalanceStandingLegFromLift(sample.output, leg);
      if (!liftedStandingLeg) {
        this.clearBalanceReadyLiftEvidence();
        return;
      }
      if (!this.balanceAttemptVoiceCompleted) {
        this.clearBalanceReadyLiftEvidence();
        return;
      }
      this.noteBalanceReadyLiftEvidence(liftedStandingLeg, nowMs);
      const raisedSinceMs = this.balanceReadyRaisedSinceMs;
      if (raisedSinceMs === null || nowMs - raisedSinceMs < BALANCE_LIFT_CONFIRM_MS) return;
      if (!this.updateBalanceStandingLegFromLift(liftedStandingLeg)) {
        // Later trials must reuse the first trial's standing leg. Tell the
        // user (status text) instead of silently ignoring the sustained lift.
        if (!this.balanceWrongLegNoticed) {
          this.balanceWrongLegNoticed = true;
          this.bump();
        }
        return;
      }
      leg = liftedStandingLeg;
      if (!this.balance.startTrial(raisedSinceMs)) return;
      this.balanceTrialStartedAtMs = raisedSinceMs;
      this.balanceLostFrames = 0;
      this.balanceTouchdownFrames = 0;
      this.balanceTouchdownStartedAtMs = null;
      this.balanceWrongLegNoticed = false;
      this.clearBalanceReadyLiftEvidence();
      this.balanceSway = createWelford();
      this.balanceAttemptedTrials++;
      this.diagnostics.balance.attemptedTrials = this.balanceAttemptedTrials;
      this.transition('balance_trial', raisedSinceMs, 'balance_lift_detected');
      this.attemptEpochId = this.nextAttemptEpoch('balance-trial');
    }
    if (this.stage !== 'balance_trial') return;
    const raised = selectedLegRaised(sample.output.frame, sample.output.bodyUnit, leg);
    if (raised) {
      this.balanceTouchdownFrames = 0;
      this.balanceTouchdownStartedAtMs = null;
      this.balanceRaisedFrames++;
      // Scale x into the same (height-normalized) units as the body unit so
      // the sway proxy is aspect-consistent across devices.
      this.balanceSway.push(
        (midpointX(sample.output.frame, LM.LEFT_HIP, LM.RIGHT_HIP) * sample.output.frame.aspect) /
          sample.output.bodyUnit
      );
      return;
    }
    if (this.balanceTouchdownFrames === 0) this.balanceTouchdownStartedAtMs = nowMs;
    this.balanceTouchdownFrames++;
    if (this.balanceRaisedFrames > 0 && this.balanceTouchdownFrames >= BALANCE_TOUCHDOWN_DEBOUNCE_FRAMES) {
      this.completeBalanceTrial(nowMs, 'touchdown', this.balanceTouchdownStartedAtMs ?? nowMs);
    }
  }

  private updateShoulder(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (sample.trackingQuality !== 'good') {
      this.shoulderLostFrames++;
      if (this.shoulderLostFrames >= ACTIVE_TRACKING_LOSS_CONFIRM_FRAMES) {
        this.recoverShoulderFromTrackingLoss(nowMs);
      }
      return;
    }
    this.shoulderLostFrames = 0;
    const side = this.flow.shoulderSide;
    if (!armChainReliable(sample.output, side)) return;
    const angle = shoulderReachAngleDegForSide(sample.output.frame, side);
    const torsoUpright = torsoIsUpright(sample.output.frame, side);
    if (!torsoUpright || angle < 35) {
      this.shoulderValidTrackingStartedAtMs = null;
      return;
    }
    if (this.shoulderValidTrackingStartedAtMs === null) this.shoulderValidTrackingStartedAtMs = nowMs;
    this.shoulderValidTrackingMs = Math.max(
      this.shoulderValidTrackingMs,
      nowMs - this.shoulderValidTrackingStartedAtMs
    );
    const peak = this.shoulderPeak.update(angle, nowMs);
    this.shoulderPeakDeg = Number.isFinite(peak.peak) ? peak.peak : this.shoulderPeakDeg;
    this.diagnostics.shoulder.peakFlexionDeg = this.shoulderPeakDeg;
    this.diagnostics.shoulder.validTrackingMs = this.shoulderValidTrackingMs;
    this.bump();
  }

  private updateHinge(sample: MovementProfileV2LivePoseSample, nowMs: number): void {
    if (sample.trackingQuality !== 'good' || sample.output.bodyUnit === null) {
      this.hingeLostFrames++;
      if (this.hingeLostFrames >= ACTIVE_TRACKING_LOSS_CONFIRM_FRAMES) {
        this.recoverHingeFromTrackingLoss(nowMs);
      }
      return;
    }
    this.hingeLostFrames = 0;
    const sideIsLeft = sample.output.chainReliability[LEFT_SIDE_CHAIN] >= sample.output.chainReliability[RIGHT_SIDE_CHAIN];
    const wrist = sideIsLeft ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
    const ankle = sideIsLeft ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
    const heel = sideIsLeft ? LM.LEFT_HEEL : LM.RIGHT_HEEL;
    const foot = sideIsLeft ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX;
    const shoulder = sideIsLeft ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
    const hip = sideIsLeft ? LM.LEFT_HIP : LM.RIGHT_HIP;
    const knee = sideIsLeft ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
    const frame = sample.output.frame;
    const floorY = Math.max(frame.ys[ankle], frame.ys[heel], frame.ys[foot]);
    const reachBu = (floorY - frame.ys[wrist]) / sample.output.bodyUnit;
    const trunkAngle = angleAtDeg(frame, shoulder, hip, knee);
    if (trunkAngle > HINGE_FOLDED_TRUNK_MAX_DEG) {
      this.hingeValidTrackingStartedAtMs = null;
      return;
    }
    if (this.hingeValidTrackingStartedAtMs === null) this.hingeValidTrackingStartedAtMs = nowMs;
    this.hingeValidTrackingMs = Math.max(this.hingeValidTrackingMs, nowMs - this.hingeValidTrackingStartedAtMs);
    const peak = this.hingePeak.update(reachBu, nowMs);
    this.hingeReachBu = Number.isFinite(peak.peak) ? peak.peak : this.hingeReachBu;
    this.diagnostics.hinge.reachBu = this.hingeReachBu;
    this.diagnostics.hinge.captureValid = this.hingeValidTrackingMs >= HINGE_VALID_TRACKING_MS && this.hingeReachBu !== null;
    this.bump();
  }

  private completeBalanceTrial(
    nowMs: number,
    termination: 'touchdown' | 'support_touched' | 'user_stopped' | 'ceiling',
    measuredEndMs: number = nowMs
  ): void {
    if (this.balanceTrialStartedAtMs === null) return;
    const measurementEndedAtMs = termination === 'ceiling' ? nowMs : measuredEndMs;
    const holdMs =
      termination === 'ceiling'
        ? DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs
        : Math.max(0, measurementEndedAtMs - this.balanceTrialStartedAtMs);
    this.balance.completeTrial({
      nowMs: measurementEndedAtMs,
      holdMs,
      swaySd: this.balanceSway.sd(),
      termination,
    });
    this.balanceTrialStartedAtMs = null;
    this.balanceTouchdownFrames = 0;
    this.balanceTouchdownStartedAtMs = null;
    const holdSec = holdMs / 1000;
    this.balanceValidTrials++;
    this.balanceBestHoldSec =
      this.balanceBestHoldSec === null ? holdSec : Math.max(this.balanceBestHoldSec, holdSec);
    this.balanceCeilingReached = termination === 'ceiling' || holdMs >= DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs;
    this.diagnostics.balance.validTrials = this.balanceValidTrials;
    this.diagnostics.balance.ceilingReached = this.balanceCeilingReached;
    if (this.balanceCeilingReached || this.balanceValidTrials >= DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxValidTrials) {
      this.recordBalanceResult(this.balance.finish(nowMs), nowMs, 'balance_section_complete');
      return;
    }
    this.enterBalanceRest(nowMs, 'balance_valid_trial_rest');
  }

  private invalidateBalanceTrial(nowMs: number, reason: 'tracking_invalid' | 'app_backgrounded'): void {
    if (this.stage !== 'balance_trial') return;
    const fromStage = this.stage;
    const lossAttemptEpochId = this.attemptEpochId;
    const invalidated =
      reason === 'app_backgrounded'
        ? this.balance.appBackgrounded(nowMs)
        : this.balance.invalidateTrial(nowMs, reason);
    if (!invalidated) return;
    this.balanceTrialStartedAtMs = null;
    this.balanceTouchdownFrames = 0;
    this.balanceTouchdownStartedAtMs = null;
    this.balanceInvalidTrials++;
    this.diagnostics.trackingInterruptions++;
    this.diagnostics.balance.invalidTrials = this.balanceInvalidTrials;
    this.diagnostics.balance.retryCount = this.balanceInvalidTrials;
    if (this.balanceInvalidTrials > 1) {
      if (this.balanceBestHoldSec !== null) {
        this.balance.declineRemainingTrials(nowMs);
      }
      this.recordBalanceResult(this.balance.finish(nowMs), nowMs, 'balance_invalid_retry_limit');
      return;
    }
    if (reason === 'tracking_invalid') {
      this.startRecoveryEpisode({
        item: 'balance',
        fromStage,
        targetStage: 'balance_rest',
        lossAttemptEpochId,
        recoveryAttemptEpochId: null,
        itemSpecificCue: 'mpv2_balance_tracking_retry',
        nowMs,
      });
    }
    this.enterBalanceRest(nowMs, 'balance_invalid_trial_retry_rest');
  }

  private enterBalanceRest(nowMs: number, reason: string): void {
    this.balanceTrialStartedAtMs = null;
    this.balanceTouchdownFrames = 0;
    this.balanceTouchdownStartedAtMs = null;
    this.clearBalanceReadyLiftEvidence();
    this.balanceRestMinUntilMs = nowMs + BALANCE_REST_MIN_MS;
    this.diagnostics.balance.restCount++;
    this.transition('balance_rest', nowMs, reason);
    this.attemptEpochId = this.nextAttemptEpoch('balance-rest');
  }

  private finishShoulderAttempt(nowMs: number, reason: string): void {
    const valid = this.shoulderPeakDeg !== null && this.shoulderValidTrackingMs >= DEFAULT_ACTIVE_SHOULDER_REACH_V2_CONFIG.validTrackingRequiredMs;
    if (valid && this.shoulderPeakDeg !== null) {
      const input = {
        nowMs,
        peakFlexionDeg: Math.max(0, Math.min(180, this.shoulderPeakDeg)),
        validTrackingMs: this.shoulderValidTrackingMs,
      };
      if (this.shoulderPainLimited) this.shoulder.recordPainLimitedCapture(input);
      else this.shoulder.recordValidCapture(input);
    } else {
      this.shoulder.recordInvalidCapture(nowMs, reason);
    }
    const phase = this.shoulder.phase;
    if (phase === 'retry_ready') {
      this.diagnostics.shoulder.retryCount++;
      this.transition('shoulder_retry_ready', nowMs, 'shoulder_retry_ready');
      this.attemptEpochId = this.nextAttemptEpoch('shoulder-retry-ready');
      return;
    }
    this.recordShoulderResult(this.shoulder.finish(nowMs), nowMs, 'shoulder_section_complete');
  }

  private recoverChairFromTrackingLoss(nowMs: number): void {
    if (this.stage !== 'chair_active') return;
    const lossAttemptEpochId = this.attemptEpochId;
    this.chair.trackingInterrupted(nowMs);
    this.diagnostics.trackingInterruptions++;
    this.diagnostics.chair.trackingInterruptions++;
    this.chairAdapter = new ChairLiveAdapter();
    this.chairLostFrames = 0;
    this.chairActiveStartedAtMs = null;
    this.chairCountdownStartedAtMs = null;
    // Bounded restarts: after the cap, record the tracking-flagged partial
    // result rather than looping the user through 30-second redos forever
    // (e.g. in a room too dim for stable detection).
    if (this.chairRecoveryCount >= CHAIR_MAX_RECOVERIES || !this.chairConfirmedSetup) {
      this.recordChairResult(this.chair.finish(nowMs), nowMs, 'chair_tracking_loss_retry_limit');
      return;
    }
    this.chairRecoveryCount++;
    this.diagnostics.chair.officialReps = 0;
    const restarted = new ChairRiseV2ProtocolController();
    // Reuse the setup the user already confirmed for this item. A synthetic
    // 'direct_call' bypass here is rejected by the controller's confirmation
    // gate and would silently void every rep of the redone test.
    if (!restarted.confirmSetup(this.chairConfirmedSetup, nowMs) || !restarted.completePracticeRep(nowMs)) {
      this.recordChairResult(this.chair.finish(nowMs), nowMs, 'chair_tracking_loss_restart_failed');
      return;
    }
    this.chair = restarted;
    const recoveryAttemptEpochId = this.nextAttemptEpoch('chair-recovery-countdown');
    this.startRecoveryEpisode({
      item: 'chair',
      fromStage: 'chair_active',
      targetStage: 'chair_countdown',
      lossAttemptEpochId,
      recoveryAttemptEpochId,
      itemSpecificCue: null,
      nowMs,
    });
    this.transition('chair_countdown', nowMs, 'chair_tracking_loss_recovery_countdown');
    this.attemptEpochId = recoveryAttemptEpochId;
  }

  private recoverShoulderFromTrackingLoss(nowMs: number): void {
    if (this.stage !== 'shoulder_active') return;
    const lossAttemptEpochId = this.attemptEpochId;
    this.shoulderLostFrames = 0;
    this.shoulderCaptureStartedAtMs = null;
    this.shoulderValidTrackingStartedAtMs = null;
    this.shoulderValidTrackingMs = 0;
    this.shoulderPeak.reset();
    this.shoulderPeakDeg = null;
    this.diagnostics.trackingInterruptions++;
    this.shoulder.recordInvalidCapture(nowMs, 'tracking_invalid');
    const phase = this.shoulder.phase;
    if (phase === 'retry_ready') {
      this.diagnostics.shoulder.retryCount++;
      const recoveryAttemptEpochId = this.nextAttemptEpoch('shoulder-recovery-ready');
      this.startRecoveryEpisode({
        item: 'shoulder',
        fromStage: 'shoulder_active',
        targetStage: 'shoulder_retry_ready',
        lossAttemptEpochId,
        recoveryAttemptEpochId,
        itemSpecificCue: 'mpv2_shoulder_tracking_retry',
        nowMs,
      });
      this.transition('shoulder_retry_ready', nowMs, 'shoulder_tracking_loss_retry_ready');
      this.attemptEpochId = recoveryAttemptEpochId;
      return;
    }
    this.recordShoulderResult(this.shoulder.finish(nowMs), nowMs, 'shoulder_tracking_loss_retry_limit');
  }

  private recoverHingeFromTrackingLoss(nowMs: number): void {
    if (this.stage !== 'hinge_active') return;
    // Bounded restarts, mirroring the chair cap: record whatever valid
    // tracking accumulated (or an honest no-measurement) instead of looping.
    if (this.hingeRecoveryCount >= HINGE_MAX_RECOVERIES) {
      this.diagnostics.trackingInterruptions++;
      this.finishHinge(nowMs, 'tracking_invalid_retry_limit');
      return;
    }
    this.hingeRecoveryCount++;
    const lossAttemptEpochId = this.attemptEpochId;
    this.hingeLostFrames = 0;
    this.hingeStartedAtMs = null;
    this.hingePeak.reset();
    this.hingeValidTrackingStartedAtMs = null;
    this.hingeValidTrackingMs = 0;
    this.hingeReachBu = null;
    this.diagnostics.hinge.captureValid = false;
    this.diagnostics.hinge.reachBu = null;
    this.diagnostics.trackingInterruptions++;
    const recoveryAttemptEpochId = this.nextAttemptEpoch('hinge-recovery-setup');
    this.startRecoveryEpisode({
      item: 'hinge',
      fromStage: 'hinge_active',
      targetStage: 'hinge_setup',
      lossAttemptEpochId,
      recoveryAttemptEpochId,
      itemSpecificCue: null,
      nowMs,
    });
    this.transition('hinge_setup', nowMs, 'hinge_tracking_loss_recovery_setup');
    this.attemptEpochId = recoveryAttemptEpochId;
  }

  private startRecoveryEpisode(input: {
    item: MovementProfileV2RecoveryItem;
    fromStage: MovementProfileV2LiveStage;
    targetStage: MovementProfileV2LiveStage;
    lossAttemptEpochId: string | null;
    recoveryAttemptEpochId: string | null;
    itemSpecificCue: Mpv2RecoveryEpisode['itemSpecificCue'];
    nowMs: number;
  }): void {
    if (
      this.activeRecoveryEpisode &&
      this.activeRecoveryEpisode.phase !== 'voice_completed' &&
      this.activeRecoveryEpisode.item === input.item
    ) {
      this.activeRecoveryEpisode = {
        ...this.activeRecoveryEpisode,
        duplicateLossEvents: this.activeRecoveryEpisode.duplicateLossEvents + 1,
        updatedAtMs: input.nowMs,
      };
      this.diagnostics.recovery.duplicateLossEvents++;
      return;
    }
    const episode: Mpv2RecoveryEpisode = {
      id: `mpv2-recovery-${++this.recoveryCounter}`,
      item: input.item,
      phase: 'attempt_invalidated',
      startedAtMs: input.nowMs,
      updatedAtMs: input.nowMs,
      lossStage: input.fromStage,
      targetStage: input.targetStage,
      lossAttemptEpochId: input.lossAttemptEpochId,
      recoveryAttemptEpochId: input.recoveryAttemptEpochId,
      reason: 'tracking_invalid',
      partialAttemptInvalidated: true,
      freshStartRequired: true,
      itemSpecificCue: input.itemSpecificCue,
      duplicateLossEvents: 0,
      precedence: 'loss_before_terminal_event',
    };
    this.activeRecoveryEpisode = episode;
    this.diagnostics.recovery.episodeCount++;
    this.diagnostics.recovery.lastEpisodeId = episode.id;
    this.diagnostics.recovery.lastItem = episode.item;
  }

  private passFrameCheck(nowMs: number, reason: string): void {
    if (this.stage !== 'standing_frame_check') return;
    const first = this.batterySequence[0];
    this.transition(BATTERY_MOVEMENT_SETUP_STAGE[first], nowMs, reason);
    this.movementEpochId = this.nextMovementEpoch(first);
    this.attemptEpochId = null;
  }

  /** After the fallback timeout with tracking still not good, the dominant
   * home cause is dim light (detection degrades before a room looks dark). */
  private frameCheckLightingHintNeeded(): boolean {
    return (
      this.stage === 'standing_frame_check' &&
      this.handsFreeFallbackAvailable &&
      this.lastTrackingQuality !== 'good'
    );
  }

  private finishHinge(nowMs: number, reason: string): void {
    const valid = this.hingeValidTrackingMs >= HINGE_VALID_TRACKING_MS && this.hingeReachBu !== null;
    this.hingeResult = {
      movementId: HINGE_REACH_ID,
      reachBu: valid ? this.hingeReachBu as number : null,
      flags: valid ? [] : ['no-measurement', reason],
      interruptions: 0,
      validTime: {
        targetValidSeconds: HINGE_VALID_TRACKING_MS / 1000,
        accumulatedValidSeconds: this.hingeValidTrackingMs / 1000,
        wallClockSeconds: this.hingeStartedAtMs === null ? 0 : Math.max(0, nowMs - this.hingeStartedAtMs) / 1000,
        pauseCount: 0,
        longestContinuousValidSeconds: this.hingeValidTrackingMs / 1000,
        positionLostEvents: valid ? 0 : 1,
        trackingLostSeconds: 0,
        completedByValidTime: valid,
        endedBySafetyCap: false,
      },
    };
    this.flow = movementProfileV2InternalFlowReducer(this.flow, {
      type: 'record_hinge',
      result: this.hingeResult,
    });
    this.advanceAfterMovement('hinge', nowMs, 'hinge_recorded');
  }

  private recordChairResult(result: ChairRiseV2Result, nowMs: number, reason: string): void {
    if (this.chairResult) return;
    this.chairResult = result;
    this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'record_chair', result });
    this.advanceAfterMovement('chair', nowMs, reason);
  }

  private recordBalanceResult(result: OneLegBalanceV2Result, nowMs: number, reason: string): void {
    if (this.balanceResult) return;
    this.balanceResult = result;
    this.balanceTrialStartedAtMs = null;
    this.balanceTouchdownFrames = 0;
    this.balanceTouchdownStartedAtMs = null;
    this.balanceWrongLegNoticed = false;
    this.clearBalanceReadyLiftEvidence();
    this.diagnostics.balance.hardCapReached = result.hardCapReached;
    this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'record_balance', result });
    this.advanceAfterMovement('balance', nowMs, reason);
  }

  private recordShoulderResult(result: ActiveShoulderReachV2Result, nowMs: number, reason: string): void {
    if (this.shoulderResult) return;
    this.shoulderResult = result;
    this.flow = movementProfileV2InternalFlowReducer(this.flow, { type: 'record_shoulder', result });
    this.advanceAfterMovement('shoulder', nowMs, reason);
  }

  private handleBackground(nowMs: number): void {
    // Backgrounding mid-measure follows the same contract as tracking loss:
    // the interrupted attempt is invalidated and the test restarts fresh on
    // return. A truncated attempt is never recorded as an official result.
    if (this.stage === 'chair_active') {
      this.recoverChairFromTrackingLoss(nowMs);
    } else if (this.stage === 'balance_trial') {
      this.invalidateBalanceTrial(nowMs, 'app_backgrounded');
    } else if (this.stage === 'balance_setup' || this.stage === 'balance_ready') {
      this.clearBalanceReadyLiftEvidence();
    } else if (this.stage === 'shoulder_active') {
      this.recoverShoulderFromTrackingLoss(nowMs);
    } else if (this.stage === 'hinge_active') {
      this.recoverHingeFromTrackingLoss(nowMs);
    }
  }

  private transition(to: MovementProfileV2LiveStage, atMs: number, reason: string): void {
    const from = this.stage;
    if (from === to) {
      this.bump();
      return;
    }
    this.stage = to;
    // A recovery episode is resolved once measurement actually restarts (a
    // fresh attempt enters an active stage), or once its voice has completed
    // and the flow moves past the recovery target (rest over, countdown done).
    // Without this the episode lingered for the rest of the check-up, pinning
    // the guidance/notice in the "Tracking reset" state.
    if (
      this.activeRecoveryEpisode &&
      (isActiveMeasurementStage(to) ||
        (this.activeRecoveryEpisode.phase === 'voice_completed' &&
          to !== this.activeRecoveryEpisode.targetStage))
    ) {
      this.activeRecoveryEpisode = null;
    }
    this.resetVoicePrerequisitesForStage(to);
    this.clearHandsFreeReadiness();
    this.diagnostics.stateTransitions = boundedAppend(this.diagnostics.stateTransitions, {
      atMs,
      from,
      to,
      reason,
    });
    this.bump();
  }

  private bump(): void {
    this.revision++;
  }

  private resetVoicePrerequisitesForStage(stage: MovementProfileV2LiveStage): void {
    if (stage === 'standing_frame_check') {
      this.frameCheckVoiceCompleted = false;
    }
    if (stage === 'chair_setup') {
      this.chairSetupVoiceCompleted = false;
    }
    if (stage === 'chair_practice') {
      this.chairPracticeVoiceCompleted = false;
    }
    if (stage === 'chair_countdown') {
      this.chairOfficialReadyVoiceCompleted = false;
      this.chairCountdownStartedAtMs = null;
      this.chairActiveStartedAtMs = null;
    }
    if (stage === 'balance_ready') {
      this.balanceAttemptVoiceCompleted = false;
      this.balanceWrongLegNoticed = false;
      if (this.balanceReadyRaisedStandingLeg !== this.flow.standingLeg) {
        this.clearBalanceReadyLiftEvidence();
      } else {
        this.balanceRaisedFrames = 0;
      }
    }
    if (stage === 'balance_setup') {
      this.balanceSetupVoiceCompleted = false;
      this.balanceSetupConfirmedAtMs = null;
      this.balanceSetupSource = null;
      this.balanceWrongLegNoticed = false;
      this.clearBalanceReadyLiftEvidence();
    }
    if (stage === 'shoulder_setup') {
      this.shoulderTransitionVoiceCompleted = false;
    }
    if (stage === 'shoulder_ready' || stage === 'shoulder_retry_ready') {
      this.shoulderSetupVoiceCompleted = false;
    }
    if (stage === 'hinge_setup') {
      this.hingeSetupVoiceCompleted = false;
    }
  }

  private nextMovementEpoch(prefix: string): string {
    return `${prefix}-${++this.movementEpochCounter}`;
  }

  private nextAttemptEpoch(prefix: string): string {
    return `${prefix}-${++this.attemptEpochCounter}`;
  }

  private remainingUntil(deadline: number | null, nowMs: number): number | null {
    if (deadline === null) return null;
    return Math.max(0, deadline - nowMs);
  }

  private timerRemaining(nowMs: number): number | null {
    if (this.stage === 'chair_countdown' && this.chairCountdownStartedAtMs !== null) {
      return this.remainingUntil(this.chairCountdownStartedAtMs + MPV2_CHAIR_COUNTDOWN_TOTAL_MS, nowMs);
    }
    if (this.stage === 'chair_active' && this.chairActiveStartedAtMs !== null) {
      return this.remainingUntil(this.chairActiveStartedAtMs + DEFAULT_CHAIR_RISE_V2_CONFIG.activeWindowMs, nowMs);
    }
    if (this.stage === 'balance_trial' && this.balanceTrialStartedAtMs !== null) {
      return this.remainingUntil(this.balanceTrialStartedAtMs + DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs, nowMs);
    }
    if (this.stage === 'shoulder_active' && this.shoulderCaptureStartedAtMs !== null) {
      return this.remainingUntil(
        this.shoulderCaptureStartedAtMs + DEFAULT_ACTIVE_SHOULDER_REACH_V2_CONFIG.captureWindowMs,
        nowMs
      );
    }
    if (this.stage === 'hinge_active' && this.hingeStartedAtMs !== null) {
      return this.remainingUntil(this.hingeStartedAtMs + HINGE_CAPTURE_MS, nowMs);
    }
    return null;
  }

  private balanceTimerKind(): MovementProfileV2BalanceTimerKind {
    if (this.stage === 'balance_trial' && this.balanceTrialStartedAtMs !== null) return 'active_trial';
    if (this.stage === 'balance_rest') return 'rest';
    return 'none';
  }

  private voicePrerequisitePending(): boolean {
    switch (this.stage) {
      case 'standing_frame_check':
        return this.handsFreeMode && !this.frameCheckVoiceCompleted;
      case 'chair_setup':
        return this.handsFreeMode && !this.chairSetupVoiceCompleted;
      case 'chair_practice':
        return !this.chairPracticeVoiceCompleted;
      case 'chair_countdown':
        return !this.chairOfficialReadyVoiceCompleted;
      case 'balance_setup':
        return this.handsFreeMode && !this.balanceSetupVoiceCompleted;
      case 'balance_ready':
        return !this.balanceAttemptVoiceCompleted;
      case 'shoulder_setup':
        return this.handsFreeMode && !this.shoulderTransitionVoiceCompleted;
      case 'shoulder_ready':
      case 'shoulder_retry_ready':
        return !this.shoulderSetupVoiceCompleted;
      case 'hinge_setup':
        return !this.hingeSetupVoiceCompleted;
      default:
        return false;
    }
  }

  private recordingVisualMetricProtected(): boolean {
    switch (this.stage) {
      case 'chair_countdown':
      case 'chair_active':
      case 'balance_trial':
      case 'balance_rest':
      case 'shoulder_active':
      case 'hinge_active':
        return true;
      case 'balance_ready':
        return this.balanceBestHoldSec !== null;
      case 'shoulder_ready':
      case 'shoulder_retry_ready':
        return this.shoulderPeakDeg !== null;
      case 'hinge_setup':
        return this.hingeReachBu !== null;
      default:
        return false;
    }
  }

  private completeBalanceAtHardCapIfNeeded(nowMs: number): boolean {
    if (
      this.balanceSetupConfirmedAtMs === null ||
      (this.stage !== 'balance_ready' && this.stage !== 'balance_rest')
    ) {
      return false;
    }
    const hardCapAtMs = this.balanceSetupConfirmedAtMs + DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.hardCapMs;
    if (nowMs < hardCapAtMs) return false;
    if (this.balanceBestHoldSec !== null) this.balance.declineRemainingTrials(hardCapAtMs);
    this.recordBalanceResult(this.balance.finish(hardCapAtMs), hardCapAtMs, 'balance_hard_cap');
    return true;
  }

  private updateBalanceStandingLegFromLift(standingLeg: BodySide): boolean {
    if (this.balanceAttemptedTrials > 0) {
      return standingLeg === this.flow.standingLeg;
    }
    const source = sourceForBalanceLiftStart(
      this.flow.priorStandingLeg,
      this.flow.standingLeg,
      standingLeg,
      this.balanceSetupSource
    );
    if (
      !this.balance.updateSetupBeforeFirstTrial(
        createOneLegBalanceV2Setup({
          standingLeg,
          priorStandingLeg: this.flow.priorStandingLeg,
          confirmed: true,
          source,
        })
      )
    ) {
      return false;
    }
    this.flow = movementProfileV2InternalFlowReducer(this.flow, {
      type: 'update_balance_standing_leg',
      standingLeg,
    });
    this.balanceSetupSource = source;
    return true;
  }

  private noteBalanceReadyLiftEvidence(standingLeg: BodySide, nowMs: number): void {
    if (
      this.balanceReadyRaisedStandingLeg !== standingLeg ||
      this.balanceReadyRaisedSinceMs === null
    ) {
      this.balanceReadyRaisedStandingLeg = standingLeg;
      this.balanceReadyRaisedSinceMs = nowMs;
      this.balanceRaisedFrames = 1;
      return;
    }
    this.balanceRaisedFrames++;
  }

  private clearBalanceReadyLiftEvidence(): void {
    this.balanceReadyRaisedStandingLeg = null;
    this.balanceReadyRaisedSinceMs = null;
    this.balanceRaisedFrames = 0;
  }

  private statusText(): string {
    switch (this.stage) {
      case 'standing_frame_check':
        if (this.frameCheckLightingHintNeeded()) {
          return `${BRAND.appName} is struggling to see you clearly. Try turning on the main light, then stand still facing the phone.`;
        }
        return 'Stand still where the camera can see your whole body, about three big steps back from the phone.';
      case 'chair_setup':
        if (this.handsFreeMode) return `Sit side-on in a sturdy chair. ${BRAND.appName} will begin when the camera is ready.`;
        return `Confirm the sturdy chair setup, then ${BRAND.appName} will watch for one practice stand.`;
      case 'chair_practice':
        return 'Do one practice stand. The practice rep will not count.';
      case 'chair_countdown':
        return 'Get ready. The official 30-second timer starts after the countdown.';
      case 'chair_active':
        return 'Official chair rise capture is running.';
      case 'balance_setup':
        if (this.handsFreeMode) return 'Stand with both feet on the floor, with support within reach.';
        return 'Choose the standing leg, with support close by.';
      case 'balance_ready':
        if (this.balanceWrongLegNoticed) {
          return `Stand on your ${this.flow.standingLeg} leg — the same side as your first attempt — and lift the other foot.`;
        }
        if (this.handsFreeMode && this.balanceBestHoldSec !== null) {
          return "Lift one foot again when you're ready.";
        }
        return `Lift your foot high when you're ready. The timer starts when ${BRAND.appName} sees the lift.`;
      case 'balance_trial':
        return 'Keep holding.';
      case 'balance_rest':
        if (this.handsFreeMode) return "Attempt saved. Rest before the next try.";
        return 'Rest before the next attempt. The minimum rest cannot be skipped.';
      case 'shoulder_setup':
        if (this.handsFreeMode) return 'Turn side-on to the phone with your feet still and arms by your sides.';
        return 'Choose the shoulder side closest to the camera.';
      case 'shoulder_ready':
        if (this.handsFreeMode) return 'Raise your selected arm straight forward and up within a comfortable range.';
        return 'Start when your selected side is in view.';
      case 'shoulder_active':
        return 'Hold still with your arm raised comfortably.';
      case 'shoulder_retry_ready':
        return 'Lower your arm, stand tall side-on, and try once more.';
      case 'hinge_setup':
        if (this.handsFreeMode) return 'Stand side-on, move slowly, and fold forward when instructed.';
        return 'Set up side-on for the supporting forward reach.';
      case 'hinge_active':
        return `Hold there. ${BRAND.appName} is saving the reach now.`;
      case 'raw_complete':
        return 'Your raw Check-Up is saved.';
      default:
        return '';
    }
  }
}

interface BuildMovementProfileV2RecordingVisualGuidanceInput {
  stage: MovementProfileV2LiveStage;
  statusText: string;
  trackingQuality: MovementProfileV2TrackingQuality | null;
  backgrounded: boolean;
  recoveryEpisode: Mpv2RecoveryEpisode | null;
  handsFreeMode: boolean;
  handsFreeWaitingStage: MovementProfileV2LiveStage | null;
  handsFreeReadyStage: MovementProfileV2LiveStage | null;
  handsFreeFallbackAvailable: boolean;
  voicePrerequisitePending: boolean;
  metricProtected: boolean;
  chairCountdownStarted: boolean;
}

function buildMovementProfileV2RecordingVisualGuidance(
  input: BuildMovementProfileV2RecordingVisualGuidanceInput
): RecordingVisualGuidance {
  if (input.backgrounded) {
    return mpv2RecordingVisualGuidance({
      visualState: 'recovery',
      statusText: input.statusText,
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      reason: 'mpv2:backgrounded',
    });
  }

  // A voice_completed episode is resolved guidance-wise: the recovery line has
  // played and the stage's own guidance (countdown, rest, ready) should show.
  if (input.recoveryEpisode && input.recoveryEpisode.phase !== 'voice_completed') {
    return mpv2RecordingVisualGuidance({
      visualState: 'recovery',
      statusText: input.statusText,
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      reason: 'mpv2:recovery',
    });
  }

  if (input.stage === 'raw_complete') {
    return mpv2RecordingVisualGuidance({
      visualState: 'ready',
      statusText: input.statusText,
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: false,
      reason: 'mpv2:complete',
    });
  }

  if (input.trackingQuality === null || input.trackingQuality === 'lost') {
    return mpv2RecordingVisualGuidance({
      visualState: 'lost',
      statusText: input.statusText,
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: input.metricProtected,
      reason: input.trackingQuality === null ? 'mpv2:no-pose' : 'mpv2:tracking-lost',
    });
  }

  if (input.voicePrerequisitePending) {
    return mpv2RecordingVisualGuidance({
      visualState: voiceBlockedVisualState(input.stage),
      statusText: input.statusText,
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: input.metricProtected,
      reason: 'mpv2:audio-blocking',
    });
  }

  switch (input.stage) {
    case 'standing_frame_check':
    case 'chair_setup':
    case 'balance_setup':
    case 'shoulder_setup':
    case 'hinge_setup': {
      const visualState = setupVisualState(input);
      return mpv2RecordingVisualGuidance({
        visualState,
        statusText: input.statusText,
        blocksMeasurement: true,
        blocksAutoStart: true,
        metricProtected: input.metricProtected,
        reason: `mpv2:${visualState === 'ready' ? 'setup-ready' : visualState === 'adjust' ? 'setup-adjust' : 'setup-tracking'}`,
      });
    }
    case 'chair_countdown':
      return mpv2RecordingVisualGuidance({
        visualState: 'ready',
        statusText: input.statusText,
        blocksMeasurement: true,
        blocksAutoStart: !input.chairCountdownStarted,
        metricProtected: true,
        reason: 'mpv2:countdown',
      });
    case 'chair_active':
    case 'balance_trial':
    case 'shoulder_active':
    case 'hinge_active':
      return mpv2RecordingVisualGuidance({
        visualState: 'active',
        statusText: input.statusText,
        blocksMeasurement: false,
        blocksAutoStart: false,
        metricProtected: true,
        reason: 'mpv2:active',
      });
    case 'chair_practice':
      return mpv2RecordingVisualGuidance({
        visualState: 'tracking',
        statusText: input.statusText,
        blocksMeasurement: false,
        blocksAutoStart: false,
        metricProtected: false,
        reason: 'mpv2:practice',
      });
    case 'balance_ready':
    case 'shoulder_ready':
    case 'shoulder_retry_ready':
      return mpv2RecordingVisualGuidance({
        visualState: 'ready',
        statusText: input.statusText,
        blocksMeasurement: true,
        blocksAutoStart: false,
        metricProtected: input.metricProtected,
        reason: 'mpv2:ready',
      });
    case 'balance_rest':
      return mpv2RecordingVisualGuidance({
        visualState: 'tracking',
        statusText: input.statusText,
        blocksMeasurement: true,
        blocksAutoStart: true,
        metricProtected: input.metricProtected,
        reason: 'mpv2:rest',
      });
  }
}

function mpv2RecordingVisualGuidance(input: {
  visualState: RecordingVisualGuidance['visualState'];
  statusText: string;
  blocksMeasurement: boolean;
  blocksAutoStart: boolean;
  metricProtected: boolean;
  reason: string;
}): RecordingVisualGuidance {
  return {
    visualState: input.visualState,
    source: 'mpv2_live',
    primaryText: input.statusText,
    secondaryText: null,
    blocksMeasurement: input.blocksMeasurement,
    blocksAutoStart: input.blocksAutoStart,
    voiceCue: null,
    metricProtected: input.metricProtected,
    reason: input.reason,
  };
}

function voiceBlockedVisualState(stage: MovementProfileV2LiveStage): RecordingVisualGuidance['visualState'] {
  switch (stage) {
    case 'chair_countdown':
    case 'balance_ready':
    case 'shoulder_ready':
    case 'shoulder_retry_ready':
      return 'ready';
    default:
      return 'tracking';
  }
}

function setupVisualState(
  input: BuildMovementProfileV2RecordingVisualGuidanceInput
): RecordingVisualGuidance['visualState'] {
  if (
    input.handsFreeMode &&
    (input.handsFreeReadyStage === input.stage || input.handsFreeFallbackAvailable)
  ) {
    return 'ready';
  }
  if (input.trackingQuality === 'uncertain') return 'adjust';
  if (input.handsFreeMode && input.handsFreeWaitingStage === input.stage) return 'adjust';
  return 'tracking';
}

class MonotonicFrameClockBridge {
  private offsetMs: number | null = null;

  toAppMs(sourceTimestampMs: number, receivedAtMs: number): number {
    if (this.offsetMs === null) this.offsetMs = receivedAtMs - sourceTimestampMs;
    return sourceTimestampMs + this.offsetMs;
  }
}

class BoundedFrameIdSet {
  private readonly maxSize: number;
  private readonly ids = new Set<string>();
  private readonly order: string[] = [];

  constructor(maxSize: number) {
    this.maxSize = Math.max(8, maxSize);
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  add(id: string): void {
    if (this.ids.has(id)) return;
    this.ids.add(id);
    this.order.push(id);
    while (this.order.length > this.maxSize) {
      const removed = this.order.shift();
      if (removed) this.ids.delete(removed);
    }
  }
}

interface ChairLiveUpdate {
  repCredited: boolean;
  repStats: { meanVel: number; peakVel: number; durationMs: number } | null;
  pushOff: boolean;
}

class ChairLiveAdapter {
  private readonly velocity = new RepVelocityTracker({
    cycle: { upEnter: 155, downEnter: 110, emaAlpha: 1 },
    velocityEmaAlpha: 0.3,
    maxReps: CHAIR_MAX_REPS,
  });

  private sideIsLeft = false;
  private sideLocked = false;
  private inAscent = false;
  private ascentFrames = 0;
  private ascentNearThighFrames = 0;

  update(out: PipelineFrameOutput): ChairLiveUpdate {
    if (out.state !== 'tracking' || !out.frame.hasPose || out.bodyUnit === null) {
      return { repCredited: false, repStats: null, pushOff: false };
    }
    const frame = out.frame;
    const bodyUnit = out.bodyUnit;
    if (!this.sideLocked) {
      this.sideIsLeft = out.chainReliability[LEFT_SIDE_CHAIN] >= out.chainReliability[RIGHT_SIDE_CHAIN];
      this.sideLocked = true;
    }
    const hip = this.sideIsLeft ? LM.LEFT_HIP : LM.RIGHT_HIP;
    const knee = this.sideIsLeft ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
    const ankle = this.sideIsLeft ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
    const wrist = this.sideIsLeft ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
    const kneeAngle = angleAtDeg(frame, hip, knee, ankle);
    const hipHeightBu = -frame.ys[hip] / bodyUnit;
    const vOut = this.velocity.update(kneeAngle, hipHeightBu, frame.timestampMs);
    for (const event of vOut.cycle.events) {
      if (event.type === 'ascent-start') {
        this.inAscent = true;
        this.ascentFrames = 0;
        this.ascentNearThighFrames = 0;
      }
    }
    if (this.inAscent) {
      this.ascentFrames++;
      const wristThighBu = pointToSegmentDist(frame, wrist, hip, knee) / bodyUnit;
      if (wristThighBu <= PUSH_OFF_WRIST_THIGH_BU) this.ascentNearThighFrames++;
    }
    let pushOff = false;
    if (vOut.repCredited) {
      pushOff =
        this.ascentFrames > 0 &&
        this.ascentNearThighFrames / this.ascentFrames >= PUSH_OFF_FRAME_FRACTION;
      this.inAscent = false;
    }
    for (const event of vOut.cycle.events) {
      if (event.type === 'ascent-abort') this.inAscent = false;
    }
    if (!vOut.cycle.inTransition && !this.inAscent) this.sideLocked = false;
    const stats = this.velocity.repStats();
    return {
      repCredited: vOut.repCredited,
      repStats: vOut.repCredited ? stats[stats.length - 1] ?? null : null,
      pushOff,
    };
  }

  resetState(): void {
    this.velocity.resetState();
    this.inAscent = false;
    this.sideLocked = false;
  }
}

// Exported for the dual-task runtime (same reason as the constants above).
export function selectedLegRaised(frame: PoseFrame, bodyUnit: number, standingLeg: BodySide): boolean {
  const standing = standingLeg === 'left' ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
  const raised = standingLeg === 'left' ? LM.RIGHT_ANKLE : LM.LEFT_ANKLE;
  return (frame.ys[standing] - frame.ys[raised]) / bodyUnit > BALANCE_LIFT_BU;
}

function standingLegFromAnkleLift(frame: PoseFrame, bodyUnit: number): BodySide | null {
  const leftLowerThanRightBu = (frame.ys[LM.LEFT_ANKLE] - frame.ys[LM.RIGHT_ANKLE]) / bodyUnit;
  if (leftLowerThanRightBu > BALANCE_LIFT_BU) return 'left';
  if (leftLowerThanRightBu < -BALANCE_LIFT_BU) return 'right';
  return null;
}

function isActiveMeasurementStage(stage: MovementProfileV2LiveStage): boolean {
  return stage === 'chair_active' ||
    stage === 'balance_trial' ||
    stage === 'shoulder_active' ||
    stage === 'hinge_active';
}

function isHandsFreeWaitingStage(stage: MovementProfileV2LiveStage): boolean {
  return stage === 'standing_frame_check' ||
    stage === 'chair_setup' ||
    stage === 'chair_practice' ||
    stage === 'balance_setup' ||
    stage === 'balance_ready' ||
    stage === 'shoulder_setup' ||
    stage === 'shoulder_ready' ||
    stage === 'shoulder_retry_ready' ||
    stage === 'hinge_setup';
}

/**
 * Standing, framed, and calibrated: tracking established, the body-unit scale
 * locked (requires ~1.5s of stillness, so it also proves the user held the
 * spot), a reliable side chain, and a near-extended knee (standing, not
 * seated). Passing here guarantees this session calibrated STANDING at the
 * camera spot.
 */
function standingFrameCheckReady(out: PipelineFrameOutput): boolean {
  if (out.state !== 'tracking' || !out.frame.hasPose || out.bodyUnit === null) return false;
  const side = moreReliableSide(out);
  if (!side || side.reliability < SETUP_CHAIN_RELIABILITY) return false;
  const landmarks = side.side === 'left'
    ? { hip: LM.LEFT_HIP, knee: LM.LEFT_KNEE, ankle: LM.LEFT_ANKLE }
    : { hip: LM.RIGHT_HIP, knee: LM.RIGHT_KNEE, ankle: LM.RIGHT_ANKLE };
  return angleAtDeg(out.frame, landmarks.hip, landmarks.knee, landmarks.ankle) >= FRAME_CHECK_STANDING_KNEE_MIN_DEG;
}

function chairSetupReady(out: PipelineFrameOutput): boolean {
  if (out.state !== 'tracking' || !out.frame.hasPose || out.bodyUnit === null) return false;
  const side = moreReliableSide(out);
  if (!side || side.reliability < SETUP_CHAIN_RELIABILITY) return false;
  const landmarks = side.side === 'left'
    ? { hip: LM.LEFT_HIP, knee: LM.LEFT_KNEE, ankle: LM.LEFT_ANKLE }
    : { hip: LM.RIGHT_HIP, knee: LM.RIGHT_KNEE, ankle: LM.RIGHT_ANKLE };
  return angleAtDeg(out.frame, landmarks.hip, landmarks.knee, landmarks.ankle) <= CHAIR_SETUP_SEATED_KNEE_MAX_DEG;
}

function inferBalanceStandingLegFromLift(
  out: PipelineFrameOutput,
  currentStandingLeg: BodySide
): BodySide | null {
  if (out.state !== 'tracking' || !out.frame.hasPose || out.bodyUnit === null) return null;
  const inferred = selectedLegRaised(out.frame, out.bodyUnit, currentStandingLeg)
    ? currentStandingLeg
    : standingLegFromAnkleLift(out.frame, out.bodyUnit);
  if (!inferred || !balanceLiftStartEvidenceReliable(out, inferred)) return null;
  return inferred;
}

function balanceSetupPoseReady(out: PipelineFrameOutput): boolean {
  if (
    out.state !== 'tracking' ||
    !out.frame.hasPose ||
    out.bodyUnit === null ||
    !balanceStartEvidenceReliable(out)
  ) {
    return false;
  }
  const ankleDeltaBu = Math.abs((out.frame.ys[LM.LEFT_ANKLE] - out.frame.ys[LM.RIGHT_ANKLE]) / out.bodyUnit);
  return ankleDeltaBu <= BALANCE_LIFT_BU;
}

function balanceStartEvidenceReliable(out: PipelineFrameOutput): boolean {
  return out.chainReliability[LEFT_SIDE_CHAIN] >= SETUP_CHAIN_RELIABILITY &&
    out.chainReliability[RIGHT_SIDE_CHAIN] >= SETUP_CHAIN_RELIABILITY;
}

function balanceLiftStartEvidenceReliable(out: PipelineFrameOutput, standingLeg: BodySide): boolean {
  const standingChain = standingLeg === 'left' ? LEFT_SIDE_CHAIN : RIGHT_SIDE_CHAIN;
  return out.chainReliability[standingChain] >= SETUP_CHAIN_RELIABILITY;
}

function sourceForCameraInferredSide(priorSide: BodySide | null, selectedSide: BodySide): ProtocolSetupSource {
  return priorSide === selectedSide ? 'prior_record_camera_verified' : 'camera_inferred';
}

function sourceForBalanceSetupPose(priorSide: BodySide | null, selectedSide: BodySide): ProtocolSetupSource {
  return priorSide === selectedSide ? 'prior_record_camera_verified' : 'default';
}

function sourceForBalanceLiftStart(
  priorSide: BodySide | null,
  setupStandingLeg: BodySide,
  liftedStandingLeg: BodySide,
  setupSource: ProtocolSetupSource | null
): ProtocolSetupSource {
  if (setupStandingLeg === liftedStandingLeg && setupSource !== null && setupSource !== 'default') {
    return setupSource;
  }
  return sourceForCameraInferredSide(priorSide, liftedStandingLeg);
}

function inferShoulderSide(out: PipelineFrameOutput, priorShoulderSide: BodySide | null): BodySide | null {
  if (out.state !== 'tracking' || !out.frame.hasPose) return null;
  const leftScore = Math.max(out.chainReliability[LEFT_SIDE_CHAIN], out.chainReliability[LEFT_ARM_CHAIN]);
  const rightScore = Math.max(out.chainReliability[RIGHT_SIDE_CHAIN], out.chainReliability[RIGHT_ARM_CHAIN]);
  if (priorShoulderSide === 'left' && leftScore >= SETUP_CHAIN_RELIABILITY) return 'left';
  if (priorShoulderSide === 'right' && rightScore >= SETUP_CHAIN_RELIABILITY) return 'right';
  if (leftScore < SETUP_CHAIN_RELIABILITY && rightScore < SETUP_CHAIN_RELIABILITY) return null;
  return rightScore >= leftScore ? 'right' : 'left';
}

function shoulderReadyForAutoCapture(out: PipelineFrameOutput, side: BodySide): boolean {
  if (out.state !== 'tracking' || !out.frame.hasPose) return false;
  if (!armChainReliable(out, side) || !torsoIsUpright(out.frame, side)) return false;
  return shoulderReachAngleDegForSide(out.frame, side) >= SHOULDER_CAPTURE_ARM_MIN_DEG;
}

function hingeSetupFolded(out: PipelineFrameOutput): boolean {
  if (out.state !== 'tracking' || !out.frame.hasPose || out.bodyUnit === null) return false;
  const side = moreReliableSide(out);
  if (!side || side.reliability < SETUP_CHAIN_RELIABILITY) return false;
  const shoulder = side.side === 'left' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const hip = side.side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const knee = side.side === 'left' ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
  return angleAtDeg(out.frame, shoulder, hip, knee) <= HINGE_FOLDED_TRUNK_MAX_DEG;
}

function moreReliableSide(out: PipelineFrameOutput): { side: BodySide; reliability: number } | null {
  const left = out.chainReliability[LEFT_SIDE_CHAIN];
  const right = out.chainReliability[RIGHT_SIDE_CHAIN];
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  return left >= right ? { side: 'left', reliability: left } : { side: 'right', reliability: right };
}

function armChainReliable(out: PipelineFrameOutput, side: BodySide): boolean {
  const index = side === 'left' ? LEFT_ARM_CHAIN : RIGHT_ARM_CHAIN;
  return out.chainReliability[index] >= 0.45;
}

function torsoIsUpright(frame: PoseFrame, side: BodySide): boolean {
  const shoulder = side === 'left' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const hip = side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  return frame.ys[shoulder] < frame.ys[hip];
}

function createWelford() {
  let count = 0;
  let mean = 0;
  let m2 = 0;
  return {
    push(value: number) {
      if (!Number.isFinite(value)) return;
      count++;
      const delta = value - mean;
      mean += delta / count;
      m2 += delta * (value - mean);
    },
    sd() {
      return count > 1 ? Math.sqrt(m2 / count) : count === 1 ? 0 : null;
    },
  };
}

interface MutableDiagnostics extends Omit<MovementProfileV2LiveDiagnostics, 'stateTransitions'> {
  stateTransitions: MovementProfileV2LiveTransitionSummary[];
}

function createMutableDiagnostics(): MutableDiagnostics {
  return {
    schemaVersion: 1,
    framesReceived: 0,
    framesAccepted: 0,
    staleFramesDropped: 0,
    duplicateFramesDropped: 0,
    outOfOrderFramesDropped: 0,
    epochMismatchFramesDropped: 0,
    malformedFramesDropped: 0,
    trackingGoodFrames: 0,
    trackingUncertainFrames: 0,
    trackingLostFrames: 0,
    trackingInterruptions: 0,
    recovery: {
      episodeCount: 0,
      duplicateLossEvents: 0,
      lastEpisodeId: null,
      lastItem: null,
    },
    stateTransitions: [],
    chair: {
      practiceReps: 0,
      practiceCompleted: false,
      officialReps: 0,
      trackingInterruptions: 0,
      deadlineDriftMs: null,
    },
    balance: {
      attemptedTrials: 0,
      validTrials: 0,
      invalidTrials: 0,
      retryCount: 0,
      ceilingReached: false,
      restCount: 0,
      hardCapReached: false,
    },
    shoulder: {
      attempts: 0,
      selectedSide: null,
      peakFlexionDeg: null,
      validTrackingMs: 0,
      retryCount: 0,
      painLimited: false,
    },
    hinge: {
      captureValid: false,
      reachBu: null,
    },
    artifactOutcome: 'none',
  };
}

function freezeDiagnostics(input: MutableDiagnostics): MovementProfileV2LiveDiagnostics {
  return {
    ...input,
    stateTransitions: input.stateTransitions.slice(),
    recovery: { ...input.recovery },
    chair: { ...input.chair },
    balance: { ...input.balance },
    shoulder: { ...input.shoulder },
    hinge: { ...input.hinge },
  };
}

function boundedAppend<T>(values: T[], value: T): T[] {
  values.push(value);
  if (values.length > MAX_TRANSITIONS) values.splice(0, values.length - MAX_TRANSITIONS);
  return values;
}

function isVoiceBoundaryAction(action: MovementProfileV2LiveUserAction): boolean {
  return action.type === 'frame_check_voice_completed' ||
    action.type === 'chair_setup_voice_completed' ||
    action.type === 'chair_practice_voice_completed' ||
    action.type === 'chair_official_ready_voice_completed' ||
    action.type === 'chair_countdown_started' ||
    action.type === 'chair_go_playback_started' ||
    action.type === 'balance_setup_voice_completed' ||
    action.type === 'balance_attempt_voice_completed' ||
    action.type === 'shoulder_transition_voice_completed' ||
    action.type === 'shoulder_setup_voice_completed' ||
    action.type === 'hinge_setup_voice_completed';
}
