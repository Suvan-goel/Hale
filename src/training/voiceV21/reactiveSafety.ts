import { safetyCueText, type SafetyCueId } from '../safetyCues';
import {
  listTrainingVoiceSafetyCueMigrationV21,
} from './safetyPolicy';
import type {
  TrainingVoiceReactiveSafetyContractV21,
  TrainingVoiceReactiveSafetyDispositionV21,
} from './types';

export function listTrainingVoiceReactiveSafetyContractsV21(): TrainingVoiceReactiveSafetyContractV21[] {
  return listTrainingVoiceSafetyCueMigrationV21()
    .filter((row) => row.classification === 'reactive_control_recovery_later_phase')
    .map((row) => contractForCue(row.cueId));
}

export function getTrainingVoiceReactiveSafetyContractV21(
  sourceCueId: SafetyCueId
): TrainingVoiceReactiveSafetyContractV21 | null {
  return listTrainingVoiceReactiveSafetyContractsV21().find((row) => row.sourceCueId === sourceCueId) ?? null;
}

export function validateTrainingVoiceReactiveSafetyContractsV21(): {
  readonly valid: boolean;
  readonly reactiveSafetyCueCount: number;
  readonly unclassifiedReactiveSafetyCount: number;
  readonly fakeAutomaticDetectionCount: number;
  readonly healthStopAutoResumeCount: number;
  readonly equipmentStopAutoResumeCount: number;
} {
  const rows = listTrainingVoiceReactiveSafetyContractsV21();
  return {
    valid:
      rows.length > 0 &&
      rows.every((row) => row.remainingBlocker === null) &&
      rows.every((row) => !row.autoDetectionClaimed || row.disposition === 'tracking_recovery') &&
      rows.every((row) => row.disposition !== 'health_stop_no_auto_resume' || /no auto-resume/i.test(row.recoveryPolicy)) &&
      rows.every((row) => row.disposition !== 'equipment_correction_then_retry' || /explicit Retry/i.test(row.recoveryPolicy)),
    reactiveSafetyCueCount: rows.length,
    unclassifiedReactiveSafetyCount: rows.filter((row) => row.remainingBlocker !== null).length,
    fakeAutomaticDetectionCount: rows.filter((row) => row.autoDetectionClaimed && row.disposition !== 'tracking_recovery').length,
    healthStopAutoResumeCount: rows.filter(
      (row) => row.disposition === 'health_stop_no_auto_resume' && !/no auto-resume/i.test(row.recoveryPolicy)
    ).length,
    equipmentStopAutoResumeCount: rows.filter(
      (row) => row.disposition === 'equipment_correction_then_retry' && !/explicit Retry/i.test(row.recoveryPolicy)
    ).length,
  };
}

function contractForCue(sourceCueId: SafetyCueId): TrainingVoiceReactiveSafetyContractV21 {
  const disposition = dispositionForCue(sourceCueId);
  return {
    sourceCueId,
    exactSourceScript: safetyCueText(sourceCueId),
    disposition,
    logicalCueKey: logicalCueFor(disposition, sourceCueId),
    triggerSource: triggerSourceFor(disposition, sourceCueId),
    autoDetectionClaimed: disposition === 'tracking_recovery',
    recoveryPolicy: recoveryPolicyFor(disposition),
    remainingBlocker: null,
    legacyPathPreserved: true,
  };
}

function dispositionForCue(sourceCueId: SafetyCueId): TrainingVoiceReactiveSafetyDispositionV21 {
  if (
    sourceCueId === 'tracking_pause_and_reset' ||
    sourceCueId === 'tracking_keep_full_body_in_view' ||
    sourceCueId === 'global_pause_if_tracking_lost'
  ) {
    return 'tracking_recovery';
  }
  if (
    sourceCueId === 'global_stop_dizzy_or_lightheaded' ||
    sourceCueId === 'global_stop_sharp_or_increasing_pain' ||
    sourceCueId === 'floor_stop_if_transfer_unsteady' ||
    sourceCueId === 'balance_stop_if_unsteady' ||
    sourceCueId === 'step_stop_if_unstable'
  ) {
    return 'health_stop_no_auto_resume';
  }
  if (
    sourceCueId === 'global_stop_if_support_moves' ||
    sourceCueId === 'band_stop_if_slips_or_shifts' ||
    sourceCueId === 'door_anchor_stop_if_moves'
  ) {
    return 'equipment_correction_then_retry';
  }
  if (
    sourceCueId === 'band_never_release_under_tension' ||
    sourceCueId === 'band_do_not_overstretch' ||
    sourceCueId === 'balance_supported_if_hesitant' ||
    sourceCueId === 'global_breathe_normally' ||
    sourceCueId === 'tracking_no_rush_or_exaggerate'
  ) {
    return 'preventative_instruction_already_fulfilled';
  }
  return 'explicit_user_report_critical_stop';
}

function logicalCueFor(
  disposition: TrainingVoiceReactiveSafetyDispositionV21,
  sourceCueId: SafetyCueId
): string | null {
  if (disposition === 'tracking_recovery') return 'tracking-loss-v21';
  if (disposition === 'equipment_correction_then_retry') return 'retry-v21';
  if (disposition === 'health_stop_no_auto_resume') return null;
  if (disposition === 'preventative_instruction_already_fulfilled') return null;
  return sourceCueId;
}

function triggerSourceFor(
  disposition: TrainingVoiceReactiveSafetyDispositionV21,
  sourceCueId: SafetyCueId
): string {
  if (disposition === 'tracking_recovery') return 'confirmed_tracking_interruption_from_pose_runtime';
  if (disposition === 'equipment_correction_then_retry') return 'accepted_user_or_controller_equipment_stop_event';
  if (disposition === 'health_stop_no_auto_resume') return 'explicit_user_report_or_visible_stop_control';
  if (disposition === 'preventative_instruction_already_fulfilled') return 'setup_or_exact_instruction_memory';
  return `legacy_visible_control_for_${sourceCueId}`;
}

function recoveryPolicyFor(disposition: TrainingVoiceReactiveSafetyDispositionV21): string {
  switch (disposition) {
    case 'tracking_recovery':
      return 'May recover after stable current setup/readiness; fresh countdown required.';
    case 'equipment_correction_then_retry':
      return 'Stop active work, require correction, require explicit Retry, then fresh setup/countdown; no auto-resume.';
    case 'health_stop_no_auto_resume':
      return 'Stop or pause safely; no auto-resume; visible Exit/End controls remain available.';
    case 'preventative_instruction_already_fulfilled':
      return 'No duplicate reactive speech; requirement is fulfilled by exact setup/instruction or safety memory.';
    case 'legacy_only':
      return 'Preserved only for legacy voice path.';
    default:
      return 'Critical stop requires explicit user recovery action before fresh setup/countdown.';
  }
}
