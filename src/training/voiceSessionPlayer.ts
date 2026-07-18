/** Voice-only daily session state machine. Camera measurement belongs exclusively to Check-Up. */
import { voicePriority, type VoiceCueKey } from '../audio/cues';
import { getExercise, type ExerciseDefinition, type SetResult } from '../exercises';
import type { VoiceIntent } from '../voice/intents';
import { SessionFunnelTracker, type TrainingSessionFunnel } from './sessionFunnel';
import {
  VOICE_SESSION_GLOBAL_SAFETY_CUE_IDS,
  plannedSafetyCueSnapshotForExercises,
  safetyCueTexts,
  type PlannedExerciseSafetyCueProfile,
  type SafetyCueId,
} from './safetyCues';
import type { TrainingSetRuntimeGeneratedExercise } from './setRuntime';

export type TrainingPhase =
  | 'intro'
  | 'transition'
  | 'instructions'
  | 'waiting_ready'
  | 'countdown'
  | 'set'
  | 'rest'
  | 'voice_paused'
  | 'complete'
  | 'done';

export interface VoiceRequest {
  cues: VoiceCueKey[];
  priority: number;
}

export interface TrainingPainEvent {
  exerciseId: string;
  setIndex: number;
  timestampMs: number;
}

export interface TrainingItemResult {
  exerciseId: string;
  status: 'completed' | 'skipped';
  skipReason?: 'pain';
  sets: SetResult[];
}

export interface TrainingSessionResult {
  startedAt: string;
  items: TrainingItemResult[];
  funnel?: TrainingSessionFunnel;
  painEvents?: TrainingPainEvent[];
}

export interface TrainingFrameUpdate {
  phase: TrainingPhase;
  setIndex: number;
  totalSets: number;
  currentExerciseId: string | null;
  voice: VoiceRequest | null;
  holdMs: number;
  remainingMs: number;
  tapPromptHighlighted: boolean;
  stopRequested: boolean;
  bonusOfferPending: boolean;
  /** A just-finished rep set is open for the ±rep correction right now. */
  repAdjustAvailable: boolean;
  safetyCueIds: readonly SafetyCueId[];
  safetyText: readonly string[];
}

export interface VoiceSessionPlayerOptions {
  readonly generatedExercises?: readonly TrainingSetRuntimeGeneratedExercise[];
  readonly resolveExercise?: (exerciseId: string) => ExerciseDefinition;
  readonly resolveSafetyProfile?: (exerciseId: string) => PlannedExerciseSafetyCueProfile;
  readonly bonusSetOffer?: {
    readonly exerciseIds: readonly string[];
    readonly offerCue: VoiceCueKey;
  };
}

export const VOICE_SESSION_TIMING = {
  countdownStepMs: 1000,
  transitionDwellMs: 1500,
  readyRepromptMs: 20000,
  defaultRepDurationMs: 4000,
  minExpectedSetMs: 30000,
  doneRepromptFactor: 2,
} as const;

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

export class VoiceSessionPlayer {
  private readonly startedAtIso: string;
  private readonly definitions: ExerciseDefinition[];
  private readonly funnel = new SessionFunnelTracker();
  private readonly results: TrainingItemResult[] = [];
  private readonly generatedByExerciseId: Map<string, TrainingSetRuntimeGeneratedExercise>;
  private readonly safetyByExerciseId: Map<string, PlannedExerciseSafetyCueProfile>;
  private readonly options: VoiceSessionPlayerOptions;
  private readonly painEvents: TrainingPainEvent[] = [];

  private phase: TrainingPhase = 'intro';
  private itemIndex = -1;
  private setIndex = 0;
  private introSpoken = false;
  private transitionEnteredMs = 0;
  private transitionCuePending: VoiceCueKey | null = null;
  private instructionsEnteredMs = 0;
  private instructionsPending = false;
  private waitingReadyEnteredMs = 0;
  private readyReprompted = false;
  private tapPromptHighlighted = false;
  private countdownStartMs = 0;
  private countdownStep = 0;
  private setStartMs = 0;
  private setDurationMs: number | null = null;
  private voiceSetOpenEnded = false;
  private voiceSetExpectedMs = 0;
  private doneReprompted = false;
  private currentSets: SetResult[] = [];
  private restEnteredMs = 0;
  private restSpoken = false;
  private restDurationMs = 0;
  private completeSpoken = false;
  private finished: TrainingSessionResult | null = null;
  private pendingVoiceLine: VoiceRequest | null = null;
  private lastTimestampMs = 0;
  private voicePauseContext: 'rest' | 'active' | null = null;
  private voicePausedMidRepSet = false;
  private voicePausedDuringBonusOffer = false;
  private stopRequested = false;
  private bonusOfferPending = false;
  private bonusSetsGranted = 0;
  private readonly bonusOfferedItemIds = new Set<string>();
  private adjustableCompletedItemIndex: number | null = null;

  constructor(startedAtIso: string, exerciseIds: readonly string[], options: VoiceSessionPlayerOptions = {}) {
    this.startedAtIso = startedAtIso;
    this.options = options;
    this.definitions = exerciseIds.map(options.resolveExercise ?? getExercise);
    this.generatedByExerciseId = new Map(
      (options.generatedExercises ?? []).map((exercise) => [exercise.exerciseId, exercise])
    );
    const safety = plannedSafetyCueSnapshotForExercises(exerciseIds, options.resolveSafetyProfile);
    this.safetyByExerciseId = new Map(
      safety.exerciseProfiles.map((profile) => [profile.exerciseId, profile])
    );
  }

  get result(): TrainingSessionResult | null {
    return this.finished;
  }

  funnelSnapshot(): TrainingSessionFunnel {
    return this.funnel.snapshot(this.phase, this.phase === 'done');
  }

  painEventsSnapshot(): TrainingPainEvent[] {
    return this.painEvents.map((event) => ({ ...event }));
  }

  completedItemsSnapshot(): TrainingItemResult[] {
    return this.results.map((item) => ({
      exerciseId: item.exerciseId,
      status: item.status,
      ...(item.skipReason ? { skipReason: item.skipReason } : {}),
      sets: item.sets.slice(),
    }));
  }

  tick(timestampMs: number, voiceBusy: boolean): TrainingFrameUpdate {
    const update: TrainingFrameUpdate = {
      phase: this.phase,
      setIndex: this.setIndex,
      totalSets: 0,
      currentExerciseId: null,
      voice: null,
      holdMs: 0,
      remainingMs: NaN,
      tapPromptHighlighted: this.tapPromptHighlighted,
      stopRequested: this.stopRequested,
      bonusOfferPending: this.bonusOfferPending,
      repAdjustAvailable: false,
      safetyCueIds: [],
      safetyText: [],
    };
    this.lastTimestampMs = timestampMs;
    this.funnel.sessionStarted(timestampMs);

    let busy = voiceBusy;
    if (this.pendingVoiceLine && !busy) {
      update.voice = this.pendingVoiceLine;
      this.pendingVoiceLine = null;
      busy = true;
    }

    switch (this.phase) {
      case 'intro':
        if (!this.introSpoken && !busy) {
          this.introSpoken = true;
          update.voice = cueSequence(['training-intro', ...VOICE_SESSION_GLOBAL_SAFETY_CUE_IDS]);
          this.emitSafety(update, VOICE_SESSION_GLOBAL_SAFETY_CUE_IDS);
        } else if (this.introSpoken && !busy) {
          this.enterTransition(0, timestampMs);
        }
        break;
      case 'transition':
        if (this.transitionCuePending && !busy) {
          update.voice = cue(this.transitionCuePending);
          this.transitionCuePending = null;
        } else if (!busy && timestampMs - this.transitionEnteredMs >= VOICE_SESSION_TIMING.transitionDwellMs) {
          const definition = this.currentDefinition();
          if (definition) this.funnel.itemSetupStarted(definition.id, timestampMs);
          this.phase = 'instructions';
          this.instructionsEnteredMs = timestampMs;
          this.instructionsPending = true;
        }
        break;
      case 'instructions':
        this.runInstructions(timestampMs, busy, update);
        break;
      case 'waiting_ready':
        this.runWaitingReady(timestampMs, busy, update);
        break;
      case 'countdown':
        this.runCountdown(timestampMs, update);
        break;
      case 'set':
        this.runSet(timestampMs, busy, update);
        break;
      case 'rest':
        this.runRest(timestampMs, busy, update);
        break;
      case 'complete':
        if (!this.completeSpoken && !busy) {
          this.completeSpoken = true;
          update.voice = cue('session-complete');
        } else if (this.completeSpoken && !busy) {
          this.finish();
          this.phase = 'done';
        }
        break;
      default:
        break;
    }

    const definition = this.currentDefinition();
    update.phase = this.phase;
    update.setIndex = this.setIndex;
    update.currentExerciseId = definition?.id ?? null;
    update.totalSets = definition ? this.effectiveDose(definition).sets + this.bonusSetsGranted : 0;
    update.tapPromptHighlighted = this.tapPromptHighlighted;
    update.stopRequested = this.stopRequested;
    update.bonusOfferPending = this.bonusOfferPending;
    update.repAdjustAvailable = this.adjustableLastSet()?.reportedReps !== undefined;
    return update;
  }

  handleSessionIntent(intent: VoiceIntent, atMs: number = this.lastTimestampMs): boolean {
    switch (intent) {
      case 'ready': return this.confirmReady(atMs);
      case 'done': return this.completeCurrentSet(atMs);
      case 'skip': return this.phase === 'rest' ? this.skipRest(atMs) : this.skipCurrentItem();
      case 'repeat': return this.repeatVoiceInstructions(atMs);
      case 'pause': return this.haltVoiceSession(false);
      case 'stop': return this.haltVoiceSession(true);
      case 'resume': return this.resumeVoiceSession(atMs);
      case 'pain': return this.recordPainHalt(atMs);
      default: return false;
    }
  }

  confirmReady(atMs: number = this.lastTimestampMs): boolean {
    if (this.phase === 'rest' && this.bonusOfferPending) {
      this.bonusOfferPending = false;
      this.bonusSetsGranted++;
      this.setIndex++;
    } else if (this.phase !== 'waiting_ready') {
      return false;
    }
    this.tapPromptHighlighted = false;
    this.phase = 'countdown';
    this.countdownStartMs = atMs;
    // Every countdown cue flows through runCountdown's clock (step 0 fires on
    // the next tick). A pending "three" used to be clobbered by "two" when the
    // channel was still busy with the ready prompt at confirm time.
    this.countdownStep = 0;
    return true;
  }

  completeCurrentSet(atMs: number = this.lastTimestampMs): boolean {
    if (this.phase !== 'set') return false;
    this.finishSet(atMs, true);
    return true;
  }

  skipCurrentItem(): boolean {
    if (!this.currentDefinition() || ['intro', 'transition', 'complete', 'done'].includes(this.phase)) return false;
    this.funnel.itemSkipped();
    this.results.push({
      exerciseId: this.definitions[this.itemIndex].id,
      status: 'skipped',
      sets: this.currentSets.slice(),
    });
    this.currentSets = [];
    this.stopRequested = false;
    this.voicePauseContext = null;
    this.tapPromptHighlighted = false;
    this.advanceItem(this.lastTimestampMs);
    return true;
  }

  skipRest(atMs: number = this.lastTimestampMs): boolean {
    if (this.phase !== 'rest') return false;
    this.restSpoken = true;
    this.restEnteredMs = atMs - this.restDurationMs;
    return true;
  }

  adjustReportedReps(delta: number): boolean {
    if (!Number.isInteger(delta)) return false;
    const set = this.adjustableLastSet();
    if (!set || set.reportedReps === undefined) return false;
    const prescribed = set.reportedReps - (set.repsAdjusted ?? 0);
    set.reportedReps = Math.max(0, set.reportedReps + delta);
    const adjustment = set.reportedReps - prescribed;
    if (adjustment === 0) delete set.repsAdjusted;
    else set.repsAdjusted = adjustment;
    return true;
  }

  repeatVoiceInstructions(atMs: number = this.lastTimestampMs): boolean {
    if (this.phase !== 'waiting_ready') return false;
    const definition = this.currentDefinition();
    if (!definition) return false;
    this.pendingVoiceLine = cueSequence(uniqueVoiceCues([...definition.voice.instructions, 'voice-say-ready']));
    this.waitingReadyEnteredMs = atMs;
    this.readyReprompted = false;
    return true;
  }

  haltVoiceSession(stopRequested: boolean, _atMs: number = this.lastTimestampMs): boolean {
    if (!['waiting_ready', 'countdown', 'set', 'rest'].includes(this.phase)) {
      if (this.phase === 'voice_paused' && stopRequested) {
        this.stopRequested = true;
        return true;
      }
      return false;
    }
    this.voicePauseContext = this.phase === 'rest' ? 'rest' : 'active';
    this.voicePausedMidRepSet = this.phase === 'set' && this.voiceSetOpenEnded;
    // A pause that rides over a pending bonus offer withdraws it: the planned
    // sets are done, and resume must never start a set she was no longer
    // being asked about.
    this.voicePausedDuringBonusOffer = this.phase === 'rest' && this.bonusOfferPending;
    if (this.voicePausedDuringBonusOffer) this.bonusOfferPending = false;
    this.phase = 'voice_paused';
    this.stopRequested = stopRequested;
    this.tapPromptHighlighted = false;
    this.setDurationMs = null;
    this.pendingVoiceLine = cue('paused-v21');
    return true;
  }

  resumeVoiceSession(atMs: number = this.lastTimestampMs): boolean {
    if (this.phase !== 'voice_paused') return false;
    this.stopRequested = false;
    if (this.voicePauseContext === 'rest' && this.voicePausedDuringBonusOffer) {
      // The pause declined the offer; resuming completes the item instead of
      // treating the offer rest as an ordinary between-sets rest.
      this.voicePausedDuringBonusOffer = false;
      this.voicePauseContext = null;
      this.voicePausedMidRepSet = false;
      this.completeCurrentItem(atMs);
      return true;
    }
    if (this.voicePauseContext === 'rest') this.setIndex++;
    this.voicePauseContext = null;
    this.enterWaitingReady(atMs, null);
    if (this.voicePausedMidRepSet) {
      this.pendingVoiceLine = cueSequence(['voice-resume-counts', 'voice-say-ready']);
    }
    this.voicePausedMidRepSet = false;
    return true;
  }

  recordPainHalt(atMs: number = this.lastTimestampMs): boolean {
    const definition = this.currentDefinition();
    if (!definition || ['intro', 'transition', 'complete', 'done'].includes(this.phase)) return false;
    this.painEvents.push({ exerciseId: definition.id, setIndex: this.setIndex, timestampMs: atMs });
    this.funnel.itemSkipped();
    this.results.push({
      exerciseId: definition.id,
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

  private runInstructions(ts: number, busy: boolean, update: TrainingFrameUpdate): void {
    if (this.instructionsPending) {
      if (busy) return;
      this.instructionsPending = false;
      this.adjustableCompletedItemIndex = null;
      const definition = this.currentDefinition();
      if (!definition) return;
      const safety = this.currentSafetyProfile();
      const safetyCueIds = uniqueSafety([...(safety?.setupCueIds ?? []), ...(safety?.activeCueIds ?? [])]);
      update.voice = cueSequence(uniqueVoiceCues([...definition.voice.instructions, ...safetyCueIds]));
      this.emitSafety(update, safetyCueIds);
      return;
    }
    if (!busy && ts - this.instructionsEnteredMs >= 1000) this.enterWaitingReady(ts, update);
  }

  private enterWaitingReady(ts: number, update: TrainingFrameUpdate | null): void {
    this.phase = 'waiting_ready';
    this.waitingReadyEnteredMs = ts;
    this.readyReprompted = false;
    this.tapPromptHighlighted = false;
    const prompt = cue('voice-say-ready');
    if (update && update.voice === null) update.voice = prompt;
    else this.pendingVoiceLine = prompt;
  }

  private runWaitingReady(ts: number, busy: boolean, update: TrainingFrameUpdate): void {
    if (!this.readyReprompted && !busy && !update.voice && ts - this.waitingReadyEnteredMs >= VOICE_SESSION_TIMING.readyRepromptMs) {
      this.readyReprompted = true;
      this.tapPromptHighlighted = true;
      update.voice = cue('voice-say-ready-reprompt');
    }
  }

  private runCountdown(ts: number, update: TrainingFrameUpdate): void {
    // Never overwrite a line already emitted this tick (e.g. a just-consumed
    // pending line); the missed step fires on the next tick instead.
    if (update.voice) return;
    if (this.countdownStep < COUNTDOWN.length && ts - this.countdownStartMs >= this.countdownStep * VOICE_SESSION_TIMING.countdownStepMs) {
      const nextCue = COUNTDOWN[this.countdownStep++];
      update.voice = cue(nextCue);
      if (nextCue === 'go') this.beginSet(ts);
    }
  }

  private beginSet(ts: number): void {
    this.funnel.setStarted(ts);
    const definition = this.definitions[this.itemIndex];
    const dose = this.effectiveDose(definition);
    this.voiceSetOpenEnded = definition.kind === 'reps';
    if (this.voiceSetOpenEnded) {
      this.setDurationMs = null;
      this.voiceSetExpectedMs = Math.max(VOICE_SESSION_TIMING.minExpectedSetMs, (dose.repsPerSet ?? 10) * VOICE_SESSION_TIMING.defaultRepDurationMs);
    } else {
      const seconds = dose.secondsPerSet ?? definition.prescription.holdSec ?? definition.prescription.timerSec ?? definition.prescription.captureSec ?? 20;
      this.setDurationMs = seconds * 1000;
      this.voiceSetExpectedMs = this.setDurationMs;
    }
    this.setStartMs = ts;
    this.doneReprompted = false;
    this.tapPromptHighlighted = false;
    this.phase = 'set';
  }

  private runSet(ts: number, busy: boolean, update: TrainingFrameUpdate): void {
    const definition = this.definitions[this.itemIndex];
    const elapsed = ts - this.setStartMs;
    if (this.voiceSetOpenEnded) {
      if (!this.doneReprompted && !busy && !update.voice && elapsed >= this.voiceSetExpectedMs * VOICE_SESSION_TIMING.doneRepromptFactor) {
        this.doneReprompted = true;
        this.tapPromptHighlighted = true;
        update.voice = cue('voice-done-reprompt');
      }
      return;
    }
    const durationMs = this.setDurationMs as number;
    update.remainingMs = Math.max(0, durationMs - elapsed);
    if (definition.kind === 'hold') update.holdMs = Math.min(elapsed, durationMs);
    if (elapsed >= durationMs) this.finishSet(ts, true);
  }

  private finishSet(ts: number, completed: boolean): void {
    const definition = this.definitions[this.itemIndex];
    const dose = this.effectiveDose(definition);
    const elapsedSec = this.setDurationMs === null ? NaN : Math.min(Math.max(0, ts - this.setStartMs), this.setDurationMs) / 1000;
    this.currentSets.push({
      exerciseId: definition.id,
      reps: 0,
      meanVel: NaN,
      holdSec: this.voiceSetOpenEnded ? NaN : elapsedSec,
      romPeak: NaN,
      autoregulated: false,
      reachedTarget: completed,
      interruptions: 0,
      flags: ['voice-guided'],
      ...(this.voiceSetOpenEnded && dose.repsPerSet !== undefined ? { reportedReps: dose.repsPerSet } : {}),
    });
    if (this.setIndex + 1 < dose.sets + this.bonusSetsGranted) this.enterRest(ts);
    else if (completed && this.bonusOfferEligible(definition.id)) {
      this.bonusOfferedItemIds.add(definition.id);
      this.bonusOfferPending = true;
      this.enterRest(ts);
    } else this.completeCurrentItem(ts);
  }

  private enterRest(ts: number): void {
    const definition = this.definitions[this.itemIndex];
    this.phase = 'rest';
    this.restEnteredMs = ts;
    this.restSpoken = false;
    this.restDurationMs = this.effectiveDose(definition).restSec * 1000;
  }

  private runRest(ts: number, busy: boolean, update: TrainingFrameUpdate): void {
    const definition = this.definitions[this.itemIndex];
    if (!this.restSpoken && !busy && !update.voice) {
      this.restSpoken = true;
      // Founder ruling 2026-07-18: repeated-set safety cues speak at the
      // item's FIRST rest only — later rests stay quiet ("silence by
      // default"); the screen keeps the cues readable throughout.
      const safetyCueIds =
        this.setIndex === 0 ? this.currentSafetyProfile()?.repeatedSetCueIds ?? [] : [];
      const restCue = this.bonusOfferPending
        ? this.options.bonusSetOffer!.offerCue
        : this.setIndex + 2 === this.effectiveDose(definition).sets + this.bonusSetsGranted
          ? 'last-set'
          : 'rest-now';
      update.voice = cueSequence([restCue, ...safetyCueIds]);
      if (safetyCueIds.length > 0) this.emitSafety(update, safetyCueIds);
    }
    update.remainingMs = Math.max(0, this.restDurationMs - (ts - this.restEnteredMs));
    if (this.restSpoken && !busy && ts - this.restEnteredMs >= this.restDurationMs) {
      if (this.bonusOfferPending) this.completeCurrentItem(ts);
      else {
        this.setIndex++;
        this.enterWaitingReady(ts, update.voice === null ? update : null);
      }
    }
  }

  private completeCurrentItem(ts: number): void {
    const definition = this.definitions[this.itemIndex];
    this.bonusOfferPending = false;
    this.results.push({ exerciseId: definition.id, status: 'completed', sets: this.currentSets.slice() });
    this.adjustableCompletedItemIndex = this.results.length - 1;
    this.currentSets = [];
    this.advanceItem(ts);
  }

  private advanceItem(ts: number): void {
    const next = this.itemIndex + 1;
    if (next >= this.definitions.length) {
      this.phase = 'complete';
      this.completeSpoken = false;
    } else this.enterTransition(next, ts);
  }

  private enterTransition(index: number, ts: number): void {
    this.itemIndex = index;
    this.setIndex = 0;
    this.currentSets = [];
    this.bonusOfferPending = false;
    this.bonusSetsGranted = 0;
    this.voicePausedDuringBonusOffer = false;
    this.phase = 'transition';
    this.transitionEnteredMs = ts;
    this.transitionCuePending = index === 0 ? null : 'next-up';
  }

  private finish(): void {
    for (let index = this.results.length; index < this.definitions.length; index++) {
      this.results.push({ exerciseId: this.definitions[index].id, status: 'skipped', sets: [] });
    }
    this.finished = {
      startedAt: this.startedAtIso,
      items: this.results.slice(),
      funnel: this.funnel.snapshot('done', true),
      ...(this.painEvents.length ? { painEvents: this.painEvents.slice() } : {}),
    };
  }

  private currentDefinition(): ExerciseDefinition | null {
    return this.itemIndex >= 0 && this.itemIndex < this.definitions.length ? this.definitions[this.itemIndex] : null;
  }

  private currentSafetyProfile(): PlannedExerciseSafetyCueProfile | null {
    const definition = this.currentDefinition();
    return definition ? this.safetyByExerciseId.get(definition.id) ?? null : null;
  }

  private effectiveDose(definition: ExerciseDefinition) {
    const generated = this.generatedByExerciseId.get(definition.id);
    return {
      sets: positiveInteger(generated?.sets) ?? definition.prescription.sets,
      repsPerSet: positiveInteger(generated?.repsPerSet) ?? definition.prescription.repsPerSet,
      secondsPerSet: positiveFinite(generated?.secondsPerSet),
      restSec: positiveFinite(generated?.restSeconds) ?? definition.prescription.restSec,
    };
  }

  private bonusOfferEligible(exerciseId: string): boolean {
    const offer = this.options.bonusSetOffer;
    return Boolean(offer && offer.exerciseIds.includes(exerciseId) && !this.bonusOfferedItemIds.has(exerciseId));
  }

  private adjustableLastSet(): SetResult | null {
    if (this.phase === 'rest') return this.currentSets[this.currentSets.length - 1] ?? null;
    if (['transition', 'instructions', 'complete'].includes(this.phase) && this.adjustableCompletedItemIndex !== null) {
      const item = this.results[this.adjustableCompletedItemIndex];
      return item?.sets[item.sets.length - 1] ?? null;
    }
    return null;
  }

  private emitSafety(update: TrainingFrameUpdate, cueIds: readonly SafetyCueId[]): void {
    const ids = uniqueSafety(cueIds);
    update.safetyCueIds = ids;
    update.safetyText = safetyCueTexts(ids);
  }
}

function cue(key: VoiceCueKey): VoiceRequest {
  return { cues: [key], priority: voicePriority(key) };
}

function cueSequence(keys: readonly VoiceCueKey[]): VoiceRequest {
  return { cues: keys.slice(), priority: keys.reduce((value, key) => Math.max(value, voicePriority(key)), 0) };
}

function uniqueVoiceCues(keys: readonly VoiceCueKey[]): VoiceCueKey[] {
  return keys.filter((key, index) => keys.indexOf(key) === index);
}

function uniqueSafety(keys: readonly SafetyCueId[]): SafetyCueId[] {
  return keys.filter((key, index) => keys.indexOf(key) === index);
}

function positiveInteger(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function positiveFinite(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}
