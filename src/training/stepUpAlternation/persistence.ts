import { planFingerprint } from './plan';
import {
  STEP_UP_ALTERNATION_PLAN_VERSION,
  STEP_UP_EXERCISE_ID,
  type StepUpAlternationPlan,
  type StepUpAlternationRuntimeState,
  type StepUpLeadSide,
  type StepUpRepEvidence,
  type StepUpRepPhase,
} from './types';

export interface StepUpAlternationRestoreEnvelope {
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

export function serializeStepUpAlternationRuntimeState(
  state: StepUpAlternationRuntimeState
): StepUpAlternationRestoreEnvelope {
  return {
    plan: state.plan,
    setIndex: state.setIndex,
    startLeadSide: state.startLeadSide,
    expectedLeadSide: state.expectedLeadSide,
    phase: state.phase,
    currentRepAttemptId: state.currentRepAttemptId,
    acceptedRepCount: state.acceptedRepCount,
    leftLeadRepCount: state.leftLeadRepCount,
    rightLeadRepCount: state.rightLeadRepCount,
    repEvidence: state.repEvidence.slice(),
    retiredRepAttemptIds: state.retiredRepAttemptIds.slice(),
    stageEpoch: state.stageEpoch,
    ignoredStaleActionCount: state.ignoredStaleActionCount,
    duplicateSuppressedCount: state.duplicateSuppressedCount,
    wrongLeadCount: state.wrongLeadCount,
    repSfxCount: state.repSfxCount,
  };
}

export function deserializeStepUpAlternationRuntimeState(
  value: unknown
): StepUpAlternationRestoreEnvelope | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<StepUpAlternationRestoreEnvelope>;
  if (!isStepUpAlternationPlan(v.plan)) return null;
  if (!Number.isInteger(v.setIndex) || (v.setIndex ?? -1) < 0) return null;
  if (!isStepUpLeadSide(v.startLeadSide) || !isStepUpLeadSide(v.expectedLeadSide)) return null;
  if (!isStepUpRepPhase(v.phase)) return null;
  return {
    plan: v.plan,
    setIndex: v.setIndex as number,
    startLeadSide: v.startLeadSide,
    expectedLeadSide: v.expectedLeadSide,
    phase: v.phase,
    currentRepAttemptId: typeof v.currentRepAttemptId === 'string' ? v.currentRepAttemptId : null,
    acceptedRepCount: finiteNumber(v.acceptedRepCount) ?? 0,
    leftLeadRepCount: finiteNumber(v.leftLeadRepCount) ?? 0,
    rightLeadRepCount: finiteNumber(v.rightLeadRepCount) ?? 0,
    repEvidence: Array.isArray(v.repEvidence)
      ? v.repEvidence.filter(isStepUpRepEvidence)
      : [],
    retiredRepAttemptIds: Array.isArray(v.retiredRepAttemptIds)
      ? v.retiredRepAttemptIds.filter((item): item is string => typeof item === 'string')
      : [],
    stageEpoch: finiteNumber(v.stageEpoch) ?? 1,
    ignoredStaleActionCount: finiteNumber(v.ignoredStaleActionCount) ?? 0,
    duplicateSuppressedCount: finiteNumber(v.duplicateSuppressedCount) ?? 0,
    wrongLeadCount: finiteNumber(v.wrongLeadCount) ?? 0,
    repSfxCount: finiteNumber(v.repSfxCount) ?? 0,
  };
}

export function isStepUpAlternationPlan(value: unknown): value is StepUpAlternationPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<StepUpAlternationPlan>;
  if (plan.version !== STEP_UP_ALTERNATION_PLAN_VERSION) return false;
  if (plan.exerciseId !== STEP_UP_EXERCISE_ID) return false;
  if (!isStepUpLeadSide(plan.initialLeadSide)) return false;
  if (!Array.isArray(plan.setStartLeadSides) || !plan.setStartLeadSides.every(isStepUpLeadSide)) return false;
  if (typeof plan.planFingerprint !== 'string') return false;
  return plan.planFingerprint === planFingerprint(plan as StepUpAlternationPlan);
}

function isStepUpRepEvidence(value: unknown): value is StepUpRepEvidence {
  if (!value || typeof value !== 'object') return false;
  const evidence = value as Partial<StepUpRepEvidence>;
  return (
    typeof evidence.repAttemptId === 'string' &&
    isStepUpLeadSide(evidence.expectedLeadSide) &&
    (evidence.observedLeadSide === null || isStepUpLeadSide(evidence.observedLeadSide)) &&
    typeof evidence.endReason === 'string' &&
    typeof evidence.valid === 'boolean'
  );
}

function isStepUpLeadSide(value: unknown): value is StepUpLeadSide {
  return value === 'left' || value === 'right';
}

function isStepUpRepPhase(value: unknown): value is StepUpRepPhase {
  return (
    value === 'set_setup' ||
    value === 'ready_both_feet_floor' ||
    value === 'awaiting_expected_lead' ||
    value === 'ascending' ||
    value === 'top' ||
    value === 'descending' ||
    value === 'awaiting_both_feet_floor' ||
    value === 'rep_complete' ||
    value === 'wrong_lead_recovery' ||
    value === 'tracking_recovery' ||
    value === 'set_complete' ||
    value === 'cancelled'
  );
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
