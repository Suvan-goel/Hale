import {
  evaluateMovementProfileV2Completeness,
} from '../../checkup/movementProfileV2';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  normalizeCheckUpRecordProtocolPolicy,
} from '../../checkup/protocolPolicy';
import type { MovementProfileV2EvidenceStatus } from '../../checkup/protocolEvidence';
import type { BodySide } from '../../checkup/protocolSetup';
import type { CheckUp, CheckUpItem } from '../../checkup/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { BALANCE_EYES_OPEN_V2_ID, type BalanceEyesOpenV2Result } from '../../movements/balanceEyesOpenV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import { balanceTaskBand, interpretBalanceBenchmark } from './balance';
import { interpretChairPercentile } from './chair';
import { deterministicFingerprint } from './fingerprint';
import { normalizeMovementProfileV2ReferenceProfile } from './referenceProfile';
import { REFERENCE_SOURCES, sourceMetadata, validateReferenceSources } from './sources';
import { interpretShoulderIqr } from './shoulder';
import {
  REFERENCE_TRANSFORMATIONS,
  transformationMetadata,
  validateReferenceTransformations,
} from './transformations';
import type {
  BalanceInterpretation,
  ChairInterpretation,
  ExtractedV2Results,
  MovementProfileV2Interpretation,
  MovementProfileV2InterpretationInput,
  MovementProfileV2RawCompleteness,
  MovementProfileV2ReferenceEngineDependencies,
  RawMetric,
  ReferenceEngineDiagnostic,
  ReferenceMetadata,
  ReferenceSourceDefinition,
  ReferenceTransformationDefinition,
  ShoulderInterpretation,
  TransformationMetadata,
} from './types';
import {
  MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION,
  MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION,
  MOVEMENT_PROFILE_V2_SOURCE_SET_ID,
} from './types';

const MISSING_SOURCE: ReferenceMetadata = {
  sourceId: 'warden_2022_30s_sts',
  sourceVersion: 0,
  sourceFingerprint: 'missing-source',
};

const MISSING_TRANSFORMATION: TransformationMetadata = {
  transformationId: 'chair_percentile_range_v1_pending_transform',
  transformationVersion: 0,
  transformationFingerprint: 'missing-transformation',
  enabled: false,
  reasonIfDisabled: 'missing_transformation',
};

export function interpretMovementProfileV2(
  input: MovementProfileV2InterpretationInput,
  dependencies: MovementProfileV2ReferenceEngineDependencies = {}
): MovementProfileV2Interpretation {
  const sources = dependencies.sources ?? REFERENCE_SOURCES;
  const transformations = dependencies.transformations ?? REFERENCE_TRANSFORMATIONS;
  const sourceSetFingerprint = movementProfileV2SourceSetFingerprint(sources, transformations);
  const sourceDiagnostics = validateReferenceSources(sources);
  const transformationDiagnostics = validateReferenceTransformations(transformations);
  const integrityDiagnostics = [...sourceDiagnostics, ...transformationDiagnostics];
  const integrityOk = !integrityDiagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const normalizedProfile = normalizeMovementProfileV2ReferenceProfile(input?.referenceProfile);
  const checkUp = isCheckUpLike(input?.checkUp) ? input.checkUp : null;
  const protocol = checkUp ? normalizeCheckUpRecordProtocolPolicy(checkUp) : null;
  const protocolSupported =
    !!protocol?.supported && protocol.policy.id === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
  const rawCompleteness = checkUp ? evaluateMovementProfileV2Completeness(checkUp) : emptyRawCompleteness();
  const extracted = protocolSupported && checkUp ? extractV2Results(checkUp) : { chair: null, balance: null, shoulder: null };

  const chair = interpretChair({
    result: extracted.chair,
    source: sourceOrMissing(sources, 'warden_2022_30s_sts'),
    transformation: transformationOrMissing(transformations, 'chair_percentile_range_v1_pending_transform'),
    provider: dependencies.chairPercentileTransform,
    profile: normalizedProfile,
    integrityOk,
  });
  const balance = interpretBalance({
    result: extracted.balance,
    source: sourceOrMissing(sources, 'springer_2007_unipedal_eyes_open'),
    profile: normalizedProfile,
    integrityOk,
  });
  const shoulder = interpretShoulder({
    result: extracted.shoulder,
    source: sourceOrMissing(sources, 'gill_2020_active_shoulder_flexion'),
    profile: normalizedProfile,
    integrityOk,
  });

  const diagnostics: ReferenceEngineDiagnostic[] = [
    ...normalizedProfile.profileDiagnostics,
    ...integrityDiagnostics,
  ];
  if (!checkUp) diagnostics.push({ code: 'checkup_input_malformed', severity: 'error', domain: 'engine' });
  if (!protocolSupported) diagnostics.push({ code: 'unsupported_checkup_protocol', severity: 'info', domain: 'engine' });
  diagnostics.push(...domainDiagnostics(chair), ...domainDiagnostics(balance), ...domainDiagnostics(shoulder));
  const { diagnostics: _chairDiagnostics, ...chairOutput } = chair;
  const { diagnostics: _balanceDiagnostics, ...balanceOutput } = balance;
  const { diagnostics: _shoulderDiagnostics, ...shoulderOutput } = shoulder;

  return {
    engineSchemaVersion: MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION,
    engineVersion: MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION,
    protocolPolicyId: protocolSupported ? MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID : null,
    protocolPolicyVersion: protocolSupported ? protocol.policy.version : null,
    protocolSupported,
    unsupportedReason: protocolSupported ? null : 'unsupported_checkup_protocol',
    sourceSetId: MOVEMENT_PROFILE_V2_SOURCE_SET_ID,
    sourceSetFingerprint,
    rawCompleteness,
    chair: protocolSupported ? chairOutput : unsupportedChair(chair.source, chair.transformation),
    balance: protocolSupported ? balanceOutput : unsupportedBalance(balance.source),
    shoulder: protocolSupported ? shoulderOutput : unsupportedShoulder(shoulder.source),
    diagnostics: stableDiagnostics(diagnostics),
  };
}

export function movementProfileV2SourceSetFingerprint(
  sources: readonly ReferenceSourceDefinition[] = REFERENCE_SOURCES,
  transformations: readonly ReferenceTransformationDefinition[] = REFERENCE_TRANSFORMATIONS
): string {
  return deterministicFingerprint('mpv2-source-set-v1', {
    engineVersion: MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION,
    sources: [...sources]
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId))
      .map((source) => ({
        sourceId: source.sourceId,
        sourceVersion: source.sourceVersion,
        sourceFingerprint: source.sourceFingerprint,
        sourceDataFingerprint: source.sourceDataFingerprint,
      })),
    transformations: [...transformations]
      .sort((a, b) => a.transformationId.localeCompare(b.transformationId))
      .map((transformation) => ({
        transformationId: transformation.transformationId,
        transformationVersion: transformation.transformationVersion,
        transformationFingerprint: transformation.transformationFingerprint,
        enabled: transformation.enabled,
        reasonIfDisabled: transformation.reasonIfDisabled ?? null,
        approvalId: transformation.approvalId ?? null,
      })),
  });
}

function interpretChair({
  result,
  source,
  transformation,
  provider,
  profile,
  integrityOk,
}: {
  result: ChairRiseV2Result | null;
  source: ReferenceSourceDefinition | null;
  transformation: ReferenceTransformationDefinition | null;
  provider: MovementProfileV2ReferenceEngineDependencies['chairPercentileTransform'];
  profile: ReturnType<typeof normalizeMovementProfileV2ReferenceProfile>;
  integrityOk: boolean;
}): ChairInterpretation & { diagnostics: ReferenceEngineDiagnostic[] } {
  const raw = chairRawMetric(result);
  const sourceMeta = source ? sourceMetadata(source) : MISSING_SOURCE;
  const transformationDef = transformation ?? {
    transformationId: 'chair_percentile_range_v1_pending_transform',
    transformationVersion: 0,
    sourceIds: ['warden_2022_30s_sts'],
    transformationFingerprint: 'missing-transformation',
    enabled: false,
    reasonIfDisabled: 'missing_transformation',
  };
  const interpreted = integrityOk
    ? interpretChairPercentile({
        result,
        repetitions: raw.metric?.value ?? null,
        protocolEvidence: result?.evidenceStatus ?? null,
        profile,
        source: sourceMeta,
        transformation: transformationDef,
        provider,
      })
    : {
        claimEligibility: 'raw_only_reference_unavailable' as const,
        eligibilityReasons: ['raw_only_reference_unavailable'] as const,
        percentileRange: null,
        diagnostics: [{ code: 'chair_reference_integrity_invalid', severity: 'error' as const, domain: 'chair' as const }],
      };
  return {
    movementId: CHAIR_RISE_V2_ID,
    resultKind: interpreted.percentileRange ? 'percentile_range' : 'raw_only',
    rawMetric: raw.metric,
    protocolEvidence: result?.evidenceStatus ?? null,
    claimEligibility: interpreted.claimEligibility,
    eligibilityReasons: interpreted.eligibilityReasons,
    source: sourceMeta,
    transformation: transformation ? transformationMetadata(transformation) : MISSING_TRANSFORMATION,
    percentileRange: interpreted.percentileRange,
    rawInvalidReasons: raw.invalidReasons,
    diagnostics: interpreted.diagnostics,
  };
}

function interpretBalance({
  result,
  source,
  profile,
  integrityOk,
}: {
  result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null;
  source: ReferenceSourceDefinition | null;
  profile: ReturnType<typeof normalizeMovementProfileV2ReferenceProfile>;
  integrityOk: boolean;
}): BalanceInterpretation & { diagnostics: ReferenceEngineDiagnostic[] } {
  const raw = balanceRawMetric(result);
  const taskBand = raw.metric?.metricId === 'one_leg_balance_best' ? balanceTaskBand(raw.metric.value) : null;
  const sourceMeta = source ? sourceMetadata(source) : { ...MISSING_SOURCE, sourceId: 'springer_2007_unipedal_eyes_open' as const };
  const interpreted =
    integrityOk && source && isOneLegBalanceV2Result(result)
      ? interpretBalanceBenchmark({
          result,
          rawSeconds: raw.metric?.value ?? null,
          protocolEvidence: result?.evidenceStatus ?? null,
          profile,
          source: sourceMeta,
        })
      : {
          claimEligibility: 'raw_only_reference_unavailable' as const,
          eligibilityReasons: ['raw_only_reference_unavailable'] as const,
          sourceBenchmark: null,
          diagnostics: [{
            code: result?.movementId === BALANCE_EYES_OPEN_V2_ID
              ? 'balance_eyes_open_v2_reference_mapping_pending'
              : 'balance_reference_integrity_invalid',
            severity: result?.movementId === BALANCE_EYES_OPEN_V2_ID ? 'info' as const : 'error' as const,
            domain: 'balance' as const,
          }],
          longitudinalComparableToPrior: result?.setup?.changedFromPrior === true ? false : true,
          selectedStandingLeg: selectedStandingLegForBalanceResult(result),
        };
  return {
    movementId: result?.movementId === BALANCE_EYES_OPEN_V2_ID ? BALANCE_EYES_OPEN_V2_ID : ONE_LEG_BALANCE_V2_ID,
    resultKind: interpreted.sourceBenchmark ? 'published_age_group_benchmark' : taskBand ? 'hale_task_band' : 'raw_only',
    rawMetric: raw.metric,
    taskBand,
    protocolEvidence: result?.evidenceStatus ?? null,
    claimEligibility: interpreted.claimEligibility,
    eligibilityReasons: interpreted.eligibilityReasons,
    source: sourceMeta,
    sourceBenchmark: interpreted.sourceBenchmark,
    reachedCeiling: raw.metric?.metricId === 'one_leg_balance_best' ? raw.metric.value === 45 : false,
    selectedStandingLeg: interpreted.selectedStandingLeg,
    longitudinalComparableToPrior: interpreted.longitudinalComparableToPrior,
    rawInvalidReasons: raw.invalidReasons,
    diagnostics: interpreted.diagnostics,
  };
}

function interpretShoulder({
  result,
  source,
  profile,
  integrityOk,
}: {
  result: ActiveShoulderReachV2Result | null;
  source: ReferenceSourceDefinition | null;
  profile: ReturnType<typeof normalizeMovementProfileV2ReferenceProfile>;
  integrityOk: boolean;
}): ShoulderInterpretation & { diagnostics: ReferenceEngineDiagnostic[] } {
  const raw = shoulderRawMetric(result);
  const sourceMeta = source ? sourceMetadata(source) : { ...MISSING_SOURCE, sourceId: 'gill_2020_active_shoulder_flexion' as const };
  const interpreted =
    integrityOk && source
      ? interpretShoulderIqr({
          result,
          rawDegrees: raw.metric?.value ?? null,
          protocolEvidence: result?.evidenceStatus ?? null,
          profile,
          source: sourceMeta,
        })
      : {
          claimEligibility: 'raw_only_reference_unavailable' as const,
          eligibilityReasons: ['raw_only_reference_unavailable'] as const,
          iqr: null,
          diagnostics: [{ code: 'shoulder_reference_integrity_invalid', severity: 'error' as const, domain: 'shoulder' as const }],
          longitudinalComparableToPrior: result?.setup?.changedFromPrior === true ? false : true,
        };
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    resultKind: interpreted.iqr ? 'published_iqr_category' : 'raw_only',
    rawMetric: raw.metric,
    selectedSide: result?.selectedSide ?? null,
    protocolEvidence: result?.evidenceStatus ?? null,
    claimEligibility: interpreted.claimEligibility,
    eligibilityReasons: interpreted.eligibilityReasons,
    source: sourceMeta,
    iqr: interpreted.iqr,
    painLimited: result?.painLimited === true,
    longitudinalComparableToPrior: interpreted.longitudinalComparableToPrior,
    rawInvalidReasons: raw.invalidReasons,
    diagnostics: interpreted.diagnostics,
  };
}

function chairRawMetric(result: ChairRiseV2Result | null): {
  metric: Extract<RawMetric, { metricId: 'chair_rises_30s' }> | null;
  invalidReasons: string[];
} {
  if (!result) return { metric: null, invalidReasons: ['missing_result'] };
  const invalidReasons: string[] = [];
  if (!Number.isInteger(result.reps) || result.reps < 0) invalidReasons.push('chair_reps_invalid');
  if (result.evidenceStatus === 'invalid_measurement') invalidReasons.push('invalid_measurement');
  if (invalidReasons.length > 0) return { metric: null, invalidReasons };
  return { metric: { metricId: 'chair_rises_30s', value: result.reps, unit: 'repetitions' }, invalidReasons };
}

function balanceRawMetric(result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null): {
  metric: Extract<RawMetric, { metricId: 'one_leg_balance_best' | 'balance_eyes_open_total' }> | null;
  invalidReasons: string[];
} {
  if (!result) return { metric: null, invalidReasons: ['missing_result'] };
  if (isBalanceEyesOpenV2Result(result)) {
    const invalidReasons: string[] = [];
    if (!Number.isFinite(result.totalMaintainedMs) || result.totalMaintainedMs < 0) {
      invalidReasons.push('balance_eyes_open_total_invalid');
    }
    if (!Number.isFinite(result.totalCapMs) || result.totalCapMs <= 0) {
      invalidReasons.push('balance_eyes_open_cap_invalid');
    }
    if (result.evidenceStatus === 'invalid_measurement') invalidReasons.push('invalid_measurement');
    if (invalidReasons.length > 0) return { metric: null, invalidReasons };
    return {
      metric: {
        metricId: 'balance_eyes_open_total',
        value: result.totalMaintainedMs / 1000,
        unit: 'seconds',
        completedStageCount: result.completedStageCount,
        totalCapSeconds: result.totalCapMs / 1000,
      },
      invalidReasons,
    };
  }
  const invalidReasons: string[] = [];
  if (!Number.isFinite(result.bestHoldSec) || result.bestHoldSec < 0 || result.bestHoldSec > 45) {
    invalidReasons.push('balance_best_hold_invalid');
  }
  if (result.evidenceStatus === 'invalid_measurement') invalidReasons.push('invalid_measurement');
  if (invalidReasons.length > 0) return { metric: null, invalidReasons };
  return {
    metric: { metricId: 'one_leg_balance_best', value: result.bestHoldSec, unit: 'seconds', ceiling: 45 },
    invalidReasons,
  };
}

function shoulderRawMetric(result: ActiveShoulderReachV2Result | null): {
  metric: Extract<RawMetric, { metricId: 'active_shoulder_reach' }> | null;
  invalidReasons: string[];
} {
  if (!result) return { metric: null, invalidReasons: ['missing_result'] };
  const invalidReasons: string[] = [];
  if (!Number.isFinite(result.peakFlexionDeg) || result.peakFlexionDeg < 0 || result.peakFlexionDeg > 180) {
    invalidReasons.push('shoulder_peak_flexion_invalid');
  }
  const side = result.selectedSide;
  const selectedSide = side === 'left' || side === 'right' ? side : null;
  if (!selectedSide) {
    invalidReasons.push('shoulder_selected_side_invalid');
    return { metric: null, invalidReasons };
  }
  if (result.evidenceStatus === 'invalid_measurement') invalidReasons.push('invalid_measurement');
  if (invalidReasons.length > 0) return { metric: null, invalidReasons };
  return {
    metric: {
      metricId: 'active_shoulder_reach',
      value: result.peakFlexionDeg,
      unit: 'degrees',
      side: selectedSide,
    },
    invalidReasons,
  };
}

function extractV2Results(checkUp: CheckUp): ExtractedV2Results {
  return {
    chair: extractMeasuredResult<ChairRiseV2Result>(checkUp, CHAIR_RISE_V2_ID),
    balance:
      extractMeasuredResult<BalanceEyesOpenV2Result>(checkUp, BALANCE_EYES_OPEN_V2_ID) ??
      extractMeasuredResult<OneLegBalanceV2Result>(checkUp, ONE_LEG_BALANCE_V2_ID),
    shoulder: extractMeasuredResult<ActiveShoulderReachV2Result>(checkUp, ACTIVE_SHOULDER_REACH_V2_ID),
  };
}

function extractMeasuredResult<T extends { movementId: string; evidenceStatus: MovementProfileV2EvidenceStatus }>(
  checkUp: CheckUp,
  movementId: string
): T | null {
  const item: CheckUpItem | undefined = checkUp.items.find((candidate) => candidate.movementId === movementId);
  if (item?.status !== 'measured' || !item.result || item.result.movementId !== movementId) return null;
  const evidence = (item.result as unknown as Partial<T>).evidenceStatus;
  if (!isMovementProfileV2EvidenceStatus(evidence)) return null;
  return item.result as unknown as T;
}

function unsupportedChair(source: ReferenceMetadata, transformation: TransformationMetadata): ChairInterpretation {
  return {
    movementId: CHAIR_RISE_V2_ID,
    resultKind: 'raw_only',
    rawMetric: null,
    protocolEvidence: null,
    claimEligibility: 'raw_only_reference_unavailable',
    eligibilityReasons: ['raw_only_reference_unavailable'],
    source,
    transformation,
    percentileRange: null,
    rawInvalidReasons: ['unsupported_checkup_protocol'],
  };
}

function unsupportedBalance(source: ReferenceMetadata): BalanceInterpretation {
  return {
    movementId: ONE_LEG_BALANCE_V2_ID,
    resultKind: 'raw_only',
    rawMetric: null,
    taskBand: null,
    protocolEvidence: null,
    claimEligibility: 'raw_only_reference_unavailable',
    eligibilityReasons: ['raw_only_reference_unavailable'],
    source,
    sourceBenchmark: null,
    reachedCeiling: false,
    selectedStandingLeg: null,
    longitudinalComparableToPrior: true,
    rawInvalidReasons: ['unsupported_checkup_protocol'],
  };
}

function isOneLegBalanceV2Result(
  result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null
): result is OneLegBalanceV2Result {
  return result?.movementId === ONE_LEG_BALANCE_V2_ID;
}

function isBalanceEyesOpenV2Result(
  result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null
): result is BalanceEyesOpenV2Result {
  return result?.movementId === BALANCE_EYES_OPEN_V2_ID;
}

function selectedStandingLegForBalanceResult(
  result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null
): BodySide | null {
  if (isBalanceEyesOpenV2Result(result)) return result.selectedStandingLeg;
  if (isOneLegBalanceV2Result(result)) return result.standingLeg;
  return null;
}

function unsupportedShoulder(source: ReferenceMetadata): ShoulderInterpretation {
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    resultKind: 'raw_only',
    rawMetric: null,
    selectedSide: null,
    protocolEvidence: null,
    claimEligibility: 'raw_only_reference_unavailable',
    eligibilityReasons: ['raw_only_reference_unavailable'],
    source,
    iqr: null,
    painLimited: false,
    longitudinalComparableToPrior: true,
    rawInvalidReasons: ['unsupported_checkup_protocol'],
  };
}

function sourceOrMissing(
  sources: readonly ReferenceSourceDefinition[],
  sourceId: ReferenceSourceDefinition['sourceId']
): ReferenceSourceDefinition | null {
  return sources.find((source) => source.sourceId === sourceId) ?? null;
}

function transformationOrMissing(
  transformations: readonly ReferenceTransformationDefinition[],
  transformationId: ReferenceTransformationDefinition['transformationId']
): ReferenceTransformationDefinition | null {
  return transformations.find((transformation) => transformation.transformationId === transformationId) ?? null;
}

function domainDiagnostics(
  interpretation:
    | (ChairInterpretation & { diagnostics?: readonly ReferenceEngineDiagnostic[] })
    | (BalanceInterpretation & { diagnostics?: readonly ReferenceEngineDiagnostic[] })
    | (ShoulderInterpretation & { diagnostics?: readonly ReferenceEngineDiagnostic[] })
): ReferenceEngineDiagnostic[] {
  return interpretation.diagnostics ? [...interpretation.diagnostics] : [];
}

function stableDiagnostics(diagnostics: readonly ReferenceEngineDiagnostic[]): ReferenceEngineDiagnostic[] {
  const seen = new Set<string>();
  const out: ReferenceEngineDiagnostic[] = [];
  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.domain ?? ''}:${diagnostic.severity}:${diagnostic.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(diagnostic);
  }
  return out.sort((a, b) => `${a.domain ?? ''}:${a.severity}:${a.code}`.localeCompare(`${b.domain ?? ''}:${b.severity}:${b.code}`));
}

function emptyRawCompleteness(): MovementProfileV2RawCompleteness {
  return {
    isMovementProfileV2: false,
    referenceComplete: false,
    missingHeadlineMovementIds: [CHAIR_RISE_V2_ID, ONE_LEG_BALANCE_V2_ID, ACTIVE_SHOULDER_REACH_V2_ID],
    evidenceStatusByMovementId: {},
  };
}

function isCheckUpLike(value: unknown): value is CheckUp {
  return !!value && typeof value === 'object' && Array.isArray((value as Partial<CheckUp>).items);
}

function isMovementProfileV2EvidenceStatus(value: unknown): value is MovementProfileV2EvidenceStatus {
  return (
    value === 'reference_protocol_complete' ||
    value === 'raw_only_setup_uncertain' ||
    value === 'raw_only_protocol_incomplete' ||
    value === 'raw_only_tracking_uncertain' ||
    value === 'raw_only_pain_limited' ||
    value === 'invalid_measurement'
  );
}
