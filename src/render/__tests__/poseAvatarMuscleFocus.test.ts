import {
  getExercise,
  HEEL_RAISE_SUPPORTED_ID,
  NECK_ROTATION_ID,
  PUSHUP_WALL_ID,
  STS_STANDARD_ID,
  WALL_CALF_STRETCH_ID,
} from '../../exercises';
import { pointCloudBodyPartsForTrainingExercise } from '../poseAvatarMuscleFocus';

describe('pose avatar muscle focus', () => {
  it('maps sit-to-stand work to the quad/thigh region', () => {
    expect(pointCloudBodyPartsForTrainingExercise(getExercise(STS_STANDARD_ID))).toEqual([
      'leftThigh',
      'rightThigh',
    ]);
  });

  it('maps upper push work to a restrained upper-body focus', () => {
    expect(pointCloudBodyPartsForTrainingExercise(getExercise(PUSHUP_WALL_ID))).toEqual([
      'torso',
      'leftUpperArm',
      'rightUpperArm',
      'leftForearm',
      'rightForearm',
    ]);
  });

  it('maps calf work to lower legs and feet', () => {
    expect(pointCloudBodyPartsForTrainingExercise(getExercise(HEEL_RAISE_SUPPORTED_ID))).toEqual([
      'leftLowerLeg',
      'rightLowerLeg',
      'leftFoot',
      'rightFoot',
    ]);
    expect(pointCloudBodyPartsForTrainingExercise(getExercise(WALL_CALF_STRETCH_ID))).toEqual([
      'leftLowerLeg',
      'rightLowerLeg',
      'leftFoot',
      'rightFoot',
    ]);
  });

  it('maps neck mobility to the head and neck bridge', () => {
    expect(pointCloudBodyPartsForTrainingExercise(getExercise(NECK_ROTATION_ID))).toEqual([
      'head',
      'neck',
    ]);
  });

  it('returns no focus for unknown exercise context', () => {
    expect(pointCloudBodyPartsForTrainingExercise(null)).toBeUndefined();
    expect(pointCloudBodyPartsForTrainingExercise({ id: 'unknown', family: 'unknown' })).toBeUndefined();
  });
});
