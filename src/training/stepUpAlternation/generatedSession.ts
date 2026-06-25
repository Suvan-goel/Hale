import { pinBothSidesInitialStartSide } from '../bothSidesRounds';
import { deriveStepUpAlternationPlan } from './plan';
import { selectTrainingStepUpAlternationMode } from './readiness';
import {
  STEP_UP_EXERCISE_ID,
  type StepUpAlternationPlan,
  type StepUpLeadSide,
} from './types';

export interface StepUpGeneratedExerciseLike {
  readonly exerciseId: string;
  readonly sets: number;
  readonly repsPerSet?: number;
  readonly stepUpAlternationPlan?: StepUpAlternationPlan;
  readonly stepUpInitialLeadSide?: StepUpLeadSide;
}

export interface StepUpGeneratedSessionLike<TExercise extends StepUpGeneratedExerciseLike> {
  readonly exercises: readonly TExercise[];
}

export function deriveStepUpAlternationPlanForGeneratedExercise(
  exercise: StepUpGeneratedExerciseLike,
  initialLeadSide: StepUpLeadSide
): StepUpAlternationPlan | null {
  if (exercise.exerciseId !== STEP_UP_EXERCISE_ID) return null;
  return deriveStepUpAlternationPlan({
    exerciseId: exercise.exerciseId,
    setCount: exercise.sets,
    targetTotalReps: exercise.repsPerSet ?? 0,
    initialLeadSide,
  });
}

export function attachStepUpAlternationPlansToGeneratedSession<
  TExercise extends StepUpGeneratedExerciseLike,
  TSession extends StepUpGeneratedSessionLike<TExercise>,
>(input: {
  readonly session: TSession;
  readonly seedState?: Parameters<typeof pinBothSidesInitialStartSide>[0]['state'];
  readonly featureEnabled?: boolean;
  readonly internalV21RuntimeReady?: boolean;
}): TSession {
  const draftExercises = input.session.exercises.map((exercise) => {
    const initialLeadSide = pinBothSidesInitialStartSide({
      state: input.seedState,
      exerciseId: exercise.exerciseId,
    });
    const plan = deriveStepUpAlternationPlanForGeneratedExercise(exercise, initialLeadSide);
    return plan
      ? ({ ...exercise, stepUpAlternationPlan: plan, stepUpInitialLeadSide: initialLeadSide } as TExercise)
      : exercise;
  });
  const plans = draftExercises
    .map((exercise) => exercise.stepUpAlternationPlan)
    .filter((plan): plan is StepUpAlternationPlan => !!plan);
  const selection = selectTrainingStepUpAlternationMode({
    featureEnabled: input.featureEnabled,
    internalV21RuntimeReady: input.internalV21RuntimeReady,
    plans,
  });
  if (!selection.selectable) return input.session;
  return { ...input.session, exercises: draftExercises } as TSession;
}
