/**
 * Effort signal (C9 ruling — tap-first, existing machinery).
 *
 * v1 reuses the existing post-session RPE (1–5) feedback channel as the
 * effort signal: the session-level RPE maps to the spec's effort answer and
 * applies to every pattern in that session. Per-exercise capture (and the
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
