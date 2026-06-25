import type { BothSidesDosePlan } from './types';

export const TRAINING_BOTH_SIDES_ROUNDS_FEATURE_FLAG =
  'EXPO_PUBLIC_ENABLE_TRAINING_BOTH_SIDES_ROUNDS' as const;
export const TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_READY = true as const;
export const TRAINING_BOTH_SIDES_ROUNDS_DEFAULT_ENABLED = false as const;

export interface TrainingBothSidesRoundsSelection {
  readonly mode: 'legacy' | 'both_sides_rounds_internal';
  readonly featureEnabled: boolean;
  readonly internalV21RuntimeReady: boolean;
  readonly selectable: boolean;
  readonly reasonCodes: readonly string[];
}

export function isTrainingBothSidesRoundsFeatureEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const raw = env[TRAINING_BOTH_SIDES_ROUNDS_FEATURE_FLAG];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}

export function selectTrainingBothSidesRoundsMode(input: {
  readonly featureEnabled?: boolean;
  readonly internalV21RuntimeReady?: boolean;
  readonly plans?: readonly BothSidesDosePlan[];
}): TrainingBothSidesRoundsSelection {
  const featureEnabled = input.featureEnabled ?? isTrainingBothSidesRoundsFeatureEnabled();
  const internalV21RuntimeReady = input.internalV21RuntimeReady ?? false;
  const plans = input.plans ?? [];
  const reasonCodes: string[] = [];
  if (!featureEnabled) reasonCodes.push('feature_flag_off');
  if (!internalV21RuntimeReady) reasonCodes.push('internal_v21_runtime_not_ready');
  for (const plan of plans) {
    if (!plan.runtimeSelectable) reasonCodes.push(`dose_plan_blocked:${plan.exerciseId}`);
  }
  const selectable =
    featureEnabled &&
    internalV21RuntimeReady &&
    TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_READY &&
    plans.every((plan) => plan.runtimeSelectable);
  return {
    mode: selectable ? 'both_sides_rounds_internal' : 'legacy',
    featureEnabled,
    internalV21RuntimeReady,
    selectable,
    reasonCodes: unique(reasonCodes),
  };
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
