import type { PointCloudBodyPart } from './pointCloudBodyGeometry';

export interface PoseAvatarTrainingExerciseFocusInput {
  id: string;
  family: string;
  slot?: string;
}

const THIGHS: readonly PointCloudBodyPart[] = ['leftThigh', 'rightThigh'];
const LOWER_LEGS: readonly PointCloudBodyPart[] = ['leftLowerLeg', 'rightLowerLeg'];
const FEET: readonly PointCloudBodyPart[] = ['leftFoot', 'rightFoot'];
const UPPER_ARMS: readonly PointCloudBodyPart[] = ['leftUpperArm', 'rightUpperArm'];
const FOREARMS: readonly PointCloudBodyPart[] = ['leftForearm', 'rightForearm'];
const TORSO: readonly PointCloudBodyPart[] = ['torso'];
const NECK: readonly PointCloudBodyPart[] = ['neck'];
const HEAD: readonly PointCloudBodyPart[] = ['head'];

export function pointCloudBodyPartsForTrainingExercise(
  exercise: PoseAvatarTrainingExerciseFocusInput | null | undefined
): readonly PointCloudBodyPart[] | undefined {
  if (!exercise) return undefined;

  switch (exercise.family) {
    case 'sit-to-stand':
    case 'squat':
      return THIGHS;
    case 'step-up':
      return uniqueParts(THIGHS, LOWER_LEGS);
    case 'glute-bridge':
    case 'hip-hinge':
      return uniqueParts(TORSO, THIGHS);
    case 'heel-raise':
      return uniqueParts(LOWER_LEGS, FEET);
    case 'push-up':
      return uniqueParts(TORSO, UPPER_ARMS, FOREARMS);
    case 'pull-upper-back':
      return uniqueParts(TORSO, UPPER_ARMS, FOREARMS);
    case 'overhead':
      return uniqueParts(UPPER_ARMS, FOREARMS);
    case 'balance':
    case 'lateral-stability':
    case 'march':
      return uniqueParts(THIGHS, LOWER_LEGS, FEET);
    case 'hamstring-reach':
      return uniqueParts(THIGHS, LOWER_LEGS);
    case 'neck-rotation':
      return uniqueParts(HEAD, NECK);
    case 'mobility-flexibility':
      return mobilityFocusParts(exercise.id);
    default:
      return slotFallbackParts(exercise.slot);
  }
}

function mobilityFocusParts(id: string): readonly PointCloudBodyPart[] | undefined {
  if (id === 'thoracic-rotation') return TORSO;
  if (id === 'supported-hip-flexor-stretch') return uniqueParts(TORSO, THIGHS);
  if (id === 'wall-calf-stretch') return uniqueParts(LOWER_LEGS, FEET);
  return undefined;
}

function slotFallbackParts(slot: string | undefined): readonly PointCloudBodyPart[] | undefined {
  switch (slot) {
    case 'lower-push':
    case 'power':
      return THIGHS;
    case 'hinge':
      return uniqueParts(TORSO, THIGHS);
    case 'upper-push':
      return uniqueParts(TORSO, UPPER_ARMS, FOREARMS);
    case 'pull-reach':
      return uniqueParts(UPPER_ARMS, FOREARMS);
    case 'balance':
      return uniqueParts(THIGHS, LOWER_LEGS, FEET);
    case 'mobility':
      return undefined;
    default:
      return undefined;
  }
}

function uniqueParts(
  ...groups: readonly (readonly PointCloudBodyPart[])[]
): readonly PointCloudBodyPart[] {
  const parts: PointCloudBodyPart[] = [];
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    for (let i = 0; i < group.length; i++) {
      const part = group[i];
      if (!parts.includes(part)) parts.push(part);
    }
  }
  return parts;
}
