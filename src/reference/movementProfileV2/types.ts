import type { MovementProfileV2EvidenceStatus } from '../../checkup/protocolEvidence';
import type { CheckUp } from '../../checkup/types';
import type { BodySide } from '../../checkup/protocolSetup';
import type {
  ACTIVE_SHOULDER_REACH_V2_ID,
  ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import type { CHAIR_RISE_V2_ID, ChairRiseV2Result } from '../../movements/chairRiseV2';
import type { ONE_LEG_BALANCE_V2_ID, OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import type { BALANCE_EYES_OPEN_V2_ID, BalanceEyesOpenV2Result } from '../../movements/balanceEyesOpenV2';

export const MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_SOURCE_SET_ID = 'movement_profile_v2_reference_sources_v1' as const;

export type ReferenceAgeBasis =
  | 'exact_age_at_test'
  | 'birth_year_month_derived'
  | 'age_group_only'
  | 'legacy_age_band_representative'
  | 'unknown';

export type ReferenceSexForPublishedComparisons =
  | 'female'
  | 'male'
  | 'prefer_not_to_say'
  | 'unknown';

export interface MovementProfileV2ReferenceProfile {
  ageAtTest?: number;
  ageBasis: ReferenceAgeBasis;
  ageGroupLabel?: string;
  referenceSex: ReferenceSexForPublishedComparisons;
}

export interface NormalizedMovementProfileV2ReferenceProfile {
  ageAtTest: number | null;
  ageBasis: ReferenceAgeBasis;
  ageGroupLabel: string | null;
  referenceSex: ReferenceSexForPublishedComparisons;
  profileDiagnostics: ReferenceEngineDiagnostic[];
}

export interface MovementProfileV2InterpretationInput {
  checkUp: CheckUp;
  referenceProfile: MovementProfileV2ReferenceProfile;
}

export type ReferenceResultKind =
  | 'raw_only'
  | 'percentile_range'
  | 'pearl_task_band'
  | 'published_age_group_benchmark'
  | 'published_iqr_category';

export type ReferenceClaimEligibility =
  | 'reference_eligible'
  | 'raw_only_setup_uncertain'
  | 'raw_only_protocol_incomplete'
  | 'raw_only_tracking_uncertain'
  | 'raw_only_reference_unavailable'
  | 'raw_only_profile_incomplete'
  | 'raw_only_pain_limited'
  | 'raw_only_outside_reference_age'
  | 'raw_only_source_transform_unapproved'
  | 'invalid_measurement';

export type RawMetric =
  | {
      metricId: 'chair_rises_30s';
      value: number;
      unit: 'repetitions';
    }
  | {
      metricId: 'one_leg_balance_best';
      value: number;
      unit: 'seconds';
      ceiling: 45;
    }
  | {
      metricId: 'balance_eyes_open_total';
      value: number;
      unit: 'seconds';
      completedStageCount: number;
      totalCapSeconds: number;
    }
  | {
      metricId: 'active_shoulder_reach';
      value: number;
      unit: 'degrees';
      side: BodySide;
    };

export type ReferenceSourceId =
  | 'warden_2022_30s_sts'
  | 'springer_2007_unipedal_eyes_open'
  | 'gill_2020_active_shoulder_flexion';

export interface ReferenceSourceDefinition {
  sourceId: ReferenceSourceId;
  sourceVersion: number;
  title: string;
  authors: string;
  year: number;
  doi: string;
  protocolIds: readonly string[];
  populationSummary: string;
  statisticKind: string;
  publicUseStatus:
    | 'approved_numeric_table'
    | 'approved_benchmark_only'
    | 'approved_calculator_transform';
  sourceDataFingerprint: string;
  sourceFingerprint: string;
}

export type ReferenceTransformationId =
  | 'warden_2022_30s_sts_percentile_v1'
  | 'balance_task_band_v1'
  | 'balance_age_group_benchmark_v1'
  | 'shoulder_iqr_category_v1';

export interface ReferenceTransformationDefinition {
  transformationId: ReferenceTransformationId;
  transformationVersion: number;
  sourceIds: readonly ReferenceSourceId[];
  transformationFingerprint: string;
  enabled: boolean;
  reasonIfDisabled?: string;
  productCreated?: boolean;
  approvalId?: string;
}

export type ReferenceEngineDiagnosticSeverity = 'info' | 'warning' | 'error';

export interface ReferenceEngineDiagnostic {
  code: string;
  severity: ReferenceEngineDiagnosticSeverity;
  domain?: MovementProfileV2DomainId | 'engine' | 'profile';
}

export interface MovementProfileV2RawCompleteness {
  isMovementProfileV2: boolean;
  referenceComplete: boolean;
  missingHeadlineMovementIds: readonly string[];
  evidenceStatusByMovementId: Partial<Record<MovementProfileV2HeadlineMovementId, MovementProfileV2EvidenceStatus>>;
}

export type MovementProfileV2DomainId = 'chair' | 'balance' | 'shoulder';

export type MovementProfileV2HeadlineMovementId =
  | typeof CHAIR_RISE_V2_ID
  | typeof ONE_LEG_BALANCE_V2_ID
  | typeof BALANCE_EYES_OPEN_V2_ID
  | typeof ACTIVE_SHOULDER_REACH_V2_ID;

export interface ReferenceMetadata {
  sourceId: ReferenceSourceId;
  sourceVersion: number;
  sourceFingerprint: string;
}

export interface TransformationMetadata {
  transformationId: ReferenceTransformationId;
  transformationVersion: number;
  transformationFingerprint: string;
  enabled: boolean;
  reasonIfDisabled?: string;
  productCreated?: boolean;
}

export type ChairPercentileRange =
  | { kind: 'below_10' }
  | { kind: 'above_90' }
  | { kind: 'range'; low: number; high: number };

export type BalanceTaskBand =
  | 'ceiling_complete'
  | 'building'
  | 'starting_point'
  | 'starting_point_low';

export interface PublishedAgeGroupBenchmarkResult {
  kind: 'published_age_group_benchmark';
  sourceId: 'springer_2007_unipedal_eyes_open';
  sourceAgeGroupId: string;
  meanBestOfThreeSeconds: number;
  measuredSeconds: number;
  trialCeilingSeconds: 45;
}

export type ShoulderIqrCategory =
  | 'below_published_middle_range'
  | 'within_published_middle_range'
  | 'above_published_middle_range';

export interface ShoulderIqrReferenceResult {
  kind: 'published_iqr_category';
  sourceId: 'gill_2020_active_shoulder_flexion';
  sourceAgeGroupId: string;
  referenceSex: 'female' | 'male';
  side: BodySide;
  q1Degrees: number;
  medianDegrees: number;
  q3Degrees: number;
  measuredDegrees: number;
  category: ShoulderIqrCategory;
}

export interface ChairInterpretation {
  movementId: typeof CHAIR_RISE_V2_ID;
  resultKind: ReferenceResultKind;
  rawMetric: Extract<RawMetric, { metricId: 'chair_rises_30s' }> | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
  claimEligibility: ReferenceClaimEligibility;
  eligibilityReasons: readonly ReferenceClaimEligibility[];
  source: ReferenceMetadata;
  transformation: TransformationMetadata;
  percentileRange: ChairPercentileRange | null;
  rawInvalidReasons: readonly string[];
}

export interface BalanceInterpretation {
  movementId: typeof ONE_LEG_BALANCE_V2_ID | typeof BALANCE_EYES_OPEN_V2_ID;
  resultKind: ReferenceResultKind;
  rawMetric: Extract<RawMetric, { metricId: 'one_leg_balance_best' | 'balance_eyes_open_total' }> | null;
  taskBand: BalanceTaskBand | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
  claimEligibility: ReferenceClaimEligibility;
  eligibilityReasons: readonly ReferenceClaimEligibility[];
  source: ReferenceMetadata;
  sourceBenchmark: PublishedAgeGroupBenchmarkResult | null;
  reachedCeiling: boolean;
  selectedStandingLeg: BodySide | null;
  longitudinalComparableToPrior: boolean;
  rawInvalidReasons: readonly string[];
}

export interface ShoulderInterpretation {
  movementId: typeof ACTIVE_SHOULDER_REACH_V2_ID;
  resultKind: ReferenceResultKind;
  rawMetric: Extract<RawMetric, { metricId: 'active_shoulder_reach' }> | null;
  selectedSide: BodySide | null;
  protocolEvidence: MovementProfileV2EvidenceStatus | null;
  claimEligibility: ReferenceClaimEligibility;
  eligibilityReasons: readonly ReferenceClaimEligibility[];
  source: ReferenceMetadata;
  iqr: ShoulderIqrReferenceResult | null;
  painLimited: boolean;
  longitudinalComparableToPrior: boolean;
  rawInvalidReasons: readonly string[];
}

export interface MovementProfileV2Interpretation {
  engineSchemaVersion: typeof MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION;
  engineVersion: typeof MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION;
  protocolPolicyId: 'movement_profile_v2' | null;
  protocolPolicyVersion: number | null;
  protocolSupported: boolean;
  unsupportedReason: 'unsupported_checkup_protocol' | null;
  sourceSetId: typeof MOVEMENT_PROFILE_V2_SOURCE_SET_ID;
  sourceSetFingerprint: string;
  rawCompleteness: MovementProfileV2RawCompleteness;
  chair: ChairInterpretation;
  balance: BalanceInterpretation;
  shoulder: ShoulderInterpretation;
  diagnostics: readonly ReferenceEngineDiagnostic[];
}

export interface ApprovedChairPercentileTransform {
  sourceId: 'warden_2022_30s_sts';
  sourceFingerprint: string;
  transformationId: 'warden_2022_30s_sts_percentile_v1';
  transformationFingerprint: string;
  approvalId: string;
  percentileFor(input: {
    repetitions: number;
    ageAtTest: number;
    referenceSex: 'female' | 'male';
  }): number | null;
}

export interface MovementProfileV2ReferenceEngineDependencies {
  chairPercentileTransform?: ApprovedChairPercentileTransform | null;
  sources?: readonly ReferenceSourceDefinition[];
  transformations?: readonly ReferenceTransformationDefinition[];
}

export interface ExtractedV2Results {
  chair: ChairRiseV2Result | null;
  balance: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null;
  shoulder: ActiveShoulderReachV2Result | null;
}
