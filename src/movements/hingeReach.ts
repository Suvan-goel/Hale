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
import { angleAtDeg } from '../pose/geometry';
import { PipelineFrameOutput } from '../pose/pipeline';
import { LM } from '../pose/types';
import {
  ValidTimeAccumulator,
  createValidTimeAccumulator,
  getValidTimeResult,
  validTimeConfigForTarget,
} from '../exercises/validTime';
import { GraderUpdate, MovementDefinition, MovementGrader, MovementResultBase } from './types';
import { registerMovement } from './registry';

export const HINGE_REACH_ID = 'hinge-reach';

const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');

export interface HingeReachResult extends MovementResultBase {
  /** Minimum wrist-to-floor distance reached, in body units; NaN/null if unmeasured. */
  reachBu: number | null;
}

export interface HingeReachConfig {
  emaAlpha: number;
  captureDurationMs: number;
  validCaptureMs: number;
}

export const DEFAULT_HINGE_REACH_CONFIG: HingeReachConfig = {
  emaAlpha: 0.3,
  captureDurationMs: 9000,
  validCaptureMs: 3000,
};

class HingeReachGrader implements MovementGrader<HingeReachResult> {
  private readonly config: HingeReachConfig;
  private readonly rom: MaxRomTracker;
  private readonly validTime: ValidTimeAccumulator;
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
    this.config = config;
    this.rom = new MaxRomTracker({ emaAlpha: config.emaAlpha, direction: 'min' });
    this.validTime = createValidTimeAccumulator(validTimeConfigForTarget(config.validCaptureMs));
  }

  update(out: PipelineFrameOutput): GraderUpdate {
    const live = this.liveUpdate;
    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone' || out.events[i].type === 'tracking-interrupted') {
        this.interruptions++;
        this.rom.resetState();
        this.sideLocked = false;
      }
    }

    const measuring = out.state === 'tracking' && out.frame.hasPose && out.bodyUnit !== null;
    live.measuring = measuring;
    live.complete = false;
    if (!measuring) {
      this.validTime.update({
        nowMs: out.frame.timestampMs,
        isPositionValid: false,
        isTrackingReliable: false,
      });
      return live;
    }

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
    const shoulder = this.sideIsLeft ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
    const hip = this.sideIsLeft ? LM.LEFT_HIP : LM.RIGHT_HIP;
    const knee = this.sideIsLeft ? LM.LEFT_KNEE : LM.RIGHT_KNEE;

    // Image y grows downward, so the floor is the largest foot-cluster y.
    const floorY = Math.max(frame.ys[ankle], frame.ys[heel], frame.ys[foot]);
    const wristToFloorBu = (floorY - frame.ys[wrist]) / bodyUnit;
    const trunkAngle = angleAtDeg(frame, shoulder, hip, knee);
    const positionValid = trunkAngle <= 165;
    const snap = this.validTime.update({
      nowMs: frame.timestampMs,
      isPositionValid: positionValid,
      isTrackingReliable: true,
    });
    if (positionValid && (snap.state === 'counting' || snap.state === 'grace' || snap.state === 'complete')) {
      this.romOut = this.rom.update(wristToFloorBu, frame.timestampMs);
    }
    return live;
  }

  finish(): HingeReachResult {
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    const validTime = getValidTimeResult(this.validTime.snapshot, this.config.validCaptureMs);
    const peak = validTime.completedByValidTime && this.romOut && Number.isFinite(this.romOut.peak)
      ? this.romOut.peak
      : NaN;
    if (Number.isNaN(peak)) flags.push('no-measurement');
    return {
      movementId: HINGE_REACH_ID,
      reachBu: peak,
      flags,
      interruptions: this.interruptions,
      validTime,
    };
  }

  reset(): void {
    this.rom.reset();
    this.validTime.reset();
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
