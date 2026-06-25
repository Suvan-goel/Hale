import type { BothSidesDosePlan, TrainingRoundSide } from './types';

export type BothSidesDiagnosticEventName =
  | 'source_prescription'
  | 'dose_plan_created'
  | 'minimum_validity_adjustment'
  | 'round_started'
  | 'side_started'
  | 'side_completed'
  | 'side_switch'
  | 'round_completed'
  | 'rest_entered'
  | 'current_side_retry'
  | 'restore_checkpoint'
  | 'plan_fingerprint_mismatch'
  | 'main_plan_start_side_seed_flipped'
  | 'unrepresentable_dose_plan'
  | 'progression_aggregation';

export interface BothSidesDiagnosticEvent {
  readonly eventName: BothSidesDiagnosticEventName;
  readonly exerciseId: string;
  readonly roundIndex?: number;
  readonly side?: TrainingRoundSide;
  readonly reasonCode?: string;
  readonly sourceSetCount?: number;
  readonly sourceTargetPerSet?: number;
  readonly sourceUnit?: string;
  readonly planFingerprint?: string;
}

export function diagnosticForDosePlan(plan: BothSidesDosePlan): BothSidesDiagnosticEvent {
  return {
    eventName: plan.runtimeSelectable ? 'dose_plan_created' : 'unrepresentable_dose_plan',
    exerciseId: plan.exerciseId,
    reasonCode: plan.blockerReasonCodes.join(';'),
    sourceSetCount: plan.sourceSetCount,
    sourceTargetPerSet: plan.sourceTargetPerSet,
    sourceUnit: plan.sourceUnit,
    planFingerprint: plan.planFingerprint,
  };
}
