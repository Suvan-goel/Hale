/**
 * Copy invariants shared by view-model tests (REPOSITION_TDD §2.4, approved
 * 2026-07-06): a "worse" result of any kind is never presented bare — every
 * downward change must carry the trainable path (and, once covariates exist,
 * known-driver context). This module is the single definition of that check so
 * results/progress/Clarity trend tests all enforce the same shape.
 *
 * Structural on purpose: any copy row with a change direction and optional
 * support copy can be checked, regardless of which surface produced it.
 */

export interface DirectionalChangeCopy {
  /** Stable identifier for reporting which row violated the invariant. */
  id: string;
  direction: 'up' | 'down' | 'steady';
  /**
   * The paired trainable-path / known-drivers copy. Required (non-empty) for
   * every `down` row; ignored otherwise.
   */
  supportCopy?: string | null;
}

/**
 * Returns the ids of downward rows presented bare (missing or blank support
 * copy). Tests assert this is empty.
 */
export function bareDownwardChanges(rows: readonly DirectionalChangeCopy[]): string[] {
  return rows
    .filter((row) => row.direction === 'down' && !(row.supportCopy ?? '').trim())
    .map((row) => row.id);
}
