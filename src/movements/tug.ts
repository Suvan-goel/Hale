/**
 * Timed Up and Go (side-lateral framing so the walk path crosses the frame) —
 * Balance/Mobility. Timed from seat-off to re-seated (TimedTaskTracker).
 *
 * Phases ['walk-out', 'walk-back']: the clock starts at seat-off (near-side
 * knee extends past `standKneeDeg`), the turn is detected as a hip-x velocity
 * REVERSAL after a minimum outbound excursion (CLAUDE.md), and completion is
 * re-seating (knee flexes back under `seatKneeDeg` near the start x). Hip x is
 * the both-hips midpoint — robust through the turn, when near/far sides swap.
 *
 * Short-path variant: if the measured outbound excursion never reaches the
 * standard band the result is flagged `nonStandardShortPath` (the room
 * couldn't fit a full 3 m walk) — reported, never blocking. A subject-gone
 * aborts the task (still completes so the battery moves on) and is flagged.
 */

import { VoiceCueKey } from '../audio/cues';
import { TimedTaskOutput, TimedTaskTracker } from '../grading';
import { CHAIN_IDS } from '../pose/chains';
import { angleAtDeg } from '../pose/geometry';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM, midpointX } from '../pose/types';
import { GraderUpdate, MovementDefinition, MovementGrader, MovementResultBase } from './types';
import { registerMovement } from './registry';

export const TUG_ID = 'timed-up-and-go';

const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');
const PHASES = ['walk-out', 'walk-back'] as const;

export interface TugResult extends MovementResultBase {
  /** Seat-off → re-seated, seconds; NaN if the task never started. */
  totalSec: number;
  /** Reached re-seating (a clean, standard-shaped trial). */
  completed: boolean;
  /** A hip-x velocity reversal (the turn) was detected. */
  turnDetected: boolean;
  /** Peak outbound hip excursion from the chair, body units. */
  peakExcursionBu: number;
  /** Walk path too short for a standard 3 m TUG — result is non-standard. */
  nonStandardShortPath: boolean;
}

export interface TugConfig {
  /** Near-side knee angle above which the subject is standing (seat-off). */
  standKneeDeg: number;
  /** Knee angle above which stand-up is complete — the excursion reference is
   * latched here, after the seat→stand hip shift settles, so the walk is
   * measured from the standing position, not the chair. */
  standStableDeg: number;
  /** Knee angle below which the subject is seated again. */
  seatKneeDeg: number;
  /** EMA on hip-x position and velocity (landmarks are already One-Euro'd). */
  hipEmaAlpha: number;
  /** |hip-x velocity| (bu/s) past which motion counts as walking. */
  walkVelBu: number;
  /** Hip displacement (bu) from the standing reference that fixes "outbound". */
  outboundMinBu: number;
  /** Min outbound excursion (bu) before a reversal can count as the turn. */
  minTurnExcursionBu: number;
  /** Re-seat requires hip-x back within this of the start x. */
  reseatBandBu: number;
  /** Outbound excursion below this ⇒ non-standard short path. */
  shortPathExcursionBu: number;
  debounceFrames: number;
}

export const DEFAULT_TUG_CONFIG: TugConfig = {
  standKneeDeg: 150,
  standStableDeg: 165,
  seatKneeDeg: 120,
  hipEmaAlpha: 0.3,
  walkVelBu: 0.25,
  outboundMinBu: 0.3,
  minTurnExcursionBu: 1.2,
  reseatBandBu: 0.8,
  shortPathExcursionBu: 1.6,
  debounceFrames: 3,
};

class TugGrader implements MovementGrader<TugResult> {
  private readonly config: TugConfig;
  private readonly task: TimedTaskTracker;
  private readonly liveUpdate: GraderUpdate = {
    repCredited: false,
    repCount: 0,
    measuring: false,
    complete: false,
    voice: null,
  };

  private taskOut: TimedTaskOutput | null = null;
  private hipXEma = 0;
  private hipVelEma = 0;
  private prevHipX = 0;
  private prevTs = 0;
  private hasPrev = false;

  private startX = NaN;
  private outboundSign = 0;
  private peakExcursionBu = 0;
  private interruptions = 0;
  /** Seat-off only counts after we've seen the subject seated (TUG starts
   * from the chair); guards against the standing framing/calibration lead-in
   * tripping the clock. */
  private seenSeated = false;

  constructor(config: TugConfig) {
    this.config = config;
    this.task = new TimedTaskTracker({ phases: PHASES as unknown as string[], debounceFrames: config.debounceFrames });
  }

  update(out: PipelineFrameOutput): GraderUpdate {
    const live = this.liveUpdate;
    live.complete = false;

    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone' || out.events[i].type === 'tracking-interrupted') {
        this.interruptions++;
        this.task.abort();
        this.hasPrev = false;
      }
    }

    const measuring = out.state === 'tracking' && out.frame.hasPose && out.bodyUnit !== null;
    live.measuring = measuring;
    if (!measuring) {
      live.complete = this.taskOut !== null && (this.taskOut.complete || this.taskOut.aborted);
      return live;
    }
    const frame = out.frame;
    const bodyUnit = out.bodyUnit as number;
    const ts = frame.timestampMs;

    // Hip-x midpoint (both hips), EMA-smoothed, plus its velocity in bu/s.
    const hipXImg = midpointX(frame, LM.LEFT_HIP, LM.RIGHT_HIP);
    const hipXBu = hipXImg / bodyUnit;
    if (!this.hasPrev) {
      this.hipXEma = hipXBu;
      this.hipVelEma = 0;
    } else {
      const dtSec = (ts - this.prevTs) / 1000;
      this.hipXEma += this.config.hipEmaAlpha * (hipXBu - this.hipXEma);
      if (dtSec > 0) {
        const v = (hipXBu - this.prevHipX) / dtSec;
        this.hipVelEma += this.config.hipEmaAlpha * (v - this.hipVelEma);
      }
    }
    this.prevHipX = hipXBu;
    this.prevTs = ts;
    this.hasPrev = true;

    // Near-side knee angle (the more reliable side; tolerant of turns).
    const leftBest = out.chainReliability[LEFT_SIDE_CHAIN] >= out.chainReliability[RIGHT_SIDE_CHAIN];
    const hip = leftBest ? LM.LEFT_HIP : LM.RIGHT_HIP;
    const knee = leftBest ? LM.LEFT_KNEE : LM.RIGHT_KNEE;
    const ankle = leftBest ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
    const kneeAngle = angleAtDeg(frame, hip, knee, ankle);

    if (kneeAngle <= this.config.seatKneeDeg) this.seenSeated = true;

    const phaseIndex = this.taskOut ? this.taskOut.phaseIndex : -1;
    let nextEntryMet = false;
    if (phaseIndex === -1) {
      // Seat-off: standing up out of the chair (after having sat) starts the clock.
      nextEntryMet = this.seenSeated && kneeAngle >= this.config.standKneeDeg;
    } else if (phaseIndex === 0) {
      if (Number.isNaN(this.startX)) {
        // Latch the walk reference once fully standing (stand-up settled).
        if (kneeAngle >= this.config.standStableDeg) {
          this.startX = this.hipXEma;
          this.outboundSign = 0;
          this.peakExcursionBu = 0;
        }
      } else {
        if (this.outboundSign === 0) {
          const d = this.hipXEma - this.startX;
          if (Math.abs(d) > this.config.outboundMinBu) this.outboundSign = Math.sign(d);
        }
        // The turn: hip-x reverses past the outbound direction after walking out.
        const excursion = this.outboundSign * (this.hipXEma - this.startX);
        if (excursion > this.peakExcursionBu) this.peakExcursionBu = excursion;
        const reversing =
          this.outboundSign !== 0 && this.outboundSign * this.hipVelEma < -this.config.walkVelBu;
        nextEntryMet = excursion >= this.config.minTurnExcursionBu && reversing;
      }
    } else {
      // Re-seat: knee flexes back near the chair x.
      const backNearStart = Math.abs(this.hipXEma - this.startX) <= this.config.reseatBandBu;
      nextEntryMet = kneeAngle <= this.config.seatKneeDeg && backNearStart;
    }

    this.taskOut = this.task.update(nextEntryMet, ts);
    live.complete = this.taskOut.complete || this.taskOut.aborted;
    return live;
  }

  finish(): TugResult {
    const out = this.taskOut;
    const started = out !== null && out.started;
    const completed = out !== null && out.complete;
    const turnDetected = (out !== null && out.phaseIndex >= 1) || completed;
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    if (!completed) flags.push('incomplete');
    const nonStandardShortPath =
      this.peakExcursionBu > 0 && this.peakExcursionBu < this.config.shortPathExcursionBu;
    if (nonStandardShortPath) flags.push('short-path');
    if (!started) flags.push('no-measurement');

    return {
      movementId: TUG_ID,
      totalSec: started ? (out as TimedTaskOutput).totalMs / 1000 : NaN,
      completed,
      turnDetected,
      peakExcursionBu: this.peakExcursionBu,
      nonStandardShortPath,
      flags,
      interruptions: this.interruptions,
    };
  }

  reset(): void {
    this.task.reset();
    this.taskOut = null;
    this.hasPrev = false;
    this.hipXEma = 0;
    this.hipVelEma = 0;
    this.startX = NaN;
    this.outboundSign = 0;
    this.peakExcursionBu = 0;
    this.interruptions = 0;
    this.seenSeated = false;
    this.liveUpdate.measuring = false;
    this.liveUpdate.complete = false;
  }
}

export const tugDefinition: MovementDefinition<TugResult> = {
  id: TUG_ID,
  displayName: 'Up and Go',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['chair'],
  durationMs: null, // grader-terminated: ends when re-seated (or aborts)
  voice: {
    instructions: ['tug-intro', 'tug-setup'],
  },
  createGrader: () => new TugGrader(DEFAULT_TUG_CONFIG),
  resultCues(): VoiceCueKey[] {
    return ['item-complete'];
  },
};

registerMovement(tugDefinition);
