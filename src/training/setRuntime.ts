import type {
  ExerciseDefinition,
  ExerciseSetGrader,
  SetGraderUpdate,
  SetResult,
} from '../exercises';
import type { PipelineFrameOutput } from '../pose/pipeline';

export type TrainingVoiceRuntimeMode = 'legacy' | 'internal_v21';

export interface TrainingSetRuntimeGeneratedExercise {
  readonly exerciseId: string;
  /** Daily generated dose. The player honors these over the catalog prescription. */
  readonly sets?: number;
  readonly repsPerSet?: number;
  readonly secondsPerSet?: number;
  readonly restSeconds?: number;
}

export interface TrainingSetRuntimeCapabilities {
  readonly internalFloorSetupReady?: boolean;
  readonly internalTrainingVoiceBehaviorReady?: boolean;
  readonly poseEvidenceAdapterAvailable?: boolean;
}

export type SerializedTrainingSetRuntime = { readonly kind: 'legacy'; readonly schemaVersion: 1 };

export interface TrainingSetRuntimeUpdate {
  readonly setUpdate: SetGraderUpdate;
  readonly acceptedRepEvent?: {
    readonly repAttemptId: string;
    readonly repCount: number;
  };
}

export interface TrainingSetRuntime {
  readonly kind: 'legacy';
  update(frame: PipelineFrameOutput): TrainingSetRuntimeUpdate;
  pause(atMs: number): TrainingSetRuntimeUpdate;
  resume(atMs: number): TrainingSetRuntimeUpdate;
  cancel(atMs: number): TrainingSetRuntimeUpdate;
  finish(atMs: number): SetResult;
  serialize(): SerializedTrainingSetRuntime;
}

export interface TrainingSetRuntimeSelection {
  readonly kind: 'legacy';
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

/**
 * Every training set now runs through the single legacy grader path. The
 * alternative step-up-alternation runtime was parked; this stays a function so
 * the player's call site and the serialized-runtime envelope are unchanged.
 */
export function selectTrainingSetRuntime(_input: SelectTrainingSetRuntimeInput): TrainingSetRuntimeSelection {
  return { kind: 'legacy', reasonCodes: ['legacy_only'] };
}

export function createTrainingSetRuntime(
  input: SelectTrainingSetRuntimeInput & { readonly setIndex: number }
): TrainingSetRuntime {
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
