import type {
  StepUpLeadSide,
  StepUpRepEndReason,
  StepUpRepEvidence,
} from './types';

export interface StepUpAlternationReadinessEvidence {
  readonly subjectPresent: boolean;
  readonly trackingStable: boolean;
  readonly leftLowerChainReliable: boolean;
  readonly rightLowerChainReliable: boolean;
  readonly leftFootVisible: boolean;
  readonly rightFootVisible: boolean;
  readonly bothFeetAtFloor: boolean;
}

export interface StepUpRepEvidenceInput {
  readonly repAttemptId: string;
  readonly expectedLeadSide: StepUpLeadSide;
  readonly observedLeadSide?: StepUpLeadSide | null;
  readonly startedAtMs: number;
  readonly topReachedAtMs?: number | null;
  readonly returnedToFloorAtMs?: number | null;
  readonly bothFeetAtStart: boolean;
  readonly expectedLeadInitiatedAscent: boolean;
  readonly topPhaseValid: boolean;
  readonly bothFeetReturnedToFloor: boolean;
  readonly trackingValid: boolean;
  readonly cancelled?: boolean;
}

export function hasStepUpAlternationReadiness(
  evidence: StepUpAlternationReadinessEvidence
): boolean {
  return (
    evidence.subjectPresent &&
    evidence.trackingStable &&
    evidence.leftLowerChainReliable &&
    evidence.rightLowerChainReliable &&
    evidence.leftFootVisible &&
    evidence.rightFootVisible &&
    evidence.bothFeetAtFloor
  );
}

export function resolveStepUpRepEvidence(
  input: StepUpRepEvidenceInput
): StepUpRepEvidence {
  const observedLeadSide = input.observedLeadSide ?? null;
  const endReason = stepUpRepEndReason(input, observedLeadSide);
  return Object.freeze({
    repAttemptId: input.repAttemptId,
    expectedLeadSide: input.expectedLeadSide,
    observedLeadSide,
    startedAtMs: input.startedAtMs,
    topReachedAtMs: input.topReachedAtMs ?? null,
    returnedToFloorAtMs: input.returnedToFloorAtMs ?? null,
    bothFeetAtStart: input.bothFeetAtStart,
    expectedLeadInitiatedAscent: input.expectedLeadInitiatedAscent,
    topPhaseValid: input.topPhaseValid,
    bothFeetReturnedToFloor: input.bothFeetReturnedToFloor,
    trackingValid: input.trackingValid,
    valid: endReason === 'accepted',
    endReason,
  });
}

function stepUpRepEndReason(
  input: StepUpRepEvidenceInput,
  observedLeadSide: StepUpLeadSide | null
): StepUpRepEndReason {
  if (input.cancelled) return 'cancelled';
  if (!input.trackingValid) return 'tracking_interrupted';
  if (!input.bothFeetAtStart) return 'invalid_phase';
  if (observedLeadSide && observedLeadSide !== input.expectedLeadSide) return 'wrong_lead';
  if (
    !observedLeadSide ||
    !input.expectedLeadInitiatedAscent ||
    !input.topPhaseValid ||
    !input.bothFeetReturnedToFloor
  ) {
    return 'invalid_phase';
  }
  return 'accepted';
}
