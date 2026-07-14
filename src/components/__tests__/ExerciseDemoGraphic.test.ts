import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { allProgrammeDisplayNames } from '../../programme/naming';
import {
  exerciseDemoFamily,
  exerciseGuideKey,
  getExerciseDemoSpec,
  type ExerciseDemoFamily,
  type ExerciseGuideKey,
} from '../ExerciseDemoGraphic';

const componentSource = readFileSync(
  join(process.cwd(), 'src/components/ExerciseDemoGraphic.tsx'),
  'utf8'
);

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
    ['prog-squat-supported', 'chair_squat'],
    ['prog-hinge-wall', 'hinge_bridge'],
    ['prog-push-wall', 'push'],
    ['prog-pull-band-row', 'pull'],
    ['prog-core-suitcase-carry', 'core_carry'],
    ['prog-finisher-explosive-sit-to-stands', 'prep_finisher'],
    ['unknown.future-movement', 'prep_finisher'],
  ])('maps %s to the stable %s demonstration family', (exerciseId, expected) => {
    expect(exerciseDemoFamily(exerciseId)).toBe(expected);
  });

  it.each<[string, ExerciseGuideKey]>([
    ['programme.prep', 'warmup'],
    ['squat.sit_to_stand', 'chair_rise'],
    ['squat.air_squat', 'squat'],
    ['squat.low_step_up', 'step_up'],
    ['squat.supported_split_squat', 'split_squat'],
    ['hinge.glute_bridge', 'bridge'],
    ['hinge.wall_tap_hinge', 'hinge'],
    ['push.counter_push_up', 'push'],
    ['pull.prone_t_raise', 'upper_back'],
    ['pull.band_pull_apart', 'band_pull'],
    ['pull.seated_band_row', 'row'],
    ['core.dead_bug_heel_slides', 'supine_core'],
    ['core.bird_dog', 'kneeling_core'],
    ['core.suitcase_carry', 'carry'],
    ['balance-single-leg-hold', 'balance'],
    ['finisher.explosive_sit_to_stands', 'chair_rise'],
    ['finisher.fast_step_ups', 'step_up'],
    ['finisher.counter_push_offs', 'push'],
  ])('maps %s to the reusable %s image guide', (exerciseId, expected) => {
    expect(exerciseGuideKey(exerciseId)).toBe(expected);
  });

  it('uses the neutral graphic fallback when a movement has no distinct setup guide', () => {
    expect(exerciseGuideKey('prep.easy_march')).toBeNull();
    expect(exerciseGuideKey('finisher.heel_drops')).toBeNull();
    expect(exerciseGuideKey('unknown.future-movement')).toBeNull();
  });

  it('covers every registered programme movement that needs a separate setup guide', () => {
    const neutralMovementIds = new Set([
      'prep.easy_march',
      'prep.arm_reaches',
      'finisher.heel_drops',
      'finisher.moderate_stomps',
      'finisher.power_march',
    ]);

    for (const exerciseId of allProgrammeDisplayNames().keys()) {
      if (neutralMovementIds.has(exerciseId)) continue;
      expect(exerciseGuideKey(exerciseId)).not.toBeNull();
    }
  });

  it('shows the full three-step strip in the same fixed frame as the check-up guides', () => {
    expect(componentSource).toContain('aspectRatio: 1200 / 659');
    expect(componentSource).toContain('resizeMode="contain"');
    expect(componentSource).toContain("height: '100%'");
    expect(componentSource).not.toContain('resizeMode="cover"');
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
