/**
 * Persisted legacy training-block SHAPE only.
 *
 * The block-assignment/session-resolution LOGIC that used to live here
 * (buildBlock, resolveSession, equipment substitution, …) was removed
 * 2026-07-04: the live plan path is `MovementBlock` +
 * `haleFlow/sessionPlanning` + the exercise-ladder system. These types survive
 * only because `TrainingState` still serialises `block`/`equipment` for
 * backward-compatible reads of older on-device/synced state (see
 * `training/serialize.ts`). Do not re-add planning logic here.
 */

import { TrainingSlot } from '../exercises';
import { Domain } from '../scoring';

/** What the user has beyond the always-assumed chair/wall/floor/cushion. */
export interface EquipmentProfile {
  stair: boolean;
  band: boolean;
  miniBand?: boolean;
  load?: boolean;
}

export const DEFAULT_EQUIPMENT: EquipmentProfile = { stair: false, band: false, miniBand: false, load: false };

export interface SlotAssignment {
  slot: TrainingSlot;
  family: string;
}

export interface SessionPlan {
  /** 0-based index across the whole block. */
  index: number;
  /** 1-based week. */
  week: number;
  /** 1-based session within the week. */
  dayOfWeek: number;
  slots: SlotAssignment[];
}

export interface TrainingBlock {
  createdAt: string;
  weeks: number;
  sessionsPerWeek: number;
  /** The domain the block is biased toward; null if the check-up measured nothing. */
  weakestDomain: Domain | null;
  sessions: SessionPlan[];
}
