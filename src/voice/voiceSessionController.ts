/**
 * Headless controller for voice-guided sessions — everything the screen does
 * except render. Exists so the camera screen's side contracts are REPLICATED
 * AND PROVABLE (founder requirement: parity proven, not asserted):
 *
 *   1. abandonment-funnel persistence: recordAbandonment() is idempotent and
 *      the screen calls it on unmount — identical to the recordFunnel
 *      discipline of the deleted camera-conducted session screen;
 *   2. resume snapshots: onItemCompleted fires with the cumulative
 *      completedItemsSnapshot at every item boundary;
 *   3. completion: one funnel record + onComplete(result), never both
 *      completed and abandoned.
 *
 * It also owns the day-one instrumentation this surface exists to produce:
 * voice-vs-tap usage counts and the churn-location taxonomy (via the v2
 * telemetry record) — the data that gates conductor promotion.
 *
 * Engine-agnostic: consumes VoiceIntents only; the recognizer lives behind
 * the screen's module boundary.
 */

import { SessionFunnelStore } from '../telemetry/sessionFunnelStore';
import { buildStoredSessionFunnel } from '../telemetry/sessionFunnelRecord';
import type { TrainingSetRuntimeGeneratedExercise } from '../training/setRuntime';
import {
  VoiceSessionPlayer,
  type TrainingFrameUpdate,
  type TrainingItemResult,
  type TrainingPhase,
  type TrainingSessionResult,
  type VoiceSessionPlayerOptions,
} from '../training/voiceSessionPlayer';
import type { VoiceIntent } from './intents';
import { enabledSessionIntents } from './sessionIntentPolicy';

export type VoiceTapAction =
  | 'ready'
  | 'done'
  | 'skip'
  | 'repeat'
  | 'pause'
  | 'resume'
  | 'pain'
  | 'skip_rest'
  | 'adjust_reps_up'
  | 'adjust_reps_down';

export interface VoiceSessionControllerOptions {
  startedAtIso: string;
  exerciseIds: readonly string[];
  generatedExercises?: readonly TrainingSetRuntimeGeneratedExercise[];
  /** Injectable catalogue seams (programme v2 bridge); defaults = registry. */
  resolveExercise?: VoiceSessionPlayerOptions['resolveExercise'];
  resolveSafetyProfile?: VoiceSessionPlayerOptions['resolveSafetyProfile'];
  /** Once-per-item bonus-set offer (programme v2); see player options. */
  bonusSetOffer?: VoiceSessionPlayerOptions['bonusSetOffer'];
  /** Activation stamp (funnel v3): true when this is her first-ever session. */
  firstSessionStarted?: boolean;
  funnelStore: SessionFunnelStore;
  onComplete: (result: TrainingSessionResult) => void;
  /** Cumulative finished items at every item boundary (resume snapshots). */
  onItemCompleted?: (completedItems: TrainingItemResult[]) => void;
  onTelemetryError?: (error: unknown) => void;
  /** Wall-clock source, injectable for tests. */
  nowIso?: () => string;
}

export class VoiceSessionController {
  readonly player: VoiceSessionPlayer;
  private readonly options: VoiceSessionControllerOptions;
  private readonly voiceIntentCounts: Record<string, number> = {};
  private readonly tapActionCounts: Record<string, number> = {};
  private funnelRecorded = false;
  private completedFired = false;
  private lastItemCount = 0;
  private lastPhase: TrainingPhase = 'intro';
  private lastBonusOfferPending = false;

  constructor(options: VoiceSessionControllerOptions) {
    this.options = options;
    this.player = new VoiceSessionPlayer(
      options.startedAtIso,
      [...options.exerciseIds],
      {
        generatedExercises: options.generatedExercises,
        resolveExercise: options.resolveExercise,
        resolveSafetyProfile: options.resolveSafetyProfile,
        bonusSetOffer: options.bonusSetOffer,
      }
    );
  }

  get phase(): TrainingPhase {
    return this.lastPhase;
  }

  tick(timestampMs: number, voiceBusy: boolean): TrainingFrameUpdate {
    const update = this.player.tick(timestampMs, voiceBusy);
    this.lastPhase = update.phase;
    this.lastBonusOfferPending = update.bonusOfferPending;

    const items = this.player.completedItemsSnapshot();
    if (items.length !== this.lastItemCount) {
      this.lastItemCount = items.length;
      this.options.onItemCompleted?.(items);
    }

    if (update.phase === 'done' && !this.completedFired) {
      this.completedFired = true;
      this.recordFunnel('completed');
      const result = this.player.result;
      if (result) this.options.onComplete(result);
    }
    return update;
  }

  /** Which intents the recognizer should match right now (policy delegate). */
  enabledIntents(voiceBusy: boolean): readonly VoiceIntent[] {
    return enabledSessionIntents(this.lastPhase, {
      voiceBusy,
      bonusOfferPending: this.lastBonusOfferPending,
    });
  }

  /** A matched voice intent acted (or not); usage counted only on action. */
  handleVoiceIntent(intent: VoiceIntent, atMs?: number): boolean {
    const acted = this.player.handleSessionIntent(intent, atMs);
    if (acted) this.voiceIntentCounts[intent] = (this.voiceIntentCounts[intent] ?? 0) + 1;
    return acted;
  }

  /** The tap-parity surface — same player paths, counted separately. */
  handleTap(action: VoiceTapAction, atMs?: number): boolean {
    const acted = this.dispatchTap(action, atMs);
    if (acted) this.tapActionCounts[action] = (this.tapActionCounts[action] ?? 0) + 1;
    return acted;
  }

  private dispatchTap(action: VoiceTapAction, atMs?: number): boolean {
    switch (action) {
      case 'ready':
        return this.player.confirmReady(atMs);
      case 'done':
        return this.player.completeCurrentSet(atMs);
      case 'skip':
        return this.player.skipCurrentItem();
      case 'repeat':
        return this.player.repeatVoiceInstructions(atMs);
      case 'pause':
        return this.player.haltVoiceSession(false, atMs);
      case 'resume':
        return this.player.resumeVoiceSession(atMs);
      case 'pain':
        return this.player.recordPainHalt(atMs);
      case 'skip_rest':
        return this.player.skipRest(atMs);
      case 'adjust_reps_up':
        return this.player.adjustReportedReps(1);
      case 'adjust_reps_down':
        return this.player.adjustReportedReps(-1);
      default:
        return false;
    }
  }

  /**
   * System-initiated pause (app backgrounded): the same player path as the
   * pause tap, but never counted as tap usage — the voice-vs-tap counts must
   * stay user-authored. Returns false when the current phase has nothing to
   * pause (intro, transitions, already paused, terminal).
   */
  autoPause(atMs?: number): boolean {
    return this.player.haltVoiceSession(false, atMs);
  }

  /** Screen unmount / discard — any exit without completion is abandonment. */
  recordAbandonment(): void {
    this.recordFunnel('abandoned');
  }

  private recordFunnel(outcome: 'completed' | 'abandoned'): void {
    if (this.funnelRecorded) return;
    this.funnelRecorded = true;
    try {
      this.options.funnelStore.save(
        buildStoredSessionFunnel({
          startedAt: this.options.startedAtIso,
          endedAt: (this.options.nowIso ?? (() => new Date().toISOString()))(),
          outcome,
          funnel: this.player.funnelSnapshot(),
          sessionMode: 'voice_guided',
          voiceIntentCounts: this.voiceIntentCounts,
          tapActionCounts: this.tapActionCounts,
          painEvents: this.player.painEventsSnapshot(),
          firstSessionStarted: this.options.firstSessionStarted === true,
        })
      );
    } catch (error) {
      this.options.onTelemetryError?.(error);
    }
  }
}
