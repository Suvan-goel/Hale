import type {
  BodySide,
  MeasurementContext,
  MeasurementProtocolRef,
  MeasurementSideRole,
  MeasurementSideSource,
} from '../../checkup';
import type { MicroCheckType } from '../microCheck';

export type MicroCheckTypeV21 = MicroCheckType;

export type MicroCheckVoiceSideRoleV21 =
  | 'not_applicable'
  | 'standing_leg'
  | 'extended_leg';

export type MicroCheckEndPolicyV21 =
  | 'accepted_rep_target_or_cap'
  | 'hold_end_or_cap'
  | 'fixed_rom_window';

export type MicroCheckVoicePhaseV21 =
  | 'side_setup'
  | 'preflight'
  | 'instruction'
  | 'final_position'
  | 'countdown'
  | 'active'
  | 'paused'
  | 'tracking_recovery'
  | 'invalid_result'
  | 'completion'
  | 'discarded'
  | 'audio_failure'
  | 'cancelled';

export type MicroCheckVoiceExposureV21 =
  | 'first_setup'
  | 'repeat_instructions'
  | 'resume_setup'
  | 'retry_setup'
  | 'recovery_setup'
  | 'completion'
  | 'discard';

export type MicroCheckVoiceLogicalCueCategoryV21 =
  | 'micro_instruction'
  | 'final_position'
  | 'countdown'
  | 'active_stop'
  | 'control'
  | 'recovery'
  | 'completion';

export type MicroCheckVoicePolicyIdV21 =
  | 'critical_stop'
  | 'critical_window'
  | 'result_transition'
  | 'instruction'
  | 'setup_recovery';

export type MicroCheckVoiceLogicalCueKeyV21 =
  | 'micro-chair-power-v21'
  | 'micro-single-leg-left-v21'
  | 'micro-single-leg-right-v21'
  | 'micro-mobility-left-v21'
  | 'micro-mobility-right-v21'
  | 'micro-relax-v21'
  | 'microcheck-complete-v21'
  | 'micro-discard-v21'
  | 'final-position-set-v21'
  | 'paused-v21'
  | 'resuming-v21'
  | 'retry-v21'
  | 'tracking-loss-v21'
  | 'tracking-recovered-v21'
  | 'countdown-three'
  | 'countdown-two'
  | 'countdown-one'
  | 'go'
  | 'times-up-v21';

export interface MicroCheckVoiceLogicalCueV21 {
  readonly key: MicroCheckVoiceLogicalCueKeyV21;
  readonly exactScript: string;
  readonly category: MicroCheckVoiceLogicalCueCategoryV21;
  readonly policyId: MicroCheckVoicePolicyIdV21;
  readonly requiredForVoiceFirst: boolean;
}

export type MicroCheckVoiceImplementationRequirementV21 =
  | 'IR-MICRO-VOICE-AUDIO-ASSETS'
  | 'IR-MICRO-VOICE-FINAL-SCHEMA'
  | 'IR-MICRO-VOICE-PHYSICAL_QA';

export interface MicroCheckVoiceContractV21 {
  readonly type: MicroCheckTypeV21;
  readonly displayName: string;
  readonly currentProtocolId: string;
  readonly currentProtocolVersion: number;
  readonly finalProtocolId: string;
  readonly finalProtocolVersion: number;
  readonly comparisonGroup: string;
  readonly sideRole: MicroCheckVoiceSideRoleV21;
  readonly sideRequired: boolean;
  readonly setupCueKey:
    | 'micro-chair-power-v21'
    | 'micro-single-leg-left-v21'
    | 'micro-single-leg-right-v21'
    | 'micro-mobility-left-v21'
    | 'micro-mobility-right-v21';
  readonly exactScript: string;
  readonly finalPositionRequired: true;
  readonly finalPositionStrategy:
    | 'explicit_ready_plus_camera_readiness'
    | 'explicit_ready_plus_selected_side_camera_readiness';
  readonly endPolicy: MicroCheckEndPolicyV21;
  readonly targetDescription: string;
  readonly hardCapMs: number | null;
  readonly repSfxOnly: boolean;
  readonly progressCueKeys: readonly MicroCheckVoiceLogicalCueKeyV21[];
  readonly stopCueKey: 'times-up-v21' | 'micro-relax-v21' | null;
  readonly completionCueKey: 'microcheck-complete-v21';
  readonly requiredness: {
    readonly setup: 'required';
    readonly finalPosition: 'required';
    readonly countdown: 'required';
    readonly completion: 'result_transition';
  };
  readonly implementationRequirements: readonly MicroCheckVoiceImplementationRequirementV21[];
  readonly sourceFiles: readonly string[];
  readonly notes: string;
}

export interface MicroCheckVoiceSequenceEntryV21 {
  readonly cue: MicroCheckVoiceLogicalCueV21;
  readonly required: boolean;
  readonly optional: boolean;
}

export interface MicroCheckVoiceSequencePlanV21 {
  readonly type: MicroCheckTypeV21;
  readonly selectedSide: BodySide | null;
  readonly exposure: MicroCheckVoiceExposureV21;
  readonly phase: MicroCheckVoicePhaseV21;
  readonly cueKeys: readonly MicroCheckVoiceLogicalCueKeyV21[];
  readonly scripts: readonly string[];
  readonly entries: readonly MicroCheckVoiceSequenceEntryV21[];
  readonly ready: boolean;
  readonly reasonCodes: readonly string[];
}

export interface MicroCheckVoiceRuntimeReadinessV21 {
  readonly type: MicroCheckTypeV21;
  readonly softwareContractValid: boolean;
  readonly behaviorReady: boolean;
  readonly audioReady: boolean;
  readonly selectable: boolean;
  readonly blockers: readonly string[];
  readonly legacyFallbackAvailable: true;
  readonly notes: string;
}

export interface MicroCheckVoiceRuntimeSelectionV21 {
  readonly mode: 'legacy' | 'micro_check_voice_v2_1';
  readonly featureEnabled: boolean;
  readonly reasonCodes: readonly string[];
  readonly typeReadiness: readonly MicroCheckVoiceRuntimeReadinessV21[];
  readonly v21Selectable: boolean;
}

export type MicroCheckProtocolCompatibilityClassificationV21 =
  | 'same_protocol_non_measurement_voice_change'
  | 'same_protocol_bugfix_no_metric_effect'
  | 'new_protocol_version_required'
  | 'new_protocol_id_required';

export interface MicroCheckProtocolCompatibilityV21 {
  readonly microCheckType: MicroCheckTypeV21;
  readonly oldProtocol: MeasurementProtocolRef;
  readonly newProtocol: MeasurementProtocolRef;
  readonly activeStartSemantics: string;
  readonly interruptionSemantics: string;
  readonly sideSemantics: string;
  readonly resultSemantics: string;
  readonly classification: MicroCheckProtocolCompatibilityClassificationV21;
  readonly directComparisonAllowed: boolean;
  readonly oldHistoryPreserved: boolean;
  readonly newSeriesRequired: boolean;
  readonly reason: string;
}

export type MicroCheckVoiceAssetReuseDecisionV21 =
  | 'reuse_exact_existing_pair'
  | 'new_pair_required'
  | 'existing_pair_script_mismatch'
  | 'not_required'
  | 'conditional_legacy_only';

export interface MicroCheckVoiceAssetRequirementV21 {
  readonly logicalCueKey: MicroCheckVoiceLogicalCueKeyV21;
  readonly exactScript: string;
  readonly category: MicroCheckVoiceLogicalCueCategoryV21;
  readonly policyId: MicroCheckVoicePolicyIdV21;
  readonly requiredness: string;
  readonly microCheckTypes: readonly MicroCheckTypeV21[];
  readonly sideVariant: BodySide | 'none' | 'shared';
  readonly currentCandidateKey: string | null;
  readonly currentCandidateScript: string | null;
  readonly claraExists: boolean;
  readonly marcusExists: boolean;
  readonly semanticMatch: boolean;
  readonly reuseDecision: MicroCheckVoiceAssetReuseDecisionV21;
  readonly generationRequiredLater: boolean;
  readonly budgetClass: string;
  readonly notes: string;
}

export interface MicroCheckVoiceRuntimeEventV21 {
  readonly type:
    | 'sequence_requested'
    | 'final_position_ready'
    | 'countdown_requested'
    | 'go_playback_started'
    | 'active_started'
    | 'active_stopped'
    | 'pause_accepted'
    | 'resume_accepted'
    | 'retry_accepted'
    | 'discard_accepted'
    | 'tracking_loss'
    | 'tracking_recovered'
    | 'completion_requested'
    | 'stale_callback_ignored'
    | 'audio_failure';
  readonly atMs: number;
  readonly flowId: string;
  readonly attemptId: string | null;
  readonly scopeId: string | null;
  readonly details?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface MicroCheckRecoveryEpisodeV21 {
  readonly recoveryId: string;
  readonly flowId: string;
  readonly type: MicroCheckTypeV21;
  readonly selectedSide: BodySide | null;
  readonly sourceAttemptId: string;
  readonly sourceAttemptEpoch: number;
  readonly lossConfirmedAtMs: number;
  readonly lossCueRequested: boolean;
  readonly lossCueCompleted: boolean;
  readonly stableRecoveryReached: boolean;
  readonly recoveredCueRequested: boolean;
  readonly recoveredCueCompleted: boolean;
  readonly freshCountdownRequired: true;
}

export interface MicroCheckVoiceResolvedSideV21 {
  readonly selectedSide: BodySide | null;
  readonly sideSource: MeasurementSideSource;
  readonly measurementContext: MeasurementContext | null;
  readonly sideRole: MeasurementSideRole;
}
