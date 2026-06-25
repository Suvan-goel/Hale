import type { EquipmentTag } from '../../movements';
import type { ExerciseKind, ExercisePrescription, ReleaseStatus } from '../../exercises';
import type { TrainingRoundSideRole } from '../bothSidesRounds';

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

export interface TrainingVoiceSafetyPlanV21 {
  readonly family: TrainingVoiceSafetyFamilyV21;
  readonly absorbedIntoInstruction: boolean;
  readonly cue: TrainingVoiceLogicalCueV21 | null;
  readonly reasonCodes: readonly string[];
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
  readonly universalSafetySpoken: boolean;
  readonly introducedSafetyFamilies: readonly TrainingVoiceSafetyFamilyV21[];
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
