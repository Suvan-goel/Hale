import type {
  TrainingVoiceControlContractV21,
  TrainingVoiceControlV21,
  TrainingVoicePhaseV21,
} from './types';

const SAFE_SETUP_PHASES: readonly TrainingVoicePhaseV21[] = [
  'idle',
  'session_entry',
  'item_setup',
  'paused',
  'tracking_recovery',
  'reactive_safety_stop',
  'rest_transition',
  'audio_failure',
];

export const TRAINING_VOICE_CONTROL_CONTRACTS_V21: readonly TrainingVoiceControlContractV21[] =
  Object.freeze([
    contract({
      control: 'pause',
      logicalCueKey: 'paused-v21',
      exactScript: 'Paused. Take your time. This set will restart when you resume.',
      allowedPhases: ['session_entry', 'item_setup', 'repeat_instructions', 'countdown', 'active', 'rest_transition'],
      actionSemantics:
        'The canonical player/set runtime accepts pause first; active partial work is frozen or discarded according to runtime kind.',
      controllerActionTiming: 'controller_first',
      nextBoundaryGate: 'paused_state_blocks_countdown_go_and_active',
      failureBehavior: 'visible_paused_state_remains_authoritative_even_if_confirmation_audio_fails',
      duplicateTapBehavior: 'dedupe_by_control_transaction_id_until_phase_changes',
      restoreBehavior: 'restore_paused_without_replaying_paused_confirmation',
      voiceSwitchBehavior: 'apply_new_voice_at_paused_boundary',
    }),
    contract({
      control: 'resume',
      logicalCueKey: 'resuming-v21',
      exactScript: 'Resuming. Get back into position and wait for my countdown.',
      allowedPhases: ['paused'],
      actionSemantics:
        'Resume confirms the accepted paused state, re-enters setup/final-position/readiness, then requires a fresh countdown before active work.',
      controllerActionTiming: 'controller_first_but_active_boundary_blocked',
      nextBoundaryGate: 'resume_cue_or_visible_fallback_then_setup_then_countdown',
      failureBehavior: 'do_not_start_active_work; keep visible fallback with retry_or_exit_controls',
      duplicateTapBehavior: 'dedupe_by_control_transaction_id_until_resume_resolves',
      restoreBehavior: 'restore_paused; never auto_speak_resuming',
      voiceSwitchBehavior: 'safe_to_switch_before_replayed_required_setup',
    }),
    contract({
      control: 'repeat_instructions',
      logicalCueKey: null,
      exactScript: null,
      policyId: 'instruction',
      requiredness: 'optional_transition',
      allowedPhases: SAFE_SETUP_PHASES,
      actionSemantics:
        'Replay the current exact exercise instruction, current side/lead context, and current target only.',
      controllerActionTiming: 'no_controller_progression_mutation',
      nextBoundaryGate: 'does_not_start_countdown_or_resume_paused_session',
      failureBehavior: 'visible state remains unchanged; no safety memory is mutated',
      duplicateTapBehavior: 'dedupe_while_repeat_sequence_scope_is_active',
      restoreBehavior: 'in_flight_repeat_is_not_restored_as_completed',
      voiceSwitchBehavior: 'cancel_old_repeat_and_replay_complete_repeat_sequence_in_new_voice',
    }),
    contract({
      control: 'retry',
      logicalCueKey: 'retry-v21',
      exactScript: "That's okay. We'll try that part again. Take a moment, then follow my voice.",
      allowedPhases: ['audio_failure', 'tracking_recovery', 'reactive_safety_stop', 'paused', 'item_setup'],
      actionSemantics:
        'Create one fresh control transaction and fresh attempt where required; preserve already accepted work and discard partial current work.',
      controllerActionTiming: 'controller_first_for_retry_reset',
      nextBoundaryGate: 'retry_confirmation_optional; required_setup_and_countdown_remain_blocking',
      failureBehavior: 'retry_cue_failure_does_not_skip_required_setup_or_countdown',
      duplicateTapBehavior: 'dedupe_by_retry_transaction_id_until_new_attempt_created',
      restoreBehavior: 'restore_safe_boundary_not_in_flight_retry_completion',
      voiceSwitchBehavior: 'switch_before_replaying_required_setup',
    }),
    contract({
      control: 'skip',
      logicalCueKey: 'training-skip-v21',
      exactScript: "Skipped. No problem. We'll move on to the next part.",
      allowedPhases: SAFE_SETUP_PHASES,
      actionSemantics:
        'The canonical controller accepts skip first; skipped work receives no progression credit.',
      controllerActionTiming: 'controller_first',
      nextBoundaryGate: 'skip_confirmation_or_visible_fallback_before_next_item_setup',
      failureBehavior: 'item_remains_skipped; do_not_silently_start_next_required_item',
      duplicateTapBehavior: 'dedupe_by_skip_transaction_id_until_item_epoch_changes',
      restoreBehavior: 'restore_skipped_item_as_accepted_history_not_in_flight_cue',
      voiceSwitchBehavior: 'finish_or_fallback_skip_confirmation_before_new_item_voice',
    }),
    contract({
      control: 'cancel',
      logicalCueKey: null,
      exactScript: null,
      requiredness: 'silent_state_exit',
      allowedPhases: [
        'session_entry',
        'item_setup',
        'repeat_instructions',
        'countdown',
        'active',
        'paused',
        'tracking_recovery',
        'reactive_safety_stop',
        'rest_transition',
        'item_transition',
        'session_completion',
        'audio_failure',
      ],
      actionSemantics: 'Cancel all voice scopes, invalidate callbacks, and preserve canonical saved work per exit semantics.',
      controllerActionTiming: 'controller_first_state_exit',
      nextBoundaryGate: 'none_state_exits',
      failureBehavior: 'no_spoken_cancel_line; stale_completion_is_suppressed',
      duplicateTapBehavior: 'idempotent_after_cancelled_phase',
      restoreBehavior: 'cancelled_runtime_not_restored_as_active',
      voiceSwitchBehavior: 'pending_voice_switch_discarded',
    }),
  ]);

export function listTrainingVoiceControlContractsV21(): TrainingVoiceControlContractV21[] {
  return TRAINING_VOICE_CONTROL_CONTRACTS_V21.map((row) => ({
    ...row,
    allowedPhases: row.allowedPhases.slice(),
  }));
}

export function getTrainingVoiceControlContractV21(
  control: TrainingVoiceControlV21
): TrainingVoiceControlContractV21 {
  const found = TRAINING_VOICE_CONTROL_CONTRACTS_V21.find((row) => row.control === control);
  if (!found) throw new Error(`missing Training Voice V2.1 control contract '${control}'`);
  return { ...found, allowedPhases: found.allowedPhases.slice() };
}

export function validateTrainingVoiceControlContractsV21(): {
  readonly valid: boolean;
  readonly controlContractCount: number;
  readonly missingControlContractCount: number;
  readonly missingControls: readonly TrainingVoiceControlV21[];
} {
  const required: readonly TrainingVoiceControlV21[] = [
    'pause',
    'resume',
    'repeat_instructions',
    'retry',
    'skip',
    'cancel',
  ];
  const missingControls = required.filter(
    (control) => !TRAINING_VOICE_CONTROL_CONTRACTS_V21.some((row) => row.control === control)
  );
  return {
    valid: missingControls.length === 0,
    controlContractCount: TRAINING_VOICE_CONTROL_CONTRACTS_V21.length,
    missingControlContractCount: missingControls.length,
    missingControls,
  };
}

function contract(
  input: Omit<
    TrainingVoiceControlContractV21,
    'policyId' | 'requiredness'
  > & {
    readonly policyId?: TrainingVoiceControlContractV21['policyId'];
    readonly requiredness?: TrainingVoiceControlContractV21['requiredness'];
  }
): TrainingVoiceControlContractV21 {
  return Object.freeze({
    policyId: 'result_transition',
    requiredness: input.control === 'cancel' ? 'silent_state_exit' : 'required_before_next_boundary',
    ...input,
    allowedPhases: Object.freeze(input.allowedPhases.slice()),
  });
}
