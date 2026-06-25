import type { StepUpAlternationPlan } from './types';

export const TRAINING_STEP_UP_ALTERNATION_FEATURE_FLAG =
  'EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION' as const;
export const TRAINING_STEP_UP_ALTERNATION_SOFTWARE_READY = true as const;
export const TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED = false as const;

export interface TrainingStepUpAlternationSelection {
  readonly mode: 'legacy' | 'step_up_alternation_internal';
  readonly featureEnabled: boolean;
  readonly internalV21RuntimeReady: boolean;
  readonly selectable: boolean;
  readonly reasonCodes: readonly string[];
}

export function isTrainingStepUpAlternationFeatureEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const raw = env[TRAINING_STEP_UP_ALTERNATION_FEATURE_FLAG];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}

export function selectTrainingStepUpAlternationMode(input: {
  readonly featureEnabled?: boolean;
  readonly internalV21RuntimeReady?: boolean;
  readonly plans?: readonly StepUpAlternationPlan[];
}): TrainingStepUpAlternationSelection {
  const featureEnabled = input.featureEnabled ?? isTrainingStepUpAlternationFeatureEnabled();
  const internalV21RuntimeReady = input.internalV21RuntimeReady ?? false;
  const plans = input.plans ?? [];
  const reasonCodes: string[] = [];
  if (!featureEnabled) reasonCodes.push('feature_flag_off');
  if (!internalV21RuntimeReady) reasonCodes.push('internal_v21_runtime_not_ready');
  for (const plan of plans) {
    if (!plan.runtimeSelectable) reasonCodes.push(`step_up_alternation_plan_blocked:${plan.exerciseId}`);
  }
  const selectable =
    featureEnabled &&
    internalV21RuntimeReady &&
    TRAINING_STEP_UP_ALTERNATION_SOFTWARE_READY &&
    plans.every((plan) => plan.runtimeSelectable);
  return {
    mode: selectable ? 'step_up_alternation_internal' : 'legacy',
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
