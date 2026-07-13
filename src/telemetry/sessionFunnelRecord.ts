/**
 * Persisted session-funnel record: local-only instrumentation, kept separate
 * from product data (history/adherence) so it can be pruned or dropped without
 * touching results. Schema-versioned from day one (CLAUDE.md data rule).
 * Pure (de)serialization + migration — no I/O, fully unit-testable.
 *
 * Schema v2 (2026-07-06, voice-session slice): adds sessionMode, the
 * churn-location taxonomy (completionPoint — the data that gates conductor
 * promotion), voice-vs-tap usage counts, and painEvents. painEvents here are
 * the IMMUTABLE AUDIT TRAIL (founder rule): one file per session, append-only
 * store, no rewrite API — the Settings reversal toggle touches only the
 * product store's recurrence state, never these records.
 *
 * Schema v3 (2026-07-06, programme-v2 Step 2): adds firstSessionStarted —
 * the ACTIVATION EVENT (onboarding-spec §10, the flow's success metric).
 * True only on the record of the user's first-ever session start; local
 * telemetry only (no remote analytics, per ruling).
 */

import type { TrainingSessionFunnel } from '../training/sessionFunnel';
import type { TrainingPainEvent, TrainingSessionMode } from '../training/sessionPlayer';

export const SESSION_FUNNEL_SCHEMA_VERSION = 3;

export type SessionFunnelOutcome = 'completed' | 'abandoned';

/**
 * Churn-location taxonomy (TDD-ADDENDUM §4). "Never starts sessions" is a
 * plan-level cohort (no record exists at all); within a record the abandon
 * point is derived from the phase the session died in.
 */
export type SessionCompletionPoint =
  | 'completed'
  | 'abandoned_setup'
  | 'abandoned_mid_set'
  | 'abandoned_rest';

export interface StoredSessionFunnel {
  schemaVersion: number;
  kind: 'training';
  /** Wall-clock session start (the player's startedAt). */
  startedAt: string;
  /** Wall-clock moment the record was captured. */
  endedAt: string;
  outcome: SessionFunnelOutcome;
  funnel: TrainingSessionFunnel;
  /** v2: absent on v1 records. */
  sessionMode?: TrainingSessionMode;
  completionPoint?: SessionCompletionPoint;
  /** Matched voice intents that acted, keyed by intent. */
  voiceIntentCounts?: Record<string, number>;
  /** Tap actions on the same surfaces, keyed by action. */
  tapActionCounts?: Record<string, number>;
  /** Immutable during normal use; removed only by explicit device/account erasure. */
  painEvents?: TrainingPainEvent[];
  /**
   * v3: the activation event — true only on the user's first-ever session
   * start (onboarding success metric). Absent on earlier-schema records.
   */
  firstSessionStarted?: boolean;
}

/**
 * Phase → churn location. waiting_ready counts as setup (no set underway);
 * voice_paused maps to mid-set — she halted an active workout, whatever
 * phase the pause interrupted.
 */
export function deriveCompletionPoint(
  funnel: TrainingSessionFunnel,
  outcome: SessionFunnelOutcome
): SessionCompletionPoint {
  if (outcome === 'completed' || funnel.completed) return 'completed';
  if (funnel.endedInPhase === 'set' || funnel.endedInPhase === 'voice_paused') {
    return 'abandoned_mid_set';
  }
  if (funnel.endedInPhase === 'rest') return 'abandoned_rest';
  return 'abandoned_setup';
}

export function buildStoredSessionFunnel(input: {
  startedAt: string;
  endedAt: string;
  outcome: SessionFunnelOutcome;
  funnel: TrainingSessionFunnel;
  sessionMode?: TrainingSessionMode;
  voiceIntentCounts?: Record<string, number>;
  tapActionCounts?: Record<string, number>;
  painEvents?: readonly TrainingPainEvent[];
  firstSessionStarted?: boolean;
}): StoredSessionFunnel {
  return {
    schemaVersion: SESSION_FUNNEL_SCHEMA_VERSION,
    kind: 'training',
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    outcome: input.outcome,
    funnel: input.funnel,
    ...(input.sessionMode !== undefined ? { sessionMode: input.sessionMode } : {}),
    completionPoint: deriveCompletionPoint(input.funnel, input.outcome),
    ...(input.voiceIntentCounts !== undefined ? { voiceIntentCounts: { ...input.voiceIntentCounts } } : {}),
    ...(input.tapActionCounts !== undefined ? { tapActionCounts: { ...input.tapActionCounts } } : {}),
    ...(input.painEvents !== undefined && input.painEvents.length > 0
      ? { painEvents: input.painEvents.map((event) => ({ ...event })) }
      : {}),
    ...(input.firstSessionStarted === true ? { firstSessionStarted: true } : {}),
  };
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

export function serializeSessionFunnel(record: StoredSessionFunnel): string {
  return JSON.stringify(record, nanReplacer);
}

function validCounts(v: unknown): Record<string, number> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

function validPainEvents(v: unknown): TrainingPainEvent[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter(
    (e): e is TrainingPainEvent =>
      !!e &&
      typeof e === 'object' &&
      typeof (e as { exerciseId?: unknown }).exerciseId === 'string' &&
      typeof (e as { setIndex?: unknown }).setIndex === 'number' &&
      typeof (e as { timestampMs?: unknown }).timestampMs === 'number'
  );
  return out.length > 0 ? out : undefined;
}

const COMPLETION_POINTS: readonly SessionCompletionPoint[] = [
  'completed',
  'abandoned_setup',
  'abandoned_mid_set',
  'abandoned_rest',
];

/**
 * Returns null for anything unreadable or from a schema we don't understand.
 * v1 records (pre-voice) stay readable — v2 fields are simply absent.
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
  if (rec.schemaVersion !== 1 && rec.schemaVersion !== 2 && rec.schemaVersion !== SESSION_FUNNEL_SCHEMA_VERSION) {
    return null;
  }
  if (rec.kind !== 'training') return null;
  if (typeof rec.startedAt !== 'string' || typeof rec.endedAt !== 'string') return null;
  if (rec.outcome !== 'completed' && rec.outcome !== 'abandoned') return null;
  const funnel = rec.funnel;
  if (!funnel || typeof funnel !== 'object' || !Array.isArray(funnel.items)) return null;
  if (typeof funnel.endedInPhase !== 'string' || typeof funnel.completed !== 'boolean') return null;
  const voiceIntentCounts = validCounts(rec.voiceIntentCounts);
  const tapActionCounts = validCounts(rec.tapActionCounts);
  const painEvents = validPainEvents(rec.painEvents);
  return {
    schemaVersion: rec.schemaVersion,
    kind: 'training',
    startedAt: rec.startedAt,
    endedAt: rec.endedAt,
    outcome: rec.outcome,
    funnel,
    ...(rec.sessionMode === 'camera_conducted' || rec.sessionMode === 'voice_guided'
      ? { sessionMode: rec.sessionMode }
      : {}),
    ...(COMPLETION_POINTS.includes(rec.completionPoint as SessionCompletionPoint)
      ? { completionPoint: rec.completionPoint as SessionCompletionPoint }
      : {}),
    ...(voiceIntentCounts !== undefined ? { voiceIntentCounts } : {}),
    ...(tapActionCounts !== undefined ? { tapActionCounts } : {}),
    ...(painEvents !== undefined ? { painEvents } : {}),
    ...(rec.firstSessionStarted === true ? { firstSessionStarted: true } : {}),
  };
}
