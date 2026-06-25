import type { ExerciseKind } from '../../exercises';
import { bothSidesRoundSpecForExercise } from './exerciseRoles';
import { deriveBothSidesDosePlan } from './dosePlanner';
import {
  pinBothSidesInitialStartSide,
} from './startSide';
import { selectTrainingBothSidesRoundsMode } from './readiness';
import type {
  BothSidesDosePlan,
  BothSidesDoseUnit,
  BothSidesStartSideSeedState,
  TrainingRoundSide,
} from './types';

export interface BothSidesGeneratedExerciseLike {
  readonly exerciseId: string;
  readonly kind: ExerciseKind;
  readonly sets: number;
  readonly repsPerSet?: number;
  readonly secondsPerSet?: number;
  readonly bothSidesDosePlan?: BothSidesDosePlan;
  readonly bothSidesInitialStartSide?: TrainingRoundSide;
}

export interface BothSidesGeneratedSessionLike<TExercise extends BothSidesGeneratedExerciseLike> {
  readonly exercises: readonly TExercise[];
}

export function deriveBothSidesDosePlanForGeneratedExercise(
  exercise: BothSidesGeneratedExerciseLike,
  initialStartSide: TrainingRoundSide
): BothSidesDosePlan | null {
  const spec = bothSidesRoundSpecForExercise(exercise.exerciseId);
  if (!spec) return null;
  const target = targetFromGeneratedExercise(exercise, spec.doseUnit);
  if (!target) {
    return deriveBothSidesDosePlan({
      exerciseId: exercise.exerciseId,
      prescribedSetCount: exercise.sets,
      prescribedTarget: 0,
      targetUnit: spec.doseUnit,
      initialStartSide,
    });
  }
  return deriveBothSidesDosePlan({
    exerciseId: exercise.exerciseId,
    prescribedSetCount: exercise.sets,
    prescribedTarget: target.value,
    targetUnit: target.unit,
    initialStartSide,
  });
}

export function attachBothSidesDosePlansToGeneratedSession<
  TExercise extends BothSidesGeneratedExerciseLike,
  TSession extends BothSidesGeneratedSessionLike<TExercise>,
>(input: {
  readonly session: TSession;
  readonly seedState?: Partial<BothSidesStartSideSeedState> | null;
  readonly featureEnabled?: boolean;
  readonly internalV21RuntimeReady?: boolean;
}): TSession {
  const draftExercises = input.session.exercises.map((exercise) => {
    const initialStartSide = pinBothSidesInitialStartSide({
      state: input.seedState,
      exerciseId: exercise.exerciseId,
    });
    const plan = deriveBothSidesDosePlanForGeneratedExercise(exercise, initialStartSide);
    return plan
      ? ({ ...exercise, bothSidesDosePlan: plan, bothSidesInitialStartSide: initialStartSide } as TExercise)
      : exercise;
  });
  const plans = draftExercises
    .map((exercise) => exercise.bothSidesDosePlan)
    .filter((plan): plan is BothSidesDosePlan => !!plan);
  const selection = selectTrainingBothSidesRoundsMode({
    featureEnabled: input.featureEnabled,
    internalV21RuntimeReady: input.internalV21RuntimeReady,
    plans,
  });
  if (!selection.selectable) return input.session;
  return { ...input.session, exercises: draftExercises } as TSession;
}

function targetFromGeneratedExercise(
  exercise: BothSidesGeneratedExerciseLike,
  expectedUnit: BothSidesDoseUnit
): { readonly value: number; readonly unit: BothSidesDoseUnit } | null {
  if (expectedUnit === 'reps') {
    return typeof exercise.repsPerSet === 'number'
      ? { value: exercise.repsPerSet, unit: 'reps' }
      : null;
  }
  if (typeof exercise.secondsPerSet !== 'number') return null;
  return { value: exercise.secondsPerSet * 1000, unit: expectedUnit };
}
