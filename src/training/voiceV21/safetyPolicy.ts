import {
  getTrainingVoiceContractV21,
  TRAINING_VOICE_SHARED_LOGICAL_CUES_V21,
} from './contracts';
import type {
  TrainingVoiceExerciseContractV21,
  TrainingVoiceSafetyFamilyV21,
  TrainingVoiceSessionMemoryV21,
} from './types';

export interface ResolveTrainingVoiceSafetyV21Input {
  readonly contract: Pick<TrainingVoiceExerciseContractV21, 'exerciseId' | 'equipment' | 'safetyPlan'>;
  readonly sessionMemory?: TrainingVoiceSessionMemoryV21 | null;
  readonly capability?: { readonly floorEligible?: boolean | null } | null;
}

export interface ResolvedTrainingVoiceSafetyV21 {
  readonly dueFamily: TrainingVoiceSafetyFamilyV21;
  readonly absorbedIntoInstruction: boolean;
  readonly logicalCueKey: string | null;
  readonly exactScript: string | null;
  readonly reasonCodes: readonly string[];
}

export const EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21: TrainingVoiceSessionMemoryV21 = Object.freeze({
  universalSafetySpoken: false,
  introducedSafetyFamilies: [],
  firstUseExerciseIds: [],
});

const FAMILY_CUE_KEY: Readonly<Record<Exclude<TrainingVoiceSafetyFamilyV21, 'none' | 'mini_band_above_knees'>, string>> = {
  chair_seat: 'equip-chair-stable-v21',
  generic_support: 'equip-support-close-v21',
  balance_support: 'equip-balance-support-v21',
  step_or_stair: 'equip-step-stable-v21',
  long_band_handheld_or_foot_anchored: 'equip-long-band-v21',
  door_anchor_band: 'equip-door-anchor-v21',
  floor_eligible_user: 'equip-floor-transition-v21',
};

export function resolveTrainingVoiceSafetyV21(
  input: ResolveTrainingVoiceSafetyV21Input
): ResolvedTrainingVoiceSafetyV21 {
  const memory = input.sessionMemory ?? EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21;
  const family = mostSpecificFamilyFor(input.contract);
  if (family === 'none') {
    return result('none', false, null, null, ['no_equipment_family_due']);
  }
  if (family === 'floor_eligible_user' && input.capability?.floorEligible === false) {
    return result(family, false, null, null, ['floor_gate_not_eligible_blocks_v21']);
  }
  if (input.contract.safetyPlan.absorbedIntoInstruction || family === 'mini_band_above_knees') {
    return result(family, true, null, null, ['exact_instruction_absorbs_family']);
  }
  if (memory.introducedSafetyFamilies.includes(family)) {
    return result(family, false, null, null, ['family_already_introduced']);
  }
  const cueKey = FAMILY_CUE_KEY[family as Exclude<TrainingVoiceSafetyFamilyV21, 'none' | 'mini_band_above_knees'>];
  const cue = TRAINING_VOICE_SHARED_LOGICAL_CUES_V21.find((item) => item.key === cueKey) ?? null;
  return result(family, false, cue?.key ?? null, cue?.exactScript ?? null, ['most_specific_family_due']);
}

export function resolveTrainingVoiceSafetyForExerciseV21(
  exerciseId: string,
  sessionMemory?: TrainingVoiceSessionMemoryV21 | null
): ResolvedTrainingVoiceSafetyV21 {
  return resolveTrainingVoiceSafetyV21({
    contract: getTrainingVoiceContractV21(exerciseId),
    sessionMemory,
  });
}

export function rememberTrainingVoiceSafetyFamilyV21(
  memory: TrainingVoiceSessionMemoryV21,
  family: TrainingVoiceSafetyFamilyV21
): TrainingVoiceSessionMemoryV21 {
  if (family === 'none' || memory.introducedSafetyFamilies.includes(family)) return memory;
  return {
    ...memory,
    introducedSafetyFamilies: [...memory.introducedSafetyFamilies, family],
  };
}

export function rememberTrainingVoiceFirstUseV21(
  memory: TrainingVoiceSessionMemoryV21,
  exerciseId: string
): TrainingVoiceSessionMemoryV21 {
  if (memory.firstUseExerciseIds.includes(exerciseId)) return memory;
  return {
    ...memory,
    firstUseExerciseIds: [...memory.firstUseExerciseIds, exerciseId],
  };
}

function mostSpecificFamilyFor(
  contract: Pick<TrainingVoiceExerciseContractV21, 'equipment' | 'safetyPlan'>
): TrainingVoiceSafetyFamilyV21 {
  if (contract.safetyPlan.family === 'none') return 'none';
  if (contract.equipment.includes('floor')) return 'floor_eligible_user';
  if (contract.equipment.includes('stair')) return 'step_or_stair';
  if (contract.equipment.includes('door_anchor')) return 'door_anchor_band';
  if (contract.equipment.includes('mini_band')) return 'mini_band_above_knees';
  if (contract.equipment.includes('long_band')) return 'long_band_handheld_or_foot_anchored';
  if (contract.safetyPlan.family === 'balance_support') return 'balance_support';
  if (contract.safetyPlan.family === 'chair_seat') return 'chair_seat';
  if (contract.safetyPlan.family === 'generic_support') return 'generic_support';
  return contract.safetyPlan.family;
}

function result(
  dueFamily: TrainingVoiceSafetyFamilyV21,
  absorbedIntoInstruction: boolean,
  logicalCueKey: string | null,
  exactScript: string | null,
  reasonCodes: readonly string[]
): ResolvedTrainingVoiceSafetyV21 {
  return {
    dueFamily,
    absorbedIntoInstruction,
    logicalCueKey,
    exactScript,
    reasonCodes,
  };
}
