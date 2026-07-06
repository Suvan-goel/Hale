import { activityPrior, placementForOnboarding, squatCapacityFromT3 } from '../placement';

describe('activityPrior (reuses the existing ActivityLevel — ruling 3)', () => {
  it('maps the four levels onto 0–3 and unanswered onto the conservative 0', () => {
    expect(activityPrior('very_inactive')).toBe(0);
    expect(activityPrior('lightly_active')).toBe(1);
    expect(activityPrior('moderately_active')).toBe(2);
    expect(activityPrior('very_active')).toBe(3);
    expect(activityPrior(null)).toBe(0);
  });
});

describe('B1 Gentle Start bypass', () => {
  it('places every ladder at L1 and ignores any assessment data', () => {
    const result = placementForOnboarding({
      assessment: { t3: { reps: 20, handsUsed: false }, t1: { worseSideSeconds: 40 } },
      activityLevel: 'very_active',
      consentDeclined: false,
      gentleStart: true,
    });
    expect(result.placement).toEqual({ squat: 1, hinge: 1, push: 1, pull: 1, core: 1 });
    expect(result.balanceSupportRequired).toBeNull();
  });
});

describe('deferred / skipped placement (activity prior; T2 deferred so push uses prior too)', () => {
  it.each([
    [null, { squat: 1, push: 1, hinge: 1, pull: 1, core: 1 }],
    ['very_inactive', { squat: 1, push: 1, hinge: 1, pull: 1, core: 1 }],
    ['lightly_active', { squat: 1, push: 1, hinge: 1, pull: 1, core: 1 }],
    ['moderately_active', { squat: 2, push: 2, hinge: 1, pull: 2, core: 2 }],
    ['very_active', { squat: 2, push: 2, hinge: 2, pull: 2, core: 3 }],
  ] as const)('activity level %s', (activityLevel, expected) => {
    const result = placementForOnboarding({
      assessment: null,
      activityLevel,
      consentDeclined: false,
      gentleStart: false,
    });
    expect(result.placement).toEqual(expected);
    expect(result.finisherContacts).toBe(20);
  });
});

describe('consent declined (privacy choice, never a health flag)', () => {
  it('caps activity-prior placement at L2 and uses no assessment', () => {
    const result = placementForOnboarding({
      assessment: { t3: { reps: 20, handsUsed: false } },
      activityLevel: 'very_active',
      consentDeclined: true,
      gentleStart: false,
    });
    expect(result.placement).toEqual({ squat: 2, push: 2, hinge: 2, pull: 2, core: 2 });
    expect(result.balanceSupportRequired).toBeNull();
  });
});

describe('T3 chair-stand mapping (spec §5) with the −1 easy start (spec §6)', () => {
  it('maps the capacity table', () => {
    expect(squatCapacityFromT3({ reps: 7, handsUsed: false })).toBe(1);
    expect(squatCapacityFromT3({ reps: 12, handsUsed: true })).toBe(1); // hand-assist → L1
    expect(squatCapacityFromT3({ reps: 8, handsUsed: false })).toBe(2);
    expect(squatCapacityFromT3({ reps: 11, handsUsed: false })).toBe(2);
    expect(squatCapacityFromT3({ reps: 12, handsUsed: false })).toBe(3);
    expect(squatCapacityFromT3({ reps: 15, handsUsed: false })).toBe(3);
    expect(squatCapacityFromT3({ reps: 16, handsUsed: false })).toBe(4);
  });

  it.each([
    [{ reps: 7, handsUsed: false }, 1], // max(1, 1−1) = 1
    [{ reps: 10, handsUsed: false }, 1],
    [{ reps: 14, handsUsed: false }, 2],
    [{ reps: 18, handsUsed: false }, 3],
  ])('T3 %o starts the squat ladder at %i', (t3, expected) => {
    const result = placementForOnboarding({
      assessment: { t3 },
      activityLevel: 'very_inactive',
      consentDeclined: false,
      gentleStart: false,
    });
    expect(result.placement.squat).toBe(expected);
  });

  it('leaves the other ladders on activity-prior placement (T2 deferred)', () => {
    const result = placementForOnboarding({
      assessment: { t3: { reps: 18, handsUsed: false } },
      activityLevel: 'moderately_active',
      consentDeclined: false,
      gentleStart: false,
    });
    expect(result.placement).toEqual({ squat: 3, push: 2, hinge: 1, pull: 2, core: 2 });
  });
});

describe('T1 balance stand', () => {
  it('forces balance support on under 10 s even when B5 said No', () => {
    const result = placementForOnboarding({
      assessment: { t1: { worseSideSeconds: 9 } },
      activityLevel: null,
      consentDeclined: false,
      gentleStart: false,
    });
    expect(result.balanceSupportRequired).toBe(true);
  });

  it('reports normal balance at 10 s and above, and null when not performed', () => {
    const normal = placementForOnboarding({
      assessment: { t1: { worseSideSeconds: 22 } },
      activityLevel: null,
      consentDeclined: false,
      gentleStart: false,
    });
    expect(normal.balanceSupportRequired).toBe(false);

    const skipped = placementForOnboarding({
      assessment: null,
      activityLevel: null,
      consentDeclined: false,
      gentleStart: false,
    });
    expect(skipped.balanceSupportRequired).toBeNull();
  });
});
