import { BALANCE_SINGLE_LEG_ID } from '../exercises';
import type { ExerciseLevel } from '../exercises';
import {
  isFloorTransferConfirmed,
  isSingleLegBalanceConfirmed,
  isStepUpEnvironmentConfirmed,
  type NormalizedMovementCapabilityProfile,
} from '../profile';

type MovementCapabilityLevel = Pick<ExerciseLevel, 'id'> & {
  equipment: readonly ExerciseLevel['equipment'][number][];
};

export type MovementCapabilityBlockReason =
  | 'floor_transfer_not_confirmed'
  | 'step_up_environment_not_confirmed'
  | 'single_leg_balance_not_confirmed';

export function movementCapabilityBlockReasonsForLevel(
  level: MovementCapabilityLevel,
  capabilities: NormalizedMovementCapabilityProfile
): MovementCapabilityBlockReason[] {
  const reasons: MovementCapabilityBlockReason[] = [];
  if (level.equipment.includes('floor') && !isFloorTransferConfirmed(capabilities)) {
    reasons.push('floor_transfer_not_confirmed');
  }
  if (level.equipment.includes('stair') && !isStepUpEnvironmentConfirmed(capabilities)) {
    reasons.push('step_up_environment_not_confirmed');
  }
  if (level.id === BALANCE_SINGLE_LEG_ID && !isSingleLegBalanceConfirmed(capabilities)) {
    reasons.push('single_leg_balance_not_confirmed');
  }
  return reasons;
}

export function movementCapabilitySupportsLevel(
  level: MovementCapabilityLevel,
  capabilities: NormalizedMovementCapabilityProfile
): boolean {
  return movementCapabilityBlockReasonsForLevel(level, capabilities).length === 0;
}
