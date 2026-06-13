/**
 * 30-second chair stand (Rikli & Jones Senior Fitness Test item) — side view.
 *
 * Counts full sit→stand cycles on the near-side knee angle (RepCycleTracker
 * hysteresis: stand commits ≥ ~155°, re-arms ≤ ~110°) and measures per-rep
 * rise velocity (RepVelocity layer): vertical velocity of the smoothed
 * near-side hip during the concentric window, in body units/sec. The near
 * hip stands in for the hip midpoint deliberately — in a side view the
 * far-side hip is occlusion garbage (see decision log).
 *
 * Hand-push-off (hands on thighs during the rise) is detected via
 * wrist-to-thigh-segment distance and recorded as a LOGGED FLAG on the rep —
 * per product law #3 it is never voiced and never shown as critique.
 */

import { numberCue, VoiceCueKey } from '../audio/cues';
import { RepVelocityTracker } from '../grading';
import { CHAIN_IDS } from '../pose/chains';
import { angleAtDeg, pointToSegmentDist } from '../pose/geometry';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM } from '../pose/types';
import { GraderUpdate, MovementDefinition, MovementGrader, MovementResultBase } from './types';
import { registerMovement } from './registry';

export const CHAIR_STAND_ID = 'chair-stand-30s';

const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');

export interface ChairStandRepStat {
  /** Mean concentric hip velocity, body units/sec. */
  meanVel: number;
  /** Peak (EMA-smoothed) concentric hip velocity, body units/sec. */
  peakVel: number;
  /** Concentric window wall-clock. */
  durationMs: number;
  /** Hands pushed on the thighs during this rise (logged flag). */
  pushOff: boolean;
}

export interface ChairStandResult extends MovementResultBase {
  reps: number;
  repStats: ChairStandRepStat[];
  /** Mean of per-rep mean velocities — THE longitudinal headline metric.
   * Robust from ~10 reps; NaN when no rep completed. */
  sessionMeanVel: number;
  /** Mean of per-rep peak velocities; NaN when no rep completed. */
  sessionMeanPeakVel: number;
  pushOffDetected: boolean;
}

export interface ChairStandConfig {
  /** Near-side knee angle ≥ this commits a full stand (credits the rep). */
  kneeUpEnterDeg: number;
  /** Knee angle ≤ this commits re-seated (arms the next rep). */
  kneeDownEnterDeg: number;
  /** Extra EMA on the knee angle (1 = none; landmarks are One-Euro'd). */
  cycleEmaAlpha: number;
  velocityEmaAlpha: number;
  maxReps: number;
  /** Wrist closer than this to the hip→knee segment (bu) = hand on thigh. */
  pushOffWristThighBu: number;
  /** Flag the rep when at least this fraction of rise frames had it. */
  pushOffFrameFraction: number;
}

export const DEFAULT_CHAIR_STAND_CONFIG: ChairStandConfig = {
  kneeUpEnterDeg: 155,
  kneeDownEnterDeg: 110,
  cycleEmaAlpha: 1,
  velocityEmaAlpha: 0.3,
  maxReps: 64,
  pushOffWristThighBu: 0.15,
  pushOffFrameFraction: 0.5,
};

class ChairStandGrader implements MovementGrader<ChairStandResult> {
  private readonly config: ChairStandConfig;
  private readonly velocity: RepVelocityTracker;
  private readonly pushOffFlags: Uint8Array;
  private readonly liveUpdate: GraderUpdate = {
    repCredited: false,
    repCount: 0,
    measuring: false,
  };

  private sideIsLeft = false;
  private sideLocked = false;
  private inAscent = false;
  private ascentFrames = 0;
  private ascentNearThighFrames = 0;
  private interruptions = 0;

  constructor(config: ChairStandConfig) {
    this.config = config;
    this.velocity = new RepVelocityTracker({
      cycle: {
        upEnter: config.kneeUpEnterDeg,
        downEnter: config.kneeDownEnterDeg,
        emaAlpha: config.cycleEmaAlpha,
      },
      velocityEmaAlpha: config.velocityEmaAlpha,
      maxReps: config.maxReps,
    });
    this.pushOffFlags = new Uint8Array(config.maxReps);
  }

  update(out: PipelineFrameOutput): GraderUpdate {
    const live = this.liveUpdate;
    live.repCredited = false;

    // The painful lesson, encoded: an interruption resets the rep state
    // machine so re-entry can never double-count. Credited reps survive.
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

    // Dynamic near-side selection, sticky while a rep is in flight so the
    // hip-position signal can't hop sides mid-rise.
    if (!this.sideLocked) {
      this.sideIsLeft =
        out.chainReliability[LEFT_SIDE_CHAIN] >= out.chainReliability[RIGHT_SIDE_CHAIN];
      this.sideLocked = true;
    }
    const hip = this.sideIsLeft ? LM.LEFT_HIP : LM.RIGHT_HIP;
    const knee = this.sideIsLeft ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
    const ankle = this.sideIsLeft ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
    const wrist = this.sideIsLeft ? LM.LEFT_WRIST : LM.RIGHT_WRIST;

    const kneeAngle = angleAtDeg(frame, hip, knee, ankle);
    // Image y grows downward; negate so increasing position = rising.
    const hipHeightBu = -frame.ys[hip] / bodyUnit;

    const vOut = this.velocity.update(kneeAngle, hipHeightBu, frame.timestampMs);
    const events = vOut.cycle.events;

    for (let i = 0; i < events.length; i++) {
      if (events[i].type === 'ascent-start') {
        this.inAscent = true;
        this.ascentFrames = 0;
        this.ascentNearThighFrames = 0;
      }
    }
    if (this.inAscent) {
      this.ascentFrames++;
      const wristThighBu = pointToSegmentDist(frame, wrist, hip, knee) / bodyUnit;
      if (wristThighBu <= this.config.pushOffWristThighBu) this.ascentNearThighFrames++;
    }
    for (let i = 0; i < events.length; i++) {
      const type = events[i].type;
      if (type === 'rep') {
        const repIndex = this.velocity.repCount - 1;
        if (repIndex < this.pushOffFlags.length && this.ascentFrames > 0) {
          const fraction = this.ascentNearThighFrames / this.ascentFrames;
          this.pushOffFlags[repIndex] = fraction >= this.config.pushOffFrameFraction ? 1 : 0;
        }
        this.inAscent = false;
        live.repCredited = true;
      } else if (type === 'ascent-abort') {
        this.inAscent = false;
      }
    }

    // Between reps the side may be re-evaluated next frame.
    if (!vOut.cycle.inTransition && !this.inAscent) this.sideLocked = false;

    live.repCount = this.velocity.repCount;
    return live;
  }

  finish(): ChairStandResult {
    const reps = this.velocity.repCount;
    const velStats = this.velocity.repStats();
    const repStats: ChairStandRepStat[] = velStats.map((s, i) => ({
      meanVel: s.meanVel,
      peakVel: s.peakVel,
      durationMs: s.durationMs,
      pushOff: this.pushOffFlags[i] === 1,
    }));

    const flags: string[] = [];
    if (velStats.length !== reps) flags.push('rep-stats-incomplete');
    if (this.interruptions > 0) flags.push('tracking-interrupted');

    let meanPeak = NaN;
    if (velStats.length > 0) {
      meanPeak = velStats.reduce((sum, s) => sum + s.peakVel, 0) / velStats.length;
    }

    return {
      movementId: CHAIR_STAND_ID,
      reps,
      repStats,
      sessionMeanVel: this.velocity.sessionMeanVel,
      sessionMeanPeakVel: meanPeak,
      pushOffDetected: repStats.some((s) => s.pushOff),
      flags,
      interruptions: this.interruptions,
    };
  }

  reset(): void {
    this.velocity.reset();
    this.pushOffFlags.fill(0);
    this.sideLocked = false;
    this.inAscent = false;
    this.ascentFrames = 0;
    this.ascentNearThighFrames = 0;
    this.interruptions = 0;
    this.liveUpdate.repCredited = false;
    this.liveUpdate.repCount = 0;
    this.liveUpdate.measuring = false;
  }
}

export const chairStandDefinition: MovementDefinition<ChairStandResult> = {
  id: CHAIR_STAND_ID,
  displayName: '30-Second Chair Stand',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['chair'],
  durationMs: 30000,
  voice: {
    instructions: ['chair-stand-intro', 'chair-stand-setup'],
  },
  createGrader: () => new ChairStandGrader(DEFAULT_CHAIR_STAND_CONFIG),
  resultCues(result: ChairStandResult): VoiceCueKey[] {
    if (result.reps <= 0) return ['no-reps'];
    return ['you-completed', numberCue(result.reps), 'stands-suffix'];
  },
};

registerMovement(chairStandDefinition);
