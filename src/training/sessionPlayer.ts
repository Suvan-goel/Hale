/**
 * Training session player — the voice-guided home-workout orchestrator, the
 * training-side analogue of the Check-Up's CheckUpOrchestrator. Pure-TS,
 * frame-timestamp-driven state machine (so a recorded session replays the whole
 * flow deterministically), playing an ordered list of resolved exercise ids:
 *
 *   intro → [ transition → preflight → instructions →
 *             ( countdown → set → rest )×sets ]×items → complete → done
 *
 * Audio-first: after propping the phone the user never touches the screen. Each
 * item re-frames (placement memory — "same spot, you're framed"), a turn cue is
 * spoken when the camera view changes, sets auto-advance with spoken rest, rep
 * credits chime, and velocity autoregulation can end a strength set early
 * ("good, that's your set"). If setup can't get a clear reading in time, the
 * player latches a setup-issue state and waits for the screen/user to retry or
 * skip rather than silently advancing.
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { VoiceRequest } from '../assessment/sessionController';
import { ExerciseDefinition, SetResult, getExercise } from '../exercises';
import type { ValidTimeState } from '../exercises/validTime';
import { PipelineFrameOutput } from '../pose/pipeline';
import {
  MovementCameraReadinessTracker,
  type MovementCameraReadinessResult,
} from '../preflight/movementCameraReadiness';
import { PreflightCheck, PreflightPrompt, PreflightStatus } from '../preflight/preflight';
import { shouldSpeakFramingPrompt } from '../preflight/promptTiming';
import {
  SESSION_GLOBAL_SAFETY_CUE_IDS,
  plannedSafetyCueSnapshotForExercises,
  safetyCueTexts,
  type PlannedExerciseSafetyCueProfile,
  type PlannedSafetyCueSnapshot,
  type SafetyCueId,
} from './safetyCues';
import {
  createTrainingSetRuntime,
  type SerializedTrainingSetRuntime,
  type TrainingSetRuntime,
  type TrainingSetRuntimeCapabilities,
  type TrainingSetRuntimeGeneratedExercise,
  type TrainingVoiceRuntimeMode,
} from './setRuntime';
import {
  planTrainingVoiceSequenceV21,
  planTrainingVoiceSessionEntrySequenceV21,
} from './voiceV21';

export type TrainingPhase =
  | 'intro'
  | 'transition'
  | 'preflight'
  | 'instructions'
  | 'countdown'
  | 'set'
  | 'rest'
  | 'complete'
  | 'done';

export interface TrainingItemResult {
  exerciseId: string;
  status: 'completed' | 'skipped';
  /** One SetResult per completed set (empty when skipped). */
  sets: SetResult[];
}

export interface TrainingSessionResult {
  startedAt: string;
  items: TrainingItemResult[];
}

export type TrainingFloorEnvironment = 'standing' | 'floor' | 'unknown';

export type TrainingFinalPositionPhase =
  | 'not_required'
  | 'transition_instruction'
  | 'awaiting_user_transition'
  | 'movement_setup'
  | 'awaiting_visibility'
  | 'stabilizing'
  | 'ready'
  | 'audio_failure'
  | 'cancelled';

export interface TrainingFloorSetupSnapshot {
  readonly exerciseId: string;
  readonly itemIndex: number;
  readonly setIndex: number;
  readonly setupEpoch: number;
  readonly phase: TrainingFinalPositionPhase;
  readonly floorTransitionRequired: boolean;
  readonly userConfirmed: boolean;
  readonly movementReady: boolean;
  readonly finalPositionReadyAtMs: number | null;
  readonly stableForMs: number;
  readonly setupCaption: string | null;
  readonly actionLabel: string | null;
}

export interface TrainingFloorSessionMemory {
  readonly floorFamilyIntroduced: boolean;
  readonly currentEnvironment: TrainingFloorEnvironment;
  readonly currentFloorItemId: string | null;
  readonly currentFloorSetupEpoch: number;
}

export interface TrainingFrameUpdate {
  phase: TrainingPhase;
  itemIndex: number;
  /** 0-based set within the current item. */
  setIndex: number;
  totalSets: number;
  currentExerciseId: string | null;
  voice: VoiceRequest | null;
  playRepSound: boolean;
  repCount: number;
  /** Running maintained-hold ms (hold sets); 0 otherwise. */
  holdMs: number;
  /** ms left on a set capture clock or a rest timer; NaN otherwise. */
  remainingMs: number;
  measuring: boolean;
  validTimeState: ValidTimeState | null;
  validTimeCaption: string | null;
  /** True after setup has timed out and the UI must ask the user what to do. */
  setupIssue: boolean;
  /** Current preflight framing prompt for setup/framing UI. */
  setupPrompt: PreflightPrompt | null;
  /** Floor transfer/final-position gate state, present only for floor V2.1 setup. */
  floorSetup: TrainingFloorSetupSnapshot | null;
  /** Session-local floor setup memory used to avoid repeated transfer prompts. */
  floorMemory: TrainingFloorSessionMemory;
  /** Canonical safety cue ids surfaced with this update. Text resolves from the same ids. */
  safetyCueIds: readonly SafetyCueId[];
  safetyText: readonly string[];
  setRuntimeKind: 'legacy' | 'step_up_alternation' | null;
  stepUpContext: {
    readonly plan: import('./stepUpAlternation').StepUpAlternationPlan;
    readonly expectedLeadSide: 'left' | 'right';
    readonly startLeadSide: 'left' | 'right';
    readonly acceptedRepCount: number;
    readonly leftLeadRepCount: number;
    readonly rightLeadRepCount: number;
    readonly targetTotalReps: number;
  } | null;
  stepUpCorrection: {
    readonly code: 'wrong_lead' | 'return_both_feet_to_floor' | 'insufficient_lead_evidence';
    readonly expectedLeadSide: 'left' | 'right';
  } | null;
}

export interface TrainingPlayerConfig {
  promptRepeatMs: number;
  postInstructionsDwellMs: number;
  countdownStepMs: number;
  transitionDwellMs: number;
  /** An item stuck in pre-flight longer than this is skipped. */
  maxFramingMs: number;
  /** Hard cap on a grader-terminated set (reps/hold) so a wedged detector can't hang the session. */
  setSafetyMs: number;
}

export const DEFAULT_TRAINING_CONFIG: TrainingPlayerConfig = {
  promptRepeatMs: 10000,
  postInstructionsDwellMs: 2000,
  countdownStepMs: 1000,
  transitionDwellMs: 1500,
  maxFramingMs: 60000,
  setSafetyMs: 120000,
};

export const TRAINING_FLOOR_V2_1_FEATURE_FLAG = 'EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1' as const;

export function isTrainingFloorV21FeatureEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const raw = env[TRAINING_FLOOR_V2_1_FEATURE_FLAG];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}

export interface TrainingSessionPlayerOptions {
  readonly generatedExercises?: readonly TrainingSetRuntimeGeneratedExercise[];
  readonly trainingVoiceMode?: TrainingVoiceRuntimeMode;
  readonly runtimeCapabilities?: TrainingSetRuntimeCapabilities;
  readonly stepUpAlternationFeatureEnabled?: boolean;
  readonly floorV21FeatureEnabled?: boolean;
  readonly restoredSetRuntime?: SerializedTrainingSetRuntime | null;
}

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

export class TrainingSessionPlayer {
  private readonly config: TrainingPlayerConfig;
  private readonly startedAtIso: string;
  private readonly definitions: ExerciseDefinition[];
  private readonly preflight: PreflightCheck;
  private readonly movementReadiness = new MovementCameraReadinessTracker();
  private readonly results: TrainingItemResult[] = [];
  private readonly update_: TrainingFrameUpdate = {
    phase: 'intro',
    itemIndex: 0,
    setIndex: 0,
    totalSets: 0,
    currentExerciseId: null,
    voice: null,
    playRepSound: false,
    repCount: 0,
    holdMs: 0,
    remainingMs: NaN,
    measuring: false,
    validTimeState: null,
    validTimeCaption: null,
    setupIssue: false,
    setupPrompt: null,
    floorSetup: null,
    floorMemory: {
      floorFamilyIntroduced: false,
      currentEnvironment: 'unknown',
      currentFloorItemId: null,
      currentFloorSetupEpoch: 0,
    },
    safetyCueIds: [],
    safetyText: [],
    setRuntimeKind: null,
    stepUpContext: null,
    stepUpCorrection: null,
  };

  private phase: TrainingPhase = 'intro';
  private itemIndex = -1;
  private setIndex = 0;
  private introSpoken = false;
  private globalSafetySpoken = false;

  private transitionEnteredMs = 0;
  private transitionCuePending: VoiceCueKey | null = null;
  private itemEnteredMs = 0;
  private lastTimestampMs = 0;
  private setupIssue = false;
  private setupIssueRecoverySpoken = false;
  private floorSetup: TrainingFloorSetupSnapshot | null = null;
  private floorMemory: TrainingFloorSessionMemory = {
    floorFamilyIntroduced: false,
    currentEnvironment: 'unknown',
    currentFloorItemId: null,
    currentFloorSetupEpoch: 0,
  };

  private instructionsEnteredMs = 0;
  private instructionsIdleAtMs = -1;
  private lastPromptCue: VoiceCueKey | null = null;
  private lastPromptAtMs = -Infinity;

  private countdownStartMs = 0;
  private countdownStep = 0;
  private countdownAwaitingTrackedGo = false;
  private countdownAttemptOrdinal = 0;

  private runtime: TrainingSetRuntime | null = null;
  private setStartMs = 0;
  /** Fixed set duration (rom/timer capture window); null = grader-terminated. */
  private setDurationMs: number | null = null;
  private currentSets: SetResult[] = [];
  private lastValidTimeState: ValidTimeState | null = null;

  private restEnteredMs = 0;
  private restSpoken = false;
  private restDurationMs = 0;

  private completeSpoken = false;
  private finished: TrainingSessionResult | null = null;
  private readonly safetySnapshot: PlannedSafetyCueSnapshot;
  private readonly safetyByExerciseId: Map<string, PlannedExerciseSafetyCueProfile>;
  private readonly generatedByExerciseId: Map<string, TrainingSetRuntimeGeneratedExercise>;
  private readonly options: TrainingSessionPlayerOptions;

  constructor(
    startedAtIso: string,
    exerciseIds: readonly string[],
    preflight: PreflightCheck,
    config: TrainingPlayerConfig = DEFAULT_TRAINING_CONFIG,
    options: TrainingSessionPlayerOptions = {}
  ) {
    this.startedAtIso = startedAtIso;
    this.preflight = preflight;
    this.config = config;
    this.options = options;
    this.definitions = exerciseIds.map((id) => getExercise(id));
    this.generatedByExerciseId = new Map(
      (options.generatedExercises ?? []).map((exercise) => [exercise.exerciseId, exercise])
    );
    this.safetySnapshot = plannedSafetyCueSnapshotForExercises(exerciseIds);
    this.safetyByExerciseId = new Map(
      this.safetySnapshot.exerciseProfiles.map((profile) => [profile.exerciseId, profile])
    );
  }

  get result(): TrainingSessionResult | null {
    return this.finished;
  }

  retrySetup(): void {
    if (this.floorSetup && this.phase === 'instructions') {
      this.floorSetup = {
        ...this.floorSetup,
        phase: 'awaiting_user_transition',
        userConfirmed: false,
        movementReady: false,
        finalPositionReadyAtMs: null,
        stableForMs: 0,
        setupCaption: 'Move to the floor start position.',
        actionLabel: "I'm ready",
      };
      this.movementReadiness.reset();
      this.instructionsIdleAtMs = -1;
      return;
    }
    if (this.phase !== 'preflight') return;
    this.setupIssue = false;
    this.setupIssueRecoverySpoken = false;
    this.preflight.reset();
    this.itemEnteredMs = this.lastTimestampMs;
    this.lastPromptCue = null;
    this.lastPromptAtMs = -Infinity;
  }

  confirmFloorStartPosition(guard?: {
    readonly exerciseId?: string;
    readonly setIndex?: number;
    readonly setupEpoch?: number;
  }): boolean {
    if (!this.floorSetup || this.phase !== 'instructions') return false;
    if (guard?.exerciseId !== undefined && guard.exerciseId !== this.floorSetup.exerciseId) return false;
    if (guard?.setIndex !== undefined && guard.setIndex !== this.floorSetup.setIndex) return false;
    if (guard?.setupEpoch !== undefined && guard.setupEpoch !== this.floorSetup.setupEpoch) return false;
    if (
      this.floorSetup.phase === 'cancelled' ||
      this.floorSetup.phase === 'audio_failure' ||
      this.floorSetup.phase === 'not_required'
    ) {
      return false;
    }
    if (this.floorSetup.userConfirmed) return false;
    this.floorSetup = {
      ...this.floorSetup,
      phase: 'awaiting_visibility',
      userConfirmed: true,
      movementReady: false,
      finalPositionReadyAtMs: null,
      stableForMs: 0,
      setupCaption: 'Hold the start position.',
      actionLabel: null,
    };
    this.floorMemory = {
      ...this.floorMemory,
      currentEnvironment: 'floor',
      currentFloorItemId: this.floorSetup.exerciseId,
    };
    this.movementReadiness.reset();
    this.instructionsIdleAtMs = -1;
    return true;
  }

  skipCurrentItem(): boolean {
    if (this.itemIndex < 0 || this.itemIndex >= this.definitions.length) return false;
    if (
      this.phase === 'intro' ||
      this.phase === 'transition' ||
      this.phase === 'complete' ||
      this.phase === 'done'
    ) {
      return false;
    }
    this.cancelFloorSetup();
    this.countdownAwaitingTrackedGo = false;
    this.setupIssue = false;
    this.runtime?.cancel(this.lastTimestampMs);
    this.results.push({ exerciseId: this.definitions[this.itemIndex].id, status: 'skipped', sets: [] });
    this.currentSets = [];
    this.advanceItem(this.lastTimestampMs);
    return true;
  }

  pause(atMs: number = this.lastTimestampMs): void {
    if (this.phase === 'countdown' && this.countdownAwaitingTrackedGo) {
      this.countdownAwaitingTrackedGo = false;
      this.phase = 'instructions';
      this.instructionsEnteredMs = atMs;
      this.instructionsIdleAtMs = -1;
      return;
    }
    if (this.phase === 'set') this.runtime?.pause(atMs);
  }

  resume(atMs: number = this.lastTimestampMs): void {
    if (this.phase === 'set') this.runtime?.resume(atMs);
  }

  notifyCountdownGoPlaybackStarted(guard?: {
    readonly itemIndex?: number;
    readonly setIndex?: number;
    readonly attemptOrdinal?: number;
    readonly timestampMs?: number;
  }): boolean {
    if (!this.countdownAwaitingTrackedGo || this.phase !== 'countdown') return false;
    if (guard?.itemIndex !== undefined && guard.itemIndex !== this.itemIndex) return false;
    if (guard?.setIndex !== undefined && guard.setIndex !== this.setIndex) return false;
    if (guard?.attemptOrdinal !== undefined && guard.attemptOrdinal !== this.countdownAttemptOrdinal) return false;
    this.countdownAwaitingTrackedGo = false;
    this.beginSet(guard?.timestampMs ?? this.lastTimestampMs);
    return true;
  }

  serializeCurrentSetRuntime(): SerializedTrainingSetRuntime | null {
    return this.runtime?.serialize() ?? null;
  }

  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    this.transitionEnteredMs += deltaMs;
    this.itemEnteredMs += deltaMs;
    this.instructionsEnteredMs += deltaMs;
    if (this.instructionsIdleAtMs >= 0) this.instructionsIdleAtMs += deltaMs;
    if (Number.isFinite(this.lastPromptAtMs)) this.lastPromptAtMs += deltaMs;
    this.countdownStartMs += deltaMs;
    this.setStartMs += deltaMs;
    this.restEnteredMs += deltaMs;
    this.preflight.shiftTiming(deltaMs);
    this.movementReadiness.shiftTiming(deltaMs);
    if (this.floorSetup?.finalPositionReadyAtMs !== null && this.floorSetup?.finalPositionReadyAtMs !== undefined) {
      this.floorSetup = {
        ...this.floorSetup,
        finalPositionReadyAtMs: this.floorSetup.finalPositionReadyAtMs + deltaMs,
      };
    }
  }

  update(out: PipelineFrameOutput, voiceBusy: boolean): TrainingFrameUpdate {
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.remainingMs = NaN;
    u.measuring = false;
    u.validTimeState = null;
    u.validTimeCaption = null;
    u.setupIssue = this.setupIssue;
    u.setupPrompt = null;
    u.floorSetup = null;
    u.floorMemory = this.floorMemorySnapshot();
    u.safetyCueIds = [];
    u.safetyText = [];
    u.stepUpContext = null;
    u.stepUpCorrection = null;
    u.setRuntimeKind = this.runtime?.kind ?? null;
    const ts = out.frame.timestampMs;
    this.lastTimestampMs = ts;
    const status = this.preflight.update(out);

    switch (this.phase) {
      case 'intro':
        if (!this.introSpoken) {
          this.introSpoken = true;
          if (this.shouldUseTrackedTrainingVoiceBehaviorV21()) {
            const plan = planTrainingVoiceSessionEntrySequenceV21();
            u.voice = cueSequence(plan.ready ? voiceCueKeys(plan.cueKeys) : ['training-intro-v21', 'safe-session-start-v21']);
            this.globalSafetySpoken = true;
          } else {
            u.voice = cueSequence(['training-intro', 'support_keep_support_within_reach']);
          }
        } else if (!this.globalSafetySpoken && !voiceBusy) {
          this.globalSafetySpoken = true;
          this.emitSafety(u, SESSION_GLOBAL_SAFETY_CUE_IDS, true);
        } else if (!voiceBusy) {
          this.enterTransition(0, ts);
        }
        break;
      case 'transition':
        this.runTransition(ts, voiceBusy, u);
        break;
      case 'preflight':
        this.runPreflight(out, status, ts, voiceBusy, u);
        break;
      case 'instructions':
        this.runInstructions(out, voiceBusy, ts, u);
        break;
      case 'countdown':
        this.runCountdown(ts, u);
        break;
      case 'set':
        this.runSet(out, ts, u);
        break;
      case 'rest':
        this.runRest(ts, voiceBusy, u);
        break;
      case 'complete':
        if (!this.completeSpoken) {
      if (!voiceBusy) {
        this.completeSpoken = true;
            u.voice = cue(this.shouldUseTrackedTrainingVoiceBehaviorV21() ? 'session-complete-v21' : 'session-complete');
          }
        } else if (!voiceBusy) {
          this.finish();
          this.phase = 'done';
        }
        break;
      case 'done':
        break;
    }

    u.phase = this.phase;
    u.itemIndex = Math.max(0, this.itemIndex);
    u.setIndex = this.setIndex;
    const def = this.currentDefinition();
    u.totalSets = def ? def.prescription.sets : 0;
    u.currentExerciseId = def ? def.id : null;
    u.floorSetup = cloneFloorSetup(this.floorSetup);
    u.floorMemory = this.floorMemorySnapshot();
    return u;
  }

  private currentDefinition(): ExerciseDefinition | null {
    return this.itemIndex >= 0 && this.itemIndex < this.definitions.length
      ? this.definitions[this.itemIndex]
      : null;
  }

  private enterTransition(index: number, ts: number): void {
    const nextDefinition = this.definitions[index] ?? null;
    if (nextDefinition && !this.shouldUseFloorSetupV21(nextDefinition) && this.floorMemory.currentEnvironment === 'floor') {
      this.floorMemory = {
        ...this.floorMemory,
        currentEnvironment: 'unknown',
        currentFloorItemId: null,
      };
    }
    this.cancelFloorSetup();
    this.itemIndex = index;
    this.setIndex = 0;
    this.currentSets = [];
    this.phase = 'transition';
    this.transitionEnteredMs = ts;
    this.transitionCuePending = this.transitionCue(index);
    this.setupIssueRecoverySpoken = false;
    this.preflight.reset();
  }

  /** Turn cue when the view changes; a gentle "next" otherwise; none for item 0. */
  private transitionCue(index: number): VoiceCueKey | null {
    if (index === 0) return null; // the intro already invited them to begin
    const view = this.definitions[index].cameraView.view;
    const prevView = this.definitions[index - 1].cameraView.view;
    if (view !== prevView) return view === 'front' ? 'face-forward' : 'turn-side-on';
    return 'next-up';
  }

  private runTransition(ts: number, voiceBusy: boolean, u: TrainingFrameUpdate): void {
    if (this.transitionCuePending && !voiceBusy) {
      u.voice = cue(this.transitionCuePending);
      this.transitionCuePending = null;
      return;
    }
    const settled = ts - this.transitionEnteredMs >= this.config.transitionDwellMs;
    if (this.transitionCuePending === null && !voiceBusy && settled) {
      this.itemEnteredMs = ts;
      const def = this.currentDefinition();
      if (def && this.shouldUseFloorSetupV21(def) && this.floorMemory.currentEnvironment === 'floor') {
        this.enterFloorSetup(ts, u);
        return;
      }
      this.phase = 'preflight';
      this.lastPromptCue = null;
      this.lastPromptAtMs = -Infinity;
    }
  }

  private runPreflight(
    out: PipelineFrameOutput,
    status: PreflightStatus,
    ts: number,
    voiceBusy: boolean,
    u: TrainingFrameUpdate
  ): void {
    u.setupPrompt = status.prompt;
    if (this.setupIssue) {
      u.setupIssue = true;
      this.emitSafety(u, ['tracking_pause_and_reset'], !this.setupIssueRecoverySpoken && !voiceBusy);
      if (!voiceBusy) this.setupIssueRecoverySpoken = true;
      return;
    }
    if (status.phase === 'ready' && out.bodyUnit !== null) {
      const def = this.definitions[this.itemIndex];
      if (this.shouldUseFloorSetupV21(def)) {
        this.enterFloorSetup(ts, u);
        return;
      }
      const safety = this.currentSafetyProfile();
      const safetyCueIds = uniqueSafety([
        ...(safety?.setupCueIds ?? []),
        ...(safety?.activeCueIds ?? []),
      ]);
      this.phase = 'instructions';
      this.instructionsEnteredMs = ts;
      this.instructionsIdleAtMs = -1;
      const cues = this.instructionCueSequence(def, safetyCueIds);
      u.voice = cueSequence(cues);
      this.emitSafety(u, safetyCueIds, false);
      return;
    }
    // Ask the user what to do instead of silently skipping.
    if (ts - this.itemEnteredMs >= this.config.maxFramingMs) {
      this.setupIssue = true;
      u.setupIssue = true;
      this.emitSafety(u, ['tracking_pause_and_reset'], !voiceBusy);
      this.setupIssueRecoverySpoken = !voiceBusy;
      return;
    }
    const c = promptCue(status.prompt);
    if (
      shouldSpeakFramingPrompt({
        cue: c,
        lastCue: this.lastPromptCue,
        lastSpokenAtMs: this.lastPromptAtMs,
        nowMs: ts,
        repeatMs: this.config.promptRepeatMs,
      })
    ) {
      this.lastPromptCue = c;
      this.lastPromptAtMs = ts;
      u.voice = cue(c);
    }
  }

  private runInstructions(out: PipelineFrameOutput, voiceBusy: boolean, ts: number, u: TrainingFrameUpdate): void {
    if (this.floorSetup) {
      this.runFloorSetup(out, voiceBusy, ts, u);
      return;
    }
    if (ts - this.instructionsEnteredMs < 1000) return;
    if (voiceBusy) {
      this.instructionsIdleAtMs = -1;
      return;
    }
    if (this.instructionsIdleAtMs < 0) this.instructionsIdleAtMs = ts;
    const settled = ts - this.instructionsIdleAtMs >= this.config.postInstructionsDwellMs;
    if (settled && out.state === 'tracking') {
      this.startCountdown(ts, u);
    }
  }

  private enterFloorSetup(ts: number, u: TrainingFrameUpdate): void {
    const def = this.currentDefinition();
    if (!def) return;
    const transitionRequired =
      this.floorMemory.currentEnvironment !== 'floor' && !this.floorMemory.floorFamilyIntroduced;
    const setupEpoch = this.floorMemory.currentFloorSetupEpoch + 1;
    this.phase = 'instructions';
    this.instructionsEnteredMs = ts;
    this.instructionsIdleAtMs = -1;
    this.lastPromptCue = null;
    this.lastPromptAtMs = -Infinity;
    this.movementReadiness.reset();
    this.floorMemory = {
      ...this.floorMemory,
      floorFamilyIntroduced: this.floorMemory.floorFamilyIntroduced || transitionRequired,
      currentFloorItemId: def.id,
      currentFloorSetupEpoch: setupEpoch,
    };
    this.floorSetup = {
      exerciseId: def.id,
      itemIndex: Math.max(0, this.itemIndex),
      setIndex: this.setIndex,
      setupEpoch,
      phase: transitionRequired ? 'transition_instruction' : 'awaiting_user_transition',
      floorTransitionRequired: transitionRequired,
      userConfirmed: false,
      movementReady: false,
      finalPositionReadyAtMs: null,
      stableForMs: 0,
      setupCaption: 'Move to the floor start position.',
      actionLabel: "I'm ready",
    };
    const transitionCueIds: readonly SafetyCueId[] = transitionRequired ? ['floor_slow_transition'] : [];
    const instructionCueIds: readonly VoiceCueKey[] = this.shouldUseTrackedTrainingVoiceBehaviorV21()
      ? this.trainingVoiceV21InstructionCues(def).filter((cueKey) => cueKey !== 'final-position-set-v21')
      : this.setIndex === 0
        ? def.voice.instructions
        : [];
    const cues = uniqueVoiceCues([...transitionCueIds, ...instructionCueIds]);
    if (cues.length > 0) u.voice = cueSequence(cues);
    this.emitSafety(u, transitionCueIds, false);
  }

  private runFloorSetup(
    out: PipelineFrameOutput,
    voiceBusy: boolean,
    ts: number,
    u: TrainingFrameUpdate
  ): void {
    const setup = this.floorSetup;
    const def = this.currentDefinition();
    if (!setup || !def) return;

    if (setup.phase === 'transition_instruction' && !voiceBusy) {
      this.floorSetup = {
        ...setup,
        phase: 'awaiting_user_transition',
      };
    }

    if (!this.floorSetup?.userConfirmed) {
      return;
    }

    const readiness = this.movementReadiness.update(out, def.cameraView);
    if (!readiness.ready) {
      this.markFloorSetupWaitingForVisibility(readiness);
      return;
    }

    if (this.floorSetup.finalPositionReadyAtMs === null) {
      if (voiceBusy) {
        this.floorSetup = {
          ...this.floorSetup,
          phase: 'stabilizing',
          movementReady: true,
          stableForMs: readiness.stableForMs,
          setupCaption: 'Hold the start position.',
          actionLabel: null,
        };
        this.instructionsIdleAtMs = -1;
        return;
      }
      this.floorSetup = {
        ...this.floorSetup,
        phase: 'ready',
        movementReady: true,
        finalPositionReadyAtMs: ts,
        stableForMs: readiness.stableForMs,
        setupCaption: null,
        actionLabel: null,
      };
      this.floorMemory = {
        ...this.floorMemory,
        currentEnvironment: 'floor',
        currentFloorItemId: def.id,
      };
      this.instructionsIdleAtMs = -1;
      u.voice = cue('final-position-set-v21');
      return;
    }

    this.floorSetup = {
      ...this.floorSetup,
      phase: 'ready',
      movementReady: true,
      stableForMs: readiness.stableForMs,
      setupCaption: null,
      actionLabel: null,
    };
    if (voiceBusy) {
      this.instructionsIdleAtMs = -1;
      return;
    }
    if (this.instructionsIdleAtMs < 0) this.instructionsIdleAtMs = ts;
    if (ts - this.instructionsIdleAtMs >= this.config.postInstructionsDwellMs) {
      this.startCountdown(ts, u);
    }
  }

  private markFloorSetupWaitingForVisibility(readiness: MovementCameraReadinessResult): void {
    if (!this.floorSetup) return;
    const phase: TrainingFinalPositionPhase = readiness.stableForMs > 0 ? 'stabilizing' : 'awaiting_visibility';
    this.floorSetup = {
      ...this.floorSetup,
      phase,
      movementReady: false,
      finalPositionReadyAtMs: null,
      stableForMs: readiness.stableForMs,
      setupCaption: readiness.setupCaption ?? 'Hold the start position.',
      actionLabel: null,
    };
    this.instructionsIdleAtMs = -1;
  }

  private startCountdown(ts: number, u: TrainingFrameUpdate): void {
    this.cancelFloorSetup();
    this.phase = 'countdown';
    this.countdownStartMs = ts;
    this.countdownAttemptOrdinal++;
    this.lastValidTimeState = null;
    if (this.shouldUseTrackedTrainingVoiceBehaviorV21()) {
      this.countdownStep = COUNTDOWN.length;
      this.countdownAwaitingTrackedGo = true;
      u.voice = cueSequence(COUNTDOWN);
      return;
    }
    this.countdownStep = 1;
    this.countdownAwaitingTrackedGo = false;
    u.voice = cue(COUNTDOWN[0]);
  }

  private runCountdown(ts: number, u: TrainingFrameUpdate): void {
    if (this.countdownAwaitingTrackedGo) return;
    if (
      this.countdownStep < COUNTDOWN.length &&
      ts - this.countdownStartMs >= this.countdownStep * this.config.countdownStepMs
    ) {
      const c = COUNTDOWN[this.countdownStep];
      this.countdownStep++;
      u.voice = cue(c);
      if (c === 'go') {
        this.beginSet(ts);
      }
    }
  }

  private beginSet(ts: number): void {
    const def = this.definitions[this.itemIndex];
    this.runtime = createTrainingSetRuntime({
      exerciseDefinition: def,
      generatedExercise: this.generatedByExerciseId.get(def.id) ?? null,
      featureEnabled: this.options.stepUpAlternationFeatureEnabled,
      trainingVoiceMode: this.options.trainingVoiceMode,
      runtimeCapabilities: this.options.runtimeCapabilities,
      restoredRuntime: this.options.restoredSetRuntime,
      setIndex: this.setIndex,
    });
    this.setStartMs = ts;
    this.setDurationMs =
      def.timing?.mode === 'valid_time'
        ? null
        : def.kind === 'rom'
        ? (def.prescription.captureSec ?? 12) * 1000
        : def.kind === 'timer'
          ? (def.prescription.timerSec ?? def.prescription.holdSec ?? 20) * 1000
          : null;
    this.phase = 'set';
  }

  private runSet(out: PipelineFrameOutput, ts: number, u: TrainingFrameUpdate): void {
    const runtime = this.runtime as TrainingSetRuntime;
    const runtimeUpdate = runtime.update(out);
    const g = runtimeUpdate.setUpdate;
    u.playRepSound = runtime.kind === 'step_up_alternation' ? !!runtimeUpdate.acceptedRepEvent : g.repCredited;
    u.repCount = g.repCount;
    u.holdMs = g.holdMs;
    u.measuring = g.measuring;
    u.validTimeState = g.validTimeState ?? null;
    u.validTimeCaption = g.validTimeCaption ?? null;
    u.stepUpContext = runtimeUpdate.stepUpContext ?? null;
    u.stepUpCorrection = runtimeUpdate.correction ?? null;
    u.setRuntimeKind = runtime.kind;
    if (g.voice) u.voice = { cues: g.voice.cues, priority: g.voice.priority };
    if (g.validTimeState === 'paused' && this.lastValidTimeState !== 'paused') {
      const safety = this.currentSafetyProfile();
      const recoveryCueIds: readonly SafetyCueId[] = safety?.recoveryCueIds.length
        ? safety.recoveryCueIds
        : ['tracking_pause_and_reset'];
      this.emitSafety(u, recoveryCueIds, !g.voice);
    }
    this.lastValidTimeState = g.validTimeState ?? null;

    const elapsed = ts - this.setStartMs;
    const clockEnded = this.setDurationMs !== null && elapsed >= this.setDurationMs;
    const safetyEnded = this.setDurationMs === null && elapsed >= this.config.setSafetyMs;
    u.remainingMs = Number.isFinite(g.remainingMs)
      ? (g.remainingMs as number)
      : this.setDurationMs !== null
        ? Math.max(0, this.setDurationMs - elapsed)
        : NaN;

    if (g.complete || clockEnded || safetyEnded) {
      this.currentSets.push(runtime.finish(ts));
      const def = this.definitions[this.itemIndex];
      // Don't overwrite the autoregulation line ("that's your set") if present.
      if (this.setIndex + 1 < def.prescription.sets) {
        this.enterRest(ts);
      } else {
        this.results.push({ exerciseId: def.id, status: 'completed', sets: this.currentSets.slice() });
        this.advanceItem(ts);
      }
    }
  }

  private enterRest(ts: number): void {
    const def = this.definitions[this.itemIndex];
    this.phase = 'rest';
    this.restEnteredMs = ts;
    this.restSpoken = false;
    this.restDurationMs = def.prescription.restSec * 1000;
  }

  private runRest(ts: number, voiceBusy: boolean, u: TrainingFrameUpdate): void {
    const def = this.definitions[this.itemIndex];
    if (!this.restSpoken && !voiceBusy) {
      this.restSpoken = true;
      // Announce the final set so the user can pace the effort.
      const isLastUpcoming = this.setIndex + 2 === def.prescription.sets;
      const safety = this.currentSafetyProfile();
      const safetyCueIds = safety?.repeatedSetCueIds ?? [];
      const restCue = this.shouldUseTrackedTrainingVoiceBehaviorV21()
        ? isLastUpcoming
          ? 'last-set-v21'
          : 'rest-now-v21'
        : isLastUpcoming
          ? 'last-set'
          : 'rest-now';
      u.voice = cueSequence([restCue, ...safetyCueIds]);
      this.emitSafety(u, safetyCueIds, false);
    }
    u.remainingMs = Math.max(0, this.restDurationMs - (ts - this.restEnteredMs));
    if (this.restSpoken && !voiceBusy && ts - this.restEnteredMs >= this.restDurationMs) {
      this.setIndex++;
      if (this.shouldUseFloorSetupV21(def)) {
        this.enterFloorSetup(ts, u);
        return;
      }
      this.startCountdown(ts, u);
    }
  }

  private advanceItem(ts: number): void {
    this.runtime = null;
    this.countdownAwaitingTrackedGo = false;
    this.cancelFloorSetup();
    const next = this.itemIndex + 1;
    if (next >= this.definitions.length) {
      this.phase = 'complete';
      this.completeSpoken = false;
      return;
    }
    this.enterTransition(next, ts);
  }

  private finish(): void {
    for (let i = this.results.length; i < this.definitions.length; i++) {
      this.results.push({ exerciseId: this.definitions[i].id, status: 'skipped', sets: [] });
    }
    this.finished = { startedAt: this.startedAtIso, items: this.results.slice() };
  }

  private currentSafetyProfile(): PlannedExerciseSafetyCueProfile | null {
    const def = this.currentDefinition();
    return def ? this.safetyByExerciseId.get(def.id) ?? null : null;
  }

  private shouldUseFloorSetupV21(def: ExerciseDefinition): boolean {
    const featureEnabled = this.options.floorV21FeatureEnabled ?? isTrainingFloorV21FeatureEnabled();
    return (
      def.equipment.includes('floor') &&
      this.options.trainingVoiceMode === 'internal_v21' &&
      featureEnabled === true &&
      this.options.runtimeCapabilities?.internalFloorSetupReady === true
    );
  }

  private shouldUseTrackedTrainingVoiceBehaviorV21(): boolean {
    return (
      this.options.trainingVoiceMode === 'internal_v21' &&
      this.options.runtimeCapabilities?.internalTrainingVoiceBehaviorReady === true
    );
  }

  private instructionCueSequence(
    def: ExerciseDefinition,
    safetyCueIds: readonly SafetyCueId[]
  ): VoiceCueKey[] {
    if (!this.shouldUseTrackedTrainingVoiceBehaviorV21()) {
      return uniqueVoiceCues(['framing-ready', ...def.voice.instructions, ...safetyCueIds]);
    }
    return uniqueVoiceCues(['framing-ready', ...this.trainingVoiceV21InstructionCues(def)]);
  }

  private trainingVoiceV21InstructionCues(def: ExerciseDefinition): VoiceCueKey[] {
    try {
      const generated = this.generatedByExerciseId.get(def.id) ?? null;
      const stepUpPlan = generated?.stepUpAlternationPlan ?? null;
      const plan = planTrainingVoiceSequenceV21({
        exerciseId: def.id,
        exposure: this.setIndex === 0 ? 'first_use' : 'later_set',
        stepUpContext: stepUpPlan
          ? {
              plan: stepUpPlan,
              setIndex: this.setIndex,
              startLeadSide: generated?.stepUpInitialLeadSide,
            }
          : null,
      });
      if (!plan.ready) return def.voice.instructions.slice();
      return voiceCueKeys(plan.cueKeys);
    } catch {
      return def.voice.instructions.slice();
    }
  }

  private cancelFloorSetup(): void {
    if (!this.floorSetup) return;
    this.floorSetup = null;
    this.movementReadiness.reset();
    this.instructionsIdleAtMs = -1;
  }

  private floorMemorySnapshot(): TrainingFloorSessionMemory {
    return {
      floorFamilyIntroduced: this.floorMemory.floorFamilyIntroduced,
      currentEnvironment: this.floorMemory.currentEnvironment,
      currentFloorItemId: this.floorMemory.currentFloorItemId,
      currentFloorSetupEpoch: this.floorMemory.currentFloorSetupEpoch,
    };
  }

  private emitSafety(u: TrainingFrameUpdate, cueIds: readonly SafetyCueId[], speak: boolean): void {
    const ids = uniqueSafety(cueIds);
    if (ids.length === 0) return;
    u.safetyCueIds = ids;
    u.safetyText = safetyCueTexts(ids);
    if (speak) u.voice = cueSequence(ids);
  }
}

function cue(c: VoiceCueKey): VoiceRequest {
  return { cues: [c], priority: voicePriority(c) };
}

function cueSequence(cues: readonly VoiceCueKey[]): VoiceRequest {
  return { cues: cues.slice(), priority: maxPriority(cues) };
}

function maxPriority(cues: readonly VoiceCueKey[]): number {
  return cues.reduce((priority, c) => Math.max(priority, voicePriority(c)), 0);
}

function promptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
}

function cloneFloorSetup(snapshot: TrainingFloorSetupSnapshot | null): TrainingFloorSetupSnapshot | null {
  return snapshot ? { ...snapshot } : null;
}

function uniqueVoiceCues(items: readonly VoiceCueKey[]): VoiceCueKey[] {
  const out: VoiceCueKey[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function voiceCueKeys(items: readonly string[]): VoiceCueKey[] {
  return items as VoiceCueKey[];
}

function uniqueSafety(items: readonly SafetyCueId[]): SafetyCueId[] {
  const out: SafetyCueId[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
