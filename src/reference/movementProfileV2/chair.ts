import type { MovementProfileV2EvidenceStatus } from '../../checkup/protocolEvidence';
import type { ChairRiseV2Result } from '../../movements/chairRiseV2';
import type {
  ApprovedChairPercentileTransform,
  ChairPercentileRange,
  ReferenceClaimEligibility,
  ReferenceEngineDiagnostic,
  ReferenceMetadata,
  ReferenceTransformationDefinition,
} from './types';
import { hasBinaryReferenceSex, hasExactReferenceAge } from './referenceProfile';
import type { NormalizedMovementProfileV2ReferenceProfile } from './types';
import { WARDEN_CHAIR_TRANSFORMATION_ID, wardenChairAgeRangeFor } from './wardenChairTransform';

export function buildChairPercentileRange({
  repetitions,
  ageAtTest,
  referenceSex,
  provider,
}: {
  repetitions: number;
  ageAtTest: number;
  referenceSex: 'female' | 'male';
  provider: ApprovedChairPercentileTransform;
}): ChairPercentileRange | null {
  const percentiles: number[] = [];
  for (const repetitionInput of [repetitions - 1, repetitions, repetitions + 1]) {
    if (repetitionInput <= 0) continue;
    const percentile = provider.percentileFor({
      repetitions: repetitionInput,
      ageAtTest,
      referenceSex,
    });
    if (typeof percentile === 'number' && Number.isFinite(percentile) && percentile >= 0 && percentile <= 100) {
      percentiles.push(percentile);
    }
  }
  if (percentiles.length === 0) return null;
  const minPercentile = Math.min(...percentiles);
  const maxPercentile = Math.max(...percentiles);
  if (maxPercentile < 10) return { kind: 'below_10' };
  if (minPercentile > 90) return { kind: 'above_90' };

  let low = clampPercentile(Math.floor(minPercentile / 10) * 10);
  let high = clampPercentile(Math.ceil(maxPercentile / 10) * 10);
  if (high - low < 20) {
    const needed = 20 - (high - low);
    const lowerExpansion = Math.ceil(needed / 2 / 10) * 10;
    low = clampPercentile(low - lowerExpansion);
    high = clampPercentile(Math.max(high, low + 20));
    if (high - low < 20) low = clampPercentile(high - 20);
  }
  return { kind: 'range', low, high };
}

export function validateApprovedChairTransform({
  provider,
  source,
  transformation,
}: {
  provider: ApprovedChairPercentileTransform | null | undefined;
  source: ReferenceMetadata;
  transformation: ReferenceTransformationDefinition;
}): ReferenceEngineDiagnostic[] {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  if (!provider) {
    diagnostics.push({ code: 'chair_percentile_transform_missing', severity: 'info', domain: 'chair' });
    return diagnostics;
  }
  if (!transformation.enabled || !transformation.approvalId) {
    diagnostics.push({ code: 'chair_percentile_transform_unapproved', severity: 'info', domain: 'chair' });
  }
  if (provider.sourceId !== 'warden_2022_30s_sts' || provider.sourceId !== source.sourceId) {
    diagnostics.push({ code: 'chair_percentile_provider_source_mismatch', severity: 'error', domain: 'chair' });
  }
  if (provider.sourceFingerprint !== source.sourceFingerprint) {
    diagnostics.push({ code: 'chair_percentile_provider_source_fingerprint_mismatch', severity: 'error', domain: 'chair' });
  }
  if (provider.transformationId !== WARDEN_CHAIR_TRANSFORMATION_ID) {
    diagnostics.push({ code: 'chair_percentile_provider_transformation_mismatch', severity: 'error', domain: 'chair' });
  }
  if (provider.transformationFingerprint !== transformation.transformationFingerprint) {
    diagnostics.push({ code: 'chair_percentile_provider_transformation_fingerprint_mismatch', severity: 'error', domain: 'chair' });
  }
  if (!transformation.approvalId || provider.approvalId !== transformation.approvalId) {
    diagnostics.push({ code: 'chair_percentile_provider_approval_mismatch', severity: 'error', domain: 'chair' });
  }
  return diagnostics;
}

export function interpretChairPercentile({
  result,
  repetitions,
  protocolEvidence,
  profile,
  source,
  transformation,
  provider,
}: {
  result: ChairRiseV2Result | null;
  repetitions: number | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
  profile: NormalizedMovementProfileV2ReferenceProfile;
  source: ReferenceMetadata;
  transformation: ReferenceTransformationDefinition;
  provider: ApprovedChairPercentileTransform | null | undefined;
}): {
  claimEligibility: ReferenceClaimEligibility;
  eligibilityReasons: ReferenceClaimEligibility[];
  percentileRange: ChairPercentileRange | null;
  diagnostics: ReferenceEngineDiagnostic[];
} {
  const base = baseEligibility({ result, repetitions, protocolEvidence });
  if (base !== 'reference_eligible') {
    return { claimEligibility: base, eligibilityReasons: [base], percentileRange: null, diagnostics: [] };
  }
  if (repetitions === null) {
    return {
      claimEligibility: 'invalid_measurement',
      eligibilityReasons: ['invalid_measurement'],
      percentileRange: null,
      diagnostics: [],
    };
  }
  if (!hasExactReferenceAge(profile) || !hasBinaryReferenceSex(profile)) {
    return {
      claimEligibility: 'raw_only_profile_incomplete',
      eligibilityReasons: ['raw_only_profile_incomplete'],
      percentileRange: null,
      diagnostics: [],
    };
  }
  const ageAtTest = profile.ageAtTest;
  const ageRange = wardenChairAgeRangeFor(profile.referenceSex);
  if (ageAtTest < ageRange.min || ageAtTest > ageRange.max) {
    return {
      claimEligibility: 'raw_only_outside_reference_age',
      eligibilityReasons: ['raw_only_outside_reference_age'],
      percentileRange: null,
      diagnostics: [{ code: 'chair_reference_age_outside_warden_range', severity: 'info', domain: 'chair' }],
    };
  }
  const providerDiagnostics = validateApprovedChairTransform({ provider, source, transformation });
  if (providerDiagnostics.some((diagnostic) => diagnostic.severity === 'error') || !provider || !transformation.enabled) {
    return {
      claimEligibility: 'raw_only_source_transform_unapproved',
      eligibilityReasons: ['raw_only_source_transform_unapproved'],
      percentileRange: null,
      diagnostics: providerDiagnostics,
    };
  }

  const percentileRange = buildChairPercentileRange({
    repetitions,
    ageAtTest,
    referenceSex: profile.referenceSex,
    provider,
  });
  if (!percentileRange) {
    return {
      claimEligibility: 'raw_only_reference_unavailable',
      eligibilityReasons: ['raw_only_reference_unavailable'],
      percentileRange: null,
      diagnostics: [{ code: 'chair_percentile_provider_returned_no_valid_values', severity: 'warning', domain: 'chair' }],
    };
  }
  return {
    claimEligibility: 'reference_eligible',
    eligibilityReasons: ['reference_eligible'],
    percentileRange,
    diagnostics: providerDiagnostics,
  };
}

function baseEligibility({
  result,
  repetitions,
  protocolEvidence,
}: {
  result: ChairRiseV2Result | null;
  repetitions: number | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
}): ReferenceClaimEligibility {
  if (repetitions === null || !result) return 'invalid_measurement';
  if (protocolEvidence === 'raw_only_tracking_uncertain') return 'raw_only_tracking_uncertain';
  if (protocolEvidence === 'raw_only_setup_uncertain') return 'raw_only_setup_uncertain';
  if (protocolEvidence === 'raw_only_protocol_incomplete') return 'raw_only_protocol_incomplete';
  if (protocolEvidence !== 'reference_protocol_complete') return 'invalid_measurement';
  if (!result.practiceRepCompleted) return 'raw_only_protocol_incomplete';
  if (result.pushOffDetected) return 'raw_only_protocol_incomplete';
  if (result.interruptions > 0) return 'raw_only_tracking_uncertain';
  return 'reference_eligible';
}

function clampPercentile(value: number): number {
  return Math.max(0, Math.min(100, value));
}
