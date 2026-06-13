/**
 * Voice-guided assessment session controller — pure TS state machine.
 *
 *   preflight → instructions → countdown → active → result → done
 *
 * Audio-first: after propping the phone the user never touches the screen.
 * The session auto-starts once framing + calibration are good, the item
 * auto-runs for its duration, and the result is spoken. The controller emits
 * VOICE REQUESTS; the screen owns actual playback and reports back whether
 * the voice channel is busy (`voiceBusy`), which gates phase advancement —
 * instructions are never cut off by the countdown.
 *
 * All timing derives from frame timestamps, so a recorded session replays
 * the entire flow deterministically in tests.
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { GraderUpdate, MovementDefinition, MovementGrader, MovementResultBase } from '../movements';
import { PipelineFrameOutput } from '../pose/pipeline';
import { PreflightPrompt, PreflightStatus } from '../preflight/preflight';

export type AssessmentPhase =
  | 'preflight'
  | 'instructions'
  | 'countdown'
  | 'active'
  | 'result'
  | 'done';

export interface VoiceRequest {
  cues: VoiceCueKey[];
  priority: number;
}

export interface SessionFrameUpdate {
  phase: AssessmentPhase;
  /** Voice lines requested THIS frame; null on almost every frame. */
  voice: VoiceRequest | null;
  /** Rep-credit chime trigger. */
  playRepSound: boolean;
  repCount: number;
  /** ms left in the active window; NaN outside 'active'. */
  remainingMs: number;
  /** Whether the grader is actually measuring (active phase only). */
  measuring: boolean;
}

export interface SessionControllerConfig {
  /** Repeat an unchanged framing prompt no more often than this. */
  promptRepeatMs: number;
  /** Quiet settling time between instructions ending and the countdown. */
  postInstructionsDwellMs: number;
  countdownStepMs: number;
  /** Pause after the result sentence before the session counts as done. */
  resultLingerMs: number;
}

export const DEFAULT_SESSION_CONFIG: SessionControllerConfig = {
  promptRepeatMs: 4000,
  postInstructionsDwellMs: 2500,
  countdownStepMs: 1000,
  resultLingerMs: 800,
};

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

export class SessionController<R extends MovementResultBase = MovementResultBase> {
  readonly definition: MovementDefinition<R>;

  private readonly config: SessionControllerConfig;
  private readonly grader: MovementGrader<R>;
  private readonly durationMs: number;
  private readonly update_: SessionFrameUpdate = {
    phase: 'preflight',
    voice: null,
    playRepSound: false,
    repCount: 0,
    remainingMs: NaN,
    measuring: false,
  };

  private phase: AssessmentPhase = 'preflight';
  private lastPromptCue: VoiceCueKey | null = null;
  private lastPromptAtMs = -Infinity;
  private instructionsEnteredAtMs = 0;
  private instructionsIdleAtMs = -1;
  private countdownStartMs = 0;
  private countdownStep = 0;
  private activeStartMs = 0;
  private finishedResult: R | null = null;
  private resultSpokenAtMs = -1;

  constructor(
    definition: MovementDefinition<R>,
    config: SessionControllerConfig = DEFAULT_SESSION_CONFIG
  ) {
    if (definition.durationMs === null) {
      throw new Error(`movement '${definition.id}' has no fixed duration; V1 flow needs one`);
    }
    this.definition = definition;
    this.durationMs = definition.durationMs;
    this.config = config;
    this.grader = definition.createGrader();
  }

  get result(): R | null {
    return this.finishedResult;
  }

  /** Feed one pipeline frame + current pre-flight status. Reused output. */
  update(
    out: PipelineFrameOutput,
    preflight: PreflightStatus,
    voiceBusy: boolean
  ): SessionFrameUpdate {
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.remainingMs = NaN;
    u.measuring = false;
    const ts = out.frame.timestampMs;

    switch (this.phase) {
      case 'preflight': {
        if (preflight.phase === 'ready' && out.bodyUnit !== null) {
          this.phase = 'instructions';
          this.instructionsEnteredAtMs = ts;
          this.instructionsIdleAtMs = -1;
          u.voice = {
            cues: ['framing-ready', ...this.definition.voice.instructions],
            priority: voicePriority(this.definition.voice.instructions[0] ?? 'framing-ready'),
          };
          break;
        }
        const cue = promptCue(preflight.prompt);
        const changed = cue !== this.lastPromptCue;
        if (changed || ts - this.lastPromptAtMs >= this.config.promptRepeatMs) {
          this.lastPromptCue = cue;
          this.lastPromptAtMs = ts;
          u.voice = { cues: [cue], priority: voicePriority(cue) };
        }
        break;
      }

      case 'instructions': {
        // Give playback a beat to report busy before trusting "idle".
        if (ts - this.instructionsEnteredAtMs < 1000) break;
        if (voiceBusy) {
          this.instructionsIdleAtMs = -1;
          break;
        }
        if (this.instructionsIdleAtMs < 0) this.instructionsIdleAtMs = ts;
        const settled = ts - this.instructionsIdleAtMs >= this.config.postInstructionsDwellMs;
        if (settled && out.state === 'tracking') {
          this.phase = 'countdown';
          this.countdownStartMs = ts;
          this.countdownStep = 1;
          u.voice = { cues: [COUNTDOWN[0]], priority: voicePriority(COUNTDOWN[0]) };
        }
        break;
      }

      case 'countdown': {
        if (
          this.countdownStep < COUNTDOWN.length &&
          ts - this.countdownStartMs >= this.countdownStep * this.config.countdownStepMs
        ) {
          const cue = COUNTDOWN[this.countdownStep];
          this.countdownStep++;
          u.voice = { cues: [cue], priority: voicePriority(cue) };
          if (cue === 'go') {
            this.phase = 'active';
            this.activeStartMs = ts;
            this.grader.reset();
          }
        }
        break;
      }

      case 'active': {
        const graderUpdate: GraderUpdate = this.grader.update(out);
        u.playRepSound = graderUpdate.repCredited;
        u.repCount = graderUpdate.repCount;
        u.measuring = graderUpdate.measuring;
        u.remainingMs = Math.max(0, this.durationMs - (ts - this.activeStartMs));
        if (ts - this.activeStartMs >= this.durationMs) {
          this.finishedResult = this.grader.finish(ts);
          this.phase = 'result';
          this.resultSpokenAtMs = -1;
          u.voice = { cues: ['times-up'], priority: voicePriority('times-up') };
          u.remainingMs = 0;
        }
        break;
      }

      case 'result': {
        if (voiceBusy) break;
        if (this.resultSpokenAtMs < 0) {
          const result = this.finishedResult as R;
          u.voice = {
            cues: this.definition.resultCues(result),
            priority: voicePriority('you-completed'),
          };
          this.resultSpokenAtMs = ts;
        } else if (ts - this.resultSpokenAtMs >= this.config.resultLingerMs) {
          this.phase = 'done';
        }
        break;
      }

      case 'done':
        break;
    }

    u.phase = this.phase;
    return u;
  }

  reset(): void {
    this.phase = 'preflight';
    this.lastPromptCue = null;
    this.lastPromptAtMs = -Infinity;
    this.instructionsIdleAtMs = -1;
    this.countdownStep = 0;
    this.finishedResult = null;
    this.resultSpokenAtMs = -1;
    this.grader.reset();
    this.update_.repCount = 0;
  }
}

function promptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
}
