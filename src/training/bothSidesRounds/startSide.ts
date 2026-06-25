import { isTrainingBothSidesAffectedExerciseId } from './exerciseRoles';
import { oppositeSide } from './dosePlanner';
import type {
  BothSidesStartSideSeedState,
  TrainingInitialSideExerciseId,
  TrainingRoundSide,
} from './types';

export function isTrainingInitialSideExerciseId(
  exerciseId: string
): exerciseId is TrainingInitialSideExerciseId {
  return isTrainingBothSidesAffectedExerciseId(exerciseId) || exerciseId === 'step-up';
}

export const EMPTY_BOTH_SIDES_START_SIDE_SEED_STATE: BothSidesStartSideSeedState = Object.freeze({
  nextBothSidesStartSideByExercise: {},
  appliedBothSidesStartSideFlipEventIds: [],
});

export function nextBothSidesStartSideForExercise(
  state: Partial<BothSidesStartSideSeedState> | null | undefined,
  exerciseId: string
): TrainingRoundSide {
  if (!isTrainingInitialSideExerciseId(exerciseId)) return 'left';
  return state?.nextBothSidesStartSideByExercise?.[exerciseId] ?? 'left';
}

export function pinBothSidesInitialStartSide(input: {
  readonly state?: Partial<BothSidesStartSideSeedState> | null;
  readonly exerciseId: string;
  readonly requestedStartSide?: TrainingRoundSide | null;
}): TrainingRoundSide {
  return input.requestedStartSide ?? nextBothSidesStartSideForExercise(input.state, input.exerciseId);
}

export function applyBothSidesExerciseCompletionToStartSideSeed(
  state: Partial<BothSidesStartSideSeedState> | null | undefined,
  input: {
    readonly exerciseId: string;
    readonly completed: boolean;
    readonly countsTowardMainPlan: boolean;
    readonly eventId: string;
  }
): BothSidesStartSideSeedState {
  const normalized = normalizeBothSidesStartSideSeedState(state);
  if (
    !isTrainingInitialSideExerciseId(input.exerciseId) ||
    !input.completed ||
    !input.countsTowardMainPlan ||
    normalized.appliedBothSidesStartSideFlipEventIds.includes(input.eventId)
  ) {
    return normalized;
  }
  const current = nextBothSidesStartSideForExercise(normalized, input.exerciseId);
  return Object.freeze({
    nextBothSidesStartSideByExercise: {
      ...normalized.nextBothSidesStartSideByExercise,
      [input.exerciseId]: oppositeSide(current),
    },
    appliedBothSidesStartSideFlipEventIds: [
      ...normalized.appliedBothSidesStartSideFlipEventIds,
      input.eventId,
    ].slice(-200),
  });
}

export function normalizeBothSidesStartSideSeedState(
  state: Partial<BothSidesStartSideSeedState> | null | undefined
): BothSidesStartSideSeedState {
  const next: Partial<Record<TrainingInitialSideExerciseId, TrainingRoundSide>> = {};
  const source = state?.nextBothSidesStartSideByExercise ?? {};
  for (const [exerciseId, side] of Object.entries(source)) {
    if (isTrainingInitialSideExerciseId(exerciseId) && (side === 'left' || side === 'right')) {
      next[exerciseId] = side;
    }
  }
  return Object.freeze({
    nextBothSidesStartSideByExercise: next,
    appliedBothSidesStartSideFlipEventIds: Array.isArray(state?.appliedBothSidesStartSideFlipEventIds)
      ? state.appliedBothSidesStartSideFlipEventIds.filter((item): item is string => typeof item === 'string')
      : [],
  });
}
