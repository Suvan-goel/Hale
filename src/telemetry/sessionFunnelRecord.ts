/**
 * Persisted session-funnel record: local-only instrumentation, kept separate
 * from product data (history/adherence) so it can be pruned or dropped without
 * touching results. Schema-versioned from day one (CLAUDE.md data rule).
 * Pure (de)serialization + migration — no I/O, fully unit-testable.
 */

import type { TrainingSessionFunnel } from '../training/sessionFunnel';

export const SESSION_FUNNEL_SCHEMA_VERSION = 1;

export type SessionFunnelOutcome = 'completed' | 'abandoned';

export interface StoredSessionFunnel {
  schemaVersion: number;
  kind: 'training';
  /** Wall-clock session start (the player's startedAt). */
  startedAt: string;
  /** Wall-clock moment the record was captured. */
  endedAt: string;
  outcome: SessionFunnelOutcome;
  funnel: TrainingSessionFunnel;
}

export function buildStoredSessionFunnel(input: {
  startedAt: string;
  endedAt: string;
  outcome: SessionFunnelOutcome;
  funnel: TrainingSessionFunnel;
}): StoredSessionFunnel {
  return {
    schemaVersion: SESSION_FUNNEL_SCHEMA_VERSION,
    kind: 'training',
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    outcome: input.outcome,
    funnel: input.funnel,
  };
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

export function serializeSessionFunnel(record: StoredSessionFunnel): string {
  return JSON.stringify(record, nanReplacer);
}

/**
 * Returns null for anything unreadable or from a schema we don't understand
 * (forward-compatible: a newer app's file is skipped rather than crashing an
 * older app).
 */
export function deserializeSessionFunnel(json: string): StoredSessionFunnel | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const rec = parsed as Partial<StoredSessionFunnel>;
  if (rec.schemaVersion !== SESSION_FUNNEL_SCHEMA_VERSION) return null; // no older versions exist yet
  if (rec.kind !== 'training') return null;
  if (typeof rec.startedAt !== 'string' || typeof rec.endedAt !== 'string') return null;
  if (rec.outcome !== 'completed' && rec.outcome !== 'abandoned') return null;
  const funnel = rec.funnel;
  if (!funnel || typeof funnel !== 'object' || !Array.isArray(funnel.items)) return null;
  if (typeof funnel.endedInPhase !== 'string' || typeof funnel.completed !== 'boolean') return null;
  return {
    schemaVersion: SESSION_FUNNEL_SCHEMA_VERSION,
    kind: 'training',
    startedAt: rec.startedAt,
    endedAt: rec.endedAt,
    outcome: rec.outcome,
    funnel,
  };
}
