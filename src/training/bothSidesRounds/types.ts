export const TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION = 1 as const;
export const TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS = [
  'balance-single-leg-hold',
  'balance-tandem-hold',
  'chair-supported-split-squat',
  'seated-hamstring-reach',
  'supported-hip-flexor-stretch',
  'wall-calf-stretch',
] as const;

export type TrainingBothSidesAffectedExerciseId =
  (typeof TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS)[number];

export type TrainingInitialSideExerciseId = TrainingBothSidesAffectedExerciseId | 'step-up';

export type TrainingRoundSide = 'left' | 'right';

export type TrainingRoundSideRole =
  | 'standing_leg'
  | 'lead_foot'
  | 'front_leg'
  | 'extended_leg'
  | 'stretched_hip_side'
  | 'stretched_calf_side';

export type BothSidesDoseUnit = 'reps' | 'hold_ms' | 'timer_ms' | 'rom_window_ms';

export type BothSidesDosePlanReasonCode =
  | 'DIRECT_HALF_SET'
  | 'MINIMUM_SIDE_TARGET'
  | 'ROUND_COUNT_REDUCED'
  | 'NON_INTEGER_REP_TARGET'
  | 'ODD_TOTAL_REPS'
  | 'TIME_PRECISION_UNSUPPORTED'
  | 'TOTAL_DOSE_MISMATCH'
  | 'SIDE_DOSE_MISMATCH'
  | 'UNKNOWN_EXERCISE'
  | 'UNSUPPORTED_UNIT'
  | 'DOSE_PLAN_UNREPRESENTABLE'
  | 'MALFORMED_SOURCE_PRESCRIPTION';

export interface BothSidesRoundSideTarget {
  readonly side: TrainingRoundSide;
  readonly targetDose: number;
  readonly targetReps?: number;
  readonly targetMs?: number;
}

export interface BothSidesRoundDescriptor {
  /** 0-based round index, matching the existing player setIndex convention. */
  readonly roundIndex: number;
  readonly startSide: TrainingRoundSide;
  readonly sideOrder: readonly [TrainingRoundSide, TrainingRoundSide];
  readonly targets: Readonly<Record<TrainingRoundSide, BothSidesRoundSideTarget>>;
}

export interface BothSidesDosePlan {
  readonly version: typeof TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION;
  readonly exerciseId: string;
  readonly sideRole: TrainingRoundSideRole;
  readonly planFingerprint: string;
  readonly initialStartSide: TrainingRoundSide;

  readonly sourceSetCount: number;
  readonly sourceTargetPerSet: number;
  readonly sourceUnit: BothSidesDoseUnit;
  readonly sourceTotalDose: number;

  readonly roundCount: number;
  readonly rounds: readonly BothSidesRoundDescriptor[];

  readonly totalLeftDose: number;
  readonly totalRightDose: number;
  readonly convertedTotalDose: number;

  readonly minimumValidSideTarget: number | null;
  readonly minimumSource: string | null;
  readonly conversionReason:
    | 'direct_half_set'
    | 'round_count_reduced_for_minimum'
    | 'unrepresentable';

  readonly exactDosePreserved: boolean;
  readonly equalSideDose: boolean;
  readonly runtimeSelectable: boolean;
  readonly blockerReasonCodes: readonly BothSidesDosePlanReasonCode[];
}

export type BothSidesRoundPhase =
  | 'round_setup'
  | 'side_setup'
  | 'side_ready'
  | 'side_countdown'
  | 'side_active'
  | 'side_complete'
  | 'side_switch'
  | 'round_complete'
  | 'rest'
  | 'exercise_complete'
  | 'interrupted'
  | 'cancelled';

export type TrainingSideSegmentEndReason =
  | 'target_completed'
  | 'autoregulated'
  | 'tracking_interrupted'
  | 'user_stopped'
  | 'skipped'
  | 'cancelled'
  | 'invalid';

export interface TrainingSideSegmentResult {
  readonly side: TrainingRoundSide;
  readonly sideRole: TrainingRoundSideRole;
  readonly targetDose: number;
  readonly completedDose: number;
  readonly targetReps?: number;
  readonly completedReps?: number;
  readonly targetMs?: number;
  readonly validTimeMs?: number;
  readonly completedTarget: boolean;
  readonly valid: boolean;
  readonly endReason: TrainingSideSegmentEndReason;
  readonly attemptId: string;
}

export interface TrainingRoundResult {
  readonly roundIndex: number;
  readonly startSide: TrainingRoundSide;
  readonly sideOrder: readonly [TrainingRoundSide, TrainingRoundSide];
  readonly left: TrainingSideSegmentResult;
  readonly right: TrainingSideSegmentResult;
  readonly completedBothSides: boolean;
  readonly totalCompletedDose: number;
  readonly totalTargetDose: number;
  readonly leftCompletionRatio: number;
  readonly rightCompletionRatio: number;
  readonly conservativeCompletionRatio: number;
}

export interface BothSidesRoundRuntimeState {
  readonly dosePlan: BothSidesDosePlan;
  readonly roundIndex: number;
  readonly currentSideIndex: 0 | 1;
  readonly currentSide: TrainingRoundSide;
  readonly currentSideAttemptId: string;
  readonly phase: BothSidesRoundPhase;
  readonly sideResults: Partial<Record<TrainingRoundSide, TrainingSideSegmentResult>>;
  readonly completedRounds: readonly TrainingRoundResult[];
  readonly stageEpoch: number;
  readonly freshCountdownRequired: boolean;
  readonly interruptedAttemptIds: readonly string[];
  readonly ignoredStaleActionCount: number;
}

export interface BothSidesStartSideSeedState {
  /**
   * Backward-compatible field name from the both-sides phase. The stored
   * meaning is now the shared next initial side for side-ordered training
   * exercises, including step-up.
   */
  readonly nextBothSidesStartSideByExercise: Partial<Record<TrainingInitialSideExerciseId, TrainingRoundSide>>;
  readonly appliedBothSidesStartSideFlipEventIds: readonly string[];
}

export interface BothSidesProgressionSummary {
  readonly exerciseId: string;
  readonly sourceUnit: BothSidesDoseUnit;
  readonly prescribedRoundCount: number;
  readonly completedRoundCount: number;
  readonly totalCompletedDose: number;
  readonly totalTargetDose: number;
  readonly leftTotalCompletedDose: number;
  readonly rightTotalCompletedDose: number;
  readonly conservativeCompletionRatio: number;
  readonly progressionEligible: boolean;
  readonly roundResults: readonly TrainingRoundResult[];
}
