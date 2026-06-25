import { getExercise, type ExerciseDefinition } from '../../exercises';
import {
  bothSidesRoundSpecForExercise,
  isTrainingBothSidesAffectedExerciseId,
} from './exerciseRoles';
import {
  TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION,
  type BothSidesDosePlan,
  type BothSidesDosePlanReasonCode,
  type BothSidesDoseUnit,
  type BothSidesRoundDescriptor,
  type BothSidesRoundSideTarget,
  type TrainingRoundSide,
  type TrainingRoundSideRole,
} from './types';

const TIME_PRECISION_MS = 250;

export interface DeriveBothSidesDosePlanInput {
  readonly exerciseId: string;
  readonly prescribedSetCount: number;
  readonly prescribedTarget: number;
  readonly targetUnit: BothSidesDoseUnit;
  readonly initialStartSide: TrainingRoundSide;
  readonly sideRole?: TrainingRoundSideRole | null;
  readonly minimumValidSideTarget?: number | null;
  readonly minimumSource?: string | null;
}

export function deriveBothSidesDosePlan(
  input: DeriveBothSidesDosePlanInput
): BothSidesDosePlan {
  const spec = bothSidesRoundSpecForExercise(input.exerciseId);
  const sideRole = input.sideRole ?? spec?.sideRole ?? null;
  const minimumValidSideTarget =
    input.minimumValidSideTarget ?? spec?.minimumValidSideTarget ?? null;
  const minimumSource = input.minimumSource ?? spec?.minimumSource ?? null;

  if (!sideRole || !isTrainingBothSidesAffectedExerciseId(input.exerciseId)) {
    return unrepresentablePlan(input, sideRole ?? 'standing_leg', minimumValidSideTarget, minimumSource, [
      'UNKNOWN_EXERCISE',
      'DOSE_PLAN_UNREPRESENTABLE',
    ]);
  }

  if (!isPositiveInteger(input.prescribedSetCount) || input.prescribedTarget <= 0) {
    return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
      'MALFORMED_SOURCE_PRESCRIPTION',
      'DOSE_PLAN_UNREPRESENTABLE',
    ]);
  }

  if (input.targetUnit === 'reps') {
    return deriveRepPlan(input, sideRole, minimumValidSideTarget, minimumSource);
  }
  if (
    input.targetUnit === 'hold_ms' ||
    input.targetUnit === 'timer_ms' ||
    input.targetUnit === 'rom_window_ms'
  ) {
    return deriveTimePlan(input, sideRole, minimumValidSideTarget, minimumSource);
  }

  return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
    'UNSUPPORTED_UNIT',
    'DOSE_PLAN_UNREPRESENTABLE',
  ]);
}

export function deriveBothSidesDosePlanForExerciseDefinition(
  def: ExerciseDefinition,
  initialStartSide: TrainingRoundSide
): BothSidesDosePlan {
  const target = sourceTargetForDefinition(def);
  return deriveBothSidesDosePlan({
    exerciseId: def.id,
    prescribedSetCount: def.prescription.sets,
    prescribedTarget: target.value,
    targetUnit: target.unit,
    initialStartSide,
  });
}

export function deriveBothSidesDosePlanForExerciseId(
  exerciseId: string,
  initialStartSide: TrainingRoundSide
): BothSidesDosePlan {
  return deriveBothSidesDosePlanForExerciseDefinition(getExercise(exerciseId), initialStartSide);
}

export function sourceTargetForDefinition(
  def: Pick<ExerciseDefinition, 'kind' | 'prescription'>
): { readonly value: number; readonly unit: BothSidesDoseUnit } {
  if (def.kind === 'reps') {
    return { value: def.prescription.repsPerSet ?? 0, unit: 'reps' };
  }
  if (def.kind === 'hold') {
    return { value: (def.prescription.holdSec ?? 0) * 1000, unit: 'hold_ms' };
  }
  if (def.kind === 'timer') {
    return { value: (def.prescription.timerSec ?? 0) * 1000, unit: 'timer_ms' };
  }
  return { value: (def.prescription.captureSec ?? 0) * 1000, unit: 'rom_window_ms' };
}

function deriveTimePlan(
  input: DeriveBothSidesDosePlanInput,
  sideRole: TrainingRoundSideRole,
  minimumValidSideTarget: number | null,
  minimumSource: string | null
): BothSidesDosePlan {
  if (!Number.isInteger(input.prescribedTarget)) {
    return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
      'TIME_PRECISION_UNSUPPORTED',
      'DOSE_PLAN_UNREPRESENTABLE',
    ]);
  }
  const sourceTotalDose = input.prescribedSetCount * input.prescribedTarget;
  for (let roundCount = input.prescribedSetCount; roundCount >= 1; roundCount--) {
    const denominator = roundCount * 2;
    if (sourceTotalDose % denominator !== 0) continue;
    const sideTarget = sourceTotalDose / denominator;
    if (sideTarget % TIME_PRECISION_MS !== 0) continue;
    if (minimumValidSideTarget !== null && sideTarget < minimumValidSideTarget) continue;
    return selectablePlan({
      input,
      sideRole,
      sourceTotalDose,
      roundCount,
      leftTargets: Array(roundCount).fill(sideTarget),
      rightTargets: Array(roundCount).fill(sideTarget),
      minimumValidSideTarget,
      minimumSource,
      conversionReason:
        roundCount === input.prescribedSetCount
          ? 'direct_half_set'
          : 'round_count_reduced_for_minimum',
      blockerReasonCodes:
        roundCount === input.prescribedSetCount
          ? ['DIRECT_HALF_SET']
          : ['MINIMUM_SIDE_TARGET', 'ROUND_COUNT_REDUCED'],
    });
  }
  return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
    'TIME_PRECISION_UNSUPPORTED',
    'DOSE_PLAN_UNREPRESENTABLE',
  ]);
}

function deriveRepPlan(
  input: DeriveBothSidesDosePlanInput,
  sideRole: TrainingRoundSideRole,
  minimumValidSideTarget: number | null,
  minimumSource: string | null
): BothSidesDosePlan {
  if (!Number.isInteger(input.prescribedTarget)) {
    return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
      'NON_INTEGER_REP_TARGET',
      'DOSE_PLAN_UNREPRESENTABLE',
    ]);
  }
  const sourceTotalDose = input.prescribedSetCount * input.prescribedTarget;
  if (sourceTotalDose % 2 !== 0) {
    return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
      'ODD_TOTAL_REPS',
      'DOSE_PLAN_UNREPRESENTABLE',
    ]);
  }

  for (let roundCount = input.prescribedSetCount; roundCount >= 1; roundCount--) {
    const sideSessionTotal = sourceTotalDose / 2;
    const min = minimumValidSideTarget ?? 1;
    if (sideSessionTotal < roundCount * min) continue;
    const leftTargets = distributeWholeDose(sideSessionTotal, roundCount, min, input.initialStartSide === 'left');
    const rightTargets = distributeWholeDose(sideSessionTotal, roundCount, min, input.initialStartSide === 'right');
    if (!leftTargets || !rightTargets) continue;
    return selectablePlan({
      input,
      sideRole,
      sourceTotalDose,
      roundCount,
      leftTargets,
      rightTargets,
      minimumValidSideTarget,
      minimumSource,
      conversionReason:
        roundCount === input.prescribedSetCount && input.prescribedTarget % 2 === 0
          ? 'direct_half_set'
          : roundCount === input.prescribedSetCount
            ? 'direct_half_set'
            : 'round_count_reduced_for_minimum',
      blockerReasonCodes:
        roundCount === input.prescribedSetCount
          ? ['DIRECT_HALF_SET']
          : ['MINIMUM_SIDE_TARGET', 'ROUND_COUNT_REDUCED'],
    });
  }

  return unrepresentablePlan(input, sideRole, minimumValidSideTarget, minimumSource, [
    'NON_INTEGER_REP_TARGET',
    'DOSE_PLAN_UNREPRESENTABLE',
  ]);
}

function selectablePlan(input: {
  readonly input: DeriveBothSidesDosePlanInput;
  readonly sideRole: TrainingRoundSideRole;
  readonly sourceTotalDose: number;
  readonly roundCount: number;
  readonly leftTargets: readonly number[];
  readonly rightTargets: readonly number[];
  readonly minimumValidSideTarget: number | null;
  readonly minimumSource: string | null;
  readonly conversionReason: BothSidesDosePlan['conversionReason'];
  readonly blockerReasonCodes: readonly BothSidesDosePlanReasonCode[];
}): BothSidesDosePlan {
  const rounds = buildRounds(
    input.input.exerciseId,
    input.input.targetUnit,
    input.input.initialStartSide,
    input.leftTargets,
    input.rightTargets
  );
  const totalLeftDose = sum(input.leftTargets);
  const totalRightDose = sum(input.rightTargets);
  const convertedTotalDose = totalLeftDose + totalRightDose;
  const exactDosePreserved = convertedTotalDose === input.sourceTotalDose;
  const equalSideDose = totalLeftDose === totalRightDose;
  const blockerReasonCodes = [
    ...input.blockerReasonCodes,
    ...(exactDosePreserved ? [] : (['TOTAL_DOSE_MISMATCH'] as const)),
    ...(equalSideDose ? [] : (['SIDE_DOSE_MISMATCH'] as const)),
  ];
  return finalizePlan({
    version: TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION,
    exerciseId: input.input.exerciseId,
    sideRole: input.sideRole,
    planFingerprint: '',
    initialStartSide: input.input.initialStartSide,
    sourceSetCount: input.input.prescribedSetCount,
    sourceTargetPerSet: input.input.prescribedTarget,
    sourceUnit: input.input.targetUnit,
    sourceTotalDose: input.sourceTotalDose,
    roundCount: input.roundCount,
    rounds,
    totalLeftDose,
    totalRightDose,
    convertedTotalDose,
    minimumValidSideTarget: input.minimumValidSideTarget,
    minimumSource: input.minimumSource,
    conversionReason: input.conversionReason,
    exactDosePreserved,
    equalSideDose,
    runtimeSelectable: exactDosePreserved && equalSideDose,
    blockerReasonCodes,
  });
}

function unrepresentablePlan(
  input: DeriveBothSidesDosePlanInput,
  sideRole: TrainingRoundSideRole,
  minimumValidSideTarget: number | null,
  minimumSource: string | null,
  blockerReasonCodes: readonly BothSidesDosePlanReasonCode[]
): BothSidesDosePlan {
  const sourceTotalDose =
    Number.isFinite(input.prescribedSetCount) && Number.isFinite(input.prescribedTarget)
      ? Math.max(0, input.prescribedSetCount) * Math.max(0, input.prescribedTarget)
      : 0;
  return finalizePlan({
    version: TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION,
    exerciseId: input.exerciseId,
    sideRole,
    planFingerprint: '',
    initialStartSide: input.initialStartSide,
    sourceSetCount: Number.isFinite(input.prescribedSetCount) ? input.prescribedSetCount : 0,
    sourceTargetPerSet: Number.isFinite(input.prescribedTarget) ? input.prescribedTarget : 0,
    sourceUnit: input.targetUnit,
    sourceTotalDose,
    roundCount: 0,
    rounds: [],
    totalLeftDose: 0,
    totalRightDose: 0,
    convertedTotalDose: 0,
    minimumValidSideTarget,
    minimumSource,
    conversionReason: 'unrepresentable',
    exactDosePreserved: false,
    equalSideDose: false,
    runtimeSelectable: false,
    blockerReasonCodes: unique(blockerReasonCodes),
  });
}

function buildRounds(
  exerciseId: string,
  unit: BothSidesDoseUnit,
  initialStartSide: TrainingRoundSide,
  leftTargets: readonly number[],
  rightTargets: readonly number[]
): BothSidesRoundDescriptor[] {
  const roundCount = Math.min(leftTargets.length, rightTargets.length);
  const rounds: BothSidesRoundDescriptor[] = [];
  for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
    const startSide = roundIndex % 2 === 0 ? initialStartSide : oppositeSide(initialStartSide);
    const sideOrder = [startSide, oppositeSide(startSide)] as const;
    const left = sideTarget('left', unit, leftTargets[roundIndex] ?? 0);
    const right = sideTarget('right', unit, rightTargets[roundIndex] ?? 0);
    rounds.push(Object.freeze({
      roundIndex,
      startSide,
      sideOrder,
      targets: Object.freeze({ left, right }),
    }));
  }
  if (rounds.length === 0 && exerciseId.length === 0) return [];
  return rounds;
}

function sideTarget(
  side: TrainingRoundSide,
  unit: BothSidesDoseUnit,
  targetDose: number
): BothSidesRoundSideTarget {
  if (unit === 'reps') {
    return Object.freeze({ side, targetDose, targetReps: targetDose });
  }
  return Object.freeze({ side, targetDose, targetMs: targetDose });
}

function distributeWholeDose(
  sideTotal: number,
  roundCount: number,
  minimumPerRound: number,
  frontLoadRemainder: boolean
): number[] | null {
  if (!isPositiveInteger(sideTotal) || !isPositiveInteger(roundCount)) return null;
  if (sideTotal < roundCount * minimumPerRound) return null;
  const base = Math.floor(sideTotal / roundCount);
  const remainder = sideTotal % roundCount;
  if (base < minimumPerRound) return null;
  const targets = Array(roundCount).fill(base) as number[];
  for (let i = 0; i < remainder; i++) {
    const index = frontLoadRemainder ? i : roundCount - 1 - i;
    targets[index] += 1;
  }
  return targets;
}

function finalizePlan(plan: BothSidesDosePlan): BothSidesDosePlan {
  const fingerprint = planFingerprint(plan);
  return Object.freeze({
    ...plan,
    planFingerprint: fingerprint,
    blockerReasonCodes: unique(plan.blockerReasonCodes),
    rounds: plan.rounds.map((round) => Object.freeze(round)),
  });
}

export function oppositeSide(side: TrainingRoundSide): TrainingRoundSide {
  return side === 'left' ? 'right' : 'left';
}

export function targetForRoundSide(
  plan: BothSidesDosePlan,
  roundIndex: number,
  side: TrainingRoundSide
): BothSidesRoundSideTarget | null {
  return plan.rounds[roundIndex]?.targets[side] ?? null;
}

export function planFingerprint(plan: BothSidesDosePlan): string {
  const { planFingerprint: _ignored, ...stablePlan } = plan;
  return `bsr${TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION}_${fnv1a(canonicalJson(stablePlan)).toString(16)}`;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

function unique<T extends string>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
