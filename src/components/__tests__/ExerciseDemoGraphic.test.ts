import {
  exerciseDemoFamily,
  getExerciseDemoSpec,
  type ExerciseDemoFamily,
} from '../ExerciseDemoGraphic';

describe('ExerciseDemoGraphic guidance', () => {
  it.each<[string, ExerciseDemoFamily]>([
    ['squat.sit_to_stand', 'chair_squat'],
    ['STS-POWER', 'chair_squat'],
    ['loaded-sit-to-stand', 'chair_squat'],
    ['chair-supported-split-squat', 'chair_squat'],
    ['step-up', 'chair_squat'],
    ['hinge.glute_bridge', 'hinge_bridge'],
    ['hip-hinge-wall', 'hinge_bridge'],
    ['glute-bridge-hold', 'hinge_bridge'],
    ['push.wall_push_up', 'push'],
    ['push-up-incline', 'push'],
    ['pull.seated_band_row', 'pull'],
    ['band-pull-apart', 'pull'],
    ['core.dead_bug_opposite', 'core_carry'],
    ['core.suitcase_carry', 'core_carry'],
    ['balance-single-leg-hold', 'balance'],
    ['programme.prep', 'prep_finisher'],
    ['finisher.power_march', 'prep_finisher'],
    ['finisher.explosive_sit_to_stands', 'prep_finisher'],
    ['unknown.future-movement', 'prep_finisher'],
  ])('maps %s to the stable %s demonstration family', (exerciseId, expected) => {
    expect(exerciseDemoFamily(exerciseId)).toBe(expected);
  });

  it('provides three short instructional cues for every family', () => {
    const representativeIds = [
      'squat.air_squat',
      'hinge.good_morning',
      'push.wall_push_up',
      'pull.band_pull_apart',
      'core.bird_dog',
      'balance-tandem-hold',
      'finisher.heel_drops',
    ];

    for (const exerciseId of representativeIds) {
      const spec = getExerciseDemoSpec(exerciseId);
      expect(spec.cues).toHaveLength(3);
      expect(spec.cues.every((cue) => cue.length > 0 && cue.length <= 80)).toBe(true);
    }
  });

  it('keeps guidance instructional rather than implying camera form judgement', () => {
    const allCopy = [
      'squat.air_squat',
      'hinge.good_morning',
      'push.wall_push_up',
      'pull.band_pull_apart',
      'core.bird_dog',
      'balance-tandem-hold',
      'finisher.heel_drops',
    ]
      .flatMap((exerciseId) => getExerciseDemoSpec(exerciseId).cues)
      .join(' ')
      .toLowerCase();

    expect(allCopy).not.toMatch(/correct|incorrect|perfect|form score|camera/);
  });
});
