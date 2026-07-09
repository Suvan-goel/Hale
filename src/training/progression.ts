/**
 * Persisted legacy progression SHAPE only.
 *
 * The deterministic decide/promote/demote LOGIC that used to live here was
 * removed 2026-07-04: the live progression path is the ladder system
 * (`workoutGeneration.updateLadderProgressAfterSession` applied via
 * `pearlFlow/progressionEvidence`). `ProgressionState` + `initialProgressionState`
 * survive only because `TrainingState` still serialises a `progression` field
 * for backward-compatible reads of older on-device/synced state (see
 * `training/serialize.ts`). Do not re-add rules here.
 */

export interface ProgressionState {
  /** Current level per family (absent ⇒ level 1). */
  levels: Record<string, number>;
  /** Recent per-exercise mean velocities (oldest→newest). */
  velHistory: Record<string, number[]>;
}

export function initialProgressionState(): ProgressionState {
  return { levels: {}, velHistory: {} };
}
