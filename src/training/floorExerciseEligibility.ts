import type { AvailableEquipment } from '../adherence';
import {
  isExerciseLevelAvailableForRelease,
  listExercises,
  resolveExerciseLevel,
  type ExerciseDefinition,
  type ExerciseLadder,
  type ExerciseLevel,
} from '../exercises';
import {
  isFloorTransferConfirmed,
  type NormalizedMovementCapabilityProfile,
} from '../profile/movementCapabilities';
import {
  isExerciseExcludedByDiscomfort,
  type DiscomfortConstraint,
} from './dailyTrainingContext';
import { equipmentSupportsTags } from './equipmentSafety';

export type FloorExerciseEligibilityReasonCode =
  | 'not_floor_exercise'
  | 'floor_space_missing'
  | 'floor_transfer_not_confirmed'
  | 'release_policy_blocked'
  | 'daily_context_blocked'
  | 'equipment_missing';

export interface FloorExerciseEligibilityInput {
  readonly level: Pick<ExerciseLevel, 'id' | 'equipment' | 'releaseStatus'>;
  readonly ladder?: Pick<ExerciseLadder, 'id' | 'stimulusKind'> | null;
  readonly availableEquipment: readonly AvailableEquipment[];
  readonly movementCapabilities: NormalizedMovementCapabilityProfile;
  readonly discomfortConstraint?: DiscomfortConstraint | null;
}

export interface FloorExerciseEligibility {
  readonly requiresFloorTransfer: boolean;
  readonly eligible: boolean;
  readonly reasonCodes: readonly FloorExerciseEligibilityReasonCode[];
}

export interface FloorTransferExerciseInventoryRow {
  readonly exerciseId: string;
  readonly displayName: string;
  readonly releaseStatus: ExerciseLevel['releaseStatus'];
  readonly equipment: readonly string[];
  readonly orientation: string;
  readonly setType: ExerciseDefinition['kind'];
  readonly target: string;
}

export function exerciseRequiresFloorTransfer(
  exercise: Pick<ExerciseDefinition | ExerciseLevel, 'equipment'>
): boolean {
  return exercise.equipment.includes('floor');
}

export function deriveFloorExerciseEligibility(
  input: FloorExerciseEligibilityInput
): FloorExerciseEligibility {
  if (!exerciseRequiresFloorTransfer(input.level)) {
    return { requiresFloorTransfer: false, eligible: true, reasonCodes: ['not_floor_exercise'] };
  }

  const reasonCodes: FloorExerciseEligibilityReasonCode[] = [];
  if (!equipmentSupportsTags(input.level.equipment, input.availableEquipment)) {
    reasonCodes.push(
      input.availableEquipment.includes('floor_space') ? 'equipment_missing' : 'floor_space_missing'
    );
  }
  if (!isFloorTransferConfirmed(input.movementCapabilities)) {
    reasonCodes.push('floor_transfer_not_confirmed');
  }
  if (!isExerciseLevelAvailableForRelease(input.level)) {
    reasonCodes.push('release_policy_blocked');
  }
  if (
    input.ladder &&
    input.discomfortConstraint &&
    isExerciseExcludedByDiscomfort(input.ladder, input.level, input.discomfortConstraint)
  ) {
    reasonCodes.push('daily_context_blocked');
  }

  return {
    requiresFloorTransfer: true,
    eligible: reasonCodes.length === 0,
    reasonCodes,
  };
}

export function listFloorTransferExerciseInventory(): FloorTransferExerciseInventoryRow[] {
  return listExercises()
    .filter(exerciseRequiresFloorTransfer)
    .map((exercise) => {
      const resolved = resolveExerciseLevel(exercise.id);
      return {
        exerciseId: exercise.id,
        displayName: exercise.displayName,
        releaseStatus: resolved.level.releaseStatus,
        equipment: exercise.equipment.map(String),
        orientation: exercise.cameraView.view,
        setType: exercise.kind,
        target: targetTextForExercise(exercise),
      };
    })
    .sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
}

function targetTextForExercise(exercise: ExerciseDefinition): string {
  const prescription = exercise.prescription;
  if (typeof prescription.repsPerSet === 'number') return `${prescription.repsPerSet} reps`;
  if (typeof prescription.holdSec === 'number') return `${prescription.holdSec} seconds`;
  if (typeof prescription.timerSec === 'number') return `${prescription.timerSec} seconds`;
  if (typeof prescription.captureSec === 'number') return `${prescription.captureSec} seconds`;
  return 'prescribed set';
}
