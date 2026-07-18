/**
 * PARKED — camera-conducted daily training (2026-07-05 direction): no screen
 * mounts this player. The LIVE daily session is src/training/voiceSessionPlayer.ts
 * driven by src/voice/voiceSessionController.ts; change behaviour there first.
 *
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
import type { VoiceIntent } from '../voice/intents';
import { ExerciseDefinition, SetResult, getExercise } from '../exercises';
import type { ValidTimeState } from '../exercises/validTime';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM } from '../pose/types';
import {
  MovementCameraReadinessTracker,
  type MovementCameraReadinessResult,
} from '../preflight/movementCameraReadiness';
import { PreflightCheck, PreflightPrompt, PreflightStatus } from '../preflight/preflight';
import { shouldSpeakFramingPrompt } from '../preflight/promptTiming';
import { SessionFunnelTracker, TrainingSessionFunnel } from './sessionFunnel';
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
  | 'waiting_ready'
  | 'countdown'
  | 'set'
  | 'rest'
  | 'voice_paused'
  | 'complete'
  | 'done';

/** Session driving mode. Voice-guided is the v1 production mode (2026-07-05
 * direction); camera_conducted is the parked conductor path, kept fully
 * working behind this switch and exercised by the existing suites. */
export type TrainingSessionMode = 'camera_conducted' | 'voice_guided';

export interface TrainingPainEvent {
  exerciseId: string;
  setIndex: number;
  timestampMs: number;
}

export interface TrainingItemResult {
  exerciseId: string;
  status: 'completed' | 'skipped';
  /** Present only for safety-word skips; the pain_event store consumes it. */
  skipReason?: 'pain';
  /** One SetResult per completed set. A skipped item keeps any sets finished before the skip. */
  sets: SetResult[];
}

export interface TrainingSessionResult {
  startedAt: string;
  items: TrainingItemResult[];
  /** Setup-funnel instrumentation; absent on records stored before it existed. */
  funnel?: TrainingSessionFunnel;
  /** Safety-word pain halts (voice sessions); absent when none fired. */
  painEvents?: TrainingPainEvent[];
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

export type TrainingFloorSetupReadinessSource = 'camera_inferred' | 'user_fallback_selected';

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
  readonly fallbackAvailable: boolean;
  readonly readinessSource: TrainingFloorSetupReadinessSource | null;
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
  /**
   * Voice sessions: a waiting state re-prompted once and is now leaning on
   * the always-visible tap control (no-stall ladder end state — the player
   * NEVER auto-advances a waiting user).
   */
  tapPromptHighlighted: boolean;
  /** Voice sessions: the user said "stop" — the screen offers the full-end confirm. */
  stopRequested: boolean;
  /** Voice sessions: the rest window is the once-per-item bonus-set offer. */
  bonusOfferPending: boolean;
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
const TRAINING_FLOOR_SETUP_STABLE_DWELL_MS = 900;
const TRAINING_FLOOR_SETUP_FALLBACK_TIMEOUT_MS = 12000;
const TRAINING_FLOOR_SETUP_FLOOR_POSTURE_TORSO_RATIO = 0.65;
const TRAINING_FLOOR_SETUP_MAX_HIP_ABOVE_ANKLE_NORM = 0.18;

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
  readonly floorV21FeatureEnabled?: boolean;
  readonly handsFreeTrainingSetup?: boolean;
  readonly restoredSetRuntime?: SerializedTrainingSetRuntime | null;
  /** Default camera_conducted — every existing construction is unchanged. */
  readonly sessionMode?: TrainingSessionMode;
  /**
   * Definition + safety-profile sources, injectable for catalogues that live
   * outside the shared exercise registry (programme v2 voice bridge — C4:
   * the parallel engine must not couple into old-engine per-exercise
   * governance). Defaults preserve today's registry lookups exactly.
   */
  readonly resolveExercise?: (exerciseId: string) => ExerciseDefinition;
  readonly resolveSafetyProfile?: (exerciseId: string) => PlannedExerciseSafetyCueProfile;
  /**
   * Voice-mode bonus-set offer (programme v2, ladder spec §11): after the
   * FINAL planned set of a listed exercise, the rest window becomes a
   * once-per-item offer — `offerCue` is spoken instead of the rest line;
   * "I'm ready" (voice or tap) grants exactly one extra set; rest expiry or
   * skipping the rest declines and the item completes as normal. Absent
   * option = no behaviour change anywhere (old engine never offers).
   */
  readonly bonusSetOffer?: {
    readonly exerciseIds: readonly string[];
    readonly offerCue: VoiceCueKey;
  };
}

/**
 * Voice-session pacing constants. Waiting states re-prompt ONCE, then lean on
 * the tap control forever — the app waits for her, it never hurries her.
 * Values are provisional pre-device-session; tuned only via this object.
 */
export const VOICE_SESSION_TIMING = {
  /** waiting_ready silence before the single gentle re-prompt. */
  readyRepromptMs: 20000,
  /** Assumed seconds-per-rep for sizing the done re-prompt window. */
  defaultRepDurationMs: 4000,
  /** Floor for the expected-set estimate (slow movers are the norm). */
  minExpectedSetMs: 30000,
  /** Done re-prompt fires at expected × this factor; once, then tap-lean. */
  doneRepromptFactor: 2,
} as const;

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

export class TrainingSessionPlayer {
  private readonly config: TrainingPlayerConfig;
  private readonly startedAtIso: string;
  private readonly definitions: ExerciseDefinition[];
  private readonly preflight: PreflightCheck;
  private readonly movementReadiness = new MovementCameraReadinessTracker({
    stableMs: TRAINING_FLOOR_SETUP_STABLE_DWELL_MS,
  });
  private readonly funnel = new SessionFunnelTracker();
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
    tapPromptHighlighted: false,
    stopRequested: false,
    bonusOfferPending: false,
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
  private pendingFloorSetupReentry = false;
  private floorSetup: TrainingFloorSetupSnapshot | null = null;
  private floorSetupListeningStartedMs = -1;
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

  // Voice-guided mode state (unused in camera mode).
  private readonly isVoiceMode: boolean;
  /** Line queued by an intent/tap method; spoken on the next free tick. */
  private pendingVoiceLine: VoiceRequest | null = null;
  private waitingReadyEnteredMs = 0;
  private readyReprompted = false;
  private tapPromptHighlighted = false;
  private instructionsPending = false;
  private voiceSetOpenEnded = false;
  private voiceSetExpectedMs = 0;
  private doneReprompted = false;
  private voicePauseContext: 'rest' | 'active' | null = null;
  /** Paused OUT of an open rep set — resume must say "every rep counts". */
  private voicePausedMidRepSet = false;
  /** Bonus-set offer state (voice mode; see options.bonusSetOffer). */
  private bonusOfferPending = false;
  private bonusSetsGranted = 0;
  private readonly bonusOfferedItemIds = new Set<string>();
  /**
   * Post-exercise ±rep window (founder fix 2026-07-06): index into results
   * for the just-completed item, adjustable through transition/complete and
   * closed the moment the next exercise announces its instructions.
   */
  private adjustableCompletedItemIndex: number | null = null;
  private stopRequested = false;
  private readonly painEvents: TrainingPainEvent[] = [];
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
    this.isVoiceMode = options.sessionMode === 'voice_guided';
    this.definitions = exerciseIds.map(options.resolveExercise ?? getExercise);
    this.generatedByExerciseId = new Map(
      (options.generatedExercises ?? []).map((exercise) => [exercise.exerciseId, exercise])
    );
    this.safetySnapshot = plannedSafetyCueSnapshotForExercises(
      exerciseIds,
      options.resolveSafetyProfile
    );
    this.safetyByExerciseId = new Map(
      this.safetySnapshot.exerciseProfiles.map((profile) => [profile.exerciseId, profile])
    );
  }

  get result(): TrainingSessionResult | null {
    return this.finished;
  }

  /** Live funnel snapshot — the app layer persists this when a session is abandoned. */
  funnelSnapshot(): TrainingSessionFunnel {
    return this.funnel.snapshot(this.phase, this.phase === 'done');
  }

  /** Pain events so far — abandoned sessions must still audit them (telemetry). */
  painEventsSnapshot(): TrainingPainEvent[] {
    return this.painEvents.map((event) => ({ ...event }));
  }

  /**
   * Items finished so far (completed or skipped, in play order) — the app
   * layer snapshots these at item boundaries so an interrupted session can
   * resume after the last finished item. In-flight sets are excluded on
   * purpose: an interrupted measurement restarts (same rule as pause/resume).
   */
  completedItemsSnapshot(): TrainingItemResult[] {
    return this.results.map((item) => ({
      exerciseId: item.exerciseId,
      status: item.status,
      ...(item.skipReason !== undefined ? { skipReason: item.skipReason } : {}),
      sets: item.sets.slice(),
    }));
  }

  retrySetup(): void {
    if (this.floorSetup && this.phase === 'instructions') {
      const handsFreeSetup = this.shouldUseHandsFreeTrainingSetup();
      this.floorSetup = {
        ...this.floorSetup,
        phase: handsFreeSetup ? 'movement_setup' : 'awaiting_user_transition',
        userConfirmed: false,
        movementReady: false,
        finalPositionReadyAtMs: null,
        stableForMs: 0,
        setupCaption: handsFreeSetup
          ? "Move safely to the floor. I'll start once you're in position."
          : 'Move to the floor start position.',
        actionLabel: handsFreeSetup ? null : "I'm ready",
        fallbackAvailable: false,
        readinessSource: null,
      };
      this.floorSetupListeningStartedMs = handsFreeSetup ? this.lastTimestampMs : -1;
      this.movementReadiness.reset();
      this.instructionsIdleAtMs = -1;
      return;
    }
    if (this.phase !== 'preflight') return;
    this.setupIssue = false;
    this.setupIssueRecoverySpoken = false;
    // Setup already struggled for a full framing window — re-earn the full
    // sample rather than fast-passing a scene that just failed.
    this.preflight.requireFullSample();
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
    const handsFreeSetup = this.shouldUseHandsFreeTrainingSetup();
    if (handsFreeSetup && !this.floorSetup.fallbackAvailable) return false;
    this.floorSetup = {
      ...this.floorSetup,
      phase: handsFreeSetup ? 'ready' : 'awaiting_visibility',
      userConfirmed: true,
      movementReady: handsFreeSetup,
      finalPositionReadyAtMs: null,
      stableForMs: handsFreeSetup ? this.floorSetup.stableForMs : 0,
      setupCaption: handsFreeSetup ? null : 'Hold the start position.',
      actionLabel: null,
      readinessSource: handsFreeSetup ? 'user_fallback_selected' : null,
    };
    this.floorMemory = {
      ...this.floorMemory,
      currentEnvironment: 'floor',
      currentFloorItemId: this.floorSetup.exerciseId,
    };
    if (!handsFreeSetup) this.movementReadiness.reset();
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
    this.stopRequested = false;
    this.voicePauseContext = null;
    this.tapPromptHighlighted = false;
    this.funnel.itemSkipped();
    this.runtime?.cancel(this.lastTimestampMs);
    // Sets already completed before the skip stay in the result (measurement
    // data is never thrown away); the skipped status still excludes the item
    // from progression evidence.
    this.results.push({
      exerciseId: this.definitions[this.itemIndex].id,
      status: 'skipped',
      sets: this.currentSets.slice(),
    });
    this.currentSets = [];
    this.advanceItem(this.lastTimestampMs);
    return true;
  }

  pause(atMs: number = this.lastTimestampMs): void {
    if (this.isVoiceMode) {
      this.haltVoiceSession(false, atMs);
      return;
    }
    if (this.phase === 'countdown' && this.countdownAwaitingTrackedGo) {
      this.countdownAwaitingTrackedGo = false;
      this.phase = 'instructions';
      this.instructionsEnteredMs = atMs;
      this.instructionsIdleAtMs = -1;
      return;
    }
    // A paused set is discarded and redone from the countdown. Graders are
    // frame-timestamp driven and cannot represent a wall-clock gap: stitching
    // across one credits the pause into holds/valid-time (and interruption
    // events fired while paused never reach them), so restarting the set is
    // the only honest measurement.
    if (this.phase === 'set') this.discardInFlightSet(atMs);
  }

  resume(atMs: number = this.lastTimestampMs): void {
    if (this.isVoiceMode) {
      this.resumeVoiceSession(atMs);
      return;
    }
    if (this.phase === 'set') this.runtime?.resume(atMs);
  }

  private discardInFlightSet(atMs: number): void {
    const def = this.currentDefinition();
    this.runtime?.cancel(atMs);
    this.runtime = null;
    this.lastValidTimeState = null;
    this.phase = 'instructions';
    this.instructionsEnteredMs = atMs;
    this.instructionsIdleAtMs = -1;
    this.pendingFloorSetupReentry = def !== null && this.shouldUseFloorSetupV21(def);
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
    this.waitingReadyEnteredMs += deltaMs;
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
    this.funnel.shiftTiming(deltaMs);
    if (this.floorSetup?.finalPositionReadyAtMs !== null && this.floorSetup?.finalPositionReadyAtMs !== undefined) {
      this.floorSetup = {
        ...this.floorSetup,
        finalPositionReadyAtMs: this.floorSetup.finalPositionReadyAtMs + deltaMs,
      };
    }
  }

  update(out: PipelineFrameOutput, voiceBusy: boolean): TrainingFrameUpdate {
    if (this.isVoiceMode) {
      throw new Error('voice_guided sessions are driven by tick(), not update()');
    }
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.remainingMs = NaN;
    u.measuring = false;
    u.validTimeState = null;
    u.validTimeCaption = null;
    u.tapPromptHighlighted = false;
    u.stopRequested = false;
    u.setupIssue = this.setupIssue;
    u.setupPrompt = null;
    u.floorSetup = null;
    u.floorMemory = this.floorMemorySnapshot();
    u.safetyCueIds = [];
    u.safetyText = [];
    const ts = out.frame.timestampMs;
    this.lastTimestampMs = ts;
    this.funnel.sessionStarted(ts);
    // Camera mode uses the pending line only for the pain acknowledgement.
    if (this.pendingVoiceLine && !voiceBusy) {
      u.voice = this.pendingVoiceLine;
      this.pendingVoiceLine = null;
      voiceBusy = true;
    }
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
    u.totalSets = def ? this.effectiveDose(def).sets + this.bonusSetsGranted : 0;
    u.currentExerciseId = def ? def.id : null;
    u.floorSetup = cloneFloorSetup(this.floorSetup);
    u.floorMemory = this.floorMemorySnapshot();
    return u;
  }

  // -------------------------------------------------------------------------
  // Voice-guided mode (2026-07-05 direction). Clock-tick driven — no camera,
  // no pose frames. Flow per item:
  //   transition → instructions → waiting_ready → countdown → set → rest →
  //   waiting_ready (next set) → … → next item
  // Every waiting state re-prompts ONCE then leans on the always-visible tap
  // control; the player never auto-advances a waiting user (no-stall = an
  // affordance is always live, not that the session moves without her).
  // -------------------------------------------------------------------------

  /** Voice-mode clock tick (~4 Hz + event-driven). Camera mode uses update(). */
  tick(timestampMs: number, voiceBusy: boolean): TrainingFrameUpdate {
    if (!this.isVoiceMode) {
      throw new Error('tick() is voice_guided-only; camera sessions are driven by update()');
    }
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.repCount = 0;
    u.holdMs = 0;
    u.remainingMs = NaN;
    u.measuring = false;
    u.validTimeState = null;
    u.validTimeCaption = null;
    u.tapPromptHighlighted = this.tapPromptHighlighted;
    u.stopRequested = this.stopRequested;
    u.bonusOfferPending = this.bonusOfferPending;
    u.setupIssue = false;
    u.setupPrompt = null;
    u.floorSetup = null;
    u.floorMemory = this.floorMemorySnapshot();
    u.safetyCueIds = [];
    u.safetyText = [];
    const ts = timestampMs;
    this.lastTimestampMs = ts;
    this.funnel.sessionStarted(ts);

    // A line queued by an intent/tap method takes the channel first.
    let busy = voiceBusy;
    if (this.pendingVoiceLine && !busy) {
      u.voice = this.pendingVoiceLine;
      this.pendingVoiceLine = null;
      busy = true;
    }

    switch (this.phase) {
      case 'intro':
        if (!this.introSpoken) {
          if (!busy) {
            this.introSpoken = true;
            this.globalSafetySpoken = true;
            u.voice = cueSequence(['training-intro', ...SESSION_GLOBAL_SAFETY_CUE_IDS]);
            this.emitSafety(u, SESSION_GLOBAL_SAFETY_CUE_IDS, false);
          }
        } else if (!busy) {
          this.enterTransition(0, ts);
        }
        break;
      case 'transition':
        if (this.transitionCuePending && !busy) {
          u.voice = cue(this.transitionCuePending);
          this.transitionCuePending = null;
          break;
        }
        if (this.transitionCuePending === null && !busy && ts - this.transitionEnteredMs >= this.config.transitionDwellMs) {
          this.itemEnteredMs = ts;
          const def = this.currentDefinition();
          if (def) this.funnel.itemSetupStarted(def.id, ts);
          this.phase = 'instructions';
          this.instructionsEnteredMs = ts;
          this.instructionsPending = true;
        }
        break;
      case 'instructions':
        this.runVoiceInstructions(ts, busy, u);
        break;
      case 'waiting_ready':
        this.runWaitingReady(ts, busy, u);
        break;
      case 'countdown':
        this.runCountdown(ts, u);
        break;
      case 'set':
        this.runVoiceSet(ts, busy, u);
        break;
      case 'rest':
        this.runVoiceRest(ts, busy, u);
        break;
      case 'voice_paused':
        break;
      case 'complete':
        if (!this.completeSpoken) {
          if (!busy) {
            this.completeSpoken = true;
            u.voice = cue('session-complete');
          }
        } else if (!busy) {
          this.finish();
          this.phase = 'done';
        }
        break;
      default:
        break;
    }

    u.phase = this.phase;
    u.itemIndex = Math.max(0, this.itemIndex);
    u.setIndex = this.setIndex;
    u.tapPromptHighlighted = this.tapPromptHighlighted;
    u.stopRequested = this.stopRequested;
    u.bonusOfferPending = this.bonusOfferPending;
    const def = this.currentDefinition();
    u.totalSets = def ? this.effectiveDose(def).sets + this.bonusSetsGranted : 0;
    u.currentExerciseId = def ? def.id : null;
    return u;
  }

  private runVoiceInstructions(ts: number, busy: boolean, u: TrainingFrameUpdate): void {
    if (this.instructionsPending) {
      if (busy) return;
      this.instructionsPending = false;
      // The next exercise announces — every earlier ±rep window closes.
      this.adjustableCompletedItemIndex = null;
      const def = this.currentDefinition();
      if (!def) return;
      const safety = this.currentSafetyProfile();
      const safetyCueIds = uniqueSafety([
        ...(safety?.setupCueIds ?? []),
        ...(safety?.activeCueIds ?? []),
      ]);
      u.voice = cueSequence(uniqueVoiceCues([...def.voice.instructions, ...safetyCueIds]));
      this.emitSafety(u, safetyCueIds, false);
      return;
    }
    if (busy) return;
    if (ts - this.instructionsEnteredMs < 1000) return;
    this.enterWaitingReady(ts, u);
  }

  private enterWaitingReady(ts: number, u: TrainingFrameUpdate | null): void {
    this.phase = 'waiting_ready';
    this.waitingReadyEnteredMs = ts;
    this.readyReprompted = false;
    this.tapPromptHighlighted = false;
    const prompt = cue('voice-say-ready');
    if (u && u.voice === null) {
      u.voice = prompt;
    } else {
      this.pendingVoiceLine = prompt;
    }
  }

  private runWaitingReady(ts: number, busy: boolean, u: TrainingFrameUpdate): void {
    if (this.readyReprompted || busy || u.voice !== null) return;
    if (ts - this.waitingReadyEnteredMs >= VOICE_SESSION_TIMING.readyRepromptMs) {
      // One gentle re-prompt, then the tap control carries it — forever.
      this.readyReprompted = true;
      this.tapPromptHighlighted = true;
      u.voice = cue('voice-say-ready-reprompt');
    }
  }

  private beginVoiceSet(ts: number): void {
    this.funnel.setStarted(ts);
    const def = this.definitions[this.itemIndex];
    const dose = this.effectiveDose(def);
    this.voiceSetOpenEnded = def.kind === 'reps';
    if (this.voiceSetOpenEnded) {
      this.setDurationMs = null;
      this.voiceSetExpectedMs = Math.max(
        VOICE_SESSION_TIMING.minExpectedSetMs,
        (dose.repsPerSet ?? 10) * VOICE_SESSION_TIMING.defaultRepDurationMs
      );
    } else {
      const seconds =
        dose.secondsPerSet ??
        def.prescription.holdSec ??
        def.prescription.timerSec ??
        def.prescription.captureSec ??
        20;
      this.setDurationMs = seconds * 1000;
      this.voiceSetExpectedMs = this.setDurationMs;
    }
    this.setStartMs = ts;
    this.doneReprompted = false;
    this.tapPromptHighlighted = false;
    this.phase = 'set';
  }

  private runVoiceSet(ts: number, busy: boolean, u: TrainingFrameUpdate): void {
    const def = this.definitions[this.itemIndex];
    const elapsed = ts - this.setStartMs;
    if (this.voiceSetOpenEnded) {
      // Open set: she works at her own pace and says "done" (or taps). One
      // gentle check-in well past the expected duration; never auto-ends.
      if (
        !this.doneReprompted &&
        !busy &&
        u.voice === null &&
        elapsed >= this.voiceSetExpectedMs * VOICE_SESSION_TIMING.doneRepromptFactor
      ) {
        this.doneReprompted = true;
        this.tapPromptHighlighted = true;
        u.voice = cue('voice-done-reprompt');
      }
      return;
    }
    // Timed set (hold / timer / rom-as-timer): audio clock ends it.
    const durationMs = this.setDurationMs as number;
    u.remainingMs = Math.max(0, durationMs - elapsed);
    if (def.kind === 'hold') u.holdMs = Math.min(elapsed, durationMs);
    if (elapsed >= durationMs) {
      this.finishVoiceSet(ts, true);
    }
  }

  private finishVoiceSet(ts: number, completed: boolean): void {
    const def = this.definitions[this.itemIndex];
    const dose = this.effectiveDose(def);
    const timedElapsedSec =
      this.setDurationMs !== null
        ? Math.min(Math.max(0, ts - this.setStartMs), this.setDurationMs) / 1000
        : NaN;
    // Reported, never measured: reps stays 0 and meanVel NaN by construction
    // (type-level split, TDD-ADDENDUM §1.4/N5).
    this.currentSets.push({
      exerciseId: def.id,
      reps: 0,
      meanVel: NaN,
      holdSec: this.voiceSetOpenEnded ? NaN : timedElapsedSec,
      romPeak: NaN,
      autoregulated: false,
      reachedTarget: completed,
      interruptions: 0,
      flags: ['voice-guided'],
      ...(this.voiceSetOpenEnded && dose.repsPerSet !== undefined
        ? { reportedReps: dose.repsPerSet }
        : {}),
    });
    if (this.setIndex + 1 < dose.sets + this.bonusSetsGranted) {
      this.enterRest(ts);
    } else if (completed && this.bonusOfferEligible(def.id)) {
      // The rest window doubles as the once-per-item bonus offer: expiry (or
      // skipping the rest) declines; "I'm ready" grants one extra set.
      this.bonusOfferedItemIds.add(def.id);
      this.bonusOfferPending = true;
      this.enterRest(ts);
    } else {
      this.completeCurrentItem(ts);
    }
  }

  private bonusOfferEligible(exerciseId: string): boolean {
    const offer = this.options.bonusSetOffer;
    return (
      !!offer &&
      offer.exerciseIds.includes(exerciseId) &&
      !this.bonusOfferedItemIds.has(exerciseId)
    );
  }

  private completeCurrentItem(ts: number): void {
    const def = this.definitions[this.itemIndex];
    this.bonusOfferPending = false;
    this.results.push({ exerciseId: def.id, status: 'completed', sets: this.currentSets.slice() });
    // Open the post-exercise ±rep window (rest never follows a final set).
    this.adjustableCompletedItemIndex = this.results.length - 1;
    this.currentSets = [];
    this.advanceItem(ts);
  }

  private runVoiceRest(ts: number, busy: boolean, u: TrainingFrameUpdate): void {
    const def = this.definitions[this.itemIndex];
    if (!this.restSpoken && !busy && u.voice === null) {
      this.restSpoken = true;
      const safety = this.currentSafetyProfile();
      const safetyCueIds = safety?.repeatedSetCueIds ?? [];
      if (this.bonusOfferPending) {
        u.voice = cueSequence([this.options.bonusSetOffer!.offerCue, ...safetyCueIds]);
      } else {
        const isLastUpcoming =
          this.setIndex + 2 === this.effectiveDose(def).sets + this.bonusSetsGranted;
        u.voice = cueSequence([isLastUpcoming ? 'last-set' : 'rest-now', ...safetyCueIds]);
      }
      this.emitSafety(u, safetyCueIds, false);
    }
    u.remainingMs = Math.max(0, this.restDurationMs - (ts - this.restEnteredMs));
    if (this.restSpoken && !busy && ts - this.restEnteredMs >= this.restDurationMs) {
      if (this.bonusOfferPending) {
        // Silence is a decline — the offer never stalls the session.
        this.completeCurrentItem(ts);
        return;
      }
      this.setIndex++;
      this.enterWaitingReady(ts, u.voice === null ? u : null);
    }
  }

  // ---- Voice intent + tap surface (tap parity is a tested invariant) ------

  /** Route a matched voice intent. Tap controls call the same methods. */
  handleSessionIntent(intent: VoiceIntent, atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode) return false;
    switch (intent) {
      case 'ready':
        return this.confirmReady(atMs);
      case 'done':
        return this.completeCurrentSet(atMs);
      case 'skip':
        return this.phase === 'rest' ? this.skipRest(atMs) : this.skipCurrentItem();
      case 'repeat':
        return this.repeatVoiceInstructions(atMs);
      case 'pause':
        return this.haltVoiceSession(false, atMs);
      case 'stop':
        return this.haltVoiceSession(true, atMs);
      case 'resume':
        return this.resumeVoiceSession(atMs);
      case 'pain':
        return this.recordPainHalt(atMs);
      default:
        return false;
    }
  }

  confirmReady(atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode) return false;
    if (this.phase === 'rest' && this.bonusOfferPending) {
      // Accepting the bonus offer: exactly one extra set, straight to the
      // countdown — she just said she's ready.
      this.bonusOfferPending = false;
      this.bonusSetsGranted += 1;
      this.setIndex++;
    } else if (this.phase !== 'waiting_ready') {
      return false;
    }
    this.tapPromptHighlighted = false;
    this.phase = 'countdown';
    this.countdownStartMs = atMs;
    this.countdownAttemptOrdinal++;
    this.countdownAwaitingTrackedGo = false;
    this.countdownStep = 1;
    this.pendingVoiceLine = cue(COUNTDOWN[0]);
    return true;
  }

  completeCurrentSet(atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode || this.phase !== 'set') return false;
    this.finishVoiceSet(atMs, true);
    return true;
  }

  skipRest(atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode || this.phase !== 'rest') return false;
    this.restSpoken = true;
    this.restEnteredMs = atMs - this.restDurationMs;
    return true;
  }

  /**
   * One-tap rep correction (voice spec + founder fix 2026-07-06): adjusts the
   * JUST finished set's reported count. Windows: the rest screen (mid
   * exercise), and — because a final set has no rest after it — the
   * exercise-complete transition and the session-complete phase, closing when
   * the next exercise announces. Logged as prescribed-vs-reported via
   * repsAdjusted; never voice-quizzed. Floor at zero.
   */
  adjustReportedReps(delta: number): boolean {
    if (!this.isVoiceMode || !Number.isInteger(delta)) return false;
    const lastSet = this.adjustableLastSet();
    if (!lastSet || lastSet.reportedReps === undefined) return false;
    const prescribed = lastSet.reportedReps - (lastSet.repsAdjusted ?? 0);
    const nextReported = Math.max(0, lastSet.reportedReps + delta);
    lastSet.reportedReps = nextReported;
    const adjustment = nextReported - prescribed;
    if (adjustment === 0) {
      delete lastSet.repsAdjusted;
    } else {
      lastSet.repsAdjusted = adjustment;
    }
    return true;
  }

  private adjustableLastSet(): SetResult | null {
    if (this.phase === 'rest') {
      return this.currentSets[this.currentSets.length - 1] ?? null;
    }
    if (
      (this.phase === 'transition' || this.phase === 'instructions' || this.phase === 'complete') &&
      this.adjustableCompletedItemIndex !== null
    ) {
      const item = this.results[this.adjustableCompletedItemIndex];
      return item ? item.sets[item.sets.length - 1] ?? null : null;
    }
    return null;
  }

  repeatVoiceInstructions(atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode || this.phase !== 'waiting_ready') return false;
    const def = this.currentDefinition();
    if (!def) return false;
    this.pendingVoiceLine = cueSequence(uniqueVoiceCues([...def.voice.instructions, 'voice-say-ready']));
    this.waitingReadyEnteredMs = atMs;
    this.readyReprompted = false;
    return true;
  }

  /**
   * "pause" (halt) or "stop" (halt + the screen offers the full-end confirm).
   * An in-flight set is discarded — it restarts from waiting_ready on resume
   * (nothing was measured; the honest unit is a whole confirmed set).
   */
  haltVoiceSession(stopRequested: boolean, _atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode) return false;
    if (
      this.phase !== 'waiting_ready' &&
      this.phase !== 'countdown' &&
      this.phase !== 'set' &&
      this.phase !== 'rest'
    ) {
      if (this.phase === 'voice_paused' && stopRequested) {
        this.stopRequested = true;
        return true;
      }
      return false;
    }
    this.voicePauseContext = this.phase === 'rest' ? 'rest' : 'active';
    this.voicePausedMidRepSet = this.phase === 'set' && this.voiceSetOpenEnded;
    this.phase = 'voice_paused';
    this.stopRequested = stopRequested;
    this.tapPromptHighlighted = false;
    this.setDurationMs = null;
    this.pendingVoiceLine = cue('paused-v21');
    return true;
  }

  resumeVoiceSession(atMs: number = this.lastTimestampMs): boolean {
    if (!this.isVoiceMode || this.phase !== 'voice_paused') return false;
    // Pausing out of rest means the rest is over; the next set awaits her.
    if (this.voicePauseContext === 'rest') this.setIndex++;
    this.voicePauseContext = null;
    this.stopRequested = false;
    this.enterWaitingReady(atMs, null);
    // Interrupted rep set: reps are self-reported, so the restart must never
    // read as discarded effort — she counts everything done this set.
    if (this.voicePausedMidRepSet) {
      this.pendingVoiceLine = cueSequence(['voice-resume-counts', 'voice-say-ready']);
    }
    this.voicePausedMidRepSet = false;
    return true;
  }

  /**
   * Pain response (deterministic, TDD-ADDENDUM §9) — BOTH session modes (tap
   * parity: the "something hurts" control exists on every set screen; voice
   * adds the spoken intent). Halt the set, acknowledge without encouraging
   * continuation, skip THIS exercise, keep the session going.
   */
  recordPainHalt(atMs: number = this.lastTimestampMs): boolean {
    const def = this.currentDefinition();
    if (!def) return false;
    if (
      this.phase === 'intro' ||
      this.phase === 'transition' ||
      this.phase === 'complete' ||
      this.phase === 'done'
    ) {
      return false;
    }
    if (!this.isVoiceMode) {
      // Camera mode: tear down exactly like a skip before recording.
      this.cancelFloorSetup();
      this.countdownAwaitingTrackedGo = false;
      this.setupIssue = false;
      this.runtime?.cancel(atMs);
      this.runtime = null;
    }
    this.painEvents.push({ exerciseId: def.id, setIndex: this.setIndex, timestampMs: atMs });
    this.funnel.itemSkipped();
    this.results.push({
      exerciseId: def.id,
      status: 'skipped',
      skipReason: 'pain',
      sets: this.currentSets.slice(),
    });
    this.currentSets = [];
    this.stopRequested = false;
    this.voicePauseContext = null;
    this.setDurationMs = null;
    this.pendingVoiceLine = cue('pain-acknowledge');
    this.advanceItem(atMs);
    return true;
  }

  private currentDefinition(): ExerciseDefinition | null {
    return this.itemIndex >= 0 && this.itemIndex < this.definitions.length
      ? this.definitions[this.itemIndex]
      : null;
  }

  /**
   * The daily generated dose (sets/reps/seconds/rest) overrides the catalog
   * prescription: the session must run exactly what the plan promised.
   * Valid-time measurement targets stay grader-owned (generation never adjusts
   * secondsPerSet for valid-time exercises).
   */
  private effectiveDose(def: ExerciseDefinition): {
    sets: number;
    repsPerSet?: number;
    secondsPerSet?: number;
    restSec: number;
  } {
    const generated = this.generatedByExerciseId.get(def.id);
    return {
      sets: positiveInteger(generated?.sets) ?? def.prescription.sets,
      repsPerSet: positiveInteger(generated?.repsPerSet) ?? def.prescription.repsPerSet,
      secondsPerSet: positiveFinite(generated?.secondsPerSet),
      restSec: positiveFinite(generated?.restSeconds) ?? def.prescription.restSec,
    };
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
    this.pendingFloorSetupReentry = false;
    this.itemIndex = index;
    this.setIndex = 0;
    this.currentSets = [];
    this.bonusOfferPending = false;
    this.bonusSetsGranted = 0;
    this.phase = 'transition';
    this.transitionEnteredMs = ts;
    this.transitionCuePending = this.transitionCue(index);
    this.setupIssueRecoverySpoken = false;
    // Turning to a new camera view changes what the stability sample saw:
    // any short re-verification sample (training config) is off the table.
    if (this.transitionCuePending === 'face-forward' || this.transitionCuePending === 'turn-side-on') {
      this.preflight.requireFullSample();
    }
    this.preflight.reset();
  }

  /** Turn cue when the view changes; a gentle "next" otherwise; none for item 0. */
  private transitionCue(index: number): VoiceCueKey | null {
    if (index === 0) return null; // the intro already invited them to begin
    // No camera in voice mode — never speak turn cues, just "next up".
    if (this.isVoiceMode) return 'next-up';
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
      if (def) this.funnel.itemSetupStarted(def.id, ts);
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
      this.funnel.framingReady(ts);
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
      this.funnel.setupIssueLatched();
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
    if (this.pendingFloorSetupReentry) {
      this.pendingFloorSetupReentry = false;
      const def = this.currentDefinition();
      if (def && this.shouldUseFloorSetupV21(def) && !this.floorSetup) {
        this.enterFloorSetup(ts, u);
        return;
      }
    }
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
    const handsFreeSetup = this.shouldUseHandsFreeTrainingSetup();
    this.phase = 'instructions';
    this.instructionsEnteredMs = ts;
    this.instructionsIdleAtMs = -1;
    this.lastPromptCue = null;
    this.lastPromptAtMs = -Infinity;
    this.movementReadiness.reset();
    this.floorSetupListeningStartedMs = transitionRequired ? -1 : ts;
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
      phase: transitionRequired
        ? 'transition_instruction'
        : handsFreeSetup
          ? 'movement_setup'
          : 'awaiting_user_transition',
      floorTransitionRequired: transitionRequired,
      userConfirmed: false,
      movementReady: false,
      finalPositionReadyAtMs: null,
      stableForMs: 0,
      setupCaption: handsFreeSetup
        ? "Move safely to the floor. I'll start once you're in position."
        : 'Move to the floor start position.',
      actionLabel: handsFreeSetup ? null : "I'm ready",
      fallbackAvailable: false,
      readinessSource: null,
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
    const handsFreeSetup = this.shouldUseHandsFreeTrainingSetup();

    if (setup.phase === 'transition_instruction' && voiceBusy) return;
    if (setup.phase === 'transition_instruction') {
      this.floorSetup = {
        ...setup,
        phase: handsFreeSetup ? 'movement_setup' : 'awaiting_user_transition',
      };
      this.floorSetupListeningStartedMs = ts;
      this.movementReadiness.reset();
    }

    const activeSetup = this.floorSetup;
    if (!activeSetup) return;

    if (handsFreeSetup) {
      this.exposeFloorSetupFallbackIfTimedOut(ts);
    } else if (!activeSetup.userConfirmed) {
      return;
    }

    const setupBeforeReadiness = this.floorSetup;
    if (!setupBeforeReadiness) return;
    const readinessSource = setupBeforeReadiness.readinessSource;
    if (readinessSource === 'user_fallback_selected') {
      const fallbackSetup = this.floorSetup;
      if (!fallbackSetup) return;
      if (fallbackSetup.finalPositionReadyAtMs === null) {
        if (voiceBusy) {
          this.floorSetup = {
            ...fallbackSetup,
            phase: 'ready',
            movementReady: true,
            setupCaption: null,
            actionLabel: null,
          };
          this.instructionsIdleAtMs = -1;
          return;
        }
        this.markFloorSetupReadyFromSource(ts, u, 'user_fallback_selected', fallbackSetup.stableForMs);
        return;
      }
      this.floorSetup = {
        ...fallbackSetup,
        phase: 'ready',
        movementReady: true,
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
      return;
    }

    const readiness = this.movementReadiness.update(out, def.cameraView);
    const floorPostureReady = isFloorStartPostureReady(out);
    if (!readiness.ready || (handsFreeSetup && !floorPostureReady)) {
      const caption =
        handsFreeSetup && readiness.ready && !floorPostureReady
          ? "Move safely to the floor. I'll start once you're in position."
          : readiness.setupCaption;
      this.markFloorSetupWaitingForVisibility(readiness, caption);
      return;
    }

    const floorSetup = this.floorSetup;
    if (!floorSetup) return;
    if (floorSetup.finalPositionReadyAtMs === null) {
      if (voiceBusy) {
        this.floorSetup = {
          ...floorSetup,
          phase: 'stabilizing',
          movementReady: true,
          stableForMs: readiness.stableForMs,
          setupCaption: 'Hold the start position.',
          actionLabel: null,
        };
        this.instructionsIdleAtMs = -1;
        return;
      }
      this.markFloorSetupReadyFromSource(
        ts,
        u,
        handsFreeSetup ? 'camera_inferred' : null,
        readiness.stableForMs
      );
      return;
    }

    this.floorSetup = {
      ...floorSetup,
      phase: 'ready',
      movementReady: true,
      stableForMs: readiness.stableForMs,
      setupCaption: null,
      actionLabel: null,
      readinessSource: handsFreeSetup ? 'camera_inferred' : floorSetup.readinessSource,
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

  private exposeFloorSetupFallbackIfTimedOut(ts: number): void {
    if (!this.floorSetup || this.floorSetup.fallbackAvailable || this.floorSetup.movementReady) return;
    if (this.floorSetupListeningStartedMs < 0) this.floorSetupListeningStartedMs = ts;
    if (ts - this.floorSetupListeningStartedMs < TRAINING_FLOOR_SETUP_FALLBACK_TIMEOUT_MS) return;
    this.floorSetup = {
      ...this.floorSetup,
      phase: 'awaiting_user_transition',
      fallbackAvailable: true,
      setupCaption: "Having trouble detecting your position? Start when you're safely set.",
      actionLabel: "I'm ready",
    };
  }

  private markFloorSetupReadyFromSource(
    ts: number,
    u: TrainingFrameUpdate,
    source: TrainingFloorSetupReadinessSource | null,
    stableForMs: number
  ): void {
    if (!this.floorSetup) return;
    if (this.floorSetup.finalPositionReadyAtMs === null) {
      this.floorSetup = {
        ...this.floorSetup,
        phase: 'ready',
        movementReady: true,
        finalPositionReadyAtMs: ts,
        stableForMs,
        setupCaption: null,
        actionLabel: null,
        readinessSource: source,
      };
      this.floorMemory = {
        ...this.floorMemory,
        currentEnvironment: 'floor',
        currentFloorItemId: this.floorSetup.exerciseId,
      };
      this.instructionsIdleAtMs = -1;
      u.voice = cue('final-position-set-v21');
      return;
    }
    this.floorSetup = {
      ...this.floorSetup,
      phase: 'ready',
      movementReady: true,
      stableForMs,
      setupCaption: null,
      actionLabel: null,
      readinessSource: source,
    };
  }

  private markFloorSetupWaitingForVisibility(
    readiness: MovementCameraReadinessResult,
    captionOverride?: string | null
  ): void {
    if (!this.floorSetup) return;
    const phase: TrainingFinalPositionPhase = readiness.stableForMs > 0 ? 'stabilizing' : 'awaiting_visibility';
    this.floorSetup = {
      ...this.floorSetup,
      phase,
      movementReady: false,
      finalPositionReadyAtMs: null,
      stableForMs: readiness.stableForMs,
      setupCaption: captionOverride ?? readiness.setupCaption ?? 'Hold the start position.',
      actionLabel: this.floorSetup.fallbackAvailable ? this.floorSetup.actionLabel : null,
      readinessSource: null,
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
    if (this.isVoiceMode) {
      this.beginVoiceSet(ts);
      return;
    }
    this.funnel.setStarted(ts);
    const def = this.definitions[this.itemIndex];
    this.runtime = createTrainingSetRuntime({
      exerciseDefinition: def,
      generatedExercise: this.generatedByExerciseId.get(def.id) ?? null,
      trainingVoiceMode: this.options.trainingVoiceMode,
      runtimeCapabilities: this.options.runtimeCapabilities,
      restoredRuntime: this.options.restoredSetRuntime,
      setIndex: this.setIndex,
    });
    this.setStartMs = ts;
    const dose = this.effectiveDose(def);
    this.setDurationMs =
      def.timing?.mode === 'valid_time'
        ? null
        : def.kind === 'rom'
        ? (dose.secondsPerSet ?? def.prescription.captureSec ?? 12) * 1000
        : def.kind === 'timer'
          ? (dose.secondsPerSet ?? def.prescription.timerSec ?? def.prescription.holdSec ?? 20) * 1000
          : null;
    this.phase = 'set';
  }

  private runSet(out: PipelineFrameOutput, ts: number, u: TrainingFrameUpdate): void {
    const runtime = this.runtime as TrainingSetRuntime;
    const runtimeUpdate = runtime.update(out);
    const g = runtimeUpdate.setUpdate;
    u.playRepSound = g.repCredited;
    if (u.playRepSound) this.funnel.repCredited(ts);
    u.repCount = g.repCount;
    u.holdMs = g.holdMs;
    u.measuring = g.measuring;
    u.validTimeState = g.validTimeState ?? null;
    u.validTimeCaption = g.validTimeCaption ?? null;
    if (g.voice) u.voice = { cues: g.voice.cues, priority: g.voice.priority };
    if (g.validTimeState === 'paused' && this.lastValidTimeState !== 'paused') {
      const safety = this.currentSafetyProfile();
      const recoveryCueIds: readonly SafetyCueId[] = safety?.recoveryCueIds.length
        ? safety.recoveryCueIds
        : ['tracking_pause_and_reset'];
      this.emitSafety(u, recoveryCueIds, !g.voice);
    }
    this.lastValidTimeState = g.validTimeState ?? null;

    const def = this.definitions[this.itemIndex];
    const dose = this.effectiveDose(def);
    const elapsed = ts - this.setStartMs;
    const clockEnded = this.setDurationMs !== null && elapsed >= this.setDurationMs;
    const safetyEnded = this.setDurationMs === null && elapsed >= this.config.setSafetyMs;
    // The plan's daily rep dose ends the set even when the catalog grader
    // targets more reps — otherwise a reduced-dose user finishes their reps
    // and stands waiting for the safety clock.
    const doseRepsReached =
      runtime.kind === 'legacy' &&
      def.kind === 'reps' &&
      dose.repsPerSet !== undefined &&
      g.repCount >= dose.repsPerSet;
    u.remainingMs = Number.isFinite(g.remainingMs)
      ? (g.remainingMs as number)
      : this.setDurationMs !== null
        ? Math.max(0, this.setDurationMs - elapsed)
        : NaN;

    if (g.complete || clockEnded || safetyEnded || doseRepsReached) {
      this.currentSets.push(runtime.finish(ts));
      // Don't overwrite the autoregulation line ("that's your set") if present.
      if (this.setIndex + 1 < dose.sets) {
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
    this.restDurationMs = this.effectiveDose(def).restSec * 1000;
  }

  private runRest(ts: number, voiceBusy: boolean, u: TrainingFrameUpdate): void {
    const def = this.definitions[this.itemIndex];
    if (!this.restSpoken && !voiceBusy) {
      this.restSpoken = true;
      // Announce the final set so the user can pace the effort.
      const isLastUpcoming = this.setIndex + 2 === this.effectiveDose(def).sets;
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
    this.finished = {
      startedAt: this.startedAtIso,
      items: this.results.slice(),
      funnel: this.funnel.snapshot('done', true),
      ...(this.painEvents.length > 0 ? { painEvents: this.painEvents.slice() } : {}),
    };
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

  private shouldUseHandsFreeTrainingSetup(): boolean {
    return this.options.handsFreeTrainingSetup !== false;
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
      const plan = planTrainingVoiceSequenceV21({
        exerciseId: def.id,
        exposure: this.setIndex === 0 ? 'first_use' : 'later_set',
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
    this.floorSetupListeningStartedMs = -1;
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

function isFloorStartPostureReady(out: PipelineFrameOutput): boolean {
  if (out.state !== 'tracking' || !out.frame.hasPose || !out.validity.valid) return false;
  return (
    isFloorSideStartPostureReady(out, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_ANKLE) ||
    isFloorSideStartPostureReady(out, LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_ANKLE)
  );
}

function isFloorSideStartPostureReady(
  out: PipelineFrameOutput,
  shoulder: LM,
  hip: LM,
  ankle: LM
): boolean {
  const frame = out.frame;
  const shoulderX = frame.xs[shoulder];
  const shoulderY = frame.ys[shoulder];
  const hipX = frame.xs[hip];
  const hipY = frame.ys[hip];
  const ankleY = frame.ys[ankle];
  if (
    !Number.isFinite(shoulderX) ||
    !Number.isFinite(shoulderY) ||
    !Number.isFinite(hipX) ||
    !Number.isFinite(hipY) ||
    !Number.isFinite(ankleY)
  ) {
    return false;
  }
  const torsoHorizontal = Math.abs(shoulderX - hipX);
  const torsoVertical = Math.abs(shoulderY - hipY);
  const hipAboveAnkle = ankleY - hipY;
  return (
    torsoHorizontal > 0 &&
    torsoVertical <= torsoHorizontal * TRAINING_FLOOR_SETUP_FLOOR_POSTURE_TORSO_RATIO &&
    hipAboveAnkle <= TRAINING_FLOOR_SETUP_MAX_HIP_ABOVE_ANKLE_NORM
  );
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

function positiveInteger(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function positiveFinite(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}
