import {
  BRIDGE_HOLD_ID,
  BRIDGE_REPS_ID,
  PUSHUP_STANDARD_ID,
  STS_STANDARD_ID,
  listVisibleExerciseLadders,
  resolveExerciseLevel,
} from '../../exercises';
import {
  defaultMovementCapabilityProfile,
  normalizeMovementCapabilityProfile,
} from '../../profile';
import { discomfortConstraintForAreas } from '../dailyTrainingContext';
import {
  deriveFloorExerciseEligibility,
  listFloorTransferExerciseInventory,
} from '../floorExerciseEligibility';

function capabilities(status: 'confirmed' | 'avoid_for_now' | 'not_confirmed') {
  return {
    ...defaultMovementCapabilityProfile(),
    floorTransfer: { status },
  };
}

function level(id: string) {
  return resolveExerciseLevel(id);
}

describe('floor exercise eligibility', () => {
  it('derives the exact floor-transfer exercise inventory from the live registry', () => {
    expect(listFloorTransferExerciseInventory().map((row) => row.exerciseId)).toEqual([
      BRIDGE_HOLD_ID,
      BRIDGE_REPS_ID,
      PUSHUP_STANDARD_ID,
    ]);
    expect(listFloorTransferExerciseInventory().find((row) => row.exerciseId === PUSHUP_STANDARD_ID)).toMatchObject({
      releaseStatus: 'v1_optional',
    });
  });

  it('requires floor space and a confirmed floor-transfer capability for floor levels', () => {
    const { level: bridge } = level(BRIDGE_HOLD_ID);
    expect(
      deriveFloorExerciseEligibility({
        level: bridge,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: capabilities('confirmed'),
      })
    ).toMatchObject({ requiresFloorTransfer: true, eligible: true, reasonCodes: [] });

    expect(
      deriveFloorExerciseEligibility({
        level: bridge,
        availableEquipment: ['chair', 'wall'],
        movementCapabilities: capabilities('confirmed'),
      }).reasonCodes
    ).toContain('floor_space_missing');

    expect(
      deriveFloorExerciseEligibility({
        level: bridge,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: capabilities('avoid_for_now'),
      }).reasonCodes
    ).toContain('floor_transfer_not_confirmed');

    expect(
      deriveFloorExerciseEligibility({
        level: bridge,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: capabilities('not_confirmed'),
      }).reasonCodes
    ).toContain('floor_transfer_not_confirmed');
  });

  it('defaults malformed capability data to not eligible for floor levels', () => {
    const { level: bridge } = level(BRIDGE_HOLD_ID);
    const malformed = normalizeMovementCapabilityProfile({ floorTransfer: { status: 'yes' } });
    expect(
      deriveFloorExerciseEligibility({
        level: bridge,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: malformed,
      }).reasonCodes
    ).toContain('floor_transfer_not_confirmed');
  });

  it('keeps release-hidden floor levels out of generated eligibility', () => {
    const { level: pushup } = level(PUSHUP_STANDARD_ID);
    expect(
      deriveFloorExerciseEligibility({
        level: pushup,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: capabilities('confirmed'),
      }).reasonCodes
    ).toContain('release_policy_blocked');
  });

  it('applies daily discomfort blocks to floor bridge levels', () => {
    const resolved = level(BRIDGE_REPS_ID);
    const ladder = listVisibleExerciseLadders().find((item) => item.id === resolved.ladder.id);
    expect(ladder).toBeTruthy();
    expect(
      deriveFloorExerciseEligibility({
        level: resolved.level,
        ladder,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: capabilities('confirmed'),
        discomfortConstraint: discomfortConstraintForAreas(['hip']),
      }).reasonCodes
    ).toContain('daily_context_blocked');
  });

  it('leaves non-floor exercises eligible for the floor-transfer helper', () => {
    const { level: sitToStand } = level(STS_STANDARD_ID);
    expect(
      deriveFloorExerciseEligibility({
        level: sitToStand,
        availableEquipment: ['chair', 'wall'],
        movementCapabilities: capabilities('not_confirmed'),
      })
    ).toMatchObject({ requiresFloorTransfer: false, eligible: true, reasonCodes: ['not_floor_exercise'] });
  });
});
