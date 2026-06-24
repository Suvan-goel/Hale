import type {
  MovementProfileV2ReferenceProfile,
  NormalizedMovementProfileV2ReferenceProfile,
  ReferenceAgeBasis,
  ReferenceEngineDiagnostic,
  ReferenceSexForPublishedComparisons,
} from './types';

const AGE_BASIS_VALUES: readonly ReferenceAgeBasis[] = [
  'exact_age_at_test',
  'birth_year_month_derived',
  'age_group_only',
  'legacy_age_band_representative',
  'unknown',
] as const;

const REFERENCE_SEX_VALUES: readonly ReferenceSexForPublishedComparisons[] = [
  'female',
  'male',
  'prefer_not_to_say',
  'unknown',
] as const;

export function normalizeMovementProfileV2ReferenceProfile(
  input: MovementProfileV2ReferenceProfile | null | undefined
): NormalizedMovementProfileV2ReferenceProfile {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const ageBasis = normalizeAgeBasis(input?.ageBasis);
  const referenceSex = normalizeReferenceSex(input?.referenceSex);
  const ageAtTest = normalizeAgeAtTest(input?.ageAtTest);
  const ageGroupLabel = normalizeAgeGroupLabel(input?.ageGroupLabel);

  if (ageBasis !== input?.ageBasis) diagnostics.push({ code: 'reference_age_basis_normalized_unknown', severity: 'info', domain: 'profile' });
  if (referenceSex !== input?.referenceSex) diagnostics.push({ code: 'reference_sex_normalized_unknown', severity: 'info', domain: 'profile' });
  if (ageAtTest === null && input?.ageAtTest !== undefined) diagnostics.push({ code: 'reference_age_invalid', severity: 'info', domain: 'profile' });
  if (ageBasis === 'age_group_only' && ageGroupLabel === null) {
    diagnostics.push({ code: 'reference_age_group_missing', severity: 'info', domain: 'profile' });
  }

  return {
    ageAtTest,
    ageBasis,
    ageGroupLabel,
    referenceSex,
    profileDiagnostics: diagnostics,
  };
}

export function hasExactReferenceAge(
  profile: NormalizedMovementProfileV2ReferenceProfile
): profile is NormalizedMovementProfileV2ReferenceProfile & {
  ageAtTest: number;
  ageBasis: 'exact_age_at_test' | 'birth_year_month_derived';
} {
  return (
    (profile.ageBasis === 'exact_age_at_test' || profile.ageBasis === 'birth_year_month_derived') &&
    profile.ageAtTest !== null
  );
}

export function hasBinaryReferenceSex(profile: NormalizedMovementProfileV2ReferenceProfile): profile is NormalizedMovementProfileV2ReferenceProfile & {
  referenceSex: 'female' | 'male';
} {
  return profile.referenceSex === 'female' || profile.referenceSex === 'male';
}

function normalizeAgeBasis(value: unknown): ReferenceAgeBasis {
  return AGE_BASIS_VALUES.includes(value as ReferenceAgeBasis) ? (value as ReferenceAgeBasis) : 'unknown';
}

function normalizeReferenceSex(value: unknown): ReferenceSexForPublishedComparisons {
  return REFERENCE_SEX_VALUES.includes(value as ReferenceSexForPublishedComparisons)
    ? (value as ReferenceSexForPublishedComparisons)
    : 'unknown';
}

function normalizeAgeAtTest(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 120) return null;
  return value;
}

function normalizeAgeGroupLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
