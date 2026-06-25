import type {
  StepUpAlternationRuntimeState,
  StepUpLeadSide,
} from './types';

export interface StepUpAlternationViewModel {
  readonly expectedLeadSide: StepUpLeadSide;
  readonly startLeadSide: StepUpLeadSide;
  readonly acceptedRepCount: number;
  readonly targetTotalReps: number;
  readonly leftLeadRepCount: number;
  readonly rightLeadRepCount: number;
  readonly nextLeadCueKey: 'step-up-next-left-v21' | 'step-up-next-right-v21';
  readonly wrongLeadCorrectionCueKey: 'step-up-wrong-left-v21' | 'step-up-wrong-right-v21';
}

export function stepUpAlternationViewModel(
  state: StepUpAlternationRuntimeState
): StepUpAlternationViewModel {
  return Object.freeze({
    expectedLeadSide: state.expectedLeadSide,
    startLeadSide: state.startLeadSide,
    acceptedRepCount: state.acceptedRepCount,
    targetTotalReps: state.plan.targetTotalReps,
    leftLeadRepCount: state.leftLeadRepCount,
    rightLeadRepCount: state.rightLeadRepCount,
    nextLeadCueKey: stepUpNextLeadCueKey(state.expectedLeadSide),
    wrongLeadCorrectionCueKey: stepUpWrongLeadCueKey(state.expectedLeadSide),
  });
}

export function stepUpNextLeadCueKey(
  side: StepUpLeadSide
): 'step-up-next-left-v21' | 'step-up-next-right-v21' {
  return side === 'left' ? 'step-up-next-left-v21' : 'step-up-next-right-v21';
}

export function stepUpWrongLeadCueKey(
  side: StepUpLeadSide
): 'step-up-wrong-left-v21' | 'step-up-wrong-right-v21' {
  return side === 'left' ? 'step-up-wrong-left-v21' : 'step-up-wrong-right-v21';
}
