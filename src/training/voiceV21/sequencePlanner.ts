import {
  getTrainingVoiceContractV21,
  TRAINING_VOICE_SHARED_LOGICAL_CUES_V21,
} from './contracts';
import { resolveTrainingVoiceRuntimeReadinessV21 } from './readiness';
import {
  EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
  normalizeTrainingVoiceSafetySessionMemoryV21,
  resolveTrainingVoiceSafetyV21,
} from './safetyPolicy';
import { resolveTrainingVoiceTargetV21, type TrainingVoicePrescribedTargetV21 } from './targetGrammar';
import type {
  TrainingVoiceLogicalCueV21,
  TrainingVoiceSequenceEntryV21,
  TrainingVoiceSequencePlanV21,
  TrainingVoiceSessionMemoryV21,
  TrainingVoiceSideVariantIdV21,
} from './types';

export interface TrainingVoiceSideContextV21 {
  readonly currentVariantId?: TrainingVoiceSideVariantIdV21 | null;
  readonly sideChanged?: boolean;
}

export interface PlanTrainingVoiceSequenceV21Input {
  readonly exerciseId: string;
  readonly exposure: 'first_use' | 'later_set' | 'repeat_instructions';
  readonly prescription?: TrainingVoicePrescribedTargetV21 | null;
  readonly sideContext?: TrainingVoiceSideContextV21 | null;
  readonly sessionMemory?: TrainingVoiceSessionMemoryV21 | null;
}

export interface TrainingVoiceSessionEntrySequencePlanV21 {
  readonly cueKeys: readonly string[];
  readonly scripts: readonly string[];
  readonly entries: readonly TrainingVoiceSequenceEntryV21[];
  readonly required: boolean;
  readonly universalSafetyDue: boolean;
  readonly ready: boolean;
  readonly reasonCodes: readonly string[];
}

export function planTrainingVoiceSessionEntrySequenceV21(input: {
  readonly sessionMemory?: TrainingVoiceSessionMemoryV21 | unknown | null;
} = {}): TrainingVoiceSessionEntrySequencePlanV21 {
  const memory = normalizeTrainingVoiceSafetySessionMemoryV21(input.sessionMemory);
  if (!memory) {
    return {
      cueKeys: [],
      scripts: [],
      entries: [],
      required: true,
      universalSafetyDue: true,
      ready: false,
      reasonCodes: ['MALFORMED_SAFETY_MEMORY'],
    };
  }
  if (memory.universalSafety === 'completed') {
    return {
      cueKeys: [],
      scripts: [],
      entries: [],
      required: false,
      universalSafetyDue: false,
      ready: true,
      reasonCodes: ['UNIVERSAL_SAFETY_ALREADY_COMPLETED'],
    };
  }
  const entries = [required(sharedCue('training-intro-v21')), required(sharedCue('safe-session-start-v21'))];
  return {
    cueKeys: entries.map((entry) => entry.cue.key),
    scripts: entries.map((entry) => entry.cue.exactScript),
    entries,
    required: true,
    universalSafetyDue: true,
    ready: true,
    reasonCodes: ['UNIVERSAL_SAFETY_DUE'],
  };
}

export function planTrainingVoiceSequenceV21(
  input: PlanTrainingVoiceSequenceV21Input
): TrainingVoiceSequencePlanV21 {
  const contract = getTrainingVoiceContractV21(input.exerciseId);
  const targetPlan = resolveTrainingVoiceTargetV21({
    contract,
    prescribedTarget: input.prescription,
  });
  const runtimeReadiness = resolveTrainingVoiceRuntimeReadinessV21({
    exerciseId: input.exerciseId,
    prescribedTarget: input.prescription,
  });
  const safety = resolveTrainingVoiceSafetyV21({
    contract,
    sessionMemory: input.sessionMemory ?? EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
  });
  const entries: TrainingVoiceSequenceEntryV21[] = [];
  const targetCue = {
    ...contract.targetCue,
    exactScript: targetPlan.spokenText,
  };

  if (input.exposure === 'first_use') {
    const leadWithSafety = shouldLeadWithSafetyCue(contract.setupModel, safety.logicalCueKey, safety.exactScript);
    if (leadWithSafety && safety.logicalCueKey && safety.exactScript) {
      entries.push(required(cueFor(safety.logicalCueKey, safety.exactScript)));
    }
    entries.push(required(contract.firstUseCue));
    const variant = currentSideVariant(input.sideContext?.currentVariantId, contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
    if (variant) entries.push(required(variant.cue));
    if (!leadWithSafety && safety.logicalCueKey && safety.exactScript) {
      entries.push(required(cueFor(safety.logicalCueKey, safety.exactScript)));
    }
    if (contract.finalPositionRequired) {
      entries.push(required(sharedCue('final-position-set-v21')));
    }
    entries.push(required(targetCue));
  } else if (input.exposure === 'later_set') {
    entries.push(required(contract.laterSetCue));
    if (contract.sidePlan.required && input.sideContext?.sideChanged) {
      if (contract.sidePlan.switchCue) entries.push(required(contract.sidePlan.switchCue));
      const sideVariant = currentSideVariant(input.sideContext.currentVariantId, contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
      if (sideVariant) entries.push(required(sideVariant.cue));
    }
    entries.push(required(targetCue));
  } else {
    entries.push(required(contract.firstUseCue));
    const variant = currentSideVariant(input.sideContext?.currentVariantId, contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
    if (variant) entries.push(required(variant.cue));
    entries.push(required(targetCue));
  }

  const assetBlockers = runtimeReadiness.blockers.filter((blocker) => blocker.startsWith('missing_audio:'));
  const implementationBlockers = contract.implementationRequirements.slice();
  const reasonCodes = [
    ...targetPlan.reasonCodes,
    ...safety.reasonCodes,
    ...runtimeReadiness.blockers,
    `exposure:${input.exposure}`,
  ];
  return {
    exerciseId: contract.exerciseId,
    exposure: input.exposure,
    cueKeys: entries.map((entry) => entry.cue.key),
    scripts: entries.map((entry) => entry.cue.exactScript),
    entries,
    targetPlan,
    sidePlan: contract.sidePlan,
    safetyPlan: safety,
    setupModel: contract.setupModel,
    implementationBlockers,
    assetBlockers,
    runtimeReadiness,
    ready: runtimeReadiness.selectable && safety.ready,
    reasonCodes: unique(reasonCodes),
  };
}

function shouldLeadWithSafetyCue(
  setupModel: ReturnType<typeof getTrainingVoiceContractV21>['setupModel'],
  cueKey: string | null,
  exactScript: string | null
): boolean {
  return (
    !!cueKey &&
    !!exactScript &&
    (
      setupModel === 'material_setup' ||
      setupModel === 'chair_setup' ||
      setupModel === 'floor_setup' ||
      setupModel === 'step_setup' ||
      setupModel === 'band_setup'
    )
  );
}

function required(cue: TrainingVoiceLogicalCueV21): TrainingVoiceSequenceEntryV21 {
  return { cue, required: true, optional: false };
}

function currentSideVariant(
  requested: TrainingVoiceSideVariantIdV21 | null | undefined,
  fallback: TrainingVoiceSideVariantIdV21 | null,
  variants: readonly { readonly variantId: TrainingVoiceSideVariantIdV21; readonly cue: TrainingVoiceLogicalCueV21 }[]
): { readonly variantId: TrainingVoiceSideVariantIdV21; readonly cue: TrainingVoiceLogicalCueV21 } | null {
  if (variants.length === 0) return null;
  return (
    variants.find((variant) => variant.variantId === requested) ??
    variants.find((variant) => variant.variantId === fallback) ??
    variants[0] ??
    null
  );
}

function sharedCue(key: string): TrainingVoiceLogicalCueV21 {
  const cue = TRAINING_VOICE_SHARED_LOGICAL_CUES_V21.find((item) => item.key === key);
  if (!cue) throw new Error(`missing shared Training Voice V2.1 cue '${key}'`);
  return cue;
}

function cueFor(key: string, exactScript: string): TrainingVoiceLogicalCueV21 {
  const existing = TRAINING_VOICE_SHARED_LOGICAL_CUES_V21.find((item) => item.key === key);
  if (existing) return existing;
  return {
    key,
    exactScript,
    category: 'equipment_first_use',
    policyId: 'instruction',
    requiredForVoiceFirst: true,
  };
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
