import type { VoiceCueKey } from '../../audio/cues';
import { voicePriority } from '../../audio/cues';
import type {
  TrackedVoiceRequest,
  VoiceCueStartedEvent,
  VoiceCancelReason,
  VoiceChannel,
  VoicePlaybackResult,
} from '../../audio/voicePlayer';
import type {
  SerializedTrainingVoiceRuntimeV21,
  TrainingVoiceActiveProgressPlanV21,
  TrainingVoiceControlV21,
  TrainingVoicePhaseV21,
  TrainingVoiceRecoveryEpisodeV21,
  TrainingVoiceRuntimeEventV21,
  TrainingVoiceSafetyPlanV21,
  TrainingVoiceSequencePlanV21,
  TrainingVoiceSessionMemoryV21,
} from './types';
import { getTrainingVoiceControlContractV21 } from './controls';
import {
  createTrainingVoiceRecoveryEpisodeV21,
  markTrainingVoiceRecoveredCueCompletedV21,
  markTrainingVoiceRecoveredCueRequestedV21,
  markTrainingVoiceRecoveryLossCueCompletedV21,
  markTrainingVoiceRecoveryLossCueRequestedV21,
  markTrainingVoiceStableRecoveryReachedV21,
  shouldDeduplicateTrainingVoiceRecoveryLossV21,
  type CreateTrainingVoiceRecoveryEpisodeV21Input,
} from './recovery';
import {
  EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
  completeTrainingVoiceFamilySafetyV21,
  completeTrainingVoiceSessionEntrySafetyV21,
  normalizeTrainingVoiceSafetySessionMemoryV21,
} from './safetyPolicy';
import { DEFAULT_VOICE_ID } from '../../profile/voices';

const COUNTDOWN_CUES: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

export interface TrainingVoiceRuntimeSpeakResultV21 {
  readonly accepted: boolean;
  readonly reason: 'accepted' | 'plan_not_ready' | 'missing_physical_binding' | 'stale_stage' | 'voice_channel_busy';
  readonly trackedRequest: TrackedVoiceRequest | null;
}

export interface TrainingVoiceRuntimeV21Options {
  readonly voiceChannel: Pick<VoiceChannel, 'speakTracked' | 'cancelScope' | 'cancelActive'>;
  readonly scopePrefix?: string;
  readonly sessionId?: string;
  readonly voiceId?: string;
  readonly restored?: SerializedTrainingVoiceRuntimeV21 | null;
}

export class TrainingVoiceRuntimeV21 {
  private readonly voiceChannel: Pick<VoiceChannel, 'speakTracked' | 'cancelScope' | 'cancelActive'>;
  private readonly scopePrefix: string;
  private activeScopeId: string | null = null;
  private stageEpoch = 0;
  private safetyMemory: TrainingVoiceSessionMemoryV21 = EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21;
  private phase: TrainingVoicePhaseV21 = 'idle';
  private readonly sessionId: string;
  private sessionEpoch = 1;
  private itemEpoch = 0;
  private setEpoch = 0;
  private attemptEpoch = 0;
  private lastEventNumber = 0;
  private controlTransactionId: string | null = null;
  private countdownRequestId: string | null = null;
  private countdownAttemptId: string | null = null;
  private countdownGoStarted = false;
  private activeAttemptId: string | null = null;
  private pausedOrigin: TrainingVoicePhaseV21 | null = null;
  private completedTransitionIds = new Set<string>();
  private firedProgressEventIds = new Set<string>();
  private progressPlan: TrainingVoiceActiveProgressPlanV21 | null = null;
  private progressAttemptId: string | null = null;
  private recoveryEpisode: TrainingVoiceRecoveryEpisodeV21 | null = null;
  private activeVoiceId: string;
  private pendingVoiceId: string | null = null;
  private voiceGeneration = 1;
  private planFingerprint = 'training-voice-v21:unbound';
  private readonly events: TrainingVoiceRuntimeEventV21[] = [];

  constructor(options: TrainingVoiceRuntimeV21Options) {
    this.voiceChannel = options.voiceChannel;
    this.scopePrefix = options.scopePrefix ?? 'training-v21';
    this.sessionId = options.sessionId ?? 'training-session';
    this.activeVoiceId = options.voiceId ?? DEFAULT_VOICE_ID;
    if (options.restored) this.restoreRuntime(options.restored);
  }

  beginStage(stageId: string): string {
    if (this.activeScopeId) this.voiceChannel.cancelScope(this.activeScopeId, 'stage_changed');
    this.stageEpoch += 1;
    this.activeScopeId = `${this.scopePrefix}:${stageId}:${this.stageEpoch}`;
    return this.activeScopeId;
  }

  cancelActive(reason: VoiceCancelReason = 'explicit_stop'): void {
    this.voiceChannel.cancelActive(reason);
    this.activeScopeId = null;
    this.cancelProgress();
    this.phase = reason === 'explicit_stop' ? 'cancelled' : this.phase;
  }

  getPhase(): TrainingVoicePhaseV21 {
    return this.phase;
  }

  getEvents(): TrainingVoiceRuntimeEventV21[] {
    return this.events.slice();
  }

  getSafetyMemory(): TrainingVoiceSessionMemoryV21 {
    return {
      ...this.safetyMemory,
      introducedSafetyFamilies: this.safetyMemory.introducedSafetyFamilies.slice(),
      firstUseExerciseIds: this.safetyMemory.firstUseExerciseIds.slice(),
      floor: { ...this.safetyMemory.floor },
    };
  }

  restoreSafetyMemory(value: unknown): boolean {
    const normalized = normalizeTrainingVoiceSafetySessionMemoryV21(value);
    if (!normalized) return false;
    this.safetyMemory = normalized;
    return true;
  }

  speakRequiredSequence(input: {
    readonly plan: TrainingVoiceSequencePlanV21;
    readonly stageScopeId: string;
    readonly physicalCueKeys: readonly VoiceCueKey[];
  }): TrainingVoiceRuntimeSpeakResultV21 {
    if (input.stageScopeId !== this.activeScopeId) {
      return { accepted: false, reason: 'stale_stage', trackedRequest: null };
    }
    if (!input.plan.ready) {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null };
    }
    if (input.physicalCueKeys.length !== input.plan.entries.length) {
      return { accepted: false, reason: 'missing_physical_binding', trackedRequest: null };
    }
    const request = this.voiceChannel.speakTracked(input.physicalCueKeys, {
      priority: maxPriority(input.physicalCueKeys),
      required: true,
      scopeId: input.stageScopeId,
    });
    return { accepted: request.accepted, reason: request.accepted ? 'accepted' : 'voice_channel_busy', trackedRequest: request };
  }

  startCountdown(input: {
    readonly itemId: string;
    readonly setIndex: number;
    readonly attemptId: string;
    readonly acceptedAtMs: number;
    readonly physicalCueKeys?: readonly VoiceCueKey[];
  }): TrainingVoiceRuntimeSpeakResultV21 & { readonly scopeId: string } {
    const physicalCueKeys = input.physicalCueKeys ?? COUNTDOWN_CUES;
    const scopeId = this.beginStage(`item:${input.itemId}:set:${input.setIndex}:attempt:${input.attemptId}:countdown`);
    this.phase = 'countdown';
    this.attemptEpoch += 1;
    this.countdownAttemptId = input.attemptId;
    this.countdownGoStarted = false;
    this.recordEvent('countdown_requested', input.acceptedAtMs, {
      itemId: input.itemId,
      setIndex: input.setIndex,
      attemptId: input.attemptId,
    });
    if (physicalCueKeys.join('|') !== COUNTDOWN_CUES.join('|')) {
      this.phase = 'audio_failure';
      return {
        accepted: false,
        reason: 'missing_physical_binding',
        trackedRequest: null,
        scopeId,
      };
    }
    const request = this.voiceChannel.speakTracked(physicalCueKeys, {
      priority: maxPriority(physicalCueKeys),
      required: true,
      scopeId,
      onCueStarted: (event) => this.handleCountdownCueStarted(event, input.attemptId),
    });
    this.countdownRequestId = request.requestId;
    void request.completion.then((result) => this.handleCountdownCompletion(result, scopeId, input.attemptId));
    if (!request.accepted) {
      this.phase = 'audio_failure';
      return { accepted: false, reason: 'voice_channel_busy', trackedRequest: request, scopeId };
    }
    return { accepted: true, reason: 'accepted', trackedRequest: request, scopeId };
  }

  requestControl(input: {
    readonly control: TrainingVoiceControlV21;
    readonly acceptedAtMs: number;
    readonly transactionId: string;
  }): TrainingVoiceRuntimeSpeakResultV21 {
    const contract = getTrainingVoiceControlContractV21(input.control);
    if (!contract.allowedPhases.includes(this.phase)) {
      return { accepted: false, reason: 'plan_not_ready', trackedRequest: null };
    }
    if (this.controlTransactionId === input.transactionId) {
      return { accepted: false, reason: 'stale_stage', trackedRequest: null };
    }
    this.controlTransactionId = input.transactionId;
    this.recordEvent(`${input.control}_accepted` as TrainingVoiceRuntimeEventV21['type'], input.acceptedAtMs, {
      transactionId: input.transactionId,
    });

    if (input.control === 'cancel') {
      this.cancelActive('explicit_stop');
      this.phase = 'cancelled';
      return { accepted: true, reason: 'accepted', trackedRequest: null };
    }
    if (input.control === 'pause') {
      this.pausedOrigin = this.phase;
      this.cancelProgress();
      this.voiceChannel.cancelActive('explicit_stop');
      this.phase = 'paused';
    } else if (input.control === 'resume') {
      this.phase = 'item_setup';
      this.pausedOrigin = null;
    } else if (input.control === 'repeat_instructions') {
      this.phase = 'repeat_instructions';
    } else if (input.control === 'retry') {
      this.cancelProgress();
      this.recoveryEpisode = null;
      this.phase = 'item_setup';
      this.attemptEpoch += 1;
    } else if (input.control === 'skip') {
      this.cancelProgress();
      this.phase = 'item_transition';
    }

    if (!contract.logicalCueKey) {
      return { accepted: true, reason: 'accepted', trackedRequest: null };
    }
    const scopeId = this.beginStage(`control:${input.control}:${input.transactionId}`);
    const cueKey = contract.logicalCueKey as VoiceCueKey;
    const request = this.voiceChannel.speakTracked([cueKey], {
      priority: voicePriority(cueKey),
      required: contract.requiredness === 'required_before_next_boundary',
      scopeId,
    });
    void request.completion.then((result) => this.handleControlCompletion(result, scopeId));
    if (!request.accepted && contract.requiredness === 'required_before_next_boundary') {
      this.phase = input.control === 'pause' ? 'paused' : 'audio_failure';
    }
    return { accepted: request.accepted, reason: request.accepted ? 'accepted' : 'voice_channel_busy', trackedRequest: request };
  }

  beginProgressAttempt(input: {
    readonly attemptId: string;
    readonly plan: TrainingVoiceActiveProgressPlanV21;
  }): void {
    this.progressAttemptId = input.attemptId;
    this.progressPlan = input.plan;
    this.firedProgressEventIds = new Set(
      [...this.firedProgressEventIds].filter((id) => !id.startsWith(`${input.attemptId}:`))
    );
  }

  emitDueProgress(input: {
    readonly attemptId: string;
    readonly activeElapsedMs: number;
    readonly voiceBusy: boolean;
  }): readonly VoiceCueKey[] {
    if (this.phase !== 'active' || this.progressAttemptId !== input.attemptId || !this.progressPlan) return [];
    const emitted: VoiceCueKey[] = [];
    for (const event of this.progressPlan.events) {
      const scopedId = `${input.attemptId}:${event.eventId}`;
      if (this.firedProgressEventIds.has(scopedId)) continue;
      if (input.activeElapsedMs < event.dueAtActiveElapsedMs) continue;
      this.firedProgressEventIds.add(scopedId);
      if (input.voiceBusy) continue;
      const cueKey = event.logicalCueKey as VoiceCueKey;
      const scopeId = `${this.scopePrefix}:progress:${input.attemptId}:${event.eventId}`;
      const request = this.voiceChannel.speakTracked([cueKey], {
        priority: voicePriority(cueKey),
        required: false,
        scopeId,
      });
      if (request.accepted) emitted.push(cueKey);
    }
    return emitted;
  }

  confirmTrackingLoss(input: CreateTrainingVoiceRecoveryEpisodeV21Input): TrainingVoiceRecoveryEpisodeV21 {
    if (
      shouldDeduplicateTrainingVoiceRecoveryLossV21({
        currentEpisode: this.recoveryEpisode,
        attemptId: input.attemptId,
        sourceAttemptEpoch: input.sourceAttemptEpoch,
      }) &&
      this.recoveryEpisode
    ) {
      return this.recoveryEpisode;
    }
    this.cancelProgress();
    this.voiceChannel.cancelActive('stage_changed');
    this.recoveryEpisode = createTrainingVoiceRecoveryEpisodeV21(input);
    this.phase = 'tracking_recovery';
    this.recordEvent('tracking_loss_confirmed', input.lossConfirmedAtMs, {
      recoveryId: this.recoveryEpisode.recoveryId,
      attemptId: input.attemptId,
    });
    const scopeId = this.beginStage(`recovery:${this.recoveryEpisode.recoveryId}:loss`);
    this.recoveryEpisode = markTrainingVoiceRecoveryLossCueRequestedV21(this.recoveryEpisode);
    const cueKey: VoiceCueKey = 'tracking-loss-v21';
    const request = this.voiceChannel.speakTracked([cueKey], {
      priority: voicePriority(cueKey),
      required: true,
      scopeId,
    });
    void request.completion.then((result) => {
      if (result.scopeId !== scopeId) return;
      if (result.scopeId === scopeId && result.outcome === 'completed' && this.recoveryEpisode) {
        this.recoveryEpisode = markTrainingVoiceRecoveryLossCueCompletedV21(this.recoveryEpisode);
      }
    });
    return this.recoveryEpisode;
  }

  markStableRecoveryReached(input: { readonly recoveredAtMs: number }): TrainingVoiceRecoveryEpisodeV21 | null {
    if (!this.recoveryEpisode) return null;
    this.recoveryEpisode = markTrainingVoiceStableRecoveryReachedV21(this.recoveryEpisode);
    this.recordEvent('tracking_recovered', input.recoveredAtMs, {
      recoveryId: this.recoveryEpisode.recoveryId,
    });
    const scopeId = this.beginStage(`recovery:${this.recoveryEpisode.recoveryId}:recovered`);
    this.recoveryEpisode = markTrainingVoiceRecoveredCueRequestedV21(this.recoveryEpisode);
    const cueKey: VoiceCueKey = 'tracking-recovered-v21';
    const request = this.voiceChannel.speakTracked([cueKey], {
      priority: voicePriority(cueKey),
      required: false,
      scopeId,
    });
    void request.completion.then((result) => {
      if (result.scopeId === scopeId && result.outcome === 'completed' && this.recoveryEpisode) {
        this.recoveryEpisode = markTrainingVoiceRecoveredCueCompletedV21(this.recoveryEpisode);
      }
    });
    return this.recoveryEpisode;
  }

  requestVoiceChange(input: { readonly desiredVoiceId: string; readonly requestedAtMs: number }): {
    readonly applied: boolean;
    readonly restartRequiredSequence: boolean;
  } {
    if (input.desiredVoiceId === this.activeVoiceId) return { applied: false, restartRequiredSequence: false };
    this.pendingVoiceId = input.desiredVoiceId;
    this.recordEvent('voice_changed', input.requestedAtMs, {
      desiredVoiceId: input.desiredVoiceId,
      phase: this.phase,
    });
    if (this.phase === 'active') {
      return { applied: false, restartRequiredSequence: false };
    }
    this.voiceGeneration += 1;
    this.activeVoiceId = input.desiredVoiceId;
    this.pendingVoiceId = null;
    if (this.phase === 'countdown') {
      this.voiceChannel.cancelActive('voice_changed');
      this.countdownGoStarted = false;
      return { applied: true, restartRequiredSequence: true };
    }
    if (
      this.phase === 'item_setup' ||
      this.phase === 'repeat_instructions' ||
      this.phase === 'paused' ||
      this.phase === 'tracking_recovery'
    ) {
      this.voiceChannel.cancelActive('voice_changed');
      return { applied: true, restartRequiredSequence: true };
    }
    return { applied: true, restartRequiredSequence: false };
  }

  markTransitionCompleted(transitionId: string): void {
    this.completedTransitionIds.add(transitionId);
  }

  serializeRuntime(): SerializedTrainingVoiceRuntimeV21 {
    return {
      version: 1,
      runtimeMode: 'internal_v21',
      phase: this.phase === 'active' ? 'item_setup' : this.phase,
      sessionEpoch: this.sessionEpoch,
      itemEpoch: this.itemEpoch,
      setEpoch: this.setEpoch,
      attemptEpoch: this.attemptEpoch,
      safetyMemory: this.getSafetyMemory(),
      pausedOrigin: this.pausedOrigin,
      recoveryEpisode: this.recoveryEpisode
        ? {
            recoveryId: this.recoveryEpisode.recoveryId,
            itemId: this.recoveryEpisode.itemId,
            setId: this.recoveryEpisode.setId,
            sourceAttemptId: this.recoveryEpisode.attemptId,
            stableRecoveryReached: this.recoveryEpisode.stableRecoveryReached,
          }
        : null,
      completedTransitionIds: [...this.completedTransitionIds],
      firedProgressEventIds: [...this.firedProgressEventIds],
      activeVoiceId: this.activeVoiceId,
      pendingVoiceId: this.pendingVoiceId,
      planFingerprint: this.planFingerprint,
    };
  }

  restoreRuntime(value: SerializedTrainingVoiceRuntimeV21): boolean {
    if (!value || value.version !== 1 || value.runtimeMode !== 'internal_v21') return false;
    const normalized = normalizeTrainingVoiceSafetySessionMemoryV21(value.safetyMemory);
    if (!normalized) return false;
    this.phase = value.phase === 'active' ? 'item_setup' : value.phase;
    this.sessionEpoch = value.sessionEpoch;
    this.itemEpoch = value.itemEpoch;
    this.setEpoch = value.setEpoch;
    this.attemptEpoch = value.attemptEpoch;
    this.safetyMemory = normalized;
    this.pausedOrigin = value.pausedOrigin;
    this.completedTransitionIds = new Set(value.completedTransitionIds);
    this.firedProgressEventIds = new Set(value.firedProgressEventIds);
    this.activeVoiceId = value.activeVoiceId;
    this.pendingVoiceId = value.pendingVoiceId;
    this.planFingerprint = value.planFingerprint;
    this.recoveryEpisode = null;
    this.activeScopeId = null;
    this.countdownRequestId = null;
    this.countdownAttemptId = null;
    this.countdownGoStarted = false;
    return true;
  }

  completeSessionEntrySafety(input: {
    readonly result: Awaited<TrackedVoiceRequest['completion']>;
    readonly expectedScopeId: string;
  }): TrainingVoiceSessionMemoryV21 {
    this.safetyMemory = completeTrainingVoiceSessionEntrySafetyV21({
      memory: this.safetyMemory,
      result: input.result,
      expectedScopeId: input.expectedScopeId,
    });
    return this.getSafetyMemory();
  }

  completeFamilySafety(input: {
    readonly plan: Pick<TrainingVoiceSafetyPlanV21, 'family' | 'fulfilment'>;
    readonly result: Awaited<TrackedVoiceRequest['completion']>;
    readonly expectedScopeId: string;
  }): TrainingVoiceSessionMemoryV21 {
    this.safetyMemory = completeTrainingVoiceFamilySafetyV21({
      memory: this.safetyMemory,
      plan: input.plan,
      result: input.result,
      expectedScopeId: input.expectedScopeId,
    });
    return this.getSafetyMemory();
  }

  private handleCountdownCueStarted(event: VoiceCueStartedEvent, attemptId: string): void {
    if (
      event.scopeId !== this.activeScopeId ||
      event.requestId !== this.countdownRequestId ||
      attemptId !== this.countdownAttemptId ||
      event.cueKey !== 'go' ||
      this.countdownGoStarted
    ) {
      return;
    }
    this.countdownGoStarted = true;
    this.phase = 'active';
    this.activeAttemptId = attemptId;
    this.recordEvent('go_playback_started', event.startedAtMs, {
      attemptId,
      requestId: event.requestId,
      voiceGeneration: this.voiceGeneration,
      startEvidence: event.startEvidence,
    });
    this.recordEvent('active_attempt_started', event.startedAtMs, { attemptId });
  }

  private handleCountdownCompletion(
    result: VoicePlaybackResult,
    expectedScopeId: string,
    attemptId: string
  ): void {
    if (result.scopeId !== expectedScopeId || attemptId !== this.countdownAttemptId) return;
    if (!this.countdownGoStarted && result.outcome !== 'cancelled') {
      this.phase = 'audio_failure';
      this.recordEvent('audio_failed', result.completedAtMs, {
        scopeId: expectedScopeId,
        outcome: result.outcome,
        failedCueKey: result.failedCueKey,
      });
    }
  }

  private handleControlCompletion(result: VoicePlaybackResult, expectedScopeId: string): void {
    if (result.scopeId !== expectedScopeId) return;
    if (result.required && result.outcome !== 'completed' && result.outcome !== 'cancelled') {
      this.phase = 'audio_failure';
      this.recordEvent('audio_failed', result.completedAtMs, {
        scopeId: expectedScopeId,
        outcome: result.outcome,
        failedCueKey: result.failedCueKey,
      });
    }
  }

  private cancelProgress(): void {
    this.progressPlan = null;
    this.progressAttemptId = null;
  }

  private recordEvent(
    type: TrainingVoiceRuntimeEventV21['type'],
    acceptedAtMs: number,
    payload?: unknown
  ): void {
    this.lastEventNumber += 1;
    this.events.push({
      eventId: `${this.sessionId}:${this.lastEventNumber}`,
      acceptedAtMs,
      sessionId: this.sessionId,
      sessionEpoch: this.sessionEpoch,
      itemId: null,
      itemEpoch: this.itemEpoch,
      setId: null,
      setIndex: null,
      setEpoch: this.setEpoch,
      attemptId: this.activeAttemptId ?? this.countdownAttemptId,
      attemptEpoch: this.attemptEpoch,
      type,
      ...(payload === undefined ? {} : { payload }),
    });
  }
}

function maxPriority(cues: readonly VoiceCueKey[]): number {
  return cues.reduce((priority, cue) => Math.max(priority, voicePriority(cue)), 0);
}
