import { planFingerprint } from './dosePlanner';
import type {
  BothSidesDosePlan,
  BothSidesRoundRuntimeState,
  TrainingRoundResult,
  TrainingRoundSide,
  TrainingSideSegmentResult,
} from './types';
import { TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION } from './types';

export interface BothSidesRoundRestoreEnvelope {
  readonly dosePlan: BothSidesDosePlan;
  readonly roundIndex: number;
  readonly currentSide: TrainingRoundSide;
  readonly currentSideIndex: 0 | 1;
  readonly currentSideAttemptId: string;
  readonly phase: BothSidesRoundRuntimeState['phase'];
  readonly sideResults: Partial<Record<TrainingRoundSide, TrainingSideSegmentResult>>;
  readonly completedRounds: readonly TrainingRoundResult[];
  readonly stageEpoch: number;
  readonly freshCountdownRequired: boolean;
  readonly interruptedAttemptIds: readonly string[];
  readonly ignoredStaleActionCount: number;
}

export function serializeBothSidesRoundRuntimeState(
  state: BothSidesRoundRuntimeState
): BothSidesRoundRestoreEnvelope {
  return {
    dosePlan: state.dosePlan,
    roundIndex: state.roundIndex,
    currentSide: state.currentSide,
    currentSideIndex: state.currentSideIndex,
    currentSideAttemptId: state.currentSideAttemptId,
    phase: state.phase,
    sideResults: { ...state.sideResults },
    completedRounds: state.completedRounds.slice(),
    stageEpoch: state.stageEpoch,
    freshCountdownRequired: state.freshCountdownRequired,
    interruptedAttemptIds: state.interruptedAttemptIds.slice(),
    ignoredStaleActionCount: state.ignoredStaleActionCount,
  };
}

export function deserializeBothSidesRoundRuntimeState(
  value: unknown
): BothSidesRoundRestoreEnvelope | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<BothSidesRoundRestoreEnvelope>;
  if (!isBothSidesDosePlan(v.dosePlan)) return null;
  if (!Number.isInteger(v.roundIndex) || (v.roundIndex ?? -1) < 0) return null;
  if (v.currentSide !== 'left' && v.currentSide !== 'right') return null;
  if (v.currentSideIndex !== 0 && v.currentSideIndex !== 1) return null;
  if (typeof v.currentSideAttemptId !== 'string') return null;
  if (typeof v.phase !== 'string') return null;
  return {
    dosePlan: v.dosePlan,
    roundIndex: v.roundIndex as number,
    currentSide: v.currentSide,
    currentSideIndex: v.currentSideIndex,
    currentSideAttemptId: v.currentSideAttemptId,
    phase: v.phase,
    sideResults: normalizeSideResults(v.sideResults),
    completedRounds: Array.isArray(v.completedRounds) ? v.completedRounds : [],
    stageEpoch: finiteNumber(v.stageEpoch) ?? 1,
    freshCountdownRequired: typeof v.freshCountdownRequired === 'boolean' ? v.freshCountdownRequired : true,
    interruptedAttemptIds: Array.isArray(v.interruptedAttemptIds)
      ? v.interruptedAttemptIds.filter((item): item is string => typeof item === 'string')
      : [],
    ignoredStaleActionCount: finiteNumber(v.ignoredStaleActionCount) ?? 0,
  };
}

export function isBothSidesDosePlan(value: unknown): value is BothSidesDosePlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<BothSidesDosePlan>;
  if (plan.version !== TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION) return false;
  if (typeof plan.exerciseId !== 'string') return false;
  if (plan.initialStartSide !== 'left' && plan.initialStartSide !== 'right') return false;
  if (!Array.isArray(plan.rounds)) return false;
  if (typeof plan.planFingerprint !== 'string') return false;
  const expected = planFingerprint(plan as BothSidesDosePlan);
  return plan.planFingerprint === expected;
}

function normalizeSideResults(
  value: unknown
): Partial<Record<TrainingRoundSide, TrainingSideSegmentResult>> {
  if (!value || typeof value !== 'object') return {};
  const source = value as Partial<Record<TrainingRoundSide, TrainingSideSegmentResult>>;
  const out: Partial<Record<TrainingRoundSide, TrainingSideSegmentResult>> = {};
  if (source.left?.side === 'left') out.left = source.left;
  if (source.right?.side === 'right') out.right = source.right;
  return out;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
