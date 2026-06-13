/**
 * Hinge reach (side view) — Mobility domain.
 *
 * Standing forward fold; we capture how close the near-side wrist gets to the
 * floor, in body units, at maximum reach (MaxRomTracker, direction 'min' —
 * the smallest wrist-to-floor gap is the best reach). "Floor" is the lowest of
 * the near-side ankle/heel/foot landmarks. Body-unit normalized, like every
 * distance in this product, so the number is comparable session to session.
 *
 * Lower = better mobility. Fixed-duration capture window; the controller's
 * clock ends it. EMA guards against a single glitched frame becoming the best.
 */

import { VoiceCueKey } from '../audio/cues';
import { MaxRomOutput, MaxRomTracker } from '../grading';
import { CHAIN_IDS } from '../pose/chains';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM } from '../pose/types';
import { GraderUpdate, MovementDefinition, MovementGrader, MovementResultBase } from './types';
import { registerMovement } from './registry';

export const HINGE_REACH_ID = 'hinge-reach';

const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');

export interface HingeReachResult extends MovementResultBase {
  /** Minimum wrist-to-floor distance reached, in body units; NaN if unmeasured. */
  reachBu: number;
}

export interface HingeReachConfig {
  emaAlpha: number;
  captureDurationMs: number;
}

export const DEFAULT_HINGE_REACH_CONFIG: HingeReachConfig = {
  emaAlpha: 0.3,
  captureDurationMs: 9000,
};

class HingeReachGrader implements MovementGrader<HingeReachResult> {
  private readonly rom: MaxRomTracker;
  private readonly liveUpdate: GraderUpdate = {
    repCredited: false,
    repCount: 0,
    measuring: false,
    complete: false,
    voice: null,
  };

  private sideIsLeft = false;
  private sideLocked = false;
  private interruptions = 0;
  private romOut: MaxRomOutput | null = null;

  constructor(config: HingeReachConfig) {
    this.rom = new MaxRomTracker({ emaAlpha: config.emaAlpha, direction: 'min' });
  }

  update(out: PipelineFrameOutput): GraderUpdate {
    const live = this.liveUpdate;
    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone') {
        this.interruptions++;
        this.rom.resetState();
        this.sideLocked = false;
      }
    }

    const measuring = out.state === 'tracking' && out.frame.hasPose && out.bodyUnit !== null;
    live.measuring = measuring;
    if (!measuring) return live;

    if (!this.sideLocked) {
      this.sideIsLeft =
        out.chainReliability[LEFT_SIDE_CHAIN] >= out.chainReliability[RIGHT_SIDE_CHAIN];
      this.sideLocked = true;
    }
    const frame = out.frame;
    const bodyUnit = out.bodyUnit as number;
    const wrist = this.sideIsLeft ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
    const ankle = this.sideIsLeft ? LM.LEFT_ANKLE : LM.RIGHT_ANKLE;
    const heel = this.sideIsLeft ? LM.LEFT_HEEL : LM.RIGHT_HEEL;
    const foot = this.sideIsLeft ? LM.LEFT_FOOT_INDEX : LM.RIGHT_FOOT_INDEX;

    // Image y grows downward, so the floor is the largest foot-cluster y.
    const floorY = Math.max(frame.ys[ankle], frame.ys[heel], frame.ys[foot]);
    const wristToFloorBu = (floorY - frame.ys[wrist]) / bodyUnit;
    this.romOut = this.rom.update(wristToFloorBu, frame.timestampMs);
    return live;
  }

  finish(): HingeReachResult {
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    const peak = this.romOut ? this.romOut.peak : NaN;
    if (Number.isNaN(peak)) flags.push('no-measurement');
    return {
      movementId: HINGE_REACH_ID,
      reachBu: peak,
      flags,
      interruptions: this.interruptions,
    };
  }

  reset(): void {
    this.rom.reset();
    this.sideLocked = false;
    this.interruptions = 0;
    this.romOut = null;
    this.liveUpdate.measuring = false;
  }
}

export const hingeReachDefinition: MovementDefinition<HingeReachResult> = {
  id: HINGE_REACH_ID,
  displayName: 'Forward Reach',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['none'],
  durationMs: DEFAULT_HINGE_REACH_CONFIG.captureDurationMs,
  voice: {
    instructions: ['hinge-intro', 'hinge-setup'],
    endCue: 'stand-tall',
  },
  createGrader: () => new HingeReachGrader(DEFAULT_HINGE_REACH_CONFIG),
  resultCues(): VoiceCueKey[] {
    return ['item-complete'];
  },
};

registerMovement(hingeReachDefinition);
