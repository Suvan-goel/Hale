export const STEP_UP_ALTERNATION_PLAN_VERSION = 1 as const;
export const STEP_UP_EXERCISE_ID = 'step-up' as const;

export type StepUpLeadSide = 'left' | 'right';

export type StepUpAlternationReasonCode =
  | 'STEP_UP_ALTERNATION_READY'
  | 'ODD_STEP_UP_TARGET'
  | 'NON_INTEGER_STEP_UP_TARGET'
  | 'NON_POSITIVE_STEP_UP_TARGET'
  | 'UNSUPPORTED_STEP_UP_EXERCISE'
  | 'SOURCE_PRESCRIPTION_MISMATCH'
  | 'MISSING_INITIAL_LEAD';

export interface StepUpAlternationPlan {
  readonly version: typeof STEP_UP_ALTERNATION_PLAN_VERSION;
  readonly exerciseId: typeof STEP_UP_EXERCISE_ID;
  readonly targetTotalReps: number;
  readonly targetLeftLeadReps: number;
  readonly targetRightLeadReps: number;
  readonly setCount: number;
  readonly initialLeadSide: StepUpLeadSide;
  readonly setStartLeadSides: readonly StepUpLeadSide[];
  readonly sourceSetCount: number;
  readonly sourceTargetRepsPerSet: number;
  readonly sourcePrescriptionFingerprint: string;
  readonly planFingerprint: string;
  readonly runtimeSelectable: boolean;
  readonly blockerReasonCodes: readonly StepUpAlternationReasonCode[];
}

export type StepUpRepEndReason =
  | 'accepted'
  | 'wrong_lead'
  | 'tracking_interrupted'
  | 'cancelled'
  | 'invalid_phase'
  | 'stale'
  | 'duplicate';

export interface StepUpRepEvidence {
  readonly repAttemptId: string;
  readonly expectedLeadSide: StepUpLeadSide;
  readonly observedLeadSide: StepUpLeadSide | null;
  readonly startedAtMs: number;
  readonly topReachedAtMs: number | null;
  readonly returnedToFloorAtMs: number | null;
  readonly bothFeetAtStart: boolean;
  readonly expectedLeadInitiatedAscent: boolean;
  readonly topPhaseValid: boolean;
  readonly bothFeetReturnedToFloor: boolean;
  readonly trackingValid: boolean;
  readonly valid: boolean;
  readonly endReason: StepUpRepEndReason;
}

export interface StepUpSetResult {
  readonly setIndex: number;
  readonly startLeadSide: StepUpLeadSide;
  readonly targetTotalReps: number;
  readonly acceptedRepCount: number;
  readonly leftLeadRepCount: number;
  readonly rightLeadRepCount: number;
  readonly alternationValid: boolean;
  readonly completedTarget: boolean;
  readonly repEvidence: readonly StepUpRepEvidence[];
  readonly repSfxCount: number;
}

export type StepUpRepPhase =
  | 'set_setup'
  | 'ready_both_feet_floor'
  | 'awaiting_expected_lead'
  | 'ascending'
  | 'top'
  | 'descending'
  | 'awaiting_both_feet_floor'
  | 'rep_complete'
  | 'wrong_lead_recovery'
  | 'tracking_recovery'
  | 'set_complete'
  | 'cancelled';

export interface StepUpAlternationRuntimeState {
  readonly plan: StepUpAlternationPlan;
  readonly setIndex: number;
  readonly startLeadSide: StepUpLeadSide;
  readonly expectedLeadSide: StepUpLeadSide;
  readonly phase: StepUpRepPhase;
  readonly currentRepAttemptId: string | null;
  readonly acceptedRepCount: number;
  readonly leftLeadRepCount: number;
  readonly rightLeadRepCount: number;
  readonly repEvidence: readonly StepUpRepEvidence[];
  readonly retiredRepAttemptIds: readonly string[];
  readonly stageEpoch: number;
  readonly ignoredStaleActionCount: number;
  readonly duplicateSuppressedCount: number;
  readonly wrongLeadCount: number;
  readonly repSfxCount: number;
}

export interface StepUpAlternationProgressionSummary {
  readonly exerciseId: typeof STEP_UP_EXERCISE_ID;
  readonly setCount: number;
  readonly completedSetCount: number;
  readonly totalAcceptedReps: number;
  readonly leftLeadReps: number;
  readonly rightLeadReps: number;
  readonly alternationValid: boolean;
  readonly progressionEligible: boolean;
  readonly setResults: readonly StepUpSetResult[];
}
