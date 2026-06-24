/**
 * Shared Movement Check-Up result container. Produced by the orchestrator
 * (src/checkup/checkup.ts), consumed by scoring (src/scoring) and persisted by
 * history (src/history). Kept dependency-light (only movement result types) so
 * everything downstream can import it without cycles.
 *
 * A check-up always yields one item per battery movement; a test the user
 * skipped or that produced no usable measurement is recorded explicitly so the
 * results screen can show "not measured this time" without special-casing.
 */

import { MovementResultBase } from '../movements';
import type { MovementProfileV2Assessment } from '../reference/movementProfileV2/assessment';
import type { StoredMovementProfileV2Snapshot } from '../reference/movementProfileV2/snapshot';
import type { CheckUpProtocolPolicy } from './protocolPolicy';

export type CheckUpItemStatus = 'measured' | 'skipped' | 'unmeasured';

export interface CheckUpItem {
  movementId: string;
  status: CheckUpItemStatus;
  /** The grader result; null when skipped. Present-but-unmeasured carries the
   * grader's own `no-measurement` flag. */
  result: MovementResultBase | null;
}

export interface CheckUp {
  /** ISO-8601 timestamp the check-up started. */
  startedAt: string;
  /**
   * Frozen assessment protocol. Missing legacy records are interpreted as
   * `legacy_movement_age_v1` at validation boundaries.
   */
  protocolPolicy?: CheckUpProtocolPolicy;
  /** Body-unit scale captured for the session (diagnostic / drift check). */
  bodyUnit: number | null;
  items: CheckUpItem[];
  /**
   * Optional immutable Movement Profile V2 interpretation artifact.
   *
   * This is not a legacy score snapshot and must not be used to create V1
   * MovementAssessment, MovementBlock, focus, or report records.
   */
  movementProfileV2Snapshot?: StoredMovementProfileV2Snapshot;
  /**
   * Optional immutable Movement Profile V2 focus/orchestration artifact.
   *
   * Like the V2 snapshot, this is a frozen V2-only interpretation artifact and
   * must not be converted into V1 assessment, block, focus, or report records.
   */
  movementProfileV2Assessment?: MovementProfileV2Assessment;
}

export function findItem(checkUp: CheckUp, movementId: string): CheckUpItem | undefined {
  return checkUp.items.find((i) => i.movementId === movementId);
}
