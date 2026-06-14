/**
 * Weekly micro-check — a ~60-second single-item check between full Check-Ups,
 * feeding the trend line so progress stays visible without a 10-minute battery.
 * Two flavours, both reusing the existing set graders:
 *   chair-power        — 5 fast chair stands → rise velocity (RepsSetGrader)
 *   single-leg-balance — a single-leg hold → seconds (HoldSetGrader)
 *
 * MicroCheckRunner is a compact pure-TS state machine (preflight → instructions
 * → countdown → active → done), the same audio-first, frame-timestamp-driven
 * shape as the assessment SessionController, so it replays deterministically.
 * Its result maps onto the existing rise-velocity / single-leg-balance trend
 * keys via microCheckTrendPoints().
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { VoiceRequest } from '../assessment/sessionController';
import { ExerciseSetGrader, SetResult } from '../exercises';
import { HoldSetGrader, RepsSetGrader } from '../exercises/setGraders';
import { AUTOREG_VOICE } from '../exercises/common';
import { ExtraTrendPoint } from '../history';
import { PipelineFrameOutput } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt } from '../preflight/preflight';

export type MicroCheckType = 'chair-power' | 'single-leg-balance';

export interface MicroCheckResult {
  type: MicroCheckType;
  startedAt: string;
  /** Rise velocity (bu/s) for chair-power; hold seconds for single-leg-balance. */
  value: number;
  /** Chair stands credited (chair-power); 0 otherwise. */
  reps: number;
  measured: boolean;
}

export type MicroCheckPhase = 'preflight' | 'instructions' | 'countdown' | 'active' | 'done';

export interface MicroCheckFrameUpdate {
  phase: MicroCheckPhase;
  voice: VoiceRequest | null;
  playRepSound: boolean;
  repCount: number;
  holdSec: number;
  remainingMs: number;
  measuring: boolean;
}

export interface MicroCheckConfig {
  promptRepeatMs: number;
  postInstructionsDwellMs: number;
  countdownStepMs: number;
  /** Hard cap on the active window (the grader usually ends sooner). */
  maxActiveMs: number;
  /** chair-power: stop after this many fast stands. */
  chairTargetReps: number;
}

export const DEFAULT_MICROCHECK_CONFIG: MicroCheckConfig = {
  promptRepeatMs: 4000,
  postInstructionsDwellMs: 2000,
  countdownStepMs: 1000,
  maxActiveMs: 45000,
  chairTargetReps: 5,
};

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

const INTRO_CUE: Record<MicroCheckType, VoiceCueKey> = {
  'chair-power': 'microcheck-chair',
  'single-leg-balance': 'microcheck-balance',
};

export class MicroCheckRunner {
  private readonly type: MicroCheckType;
  private readonly startedAtIso: string;
  private readonly config: MicroCheckConfig;
  private readonly preflight: PreflightCheck;
  private readonly grader: ExerciseSetGrader;
  private readonly update_: MicroCheckFrameUpdate = {
    phase: 'preflight',
    voice: null,
    playRepSound: false,
    repCount: 0,
    holdSec: NaN,
    remainingMs: NaN,
    measuring: false,
  };

  private phase: MicroCheckPhase = 'preflight';
  private lastPromptCue: VoiceCueKey | null = null;
  private lastPromptAtMs = -Infinity;
  private instructionsEnteredMs = 0;
  private instructionsIdleAtMs = -1;
  private countdownStartMs = 0;
  private countdownStep = 0;
  private activeStartMs = 0;
  private finished: MicroCheckResult | null = null;

  constructor(
    type: MicroCheckType,
    startedAtIso: string,
    preflight: PreflightCheck,
    config: MicroCheckConfig = DEFAULT_MICROCHECK_CONFIG
  ) {
    this.type = type;
    this.startedAtIso = startedAtIso;
    this.config = config;
    this.preflight = preflight;
    this.grader = makeGrader(type, config);
  }

  get result(): MicroCheckResult | null {
    return this.finished;
  }

  update(out: PipelineFrameOutput, voiceBusy: boolean): MicroCheckFrameUpdate {
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.remainingMs = NaN;
    u.measuring = false;
    const ts = out.frame.timestampMs;
    const status = this.preflight.update(out);

    switch (this.phase) {
      case 'preflight': {
        if (status.phase === 'ready' && out.bodyUnit !== null) {
          this.phase = 'instructions';
          this.instructionsEnteredMs = ts;
          this.instructionsIdleAtMs = -1;
          u.voice = {
            cues: ['framing-ready', INTRO_CUE[this.type]],
            priority: voicePriority(INTRO_CUE[this.type]),
          };
          break;
        }
        const c = promptCue(status.prompt);
        if (c !== this.lastPromptCue || ts - this.lastPromptAtMs >= this.config.promptRepeatMs) {
          this.lastPromptCue = c;
          this.lastPromptAtMs = ts;
          u.voice = { cues: [c], priority: voicePriority(c) };
        }
        break;
      }
      case 'instructions': {
        if (ts - this.instructionsEnteredMs < 1000) break;
        if (voiceBusy) {
          this.instructionsIdleAtMs = -1;
          break;
        }
        if (this.instructionsIdleAtMs < 0) this.instructionsIdleAtMs = ts;
        if (ts - this.instructionsIdleAtMs >= this.config.postInstructionsDwellMs && out.state === 'tracking') {
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
          const c = COUNTDOWN[this.countdownStep];
          this.countdownStep++;
          u.voice = { cues: [c], priority: voicePriority(c) };
          if (c === 'go') {
            this.phase = 'active';
            this.activeStartMs = ts;
            this.grader.reset();
          }
        }
        break;
      }
      case 'active': {
        const g = this.grader.update(out);
        u.playRepSound = g.repCredited;
        u.repCount = g.repCount;
        u.holdSec = g.holdMs > 0 ? g.holdMs / 1000 : NaN;
        u.measuring = g.measuring;
        const elapsed = ts - this.activeStartMs;
        u.remainingMs = Math.max(0, this.config.maxActiveMs - elapsed);
        if (g.complete || elapsed >= this.config.maxActiveMs) {
          this.finalize(this.grader.finish(ts));
          u.voice = { cues: ['microcheck-complete'], priority: voicePriority('microcheck-complete') };
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

  private finalize(set: SetResult): void {
    if (this.type === 'chair-power') {
      this.finished = {
        type: this.type,
        startedAt: this.startedAtIso,
        value: set.meanVel,
        reps: set.reps,
        measured: set.reps > 0 && Number.isFinite(set.meanVel),
      };
    } else {
      this.finished = {
        type: this.type,
        startedAt: this.startedAtIso,
        value: set.holdSec,
        reps: 0,
        measured: Number.isFinite(set.holdSec) && set.holdSec > 0,
      };
    }
  }
}

function makeGrader(type: MicroCheckType, config: MicroCheckConfig): ExerciseSetGrader {
  if (type === 'chair-power') {
    return new RepsSetGrader({
      exerciseId: 'micro-chair-power',
      signal: { cycleA: 'hip', cycleVertex: 'knee', cycleB: 'ankle', riseLandmark: 'hip' },
      upEnterDeg: 155,
      downEnterDeg: 110,
      cycleEmaAlpha: 1,
      velocityEmaAlpha: 0.3,
      targetReps: config.chairTargetReps,
      autoregulate: false,
      maxReps: 16,
      autoregVoice: AUTOREG_VOICE,
    });
  }
  return new HoldSetGrader({
    exerciseId: 'micro-single-leg',
    condition: 'single-leg',
    targetSec: 40, // a generous cap; touchdown ends it sooner
    singleLegLiftBu: 0.18,
    stepOutBu: 0.55,
    bridgeUpDeg: 150,
    startDebounceFrames: 4,
    endDebounceFrames: 4,
  });
}

/** Map a micro-check result onto the existing trend metric keys. */
export function microCheckTrendPoints(results: readonly MicroCheckResult[]): ExtraTrendPoint[] {
  const out: ExtraTrendPoint[] = [];
  for (const r of results) {
    if (!r.measured) continue;
    const key = r.type === 'chair-power' ? 'rise-velocity' : 'single-leg-balance';
    out.push({ key, at: r.startedAt, value: r.value });
  }
  return out;
}

function promptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
}
