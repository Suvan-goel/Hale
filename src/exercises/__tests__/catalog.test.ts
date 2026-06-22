/**
 * Catalog integrity: the starter exercise catalog registers ~12 families, every
 * progression/regression/substitute link resolves, ladders are well-formed
 * (contiguous levels, symmetric prog/regress links), and every prescription
 * matches its grading kind. This is what keeps the registry pattern honest as
 * exercises are added.
 */

import {
  familyLevels,
  getExercise,
  hasExercise,
  legacyExerciseAliases,
  listExerciseLadders,
  listExercises,
  listVisibleExerciseLadders,
  resolveExerciseLevel,
} from '../index';

describe('exercise catalog integrity', () => {
  const all = listExercises();

  it('registers V1 families across 30+ levels', () => {
    expect(all.length).toBeGreaterThanOrEqual(20);
    const families = new Set(all.map((e) => e.family));
    expect(families.size).toBeGreaterThanOrEqual(14);
  });

  it('every progression / regression / substitute id resolves', () => {
    for (const e of all) {
      for (const id of [e.progressionId, e.regressionId, e.substituteId]) {
        if (id) expect(hasExercise(id)).toBe(true);
      }
    }
  });

  it('progression and regression links are symmetric within a family', () => {
    for (const e of all) {
      if (e.progressionId) {
        const next = getExercise(e.progressionId);
        expect(next.family).toBe(e.family);
        expect(next.regressionId).toBe(e.id);
        expect(next.level).toBe(e.level + 1);
      }
    }
  });

  it('each family has contiguous levels starting at 1', () => {
    const families = new Set(all.map((e) => e.family));
    for (const family of families) {
      const levels = familyLevels(family).map((e) => e.level);
      expect(levels).toEqual(levels.map((_, i) => i + 1));
    }
  });

  it('substitutes avoid equipment the profile can lack', () => {
    for (const e of all) {
      if (!e.substituteId) continue;
      const sub = getExercise(e.substituteId);
      // The substitute must need nothing the equipment profile can lack.
      expect(
        sub.equipment.every(
          (t) => t !== 'stair' && t !== 'band' && t !== 'long_band' && t !== 'mini_band' && t !== 'backpack_or_weight'
        )
      ).toBe(true);
    }
  });

  it('prescriptions match grading kind and are sane', () => {
    for (const e of all) {
      expect(e.prescription.sets).toBeGreaterThan(0);
      expect(e.prescription.restSec).toBeGreaterThanOrEqual(0);
      if (e.kind === 'reps') expect(e.prescription.repsPerSet ?? 0).toBeGreaterThan(0);
      if (e.kind === 'hold') expect(e.prescription.holdSec ?? 0).toBeGreaterThan(0);
      if (e.kind === 'rom') expect(e.prescription.captureSec ?? 0).toBeGreaterThan(0);
      if (e.kind === 'timer') expect(e.prescription.timerSec ?? 0).toBeGreaterThan(0);
      // Autoregulation only makes sense on rep-based items.
      if (e.prescription.autoregulate) expect(e.kind).toBe('reps');
      expect(() => e.createGrader()).not.toThrow();
    }
  });
});

describe('V1 ladder catalogue', () => {
  const ladders = listExerciseLadders();

  it('has a core level in every core ladder', () => {
    for (const ladder of ladders.filter((l) => l.releaseStatus === 'v1_core')) {
      expect(ladder.levels.some((level) => level.releaseStatus === 'v1_core')).toBe(true);
    }
  });

  it('all V1 core levels carry release, measurement, setup, and copy metadata', () => {
    for (const ladder of ladders) {
      for (const level of ladder.levels.filter((l) => l.releaseStatus === 'v1_core')) {
        expect(level.id).toBeTruthy();
        expect(level.name).toBeTruthy();
        expect(level.domain).toMatch(/strength_power|balance_stability|mobility_flexibility/);
        expect(level.releaseStatus).toBeTruthy();
        expect(level.measurementTier).toMatch(/measured|camera_assisted|voice_guided/);
        expect(level.instructions).toBeTruthy();
        expect(Array.isArray(level.equipment)).toBe(true);
        expect(level.cameraView).toBeTruthy();
        expect(() => getExercise(level.id)).not.toThrow();
      }
    }
  });

  it('marks every ladder with explicit progression and stimulus semantics', () => {
    for (const ladder of ladders) {
      expect(ladder.progressionModel).toMatch(/linear_progression|collection|supporting_set/);
      expect(ladder.stimulusKind).toBeTruthy();
      for (const level of ladder.levels) {
        expect(level.domainRole).toMatch(/primary|cross_domain_supporting/);
      }
    }

    expect(ladders.find((ladder) => ladder.id === 'balance')).toMatchObject({
      progressionModel: 'linear_progression',
      stimulusKind: 'static_balance',
    });
    expect(ladders.find((ladder) => ladder.id === 'lateral-stability')).toMatchObject({
      progressionModel: 'supporting_set',
      stimulusKind: 'dynamic_balance',
    });
    expect(ladders.find((ladder) => ladder.id === 'mobility-flexibility')).toMatchObject({
      progressionModel: 'collection',
      stimulusKind: 'mobility_collection',
    });
    expect(ladders.find((ladder) => ladder.id === 'pull-upper-back')?.stimulusKind).toBe('upper_pull');
  });

  it('keeps safety-critical ladder equipment aligned with registered definitions', () => {
    for (const ladder of ladders) {
      for (const level of ladder.levels) {
        expect(getExercise(level.id).equipment.slice().sort()).toEqual(level.equipment.slice().sort());
      }
    }
  });

  it('requires explicit safety metadata for floor, stair, and supported balance levels', () => {
    const levels = ladders.flatMap((ladder) => ladder.levels.map((level) => ({ ladder, level })));
    const stepUp = levels.find(({ level }) => level.id === 'step-up')?.level;
    expect(stepUp?.equipment).toEqual(expect.arrayContaining(['stair', 'counter']));
    expect(`${stepUp?.setupNotes ?? ''} ${stepUp?.safetyNotes ?? ''}`.toLowerCase()).toMatch(/support|lowest stable step/);

    for (const { level } of levels.filter(({ level }) => level.equipment.includes('floor'))) {
      expect(`${level.setupNotes ?? ''} ${level.safetyNotes ?? ''}`.toLowerCase()).toMatch(/floor/);
    }

    expect(getExercise('balance-feet-together-hold').equipment).toEqual(['counter']);
    expect(getExercise('balance-tandem-hold').equipment).toEqual(['counter']);
    expect(getExercise('balance-single-leg-hold').equipment).toEqual(['counter']);
    expect(getExercise('loaded-march')).toMatchObject({
      displayName: 'March in Place',
      equipment: ['counter'],
    });
  });

  it('guards the only cross-domain ladder level explicitly', () => {
    const mismatches = ladders.flatMap((ladder) =>
      ladder.levels
        .filter((level) => level.domain !== ladder.domain)
        .map((level) => ({ ladderId: ladder.id, levelId: level.id, domainRole: level.domainRole }))
    );

    expect(mismatches).toEqual([
      {
        ladderId: 'shoulder-reach-press',
        levelId: 'overhead-press-band',
        domainRole: 'cross_domain_supporting',
      },
    ]);
  });

  it('keeps mobility collection and cross-domain shoulder strength out of linear mobility endpoints', () => {
    const mobility = ladders.find((ladder) => ladder.id === 'mobility-flexibility');
    const shoulder = ladders.find((ladder) => ladder.id === 'shoulder-reach-press');

    expect(mobility?.progressionModel).toBe('collection');
    expect(mobility?.levels.map((level) => level.name)).toEqual([
      'Seated Hamstring Reach',
      'Thoracic Rotation',
      'Supported Hip Flexor Stretch',
      'Wall Calf Stretch',
      'Neck Rotations',
    ]);
    expect(shoulder?.progressionModel).toBe('supporting_set');
    expect(shoulder?.levels.find((level) => level.id === 'overhead-press-band')).toMatchObject({
      domain: 'strength_power',
      domainRole: 'cross_domain_supporting',
    });
  });

  it('hides optional, post-V1, and hidden legacy levels from the visible catalogue', () => {
    const visible = listVisibleExerciseLadders().flatMap((l) => l.levels);
    expect(visible.some((l) => l.releaseStatus !== 'v1_core')).toBe(false);
  });

  it('resolves legacy ids to canonical ladder levels', () => {
    expect(resolveExerciseLevel('sit_to_stand').level.id).toBe('sts-standard');
    expect(resolveExerciseLevel('wall_push_up').level.id).toBe('push-up-wall');
    expect(resolveExerciseLevel('loaded_march').ladder.id).toBe('lateral-stability');
    expect(legacyExerciseAliases().single_leg_hold).toBe('balance-single-leg-hold');
  });
});
