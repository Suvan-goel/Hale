import type { AgeBand } from '../adherence';

export type AgeRangeOption = {
  label: string;
  value: AgeBand | null;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
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
  if (typeof age !== 'number' || !Number.isFinite(age) || age <= 0 || age > 120) return null;
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

export function normalizeDateOfBirth(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    return normalizeDateParts(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  }
  const mdy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (mdy) {
    return normalizeDateParts(Number(mdy[3]), Number(mdy[1]), Number(mdy[2]));
  }
  return null;
}

export function normalizeDateOfBirthInput(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    return normalizeDateParts(
      Number(digits.slice(4, 8)),
      Number(digits.slice(0, 2)),
      Number(digits.slice(2, 4))
    );
  }
  return normalizeDateOfBirth(value);
}

export function formatDateOfBirthInputText(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function dateOfBirthInputLabel(dateOfBirth: string | null | undefined): string {
  const parts = datePartsFromIso(dateOfBirth);
  if (!parts) return '';
  return `${pad2(parts.month)}/${pad2(parts.day)}/${parts.year}`;
}

export function ageFromDateOfBirth(
  dateOfBirth: string | null | undefined,
  asOf: Date = new Date(),
  ageRange: { minimumAge?: number; maximumAge?: number } = {}
): number | null {
  const birth = datePartsFromIso(dateOfBirth);
  if (!birth) return null;
  const minimumAge = ageRange.minimumAge ?? 18;
  const maximumAge = ageRange.maximumAge ?? 120;
  let age = asOf.getFullYear() - birth.year;
  const currentMonth = asOf.getMonth() + 1;
  const currentDay = asOf.getDate();
  if (currentMonth < birth.month || (currentMonth === birth.month && currentDay < birth.day)) {
    age -= 1;
  }
  if (!Number.isInteger(age) || age < minimumAge || age > maximumAge) return null;
  if (
    age === maximumAge &&
    (currentMonth > birth.month || (currentMonth === birth.month && currentDay > birth.day))
  ) {
    return null;
  }
  return age;
}

export function birthYearFromDateOfBirth(dateOfBirth: string | null | undefined): number | null {
  return datePartsFromIso(dateOfBirth)?.year ?? null;
}

function normalizeDateParts(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function datePartsFromIso(value: string | null | undefined): DateParts | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const normalized = normalizeDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
  if (normalized !== value) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
