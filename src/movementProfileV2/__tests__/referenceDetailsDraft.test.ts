import {
  enteredMovementProfileV2ReferenceDetailsDraft,
  referenceProfileFromMovementProfileV2Draft,
  skippedMovementProfileV2ReferenceDetailsDraft,
} from '../referenceDetailsDraft';

describe('Movement Profile V2 reference details draft', () => {
  it('keeps exact age explicit when entered', () => {
    const profile = referenceProfileFromMovementProfileV2Draft(
      enteredMovementProfileV2ReferenceDetailsDraft({
        exactAge: 62,
        ageBand: '55_64',
        referenceSex: 'female',
      })
    );

    expect(profile).toEqual({
      ageAtTest: 62,
      ageBasis: 'exact_age_at_test',
      referenceSex: 'female',
    });
  });

  it('does not promote an age band representative to exact age', () => {
    const profile = referenceProfileFromMovementProfileV2Draft(
      enteredMovementProfileV2ReferenceDetailsDraft({
        ageBand: '55_64',
        referenceSex: 'male',
      })
    );

    expect(profile).toEqual({
      ageBasis: 'legacy_age_band_representative',
      ageGroupLabel: '55-64',
      referenceSex: 'male',
    });
    expect(profile).not.toHaveProperty('ageAtTest');
  });

  it('can explicitly continue without published comparisons', () => {
    const profile = referenceProfileFromMovementProfileV2Draft(
      skippedMovementProfileV2ReferenceDetailsDraft()
    );

    expect(profile).toEqual({
      ageBasis: 'unknown',
      referenceSex: 'unknown',
    });
  });
});
