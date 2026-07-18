import type { VoiceCueKey } from '../audio/cues';
import { voicePriority } from '../audio/cues';
import {
  VoiceChannel,
  type VoiceCancelReason,
  type VoiceCueStartedEvent,
  type VoicePlaybackOutcome,
  type VoicePlaybackResult,
} from '../audio/voicePlayer';
import { BodySide } from '../checkup/protocolSetup';
import { DEFAULT_VOICE_ID, getVoice } from '../profile/voices';
import { movementProfileV2InstructionCueIdsForStage } from '../training/instructionProfiles';
import {
  isPearlProgrammeStrengthBalanceSequence,
  movementProfileV2FlowBatterySequence,
} from './internalCheckupFlow';
import { MPV2_CHAIR_COUNTDOWN_CADENCE_MS } from './liveCoordinator';
import type {
  Mpv2RecoveryEpisode,
  MovementProfileV2LiveSnapshot,
  MovementProfileV2LiveStage,
  MovementProfileV2LiveUserAction,
} from './liveCoordinator';
import {
  initialMovementProfileV2VoiceEvent,
  movementProfileV2CueDefinition,
  resolveMovementProfileV2CueIdsForTransition,
  type MovementProfileV2CueId,
} from './voiceCues';

export type Mpv2VoiceRequirement =
  | 'blocking_prerequisite'
  | 'start_boundary'
  | 'stop_boundary'
  | 'blocking_transition'
  | 'optional_transition'
  | 'optional_reassurance';

export type MovementProfileV2VoiceCoordinatorAction =
  | { type: 'frame_check_voice_completed' }
  | { type: 'chair_setup_voice_completed' }
  | { type: 'chair_practice_voice_completed' }
  | { type: 'chair_official_ready_voice_completed' }
  | { type: 'chair_countdown_started' }
  | { type: 'chair_go_playback_started' }
  | { type: 'balance_setup_voice_completed' }
  | { type: 'balance_attempt_voice_completed' }
  | { type: 'shoulder_transition_voice_completed' }
  | { type: 'shoulder_setup_voice_completed' }
  | { type: 'hinge_setup_voice_completed' }
  | { type: 'recovery_instruction_voice_completed'; recoveryId: string }
  | { type: 'recovery_voice_completed'; recoveryId: string };

export interface MovementProfileV2VoiceFailure {
  scopeId: string;
  outcome: VoicePlaybackOutcome;
  cueKey?: VoiceCueKey;
  message: string;
}

export interface MovementProfileV2VoiceTimingDiagnostic {
  event: string;
  atMs: number;
  requestId?: string;
  scopeId?: string;
  cueKey?: VoiceCueKey;
  voiceId?: string;
  outcome?: VoicePlaybackOutcome;
  startEvidence?: VoiceCueStartedEvent['startEvidence'];
}

export interface MovementProfileV2VoiceRuntimeState {
  blocking: boolean;
  activeScopeId: string | null;
  activeRequirement: Mpv2VoiceRequirement | null;
  lastFailure: MovementProfileV2VoiceFailure | null;
  completionReady: boolean;
  desiredVoiceId: string;
  activeVoiceId: string;
  pendingVoiceId: string | null;
  diagnostics: readonly MovementProfileV2VoiceTimingDiagnostic[];
}

interface MovementProfileV2VoiceRuntimeOptions {
  voice?: VoiceChannel;
  voiceId: string;
  createVoiceChannel?: (voiceId: string) => VoiceChannel;
  nowMs: () => number;
  onStateChange: (state: MovementProfileV2VoiceRuntimeState) => void;
  onCoordinatorAction: (action: MovementProfileV2VoiceCoordinatorAction, atMs: number) => void;
}

interface StageVoicePlan {
  scopeId: string;
  requirement: Mpv2VoiceRequirement;
  cues: readonly VoiceCueKey[];
  priority: number;
  onCompleted?: MovementProfileV2VoiceCoordinatorAction[];
  startsChairCountdown?: boolean;
  marksCompletionReady?: boolean;
  recoveryEpisode?: Mpv2RecoveryEpisode;
  /** Extra scopes marked complete when this plan completes — a recovery
   * resume plan retires its base stage plan so the base cannot replay. */
  alsoCompletesScopeIds?: readonly string[];
}

const DIAGNOSTIC_LIMIT = 120;
const COUNTDOWN_CUES: readonly VoiceCueKey[] = [
  'countdown-three',
  'countdown-two',
  'countdown-one',
  'go',
];

export class MovementProfileV2VoiceRuntime {
  private voice: VoiceChannel;
  private readonly createVoiceChannel: (voiceId: string) => VoiceChannel;
  private desiredVoiceId: string;
  private activeVoiceId: string;
  private pendingVoiceId: string | null = null;
  private readonly nowMs: () => number;
  private readonly onStateChange: (state: MovementProfileV2VoiceRuntimeState) => void;
  private readonly onCoordinatorAction: (
    action: MovementProfileV2VoiceCoordinatorAction,
    atMs: number
  ) => void;

  private stateValue: MovementProfileV2VoiceRuntimeState = {
    blocking: false,
    activeScopeId: null,
    activeRequirement: null,
    lastFailure: null,
    completionReady: false,
    desiredVoiceId: DEFAULT_VOICE_ID,
    activeVoiceId: DEFAULT_VOICE_ID,
    pendingVoiceId: null,
    diagnostics: [],
  };
  private completedScopes = new Set<string>();
  private currentScopeId: string | null = null;
  private currentEpoch = 0;
  private retryEpoch = 0;
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryLossCueEpisodeIds = new Set<string>();

  constructor(options: MovementProfileV2VoiceRuntimeOptions) {
    this.createVoiceChannel = options.createVoiceChannel ?? ((voiceId) => new VoiceChannel(voiceId));
    this.desiredVoiceId = getVoice(options.voiceId || DEFAULT_VOICE_ID).id;
    this.activeVoiceId = this.desiredVoiceId;
    this.voice = options.voice ?? this.createVoiceChannel(this.activeVoiceId);
    this.nowMs = options.nowMs;
    this.onStateChange = options.onStateChange;
    this.onCoordinatorAction = options.onCoordinatorAction;
    this.stateValue = {
      ...this.stateValue,
      desiredVoiceId: this.desiredVoiceId,
      activeVoiceId: this.activeVoiceId,
    };
  }

  get state(): MovementProfileV2VoiceRuntimeState {
    return this.stateValue;
  }

  setDesiredVoiceId(voiceId: string | null | undefined, snapshot: MovementProfileV2LiveSnapshot): void {
    const nextVoiceId = getVoice(voiceId || DEFAULT_VOICE_ID).id;
    this.desiredVoiceId = nextVoiceId;
    if (nextVoiceId === this.activeVoiceId) {
      this.pendingVoiceId = null;
      this.updateState({
        desiredVoiceId: this.desiredVoiceId,
        activeVoiceId: this.activeVoiceId,
        pendingVoiceId: null,
      });
      return;
    }
    if (isActiveMeasurementStage(snapshot.stage)) {
      this.pendingVoiceId = nextVoiceId;
      this.pushDiagnostic({
        event: 'voice_change_deferred_until_safe_boundary',
        atMs: this.nowMs(),
        voiceId: this.activeVoiceId,
      });
      this.updateState({
        desiredVoiceId: this.desiredVoiceId,
        activeVoiceId: this.activeVoiceId,
        pendingVoiceId: this.pendingVoiceId,
      });
      return;
    }
    this.applyVoiceChange(nextVoiceId, snapshot, 'voice_change_applied_immediately');
    this.sync(snapshot);
  }

  sync(snapshot: MovementProfileV2LiveSnapshot): void {
    if (this.pendingVoiceId && !isActiveMeasurementStage(snapshot.stage)) {
      this.applyVoiceChange(this.pendingVoiceId, snapshot, 'voice_change_applied_at_safe_boundary');
    }
    // Any required failure parks the runtime until the user retries — never
    // auto-restart a plan (even a different scope) over the failure UI.
    if (this.stateValue.lastFailure) return;
    const plan = voicePlanForSnapshot(snapshot, this.retryEpoch);
    if (plan && !this.completedScopes.has(plan.scopeId)) {
      // Derived scopes (`<plan>:countdown`, `<plan>:retry:N`) belong to this
      // plan; re-syncing while one runs must not cancel and restart it.
      if (
        this.currentScopeId !== null &&
        (this.currentScopeId === plan.scopeId || this.currentScopeId.startsWith(`${plan.scopeId}:`))
      ) {
        return;
      }
      this.cancelActive('stage_changed');
      void this.runPlan(plan, ++this.currentEpoch);
      return;
    }
    // With the stage's own plan done (or absent), one-shot advisory notices
    // may speak: non-blocking, deduped per scope, never over an active cue.
    const notice = noticePlanForSnapshot(snapshot);
    if (notice && !this.completedScopes.has(notice.scopeId) && this.currentScopeId === null) {
      void this.runPlan(notice, ++this.currentEpoch);
    }
  }

  retry(snapshot: MovementProfileV2LiveSnapshot): void {
    this.cancelActive('retry');
    this.retryEpoch++;
    this.updateState({
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
      lastFailure: null,
    });
    const plan = voicePlanForSnapshot(snapshot, this.retryEpoch);
    if (!plan) return;
    this.completedScopes.delete(plan.scopeId);
    void this.runRetryThenPlan(plan, ++this.currentEpoch);
  }

  replayInstruction(snapshot: MovementProfileV2LiveSnapshot): boolean {
    const cues = movementProfileV2InstructionCueIdsForStage({
      stage: snapshot.stage,
      selectedShoulder: snapshot.flow.shoulderSide,
      priorStandingLeg: snapshot.flow.priorStandingLeg,
      repeatedAttempt: snapshot.stage === 'balance_ready' || snapshot.stage === 'balance_trial',
      // Frame-check Help repeats the FIRST item's intro — the balance intro in
      // the hosted balance-first battery, never the default chair assumption.
      firstBatteryMovement: movementProfileV2FlowBatterySequence(snapshot.flow)[0],
    });
    if (cues.length === 0) return false;
    const accepted = this.voice.speak(cues, priorityForCues(cues));
    this.pushDiagnostic({
      event: accepted ? 'instruction_replay_accepted' : 'instruction_replay_dropped',
      atMs: this.nowMs(),
      scopeId: `help:${scopeBaseForSnapshot(snapshot)}`,
      cueKey: cues[0],
    });
    return accepted;
  }

  cancel(reason: VoiceCancelReason): void {
    this.cancelActive(reason);
    this.updateState({
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
    });
  }

  canDispatchAction(
    action: MovementProfileV2LiveUserAction,
    snapshot: MovementProfileV2LiveSnapshot
  ): boolean {
    if (!isVoiceGatedUserAction(action)) return true;
    if (this.stateValue.lastFailure) return false;
    if (this.stateValue.blocking) return false;
    return actionAllowedForStage(action, snapshot.stage);
  }

  private async runPlan(inputPlan: StageVoicePlan, epoch: number): Promise<void> {
    const plan = this.planWithDedupedRecoveryLossCue(inputPlan);
    this.currentScopeId = plan.scopeId;
    this.updateState({
      blocking: isBlockingRequirement(plan.requirement),
      activeScopeId: plan.scopeId,
      activeRequirement: plan.requirement,
      lastFailure: null,
    });
    this.pushDiagnostic({ event: 'request_created', scopeId: plan.scopeId, atMs: this.nowMs() });
    // A plan with nothing left to say (a timeout-promoted recovery resume with
    // no base cues) completes immediately: its coordinator actions must still
    // dispatch or the episode would never resolve.
    if (plan.cues.length === 0) {
      this.finishSilentPlan(plan, epoch);
      return;
    }
    const optional = !isBlockingRequirement(plan.requirement);
    const result = optional
      ? await this.playOptionalSequence(plan.cues, plan, epoch)
      : await this.playRequiredSequence(plan.cues, plan, epoch);
    if (!this.isCurrent(epoch, plan.scopeId)) return;
    if (result.outcome !== 'completed') {
      if (!optional) {
        this.fail(plan, result);
        return;
      }
      this.pushDiagnostic({
        event: 'optional_request_completion',
        scopeId: plan.scopeId,
        outcome: result.outcome,
        atMs: result.completedAtMs,
        requestId: result.requestId,
      });
    }
    // Countdown plans complete only when 'go' has played (see
    // runChairCountdown): marking the scope done here would make an
    // interrupted countdown unrestartable — sync() would skip the plan and the
    // coordinator would wait for 'go' forever.
    if (!plan.startsChairCountdown) this.completedScopes.add(plan.scopeId);
    if (result.outcome === 'completed') {
      for (const scopeId of plan.alsoCompletesScopeIds ?? []) {
        this.completedScopes.add(scopeId);
      }
      for (const action of plan.onCompleted ?? []) {
        if (!this.isCurrent(epoch, plan.scopeId)) return;
        this.dispatch(action, result.completedAtMs);
      }
    }
    if (plan.startsChairCountdown) {
      await this.runChairCountdown(plan.scopeId, epoch);
      return;
    }
    this.updateState({
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
      completionReady: plan.marksCompletionReady ? true : this.stateValue.completionReady,
    });
    this.currentScopeId = null;
    this.pushDiagnostic({
      event: 'request_completion',
      scopeId: plan.scopeId,
      outcome: result.outcome,
      atMs: result.completedAtMs,
      requestId: result.requestId,
    });
  }

  private finishSilentPlan(plan: StageVoicePlan, epoch: number): void {
    const atMs = this.nowMs();
    this.completedScopes.add(plan.scopeId);
    for (const scopeId of plan.alsoCompletesScopeIds ?? []) {
      this.completedScopes.add(scopeId);
    }
    for (const action of plan.onCompleted ?? []) {
      if (!this.isCurrent(epoch, plan.scopeId)) return;
      this.dispatch(action, atMs);
    }
    this.updateState({
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
      completionReady: plan.marksCompletionReady ? true : this.stateValue.completionReady,
    });
    this.currentScopeId = null;
    this.pushDiagnostic({
      event: 'request_completion',
      scopeId: plan.scopeId,
      outcome: 'completed',
      atMs,
    });
  }

  private async runRetryThenPlan(plan: StageVoicePlan, epoch: number): Promise<void> {
    const retryScopeId = `${plan.scopeId}:retry:${this.retryEpoch}`;
    this.currentScopeId = retryScopeId;
    this.updateState({
      blocking: false,
      activeScopeId: retryScopeId,
      activeRequirement: 'optional_transition',
      lastFailure: null,
    });
    const retryResult = await this.playOptionalSequence(['retry-v21'], {
      scopeId: retryScopeId,
      requirement: 'optional_transition',
      cues: ['retry-v21'],
      priority: voicePriority('retry-v21'),
    }, epoch);
    if (!this.isCurrent(epoch, retryScopeId)) return;
    this.pushDiagnostic({
      event: 'retry_optional_completion',
      atMs: retryResult.completedAtMs,
      requestId: retryResult.requestId,
      scopeId: retryScopeId,
      cueKey: 'retry-v21',
      outcome: retryResult.outcome,
    });
    void this.runPlan(plan, epoch);
  }

  private playRequiredSequence(
    cues: readonly VoiceCueKey[],
    plan: StageVoicePlan,
    epoch: number
  ): Promise<VoicePlaybackResult> {
    const request = this.voice.speakTracked(cues, {
      priority: plan.priority,
      required: true,
      scopeId: plan.scopeId,
      onCueStarted: (event) => {
        if (!this.isCurrent(epoch, plan.scopeId)) return;
        this.pushDiagnostic({
          event: 'cue_playback_start_evidence',
          atMs: event.startedAtMs,
          requestId: event.requestId,
          scopeId: event.scopeId,
          cueKey: event.cueKey,
          voiceId: this.activeVoiceId,
          startEvidence: event.startEvidence,
        });
        if (event.cueKey === 'tracking-loss-v21' && plan.recoveryEpisode) {
          this.recoveryLossCueEpisodeIds.add(plan.recoveryEpisode.id);
        }
      },
    });
    this.pushDiagnostic({
      event: request.accepted ? 'request_accepted' : 'request_rejected',
      requestId: request.requestId,
      scopeId: plan.scopeId,
      atMs: this.nowMs(),
    });
    return request.completion;
  }

  private planWithDedupedRecoveryLossCue(plan: StageVoicePlan): StageVoicePlan {
    const episodeId = plan.recoveryEpisode?.id;
    if (!episodeId || !this.recoveryLossCueEpisodeIds.has(episodeId)) return plan;
    const lossIndex = plan.cues.indexOf('tracking-loss-v21');
    if (lossIndex < 0) return plan;
    return {
      ...plan,
      cues: plan.cues.filter((_, index) => index !== lossIndex),
    };
  }

  private playOptionalSequence(
    cues: readonly VoiceCueKey[],
    plan: Pick<StageVoicePlan, 'scopeId' | 'requirement' | 'priority'> & { cues: readonly VoiceCueKey[] },
    epoch: number
  ): Promise<VoicePlaybackResult> {
    const request = this.voice.speakTracked(cues, {
      priority: plan.priority,
      required: false,
      scopeId: plan.scopeId,
      onCueStarted: (event) => {
        if (!this.isCurrent(epoch, plan.scopeId)) return;
        this.pushDiagnostic({
          event: 'optional_cue_playback_start_evidence',
          atMs: event.startedAtMs,
          requestId: event.requestId,
          scopeId: event.scopeId,
          cueKey: event.cueKey,
          voiceId: this.activeVoiceId,
          startEvidence: event.startEvidence,
        });
      },
    });
    this.pushDiagnostic({
      event: request.accepted ? 'optional_request_accepted' : 'optional_request_rejected',
      requestId: request.requestId,
      scopeId: plan.scopeId,
      atMs: this.nowMs(),
    });
    return request.completion;
  }

  private async runChairCountdown(parentScopeId: string, epoch: number): Promise<void> {
    const countdownScopeId = `${parentScopeId}:countdown`;
    this.currentScopeId = countdownScopeId;
    this.updateState({
      blocking: true,
      activeScopeId: countdownScopeId,
      activeRequirement: 'start_boundary',
      lastFailure: null,
    });
    let previousStartAtMs: number | null = null;
    for (const cue of COUNTDOWN_CUES) {
      if (!this.isCurrent(epoch, countdownScopeId)) return;
      if (previousStartAtMs !== null) {
        await this.sleepUntil(previousStartAtMs + MPV2_CHAIR_COUNTDOWN_CADENCE_MS);
        if (!this.isCurrent(epoch, countdownScopeId)) return;
      }
      const result = await this.playCountdownCue(cue, countdownScopeId, epoch, (event) => {
        previousStartAtMs = event.startedAtMs;
        this.pushDiagnostic({
          event: cue === 'go' ? 'go_playback-start_event' : 'countdown_step_start',
          atMs: event.startedAtMs,
          requestId: event.requestId,
          scopeId: event.scopeId,
          cueKey: event.cueKey,
          voiceId: this.activeVoiceId,
          startEvidence: event.startEvidence,
        });
        if (cue === 'countdown-three') {
          this.dispatch({ type: 'chair_countdown_started' }, event.startedAtMs);
        }
        if (cue === 'go') {
          this.dispatch({ type: 'chair_go_playback_started' }, event.startedAtMs);
          this.updateState({
            blocking: false,
            activeScopeId: null,
            activeRequirement: null,
          });
          this.pushDiagnostic({
            event: 'measurement_start',
            atMs: event.startedAtMs,
            requestId: event.requestId,
            scopeId: event.scopeId,
            cueKey: event.cueKey,
          voiceId: this.activeVoiceId,
            startEvidence: event.startEvidence,
          });
        }
      });
      if (!this.isCurrent(epoch, countdownScopeId)) return;
      if (result.outcome !== 'completed') {
        this.fail({
          scopeId: countdownScopeId,
          requirement: 'start_boundary',
          cues: [cue],
        }, result);
        return;
      }
      if (cue === 'go') {
        this.completedScopes.add(countdownScopeId);
        this.completedScopes.add(parentScopeId);
        this.currentScopeId = null;
        return;
      }
      previousStartAtMs = result.firstCueStartedAtMs ?? previousStartAtMs ?? result.completedAtMs;
    }
  }

  private playCountdownCue(
    cue: VoiceCueKey,
    scopeId: string,
    epoch: number,
    onStarted: (event: VoiceCueStartedEvent) => void
  ): Promise<VoicePlaybackResult> {
    const request = this.voice.speakTracked([cue], {
      priority: voicePriority(cue),
      required: true,
      scopeId,
      onCueStarted: (event) => {
        if (!this.isCurrent(epoch, scopeId)) return;
        onStarted(event);
      },
    });
    this.pushDiagnostic({
      event: request.accepted ? 'request_accepted' : 'request_rejected',
      requestId: request.requestId,
      scopeId,
      cueKey: cue,
      atMs: this.nowMs(),
    });
    return request.completion;
  }

  private sleepUntil(targetMs: number): Promise<void> {
    const delayMs = Math.max(0, targetMs - this.nowMs());
    return new Promise((resolve) => {
      this.sleepTimer = setTimeout(() => {
        this.sleepTimer = null;
        resolve();
      }, delayMs);
    });
  }

  private applyVoiceChange(
    voiceId: string,
    snapshot: MovementProfileV2LiveSnapshot,
    event: 'voice_change_applied_immediately' | 'voice_change_applied_at_safe_boundary'
  ): void {
    this.cancelActive('voice_changed');
    this.voice.stop('voice_changed');
    this.activeVoiceId = voiceId;
    this.pendingVoiceId = null;
    this.voice = this.createVoiceChannel(voiceId);
    this.completedScopes.clear();
    this.pushDiagnostic({
      event,
      atMs: this.nowMs(),
      scopeId: scopeBaseForSnapshot(snapshot),
      voiceId,
    });
    this.updateState({
      desiredVoiceId: this.desiredVoiceId,
      activeVoiceId: this.activeVoiceId,
      pendingVoiceId: null,
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
      lastFailure: null,
    });
  }

  private fail(plan: Pick<StageVoicePlan, 'scopeId' | 'requirement' | 'cues'>, result: VoicePlaybackResult): void {
    const cueKey = result.failedCueKey ?? result.startedCueKeys.at(-1) ?? plan.cues[0];
    this.pushDiagnostic({
      event: 'required_failure',
      atMs: result.completedAtMs,
      requestId: result.requestId,
      scopeId: plan.scopeId,
      cueKey,
      voiceId: this.activeVoiceId,
      outcome: result.outcome,
    });
    this.updateState({
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
      lastFailure: {
        scopeId: plan.scopeId,
        outcome: result.outcome,
        cueKey,
        message: 'Audio guidance could not start. Try again before continuing the check-up.',
      },
    });
    this.currentScopeId = null;
  }

  private cancelActive(reason: VoiceCancelReason): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
    if (this.currentScopeId) {
      this.voice.cancelScope(this.currentScopeId, reason);
      this.pushDiagnostic({
        event: 'cancellation',
        atMs: this.nowMs(),
        scopeId: this.currentScopeId,
      });
    } else {
      this.voice.cancelActive(reason);
    }
    this.currentEpoch++;
    this.currentScopeId = null;
  }

  private isCurrent(epoch: number, scopeId: string): boolean {
    return this.currentEpoch === epoch && this.currentScopeId === scopeId;
  }

  private dispatch(action: MovementProfileV2VoiceCoordinatorAction, atMs: number): void {
    this.pushDiagnostic({
      event: action.type === 'chair_go_playback_started' ? 'go_dispatch' : 'coordinator_action',
      atMs,
      scopeId: this.currentScopeId ?? undefined,
    });
    this.onCoordinatorAction(action, atMs);
  }

  private updateState(patch: Partial<MovementProfileV2VoiceRuntimeState>): void {
    this.stateValue = {
      ...this.stateValue,
      ...patch,
      diagnostics: this.stateValue.diagnostics,
    };
    this.onStateChange(this.stateValue);
  }

  private pushDiagnostic(event: MovementProfileV2VoiceTimingDiagnostic): void {
    const diagnostics = [
      ...this.stateValue.diagnostics,
      {
        voiceId: this.activeVoiceId,
        ...event,
      },
    ].slice(-DIAGNOSTIC_LIMIT);
    this.stateValue = {
      ...this.stateValue,
      diagnostics,
    };
    this.onStateChange(this.stateValue);
  }
}

export function isVoiceGatedUserAction(action: MovementProfileV2LiveUserAction): boolean {
  return action.type === 'skip_frame_check' ||
    action.type === 'confirm_chair_setup' ||
    action.type === 'complete_chair_practice_fallback' ||
    action.type === 'confirm_balance_setup' ||
    action.type === 'balance_use_result' ||
    action.type === 'balance_skip' ||
    action.type === 'confirm_shoulder_setup' ||
    action.type === 'start_shoulder_capture' ||
    action.type === 'start_hinge_capture';
}

function isBlockingRequirement(requirement: Mpv2VoiceRequirement): boolean {
  return requirement === 'blocking_prerequisite' ||
    requirement === 'start_boundary' ||
    requirement === 'blocking_transition' ||
    requirement === 'stop_boundary';
}

function actionAllowedForStage(
  action: MovementProfileV2LiveUserAction,
  stage: MovementProfileV2LiveStage
): boolean {
  switch (action.type) {
    case 'skip_frame_check':
      return stage === 'standing_frame_check';
    case 'confirm_chair_setup':
      return stage === 'chair_setup';
    case 'complete_chair_practice_fallback':
      return stage === 'chair_practice';
    case 'confirm_balance_setup':
      return stage === 'balance_setup';
    case 'balance_use_result':
    case 'balance_skip':
      return stage === 'balance_ready' || stage === 'balance_rest';
    case 'confirm_shoulder_setup':
      return stage === 'shoulder_setup';
    case 'start_shoulder_capture':
      return stage === 'shoulder_ready' || stage === 'shoulder_retry_ready';
    case 'start_hinge_capture':
      return stage === 'hinge_setup';
    default:
      return true;
  }
}

function isActiveMeasurementStage(stage: MovementProfileV2LiveStage): boolean {
  return stage === 'chair_active' ||
    stage === 'balance_trial' ||
    stage === 'shoulder_active' ||
    stage === 'hinge_active';
}

function voicePlanForSnapshot(
  snapshot: MovementProfileV2LiveSnapshot,
  retryEpoch: number
): StageVoicePlan | null {
  const base = baseVoicePlanForSnapshot(snapshot, retryEpoch);
  const episode = snapshot.recoveryEpisode;
  if (!base || !episode || episode.phase === 'voice_completed' || episode.targetStage !== snapshot.stage) {
    return base;
  }
  // Recovery speaks in two parts. Part 1 (loss + re-instruction) plays
  // immediately; the coordinator then waits for actual re-detection before
  // promoting the episode to stable_ready, so "Good, I can see you again" is
  // only ever spoken when it is true. A timeout promotion resumes WITHOUT the
  // recovered claim (episode.stablePromotion === 'timeout').
  if (episode.phase !== 'stable_ready') {
    const lossCues = recoveryLossCuesForEpisode(episode, snapshot);
    return {
      scopeId: `${base.scopeId}:recovery:${episode.id}:loss`,
      requirement: base.requirement,
      cues: lossCues,
      priority: priorityForCues(lossCues),
      recoveryEpisode: episode,
      onCompleted: [{ type: 'recovery_instruction_voice_completed', recoveryId: episode.id }],
    };
  }
  const resumeCues: readonly VoiceCueKey[] = [
    ...(episode.stablePromotion === 'tracking_confirmed'
      ? (['tracking-recovered-v21'] as const)
      : []),
    ...baseCuesAfterRecovery(base.cues, episode),
  ];
  return {
    ...base,
    scopeId: `${base.scopeId}:recovery:${episode.id}:resume`,
    cues: resumeCues,
    priority: priorityForCues(resumeCues),
    recoveryEpisode: episode,
    onCompleted: [
      { type: 'recovery_voice_completed', recoveryId: episode.id },
      ...(base.onCompleted ?? []),
    ],
    // Retire the base plan: after the resume completes the episode reaches
    // voice_completed and plan selection falls back to the base scope, which
    // must not replay its cues over the stage. Countdown plans are exempt —
    // their base stays replayable so an interrupted countdown can restart.
    ...(base.startsChairCountdown ? {} : { alsoCompletesScopeIds: [base.scopeId] }),
  };
}

function baseVoicePlanForSnapshot(
  snapshot: MovementProfileV2LiveSnapshot,
  retryEpoch: number
): StageVoicePlan | null {
  const scopeId = `${scopeBaseForSnapshot(snapshot)}:r${retryEpoch}`;
  switch (snapshot.stage) {
    case 'standing_frame_check': {
      // The hosted two-movement check-up arrives here after Clara has already
      // welcomed her and paced the warm-up, so the standalone battery's
      // "Welcome to your Movement Check-Up" would be a second, late welcome.
      // Swap in the hosted bridge (plain cue — the mpv2 cue-policy fingerprint
      // and its approved takes stay untouched); it keeps the safety sentence.
      const introCue: VoiceCueKey = isPearlProgrammeStrengthBalanceSequence(
        movementProfileV2FlowBatterySequence(snapshot.flow)
      )
        ? 'checkup-two-movements-intro'
        : 'mpv2_checkup_intro';
      return plan(scopeId, 'blocking_prerequisite', [introCue, 'step-into-frame'], [
        { type: 'frame_check_voice_completed' },
      ]);
    }
    case 'chair_setup': {
      // After the standing frame check, the check-up intro has already
      // played: confirm the framing and go straight to the chair item.
      if (snapshot.lastTransition?.to === 'chair_setup' && snapshot.lastTransition.from === 'standing_frame_check') {
        const framedCues: VoiceCueKey[] =
          snapshot.lastTransition.reason === 'frame_check_passed'
            ? ['framing-ready', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21']
            : ['checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21'];
        return plan(scopeId, 'blocking_prerequisite', framedCues, [
          { type: 'chair_setup_voice_completed' },
        ]);
      }
      // Mid-battery handoffs (non-default sequences) resolve to the generic
      // bridge + chair intro; only a cold start replays the full welcome.
      const intro = initialMovementProfileV2VoiceEvent();
      return plan(scopeId, 'blocking_prerequisite', cuesForChairSetup(snapshot, intro.cues), [
        { type: 'chair_setup_voice_completed' },
      ]);
    }
    case 'chair_practice':
      return plan(scopeId, 'blocking_prerequisite', ['mpv2_chair_practice_start'], [
        { type: 'chair_practice_voice_completed' },
      ]);
    case 'chair_countdown':
      return {
        ...plan(scopeId, 'blocking_prerequisite', ['mpv2_chair_official_ready'], [
          { type: 'chair_official_ready_voice_completed' },
        ]),
        startsChairCountdown: true,
      };
    case 'balance_setup': {
      // Balance-first sequences (Check-up #0) enter from the frame check:
      // confirm the framing, then the balance intro — never "Time." (that
      // line belongs to the chair timer and is resolved per-transition).
      if (snapshot.lastTransition?.to === 'balance_setup' && snapshot.lastTransition.from === 'standing_frame_check') {
        const framedCues: VoiceCueKey[] =
          snapshot.lastTransition.reason === 'frame_check_passed'
            ? ['framing-ready', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21']
            : ['checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'];
        return plan(scopeId, 'blocking_transition', cuesForBalanceSetup(snapshot, framedCues), [
          { type: 'balance_setup_voice_completed' },
        ]);
      }
      return plan(scopeId, 'blocking_transition', cuesForBalanceSetup(snapshot, cuesForCurrentTransition(snapshot, [
        'checkup-balance-intro-v21',
        'checkup-balance-single-leg-v21',
      ])), [{ type: 'balance_setup_voice_completed' }]);
    }
    case 'balance_ready':
      return plan(scopeId, 'blocking_prerequisite', cuesForBalanceReady(snapshot), [
        { type: 'balance_attempt_voice_completed' },
      ]);
    case 'balance_rest':
      return plan(scopeId, 'blocking_transition', cuesForCurrentTransition(snapshot, [
        'mpv2_balance_attempt_saved',
        'mpv2_balance_rest',
      ]));
    case 'shoulder_setup':
      return plan(scopeId, 'blocking_transition', cuesForCurrentTransition(snapshot, [
        'mpv2_balance_complete',
      ]), [{ type: 'shoulder_transition_voice_completed' }]);
    case 'shoulder_ready':
      return plan(scopeId, 'blocking_prerequisite', cuesForCurrentTransition(snapshot, [
        shoulderTurnCue(snapshot.flow.shoulderSide),
        shoulderRaiseCue(snapshot.flow.shoulderSide),
        'final-position-set-v21',
      ]), [{ type: 'shoulder_setup_voice_completed' }]);
    case 'shoulder_retry_ready':
      return plan(scopeId, 'blocking_prerequisite', cuesForCurrentTransition(snapshot, [
        'mpv2_shoulder_tracking_retry',
      ]), [{ type: 'shoulder_setup_voice_completed' }]);
    case 'hinge_setup':
      return plan(scopeId, 'blocking_prerequisite', cuesForHingeSetup(snapshot), [
        { type: 'hinge_setup_voice_completed' },
      ]);
    case 'hinge_active':
      return plan(scopeId, 'optional_reassurance', ['final-position-set-v21']);
    case 'raw_complete':
      return {
        ...plan(scopeId, 'blocking_transition', cuesForRawComplete(snapshot)),
        marksCompletionReady: true,
      };
    default:
      return null;
  }
}

/**
 * One-shot advisory cues outside the stage plans. High-confidence findings
 * only (silence-by-default law): a sustained wrong-leg lift being ignored, a
 * frame check that has failed long enough to suggest the room is too dim, or
 * a practice stand that detection has not credited long after the instruction
 * (the confirm control is on a phone propped out of reach, so its existence
 * must be spoken — the same law as the balance finish-now line).
 * Deduped by scope; the balance notice re-arms per attempt epoch.
 */
function noticePlanForSnapshot(snapshot: MovementProfileV2LiveSnapshot): StageVoicePlan | null {
  if (snapshot.stage === 'balance_ready' && snapshot.balanceWrongLegNoticed) {
    const scope = `mpv2:notice:balance-wrong-leg:${snapshot.attemptEpochId ?? snapshot.movementEpochId}`;
    return plan(scope, 'optional_reassurance', ['balance-same-leg']);
  }
  if (snapshot.stage === 'standing_frame_check' && snapshot.frameCheckLightingHintAvailable) {
    const scope = `mpv2:notice:frame-check-light:${snapshot.movementEpochId}`;
    return plan(scope, 'optional_reassurance', ['turn-on-light']);
  }
  if (snapshot.stage === 'chair_practice' && snapshot.handsFreeFallbackAvailable) {
    // Same signal that surfaces the "I did the practice stand" fallback
    // button, so the spoken hint never names a control that is not on screen.
    const scope = `mpv2:notice:chair-practice-fallback:${snapshot.attemptEpochId ?? snapshot.movementEpochId}`;
    return plan(scope, 'optional_reassurance', ['checkup-chair-practice-fallback']);
  }
  return null;
}

function baseCuesAfterRecovery(
  baseCues: readonly VoiceCueKey[],
  episode: Mpv2RecoveryEpisode
): readonly VoiceCueKey[] {
  if (episode.item === 'balance' || episode.item === 'shoulder') return [];
  if (episode.item === 'hinge') return ['hinge-setup'];
  return baseCues;
}

/**
 * Part-1 recovery cues: announce the loss and re-instruct. The balance and
 * shoulder item-specific retry lines already open with their own loss
 * announcement ("I lost sight of you…"), so the generic loss line is dropped
 * there — one loss acknowledgement, never a stutter. The recovered claim is
 * NOT here: it belongs to the stable_ready resume plan, gated on evidence.
 */
function recoveryLossCuesForEpisode(
  episode: Mpv2RecoveryEpisode,
  snapshot: MovementProfileV2LiveSnapshot
): readonly VoiceCueKey[] {
  switch (episode.item) {
    case 'chair':
      return ['tracking-loss-v21', 'checkup-chair-stand-setup-v21'];
    case 'balance':
      return [episode.itemSpecificCue ?? 'tracking-loss-v21'];
    case 'shoulder':
      return [
        episode.itemSpecificCue ?? 'mpv2_shoulder_tracking_retry',
        shoulderTurnCue(snapshot.flow.shoulderSide),
      ];
    case 'hinge':
      return ['tracking-loss-v21', 'checkup-hinge-setup-v21'];
  }
}

function plan(
  scopeId: string,
  requirement: Mpv2VoiceRequirement,
  cues: readonly VoiceCueKey[],
  onCompleted: MovementProfileV2VoiceCoordinatorAction[] = []
): StageVoicePlan {
  return {
    scopeId,
    requirement,
    cues,
    priority: priorityForCues(cues),
    onCompleted,
  };
}

function priorityForCues(cues: readonly VoiceCueKey[]): number {
  return Math.max(...cues.map((cue) => {
    if (isMovementProfileV2Cue(cue)) return movementProfileV2CueDefinition(cue).priority;
    return voicePriority(cue);
  }), 0);
}

/**
 * The v21 chair intro opens "We'll start with the chair stand", which is only
 * true when the chair opens the battery (cold start or frame-check entry). On
 * a mid-battery handoff — Check-up #0 runs balance first — swap in the bundled
 * 'chair-stand-intro' line ("Next, the thirty second chair stand…") so the
 * spoken ordering matches the battery the user is actually doing.
 */
function cuesForChairSetup(
  snapshot: MovementProfileV2LiveSnapshot,
  fallback: readonly MovementProfileV2CueId[]
): readonly VoiceCueKey[] {
  const cues = cuesForCurrentTransition(snapshot, fallback);
  const transition = snapshot.lastTransition;
  const midBatteryHandoff =
    transition?.to === 'chair_setup' &&
    transition.from !== 'standing_frame_check' &&
    !transition.from.startsWith('chair_');
  if (!midBatteryHandoff) return cues;
  return cues.map((cue) => (cue === 'checkup-chair-stand-intro-v21' ? 'chair-stand-intro' : cue));
}

/**
 * At a retest the standing leg is anchored to the prior official record
 * (side-consistency is measurement hygiene), so the spoken setup names the
 * side — "the same side as your last check-up" — instead of inviting a fresh
 * choice that would quietly cost her a comparable reading. Baseline keeps the
 * free-choice line. The line still allows the other leg if today it feels
 * unsafe; the comparability layer records any switch honestly.
 */
function cuesForBalanceSetup(
  snapshot: MovementProfileV2LiveSnapshot,
  cues: readonly VoiceCueKey[]
): readonly VoiceCueKey[] {
  const retestCue = retestBalanceSingleLegCue(snapshot.flow.priorStandingLeg);
  if (!retestCue) return cues;
  return cues.map((cue) => (cue === 'checkup-balance-single-leg-v21' ? retestCue : cue));
}

export function retestBalanceSingleLegCue(
  priorStandingLeg: BodySide | null
): VoiceCueKey | null {
  if (priorStandingLeg === 'left') return 'checkup-balance-single-leg-retest-left';
  if (priorStandingLeg === 'right') return 'checkup-balance-single-leg-retest-right';
  return null;
}

/**
 * Once a valid hold is banked, the ready-after-rest line must SPEAK the
 * finish-now option: the only end-early control is the "Save best result"
 * fallback button on a phone propped out of reach, so without the spoken
 * invitation she stands waiting for a cap she can't see. The retry path after
 * an invalid attempt keeps the plain line — with nothing banked, its fallback
 * button is Skip, and speaking "Save best result" would name a control that
 * is not there. Same swap pattern as the retest setup lines above, so the
 * fingerprinted mpv2 cue set (and its approved takes) stays untouched.
 */
function cuesForBalanceReady(snapshot: MovementProfileV2LiveSnapshot): readonly VoiceCueKey[] {
  const cues = cuesForCurrentTransition(snapshot, ['mpv2_balance_attempt_start']);
  if (typeof snapshot.balanceBestHoldSec !== 'number') return cues;
  return cues.map((cue): VoiceCueKey =>
    cue === 'mpv2_balance_ready_after_30' ? 'checkup-balance-ready-can-finish' : cue
  );
}

function cuesForHingeSetup(snapshot: MovementProfileV2LiveSnapshot): readonly VoiceCueKey[] {
  const cues = cuesForCurrentTransition(snapshot, [
    'item-complete-v21',
    'checkup-hinge-setup-v21',
  ]);
  const transition = snapshot.lastTransition;
  if (!transition || transition.to !== 'hinge_setup' || !transition.from.startsWith('shoulder_')) {
    return appendVoiceCue(cues.filter((cue) => cue !== 'final-position-set-v21'), 'hinge-setup');
  }
  return appendVoiceCue([
    'relax-arm',
    ...cues.filter((cue) => cue !== 'item-complete-v21' && cue !== 'final-position-set-v21'),
  ], 'hinge-setup');
}

function appendVoiceCue(cues: readonly VoiceCueKey[], cue: VoiceCueKey): readonly VoiceCueKey[] {
  return cues.includes(cue) ? cues : [...cues, cue];
}

function cuesForRawComplete(snapshot: MovementProfileV2LiveSnapshot): readonly VoiceCueKey[] {
  // The stale-transition fallback must not claim a hinge measurement in
  // sequences that never ran the hinge (Check-up #0 ends on the chair timer).
  const sequenceHasHinge = movementProfileV2FlowBatterySequence(snapshot.flow).includes('hinge');
  const fallback: readonly MovementProfileV2CueId[] = sequenceHasHinge
    ? [
        snapshot.diagnostics.hinge.captureValid ? 'mpv2_hinge_complete' : 'mpv2_hinge_no_measurement',
        'checkup-complete-v21',
      ]
    : ['item-complete-v21', 'checkup-complete-v21'];
  const cues = cuesForCurrentTransition(snapshot, fallback);
  if (!sequenceHasHinge) {
    // Pearl's programme-checkpoint host offers optional Everyday Clarity after
    // the movement battery, so the full-battery "results are ready" line would
    // be premature here. Close the two-movement battery with its own bridge:
    // effort acknowledged, pick the phone up, one optional check-in ahead.
    return cues.map((cue): VoiceCueKey =>
      cue === 'checkup-complete-v21' ? 'checkup-strength-balance-complete' : cue
    );
  }
  if (!sequenceHasHinge || !snapshot.diagnostics.hinge.captureValid) return cues;
  return ['stand-tall', ...cues.filter((cue) => cue !== 'mpv2_hinge_complete')];
}

function cuesForCurrentTransition(
  snapshot: MovementProfileV2LiveSnapshot,
  fallback: readonly MovementProfileV2CueId[]
): readonly MovementProfileV2CueId[] {
  if (!snapshot.lastTransition || snapshot.lastTransition.to !== snapshot.stage) return fallback;
  const cues = resolveMovementProfileV2CueIdsForTransition({
    transition: snapshot.lastTransition,
    snapshot,
  });
  return cues.length > 0 ? cues : fallback;
}

function scopeBaseForSnapshot(snapshot: MovementProfileV2LiveSnapshot): string {
  const attempt = snapshot.attemptEpochId ?? snapshot.movementEpochId;
  if (snapshot.stage === 'shoulder_ready' || snapshot.stage === 'shoulder_setup') {
    return `mpv2:${snapshot.stage}:${snapshot.flow.shoulderSide}:${attempt}`;
  }
  return `mpv2:${snapshot.stage}:${attempt}`;
}

function shoulderTurnCue(side: BodySide): MovementProfileV2CueId {
  return side === 'left' ? 'checkup-shoulder-turn-left-v21' : 'checkup-shoulder-turn-right-v21';
}

function shoulderRaiseCue(side: BodySide): MovementProfileV2CueId {
  return side === 'left' ? 'checkup-shoulder-raise-left-v21' : 'checkup-shoulder-raise-right-v21';
}

function isMovementProfileV2Cue(cue: VoiceCueKey): cue is MovementProfileV2CueId {
  return cue.startsWith('mpv2_') || cue.endsWith('-v21');
}
