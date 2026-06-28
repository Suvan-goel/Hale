import type { AgeBand } from '../adherence';
import { latestOfficialMovementProfileV2Snapshot } from '../haleFlow/checkupHistory';
import type { StoredCheckUp } from '../history';
import {
  ageFromDateOfBirth,
  ageBandLabel,
  dateOfBirthInputLabel,
  normalizeDateOfBirth,
} from '../profile';
import type {
  MovementProfileV2ReferenceProfile,
  ReferenceAgeBasis,
  ReferenceSexForPublishedComparisons,
  StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';

export type MovementProfileV2ReferenceDetailsInputStatus =
  | 'entered'
  | 'prefilled_confirmed'
  | 'skipped';

export interface MovementProfileV2ReferenceDetailsDraft {
  ageAtTest?: number;
  ageBasis: ReferenceAgeBasis;
  ageGroupLabel?: string;
  dateOfBirth?: string;
  referenceSex: ReferenceSexForPublishedComparisons;
  inputStatus: MovementProfileV2ReferenceDetailsInputStatus;
}

export function enteredMovementProfileV2ReferenceDetailsDraft(input: {
  exactAge?: number | null;
  ageBand?: AgeBand | null;
  dateOfBirth?: string | null;
  referenceSex: ReferenceSexForPublishedComparisons;
  prefilled?: boolean;
}): MovementProfileV2ReferenceDetailsDraft {
  const exactAge = validReferenceAge(input.exactAge) ? input.exactAge : undefined;
  const ageGroupLabel = input.ageBand ? ageBandLabel(input.ageBand) ?? undefined : undefined;
  const dateOfBirth = normalizeDateOfBirth(input.dateOfBirth);
  return {
    ...(exactAge !== undefined
      ? { ageAtTest: exactAge, ageBasis: 'exact_age_at_test' as const }
      : {
          ageBasis: input.ageBand ? ('legacy_age_band_representative' as const) : ('unknown' as const),
          ...(ageGroupLabel ? { ageGroupLabel } : {}),
        }),
    ...(dateOfBirth ? { dateOfBirth } : {}),
    referenceSex: input.referenceSex,
    inputStatus: input.prefilled ? 'prefilled_confirmed' : 'entered',
  };
}

export function skippedMovementProfileV2ReferenceDetailsDraft(): MovementProfileV2ReferenceDetailsDraft {
  return {
    ageBasis: 'unknown',
    referenceSex: 'unknown',
    inputStatus: 'skipped',
  };
}

export function referenceProfileFromMovementProfileV2Draft(
  draft: MovementProfileV2ReferenceDetailsDraft
): MovementProfileV2ReferenceProfile {
  return {
    ...(draft.ageAtTest !== undefined ? { ageAtTest: draft.ageAtTest } : {}),
    ageBasis: draft.ageBasis,
    ...(draft.ageGroupLabel ? { ageGroupLabel: draft.ageGroupLabel } : {}),
    referenceSex: draft.referenceSex,
  };
}

export function latestMovementProfileV2ReferenceDetailsDraft(
  history: readonly StoredCheckUp[] | null | undefined
): MovementProfileV2ReferenceDetailsDraft | null {
  const latest = latestOfficialMovementProfileV2Snapshot(history);
  return latest ? movementProfileV2ReferenceDetailsDraftFromSnapshot(latest.snapshot) : null;
}

export function movementProfileV2ReferenceDetailsDraftFromProfile(profile: {
  dateOfBirth?: string | null;
  exactAge?: number | null;
  ageBand?: AgeBand | null;
  referenceSex?: ReferenceSexForPublishedComparisons | null;
}, asOf: Date = new Date()): MovementProfileV2ReferenceDetailsDraft | null {
  const dateOfBirth = normalizeDateOfBirth(profile.dateOfBirth);
  const exactAge = ageFromDateOfBirth(dateOfBirth, asOf) ?? profile.exactAge;
  if (!validReferenceAge(exactAge)) return null;
  if (profile.referenceSex !== 'female' && profile.referenceSex !== 'male') return null;
  return enteredMovementProfileV2ReferenceDetailsDraft({
    exactAge,
    ageBand: profile.ageBand ?? null,
    dateOfBirth,
    referenceSex: profile.referenceSex,
    prefilled: true,
  });
}

export function movementProfileV2ReferenceDetailsDraftFromSnapshot(
  snapshot: StoredMovementProfileV2Snapshot
): MovementProfileV2ReferenceDetailsDraft {
  const profile = snapshot.referenceProfile;
  return {
    ...(profile.ageAtTest !== null ? { ageAtTest: profile.ageAtTest } : {}),
    ageBasis: profile.ageBasis,
    ...(profile.ageGroupLabel ? { ageGroupLabel: profile.ageGroupLabel } : {}),
    referenceSex: profile.referenceSex,
    inputStatus: 'prefilled_confirmed',
  };
}

export function referenceDetailsAgeDisplayLabel(input: {
  dateOfBirth?: string | null;
  exactAge?: number | null;
}): string {
  const dateOfBirthLabel = dateOfBirthInputLabel(input.dateOfBirth);
  if (dateOfBirthLabel) return dateOfBirthLabel;
  return validReferenceAge(input.exactAge) ? `Age ${input.exactAge}` : '';
}

function validReferenceAge(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 18 && value <= 120;
}
