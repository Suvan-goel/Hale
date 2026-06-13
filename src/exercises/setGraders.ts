/**
 * The three reusable per-set graders every training exercise composes — one
 * per ExerciseKind, each wrapping a grading primitive and adding only the
 * set-level concerns (rep target, hold target, velocity autoregulation). Each
 * exercise file supplies a thin signal config; all landmark→signal extraction
 * and the near-side selection / subject-gone reset discipline live here, lifted
 * straight from the proven movement graders (chairStand / shoulderFlexion /
 * balanceLadder).
 *
 *   RepsSetGrader — RepVelocityTracker: angle-cycle reps + concentric velocity,
 *                   with the autoregulator ending the set when power fades.
 *   HoldSetGrader — HoldTracker: a timed hold to a target (or early break).
 *   RomSetGrader  — MaxRomTracker: peak angle/distance over a capture window.
 *
 * Hot-path discipline matches the movement graders: a reused liveUpdate object,
 * allocation-free update(), and an interruption resets the in-flight rep/hold
 * so re-entry can never double-count.
 */

import { GraderVoice } from '../movements';
import { HoldOutput, HoldTracker, MaxRomOutput, MaxRomTracker, RepVelocityTracker } from '../grading';
import { CHAIN_IDS } from '../pose/chains';
import { angleAtDeg, headYawDeg } from '../pose/geometry';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM, PoseFrame } from '../pose/types';
import { AutoregulatorConfig, DEFAULT_AUTOREGULATOR_CONFIG, VelocityAutoregulator } from './autoregulation';
import { ExerciseSetGrader, SetGraderUpdate, SetResult } from './types';

const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');

/** Side-relative landmark tokens; resolved to a concrete LM by near-side pick. */
export type SideLandmark = 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle' | 'heel' | 'foot';

const LEFT: Record<SideLandmark, LM> = {
  shoulder: LM.LEFT_SHOULDER,
  elbow: LM.LEFT_ELBOW,
  wrist: LM.LEFT_WRIST,
  hip: LM.LEFT_HIP,
  knee: LM.LEFT_KNEE,
  ankle: LM.LEFT_ANKLE,
  heel: LM.LEFT_HEEL,
  foot: LM.LEFT_FOOT_INDEX,
};
const RIGHT: Record<SideLandmark, LM> = {
  shoulder: LM.RIGHT_SHOULDER,
  elbow: LM.RIGHT_ELBOW,
  wrist: LM.RIGHT_WRIST,
  hip: LM.RIGHT_HIP,
  knee: LM.RIGHT_KNEE,
  ankle: LM.RIGHT_ANKLE,
  heel: LM.RIGHT_HEEL,
  foot: LM.RIGHT_FOOT_INDEX,
};

function side(token: SideLandmark, isLeft: boolean): LM {
  return (isLeft ? LEFT : RIGHT)[token];
}

function freshUpdate(): SetGraderUpdate {
  return {
    repCredited: false,
    repCount: 0,
    measuring: false,
    holdMs: 0,
    autoregulationStop: false,
    complete: false,
    voice: null,
  };
}

// ---------------------------------------------------------------------------
// RepsSetGrader
// ---------------------------------------------------------------------------

/**
 * Landmark→signal config for a rep-based set: the angle that drives rep
 * segmentation (a→vertex→b on the near side) and the vertical landmark whose
 * RISE is the concentric phase (velocity, body units/sec). Mirrors the chair
 * stand exactly: knee angle cycles, near hip height gives velocity.
 */
export interface RepsSignalSpec {
  cycleA: SideLandmark;
  cycleVertex: SideLandmark;
  cycleB: SideLandmark;
  /** Vertical-height landmark for concentric velocity (rising = concentric). */
  riseLandmark: SideLandmark;
}

export interface RepsSetConfig {
  exerciseId: string;
  signal: RepsSignalSpec;
  /** Hysteresis: angle ≥ upEnter commits the top (credits the rep). */
  upEnterDeg: number;
  /** Angle ≤ downEnter re-arms the next rep. */
  downEnterDeg: number;
  cycleEmaAlpha: number;
  velocityEmaAlpha: number;
  /** Prescribed reps; the set completes at this count (or on autoregulation). */
  targetReps: number;
  /** Velocity autoregulation governs the set end. */
  autoregulate: boolean;
  autoregulator?: AutoregulatorConfig;
  /** Storage cap; reps beyond it keep counting but drop velocity stats. */
  maxReps: number;
  /** Voice line spoken when autoregulation ends the set ("that's your set"). */
  autoregVoice: GraderVoice;
}

export class RepsSetGrader implements ExerciseSetGrader {
  private readonly config: RepsSetConfig;
  private readonly velocity: RepVelocityTracker;
  private readonly autoregulator: VelocityAutoregulator;
  private readonly live: SetGraderUpdate = freshUpdate();

  private sideIsLeft = false;
  private sideLocked = false;
  private inAscent = false;
  private interruptions = 0;
  private autoregulated = false;
  private done = false;

  constructor(config: RepsSetConfig) {
    this.config = config;
    this.velocity = new RepVelocityTracker({
      cycle: { upEnter: config.upEnterDeg, downEnter: config.downEnterDeg, emaAlpha: config.cycleEmaAlpha },
      velocityEmaAlpha: config.velocityEmaAlpha,
      maxReps: config.maxReps,
    });
    this.autoregulator = new VelocityAutoregulator(config.autoregulator ?? DEFAULT_AUTOREGULATOR_CONFIG);
  }

  update(out: PipelineFrameOutput): SetGraderUpdate {
    const live = this.live;
    live.repCredited = false;
    live.voice = null;
    live.autoregulationStop = false;

    if (this.done) {
      live.measuring = false;
      live.complete = true;
      live.repCount = this.velocity.repCount;
      return live;
    }

    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone') {
        this.interruptions++;
        this.velocity.resetState();
        this.inAscent = false;
        this.sideLocked = false;
      }
    }

    const measuring = out.state === 'tracking' && out.frame.hasPose && out.bodyUnit !== null;
    live.measuring = measuring;
    if (!measuring) {
      live.repCount = this.velocity.repCount;
      return live;
    }
    const frame = out.frame;
    const bodyUnit = out.bodyUnit as number;

    // Near-side selection, sticky while a rep is in flight (the chair-stand rule).
    if (!this.sideLocked) {
      this.sideIsLeft = out.chainReliability[LEFT_SIDE_CHAIN] >= out.chainReliability[RIGHT_SIDE_CHAIN];
      this.sideLocked = true;
    }
    const s = this.config.signal;
    const a = side(s.cycleA, this.sideIsLeft);
    const vertex = side(s.cycleVertex, this.sideIsLeft);
    const b = side(s.cycleB, this.sideIsLeft);
    const rise = side(s.riseLandmark, this.sideIsLeft);

    const cycleAngle = angleAtDeg(frame, a, vertex, b);
    // Image y grows downward; negate so increasing position = rising = concentric.
    const riseBu = -frame.ys[rise] / bodyUnit;

    const vOut = this.velocity.update(cycleAngle, riseBu, frame.timestampMs);
    const events = vOut.cycle.events;
    for (let i = 0; i < events.length; i++) {
      const type = events[i].type;
      if (type === 'ascent-start') {
        this.inAscent = true;
      } else if (type === 'rep') {
        this.inAscent = false;
        live.repCredited = true;
        // Feed the just-credited rep's velocity to the autoregulator.
        if (this.config.autoregulate && this.autoregulator.addRep(vOut.lastRepMeanVel)) {
          this.autoregulated = true;
        }
      } else if (type === 'ascent-abort') {
        this.inAscent = false;
      }
    }
    if (!vOut.cycle.inTransition && !this.inAscent) this.sideLocked = false;

    live.repCount = this.velocity.repCount;

    const targetReached = this.velocity.repCount >= this.config.targetReps;
    if (this.autoregulated || targetReached) {
      this.done = true;
      live.complete = true;
      if (this.autoregulated) {
        live.autoregulationStop = true;
        live.voice = this.config.autoregVoice;
      }
    }
    return live;
  }

  finish(): SetResult {
    const reps = this.velocity.repCount;
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    if (reps === 0) flags.push('no-measurement');
    return {
      exerciseId: this.config.exerciseId,
      reps,
      meanVel: this.velocity.sessionMeanVel,
      holdSec: NaN,
      romPeak: NaN,
      autoregulated: this.autoregulated,
      reachedTarget: reps >= this.config.targetReps,
      interruptions: this.interruptions,
      flags,
    };
  }

  reset(): void {
    this.velocity.reset();
    this.autoregulator.reset();
    this.sideLocked = false;
    this.inAscent = false;
    this.interruptions = 0;
    this.autoregulated = false;
    this.done = false;
    this.live.repCredited = false;
    this.live.repCount = 0;
    this.live.measuring = false;
    this.live.complete = false;
    this.live.autoregulationStop = false;
    this.live.voice = null;
  }
}

// ---------------------------------------------------------------------------
// HoldSetGrader
// ---------------------------------------------------------------------------

/** Hold condition: how a balance/isometric set's maintained-hold is measured. */
export type HoldCondition = 'single-leg' | 'narrow-base' | 'bridge-up';

export interface HoldSetConfig {
  exerciseId: string;
  condition: HoldCondition;
  /** Target hold seconds — the set completes (max-duration) at this. */
  targetSec: number;
  /** Ankle vertical separation (bu) above which a foot counts as raised. */
  singleLegLiftBu: number;
  /** Ankle horizontal separation (bu) above which a narrow base has broken. */
  stepOutBu: number;
  /** Hip-extension angle (shoulder→hip→knee) above which a bridge counts as up. */
  bridgeUpDeg: number;
  startDebounceFrames: number;
  endDebounceFrames: number;
}

export class HoldSetGrader implements ExerciseSetGrader {
  private readonly config: HoldSetConfig;
  private readonly tracker: HoldTracker;
  private readonly live: SetGraderUpdate = freshUpdate();
  private holdOut: HoldOutput | null = null;
  private interruptions = 0;

  constructor(config: HoldSetConfig) {
    this.config = config;
    this.tracker = new HoldTracker({
      startDebounceFrames: config.startDebounceFrames,
      endDebounceFrames: config.endDebounceFrames,
      maxHoldMs: config.targetSec * 1000,
    });
  }

  update(out: PipelineFrameOutput): SetGraderUpdate {
    const live = this.live;
    live.voice = null;
    live.complete = false;
    live.repCredited = false;

    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone') {
        this.interruptions++;
        this.tracker.interrupt();
      }
    }

    const measuring = out.state === 'tracking' && out.frame.hasPose && out.bodyUnit !== null;
    if (!measuring) {
      live.measuring = false;
      return live;
    }
    const frame = out.frame;
    const bodyUnit = out.bodyUnit as number;
    const met = this.conditionMet(frame, bodyUnit);
    const sway = ((frame.xs[LM.LEFT_HIP] + frame.xs[LM.RIGHT_HIP]) * 0.5) / bodyUnit;
    this.holdOut = this.tracker.update(met, sway, frame.timestampMs);

    live.measuring = this.holdOut.phase === 'holding';
    live.holdMs = this.holdOut.holdMs;
    // Set completes when the hold ends (target reached, foot down, or step).
    live.complete = this.holdOut.phase === 'ended';
    return live;
  }

  private conditionMet(frame: PoseFrame, bodyUnit: number): boolean {
    if (this.config.condition === 'bridge-up') {
      // Supine bridge: trunk-extension angle (shoulder→hip→knee) rises as the
      // hips lift. Side/oblique view; the left chain is picked deterministically.
      return angleAtDeg(frame, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE) >= this.config.bridgeUpDeg;
    }
    const ankleYSepBu = Math.abs(frame.ys[LM.LEFT_ANKLE] - frame.ys[LM.RIGHT_ANKLE]) / bodyUnit;
    if (this.config.condition === 'single-leg') {
      return ankleYSepBu > this.config.singleLegLiftBu;
    }
    const ankleXSepBu = Math.abs(frame.xs[LM.LEFT_ANKLE] - frame.xs[LM.RIGHT_ANKLE]) / bodyUnit;
    return ankleXSepBu < this.config.stepOutBu && ankleYSepBu < this.config.singleLegLiftBu;
  }

  finish(): SetResult {
    const o = this.holdOut;
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    const held = o !== null && o.phase !== 'waiting';
    if (!held) flags.push('no-measurement');
    const holdSec = held ? (o as HoldOutput).holdMs / 1000 : NaN;
    const reachedTarget = held && (o as HoldOutput).holdMs >= this.config.targetSec * 1000 - 1;
    return {
      exerciseId: this.config.exerciseId,
      reps: 0,
      meanVel: NaN,
      holdSec,
      romPeak: NaN,
      autoregulated: false,
      reachedTarget,
      interruptions: this.interruptions,
      flags,
    };
  }

  reset(): void {
    this.tracker.reset();
    this.holdOut = null;
    this.interruptions = 0;
    this.live.measuring = false;
    this.live.complete = false;
    this.live.holdMs = 0;
    this.live.voice = null;
  }
}

// ---------------------------------------------------------------------------
// RomSetGrader
// ---------------------------------------------------------------------------

/** What peak the set captures: a joint angle, or head yaw magnitude. */
export type RomSignal =
  | { kind: 'angle'; a: SideLandmark; vertex: SideLandmark; b: SideLandmark; direction: 'max' | 'min' }
  | { kind: 'head-yaw' };

export interface RomSetConfig {
  exerciseId: string;
  signal: RomSignal;
  emaAlpha: number;
}

export class RomSetGrader implements ExerciseSetGrader {
  private readonly config: RomSetConfig;
  private readonly rom: MaxRomTracker;
  private readonly live: SetGraderUpdate = freshUpdate();
  private sideIsLeft = false;
  private sideLocked = false;
  private interruptions = 0;
  private romOut: MaxRomOutput | null = null;

  constructor(config: RomSetConfig) {
    this.config = config;
    const direction = config.signal.kind === 'angle' ? config.signal.direction : 'max';
    this.rom = new MaxRomTracker({ emaAlpha: config.emaAlpha, direction });
  }

  update(out: PipelineFrameOutput): SetGraderUpdate {
    const live = this.live;
    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone') {
        this.interruptions++;
        this.rom.resetState();
        this.sideLocked = false;
      }
    }
    // An angle/yaw needs no body-unit scale, only a stably tracked pose.
    const measuring = out.state === 'tracking' && out.frame.hasPose;
    live.measuring = measuring;
    if (!measuring) return live;

    const frame = out.frame;
    const sig = this.config.signal;
    let value: number;
    if (sig.kind === 'head-yaw') {
      value = Math.abs(headYawDeg(frame));
    } else {
      if (!this.sideLocked) {
        this.sideIsLeft = out.chainReliability[LEFT_SIDE_CHAIN] >= out.chainReliability[RIGHT_SIDE_CHAIN];
        this.sideLocked = true;
      }
      value = angleAtDeg(frame, side(sig.a, this.sideIsLeft), side(sig.vertex, this.sideIsLeft), side(sig.b, this.sideIsLeft));
    }
    this.romOut = this.rom.update(value, frame.timestampMs);
    return live;
  }

  finish(): SetResult {
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    const peak = this.romOut ? this.romOut.peak : NaN;
    if (Number.isNaN(peak)) flags.push('no-measurement');
    return {
      exerciseId: this.config.exerciseId,
      reps: 0,
      meanVel: NaN,
      holdSec: NaN,
      romPeak: peak,
      autoregulated: false,
      reachedTarget: !Number.isNaN(peak),
      interruptions: this.interruptions,
      flags,
    };
  }

  reset(): void {
    this.rom.reset();
    this.sideLocked = false;
    this.interruptions = 0;
    this.romOut = null;
    this.live.measuring = false;
  }
}
