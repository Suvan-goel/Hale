/**
 * Movement Check-Up orchestrator — the single ~10-minute voice-guided battery.
 *
 * Pure-TS state machine (frame-timestamp driven, replay-testable) that chains
 * the V1 official assessments via per-item SessionControllers:
 *
 *   intro → [ transition → item ] × N → complete → done
 *
 * Between items it RESETS the pre-flight check (so each item re-frames) and,
 * when the camera view changes (side ↔ front), speaks a turn cue — the user
 * physically repositions, then the item's own pre-flight phase guides framing.
 * The PosePipeline is NOT reset between items: body-unit calibration is done
 * once and reused for the whole session (the setup is constant).
 *
 * Setup trouble is explicit: if an item can't get framed within
 * `maxFramingMs`, the orchestrator latches a setup-issue state and waits for
 * the screen/user to retry or skip. If skipped, it is recorded `skipped`; if it
 * finishes with a grader `no-measurement` flag, it's recorded `unmeasured`.
 * Either way the battery can still yield a coherent CheckUp.
 */

import { VoiceCueKey, voicePriority } from '../audio/cues';
import { getMovement, MovementDefinition, MovementResultBase } from '../movements';
import { PipelineFrameOutput } from '../pose/pipeline';
import { PreflightCheck, PreflightStatus } from '../preflight/preflight';
import {
  DEFAULT_SESSION_CONFIG,
  SessionController,
  SessionControllerConfig,
  SessionFrameUpdate,
  VoiceRequest,
} from '../assessment/sessionController';
import { CheckUp, CheckUpItem } from './types';

/** Official V1 battery: TUG is kept implemented, but hidden from normal flow. */
export const DEFAULT_BATTERY: readonly string[] = [
  'chair-stand-30s',
  'balance-ladder',
  'shoulder-flexion-peak',
  'hinge-reach',
];

/** Dev/beta battery for the technically fragile home-space walking task. */
export const BETA_BATTERY_WITH_TUG: readonly string[] = [
  'chair-stand-30s',
  'timed-up-and-go',
  'balance-ladder',
  'shoulder-flexion-peak',
  'hinge-reach',
];

export type CheckUpPhase = 'intro' | 'transition' | 'item' | 'complete' | 'done';

export interface CheckUpFrameUpdate {
  phase: CheckUpPhase;
  itemIndex: number;
  currentMovementId: string | null;
  voice: VoiceRequest | null;
  playRepSound: boolean;
  /** The active item's per-frame session update (HUD mirror), or null. */
  item: SessionFrameUpdate | null;
  /** True after setup has timed out and the UI must ask the user what to do. */
  setupIssue: boolean;
  totalItems: number;
}

export interface CheckUpConfig {
  battery: readonly string[];
  session: SessionControllerConfig;
  /** Settle time after a transition cue before the item begins. */
  transitionDwellMs: number;
  /** An item stuck in pre-flight longer than this is skipped. */
  maxFramingMs: number;
}

export const DEFAULT_CHECKUP_CONFIG: CheckUpConfig = {
  battery: DEFAULT_BATTERY,
  session: DEFAULT_SESSION_CONFIG,
  transitionDwellMs: 1500,
  maxFramingMs: 60000,
};

export class CheckUpOrchestrator {
  private readonly config: CheckUpConfig;
  private readonly startedAtIso: string;
  private readonly definitions: MovementDefinition[];
  private readonly preflight: PreflightCheck;
  private readonly items: CheckUpItem[] = [];
  private readonly update_: CheckUpFrameUpdate = {
    phase: 'intro',
    itemIndex: 0,
    currentMovementId: null,
    voice: null,
    playRepSound: false,
    item: null,
    setupIssue: false,
    totalItems: 0,
  };

  private phase: CheckUpPhase = 'intro';
  private itemIndex = -1;
  private controller: SessionController | null = null;
  private introSpoken = false;
  private transitionEnteredMs = 0;
  private transitionCuePending: VoiceCueKey | null = null;
  private itemEnteredMs = 0;
  private lastTimestampMs = 0;
  private setupIssue = false;
  private completeSpoken = false;
  private bodyUnit: number | null = null;
  private finished: CheckUp | null = null;

  /**
   * @param startedAtIso wall-clock start (the caller owns the clock; the
   *   orchestrator only sees monotonic frame timestamps).
   */
  constructor(
    startedAtIso: string,
    preflight: PreflightCheck,
    config: CheckUpConfig = DEFAULT_CHECKUP_CONFIG
  ) {
    this.config = config;
    this.startedAtIso = startedAtIso;
    this.preflight = preflight;
    this.definitions = config.battery.map((id) => getMovement(id));
  }

  get result(): CheckUp | null {
    return this.finished;
  }

  get totalItems(): number {
    return this.definitions.length;
  }

  retrySetup(): void {
    if (this.phase !== 'item' || !this.controller) return;
    this.setupIssue = false;
    this.preflight.reset();
    this.controller.reset();
    this.itemEnteredMs = this.lastTimestampMs;
  }

  skipCurrentItem(): boolean {
    if (this.phase !== 'item' || this.itemIndex < 0 || this.itemIndex >= this.definitions.length) {
      return false;
    }
    this.setupIssue = false;
    this.recordSkip();
    this.advance(this.lastTimestampMs);
    return true;
  }

  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    this.transitionEnteredMs += deltaMs;
    this.itemEnteredMs += deltaMs;
    this.preflight.shiftTiming(deltaMs);
    this.controller?.shiftTiming(deltaMs);
  }

  /** Feed one pipeline frame; drives pre-flight + the active item internally. */
  update(out: PipelineFrameOutput, voiceBusy: boolean): CheckUpFrameUpdate {
    const u = this.update_;
    u.voice = null;
    u.playRepSound = false;
    u.item = null;
    u.setupIssue = this.setupIssue;
    u.totalItems = this.definitions.length;
    if (out.bodyUnit !== null) this.bodyUnit = out.bodyUnit;
    const ts = out.frame.timestampMs;
    this.lastTimestampMs = ts;
    const status = this.preflight.update(out);

    switch (this.phase) {
      case 'intro':
        if (!this.introSpoken) {
          this.introSpoken = true;
          u.voice = { cues: ['checkup-intro'], priority: voicePriority('checkup-intro') };
        } else if (!voiceBusy) {
          this.enterTransition(0, ts);
        }
        break;

      case 'transition':
        this.runTransition(ts, voiceBusy, u);
        break;

      case 'item':
        this.runItem(out, status, voiceBusy, ts, u);
        break;

      case 'complete':
        if (!this.completeSpoken) {
          if (!voiceBusy) {
            this.completeSpoken = true;
            u.voice = { cues: ['checkup-complete'], priority: voicePriority('checkup-complete') };
          }
        } else if (!voiceBusy) {
          this.finish();
          this.phase = 'done';
        }
        break;

      case 'done':
        break;
    }

    u.phase = this.phase;
    u.itemIndex = Math.max(0, this.itemIndex);
    u.currentMovementId =
      this.itemIndex >= 0 && this.itemIndex < this.definitions.length
        ? this.definitions[this.itemIndex].id
        : null;
    return u;
  }

  private enterTransition(index: number, ts: number): void {
    this.itemIndex = index;
    this.phase = 'transition';
    this.transitionEnteredMs = ts;
    this.transitionCuePending = this.transitionCue(index);
    // Each item re-frames from scratch (pre-flight 'ready' is otherwise sticky).
    this.preflight.reset();
  }

  /** Turn cue when the view changes; a gentle "next" otherwise; none for item 0. */
  private transitionCue(index: number): VoiceCueKey | null {
    if (index === 0) return null; // the intro already invited them to begin
    const view = this.definitions[index].cameraView.view;
    const prevView = this.definitions[index - 1].cameraView.view;
    if (view !== prevView) return view === 'front' ? 'face-forward' : 'turn-side-on';
    return 'next-exercise';
  }

  private runTransition(ts: number, voiceBusy: boolean, u: CheckUpFrameUpdate): void {
    // Emit the (possibly deferred) transition cue once the channel is free,
    // so a still-playing result line never swallows it.
    if (this.transitionCuePending && !voiceBusy) {
      u.voice = { cues: [this.transitionCuePending], priority: voicePriority(this.transitionCuePending) };
      this.transitionCuePending = null;
      return;
    }
    const settled = ts - this.transitionEnteredMs >= this.config.transitionDwellMs;
    if (this.transitionCuePending === null && !voiceBusy && settled) {
      this.controller = new SessionController(this.definitions[this.itemIndex], this.config.session);
      this.itemEnteredMs = ts;
      this.phase = 'item';
    }
  }

  private runItem(
    out: PipelineFrameOutput,
    status: PreflightStatus,
    voiceBusy: boolean,
    ts: number,
    u: CheckUpFrameUpdate
  ): void {
    const controller = this.controller as SessionController;
    if (this.setupIssue) {
      u.setupIssue = true;
      u.item = setupIssueItemUpdate;
      return;
    }
    const itemUpdate = controller.update(out, status, voiceBusy);
    u.item = itemUpdate;
    if (itemUpdate.voice) u.voice = itemUpdate.voice;
    u.playRepSound = itemUpdate.playRepSound;

    // Ask the user what to do instead of silently skipping.
    if (itemUpdate.phase === 'preflight' && ts - this.itemEnteredMs >= this.config.maxFramingMs) {
      this.setupIssue = true;
      u.setupIssue = true;
      u.item = setupIssueItemUpdate;
      return;
    }

    if (itemUpdate.phase === 'done') {
      this.recordResult(controller.result);
      this.advance(ts);
    }
  }

  private recordResult(result: MovementResultBase | null): void {
    const def = this.definitions[this.itemIndex];
    if (!result) {
      this.items.push({ movementId: def.id, status: 'unmeasured', result: null });
      return;
    }
    const status = result.flags.includes('no-measurement') ? 'unmeasured' : 'measured';
    this.items.push({ movementId: def.id, status, result });
  }

  private recordSkip(): void {
    this.items.push({ movementId: this.definitions[this.itemIndex].id, status: 'skipped', result: null });
  }

  private advance(ts: number): void {
    this.controller = null;
    const next = this.itemIndex + 1;
    if (next >= this.definitions.length) {
      this.phase = 'complete';
      this.completeSpoken = false;
      return;
    }
    this.enterTransition(next, ts);
  }

  private finish(): void {
    // Any battery items never reached (shouldn't happen) count as skipped.
    for (let i = this.items.length; i < this.definitions.length; i++) {
      this.items.push({ movementId: this.definitions[i].id, status: 'skipped', result: null });
    }
    this.finished = {
      startedAt: this.startedAtIso,
      bodyUnit: this.bodyUnit,
      items: this.items.slice(),
    };
  }
}

const setupIssueItemUpdate: SessionFrameUpdate = {
  phase: 'preflight',
  voice: null,
  playRepSound: false,
  repCount: 0,
  remainingMs: NaN,
  measuring: false,
};
