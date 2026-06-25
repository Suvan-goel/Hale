import type { SetResult } from '../../exercises';
import type {
  BothSidesDosePlan,
  BothSidesProgressionSummary,
  TrainingRoundResult,
  TrainingRoundSide,
  TrainingSideSegmentEndReason,
  TrainingSideSegmentResult,
} from './types';

export interface CreateTrainingSideSegmentResultInput {
  readonly plan: BothSidesDosePlan;
  readonly roundIndex: number;
  readonly side: TrainingRoundSide;
  readonly completedDose?: number;
  readonly completedReps?: number;
  readonly validTimeMs?: number;
  readonly endReason?: TrainingSideSegmentEndReason;
  readonly attemptId: string;
}

export function createTrainingSideSegmentResult(
  input: CreateTrainingSideSegmentResultInput
): TrainingSideSegmentResult {
  const target = input.plan.rounds[input.roundIndex]?.targets[input.side];
  const targetDose = target?.targetDose ?? 0;
  const completedDose =
    input.completedDose ??
    input.completedReps ??
    input.validTimeMs ??
    0;
  const completedTarget = completedDose >= targetDose && targetDose > 0;
  return Object.freeze({
    side: input.side,
    sideRole: input.plan.sideRole,
    targetDose,
    completedDose,
    targetReps: target?.targetReps,
    completedReps: input.completedReps,
    targetMs: target?.targetMs,
    validTimeMs: input.validTimeMs,
    completedTarget,
    valid: completedTarget || input.endReason === 'autoregulated',
    endReason: input.endReason ?? (completedTarget ? 'target_completed' : 'invalid'),
    attemptId: input.attemptId,
  });
}

export function aggregateTrainingRoundResult(input: {
  readonly plan: BothSidesDosePlan;
  readonly roundIndex: number;
  readonly left: TrainingSideSegmentResult;
  readonly right: TrainingSideSegmentResult;
}): TrainingRoundResult {
  const round = input.plan.rounds[input.roundIndex];
  if (!round) throw new Error(`missing both-sides round ${input.roundIndex}`);
  const leftTarget = round.targets.left.targetDose;
  const rightTarget = round.targets.right.targetDose;
  const totalTargetDose = leftTarget + rightTarget;
  const totalCompletedDose = input.left.completedDose + input.right.completedDose;
  const leftCompletionRatio = ratio(input.left.completedDose, leftTarget);
  const rightCompletionRatio = ratio(input.right.completedDose, rightTarget);
  const completedBothSides =
    input.left.valid &&
    input.right.valid &&
    input.left.completedTarget &&
    input.right.completedTarget;
  return Object.freeze({
    roundIndex: input.roundIndex,
    startSide: round.startSide,
    sideOrder: round.sideOrder,
    left: input.left,
    right: input.right,
    completedBothSides,
    totalCompletedDose,
    totalTargetDose,
    leftCompletionRatio,
    rightCompletionRatio,
    conservativeCompletionRatio: Math.min(leftCompletionRatio, rightCompletionRatio),
  });
}

export function summarizeBothSidesProgression(
  plan: BothSidesDosePlan,
  roundResults: readonly TrainingRoundResult[]
): BothSidesProgressionSummary {
  const leftTotalCompletedDose = sum(roundResults.map((round) => round.left.completedDose));
  const rightTotalCompletedDose = sum(roundResults.map((round) => round.right.completedDose));
  const totalCompletedDose = sum(roundResults.map((round) => round.totalCompletedDose));
  const totalTargetDose = plan.convertedTotalDose;
  const completedRoundCount = roundResults.filter((round) => round.completedBothSides).length;
  const conservativeCompletionRatio = Math.min(
    ratio(leftTotalCompletedDose, plan.totalLeftDose),
    ratio(rightTotalCompletedDose, plan.totalRightDose)
  );
  return Object.freeze({
    exerciseId: plan.exerciseId,
    sourceUnit: plan.sourceUnit,
    prescribedRoundCount: plan.roundCount,
    completedRoundCount,
    totalCompletedDose,
    totalTargetDose,
    leftTotalCompletedDose,
    rightTotalCompletedDose,
    conservativeCompletionRatio,
    progressionEligible:
      plan.runtimeSelectable &&
      completedRoundCount === plan.roundCount &&
      roundResults.length === plan.roundCount &&
      roundResults.every((round) => round.completedBothSides),
    roundResults: roundResults.slice(),
  });
}

export function bothSidesRoundResultsToLegacySetResults(
  plan: BothSidesDosePlan,
  roundResults: readonly TrainingRoundResult[]
): SetResult[] {
  return roundResults.map((round) => {
    const reachedTarget = round.completedBothSides;
    const base = {
      exerciseId: plan.exerciseId,
      meanVel: NaN,
      autoregulated: round.left.endReason === 'autoregulated' || round.right.endReason === 'autoregulated',
      reachedTarget,
      interruptions: interruptionCount(round.left) + interruptionCount(round.right),
      flags: reachedTarget ? [] : ['both-sides-incomplete'],
    };
    if (plan.sourceUnit === 'reps') {
      return {
        ...base,
        reps: round.totalCompletedDose,
        holdSec: NaN,
        romPeak: NaN,
      };
    }
    if (plan.sourceUnit === 'rom_window_ms') {
      return {
        ...base,
        reps: 0,
        holdSec: NaN,
        romPeak: reachedTarget ? 1 : NaN,
      };
    }
    return {
      ...base,
      reps: 0,
      holdSec: round.totalCompletedDose / 1000,
      romPeak: NaN,
    };
  });
}

function interruptionCount(segment: TrainingSideSegmentResult): number {
  return segment.endReason === 'tracking_interrupted' ? 1 : 0;
}

function ratio(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}

function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
