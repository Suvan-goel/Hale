import type {
  TrackedVoiceRequest,
  TrackedVoiceRequestOptions,
  VoiceCancelReason,
  VoicePlaybackResult,
} from '../../../audio/voicePlayer';
import type { VoiceCueKey } from '../../../audio/cues';
import {
  EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
  TRAINING_VOICE_V2_1_AUDIO_READY,
  TRAINING_VOICE_V2_1_BEHAVIOR_READY,
  TRAINING_VOICE_V2_1_CONTROLS_READY,
  TRAINING_VOICE_V2_1_PROGRESS_READY,
  TRAINING_VOICE_V2_1_RECOVERY_READY,
  TrainingVoiceRuntimeV21,
  createTrainingVoiceRecoveryEpisodeV21,
  listTrainingVoiceControlContractsV21,
  listTrainingVoiceProgressPlanContextsV21,
  listTrainingVoiceReactiveSafetyContractsV21,
  partialWorkPolicyForTrainingVoiceRuntimeV21,
  planTrainingVoiceTransitionV21,
  resolveTrainingVoiceProgressPlanV21,
  selectTrainingVoiceRuntimeModeV21,
  shouldDeduplicateTrainingVoiceRecoveryLossV21,
  validateTrainingVoiceControlContractsV21,
  validateTrainingVoiceProgressPlansV21,
  validateTrainingVoiceReactiveSafetyContractsV21,
  validateTrainingVoiceRecoveryModelV21,
  validateTrainingVoiceTransitionPlansV21,
} from '..';

describe('Training Voice V2.1 controls/progress/recovery readiness', () => {
  it('has complete behavior gates while remaining audio/default closed', () => {
    expect(TRAINING_VOICE_V2_1_CONTROLS_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_PROGRESS_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_RECOVERY_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_BEHAVIOR_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_AUDIO_READY).toBe(false);
    expect(selectTrainingVoiceRuntimeModeV21({ exerciseIds: ['squat-free'], featureEnabled: false })).toMatchObject({
      mode: 'legacy',
      v21Selectable: false,
    });
    expect(selectTrainingVoiceRuntimeModeV21({ exerciseIds: ['squat-free'], featureEnabled: true })).toMatchObject({
      mode: 'legacy',
      v21Selectable: false,
    });
  });

  it('defines all required control contracts without missing entries', () => {
    expect(validateTrainingVoiceControlContractsV21()).toMatchObject({
      valid: true,
      controlContractCount: 6,
      missingControlContractCount: 0,
    });
    const contracts = listTrainingVoiceControlContractsV21();
    expect(contracts.map((row) => row.control).sort()).toEqual([
      'cancel',
      'pause',
      'repeat_instructions',
      'resume',
      'retry',
      'skip',
    ]);
    expect(contracts.find((row) => row.control === 'cancel')?.logicalCueKey).toBeNull();
    expect(contracts.find((row) => row.control === 'repeat_instructions')?.actionSemantics).toMatch(/current exact exercise/);
  });
});

describe('Training Voice V2.1 countdown/go boundary', () => {
  it('starts active only from go playback-start', () => {
    const voice = new FakeTrackedVoiceChannel();
    const runtime = new TrainingVoiceRuntimeV21({ voiceChannel: voice, sessionId: 's1' });
    const result = runtime.startCountdown({
      itemId: 'squat-free',
      setIndex: 0,
      attemptId: 'attempt-1',
      acceptedAtMs: 100,
    });
    expect(result.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('countdown');
    voice.startCue('countdown-three', 0, 125);
    expect(runtime.getPhase()).toBe('countdown');
    voice.startCue('countdown-two', 1, 1125);
    voice.startCue('countdown-one', 2, 2125);
    expect(runtime.getPhase()).toBe('countdown');
    voice.startCue('go', 3, 3125);
    expect(runtime.getPhase()).toBe('active');
    expect(runtime.getEvents().map((event) => event.type)).toEqual(
      expect.arrayContaining(['go_playback_started', 'active_attempt_started'])
    );
  });

  it('blocks active start when go is missing or stale', async () => {
    const voice = new FakeTrackedVoiceChannel();
    const runtime = new TrainingVoiceRuntimeV21({ voiceChannel: voice });
    const missing = runtime.startCountdown({
      itemId: 'squat-free',
      setIndex: 0,
      attemptId: 'attempt-1',
      acceptedAtMs: 100,
      physicalCueKeys: ['countdown-three', 'countdown-two', 'countdown-one'],
    });
    expect(missing).toMatchObject({ accepted: false, reason: 'missing_physical_binding' });
    expect(runtime.getPhase()).toBe('audio_failure');

    const retry = runtime.startCountdown({
      itemId: 'squat-free',
      setIndex: 0,
      attemptId: 'attempt-2',
      acceptedAtMs: 200,
    });
    runtime.requestControl({ control: 'cancel', acceptedAtMs: 250, transactionId: 'cancel-1' });
    voice.startCue('go', 3, 3250, retry.trackedRequest?.requestId);
    expect(runtime.getPhase()).toBe('cancelled');
  });
});

describe('Training Voice V2.1 controls and progress', () => {
  it('pauses before confirmation speech and resume does not start active directly', () => {
    const voice = new FakeTrackedVoiceChannel();
    const runtime = new TrainingVoiceRuntimeV21({ voiceChannel: voice });
    runtime.startCountdown({ itemId: 'squat-free', setIndex: 0, attemptId: 'a1', acceptedAtMs: 0 });
    voice.startCue('go', 3, 3000);
    const pause = runtime.requestControl({ control: 'pause', acceptedAtMs: 3100, transactionId: 'pause-1' });
    expect(pause.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('paused');
    expect(voice.cues).toContain('paused-v21');

    const resume = runtime.requestControl({ control: 'resume', acceptedAtMs: 5000, transactionId: 'resume-1' });
    expect(resume.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('item_setup');
    expect(voice.cues).toContain('resuming-v21');
  });

  it('uses exact progress schedules and drops missed progress', () => {
    expect(validateTrainingVoiceProgressPlansV21()).toMatchObject({
      valid: true,
      unsupportedProgressSilentlyApproximatedCount: 0,
      spokenRepCountCount: 0,
      defaultTwoRepsLeftCount: 0,
    });
    expect(resolveTrainingVoiceProgressPlanV21({ setType: 'hold', targetMs: 15000 }).events).toEqual([
      expect.objectContaining({ dueAtActiveElapsedMs: 10000, logicalCueKey: 'five-seconds-left-v21' }),
    ]);
    expect(resolveTrainingVoiceProgressPlanV21({ setType: 'hold', targetMs: 20000 }).events.map((event) => event.logicalCueKey)).toEqual([
      'halfway-v21',
      'five-seconds-left-v21',
    ]);
    expect(resolveTrainingVoiceProgressPlanV21({ setType: 'timer', targetMs: 30000 }).events.map((event) => event.dueAtActiveElapsedMs)).toEqual([
      15000,
      25000,
    ]);
    expect(resolveTrainingVoiceProgressPlanV21({ setType: 'rom', targetMs: 12000 }).events).toHaveLength(0);
    expect(resolveTrainingVoiceProgressPlanV21({ setType: 'side_segment', targetMs: 10000 }).events).toHaveLength(0);
    expect(resolveTrainingVoiceProgressPlanV21({ setType: 'side_segment', targetMs: 15000 }).events).toHaveLength(1);
    expect(listTrainingVoiceProgressPlanContextsV21()).toHaveLength(11);
  });

  it('fires optional progress once and never replays when busy', () => {
    const voice = new FakeTrackedVoiceChannel();
    const runtime = new TrainingVoiceRuntimeV21({ voiceChannel: voice });
    runtime.startCountdown({ itemId: 'balance-feet-together-hold', setIndex: 0, attemptId: 'a1', acceptedAtMs: 0 });
    voice.startCue('go', 3, 3000);
    runtime.beginProgressAttempt({
      attemptId: 'a1',
      plan: resolveTrainingVoiceProgressPlanV21({ setType: 'hold', targetMs: 15000 }),
    });
    expect(runtime.emitDueProgress({ attemptId: 'a1', activeElapsedMs: 10000, voiceBusy: true })).toEqual([]);
    expect(runtime.emitDueProgress({ attemptId: 'a1', activeElapsedMs: 11000, voiceBusy: false })).toEqual([]);
  });
});

describe('Training Voice V2.1 transitions, recovery, and reactive safety', () => {
  it('plans nonredundant transitions', () => {
    expect(validateTrainingVoiceTransitionPlansV21()).toMatchObject({
      valid: true,
      duplicateTransitionCount: 0,
      redundantCompletionStackCount: 0,
      bothSidesRestBetweenSidesCount: 0,
    });
    expect(
      planTrainingVoiceTransitionV21({
        setType: 'timer',
        setIndex: 0,
        setCount: 2,
        itemIndex: 0,
        itemCount: 2,
        controllerEvent: 'timed_window_completed',
        restFollows: true,
      }).cueKeys
    ).toEqual(['times-up-v21', 'rest-now-v21']);
    expect(
      planTrainingVoiceTransitionV21({
        setType: 'hold',
        setIndex: 0,
        setCount: 2,
        itemIndex: 0,
        itemCount: 2,
        controllerEvent: 'side_completed',
        bothSidesFirstSide: true,
        sideSwitchCueKey: 'switch-legs-v21',
      }).cueKeys
    ).toEqual(['switch-legs-v21']);
  });

  it('dedupes recovery episodes and documents partial-work policy', () => {
    expect(validateTrainingVoiceRecoveryModelV21()).toMatchObject({
      valid: true,
      trackingEpisodeDuplicateCount: 0,
      trackingRecoveryWithoutFreshCountdownCount: 0,
    });
    const episode = createTrainingVoiceRecoveryEpisodeV21({
      sessionId: 's1',
      itemId: 'step-up',
      setId: 'set-0',
      attemptId: 'a1',
      setRuntimeKind: 'step_up_alternation',
      lossConfirmedAtMs: 1000,
      sourceAttemptEpoch: 1,
      expectedLead: 'right',
    });
    expect(shouldDeduplicateTrainingVoiceRecoveryLossV21({ currentEpisode: episode, attemptId: 'a1', sourceAttemptEpoch: 1 })).toBe(true);
    expect(episode.freshCountdownRequired).toBe(true);
    expect(partialWorkPolicyForTrainingVoiceRuntimeV21('step_up_alternation')).toMatchObject({
      partialWorkPolicy: 'discard partial current rep attempt',
      resumeBoundary: 'both_feet_floor_readiness_then_fresh_countdown',
    });
  });

  it('classifies every deferred reactive safety cue without fake automatic detection', () => {
    const validation = validateTrainingVoiceReactiveSafetyContractsV21();
    expect(validation).toMatchObject({
      valid: true,
      reactiveSafetyCueCount: 14,
      unclassifiedReactiveSafetyCount: 0,
      fakeAutomaticDetectionCount: 0,
      healthStopAutoResumeCount: 0,
      equipmentStopAutoResumeCount: 0,
    });
    const rows = listTrainingVoiceReactiveSafetyContractsV21();
    expect(rows.find((row) => row.sourceCueId === 'tracking_pause_and_reset')).toMatchObject({
      disposition: 'tracking_recovery',
      logicalCueKey: 'tracking-loss-v21',
      autoDetectionClaimed: true,
    });
    expect(rows.find((row) => row.sourceCueId === 'band_stop_if_slips_or_shifts')).toMatchObject({
      disposition: 'equipment_correction_then_retry',
      autoDetectionClaimed: false,
    });
    expect(rows.find((row) => row.sourceCueId === 'balance_stop_if_unsteady')).toMatchObject({
      disposition: 'health_stop_no_auto_resume',
      autoDetectionClaimed: false,
    });
  });
});

describe('Training Voice V2.1 runtime serialization', () => {
  it('serializes active as safe setup and preserves safety memory/voice ids', () => {
    const voice = new FakeTrackedVoiceChannel();
    const runtime = new TrainingVoiceRuntimeV21({ voiceChannel: voice, voiceId: 'clara' });
    runtime.restoreSafetyMemory({
      ...EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      universalSafety: 'completed',
    });
    runtime.startCountdown({ itemId: 'squat-free', setIndex: 0, attemptId: 'a1', acceptedAtMs: 0 });
    voice.startCue('go', 3, 3000);
    const serialized = runtime.serializeRuntime();
    expect(serialized.phase).toBe('item_setup');
    expect(serialized.safetyMemory.universalSafety).toBe('completed');
    expect(serialized.activeVoiceId).toBe('clara');

    const restored = new TrainingVoiceRuntimeV21({ voiceChannel: new FakeTrackedVoiceChannel(), restored: serialized });
    expect(restored.getPhase()).toBe('item_setup');
  });
});

class FakeTrackedVoiceChannel {
  cues: VoiceCueKey[] = [];
  active: {
    requestId: string;
    scopeId: string;
    cues: readonly VoiceCueKey[];
    options: TrackedVoiceRequestOptions;
    resolve: (result: VoicePlaybackResult) => void;
  } | null = null;
  private nextRequest = 0;

  cancelScope = jest.fn<void, [string, VoiceCancelReason?]>((scopeId, reason = 'stage_changed') => {
    if (this.active?.scopeId === scopeId) {
      this.resolveActive('cancelled', reason);
    }
  });

  cancelActive = jest.fn<void, [VoiceCancelReason?]>((reason = 'explicit_stop') => {
    this.resolveActive('cancelled', reason);
  });

  speakTracked = jest.fn<TrackedVoiceRequest, [readonly VoiceCueKey[], TrackedVoiceRequestOptions]>((cues, options) => {
    this.nextRequest++;
    const requestId = `fake-${this.nextRequest}`;
    let resolve!: (result: VoicePlaybackResult) => void;
    const completion = new Promise<VoicePlaybackResult>((res) => {
      resolve = res;
    });
    this.cues.push(...cues);
    this.active = { requestId, scopeId: options.scopeId, cues: cues.slice(), options, resolve };
    return { requestId, accepted: cues.length > 0, completion };
  });

  startCue(cueKey: VoiceCueKey, cueIndex: number, startedAtMs: number, requestId = this.active?.requestId): void {
    if (!this.active || requestId !== this.active.requestId) return;
    this.active.options.onCueStarted?.({
      requestId: this.active.requestId,
      scopeId: this.active.scopeId,
      cueKey,
      cueIndex,
      startedAtMs,
      startEvidence: 'native_playing_status',
    });
  }

  private resolveActive(outcome: VoicePlaybackResult['outcome'], cancelReason?: VoiceCancelReason): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    active.resolve({
      requestId: active.requestId,
      scopeId: active.scopeId,
      outcome,
      accepted: outcome !== 'dropped_busy',
      required: active.options.required,
      startedCueKeys: [],
      completedCueKeys: outcome === 'completed' ? active.cues.slice() : [],
      cancelReason,
      requestedAtMs: 0,
      completedAtMs: 1,
    });
  }
}
