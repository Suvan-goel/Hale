import { getExercise, type ExerciseDefinition } from '../../exercises';
import { oppositeSide } from '../bothSidesRounds';
import {
  STEP_UP_ALTERNATION_PLAN_VERSION,
  STEP_UP_EXERCISE_ID,
  type StepUpAlternationPlan,
  type StepUpAlternationReasonCode,
  type StepUpLeadSide,
} from './types';

export interface DeriveStepUpAlternationPlanInput {
  readonly exerciseId: string;
  readonly setCount: number;
  readonly targetTotalReps: number;
  readonly initialLeadSide: StepUpLeadSide | null | undefined;
}

export function deriveStepUpAlternationPlan(
  input: DeriveStepUpAlternationPlanInput
): StepUpAlternationPlan {
  const base = {
    version: STEP_UP_ALTERNATION_PLAN_VERSION,
    exerciseId: STEP_UP_EXERCISE_ID,
    targetTotalReps: Number.isFinite(input.targetTotalReps) ? input.targetTotalReps : 0,
    targetLeftLeadReps: 0,
    targetRightLeadReps: 0,
    setCount: Number.isFinite(input.setCount) ? input.setCount : 0,
    initialLeadSide: input.initialLeadSide ?? 'left',
    setStartLeadSides: [] as readonly StepUpLeadSide[],
    sourceSetCount: Number.isFinite(input.setCount) ? input.setCount : 0,
    sourceTargetRepsPerSet: Number.isFinite(input.targetTotalReps) ? input.targetTotalReps : 0,
    sourcePrescriptionFingerprint: sourceFingerprint(input.exerciseId, input.setCount, input.targetTotalReps),
    planFingerprint: '',
  } satisfies Omit<StepUpAlternationPlan, 'runtimeSelectable' | 'blockerReasonCodes'>;

  const blockers: StepUpAlternationReasonCode[] = [];
  if (input.exerciseId !== STEP_UP_EXERCISE_ID) blockers.push('UNSUPPORTED_STEP_UP_EXERCISE');
  if (input.initialLeadSide !== 'left' && input.initialLeadSide !== 'right') blockers.push('MISSING_INITIAL_LEAD');
  if (!Number.isInteger(input.targetTotalReps)) blockers.push('NON_INTEGER_STEP_UP_TARGET');
  if (Number.isInteger(input.targetTotalReps) && input.targetTotalReps <= 0) blockers.push('NON_POSITIVE_STEP_UP_TARGET');
  if (Number.isInteger(input.targetTotalReps) && input.targetTotalReps > 0 && input.targetTotalReps % 2 !== 0) {
    blockers.push('ODD_STEP_UP_TARGET');
  }
  if (!Number.isInteger(input.setCount) || input.setCount <= 0) blockers.push('SOURCE_PRESCRIPTION_MISMATCH');

  const runtimeSelectable = blockers.length === 0;
  const targetPerLead = runtimeSelectable ? input.targetTotalReps / 2 : 0;
  const setStartLeadSides = runtimeSelectable
    ? Array.from({ length: input.setCount }, (_unused, index) =>
        index % 2 === 0 ? input.initialLeadSide as StepUpLeadSide : oppositeSide(input.initialLeadSide as StepUpLeadSide)
      )
    : [];
  const plan: StepUpAlternationPlan = {
    ...base,
    targetLeftLeadReps: targetPerLead,
    targetRightLeadReps: targetPerLead,
    setStartLeadSides,
    runtimeSelectable,
    blockerReasonCodes: runtimeSelectable ? ['STEP_UP_ALTERNATION_READY'] : unique(blockers),
    planFingerprint: '',
  };
  return Object.freeze({ ...plan, planFingerprint: planFingerprint(plan) });
}

export function deriveStepUpAlternationPlanForExerciseDefinition(
  def: ExerciseDefinition,
  initialLeadSide: StepUpLeadSide
): StepUpAlternationPlan {
  return deriveStepUpAlternationPlan({
    exerciseId: def.id,
    setCount: def.prescription.sets,
    targetTotalReps: def.prescription.repsPerSet ?? 0,
    initialLeadSide,
  });
}

export function deriveStepUpAlternationPlanForExerciseId(
  initialLeadSide: StepUpLeadSide
): StepUpAlternationPlan {
  return deriveStepUpAlternationPlanForExerciseDefinition(getExercise(STEP_UP_EXERCISE_ID), initialLeadSide);
}

export function setStartLeadForIndex(
  plan: StepUpAlternationPlan,
  setIndex: number
): StepUpLeadSide {
  return plan.setStartLeadSides[setIndex] ?? plan.initialLeadSide;
}

export function planFingerprint(plan: StepUpAlternationPlan): string {
  const { planFingerprint: _ignored, ...stable } = plan;
  return `sua${STEP_UP_ALTERNATION_PLAN_VERSION}_${fnv1a(canonicalJson(stable)).toString(16)}`;
}

function sourceFingerprint(exerciseId: string, setCount: number, targetTotalReps: number): string {
  return `step-up-source_${fnv1a(`${exerciseId}:${setCount}:${targetTotalReps}`).toString(16)}`;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
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

function unique<T extends string>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
