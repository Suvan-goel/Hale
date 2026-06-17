/**
 * Shoulder flexion peak (side view) — Mobility domain.
 *
 * Standing straight-arm forward raise; we capture the PEAK upper-arm-to-trunk
 * angle (MaxRomTracker, direction 'max'). The graded angle is measured at the
 * near-side shoulder between the trunk (shoulder→hip) and the upper arm
 * (shoulder→elbow): ~10° arm-at-side, ~90° arm horizontal-forward, ~170°
 * overhead. Sagittal plane only — 2D pose can't see rotation, so this is a
 * forward raise, never abduction (CLAUDE.md).
 *
 * Fixed-duration capture window (the controller's clock ends it): the voice
 * tells the user to raise and hold, and we keep the best smoothed angle. EMA
 * in MaxRomTracker is the spike guard — a single glitched frame can't become
 * the session's recorded peak.
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

export const SHOULDER_FLEXION_ID = 'shoulder-flexion-peak';

const LEFT_SIDE_CHAIN = CHAIN_IDS.indexOf('leftSide');
const RIGHT_SIDE_CHAIN = CHAIN_IDS.indexOf('rightSide');

export interface ShoulderFlexionResult extends MovementResultBase {
  /** Peak upper-arm-to-trunk angle, degrees; NaN if never measured. */
  peakFlexionDeg: number;
}

export interface ShoulderFlexionConfig {
  /** EMA factor on the angle before peak capture. */
  emaAlpha: number;
  captureDurationMs: number;
  validCaptureMs: number;
}

export const DEFAULT_SHOULDER_FLEXION_CONFIG: ShoulderFlexionConfig = {
  emaAlpha: 0.3,
  captureDurationMs: 9000,
  validCaptureMs: 3000,
};

class ShoulderFlexionGrader implements MovementGrader<ShoulderFlexionResult> {
  private readonly config: ShoulderFlexionConfig;
  private readonly rom: MaxRomTracker;
  private readonly fallbackRom: MaxRomTracker;
  private readonly validTime: ValidTimeAccumulator;
  private readonly liveUpdate: GraderUpdate = {
    repCredited: false,
    repCount: 0,
    measuring: false,
    complete: false, // fixed-duration capture; the controller's clock ends it
    voice: null,
  };

  private sideIsLeft = false;
  private sideLocked = false;
  private interruptions = 0;
  private romOut: MaxRomOutput | null = null;
  private fallbackRomOut: MaxRomOutput | null = null;

  constructor(config: ShoulderFlexionConfig) {
    this.config = config;
    this.rom = new MaxRomTracker({ emaAlpha: config.emaAlpha, direction: 'max' });
    this.fallbackRom = new MaxRomTracker({ emaAlpha: config.emaAlpha, direction: 'max' });
    this.validTime = createValidTimeAccumulator(validTimeConfigForTarget(config.validCaptureMs));
  }

  update(out: PipelineFrameOutput): GraderUpdate {
    const live = this.liveUpdate;
    for (let i = 0; i < out.events.length; i++) {
      if (out.events[i].type === 'subject-gone') {
        this.interruptions++;
        this.rom.resetState();
        this.fallbackRom.resetState();
        this.sideLocked = false;
      }
    }

    // An angle needs no body-unit scale; only a stably tracked pose.
    const measuring = out.state === 'tracking' && out.frame.hasPose;
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
    const shoulder = this.sideIsLeft ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
    const hip = this.sideIsLeft ? LM.LEFT_HIP : LM.RIGHT_HIP;
    const elbow = this.sideIsLeft ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;

    const angle = angleAtDeg(out.frame, hip, shoulder, elbow);
    this.fallbackRomOut = this.fallbackRom.update(angle, out.frame.timestampMs);
    const torsoUpright = out.frame.ys[shoulder] < out.frame.ys[hip];
    const positionValid = torsoUpright && angle >= 35;
    const snap = this.validTime.update({
      nowMs: out.frame.timestampMs,
      isPositionValid: positionValid,
      isTrackingReliable: true,
    });
    if (positionValid && (snap.state === 'counting' || snap.state === 'grace' || snap.state === 'complete')) {
      this.romOut = this.rom.update(angle, out.frame.timestampMs);
    }
    return live;
  }

  finish(): ShoulderFlexionResult {
    const flags: string[] = [];
    if (this.interruptions > 0) flags.push('tracking-interrupted');
    const peak = this.romOut && Number.isFinite(this.romOut.peak)
      ? this.romOut.peak
      : this.fallbackRomOut
        ? this.fallbackRomOut.peak
        : NaN;
    if (Number.isNaN(peak)) flags.push('no-measurement');
    return {
      movementId: SHOULDER_FLEXION_ID,
      peakFlexionDeg: peak,
      flags,
      interruptions: this.interruptions,
      validTime: getValidTimeResult(this.validTime.snapshot, this.config.validCaptureMs),
    };
  }

  reset(): void {
    this.rom.reset();
    this.fallbackRom.reset();
    this.validTime.reset();
    this.sideLocked = false;
    this.interruptions = 0;
    this.romOut = null;
    this.fallbackRomOut = null;
    this.liveUpdate.measuring = false;
  }
}

export const shoulderFlexionDefinition: MovementDefinition<ShoulderFlexionResult> = {
  id: SHOULDER_FLEXION_ID,
  displayName: 'Shoulder Reach',
  cameraView: { view: 'side', requiredReliableSideChains: 1 },
  equipment: ['none'],
  durationMs: DEFAULT_SHOULDER_FLEXION_CONFIG.captureDurationMs,
  voice: {
    instructions: ['shoulder-intro', 'shoulder-setup'],
    endCue: 'relax-arm',
  },
  createGrader: () => new ShoulderFlexionGrader(DEFAULT_SHOULDER_FLEXION_CONFIG),
  resultCues(): VoiceCueKey[] {
    return ['item-complete'];
  },
};

registerMovement(shoulderFlexionDefinition);
