/**
 * Pain-event history + recurrence auto-exclusion (safety-word slice, approved
 * scope 2026-07-05; founder requirements 2026-07-06).
 *
 * Dual-home rule: THIS record lives in the schema-versioned TrainingState —
 * the same store the session generator reads — so a movement can never be
 * excluded-in-telemetry but present-in-plan. Telemetry mirrors these events;
 * it never owns them.
 *
 * Exclusion is keyed by LADDER (movement family): pain on one sit-to-stand
 * level excludes the family — swapping her to a harder/easier level of the
 * same movement is not a swap at all. Recurrence rule: pain events on the
 * same ladder in ≥2 DISTINCT SESSIONS → auto-exclude. Reversal (Settings)
 * clears that ladder's event history too — a fresh start, otherwise the next
 * single twinge would re-exclude instantly and "bring it back" would be a lie.
 *
 * Claims discipline: nothing here diagnoses or grades severity; the copy that
 * surfaces these states says only what happened and suggests mentioning
 * persistent pain to a doctor.
 */

import { resolveExerciseLevel } from '../exercises';
import type { TrainingPainEvent } from './sessionPlayer';

export interface PainEventRecord {
  exerciseId: string;
  ladderId: string;
  setIndex: number;
  timestampMs: number;
  /** Session identity for the recurrence rule (distinct-session counting). */
  sessionStartedAt: string;
}

export interface PainExclusionRecord {
  ladderId: string;
  excludedAt: string;
  /** Sessions (startedAt) whose events triggered the exclusion. */
  evidenceSessions: string[];
}

export interface PainHistoryState {
  events: PainEventRecord[];
  exclusions: PainExclusionRecord[];
}

/** Distinct sessions with pain on the same ladder before auto-exclusion. */
export const PAIN_RECURRENCE_SESSION_COUNT = 2;

export function defaultPainHistory(): PainHistoryState {
  return { events: [], exclusions: [] };
}

function ladderIdForExercise(exerciseId: string): string | null {
  try {
    return resolveExerciseLevel(exerciseId).ladder.id;
  } catch {
    return null;
  }
}

export interface RecordPainEventsResult {
  history: PainHistoryState;
  /** Ladders excluded BY THIS recording — the caller surfaces the swap notice. */
  newlyExcludedLadderIds: string[];
}

/** Fold one finished session's pain events into history; apply recurrence. */
export function recordSessionPainEvents(
  history: PainHistoryState,
  painEvents: readonly TrainingPainEvent[],
  sessionStartedAt: string
): RecordPainEventsResult {
  if (painEvents.length === 0) return { history, newlyExcludedLadderIds: [] };

  const events = history.events.slice();
  for (const event of painEvents) {
    const ladderId = ladderIdForExercise(event.exerciseId);
    if (!ladderId) continue;
    events.push({
      exerciseId: event.exerciseId,
      ladderId,
      setIndex: event.setIndex,
      timestampMs: event.timestampMs,
      sessionStartedAt,
    });
  }

  const excluded = new Set(history.exclusions.map((exclusion) => exclusion.ladderId));
  const exclusions = history.exclusions.slice();
  const newlyExcludedLadderIds: string[] = [];
  const sessionsByLadder = new Map<string, Set<string>>();
  for (const event of events) {
    const sessions = sessionsByLadder.get(event.ladderId) ?? new Set<string>();
    sessions.add(event.sessionStartedAt);
    sessionsByLadder.set(event.ladderId, sessions);
  }
  for (const [ladderId, sessions] of sessionsByLadder) {
    if (excluded.has(ladderId)) continue;
    if (sessions.size >= PAIN_RECURRENCE_SESSION_COUNT) {
      exclusions.push({
        ladderId,
        excludedAt: sessionStartedAt,
        evidenceSessions: [...sessions].sort(),
      });
      newlyExcludedLadderIds.push(ladderId);
    }
  }

  return { history: { events, exclusions }, newlyExcludedLadderIds };
}

export function activePainExclusionLadderIds(
  history: PainHistoryState | null | undefined
): string[] {
  return history ? history.exclusions.map((exclusion) => exclusion.ladderId) : [];
}

/**
 * Settings "bring it back": remove the exclusion AND that ladder's events —
 * reversal means a genuine fresh start (two new pain sessions to re-exclude).
 */
export function reinstateLadder(history: PainHistoryState, ladderId: string): PainHistoryState {
  return {
    events: history.events.filter((event) => event.ladderId !== ladderId),
    exclusions: history.exclusions.filter((exclusion) => exclusion.ladderId !== ladderId),
  };
}
