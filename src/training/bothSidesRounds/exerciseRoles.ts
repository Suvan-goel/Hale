import type {
  BothSidesDoseUnit,
  TrainingBothSidesAffectedExerciseId,
  TrainingRoundSide,
  TrainingRoundSideRole,
} from './types';
import {
  TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS,
} from './types';

export interface BothSidesExerciseRoundSpec {
  readonly exerciseId: TrainingBothSidesAffectedExerciseId;
  readonly sideRole: TrainingRoundSideRole;
  readonly doseUnit: BothSidesDoseUnit;
  readonly minimumValidSideTarget: number | null;
  readonly minimumSource: string | null;
  readonly sideLabel: Readonly<Record<TrainingRoundSide, string>>;
  readonly voiceVariantBySide: Readonly<Record<TrainingRoundSide, string>>;
  readonly voiceTargetStrategy: 'exact_integer' | 'truthful_nonnumeric_fractional' | 'rom_until_switch';
}

const BOTH_SIDES_EXERCISE_SPECS: Readonly<Record<TrainingBothSidesAffectedExerciseId, BothSidesExerciseRoundSpec>> = {
  'balance-single-leg-hold': {
    exerciseId: 'balance-single-leg-hold',
    sideRole: 'standing_leg',
    doseUnit: 'hold_ms',
    minimumValidSideTarget: null,
    minimumSource: null,
    sideLabel: { left: 'Left leg', right: 'Right leg' },
    voiceVariantBySide: { left: 'left', right: 'right' },
    voiceTargetStrategy: 'truthful_nonnumeric_fractional',
  },
  'balance-tandem-hold': {
    exerciseId: 'balance-tandem-hold',
    sideRole: 'lead_foot',
    doseUnit: 'hold_ms',
    minimumValidSideTarget: null,
    minimumSource: null,
    sideLabel: { left: 'Left foot in front', right: 'Right foot in front' },
    voiceVariantBySide: { left: 'left_front', right: 'right_front' },
    voiceTargetStrategy: 'exact_integer',
  },
  'chair-supported-split-squat': {
    exerciseId: 'chair-supported-split-squat',
    sideRole: 'front_leg',
    doseUnit: 'reps',
    minimumValidSideTarget: null,
    minimumSource: null,
    sideLabel: { left: 'Left leg forward', right: 'Right leg forward' },
    voiceVariantBySide: { left: 'left_forward', right: 'right_forward' },
    voiceTargetStrategy: 'exact_integer',
  },
  'seated-hamstring-reach': {
    exerciseId: 'seated-hamstring-reach',
    sideRole: 'extended_leg',
    doseUnit: 'rom_window_ms',
    minimumValidSideTarget: null,
    minimumSource: null,
    sideLabel: { left: 'Left leg extended', right: 'Right leg extended' },
    voiceVariantBySide: { left: 'left_extended', right: 'right_extended' },
    voiceTargetStrategy: 'rom_until_switch',
  },
  'supported-hip-flexor-stretch': {
    exerciseId: 'supported-hip-flexor-stretch',
    sideRole: 'stretched_hip_side',
    doseUnit: 'timer_ms',
    minimumValidSideTarget: null,
    minimumSource: null,
    sideLabel: { left: 'Left hip side', right: 'Right hip side' },
    voiceVariantBySide: { left: 'left_back', right: 'right_back' },
    voiceTargetStrategy: 'exact_integer',
  },
  'wall-calf-stretch': {
    exerciseId: 'wall-calf-stretch',
    sideRole: 'stretched_calf_side',
    doseUnit: 'timer_ms',
    minimumValidSideTarget: null,
    minimumSource: null,
    sideLabel: { left: 'Left calf', right: 'Right calf' },
    voiceVariantBySide: { left: 'left_back', right: 'right_back' },
    voiceTargetStrategy: 'exact_integer',
  },
};

export function isTrainingBothSidesAffectedExerciseId(
  exerciseId: string
): exerciseId is TrainingBothSidesAffectedExerciseId {
  return (TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS as readonly string[]).includes(exerciseId);
}

export function bothSidesRoundSpecForExercise(
  exerciseId: string
): BothSidesExerciseRoundSpec | null {
  return isTrainingBothSidesAffectedExerciseId(exerciseId)
    ? BOTH_SIDES_EXERCISE_SPECS[exerciseId]
    : null;
}

export function listBothSidesRoundSpecs(): BothSidesExerciseRoundSpec[] {
  return TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS.map((exerciseId) => BOTH_SIDES_EXERCISE_SPECS[exerciseId]);
}

export function semanticSideRoleForExercise(
  exerciseId: string
): TrainingRoundSideRole | null {
  return bothSidesRoundSpecForExercise(exerciseId)?.sideRole ?? null;
}

export function sideLabelForExercise(
  exerciseId: string,
  side: TrainingRoundSide
): string {
  return bothSidesRoundSpecForExercise(exerciseId)?.sideLabel[side] ?? `${side} side`;
}

export function voiceSideVariantForExercise(
  exerciseId: string,
  side: TrainingRoundSide
): string | null {
  return bothSidesRoundSpecForExercise(exerciseId)?.voiceVariantBySide[side] ?? null;
}
