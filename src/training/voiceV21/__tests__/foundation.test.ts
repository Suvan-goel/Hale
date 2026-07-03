import { listExercises, resolveExerciseLevel } from '../../../exercises';
import {
  EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
  TRAINING_VOICE_V2_1_AUDIO_READY,
  TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY,
  TRAINING_VOICE_V2_1_BEHAVIOR_READY,
  TRAINING_VOICE_V2_1_CONTROLS_READY,
  TRAINING_VOICE_V2_1_FEATURE_FLAG,
  TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
  TRAINING_VOICE_V2_1_PROGRESS_READY,
  TRAINING_VOICE_V2_1_RECOVERY_READY,
  TRAINING_VOICE_V2_1_SAFETY_READY,
  TrainingVoiceRuntimeV21,
  allTrainingVoiceLogicalCuesV21,
  completeTrainingVoiceFamilySafetyV21,
  completeTrainingVoiceSessionEntrySafetyV21,
  getTrainingVoiceContractV21,
  isTrainingVoiceSafetyFamilyIntroducedV21,
  listTrainingVoiceSafetyCueMigrationV21,
  listTrainingVoiceAssetRequirementsV21,
  listTrainingVoiceContractsV21,
  normalizeTrainingVoiceSafetySessionMemoryV21,
  planTrainingVoiceSequenceV21,
  planTrainingVoiceSessionEntrySequenceV21,
  rememberTrainingVoiceSafetyFamilyV21,
  resolveTrainingVoiceRuntimeReadinessV21,
  resolveTrainingVoiceSafetyV21,
  resolveTrainingVoiceTargetV21,
  selectTrainingVoiceRuntimeModeV21,
  validateTrainingVoiceSafetyCueMigrationV21,
  validateTrainingVoiceContractRegistryV21,
  type TrainingVoiceLateralityV21,
} from '..';
import { deriveStepUpAlternationPlanForExerciseId } from '../../stepUpAlternation';
import { resolveExerciseSafetyCueProfile } from '../../safetyCues';
import type { VoiceCancelReason, VoicePlaybackResult, TrackedVoiceRequest } from '../../../audio/voicePlayer';
import type { VoiceCueKey } from '../../../audio/cues';

const BOTH_SIDES_IDS = [
  'balance-single-leg-hold',
  'balance-tandem-hold',
  'chair-supported-split-squat',
  'seated-hamstring-reach',
  'supported-hip-flexor-stretch',
  'wall-calf-stretch',
] as const;

describe('Training Voice V2.1 contract registry', () => {
  it('maps every live exact exercise once and only once', () => {
    const validation = validateTrainingVoiceContractRegistryV21();
    expect(validation).toMatchObject({
      liveExerciseCount: 37,
      contractCount: 37,
      expectedCount: 37,
      missingContractIds: [],
      staleExtraContractIds: [],
      duplicateContractIds: [],
      duplicateLogicalCueKeys: [],
      bilateralSidePolicyErrorIds: [],
      activeSetCountCueCount: 0,
      semanticMismatchCount: 0,
      valid: true,
    });
    expect(listTrainingVoiceContractsV21().map((contract) => contract.exerciseId).sort()).toEqual(
      listExercises().map((exercise) => exercise.id).sort()
    );
  });

  it('reconciles release status, set kind, equipment, and source evidence to live source', () => {
    for (const exercise of listExercises()) {
      const contract = getTrainingVoiceContractV21(exercise.id);
      const level = resolveExerciseLevel(exercise.id).level;
      expect(contract.releaseStatus).toBe(level.releaseStatus);
      expect(contract.liveKind).toBe(exercise.kind);
      expect(contract.setType).toBe(exercise.kind);
      expect(contract.currentSetCount).toBe(exercise.prescription.sets);
      expect(contract.equipment.slice().sort()).toEqual(exercise.equipment.slice().sort());
      expect(contract.sourceFiles).toEqual(expect.arrayContaining(['src/exercises/ladders.ts']));
      expect(contract.firstUseCue.exactScript).toBeTruthy();
      expect(contract.laterSetCue.exactScript).toBeTruthy();
      expect(contract.targetCue.exactScript).toBeTruthy();
    }
  });

  it('keeps historically broad legacy family cues out of exact first-use mappings', () => {
    expect(getTrainingVoiceContractV21('chair-supported-split-squat').firstUseCue.exactScript).toMatch(/split squat/i);
    expect(getTrainingVoiceContractV21('toe-raise-supported').firstUseCue.exactScript).toMatch(/toe raise/i);
    expect(getTrainingVoiceContractV21('glute-bridge-hold').firstUseCue.exactScript).toMatch(/hold/i);
    expect(getTrainingVoiceContractV21('glute-bridge-reps').firstUseCue.exactScript).toMatch(/lower.*with control/i);
    expect(getTrainingVoiceContractV21('hip-hinge-wall').firstUseCue.exactScript).toMatch(/Wall-tap/i);
    expect(getTrainingVoiceContractV21('hip-hinge-free').firstUseCue.exactScript).toMatch(/^Hip hinge/i);
    expect(getTrainingVoiceContractV21('push-up-incline').firstUseCue.exactScript).toMatch(/counter or sturdy chair/i);
    expect(getTrainingVoiceContractV21('overhead-press-band').firstUseCue.exactScript).toMatch(/Band overhead press/i);
    expect(getTrainingVoiceContractV21('loaded-march').firstUseCue.exactScript).toMatch(/^March in place/i);
    expect(getTrainingVoiceContractV21('loaded-march').notes).toMatch(/unloaded supported march/i);
  });

  it('does not use prohibited active script language', () => {
    const prohibited = /\b(V1|logged|framed|reset|tracking pipeline|official side schedule|approved side|approved leg|just for the camera|workout|failed|frail|fall risk|medical-grade)\b/i;
    for (const cue of allTrainingVoiceLogicalCuesV21()) {
      expect(cue.exactScript).not.toMatch(prohibited);
    }
  });
});

describe('Training Voice V2.1 laterality', () => {
  it('blocks both-sides round items and carries explicit variants', () => {
    for (const exerciseId of BOTH_SIDES_IDS) {
      const contract = getTrainingVoiceContractV21(exerciseId);
      expect(contract.laterality).toBe('both_sides_round_required');
      expect(contract.sidePlan.required).toBe(true);
      expect(contract.sidePlan.variants).toHaveLength(2);
      expect(contract.sidePlan.switchCue?.key).toMatch(/^switch-/);
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-ROUND-STATE');
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-DOSE-CONVERSION');
      expect(resolveTrainingVoiceRuntimeReadinessV21({ exerciseId }).selectable).toBe(false);
    }
  });

  it('guards bilateral categories from side scheduling', () => {
    const noSideLaterality: TrainingVoiceLateralityV21[] = [
      'bilateral_simultaneous',
      'alternating_within_set',
      'bilateral_sequential_within_set',
      'both_sides_not_scored_separately',
    ];
    for (const contract of listTrainingVoiceContractsV21()) {
      if (!noSideLaterality.includes(contract.laterality)) continue;
      expect(contract.sidePlan.required).toBe(false);
      expect(contract.sidePlan.switchCue).toBeNull();
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-ROUND-STATE');
    }
  });

  it('represents mini-band and step-up founder decisions without changing live dose', () => {
    const miniBand = getTrainingVoiceContractV21('mini-band-lateral-walk');
    expect(miniBand.firstUseCue.exactScript).toMatch(/band above your knees/i);
    expect(miniBand.sidePlan.schedule).toBe('both_directions_within_timed_set');
    expect(miniBand.implementationRequirements).not.toContain('IR-VOICE-ROUND-STATE');

    const stepUp = getTrainingVoiceContractV21('step-up');
    expect(stepUp.targetPlan.spokenText).toBe('Do twelve total reps. Move carefully, and set both feet on the floor after each rep.');
    expect(stepUp.laterality).toBe('alternating_lead_leg_each_rep');
    expect(stepUp.sidePlan.required).toBe(true);
    expect(stepUp.sidePlan.variants.map((variant) => variant.variantId)).toEqual(['left', 'right']);
    expect(stepUp.sidePlan.switchCue).toBeNull();
    expect(stepUp.livePrescription.repsPerSet).toBe(12);
    expect(stepUp.implementationRequirements).not.toContain('IR-VOICE-STEP-ALTERNATION');
    expect(stepUp.implementationRequirements).not.toContain('IR-VOICE-SAFETY-SUBSUMPTION');
    expect(resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: 'step-up' }).selectable).toBe(false);
  });
});

describe('Training Voice V2.1 target grammar', () => {
  it('resolves every default target from the live prescription', () => {
    for (const contract of listTrainingVoiceContractsV21()) {
      const target = resolveTrainingVoiceTargetV21({ contract });
      expect(target.supported).toBe(true);
      expect(target.visibleText).toBe(target.spokenText);
      expect(target.spokenText).not.toMatch(/sets today|set one of/i);
    }
  });

  it('resolves generated-session target scaling without rounding or nearby substitution', () => {
    const squat = getTrainingVoiceContractV21('squat-free');
    expect(resolveTrainingVoiceTargetV21({ contract: squat, prescribedTarget: { repsPerSet: 7 } })).toMatchObject({
      supported: true,
      spokenText: 'Aim for seven reps.',
      value: 7,
    });

    const balance = getTrainingVoiceContractV21('balance-feet-together-hold');
    expect(resolveTrainingVoiceTargetV21({ contract: balance, prescribedTarget: { secondsPerSet: 17 } })).toMatchObject({
      supported: true,
      spokenText: "Hold for seventeen seconds. Breathe normally, and I'll tell you when to stop.",
      value: 17,
    });
  });

  it('fails closed for unsupported or non-integer targets', () => {
    const squat = getTrainingVoiceContractV21('squat-free');
    expect(resolveTrainingVoiceTargetV21({ contract: squat, prescribedTarget: { repsPerSet: 7.5 } })).toMatchObject({
      supported: false,
      reasonCodes: ['non_integer_target'],
    });
    const neck = getTrainingVoiceContractV21('neck-rotation');
    expect(resolveTrainingVoiceTargetV21({ contract: neck, prescribedTarget: { secondsPerSet: 13 } })).toMatchObject({
      supported: false,
      reasonCodes: ['unsupported_seconds'],
    });
  });
});

describe('Training Voice V2.1 safety planner', () => {
  it('classifies every canonical atomic safety cue exactly once', () => {
    const migration = validateTrainingVoiceSafetyCueMigrationV21();
    expect(migration).toEqual({ valid: true, unclassifiedCueIds: [] });
    expect(listTrainingVoiceSafetyCueMigrationV21()).toHaveLength(44);
  });

  it('uses most-specific wins and instruction absorption', () => {
    expect(resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('standing-band-row') })).toMatchObject({
      dueFamily: 'door_anchor_band',
      absorbedIntoInstruction: false,
      logicalCueKey: 'equip-door-anchor-v21',
      subsumedFamilies: ['long_band_handheld_or_foot_anchored'],
    });
    expect(resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('mini-band-lateral-walk') })).toMatchObject({
      dueFamily: 'mini_band_above_knees',
      absorbedIntoInstruction: true,
      logicalCueKey: null,
    });
    expect(resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('band-pull-apart') })).toMatchObject({
      dueFamily: 'long_band_handheld_or_foot_anchored',
      absorbedIntoInstruction: false,
      logicalCueKey: 'equip-long-band-v21',
      ready: true,
    });
  });

  it('does not repeat equipment-family safety once introduced', () => {
    const memory = rememberTrainingVoiceSafetyFamilyV21(
      EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      'long_band_handheld_or_foot_anchored'
    );
    expect(resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('band-pull-apart'), sessionMemory: memory })).toMatchObject({
      dueFamily: 'long_band_handheld_or_foot_anchored',
      logicalCueKey: null,
      reasonCodes: ['FAMILY_ALREADY_INTRODUCED'],
    });
  });

  it('retains source safety profile fingerprints and fails closed on stale profiles', () => {
    const profile = resolveExerciseSafetyCueProfile('step-up');
    if (!profile) throw new Error('missing step-up safety profile');
    const current = resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('step-up'), sourceSafetyProfile: profile });
    expect(current.sourceSafetyProfileSchemaVersion).toBe(1);
    expect(current.sourceSafetyProfileFingerprint).toMatch(/^safety-cues-v1-/);
    expect(current.sourceSafetyCueIds).toContain('step_use_low_stable_step');
    expect(current.reactiveSafetyCueIdsDeferred).toContain('step_stop_if_unstable');

    const stale = {
      ...profile,
      setupCueIds: profile.setupCueIds.filter((cue) => cue !== 'step_use_low_stable_step'),
    };
    expect(resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('step-up'), sourceSafetyProfile: stale })).toMatchObject({
      ready: false,
      reasonCodes: expect.arrayContaining(['SAFETY_PROFILE_STALE']),
    });
  });

  it('delegates floor-family memory to TrainingFloorSessionMemory', () => {
    const memory = rememberTrainingVoiceSafetyFamilyV21(
      EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      'floor_eligible_user'
    );
    expect(memory.introducedSafetyFamilies).not.toContain('floor_eligible_user');
    expect(memory.floor.floorFamilyIntroduced).toBe(true);
    expect(isTrainingVoiceSafetyFamilyIntroducedV21(memory, 'floor_eligible_user')).toBe(true);
  });
});

describe('Training Voice V2.1 sequence planner', () => {
  it('plans first-use, later-set, and repeat orders without set-count setup cues', () => {
    const first = planTrainingVoiceSequenceV21({ exerciseId: 'band-pull-apart', exposure: 'first_use' });
    expect(first.cueKeys).toEqual([
      'equip-long-band-v21',
      'ex-band-pull-apart-first-v21',
      'final-position-set-v21',
      'target-band-pull-apart-v21',
    ]);
    expect(first.scripts.join(' ')).not.toMatch(/sets today|set one of/i);

    const later = planTrainingVoiceSequenceV21({ exerciseId: 'band-pull-apart', exposure: 'later_set' });
    expect(later.cueKeys).toEqual(['ex-band-pull-apart-next-v21', 'target-band-pull-apart-v21']);

    const repeat = planTrainingVoiceSequenceV21({ exerciseId: 'band-pull-apart', exposure: 'repeat_instructions' });
    expect(repeat.cueKeys).toEqual(['ex-band-pull-apart-first-v21', 'target-band-pull-apart-v21']);
  });

  it('plans session entry as one universal required sequence and omits it after completion', () => {
    const first = planTrainingVoiceSessionEntrySequenceV21();
    expect(first).toMatchObject({
      cueKeys: ['training-intro-v21', 'safe-session-start-v21'],
      required: true,
      universalSafetyDue: true,
      ready: true,
    });
    const completedMemory = completeTrainingVoiceSessionEntrySafetyV21({
      memory: EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      expectedScopeId: 'training:session:entry',
      result: playbackResult('training:session:entry', 'completed'),
    });
    expect(planTrainingVoiceSessionEntrySequenceV21({ sessionMemory: completedMemory })).toMatchObject({
      cueKeys: [],
      universalSafetyDue: false,
    });
  });

  it('includes side cues only when required', () => {
    const first = planTrainingVoiceSequenceV21({ exerciseId: 'balance-single-leg-hold', exposure: 'first_use' });
    expect(first.cueKeys).toEqual([
      'ex-balance-single-leg-hold-first-v21',
      'side-single-leg-left-v21',
      'final-position-set-v21',
      'target-balance-single-leg-hold-v21',
    ]);

    const laterSame = planTrainingVoiceSequenceV21({ exerciseId: 'balance-single-leg-hold', exposure: 'later_set' });
    expect(laterSame.cueKeys).toEqual(['ex-balance-single-leg-hold-next-v21', 'target-balance-single-leg-hold-v21']);

    const laterChanged = planTrainingVoiceSequenceV21({
      exerciseId: 'balance-single-leg-hold',
      exposure: 'later_set',
      sideContext: { currentVariantId: 'right', sideChanged: true },
    });
    expect(laterChanged.cueKeys).toEqual([
      'ex-balance-single-leg-hold-next-v21',
      'switch-legs-v21',
      'side-single-leg-right-v21',
      'target-balance-single-leg-hold-v21',
    ]);
  });

  it('plans step-up start-lead and wrong-lead correction cues from the alternation plan', () => {
    const plan = deriveStepUpAlternationPlanForExerciseId('left');
    const first = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'first_use',
      stepUpContext: { plan, setIndex: 0 },
    });
    expect(first.cueKeys).toEqual([
      'ex-step-up-first-v21',
      'step-up-start-left-v21',
      'final-position-set-v21',
      'target-step-up-v21',
    ]);
    expect(first.targetPlan.reasonCodes).toEqual(['target_derived_from_step_up_alternation_plan']);

    const later = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'later_set',
      stepUpContext: { plan, setIndex: 1 },
    });
    expect(later.cueKeys).toEqual([
      'ex-step-up-next-v21',
      'step-up-start-right-v21',
      'final-position-set-v21',
      'target-step-up-v21',
    ]);

    const correction = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'wrong_lead_correction',
      stepUpContext: { plan, setIndex: 1, expectedLeadSide: 'right' },
    });
    expect(correction.cueKeys).toEqual(['step-up-wrong-right-v21', 'final-position-set-v21']);
  });

  it('returns blockers rather than silently approximating unsupported targets', () => {
    const plan = planTrainingVoiceSequenceV21({
      exerciseId: 'neck-rotation',
      exposure: 'first_use',
      prescription: { secondsPerSet: 13 },
    });
    expect(plan.ready).toBe(false);
    expect(plan.reasonCodes).toContain('target:unsupported_seconds');
  });

  it('plans floor transition once before exact instruction and never repeats the capability question', () => {
    const first = planTrainingVoiceSequenceV21({ exerciseId: 'glute-bridge-hold', exposure: 'first_use' });
    expect(first.cueKeys).toEqual([
      'equip-floor-transition-v21',
      'ex-glute-bridge-hold-first-v21',
      'final-position-set-v21',
      'target-glute-bridge-hold-v21',
    ]);
    expect(first.cueKeys).not.toContain('floor-gate-question-v21');

    const later = planTrainingVoiceSequenceV21({ exerciseId: 'glute-bridge-hold', exposure: 'later_set' });
    expect(later.cueKeys).toEqual([
      'ex-glute-bridge-hold-next-v21',
      'target-glute-bridge-hold-v21',
    ]);

    const repeat = planTrainingVoiceSequenceV21({ exerciseId: 'glute-bridge-hold', exposure: 'repeat_instructions' });
    expect(repeat.cueKeys).toEqual([
      'ex-glute-bridge-hold-first-v21',
      'target-glute-bridge-hold-v21',
    ]);
    expect(repeat.cueKeys).not.toContain('floor-gate-question-v21');
    expect(repeat.cueKeys).not.toContain('final-position-set-v21');
  });
});

describe('Training Voice V2.1 runtime and asset gates', () => {
  it('keeps approval/default gates closed while beta selectability uses physical audio readiness', () => {
    const physicalAudioReady = listTrainingVoiceAssetRequirementsV21().every((row) => !row.generationRequiredLater);
    expect(TRAINING_VOICE_V2_1_FEATURE_FLAG).toBe('EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1');
    expect(TRAINING_VOICE_V2_1_SAFETY_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_CONTROLS_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_PROGRESS_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_RECOVERY_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_BEHAVIOR_READY).toBe(true);
    expect(TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY).toBe(physicalAudioReady);
    expect(TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY).toBe(false);
    expect(TRAINING_VOICE_V2_1_AUDIO_READY).toBe(false);
    expect(selectTrainingVoiceRuntimeModeV21({ exerciseIds: ['squat-free'], featureEnabled: false })).toMatchObject({
      mode: 'legacy',
      v21Selectable: false,
    });
    expect(selectTrainingVoiceRuntimeModeV21({ exerciseIds: ['squat-free'], featureEnabled: true })).toMatchObject({
      mode: 'legacy',
      v21Selectable: false,
    });
    const betaSelection = selectTrainingVoiceRuntimeModeV21({
      exerciseIds: ['squat-free'],
      featureEnabled: true,
      betaDefaultEnabled: true,
    });
    expect(betaSelection).toMatchObject({
      mode: physicalAudioReady ? 'training_voice_v2_1' : 'legacy',
      v21Selectable: physicalAudioReady,
    });
    if (!physicalAudioReady) {
      expect(betaSelection.reasonCodes).toContain('physical_audio_surface_ready_false');
    }
    const betaReadiness = resolveTrainingVoiceRuntimeReadinessV21({
      exerciseId: 'squat-free',
      betaDefaultEnabled: true,
    });
    expect(betaReadiness).toMatchObject({
      audioReady: physicalAudioReady,
      selectable: physicalAudioReady,
      legacyFallbackAvailable: true,
    });
    if (!physicalAudioReady) {
      expect(betaReadiness.blockers).toContain('global_physical_audio_surface_ready_false');
    }
    expect(
      selectTrainingVoiceRuntimeModeV21({
        exerciseIds: ['squat-free'],
        featureEnabled: true,
        betaDefaultEnabled: true,
      })
    ).toEqual(betaSelection);
  });

  it('fails closed for unknown exercises and keeps one voice mode per session', () => {
    const selection = selectTrainingVoiceRuntimeModeV21({ exerciseIds: ['unknown-exercise'], featureEnabled: true });
    expect(selection.mode).toBe('legacy');
    expect(selection.itemReadiness[0]).toMatchObject({
      softwareContractValid: false,
      selectable: false,
      legacyFallbackAvailable: true,
    });
    expect(selection.reasonCodes).toContain('missing_contract:unknown-exercise');
  });

  it('tracks required runtime speech only when the plan is ready and bound to physical cue keys', () => {
    const voice = new FakeTrackedVoiceChannel();
    const runtime = new TrainingVoiceRuntimeV21({ voiceChannel: voice });
    const scope = runtime.beginStage('test');
    const plan = planTrainingVoiceSequenceV21({ exerciseId: 'squat-free', exposure: 'first_use' });
    expect(runtime.speakRequiredSequence({ plan, stageScopeId: scope, physicalCueKeys: [] })).toMatchObject({
      accepted: false,
      reason: 'plan_not_ready',
    });
    expect(runtime.speakRequiredSequence({ plan, stageScopeId: 'stale', physicalCueKeys: [] })).toMatchObject({
      accepted: false,
      reason: 'stale_stage',
    });
  });

  it('marks safety memory only from completed tracked required outcomes', () => {
    const incomplete = completeTrainingVoiceSessionEntrySafetyV21({
      memory: EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      expectedScopeId: 'training:session:entry',
      result: playbackResult('training:session:entry', 'cancelled'),
    });
    expect(incomplete.universalSafety).toBe('not_started');

    const completed = completeTrainingVoiceSessionEntrySafetyV21({
      memory: EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      expectedScopeId: 'training:session:entry',
      result: playbackResult('training:session:entry', 'completed'),
    });
    expect(completed.universalSafety).toBe('completed');

    const plan = resolveTrainingVoiceSafetyV21({ contract: getTrainingVoiceContractV21('band-pull-apart') });
    const staleFamily = completeTrainingVoiceFamilySafetyV21({
      memory: completed,
      plan,
      expectedScopeId: 'training:item:band-pull-apart:first-use',
      result: playbackResult('training:item:other:first-use', 'completed'),
    });
    expect(isTrainingVoiceSafetyFamilyIntroducedV21(staleFamily, 'long_band_handheld_or_foot_anchored')).toBe(false);

    const introduced = completeTrainingVoiceFamilySafetyV21({
      memory: completed,
      plan,
      expectedScopeId: 'training:item:band-pull-apart:first-use',
      result: playbackResult('training:item:band-pull-apart:first-use', 'completed'),
    });
    expect(isTrainingVoiceSafetyFamilyIntroducedV21(introduced, 'long_band_handheld_or_foot_anchored')).toBe(true);
  });

  it('normalizes valid restored safety memory and rejects malformed memory', () => {
    const normalized = normalizeTrainingVoiceSafetySessionMemoryV21({
      ...EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      introducedSafetyFamilies: ['chair_seat', 'chair_seat'],
    });
    expect(normalized?.introducedSafetyFamilies).toEqual(['chair_seat']);
    expect(normalizeTrainingVoiceSafetySessionMemoryV21({ version: 1, universalSafety: 'maybe' })).toBeNull();
  });

  it('records generated logical asset requirements while keeping approval gates closed', () => {
    const rows = listTrainingVoiceAssetRequirementsV21();
    const pending = rows.filter((row) => row.generationRequiredLater);
    expect(rows.length).toBe(allTrainingVoiceLogicalCuesV21().length);
    expect(rows.filter((row) => row.reuseDecision === 'reuse_exact_existing_pair').length).toBeGreaterThan(0);
    expect(rows.filter((row) => row.reuseDecision === 'new_pair_required')).toHaveLength(0);
    expect(rows.filter((row) => row.reuseDecision === 'existing_pair_script_mismatch')).toHaveLength(pending.length);
    expect(pending.every((row) => row.reuseDecision === 'existing_pair_script_mismatch')).toBe(true);
    expect(rows.find((row) => row.logicalCueKey === 'ex-squat-free-first-v21')).toMatchObject({
      currentCandidateKey: 'ex-squat-free-first-v21',
      claraStatus: 'exists',
      marcusStatus: 'exists',
      semanticMatch: true,
      generationRequiredLater: false,
    });
  });

  it('removes completed floor and safety blockers while keeping audio/global behaviour pending', () => {
    for (const exerciseId of ['glute-bridge-hold', 'glute-bridge-reps', 'push-up-standard', 'step-up']) {
      const contract = getTrainingVoiceContractV21(exerciseId);
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-FLOOR-GATE');
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-FINAL-POSITION-READINESS');
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-SAFETY-SUBSUMPTION');
      expect(contract.runtimeStatus).toBe('software_ready_audio_pending');
      expect(resolveTrainingVoiceRuntimeReadinessV21({ exerciseId }).blockers).toEqual(
        expect.arrayContaining(['global_audio_ready_false'])
      );
      expect(resolveTrainingVoiceRuntimeReadinessV21({ exerciseId }).blockers).not.toContain('global_behavior_ready_false');
    }
  });
});

function playbackResult(scopeId: string, outcome: VoicePlaybackResult['outcome']): VoicePlaybackResult {
  return {
    requestId: 'fake-request',
    scopeId,
    outcome,
    accepted: outcome === 'completed',
    required: true,
    startedCueKeys: [],
    completedCueKeys: [],
    requestedAtMs: 0,
    completedAtMs: 1,
  };
}

class FakeTrackedVoiceChannel {
  cancelScope = jest.fn<void, [string, VoiceCancelReason?]>();
  cancelActive = jest.fn<void, [VoiceCancelReason?]>();
  speakTracked = jest.fn<TrackedVoiceRequest, [readonly VoiceCueKey[], { priority: number; scopeId: string; required: boolean }]>(
    (cues, options) => ({
      requestId: 'fake-request',
      accepted: cues.length > 0 && options.required,
      completion: Promise.resolve({
        requestId: 'fake-request',
        scopeId: options.scopeId,
        outcome: 'completed',
        accepted: cues.length > 0,
        required: options.required,
        startedCueKeys: cues.slice(),
        completedCueKeys: cues.slice(),
        requestedAtMs: 0,
        completedAtMs: 1,
      } satisfies VoicePlaybackResult),
    })
  );
}
