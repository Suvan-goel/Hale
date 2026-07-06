/**
 * Scripted SpeechActivityMonitor fake — the CI stand-in for the device-gated
 * native monitor (CLARITY_INSTRUMENTS_TDD §4.3). Drives every dual-task logic
 * path headlessly: normal speech, total silence, sparse-but-sufficient speech
 * with long thinking pauses (F5), and monitor unavailability.
 */

import type {
  SpeechActivityAvailability,
  SpeechActivityEvent,
  SpeechActivityMonitor,
  SpeechActivitySummary,
} from '../speechActivity';

export interface ScriptedSpeechSegment {
  /** Offset from start(), in ms. */
  fromMs: number;
  toMs: number;
}

export class ScriptedSpeechActivityMonitor implements SpeechActivityMonitor {
  private readonly segments: ScriptedSpeechSegment[];
  private readonly available: SpeechActivityAvailability;
  private startedAtMs: number | null = null;
  private listeners: ((event: SpeechActivityEvent) => void)[] = [];

  constructor(options: {
    segments?: ScriptedSpeechSegment[];
    availability?: SpeechActivityAvailability;
  } = {}) {
    this.segments = options.segments ?? [];
    this.available = options.availability ?? 'available';
  }

  availability(): Promise<SpeechActivityAvailability> {
    return Promise.resolve(this.available);
  }

  start(atMs: number): void {
    if (this.available !== 'available') throw new Error('monitor unavailable');
    this.startedAtMs = atMs;
    for (const segment of this.segments) {
      for (const listener of this.listeners) {
        listener({ speaking: true, atMs: atMs + segment.fromMs });
        listener({ speaking: false, atMs: atMs + segment.toMs });
      }
    }
  }

  stop(atMs: number): SpeechActivitySummary {
    if (this.startedAtMs === null) throw new Error('stop() before start()');
    const windowMs = Math.max(0, atMs - this.startedAtMs);
    const speechActiveMs = this.segments.reduce(
      (sum, segment) => sum + Math.max(0, Math.min(segment.toMs, windowMs) - Math.min(segment.fromMs, windowMs)),
      0
    );
    this.startedAtMs = null;
    return { speechActiveMs, windowMs };
  }

  onActivity(listener: (event: SpeechActivityEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((existing) => existing !== listener);
    };
  }
}
