import type { MovementProfileV2EvidenceStatus } from '../../checkup/protocolEvidence';
import type { BodySide } from '../../checkup/protocolSetup';
import type { ActiveShoulderReachV2Result } from '../../movements/activeShoulderReachV2';
import { deterministicFingerprint } from './fingerprint';
import type {
  NormalizedMovementProfileV2ReferenceProfile,
  ReferenceClaimEligibility,
  ReferenceEngineDiagnostic,
  ReferenceMetadata,
  ReferenceSexForPublishedComparisons,
  ShoulderIqrCategory,
  ShoulderIqrReferenceResult,
} from './types';

export interface GillShoulderFlexionIqrRow {
  sourceAgeGroupId: string;
  minAge: number;
  maxAge: number;
  referenceSex: 'female' | 'male';
  side: BodySide;
  q1Degrees: number;
  medianDegrees: number;
  q3Degrees: number;
}

const AGE_GROUPS = [
  { sourceAgeGroupId: 'gill_20_24', minAge: 20, maxAge: 24 },
  { sourceAgeGroupId: 'gill_25_29', minAge: 25, maxAge: 29 },
  { sourceAgeGroupId: 'gill_30_34', minAge: 30, maxAge: 34 },
  { sourceAgeGroupId: 'gill_35_39', minAge: 35, maxAge: 39 },
  { sourceAgeGroupId: 'gill_40_44', minAge: 40, maxAge: 44 },
  { sourceAgeGroupId: 'gill_45_49', minAge: 45, maxAge: 49 },
  { sourceAgeGroupId: 'gill_50_54', minAge: 50, maxAge: 54 },
  { sourceAgeGroupId: 'gill_55_59', minAge: 55, maxAge: 59 },
  { sourceAgeGroupId: 'gill_60_64', minAge: 60, maxAge: 64 },
  { sourceAgeGroupId: 'gill_65_69', minAge: 65, maxAge: 69 },
  { sourceAgeGroupId: 'gill_70_74', minAge: 70, maxAge: 74 },
  { sourceAgeGroupId: 'gill_75_79', minAge: 75, maxAge: 79 },
  { sourceAgeGroupId: 'gill_80_84', minAge: 80, maxAge: 84 },
  { sourceAgeGroupId: 'gill_85_plus', minAge: 85, maxAge: 91 },
] as const;

type GillCompactRow = readonly [
  ageGroupIndex: number,
  sex: 'male' | 'female',
  leftQ1: number,
  leftMedian: number,
  leftQ3: number,
  rightQ1: number,
  rightMedian: number,
  rightQ3: number,
];

// Gill et al. 2020, Table 1, active shoulder flexion only.
// Each compact row is: age group, sex, left Q1/median/Q3, right Q1/median/Q3.
const GILL_COMPACT_ROWS: readonly GillCompactRow[] = [
  [0, 'male', 160, 174, 178, 170, 179, 180],
  [0, 'female', 160, 169, 174, 160, 165.8, 174],
  [1, 'male', 158, 162, 175, 160, 164, 174],
  [1, 'female', 152, 166, 180, 155, 170, 180],
  [2, 'male', 160, 170, 176, 160, 170, 177],
  [2, 'female', 156, 162, 172, 156, 166.3, 173],
  [3, 'male', 160, 166, 176, 160, 168, 176],
  [3, 'female', 158, 168, 180, 158, 168, 180],
  [4, 'male', 152, 160, 170, 156, 166, 174],
  [4, 'female', 150, 160, 170, 156, 164, 176],
  [5, 'male', 155, 162, 174, 160, 168, 176],
  [5, 'female', 150, 160, 166, 150, 160, 170],
  [6, 'male', 154, 167.1, 178, 160, 170, 176],
  [6, 'female', 150, 160, 168, 150, 160, 170],
  [7, 'male', 149, 160, 170, 150, 160, 171],
  [7, 'female', 144, 154, 168, 149, 160, 170],
  [8, 'male', 144, 159.5, 169, 150, 160, 170],
  [8, 'female', 134, 150, 160, 140, 150, 163],
  [9, 'male', 140, 151.8, 162, 144, 156.1, 162],
  [9, 'female', 143, 153.9, 160, 144, 152, 162],
  [10, 'male', 130, 150, 160, 130, 147.5, 161],
  [10, 'female', 136, 150, 160, 131, 150.8, 162],
  [11, 'male', 133, 142, 158, 130, 145.1, 160],
  [11, 'female', 130, 141.8, 153, 136, 145, 152],
  [12, 'male', 123, 140, 151, 125, 142.4, 156],
  [12, 'female', 119, 132, 149, 120, 140, 150],
  [13, 'male', 112, 136.1, 150, 111, 123.7, 151],
  [13, 'female', 100, 138, 154, 80, 130, 160],
] as const;

export const GILL_2020_SHOULDER_FLEXION_IQR_ROWS: readonly GillShoulderFlexionIqrRow[] =
  GILL_COMPACT_ROWS.flatMap(([ageGroupIndex, referenceSex, leftQ1, leftMedian, leftQ3, rightQ1, rightMedian, rightQ3]) => {
    const group = AGE_GROUPS[ageGroupIndex];
    return [
      {
        ...group,
        referenceSex,
        side: 'left' as const,
        q1Degrees: leftQ1,
        medianDegrees: leftMedian,
        q3Degrees: leftQ3,
      },
      {
        ...group,
        referenceSex,
        side: 'right' as const,
        q1Degrees: rightQ1,
        medianDegrees: rightMedian,
        q3Degrees: rightQ3,
      },
    ];
  });

export const GILL_2020_SHOULDER_DATA_FINGERPRINT = deterministicFingerprint(
  'shoulder-source-data-v1',
  GILL_2020_SHOULDER_FLEXION_IQR_ROWS
);

export function lookupGillShoulderFlexionIqr({
  profile,
  referenceSex,
  side,
}: {
  profile: NormalizedMovementProfileV2ReferenceProfile;
  referenceSex: ReferenceSexForPublishedComparisons;
  side: BodySide;
}): GillShoulderFlexionIqrRow | null {
  if (referenceSex !== 'female' && referenceSex !== 'male') return null;
  let sourceAgeGroupId: string | null = null;
  if (profile.ageBasis === 'age_group_only') {
    sourceAgeGroupId = profile.ageGroupLabel;
  } else if (isExactAgeBasis(profile.ageBasis) && profile.ageAtTest !== null) {
    const ageYear = Math.floor(profile.ageAtTest);
    sourceAgeGroupId =
      AGE_GROUPS.find((row) => ageYear >= row.minAge && ageYear <= row.maxAge)?.sourceAgeGroupId ?? null;
  }
  if (!sourceAgeGroupId) return null;
  return (
    GILL_2020_SHOULDER_FLEXION_IQR_ROWS.find(
      (row) => row.sourceAgeGroupId === sourceAgeGroupId && row.referenceSex === referenceSex && row.side === side
    ) ?? null
  );
}

export function shoulderIqrCategory(measuredDegrees: number, row: GillShoulderFlexionIqrRow): ShoulderIqrCategory {
  if (measuredDegrees < row.q1Degrees) return 'below_published_middle_range';
  if (measuredDegrees > row.q3Degrees) return 'above_published_middle_range';
  return 'within_published_middle_range';
}

export function interpretShoulderIqr({
  result,
  rawDegrees,
  protocolEvidence,
  profile,
  source: _source,
}: {
  result: ActiveShoulderReachV2Result | null;
  rawDegrees: number | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
  profile: NormalizedMovementProfileV2ReferenceProfile;
  source: ReferenceMetadata;
}): {
  claimEligibility: ReferenceClaimEligibility;
  eligibilityReasons: ReferenceClaimEligibility[];
  iqr: ShoulderIqrReferenceResult | null;
  diagnostics: ReferenceEngineDiagnostic[];
  longitudinalComparableToPrior: boolean;
} {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const longitudinalComparableToPrior = result?.setup?.changedFromPrior === true ? false : true;
  const side = result?.selectedSide ?? null;
  const base = baseEligibility(rawDegrees, protocolEvidence, result?.painLimited === true);
  if (base !== 'reference_eligible') {
    return {
      claimEligibility: base,
      eligibilityReasons: [base],
      iqr: null,
      diagnostics,
      longitudinalComparableToPrior,
    };
  }
  if (!side) {
    diagnostics.push({ code: 'shoulder_selected_side_missing', severity: 'error', domain: 'shoulder' });
    return {
      claimEligibility: 'invalid_measurement',
      eligibilityReasons: ['invalid_measurement'],
      iqr: null,
      diagnostics,
      longitudinalComparableToPrior,
    };
  }
  if (profile.referenceSex !== 'female' && profile.referenceSex !== 'male') {
    return {
      claimEligibility: 'raw_only_profile_incomplete',
      eligibilityReasons: ['raw_only_profile_incomplete'],
      iqr: null,
      diagnostics,
      longitudinalComparableToPrior,
    };
  }
  const row = lookupGillShoulderFlexionIqr({ profile, referenceSex: profile.referenceSex, side });
  if (!row) {
    const reason = profile.ageBasis === 'unknown' ? 'raw_only_profile_incomplete' : 'raw_only_outside_reference_age';
    diagnostics.push({ code: 'shoulder_source_row_unavailable', severity: 'info', domain: 'shoulder' });
    return {
      claimEligibility: reason,
      eligibilityReasons: [reason],
      iqr: null,
      diagnostics,
      longitudinalComparableToPrior,
    };
  }
  if (rawDegrees === null) {
    return {
      claimEligibility: 'invalid_measurement',
      eligibilityReasons: ['invalid_measurement'],
      iqr: null,
      diagnostics,
      longitudinalComparableToPrior,
    };
  }
  const measuredDegrees = rawDegrees;

  return {
    claimEligibility: 'reference_eligible',
    eligibilityReasons: ['reference_eligible'],
    iqr: {
      kind: 'published_iqr_category',
      sourceId: 'gill_2020_active_shoulder_flexion',
      sourceAgeGroupId: row.sourceAgeGroupId,
      referenceSex: row.referenceSex,
      side,
      q1Degrees: row.q1Degrees,
      medianDegrees: row.medianDegrees,
      q3Degrees: row.q3Degrees,
      measuredDegrees,
      category: shoulderIqrCategory(measuredDegrees, row),
    },
    diagnostics,
    longitudinalComparableToPrior,
  };
}

export function validateGillShoulderTable(
  rows: readonly GillShoulderFlexionIqrRow[] = GILL_2020_SHOULDER_FLEXION_IQR_ROWS
): ReferenceEngineDiagnostic[] {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const keys = new Set<string>();
  for (const row of rows) {
    const key = `${row.sourceAgeGroupId}:${row.referenceSex}:${row.side}`;
    if (keys.has(key)) diagnostics.push({ code: 'shoulder_duplicate_age_sex_side_row', severity: 'error', domain: 'shoulder' });
    keys.add(key);
    if (
      !Number.isFinite(row.q1Degrees) ||
      !Number.isFinite(row.medianDegrees) ||
      !Number.isFinite(row.q3Degrees) ||
      row.q1Degrees < 0 ||
      row.q3Degrees > 180 ||
      row.q1Degrees > row.medianDegrees ||
      row.medianDegrees > row.q3Degrees
    ) {
      diagnostics.push({ code: 'shoulder_source_iqr_invalid', severity: 'error', domain: 'shoulder' });
    }
  }
  for (const group of AGE_GROUPS) {
    if (group.minAge > group.maxAge) diagnostics.push({ code: 'shoulder_age_group_invalid', severity: 'error', domain: 'shoulder' });
    for (const referenceSex of ['female', 'male'] as const) {
      for (const side of ['left', 'right'] as const) {
        if (!keys.has(`${group.sourceAgeGroupId}:${referenceSex}:${side}`)) {
          diagnostics.push({ code: 'shoulder_missing_age_sex_side_row', severity: 'error', domain: 'shoulder' });
        }
      }
    }
  }
  return diagnostics;
}

function baseEligibility(
  rawDegrees: number | null,
  protocolEvidence: MovementProfileV2EvidenceStatus | null,
  painLimited: boolean
): ReferenceClaimEligibility {
  if (rawDegrees === null) return 'invalid_measurement';
  if (painLimited || protocolEvidence === 'raw_only_pain_limited') return 'raw_only_pain_limited';
  if (protocolEvidence === 'reference_protocol_complete') return 'reference_eligible';
  if (protocolEvidence === 'raw_only_tracking_uncertain') return 'raw_only_tracking_uncertain';
  if (protocolEvidence === 'raw_only_setup_uncertain') return 'raw_only_setup_uncertain';
  if (protocolEvidence === 'raw_only_protocol_incomplete') return 'raw_only_protocol_incomplete';
  return 'invalid_measurement';
}

function isExactAgeBasis(ageBasis: NormalizedMovementProfileV2ReferenceProfile['ageBasis']): boolean {
  return ageBasis === 'exact_age_at_test' || ageBasis === 'birth_year_month_derived';
}
