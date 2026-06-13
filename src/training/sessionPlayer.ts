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
 * ("good, that's your set"). An item that can't get framed in time is skipped
 * rather than blocking the session (product law 6).
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { VoiceRequest } from '../assessment/sessionController';
import { ExerciseDefinition, ExerciseSetGrader, SetResult, getExercise } from '../exercises';
import { PipelineFrameOutput } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt, PreflightStatus } from '../preflight/preflight';

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
  promptRepeatMs: 4000,
  postInstructionsDwellMs: 2000,
  countdownStepMs: 1000,
  transitionDwellMs: 1500,
  maxFramingMs: 60000,
  setSafetyMs: 120000,
};

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

export class TrainingSessionPlayer {
  private readonly config: TrainingPlayerConfig;
  private readonly startedAtIso: string;
  private readonly definitions: ExerciseDefinition[];
  private readonly preflight: PreflightCheck;
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
  };

  private phase: TrainingPhase = 'intro';
  private itemIndex = -1;
  private setIndex = 0;
  private introSpoken = false;

  private transitionEnteredMs = 0;
  private transitionCuePending: VoiceCueKey | null = null;
  private itemEnteredMs = 0;

  private instructionsEnteredMs = 0;
  private instructionsIdleAtMs = -1;
  private lastPromptCue: VoiceCueKey | null = null;
  private lastPromptAtMs = -Infinity;

  private countdownStartMs = 0;
  private countdownStep = 0;

  private grader: ExerciseSetGrader | null = null;
  private setStartMs = 0;
  /** Fixed set duration (rom capture window); null = grader-terminated. */
  private setDurationMs: number | null = null;
  private currentSets: SetResult[] = [];

  private restEnteredMs = 0;
  private restSpoken = false;
  private restDurationMs = 0;

  private completeSpoken = false;
  private finished: TrainingSessionResult | null = null;

  constructor(
    startedAtIso: string,
    exerciseIds: readonly string[],
    preflight: PreflightCheck,
    config: TrainingPlayerConfig = DEFAULT_TRAINING_CONFIG
  ) {
    this.startedAtIso = startedAtIso;
    this.preflight = preflight;
    this.config = config;
    this.definitions = exerciseIds.map((id) => getExercise(id));
  }

  get result(): TrainingSessionResult | null {
    return this.finished;
  }

  update(out: PipelineFrameOutput, voiceBusy: boolean): TrainingFrameUpdate {
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.remainingMs = NaN;
    u.measuring = false;
    const ts = out.frame.timestampMs;
    const status = this.preflight.update(out);

    switch (this.phase) {
      case 'intro':
        if (!this.introSpoken) {
          this.introSpoken = true;
          u.voice = cue('training-intro');
        } else if (!voiceBusy) {
          this.enterTransition(0, ts);
        }
        break;
      case 'transition':
        this.runTransition(ts, voiceBusy, u);
        break;
      case 'preflight':
        this.runPreflight(out, status, ts, u);
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
            u.voice = cue('session-complete');
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
    return u;
  }

  private currentDefinition(): ExerciseDefinition | null {
    return this.itemIndex >= 0 && this.itemIndex < this.definitions.length
      ? this.definitions[this.itemIndex]
      : null;
  }

  private enterTransition(index: number, ts: number): void {
    this.itemIndex = index;
    this.setIndex = 0;
    this.currentSets = [];
    this.phase = 'transition';
    this.transitionEnteredMs = ts;
    this.transitionCuePending = this.transitionCue(index);
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
      this.phase = 'preflight';
      this.lastPromptCue = null;
      this.lastPromptAtMs = -Infinity;
    }
  }

  private runPreflight(out: PipelineFrameOutput, status: PreflightStatus, ts: number, u: TrainingFrameUpdate): void {
    if (status.phase === 'ready' && out.bodyUnit !== null) {
      const def = this.definitions[this.itemIndex];
      this.phase = 'instructions';
      this.instructionsEnteredMs = ts;
      this.instructionsIdleAtMs = -1;
      u.voice = {
        cues: ['framing-ready', ...def.voice.instructions],
        priority: voicePriority(def.voice.instructions[0] ?? 'framing-ready'),
      };
      return;
    }
    // Skip an item that can't get framed in time (never blocks the session).
    if (ts - this.itemEnteredMs >= this.config.maxFramingMs) {
      this.results.push({ exerciseId: this.definitions[this.itemIndex].id, status: 'skipped', sets: [] });
      u.voice = cue('exercise-skipped');
      this.advanceItem(ts);
      return;
    }
    const c = promptCue(status.prompt);
    const changed = c !== this.lastPromptCue;
    if (changed || ts - this.lastPromptAtMs >= this.config.promptRepeatMs) {
      this.lastPromptCue = c;
      this.lastPromptAtMs = ts;
      u.voice = cue(c);
    }
  }

  private runInstructions(out: PipelineFrameOutput, voiceBusy: boolean, ts: number, u: TrainingFrameUpdate): void {
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

  private startCountdown(ts: number, u: TrainingFrameUpdate): void {
    this.phase = 'countdown';
    this.countdownStartMs = ts;
    this.countdownStep = 1;
    u.voice = cue(COUNTDOWN[0]);
  }

  private runCountdown(ts: number, u: TrainingFrameUpdate): void {
    if (
      this.countdownStep < COUNTDOWN.length &&
      ts - this.countdownStartMs >= this.countdownStep * this.config.countdownStepMs
    ) {
      const c = COUNTDOWN[this.countdownStep];
      this.countdownStep++;
      u.voice = cue(c);
      if (c === 'go') {
        const def = this.definitions[this.itemIndex];
        this.grader = def.createGrader();
        this.setStartMs = ts;
        this.setDurationMs = def.kind === 'rom' ? (def.prescription.captureSec ?? 12) * 1000 : null;
        this.phase = 'set';
      }
    }
  }

  private runSet(out: PipelineFrameOutput, ts: number, u: TrainingFrameUpdate): void {
    const grader = this.grader as ExerciseSetGrader;
    const g = grader.update(out);
    u.playRepSound = g.repCredited;
    u.repCount = g.repCount;
    u.holdMs = g.holdMs;
    u.measuring = g.measuring;
    if (g.voice) u.voice = { cues: g.voice.cues, priority: g.voice.priority };

    const elapsed = ts - this.setStartMs;
    const clockEnded = this.setDurationMs !== null && elapsed >= this.setDurationMs;
    const safetyEnded = this.setDurationMs === null && elapsed >= this.config.setSafetyMs;
    u.remainingMs = this.setDurationMs !== null ? Math.max(0, this.setDurationMs - elapsed) : NaN;

    if (g.complete || clockEnded || safetyEnded) {
      this.currentSets.push(grader.finish(ts));
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
      u.voice = cue(isLastUpcoming ? 'last-set' : 'rest-now');
    }
    u.remainingMs = Math.max(0, this.restDurationMs - (ts - this.restEnteredMs));
    if (this.restSpoken && !voiceBusy && ts - this.restEnteredMs >= this.restDurationMs) {
      this.setIndex++;
      this.startCountdown(ts, u);
    }
  }

  private advanceItem(ts: number): void {
    this.grader = null;
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
}

function cue(c: VoiceCueKey): VoiceRequest {
  return { cues: [c], priority: voicePriority(c) };
}

function promptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
}
