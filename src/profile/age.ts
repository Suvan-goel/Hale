import type { AgeBand } from '../adherence';

export type AgeRangeOption = {
  label: string;
  value: AgeBand | null;
};

export const AGE_RANGE_OPTIONS: readonly AgeRangeOption[] = [
  { label: 'Prefer not to say', value: null },
  { label: 'Under 45', value: 'under_45' },
  { label: '45-54', value: '45_54' },
  { label: '55-64', value: '55_64' },
  { label: '65-74', value: '65_74' },
  { label: '75+', value: '75_plus' },
];

const AGE_BAND_LABELS: Record<AgeBand, string> = {
  under_45: 'Under 45',
  '45_54': '45-54',
  '55_64': '55-64',
  '65_74': '65-74',
  '75_plus': '75+',
};

const AGE_BAND_REPRESENTATIVES: Record<AgeBand, number> = {
  under_45: 44,
  '45_54': 50,
  '55_64': 60,
  '65_74': 70,
  '75_plus': 76,
};

const REPRESENTATIVE_AGE_BANDS = new Map<number, AgeBand>(
  Object.entries(AGE_BAND_REPRESENTATIVES).map(([band, age]) => [age, band as AgeBand])
);

export function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(AGE_BAND_LABELS, value);
}

export function ageBandLabel(ageBand: AgeBand | null | undefined): string | null {
  return ageBand ? AGE_BAND_LABELS[ageBand] : null;
}

export function representativeAgeForAgeBand(ageBand: AgeBand | null | undefined): number | null {
  return ageBand ? AGE_BAND_REPRESENTATIVES[ageBand] : null;
}

export function ageBandForRepresentativeAge(age: number | null | undefined): AgeBand | null {
  return typeof age === 'number' ? REPRESENTATIVE_AGE_BANDS.get(age) ?? null : null;
}

export function ageBandForAge(age: number | null | undefined): AgeBand | null {
  if (typeof age !== 'number' || !Number.isFinite(age) || age <= 0 || age >= 120) return null;
  if (age < 45) return 'under_45';
  if (age <= 54) return '45_54';
  if (age <= 64) return '55_64';
  if (age <= 74) return '65_74';
  return '75_plus';
}

export function ageRangeLabelForAge(age: number | null | undefined): string | null {
  return ageBandLabel(ageBandForAge(age));
}

export function ageDisplayLabel(age: number | null | undefined, ageBand?: AgeBand | null): string {
  const rangeLabel = ageBandLabel(ageBand ?? ageBandForAge(age));
  if (rangeLabel === 'Under 45') return 'Age under 45';
  if (rangeLabel) return `Age ${rangeLabel}`;
  return 'Age not set';
}
