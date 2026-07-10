/**
 * Effort signal (C9 ruling — tap-first, existing machinery).
 *
 * v1 keeps the existing RPE-compatible channel but presents only the three
 * answers progression actually consumes: values 1, 3, and 5 map to lots, a
 * few, and none. Legacy values 2 and 4 remain accepted for saved compatibility.
 * The session-level answer applies to every pattern. Per-exercise capture (and the
 * 3-intent voice slice — distinct words, phonetic-collision reviewed, e.g.
 * "easy / okay / all out"; never "none", which collides with "done") is the
 * FIRST post-v1 vocabulary change, queued under the full safety-word
 * discipline.
 *
 * Mapping rationale ("Could you have done none, a few, or lots more?"):
 *   RPE 1–2  session felt easy        → 'lots'  (fast-promotion signal)
 *   RPE 3–4  worked, reps in reserve  → 'a_few' (the ~2-RIR target zone)
 *   RPE 5    nothing left             → 'none'
 */

import type { EffortAnswer } from './types';

export type SessionRpe = 1 | 2 | 3 | 4 | 5;

export function effortFromRpe(rpe: SessionRpe | null | undefined): EffortAnswer | null {
  if (rpe === 1 || rpe === 2) return 'lots';
  if (rpe === 3 || rpe === 4) return 'a_few';
  if (rpe === 5) return 'none';
  // Unanswered stays unanswered — the engine treats null conservatively
  // (no promotion of any kind on unknown effort; deliberate §12 amendment).
  return null;
}
