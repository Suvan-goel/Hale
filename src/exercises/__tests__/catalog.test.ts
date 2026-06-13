/**
 * Catalog integrity: the starter exercise catalog registers ~12 families, every
 * progression/regression/substitute link resolves, ladders are well-formed
 * (contiguous levels, symmetric prog/regress links), and every prescription
 * matches its grading kind. This is what keeps the registry pattern honest as
 * exercises are added.
 */

import { familyLevels, getExercise, hasExercise, listExercises } from '../index';

describe('exercise catalog integrity', () => {
  const all = listExercises();

  it('registers ~12 families across 20+ levels', () => {
    expect(all.length).toBeGreaterThanOrEqual(20);
    const families = new Set(all.map((e) => e.family));
    expect(families.size).toBe(12);
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

  it('substitutes are zero-equipment (so a missing item never blocks)', () => {
    for (const e of all) {
      if (!e.substituteId) continue;
      const sub = getExercise(e.substituteId);
      // The substitute must need nothing the equipment profile can lack.
      expect(sub.equipment.every((t) => t !== 'stair' && t !== 'band')).toBe(true);
    }
  });

  it('prescriptions match grading kind and are sane', () => {
    for (const e of all) {
      expect(e.prescription.sets).toBeGreaterThan(0);
      expect(e.prescription.restSec).toBeGreaterThanOrEqual(0);
      if (e.kind === 'reps') expect(e.prescription.repsPerSet ?? 0).toBeGreaterThan(0);
      if (e.kind === 'hold') expect(e.prescription.holdSec ?? 0).toBeGreaterThan(0);
      if (e.kind === 'rom') expect(e.prescription.captureSec ?? 0).toBeGreaterThan(0);
      // Autoregulation only makes sense on rep-based items.
      if (e.prescription.autoregulate) expect(e.kind).toBe('reps');
      expect(() => e.createGrader()).not.toThrow();
    }
  });
});
