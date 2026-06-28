import {
  MICRO_CHECK_VOICE_TYPES_V21,
  MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY,
  MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
  MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
  MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
  MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
  MicroCheckVoiceRuntimeV21,
  assetRequirementForMicroCheckCueV21,
  listMicroCheckProtocolCompatibilityV21,
  listMicroCheckVoiceAssetRequirementsV21,
  listMicroCheckVoiceContractsV21,
  microCheckVoiceSelectableTypeCountV21,
  planMicroCheckVoiceSequenceV21,
  resolveMicroCheckVoiceRuntimeReadinessV21,
  selectMicroCheckVoiceRuntimeModeV21,
  validateMicroCheckProtocolCompatibilityV21,
  validateMicroCheckVoiceContractRegistryV21,
  type MicroCheckTrackedVoiceRequestOptionsV21,
  type MicroCheckTrackedVoiceRequestV21,
  type MicroCheckVoiceCancelReasonV21,
  type MicroCheckVoiceCueStartedEventV21,
  type MicroCheckVoiceLogicalCueKeyV21,
  type MicroCheckVoicePlaybackOutcomeV21,
  type MicroCheckVoicePlaybackResultV21,
} from '..';

describe('Micro-Check Voice V2.1 contracts', () => {
  it('defines exactly the three live micro-check contracts and exact instruction scripts', () => {
    expect(MICRO_CHECK_VOICE_TYPES_V21).toEqual([
      'chair-power',
      'single-leg-balance',
      'mobility-reach',
    ]);
    expect(validateMicroCheckVoiceContractRegistryV21()).toMatchObject({
      valid: true,
      liveMicroCheckTypeCount: 3,
      contractCount: 3,
      genericMicroIntroEmissionCount: 0,
    });
    expect(listMicroCheckVoiceContractsV21()).toEqual([
      expect.objectContaining({
        type: 'chair-power',
        sideRole: 'not_applicable',
        sideRequired: false,
        setupCueKey: 'micro-chair-power-v21',
        exactScript: 'Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable.',
        endPolicy: 'accepted_rep_target_or_cap',
        repSfxOnly: true,
        progressCueKeys: [],
      }),
      expect.objectContaining({
        type: 'single-leg-balance',
        sideRole: 'standing_leg',
        sideRequired: true,
        setupCueKey: 'micro-single-leg-left-v21',
        exactScript: 'Quick balance check. Stand on your left leg with support nearby. Hold as long as comfortable.',
        endPolicy: 'hold_end_or_cap',
        repSfxOnly: false,
        progressCueKeys: [],
      }),
      expect.objectContaining({
        type: 'mobility-reach',
        sideRole: 'not_applicable',
        sideRequired: false,
        setupCueKey: 'micro-mobility-left-v21',
        exactScript: 'Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall.',
        endPolicy: 'fixed_rom_window',
        stopCueKey: null,
        progressCueKeys: [],
      }),
    ]);
  });

  it('keeps approval/default gates closed while beta selectability uses physical audio readiness', () => {
    expect(MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY).toBe(true);
    expect(MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY).toBe(false);
    expect(MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY).toBe(false);
    expect(MICRO_CHECK_VOICE_V2_1_AUDIO_READY).toBe(false);
    expect(MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT).toBe('off');
    expect(microCheckVoiceSelectableTypeCountV21()).toBe(0);
    expect(resolveMicroCheckVoiceRuntimeReadinessV21('chair-power')).toMatchObject({
      softwareContractValid: true,
      behaviorReady: true,
      audioReady: false,
      selectable: false,
      legacyFallbackAvailable: true,
    });
    expect(
      selectMicroCheckVoiceRuntimeModeV21({
        microCheckTypes: ['chair-power', 'single-leg-balance', 'mobility-reach'],
        featureEnabled: true,
      })
    ).toMatchObject({
      mode: 'legacy',
      v21Selectable: false,
    });
    expect(microCheckVoiceSelectableTypeCountV21({ betaDefaultEnabled: true })).toBe(0);
    expect(resolveMicroCheckVoiceRuntimeReadinessV21('chair-power', { betaDefaultEnabled: true })).toMatchObject({
      audioReady: false,
      selectable: false,
      legacyFallbackAvailable: true,
    });
    expect(
      selectMicroCheckVoiceRuntimeModeV21({
        microCheckTypes: ['chair-power', 'single-leg-balance', 'mobility-reach'],
        featureEnabled: true,
        betaDefaultEnabled: true,
      })
    ).toMatchObject({
      mode: 'legacy',
      v21Selectable: false,
    });
  });
});

describe('Micro-Check Voice V2.1 sequence planning and assets', () => {
  it('plans side-specific setup, final position, and countdown without microcheck-intro', () => {
    expect(
      planMicroCheckVoiceSequenceV21({
        type: 'single-leg-balance',
        selectedSide: 'right',
        exposure: 'first_setup',
      }).cueKeys
    ).toEqual([
      'micro-single-leg-right-v21',
      'final-position-set-v21',
      'countdown-three',
      'countdown-two',
      'countdown-one',
      'go',
    ]);
    expect(
      planMicroCheckVoiceSequenceV21({
        type: 'mobility-reach',
        exposure: 'repeat_instructions',
      }).cueKeys
    ).toEqual(['micro-mobility-left-v21']);
    const allCueKeys = listMicroCheckVoiceAssetRequirementsV21().map((row) => row.logicalCueKey);
    expect(allCueKeys).not.toContain('microcheck-intro' as MicroCheckVoiceLogicalCueKeyV21);
  });

  it('uses generated exact logical cues without reusing semantically wrong legacy audio', () => {
    expect(assetRequirementForMicroCheckCueV21('micro-relax-v21')).toMatchObject({
      exactScript: 'Relax.',
      currentCandidateKey: 'micro-relax-v21',
      semanticMatch: true,
      reuseDecision: 'reuse_exact_existing_pair',
      generationRequiredLater: false,
    });
    expect(assetRequirementForMicroCheckCueV21('microcheck-complete-v21')).toMatchObject({
      exactScript: 'Check complete.',
      currentCandidateKey: 'microcheck-complete-v21',
      semanticMatch: true,
      generationRequiredLater: false,
    });
    expect(assetRequirementForMicroCheckCueV21('go')).toMatchObject({
      exactScript: 'Go!',
      reuseDecision: 'reuse_exact_existing_pair',
      generationRequiredLater: false,
    });
  });
});

describe('Micro-Check Voice V2.1 protocol compatibility', () => {
  it('requires new protocol versions and preserves old history', () => {
    expect(validateMicroCheckProtocolCompatibilityV21()).toMatchObject({
      valid: true,
      compatibilityRowCount: 3,
      newProtocolVersionRequiredCount: 3,
      directComparisonAllowedCount: 0,
      oldHistoryNotPreservedCount: 0,
      missingRegisteredProtocolCount: 0,
    });
    expect(listMicroCheckProtocolCompatibilityV21()).toEqual([
      expect.objectContaining({
        microCheckType: 'chair-power',
        oldProtocol: { protocolId: 'micro_chair_power_5_reps_v1', protocolVersion: 1 },
        newProtocol: { protocolId: 'micro_chair_power_5_reps_v21', protocolVersion: 2 },
        classification: 'new_protocol_version_required',
        directComparisonAllowed: false,
        oldHistoryPreserved: true,
        newSeriesRequired: true,
      }),
      expect.objectContaining({
        microCheckType: 'single-leg-balance',
        newProtocol: { protocolId: 'micro_single_leg_balance_v21', protocolVersion: 2 },
      }),
      expect.objectContaining({
        microCheckType: 'mobility-reach',
        newProtocol: { protocolId: 'micro_mobility_reach_v21', protocolVersion: 2 },
      }),
    ]);
  });
});

describe('Micro-Check Voice V2.1 runtime', () => {
  it('starts active only from countdown go playback-start evidence', () => {
    const voice = new FakeMicroCheckVoiceChannel();
    const runtime = new MicroCheckVoiceRuntimeV21({ voiceChannel: voice, flowId: 'flow-1' });
    const result = runtime.startCountdown({
      type: 'chair-power',
      atMs: 100,
      attemptId: 'attempt-1',
    });
    expect(result.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('countdown');
    voice.startCue('countdown-three', 0, 125);
    voice.startCue('countdown-two', 1, 1125);
    voice.startCue('countdown-one', 2, 2125);
    expect(runtime.getPhase()).toBe('countdown');
    voice.startCue('go', 3, 3125);
    expect(runtime.getPhase()).toBe('active');
    expect(runtime.getEvents().map((event) => event.type)).toEqual(
      expect.arrayContaining(['go_playback_started', 'active_started'])
    );
  });

  it('blocks missing go and ignores stale go callbacks', () => {
    const voice = new FakeMicroCheckVoiceChannel();
    const runtime = new MicroCheckVoiceRuntimeV21({ voiceChannel: voice });
    const missing = runtime.startCountdown({
      type: 'chair-power',
      atMs: 100,
      attemptId: 'attempt-1',
      physicalCueKeys: ['countdown-three', 'countdown-two', 'countdown-one'],
    });
    expect(missing).toMatchObject({ accepted: false, reason: 'missing_physical_binding' });
    expect(runtime.getPhase()).toBe('audio_failure');

    const staleSource = runtime.startCountdown({
      type: 'chair-power',
      atMs: 200,
      attemptId: 'attempt-2',
    });
    const fresh = runtime.startCountdown({
      type: 'chair-power',
      atMs: 300,
      attemptId: 'attempt-3',
    });
    voice.dispatchCueStarted({
      requestId: staleSource.trackedRequest?.requestId ?? 'missing',
      scopeId: staleSource.scopeId ?? 'missing',
      cueKey: 'go',
      cueIndex: 3,
      startedAtMs: 3200,
      startEvidence: 'native_playing_status',
    });
    expect(runtime.getPhase()).toBe('countdown');
    voice.dispatchCueStarted({
      requestId: fresh.trackedRequest?.requestId ?? 'missing',
      scopeId: fresh.scopeId ?? 'missing',
      cueKey: 'go',
      cueIndex: 3,
      startedAtMs: 3300,
      startEvidence: 'native_playing_status',
    });
    expect(runtime.getPhase()).toBe('active');
    expect(runtime.getEvents().map((event) => event.type)).toContain('stale_callback_ignored');
  });

  it('pause, resume, retry, and discard never preserve a partial active result', () => {
    const voice = new FakeMicroCheckVoiceChannel();
    const runtime = new MicroCheckVoiceRuntimeV21({ voiceChannel: voice });
    const countdown = runtime.startCountdown({
      type: 'chair-power',
      atMs: 0,
      attemptId: 'attempt-1',
    });
    voice.dispatchCueStarted({
      requestId: countdown.trackedRequest?.requestId ?? 'missing',
      scopeId: countdown.scopeId ?? 'missing',
      cueKey: 'go',
      cueIndex: 3,
      startedAtMs: 3000,
      startEvidence: 'native_playing_status',
    });
    expect(runtime.getPhase()).toBe('active');
    const pause = runtime.pause({ atMs: 3200, transactionId: 'pause-1' });
    expect(pause.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('paused');
    expect(runtime.getActiveAttemptId()).toBeNull();
    expect(voice.cues).toContain('paused-v21');

    const resume = runtime.resume({ atMs: 4500, transactionId: 'resume-1' });
    expect(resume.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('instruction');
    expect(voice.cues).toContain('resuming-v21');

    const retry = runtime.retry({ atMs: 4600, transactionId: 'retry-1' });
    expect(retry.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('instruction');
    expect(voice.cues).toContain('retry-v21');

    const discard = runtime.discard({ atMs: 4700, transactionId: 'discard-1' });
    expect(discard.accepted).toBe(true);
    expect(runtime.getPhase()).toBe('discarded');
    expect(runtime.getActiveAttemptId()).toBeNull();
    expect(voice.cues).toContain('micro-discard-v21');
  });

  it('dedupes tracking loss and requires setup plus fresh countdown after recovery', () => {
    const voice = new FakeMicroCheckVoiceChannel();
    const runtime = new MicroCheckVoiceRuntimeV21({ voiceChannel: voice, flowId: 'flow-recovery' });
    const countdown = runtime.startCountdown({
      type: 'single-leg-balance',
      selectedSide: 'left',
      atMs: 0,
      attemptId: 'attempt-1',
    });
    voice.dispatchCueStarted({
      requestId: countdown.trackedRequest?.requestId ?? 'missing',
      scopeId: countdown.scopeId ?? 'missing',
      cueKey: 'go',
      cueIndex: 3,
      startedAtMs: 3000,
      startEvidence: 'native_playing_status',
    });
    const first = runtime.handleTrackingLoss({
      type: 'single-leg-balance',
      selectedSide: 'left',
      atMs: 3500,
    });
    const second = runtime.handleTrackingLoss({
      type: 'single-leg-balance',
      selectedSide: 'left',
      atMs: 3600,
    });
    expect(second).toEqual(first);
    expect(voice.cues.filter((cue) => cue === 'tracking-loss-v21')).toHaveLength(1);

    const recovered = runtime.markTrackingRecovered({ atMs: 5000 });
    expect(recovered).toMatchObject({
      stableRecoveryReached: true,
      recoveredCueRequested: true,
      freshCountdownRequired: true,
    });
    expect(runtime.getPhase()).toBe('instruction');
    expect(voice.cues).toContain('tracking-recovered-v21');
    expect(
      planMicroCheckVoiceSequenceV21({
        type: 'single-leg-balance',
        selectedSide: 'left',
        exposure: 'recovery_setup',
      }).cueKeys
    ).toEqual([
      'micro-single-leg-left-v21',
      'final-position-set-v21',
      'countdown-three',
      'countdown-two',
      'countdown-one',
      'go',
    ]);
  });
});

class FakeMicroCheckVoiceChannel {
  cues: MicroCheckVoiceLogicalCueKeyV21[] = [];
  active: {
    requestId: string;
    scopeId: string;
    cues: readonly MicroCheckVoiceLogicalCueKeyV21[];
    options: MicroCheckTrackedVoiceRequestOptionsV21;
    resolve: (result: MicroCheckVoicePlaybackResultV21) => void;
  } | null = null;
  private readonly requests = new Map<string, MicroCheckTrackedVoiceRequestOptionsV21 & { scopeId: string }>();
  private nextRequest = 0;

  cancelScope = jest.fn<void, [string, MicroCheckVoiceCancelReasonV21?]>((scopeId, reason = 'stage_changed') => {
    if (this.active?.scopeId === scopeId) {
      this.resolveActive('cancelled', reason);
    }
  });

  cancelActive = jest.fn<void, [MicroCheckVoiceCancelReasonV21?]>((reason = 'explicit_stop') => {
    this.resolveActive('cancelled', reason);
  });

  speakTracked = jest.fn<
    MicroCheckTrackedVoiceRequestV21,
    [readonly MicroCheckVoiceLogicalCueKeyV21[], MicroCheckTrackedVoiceRequestOptionsV21]
  >((cues, options) => {
    this.nextRequest += 1;
    const requestId = `fake-${this.nextRequest}`;
    let resolve!: (result: MicroCheckVoicePlaybackResultV21) => void;
    const completion = new Promise<MicroCheckVoicePlaybackResultV21>((res) => {
      resolve = res;
    });
    this.cues.push(...cues);
    this.requests.set(requestId, { ...options, scopeId: options.scopeId });
    this.active = { requestId, scopeId: options.scopeId, cues: cues.slice(), options, resolve };
    return { requestId, accepted: cues.length > 0, completion };
  });

  startCue(cueKey: MicroCheckVoiceLogicalCueKeyV21, cueIndex: number, startedAtMs: number): void {
    if (!this.active) return;
    this.dispatchCueStarted({
      requestId: this.active.requestId,
      scopeId: this.active.scopeId,
      cueKey,
      cueIndex,
      startedAtMs,
      startEvidence: 'native_playing_status',
    });
  }

  dispatchCueStarted(event: MicroCheckVoiceCueStartedEventV21): void {
    const options = this.requests.get(event.requestId);
    options?.onCueStarted?.(event);
  }

  private resolveActive(
    outcome: MicroCheckVoicePlaybackOutcomeV21,
    cancelReason?: MicroCheckVoiceCancelReasonV21
  ): void {
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
