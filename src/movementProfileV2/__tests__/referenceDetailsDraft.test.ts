import {
  enteredMovementProfileV2ReferenceDetailsDraft,
  movementProfileV2ReferenceDetailsDraftFromProfile,
  referenceDetailsAgeDisplayLabel,
  referenceProfileFromMovementProfileV2Draft,
  skippedMovementProfileV2ReferenceDetailsDraft,
} from '../referenceDetailsDraft';

describe('Movement Profile V2 reference details draft', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('preserves a real date of birth for display while freezing only exact age and reference sex', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-28T12:00:00.000Z'));

    const draft = movementProfileV2ReferenceDetailsDraftFromProfile({
      dateOfBirth: '1966-02-10',
      exactAge: 60,
      referenceSex: 'female',
    });

    expect(draft).toMatchObject({
      ageAtTest: 60,
      ageBasis: 'exact_age_at_test',
      dateOfBirth: '1966-02-10',
      referenceSex: 'female',
    });
    expect(referenceDetailsAgeDisplayLabel({
      dateOfBirth: draft?.dateOfBirth,
      exactAge: draft?.ageAtTest,
    })).toBe('02/10/1966');
    expect(referenceProfileFromMovementProfileV2Draft(draft!)).toEqual({
      ageAtTest: 60,
      ageBasis: 'exact_age_at_test',
      referenceSex: 'female',
    });
  });

  it('renders exact-age-only profile drafts as age text without synthesizing a date of birth', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-28T12:00:00.000Z'));

    const draft = movementProfileV2ReferenceDetailsDraftFromProfile({
      dateOfBirth: null,
      exactAge: 60,
      referenceSex: 'female',
    });

    expect(draft).toMatchObject({
      ageAtTest: 60,
      ageBasis: 'exact_age_at_test',
      referenceSex: 'female',
    });
    expect(draft).not.toHaveProperty('dateOfBirth');
    expect(referenceDetailsAgeDisplayLabel({
      dateOfBirth: draft?.dateOfBirth,
      exactAge: draft?.ageAtTest,
    })).toBe('Age 60');
    expect(JSON.stringify(draft)).not.toMatch(/1966-06-2[78]|1966-06-28|dateOfBirth/);
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
