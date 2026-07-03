/**
 * Setup-funnel instrumentation for training sessions.
 *
 * Measures where a session's time goes before any work happens — framing cost
 * per item, setup-issue latches, time to the first set and first credited
 * rep — and how the session ended. This is the evidence behind the friction
 * decisions (is camera setup where sessions die?), so it must be trustworthy:
 * all timing derives from frame timestamps, which makes a replayed recording
 * reproduce the funnel exactly, and pause gaps are excluded via the same
 * shiftTiming discipline the player uses. Wall-clock context (ISO dates,
 * outcome) is attached by the app layer when the record is persisted — see
 * src/telemetry.
 */

export interface TrainingItemFunnel {
  exerciseId: string;
  /**
   * Setup start (transition exit) → camera-ready, ms. Null if the item never
   * framed (floor fast-path re-entry, skip, or abandonment during setup).
   */
  framingMs: number | null;
  /**
   * Setup start → the item's first set beginning, ms — the user-felt cost of
   * everything between exercises (framing, instructions, floor setup,
   * countdown). Null if no set ever started.
   */
  toFirstSetMs: number | null;
  /** Times the framing timeout latched the setup-issue state on this item. */
  setupIssues: number;
  /** True when the item was skipped before its first set started. */
  skippedDuringSetup: boolean;
}

export interface TrainingSessionFunnel {
  /** First frame → first set beginning anywhere in the session, ms; null if none. */
  timeToFirstSetMs: number | null;
  /** First frame → first credited rep, ms; null if no rep was ever credited. */
  timeToFirstRepMs: number | null;
  /** Total setup-issue latches across all items. */
  setupIssueCount: number;
  /** One entry per item the session reached, in order. */
  items: TrainingItemFunnel[];
  /** Player phase when the snapshot was taken ('done' for a finished session). */
  endedInPhase: string;
  completed: boolean;
}

/**
 * Owned by TrainingSessionPlayer; every method is called from the per-frame
 * update path only on state transitions (never per frame), so the tracker
 * allocates nothing until snapshot().
 */
export class SessionFunnelTracker {
  private sessionStartMs = -1;
  private itemStartMs = -1;
  private timeToFirstSetMs: number | null = null;
  private timeToFirstRepMs: number | null = null;
  private readonly items: TrainingItemFunnel[] = [];

  /** First frame of the session (any phase, including intro). */
  sessionStarted(ts: number): void {
    if (this.sessionStartMs < 0) this.sessionStartMs = ts;
  }

  /** The item left its transition and setup (framing or floor setup) began. */
  itemSetupStarted(exerciseId: string, ts: number): void {
    this.items.push({
      exerciseId,
      framingMs: null,
      toFirstSetMs: null,
      setupIssues: 0,
      skippedDuringSetup: false,
    });
    this.itemStartMs = ts;
  }

  /** Pre-flight reached camera-ready for the current item. */
  framingReady(ts: number): void {
    const item = this.currentItem();
    if (item && item.framingMs === null && this.itemStartMs >= 0) {
      item.framingMs = ts - this.itemStartMs;
    }
  }

  /** The framing timeout latched the setup-issue state (call on the transition only). */
  setupIssueLatched(): void {
    const item = this.currentItem();
    if (item) item.setupIssues++;
  }

  /** A set began ("go"). */
  setStarted(ts: number): void {
    const item = this.currentItem();
    if (item && item.toFirstSetMs === null && this.itemStartMs >= 0) {
      item.toFirstSetMs = ts - this.itemStartMs;
    }
    if (this.timeToFirstSetMs === null && this.sessionStartMs >= 0) {
      this.timeToFirstSetMs = ts - this.sessionStartMs;
    }
  }

  /** A rep was credited (call on the credit event only). */
  repCredited(ts: number): void {
    if (this.timeToFirstRepMs === null && this.sessionStartMs >= 0) {
      this.timeToFirstRepMs = ts - this.sessionStartMs;
    }
  }

  /** The current item was skipped; only counts as a setup skip before its first set. */
  itemSkipped(): void {
    const item = this.currentItem();
    if (item && item.toFirstSetMs === null) item.skippedDuringSetup = true;
  }

  /** Mirror of the player's shiftTiming: keep in-flight marks pause-free. */
  shiftTiming(deltaMs: number): void {
    if (deltaMs <= 0) return;
    if (this.sessionStartMs >= 0) this.sessionStartMs += deltaMs;
    if (this.itemStartMs >= 0) this.itemStartMs += deltaMs;
  }

  snapshot(endedInPhase: string, completed: boolean): TrainingSessionFunnel {
    let setupIssueCount = 0;
    for (const item of this.items) setupIssueCount += item.setupIssues;
    return {
      timeToFirstSetMs: this.timeToFirstSetMs,
      timeToFirstRepMs: this.timeToFirstRepMs,
      setupIssueCount,
      items: this.items.map((item) => ({ ...item })),
      endedInPhase,
      completed,
    };
  }

  private currentItem(): TrainingItemFunnel | null {
    return this.items.length > 0 ? this.items[this.items.length - 1] : null;
  }
}
