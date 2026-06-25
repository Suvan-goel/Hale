import type {
  StepUpAlternationPlan,
  StepUpAlternationReasonCode,
} from './types';

export type StepUpAlternationDiagnosticEventName =
  | 'step_up_alternation_plan_ready'
  | 'step_up_alternation_plan_blocked';

export interface StepUpAlternationDiagnosticEvent {
  readonly name: StepUpAlternationDiagnosticEventName;
  readonly exerciseId: string;
  readonly planFingerprint: string;
  readonly reasonCodes: readonly StepUpAlternationReasonCode[];
  readonly targetTotalReps: number;
  readonly targetLeftLeadReps: number;
  readonly targetRightLeadReps: number;
  readonly setCount: number;
}

export function diagnosticForStepUpAlternationPlan(
  plan: StepUpAlternationPlan
): StepUpAlternationDiagnosticEvent {
  return Object.freeze({
    name: plan.runtimeSelectable ? 'step_up_alternation_plan_ready' : 'step_up_alternation_plan_blocked',
    exerciseId: plan.exerciseId,
    planFingerprint: plan.planFingerprint,
    reasonCodes: plan.blockerReasonCodes.slice(),
    targetTotalReps: plan.targetTotalReps,
    targetLeftLeadReps: plan.targetLeftLeadReps,
    targetRightLeadReps: plan.targetRightLeadReps,
    setCount: plan.setCount,
  });
}
