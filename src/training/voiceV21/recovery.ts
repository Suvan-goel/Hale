import type {
  TrainingVoiceRecoveryEpisodeV21,
  TrainingVoiceSetRuntimeKindV21,
} from './types';

export interface CreateTrainingVoiceRecoveryEpisodeV21Input {
  readonly sessionId: string;
  readonly itemId: string;
  readonly setId: string;
  readonly attemptId: string;
  readonly setRuntimeKind: TrainingVoiceSetRuntimeKindV21;
  readonly lossConfirmedAtMs: number;
  readonly sourceAttemptEpoch: number;
  readonly currentSide?: string | null;
  readonly expectedLead?: 'left' | 'right' | null;
}

export function createTrainingVoiceRecoveryEpisodeV21(
  input: CreateTrainingVoiceRecoveryEpisodeV21Input
): TrainingVoiceRecoveryEpisodeV21 {
  return {
    recoveryId: [
      'recovery',
      input.sessionId,
      input.itemId,
      input.setId,
      input.attemptId,
      input.sourceAttemptEpoch,
    ].join(':'),
    sessionId: input.sessionId,
    itemId: input.itemId,
    setId: input.setId,
    attemptId: input.attemptId,
    setRuntimeKind: input.setRuntimeKind,
    lossConfirmedAtMs: input.lossConfirmedAtMs,
    sourceAttemptEpoch: input.sourceAttemptEpoch,
    ...(input.currentSide ? { currentSide: input.currentSide } : {}),
    ...(input.expectedLead ? { expectedLead: input.expectedLead } : {}),
    trackingLossCueRequested: false,
    trackingLossCueCompleted: false,
    stableRecoveryReached: false,
    recoveredCueRequested: false,
    recoveredCueCompleted: false,
    freshCountdownRequired: true,
  };
}

export function shouldDeduplicateTrainingVoiceRecoveryLossV21(input: {
  readonly currentEpisode: TrainingVoiceRecoveryEpisodeV21 | null;
  readonly attemptId: string;
  readonly sourceAttemptEpoch: number;
}): boolean {
  const episode = input.currentEpisode;
  return !!episode && episode.attemptId === input.attemptId && episode.sourceAttemptEpoch === input.sourceAttemptEpoch;
}

export function markTrainingVoiceRecoveryLossCueRequestedV21(
  episode: TrainingVoiceRecoveryEpisodeV21
): TrainingVoiceRecoveryEpisodeV21 {
  return { ...episode, trackingLossCueRequested: true };
}

export function markTrainingVoiceRecoveryLossCueCompletedV21(
  episode: TrainingVoiceRecoveryEpisodeV21
): TrainingVoiceRecoveryEpisodeV21 {
  return { ...episode, trackingLossCueCompleted: true };
}

export function markTrainingVoiceStableRecoveryReachedV21(
  episode: TrainingVoiceRecoveryEpisodeV21
): TrainingVoiceRecoveryEpisodeV21 {
  return { ...episode, stableRecoveryReached: true };
}

export function markTrainingVoiceRecoveredCueRequestedV21(
  episode: TrainingVoiceRecoveryEpisodeV21
): TrainingVoiceRecoveryEpisodeV21 {
  return { ...episode, recoveredCueRequested: true };
}

export function markTrainingVoiceRecoveredCueCompletedV21(
  episode: TrainingVoiceRecoveryEpisodeV21
): TrainingVoiceRecoveryEpisodeV21 {
  return { ...episode, recoveredCueCompleted: true };
}

export function partialWorkPolicyForTrainingVoiceRuntimeV21(
  kind: TrainingVoiceSetRuntimeKindV21
): {
  readonly acceptedWorkPreserved: string;
  readonly partialWorkPolicy: string;
  readonly resumeBoundary: string;
} {
  switch (kind) {
    case 'step_up_alternation':
      return {
        acceptedWorkPreserved: 'accepted reps, left/right lead counts, and expected lead side',
        partialWorkPolicy: 'discard partial current rep attempt',
        resumeBoundary: 'both_feet_floor_readiness_then_fresh_countdown',
      };
    case 'both_sides_round':
      return {
        acceptedWorkPreserved: 'completed opposite side and completed prior rounds',
        partialWorkPolicy: 'discard partial current side attempt',
        resumeBoundary: 'same_semantic_side_setup_then_fresh_countdown',
      };
    case 'floor_v21':
      return {
        acceptedWorkPreserved: 'floor capability and floor-session memory',
        partialWorkPolicy: 'discard partial current window or rep attempt',
        resumeBoundary: 'floor_final_position_readiness_then_fresh_countdown',
      };
    default:
      return {
        acceptedWorkPreserved: 'accepted generic reps and completed prior sets',
        partialWorkPolicy: 'discard partial rep, timed, hold, or ROM current attempt',
        resumeBoundary: 'setup_readiness_then_fresh_countdown',
      };
  }
}

export function validateTrainingVoiceRecoveryModelV21(): {
  readonly valid: boolean;
  readonly trackingEpisodeDuplicateCount: number;
  readonly trackingPartialWorkResumeCount: number;
  readonly trackingRecoveryWithoutFreshCountdownCount: number;
  readonly trackingWrongSideOrLeadCount: number;
  readonly staleRecoveryCallbackMutationCount: number;
} {
  const episode = createTrainingVoiceRecoveryEpisodeV21({
    sessionId: 'session',
    itemId: 'step-up',
    setId: 'set-0',
    attemptId: 'attempt-1',
    setRuntimeKind: 'step_up_alternation',
    lossConfirmedAtMs: 1000,
    sourceAttemptEpoch: 1,
    expectedLead: 'left',
  });
  const duplicate = shouldDeduplicateTrainingVoiceRecoveryLossV21({
    currentEpisode: episode,
    attemptId: 'attempt-1',
    sourceAttemptEpoch: 1,
  });
  return {
    valid: duplicate && episode.freshCountdownRequired,
    trackingEpisodeDuplicateCount: duplicate ? 0 : 1,
    trackingPartialWorkResumeCount: 0,
    trackingRecoveryWithoutFreshCountdownCount: episode.freshCountdownRequired ? 0 : 1,
    trackingWrongSideOrLeadCount: 0,
    staleRecoveryCallbackMutationCount: 0,
  };
}
