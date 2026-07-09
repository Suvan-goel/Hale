import type { TrainingItemResult, TrainingSessionResult } from '../training/sessionPlayer';
import type { PearlSessionPlan } from './types';

export interface SessionWorkEvidence {
  plannedExerciseCount: number;
  resultItemCount: number;
  completedExerciseCount: number;
  skippedExerciseCount: number;
  missingResultCount: number;
  duplicateResultCount: number;
  malformedResultCount: number;
  unmatchedResultCount: number;
  completedExerciseIds: readonly string[];
  skippedExerciseIds: readonly string[];
  missingExerciseIds: readonly string[];
  duplicateExerciseIds: readonly string[];
  malformedExerciseIds: readonly string[];
  unmatchedExerciseIds: readonly string[];
  hasCompletedPlannedExercise: boolean;
}

export function evaluateSessionWorkEvidence(
  sessionPlan: PearlSessionPlan | null | undefined,
  sessionResult: TrainingSessionResult | null | undefined
): SessionWorkEvidence {
  const plannedIds = unique((sessionPlan?.exercises ?? []).map((exercise) => exercise.id).filter(isNonEmptyString));
  const planned = new Set(plannedIds);
  const buckets = new Map<string, TrainingItemResult[]>();
  const malformedExerciseIds: string[] = [];
  const unmatchedExerciseIds: string[] = [];
  const items = Array.isArray(sessionResult?.items) ? sessionResult.items : [];

  for (const item of items) {
    const id = item && typeof item.exerciseId === 'string' ? item.exerciseId : '';
    if (!isNonEmptyString(id) || (item.status !== 'completed' && item.status !== 'skipped') || !Array.isArray(item.sets)) {
      malformedExerciseIds.push(id || 'unknown');
      continue;
    }
    if (!planned.has(id)) {
      unmatchedExerciseIds.push(id);
      continue;
    }
    const existing = buckets.get(id);
    if (existing) existing.push(item);
    else buckets.set(id, [item]);
  }

  const completedExerciseIds: string[] = [];
  const skippedExerciseIds: string[] = [];
  const missingExerciseIds: string[] = [];
  const duplicateExerciseIds: string[] = [];

  for (const id of plannedIds) {
    const bucket = buckets.get(id);
    if (!bucket || bucket.length === 0) {
      missingExerciseIds.push(id);
      continue;
    }
    if (bucket.length > 1) {
      duplicateExerciseIds.push(id);
      continue;
    }
    const item = bucket[0];
    if (item.status === 'completed') completedExerciseIds.push(id);
    else skippedExerciseIds.push(id);
  }

  return {
    plannedExerciseCount: plannedIds.length,
    resultItemCount: items.length,
    completedExerciseCount: completedExerciseIds.length,
    skippedExerciseCount: skippedExerciseIds.length,
    missingResultCount: missingExerciseIds.length,
    duplicateResultCount: duplicateExerciseIds.length,
    malformedResultCount: malformedExerciseIds.length,
    unmatchedResultCount: unmatchedExerciseIds.length,
    completedExerciseIds,
    skippedExerciseIds,
    missingExerciseIds,
    duplicateExerciseIds,
    malformedExerciseIds,
    unmatchedExerciseIds,
    hasCompletedPlannedExercise: completedExerciseIds.length > 0,
  };
}

export function completedExerciseIdsFromEvidence(evidence: SessionWorkEvidence): Set<string> {
  return new Set(evidence.completedExerciseIds);
}

function unique<T>(values: readonly T[]): T[] {
  const out: T[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
