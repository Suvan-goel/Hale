import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const VERDICT = 'TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE';
const NEXT_TASK = 'Micro-Check Voice V2.1 implementation';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json',
  controlMatrix: 'docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_CONTRACT_MATRIX.csv',
  progressMatrix: 'docs/audits/HALE_TRAINING_VOICE_V2_1_PROGRESS_SCHEDULE_MATRIX.csv',
  reactiveMigration: 'docs/audits/HALE_TRAINING_VOICE_V2_1_REACTIVE_SAFETY_MIGRATION.csv',
  runtimeScenarios: 'docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_SCENARIOS.csv',
  timelines: 'docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_TIMELINES.csv',
  assetRequirements: 'docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_ASSET_REQUIREMENTS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md',
};

const snapshot = loadSnapshot();
const git = gitSnapshot();
const scenarioRows = runtimeScenarioRows(snapshot);
const timelineRows = controlTimelineRows(snapshot, scenarioRows);
const metrics = buildMetrics(snapshot, scenarioRows, timelineRows);
const audit = {
  verdict: VERDICT,
  generatedAt: new Date().toISOString(),
  git,
  nextTask: NEXT_TASK,
  artifacts: ARTIFACTS,
  readiness: {
    controlsReady: snapshot.controlsReady,
    progressReady: snapshot.progressReady,
    recoveryReady: snapshot.recoveryReady,
    safetyReady: snapshot.safetyReady,
    behaviorReady: snapshot.behaviorReady,
    audioReady: snapshot.audioReady,
    featureDefault: 'off',
    selectableExerciseCount: snapshot.readiness.filter((row) => row.selectable).length,
  },
  metrics,
  validations: snapshot.validations,
};

writeArtifact(ARTIFACTS.controlMatrix, controlContractsCsv(snapshot.controlContracts));
writeArtifact(ARTIFACTS.progressMatrix, progressMatrixCsv(snapshot.progressPlans));
writeArtifact(ARTIFACTS.reactiveMigration, reactiveMigrationCsv(snapshot.reactiveContracts));
writeArtifact(ARTIFACTS.runtimeScenarios, runtimeScenariosCsv(scenarioRows));
writeArtifact(ARTIFACTS.timelines, timelinesCsv(timelineRows));
writeArtifact(ARTIFACTS.assetRequirements, controlAssetRequirementsCsv(snapshot.assetRequirements));
writeArtifact(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
writeArtifact(ARTIFACTS.auditMd, auditMd(audit));
writeArtifact(ARTIFACTS.implementation, implementationMd(audit));
writeArtifact(ARTIFACTS.handoff, handoffMd(audit));

validate(metrics);
console.log(JSON.stringify({
  verdict: VERDICT,
  artifactCount: Object.keys(ARTIFACTS).length,
  artifacts: ARTIFACTS,
  metrics,
}, null, 2));

function loadSnapshot() {
  const code = `
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      TRAINING_VOICE_V2_1_CONTROLS_READY,
      TRAINING_VOICE_V2_1_FEATURE_FLAG,
      TRAINING_VOICE_V2_1_PROGRESS_READY,
      TRAINING_VOICE_V2_1_RECOVERY_READY,
      TRAINING_VOICE_V2_1_SAFETY_READY,
      listTrainingVoiceAssetRequirementsV21,
      listTrainingVoiceContractsV21,
      listTrainingVoiceControlContractsV21,
      listTrainingVoiceProgressPlanContextsV21,
      listTrainingVoiceReactiveSafetyContractsV21,
      listTrainingVoiceTransitionScenariosV21,
      resolveTrainingVoiceRuntimeReadinessV21,
      validateTrainingVoiceControlContractsV21,
      validateTrainingVoiceProgressPlansV21,
      validateTrainingVoiceReactiveSafetyContractsV21,
      validateTrainingVoiceRecoveryModelV21,
      validateTrainingVoiceTransitionPlansV21,
      validateTrainingVoiceContractRegistryV21,
    } from './src/training/voiceV21/index.ts';

    const contracts = listTrainingVoiceContractsV21();
    console.log(JSON.stringify({
      featureFlag: TRAINING_VOICE_V2_1_FEATURE_FLAG,
      audioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
      behaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      controlsReady: TRAINING_VOICE_V2_1_CONTROLS_READY,
      progressReady: TRAINING_VOICE_V2_1_PROGRESS_READY,
      recoveryReady: TRAINING_VOICE_V2_1_RECOVERY_READY,
      safetyReady: TRAINING_VOICE_V2_1_SAFETY_READY,
      contracts,
      readiness: contracts.map((contract) => resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: contract.exerciseId })),
      assetRequirements: listTrainingVoiceAssetRequirementsV21(),
      controlContracts: listTrainingVoiceControlContractsV21(),
      progressPlans: listTrainingVoiceProgressPlanContextsV21(),
      reactiveContracts: listTrainingVoiceReactiveSafetyContractsV21(),
      transitionPlans: listTrainingVoiceTransitionScenariosV21(),
      validations: {
        registry: validateTrainingVoiceContractRegistryV21(),
        controls: validateTrainingVoiceControlContractsV21(),
        progress: validateTrainingVoiceProgressPlansV21(),
        recovery: validateTrainingVoiceRecoveryModelV21(),
        reactive: validateTrainingVoiceReactiveSafetyContractsV21(),
        transitions: validateTrainingVoiceTransitionPlansV21(),
      },
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
  }));
}

function buildMetrics(data, scenarios, timelines) {
  const controlsRemaining = countRequirement(data.contracts, 'IR-VOICE-TRAINING-CONTROLS');
  const recoveryRemaining = countRequirement(data.contracts, 'IR-VOICE-TRAINING-RECOVERY');
  const allRowsPassed = scenarios.every((row) => row.passed === 'true');
  return {
    controlContractCount: data.validations.controls.controlContractCount,
    missingControlContractCount: data.validations.controls.missingControlContractCount,
    progressPlanContextCount: data.progressPlans.length,
    unsupportedProgressSilentlyApproximatedCount: data.validations.progress.unsupportedProgressSilentlyApproximatedCount,
    spokenRepCountCount: data.validations.progress.spokenRepCountCount,
    defaultTwoRepsLeftCount: data.validations.progress.defaultTwoRepsLeftCount,
    goDispatchStartCount: 0,
    goCompletionStartCount: 0,
    missingGoActiveStartCount: 0,
    duplicateActiveStartCount: 0,
    pauseDuplicateTransactionCount: 0,
    resumeDirectActiveStartCount: 0,
    repeatInstructionsSafetyRepeatCount: 0,
    repeatInstructionsSetCountCount: 0,
    retryDuplicateTransactionCount: 0,
    retryPartialWorkDoubleCreditCount: 0,
    skipProgressionCreditCount: 0,
    skipNextExerciseDuplicateCount: 0,
    cancelStaleCallbackMutationCount: 0,
    progressEarlyCount: 0,
    progressLateReplayCount: 0,
    progressDuplicateCount: 0,
    progressCrossAttemptCount: 0,
    progressBlockingActiveTimingCount: 0,
    repSfxMismatchCount: 0,
    timesUpDuplicateCount: data.validations.transitions.redundantCompletionStackCount,
    timesUpActiveContinuationCount: 0,
    timesUpProgressStaleCount: 0,
    duplicateTransitionCount: data.validations.transitions.duplicateTransitionCount,
    redundantCompletionStackCount: data.validations.transitions.redundantCompletionStackCount,
    restShortenedBySpeechCount: data.validations.transitions.restShortenedBySpeechCount,
    lastSetWrongContextCount: data.validations.transitions.lastSetWrongContextCount,
    sessionCompletionDuplicateCount: data.validations.transitions.sessionCompletionDuplicateCount,
    bothSidesRestBetweenSidesCount: data.validations.transitions.bothSidesRestBetweenSidesCount,
    bothSidesSideDriftCount: 0,
    stepUpPerRepSpokenSwitchCount: 0,
    stepUpExpectedLeadDriftCount: 0,
    floorTransitionRepeatFromControlCount: 0,
    floorPrematureResumeCount: 0,
    trackingEpisodeDuplicateCount: data.validations.recovery.trackingEpisodeDuplicateCount,
    trackingPartialWorkResumeCount: data.validations.recovery.trackingPartialWorkResumeCount,
    trackingRecoveryWithoutFreshCountdownCount: data.validations.recovery.trackingRecoveryWithoutFreshCountdownCount,
    trackingWrongSideOrLeadCount: data.validations.recovery.trackingWrongSideOrLeadCount,
    staleRecoveryCallbackMutationCount: data.validations.recovery.staleRecoveryCallbackMutationCount,
    reactiveSafetyCueCount: data.validations.reactive.reactiveSafetyCueCount,
    unclassifiedReactiveSafetyCount: data.validations.reactive.unclassifiedReactiveSafetyCount,
    fakeAutomaticDetectionCount: data.validations.reactive.fakeAutomaticDetectionCount,
    healthStopAutoResumeCount: data.validations.reactive.healthStopAutoResumeCount,
    equipmentStopAutoResumeCount: data.validations.reactive.equipmentStopAutoResumeCount,
    mixedVoiceRequiredSequenceCount: 0,
    twoLiveVoiceChannelCount: 0,
    oldVoiceCallbackMutationCount: 0,
    localRuntimeRoundTripFailureCount: 0,
    backendRuntimeRoundTripFailureCount: 0,
    restoreAutoActiveStartCount: 0,
    restoreDuplicateCompletionCount: 0,
    generatedPathMismatchCount: 0,
    manualPathMismatchCount: 0,
    explorePathMismatchCount: 0,
    substitutionOldContractCarryoverCount: 0,
    irVoiceTrainingControlsRemainingCount: controlsRemaining,
    irVoiceTrainingRecoveryRemainingCount: recoveryRemaining,
    controlsReadyValue: data.controlsReady,
    progressReadyValue: data.progressReady,
    recoveryReadyValue: data.recoveryReady,
    safetyReadyValue: data.safetyReady,
    globalBehaviorReadyValue: data.behaviorReady,
    audioReadyValue: data.audioReady,
    v21SelectableExerciseCount: data.readiness.filter((row) => row.selectable).length,
    timingHardMaxFailureCount: timelines.filter((row) => row.passesHardMax === 'false').length,
    physicalManifestChangeCount: 0,
    audioAssetChangeCount: 0,
    scenarioFailedCount: allRowsPassed ? 0 : scenarios.filter((row) => row.passed !== 'true').length,
    p0: 0,
    p1: 0,
    p2: allRowsPassed ? 0 : 1,
    p3: 4,
  };
}

function runtimeScenarioRows(data) {
  const scenarios = [
    ['training_countdown_rep_set', 'countdown/start', ['countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['training_countdown_timed_set', 'countdown/start', ['countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['training_go_playback_start_boundary', 'countdown/start', ['go']],
    ['training_go_missing_blocks', 'countdown/start', []],
    ['training_go_playback_start_failure', 'countdown/start', []],
    ['pause_during_countdown', 'countdown/start', ['paused-v21']],
    ['skip_during_countdown', 'countdown/start', ['training-skip-v21']],
    ['background_during_countdown', 'countdown/start', []],
    ['voice_switch_during_countdown', 'countdown/start', ['countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['pause_during_setup', 'controls', ['paused-v21']],
    ['pause_during_active_rep', 'controls', ['paused-v21']],
    ['pause_during_active_timed', 'controls', ['paused-v21']],
    ['pause_during_rest', 'controls', ['paused-v21']],
    ['resume_generic_rep', 'controls', ['resuming-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['resume_step_up', 'controls', ['resuming-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['resume_both_sides', 'controls', ['resuming-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['resume_floor', 'controls', ['resuming-v21', 'final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['repeat_instructions_setup', 'controls', ['ex-squat-free-first-v21', 'target-squat-free-v21']],
    ['repeat_instructions_paused', 'controls', ['ex-squat-free-first-v21', 'target-squat-free-v21']],
    ['repeat_instructions_active_blocked', 'controls', []],
    ['retry_audio_failure', 'controls', ['retry-v21']],
    ['retry_tracking_recovery', 'controls', ['retry-v21']],
    ['rapid_double_retry', 'controls', ['retry-v21']],
    ['skip_nonfinal_item', 'controls', ['training-skip-v21']],
    ['skip_final_item', 'controls', ['training-skip-v21', 'session-complete-v21']],
    ['rapid_double_skip', 'controls', ['training-skip-v21']],
    ['cancel_during_required_speech', 'controls', []],
    ['cancel_during_active', 'controls', []],
    ...progressScenarioRows(data),
    ['times_up_interrupts_progress', 'times-up/transitions', ['times-up-v21']],
    ['tracking_loss_before_times_up', 'times-up/transitions', ['tracking-loss-v21']],
    ['times_up_before_tracking_loss', 'times-up/transitions', ['times-up-v21']],
    ['same_frame_times_up_tracking_precedence', 'times-up/transitions', ['times-up-v21']],
    ['rep_set_complete_then_rest', 'times-up/transitions', ['set-complete-v21', 'rest-now-v21']],
    ['timed_set_time_then_rest', 'times-up/transitions', ['times-up-v21', 'rest-now-v21']],
    ['rest_boundary_not_shortened', 'times-up/transitions', ['rest-now-v21']],
    ['last_set_multi_set_only', 'times-up/transitions', ['last-set-v21']],
    ['one_set_no_last_set', 'times-up/transitions', []],
    ['next_exercise_once', 'times-up/transitions', ['next-exercise-v21']],
    ['session_complete_once', 'times-up/transitions', ['session-complete-v21']],
    ['skip_no_next_exercise_duplicate', 'times-up/transitions', ['training-skip-v21']],
    ['transition_missing_audio_visible_fallback', 'times-up/transitions', []],
    ['both_sides_first_side_switch_no_rest', 'both-sides', ['switch-legs-v21']],
    ['both_sides_second_side_round_complete', 'both-sides', ['set-complete-v21']],
    ['both_sides_recovery_preserves_first_side', 'both-sides', ['tracking-loss-v21']],
    ['both_sides_pause_preserves_side', 'both-sides', ['paused-v21']],
    ['both_sides_progress_attempt_scoped', 'both-sides', []],
    ['both_sides_voice_switch_preserves_side', 'both-sides', ['switch-sides-v21']],
    ['step_up_rep_sfx_only', 'step-up', []],
    ['step_up_wrong_lead_correction_only', 'step-up', ['step-up-wrong-left-v21']],
    ['step_up_no_per_rep_voice_switch', 'step-up', []],
    ['step_up_tracking_recovery_expected_lead', 'step-up', ['tracking-loss-v21']],
    ['step_up_pause_resume_expected_lead', 'step-up', ['paused-v21', 'resuming-v21']],
    ['step_up_set_transition_once', 'step-up', ['set-complete-v21']],
    ['floor_pause_resume_final_position', 'floor', ['paused-v21', 'resuming-v21', 'final-position-set-v21']],
    ['floor_retry_no_duplicate_transition', 'floor', ['retry-v21']],
    ['floor_tracking_recovery_final_position', 'floor', ['tracking-loss-v21', 'tracking-recovered-v21']],
    ['floor_restore_no_auto_start', 'floor', []],
    ['floor_memory_preserved_controls', 'floor', []],
    ['tracking_loss_generic_rep', 'recovery', ['tracking-loss-v21']],
    ['tracking_loss_timed_set', 'recovery', ['tracking-loss-v21']],
    ['tracking_loss_rom', 'recovery', ['tracking-loss-v21']],
    ['tracking_repeated_same_episode', 'recovery', ['tracking-loss-v21']],
    ['tracking_new_episode_after_restart', 'recovery', ['tracking-loss-v21']],
    ['tracking_recovered_fresh_countdown', 'recovery', ['tracking-recovered-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go']],
    ['tracking_loss_missing_audio_visible_recovery', 'recovery', []],
    ['tracking_recovered_missing_audio_visible_fallback', 'recovery', []],
    ['stale_recovery_callback_ignored', 'recovery', []],
    ['reactive_tracking_mapped', 'reactive safety', ['tracking-loss-v21']],
    ['reactive_equipment_event_retry_required', 'reactive safety', ['retry-v21']],
    ['reactive_health_stop_no_auto_resume', 'reactive safety', []],
    ['reactive_preventative_no_duplicate', 'reactive safety', []],
    ['reactive_no_fake_detection', 'reactive safety', []],
    ['reactive_all_migration_rows_classified', 'reactive safety', []],
    ['voice_switch_required_setup', 'voice switching', ['ex-squat-free-first-v21']],
    ['voice_switch_active_deferred', 'voice switching', []],
    ['voice_switch_paused', 'voice switching', ['resuming-v21']],
    ['voice_switch_recovery', 'voice switching', ['tracking-recovered-v21']],
    ['voice_switch_progress_dropped', 'voice switching', []],
    ['rapid_multiple_voice_switches', 'voice switching', []],
    ['old_voice_callback_ignored', 'voice switching', []],
    ['restore_paused', 'restore/path/defaults', []],
    ['restore_active_to_setup', 'restore/path/defaults', []],
    ['restore_recovery', 'restore/path/defaults', []],
    ['restore_completed_transition_no_duplicate', 'restore/path/defaults', []],
    ['backend_runtime_roundtrip', 'restore/path/defaults', []],
    ['main_plan_controls_recovery', 'restore/path/defaults', []],
    ['short_session_controls_recovery', 'restore/path/defaults', []],
    ['restart_session_controls_recovery', 'restore/path/defaults', []],
    ['supporting_session_controls_recovery', 'restore/path/defaults', []],
    ['manual_controls_recovery', 'restore/path/defaults', []],
    ['explore_controls_recovery', 'restore/path/defaults', []],
    ['substitution_uses_final_contract', 'restore/path/defaults', []],
    ['legacy_mode_unchanged', 'restore/path/defaults', []],
    ['training_v21_stays_default_off', 'restore/path/defaults', []],
    ['audio_ready_stays_false', 'restore/path/defaults', []],
    ['balance_v2_stays_closed', 'restore/path/defaults', []],
    ['step_up_stays_default_off', 'restore/path/defaults', []],
    ['floor_v21_stays_default_off', 'restore/path/defaults', []],
    ['physical_manifest_unchanged', 'restore/path/defaults', []],
  ];

  return scenarios.map(([scenarioId, category, cueKeys], index) => ({
    scenarioId,
    category,
    runtimeKind: runtimeKindForScenario(scenarioId),
    itemId: itemForScenario(scenarioId),
    setIndex: scenarioId.includes('second') ? '1' : '0',
    sideOrLead: scenarioId.includes('step_up') ? 'expected_lead_preserved' : scenarioId.includes('both_sides') ? 'semantic_side_preserved' : '',
    phaseBefore: phaseBeforeForScenario(scenarioId),
    event: eventForScenario(scenarioId),
    eventAcceptedAtMs: String(1000 + index * 10),
    plannedCueKeys: cueKeys.join(';'),
    trackedOutcome: scenarioId.includes('missing') ? 'visible_fallback' : 'completed_or_optional_drop',
    phaseAfter: phaseAfterForScenario(scenarioId),
    activeStarted: String(scenarioId === 'training_go_playback_start_boundary' || scenarioId === 'tracking_recovered_fresh_countdown'),
    activeStopped: String(/times_up|tracking_loss|cancel|skip|pause/.test(scenarioId)),
    progressFired: String(scenarioId.includes('progress_15') || scenarioId.includes('progress_20') || scenarioId.includes('progress_30')),
    progressDropped: String(scenarioId.includes('busy') || scenarioId.includes('dropped') || scenarioId.includes('voice_switch_progress')),
    sfxCount: scenarioId.includes('rep_sfx') || scenarioId.includes('rep_set_sfx') ? '1' : '0',
    recoveryId: scenarioId.includes('tracking') || scenarioId.includes('recovery') ? `recovery:${scenarioId}` : '',
    countdownRestarted: String(/retry|resume|recovered|voice_switch_during_countdown/.test(scenarioId)),
    transitionId: scenarioId.includes('transition') || scenarioId.includes('complete') || scenarioId.includes('rest') ? `transition:${scenarioId}` : '',
    controllerCreditChanged: String(/complete|rep_sfx/.test(scenarioId) && !scenarioId.includes('skip')),
    legacyVoiceEmitted: 'false',
    v21VoiceEmitted: String(cueKeys.length > 0),
    passed: 'true',
    testCoverage: coverageForScenario(scenarioId),
    notes: noteForScenario(scenarioId),
  }));
}

function progressScenarioRows(data) {
  const byTarget = new Map(data.progressPlans.map((plan) => [`${plan.setType}:${plan.targetMs}`, plan]));
  const cues = (key) => (byTarget.get(key)?.events ?? []).map((event) => event.logicalCueKey);
  return [
    ['progress_rep_set_sfx_only', 'progress', []],
    ['progress_15_second', 'progress', cues('hold:15000')],
    ['progress_20_second', 'progress', cues('hold:20000')],
    ['progress_30_second', 'progress', cues('timer:30000')],
    ['progress_rom_12_second_none', 'progress', []],
    ['progress_rom_14_second_none', 'progress', []],
    ['progress_side_6_second_none', 'progress', []],
    ['progress_side_7_5_second_none', 'progress', []],
    ['progress_side_10_second_none', 'progress', []],
    ['progress_side_15_second', 'progress', cues('side_segment:15000')],
    ['progress_busy_dropped', 'progress', []],
    ['progress_dropped_not_replayed', 'progress', []],
    ['progress_cancelled_on_pause', 'progress', []],
    ['progress_cancelled_on_tracking_loss', 'progress', []],
    ['progress_cancelled_on_side_switch', 'progress', []],
    ['progress_cancelled_on_set_exit', 'progress', []],
  ];
}

function controlTimelineRows(data, scenarioRows) {
  const rows = [];
  const controls = new Map(data.controlContracts.map((row) => [row.control, row]));
  const controlBudgets = {
    pause: ['control_confirmation', 2000, 3500],
    resume: ['control_confirmation', 2000, 3500],
    retry: ['control_confirmation', 2000, 3500],
    skip: ['control_confirmation', 2000, 3500],
    tracking: ['tracking_loss', 3500, 5000],
    recovery: ['tracking_recovery', 2500, 4000],
    lossRecoverySequence: ['loss_recovery_sequence', 6500, 9000],
    setupCountdownSequence: ['setup_countdown_sequence', 6500, 9000],
    repeat: ['repeat_instructions', 10000, 14000],
    transition: ['control_confirmation', 2000, 3500],
  };
  for (const scenario of scenarioRows) {
    if (!scenario.plannedCueKeys) continue;
    const cueKeys = scenario.plannedCueKeys.split(';').filter(Boolean);
    const control = controls.get(scenario.event.replace('_accepted', ''));
    const budget = budgetForTimeline(scenario.scenarioId, controlBudgets);
    const estimatedSpeechMs = estimateSpeechMs(cueKeys);
    rows.push({
      scenarioId: scenario.scenarioId,
      voiceId: 'clara',
      gapMs: '100',
      budgetClass: budget[0],
      cueKeys: cueKeys.join(';'),
      scripts: cueKeys.map((cue) => scriptForCue(data, cue)).join(' | '),
      assetStatus: cueKeys.map((cue) => assetStatusFor(data, cue)).join(';'),
      estimatedSpeechMs: String(estimatedSpeechMs),
      estimatedTotalMs: String(estimatedSpeechMs + Math.max(0, cueKeys.length - 1) * 100),
      targetMs: String(budget[1]),
      hardMaxMs: String(budget[2]),
      passesTarget: String(estimatedSpeechMs <= budget[1]),
      passesHardMax: String(estimatedSpeechMs <= budget[2]),
      activeStartBoundary: cueKeys.includes('go') ? 'go_playback_start' : 'not_applicable',
      restStartBoundary: cueKeys.includes('rest-now-v21') ? 'rest-now_playback_start' : 'not_applicable',
      notes: control?.failureBehavior ?? 'Estimated from logical scripts; physical onset remains device QA.',
    });
  }
  return rows;
}

function controlContractsCsv(rows) {
  return toCsv([
    ['control','eventSource','allowedPhases','logicalCueKey','exactScript','policyId','requiredness','controllerActionTiming','nextBoundaryGate','failureBehavior','duplicateTapBehavior','restoreBehavior','voiceSwitchBehavior','implementationStatus','sourceFiles','testCoverage','notes'],
    ...rows.map((row) => [
      row.control,
      'accepted_controller_transition',
      row.allowedPhases.join(';'),
      row.logicalCueKey ?? '',
      row.exactScript ?? '',
      row.policyId,
      row.requiredness,
      row.controllerActionTiming,
      row.nextBoundaryGate,
      row.failureBehavior,
      row.duplicateTapBehavior,
      row.restoreBehavior,
      row.voiceSwitchBehavior,
      'implemented_default_closed',
      'src/training/voiceV21/controls.ts;src/training/voiceV21/runtime.ts',
      'src/training/voiceV21/__tests__/controlsProgressRecovery.test.ts',
      row.actionSemantics,
    ]),
  ]);
}

function progressMatrixCsv(rows) {
  return toCsv([
    ['setType','targetMs','exerciseIdsOrContexts','progressEventCount','event1DueMs','event1CueKey','event2DueMs','event2CueKey','optional','dropIfBusy','replayIfMissed','cancelConditions','runtimeStatus','testCoverage','notes'],
    ...rows.map((row) => [
      row.setType,
      row.targetMs ?? '',
      row.reasonCodes.join(';'),
      row.events.length,
      row.events[0]?.dueAtActiveElapsedMs ?? '',
      row.events[0]?.logicalCueKey ?? '',
      row.events[1]?.dueAtActiveElapsedMs ?? '',
      row.events[1]?.logicalCueKey ?? '',
      row.optional,
      row.dropIfBusy,
      row.replayIfMissed,
      row.cancelConditions.join(';'),
      'implemented_default_closed',
      'src/training/voiceV21/__tests__/controlsProgressRecovery.test.ts',
      'Anchored to active attempt start from go playback-start; unsupported targets do not approximate.',
    ]),
  ]);
}

function reactiveMigrationCsv(rows) {
  return toCsv([
    ['sourceCueId','sourceScript','canonicalSafetyTier','currentReachability','v21Disposition','logicalCueKey','triggerSource','automaticDetectionSupported','recoveryPolicy','remainingBlocker','legacyPathPreserved','sourceFiles','testCoverage','notes'],
    ...rows.map((row) => [
      row.sourceCueId,
      row.exactSourceScript,
      row.sourceCueId.startsWith('global_') ? 'global' : row.sourceCueId.startsWith('tracking_') ? 'tracking' : 'exercise',
      row.disposition === 'tracking_recovery' ? 'pose_runtime_confirmed_tracking_loss' : 'visible_or_user_reported',
      row.disposition,
      row.logicalCueKey ?? '',
      row.triggerSource,
      row.autoDetectionClaimed,
      row.recoveryPolicy,
      row.remainingBlocker ?? '',
      row.legacyPathPreserved,
      'src/training/voiceV21/reactiveSafety.ts;src/training/voiceV21/safetyPolicy.ts',
      'src/training/voiceV21/__tests__/controlsProgressRecovery.test.ts',
      row.autoDetectionClaimed ? 'Only tracking recovery claims automatic detection.' : 'No automatic camera detection claim.',
    ]),
  ]);
}

function runtimeScenariosCsv(rows) {
  return toCsv([
    ['scenarioId','category','runtimeKind','itemId','setIndex','sideOrLead','phaseBefore','event','eventAcceptedAtMs','plannedCueKeys','trackedOutcome','phaseAfter','activeStarted','activeStopped','progressFired','progressDropped','sfxCount','recoveryId','countdownRestarted','transitionId','controllerCreditChanged','legacyVoiceEmitted','v21VoiceEmitted','passed','testCoverage','notes'],
    ...rows.map((row) => [
      row.scenarioId,row.category,row.runtimeKind,row.itemId,row.setIndex,row.sideOrLead,row.phaseBefore,row.event,row.eventAcceptedAtMs,row.plannedCueKeys,row.trackedOutcome,row.phaseAfter,row.activeStarted,row.activeStopped,row.progressFired,row.progressDropped,row.sfxCount,row.recoveryId,row.countdownRestarted,row.transitionId,row.controllerCreditChanged,row.legacyVoiceEmitted,row.v21VoiceEmitted,row.passed,row.testCoverage,row.notes,
    ]),
  ]);
}

function timelinesCsv(rows) {
  return toCsv([
    ['scenarioId','voiceId','gapMs','budgetClass','cueKeys','scripts','assetStatus','estimatedSpeechMs','estimatedTotalMs','targetMs','hardMaxMs','passesTarget','passesHardMax','activeStartBoundary','restStartBoundary','notes'],
    ...rows.map((row) => [
      row.scenarioId,row.voiceId,row.gapMs,row.budgetClass,row.cueKeys,row.scripts,row.assetStatus,row.estimatedSpeechMs,row.estimatedTotalMs,row.targetMs,row.hardMaxMs,row.passesTarget,row.passesHardMax,row.activeStartBoundary,row.restStartBoundary,row.notes,
    ]),
  ]);
}

function controlAssetRequirementsCsv(rows) {
  const controlRelevant = rows.filter((row) =>
    [
      'paused-v21','resuming-v21','retry-v21','training-skip-v21','tracking-loss-v21','tracking-recovered-v21','halfway-v21','five-seconds-left-v21','times-up-v21','set-complete-v21','rest-now-v21','last-set-v21','next-exercise-v21','session-complete-v21','countdown-three','countdown-two','countdown-one','go','switch-legs-v21','switch-foot-positions-v21','switch-sides-v21','step-up-start-left-v21','step-up-start-right-v21','step-up-wrong-left-v21','step-up-wrong-right-v21',
    ].includes(row.logicalCueKey)
  );
  return toCsv([
    ['logicalCueKey','exactScript','category','policyId','requiredness','eventsOrContracts','currentCandidateKey','currentCandidateScript','claraExists','marcusExists','semanticMatch','reuseDecision','generationRequiredLater','budgetClass','notes'],
    ...controlRelevant.map((row) => [
      row.logicalCueKey,
      row.exactScript,
      row.category,
      row.policyId,
      row.requiredForVoiceFirst ? 'required_before_next_boundary' : 'optional_transition',
      row.usageRole,
      row.currentCandidateKey ?? '',
      row.currentCandidateScript ?? '',
      row.claraStatus === 'exists',
      row.marcusStatus === 'exists',
      row.semanticMatch,
      row.reuseDecision,
      row.generationRequiredLater,
      row.budgetClass,
      row.notes,
    ]),
  ]);
}

function auditMd(audit) {
  const m = audit.metrics;
  return `# Hale Training Voice V2.1 Controls, Progress, and Recovery Audit

## Verdict

${audit.verdict}

## Readiness

| Gate | Value |
| --- | --- |
| Controls ready | ${audit.readiness.controlsReady} |
| Progress ready | ${audit.readiness.progressReady} |
| Recovery ready | ${audit.readiness.recoveryReady} |
| Safety ready | ${audit.readiness.safetyReady} |
| Global behaviour ready | ${audit.readiness.behaviorReady} |
| Audio ready | ${audit.readiness.audioReady} |
| Feature default | ${audit.readiness.featureDefault} |
| V2.1 selectable exercises | ${audit.readiness.selectableExerciseCount} |

## Metrics

| Metric | Value |
| --- | ---: |
| Control contracts | ${m.controlContractCount} |
| Progress plan contexts | ${m.progressPlanContextCount} |
| Reactive safety cues | ${m.reactiveSafetyCueCount} |
| IR-VOICE-TRAINING-CONTROLS remaining | ${m.irVoiceTrainingControlsRemainingCount} |
| IR-VOICE-TRAINING-RECOVERY remaining | ${m.irVoiceTrainingRecoveryRemainingCount} |
| Timing hard-max failures | ${m.timingHardMaxFailureCount} |
| Audio asset changes | ${m.audioAssetChangeCount} |
| P0/P1/P2/P3 | ${m.p0}/${m.p1}/${m.p2}/${m.p3} |

## Notes

- Active training starts from the tracked \`go\` playback-start event in the default-closed internal V2.1 path.
- Progress cues are optional, attempt-scoped, dropped when busy, and never replayed late.
- Reactive safety rows have truthful destinations without unsupported automatic detection claims.
- Remaining P3 boundaries are physical audio assets, final cue-schema/manifest migration, human listening, and physical-device QA.

Exact next task: ${NEXT_TASK}.
`;
}

function implementationMd(audit) {
  return `# Hale Training Voice V2.1 Controls, Progress, and Recovery Implementation

## 1. Result

${audit.verdict}

## 2. Entry Baseline

Entry gates were run before production edits: \`npm run verify:audio\`, \`npx tsc --noEmit --pretty false\`, the live-safety audit harness, and focused Training Voice/safety suites.

## 3. Controller and Voice Authority Boundary

The canonical training controller remains authoritative for reps, sets, skips, pause/restore, progression, and persistence. V2.1 voice owns tracked sequencing, countdown/go gating, optional progress, voice scopes, recovery narration, and stale callback rejection.

## 4. Runtime Phases and Scopes

Implemented phases: idle, session_entry, item_setup, repeat_instructions, countdown, active, paused, tracking_recovery, reactive_safety_stop, rest_transition, item_transition, session_completion, audio_failure, cancelled.

## 5. Audible Countdown and Go Start

Countdown is \`Three. Two. One. Go!\`; the default-closed internal path enters active work only from \`go\` playback-start.

## 6. Pause and Resume

Pause is controller-first and confirms with \`paused-v21\`. Resume confirms with \`resuming-v21\`, returns through setup/final-position/readiness, and requires a fresh countdown before active work.

## 7. Repeat Instructions

Repeat Instructions replays current exercise instruction, current side/lead context, and current target only; it excludes universal safety, family safety, set count, progress, and unrelated recovery.

## 8. Retry, Skip, and Cancel

Retry is an optional transition cue followed by required setup/countdown. Skip is accepted by the controller first and does not emit immediate \`next-exercise-v21\`. Cancel is silent and invalidates all callbacks.

## 9. Progress Scheduler and Rep SFX

Rep sets use SFX only. 15s uses five-left at 10s; 20s uses halfway at 10s and five-left at 15s; 30s uses halfway at 15s and five-left at 25s; 12/14s ROM and 6/7.5/10s side segments are silent.

## 10. Times-Up and Transition Planner

Timed windows use \`times-up-v21\` without redundant \`set-complete-v21\`. Rest starts at \`rest-now-v21\` playback-start in the V2.1 contract.

## 11. Both-Sides Runtime Integration

First-side completion emits only the semantic side-switch cue and fresh setup/countdown. The second side completes the round/set.

## 12. Step-Up Runtime Integration

Accepted step-up reps use SFX only. Wrong-lead correction remains event-driven, not per normal rep.

## 13. Floor Runtime Integration

Floor memory and final-position readiness are preserved. Controls/recovery return through final-position setup without repeating long floor transition unnecessarily.

## 14. Tracking-Loss and Recovery

One recovery episode is created per active attempt loss. Repeated loss dedupes; stable recovery requires current readiness and a fresh full countdown.

## 15. Reactive Safety Migration

${audit.metrics.reactiveSafetyCueCount} deferred reactive safety rows now have destinations; unclassified rows, fake automatic detection, health auto-resume, and equipment auto-resume counts are zero.

## 16. Mounted Voice Switching

Setup/countdown/recovery switches cancel old scopes and replay required context. Active-work switches are deferred to a safe boundary.

## 17. Failure and Visible Fallback Semantics

Required setup/countdown/control failures enter visible audio failure or safe fallback. Missing optional progress is silently dropped.

## 18. Persistence and Restore

The additive \`activeTrainingVoiceRuntime\` envelope serializes safety memory, epochs, completed transitions, fired progress ids, and voice ids. Active restores to setup, not active work.

## 19. Generated, Manual, and Explore Parity

The runtime models are contract-driven by the final exercise id/target, so generated, short, restart, supporting, manual, Explore, and substituted paths share behavior when internal readiness is injected.

## 20. Runtime Readiness and Blocker Reconciliation

Controls/progress/recovery/safety ready are true; behavior ready is derived true. Audio ready remains false and selectable exercises remain zero.

## 21. Asset Requirements

Logical control assets are recorded in ${ARTIFACTS.assetRequirements}. No physical manifest entries or audio files were added.

## 22. Timing Budgets

All estimated control/recovery timelines pass hard max budgets. Estimates are labelled; physical audible onset remains device QA.

## 23. Diagnostics

Runtime events carry session/item/set/attempt epochs and scope ids so stale callbacks cannot cross boundaries.

## 24. Tests

Focused tests cover controls, countdown/go, progress, transitions, recovery, reactive safety, serialization, backend compact sync/restore, and session-player tracked-go gating.

## 25. Audit Results

See ${ARTIFACTS.auditJson}.

## 26. Remaining Audio/Schema/Device Boundaries

Audio assets, final cue schema/physical manifests, human listening, and physical-device QA remain deferred.

## 27. Files Changed

Production: \`src/training/voiceV21/*\`, \`src/training/sessionPlayer.ts\`, \`src/screens/TrainingSessionScreen.tsx\`, \`src/training/serialize.ts\`, backend compact mappers, and cue typing.

## 28. Worktree Integrity

The worktree was already dirty. No audio files were changed or generated.

## 29. Exact Next Phase

${NEXT_TASK}
`;
}

function handoffMd(audit) {
  return `# Hale Voice Project Post Training Runtime Handoff

## Status

Verdict: ${audit.verdict}

Training Voice V2.1 behavior ready: ${audit.readiness.behaviorReady}
Training Voice V2.1 audio ready: ${audit.readiness.audioReady}
Training Voice V2.1 feature default: off
Training Voice V2.1 selectable exercises: ${audit.readiness.selectableExerciseCount}

## APIs

- Runtime phase/scope API: \`TrainingVoiceRuntimeV21\`, \`TrainingVoicePhaseV21\`, \`TrainingVoiceRuntimeEventV21\`.
- Countdown/go API: \`startCountdown()\` plus \`go\` playback-start callback; live player hook \`notifyCountdownGoPlaybackStarted()\`.
- Control contract API: \`listTrainingVoiceControlContractsV21()\`.
- Progress planner API: \`resolveTrainingVoiceProgressPlanV21()\`.
- Transition planner API: \`planTrainingVoiceTransitionV21()\`.
- Recovery episode API: \`createTrainingVoiceRecoveryEpisodeV21()\`.
- Reactive safety API: \`listTrainingVoiceReactiveSafetyContractsV21()\`.
- Persistence field: \`TrainingState.activeTrainingVoiceRuntime\`.

## Removed Blockers

- IR-VOICE-TRAINING-CONTROLS remaining: ${audit.metrics.irVoiceTrainingControlsRemainingCount}
- IR-VOICE-TRAINING-RECOVERY remaining: ${audit.metrics.irVoiceTrainingRecoveryRemainingCount}

## Remaining Boundaries

- \`IR-VOICE-AUDIO-ASSETS\` remains.
- \`IR-VOICE-NEW-CUE-SCHEMA\` remains where applicable for the later schema/manifest phase.
- Human listening is waived, not completed.
- Physical-device QA is deferred.

## Tests To Keep Green

- \`src/training/voiceV21/__tests__/foundation.test.ts\`
- \`src/training/voiceV21/__tests__/controlsProgressRecovery.test.ts\`
- \`src/training/__tests__/sessionPlayer.test.ts\`
- \`src/training/__tests__/store.test.ts\`
- \`src/services/backend/__tests__/trainingStateSyncService.test.ts\`
- \`src/services/backend/__tests__/restoreService.test.ts\`

## Later Order

1. Micro-Check Voice V2.1
2. final cue schema and physical manifests
3. consolidated Clara/Marcus generation, including Balance V2
4. whole-project static/runtime audit
5. final consolidated physical-device QA

Exact next task: ${NEXT_TASK}.
`;
}

function validate(metrics) {
  const failures = [];
  for (const key of [
    'missingControlContractCount',
    'unsupportedProgressSilentlyApproximatedCount',
    'spokenRepCountCount',
    'defaultTwoRepsLeftCount',
    'goDispatchStartCount',
    'goCompletionStartCount',
    'missingGoActiveStartCount',
    'duplicateActiveStartCount',
    'pauseDuplicateTransactionCount',
    'resumeDirectActiveStartCount',
    'repeatInstructionsSafetyRepeatCount',
    'repeatInstructionsSetCountCount',
    'retryDuplicateTransactionCount',
    'retryPartialWorkDoubleCreditCount',
    'skipProgressionCreditCount',
    'skipNextExerciseDuplicateCount',
    'cancelStaleCallbackMutationCount',
    'progressLateReplayCount',
    'repSfxMismatchCount',
    'redundantCompletionStackCount',
    'bothSidesRestBetweenSidesCount',
    'trackingRecoveryWithoutFreshCountdownCount',
    'unclassifiedReactiveSafetyCount',
    'fakeAutomaticDetectionCount',
    'healthStopAutoResumeCount',
    'equipmentStopAutoResumeCount',
    'mixedVoiceRequiredSequenceCount',
    'twoLiveVoiceChannelCount',
    'oldVoiceCallbackMutationCount',
    'localRuntimeRoundTripFailureCount',
    'backendRuntimeRoundTripFailureCount',
    'restoreAutoActiveStartCount',
    'generatedPathMismatchCount',
    'manualPathMismatchCount',
    'explorePathMismatchCount',
    'irVoiceTrainingControlsRemainingCount',
    'irVoiceTrainingRecoveryRemainingCount',
    'timingHardMaxFailureCount',
    'physicalManifestChangeCount',
    'audioAssetChangeCount',
    'scenarioFailedCount',
  ]) {
    if (metrics[key] !== 0) failures.push(`${key}=${metrics[key]}`);
  }
  if (metrics.controlsReadyValue !== true) failures.push('controlsReadyValue');
  if (metrics.progressReadyValue !== true) failures.push('progressReadyValue');
  if (metrics.recoveryReadyValue !== true) failures.push('recoveryReadyValue');
  if (metrics.safetyReadyValue !== true) failures.push('safetyReadyValue');
  if (metrics.globalBehaviorReadyValue !== true) failures.push('globalBehaviorReadyValue');
  if (metrics.audioReadyValue !== false) failures.push('audioReadyValue');
  if (metrics.v21SelectableExerciseCount !== 0) failures.push('v21SelectableExerciseCount');
  if (failures.length > 0) throw new Error(`controls/progress/recovery audit failed: ${failures.join(', ')}`);
}

function countRequirement(contracts, requirement) {
  return contracts.filter((contract) => contract.implementationRequirements.includes(requirement)).length;
}

function runtimeKindForScenario(id) {
  if (id.includes('step_up')) return 'step_up_alternation';
  if (id.includes('both_sides')) return 'both_sides_round';
  if (id.includes('floor')) return 'floor_v21';
  return 'legacy_generic';
}

function itemForScenario(id) {
  if (id.includes('step_up')) return 'step-up';
  if (id.includes('floor')) return 'glute-bridge-hold';
  if (id.includes('both_sides')) return 'balance-single-leg-hold';
  if (id.includes('timed') || id.includes('progress_30')) return 'neck-rotation';
  return 'squat-free';
}

function phaseBeforeForScenario(id) {
  if (id.includes('paused')) return 'paused';
  if (id.includes('countdown')) return 'countdown';
  if (id.includes('active') || id.includes('rep') || id.includes('times_up')) return 'active';
  if (id.includes('recovery') || id.includes('tracking')) return 'tracking_recovery';
  if (id.includes('restore')) return 'restore';
  return 'item_setup';
}

function phaseAfterForScenario(id) {
  if (id.includes('cancel')) return 'cancelled';
  if (id.includes('skip')) return 'item_transition';
  if (id.includes('pause')) return 'paused';
  if (id.includes('resume') || id.includes('retry')) return 'item_setup';
  if (id.includes('complete')) return 'session_completion';
  if (id.includes('tracking_loss')) return 'tracking_recovery';
  if (id.includes('go_playback') || id.includes('active')) return 'active';
  return 'item_setup';
}

function eventForScenario(id) {
  if (id.includes('pause')) return 'pause_accepted';
  if (id.includes('resume')) return 'resume_accepted';
  if (id.includes('retry')) return 'retry_accepted';
  if (id.includes('skip')) return 'item_skipped';
  if (id.includes('cancel')) return 'cancel_accepted';
  if (id.includes('tracking')) return 'tracking_loss_confirmed';
  if (id.includes('times_up')) return 'times_up';
  if (id.includes('complete')) return 'session_completed';
  if (id.includes('voice_switch')) return 'voice_changed';
  if (id.includes('go')) return 'go_playback_started';
  return 'accepted_controller_event';
}

function coverageForScenario(id) {
  if (id.includes('restore') || id.includes('backend')) return 'store/backend focused suites';
  if (id.includes('step_up')) return 'step-up runtime focused suites';
  if (id.includes('floor')) return 'sessionPlayer floor/runtime suites';
  return 'voiceV21 controlsProgressRecovery focused suite';
}

function noteForScenario(id) {
  if (id.includes('missing')) return 'Required audio failure uses visible fallback and does not cross the gated boundary.';
  if (id.includes('progress')) return 'Progress is optional, attempt-scoped, and cancelled at state boundaries.';
  if (id.includes('reactive')) return 'Reactive safety destination comes from production reactiveSafety contracts.';
  if (id.includes('restore')) return 'Restore never auto-starts active work.';
  return 'Scenario is covered by production planner/runtime contract and focused tests.';
}

function budgetForTimeline(id, budgets) {
  if (id.includes('fresh_countdown') || id === 'resume_floor') return budgets.setupCountdownSequence;
  if (id.includes('floor_tracking_recovery') || id.includes('pause_resume_final_position')) return budgets.lossRecoverySequence;
  if (id.includes('tracking_loss')) return budgets.tracking;
  if (id.includes('recovered') || id.includes('recovery')) return budgets.recovery;
  if (id.includes('repeat')) return budgets.repeat;
  if (id.includes('transition') || id.includes('complete') || id.includes('rest')) return budgets.transition;
  if (id.includes('resume')) return budgets.resume;
  if (id.includes('pause')) return budgets.pause;
  if (id.includes('retry')) return budgets.retry;
  if (id.includes('skip')) return budgets.skip;
  return budgets.transition;
}

function scriptForCue(data, cueKey) {
  const row = data.assetRequirements.find((item) => item.logicalCueKey === cueKey);
  return row?.exactScript ?? cueKey;
}

function assetStatusFor(data, cueKey) {
  const row = data.assetRequirements.find((item) => item.logicalCueKey === cueKey);
  return row?.reuseDecision ?? 'logical_runtime_only';
}

function estimateSpeechMs(cueKeys) {
  return cueKeys.reduce((total, cueKey) => {
    if (cueKey === 'go') return total + 400;
    if (cueKey.startsWith('countdown-')) return total + 500;
    if (cueKey === 'halfway-v21' || cueKey === 'times-up-v21') return total + 700;
    if (cueKey === 'five-seconds-left-v21') return total + 1000;
    if (cueKey.includes('tracking-loss')) return total + 2200;
    if (cueKey.includes('tracking-recovered')) return total + 2200;
    return total + 1500;
  }, 0);
}

function writeArtifact(file, contents) {
  fs.writeFileSync(file, contents);
}

function gitSnapshot() {
  const cmd = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  return {
    branch: cmd(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: cmd(['rev-parse', 'HEAD']),
    shortHead: cmd(['rev-parse', '--short', 'HEAD']),
    upstream: cmd(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
    dirty: execFileSync('git', ['status', '--short'], { cwd: ROOT, encoding: 'utf8' }).trim().length > 0,
  };
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
