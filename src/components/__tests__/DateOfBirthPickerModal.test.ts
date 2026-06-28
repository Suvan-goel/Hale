import {
  clampDatePartsToAgeRange,
  dateOfBirthFromParts,
  yearOptionsForAgeRange,
} from '../DateOfBirthPickerModal';

describe('DateOfBirthPickerModal age bounds', () => {
  const asOf = new Date('2026-06-28T12:00:00.000Z');

  it('includes the boundary years for an 18-120 profile range', () => {
    const options = yearOptionsForAgeRange(18, 120, asOf);

    expect(options[0]).toEqual({ label: '2008', value: 2008 });
    expect(options[options.length - 1]).toEqual({ label: '1906', value: 1906 });
  });

  it('clamps dates older than exactly 120 years to the valid boundary date', () => {
    expect(clampDatePartsToAgeRange({ year: 1906, month: 6, day: 27 }, 18, 120, asOf)).toEqual({
      year: 1906,
      month: 6,
      day: 28,
    });
  });

  it('clamps dates younger than exactly 18 years to the valid boundary date', () => {
    expect(clampDatePartsToAgeRange({ year: 2008, month: 6, day: 29 }, 18, 120, asOf)).toEqual({
      year: 2008,
      month: 6,
      day: 28,
    });
  });

  it('serializes clamped date parts as normalized DOB input', () => {
    const clamped = clampDatePartsToAgeRange({ year: 1906, month: 6, day: 27 }, 18, 120, asOf);

    expect(dateOfBirthFromParts(clamped)).toBe('1906-06-28');
  });
});
