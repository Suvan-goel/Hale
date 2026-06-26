import type { BodySide } from '../../checkup';
import type { MicroCheckType } from '../microCheck';
import { MICRO_CHECK_COUNTDOWN_CUE_KEYS_V21, planMicroCheckVoiceSequenceV21 } from './sequencePlanner';
import type {
  MicroCheckRecoveryEpisodeV21,
  MicroCheckVoiceExposureV21,
  MicroCheckVoiceLogicalCueKeyV21,
  MicroCheckVoicePhaseV21,
  MicroCheckVoiceRuntimeEventV21,
  MicroCheckVoiceSequencePlanV21,
} from './types';

export type MicroCheckVoiceCancelReasonV21 =
  | 'explicit_stop'
  | 'stage_changed'
  | 'screen_unmounted'
  | 'app_backgrounded'
  | 'superseded'
  | 'retry'
  | 'discard';

export type MicroCheckVoicePlaybackOutcomeV21 =
  | 'completed'
  | 'dropped_busy'
  | 'interrupted'
  | 'cancelled'
  | 'asset_missing'
  | 'playback_start_failed'
  | 'completion_timeout';

export interface MicroCheckVoiceCueStartedEventV21 {
  readonly requestId: string;
  readonly scopeId: string;
  readonly cueKey: MicroCheckVoiceLogicalCueKeyV21;
  readonly cueIndex: number;
  readonly startedAtMs: number;
  readonly startEvidence: 'native_playing_status' | 'play_call_resolved' | 'fallback_proxy';
}

export interface MicroCheckVoicePlaybackResultV21 {
  readonly requestId: string;
  readonly scopeId: string;
  readonly outcome: MicroCheckVoicePlaybackOutcomeV21;
  readonly accepted: boolean;
  readonly required: boolean;
  readonly startedCueKeys: readonly MicroCheckVoiceLogicalCueKeyV21[];
  readonly completedCueKeys: readonly MicroCheckVoiceLogicalCueKeyV21[];
  readonly failedCueKey?: MicroCheckVoiceLogicalCueKeyV21;
  readonly cancelReason?: MicroCheckVoiceCancelReasonV21;
  readonly requestedAtMs: number;
  readonly firstCueStartedAtMs?: number;
  readonly completedAtMs: number;
}

export interface MicroCheckTrackedVoiceRequestOptionsV21 {
  readonly priority: number;
  readonly scopeId: string;
  readonly required: boolean;
  readonly onCueStarted?: (event: MicroCheckVoiceCueStartedEventV21) => void;
}

export interface MicroCheckTrackedVoiceRequestV21 {
  readonly requestId: string;
  readonly accepted: boolean;
  readonly completion: Promise<MicroCheckVoicePlaybackResultV21>;
}

export interface MicroCheckVoiceChannelV21 {
  speakTracked(
    cues: readonly MicroCheckVoiceLogicalCueKeyV21[],
    options: MicroCheckTrackedVoiceRequestOptionsV21
  ): MicroCheckTrackedVoiceRequestV21;
  cancelScope(scopeId: string, reason?: MicroCheckVoiceCancelReasonV21): void;
  cancelActive(reason?: MicroCheckVoiceCancelReasonV21): void;
}

export interface MicroCheckVoiceRuntimeSpeakResultV21 {
  readonly accepted: boolean;
  readonly reason:
    | 'accepted'
    | 'plan_not_ready'
    | 'missing_physical_binding'
    | 'stale_stage'
    | 'voice_channel_busy';
  readonly trackedRequest: MicroCheckTrackedVoiceRequestV21 | null;
  readonly scopeId: string | null;
  readonly plan: MicroCheckVoiceSequencePlanV21 | null;
}

export interface MicroCheckVoiceRuntimeV21Options {
  readonly voiceChannel: MicroCheckVoiceChannelV21;
  readonly flowId?: string;
  readonly scopePrefix?: string;
}

const COUNTDOWN_CUE_KEYS = MICRO_CHECK_COUNTDOWN_CUE_KEYS_V21;

export class MicroCheckVoiceRuntimeV21 {
  private readonly voiceChannel: MicroCheckVoiceChannelV21;
  private readonly flowId: string;
  private readonly scopePrefix: string;
  private activeScopeId: string | null = null;
  private phase: MicroCheckVoicePhaseV21 = 'side_setup';
  private stageEpoch = 0;
  private attemptEpoch = 0;
  private eventNumber = 0;
  private countdownRequestId: string | null = null;
  private countdownAttemptId: string | null = null;
  private countdownGoStarted = false;
  private activeAttemptId: string | null = null;
  private recoveryEpisode: MicroCheckRecoveryEpisodeV21 | null = null;
  private readonly events: MicroCheckVoiceRuntimeEventV21[] = [];

  constructor(options: MicroCheckVoiceRuntimeV21Options) {
    this.voiceChannel = options.voiceChannel;
    this.flowId = options.flowId ?? 'micro-check-v21';
    this.scopePrefix = options.scopePrefix ?? 'micro-check-v21';
  }

  getPhase(): MicroCheckVoicePhaseV21 {
    return this.phase;
  }

  getEvents(): MicroCheckVoiceRuntimeEventV21[] {
    return this.events.slice();
  }

  getActiveAttemptId(): string | null {
    return this.activeAttemptId;
  }

  getCurrentAttemptEpoch(): number {
    return this.attemptEpoch;
  }

  getRecoveryEpisode(): MicroCheckRecoveryEpisodeV21 | null {
    return this.recoveryEpisode ? { ...this.recoveryEpisode } : null;
  }

  requestInstruction(input: {
    readonly type: MicroCheckType;
    readonly selectedSide?: BodySide | null;
    readonly exposure?: Extract<
      MicroCheckVoiceExposureV21,
      'first_setup' | 'repeat_instructions' | 'resume_setup' | 'retry_setup' | 'recovery_setup'
    >;
    readonly atMs: number;
    readonly physicalCueKeys?: readonly MicroCheckVoiceLogicalCueKeyV21[];
  }): MicroCheckVoiceRuntimeSpeakResultV21 {
    const exposure = input.exposure ?? 'first_setup';
    const plan = planMicroCheckVoiceSequenceV21({
      type: input.type,
      selectedSide: input.selectedSide ?? null,
      exposure,
      phase: 'instruction',
    });
    this.recordEvent('sequence_requested', input.atMs, null, {
      type: input.type,
      exposure,
      cueCount: plan.cueKeys.length,
    });
    if (!plan.ready) {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null, scopeId: null, plan };
    }
    const scopeId = this.beginStage(`instruction:${input.type}:${input.selectedSide ?? 'none'}:${exposure}`);
    this.phase = 'instruction';
    return this.speakPlan(plan, scopeId, input.physicalCueKeys);
  }

  markFinalPositionReady(input: {
    readonly type: MicroCheckType;
    readonly selectedSide?: BodySide | null;
    readonly cameraReady: boolean;
    readonly userConfirmed: boolean;
    readonly atMs: number;
    readonly physicalCueKeys?: readonly MicroCheckVoiceLogicalCueKeyV21[];
  }): MicroCheckVoiceRuntimeSpeakResultV21 {
    const plan = planMicroCheckVoiceSequenceV21({
      type: input.type,
      selectedSide: input.selectedSide ?? null,
      exposure: 'first_setup',
      phase: 'final_position',
    });
    if (!input.cameraReady || !input.userConfirmed || !plan.ready) {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null, scopeId: null, plan };
    }
    const scopeId = this.beginStage(`final-position:${input.type}:${input.selectedSide ?? 'none'}`);
    this.phase = 'final_position';
    this.recordEvent('final_position_ready', input.atMs, null, {
      type: input.type,
      selectedSide: input.selectedSide ?? null,
      cameraReady: input.cameraReady,
      userConfirmed: input.userConfirmed,
    });
    return this.speakPlan(plan, scopeId, input.physicalCueKeys);
  }

  startCountdown(input: {
    readonly type: MicroCheckType;
    readonly selectedSide?: BodySide | null;
    readonly atMs: number;
    readonly attemptId?: string;
    readonly physicalCueKeys?: readonly MicroCheckVoiceLogicalCueKeyV21[];
  }): MicroCheckVoiceRuntimeSpeakResultV21 & { readonly attemptId: string } {
    const plan = planMicroCheckVoiceSequenceV21({
      type: input.type,
      selectedSide: input.selectedSide ?? null,
      exposure: 'first_setup',
      phase: 'countdown',
    });
    this.attemptEpoch += 1;
    const attemptId = input.attemptId ?? `attempt-${this.attemptEpoch}`;
    const scopeId = this.beginStage(`countdown:${input.type}:${input.selectedSide ?? 'none'}:${attemptId}`);
    this.phase = 'countdown';
    this.countdownAttemptId = attemptId;
    this.countdownGoStarted = false;
    this.activeAttemptId = null;
    this.recordEvent('countdown_requested', input.atMs, attemptId, {
      type: input.type,
      selectedSide: input.selectedSide ?? null,
      attemptEpoch: this.attemptEpoch,
    });
    if (!plan.ready) {
      this.phase = 'audio_failure';
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null, scopeId, plan, attemptId };
    }
    const physicalCueKeys = input.physicalCueKeys ?? plan.cueKeys;
    if (physicalCueKeys.join('|') !== COUNTDOWN_CUE_KEYS.join('|')) {
      this.phase = 'audio_failure';
      this.recordEvent('audio_failure', input.atMs, attemptId, {
        reason: 'missing_go_or_countdown_binding',
      });
      return {
        accepted: false,
        reason: 'missing_physical_binding',
        trackedRequest: null,
        scopeId,
        plan,
        attemptId,
      };
    }
    const request = this.voiceChannel.speakTracked(physicalCueKeys, {
      priority: maxPriority(physicalCueKeys),
      required: true,
      scopeId,
      onCueStarted: (event) => this.notifyCountdownCueStarted({ ...event, attemptId }),
    });
    this.countdownRequestId = request.requestId;
    void request.completion.then((result) => this.handleCountdownCompletion(result, scopeId, attemptId));
    if (!request.accepted) {
      this.phase = 'audio_failure';
      return { accepted: false, reason: 'voice_channel_busy', trackedRequest: request, scopeId, plan, attemptId };
    }
    return { accepted: true, reason: 'accepted', trackedRequest: request, scopeId, plan, attemptId };
  }

  notifyCountdownCueStarted(
    event: MicroCheckVoiceCueStartedEventV21 & { readonly attemptId?: string | null }
  ): boolean {
    const attemptId = event.attemptId ?? this.countdownAttemptId;
    const stale =
      event.scopeId !== this.activeScopeId ||
      event.requestId !== this.countdownRequestId ||
      attemptId !== this.countdownAttemptId ||
      event.cueKey !== 'go' ||
      this.countdownGoStarted ||
      this.phase !== 'countdown';
    if (stale) {
      if (event.cueKey === 'go') {
        this.recordEvent('stale_callback_ignored', event.startedAtMs, attemptId ?? null, {
          cueKey: event.cueKey,
          scopeMatches: event.scopeId === this.activeScopeId,
          requestMatches: event.requestId === this.countdownRequestId,
        });
      }
      return false;
    }
    this.countdownGoStarted = true;
    this.phase = 'active';
    this.activeAttemptId = attemptId;
    this.recordEvent('go_playback_started', event.startedAtMs, attemptId, {
      requestId: event.requestId,
      startEvidence: event.startEvidence,
    });
    this.recordEvent('active_started', event.startedAtMs, attemptId, {
      startBoundary: 'go_playback_started',
    });
    return true;
  }

  pause(input: { readonly atMs: number; readonly transactionId: string }): MicroCheckVoiceRuntimeSpeakResultV21 {
    if (this.phase !== 'countdown' && this.phase !== 'active' && this.phase !== 'final_position') {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null, scopeId: null, plan: null };
    }
    this.invalidateCurrentAttempt('explicit_stop');
    this.phase = 'paused';
    this.recordEvent('pause_accepted', input.atMs, null, { transactionId: input.transactionId });
    return this.speakSingle('paused-v21', `control:pause:${input.transactionId}`, true);
  }

  resume(input: { readonly atMs: number; readonly transactionId: string }): MicroCheckVoiceRuntimeSpeakResultV21 {
    if (this.phase !== 'paused') {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null, scopeId: null, plan: null };
    }
    this.invalidateCurrentAttempt('superseded');
    this.phase = 'instruction';
    this.recordEvent('resume_accepted', input.atMs, null, { transactionId: input.transactionId });
    return this.speakSingle('resuming-v21', `control:resume:${input.transactionId}`, true);
  }

  retry(input: { readonly atMs: number; readonly transactionId: string }): MicroCheckVoiceRuntimeSpeakResultV21 {
    this.invalidateCurrentAttempt('retry');
    this.recoveryEpisode = null;
    this.phase = 'instruction';
    this.recordEvent('retry_accepted', input.atMs, null, { transactionId: input.transactionId });
    return this.speakSingle('retry-v21', `control:retry:${input.transactionId}`, true);
  }

  discard(input: { readonly atMs: number; readonly transactionId: string }): MicroCheckVoiceRuntimeSpeakResultV21 {
    this.invalidateCurrentAttempt('discard');
    this.recoveryEpisode = null;
    this.phase = 'discarded';
    this.recordEvent('discard_accepted', input.atMs, null, { transactionId: input.transactionId });
    return this.speakSingle('micro-discard-v21', `control:discard:${input.transactionId}`, true);
  }

  handleTrackingLoss(input: {
    readonly type: MicroCheckType;
    readonly selectedSide?: BodySide | null;
    readonly atMs: number;
  }): MicroCheckRecoveryEpisodeV21 {
    const sourceAttemptId = this.activeAttemptId ?? this.countdownAttemptId ?? 'unknown-attempt';
    if (
      this.recoveryEpisode &&
      this.recoveryEpisode.sourceAttemptId === sourceAttemptId &&
      this.recoveryEpisode.sourceAttemptEpoch === this.attemptEpoch
    ) {
      return this.recoveryEpisode;
    }
    this.voiceChannel.cancelActive('stage_changed');
    this.phase = 'tracking_recovery';
    const recoveryId = `${this.flowId}:recovery:${this.attemptEpoch}:${sourceAttemptId}`;
    this.recoveryEpisode = {
      recoveryId,
      flowId: this.flowId,
      type: input.type,
      selectedSide: input.selectedSide ?? null,
      sourceAttemptId,
      sourceAttemptEpoch: this.attemptEpoch,
      lossConfirmedAtMs: input.atMs,
      lossCueRequested: true,
      lossCueCompleted: false,
      stableRecoveryReached: false,
      recoveredCueRequested: false,
      recoveredCueCompleted: false,
      freshCountdownRequired: true,
    };
    this.activeAttemptId = null;
    this.recordEvent('tracking_loss', input.atMs, sourceAttemptId, { recoveryId });
    this.speakSingle('tracking-loss-v21', `recovery:${recoveryId}:loss`, true);
    return this.recoveryEpisode;
  }

  markTrackingRecovered(input: { readonly atMs: number }): MicroCheckRecoveryEpisodeV21 | null {
    if (!this.recoveryEpisode) return null;
    const recovery = {
      ...this.recoveryEpisode,
      stableRecoveryReached: true,
      recoveredCueRequested: true,
    };
    this.recoveryEpisode = recovery;
    this.phase = 'instruction';
    this.recordEvent('tracking_recovered', input.atMs, recovery.sourceAttemptId, {
      recoveryId: recovery.recoveryId,
      freshCountdownRequired: true,
    });
    this.speakSingle('tracking-recovered-v21', `recovery:${recovery.recoveryId}:recovered`, false);
    return this.recoveryEpisode;
  }

  requestCompletion(input: { readonly atMs: number }): MicroCheckVoiceRuntimeSpeakResultV21 {
    this.phase = 'completion';
    this.recordEvent('completion_requested', input.atMs, null);
    return this.speakSingle('microcheck-complete-v21', 'completion', true);
  }

  private speakPlan(
    plan: MicroCheckVoiceSequencePlanV21,
    scopeId: string,
    physicalCueKeys?: readonly MicroCheckVoiceLogicalCueKeyV21[]
  ): MicroCheckVoiceRuntimeSpeakResultV21 {
    const cueKeys = physicalCueKeys ?? plan.cueKeys;
    if (cueKeys.length !== plan.entries.length) {
      this.phase = 'audio_failure';
      return { accepted: false, reason: 'missing_physical_binding', trackedRequest: null, scopeId, plan };
    }
    const request = this.voiceChannel.speakTracked(cueKeys, {
      priority: maxPriority(cueKeys),
      required: true,
      scopeId,
    });
    void request.completion.then((result) => this.handleRequiredCompletion(result, scopeId));
    if (!request.accepted) {
      this.phase = 'audio_failure';
      return { accepted: false, reason: 'voice_channel_busy', trackedRequest: request, scopeId, plan };
    }
    return { accepted: true, reason: 'accepted', trackedRequest: request, scopeId, plan };
  }

  private speakSingle(
    cueKey: MicroCheckVoiceLogicalCueKeyV21,
    scopeSuffix: string,
    required: boolean
  ): MicroCheckVoiceRuntimeSpeakResultV21 {
    const scopeId = this.beginStage(scopeSuffix);
    const request = this.voiceChannel.speakTracked([cueKey], {
      priority: priorityForMicroCheckCue(cueKey),
      required,
      scopeId,
    });
    void request.completion.then((result) => this.handleRequiredCompletion(result, scopeId));
    if (!request.accepted && required) {
      this.phase = 'audio_failure';
      return { accepted: false, reason: 'voice_channel_busy', trackedRequest: request, scopeId, plan: null };
    }
    return {
      accepted: request.accepted,
      reason: request.accepted ? 'accepted' : 'voice_channel_busy',
      trackedRequest: request,
      scopeId,
      plan: null,
    };
  }

  private beginStage(stageId: string): string {
    if (this.activeScopeId) this.voiceChannel.cancelScope(this.activeScopeId, 'stage_changed');
    this.stageEpoch += 1;
    this.activeScopeId = `${this.scopePrefix}:${stageId}:${this.stageEpoch}`;
    return this.activeScopeId;
  }

  private invalidateCurrentAttempt(reason: MicroCheckVoiceCancelReasonV21): void {
    this.voiceChannel.cancelActive(reason);
    this.countdownRequestId = null;
    this.countdownAttemptId = null;
    this.countdownGoStarted = false;
    this.activeAttemptId = null;
    this.attemptEpoch += 1;
  }

  private handleCountdownCompletion(
    result: MicroCheckVoicePlaybackResultV21,
    expectedScopeId: string,
    attemptId: string
  ): void {
    if (result.scopeId !== expectedScopeId || attemptId !== this.countdownAttemptId) return;
    if (!this.countdownGoStarted && result.outcome !== 'cancelled') {
      this.phase = 'audio_failure';
      this.recordEvent('audio_failure', result.completedAtMs, attemptId, {
        outcome: result.outcome,
        failedCueKey: result.failedCueKey ?? null,
      });
    }
  }

  private handleRequiredCompletion(result: MicroCheckVoicePlaybackResultV21, expectedScopeId: string): void {
    if (result.scopeId !== expectedScopeId) return;
    if (result.required && result.outcome !== 'completed' && result.outcome !== 'cancelled') {
      this.phase = 'audio_failure';
      this.recordEvent('audio_failure', result.completedAtMs, null, {
        outcome: result.outcome,
        failedCueKey: result.failedCueKey ?? null,
      });
    }
    if (result.scopeId.includes(':recovered') && this.recoveryEpisode && result.outcome === 'completed') {
      this.recoveryEpisode = { ...this.recoveryEpisode, recoveredCueCompleted: true };
    }
    if (result.scopeId.includes(':loss') && this.recoveryEpisode && result.outcome === 'completed') {
      this.recoveryEpisode = { ...this.recoveryEpisode, lossCueCompleted: true };
    }
  }

  private recordEvent(
    type: MicroCheckVoiceRuntimeEventV21['type'],
    atMs: number,
    attemptId: string | null,
    details?: Readonly<Record<string, string | number | boolean | null>>
  ): void {
    this.eventNumber += 1;
    this.events.push({
      type,
      atMs,
      flowId: this.flowId,
      attemptId,
      scopeId: this.activeScopeId,
      ...(details ? { details } : {}),
    });
  }
}

function maxPriority(cues: readonly MicroCheckVoiceLogicalCueKeyV21[]): number {
  return cues.reduce((priority, cue) => Math.max(priority, priorityForMicroCheckCue(cue)), 0);
}

function priorityForMicroCheckCue(cue: MicroCheckVoiceLogicalCueKeyV21): number {
  if (
    cue === 'go' ||
    cue === 'times-up-v21' ||
    cue === 'micro-relax-v21' ||
    cue === 'tracking-loss-v21' ||
    cue === 'tracking-recovered-v21' ||
    cue.startsWith('countdown-')
  ) {
    return 10;
  }
  if (cue === 'microcheck-complete-v21' || cue === 'micro-discard-v21' || cue.endsWith('-v21')) {
    return 9;
  }
  return 8;
}
