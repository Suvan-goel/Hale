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
import { DEFAULT_VOICE_ID } from '../profile/voices';
import { movementProfileV2InstructionCueIdsForStage } from '../training/instructionProfiles';
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
    this.desiredVoiceId = options.voiceId || DEFAULT_VOICE_ID;
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
    const nextVoiceId = voiceId || DEFAULT_VOICE_ID;
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
    const plan = voicePlanForSnapshot(snapshot, this.retryEpoch);
    if (!plan) return;
    if (this.stateValue.lastFailure?.scopeId === plan.scopeId) return;
    if (this.completedScopes.has(plan.scopeId)) return;
    if (this.currentScopeId === plan.scopeId) return;
    this.cancelActive('stage_changed');
    void this.runPlan(plan, ++this.currentEpoch);
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
      repeatedAttempt: snapshot.stage === 'balance_ready' || snapshot.stage === 'balance_trial',
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
    if (snapshot.stage === 'balance_rest' && action.type === 'balance_ready' && !snapshot.canContinueAfterRest) {
      return false;
    }
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
    const result = await this.playRequiredSequence(plan.cues, plan, epoch);
    if (!this.isCurrent(epoch, plan.scopeId)) return;
    if (result.outcome !== 'completed') {
      this.fail(plan, result);
      return;
    }
    this.completedScopes.add(plan.scopeId);
    for (const action of plan.onCompleted ?? []) {
      if (!this.isCurrent(epoch, plan.scopeId)) return;
      this.dispatch(action, result.completedAtMs);
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
  return action.type === 'confirm_chair_setup' ||
    action.type === 'confirm_balance_setup' ||
    action.type === 'balance_ready' ||
    action.type === 'balance_use_result' ||
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
    case 'confirm_chair_setup':
      return stage === 'chair_setup';
    case 'confirm_balance_setup':
      return stage === 'balance_setup';
    case 'balance_ready':
      return stage === 'balance_rest';
    case 'balance_use_result':
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
  const recoveryCues = recoveryCuesForEpisode(episode, snapshot);
  if (recoveryCues.length === 0) return base;
  const baseCues = baseCuesAfterRecovery(base.cues, episode);
  return {
    ...base,
    scopeId: `${base.scopeId}:recovery:${episode.id}`,
    cues: [...recoveryCues, ...baseCues],
    priority: priorityForCues([...recoveryCues, ...baseCues]),
    recoveryEpisode: episode,
    onCompleted: [
      { type: 'recovery_voice_completed', recoveryId: episode.id },
      ...(base.onCompleted ?? []),
    ],
  };
}

function baseVoicePlanForSnapshot(
  snapshot: MovementProfileV2LiveSnapshot,
  retryEpoch: number
): StageVoicePlan | null {
  const scopeId = `${scopeBaseForSnapshot(snapshot)}:r${retryEpoch}`;
  switch (snapshot.stage) {
    case 'chair_setup': {
      const intro = initialMovementProfileV2VoiceEvent();
      return plan(scopeId, 'blocking_prerequisite', intro.cues, [
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
    case 'balance_setup':
      return plan(scopeId, 'blocking_transition', cuesForCurrentTransition(snapshot, [
        'times-up-v21',
        'checkup-balance-intro-v21',
        'checkup-balance-single-leg-v21',
      ]), [{ type: 'balance_setup_voice_completed' }]);
    case 'balance_ready':
      return plan(scopeId, 'blocking_prerequisite', cuesForCurrentTransition(snapshot, [
        'mpv2_balance_attempt_start',
      ]), [{ type: 'balance_attempt_voice_completed' }]);
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
      return plan(scopeId, 'blocking_prerequisite', cuesForCurrentTransition(snapshot, [
        'item-complete-v21',
        'checkup-hinge-setup-v21',
        'final-position-set-v21',
      ]), [{ type: 'hinge_setup_voice_completed' }]);
    case 'raw_complete':
      return {
        ...plan(scopeId, 'blocking_transition', cuesForCurrentTransition(snapshot, [
          snapshot.diagnostics.hinge.captureValid ? 'mpv2_hinge_complete' : 'mpv2_hinge_no_measurement',
          'checkup-complete-v21',
        ])),
        marksCompletionReady: true,
      };
    default:
      return null;
  }
}

function baseCuesAfterRecovery(
  baseCues: readonly VoiceCueKey[],
  episode: Mpv2RecoveryEpisode
): readonly VoiceCueKey[] {
  if (episode.item === 'balance' || episode.item === 'shoulder') return [];
  if (episode.item === 'hinge') return ['final-position-set-v21'];
  return baseCues;
}

function recoveryCuesForEpisode(
  episode: Mpv2RecoveryEpisode,
  snapshot: MovementProfileV2LiveSnapshot
): readonly VoiceCueKey[] {
  switch (episode.item) {
    case 'chair':
      return ['tracking-loss-v21', 'checkup-chair-stand-setup-v21', 'tracking-recovered-v21'];
    case 'balance':
      return episode.itemSpecificCue
        ? ['tracking-loss-v21', episode.itemSpecificCue, 'tracking-recovered-v21']
        : ['tracking-loss-v21', 'tracking-recovered-v21'];
    case 'shoulder':
      return [
        'tracking-loss-v21',
        episode.itemSpecificCue ?? 'mpv2_shoulder_tracking_retry',
        shoulderTurnCue(snapshot.flow.shoulderSide),
        'tracking-recovered-v21',
      ];
    case 'hinge':
      return ['tracking-loss-v21', 'checkup-hinge-setup-v21', 'tracking-recovered-v21'];
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
