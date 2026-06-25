import {
  aggregateTrainingRoundResult,
  createTrainingSideSegmentResult,
} from './aggregation';
import { oppositeSide } from './dosePlanner';
import type {
  BothSidesDosePlan,
  BothSidesRoundRuntimeState,
  BothSidesRoundPhase,
  TrainingRoundSide,
  TrainingSideSegmentEndReason,
  TrainingSideSegmentResult,
} from './types';

export type BothSidesRoundAction =
  | { readonly type: 'START_ROUND_SETUP' }
  | { readonly type: 'START_SIDE_SETUP' }
  | { readonly type: 'SIDE_READY' }
  | { readonly type: 'COUNTDOWN_STARTED' }
  | { readonly type: 'SIDE_ACTIVE_STARTED' }
  | {
      readonly type: 'SIDE_COMPLETED';
      readonly attemptId: string;
      readonly completedDose?: number;
      readonly completedReps?: number;
      readonly validTimeMs?: number;
      readonly endReason?: TrainingSideSegmentEndReason;
    }
  | { readonly type: 'TRACKING_INTERRUPTED'; readonly attemptId: string }
  | { readonly type: 'APP_BACKGROUND'; readonly attemptId: string }
  | { readonly type: 'REST_ENTERED' }
  | { readonly type: 'REST_COMPLETED' }
  | { readonly type: 'SKIP_EXERCISE' }
  | { readonly type: 'CANCEL_EXERCISE' };

export function createBothSidesRoundRuntimeState(
  dosePlan: BothSidesDosePlan
): BothSidesRoundRuntimeState {
  const firstRound = dosePlan.rounds[0];
  const firstSide = firstRound?.sideOrder[0] ?? dosePlan.initialStartSide;
  return Object.freeze({
    dosePlan,
    roundIndex: 0,
    currentSideIndex: 0,
    currentSide: firstSide,
    currentSideAttemptId: attemptId(1, 0, firstSide),
    phase: 'round_setup',
    sideResults: {},
    completedRounds: [],
    stageEpoch: 1,
    freshCountdownRequired: true,
    interruptedAttemptIds: [],
    ignoredStaleActionCount: 0,
  });
}

export function advanceBothSidesRoundState(
  state: BothSidesRoundRuntimeState,
  action: BothSidesRoundAction
): BothSidesRoundRuntimeState {
  switch (action.type) {
    case 'START_ROUND_SETUP':
      return transitionPhase(state, 'round_setup', true);
    case 'START_SIDE_SETUP':
      return startSideSetup(state);
    case 'SIDE_READY':
      return state.phase === 'side_setup' ? transitionPhase(state, 'side_ready', true) : state;
    case 'COUNTDOWN_STARTED':
      return state.phase === 'side_ready' ? transitionPhase(state, 'side_countdown', false) : state;
    case 'SIDE_ACTIVE_STARTED':
      return state.phase === 'side_countdown' && !state.freshCountdownRequired
        ? transitionPhase(state, 'side_active', false)
        : state;
    case 'SIDE_COMPLETED':
      return completeSide(state, action);
    case 'TRACKING_INTERRUPTED':
      return interruptSide(state, action.attemptId, 'tracking_interrupted');
    case 'APP_BACKGROUND':
      return interruptSide(state, action.attemptId, 'tracking_interrupted');
    case 'REST_ENTERED':
      return enterRest(state);
    case 'REST_COMPLETED':
      return completeRest(state);
    case 'SKIP_EXERCISE':
      return transitionPhase(state, 'exercise_complete', true);
    case 'CANCEL_EXERCISE':
      return transitionPhase(state, 'cancelled', true);
  }
}

export function currentBothSidesTarget(state: BothSidesRoundRuntimeState): number {
  return state.dosePlan.rounds[state.roundIndex]?.targets[state.currentSide]?.targetDose ?? 0;
}

export function restoreBothSidesRoundRuntimeState(
  restored: BothSidesRoundRuntimeState
): BothSidesRoundRuntimeState {
  if (
    restored.phase === 'side_active' ||
    restored.phase === 'side_countdown' ||
    restored.phase === 'side_ready' ||
    restored.phase === 'interrupted'
  ) {
    return restartCurrentSide(restored);
  }
  if (restored.phase === 'side_switch') {
    return startSecondSideSetup(restored);
  }
  return Object.freeze({
    ...restored,
    dosePlan: restored.dosePlan,
    completedRounds: restored.completedRounds.slice(),
    interruptedAttemptIds: restored.interruptedAttemptIds.slice(),
  });
}

function startSideSetup(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  if (state.phase === 'round_setup') {
    return transitionPhase(state, 'side_setup', true);
  }
  if (state.phase === 'side_switch') {
    return startSecondSideSetup(state);
  }
  return state;
}

function startSecondSideSetup(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  if (state.currentSideIndex !== 0) return state;
  const round = state.dosePlan.rounds[state.roundIndex];
  if (!round) return state;
  const nextSide = round.sideOrder[1];
  const nextEpoch = state.stageEpoch + 1;
  return Object.freeze({
    ...state,
    currentSideIndex: 1,
    currentSide: nextSide,
    currentSideAttemptId: attemptId(nextEpoch, state.roundIndex, nextSide),
    phase: 'side_setup',
    stageEpoch: nextEpoch,
    freshCountdownRequired: true,
  });
}

function completeSide(
  state: BothSidesRoundRuntimeState,
  action: Extract<BothSidesRoundAction, { readonly type: 'SIDE_COMPLETED' }>
): BothSidesRoundRuntimeState {
  if (state.phase !== 'side_active') return state;
  if (action.attemptId !== state.currentSideAttemptId) return stale(state);
  if (state.sideResults[state.currentSide]) return stale(state);

  const sideResult = createTrainingSideSegmentResult({
    plan: state.dosePlan,
    roundIndex: state.roundIndex,
    side: state.currentSide,
    completedDose: action.completedDose,
    completedReps: action.completedReps,
    validTimeMs: action.validTimeMs,
    endReason: action.endReason,
    attemptId: action.attemptId,
  });
  const sideResults = {
    ...state.sideResults,
    [state.currentSide]: sideResult,
  };

  if (state.currentSideIndex === 0) {
    return Object.freeze({
      ...state,
      phase: 'side_switch',
      sideResults,
      freshCountdownRequired: true,
    });
  }

  const left = sideResults.left;
  const right = sideResults.right;
  if (!left || !right) {
    return Object.freeze({
      ...state,
      phase: 'side_complete',
      sideResults,
      freshCountdownRequired: true,
    });
  }
  const roundResult = aggregateTrainingRoundResult({
    plan: state.dosePlan,
    roundIndex: state.roundIndex,
    left,
    right,
  });
  return Object.freeze({
    ...state,
    phase: 'round_complete',
    sideResults,
    completedRounds: [...state.completedRounds, roundResult],
    freshCountdownRequired: true,
  });
}

function interruptSide(
  state: BothSidesRoundRuntimeState,
  attempt: string,
  endReason: TrainingSideSegmentEndReason
): BothSidesRoundRuntimeState {
  if (attempt !== state.currentSideAttemptId) return stale(state);
  if (state.phase !== 'side_active' && state.phase !== 'side_countdown' && state.phase !== 'side_ready') {
    return state;
  }
  const nextEpoch = state.stageEpoch + 1;
  return Object.freeze({
    ...state,
    currentSideAttemptId: attemptId(nextEpoch, state.roundIndex, state.currentSide),
    phase: 'side_setup',
    stageEpoch: nextEpoch,
    freshCountdownRequired: true,
    interruptedAttemptIds: [...state.interruptedAttemptIds, `${attempt}:${endReason}`],
  });
}

function enterRest(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  if (state.phase !== 'round_complete') return state;
  if (state.completedRounds.length >= state.dosePlan.roundCount) {
    return transitionPhase(state, 'exercise_complete', true);
  }
  return transitionPhase(state, 'rest', true);
}

function completeRest(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  if (state.phase !== 'rest') return state;
  const nextRoundIndex = state.roundIndex + 1;
  const round = state.dosePlan.rounds[nextRoundIndex];
  if (!round) return transitionPhase(state, 'exercise_complete', true);
  const nextEpoch = state.stageEpoch + 1;
  const nextSide = round.sideOrder[0];
  return Object.freeze({
    ...state,
    roundIndex: nextRoundIndex,
    currentSideIndex: 0,
    currentSide: nextSide,
    currentSideAttemptId: attemptId(nextEpoch, nextRoundIndex, nextSide),
    phase: 'round_setup',
    sideResults: {},
    stageEpoch: nextEpoch,
    freshCountdownRequired: true,
  });
}

function restartCurrentSide(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  const nextEpoch = state.stageEpoch + 1;
  return Object.freeze({
    ...state,
    currentSideAttemptId: attemptId(nextEpoch, state.roundIndex, state.currentSide),
    phase: 'side_setup',
    stageEpoch: nextEpoch,
    freshCountdownRequired: true,
  });
}

function transitionPhase(
  state: BothSidesRoundRuntimeState,
  phase: BothSidesRoundPhase,
  freshCountdownRequired: boolean
): BothSidesRoundRuntimeState {
  return Object.freeze({
    ...state,
    phase,
    freshCountdownRequired,
  });
}

function stale(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  return Object.freeze({
    ...state,
    ignoredStaleActionCount: state.ignoredStaleActionCount + 1,
  });
}

function attemptId(epoch: number, roundIndex: number, side: TrainingRoundSide): string {
  return `bsr-attempt-${epoch}-r${roundIndex}-${side}-${oppositeSide(side)}`;
}

export function completedSideResultFor(
  state: BothSidesRoundRuntimeState,
  side: TrainingRoundSide
): TrainingSideSegmentResult | null {
  return state.sideResults[side] ?? null;
}
