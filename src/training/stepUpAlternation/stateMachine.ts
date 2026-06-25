import { oppositeSide } from '../bothSidesRounds';
import { setStartLeadForIndex } from './plan';
import type {
  StepUpAlternationPlan,
  StepUpAlternationRuntimeState,
  StepUpLeadSide,
  StepUpRepEvidence,
} from './types';

export type StepUpAlternationAction =
  | { readonly type: 'START_SET'; readonly setIndex?: number }
  | { readonly type: 'FLOOR_READY' }
  | { readonly type: 'START_REP_ATTEMPT'; readonly attemptId?: string }
  | { readonly type: 'APPLY_REP_EVIDENCE'; readonly evidence: StepUpRepEvidence }
  | { readonly type: 'TRACKING_INTERRUPTED'; readonly attemptId?: string }
  | { readonly type: 'PAUSE_OR_BACKGROUND' }
  | { readonly type: 'CANCEL_SET' };

export function createStepUpAlternationRuntimeState(
  plan: StepUpAlternationPlan,
  setIndex = 0
): StepUpAlternationRuntimeState {
  const startLeadSide = setStartLeadForIndex(plan, setIndex);
  return Object.freeze({
    plan,
    setIndex,
    startLeadSide,
    expectedLeadSide: startLeadSide,
    phase: 'set_setup',
    currentRepAttemptId: null,
    acceptedRepCount: 0,
    leftLeadRepCount: 0,
    rightLeadRepCount: 0,
    repEvidence: [],
    retiredRepAttemptIds: [],
    stageEpoch: 1,
    ignoredStaleActionCount: 0,
    duplicateSuppressedCount: 0,
    wrongLeadCount: 0,
    repSfxCount: 0,
  });
}

export function advanceStepUpAlternationState(
  state: StepUpAlternationRuntimeState,
  action: StepUpAlternationAction
): StepUpAlternationRuntimeState {
  switch (action.type) {
    case 'START_SET': {
      const setIndex = action.setIndex ?? state.setIndex;
      return createStepUpAlternationRuntimeState(state.plan, setIndex);
    }
    case 'FLOOR_READY': {
      if (state.phase === 'set_complete' || state.phase === 'cancelled') return state;
      return withPatch(state, {
        phase: 'ready_both_feet_floor',
        currentRepAttemptId: null,
        retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
        stageEpoch: state.stageEpoch + 1,
      });
    }
    case 'START_REP_ATTEMPT': {
      if (state.phase !== 'ready_both_feet_floor' && state.phase !== 'set_setup') {
        return state;
      }
      return withPatch(state, {
        phase: 'awaiting_expected_lead',
        currentRepAttemptId: action.attemptId ?? attemptIdFor(state),
        stageEpoch: state.stageEpoch + 1,
      });
    }
    case 'APPLY_REP_EVIDENCE':
      return applyRepEvidence(state, action.evidence);
    case 'TRACKING_INTERRUPTED':
      return trackingInterrupted(state, action.attemptId);
    case 'PAUSE_OR_BACKGROUND':
      return restoreStepUpAlternationRuntimeState(state);
    case 'CANCEL_SET':
      return withPatch(state, {
        phase: 'cancelled',
        currentRepAttemptId: null,
        retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
        stageEpoch: state.stageEpoch + 1,
      });
  }
}

export function restoreStepUpAlternationRuntimeState(
  state: StepUpAlternationRuntimeState
): StepUpAlternationRuntimeState {
  if (state.phase === 'set_complete' || state.phase === 'cancelled') return state;
  return withPatch(state, {
    phase: 'ready_both_feet_floor',
    currentRepAttemptId: null,
    retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
    stageEpoch: state.stageEpoch + 1,
  });
}

export function currentStepUpAttemptId(state: StepUpAlternationRuntimeState): string {
  return state.currentRepAttemptId ?? attemptIdFor(state);
}

function applyRepEvidence(
  state: StepUpAlternationRuntimeState,
  evidence: StepUpRepEvidence
): StepUpAlternationRuntimeState {
  if (state.currentRepAttemptId && evidence.repAttemptId !== state.currentRepAttemptId) {
    return withPatch(state, {
      ignoredStaleActionCount: state.ignoredStaleActionCount + 1,
    });
  }
  if (state.repEvidence.some((item) => item.repAttemptId === evidence.repAttemptId)) {
    return withPatch(state, {
      duplicateSuppressedCount: state.duplicateSuppressedCount + 1,
    });
  }
  if (!state.currentRepAttemptId && state.retiredRepAttemptIds.includes(evidence.repAttemptId)) {
    return withPatch(state, {
      ignoredStaleActionCount: state.ignoredStaleActionCount + 1,
    });
  }
  const repEvidence = Object.freeze([...state.repEvidence, evidence]);
  if (evidence.endReason === 'accepted' && evidence.valid) {
    const observedLeadSide = evidence.observedLeadSide ?? state.expectedLeadSide;
    const acceptedRepCount = state.acceptedRepCount + 1;
    const leftLeadRepCount = state.leftLeadRepCount + (observedLeadSide === 'left' ? 1 : 0);
    const rightLeadRepCount = state.rightLeadRepCount + (observedLeadSide === 'right' ? 1 : 0);
    const targetComplete =
      acceptedRepCount === state.plan.targetTotalReps &&
      leftLeadRepCount === state.plan.targetLeftLeadReps &&
      rightLeadRepCount === state.plan.targetRightLeadReps;
    return withPatch(state, {
      expectedLeadSide: oppositeSide(state.expectedLeadSide) as StepUpLeadSide,
      phase: targetComplete ? 'set_complete' : 'ready_both_feet_floor',
      currentRepAttemptId: null,
      retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
      acceptedRepCount,
      leftLeadRepCount,
      rightLeadRepCount,
      repEvidence,
      stageEpoch: state.stageEpoch + 1,
      repSfxCount: state.repSfxCount + 1,
    });
  }
  if (evidence.endReason === 'wrong_lead') {
    return withPatch(state, {
      phase: 'wrong_lead_recovery',
      currentRepAttemptId: null,
      retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
      repEvidence,
      stageEpoch: state.stageEpoch + 1,
      wrongLeadCount: state.wrongLeadCount + 1,
    });
  }
  if (evidence.endReason === 'tracking_interrupted') {
    return withPatch(state, {
      phase: 'tracking_recovery',
      currentRepAttemptId: null,
      retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
      repEvidence,
      stageEpoch: state.stageEpoch + 1,
    });
  }
  return withPatch(state, {
    phase: evidence.endReason === 'cancelled' ? 'cancelled' : 'ready_both_feet_floor',
    currentRepAttemptId: null,
    retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
    repEvidence,
    stageEpoch: state.stageEpoch + 1,
  });
}

function trackingInterrupted(
  state: StepUpAlternationRuntimeState,
  attemptId: string | undefined
): StepUpAlternationRuntimeState {
  if (attemptId && state.currentRepAttemptId && attemptId !== state.currentRepAttemptId) {
    return withPatch(state, {
      ignoredStaleActionCount: state.ignoredStaleActionCount + 1,
    });
  }
  return withPatch(state, {
    phase: 'tracking_recovery',
    currentRepAttemptId: null,
    retiredRepAttemptIds: retireAttemptId(state, state.currentRepAttemptId),
    stageEpoch: state.stageEpoch + 1,
  });
}

function attemptIdFor(state: StepUpAlternationRuntimeState): string {
  return `step-up-set-${state.setIndex + 1}-rep-${state.acceptedRepCount + state.repEvidence.length + 1}-epoch-${state.stageEpoch}`;
}

function retireAttemptId(
  state: StepUpAlternationRuntimeState,
  attemptId: string | null
): readonly string[] {
  if (!attemptId || state.retiredRepAttemptIds.includes(attemptId)) return state.retiredRepAttemptIds;
  return Object.freeze([...state.retiredRepAttemptIds, attemptId].slice(-200));
}

function withPatch(
  state: StepUpAlternationRuntimeState,
  patch: Partial<StepUpAlternationRuntimeState>
): StepUpAlternationRuntimeState {
  return Object.freeze({ ...state, ...patch });
}
