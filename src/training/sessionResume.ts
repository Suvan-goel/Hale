/**
 * PARKED — resume slice for the camera-conducted player (sessionPlayer.ts),
 * which no screen mounts. The LIVE voice-session resume slice is
 * src/programme/sessionSnapshot.ts; change behaviour there first.
 *
 * Mid-session recovery for planned training sessions.
 *
 * While a planned session runs, a snapshot of completed items is written at
 * item boundaries and cleared on completion. If the run never completes —
 * process death, crash, or an explicit stop — the snapshot survives, and when
 * the SAME plan (block + template + planned day + exercise list) is started
 * again it resumes after the last completed item instead of starting over.
 * This mirrors the MPV2 pending-raw recovery: recover at the natural re-entry
 * point rather than with a launch prompt. In-flight sets are not restored —
 * a set interrupted mid-measurement restarts, the same honesty rule as
 * pause/resume (see docs/decisions.md 2026-07-02 round two).
 *
 * Pure (de)serialization + matching — no I/O, fully unit-testable.
 */

import type { TrainingItemResult, TrainingSessionResult } from './sessionPlayer';

export const SESSION_RESUME_SCHEMA_VERSION = 1;

/** A snapshot older than this is stale even if the plan still matches. */
export const SESSION_RESUME_MAX_AGE_MS = 18 * 60 * 60 * 1000;

export interface TrainingSessionInProgress {
  schemaVersion: number;
  /** Wall-clock start of the original run (kept across resumes). */
  startedAt: string;
  /** Wall-clock time of the last snapshot write. */
  savedAt: string;
  planId: string;
  blockId: string;
  templateId?: string;
  /** Device-local planned day; resume never crosses plan days. */
  plannedDateKey: string;
  /** The full planned exercise list, in play order. */
  exerciseIds: string[];
  /** Results for items finished (completed or skipped) so far, in play order. */
  completedItems: TrainingItemResult[];
}

export interface SessionResumePlanInfo {
  planId: string;
  blockId: string;
  templateId?: string;
  plannedDateKey?: string;
  exerciseIds: readonly string[];
}

export interface SessionResumeStart {
  /** Items already banked from the earlier run(s). */
  completedItems: TrainingItemResult[];
  /** What the relaunched player should actually run. */
  remainingExerciseIds: string[];
  /** Original wall-clock start, so the merged result keys to the right day. */
  startedAt: string;
}

export function buildSessionInProgress(input: {
  startedAt: string;
  savedAt: string;
  plan: SessionResumePlanInfo & { plannedDateKey: string };
  completedItems: readonly TrainingItemResult[];
}): TrainingSessionInProgress {
  return {
    schemaVersion: SESSION_RESUME_SCHEMA_VERSION,
    startedAt: input.startedAt,
    savedAt: input.savedAt,
    planId: input.plan.planId,
    blockId: input.plan.blockId,
    templateId: input.plan.templateId,
    plannedDateKey: input.plan.plannedDateKey,
    exerciseIds: input.plan.exerciseIds.slice(),
    completedItems: input.completedItems.map(copyItem),
  };
}

/**
 * Whether (and where) the given plan can pick up from the snapshot. Null means
 * start fresh: no snapshot, a different plan/day, a stale snapshot, no items
 * banked yet, or item order that no longer prefixes the plan.
 */
export function resumableSessionStart(
  snapshot: TrainingSessionInProgress | null,
  plan: SessionResumePlanInfo,
  nowIso: string
): SessionResumeStart | null {
  if (!snapshot) return null;
  if (!plan.plannedDateKey || snapshot.plannedDateKey !== plan.plannedDateKey) return null;
  if (snapshot.planId !== plan.planId || snapshot.blockId !== plan.blockId) return null;
  if ((snapshot.templateId ?? null) !== (plan.templateId ?? null)) return null;
  if (snapshot.exerciseIds.length !== plan.exerciseIds.length) return null;
  if (snapshot.exerciseIds.some((id, i) => id !== plan.exerciseIds[i])) return null;
  const done = snapshot.completedItems.length;
  if (done === 0 || done > snapshot.exerciseIds.length) return null;
  if (snapshot.completedItems.some((item, i) => item.exerciseId !== snapshot.exerciseIds[i])) return null;
  const age = Date.parse(nowIso) - Date.parse(snapshot.savedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_RESUME_MAX_AGE_MS) return null;
  return {
    completedItems: snapshot.completedItems.map(copyItem),
    remainingExerciseIds: snapshot.exerciseIds.slice(done),
    startedAt: snapshot.startedAt,
  };
}

/**
 * Fold a resumed run back into one whole-session result: the banked items
 * lead, the new run's items follow, and the original start time keys the
 * session to the day it truly began.
 */
export function mergeResumedSessionResult(
  resume: Pick<SessionResumeStart, 'completedItems' | 'startedAt'> | null,
  result: TrainingSessionResult
): TrainingSessionResult {
  if (!resume) return result;
  return {
    ...result,
    startedAt: resume.startedAt,
    items: [...resume.completedItems.map(copyItem), ...result.items],
  };
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

export function serializeSessionInProgress(snapshot: TrainingSessionInProgress): string {
  return JSON.stringify(snapshot, nanReplacer);
}

/**
 * Returns null for anything unreadable or from a schema we don't understand
 * (forward-compatible: a newer app's file is skipped, never crashes an older
 * app — same contract as the history store).
 */
export function deserializeSessionInProgress(json: string): TrainingSessionInProgress | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const rec = parsed as Partial<TrainingSessionInProgress>;
  if (rec.schemaVersion !== SESSION_RESUME_SCHEMA_VERSION) return null;
  if (
    typeof rec.startedAt !== 'string' ||
    typeof rec.savedAt !== 'string' ||
    typeof rec.planId !== 'string' ||
    typeof rec.blockId !== 'string' ||
    typeof rec.plannedDateKey !== 'string'
  ) {
    return null;
  }
  if (rec.templateId !== undefined && typeof rec.templateId !== 'string') return null;
  if (!Array.isArray(rec.exerciseIds) || rec.exerciseIds.some((id) => typeof id !== 'string')) return null;
  if (!Array.isArray(rec.completedItems) || !rec.completedItems.every(isItemResult)) return null;
  return {
    schemaVersion: SESSION_RESUME_SCHEMA_VERSION,
    startedAt: rec.startedAt,
    savedAt: rec.savedAt,
    planId: rec.planId,
    blockId: rec.blockId,
    templateId: rec.templateId,
    plannedDateKey: rec.plannedDateKey,
    exerciseIds: rec.exerciseIds,
    completedItems: rec.completedItems,
  };
}

function isItemResult(value: unknown): value is TrainingItemResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<TrainingItemResult>;
  return (
    typeof item.exerciseId === 'string' &&
    (item.status === 'completed' || item.status === 'skipped') &&
    Array.isArray(item.sets)
  );
}

function copyItem(item: TrainingItemResult): TrainingItemResult {
  return { exerciseId: item.exerciseId, status: item.status, sets: item.sets.slice() };
}
