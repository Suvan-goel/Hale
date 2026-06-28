import {
  ageBandForAge,
  ageBandForRepresentativeAge,
  ageDisplayLabel,
  ageFromDateOfBirth,
  ageRangeLabelForAge,
  dateOfBirthInputLabel,
  formatDateOfBirthInputText,
  normalizeDateOfBirthInput,
  representativeAgeForAgeBand,
} from '../age';

describe('age display labels', () => {
  it('renders stored onboarding age bands as selected ranges', () => {
    expect(ageDisplayLabel(null, 'under_45')).toBe('Age under 45');
    expect(ageDisplayLabel(null, '45_54')).toBe('Age 45-54');
    expect(ageDisplayLabel(null, '55_64')).toBe('Age 55-64');
    expect(ageDisplayLabel(null, '65_74')).toBe('Age 65-74');
    expect(ageDisplayLabel(null, '75_plus')).toBe('Age 75+');
  });

  it('displays legacy exact ages as ranges', () => {
    expect(ageDisplayLabel(60)).toBe('Age 55-64');
    expect(ageDisplayLabel(58)).toBe('Age 55-64');
    expect(ageRangeLabelForAge(58)).toBe('55-64');
    expect(ageBandForAge(76)).toBe('75_plus');
  });

  it('maps legacy onboarding representatives to bands for migration', () => {
    expect(ageBandForRepresentativeAge(60)).toBe('55_64');
    expect(ageRangeLabelForAge(60)).toBe('55-64');
    expect(representativeAgeForAgeBand('75_plus')).toBe(76);
  });

  it('handles unset age', () => {
    expect(ageDisplayLabel(null)).toBe('Age not set');
    expect(ageDisplayLabel(undefined)).toBe('Age not set');
  });

  it('normalizes date of birth input and derives whole-year age', () => {
    const asOf = new Date('2026-06-27T12:00:00.000Z');

    expect(formatDateOfBirthInputText('07011968')).toBe('07/01/1968');
    expect(normalizeDateOfBirthInput('07/01/1968')).toBe('1968-07-01');
    expect(dateOfBirthInputLabel('1968-07-01')).toBe('07/01/1968');
    expect(ageFromDateOfBirth('1968-07-01', asOf)).toBe(57);
    expect(ageFromDateOfBirth('1968-06-01', asOf)).toBe(58);
  });

  it('treats the 120-year maximum as an exact date boundary', () => {
    const asOf = new Date('2026-06-28T12:00:00.000Z');

    expect(ageFromDateOfBirth('1906-06-28', asOf)).toBe(120);
    expect(ageFromDateOfBirth('1906-06-27', asOf)).toBeNull();
    expect(ageFromDateOfBirth('1906-06-29', asOf)).toBe(119);
    expect(ageFromDateOfBirth('2008-06-28', asOf)).toBe(18);
    expect(ageFromDateOfBirth('2008-06-29', asOf)).toBeNull();
  });
});
