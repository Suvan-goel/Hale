import type {
  ExerciseDefinition,
  ExerciseSetGrader,
  SetGraderUpdate,
  SetResult,
} from '../exercises';
import type { PipelineFrameOutput } from '../pose/pipeline';
import {
  isStepUpAlternationPlan,
  planFingerprint,
  selectTrainingStepUpAlternationMode,
  type StepUpAlternationPlan,
  type StepUpLeadSide,
} from './stepUpAlternation';
import {
  StepUpAlternationSetRuntime,
  type SerializedStepUpAlternationSetRuntime,
  type StepUpAlternationRuntimeUpdate,
} from './stepUpAlternation/runtime';

export type TrainingVoiceRuntimeMode = 'legacy' | 'internal_v21';

export interface TrainingSetRuntimeGeneratedExercise {
  readonly exerciseId: string;
  readonly stepUpAlternationPlan?: StepUpAlternationPlan;
  readonly stepUpInitialLeadSide?: StepUpLeadSide;
}

export interface TrainingSetRuntimeCapabilities {
  readonly internalStepUpAlternationReady?: boolean;
  readonly internalFloorSetupReady?: boolean;
  readonly internalTrainingVoiceBehaviorReady?: boolean;
  readonly poseEvidenceAdapterAvailable?: boolean;
}

export type SerializedTrainingSetRuntime =
  | { readonly kind: 'legacy'; readonly schemaVersion: 1 }
  | SerializedStepUpAlternationSetRuntime;

export interface TrainingSetRuntimeUpdate {
  readonly setUpdate: SetGraderUpdate;
  readonly acceptedRepEvent?: {
    readonly repAttemptId: string;
    readonly repCount: number;
  };
  readonly correction?: StepUpAlternationRuntimeUpdate['correction'];
  readonly stepUpContext?: StepUpAlternationRuntimeUpdate['stepUpContext'];
}

export interface TrainingSetRuntime {
  readonly kind: 'legacy' | 'step_up_alternation';
  update(frame: PipelineFrameOutput): TrainingSetRuntimeUpdate;
  pause(atMs: number): TrainingSetRuntimeUpdate;
  resume(atMs: number): TrainingSetRuntimeUpdate;
  cancel(atMs: number): TrainingSetRuntimeUpdate;
  finish(atMs: number): SetResult;
  serialize(): SerializedTrainingSetRuntime;
}

export interface TrainingSetRuntimeSelection {
  readonly kind: 'legacy' | 'step_up_alternation';
  readonly reasonCodes: readonly string[];
}

export interface SelectTrainingSetRuntimeInput {
  readonly exerciseDefinition: ExerciseDefinition;
  readonly generatedExercise?: TrainingSetRuntimeGeneratedExercise | null;
  readonly featureEnabled?: boolean;
  readonly trainingVoiceMode?: TrainingVoiceRuntimeMode;
  readonly runtimeCapabilities?: TrainingSetRuntimeCapabilities;
  readonly restoredRuntime?: SerializedTrainingSetRuntime | null;
}

export function selectTrainingSetRuntime(input: SelectTrainingSetRuntimeInput): TrainingSetRuntimeSelection {
  const reasonCodes: string[] = [];
  const generated = input.generatedExercise;
  const plan = generated?.stepUpAlternationPlan;
  const voiceMode = input.trainingVoiceMode ?? 'legacy';
  const capabilities = input.runtimeCapabilities ?? {};
  if (input.exerciseDefinition.id !== 'step-up') reasonCodes.push('not_step_up');
  if (voiceMode !== 'internal_v21') reasonCodes.push('legacy_voice_mode');
  if (!capabilities.poseEvidenceAdapterAvailable) reasonCodes.push('pose_evidence_adapter_unavailable');
  if (!plan) reasonCodes.push('missing_step_up_alternation_plan');
  if (input.restoredRuntime?.kind === 'legacy') reasonCodes.push('existing_legacy_session');
  if (plan && !isStepUpAlternationPlan(plan)) reasonCodes.push('invalid_step_up_plan_fingerprint');
  if (plan && !planMatchesDefinition(plan, input.exerciseDefinition)) reasonCodes.push('source_prescription_mismatch');

  const gated = selectTrainingStepUpAlternationMode({
    featureEnabled: input.featureEnabled,
    internalV21RuntimeReady: capabilities.internalStepUpAlternationReady === true,
    plans: plan ? [plan] : [],
  });
  reasonCodes.push(...gated.reasonCodes);

  const selectable =
    input.exerciseDefinition.id === 'step-up' &&
    voiceMode === 'internal_v21' &&
    capabilities.poseEvidenceAdapterAvailable === true &&
    !!plan &&
    isStepUpAlternationPlan(plan) &&
    planMatchesDefinition(plan, input.exerciseDefinition) &&
    input.restoredRuntime?.kind !== 'legacy' &&
    gated.selectable;

  return {
    kind: selectable ? 'step_up_alternation' : 'legacy',
    reasonCodes: unique(reasonCodes),
  };
}

export function createTrainingSetRuntime(input: SelectTrainingSetRuntimeInput & { readonly setIndex: number }): TrainingSetRuntime {
  const selection = selectTrainingSetRuntime(input);
  if (selection.kind === 'step_up_alternation' && input.generatedExercise?.stepUpAlternationPlan) {
    return new StepUpAlternationSetRuntime({
      plan: input.generatedExercise.stepUpAlternationPlan,
      setIndex: input.setIndex,
      restored: input.restoredRuntime?.kind === 'step_up_alternation' ? input.restoredRuntime : null,
    });
  }
  return new LegacyTrainingSetRuntime(input.exerciseDefinition.createGrader());
}

class LegacyTrainingSetRuntime implements TrainingSetRuntime {
  readonly kind = 'legacy' as const;

  constructor(private readonly grader: ExerciseSetGrader) {}

  update(frame: PipelineFrameOutput): TrainingSetRuntimeUpdate {
    return { setUpdate: this.grader.update(frame) };
  }

  pause(_atMs: number): TrainingSetRuntimeUpdate {
    return { setUpdate: legacyIdleUpdate() };
  }

  resume(_atMs: number): TrainingSetRuntimeUpdate {
    return { setUpdate: legacyIdleUpdate() };
  }

  cancel(_atMs: number): TrainingSetRuntimeUpdate {
    return { setUpdate: legacyIdleUpdate() };
  }

  finish(atMs: number): SetResult {
    return this.grader.finish(atMs);
  }

  serialize(): SerializedTrainingSetRuntime {
    return { kind: 'legacy', schemaVersion: 1 };
  }
}

function planMatchesDefinition(plan: StepUpAlternationPlan, def: ExerciseDefinition): boolean {
  const expectedSourceReps = def.prescription.repsPerSet ?? 0;
  if (plan.sourceSetCount !== def.prescription.sets) return false;
  if (plan.sourceTargetRepsPerSet !== expectedSourceReps) return false;
  return plan.planFingerprint === planFingerprint(plan);
}

function legacyIdleUpdate(): SetGraderUpdate {
  return {
    repCredited: false,
    repCount: 0,
    measuring: false,
    holdMs: 0,
    remainingMs: NaN,
    validTimeState: null,
    validTimeCaption: null,
    autoregulationStop: false,
    complete: false,
    voice: null,
  };
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
