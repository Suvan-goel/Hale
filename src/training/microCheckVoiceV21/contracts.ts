import type { MicroCheckType } from '../microCheck';
import { MICRO_CHECK_DEFAULT_MAX_ACTIVE_MS } from '../microCheckConfig';
import type {
  MicroCheckTypeV21,
  MicroCheckVoiceContractV21,
  MicroCheckVoiceLogicalCueKeyV21,
  MicroCheckVoiceLogicalCueV21,
} from './types';

export const MICRO_CHECK_VOICE_TYPES_V21: readonly MicroCheckTypeV21[] = [
  'chair-power',
  'single-leg-balance',
  'mobility-reach',
] as const;

export const MICRO_CHECK_VOICE_SHARED_LOGICAL_CUES_V21 = [
  cue('final-position-set-v21', "You're set.", 'final_position', 'setup_recovery', true),
  cue('countdown-three', 'Three.', 'countdown', 'critical_window', true),
  cue('countdown-two', 'Two.', 'countdown', 'critical_window', true),
  cue('countdown-one', 'One.', 'countdown', 'critical_window', true),
  cue('go', 'Go!', 'countdown', 'critical_window', true),
  cue('times-up-v21', 'Time.', 'active_stop', 'critical_stop', true),
  cue('micro-relax-v21', 'Relax.', 'active_stop', 'critical_stop', true),
  cue('paused-v21', 'Paused.', 'control', 'result_transition', true),
  cue('resuming-v21', 'Resuming.', 'control', 'result_transition', true),
  cue('retry-v21', "Let's try that again.", 'control', 'result_transition', true),
  cue('micro-discard-v21', 'Check discarded.', 'control', 'result_transition', true),
  cue('tracking-loss-v21', 'Pause. Return to the setup position.', 'recovery', 'critical_stop', true),
  cue('tracking-recovered-v21', "You're back in position. We'll restart.", 'recovery', 'setup_recovery', true),
  cue('microcheck-complete-v21', 'Check complete.', 'completion', 'result_transition', true),
] as const satisfies readonly MicroCheckVoiceLogicalCueV21[];

export const MICRO_CHECK_VOICE_CONTRACTS_V21 = [
  {
    type: 'chair-power',
    displayName: 'Chair Power',
    currentProtocolId: 'micro_chair_power_5_reps_v1',
    currentProtocolVersion: 1,
    finalProtocolId: 'micro_chair_power_5_reps_v21',
    finalProtocolVersion: 2,
    comparisonGroup: 'micro_chair_power_v21',
    sideRole: 'not_applicable',
    sideRequired: false,
    setupCueKey: 'micro-chair-power-v21',
    exactScript: 'Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable.',
    finalPositionRequired: true,
    finalPositionStrategy: 'explicit_ready_plus_camera_readiness',
    endPolicy: 'accepted_rep_target_or_cap',
    targetDescription: '5 accepted chair stands',
    hardCapMs: MICRO_CHECK_DEFAULT_MAX_ACTIVE_MS,
    repSfxOnly: true,
    progressCueKeys: [],
    stopCueKey: 'times-up-v21',
    completionCueKey: 'microcheck-complete-v21',
    requiredness: requiredness(),
    implementationRequirements: ['IR-MICRO-VOICE-AUDIO-ASSETS', 'IR-MICRO-VOICE-FINAL-SCHEMA'],
    sourceFiles: ['src/training/microCheck.ts', 'src/training/microCheckVoiceV21/contracts.ts'],
    notes: 'Side-independent five-rep chair-power protocol. V2.1 changes active start to go playback-start and invalidates interrupted attempts.',
  },
  {
    type: 'single-leg-balance',
    displayName: 'Single-Leg Balance',
    currentProtocolId: 'micro_single_leg_balance_v1',
    currentProtocolVersion: 1,
    finalProtocolId: 'micro_single_leg_balance_v21',
    finalProtocolVersion: 2,
    comparisonGroup: 'micro_single_leg_balance_v21',
    sideRole: 'standing_leg',
    sideRequired: true,
    setupCueKey: 'micro-single-leg-left-v21',
    exactScript: 'Quick balance check. Stand on your left leg with support nearby. Hold as long as comfortable.',
    finalPositionRequired: true,
    finalPositionStrategy: 'explicit_ready_plus_selected_side_camera_readiness',
    endPolicy: 'hold_end_or_cap',
    targetDescription: 'hold as long as comfortable; current grader target 40 seconds, runner hard cap 45 seconds',
    hardCapMs: MICRO_CHECK_DEFAULT_MAX_ACTIVE_MS,
    repSfxOnly: false,
    progressCueKeys: [],
    stopCueKey: 'times-up-v21',
    completionCueKey: 'microcheck-complete-v21',
    requiredness: requiredness(),
    implementationRequirements: ['IR-MICRO-VOICE-AUDIO-ASSETS', 'IR-MICRO-VOICE-FINAL-SCHEMA'],
    sourceFiles: [
      'src/training/microCheck.ts',
      'src/training/microCheckSideSetup.ts',
      'src/training/microCheckVoiceV21/contracts.ts',
    ],
    notes: 'Standing leg is pinned before runner construction; right-side variant swaps the exact setup cue and script.',
  },
  {
    type: 'mobility-reach',
    displayName: 'Mobility Reach',
    currentProtocolId: 'micro_mobility_reach_v1',
    currentProtocolVersion: 1,
    finalProtocolId: 'micro_mobility_reach_v21',
    finalProtocolVersion: 2,
    comparisonGroup: 'micro_mobility_reach_v21',
    sideRole: 'extended_leg',
    sideRequired: true,
    setupCueKey: 'micro-mobility-left-v21',
    exactScript: 'Quick mobility check. Extend your left leg and reach gently until I say relax.',
    finalPositionRequired: true,
    finalPositionStrategy: 'explicit_ready_plus_selected_side_camera_readiness',
    endPolicy: 'fixed_rom_window',
    targetDescription: 'current ROM capture window with runner hard cap preserved at 45 seconds',
    hardCapMs: MICRO_CHECK_DEFAULT_MAX_ACTIVE_MS,
    repSfxOnly: false,
    progressCueKeys: [],
    stopCueKey: 'micro-relax-v21',
    completionCueKey: 'microcheck-complete-v21',
    requiredness: requiredness(),
    implementationRequirements: ['IR-MICRO-VOICE-AUDIO-ASSETS', 'IR-MICRO-VOICE-FINAL-SCHEMA'],
    sourceFiles: [
      'src/training/microCheck.ts',
      'src/training/microCheckSideSetup.ts',
      'src/training/microCheckVoiceV21/contracts.ts',
    ],
    notes: 'Extended leg is pinned before runner construction; the stop cue is a pending logical Relax line, not relax-arm.',
  },
] as const satisfies readonly MicroCheckVoiceContractV21[];

export function listMicroCheckVoiceContractsV21(): MicroCheckVoiceContractV21[] {
  return MICRO_CHECK_VOICE_CONTRACTS_V21.map((contract) => ({ ...contract, requiredness: { ...contract.requiredness } }));
}

export function getMicroCheckVoiceContractV21(type: MicroCheckType): MicroCheckVoiceContractV21 {
  const contract = maybeMicroCheckVoiceContractV21(type);
  if (!contract) throw new Error(`missing Micro-Check Voice V2.1 contract for '${type}'`);
  return contract;
}

export function maybeMicroCheckVoiceContractV21(
  type: MicroCheckType
): MicroCheckVoiceContractV21 | null {
  return MICRO_CHECK_VOICE_CONTRACTS_V21.find((contract) => contract.type === type) ?? null;
}

export function microCheckVoiceSetupCueForSideV21(
  type: MicroCheckType,
  selectedSide: 'left' | 'right' | null
): MicroCheckVoiceLogicalCueV21 | null {
  if (type === 'chair-power') return logicalCueV21('micro-chair-power-v21');
  if (!selectedSide) return null;
  if (type === 'single-leg-balance') {
    return logicalCueV21(selectedSide === 'left' ? 'micro-single-leg-left-v21' : 'micro-single-leg-right-v21');
  }
  return logicalCueV21(selectedSide === 'left' ? 'micro-mobility-left-v21' : 'micro-mobility-right-v21');
}

export function logicalCueV21(key: MicroCheckVoiceLogicalCueKeyV21): MicroCheckVoiceLogicalCueV21 {
  const found = allMicroCheckVoiceLogicalCuesV21().find((candidate) => candidate.key === key);
  if (!found) throw new Error(`missing Micro-Check Voice V2.1 logical cue '${key}'`);
  return found;
}

export function allMicroCheckVoiceLogicalCuesV21(): MicroCheckVoiceLogicalCueV21[] {
  return [
    cue(
      'micro-chair-power-v21',
      'Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable.',
      'micro_instruction',
      'instruction',
      true
    ),
    cue(
      'micro-single-leg-left-v21',
      'Quick balance check. Stand on your left leg with support nearby. Hold as long as comfortable.',
      'micro_instruction',
      'instruction',
      true
    ),
    cue(
      'micro-single-leg-right-v21',
      'Quick balance check. Stand on your right leg with support nearby. Hold as long as comfortable.',
      'micro_instruction',
      'instruction',
      true
    ),
    cue(
      'micro-mobility-left-v21',
      'Quick mobility check. Extend your left leg and reach gently until I say relax.',
      'micro_instruction',
      'instruction',
      true
    ),
    cue(
      'micro-mobility-right-v21',
      'Quick mobility check. Extend your right leg and reach gently until I say relax.',
      'micro_instruction',
      'instruction',
      true
    ),
    ...MICRO_CHECK_VOICE_SHARED_LOGICAL_CUES_V21,
  ];
}

export interface MicroCheckVoiceContractRegistryValidationV21 {
  readonly valid: boolean;
  readonly liveMicroCheckTypeCount: number;
  readonly contractCount: number;
  readonly missingContractCount: number;
  readonly staleExtraContractCount: number;
  readonly genericMicroIntroEmissionCount: number;
  readonly missingExactInstructionCount: number;
  readonly duplicateCueKeyCount: number;
  readonly sideRoleMismatchCount: number;
}

export function validateMicroCheckVoiceContractRegistryV21(): MicroCheckVoiceContractRegistryValidationV21 {
  const contracts = listMicroCheckVoiceContractsV21();
  const missing = MICRO_CHECK_VOICE_TYPES_V21.filter((type) => !contracts.some((contract) => contract.type === type));
  const stale = contracts.filter((contract) => !MICRO_CHECK_VOICE_TYPES_V21.includes(contract.type));
  const cueKeys = contracts.map((contract) => contract.setupCueKey);
  const duplicateCueKeyCount = cueKeys.length - new Set(cueKeys).size;
  const genericMicroIntroEmissionCount = contracts.filter((contract) =>
    contract.setupCueKey === ('microcheck-intro' as MicroCheckVoiceLogicalCueKeyV21)
  ).length;
  const missingExactInstructionCount = contracts.filter((contract) => contract.exactScript.trim().length === 0).length;
  const sideRoleMismatchCount = contracts.filter((contract) => {
    if (contract.type === 'chair-power') return contract.sideRole !== 'not_applicable' || contract.sideRequired;
    if (contract.type === 'single-leg-balance') return contract.sideRole !== 'standing_leg' || !contract.sideRequired;
    return contract.sideRole !== 'extended_leg' || !contract.sideRequired;
  }).length;
  return {
    valid:
      missing.length === 0 &&
      stale.length === 0 &&
      genericMicroIntroEmissionCount === 0 &&
      missingExactInstructionCount === 0 &&
      duplicateCueKeyCount === 0 &&
      sideRoleMismatchCount === 0,
    liveMicroCheckTypeCount: MICRO_CHECK_VOICE_TYPES_V21.length,
    contractCount: contracts.length,
    missingContractCount: missing.length,
    staleExtraContractCount: stale.length,
    genericMicroIntroEmissionCount,
    missingExactInstructionCount,
    duplicateCueKeyCount,
    sideRoleMismatchCount,
  };
}

function cue(
  key: MicroCheckVoiceLogicalCueKeyV21,
  exactScript: string,
  category: MicroCheckVoiceLogicalCueV21['category'],
  policyId: MicroCheckVoiceLogicalCueV21['policyId'],
  requiredForVoiceFirst: boolean
): MicroCheckVoiceLogicalCueV21 {
  return { key, exactScript, category, policyId, requiredForVoiceFirst };
}

function requiredness(): MicroCheckVoiceContractV21['requiredness'] {
  return {
    setup: 'required',
    finalPosition: 'required',
    countdown: 'required',
    completion: 'result_transition',
  };
}
