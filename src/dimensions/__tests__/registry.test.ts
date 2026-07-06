import { DIMENSIONS, activeScoringDimensions, dimensionById, objectiveMovementDomains } from '../registry';

describe('dimension registry (REPOSITION_TDD §4)', () => {
  it('registers exactly the four dimensions with strength leading every hierarchy', () => {
    expect(DIMENSIONS.map((d) => d.id)).toEqual(['strength', 'balance', 'mobility', 'clarity']);
    const ordered = [...DIMENSIONS].sort((a, b) => a.surfaceHierarchy - b.surfaceHierarchy);
    expect(ordered[0].id).toBe('strength');
  });

  it('rule of record: no dimension is composite-eligible in v1', () => {
    // A future composite is a recorded decision gated on observed noise
    // characteristics — it starts by changing the literal `false` type, which
    // this guard exists to make loud.
    for (const dimension of DIMENSIONS) {
      expect(dimension.compositeEligible).toBe(false);
    }
  });

  it('keeps clarity off scoring surfaces until its flag flips', () => {
    expect(activeScoringDimensions(false).map((d) => d.id)).toEqual([
      'strength',
      'balance',
      'mobility',
    ]);
    expect(activeScoringDimensions(true).map((d) => d.id)).toEqual([
      'strength',
      'balance',
      'mobility',
      'clarity',
    ]);
  });

  it('structurally excludes clarity from camera-measurement iteration regardless of flag', () => {
    // Self-report never renders as a measurement card (§5.4): the objective
    // iteration filters on measurement basis, not on the flag.
    expect(objectiveMovementDomains()).toEqual(['strength_power', 'balance', 'mobility']);
  });

  it('gives clarity no training domain (one prescription trains everything) and no movement domain', () => {
    const clarity = dimensionById('clarity');
    expect(clarity.trainingDomain).toBeNull();
    expect(clarity.movementDomain).toBeNull();
    expect(clarity.measurement).toBe('self_report');
    // Objective dimensions keep full legacy adapters.
    for (const id of ['strength', 'balance', 'mobility'] as const) {
      const dimension = dimensionById(id);
      expect(dimension.movementDomain).not.toBeNull();
      expect(dimension.trainingDomain).not.toBeNull();
    }
  });
});
