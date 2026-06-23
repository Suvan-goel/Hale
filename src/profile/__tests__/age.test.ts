import {
  ageBandForAge,
  ageBandForRepresentativeAge,
  ageDisplayLabel,
  ageRangeLabelForAge,
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
});
