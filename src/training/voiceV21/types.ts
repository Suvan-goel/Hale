import type { EquipmentTag } from '../../movements';
import type { ExerciseKind, ExercisePrescription, ReleaseStatus } from '../../exercises';
import type { TrainingRoundSideRole } from '../bothSidesRounds';
import type { SafetyCueId } from '../safetyCues';
import type { TrainingFloorSessionMemory } from '../sessionPlayer';

export type TrainingVoiceLateralityV21 =
  | 'bilateral_simultaneous'
  | 'alternating_within_set'
  | 'bilateral_sequential_within_set'
  | 'both_sides_not_scored_separately'
  | 'both_sides_round_required'
  | 'alternating_lead_leg_each_rep'
  | 'not_applicable';

export type TrainingVoiceSetTypeV21 = 'reps' | 'hold' | 'timer' | 'rom' | 'other';

export type TrainingVoiceSetupModelV21 =
  | 'standing_general'
  | 'material_setup'
  | 'chair_setup'
  | 'floor_setup'
  | 'step_setup'
  | 'band_setup'
  | 'balance_setup';

export type TrainingVoiceRuntimeStatusV21 =
  | 'software_ready_audio_pending'
  | 'behavior_dependency_pending'
  | 'conditional_legacy_only';

export type TrainingVoiceImplementationRequirementId =
  | 'IR-VOICE-ROUND-STATE'
  | 'IR-VOICE-DOSE-CONVERSION'
  | 'IR-VOICE-FLOOR-GATE'
  | 'IR-VOICE-FINAL-POSITION-READINESS'
  | 'IR-VOICE-SAFETY-SUBSUMPTION'
  | 'IR-VOICE-TRAINING-CONTROLS'
  | 'IR-VOICE-TRAINING-RECOVERY'
  | 'IR-VOICE-NEW-CUE-SCHEMA'
  | 'IR-VOICE-AUDIO-ASSETS';

export type TrainingVoiceLogicalCueCategoryV21 =
  | 'session_intro'
  | 'universal_safety'
  | 'equipment_first_use'
  | 'exercise_first_use'
  | 'exercise_later_set'
  | 'target'
  | 'side_setup'
  | 'side_switch'
  | 'final_position'
  | 'progress'
  | 'rest_transition'
  | 'control'
  | 'recovery'
  | 'completion';

export type TrainingVoicePolicyIdV21 =
  | 'critical_stop'
  | 'critical_window'
  | 'result_transition'
  | 'instruction'
  | 'setup_recovery'
  | 'low_reassurance';

export interface TrainingVoiceLogicalCueV21 {
  readonly key: string;
  readonly exactScript: string;
  readonly category: TrainingVoiceLogicalCueCategoryV21;
  readonly policyId: TrainingVoicePolicyIdV21;
  readonly requiredForVoiceFirst: boolean;
}

export type TrainingVoiceTargetUnitV21 = 'rep' | 'second' | 'rom_window' | 'none';

export type TrainingVoiceTargetReasonCodeV21 =
  | 'target_matches_prescription'
  | 'target_derived_from_generated_session'
  | 'target_derived_from_both_sides_dose_plan'
  | 'target_derived_from_step_up_alternation_plan'
  | 'unsupported_reps'
  | 'unsupported_seconds'
  | 'unsupported_set_type'
  | 'non_integer_target'
  | 'missing_target';

export interface TrainingVoiceTargetPlanV21 {
  readonly supported: boolean;
  readonly cueKey: string | null;
  readonly exactScript: string;
  readonly visibleText: string;
  readonly spokenText: string;
  readonly value: number | null;
  readonly unit: TrainingVoiceTargetUnitV21;
  readonly singular: boolean;
  readonly reasonCodes: readonly TrainingVoiceTargetReasonCodeV21[];
}

export type TrainingVoiceSideVariantIdV21 =
  | 'left'
  | 'right'
  | 'left_front'
  | 'right_front'
  | 'left_forward'
  | 'right_forward'
  | 'left_extended'
  | 'right_extended'
  | 'left_back'
  | 'right_back';

export interface TrainingVoiceSideVariantV21 {
  readonly variantId: TrainingVoiceSideVariantIdV21;
  readonly cue: TrainingVoiceLogicalCueV21;
}

export interface TrainingVoiceSidePlanV21 {
  readonly required: boolean;
  readonly semanticSideRole?: TrainingRoundSideRole;
  readonly variants: readonly TrainingVoiceSideVariantV21[];
  readonly defaultVariantId: TrainingVoiceSideVariantIdV21 | null;
  readonly switchCue: TrainingVoiceLogicalCueV21 | null;
  readonly schedule:
    | 'none'
    | 'both_sides_round'
    | 'alternate_lead_leg_each_rep'
    | 'both_directions_within_timed_set';
  readonly reasonCodes: readonly string[];
}

export interface TrainingVoiceProgressCueV21 {
  readonly atSec: number;
  readonly cue: TrainingVoiceLogicalCueV21;
}

export interface TrainingVoiceProgressPlanV21 {
  readonly policy:
    | 'rep_sfx_only'
    | 'hold_15_seconds'
    | 'hold_20_seconds'
    | 'timer_30_seconds'
    | 'rom_no_active_progress'
    | 'none';
  readonly cues: readonly TrainingVoiceProgressCueV21[];
  readonly optional: boolean;
}

export type TrainingVoiceSafetyFamilyV21 =
  | 'none'
  | 'chair_seat'
  | 'generic_support'
  | 'balance_support'
  | 'step_or_stair'
  | 'long_band_handheld_or_foot_anchored'
  | 'door_anchor_band'
  | 'mini_band_above_knees'
  | 'floor_eligible_user';

export type TrainingVoiceSafetyFulfilmentV21 =
  | 'not_required'
  | 'separate_family_cue'
  | 'absorbed_into_exact_instruction';

export type TrainingVoiceSafetyUniversalStateV21 = 'not_started' | 'completed';

export type TrainingVoiceSafetyReasonCodeV21 =
  | 'NO_NORMAL_FAMILY_REQUIRED'
  | 'FAMILY_ALREADY_INTRODUCED'
  | 'FAMILY_ABSORBED_IN_EXACT_INSTRUCTION'
  | 'BALANCE_SUBSUMES_GENERIC_SUPPORT'
  | 'STEP_SUBSUMES_GENERIC_SUPPORT'
  | 'DOOR_ANCHOR_SUBSUMES_LONG_BAND'
  | 'FLOOR_SUBSUMES_GENERIC_SUPPORT'
  | 'MINI_BAND_SUBSUMES_BALANCE_SUPPORT'
  | 'MINI_BAND_ABSORBED_IN_INSTRUCTION'
  | 'CHAIR_ABSORBED_IN_INSTRUCTION'
  | 'GENERIC_SUPPORT_ABSORBED_IN_INSTRUCTION'
  | 'SAFETY_PROFILE_MISMATCH'
  | 'SAFETY_PROFILE_STALE'
  | 'MULTIPLE_UNRESOLVED_FAMILIES'
  | 'UNKNOWN_SAFETY_FAMILY'
  | 'FLOOR_NOT_ELIGIBLE'
  | 'MALFORMED_SAFETY_MEMORY'
  | 'MOST_SPECIFIC_FAMILY_DUE';

export interface TrainingVoiceSafetyPlanV21 {
  readonly version: 1;
  readonly exerciseId: string;
  readonly family: TrainingVoiceSafetyFamilyV21;
  readonly parentFamily: TrainingVoiceSafetyFamilyV21 | null;
  readonly subsumedFamilies: readonly TrainingVoiceSafetyFamilyV21[];
  readonly absorbedFamilies: readonly TrainingVoiceSafetyFamilyV21[];
  readonly fulfilment: TrainingVoiceSafetyFulfilmentV21;
  readonly absorbedIntoInstruction: boolean;
  readonly logicalCueKey: string | null;
  readonly exactScript: string | null;
  readonly cue: TrainingVoiceLogicalCueV21 | null;
  readonly sourceSafetyProfileSchemaVersion: number;
  readonly sourceSafetyProfileFingerprint: string;
  readonly sourceSafetyCueIds: readonly SafetyCueId[];
  readonly requiredForVoiceFirst: boolean;
  readonly policyId: 'instruction';
  readonly reasonCodes: readonly TrainingVoiceSafetyReasonCodeV21[];
  readonly reactiveSafetyCueIdsDeferred: readonly SafetyCueId[];
  readonly ready: boolean;
}

export interface TrainingVoiceExerciseContractV21 {
  readonly exerciseId: string;
  readonly displayName: string;
  readonly releaseStatus: ReleaseStatus;
  readonly setType: TrainingVoiceSetTypeV21;
  readonly currentSetCount: number;
  readonly currentTargetSemantics: string;
  readonly orientation: string;
  readonly equipment: readonly EquipmentTag[];
  readonly support: readonly string[];
  readonly laterality: TrainingVoiceLateralityV21;
  readonly setupModel: TrainingVoiceSetupModelV21;
  readonly firstUseCue: TrainingVoiceLogicalCueV21;
  readonly laterSetCue: TrainingVoiceLogicalCueV21;
  readonly targetCue: TrainingVoiceLogicalCueV21;
  readonly targetPlan: TrainingVoiceTargetPlanV21;
  readonly sidePlan: TrainingVoiceSidePlanV21;
  readonly progressPlan: TrainingVoiceProgressPlanV21;
  readonly safetyPlan: TrainingVoiceSafetyPlanV21;
  readonly finalPositionRequired: boolean;
  readonly repeatInstructions: readonly string[];
  readonly implementationRequirements: readonly TrainingVoiceImplementationRequirementId[];
  readonly runtimeStatus: TrainingVoiceRuntimeStatusV21;
  readonly sourceFiles: readonly string[];
  readonly semanticMatch: boolean;
  readonly notes: string;
  readonly livePrescription: ExercisePrescription;
  readonly liveKind: ExerciseKind;
}

export interface TrainingVoiceSessionMemoryV21 {
  readonly version: 1;
  readonly universalSafety: TrainingVoiceSafetyUniversalStateV21;
  readonly introducedSafetyFamilies: readonly Exclude<
    TrainingVoiceSafetyFamilyV21,
    'none' | 'floor_eligible_user'
  >[];
  readonly floor: TrainingFloorSessionMemory;
  readonly firstUseExerciseIds: readonly string[];
}

export type TrainingVoiceAssetStatusV21 =
  | 'exact_existing_pair'
  | 'existing_pair_script_mismatch'
  | 'new_pair_required'
  | 'not_required'
  | 'conditional_legacy_only';

export interface TrainingVoiceAssetRequirementV21 {
  readonly logicalCueKey: string;
  readonly exactScript: string;
  readonly category: TrainingVoiceLogicalCueCategoryV21;
  readonly policyId: TrainingVoicePolicyIdV21;
  readonly exerciseIds: readonly string[];
  readonly usageRole: string;
  readonly safetyFamily: TrainingVoiceSafetyFamilyV21 | null;
  readonly sideVariant: string;
  readonly currentCandidateKey: string | null;
  readonly currentCandidateScript: string | null;
  readonly claraStatus: 'exists' | 'missing';
  readonly marcusStatus: 'exists' | 'missing';
  readonly semanticMatch: boolean;
  readonly reuseDecision:
    | 'reuse_exact_existing_pair'
    | 'new_pair_required'
    | 'existing_pair_script_mismatch'
    | 'not_required'
    | 'conditional_legacy_only';
  readonly generationRequiredLater: boolean;
  readonly requiredForVoiceFirst: boolean;
  readonly budgetClass: string;
  readonly implementationBlockers: readonly TrainingVoiceImplementationRequirementId[];
  readonly status: TrainingVoiceAssetStatusV21;
  readonly notes: string;
}

export interface TrainingVoiceRuntimeReadinessV21 {
  readonly exerciseId: string;
  readonly softwareContractValid: boolean;
  readonly behaviorReady: boolean;
  readonly targetReady: boolean;
  readonly safetyPlanReady: boolean;
  readonly audioReady: boolean;
  readonly selectable: boolean;
  readonly blockers: readonly string[];
  readonly legacyFallbackAvailable: boolean;
  readonly notes: string;
}

export interface TrainingVoiceSequenceEntryV21 {
  readonly cue: TrainingVoiceLogicalCueV21;
  readonly required: boolean;
  readonly optional: boolean;
}

export interface TrainingVoiceSequencePlanV21 {
  readonly exerciseId: string;
  readonly exposure: 'first_use' | 'later_set' | 'repeat_instructions' | 'wrong_lead_correction';
  readonly cueKeys: readonly string[];
  readonly scripts: readonly string[];
  readonly entries: readonly TrainingVoiceSequenceEntryV21[];
  readonly targetPlan: TrainingVoiceTargetPlanV21;
  readonly sidePlan: TrainingVoiceSidePlanV21;
  readonly safetyPlan: TrainingVoiceSafetyPlanV21;
  readonly setupModel: TrainingVoiceSetupModelV21;
  readonly implementationBlockers: readonly TrainingVoiceImplementationRequirementId[];
  readonly assetBlockers: readonly string[];
  readonly runtimeReadiness: TrainingVoiceRuntimeReadinessV21;
  readonly ready: boolean;
  readonly reasonCodes: readonly string[];
}

export type TrainingVoicePhaseV21 =
  | 'idle'
  | 'session_entry'
  | 'item_setup'
  | 'repeat_instructions'
  | 'countdown'
  | 'active'
  | 'paused'
  | 'tracking_recovery'
  | 'reactive_safety_stop'
  | 'rest_transition'
  | 'item_transition'
  | 'session_completion'
  | 'audio_failure'
  | 'cancelled';

export type TrainingVoiceControlV21 =
  | 'pause'
  | 'resume'
  | 'repeat_instructions'
  | 'retry'
  | 'skip'
  | 'cancel';

export type TrainingVoiceControlRequirednessV21 =
  | 'required_before_next_boundary'
  | 'optional_transition'
  | 'silent_state_exit';

export interface TrainingVoiceControlContractV21 {
  readonly control: TrainingVoiceControlV21;
  readonly logicalCueKey: string | null;
  readonly exactScript: string | null;
  readonly policyId: 'result_transition' | 'instruction';
  readonly requiredness: TrainingVoiceControlRequirednessV21;
  readonly allowedPhases: readonly TrainingVoicePhaseV21[];
  readonly actionSemantics: string;
  readonly controllerActionTiming: string;
  readonly nextBoundaryGate: string;
  readonly failureBehavior: string;
  readonly duplicateTapBehavior: string;
  readonly restoreBehavior: string;
  readonly voiceSwitchBehavior: string;
}

export type TrainingVoiceRuntimeEventTypeV21 =
  | 'setup_sequence_required'
  | 'countdown_requested'
  | 'go_playback_started'
  | 'active_attempt_started'
  | 'accepted_rep'
  | 'times_up'
  | 'set_completed'
  | 'side_completed'
  | 'round_completed'
  | 'rest_started'
  | 'item_completed'
  | 'item_skipped'
  | 'session_completed'
  | 'pause_accepted'
  | 'resume_accepted'
  | 'repeat_requested'
  | 'retry_accepted'
  | 'cancel_accepted'
  | 'tracking_loss_confirmed'
  | 'tracking_recovered'
  | 'voice_changed'
  | 'app_backgrounded'
  | 'audio_failed';

export interface TrainingVoiceRuntimeEventV21 {
  readonly eventId: string;
  readonly acceptedAtMs: number;
  readonly sessionId: string;
  readonly sessionEpoch: number;
  readonly itemId: string | null;
  readonly itemEpoch: number;
  readonly setId: string | null;
  readonly setIndex: number | null;
  readonly setEpoch: number;
  readonly attemptId: string | null;
  readonly attemptEpoch: number;
  readonly type: TrainingVoiceRuntimeEventTypeV21;
  readonly payload?: unknown;
}

export type TrainingVoiceSetRuntimeKindV21 =
  | 'legacy_generic'
  | 'both_sides_round'
  | 'step_up_alternation'
  | 'floor_v21';

export interface TrainingVoiceProgressEventV21 {
  readonly eventId: string;
  readonly dueAtActiveElapsedMs: number;
  readonly logicalCueKey: 'halfway-v21' | 'five-seconds-left-v21';
  readonly policyId: 'low_reassurance';
}

export interface TrainingVoiceActiveProgressPlanV21 {
  readonly setType: TrainingVoiceSetTypeV21 | 'side_segment';
  readonly targetMs: number | null;
  readonly events: readonly TrainingVoiceProgressEventV21[];
  readonly reasonCodes: readonly string[];
  readonly optional: true;
  readonly dropIfBusy: true;
  readonly replayIfMissed: false;
  readonly cancelConditions: readonly string[];
}

export type TrainingVoiceTransitionCueKeyV21 =
  | 'times-up-v21'
  | 'set-complete-v21'
  | 'rest-now-v21'
  | 'last-set-v21'
  | 'next-exercise-v21'
  | 'session-complete-v21'
  | 'switch-legs-v21'
  | 'switch-foot-positions-v21'
  | 'switch-sides-v21'
  | 'training-skip-v21';

export interface TrainingVoiceTransitionPlanV21 {
  readonly transitionId: string;
  readonly cueKeys: readonly TrainingVoiceTransitionCueKeyV21[];
  readonly scripts: readonly string[];
  readonly requiredBeforeNextBoundary: boolean;
  readonly restStartBoundary: 'rest-now_playback_start' | 'controller_rest_start' | 'none';
  readonly dedupePolicy: string;
  readonly reasonCodes: readonly string[];
}

export interface TrainingVoiceRecoveryEpisodeV21 {
  readonly recoveryId: string;
  readonly sessionId: string;
  readonly itemId: string;
  readonly setId: string;
  readonly attemptId: string;
  readonly setRuntimeKind: TrainingVoiceSetRuntimeKindV21;
  readonly lossConfirmedAtMs: number;
  readonly sourceAttemptEpoch: number;
  readonly currentSide?: string;
  readonly expectedLead?: 'left' | 'right';
  readonly trackingLossCueRequested: boolean;
  readonly trackingLossCueCompleted: boolean;
  readonly stableRecoveryReached: boolean;
  readonly recoveredCueRequested: boolean;
  readonly recoveredCueCompleted: boolean;
  readonly freshCountdownRequired: true;
}

export type TrainingVoiceReactiveSafetyDispositionV21 =
  | 'tracking_recovery'
  | 'controller_event_critical_stop'
  | 'explicit_user_report_critical_stop'
  | 'equipment_correction_then_retry'
  | 'health_stop_no_auto_resume'
  | 'preventative_instruction_already_fulfilled'
  | 'legacy_only';

export interface TrainingVoiceReactiveSafetyContractV21 {
  readonly sourceCueId: SafetyCueId;
  readonly exactSourceScript: string;
  readonly disposition: TrainingVoiceReactiveSafetyDispositionV21;
  readonly logicalCueKey: string | null;
  readonly triggerSource: string;
  readonly autoDetectionClaimed: boolean;
  readonly recoveryPolicy: string;
  readonly remainingBlocker: string | null;
  readonly legacyPathPreserved: boolean;
}

export interface SerializedTrainingVoiceRuntimeV21 {
  readonly version: 1;
  readonly runtimeMode: 'internal_v21';
  readonly phase: TrainingVoicePhaseV21;
  readonly sessionEpoch: number;
  readonly itemEpoch: number;
  readonly setEpoch: number;
  readonly attemptEpoch: number;
  readonly safetyMemory: TrainingVoiceSessionMemoryV21;
  readonly pausedOrigin: TrainingVoicePhaseV21 | null;
  readonly recoveryEpisode: {
    readonly recoveryId: string;
    readonly itemId: string;
    readonly setId: string;
    readonly sourceAttemptId: string;
    readonly stableRecoveryReached: boolean;
  } | null;
  readonly completedTransitionIds: readonly string[];
  readonly firedProgressEventIds: readonly string[];
  readonly activeVoiceId: string;
  readonly pendingVoiceId: string | null;
  readonly planFingerprint: string;
}
