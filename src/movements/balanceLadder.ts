/**
 * Balance ladder (front view) — Balance domain.
 *
 * A voice-guided progression of timed stances: feet-together → tandem →
 * single-leg, eyes open then closed. Each stage occupies a FIXED time block
 * (getReady + hold window) announced by voice, so the flow is fully scripted
 * and deterministic — the grader owns the schedule and emits the stage cues
 * (including the eyes-closed prompt) mid-activity.
 *
 * What a 2D front view can honestly measure (CLAUDE.md: 2D can't see depth, so
 * semi-tandem vs tandem is indistinguishable — we don't pretend): per-stage
 * MAINTAINED-HOLD duration via a HoldTracker, where the termination condition
 * is stance-specific —
 *   single-leg : foot stays raised (ankle vertical separation); touchdown ends.
 *   narrow base: feet stay close and down; a recovery step (ankle horizontal
 *                separation spike) or a foot lift ends it.
 * plus the sway proxy = SD of pelvis-midpoint x in body units (HoldTracker's
 * Welford accumulator). Stance correctness is set by the voice instruction;
 * the camera measures how long it was held and how much it wobbled.
 *
 * Headline for scoring: the single-leg eyes-open hold (Bohannon norms).
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { HoldOutput, HoldTracker } from '../grading';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM, midpointX } from '../pose/types';
import { GraderUpdate, MovementDefinition, MovementGrader, MovementResultBase } from './types';
import { registerMovement } from './registry';

export const BALANCE_LADDER_ID = 'balance-ladder';

/** Getting-into-position lead-in before each stage's hold window. */
export const BALANCE_GET_READY_MS = 3000;

export type BalanceStance = 'feet-together' | 'semi-tandem' | 'tandem' | 'single-leg';

export interface BalanceStageConfig {
  stance: BalanceStance;
  eyesClosed: boolean;
  /** Hold window length (timed to termination within it). */
  windowMs: number;
}

export type BalanceTermination =
  | 'completed'
  | 'touchdown'
  | 'step'
  | 'not-attempted'
  | 'interrupted';

export interface BalanceStageResult {
  stance: BalanceStance;
  eyesClosed: boolean;
  /** Maintained-hold duration, seconds. */
  holdSec: number;
  /** Sway proxy: SD of pelvis-midpoint x over the hold, body units; NaN if never held. */
  swaySd: number;
  terminated: BalanceTermination;
}

export interface BalanceResult extends MovementResultBase {
  stages: BalanceStageResult[];
  /** Single-leg eyes-open hold, seconds (Bohannon headline); NaN if not done. */
  singleLegEyesOpenSec: number;
}

export interface BalanceConfig {
  stages: BalanceStageConfig[];
  getReadyMs: number;
  /** Ankle vertical separation (bu) above which a foot counts as raised. */
  singleLegLiftBu: number;
  /** Ankle horizontal separation (bu) above which a narrow base has broken. */
  stepOutBu: number;
  startDebounceFrames: number;
  endDebounceFrames: number;
}

export const DEFAULT_BALANCE_STAGES: BalanceStageConfig[] = [
  { stance: 'feet-together', eyesClosed: false, windowMs: 10000 },
  { stance: 'feet-together', eyesClosed: true, windowMs: 10000 },
  { stance: 'tandem', eyesClosed: false, windowMs: 10000 },
  { stance: 'tandem', eyesClosed: true, windowMs: 10000 },
  { stance: 'single-leg', eyesClosed: false, windowMs: 12000 },
];

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
  stages: DEFAULT_BALANCE_STAGES,
  getReadyMs: BALANCE_GET_READY_MS,
  singleLegLiftBu: 0.18,
  stepOutBu: 0.55,
  startDebounceFrames: 4,
  endDebounceFrames: 4,
};

const STANCE_CUE: Record<BalanceStance, VoiceCueKey> = {
  'feet-together': 'balance-feet-together',
  'semi-tandem': 'balance-semi-tandem',
  tandem: 'balance-tandem',
  'single-leg': 'balance-single-leg',
};

class BalanceGrader implements MovementGrader<BalanceResult> {
  private readonly config: BalanceConfig;
  private readonly blockLen: number[];
  private readonly cumStart: number[];
  private readonly results: BalanceStageResult[] = [];
  private readonly liveUpdate: GraderUpdate = {
    repCredited: false,
    repCount: 0,
    measuring: false,
    complete: false,
    voice: null,
  };

  private activeStartMs = -1;
  private stageIndex = -1;
  private tracker: HoldTracker | null = null;
  private holdOut: HoldOutput | null = null;
  private interruptedCurrent = false;
  private prevEyesClosed = false;
  private interruptions = 0;

  constructor(config: BalanceConfig) {
    this.config = config;
    this.blockLen = config.stages.map((s) => config.getReadyMs + s.windowMs);
    this.cumStart = [];
    let cum = 0;
    for (const len of this.blockLen) {
      this.cumStart.push(cum);
      cum += len;
    }
  }

  update(out: PipelineFrameOutput): GraderUpdate {
    const live = this.liveUpdate;
    live.voice = null;
    live.complete = false;

    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone') {
        this.interruptions++;
        if (this.tracker) this.tracker.interrupt();
        this.interruptedCurrent = true;
      }
    }

    const measuring = out.state === 'tracking' && out.frame.hasPose && out.bodyUnit !== null;
    if (!measuring) {
      live.measuring = false;
      return live;
    }
    const frame = out.frame;
    const bodyUnit = out.bodyUnit as number;
    const ts = frame.timestampMs;

    if (this.activeStartMs < 0) this.activeStartMs = ts;
    const elapsed = ts - this.activeStartMs;

    // Which stage block are we in? (exact cumulative offsets — drift-proof)
    let target = 0;
    while (target < this.blockLen.length && elapsed >= this.cumStart[target] + this.blockLen[target]) {
      target++;
    }

    if (target !== this.stageIndex) {
      // Crossed a boundary (or the very first frame): close the old stage,
      // open the new one (announcing it), or finish the item.
      if (this.stageIndex >= 0 && this.stageIndex < this.config.stages.length) {
        this.finalizeStage(this.stageIndex);
      }
      this.stageIndex = target;
      if (target >= this.config.stages.length) {
        live.measuring = false;
        live.complete = true;
        return live;
      }
      this.enterStage(target, live);
    }

    const stage = this.config.stages[this.stageIndex];
    const phaseInStage = elapsed - this.cumStart[this.stageIndex];
    const inHold = phaseInStage >= this.config.getReadyMs && phaseInStage < this.blockLen[this.stageIndex];
    live.measuring = inHold;

    if (inHold && this.tracker) {
      const met = this.conditionMet(stage.stance, frame, bodyUnit);
      const sway = midpointX(frame, LM.LEFT_HIP, LM.RIGHT_HIP) / bodyUnit;
      this.holdOut = this.tracker.update(met, sway, ts);
    }
    return live;
  }

  private enterStage(index: number, live: GraderUpdate): void {
    const stage = this.config.stages[index];
    this.tracker = new HoldTracker({
      startDebounceFrames: this.config.startDebounceFrames,
      endDebounceFrames: this.config.endDebounceFrames,
      maxHoldMs: Infinity, // the fixed window bounds the measurement
    });
    this.holdOut = null;
    this.interruptedCurrent = false;

    const cues: VoiceCueKey[] = [STANCE_CUE[stage.stance]];
    if (stage.eyesClosed && !this.prevEyesClosed) cues.push('close-your-eyes');
    else if (!stage.eyesClosed && this.prevEyesClosed) cues.push('open-your-eyes');
    this.prevEyesClosed = stage.eyesClosed;
    live.voice = { cues, priority: voicePriority(STANCE_CUE[stage.stance]) };
  }

  private finalizeStage(index: number): void {
    const stage = this.config.stages[index];
    const o = this.holdOut;
    let terminated: BalanceTermination;
    let holdMs = o ? o.holdMs : 0;
    const swaySd = o ? o.swaySd : NaN;
    if (this.interruptedCurrent) {
      terminated = 'interrupted';
    } else if (!o || o.phase === 'waiting') {
      terminated = 'not-attempted';
      holdMs = 0;
    } else if (o.phase === 'holding') {
      terminated = 'completed'; // still holding when the window closed
    } else if (o.endReason === 'condition-lost') {
      terminated = stage.stance === 'single-leg' ? 'touchdown' : 'step';
    } else {
      terminated = 'completed';
    }
    this.results.push({
      stance: stage.stance,
      eyesClosed: stage.eyesClosed,
      holdSec: holdMs / 1000,
      swaySd: Number.isNaN(swaySd) ? 0 : swaySd,
      terminated,
    });
  }

  private conditionMet(stance: BalanceStance, frame: PipelineFrameOutput['frame'], bodyUnit: number): boolean {
    const ankleYSepBu = Math.abs(frame.ys[LM.LEFT_ANKLE] - frame.ys[LM.RIGHT_ANKLE]) / bodyUnit;
    if (stance === 'single-leg') {
      return ankleYSepBu > this.config.singleLegLiftBu;
    }
    const ankleXSepBu = Math.abs(frame.xs[LM.LEFT_ANKLE] - frame.xs[LM.RIGHT_ANKLE]) / bodyUnit;
    return ankleXSepBu < this.config.stepOutBu && ankleYSepBu < this.config.singleLegLiftBu;
  }

  finish(): BalanceResult {
    // Close any stage still open (e.g. the item was cut short by the cap).
    if (this.stageIndex >= 0 && this.stageIndex < this.config.stages.length && this.results.length === this.stageIndex) {
      this.finalizeStage(this.stageIndex);
    }
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    if (this.results.length < this.config.stages.length) flags.push('incomplete');

    const singleLegOpen = this.results.find(
      (r) => r.stance === 'single-leg' && !r.eyesClosed
    );
    // A not-attempted / interrupted stance yields no usable hold time — report
    // it as unmeasured (NaN), distinct from a genuine 0-second hold.
    const measured =
      singleLegOpen !== undefined &&
      singleLegOpen.terminated !== 'not-attempted' &&
      singleLegOpen.terminated !== 'interrupted';
    return {
      movementId: BALANCE_LADDER_ID,
      stages: this.results.slice(),
      singleLegEyesOpenSec: measured ? (singleLegOpen as BalanceStageResult).holdSec : NaN,
      flags,
      interruptions: this.interruptions,
    };
  }

  reset(): void {
    this.results.length = 0;
    this.activeStartMs = -1;
    this.stageIndex = -1;
    this.tracker = null;
    this.holdOut = null;
    this.interruptedCurrent = false;
    this.prevEyesClosed = false;
    this.interruptions = 0;
    this.liveUpdate.measuring = false;
    this.liveUpdate.complete = false;
    this.liveUpdate.voice = null;
  }
}

export const balanceLadderDefinition: MovementDefinition<BalanceResult> = {
  id: BALANCE_LADDER_ID,
  displayName: 'Balance',
  cameraView: { view: 'front', requiredReliableSideChains: 2 },
  equipment: ['none'],
  durationMs: null, // grader-terminated: the staged schedule ends it
  voice: {
    instructions: ['balance-intro', 'balance-setup'],
  },
  createGrader: () => new BalanceGrader(DEFAULT_BALANCE_CONFIG),
  resultCues(): VoiceCueKey[] {
    return ['item-complete'];
  },
};

registerMovement(balanceLadderDefinition);
