import type { SetResult } from '../../exercises';
import type {
  StepUpAlternationPlan,
  StepUpAlternationProgressionSummary,
  StepUpAlternationRuntimeState,
  StepUpSetResult,
} from './types';

export function summarizeStepUpSetResult(
  state: StepUpAlternationRuntimeState
): StepUpSetResult {
  const completedTarget =
    state.acceptedRepCount === state.plan.targetTotalReps &&
    state.leftLeadRepCount === state.plan.targetLeftLeadReps &&
    state.rightLeadRepCount === state.plan.targetRightLeadReps;
  const alternationValid =
    completedTarget &&
    acceptedEvidenceAlternates(state) &&
    state.repEvidence.filter((evidence) => evidence.endReason === 'accepted').length === state.acceptedRepCount;
  return Object.freeze({
    setIndex: state.setIndex,
    startLeadSide: state.startLeadSide,
    targetTotalReps: state.plan.targetTotalReps,
    acceptedRepCount: state.acceptedRepCount,
    leftLeadRepCount: state.leftLeadRepCount,
    rightLeadRepCount: state.rightLeadRepCount,
    alternationValid,
    completedTarget,
    repEvidence: state.repEvidence.slice(),
    repSfxCount: state.repSfxCount,
  });
}

export function summarizeStepUpAlternationProgression(
  plan: StepUpAlternationPlan,
  setResults: readonly StepUpSetResult[]
): StepUpAlternationProgressionSummary {
  const completedSetCount = setResults.filter((result) => result.completedTarget && result.alternationValid).length;
  const totalAcceptedReps = sum(setResults.map((result) => result.acceptedRepCount));
  const leftLeadReps = sum(setResults.map((result) => result.leftLeadRepCount));
  const rightLeadReps = sum(setResults.map((result) => result.rightLeadRepCount));
  const alternationValid =
    plan.runtimeSelectable &&
    setResults.length === plan.setCount &&
    setResults.every((result) => result.completedTarget && result.alternationValid);
  return Object.freeze({
    exerciseId: plan.exerciseId,
    setCount: plan.setCount,
    completedSetCount,
    totalAcceptedReps,
    leftLeadReps,
    rightLeadReps,
    alternationValid,
    progressionEligible: alternationValid,
    setResults: setResults.slice(),
  });
}

export function stepUpSetResultToLegacySetResult(
  plan: StepUpAlternationPlan,
  result: StepUpSetResult
): SetResult {
  const reachedTarget = result.completedTarget && result.alternationValid;
  return {
    exerciseId: plan.exerciseId,
    reps: result.acceptedRepCount,
    meanVel: NaN,
    holdSec: NaN,
    romPeak: NaN,
    autoregulated: false,
    reachedTarget,
    interruptions: result.repEvidence.filter((evidence) => evidence.endReason === 'tracking_interrupted').length,
    flags: reachedTarget ? [] : ['step-up-alternation-incomplete'],
    stepUpAlternation: {
      setIndex: result.setIndex,
      startLeadSide: result.startLeadSide,
      targetTotalReps: result.targetTotalReps,
      acceptedRepCount: result.acceptedRepCount,
      leftLeadRepCount: result.leftLeadRepCount,
      rightLeadRepCount: result.rightLeadRepCount,
      alternationValid: result.alternationValid,
      completedTarget: result.completedTarget,
    },
  };
}

function acceptedEvidenceAlternates(state: StepUpAlternationRuntimeState): boolean {
  let expected = state.startLeadSide;
  for (const evidence of state.repEvidence) {
    if (evidence.endReason !== 'accepted') continue;
    if (!evidence.valid || evidence.observedLeadSide !== expected) return false;
    expected = expected === 'left' ? 'right' : 'left';
  }
  return true;
}

function sum(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
