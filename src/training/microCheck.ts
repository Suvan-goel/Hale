/**
 * Weekly micro-check — a ~60-second single-item check between full Check-Ups,
 * feeding the trend line so progress stays visible without a 10-minute battery.
 * Three flavours, reusing the existing graders:
 *   chair-power        — 5 fast chair stands → rise velocity (RepsSetGrader)
 *   single-leg-balance — a single-leg hold → seconds (HoldSetGrader)
 *   mobility-reach     — standing hinge reach → wrist-to-floor body units
 *                         (same HingeReachGrader as the Movement Check-Up)
 *
 * MicroCheckRunner is a compact pure-TS state machine (preflight → instructions
 * → countdown → active → done), the same audio-first, frame-timestamp-driven
 * shape as the assessment SessionController, so it replays deterministically.
 * Its result maps onto the existing rise-velocity / single-leg-balance /
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { VoiceRequest } from '../assessment/sessionController';
import { normalizeMicroCheckMeasurementMetadata } from '../checkup/measurementMetadata';
import type { BodySide, MeasurementContext } from '../checkup/measurementContext';
import { ExerciseSetGrader, SetResult } from '../exercises';
import { HoldSetGrader, RepsSetGrader } from '../exercises/setGraders';
import { AUTOREG_VOICE } from '../exercises/common';
import {
  getMovement,
  HINGE_REACH_ID,
  type GraderUpdate,
  type HingeReachResult,
  type MovementGrader,
} from '../movements';
import { PipelineFrameOutput } from '../pose/pipeline';
import { PreflightCheck, PreflightPrompt } from '../preflight/preflight';
import { shouldSpeakFramingPrompt } from '../preflight/promptTiming';
import type { MovementDomain, TrainingMicroCheckTargetSource } from '../adherence/types';
import { MICRO_CHECK_DEFAULT_MAX_ACTIVE_MS } from './microCheckConfig';
import { planMicroCheckVoiceSequenceV21 } from './microCheckVoiceV21/sequencePlanner';

export type MicroCheckType = 'chair-power' | 'single-leg-balance' | 'mobility-reach';

export interface MicroCheckResult {
  id?: string;
  type: MicroCheckType;
  startedAt: string;
  completedAt?: string;
  slotId?: string;
  blockId?: string;
  policyVersion?: number;
  policyFingerprint?: string;
  targetSource?: TrainingMicroCheckTargetSource;
  targetDomain?: MovementDomain;
  scheduleWeekIndex?: number;
  scheduleWeekNumber?: number;
  measurementContext?: MeasurementContext;
  /** Rise velocity (bu/s), hold seconds, or forward-reach body units depending on type. */
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
  setupPrompt: PreflightPrompt | null;
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
  promptRepeatMs: 10000,
  postInstructionsDwellMs: 2000,
  countdownStepMs: 1000,
  maxActiveMs: MICRO_CHECK_DEFAULT_MAX_ACTIVE_MS,
  chairTargetReps: 5,
};

const COUNTDOWN: readonly VoiceCueKey[] = ['countdown-three', 'countdown-two', 'countdown-one', 'go'];

const INTRO_CUE: Record<MicroCheckType, VoiceCueKey> = {
  'chair-power': 'microcheck-chair',
  'single-leg-balance': 'microcheck-balance',
  'mobility-reach': 'hinge-intro',
};

const HINGE_REACH_DEFINITION = getMovement(HINGE_REACH_ID);

export class MicroCheckRunner {
  private readonly type: MicroCheckType;
  private readonly startedAtIso: string;
  private readonly config: MicroCheckConfig;
  private readonly preflight: PreflightCheck;
  private readonly measurementContext: MeasurementContext | null;
  private readonly voiceMode: 'legacy' | 'v21_beta';
  private readonly selectedSide: BodySide | null;
  private readonly grader: ExerciseSetGrader;
  private readonly update_: MicroCheckFrameUpdate = {
    phase: 'preflight',
    voice: null,
    playRepSound: false,
    repCount: 0,
    holdSec: NaN,
    remainingMs: NaN,
    measuring: false,
    setupPrompt: null,
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
    config: MicroCheckConfig = DEFAULT_MICROCHECK_CONFIG,
    measurementContext: MeasurementContext | null = null,
    options: { readonly voiceMode?: 'legacy' | 'v21_beta'; readonly selectedSide?: BodySide | null } = {}
  ) {
    this.type = type;
    this.startedAtIso = startedAtIso;
    this.config = config;
    this.preflight = preflight;
    this.measurementContext = measurementContext;
    this.voiceMode = options.voiceMode ?? 'legacy';
    this.selectedSide = options.selectedSide ?? measurementContext?.side?.selectedSide ?? null;
    this.grader = makeGrader(type, config);
  }

  get result(): MicroCheckResult | null {
    return this.finished;
  }

  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    if (Number.isFinite(this.lastPromptAtMs)) this.lastPromptAtMs += deltaMs;
    this.instructionsEnteredMs += deltaMs;
    if (this.instructionsIdleAtMs >= 0) this.instructionsIdleAtMs += deltaMs;
    this.countdownStartMs += deltaMs;
    this.activeStartMs += deltaMs;
    this.preflight.shiftTiming(deltaMs);
  }

  /**
   * A paused countdown or measurement is discarded and redone from the
   * instructions dwell: the grader is frame-timestamp driven and cannot span a
   * wall-clock pause without corrupting the measurement (a mid-hold pause
   * would credit the whole gap into the hold).
   */
  resetActiveMeasurement(atMs: number): boolean {
    if (this.phase !== 'countdown' && this.phase !== 'active') return false;
    this.grader.reset();
    this.phase = 'instructions';
    this.instructionsEnteredMs = atMs;
    this.instructionsIdleAtMs = -1;
    this.countdownStep = 0;
    return true;
  }

  notifyCountdownGoPlaybackStarted(timestampMs: number): boolean {
    if (this.voiceMode !== 'v21_beta' || this.phase !== 'countdown') return false;
    this.phase = 'active';
    this.activeStartMs = timestampMs;
    this.grader.reset();
    return true;
  }

  update(out: PipelineFrameOutput, voiceBusy: boolean): MicroCheckFrameUpdate {
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.remainingMs = NaN;
    u.measuring = false;
    const ts = out.frame.timestampMs;
    const status = this.preflight.update(out);
    u.setupPrompt = status.prompt;

    switch (this.phase) {
      case 'preflight': {
        if (status.phase === 'ready' && out.bodyUnit !== null) {
          this.phase = 'instructions';
          this.instructionsEnteredMs = ts;
          this.instructionsIdleAtMs = -1;
          const cues = this.instructionCues();
          u.voice = {
            cues: cues.slice(),
            priority: maxPriority(cues),
          };
          break;
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
          if (this.voiceMode === 'v21_beta') {
            this.countdownStep = COUNTDOWN.length;
            const cues: VoiceCueKey[] = ['final-position-set-v21', ...COUNTDOWN];
            u.voice = { cues, priority: maxPriority(cues) };
          } else {
            this.countdownStep = 1;
            u.voice = { cues: [COUNTDOWN[0]], priority: voicePriority(COUNTDOWN[0]) };
          }
        }
        break;
      }
      case 'countdown': {
        if (this.voiceMode === 'v21_beta') break;
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
        const activeWindowMs = this.activeWindowMs();
        u.remainingMs = Math.max(0, activeWindowMs - elapsed);
        if (g.complete || elapsed >= activeWindowMs) {
          this.finalize(this.grader.finish(ts));
          const completionCues = this.completionCues();
          u.voice = { cues: completionCues, priority: maxPriority(completionCues) };
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

  private instructionCues(): readonly VoiceCueKey[] {
    const legacyCues = this.type === 'mobility-reach'
      ? HINGE_REACH_DEFINITION.voice.instructions
      : [INTRO_CUE[this.type]];
    if (this.voiceMode !== 'v21_beta') {
      return ['framing-ready', ...legacyCues];
    }
    const plan = planMicroCheckVoiceSequenceV21({
      type: this.type,
      selectedSide: this.selectedSide,
      exposure: 'first_setup',
      phase: 'instruction',
    });
    if (!plan.ready) return ['framing-ready', ...legacyCues];
    return ['framing-ready', ...(plan.cueKeys as readonly VoiceCueKey[])];
  }

  private activeWindowMs(): number {
    if (this.type === 'mobility-reach' && HINGE_REACH_DEFINITION.durationMs !== null) {
      return HINGE_REACH_DEFINITION.durationMs;
    }
    return this.config.maxActiveMs;
  }

  private completionCues(): VoiceCueKey[] {
    const completionCue = this.voiceMode === 'v21_beta' ? 'microcheck-complete-v21' : 'microcheck-complete';
    if (this.type === 'mobility-reach') {
      const endCue = HINGE_REACH_DEFINITION.voice.endCue;
      return endCue ? [endCue, completionCue] : [completionCue];
    }
    return [completionCue];
  }

  private finalize(set: SetResult): void {
    const resultBase = {
      type: this.type,
      startedAt: this.startedAtIso,
      measurementContext: this.measurementContext ?? undefined,
    };
    if (this.type === 'chair-power') {
      this.finished = {
        ...resultBase,
        value: set.meanVel,
        reps: set.reps,
        measured: set.reps > 0 && Number.isFinite(set.meanVel),
      };
    } else if (this.type === 'single-leg-balance') {
      this.finished = {
        ...resultBase,
        value: set.holdSec,
        reps: 0,
        measured: Number.isFinite(set.holdSec) && set.holdSec > 0,
      };
    } else {
      this.finished = {
        ...resultBase,
        value: set.romPeak,
        reps: 0,
        measured: Number.isFinite(set.romPeak),
      };
    }
    this.finished = {
      ...this.finished,
      measurementContext: normalizeMicroCheckMeasurementMetadata(this.finished, {
        measurementContext: this.finished.measurementContext,
      }),
    };
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
  if (type === 'mobility-reach') {
    return new HingeReachMicroCheckGrader();
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
    validTime: false,
  });
}

class HingeReachMicroCheckGrader implements ExerciseSetGrader {
  private readonly grader: MovementGrader<HingeReachResult>;

  constructor() {
    this.grader = HINGE_REACH_DEFINITION.createGrader() as MovementGrader<HingeReachResult>;
  }

  update(out: PipelineFrameOutput) {
    return setUpdateFromMovementUpdate(this.grader.update(out));
  }

  finish(timestampMs: number): SetResult {
    const result = this.grader.finish(timestampMs);
    const reachBu = typeof result.reachBu === 'number' && Number.isFinite(result.reachBu)
      ? result.reachBu
      : NaN;
    return {
      exerciseId: HINGE_REACH_ID,
      reps: 0,
      meanVel: NaN,
      holdSec: NaN,
      romPeak: reachBu,
      autoregulated: false,
      reachedTarget: Number.isFinite(reachBu),
      interruptions: result.interruptions,
      flags: result.flags.slice(),
      ...(result.validTime ? { validTime: result.validTime } : {}),
    };
  }

  reset(): void {
    this.grader.reset();
  }
}

function setUpdateFromMovementUpdate(update: GraderUpdate) {
  return {
    repCredited: update.repCredited,
    repCount: update.repCount,
    measuring: update.measuring,
    holdMs: 0,
    autoregulationStop: false,
    complete: update.complete,
    voice: update.voice,
  };
}

function maxPriority(cues: readonly VoiceCueKey[]): number {
  return cues.reduce((max, cueKey) => Math.max(max, voicePriority(cueKey)), 0);
}


function promptCue(prompt: PreflightPrompt): VoiceCueKey {
  return prompt === 'ready' ? 'framing-ready' : prompt;
}
