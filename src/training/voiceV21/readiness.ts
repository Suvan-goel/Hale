import {
  getTrainingVoiceContractV21,
  maybeTrainingVoiceContractV21,
  validateTrainingVoiceContractRegistryV21,
} from './contracts';
import { requiredAssetCueKeysMissingForContractV21 } from './assets';
import { resolveTrainingVoiceTargetV21, type TrainingVoicePrescribedTargetV21 } from './targetGrammar';
import type { BothSidesDosePlan } from '../bothSidesRounds';
import type { StepUpAlternationPlan } from '../stepUpAlternation';
import type {
  TrainingVoiceExerciseContractV21,
  TrainingVoiceRuntimeReadinessV21,
} from './types';

export const TRAINING_VOICE_V2_1_FEATURE_FLAG = 'EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1' as const;
export const TRAINING_VOICE_V2_1_AUDIO_READY = false as const;
export const TRAINING_VOICE_V2_1_BEHAVIOR_READY = false as const;
export const TRAINING_VOICE_V2_1_FOUNDATION_STATUS =
  'founder_assumed_accepted_for_implementation_audio_not_approved' as const;

export interface ResolveTrainingVoiceRuntimeReadinessV21Input {
  readonly exerciseId: string;
  readonly prescribedTarget?: TrainingVoicePrescribedTargetV21 | null;
  readonly bothSidesDosePlan?: BothSidesDosePlan | null;
  readonly stepUpAlternationPlan?: StepUpAlternationPlan | null;
}

export function resolveTrainingVoiceRuntimeReadinessV21(
  input: ResolveTrainingVoiceRuntimeReadinessV21Input
): TrainingVoiceRuntimeReadinessV21 {
  const contract = maybeTrainingVoiceContractV21(input.exerciseId);
  if (!contract) {
    return {
      exerciseId: input.exerciseId,
      softwareContractValid: false,
      behaviorReady: false,
      targetReady: false,
      safetyPlanReady: false,
      audioReady: false,
      selectable: false,
      blockers: [`missing_contract:${input.exerciseId}`],
      legacyFallbackAvailable: true,
      notes: 'Unknown exercise fails closed for Training Voice V2.1.',
    };
  }
  return readinessForContract(contract, input.prescribedTarget, input.bothSidesDosePlan, input.stepUpAlternationPlan);
}

export function resolveTrainingVoiceRuntimeReadinessForContractV21(
  contract: TrainingVoiceExerciseContractV21,
  prescribedTarget?: TrainingVoicePrescribedTargetV21 | null,
  bothSidesDosePlan?: BothSidesDosePlan | null,
  stepUpAlternationPlan?: StepUpAlternationPlan | null
): TrainingVoiceRuntimeReadinessV21 {
  return readinessForContract(contract, prescribedTarget, bothSidesDosePlan, stepUpAlternationPlan);
}

export interface TrainingVoiceRuntimeSelectionV21 {
  readonly mode: 'legacy' | 'training_voice_v2_1';
  readonly featureEnabled: boolean;
  readonly reasonCodes: readonly string[];
  readonly itemReadiness: readonly TrainingVoiceRuntimeReadinessV21[];
  readonly v21Selectable: boolean;
}

export function selectTrainingVoiceRuntimeModeV21(input: {
  readonly exerciseIds: readonly string[];
  readonly prescribedTargetsByExerciseId?: Readonly<Record<string, TrainingVoicePrescribedTargetV21>>;
  readonly featureEnabled?: boolean;
}): TrainingVoiceRuntimeSelectionV21 {
  const featureEnabled = input.featureEnabled ?? isTrainingVoiceV21FeatureEnabled();
  const registry = validateTrainingVoiceContractRegistryV21();
  const itemReadiness = input.exerciseIds.map((exerciseId) =>
    resolveTrainingVoiceRuntimeReadinessV21({
      exerciseId,
      prescribedTarget: input.prescribedTargetsByExerciseId?.[exerciseId],
    })
  );
  const reasonCodes: string[] = [];
  if (!featureEnabled) reasonCodes.push('feature_flag_off');
  if (!registry.valid) reasonCodes.push('registry_invalid');
  if (!TRAINING_VOICE_V2_1_AUDIO_READY) reasonCodes.push('audio_ready_false');
  if (!TRAINING_VOICE_V2_1_BEHAVIOR_READY) reasonCodes.push('behavior_ready_false');
  for (const readiness of itemReadiness) {
    if (!readiness.selectable) reasonCodes.push(...readiness.blockers);
  }
  const v21Selectable =
    featureEnabled &&
    registry.valid &&
    itemReadiness.length > 0 &&
    itemReadiness.every((readiness) => readiness.selectable);
  return {
    mode: v21Selectable ? 'training_voice_v2_1' : 'legacy',
    featureEnabled,
    reasonCodes: unique(reasonCodes),
    itemReadiness,
    v21Selectable,
  };
}

export function isTrainingVoiceV21FeatureEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const raw = env[TRAINING_VOICE_V2_1_FEATURE_FLAG];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}

function readinessForContract(
  contract: TrainingVoiceExerciseContractV21,
  prescribedTarget?: TrainingVoicePrescribedTargetV21 | null,
  bothSidesDosePlan?: BothSidesDosePlan | null,
  stepUpAlternationPlan?: StepUpAlternationPlan | null
): TrainingVoiceRuntimeReadinessV21 {
  const registry = validateTrainingVoiceContractRegistryV21();
  const targetPlan = resolveTrainingVoiceTargetV21({ contract, prescribedTarget, bothSidesDosePlan, stepUpAlternationPlan });
  const missingAudioCueKeys = requiredAssetCueKeysMissingForContractV21(contract);
  const behaviorBlockers = contract.implementationRequirements
    .filter((requirement) => requirement !== 'IR-VOICE-AUDIO-ASSETS')
    .map((requirement) => `behavior_dependency:${requirement}`);
  const blockers: string[] = [];
  if (!registry.valid) blockers.push('registry_invalid');
  if (!targetPlan.supported) blockers.push(...targetPlan.reasonCodes.map((reason) => `target:${reason}`));
  if (bothSidesDosePlan && !bothSidesDosePlan.runtimeSelectable) {
    blockers.push(`behavior_dependency:DOSE_PLAN_UNREPRESENTABLE:${bothSidesDosePlan.exerciseId}`);
  }
  if (stepUpAlternationPlan && !stepUpAlternationPlan.runtimeSelectable) {
    blockers.push(`behavior_dependency:STEP_UP_ALTERNATION_PLAN_BLOCKED:${stepUpAlternationPlan.exerciseId}`);
  }
  if (behaviorBlockers.length > 0) blockers.push(...behaviorBlockers);
  if (!TRAINING_VOICE_V2_1_BEHAVIOR_READY) blockers.push('global_behavior_ready_false');
  if (!TRAINING_VOICE_V2_1_AUDIO_READY) blockers.push('global_audio_ready_false');
  for (const cueKey of missingAudioCueKeys) blockers.push(`missing_audio:${cueKey}`);
  const behaviorReady =
    TRAINING_VOICE_V2_1_BEHAVIOR_READY &&
    behaviorBlockers.length === 0 &&
    contract.runtimeStatus === 'software_ready_audio_pending';
  const audioReady = TRAINING_VOICE_V2_1_AUDIO_READY && missingAudioCueKeys.length === 0;
  const targetReady = targetPlan.supported;
  const safetyPlanReady = contract.safetyPlan.family !== undefined;
  const softwareContractValid = registry.valid && contract.semanticMatch;
  return {
    exerciseId: contract.exerciseId,
    softwareContractValid,
    behaviorReady,
    targetReady,
    safetyPlanReady,
    audioReady,
    selectable: softwareContractValid && behaviorReady && targetReady && safetyPlanReady && audioReady,
    blockers: unique(blockers),
    legacyFallbackAvailable: true,
    notes:
      blockers.length === 0
        ? 'Training Voice V2.1 item is selectable.'
        : 'Training Voice V2.1 item is blocked and must use the legacy voice path.',
  };
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
