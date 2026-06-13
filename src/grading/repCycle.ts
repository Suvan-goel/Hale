/**
 * RepCycleTracker — one of the four grading archetypes. Counts angle/position
 * threshold cycles on a scalar signal with hysteresis and optional EMA
 * smoothing (chair stands, push-ups, curls…).
 *
 * Signal convention: HIGHER = the "up"/extended end of the movement (e.g.
 * knee angle: ~90° seated, ~175° standing). Movement definitions negate
 * their signal if their movement runs the other way.
 *
 * Hysteresis (the double-count killer): two thresholds, upEnter > downEnter.
 * State commits to 'up' only above upEnter and back to 'down' only below
 * downEnter, so jitter around either threshold can never re-trigger a
 * transition. A rep is credited once per down→up commit (full rise reached);
 * a rise that stalls between the thresholds and falls back is an aborted
 * ascent — never counted.
 *
 * Pure TS, allocation-free update(): the output object and its events array
 * are reused every frame — consume synchronously, never retain.
 */

export interface RepCycleConfig {
  /** Signal must rise above this to commit 'up' (credits the rep). */
  upEnter: number;
  /** Signal must fall below this to commit 'down' (arms the next rep). */
  downEnter: number;
  /**
   * EMA factor applied to the incoming signal (1 = no extra smoothing).
   * Landmarks are already One-Euro filtered upstream; use < 1 only when a
   * derived signal still proves noisy in replay tuning.
   */
  emaAlpha: number;
}

/** Committed position within the cycle. 'unknown' until the first commit. */
export type RepCycleState = 'unknown' | 'down' | 'up';

export type RepCycleEventType =
  /** Left 'down' heading up — opens the concentric (rise) window. */
  | 'ascent-start'
  /** Reached 'up': rep credited, closes the concentric window. */
  | 'rep'
  /** Rise stalled between thresholds and fell back — not counted. */
  | 'ascent-abort'
  /** Returned to 'down' — next rep armed. */
  | 'bottom';

export interface RepCycleEvent {
  type: RepCycleEventType;
  timestampMs: number;
}

export interface RepCycleOutput {
  state: RepCycleState;
  /** True while between thresholds heading away from the committed state. */
  inTransition: boolean;
  repCount: number;
  /** Smoothed signal actually compared against thresholds. */
  signal: number;
  /** Events fired by THIS update (array reused — consume synchronously). */
  events: RepCycleEvent[];
}

export class RepCycleTracker {
  private readonly config: RepCycleConfig;
  private readonly output: RepCycleOutput;

  private state: RepCycleState = 'unknown';
  private inTransition = false;
  private repCount = 0;
  private ema = 0;
  private hasEma = false;

  constructor(config: RepCycleConfig) {
    if (config.upEnter <= config.downEnter) {
      throw new Error('RepCycleTracker: upEnter must exceed downEnter (hysteresis band)');
    }
    this.config = config;
    this.output = {
      state: 'unknown',
      inTransition: false,
      repCount: 0,
      signal: 0,
      events: [],
    };
  }

  /** Feed one signal sample. Returns the reused output object. */
  update(rawSignal: number, timestampMs: number): RepCycleOutput {
    const out = this.output;
    out.events.length = 0;

    if (!this.hasEma) {
      this.ema = rawSignal;
      this.hasEma = true;
    } else {
      this.ema += this.config.emaAlpha * (rawSignal - this.ema);
    }
    const s = this.ema;

    switch (this.state) {
      case 'unknown':
        // First commit anchors the cycle; no rep can be credited from it.
        if (s >= this.config.upEnter) {
          this.state = 'up';
        } else if (s <= this.config.downEnter) {
          this.state = 'down';
        }
        break;

      case 'down':
        if (s >= this.config.upEnter) {
          // A one-frame jump across the whole band still opens the window
          // before closing it, so velocity layers always see a paired
          // ascent-start → rep.
          if (!this.inTransition) {
            this.push(out, 'ascent-start', timestampMs);
          }
          this.inTransition = false;
          this.state = 'up';
          this.repCount++;
          this.push(out, 'rep', timestampMs);
        } else if (s > this.config.downEnter) {
          if (!this.inTransition) {
            this.inTransition = true;
            this.push(out, 'ascent-start', timestampMs);
          }
        } else if (this.inTransition) {
          this.inTransition = false;
          this.push(out, 'ascent-abort', timestampMs);
        }
        break;

      case 'up':
        if (s <= this.config.downEnter) {
          this.inTransition = false;
          this.state = 'down';
          this.push(out, 'bottom', timestampMs);
        } else {
          // Drifting inside the band away from 'up' (or back) credits
          // nothing — only a full return below downEnter re-arms.
          this.inTransition = s < this.config.upEnter;
        }
        break;
    }

    out.state = this.state;
    out.inTransition = this.inTransition;
    out.repCount = this.repCount;
    out.signal = s;
    return out;
  }

  private push(out: RepCycleOutput, type: RepCycleEventType, timestampMs: number): void {
    out.events.push({ type, timestampMs });
  }

  get reps(): number {
    return this.repCount;
  }

  /**
   * Subject-gone / tracking-interruption handler: re-anchor the state machine
   * (the painful Forma lesson — stale state across a gap double-counts on
   * re-entry) while keeping reps already credited.
   */
  resetState(): void {
    this.state = 'unknown';
    this.inTransition = false;
    this.hasEma = false;
  }

  /** Full reset including the rep count (new session/item). */
  reset(): void {
    this.resetState();
    this.repCount = 0;
    this.output.events.length = 0;
  }
}
