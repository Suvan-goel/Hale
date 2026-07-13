import type { MovementProfileV2EvidenceStatus } from '../../checkup/protocolEvidence';
import type { BodySide } from '../../checkup/protocolSetup';
import type { OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import { deterministicFingerprint } from './fingerprint';
import type {
  BalanceTaskBand,
  NormalizedMovementProfileV2ReferenceProfile,
  PublishedAgeGroupBenchmarkResult,
  ReferenceClaimEligibility,
  ReferenceEngineDiagnostic,
  ReferenceMetadata,
} from './types';

export const BALANCE_TRIAL_CEILING_SECONDS = 45 as const;

export interface BalanceAgeGroupBenchmark {
  sourceAgeGroupId: string;
  minAge: number;
  maxAge: number;
  meanBestOfThreeSeconds: number;
  trialCeilingSeconds: typeof BALANCE_TRIAL_CEILING_SECONDS;
}

// Springer et al. 2007, Table 1, Total rows only:
// eyes-open best of 3 trials, mean seconds, 45 second trial ceiling.
export const SPRINGER_2007_BALANCE_BENCHMARKS: readonly BalanceAgeGroupBenchmark[] = [
  { sourceAgeGroupId: 'springer_18_39', minAge: 18, maxAge: 39, meanBestOfThreeSeconds: 44.7, trialCeilingSeconds: 45 },
  { sourceAgeGroupId: 'springer_40_49', minAge: 40, maxAge: 49, meanBestOfThreeSeconds: 41.9, trialCeilingSeconds: 45 },
  { sourceAgeGroupId: 'springer_50_59', minAge: 50, maxAge: 59, meanBestOfThreeSeconds: 41.2, trialCeilingSeconds: 45 },
  { sourceAgeGroupId: 'springer_60_69', minAge: 60, maxAge: 69, meanBestOfThreeSeconds: 32.1, trialCeilingSeconds: 45 },
  { sourceAgeGroupId: 'springer_70_79', minAge: 70, maxAge: 79, meanBestOfThreeSeconds: 21.5, trialCeilingSeconds: 45 },
  { sourceAgeGroupId: 'springer_80_99', minAge: 80, maxAge: 99, meanBestOfThreeSeconds: 9.4, trialCeilingSeconds: 45 },
] as const;

export const SPRINGER_2007_BALANCE_DATA_FINGERPRINT = deterministicFingerprint(
  'balance-source-data-v1',
  SPRINGER_2007_BALANCE_BENCHMARKS
);

export function balanceTaskBand(seconds: number): BalanceTaskBand | null {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > BALANCE_TRIAL_CEILING_SECONDS) return null;
  if (seconds === BALANCE_TRIAL_CEILING_SECONDS) return 'ceiling_complete';
  if (seconds >= 20) return 'building';
  if (seconds >= 5) return 'starting_point';
  return 'starting_point_low';
}

export function lookupSpringerBalanceBenchmark(
  profile: NormalizedMovementProfileV2ReferenceProfile
): BalanceAgeGroupBenchmark | null {
  if (profile.ageBasis === 'age_group_only') {
    return SPRINGER_2007_BALANCE_BENCHMARKS.find((row) => row.sourceAgeGroupId === profile.ageGroupLabel) ?? null;
  }
  if (!isExactAgeBasis(profile.ageBasis) || profile.ageAtTest === null) return null;
  const ageYear = Math.floor(profile.ageAtTest);
  return SPRINGER_2007_BALANCE_BENCHMARKS.find((row) => ageYear >= row.minAge && ageYear <= row.maxAge) ?? null;
}

export function interpretBalanceBenchmark({
  result,
  rawSeconds,
  protocolEvidence,
  profile,
  source: _source,
}: {
  result: OneLegBalanceV2Result | null;
  rawSeconds: number | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
  profile: NormalizedMovementProfileV2ReferenceProfile;
  source: ReferenceMetadata;
}): {
  claimEligibility: ReferenceClaimEligibility;
  eligibilityReasons: ReferenceClaimEligibility[];
  sourceBenchmark: PublishedAgeGroupBenchmarkResult | null;
  diagnostics: ReferenceEngineDiagnostic[];
  longitudinalComparableToPrior: boolean;
  selectedStandingLeg: BodySide | null;
} {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const selectedStandingLeg = result?.standingLeg ?? null;
  const longitudinalComparableToPrior = result?.setup?.changedFromPrior === true ? false : true;
  const base = baseEligibility(rawSeconds, protocolEvidence);
  if (base !== 'reference_eligible') {
    return {
      claimEligibility: base,
      eligibilityReasons: [base],
      sourceBenchmark: null,
      diagnostics,
      longitudinalComparableToPrior,
      selectedStandingLeg,
    };
  }

  const row = lookupSpringerBalanceBenchmark(profile);
  if (!row) {
    const reason = profile.ageBasis === 'unknown' ? 'raw_only_profile_incomplete' : 'raw_only_outside_reference_age';
    diagnostics.push({ code: 'balance_source_age_group_unavailable', severity: 'info', domain: 'balance' });
    return {
      claimEligibility: reason,
      eligibilityReasons: [reason],
      sourceBenchmark: null,
      diagnostics,
      longitudinalComparableToPrior,
      selectedStandingLeg,
    };
  }
  if (rawSeconds === null) {
    return {
      claimEligibility: 'invalid_measurement',
      eligibilityReasons: ['invalid_measurement'],
      sourceBenchmark: null,
      diagnostics,
      longitudinalComparableToPrior,
      selectedStandingLeg,
    };
  }
  const measuredSeconds = rawSeconds;

  return {
    claimEligibility: 'reference_eligible',
    eligibilityReasons: ['reference_eligible'],
    sourceBenchmark: {
      kind: 'published_age_group_benchmark',
      sourceId: 'springer_2007_unipedal_eyes_open',
      sourceAgeGroupId: row.sourceAgeGroupId,
      meanBestOfThreeSeconds: row.meanBestOfThreeSeconds,
      measuredSeconds,
      trialCeilingSeconds: BALANCE_TRIAL_CEILING_SECONDS,
    },
    diagnostics,
    longitudinalComparableToPrior,
    selectedStandingLeg,
  };
}

export function validateBalanceBenchmarkTable(
  rows: readonly BalanceAgeGroupBenchmark[] = SPRINGER_2007_BALANCE_BENCHMARKS
): ReferenceEngineDiagnostic[] {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const ids = new Set<string>();
  let previousMax = 17;
  for (const row of rows) {
    if (ids.has(row.sourceAgeGroupId)) {
      diagnostics.push({ code: 'balance_duplicate_age_group', severity: 'error', domain: 'balance' });
    }
    ids.add(row.sourceAgeGroupId);
    if (
      !Number.isInteger(row.minAge) ||
      !Number.isInteger(row.maxAge) ||
      row.minAge > row.maxAge ||
      row.minAge !== previousMax + 1
    ) {
      diagnostics.push({ code: 'balance_age_groups_not_contiguous', severity: 'error', domain: 'balance' });
    }
    if (
      !Number.isFinite(row.meanBestOfThreeSeconds) ||
      row.meanBestOfThreeSeconds < 0 ||
      row.meanBestOfThreeSeconds > BALANCE_TRIAL_CEILING_SECONDS ||
      row.trialCeilingSeconds !== BALANCE_TRIAL_CEILING_SECONDS
    ) {
      diagnostics.push({ code: 'balance_source_value_invalid', severity: 'error', domain: 'balance' });
    }
    previousMax = row.maxAge;
  }
  return diagnostics;
}

function baseEligibility(
  rawSeconds: number | null,
  protocolEvidence: MovementProfileV2EvidenceStatus | null
): ReferenceClaimEligibility {
  if (rawSeconds === null) return 'invalid_measurement';
  if (protocolEvidence === 'reference_protocol_complete') return 'reference_eligible';
  if (protocolEvidence === 'raw_only_tracking_uncertain') return 'raw_only_tracking_uncertain';
  if (protocolEvidence === 'raw_only_setup_uncertain') return 'raw_only_setup_uncertain';
  if (protocolEvidence === 'raw_only_protocol_incomplete') return 'raw_only_protocol_incomplete';
  if (protocolEvidence === 'raw_only_pain_limited') return 'raw_only_pain_limited';
  return 'invalid_measurement';
}

function isExactAgeBasis(ageBasis: NormalizedMovementProfileV2ReferenceProfile['ageBasis']): boolean {
  return ageBasis === 'exact_age_at_test' || ageBasis === 'birth_year_month_derived';
}
