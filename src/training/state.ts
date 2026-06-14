/**
 * Training-state transitions — the pure glue the app drives: which session to
 * run next, and how a finished session folds back into state (progression +
 * completion progress + the end-of-block re-test marker). Kept pure and
 * registry-resolved so the whole loop is replay-testable without the app.
 */

import { ExerciseDefinition, getExercise } from '../exercises';
import { SessionPlan, TrainingBlock, resolveSession, totalSessions } from './block';
import { applySessionResult } from './progression';
import { TrainingSessionResult } from './sessionPlayer';
import { BlockProgress, TrainingState } from './serialize';

/** The next session's plan (by completion count), or null when the block is done/absent. */
export function nextSessionPlan(state: TrainingState): SessionPlan | null {
  const block = state.block;
  if (!block) return null;
  const i = state.progress.completedSessions;
  if (i >= totalSessions(block)) return null;
  return block.sessions[i];
}

/** The ordered exercise ids to run next (resolved to current level + equipment). */
export function nextSessionExercises(state: TrainingState): string[] | null {
  const plan = nextSessionPlan(state);
  if (!plan) return null;
  return resolveSession(plan, state.progression, state.equipment);
}

/**
 * Fold a finished session into the state: update progression from its outcomes,
 * advance the completion count, and — once the final session lands — stamp
 * retestDueAt (the in-app "time to re-test" trigger; never an OS notification,
 * a V1 non-goal).
 */
export function recordCompletedSession(
  state: TrainingState,
  session: TrainingSessionResult,
  nowIso: string,
  resolve: (id: string) => ExerciseDefinition = getExercise
): TrainingState {
  const progression = applySessionResult(state.progression, session, resolve);
  const completedSessions = state.progress.completedSessions + 1;
  const total = state.block ? totalSessions(state.block) : Number.POSITIVE_INFINITY;
  const progress: BlockProgress = {
    completedSessions,
    lastSessionAt: nowIso,
    retestDueAt: completedSessions >= total ? state.progress.retestDueAt ?? nowIso : state.progress.retestDueAt,
  };
  return { ...state, progression, progress };
}

/** Whether the active block is finished and a re-test is due. */
export function retestDue(state: TrainingState): boolean {
  return state.progress.retestDueAt !== null;
}

/** Start a fresh block: reset progression-independent progress; keep velocity history/levels. */
export function startBlock(state: TrainingState, block: TrainingBlock): TrainingState {
  return {
    ...state,
    block,
    progress: { completedSessions: 0, lastSessionAt: null, retestDueAt: null },
  };
}
