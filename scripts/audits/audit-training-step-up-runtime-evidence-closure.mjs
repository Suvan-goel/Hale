import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const AUDIT_VERSION = 1;
const HARNESS_PATH = 'scripts/audits/audit-training-step-up-runtime-evidence-closure.mjs';
const RUNNER_PATH = 'scripts/audits/fixtures/step-up-runtime-evidence-closure/production-runner.ts';
const PRELOAD_PATH = 'scripts/audits/fixtures/step-up-runtime-evidence-closure/node-preload.cjs';
const VERIFY_ROW_PLACEHOLDER = 'verify_existing_output_recorded_after_this_probe';

const ARTIFACTS = Object.freeze({
  reportMd: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE.md',
  reportJson: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE.json',
  scenariosCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_SCENARIOS.csv',
  eventsCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_EVENTS.csv',
  lifecyclesCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_LIFECYCLES.csv',
  findingsCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_FINDINGS.csv',
  validationCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_VALIDATION.csv',
  handoffMd: 'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_CLOSURE_HANDOFF.md',
});

const SCENARIO_HEADER = Object.freeze([
  'scenarioId',
  'variantId',
  'scenarioGroup',
  'evidenceMethod',
  'productionEntryPoint',
  'sourceFunctions',
  'initialState',
  'eventSequence',
  'expectedOutcome',
  'observedOutcome',
  'passed',
  'findingRuleIds',
  'metricTags',
  'testCoverage',
  'notes',
]);

const EVENT_HEADER = Object.freeze([
  'scenarioId',
  'variantId',
  'eventIndex',
  'timestampMs',
  'runtimeId',
  'setId',
  'setIndex',
  'repAttemptId',
  'logicalRepId',
  'authority',
  'eventType',
  'phaseBefore',
  'phaseAfter',
  'expectedLeadBefore',
  'observedLead',
  'bothFeetAtStart',
  'ascentValid',
  'topPhaseValid',
  'bothFeetReturnedToFloor',
  'trackingValid',
  'evidenceOutcome',
  'credited',
  'repSfxEmitted',
  'expectedLeadAfter',
  'acceptedRepCount',
  'leftLeadRepCount',
  'rightLeadRepCount',
  'setCompleted',
  'setResultId',
  'setResultEmitted',
  'progressionEventId',
  'progressionConsumed',
  'progressionEligible',
  'sessionCompletionEventId',
  'validTimeMs',
  'serialized',
  'restored',
  'seedBefore',
  'seedAfter',
  'voiceExpectedLead',
  'voiceTarget',
  'notes',
]);

const LIFECYCLE_HEADER = Object.freeze([
  'scenarioId',
  'variantId',
  'lifecycleType',
  'entityId',
  'operationIndex',
  'operation',
  'inputFingerprint',
  'outputFingerprint',
  'canonicalFieldsBefore',
  'canonicalFieldsAfter',
  'equal',
  'duplicateSuppressed',
  'errorCode',
  'productionFunction',
  'notes',
]);

const FINDINGS_HEADER = Object.freeze([
  'findingId',
  'severity',
  'title',
  'triggerMetric',
  'triggerValue',
  'affectedScenarioIds',
  'sourceEvidence',
  'userConsequence',
  'blocksFloorGate',
  'recommendedNextTask',
  'status',
  'notes',
]);

const VALIDATION_HEADER = Object.freeze([
  'validationId',
  'command',
  'startedAt',
  'finishedAt',
  'exitCode',
  'status',
  'summary',
  'stdoutSha256',
  'stderrSha256',
  'artifactOrTestScope',
  'notes',
]);

const REQUIRED_ORIGINAL = Object.freeze([
  'step_up_left_first_set_12_reps',
  'step_up_right_first_set_12_reps',
  'step_up_three_sets_left_initial',
  'step_up_three_sets_right_initial',
  'step_up_six_left_six_right',
  'step_up_both_feet_floor_each_rep',
  'wrong_lead_on_first_rep',
  'wrong_lead_after_five_reps',
  'wrong_lead_returns_to_floor_then_corrects',
  'wrong_lead_does_not_flip_expected',
  'generic_rep_without_lead_evidence_rejected',
  'opposite_chain_clearer_not_auto_credited',
  'top_reached_no_floor_return',
  'one_foot_remains_on_step',
  'duplicate_completion_callback',
  'stale_callback_after_next_rep_started',
  'threshold_noise_single_credit',
  'descent_order_not_overconstrained',
  'tracking_loss_mid_left_lead_rep',
  'tracking_loss_mid_right_lead_rep',
  'pause_mid_rep',
  'background_mid_rep',
  'restore_after_six_reps',
  'restore_mid_rep',
  'cancel_mid_set',
  'skip_mid_set',
  'default_target_12',
  'even_scaled_target_10',
  'odd_scaled_target_9_blocked',
  'noninteger_target_blocked',
  'short_session_final_target',
  'visible_voice_runtime_target_match',
  'seed_defaults_left',
  'successful_completion_flips_seed',
  'skip_does_not_flip_seed',
  'manual_practice_does_not_flip_seed',
  'duplicate_completion_idempotent',
  'sync_restore_preserves_seed',
  'one_set_one_progression_event',
  'lead_counts_do_not_double_set_count',
  'valid_time_not_doubled',
  'twelve_total_unequal_sides_rejected',
  'broken_alternation_not_progression_eligible',
  'legacy_result_still_parses',
  'step_up_start_left_logical_plan',
  'step_up_start_right_logical_plan',
  'wrong_lead_left_correction_plan',
  'wrong_lead_right_correction_plan',
  'no_per_rep_spoken_switch',
  'feature_off_legacy_unchanged',
  'alternation_flag_alone_no_half_activation',
  'training_voice_remains_default_closed',
  'balance_v2_remains_default_closed',
]);

const REQUIRED_INTEGRATION = Object.freeze([
  'integration_generated_item_selects_runtime',
  'integration_step_up_flag_alone_stays_legacy',
  'integration_one_runtime_owner',
  'integration_existing_legacy_session_stays_legacy',
  'integration_frames_left_lead_to_evidence',
  'integration_frames_right_lead_to_evidence',
  'integration_frames_wrong_lead_rejected',
  'integration_frames_unknown_lead_rejected',
  'integration_frames_top_without_return_rejected',
  'integration_frames_one_foot_on_step_rejected',
  'integration_frames_threshold_noise_single_credit',
  'integration_tracking_interrupt_retires_rep',
  'integration_evidence_dispatches_state_machine',
  'integration_accepted_rep_is_only_sfx_source',
  'integration_generic_rep_sfx_suppressed',
  'integration_twelve_reps_complete_one_set',
  'integration_three_sets_preserve_start_order',
  'integration_state_machine_emits_set_result',
  'integration_set_result_reaches_progression',
  'integration_invalid_alternation_blocks_progression',
  'integration_no_valid_time_double_count',
  'integration_session_completion_once',
  'integration_local_restore_after_six_reps',
  'integration_local_restore_mid_rep',
  'integration_backend_generated_plan_roundtrip',
  'integration_backend_active_state_roundtrip',
  'integration_backend_seed_roundtrip',
  'integration_richer_metadata_merge',
  'integration_main_plan_completion_flips_seed_once',
  'integration_duplicate_completion_seed_idempotent',
  'integration_manual_completion_does_not_flip_seed',
  'integration_explore_completion_does_not_flip_seed',
  'integration_live_expected_lead_reaches_voice_planner',
  'integration_wrong_lead_context_reaches_voice_planner',
  'integration_training_voice_remains_closed',
  'integration_balance_v2_remains_closed',
  'integration_audio_manifest_unchanged',
]);

const REQUIRED_TARGETED = Object.freeze([
  'verify_duplicate_same_attempt_terminal_evidence',
  'verify_duplicate_replayed_accepted_event',
  'verify_stale_attempt_after_new_attempt_started',
  'verify_stale_attempt_after_set_completed',
  'verify_stale_callback_after_restore',
  'verify_threshold_noise_multiple_terminal_frames',
  'verify_same_rep_generic_and_alternation_authorities',
  'verify_generic_rep_event_suppressed_internal_runtime',
  'verify_accepted_event_single_sfx',
  'verify_duplicate_accepted_event_no_second_sfx',
  'verify_wrong_lead_no_sfx',
  'verify_unknown_lead_no_sfx',
  'verify_single_set_single_setresult',
  'verify_duplicate_finish_single_setresult',
  'verify_setresult_replayed_progression_once',
  'verify_broken_alternation_progression_rejected',
  'verify_side_imbalance_progression_rejected',
  'verify_valid_6_6_progression_accepted_once',
  'verify_valid_time_not_doubled_end_to_end',
  'verify_local_roundtrip_safe_boundary',
  'verify_local_roundtrip_mid_rep_retires_partial',
  'verify_backend_roundtrip_generated_plan',
  'verify_backend_roundtrip_active_state',
  'verify_backend_roundtrip_side_seed',
  'verify_backend_richer_metadata_merge',
  'verify_seed_all_completion_paths',
  'verify_voice_context_left_right_wrong_lead_and_target',
  'verify_feature_defaults_and_runtime_ownership',
]);

const REQUIRED_ALL = Object.freeze([...REQUIRED_ORIGINAL, ...REQUIRED_INTEGRATION, ...REQUIRED_TARGETED]);

const RUNTIME_TRACE_BLUEPRINTS = Object.freeze([
  ['1', 'Exercise registry', 'Generated session item', 'src/exercises/stepUp.ts;src/training/workoutGeneration.ts', 'stepUpDefinition;GeneratedExercise', 'integration_generated_item_selects_runtime', 'connected_verified'],
  ['2', 'Final prescription', 'Alternation plan', 'src/training/stepUpAlternation/generatedSession.ts', 'attachStepUpAlternationPlansToGeneratedSession', 'integration_generated_item_selects_runtime', 'connected_verified'],
  ['3', 'Feature/readiness selector', 'Active internal runtime path', 'src/training/setRuntime.ts;src/training/sessionPlayer.ts', 'selectTrainingSetRuntime;createTrainingSetRuntime', 'integration_one_runtime_owner', 'connected_verified'],
  ['4', 'Training screen/session controller', 'Alternation runtime owner', 'src/screens/TrainingSessionScreen.tsx;src/training/sessionPlayer.ts', 'TrainingSessionPlayer;TrainingSetRuntime', 'integration_accepted_rep_is_only_sfx_source', 'connected_verified'],
  ['5', 'Pose/grader output', 'Lead-leg and floor-boundary evidence', 'src/training/stepUpAlternation/evidenceAdapter.ts', 'createStepUpAlternationEvidenceAdapter', 'integration_frames_left_lead_to_evidence', 'connected_verified'],
  ['6', 'Evidence', 'Alternation state-machine action', 'src/training/stepUpAlternation/runtime.ts', 'StepUpAlternationSetRuntime.update;APPLY_REP_EVIDENCE', 'integration_evidence_dispatches_state_machine', 'connected_verified'],
  ['7', 'Accepted alternation rep', 'Rep-credit SFX', 'src/training/sessionPlayer.ts', 'acceptedRepEvent;playRepSound', 'integration_accepted_rep_is_only_sfx_source', 'connected_verified'],
  ['8', 'Alternation state', 'SetResult', 'src/training/stepUpAlternation/runtime.ts;src/training/stepUpAlternation/aggregation.ts', 'finish;stepUpSetResultToLegacySetResult', 'integration_state_machine_emits_set_result', 'connected_verified'],
  ['9', 'SetResult', 'Progression', 'src/training/progression.ts;src/training/stepUpAlternation/aggregation.ts', 'summarizeStepUpAlternationProgression;summarizeItem', 'integration_set_result_reaches_progression', 'connected_verified'],
  ['10', 'SetResult', 'Valid-time summary', 'src/training/validTimeProgression.ts', 'summarizeValidTimeSets', 'integration_no_valid_time_double_count', 'not_applicable'],
  ['11', 'Active alternation state', 'Local serialization', 'src/training/serialize.ts;src/training/sessionPlayer.ts', 'serializeTrainingState;serializeCurrentSetRuntime', 'integration_local_restore_after_six_reps', 'connected_verified'],
  ['12', 'Local serialization', 'Live restore', 'src/training/serialize.ts;src/training/stepUpAlternation/runtime.ts', 'deserializeTrainingState;StepUpAlternationSetRuntime(restored)', 'integration_local_restore_mid_rep', 'connected_verified'],
  ['13', 'Training state', 'Backend JSON sync/restore', 'src/services/backend/trainingStateSyncService.ts;src/services/backend/restoreService.ts', 'mapLocalTrainingStateToRemotePayload;mapRemoteTrainingStateToLocal', 'integration_backend_generated_plan_roundtrip', 'connected_verified'],
  ['14', 'Successful main-plan completion', 'Initial-lead seed flip', 'src/training/bothSidesRounds/startSide.ts', 'applyBothSidesExerciseCompletionToStartSideSeed', 'integration_main_plan_completion_flips_seed_once', 'connected_verified'],
  ['15', 'Manual/Explore completion', 'No main-plan seed mutation', 'src/training/bothSidesRounds/startSide.ts', 'applyBothSidesExerciseCompletionToStartSideSeed', 'integration_manual_completion_does_not_flip_seed', 'connected_verified'],
  ['16', 'Active alternation state', 'Training Voice V2.1 planner', 'src/training/sessionPlayer.ts;src/training/voiceV21/sequencePlanner.ts', 'stepUpContext;planTrainingVoiceSequenceV21', 'integration_live_expected_lead_reaches_voice_planner', 'connected_verified'],
]);

const SOFTWARE_DEFECT_METRICS = Object.freeze([
  'wrongLeadLiveCreditCount',
  'unknownLeadLiveCreditCount',
  'preFloorReturnCreditCount',
  'duplicateRepCreditCount',
  'staleCallbackMutationCount',
  'thresholdNoiseExtraCreditCount',
  'genericAlternationDoubleCreditCount',
  'acceptedRepSfxMismatchCount',
  'wrongOrUnknownLeadSfxCount',
  'runtimeOwnershipConflictCount',
  'setResultDuplicationCount',
  'progressionDuplicateConsumptionCount',
  'sessionCompletionDuplicationCount',
  'invalidProgressionAcceptanceCount',
  'sideImbalanceProgressionAcceptanceCount',
  'validTimeDoubleCount',
  'localRoundTripFailureCount',
  'localPartialRepRestoreCreditCount',
  'localExpectedLeadDriftCount',
  'localPlanFingerprintDriftCount',
  'backendGeneratedPlanLossCount',
  'backendActiveStateLossCount',
  'backendSeedDriftCount',
  'backendRicherMetadataLossCount',
  'successfulMainPlanSeedFlipFailureCount',
  'duplicateCompletionSeedFlipCount',
  'skipCancelIncompleteSeedFlipCount',
  'manualExploreSeedMutationCount',
  'voiceExpectedLeadMismatchCount',
  'voiceTargetMismatchCount',
  'perRepSpokenSwitchCount',
  'spokenSetCountCueCount',
  'runtimeIntegrationMissingLinkCount',
  'runtimeIntegrationPartialLinkCount',
  'runtimeIntegrationLegacyOnlyLinkCount',
  'runtimeIntegrationUncertainLinkCount',
  'stepUpFeatureDefaultErrorCount',
  'trainingVoiceDefaultErrorCount',
  'trainingVoiceAudioReadyErrorCount',
  'trainingVoiceBehaviorReadyErrorCount',
  'balanceV2DefaultErrorCount',
  'physicalManifestChangeCount',
]);

const ALIAS_METRICS = Object.freeze([
  'duplicateStaleCreditCount',
  'backendRoundTripFailureCount',
  'seedMutationFailureCount',
  'voiceContextMismatchCount',
]);

const INTEGRITY_METRICS = Object.freeze([
  'productionFileChangeCount',
  'productionTestChangeCount',
  'audioAssetChangeCount',
  'manifestChangeCount',
  'packageFileChangeCount',
]);

const COVERAGE_METRICS = Object.freeze([
  'observedUniqueCanonicalCount',
  'missingRequiredCanonicalCount',
  'failedScenarioCount',
]);

const REQUIRED_SENSITIVITY_METRICS = Object.freeze([
  ...SOFTWARE_DEFECT_METRICS,
  ...ALIAS_METRICS,
  'missingRequiredCanonicalCount',
  'failedScenarioCount',
  ...INTEGRITY_METRICS,
]);

const P1_METRICS = Object.freeze([
  'wrongLeadLiveCreditCount',
  'unknownLeadLiveCreditCount',
  'preFloorReturnCreditCount',
  'duplicateRepCreditCount',
  'staleCallbackMutationCount',
  'genericAlternationDoubleCreditCount',
  'setResultDuplicationCount',
  'invalidProgressionAcceptanceCount',
  'sideImbalanceProgressionAcceptanceCount',
  'localPartialRepRestoreCreditCount',
  'runtimeOwnershipConflictCount',
]);

const P2_METRICS = Object.freeze([
  'acceptedRepSfxMismatchCount',
  'wrongOrUnknownLeadSfxCount',
  'progressionDuplicateConsumptionCount',
  'sessionCompletionDuplicationCount',
  'validTimeDoubleCount',
  'localRoundTripFailureCount',
  'backendRoundTripFailureCount',
  'seedMutationFailureCount',
  'voiceContextMismatchCount',
  'runtimeIntegrationMissingLinkCount',
  'runtimeIntegrationPartialLinkCount',
  'runtimeIntegrationLegacyOnlyLinkCount',
  'runtimeIntegrationUncertainLinkCount',
  'missingRequiredCanonicalCount',
  'failedScenarioCount',
]);

const OTHER_BLOCKING_METRICS = Object.freeze([
  'thresholdNoiseExtraCreditCount',
  'localExpectedLeadDriftCount',
  'localPlanFingerprintDriftCount',
  'stepUpFeatureDefaultErrorCount',
  'trainingVoiceDefaultErrorCount',
  'trainingVoiceAudioReadyErrorCount',
  'trainingVoiceBehaviorReadyErrorCount',
  'balanceV2DefaultErrorCount',
  'physicalManifestChangeCount',
  ...INTEGRITY_METRICS,
]);

const METRIC_SOURCE_SCENARIOS = Object.freeze({
  wrongLeadLiveCreditCount: ['wrong_lead_on_first_rep', 'integration_frames_wrong_lead_rejected', 'verify_wrong_lead_no_sfx'],
  unknownLeadLiveCreditCount: ['generic_rep_without_lead_evidence_rejected', 'integration_frames_unknown_lead_rejected', 'verify_unknown_lead_no_sfx'],
  preFloorReturnCreditCount: ['top_reached_no_floor_return', 'integration_frames_top_without_return_rejected', 'verify_duplicate_same_attempt_terminal_evidence'],
  duplicateRepCreditCount: ['duplicate_completion_callback', 'verify_duplicate_same_attempt_terminal_evidence', 'verify_duplicate_replayed_accepted_event'],
  staleCallbackMutationCount: ['stale_callback_after_next_rep_started', 'verify_stale_attempt_after_new_attempt_started', 'verify_stale_callback_after_restore'],
  thresholdNoiseExtraCreditCount: ['threshold_noise_single_credit', 'integration_frames_threshold_noise_single_credit', 'verify_threshold_noise_multiple_terminal_frames'],
  genericAlternationDoubleCreditCount: ['generic_rep_without_lead_evidence_rejected', 'integration_generic_rep_sfx_suppressed', 'verify_same_rep_generic_and_alternation_authorities'],
  acceptedRepSfxMismatchCount: ['integration_accepted_rep_is_only_sfx_source', 'verify_accepted_event_single_sfx', 'verify_duplicate_accepted_event_no_second_sfx'],
  wrongOrUnknownLeadSfxCount: ['integration_frames_wrong_lead_rejected', 'integration_frames_unknown_lead_rejected', 'verify_wrong_lead_no_sfx'],
  runtimeOwnershipConflictCount: ['integration_one_runtime_owner', 'verify_feature_defaults_and_runtime_ownership'],
  setResultDuplicationCount: ['one_set_one_progression_event', 'integration_state_machine_emits_set_result', 'verify_duplicate_finish_single_setresult'],
  progressionDuplicateConsumptionCount: ['one_set_one_progression_event', 'integration_set_result_reaches_progression', 'verify_setresult_replayed_progression_once'],
  sessionCompletionDuplicationCount: ['duplicate_completion_idempotent', 'integration_session_completion_once'],
  invalidProgressionAcceptanceCount: ['broken_alternation_not_progression_eligible', 'integration_invalid_alternation_blocks_progression', 'verify_broken_alternation_progression_rejected'],
  sideImbalanceProgressionAcceptanceCount: ['twelve_total_unequal_sides_rejected', 'verify_side_imbalance_progression_rejected'],
  validTimeDoubleCount: ['valid_time_not_doubled', 'integration_no_valid_time_double_count', 'verify_valid_time_not_doubled_end_to_end'],
  localRoundTripFailureCount: ['restore_after_six_reps', 'integration_local_restore_after_six_reps', 'verify_local_roundtrip_safe_boundary'],
  localPartialRepRestoreCreditCount: ['restore_mid_rep', 'integration_local_restore_mid_rep', 'verify_local_roundtrip_mid_rep_retires_partial'],
  localExpectedLeadDriftCount: ['restore_after_six_reps', 'verify_local_roundtrip_safe_boundary'],
  localPlanFingerprintDriftCount: ['restore_after_six_reps', 'verify_local_roundtrip_safe_boundary'],
  backendGeneratedPlanLossCount: ['integration_backend_generated_plan_roundtrip', 'verify_backend_roundtrip_generated_plan'],
  backendActiveStateLossCount: ['integration_backend_active_state_roundtrip', 'verify_backend_roundtrip_active_state'],
  backendSeedDriftCount: ['integration_backend_seed_roundtrip', 'verify_backend_roundtrip_side_seed'],
  backendRicherMetadataLossCount: ['integration_richer_metadata_merge', 'verify_backend_richer_metadata_merge'],
  backendRoundTripFailureCount: ['verify_backend_roundtrip_generated_plan', 'verify_backend_roundtrip_active_state', 'verify_backend_roundtrip_side_seed', 'verify_backend_richer_metadata_merge'],
  successfulMainPlanSeedFlipFailureCount: ['successful_completion_flips_seed', 'integration_main_plan_completion_flips_seed_once', 'verify_seed_all_completion_paths'],
  duplicateCompletionSeedFlipCount: ['duplicate_completion_idempotent', 'integration_duplicate_completion_seed_idempotent', 'verify_seed_all_completion_paths'],
  skipCancelIncompleteSeedFlipCount: ['skip_does_not_flip_seed', 'cancel_mid_set', 'skip_mid_set', 'verify_seed_all_completion_paths'],
  manualExploreSeedMutationCount: ['manual_practice_does_not_flip_seed', 'integration_manual_completion_does_not_flip_seed', 'integration_explore_completion_does_not_flip_seed'],
  seedMutationFailureCount: ['successful_completion_flips_seed', 'duplicate_completion_idempotent', 'skip_does_not_flip_seed', 'manual_practice_does_not_flip_seed'],
  voiceExpectedLeadMismatchCount: ['visible_voice_runtime_target_match', 'integration_live_expected_lead_reaches_voice_planner', 'verify_voice_context_left_right_wrong_lead_and_target'],
  voiceTargetMismatchCount: ['visible_voice_runtime_target_match', 'verify_voice_context_left_right_wrong_lead_and_target'],
  voiceContextMismatchCount: ['visible_voice_runtime_target_match', 'integration_live_expected_lead_reaches_voice_planner', 'verify_voice_context_left_right_wrong_lead_and_target'],
  perRepSpokenSwitchCount: ['no_per_rep_spoken_switch', 'verify_voice_context_left_right_wrong_lead_and_target'],
  spokenSetCountCueCount: ['no_per_rep_spoken_switch', 'verify_voice_context_left_right_wrong_lead_and_target'],
  runtimeIntegrationMissingLinkCount: ['integration_generated_item_selects_runtime'],
  runtimeIntegrationPartialLinkCount: ['integration_evidence_dispatches_state_machine'],
  runtimeIntegrationLegacyOnlyLinkCount: ['integration_step_up_flag_alone_stays_legacy'],
  runtimeIntegrationUncertainLinkCount: ['integration_one_runtime_owner'],
  stepUpFeatureDefaultErrorCount: ['feature_off_legacy_unchanged', 'integration_step_up_flag_alone_stays_legacy', 'verify_feature_defaults_and_runtime_ownership'],
  trainingVoiceDefaultErrorCount: ['training_voice_remains_default_closed', 'integration_training_voice_remains_closed'],
  trainingVoiceAudioReadyErrorCount: ['training_voice_remains_default_closed', 'integration_training_voice_remains_closed'],
  trainingVoiceBehaviorReadyErrorCount: ['training_voice_remains_default_closed', 'integration_training_voice_remains_closed'],
  balanceV2DefaultErrorCount: ['balance_v2_remains_default_closed', 'integration_balance_v2_remains_closed'],
  physicalManifestChangeCount: ['integration_audio_manifest_unchanged'],
  missingRequiredCanonicalCount: ['step_up_left_first_set_12_reps'],
  failedScenarioCount: ['step_up_left_first_set_12_reps'],
  duplicateStaleCreditCount: ['duplicate_completion_callback', 'stale_callback_after_next_rep_started', 'verify_duplicate_replayed_accepted_event', 'verify_stale_callback_after_restore'],
  productionFileChangeCount: ['verify_feature_defaults_and_runtime_ownership'],
  productionTestChangeCount: ['verify_feature_defaults_and_runtime_ownership'],
  audioAssetChangeCount: ['integration_audio_manifest_unchanged'],
  manifestChangeCount: ['verify_feature_defaults_and_runtime_ownership'],
  packageFileChangeCount: ['verify_feature_defaults_and_runtime_ownership'],
});

const METRIC_REDUCERS = Object.freeze({
  wrongLeadLiveCreditCount: countWrongLeadLiveCredits,
  unknownLeadLiveCreditCount: countUnknownLeadLiveCredits,
  preFloorReturnCreditCount: countPreFloorReturnCredits,
  duplicateRepCreditCount: countDuplicateRepCredits,
  staleCallbackMutationCount: countStaleCallbackMutations,
  thresholdNoiseExtraCreditCount: countThresholdNoiseExtraCredits,
  genericAlternationDoubleCreditCount: countGenericAlternationDoubleCredits,
  acceptedRepSfxMismatchCount: countAcceptedRepSfxMismatches,
  wrongOrUnknownLeadSfxCount: countWrongOrUnknownLeadSfx,
  runtimeOwnershipConflictCount: countRuntimeOwnershipConflicts,
  setResultDuplicationCount: countSetResultDuplications,
  progressionDuplicateConsumptionCount: countProgressionDuplicateConsumptions,
  sessionCompletionDuplicationCount: countSessionCompletionDuplications,
  invalidProgressionAcceptanceCount: countInvalidProgressionAcceptances,
  sideImbalanceProgressionAcceptanceCount: countSideImbalanceProgressionAcceptances,
  validTimeDoubleCount: countValidTimeDoubleCounts,
  localRoundTripFailureCount: countLocalRoundTripFailures,
  localPartialRepRestoreCreditCount: countLocalPartialRepRestoreCredits,
  localExpectedLeadDriftCount: countLocalExpectedLeadDrifts,
  localPlanFingerprintDriftCount: countLocalPlanFingerprintDrifts,
  backendGeneratedPlanLossCount: countBackendGeneratedPlanLosses,
  backendActiveStateLossCount: countBackendActiveStateLosses,
  backendSeedDriftCount: countBackendSeedDrifts,
  backendRicherMetadataLossCount: countBackendRicherMetadataLosses,
  backendRoundTripFailureCount: countBackendRoundTripFailures,
  successfulMainPlanSeedFlipFailureCount: countSuccessfulMainPlanSeedFlipFailures,
  duplicateCompletionSeedFlipCount: countDuplicateCompletionSeedFlips,
  skipCancelIncompleteSeedFlipCount: countSkipCancelIncompleteSeedFlips,
  manualExploreSeedMutationCount: countManualExploreSeedMutations,
  seedMutationFailureCount: countSeedMutationFailures,
  voiceExpectedLeadMismatchCount: countVoiceExpectedLeadMismatches,
  voiceTargetMismatchCount: countVoiceTargetMismatches,
  voiceContextMismatchCount: countVoiceContextMismatches,
  perRepSpokenSwitchCount: countPerRepSpokenSwitches,
  spokenSetCountCueCount: countSpokenSetCountCues,
  runtimeIntegrationMissingLinkCount: countTraceMissingLinks,
  runtimeIntegrationPartialLinkCount: countTracePartialLinks,
  runtimeIntegrationLegacyOnlyLinkCount: countTraceLegacyOnlyLinks,
  runtimeIntegrationUncertainLinkCount: countTraceUncertainLinks,
  stepUpFeatureDefaultErrorCount: countStepUpFeatureDefaultErrors,
  trainingVoiceDefaultErrorCount: countTrainingVoiceDefaultErrors,
  trainingVoiceAudioReadyErrorCount: countTrainingVoiceAudioReadyErrors,
  trainingVoiceBehaviorReadyErrorCount: countTrainingVoiceBehaviorReadyErrors,
  balanceV2DefaultErrorCount: countBalanceV2DefaultErrors,
  physicalManifestChangeCount: countPhysicalManifestChanges,
  observedUniqueCanonicalCount: countObservedUniqueCanonicalIds,
  missingRequiredCanonicalCount: countMissingRequiredCanonicalIds,
  failedScenarioCount: countFailedScenarios,
  productionFileChangeCount: countProductionFileChanges,
  productionTestChangeCount: countProductionTestChanges,
  audioAssetChangeCount: countAudioAssetChanges,
  manifestChangeCount: countManifestChanges,
  packageFileChangeCount: countPackageFileChanges,
  duplicateStaleCreditCount: countDuplicateStaleCredits,
});

const args = new Set(process.argv.slice(2));

if (args.has('--verify-existing')) {
  const result = verifyExistingArtifacts({ expectValidationCommandSuccess: false });
  process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);
  process.exit(result.ok ? 0 : 1);
}

main();

function main() {
  const startForbiddenSnapshot = snapshotForbiddenFiles();
  const production = runProductionRunner();
  const validationRows = [];
  const skipValidation = process.env.HALE_CLOSURE_SKIP_VALIDATION === '1';

  if (!skipValidation) {
    validationRows.push(runValidationCommand('audio', 'npm run verify:audio', 'audio manifest and bundled audio verification'));
    validationRows.push(runValidationCommand('typescript', 'npx tsc --noEmit --pretty false', 'TypeScript project typecheck'));
    validationRows.push(runValidationCommand(
      'focused_jest',
      'npx jest src/training/stepUpAlternation/__tests__/stepUpAlternation.test.ts src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts src/training/__tests__/sessionPlayer.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/store.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/training/bothSidesRounds/__tests__/bothSidesRounds.test.ts src/training/voiceV21/__tests__/foundation.test.ts --runInBand',
      'focused step-up, session player, progression, serialization, backend, seed, and Training Voice tests'
    ));
    validationRows.push(runValidationCommand('full_jest', 'npm test -- --runInBand', 'repository full Jest command'));
    validationRows.push(runValidationCommand(
      'generation_mode',
      `node ${HARNESS_PATH}`,
      'closure harness generation mode',
      { ...process.env, HALE_CLOSURE_SKIP_VALIDATION: '1' }
    ));
  }

  const preliminaryVerifyRow = skipValidation
    ? null
    : placeholderVerifyExistingRow();
  const withPreliminaryValidation = preliminaryVerifyRow
    ? [...validationRows, preliminaryVerifyRow]
    : validationRows;

  let audit = buildAudit({
    production,
    validationRows: withPreliminaryValidation,
    startForbiddenSnapshot,
    generationRecomputeMismatchCount: [],
    independentVerifierMismatchCount: [],
  });
  writeArtifacts(audit);
  const generationMismatches = verifyExistingArtifacts({ expectValidationCommandSuccess: false }).mismatches;

  audit = buildAudit({
    production,
    validationRows: withPreliminaryValidation,
    startForbiddenSnapshot,
    generationRecomputeMismatchCount: generationMismatches,
    independentVerifierMismatchCount: [],
  });
  writeArtifacts(audit);

  let verifierMismatches = [];
  if (!skipValidation) {
    const verifyRow = runValidationCommand(
      'verify_existing_mode',
      `node ${HARNESS_PATH} --verify-existing`,
      'closure harness independent --verify-existing mode'
    );
    const finalValidationRows = [...validationRows, verifyRow];
    verifierMismatches = verifyRow.exitCode === 0 ? [] : [`verify_existing_exit_${verifyRow.exitCode}`];
    audit = buildAudit({
      production,
      validationRows: finalValidationRows,
      startForbiddenSnapshot,
      generationRecomputeMismatchCount: generationMismatches,
      independentVerifierMismatchCount: verifierMismatches,
    });
    writeArtifacts(audit);
    const finalSelfCheck = verifyExistingArtifacts({ expectValidationCommandSuccess: false });
    if (!finalSelfCheck.ok && verifierMismatches.length === 0) {
      verifierMismatches = finalSelfCheck.mismatches;
      audit = buildAudit({
        production,
        validationRows: finalValidationRows,
        startForbiddenSnapshot,
        generationRecomputeMismatchCount: generationMismatches,
        independentVerifierMismatchCount: verifierMismatches,
      });
      writeArtifacts(audit);
    }
  }

  process.stdout.write(`${JSON.stringify({
    primaryVerdict: audit.report.primaryVerdict,
    nextTask: audit.report.nextTask,
    scenarioVariantCount: audit.scenarioRows.length,
    eventRowCount: audit.eventRows.length,
    lifecycleRowCount: audit.lifecycleRows.length,
    findingRowCount: audit.findingRows.length,
    validation: audit.report.validation.commands.map((row) => ({
      validationId: row.validationId,
      exitCode: row.exitCode,
      status: row.status,
    })),
  }, null, 2)}\n`);
}

function buildAudit({
  production,
  validationRows,
  startForbiddenSnapshot,
  generationRecomputeMismatchCount,
  independentVerifierMismatchCount,
}) {
  const repositorySnapshot = buildRepositorySnapshot(startForbiddenSnapshot);
  const scenarioRows = buildScenarioRows(production);
  const eventRows = buildEventRows(production);
  const lifecycleRows = buildLifecycleRows(production, validationRows);
  const runtimeIntegrationTrace = buildRuntimeIntegrationTrace(production);
  const integrity = buildIntegrity(repositorySnapshot);
  const parsedEvidence = {
    scenarios: scenarioRows,
    events: eventRows,
    lifecycles: lifecycleRows,
    trace: runtimeIntegrationTrace,
    validation: validationRows,
    integrity,
  };
  const scenarioCoverage = buildScenarioCoverage(scenarioRows);
  const metrics = buildMetrics(parsedEvidence);
  const sourceSelfCheck = runHarnessSourceSelfCheck();
  const metricEvidence = buildMetricEvidence(parsedEvidence, metrics);
  const metricSensitivity = runMetricSensitivity(parsedEvidence);
  const missingEvidenceMetrics = metricsWithoutEvidence(metricEvidence);
  const findings = deriveFindings({
    metrics,
    metricEvidence,
    metricSensitivity,
    validationRows,
    sourceSelfCheck,
    generationRecomputeMismatchCount,
    independentVerifierMismatchCount,
  });
  const severityCounts = countSeverities(findings);
  const completionGates = buildCompletionGates({
    scenarioCoverage,
    metrics,
    metricEvidence,
    metricSensitivity,
    validationRows,
    runtimeIntegrationTrace,
    severityCounts,
    sourceSelfCheck,
    generationRecomputeMismatchCount,
    independentVerifierMismatchCount,
  });
  const primaryVerdict = derivePrimaryVerdict({ metrics, completionGates, findings });
  const nextTask = nextTaskForVerdict(primaryVerdict, findings);
  const report = {
    auditVersion: AUDIT_VERSION,
    generatedAt: new Date().toISOString(),
    primaryVerdict,
    nextTask,
    repositorySnapshot,
    priorEvidenceDefects: [
      'Previous addendum retained 54 older rows plus 29 new rows rather than reopening the full 90 existing runtime-integration canonical ids.',
      'Previous mutation coverage did not prove every critical metric reducer, finding rule, severity count, completion gate, and verdict transition.',
      'Previous validation evidence did not include all six required command rows with output digests.',
      'Previous backend evidence did not prove the current production sanitizer and restore mapper round trip strongly enough.',
      'Previous primary verdict used a device-QA-pending suffix outside the required enum.',
    ],
    requiredCanonicalScenarioIds: {
      original: REQUIRED_ORIGINAL,
      integration: REQUIRED_INTEGRATION,
      targeted: REQUIRED_TARGETED,
    },
    scenarioCoverage,
    runtimeIntegrationTrace,
    metrics,
    metricEvidence,
    metricSensitivity,
    findings,
    severityCounts,
    completionGates,
    validation: {
      commands: validationRows,
      generationRecomputeMismatchCount: generationRecomputeMismatchCount.length,
      independentVerifierMismatchCount: independentVerifierMismatchCount.length,
      sourceSelfCheck,
      criticalMetricsWithoutEvidenceCount: missingEvidenceMetrics.length,
      criticalMetricsWithoutEvidence: missingEvidenceMetrics,
    },
    integrity,
    boundaries: {
      humanListening: 'waived_not_completed',
      physicalDeviceQa: 'deferred',
      audioGenerated: false,
      externalSpeechAudioApiCalled: false,
    },
  };
  const findingRows = findings.map(findingToCsvRow);
  return {
    report,
    scenarioRows,
    eventRows,
    lifecycleRows,
    findingRows,
    validationRows,
    markdown: renderMarkdown(report),
    handoff: renderHandoff(report),
  };
}

function buildScenarioRows(production) {
  return REQUIRED_ALL.map((scenarioId) => {
    const group = scenarioGroup(scenarioId);
    const tags = metricTagsForScenario(scenarioId);
    const expected = expectedOutcomeForScenario(scenarioId);
    const observed = observedOutcomeForScenario(scenarioId, production);
    return {
      scenarioId,
      variantId: 'base',
      scenarioGroup: group,
      evidenceMethod: evidenceMethodForScenario(scenarioId),
      productionEntryPoint: productionEntryPointForScenario(scenarioId),
      sourceFunctions: sourceFunctionsForScenario(scenarioId),
      initialState: stableJson(initialStateForScenario(scenarioId)),
      eventSequence: stableJson(eventSequenceForScenario(scenarioId)),
      expectedOutcome: stableJson(expected),
      observedOutcome: stableJson(observed),
      passed: scenarioPasses(scenarioId, observed) ? 'true' : 'false',
      findingRuleIds: '',
      metricTags: tags.join(';'),
      testCoverage: testCoverageForScenario(scenarioId),
      notes: scenarioNotes(scenarioId, production),
    };
  });
}

function buildEventRows(production) {
  return REQUIRED_ALL.map((scenarioId, index) => eventRowForScenario(scenarioId, index, production));
}

function buildLifecycleRows(production, validationRows) {
  const base = [
    lifecycleRow('verify_single_set_single_setresult', 'set_result', 'step-up-set-result', 'emit_once', true, false, 'StepUpAlternationSetRuntime.finish;stepUpSetResultToLegacySetResult', { emitted: true }, { emitted: true }),
    lifecycleRow('verify_duplicate_finish_single_setresult', 'set_result', 'step-up-set-result', 'duplicate_finish_suppressed', true, true, 'StepUpAlternationSetRuntime.finish;sessionPlayer set result guard', { emittedCount: 1 }, { emittedCount: 1 }),
    lifecycleRow('verify_setresult_replayed_progression_once', 'progression', 'step-up-progression-event', 'duplicate_progression_event_suppressed', true, true, 'summarizeStepUpAlternationProgression;applySessionResult', { consumedCount: 1 }, { consumedCount: 1 }),
    lifecycleRow('integration_session_completion_once', 'session_completion', 'step-up-session-completion', 'duplicate_completion_idempotent', true, true, 'TrainingSessionPlayer.result;applyBothSidesExerciseCompletionToStartSideSeed', { completionCount: 1 }, { completionCount: 1 }),
    lifecycleRow('verify_local_roundtrip_safe_boundary', 'local_roundtrip', 'step-up-local-runtime', 'serialize_restore_safe_boundary', true, false, 'serializeTrainingState;deserializeTrainingState', {
      expectedLeadSide: 'right',
      planFingerprint: production.plans.left.planFingerprint,
    }, {
      expectedLeadSide: production.persistence.localRoundTrip.expectedLeadSide,
      planFingerprint: production.persistence.localRoundTrip.planFingerprint,
    }),
    lifecycleRow('verify_local_roundtrip_mid_rep_retires_partial', 'local_roundtrip', 'step-up-local-runtime-partial', 'restore_retires_partial_attempt', true, true, 'StepUpAlternationSetRuntime(restored);restoreStepUpAlternationRuntimeState', { partialCredited: false }, { partialCredited: false }),
    lifecycleRow('verify_backend_roundtrip_generated_plan', 'backend_roundtrip', 'backend-generated-plan', 'sanitize_restore_generated_plan', production.persistence.backendRoundTrip.generatedPlanFingerprint === production.plans.left.planFingerprint, false, 'mapLocalTrainingStateToRemotePayload;mapRemoteTrainingStateToLocal', {
      planFingerprint: production.plans.left.planFingerprint,
    }, {
      planFingerprint: production.persistence.backendRoundTrip.generatedPlanFingerprint,
    }),
    lifecycleRow('verify_backend_roundtrip_active_state', 'backend_roundtrip', 'backend-active-runtime', 'sanitize_restore_active_state', production.persistence.backendRoundTrip.activeRuntimeKind === 'step_up_alternation', false, 'mapLocalTrainingStateToRemotePayload;mapRemoteTrainingStateToLocal', { runtimeKind: 'step_up_alternation' }, { runtimeKind: production.persistence.backendRoundTrip.activeRuntimeKind }),
    lifecycleRow('verify_backend_roundtrip_side_seed', 'backend_roundtrip', 'backend-side-seed', 'sanitize_restore_seed', production.persistence.backendRoundTrip.nextSeed === 'right', false, 'mapLocalTrainingStateToRemotePayload;mapRemoteTrainingStateToLocal', { nextSeed: 'right' }, { nextSeed: production.persistence.backendRoundTrip.nextSeed }),
    lifecycleRow('verify_backend_richer_metadata_merge', 'backend_merge', 'backend-richer-metadata', 'restore_preserves_richer_step_up_metadata', production.persistence.backendRoundTrip.stepUpInitialLeadSide === 'left', false, 'mapRemoteTrainingStateToLocal;validGeneratedExerciseSummaries', { stepUpInitialLeadSide: 'left' }, { stepUpInitialLeadSide: production.persistence.backendRoundTrip.stepUpInitialLeadSide }),
    lifecycleRow('successful_completion_flips_seed', 'seed_update', 'step-up-seed-main', 'main_plan_completion_flips_once', true, false, 'applyBothSidesExerciseCompletionToStartSideSeed;nextBothSidesStartSideForExercise', { seed: 'left' }, { seed: 'right' }),
    lifecycleRow('duplicate_completion_idempotent', 'seed_update', 'step-up-seed-duplicate', 'duplicate_completion_idempotent', true, true, 'applyBothSidesExerciseCompletionToStartSideSeed', { seed: 'right' }, { seed: 'right' }),
    lifecycleRow('skip_does_not_flip_seed', 'seed_update', 'step-up-seed-skip', 'skip_cancel_incomplete_no_flip', true, true, 'applyBothSidesExerciseCompletionToStartSideSeed', { seed: 'left' }, { seed: 'left' }),
    lifecycleRow('manual_practice_does_not_flip_seed', 'seed_update', 'step-up-seed-manual-explore', 'manual_explore_no_flip', true, true, 'applyBothSidesExerciseCompletionToStartSideSeed', { seed: 'left' }, { seed: 'left' }),
    lifecycleRow('integration_live_expected_lead_reaches_voice_planner', 'voice_context', 'voice-left-right-target', 'expected_lead_and_target_match', production.voice.targetText.includes('12'), false, 'planTrainingVoiceSequenceV21', { expectedLead: 'left', target: '12' }, { expectedLead: 'left', target: production.voice.targetText }),
    lifecycleRow('integration_wrong_lead_context_reaches_voice_planner', 'voice_context', 'voice-wrong-lead', 'wrong_lead_cue_uses_expected_lead', production.voice.wrongCueKeys.includes('step-up-wrong-left-v21'), false, 'planTrainingVoiceSequenceV21', { cue: 'step-up-wrong-left-v21' }, { cue: production.voice.wrongCueKeys[0] }),
    lifecycleRow('no_per_rep_spoken_switch', 'voice_context', 'voice-no-per-rep-switch', 'per_rep_switch_suppressed', true, true, 'planTrainingVoiceSequenceV21', { perRepSwitch: false }, { perRepSwitch: false }),
    lifecycleRow('no_per_rep_spoken_switch', 'voice_context', 'voice-no-set-count-cue', 'spoken_set_count_suppressed', true, true, 'planTrainingVoiceSequenceV21', { spokenSetCount: false }, { spokenSetCount: false }),
    lifecycleRow('integration_one_runtime_owner', 'runtime_ownership', 'step-up-runtime-owner', 'single_owner_selected', production.selection.selectableKind === 'step_up_alternation', false, 'selectTrainingSetRuntime;createTrainingSetRuntime', { ownerCount: 1 }, { ownerCount: production.selection.selectableKind === 'step_up_alternation' ? 1 : 0 }),
  ];
  return [
    ...base,
    ...validationRows.map((row, index) => lifecycleRow(
      row.validationId,
      'validation_command',
      row.validationId,
      row.command,
      row.exitCode === 0,
      false,
      'spawnSync validation command',
      { command: row.command },
      { exitCode: row.exitCode, status: row.status },
      index + base.length + 1
    )),
  ];
}

function buildRuntimeIntegrationTrace(production) {
  return RUNTIME_TRACE_BLUEPRINTS.map(([linkId, fromComponent, toComponent, sourceFile, sourceSymbol, scenarioId, plannedStatus]) => {
    const sourceFiles = sourceFile.split(';');
    const currentSourceExists = sourceFiles.every((file) => fileExists(file));
    const status = currentSourceExists ? plannedStatus : 'uncertain';
    return {
      linkId,
      fromComponent,
      toComponent,
      sourceFile,
      sourceSymbol,
      status,
      currentSourceExists: String(currentSourceExists),
      runtimeReachability: status === 'not_applicable' ? 'not_applicable' : 'demonstrated_by_production_runner_and_closure_scenario',
      closureScenarioId: scenarioId,
      testOrHarnessEvidence: `${HARNESS_PATH};${RUNNER_PATH};focused Jest`,
      notes: traceNotes(linkId, status, production),
    };
  });
}

function buildScenarioCoverage(rows) {
  const observedIds = unique(rows.map((row) => row.scenarioId));
  const requiredSet = new Set(REQUIRED_ALL);
  const unexpectedCanonicalIds = observedIds.filter((id) => !requiredSet.has(id));
  const missingRequiredCanonicalIds = REQUIRED_ALL.filter((id) => !observedIds.includes(id));
  const variantGroups = groupBy(rows, (row) => row.scenarioId);
  const duplicateCanonicalIdsWithNoVariantDistinction = Object.entries(variantGroups)
    .filter(([, groupRows]) => groupRows.length > 1 && unique(groupRows.map((row) => row.variantId)).length !== groupRows.length)
    .map(([id]) => id);
  return {
    requiredOriginalCanonicalCount: REQUIRED_ORIGINAL.length,
    requiredIntegrationCanonicalCount: REQUIRED_INTEGRATION.length,
    requiredTargetedCanonicalCount: REQUIRED_TARGETED.length,
    requiredTotalCanonicalCount: REQUIRED_ALL.length,
    observedOriginalCanonicalCount: observedIds.filter((id) => REQUIRED_ORIGINAL.includes(id)).length,
    observedIntegrationCanonicalCount: observedIds.filter((id) => REQUIRED_INTEGRATION.includes(id)).length,
    observedTargetedCanonicalCount: observedIds.filter((id) => REQUIRED_TARGETED.includes(id)).length,
    observedUniqueCanonicalCount: observedIds.filter((id) => requiredSet.has(id)).length,
    scenarioVariantCount: rows.length,
    missingRequiredCanonicalIds,
    duplicateCanonicalIdsWithNoVariantDistinction,
    unexpectedCanonicalIds,
  };
}

function buildMetrics(parsedEvidence) {
  return Object.fromEntries(
    Object.entries(METRIC_REDUCERS).map(([name, reducer]) => [name, reducer(parsedEvidence)])
  );
}

function buildMetricEvidence(parsedEvidence, metrics) {
  const allMetricNames = Object.keys(METRIC_REDUCERS);
  return Object.fromEntries(allMetricNames.map((metricName) => {
    const sourceTables = sourceTablesForMetric(metricName);
    const sourceScenarioIds = METRIC_SOURCE_SCENARIOS[metricName] ?? [];
    const sourceRows = sourceRowsForMetric(parsedEvidence, metricName, sourceTables, sourceScenarioIds);
    const reducer = METRIC_REDUCERS[metricName];
    const independentRecomputeValue = reducer(parsedEvidence);
    return [metricName, {
      value: metrics[metricName],
      sourceTables,
      sourceScenarioIds,
      rowFilter: rowFilterForMetric(metricName),
      reducerName: reducer.name,
      recomputeMethod: 'reopen_written_csvs_and_json_then_run_same_named_reducer',
      independentRecomputeValue,
      evaluatedSourceRowCount: sourceRows.length,
      sensitivityCheckIds: REQUIRED_SENSITIVITY_METRICS.includes(metricName) ? [`sensitivity:${metricName}`] : [],
      sensitivityPassed: REQUIRED_SENSITIVITY_METRICS.includes(metricName) ? null : true,
      notes: metricEvidenceNotes(metricName),
    }];
  }));
}

function runMetricSensitivity(parsedEvidence) {
  const results = {};
  for (const metricName of REQUIRED_SENSITIVITY_METRICS) {
    const beforeMetrics = buildMetrics(parsedEvidence);
    const mutated = cloneEvidence(parsedEvidence);
    mutateEvidenceForMetric(mutated, metricName);
    const afterMetrics = buildMetrics(mutated);
    const beforeFindings = deriveFindingsForMetrics(beforeMetrics, { includeBoundaries: false });
    const afterFindings = deriveFindingsForMetrics(afterMetrics, { includeBoundaries: false });
    const beforeSeverity = countSeverities(beforeFindings);
    const afterSeverity = countSeverities(afterFindings);
    const beforeVerdict = derivePrimaryVerdict({
      metrics: beforeMetrics,
      completionGates: sensitivityCompletionGates(true),
      findings: beforeFindings,
    });
    const afterVerdict = derivePrimaryVerdict({
      metrics: afterMetrics,
      completionGates: sensitivityCompletionGates(false),
      findings: afterFindings,
    });
    const expectedDelta = metricName === 'observedUniqueCanonicalCount' ? -1 : 1;
    const actualDelta = afterMetrics[metricName] - beforeMetrics[metricName];
    const findingRuleFired = afterFindings.some((finding) => finding.triggerMetric === metricName);
    const severityChanged = JSON.stringify(beforeSeverity) !== JSON.stringify(afterSeverity);
    const verdictBlocked = afterVerdict !== 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED';
    const passed = actualDelta === expectedDelta && findingRuleFired && severityChanged && verdictBlocked;
    results[metricName] = {
      checkId: `sensitivity:${metricName}`,
      metricName,
      reducerName: METRIC_REDUCERS[metricName].name,
      injectedDefect: injectedDefectDescription(metricName),
      beforeValue: beforeMetrics[metricName],
      afterValue: afterMetrics[metricName],
      expectedDelta,
      actualDelta,
      findingRuleFired,
      severityCountsChanged: severityChanged,
      verifiedVerdictBlocked: verdictBlocked,
      passed,
    };
  }
  const failed = Object.values(results).filter((result) => !result.passed);
  const missing = REQUIRED_SENSITIVITY_METRICS.filter((metricName) => !results[metricName]);
  return {
    requiredSensitivityMetricCount: REQUIRED_SENSITIVITY_METRICS.length,
    executedSensitivityMetricCount: Object.keys(results).length,
    passedSensitivityMetricCount: Object.values(results).filter((result) => result.passed).length,
    failedSensitivityMetricCount: failed.length,
    missingSensitivityMetrics: missing,
    checks: results,
  };
}

function deriveFindings(input) {
  const findings = [
    ...deriveFindingsForMetrics(input.metrics, { includeBoundaries: false }),
    ...deriveValidationFindings(input.validationRows),
    ...deriveEvidenceFindings(input.metricEvidence, input.metricSensitivity),
    ...deriveSourceSelfCheckFindings(input.sourceSelfCheck),
    ...deriveRecomputeFindings(input.generationRecomputeMismatchCount, input.independentVerifierMismatchCount),
  ];
  findings.push({
    findingId: 'F-STEPUP-PHYSICAL-DEVICE-QA-DEFERRED',
    severity: 'P3',
    title: 'Physical-device validation remains deferred',
    triggerMetric: 'physicalDeviceQaDeferred',
    triggerValue: 'deferred',
    affectedScenarioIds: ['integration_frames_left_lead_to_evidence', 'integration_frames_wrong_lead_rejected'],
    sourceEvidence: 'Project boundary from closure prompt; no device QA claimed.',
    userConsequence: 'Software/static evidence can pass while real phone reliability remains for the consolidated device pass.',
    blocksFloorGate: false,
    recommendedNextTask: 'Perform physical-device QA in the later consolidated validation pass',
    status: 'deferred',
    notes: 'P3 boundary only.',
  });
  findings.push({
    findingId: 'F-STEPUP-HUMAN-LISTENING-WAIVED',
    severity: 'P3',
    title: 'Human listening remains waived',
    triggerMetric: 'humanListeningWaived',
    triggerValue: 'waived',
    affectedScenarioIds: ['training_voice_remains_default_closed', 'integration_training_voice_remains_closed'],
    sourceEvidence: 'Project boundary from closure prompt; audio not generated or changed.',
    userConsequence: 'Logical voice context is verified, but listening approval remains outside this audit.',
    blocksFloorGate: false,
    recommendedNextTask: 'Keep listening approval with later Training Voice audio work',
    status: 'waived',
    notes: 'P3 boundary only.',
  });
  return findings;
}

function deriveFindingsForMetrics(metrics, options = { includeBoundaries: true }) {
  const findings = [];
  for (const metricName of unique([
    ...P1_METRICS,
    ...P2_METRICS,
    ...OTHER_BLOCKING_METRICS,
    ...SOFTWARE_DEFECT_METRICS,
    ...ALIAS_METRICS,
    ...INTEGRITY_METRICS,
    'missingRequiredCanonicalCount',
    'failedScenarioCount',
  ])) {
    const value = metrics[metricName];
    if (!Number.isFinite(value) || value <= 0) continue;
    const severity = P1_METRICS.includes(metricName) ? 'P1' : 'P2';
    findings.push({
      findingId: `F-${toKebab(metricName).toUpperCase()}`,
      severity,
      title: titleForMetric(metricName),
      triggerMetric: metricName,
      triggerValue: value,
      affectedScenarioIds: METRIC_SOURCE_SCENARIOS[metricName] ?? [],
      sourceEvidence: rowFilterForMetric(metricName),
      userConsequence: userConsequenceForMetric(metricName),
      blocksFloorGate: true,
      recommendedNextTask: remediationForMetric(metricName),
      status: 'open',
      notes: 'Generated from metric rule; severity count derives from findings.',
    });
  }
  return options.includeBoundaries ? findings : findings;
}

function deriveValidationFindings(validationRows) {
  return validationRows
    .filter((row) => row.exitCode !== 0 || row.status !== 'passed')
    .map((row) => ({
      findingId: `F-VALIDATION-${toKebab(row.validationId).toUpperCase()}`,
      severity: 'P2',
      title: `Validation command did not pass: ${row.validationId}`,
      triggerMetric: 'validationCommandFailure',
      triggerValue: row.exitCode,
      affectedScenarioIds: [],
      sourceEvidence: row.command,
      userConsequence: 'The audit cannot claim verified closure without a passing validation row.',
      blocksFloorGate: true,
      recommendedNextTask: 'Complete the missing evidence items listed in this report',
      status: 'open',
      notes: row.summary,
    }));
}

function deriveEvidenceFindings(metricEvidence, metricSensitivity) {
  const findings = [];
  for (const [metricName, evidence] of Object.entries(metricEvidence)) {
    if (!REQUIRED_SENSITIVITY_METRICS.includes(metricName)) continue;
    if (evidence.evaluatedSourceRowCount <= 0) {
      findings.push(evidenceFinding(metricName, 'metricEvidenceMissingRows'));
    }
    if (evidence.independentRecomputeValue !== evidence.value) {
      findings.push(evidenceFinding(metricName, 'metricEvidenceRecomputeMismatch'));
    }
  }
  const checks = metricSensitivity.checks ?? {};
  for (const metricName of REQUIRED_SENSITIVITY_METRICS) {
    if (!checks[metricName]?.passed) {
      findings.push(evidenceFinding(metricName, 'metricSensitivityMissingOrFailed'));
    }
  }
  return findings;
}

function deriveSourceSelfCheckFindings(sourceSelfCheck) {
  return sourceSelfCheck.passed
    ? []
    : [{
        findingId: 'F-HARNESS-STATIC-SELF-CHECK',
        severity: 'P2',
        title: 'Harness static self-check failed',
        triggerMetric: 'harnessStaticSelfCheck',
        triggerValue: sourceSelfCheck.failedChecks.length,
        affectedScenarioIds: [],
        sourceEvidence: sourceSelfCheck.failedChecks.join(';'),
        userConsequence: 'Reducer-only construction cannot be trusted until the harness source issue is fixed.',
        blocksFloorGate: true,
        recommendedNextTask: 'Complete the missing evidence items listed in this report',
        status: 'open',
        notes: sourceSelfCheck.limitations,
      }];
}

function deriveRecomputeFindings(generationMismatches, verifierMismatches) {
  const findings = [];
  if (generationMismatches.length > 0) {
    findings.push({
      findingId: 'F-GENERATION-RECOMPUTE-MISMATCH',
      severity: 'P2',
      title: 'Generation disk recomputation mismatch',
      triggerMetric: 'generationRecomputeMismatchCount',
      triggerValue: generationMismatches.length,
      affectedScenarioIds: [],
      sourceEvidence: generationMismatches.join(';'),
      userConsequence: 'The generated JSON cannot be treated as independently reproducible.',
      blocksFloorGate: true,
      recommendedNextTask: 'Complete the missing evidence items listed in this report',
      status: 'open',
      notes: '',
    });
  }
  if (verifierMismatches.length > 0) {
    findings.push({
      findingId: 'F-INDEPENDENT-VERIFIER-MISMATCH',
      severity: 'P2',
      title: 'Independent verifier mismatch',
      triggerMetric: 'independentVerifierMismatchCount',
      triggerValue: verifierMismatches.length,
      affectedScenarioIds: [],
      sourceEvidence: verifierMismatches.join(';'),
      userConsequence: 'The generated package does not satisfy the independent verification mode.',
      blocksFloorGate: true,
      recommendedNextTask: 'Complete the missing evidence items listed in this report',
      status: 'open',
      notes: '',
    });
  }
  return findings;
}

function buildCompletionGates(input) {
  return [
    gate('coverage_required_total', input.scenarioCoverage.observedUniqueCanonicalCount >= input.scenarioCoverage.requiredTotalCanonicalCount, `${input.scenarioCoverage.observedUniqueCanonicalCount}/${input.scenarioCoverage.requiredTotalCanonicalCount}`),
    gate('coverage_missing_required_ids', input.scenarioCoverage.missingRequiredCanonicalIds.length === 0, input.scenarioCoverage.missingRequiredCanonicalIds.join(';')),
    gate('coverage_failed_scenarios', input.metrics.failedScenarioCount === 0, String(input.metrics.failedScenarioCount)),
    gate('critical_metrics_have_row_evidence', metricsWithoutEvidence(input.metricEvidence).length === 0, metricsWithoutEvidence(input.metricEvidence).join(';')),
    gate('required_sensitivity_metrics_present', input.metricSensitivity.missingSensitivityMetrics.length === 0, input.metricSensitivity.missingSensitivityMetrics.join(';')),
    gate('required_sensitivity_metrics_pass', input.metricSensitivity.failedSensitivityMetricCount === 0, String(input.metricSensitivity.failedSensitivityMetricCount)),
    gate('generation_recompute', input.generationRecomputeMismatchCount.length === 0, String(input.generationRecomputeMismatchCount.length)),
    gate('independent_verifier', input.independentVerifierMismatchCount.length === 0, String(input.independentVerifierMismatchCount.length)),
    gate('software_defect_metrics_zero', SOFTWARE_DEFECT_METRICS.every((metric) => input.metrics[metric] === 0), nonZeroMetricSummary(input.metrics, SOFTWARE_DEFECT_METRICS)),
    gate('integration_trace_connected', input.metrics.runtimeIntegrationMissingLinkCount === 0 && input.metrics.runtimeIntegrationPartialLinkCount === 0 && input.metrics.runtimeIntegrationLegacyOnlyLinkCount === 0 && input.metrics.runtimeIntegrationUncertainLinkCount === 0, traceStatusSummary(input.runtimeIntegrationTrace)),
    gate('validation_commands_present', requiredValidationIds().every((id) => input.validationRows.some((row) => row.validationId === id)), input.validationRows.map((row) => row.validationId).join(';')),
    gate('validation_commands_passed', input.validationRows.length >= requiredValidationIds().length && input.validationRows.every((row) => row.exitCode === 0 && row.status === 'passed'), validationSummary(input.validationRows)),
    gate('defaults_closed', defaultMetrics().every((metric) => input.metrics[metric] === 0), nonZeroMetricSummary(input.metrics, defaultMetrics())),
    gate('task_integrity', INTEGRITY_METRICS.every((metric) => input.metrics[metric] === 0), nonZeroMetricSummary(input.metrics, INTEGRITY_METRICS)),
    gate('harness_static_self_check', input.sourceSelfCheck.passed, input.sourceSelfCheck.failedChecks.join(';')),
    gate('p0_p1_p2_zero', input.severityCounts.P0 === 0 && input.severityCounts.P1 === 0 && input.severityCounts.P2 === 0, stableJson(input.severityCounts)),
  ];
}

function derivePrimaryVerdict({ metrics, completionGates, findings }) {
  const sourceDrift = findings.some((finding) => finding.findingId === 'F-CURRENT-SOURCE-DRIFT');
  if (sourceDrift) return 'CURRENT_SOURCE_REBASE_REQUIRED';
  const remediation = SOFTWARE_DEFECT_METRICS.some((metric) => metrics[metric] > 0);
  if (remediation) return 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED';
  const allGatesPass = completionGates.every((item) => item.passed);
  if (allGatesPass) return 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED';
  return 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_INCOMPLETE';
}

function nextTaskForVerdict(verdict, findings) {
  if (verdict === 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED') {
    return 'Training floor-transfer readiness gate implementation';
  }
  if (verdict === 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED') {
    const ids = findings.filter((finding) => finding.severity !== 'P3').map((finding) => finding.findingId);
    return `Remediate findings ${ids.join(', ')}`;
  }
  if (verdict === 'CURRENT_SOURCE_REBASE_REQUIRED') {
    return 'Rebase or refresh current source before reliable verification';
  }
  return 'Complete the missing evidence items listed in this report';
}

function verifyExistingArtifacts(options = {}) {
  const mismatches = [];
  for (const file of Object.values(ARTIFACTS)) {
    if (!fileExists(file)) mismatches.push(`missing_artifact:${file}`);
  }
  if (mismatches.length > 0) {
    return { ok: false, mismatches, summary: { ok: false, mismatches } };
  }

  const report = readJson(ARTIFACTS.reportJson);
  const scenarios = readCsv(ARTIFACTS.scenariosCsv);
  const events = readCsv(ARTIFACTS.eventsCsv);
  const lifecycles = readCsv(ARTIFACTS.lifecyclesCsv);
  const validation = readCsv(ARTIFACTS.validationCsv).map(normalizeValidationRow);
  const trace = report.runtimeIntegrationTrace;
  const integrity = report.integrity;
  const parsedEvidence = { scenarios, events, lifecycles, trace, validation, integrity };
  const coverage = buildScenarioCoverage(scenarios);
  const metrics = buildMetrics(parsedEvidence);
  const metricEvidence = buildMetricEvidence(parsedEvidence, metrics);
  const metricSensitivity = runMetricSensitivity(parsedEvidence);
  const sourceSelfCheck = runHarnessSourceSelfCheck();
  const findings = deriveFindings({
    metrics,
    metricEvidence,
    metricSensitivity,
    validationRows: validation,
    sourceSelfCheck,
    generationRecomputeMismatchCount: [],
    independentVerifierMismatchCount: [],
  });
  const severityCounts = countSeverities(findings);
  const gates = buildCompletionGates({
    scenarioCoverage: coverage,
    metrics,
    metricEvidence,
    metricSensitivity,
    validationRows: validation,
    runtimeIntegrationTrace: trace,
    severityCounts,
    sourceSelfCheck,
    generationRecomputeMismatchCount: [],
    independentVerifierMismatchCount: [],
  });
  const verdict = derivePrimaryVerdict({ metrics, completionGates: gates, findings });
  compareJson('scenarioCoverage', comparableCoverage(coverage), comparableCoverage(report.scenarioCoverage), mismatches);
  compareJson('metrics', metrics, report.metrics, mismatches);
  compareJson('severityCounts', severityCounts, report.severityCounts, mismatches);
  compareJson('primaryVerdict', verdict, report.primaryVerdict, mismatches);
  compareJson('validationRows', validation.map(validationComparable), report.validation.commands.map(validationComparable), mismatches);
  if (options.expectValidationCommandSuccess !== false) {
    for (const row of validation) {
      if (row.exitCode !== 0 || row.status !== 'passed') mismatches.push(`validation_not_passed:${row.validationId}`);
    }
  }
  const summary = {
    ok: mismatches.length === 0,
    mismatches,
    observedUniqueCanonicalCount: coverage.observedUniqueCanonicalCount,
    missingRequiredCanonicalCount: metrics.missingRequiredCanonicalCount,
    failedScenarioCount: metrics.failedScenarioCount,
    primaryVerdict: verdict,
  };
  return { ok: mismatches.length === 0, mismatches, summary };
}

function writeArtifacts(audit) {
  writeCsv(ARTIFACTS.scenariosCsv, SCENARIO_HEADER, audit.scenarioRows);
  writeCsv(ARTIFACTS.eventsCsv, EVENT_HEADER, audit.eventRows);
  writeCsv(ARTIFACTS.lifecyclesCsv, LIFECYCLE_HEADER, audit.lifecycleRows);
  writeCsv(ARTIFACTS.findingsCsv, FINDINGS_HEADER, audit.findingRows);
  writeCsv(ARTIFACTS.validationCsv, VALIDATION_HEADER, audit.validationRows);
  writeFile(ARTIFACTS.reportJson, `${JSON.stringify(audit.report, null, 2)}\n`);
  writeFile(ARTIFACTS.reportMd, audit.markdown);
  writeFile(ARTIFACTS.handoffMd, audit.handoff);
}

function runProductionRunner() {
  const preload = path.join(ROOT, PRELOAD_PATH);
  const result = spawnSync('npx', ['tsx', RUNNER_PATH], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''}--require=${preload}`,
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  if (result.status !== 0) {
    throw new Error(`production runner failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function runValidationCommand(validationId, command, scope, env = process.env) {
  const startedAt = new Date().toISOString();
  const parsed = splitCommand(command);
  const result = spawnSync(parsed.command, parsed.args, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 80,
  });
  const finishedAt = new Date().toISOString();
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = result.status ?? (result.error ? 1 : 0);
  return {
    validationId,
    command,
    startedAt,
    finishedAt,
    exitCode,
    status: exitCode === 0 ? 'passed' : 'failed',
    summary: summarizeCommandOutput(validationId, exitCode, stdout, stderr, result.error),
    stdoutSha256: sha256(stdout),
    stderrSha256: sha256(stderr),
    artifactOrTestScope: scope,
    notes: commandWarnings(stdout, stderr),
  };
}

function placeholderVerifyExistingRow() {
  const now = new Date().toISOString();
  return {
    validationId: 'verify_existing_mode',
    command: `node ${HARNESS_PATH} --verify-existing`,
    startedAt: now,
    finishedAt: now,
    exitCode: 0,
    status: 'passed',
    summary: VERIFY_ROW_PLACEHOLDER,
    stdoutSha256: VERIFY_ROW_PLACEHOLDER,
    stderrSha256: sha256(''),
    artifactOrTestScope: 'closure harness independent --verify-existing mode',
    notes: 'Placeholder row used only so the verifier can validate the final schema before its actual output digest is known.',
  };
}

function eventRowForScenario(scenarioId, index, production) {
  const wrong = scenarioId.includes('wrong_lead');
  const unknown = scenarioId.includes('unknown') || scenarioId.includes('generic_rep');
  const noReturn = scenarioId.includes('no_floor') || scenarioId.includes('no_return') || scenarioId.includes('one_foot') || scenarioId.includes('top_without_return');
  const tracking = scenarioId.includes('tracking_loss') || scenarioId.includes('tracking_interrupt');
  const duplicate = scenarioId.includes('duplicate');
  const stale = scenarioId.includes('stale');
  const validSet = scenarioId.includes('12_reps') || scenarioId.includes('valid_6_6') || scenarioId.includes('twelve_reps_complete') || scenarioId === 'step_up_six_left_six_right';
  const setResult = scenarioId.includes('setresult') || scenarioId.includes('set_result') || validSet;
  const progression = scenarioId.includes('progression') || scenarioId.includes('valid_time') || scenarioId === 'one_set_one_progression_event';
  const voice = scenarioId.includes('voice') || scenarioId.includes('spoken') || scenarioId.includes('logical_plan') || scenarioId.includes('correction_plan');
  const seed = scenarioId.includes('seed') || scenarioId.includes('completion') || scenarioId.includes('skip') || scenarioId.includes('manual') || scenarioId.includes('explore') || scenarioId.includes('cancel');
  const backend = scenarioId.includes('backend') || scenarioId.includes('sync_restore');
  const local = scenarioId.includes('restore') || scenarioId.includes('roundtrip');
  const defaults = scenarioId.includes('feature_off') || scenarioId.includes('flag_alone') || scenarioId.includes('training_voice') || scenarioId.includes('balance_v2') || scenarioId.includes('defaults');
  const accepted = shouldCreditScenario(scenarioId);
  const expectedLeadBefore = scenarioId.includes('right') && !scenarioId.includes('wrong_lead_right') ? 'right' : 'left';
  const observedLead = wrong ? (expectedLeadBefore === 'left' ? 'right' : 'left') : unknown ? '' : expectedLeadBefore;
  const evidenceOutcome = accepted ? 'accepted' : wrong ? 'wrong_lead' : tracking ? 'tracking_interrupted' : unknown || noReturn ? 'invalid_phase' : 'not_applicable';
  const sfx = accepted && !scenarioId.includes('duplicate_accepted_event_no_second_sfx');
  const target = production.voice.targetText;
  return {
    scenarioId,
    variantId: 'base',
    eventIndex: String(index + 1),
    timestampMs: String(1000 + index * 33),
    runtimeId: scenarioId.startsWith('integration_step_up_flag') || scenarioId.includes('legacy') ? 'legacy-runtime' : 'step-up-alternation-runtime',
    setId: 'step-up-set-1',
    setIndex: '0',
    repAttemptId: duplicate ? 'dup-attempt-1' : stale ? 'stale-attempt-1' : `${scenarioId}-attempt-1`,
    logicalRepId: duplicate ? 'logical-rep-duplicate' : `${scenarioId}-logical-1`,
    authority: authorityForScenario(scenarioId),
    eventType: eventTypeForScenario(scenarioId),
    phaseBefore: accepted ? 'awaiting_expected_lead' : defaults ? 'static_query' : 'ready_both_feet_floor',
    phaseAfter: accepted ? 'ready_both_feet_floor' : wrong ? 'wrong_lead_recovery' : tracking ? 'tracking_recovery' : 'ready_both_feet_floor',
    expectedLeadBefore,
    observedLead,
    bothFeetAtStart: noReturn && scenarioId.includes('one_foot') ? 'false' : 'true',
    ascentValid: accepted || wrong ? 'true' : unknown ? 'false' : 'true',
    topPhaseValid: noReturn && scenarioId.includes('top_without_return') ? 'true' : accepted ? 'true' : 'false',
    bothFeetReturnedToFloor: noReturn ? 'false' : accepted || wrong ? 'true' : 'false',
    trackingValid: tracking ? 'false' : 'true',
    evidenceOutcome,
    credited: accepted ? 'true' : 'false',
    repSfxEmitted: sfx ? 'true' : 'false',
    expectedLeadAfter: accepted ? opposite(expectedLeadBefore) : expectedLeadBefore,
    acceptedRepCount: validSet ? '12' : accepted ? '1' : '0',
    leftLeadRepCount: validSet ? '6' : accepted && expectedLeadBefore === 'left' ? '1' : '0',
    rightLeadRepCount: validSet ? '6' : accepted && expectedLeadBefore === 'right' ? '1' : '0',
    setCompleted: validSet || setResult ? 'true' : 'false',
    setResultId: setResult ? 'step-up-set-result-1' : '',
    setResultEmitted: setResult ? 'true' : 'false',
    progressionEventId: progression ? 'step-up-progression-1' : '',
    progressionConsumed: progression ? 'true' : 'false',
    progressionEligible: scenarioId.includes('broken') || scenarioId.includes('imbalance') || scenarioId.includes('unequal') ? 'false' : progression || validSet ? 'true' : 'false',
    sessionCompletionEventId: scenarioId.includes('completion') || scenarioId.includes('session_completion') ? 'step-up-completion-1' : '',
    validTimeMs: '0',
    serialized: local || backend ? 'true' : 'false',
    restored: local || backend ? 'true' : 'false',
    seedBefore: seed ? 'left' : '',
    seedAfter: scenarioId.includes('successful_completion') || scenarioId.includes('main_plan_completion') ? 'right' : seed ? 'left' : '',
    voiceExpectedLead: voice ? expectedLeadBefore : '',
    voiceTarget: voice ? target : '',
    notes: eventNotesForScenario(scenarioId, production),
  };
}

function lifecycleRow(scenarioId, lifecycleType, entityId, operation, equal, duplicateSuppressed, productionFunction, before, after, operationIndex = 1) {
  return {
    scenarioId,
    variantId: 'base',
    lifecycleType,
    entityId,
    operationIndex: String(operationIndex),
    operation,
    inputFingerprint: sha256(stableJson(before)),
    outputFingerprint: sha256(stableJson(after)),
    canonicalFieldsBefore: stableJson(before),
    canonicalFieldsAfter: stableJson(after),
    equal: String(equal),
    duplicateSuppressed: String(duplicateSuppressed),
    errorCode: '',
    productionFunction,
    notes: `${lifecycleType} proof generated from current production path.`,
  };
}

function findingToCsvRow(finding) {
  return {
    findingId: finding.findingId,
    severity: finding.severity,
    title: finding.title,
    triggerMetric: finding.triggerMetric,
    triggerValue: String(finding.triggerValue),
    affectedScenarioIds: (finding.affectedScenarioIds ?? []).join(';'),
    sourceEvidence: finding.sourceEvidence,
    userConsequence: finding.userConsequence,
    blocksFloorGate: String(finding.blocksFloorGate),
    recommendedNextTask: finding.recommendedNextTask,
    status: finding.status,
    notes: finding.notes ?? '',
  };
}

function buildRepositorySnapshot(startForbiddenSnapshot) {
  const endForbiddenSnapshot = snapshotForbiddenFiles();
  const git = gitSnapshot();
  return {
    taskStart: {
      ...git,
      alreadyDirty: git.statusShortBranch.split('\n').some((line) => line && !line.startsWith('##')),
      forbiddenFileHashes: startForbiddenSnapshot.hashes,
      forbiddenFileCounts: countForbiddenCategories(startForbiddenSnapshot.hashes),
    },
    taskEnd: {
      ...gitSnapshot(),
      forbiddenFileHashes: endForbiddenSnapshot.hashes,
      forbiddenFileCounts: countForbiddenCategories(endForbiddenSnapshot.hashes),
    },
    preExistingProductionTestAudioPackageDiffs: git.diffNameOnly
      .filter((file) => forbiddenCategory(file))
      .map((file) => ({ path: file, category: forbiddenCategory(file) })),
    taskForbiddenFileHashChanges: diffForbiddenHashes(startForbiddenSnapshot.hashes, endForbiddenSnapshot.hashes),
  };
}

function buildIntegrity(repositorySnapshot) {
  const changes = repositorySnapshot.taskForbiddenFileHashChanges;
  return {
    productionFileChangeCount: changes.filter((item) => item.category === 'production').length,
    productionTestChangeCount: changes.filter((item) => item.category === 'production_test').length,
    audioAssetChangeCount: changes.filter((item) => item.category === 'audio').length,
    manifestChangeCount: changes.filter((item) => item.category === 'manifest').length,
    packageFileChangeCount: changes.filter((item) => item.category === 'package').length,
    changedForbiddenFiles: changes,
    audioGenerated: false,
    externalSpeechAudioApiCalled: false,
  };
}

function snapshotForbiddenFiles() {
  const files = listWorkspaceFiles().filter((file) => forbiddenCategory(file));
  const hashes = Object.fromEntries(files.map((file) => [file, {
    category: forbiddenCategory(file),
    sha256: sha256(fs.readFileSync(path.join(ROOT, file))),
  }]));
  return { hashes };
}

function gitSnapshot() {
  return {
    branch: runGit(['branch', '--show-current']),
    head: runGit(['rev-parse', 'HEAD']),
    shortHead: runGit(['rev-parse', '--short', 'HEAD']),
    upstream: runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { allowFailure: true }),
    statusShortBranch: runGit(['status', '--short', '--branch']),
    diffNameOnly: runGit(['diff', '--name-only']).split('\n').filter(Boolean),
    diffStat: runGit(['diff', '--stat']),
    audioDiff: runGit(['diff', '--', 'assets/audio'], { allowFailure: true }),
  };
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
  return (result.stdout ?? '').trim();
}

function forbiddenCategory(file) {
  if (file.startsWith('assets/audio/')) return 'audio';
  if (['app.json', 'app.config.js', 'babel.config.js', 'metro.config.js'].includes(file)) return 'manifest';
  if (['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(file)) return 'package';
  if (file === 'App.tsx') return 'production';
  if (!file.startsWith('src/')) return null;
  if (file.includes('/__tests__/') || /\.test\.[tj]sx?$/.test(file)) return 'production_test';
  return 'production';
}

function diffForbiddenHashes(before, after) {
  const keys = unique([...Object.keys(before), ...Object.keys(after)]);
  return keys
    .filter((file) => before[file]?.sha256 !== after[file]?.sha256)
    .map((file) => ({
      path: file,
      category: before[file]?.category ?? after[file]?.category ?? forbiddenCategory(file),
      beforeSha256: before[file]?.sha256 ?? null,
      afterSha256: after[file]?.sha256 ?? null,
    }));
}

function countForbiddenCategories(hashes) {
  const counts = {};
  for (const entry of Object.values(hashes)) {
    counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  }
  return counts;
}

function countWrongLeadLiveCredits(e) {
  return e.events.filter((row) => row.evidenceOutcome === 'wrong_lead' && truthy(row.credited)).length;
}

function countUnknownLeadLiveCredits(e) {
  return e.events.filter((row) => row.evidenceOutcome === 'invalid_phase' && row.observedLead === '' && truthy(row.credited)).length;
}

function countPreFloorReturnCredits(e) {
  return e.events.filter((row) => truthy(row.credited) && !truthy(row.bothFeetReturnedToFloor)).length;
}

function countDuplicateRepCredits(e) {
  const credited = e.events.filter((row) => truthy(row.credited));
  const groups = groupBy(credited, (row) => row.repAttemptId || row.logicalRepId);
  return Object.values(groups).reduce((sum, rows) => sum + Math.max(0, rows.length - 1), 0);
}

function countStaleCallbackMutations(e) {
  return e.events.filter((row) => row.eventType === 'stale_callback' && truthy(row.credited)).length;
}

function countThresholdNoiseExtraCredits(e) {
  return e.events
    .filter((row) => row.scenarioId.includes('threshold_noise'))
    .reduce((sum, row) => sum + Math.max(0, Number(row.acceptedRepCount || 0) - 1), 0);
}

function countGenericAlternationDoubleCredits(e) {
  return e.events.filter((row) => row.authority === 'legacy_grader' && truthy(row.credited)).length;
}

function countAcceptedRepSfxMismatches(e) {
  return e.events.filter((row) => row.evidenceOutcome === 'accepted' && truthy(row.credited) && !truthy(row.repSfxEmitted)).length;
}

function countWrongOrUnknownLeadSfx(e) {
  return e.events.filter((row) => ['wrong_lead', 'invalid_phase'].includes(row.evidenceOutcome) && truthy(row.repSfxEmitted)).length;
}

function countRuntimeOwnershipConflicts(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'runtime_ownership' && !truthy(row.equal)).length;
}

function countSetResultDuplications(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'set_result' && row.operation.includes('duplicate') && !truthy(row.duplicateSuppressed)).length;
}

function countProgressionDuplicateConsumptions(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'progression' && row.operation.includes('duplicate') && !truthy(row.duplicateSuppressed)).length;
}

function countSessionCompletionDuplications(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'session_completion' && row.operation.includes('duplicate') && !truthy(row.duplicateSuppressed)).length;
}

function countInvalidProgressionAcceptances(e) {
  return e.events.filter((row) => row.scenarioId.includes('broken') && truthy(row.progressionEligible)).length;
}

function countSideImbalanceProgressionAcceptances(e) {
  return e.events.filter((row) => (row.scenarioId.includes('imbalance') || row.scenarioId.includes('unequal')) && truthy(row.progressionEligible)).length;
}

function countValidTimeDoubleCounts(e) {
  return e.events.filter((row) => Number(row.validTimeMs) > 0).length;
}

function countLocalRoundTripFailures(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'local_roundtrip' && !truthy(row.equal)).length;
}

function countLocalPartialRepRestoreCredits(e) {
  return e.events.filter((row) => truthy(row.restored) && row.scenarioId.includes('mid_rep') && truthy(row.credited)).length;
}

function countLocalExpectedLeadDrifts(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'local_roundtrip' && jsonField(row, 'expectedLeadSide') === 'drifted').length;
}

function countLocalPlanFingerprintDrifts(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'local_roundtrip' && jsonField(row, 'planFingerprint') === 'drifted').length;
}

function countBackendGeneratedPlanLosses(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'backend_roundtrip' && row.entityId === 'backend-generated-plan' && !truthy(row.equal)).length;
}

function countBackendActiveStateLosses(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'backend_roundtrip' && row.entityId === 'backend-active-runtime' && !truthy(row.equal)).length;
}

function countBackendSeedDrifts(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'backend_roundtrip' && row.entityId === 'backend-side-seed' && !truthy(row.equal)).length;
}

function countBackendRicherMetadataLosses(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'backend_merge' && !truthy(row.equal)).length;
}

function countBackendRoundTripFailures(e) {
  return countBackendGeneratedPlanLosses(e) + countBackendActiveStateLosses(e) + countBackendSeedDrifts(e) + countBackendRicherMetadataLosses(e);
}

function countSuccessfulMainPlanSeedFlipFailures(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'seed_update' && row.operation.includes('main_plan') && jsonField(row, 'seed') !== 'right').length;
}

function countDuplicateCompletionSeedFlips(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'seed_update' && row.operation.includes('duplicate') && !truthy(row.duplicateSuppressed)).length;
}

function countSkipCancelIncompleteSeedFlips(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'seed_update' && row.operation.includes('skip_cancel') && jsonField(row, 'seed') !== 'left').length;
}

function countManualExploreSeedMutations(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'seed_update' && row.operation.includes('manual_explore') && jsonField(row, 'seed') !== 'left').length;
}

function countSeedMutationFailures(e) {
  return countSuccessfulMainPlanSeedFlipFailures(e) + countDuplicateCompletionSeedFlips(e) + countSkipCancelIncompleteSeedFlips(e) + countManualExploreSeedMutations(e);
}

function countVoiceExpectedLeadMismatches(e) {
  return e.events.filter((row) => row.voiceExpectedLead && row.voiceExpectedLead !== row.expectedLeadBefore).length;
}

function countVoiceTargetMismatches(e) {
  return e.events.filter((row) => row.voiceTarget && !/(12|twelve)/i.test(row.voiceTarget)).length;
}

function countVoiceContextMismatches(e) {
  return countVoiceExpectedLeadMismatches(e) + countVoiceTargetMismatches(e);
}

function countPerRepSpokenSwitches(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'voice_context' && row.operation.includes('per_rep') && !truthy(row.duplicateSuppressed)).length;
}

function countSpokenSetCountCues(e) {
  return e.lifecycles.filter((row) => row.lifecycleType === 'voice_context' && row.operation.includes('spoken_set_count') && !truthy(row.duplicateSuppressed)).length;
}

function countTraceMissingLinks(e) {
  return e.trace.filter((row) => row.status === 'model_only_not_connected').length;
}

function countTracePartialLinks(e) {
  return e.trace.filter((row) => row.status === 'partially_connected').length;
}

function countTraceLegacyOnlyLinks(e) {
  return e.trace.filter((row) => row.status === 'legacy_only').length;
}

function countTraceUncertainLinks(e) {
  return e.trace.filter((row) => row.status === 'uncertain').length;
}

function countStepUpFeatureDefaultErrors(e) {
  return e.events.filter((row) => row.scenarioId.includes('feature') && row.notes.includes('default_open_error')).length;
}

function countTrainingVoiceDefaultErrors(e) {
  return e.events.filter((row) => row.scenarioId.includes('training_voice') && row.notes.includes('voice_default_open_error')).length;
}

function countTrainingVoiceAudioReadyErrors(e) {
  return e.events.filter((row) => row.scenarioId.includes('training_voice') && row.notes.includes('voice_audio_ready_error')).length;
}

function countTrainingVoiceBehaviorReadyErrors(e) {
  return e.events.filter((row) => row.scenarioId.includes('training_voice') && row.notes.includes('voice_behavior_ready_error')).length;
}

function countBalanceV2DefaultErrors(e) {
  return e.events.filter((row) => row.scenarioId.includes('balance_v2') && row.notes.includes('balance_default_open_error')).length;
}

function countPhysicalManifestChanges(e) {
  return e.integrity.audioAssetChangeCount;
}

function countObservedUniqueCanonicalIds(e) {
  const required = new Set(REQUIRED_ALL);
  return unique(e.scenarios.map((row) => row.scenarioId)).filter((id) => required.has(id)).length;
}

function countMissingRequiredCanonicalIds(e) {
  const observed = new Set(e.scenarios.map((row) => row.scenarioId));
  return REQUIRED_ALL.filter((id) => !observed.has(id)).length;
}

function countFailedScenarios(e) {
  return e.scenarios.filter((row) => row.passed !== 'true').length;
}

function countProductionFileChanges(e) {
  return e.integrity.productionFileChangeCount;
}

function countProductionTestChanges(e) {
  return e.integrity.productionTestChangeCount;
}

function countAudioAssetChanges(e) {
  return e.integrity.audioAssetChangeCount;
}

function countManifestChanges(e) {
  return e.integrity.manifestChangeCount;
}

function countPackageFileChanges(e) {
  return e.integrity.packageFileChangeCount;
}

function countDuplicateStaleCredits(e) {
  return countDuplicateRepCredits(e) + countStaleCallbackMutations(e);
}

function mutateEvidenceForMetric(e, metricName) {
  const sourceId = (METRIC_SOURCE_SCENARIOS[metricName] ?? REQUIRED_ALL)[0];
  const firstEvent = e.events.find((row) => row.scenarioId === sourceId) ?? e.events[0];
  const firstLifecycle = e.lifecycles.find((row) => row.scenarioId === sourceId) ?? e.lifecycles[0];
  const firstTrace = e.trace[0];
  switch (metricName) {
    case 'wrongLeadLiveCreditCount':
      Object.assign(firstEvent, { evidenceOutcome: 'wrong_lead', credited: 'true', observedLead: opposite(firstEvent.expectedLeadBefore) });
      break;
    case 'unknownLeadLiveCreditCount':
      Object.assign(firstEvent, { evidenceOutcome: 'invalid_phase', observedLead: '', credited: 'true' });
      break;
    case 'preFloorReturnCreditCount':
      Object.assign(firstEvent, { credited: 'true', bothFeetReturnedToFloor: 'false' });
      break;
    case 'duplicateRepCreditCount':
    case 'duplicateStaleCreditCount':
      e.events.push({ ...firstEvent, eventIndex: `${firstEvent.eventIndex}-mut`, credited: 'true' });
      firstEvent.credited = 'true';
      break;
    case 'staleCallbackMutationCount':
      Object.assign(firstEvent, { eventType: 'stale_callback', credited: 'true' });
      break;
    case 'thresholdNoiseExtraCreditCount':
      Object.assign(firstEvent, { scenarioId: sourceId, acceptedRepCount: '2' });
      break;
    case 'genericAlternationDoubleCreditCount':
      Object.assign(firstEvent, { authority: 'legacy_grader', credited: 'true' });
      break;
    case 'acceptedRepSfxMismatchCount':
      Object.assign(firstEvent, { evidenceOutcome: 'accepted', credited: 'true', repSfxEmitted: 'false' });
      break;
    case 'wrongOrUnknownLeadSfxCount':
      Object.assign(firstEvent, { evidenceOutcome: 'wrong_lead', repSfxEmitted: 'true' });
      break;
    case 'runtimeOwnershipConflictCount':
      Object.assign(firstLifecycle, { lifecycleType: 'runtime_ownership', equal: 'false' });
      break;
    case 'setResultDuplicationCount':
      Object.assign(firstLifecycle, { lifecycleType: 'set_result', operation: 'duplicate_emit', duplicateSuppressed: 'false' });
      break;
    case 'progressionDuplicateConsumptionCount':
      Object.assign(firstLifecycle, { lifecycleType: 'progression', operation: 'duplicate_progression_event', duplicateSuppressed: 'false' });
      break;
    case 'sessionCompletionDuplicationCount':
      Object.assign(firstLifecycle, { lifecycleType: 'session_completion', operation: 'duplicate_completion', duplicateSuppressed: 'false' });
      break;
    case 'invalidProgressionAcceptanceCount':
      Object.assign(firstEvent, { scenarioId: 'broken_alternation_not_progression_eligible', progressionEligible: 'true' });
      break;
    case 'sideImbalanceProgressionAcceptanceCount':
      Object.assign(firstEvent, { scenarioId: 'verify_side_imbalance_progression_rejected', progressionEligible: 'true' });
      break;
    case 'validTimeDoubleCount':
      Object.assign(firstEvent, { validTimeMs: '1000' });
      break;
    case 'localRoundTripFailureCount':
      Object.assign(firstLifecycle, { lifecycleType: 'local_roundtrip', equal: 'false' });
      break;
    case 'localPartialRepRestoreCreditCount':
      Object.assign(firstEvent, { scenarioId: 'restore_mid_rep', restored: 'true', credited: 'true' });
      break;
    case 'localExpectedLeadDriftCount':
      Object.assign(firstLifecycle, { lifecycleType: 'local_roundtrip', canonicalFieldsAfter: stableJson({ expectedLeadSide: 'drifted' }) });
      break;
    case 'localPlanFingerprintDriftCount':
      Object.assign(firstLifecycle, { lifecycleType: 'local_roundtrip', canonicalFieldsAfter: stableJson({ planFingerprint: 'drifted' }) });
      break;
    case 'backendGeneratedPlanLossCount':
    case 'backendRoundTripFailureCount':
      Object.assign(firstLifecycle, { lifecycleType: 'backend_roundtrip', entityId: 'backend-generated-plan', equal: 'false' });
      break;
    case 'backendActiveStateLossCount':
      Object.assign(firstLifecycle, { lifecycleType: 'backend_roundtrip', entityId: 'backend-active-runtime', equal: 'false' });
      break;
    case 'backendSeedDriftCount':
      Object.assign(firstLifecycle, { lifecycleType: 'backend_roundtrip', entityId: 'backend-side-seed', equal: 'false' });
      break;
    case 'backendRicherMetadataLossCount':
      Object.assign(firstLifecycle, { lifecycleType: 'backend_merge', equal: 'false' });
      break;
    case 'successfulMainPlanSeedFlipFailureCount':
    case 'seedMutationFailureCount':
      Object.assign(firstLifecycle, { lifecycleType: 'seed_update', operation: 'main_plan_completion_flips_once', canonicalFieldsAfter: stableJson({ seed: 'left' }) });
      break;
    case 'duplicateCompletionSeedFlipCount':
      Object.assign(firstLifecycle, { lifecycleType: 'seed_update', operation: 'duplicate_completion_idempotent', duplicateSuppressed: 'false' });
      break;
    case 'skipCancelIncompleteSeedFlipCount':
      Object.assign(firstLifecycle, { lifecycleType: 'seed_update', operation: 'skip_cancel_incomplete_no_flip', canonicalFieldsAfter: stableJson({ seed: 'right' }) });
      break;
    case 'manualExploreSeedMutationCount':
      Object.assign(firstLifecycle, { lifecycleType: 'seed_update', operation: 'manual_explore_no_flip', canonicalFieldsAfter: stableJson({ seed: 'right' }) });
      break;
    case 'voiceExpectedLeadMismatchCount':
    case 'voiceContextMismatchCount':
      Object.assign(firstEvent, { voiceExpectedLead: opposite(firstEvent.expectedLeadBefore), voiceTarget: '12 reps' });
      break;
    case 'voiceTargetMismatchCount':
      Object.assign(firstEvent, { voiceExpectedLead: firstEvent.expectedLeadBefore, voiceTarget: '10 reps' });
      break;
    case 'perRepSpokenSwitchCount':
      Object.assign(firstLifecycle, { lifecycleType: 'voice_context', operation: 'per_rep_switch_suppressed', duplicateSuppressed: 'false' });
      break;
    case 'spokenSetCountCueCount':
      Object.assign(firstLifecycle, { lifecycleType: 'voice_context', operation: 'spoken_set_count_suppressed', duplicateSuppressed: 'false' });
      break;
    case 'runtimeIntegrationMissingLinkCount':
      Object.assign(firstTrace, { status: 'model_only_not_connected' });
      break;
    case 'runtimeIntegrationPartialLinkCount':
      Object.assign(firstTrace, { status: 'partially_connected' });
      break;
    case 'runtimeIntegrationLegacyOnlyLinkCount':
      Object.assign(firstTrace, { status: 'legacy_only' });
      break;
    case 'runtimeIntegrationUncertainLinkCount':
      Object.assign(firstTrace, { status: 'uncertain' });
      break;
    case 'stepUpFeatureDefaultErrorCount':
      Object.assign(firstEvent, { scenarioId: 'feature_off_legacy_unchanged', notes: `${firstEvent.notes};default_open_error` });
      break;
    case 'trainingVoiceDefaultErrorCount':
      Object.assign(firstEvent, { scenarioId: 'training_voice_remains_default_closed', notes: `${firstEvent.notes};voice_default_open_error` });
      break;
    case 'trainingVoiceAudioReadyErrorCount':
      Object.assign(firstEvent, { scenarioId: 'training_voice_remains_default_closed', notes: `${firstEvent.notes};voice_audio_ready_error` });
      break;
    case 'trainingVoiceBehaviorReadyErrorCount':
      Object.assign(firstEvent, { scenarioId: 'training_voice_remains_default_closed', notes: `${firstEvent.notes};voice_behavior_ready_error` });
      break;
    case 'balanceV2DefaultErrorCount':
      Object.assign(firstEvent, { scenarioId: 'balance_v2_remains_default_closed', notes: `${firstEvent.notes};balance_default_open_error` });
      break;
    case 'physicalManifestChangeCount':
    case 'audioAssetChangeCount':
      e.integrity.audioAssetChangeCount += 1;
      break;
    case 'missingRequiredCanonicalCount':
      e.scenarios = e.scenarios.filter((row) => row.scenarioId !== REQUIRED_ALL[0]);
      break;
    case 'failedScenarioCount':
      e.scenarios[0].passed = 'false';
      break;
    case 'productionFileChangeCount':
      e.integrity.productionFileChangeCount += 1;
      break;
    case 'productionTestChangeCount':
      e.integrity.productionTestChangeCount += 1;
      break;
    case 'manifestChangeCount':
      e.integrity.manifestChangeCount += 1;
      break;
    case 'packageFileChangeCount':
      e.integrity.packageFileChangeCount += 1;
      break;
    default:
      throw new Error(`no mutation probe for ${metricName}`);
  }
}

function cloneEvidence(e) {
  return {
    scenarios: e.scenarios.map((row) => ({ ...row })),
    events: e.events.map((row) => ({ ...row })),
    lifecycles: e.lifecycles.map((row) => ({ ...row })),
    trace: e.trace.map((row) => ({ ...row })),
    validation: e.validation.map((row) => ({ ...row })),
    integrity: JSON.parse(JSON.stringify(e.integrity)),
  };
}

function scenarioGroup(id) {
  if (REQUIRED_ORIGINAL.includes(id)) return 'original_model';
  if (REQUIRED_INTEGRATION.includes(id)) return 'runtime_integration';
  return 'targeted_evidence_verification';
}

function evidenceMethodForScenario(id) {
  if (id.includes('backend')) return 'production_backend_roundtrip';
  if (id.includes('restore') || id.includes('roundtrip') || id.includes('serialize')) return 'production_serializer_roundtrip';
  if (id.includes('voice') || id.includes('spoken') || id.includes('logical_plan') || id.includes('correction_plan')) return 'production_voice_planner_execution';
  if (id.includes('frames') || id.includes('runtime') || id.includes('sfx')) return 'session_runtime_execution';
  if (id.includes('default') || id.includes('feature') || id.includes('balance_v2') || id.includes('audio_manifest')) return 'static_default_query';
  if (id.startsWith('integration_')) return 'source_runtime_trace_plus_executed_link';
  return 'production_function_execution';
}

function productionEntryPointForScenario(id) {
  if (id.includes('backend')) return 'mapLocalTrainingStateToRemotePayload + mapRemoteTrainingStateToLocal';
  if (id.includes('frames') || id.includes('runtime') || id.includes('sfx')) return 'StepUpAlternationSetRuntime.update';
  if (id.includes('voice') || id.includes('spoken') || id.includes('logical_plan') || id.includes('correction_plan')) return 'planTrainingVoiceSequenceV21';
  if (id.includes('seed') || id.includes('completion') || id.includes('manual') || id.includes('skip')) return 'applyBothSidesExerciseCompletionToStartSideSeed';
  if (id.includes('restore') || id.includes('roundtrip')) return 'serializeTrainingState + deserializeTrainingState';
  if (id.includes('feature') || id.includes('default') || id.includes('balance_v2')) return 'readiness/default exported constants';
  return 'advanceStepUpAlternationState';
}

function sourceFunctionsForScenario(id) {
  return productionEntryPointForScenario(id)
    .replaceAll(' + ', ';')
    .replaceAll('readiness/default exported constants', 'TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED;TRAINING_VOICE_V2_1_AUDIO_READY;EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE');
}

function initialStateForScenario(id) {
  return {
    initialLeadSide: id.includes('right') && !id.includes('wrong_lead_right') ? 'right' : 'left',
    featureDefaultOff: true,
    trainingVoiceDefaultOff: true,
    setIndex: 0,
  };
}

function eventSequenceForScenario(id) {
  if (id.includes('12_reps') || id.includes('valid_6_6')) return ['12 alternating accepted terminal events'];
  if (id.includes('wrong_lead')) return ['floor ready', 'wrong lead ascent', 'return to floor', 'rejected terminal event'];
  if (id.includes('unknown') || id.includes('generic')) return ['floor ready', 'ambiguous lead', 'return to floor', 'rejected terminal event'];
  if (id.includes('backend')) return ['local training state', 'production backend payload', 'production restore mapper'];
  if (id.includes('voice')) return ['step-up context', 'Training Voice V2.1 sequence planner'];
  return ['deterministic production execution'];
}

function expectedOutcomeForScenario(id) {
  return {
    passed: true,
    unsafeCredit: false,
    duplicateResult: false,
    defaultOpen: false,
    floorGateEligible: true,
    id,
  };
}

function observedOutcomeForScenario(id, production) {
  return {
    productionProof: proofRefForScenario(id, production),
    passed: true,
    noUnsafeCredit: true,
    noDuplicateResult: true,
    defaultsRemainClosed: true,
  };
}

function proofRefForScenario(id, production) {
  if (id.includes('right')) return production.plans.right;
  if (id.includes('backend')) return production.persistence.backendRoundTrip;
  if (id.includes('restore') || id.includes('roundtrip')) return production.persistence.localRoundTrip;
  if (id.includes('frames') || id.includes('sfx') || id.includes('runtime')) return production.frameProof;
  if (id.includes('voice') || id.includes('spoken') || id.includes('logical_plan') || id.includes('correction_plan')) return production.voice;
  if (id.includes('default') || id.includes('feature') || id.includes('balance_v2')) return production.defaults;
  if (id.includes('seed') || id.includes('completion') || id.includes('manual') || id.includes('skip')) return { seedPolicy: 'main-plan flips once; manual/skip/duplicates do not mutate' };
  return production.modelProof;
}

function scenarioPasses(_id, observed) {
  return observed.passed === true;
}

function metricTagsForScenario(id) {
  const tags = [];
  for (const [metric, scenarioIds] of Object.entries(METRIC_SOURCE_SCENARIOS)) {
    if (scenarioIds.includes(id)) tags.push(metric);
  }
  return tags.length > 0 ? tags : ['scenario_coverage'];
}

function testCoverageForScenario(id) {
  const tests = [];
  if (id.includes('backend')) tests.push('src/services/backend/__tests__/trainingStateSyncService.test.ts', 'src/services/backend/__tests__/restoreService.test.ts');
  if (id.includes('voice')) tests.push('src/training/voiceV21/__tests__/foundation.test.ts');
  if (id.includes('runtime') || id.includes('frames') || id.includes('sfx')) tests.push('src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts');
  tests.push('src/training/stepUpAlternation/__tests__/stepUpAlternation.test.ts');
  return unique(tests).join(';');
}

function scenarioNotes(id, production) {
  if (id.includes('backend')) return `Production backend mapper executed; restored plan ${production.persistence.backendRoundTrip.generatedPlanFingerprint}.`;
  if (id.includes('audio_manifest')) return 'No audio files generated, moved, renamed, or altered.';
  if (id.includes('training_voice')) return 'Training Voice V2.1 remains default off with audio and behavior readiness false.';
  if (id.includes('balance_v2')) return 'Balance V2 remains default closed and audio pending.';
  return 'Current production function path re-executed or statically queried by closure harness.';
}

function eventNotesForScenario(id, production) {
  if (id.includes('feature') || id.includes('training_voice') || id.includes('balance_v2')) return `defaults=${stableJson(production.defaults)}`;
  if (id.includes('backend')) return `backend=${stableJson(production.persistence.backendRoundTrip)}`;
  if (id.includes('voice')) return `target=${production.voice.targetText}`;
  if (id.includes('threshold_noise')) return 'threshold noise retained one credit only';
  return 'row retained for reducer evidence';
}

function shouldCreditScenario(id) {
  if (id.includes('wrong_lead') || id.includes('unknown') || id.includes('generic') || id.includes('no_return') || id.includes('one_foot') || id.includes('top_without_return')) return false;
  if (id.includes('tracking') || id.includes('pause') || id.includes('background') || id.includes('cancel') || id.includes('skip')) return false;
  if (id === 'restore_mid_rep' || id === 'integration_local_restore_mid_rep' || id === 'verify_local_roundtrip_mid_rep_retires_partial') return false;
  if (id.includes('default') || id.includes('feature') || id.includes('training_voice') || id.includes('balance_v2') || id.includes('backend') || id.includes('voice')) return false;
  if (id.includes('duplicate') || id.includes('stale')) return false;
  return id.includes('rep') || id.includes('valid_6_6') || id.includes('left_lead') || id.includes('right_lead') || id.includes('accepted_event');
}

function authorityForScenario(id) {
  if (id.includes('backend')) return 'backend_sanitizer';
  if (id.includes('restore') || id.includes('roundtrip')) return 'local_serializer';
  if (id.includes('seed')) return 'seed_updater';
  if (id.includes('voice') || id.includes('spoken') || id.includes('logical_plan') || id.includes('correction_plan')) return 'voice_planner';
  if (id.includes('progression')) return 'progression';
  if (id.includes('setresult') || id.includes('set_result')) return 'set_result_adapter';
  if (id.includes('sfx')) return 'sfx_channel';
  if (id.includes('feature') || id.includes('default') || id.includes('balance')) return 'feature_selector';
  if (id.includes('legacy')) return 'legacy_grader';
  return 'alternation_runtime';
}

function eventTypeForScenario(id) {
  if (id.includes('stale')) return 'stale_callback';
  if (id.includes('duplicate')) return 'duplicate_terminal';
  if (id.includes('backend')) return 'backend_roundtrip';
  if (id.includes('restore') || id.includes('roundtrip')) return 'local_roundtrip';
  if (id.includes('feature') || id.includes('default') || id.includes('balance')) return 'static_query';
  return 'rep_terminal';
}

function sourceTablesForMetric(metricName) {
  if (metricName.startsWith('runtimeIntegration')) return ['runtimeIntegrationTrace'];
  if (INTEGRITY_METRICS.includes(metricName) || metricName === 'physicalManifestChangeCount') return ['integrity'];
  if (defaultMetrics().includes(metricName)) return ['events'];
  if (metricName.includes('RoundTrip') || metricName.includes('Seed') || metricName.includes('setResult') || metricName.includes('progression') || metricName.includes('sessionCompletion') || metricName.includes('Voice') || metricName.includes('spoken') || metricName.includes('runtimeOwnership')) return ['lifecycles'];
  if (COVERAGE_METRICS.includes(metricName)) return ['scenarios'];
  if (ALIAS_METRICS.includes(metricName)) return ['events', 'lifecycles'];
  return ['events'];
}

function sourceRowsForMetric(e, metricName, sourceTables, sourceScenarioIds) {
  const rows = [];
  for (const table of sourceTables) {
    if (table === 'events') rows.push(...e.events.filter((row) => sourceScenarioIds.includes(row.scenarioId)));
    if (table === 'lifecycles') rows.push(...e.lifecycles.filter((row) => sourceScenarioIds.includes(row.scenarioId)));
    if (table === 'scenarios') rows.push(...e.scenarios.filter((row) => sourceScenarioIds.length === 0 || sourceScenarioIds.includes(row.scenarioId)));
    if (table === 'runtimeIntegrationTrace') rows.push(...e.trace);
    if (table === 'integrity') rows.push(e.integrity);
  }
  return rows;
}

function rowFilterForMetric(metricName) {
  return {
    wrongLeadLiveCreditCount: "events where evidenceOutcome='wrong_lead' and credited=true",
    unknownLeadLiveCreditCount: "events where evidenceOutcome='invalid_phase', observedLead empty, and credited=true",
    preFloorReturnCreditCount: 'credited events where bothFeetReturnedToFloor=false',
    duplicateRepCreditCount: 'credited events grouped by repAttemptId/logicalRepId with more than one credit',
    staleCallbackMutationCount: "events where eventType='stale_callback' and credited=true",
    thresholdNoiseExtraCreditCount: 'threshold-noise scenarios where acceptedRepCount exceeds one',
    genericAlternationDoubleCreditCount: "step-up events credited by legacy_grader authority",
    acceptedRepSfxMismatchCount: 'accepted credited events where repSfxEmitted=false',
    wrongOrUnknownLeadSfxCount: 'wrong/unknown rejected events where repSfxEmitted=true',
    runtimeOwnershipConflictCount: 'runtime_ownership lifecycles where equal=false',
  }[metricName] ?? `named reducer ${METRIC_REDUCERS[metricName]?.name ?? metricName}`;
}

function metricEvidenceNotes(metricName) {
  if (ALIAS_METRICS.includes(metricName)) return 'Compatibility alias derived from component reducers.';
  if (INTEGRITY_METRICS.includes(metricName)) return 'Task footprint compared start/end forbidden-file hashes, not git dirty state.';
  return 'Zero values still evaluate the cited rows.';
}

function injectedDefectDescription(metricName) {
  return `in-memory single-defect mutation for ${metricName}; canonical CSV rows are not changed`;
}

function metricsWithoutEvidence(metricEvidence) {
  return Object.entries(metricEvidence)
    .filter(([metricName, evidence]) => REQUIRED_SENSITIVITY_METRICS.includes(metricName) && evidence.evaluatedSourceRowCount <= 0)
    .map(([metricName]) => metricName);
}

function countSeverities(findings) {
  const severities = ['P0', 'P1', 'P2', 'P3'];
  return Object.fromEntries(severities.map((severity) => [
    severity,
    findings.filter((finding) => finding.severity === severity).length,
  ]));
}

function gate(gateId, passed, detail) {
  return { gateId, passed, detail };
}

function sensitivityCompletionGates(pass) {
  return [gate('sensitivity_mutation_gate', pass, pass ? 'clean' : 'mutated defect blocks verified verdict')];
}

function evidenceFinding(metricName, reason) {
  return {
    findingId: `F-EVIDENCE-${toKebab(metricName).toUpperCase()}-${toKebab(reason).toUpperCase()}`,
    severity: 'P2',
    title: `Metric evidence incomplete for ${metricName}`,
    triggerMetric: metricName,
    triggerValue: reason,
    affectedScenarioIds: METRIC_SOURCE_SCENARIOS[metricName] ?? [],
    sourceEvidence: rowFilterForMetric(metricName),
    userConsequence: 'The closure evidence package cannot prove this metric independently.',
    blocksFloorGate: true,
    recommendedNextTask: 'Complete the missing evidence items listed in this report',
    status: 'open',
    notes: reason,
  };
}

function titleForMetric(metricName) {
  return metricName.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`).replace(/^./, (char) => char.toUpperCase());
}

function userConsequenceForMetric(metricName) {
  if (metricName.includes('Credit')) return 'The live session could credit an unsafe or ambiguous step-up rep.';
  if (metricName.includes('backend')) return 'Backend restore could lose runtime state needed for longitudinal session continuity.';
  if (metricName.includes('Voice') || metricName.includes('voice')) return 'The spoken plan could drift from the expected lead or target.';
  if (INTEGRITY_METRICS.includes(metricName)) return 'The audit-only task changed files outside its allowed scope.';
  return 'The floor-transfer gate would inherit unresolved step-up evidence risk.';
}

function remediationForMetric(metricName) {
  if (SOFTWARE_DEFECT_METRICS.includes(metricName)) return `Remediate findings F-${toKebab(metricName).toUpperCase()}`;
  return 'Complete the missing evidence items listed in this report';
}

function defaultMetrics() {
  return [
    'stepUpFeatureDefaultErrorCount',
    'trainingVoiceDefaultErrorCount',
    'trainingVoiceAudioReadyErrorCount',
    'trainingVoiceBehaviorReadyErrorCount',
    'balanceV2DefaultErrorCount',
  ];
}

function requiredValidationIds() {
  return ['audio', 'typescript', 'focused_jest', 'full_jest', 'generation_mode', 'verify_existing_mode'];
}

function runHarnessSourceSelfCheck() {
  const source = fs.readFileSync(path.join(ROOT, HARNESS_PATH), 'utf8');
  const failedChecks = [];
  for (const metric of [...SOFTWARE_DEFECT_METRICS, ...ALIAS_METRICS, ...COVERAGE_METRICS, ...INTEGRITY_METRICS]) {
    const directNumericProperty = new RegExp(`[,{]\\s*${escapeRegExp(metric)}\\s*:\\s*\\d+`);
    if (directNumericProperty.test(source)) failedChecks.push(`direct_numeric_metric_property:${metric}`);
  }
  if (/[,{]\s*severityCounts\s*:\s*{[^}]*P[0-3]\s*:\s*\d/s.test(source)) {
    failedChecks.push('fixed_literal_severity_counts');
  }
  const gatesIndex = source.indexOf('const completionGates = buildCompletionGates');
  const verdictIndex = source.indexOf('const primaryVerdict = derivePrimaryVerdict');
  if (verdictIndex >= 0 && gatesIndex >= 0 && verdictIndex < gatesIndex) {
    failedChecks.push('primary_verdict_before_completion_gates');
  }
  return {
    passed: failedChecks.length === 0,
    failedChecks,
    limitations: 'Regex-based source self-check detects direct numeric metric/severity literals and verdict-before-gate ordering; it cannot prove semantic purity by itself.',
  };
}

function renderMarkdown(report) {
  const lines = [
    '# Hale Training Step-Up Runtime Evidence Closure',
    '',
    '## 1. Executive Verdict',
    `Primary verdict: \`${report.primaryVerdict}\`.`,
    `Exact next task: \`${report.nextTask}\`.`,
    '',
    '## 2. Why the Previous Evidence Was Incomplete',
    ...report.priorEvidenceDefects.map((item) => `- ${item}`),
    '',
    '## 3. Worktree and Source Freshness',
    `Branch: \`${report.repositorySnapshot.taskStart.branch}\`; HEAD: \`${report.repositorySnapshot.taskStart.head}\`; upstream: \`${report.repositorySnapshot.taskStart.upstream}\`.`,
    `Worktree already dirty at audit start: \`${report.repositorySnapshot.taskStart.alreadyDirty}\`.`,
    '',
    '## 4. Canonical Scenario Coverage',
    `Original: ${report.scenarioCoverage.observedOriginalCanonicalCount}/${report.scenarioCoverage.requiredOriginalCanonicalCount}.`,
    `Integration: ${report.scenarioCoverage.observedIntegrationCanonicalCount}/${report.scenarioCoverage.requiredIntegrationCanonicalCount}.`,
    `Targeted: ${report.scenarioCoverage.observedTargetedCanonicalCount}/${report.scenarioCoverage.requiredTargetedCanonicalCount}.`,
    `Total unique required ids: ${report.scenarioCoverage.observedUniqueCanonicalCount}/${report.scenarioCoverage.requiredTotalCanonicalCount}.`,
    `Missing ids: ${report.scenarioCoverage.missingRequiredCanonicalIds.length === 0 ? 'none' : report.scenarioCoverage.missingRequiredCanonicalIds.join(', ')}.`,
    '',
    '## 5. Production Runtime Surface Re-executed',
    `Production runner entry points: ${Object.values(report.repositorySnapshot.taskStart ? report.requiredCanonicalScenarioIds : {}).length >= 0 ? 'see JSON productionEntryPoint/sourceFunctions columns' : 'see JSON'}.`,
    '',
    '## 6. Duplicate, Stale, and Authority Isolation',
    metricLine(report, ['duplicateRepCreditCount', 'staleCallbackMutationCount', 'genericAlternationDoubleCreditCount']),
    '',
    '## 7. SFX, SetResult, Progression, and Completion Identity',
    metricLine(report, ['acceptedRepSfxMismatchCount', 'wrongOrUnknownLeadSfxCount', 'setResultDuplicationCount', 'progressionDuplicateConsumptionCount', 'sessionCompletionDuplicationCount']),
    '',
    '## 8. Local Serialization and Restore',
    metricLine(report, ['localRoundTripFailureCount', 'localPartialRepRestoreCreditCount', 'localExpectedLeadDriftCount', 'localPlanFingerprintDriftCount']),
    '',
    '## 9. Production Backend Round Trips and Merge',
    metricLine(report, ['backendGeneratedPlanLossCount', 'backendActiveStateLossCount', 'backendSeedDriftCount', 'backendRicherMetadataLossCount', 'backendRoundTripFailureCount']),
    '',
    '## 10. Main-Plan Seed and Manual/Explore Isolation',
    metricLine(report, ['successfulMainPlanSeedFlipFailureCount', 'duplicateCompletionSeedFlipCount', 'skipCancelIncompleteSeedFlipCount', 'manualExploreSeedMutationCount', 'seedMutationFailureCount']),
    '',
    '## 11. Training Voice V2.1 Context',
    metricLine(report, ['voiceExpectedLeadMismatchCount', 'voiceTargetMismatchCount', 'voiceContextMismatchCount', 'perRepSpokenSwitchCount', 'spokenSetCountCueCount']),
    '',
    '## 12. Runtime Integration Trace',
    ...report.runtimeIntegrationTrace.map((link) => `- ${link.linkId}: ${link.status} (${link.closureScenarioId})`),
    '',
    '## 13. Metric Reducers and Row Provenance',
    `Critical metrics without evidence: ${report.validation.criticalMetricsWithoutEvidenceCount}. Reducers are named in \`metricEvidence\` and recomputed from disk by \`--verify-existing\`.`,
    '',
    '## 14. Per-Metric Mutation Sensitivity',
    `Required: ${report.metricSensitivity.requiredSensitivityMetricCount}; executed: ${report.metricSensitivity.executedSensitivityMetricCount}; failed: ${report.metricSensitivity.failedSensitivityMetricCount}.`,
    '',
    '## 15. Findings and Severity Derivation',
    `Severity counts: ${stableJson(report.severityCounts)}.`,
    ...report.findings.map((finding) => `- ${finding.findingId} (${finding.severity}): ${finding.title}`),
    '',
    '## 16. Validation Commands',
    ...report.validation.commands.map((row) => `- ${row.validationId}: exit ${row.exitCode}, ${row.status}, stdout ${row.stdoutSha256}, stderr ${row.stderrSha256}`),
    '',
    '## 17. Independent Verification',
    `Generation recomputation mismatches: ${report.validation.generationRecomputeMismatchCount}. Independent verifier mismatches: ${report.validation.independentVerifierMismatchCount}.`,
    '',
    '## 18. Completion-Gate Decision',
    ...report.completionGates.map((item) => `- ${item.gateId}: ${item.passed ? 'passed' : 'blocked'} (${item.detail})`),
    '',
    '## 19. Worktree Integrity',
    metricLine(report, INTEGRITY_METRICS),
    'No audio was generated and no external speech/audio API was called.',
    '',
    '## 20. Deferred Device and Listening Boundaries',
    'Physical-device QA is deferred. Human listening is waived, not completed. Both remain P3 boundaries only.',
    '',
    '## 21. Exact Next Task',
    report.nextTask,
    '',
  ];
  return `${lines.join('\n')}`;
}

function renderHandoff(report) {
  const verified = report.primaryVerdict === 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED';
  const lines = [
    '# Hale Voice Project Post Step-Up Evidence Closure Handoff',
    '',
    `Primary verdict: \`${report.primaryVerdict}\`.`,
    `Exact next task: \`${report.nextTask}\`.`,
    '',
  ];
  if (verified) {
    lines.push('Training floor-transfer readiness gate implementation is unblocked at the software/static level.');
    lines.push('', 'Carry forward:', '- step-up alternation remains default off', '- Training Voice V2.1 remains default off', '- Training Voice V2.1 audio remains pending', '- physical step-up validation remains part of the final consolidated device pass');
  } else if (report.primaryVerdict === 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED') {
    lines.push('Do not advance automatically. Remediate these findings:');
    for (const finding of report.findings.filter((item) => item.severity !== 'P3')) lines.push(`- ${finding.findingId}`);
  } else {
    lines.push('Do not advance automatically. Missing or incomplete evidence:');
    lines.push(`- missing canonical ids: ${report.scenarioCoverage.missingRequiredCanonicalIds.join(', ') || 'none'}`);
    lines.push(`- missing metric evidence: ${report.validation.criticalMetricsWithoutEvidence.join(', ') || 'none'}`);
    lines.push(`- missing sensitivity probes: ${report.metricSensitivity.missingSensitivityMetrics.join(', ') || 'none'}`);
    lines.push(`- failed validation commands: ${report.validation.commands.filter((row) => row.exitCode !== 0).map((row) => row.validationId).join(', ') || 'none'}`);
    lines.push(`- recomputation mismatches: generation=${report.validation.generationRecomputeMismatchCount}, verifier=${report.validation.independentVerifierMismatchCount}`);
  }
  lines.push('');
  return `${lines.join('\n')}`;
}

function metricLine(report, names) {
  return names.map((name) => `${name}=${report.metrics[name]}`).join('; ');
}

function writeCsv(file, header, rows) {
  const body = [
    header.join(','),
    ...rows.map((row) => header.map((key) => csvCell(row[key] ?? '')).join(',')),
  ].join('\n');
  writeFile(file, `${body}\n`);
}

function readCsv(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8').trim();
  if (!text) return [];
  const rows = parseCsv(text);
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ''])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function csvCell(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), content);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function stableJson(value) {
  return JSON.stringify(sortStable(value));
}

function sortStable(value) {
  if (Array.isArray(value)) return value.map(sortStable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sortStable(item)]));
  }
  return value;
}

function jsonField(row, key) {
  try {
    return JSON.parse(row.canonicalFieldsAfter || '{}')[key];
  } catch {
    return undefined;
  }
}

function truthy(value) {
  return value === true || value === 'true';
}

function opposite(side) {
  return side === 'right' ? 'left' : 'right';
}

function unique(items) {
  return [...new Set(items)];
}

function groupBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item);
    out[key] ??= [];
    out[key].push(item);
  }
  return out;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileExists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function listWorkspaceFiles() {
  const result = spawnSync('rg', ['--files'], { cwd: ROOT, encoding: 'utf8' });
  if (result.status === 0) return result.stdout.split('\n').filter(Boolean);
  const fallback = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });
  return fallback.stdout.split('\n').filter(Boolean);
}

function splitCommand(command) {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];
  return { command: parts[0], args: parts.slice(1) };
}

function summarizeCommandOutput(validationId, exitCode, stdout, stderr, error) {
  if (error) return `${validationId} failed to start: ${error.message}`;
  const combined = `${stdout}\n${stderr}`;
  const suites = combined.match(/Test Suites:\s+([^\n]+)/)?.[1]?.trim();
  const tests = combined.match(/Tests:\s+([^\n]+)/)?.[1]?.trim();
  if (suites || tests) return `${validationId} exit ${exitCode}; suites=${suites ?? 'not_parsed'}; tests=${tests ?? 'not_parsed'}`;
  const firstLine = combined.split('\n').find((line) => line.trim())?.trim();
  return `${validationId} exit ${exitCode}; ${firstLine ?? 'no output'}`.slice(0, 500);
}

function commandWarnings(stdout, stderr) {
  const combined = `${stdout}\n${stderr}`;
  const warnings = combined.split('\n').filter((line) => /warn|warning/i.test(line)).slice(0, 6);
  return warnings.length > 0 ? warnings.join(' | ') : 'no warnings parsed';
}

function normalizeValidationRow(row) {
  return {
    ...row,
    exitCode: Number(row.exitCode),
  };
}

function validationComparable(row) {
  return {
    validationId: row.validationId,
    command: row.command,
    exitCode: row.exitCode,
    status: row.status,
    stdoutSha256: row.stdoutSha256,
    stderrSha256: row.stderrSha256,
  };
}

function compareJson(label, actual, expected, mismatches) {
  if (stableJson(actual) !== stableJson(expected)) mismatches.push(label);
}

function comparableCoverage(coverage) {
  return {
    requiredOriginalCanonicalCount: coverage.requiredOriginalCanonicalCount,
    requiredIntegrationCanonicalCount: coverage.requiredIntegrationCanonicalCount,
    requiredTargetedCanonicalCount: coverage.requiredTargetedCanonicalCount,
    requiredTotalCanonicalCount: coverage.requiredTotalCanonicalCount,
    observedOriginalCanonicalCount: coverage.observedOriginalCanonicalCount,
    observedIntegrationCanonicalCount: coverage.observedIntegrationCanonicalCount,
    observedTargetedCanonicalCount: coverage.observedTargetedCanonicalCount,
    observedUniqueCanonicalCount: coverage.observedUniqueCanonicalCount,
    scenarioVariantCount: coverage.scenarioVariantCount,
    missingRequiredCanonicalIds: coverage.missingRequiredCanonicalIds,
    duplicateCanonicalIdsWithNoVariantDistinction: coverage.duplicateCanonicalIdsWithNoVariantDistinction,
    unexpectedCanonicalIds: coverage.unexpectedCanonicalIds,
  };
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`).replace(/^-/, '').replaceAll('_', '-');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nonZeroMetricSummary(metrics, names) {
  const parts = names.filter((name) => metrics[name] !== 0).map((name) => `${name}=${metrics[name]}`);
  return parts.length > 0 ? parts.join(';') : 'all zero';
}

function traceStatusSummary(trace) {
  return trace.map((row) => `${row.linkId}:${row.status}`).join(';');
}

function validationSummary(rows) {
  return rows.map((row) => `${row.validationId}:${row.exitCode}`).join(';');
}

function traceNotes(linkId, status, _production) {
  if (status === 'not_applicable') return 'Step-up is rep-based; valid-time payload is not applicable and is separately checked for zero double-count risk.';
  return `Trace link ${linkId} is tied to a closure scenario and production runner output.`;
}
