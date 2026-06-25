import {
  getTrainingVoiceContractV21,
  TRAINING_VOICE_SHARED_LOGICAL_CUES_V21,
} from './contracts';
import { resolveTrainingVoiceRuntimeReadinessV21 } from './readiness';
import { resolveTrainingVoiceSafetyV21 } from './safetyPolicy';
import { resolveTrainingVoiceTargetV21, type TrainingVoicePrescribedTargetV21 } from './targetGrammar';
import {
  voiceSideVariantForExercise,
  type BothSidesDosePlan,
  type TrainingRoundSide,
} from '../bothSidesRounds';
import {
  setStartLeadForIndex,
  stepUpWrongLeadCueKey,
  type StepUpAlternationPlan,
  type StepUpLeadSide,
} from '../stepUpAlternation';
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

export interface TrainingVoiceBothSidesContextV21 {
  readonly dosePlan: BothSidesDosePlan;
  readonly roundIndex: number;
  readonly currentSide: TrainingRoundSide;
  readonly sideChanged?: boolean;
}

export interface TrainingVoiceStepUpContextV21 {
  readonly plan: StepUpAlternationPlan;
  readonly setIndex: number;
  readonly startLeadSide?: StepUpLeadSide | null;
  readonly expectedLeadSide?: StepUpLeadSide | null;
}

export interface PlanTrainingVoiceSequenceV21Input {
  readonly exerciseId: string;
  readonly exposure: 'first_use' | 'later_set' | 'repeat_instructions' | 'wrong_lead_correction';
  readonly prescription?: TrainingVoicePrescribedTargetV21 | null;
  readonly sideContext?: TrainingVoiceSideContextV21 | null;
  readonly bothSidesContext?: TrainingVoiceBothSidesContextV21 | null;
  readonly stepUpContext?: TrainingVoiceStepUpContextV21 | null;
  readonly sessionMemory?: TrainingVoiceSessionMemoryV21 | null;
}

export function planTrainingVoiceSequenceV21(
  input: PlanTrainingVoiceSequenceV21Input
): TrainingVoiceSequencePlanV21 {
  const contract = getTrainingVoiceContractV21(input.exerciseId);
  const variantFromBothSides = input.bothSidesContext
    ? voiceSideVariantForExercise(input.exerciseId, input.bothSidesContext.currentSide) as TrainingVoiceSideVariantIdV21 | null
    : null;
  const targetPlan = resolveTrainingVoiceTargetV21({
    contract,
    prescribedTarget: input.prescription,
    bothSidesDosePlan: input.bothSidesContext?.dosePlan,
    bothSidesRoundIndex: input.bothSidesContext?.roundIndex,
    bothSidesCurrentSide: input.bothSidesContext?.currentSide,
    stepUpAlternationPlan: input.stepUpContext?.plan,
  });
  const runtimeReadiness = resolveTrainingVoiceRuntimeReadinessV21({
    exerciseId: input.exerciseId,
    prescribedTarget: input.prescription,
    bothSidesDosePlan: input.bothSidesContext?.dosePlan,
    stepUpAlternationPlan: input.stepUpContext?.plan,
  });
  const safety = resolveTrainingVoiceSafetyV21({
    contract,
    sessionMemory: input.sessionMemory,
  });
  const entries: TrainingVoiceSequenceEntryV21[] = [];
  const targetCue = {
    ...contract.targetCue,
    exactScript: targetPlan.spokenText,
  };

  if (input.exposure === 'wrong_lead_correction') {
    entries.push(required(sharedCue(stepUpWrongLeadCueKey(stepUpExpectedLeadSide(input.stepUpContext)))));
    entries.push(required(sharedCue('final-position-set-v21')));
  } else if (input.exposure === 'first_use') {
    entries.push(required(contract.firstUseCue));
    const variant = currentSideVariant(currentVariantForInput(input, variantFromBothSides), contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
    if (variant) entries.push(required(variant.cue));
    if (safety.logicalCueKey && safety.exactScript) {
      entries.push(required(cueFor(safety.logicalCueKey, safety.exactScript)));
    }
    if (contract.finalPositionRequired) {
      entries.push(required(sharedCue('final-position-set-v21')));
    }
    entries.push(required(targetCue));
  } else if (input.exposure === 'later_set') {
    const bothSidesChanged = input.bothSidesContext?.sideChanged ?? false;
    if (input.bothSidesContext && contract.sidePlan.required && bothSidesChanged) {
      if (contract.sidePlan.switchCue) entries.push(required(contract.sidePlan.switchCue));
      const variant = currentSideVariant(variantFromBothSides, contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
      if (variant) entries.push(required(variant.cue));
      if (contract.finalPositionRequired) entries.push(required(sharedCue('final-position-set-v21')));
    } else {
      entries.push(required(contract.laterSetCue));
      const variant = input.bothSidesContext || input.stepUpContext
        ? currentSideVariant(currentVariantForInput(input, variantFromBothSides), contract.sidePlan.defaultVariantId, contract.sidePlan.variants)
        : null;
      if (variant) entries.push(required(variant.cue));
      if ((input.bothSidesContext || input.stepUpContext) && contract.finalPositionRequired) {
        entries.push(required(sharedCue('final-position-set-v21')));
      } else if (contract.sidePlan.required && input.sideContext?.sideChanged) {
        if (contract.sidePlan.switchCue) entries.push(required(contract.sidePlan.switchCue));
        const sideVariant = currentSideVariant(input.sideContext.currentVariantId, contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
        if (sideVariant) entries.push(required(sideVariant.cue));
      }
    }
    entries.push(required(targetCue));
  } else {
    entries.push(required(contract.firstUseCue));
    const variant = currentSideVariant(currentVariantForInput(input, variantFromBothSides), contract.sidePlan.defaultVariantId, contract.sidePlan.variants);
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
    safetyPlan: contract.safetyPlan,
    setupModel: contract.setupModel,
    implementationBlockers,
    assetBlockers,
    runtimeReadiness,
    ready: runtimeReadiness.selectable,
    reasonCodes: unique(reasonCodes),
  };
}

function currentVariantForInput(
  input: PlanTrainingVoiceSequenceV21Input,
  variantFromBothSides: TrainingVoiceSideVariantIdV21 | null
): TrainingVoiceSideVariantIdV21 | null | undefined {
  if (input.stepUpContext) return stepUpStartLeadSide(input.stepUpContext);
  return variantFromBothSides ?? input.sideContext?.currentVariantId;
}

function stepUpStartLeadSide(context: TrainingVoiceStepUpContextV21): StepUpLeadSide {
  return context.startLeadSide ?? setStartLeadForIndex(context.plan, context.setIndex);
}

function stepUpExpectedLeadSide(context: TrainingVoiceStepUpContextV21 | null | undefined): StepUpLeadSide {
  if (!context) return 'left';
  return context.expectedLeadSide ?? stepUpStartLeadSide(context);
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
