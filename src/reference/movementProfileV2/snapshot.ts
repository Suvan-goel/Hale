import {
  MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS,
  MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS_V2,
  type MovementProfileV2HeadlineMovementId,
} from '../../checkup/movementProfileV2';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  normalizeCheckUpRecordProtocolPolicy,
} from '../../checkup/protocolPolicy';
import type { MovementProfileV2EvidenceStatus } from '../../checkup/protocolEvidence';
import type {
  ActiveShoulderReachV2Setup,
  BalanceEyesOpenV2Setup,
  BodySide,
  ChairRiseV2Setup,
  OneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import type { CheckUp, CheckUpItem } from '../../checkup/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import {
  BALANCE_EYES_OPEN_V2_ID,
  type BalanceEyesOpenV2Result,
} from '../../movements/balanceEyesOpenV2';
import {
  ONE_LEG_BALANCE_V2_ID,
  type OneLegBalanceV2Result,
} from '../../movements/oneLegBalanceV2';
import { balanceTaskBand } from './balance';
import { deterministicFingerprint } from './fingerprint';
import {
  interpretMovementProfileV2,
  movementProfileV2SourceSetFingerprint,
} from './engine';
import { normalizeMovementProfileV2ReferenceProfile } from './referenceProfile';
import {
  MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION,
  MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION,
  MOVEMENT_PROFILE_V2_SOURCE_SET_ID,
  type MovementProfileV2Interpretation,
  type MovementProfileV2ReferenceEngineDependencies,
  type MovementProfileV2ReferenceProfile,
  type NormalizedMovementProfileV2ReferenceProfile,
  type ReferenceAgeBasis,
  type ReferenceClaimEligibility,
  type ReferenceResultKind,
  type ReferenceSexForPublishedComparisons,
  type ShoulderIqrCategory,
} from './types';

export const MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_DISPLAY_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_OFFICIAL_EVIDENCE_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_SNAPSHOT_KIND = 'movement_profile_v2_snapshot' as const;

export type MovementProfileV2OfficialSourceCheckUpType =
  | 'baseline'
  | 'baseline_retake'
  | 'official_retest';

export type MovementProfileV2SnapshotDiagnosticCode =
  | 'v2_snapshot_ineligible_source_type'
  | 'v2_snapshot_raw_incomplete'
  | 'v2_snapshot_duplicate_headline_movement'
  | 'v2_snapshot_malformed_source'
  | 'v2_snapshot_source_mismatch'
  | 'v2_snapshot_fingerprint_invalid'
  | 'v2_snapshot_future_schema'
  | 'v2_snapshot_conflict'
  | 'v2_snapshot_malformed'
  | 'v2_snapshot_policy_incompatible'
  | 'v2_snapshot_invalid_created_at'
  | 'v2_snapshot_engine_output_invalid';

export interface MovementProfileV2SnapshotDiagnostic {
  code: MovementProfileV2SnapshotDiagnosticCode;
  checkUpId?: string;
  snapshotId?: string;
  snapshotKind?: typeof MOVEMENT_PROFILE_V2_SNAPSHOT_KIND;
  schemaVersion?: number;
  protocolId?: string;
  protocolVersion?: number;
  sourceSetId?: string;
  sourceSetFingerprint?: string;
  domain?: MovementProfileV2DomainKey;
}

export type MovementProfileV2DomainKey = 'chair' | 'balance' | 'shoulder';

export interface StoredMovementProfileV2Snapshot {
  kind: typeof MOVEMENT_PROFILE_V2_SNAPSHOT_KIND;
  schemaVersion: typeof MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  snapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType: MovementProfileV2OfficialSourceCheckUpType;
  sourceCheckUpFingerprint: string;
  createdAt: string;
  protocolPolicy: {
    id: typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
    version: 1;
  };
  officialEvidencePolicyVersion: typeof MOVEMENT_PROFILE_V2_OFFICIAL_EVIDENCE_POLICY_VERSION;
  referenceProfile: NormalizedMovementProfileV2ReferenceProfile;
  referenceProfileFingerprint: string;
  engine: {
    schemaVersion: typeof MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION;
    engineVersion: typeof MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION;
  };
  sourceSet: {
    sourceSetId: typeof MOVEMENT_PROFILE_V2_SOURCE_SET_ID;
    sourceSetFingerprint: string;
  };
  displayPolicyVersion: typeof MOVEMENT_PROFILE_V2_DISPLAY_POLICY_VERSION;
  interpretation: MovementProfileV2Interpretation;
}

export type MovementProfileV2SnapshotCompatibility =
  | 'current'
  | 'missing'
  | 'malformed'
  | 'future_schema'
  | 'fingerprint_invalid'
  | 'source_mismatch'
  | 'unsupported_checkup_protocol'
  | 'unsupported_source_type';

export type ParsedStoredMovementProfileV2Snapshot =
  | {
      ok: true;
      compatibility: 'current';
      snapshot: StoredMovementProfileV2Snapshot;
    }
  | {
      ok: false;
      compatibility: Exclude<MovementProfileV2SnapshotCompatibility, 'current'>;
      diagnostic: MovementProfileV2SnapshotDiagnostic;
    };

export type MovementProfileV2SnapshotEligibility =
  | {
      eligible: true;
      sourceType: MovementProfileV2OfficialSourceCheckUpType;
      rawCompleteness: {
        missingDomains: readonly MovementProfileV2DomainKey[];
        evidenceStatusByMovementId: Partial<Record<MovementProfileV2HeadlineMovementId, MovementProfileV2EvidenceStatus>>;
      };
      sourceCheckUpFingerprint: string;
    }
  | {
      eligible: false;
      reason: MovementProfileV2SnapshotDiagnosticCode;
      missingDomains?: readonly MovementProfileV2DomainKey[];
      diagnostic: MovementProfileV2SnapshotDiagnostic;
    };

export type MovementProfileV2SnapshotCreationResult =
  | {
      ok: true;
      snapshot: StoredMovementProfileV2Snapshot;
      eligibility: Extract<MovementProfileV2SnapshotEligibility, { eligible: true }>;
      diagnostics: readonly MovementProfileV2SnapshotDiagnostic[];
    }
  | {
      ok: false;
      reason: MovementProfileV2SnapshotDiagnosticCode;
      eligibility?: MovementProfileV2SnapshotEligibility;
      diagnostics: readonly MovementProfileV2SnapshotDiagnostic[];
    };

export interface CreateMovementProfileV2SnapshotInput {
  checkUp: CheckUp;
  checkupType: MovementProfileV2OfficialSourceCheckUpType | string | null | undefined;
  referenceProfile: MovementProfileV2ReferenceProfile;
  createdAt: string;
  dependencies?: MovementProfileV2ReferenceEngineDependencies;
}

export type MovementProfileV2SnapshotSourceValidation =
  | {
      valid: true;
      sourceCheckUpFingerprint: string;
    }
  | {
      valid: false;
      reason: MovementProfileV2SnapshotDiagnosticCode;
      diagnostic: MovementProfileV2SnapshotDiagnostic;
    };

export type MovementProfileV2SnapshotAttachmentResult =
  | {
      attached: true;
      status: 'attached' | 'idempotent';
      checkUp: CheckUp;
      snapshot: StoredMovementProfileV2Snapshot;
    }
  | {
      attached: false;
      status: 'rejected' | 'conflict';
      checkUp: CheckUp;
      existingSnapshot?: StoredMovementProfileV2Snapshot;
      reason: MovementProfileV2SnapshotDiagnosticCode;
      diagnostic: MovementProfileV2SnapshotDiagnostic;
    };

export type MovementProfileSnapshotCompatibility =
  | {
      compatible: true;
      kind: 'v2_same_policy';
      referenceInterpretationComparable: boolean;
      domainComparability: {
        chair: { rawComparable: boolean; referenceComparable: boolean };
        balance: { rawComparable: boolean; referenceComparable: boolean; sameStandingLeg: boolean };
        shoulder: { rawComparable: boolean; referenceComparable: boolean; sameSide: boolean };
      };
    }
  | {
      compatible: false;
      reason:
        | 'snapshot_policy_changed'
        | 'v2_snapshot_policy_incompatible'
        | 'v2_snapshot_malformed'
        | 'v2_snapshot_missing';
    };

interface CanonicalV2SourceResult {
  ok: boolean;
  canonical?: unknown;
  fingerprint?: string;
  missingDomains: MovementProfileV2DomainKey[];
  evidenceStatusByMovementId: Partial<Record<MovementProfileV2HeadlineMovementId, MovementProfileV2EvidenceStatus>>;
  reason?: MovementProfileV2SnapshotDiagnosticCode;
  diagnostic?: MovementProfileV2SnapshotDiagnostic;
}

const OFFICIAL_SOURCE_TYPES: readonly MovementProfileV2OfficialSourceCheckUpType[] = [
  'baseline',
  'baseline_retake',
  'official_retest',
] as const;

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

const EVIDENCE_STATUSES: readonly MovementProfileV2EvidenceStatus[] = [
  'reference_protocol_complete',
  'raw_only_setup_uncertain',
  'raw_only_protocol_incomplete',
  'raw_only_tracking_uncertain',
  'raw_only_pain_limited',
  'invalid_measurement',
] as const;

const RESULT_KINDS: readonly ReferenceResultKind[] = [
  'raw_only',
  'percentile_range',
  'hale_task_band',
  'published_age_group_benchmark',
  'published_iqr_category',
] as const;

const CLAIM_ELIGIBILITY_VALUES: readonly ReferenceClaimEligibility[] = [
  'reference_eligible',
  'raw_only_setup_uncertain',
  'raw_only_protocol_incomplete',
  'raw_only_tracking_uncertain',
  'raw_only_reference_unavailable',
  'raw_only_profile_incomplete',
  'raw_only_pain_limited',
  'raw_only_outside_reference_age',
  'raw_only_source_transform_unapproved',
  'invalid_measurement',
] as const;

const LEGACY_DERIVED_ARTIFACT_KEYS = new Set([
  ['suggested', 'Focus'].join(''),
  ['focus', 'Selection'].join(''),
  ['weakest', 'Domain'].join(''),
  ['movement', 'Age'].join(''),
  ['score', 'Snapshot'].join(''),
  ['movement', 'Block'].join(''),
  ['block', 'Report'].join(''),
]);

export function createMovementProfileV2Snapshot(
  input: CreateMovementProfileV2SnapshotInput
): MovementProfileV2SnapshotCreationResult {
  const diagnostics: MovementProfileV2SnapshotDiagnostic[] = [];
  const eligibility = getMovementProfileV2SnapshotEligibility(input.checkUp, input.checkupType);
  if (!eligibility.eligible) {
    return {
      ok: false,
      reason: eligibility.reason,
      eligibility,
      diagnostics: [eligibility.diagnostic],
    };
  }
  if (!isIsoTimestamp(input.createdAt)) {
    const invalidCreatedAtDiagnostic = diagnostic('v2_snapshot_invalid_created_at', {
      checkUpId: input.checkUp.startedAt,
      protocolId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      protocolVersion: 1,
    });
    return {
      ok: false,
      reason: invalidCreatedAtDiagnostic.code,
      eligibility,
      diagnostics: [invalidCreatedAtDiagnostic],
    };
  }

  const referenceProfile = normalizeMovementProfileV2ReferenceProfile(input.referenceProfile);
  const referenceProfileFingerprint = movementProfileV2ReferenceProfileFingerprint(referenceProfile);
  const interpretation = interpretMovementProfileV2(
    {
      checkUp: input.checkUp,
      referenceProfile: input.referenceProfile,
    },
    input.dependencies
  );

  if (
    !interpretation.protocolSupported ||
    interpretation.engineSchemaVersion !== MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION ||
    interpretation.engineVersion !== MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION ||
    interpretation.protocolPolicyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID ||
    interpretation.protocolPolicyVersion !== 1 ||
    interpretation.sourceSetId !== MOVEMENT_PROFILE_V2_SOURCE_SET_ID
  ) {
    const engineDiagnostic = diagnostic('v2_snapshot_engine_output_invalid', {
      checkUpId: input.checkUp.startedAt,
      protocolId: interpretation.protocolPolicyId ?? MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      protocolVersion: interpretation.protocolPolicyVersion ?? undefined,
      sourceSetId: interpretation.sourceSetId,
      sourceSetFingerprint: interpretation.sourceSetFingerprint,
    });
    return {
      ok: false,
      reason: engineDiagnostic.code,
      eligibility,
      diagnostics: [engineDiagnostic],
    };
  }

  const expectedSourceSetFingerprint = movementProfileV2SourceSetFingerprint(
    input.dependencies?.sources,
    input.dependencies?.transformations
  );
  if (interpretation.sourceSetFingerprint !== expectedSourceSetFingerprint) {
    diagnostics.push(
      diagnostic('v2_snapshot_engine_output_invalid', {
        checkUpId: input.checkUp.startedAt,
        sourceSetId: interpretation.sourceSetId,
        sourceSetFingerprint: interpretation.sourceSetFingerprint,
      })
    );
  }

  const snapshotBase: Omit<StoredMovementProfileV2Snapshot, 'snapshotFingerprint'> = {
    kind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
    schemaVersion: MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: movementProfileV2SnapshotIdForSourceCheckUp(input.checkUp.startedAt),
    sourceCheckUpId: input.checkUp.startedAt,
    sourceCheckUpType: eligibility.sourceType,
    sourceCheckUpFingerprint: eligibility.sourceCheckUpFingerprint,
    createdAt: input.createdAt,
    protocolPolicy: {
      id: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      version: 1,
    },
    officialEvidencePolicyVersion: MOVEMENT_PROFILE_V2_OFFICIAL_EVIDENCE_POLICY_VERSION,
    referenceProfile,
    referenceProfileFingerprint,
    engine: {
      schemaVersion: MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION,
      engineVersion: MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION,
    },
    sourceSet: {
      sourceSetId: MOVEMENT_PROFILE_V2_SOURCE_SET_ID,
      sourceSetFingerprint: interpretation.sourceSetFingerprint,
    },
    displayPolicyVersion: MOVEMENT_PROFILE_V2_DISPLAY_POLICY_VERSION,
    interpretation,
  };
  const snapshot: StoredMovementProfileV2Snapshot = {
    ...snapshotBase,
    snapshotFingerprint: movementProfileV2SnapshotFingerprint(snapshotBase),
  };
  const parsed = parseStoredMovementProfileV2Snapshot(snapshot);
  if (!parsed.ok) {
    return {
      ok: false,
      reason: parsed.diagnostic.code,
      eligibility,
      diagnostics: [...diagnostics, parsed.diagnostic],
    };
  }
  return {
    ok: true,
    snapshot: parsed.snapshot,
    eligibility,
    diagnostics,
  };
}

export function getMovementProfileV2SnapshotEligibility(
  checkUp: CheckUp,
  checkupType: string | null | undefined
): MovementProfileV2SnapshotEligibility {
  if (!isOfficialV2SourceCheckUpType(checkupType)) {
    const sourceTypeDiagnostic = diagnostic('v2_snapshot_ineligible_source_type', {
      checkUpId: checkUp.startedAt,
      protocolId: protocolIdForDiagnostic(checkUp),
      protocolVersion: protocolVersionForDiagnostic(checkUp),
    });
    return {
      eligible: false,
      reason: sourceTypeDiagnostic.code,
      diagnostic: sourceTypeDiagnostic,
    };
  }

  const canonical = canonicalMovementProfileV2Source(checkUp, checkupType);
  if (!canonical.ok) {
    const sourceDiagnostic =
      canonical.diagnostic ??
      diagnostic(canonical.reason ?? 'v2_snapshot_malformed_source', {
        checkUpId: checkUp.startedAt,
        protocolId: protocolIdForDiagnostic(checkUp),
        protocolVersion: protocolVersionForDiagnostic(checkUp),
      });
    return {
      eligible: false,
      reason: sourceDiagnostic.code,
      missingDomains: canonical.missingDomains,
      diagnostic: sourceDiagnostic,
    };
  }

  return {
    eligible: true,
    sourceType: checkupType,
    rawCompleteness: {
      missingDomains: [],
      evidenceStatusByMovementId: canonical.evidenceStatusByMovementId,
    },
    sourceCheckUpFingerprint: canonical.fingerprint as string,
  };
}

export function movementProfileV2SnapshotIdForSourceCheckUp(sourceCheckUpId: string): string {
  return `movement-profile-v2-snapshot:${encodeURIComponent(sourceCheckUpId)}`;
}

export function movementProfileV2SourceCheckUpFingerprint(
  checkUp: CheckUp,
  checkupType: MovementProfileV2OfficialSourceCheckUpType
): string | null {
  const canonical = canonicalMovementProfileV2Source(checkUp, checkupType);
  return canonical.ok ? canonical.fingerprint as string : null;
}

export function movementProfileV2ReferenceProfileFingerprint(
  profile: NormalizedMovementProfileV2ReferenceProfile
): string {
  return deterministicFingerprint('mpv2-reference-profile-v1', profile);
}

export function movementProfileV2SnapshotFingerprint(
  snapshot: Omit<StoredMovementProfileV2Snapshot, 'snapshotFingerprint'> | StoredMovementProfileV2Snapshot
): string {
  const { snapshotFingerprint: _snapshotFingerprint, ...material } =
    snapshot as StoredMovementProfileV2Snapshot;
  return deterministicFingerprint('mpv2-snapshot-v1', material);
}

export function parseStoredMovementProfileV2Snapshot(
  value: unknown
): ParsedStoredMovementProfileV2Snapshot {
  if (value === null || value === undefined) {
    return {
      ok: false,
      compatibility: 'missing',
      diagnostic: diagnostic('v2_snapshot_malformed'),
    };
  }
  if (!isRecord(value)) {
    return {
      ok: false,
      compatibility: 'malformed',
      diagnostic: diagnostic('v2_snapshot_malformed'),
    };
  }
  if (value.kind !== MOVEMENT_PROFILE_V2_SNAPSHOT_KIND) {
    return {
      ok: false,
      compatibility: 'malformed',
      diagnostic: diagnostic('v2_snapshot_malformed', {
        schemaVersion: integerOrUndefined(value.schemaVersion),
      }),
    };
  }
  if (value.schemaVersion !== MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION) {
    return {
      ok: false,
      compatibility: isPositiveInteger(value.schemaVersion) ? 'future_schema' : 'malformed',
      diagnostic: diagnostic(
        isPositiveInteger(value.schemaVersion) ? 'v2_snapshot_future_schema' : 'v2_snapshot_malformed',
        {
          snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
          schemaVersion: integerOrUndefined(value.schemaVersion),
        }
      ),
    };
  }
  const snapshot = value as Partial<StoredMovementProfileV2Snapshot>;
  const baseDiagnostic = {
    checkUpId: typeof snapshot.sourceCheckUpId === 'string' ? snapshot.sourceCheckUpId : undefined,
    snapshotId: typeof snapshot.snapshotId === 'string' ? snapshot.snapshotId : undefined,
    snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
    schemaVersion: MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION,
    protocolId: isRecord(snapshot.protocolPolicy) && typeof snapshot.protocolPolicy.id === 'string'
      ? snapshot.protocolPolicy.id
      : undefined,
    protocolVersion: isRecord(snapshot.protocolPolicy) && typeof snapshot.protocolPolicy.version === 'number'
      ? snapshot.protocolPolicy.version
      : undefined,
    sourceSetId: isRecord(snapshot.sourceSet) && typeof snapshot.sourceSet.sourceSetId === 'string'
      ? snapshot.sourceSet.sourceSetId
      : undefined,
    sourceSetFingerprint:
      isRecord(snapshot.sourceSet) && typeof snapshot.sourceSet.sourceSetFingerprint === 'string'
        ? snapshot.sourceSet.sourceSetFingerprint
        : undefined,
  };
  if (!snapshotHasRequiredTopLevelShape(snapshot) || containsForbiddenV2SnapshotKeys(snapshot)) {
    return {
      ok: false,
      compatibility: 'malformed',
      diagnostic: diagnostic('v2_snapshot_malformed', baseDiagnostic),
    };
  }
  if (!isJsonSafe(snapshot)) {
    return {
      ok: false,
      compatibility: 'malformed',
      diagnostic: diagnostic('v2_snapshot_malformed', baseDiagnostic),
    };
  }
  if (!referenceProfileIsValid(snapshot.referenceProfile)) {
    return {
      ok: false,
      compatibility: 'malformed',
      diagnostic: diagnostic('v2_snapshot_malformed', baseDiagnostic),
    };
  }
  if (
    snapshot.referenceProfileFingerprint !==
    movementProfileV2ReferenceProfileFingerprint(snapshot.referenceProfile)
  ) {
    return {
      ok: false,
      compatibility: 'fingerprint_invalid',
      diagnostic: diagnostic('v2_snapshot_fingerprint_invalid', baseDiagnostic),
    };
  }
  const interpretationValidation = validateInterpretation(snapshot.interpretation, snapshot);
  if (!interpretationValidation.valid) {
    return {
      ok: false,
      compatibility: 'malformed',
      diagnostic: diagnostic('v2_snapshot_malformed', {
        ...baseDiagnostic,
        domain: interpretationValidation.domain,
      }),
    };
  }
  if (snapshot.snapshotFingerprint !== movementProfileV2SnapshotFingerprint(snapshot as StoredMovementProfileV2Snapshot)) {
    return {
      ok: false,
      compatibility: 'fingerprint_invalid',
      diagnostic: diagnostic('v2_snapshot_fingerprint_invalid', baseDiagnostic),
    };
  }
  return {
    ok: true,
    compatibility: 'current',
    snapshot: snapshot as StoredMovementProfileV2Snapshot,
  };
}

export function validateMovementProfileV2SnapshotSource({
  snapshot,
  checkUp,
  checkupType,
}: {
  snapshot: unknown;
  checkUp: CheckUp;
  checkupType: string | null | undefined;
}): MovementProfileV2SnapshotSourceValidation {
  const parsed = parseStoredMovementProfileV2Snapshot(snapshot);
  if (!parsed.ok) {
    return {
      valid: false,
      reason:
        parsed.compatibility === 'future_schema'
          ? 'v2_snapshot_future_schema'
          : parsed.compatibility === 'fingerprint_invalid'
            ? 'v2_snapshot_fingerprint_invalid'
            : 'v2_snapshot_malformed',
      diagnostic: parsed.diagnostic,
    };
  }
  if (!isOfficialV2SourceCheckUpType(checkupType) || parsed.snapshot.sourceCheckUpType !== checkupType) {
    const typeDiagnostic = diagnostic('v2_snapshot_source_mismatch', {
      checkUpId: checkUp.startedAt,
      snapshotId: parsed.snapshot.snapshotId,
      snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
      schemaVersion: parsed.snapshot.schemaVersion,
      protocolId: parsed.snapshot.protocolPolicy.id,
      protocolVersion: parsed.snapshot.protocolPolicy.version,
      sourceSetId: parsed.snapshot.sourceSet.sourceSetId,
      sourceSetFingerprint: parsed.snapshot.sourceSet.sourceSetFingerprint,
    });
    return { valid: false, reason: typeDiagnostic.code, diagnostic: typeDiagnostic };
  }
  if (parsed.snapshot.sourceCheckUpId !== checkUp.startedAt) {
    const sourceIdDiagnostic = diagnostic('v2_snapshot_source_mismatch', {
      checkUpId: checkUp.startedAt,
      snapshotId: parsed.snapshot.snapshotId,
      snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
      schemaVersion: parsed.snapshot.schemaVersion,
      protocolId: parsed.snapshot.protocolPolicy.id,
      protocolVersion: parsed.snapshot.protocolPolicy.version,
      sourceSetId: parsed.snapshot.sourceSet.sourceSetId,
      sourceSetFingerprint: parsed.snapshot.sourceSet.sourceSetFingerprint,
    });
    return { valid: false, reason: sourceIdDiagnostic.code, diagnostic: sourceIdDiagnostic };
  }
  const canonical = canonicalMovementProfileV2Source(checkUp, checkupType);
  if (!canonical.ok || canonical.fingerprint !== parsed.snapshot.sourceCheckUpFingerprint) {
    const mismatchDiagnostic = diagnostic('v2_snapshot_source_mismatch', {
      checkUpId: checkUp.startedAt,
      snapshotId: parsed.snapshot.snapshotId,
      snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
      schemaVersion: parsed.snapshot.schemaVersion,
      protocolId: parsed.snapshot.protocolPolicy.id,
      protocolVersion: parsed.snapshot.protocolPolicy.version,
      sourceSetId: parsed.snapshot.sourceSet.sourceSetId,
      sourceSetFingerprint: parsed.snapshot.sourceSet.sourceSetFingerprint,
    });
    return { valid: false, reason: mismatchDiagnostic.code, diagnostic: mismatchDiagnostic };
  }
  return { valid: true, sourceCheckUpFingerprint: canonical.fingerprint };
}

export function attachMovementProfileV2Snapshot({
  checkUp,
  snapshot,
  checkupType,
}: {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  checkupType: string | null | undefined;
}): MovementProfileV2SnapshotAttachmentResult {
  const sourceValidation = validateMovementProfileV2SnapshotSource({ snapshot, checkUp, checkupType });
  if (!sourceValidation.valid) {
    return {
      attached: false,
      status: 'rejected',
      checkUp,
      reason: sourceValidation.reason,
      diagnostic: sourceValidation.diagnostic,
    };
  }
  const existing = checkUp.movementProfileV2Snapshot;
  if (!existing) {
    const parsed = parseStoredMovementProfileV2Snapshot(snapshot);
    if (!parsed.ok) {
      return {
        attached: false,
        status: 'rejected',
        checkUp,
        reason: parsed.diagnostic.code,
        diagnostic: parsed.diagnostic,
      };
    }
    return {
      attached: true,
      status: 'attached',
      checkUp: { ...checkUp, movementProfileV2Snapshot: parsed.snapshot },
      snapshot: parsed.snapshot,
    };
  }

  const existingParsed = parseStoredMovementProfileV2Snapshot(existing);
  if (!existingParsed.ok) {
    return {
      attached: false,
      status: 'conflict',
      checkUp,
      reason: 'v2_snapshot_conflict',
      diagnostic: diagnostic('v2_snapshot_conflict', {
        checkUpId: checkUp.startedAt,
        snapshotId: snapshot.snapshotId,
        snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
        schemaVersion: MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION,
      }),
    };
  }
  if (existingParsed.snapshot.snapshotId !== snapshot.snapshotId) {
    return {
      attached: false,
      status: 'conflict',
      checkUp,
      existingSnapshot: existingParsed.snapshot,
      reason: 'v2_snapshot_conflict',
      diagnostic: diagnostic('v2_snapshot_conflict', {
        checkUpId: checkUp.startedAt,
        snapshotId: snapshot.snapshotId,
        snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
        schemaVersion: snapshot.schemaVersion,
      }),
    };
  }
  if (existingParsed.snapshot.snapshotFingerprint !== snapshot.snapshotFingerprint) {
    return {
      attached: false,
      status: 'conflict',
      checkUp,
      existingSnapshot: existingParsed.snapshot,
      reason: 'v2_snapshot_conflict',
      diagnostic: diagnostic('v2_snapshot_conflict', {
        checkUpId: checkUp.startedAt,
        snapshotId: snapshot.snapshotId,
        snapshotKind: MOVEMENT_PROFILE_V2_SNAPSHOT_KIND,
        schemaVersion: snapshot.schemaVersion,
      }),
    };
  }
  return {
    attached: true,
    status: 'idempotent',
    checkUp,
    snapshot: existingParsed.snapshot,
  };
}

export function movementProfileSnapshotCompatibility(
  left: unknown,
  right: unknown
): MovementProfileSnapshotCompatibility {
  const leftV2 = parseStoredMovementProfileV2Snapshot(left);
  const rightV2 = parseStoredMovementProfileV2Snapshot(right);
  const leftIsMissing = left === null || left === undefined;
  const rightIsMissing = right === null || right === undefined;

  if (leftIsMissing || rightIsMissing) return { compatible: false, reason: 'v2_snapshot_missing' };
  if (!leftV2.ok || !rightV2.ok) {
    const leftLooksV1 = looksLikeLegacyDerivedArtifact(left);
    const rightLooksV1 = looksLikeLegacyDerivedArtifact(right);
    if ((leftLooksV1 && rightV2.ok) || (rightLooksV1 && leftV2.ok) || (leftLooksV1 && rightLooksV1)) {
      return { compatible: false, reason: 'snapshot_policy_changed' };
    }
    return { compatible: false, reason: 'v2_snapshot_malformed' };
  }

  if (
    leftV2.snapshot.schemaVersion !== rightV2.snapshot.schemaVersion ||
    leftV2.snapshot.protocolPolicy.id !== rightV2.snapshot.protocolPolicy.id ||
    leftV2.snapshot.protocolPolicy.version !== rightV2.snapshot.protocolPolicy.version ||
    leftV2.snapshot.engine.schemaVersion !== rightV2.snapshot.engine.schemaVersion ||
    leftV2.snapshot.engine.engineVersion !== rightV2.snapshot.engine.engineVersion ||
    leftV2.snapshot.displayPolicyVersion !== rightV2.snapshot.displayPolicyVersion ||
    leftV2.snapshot.officialEvidencePolicyVersion !== rightV2.snapshot.officialEvidencePolicyVersion ||
    leftV2.snapshot.sourceSet.sourceSetId !== rightV2.snapshot.sourceSet.sourceSetId ||
    leftV2.snapshot.sourceSet.sourceSetFingerprint !== rightV2.snapshot.sourceSet.sourceSetFingerprint
  ) {
    return { compatible: false, reason: 'v2_snapshot_policy_incompatible' };
  }

  const sameStandingLeg =
    leftV2.snapshot.interpretation.balance.selectedStandingLeg !== null &&
    leftV2.snapshot.interpretation.balance.selectedStandingLeg ===
      rightV2.snapshot.interpretation.balance.selectedStandingLeg;
  const sameShoulderSide =
    leftV2.snapshot.interpretation.shoulder.selectedSide !== null &&
    leftV2.snapshot.interpretation.shoulder.selectedSide === rightV2.snapshot.interpretation.shoulder.selectedSide;
  const referenceInterpretationComparable =
    leftV2.snapshot.referenceProfileFingerprint === rightV2.snapshot.referenceProfileFingerprint &&
    referenceProfileSupportsReferenceComparison(leftV2.snapshot.referenceProfile) &&
    referenceProfileSupportsReferenceComparison(rightV2.snapshot.referenceProfile);

  return {
    compatible: true,
    kind: 'v2_same_policy',
    referenceInterpretationComparable,
    domainComparability: {
      chair: {
        rawComparable:
          leftV2.snapshot.interpretation.chair.movementId === rightV2.snapshot.interpretation.chair.movementId,
        referenceComparable:
          referenceInterpretationComparable &&
          leftV2.snapshot.interpretation.chair.claimEligibility === 'reference_eligible' &&
          rightV2.snapshot.interpretation.chair.claimEligibility === 'reference_eligible',
      },
      balance: {
        rawComparable: sameStandingLeg,
        referenceComparable:
          sameStandingLeg &&
          referenceInterpretationComparable &&
          leftV2.snapshot.interpretation.balance.claimEligibility === 'reference_eligible' &&
          rightV2.snapshot.interpretation.balance.claimEligibility === 'reference_eligible',
        sameStandingLeg,
      },
      shoulder: {
        rawComparable: sameShoulderSide,
        referenceComparable:
          sameShoulderSide &&
          referenceInterpretationComparable &&
          leftV2.snapshot.interpretation.shoulder.claimEligibility === 'reference_eligible' &&
          rightV2.snapshot.interpretation.shoulder.claimEligibility === 'reference_eligible',
        sameSide: sameShoulderSide,
      },
    },
  };
}

export function validMovementProfileV2SnapshotForCheckUp({
  snapshot,
  checkUp,
  checkupType,
}: {
  snapshot: unknown;
  checkUp: CheckUp;
  checkupType: string | null | undefined;
}): StoredMovementProfileV2Snapshot | null {
  const parsed = parseStoredMovementProfileV2Snapshot(snapshot);
  if (!parsed.ok) return null;
  return validateMovementProfileV2SnapshotSource({ snapshot: parsed.snapshot, checkUp, checkupType }).valid
    ? parsed.snapshot
    : null;
}

function canonicalMovementProfileV2Source(
  checkUp: CheckUp,
  checkupType: MovementProfileV2OfficialSourceCheckUpType
): CanonicalV2SourceResult {
  const protocol = normalizeCheckUpRecordProtocolPolicy(checkUp);
  const evidenceStatusByMovementId: Partial<Record<MovementProfileV2HeadlineMovementId, MovementProfileV2EvidenceStatus>> = {};
  if (!protocol.supported || protocol.policy.id !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) {
    return {
      ok: false,
      missingDomains: ['chair', 'balance', 'shoulder'],
      evidenceStatusByMovementId,
      reason: 'v2_snapshot_malformed_source',
      diagnostic: diagnostic('v2_snapshot_malformed_source', {
        checkUpId: checkUp.startedAt,
        protocolId: protocol.supported ? protocol.policy.id : protocol.unsupportedId ?? undefined,
      }),
    };
  }
  if (!Array.isArray(checkUp.items)) {
    return {
      ok: false,
      missingDomains: ['chair', 'balance', 'shoulder'],
      evidenceStatusByMovementId,
      reason: 'v2_snapshot_malformed_source',
      diagnostic: diagnostic('v2_snapshot_malformed_source', {
        checkUpId: checkUp.startedAt,
        protocolId: protocol.policy.id,
        protocolVersion: protocol.policy.version,
      }),
    };
  }

  const duplicate = duplicateHeadlineMovementId(checkUp.items);
  if (duplicate) {
    return {
      ok: false,
      missingDomains: [domainForMovementId(duplicate)],
      evidenceStatusByMovementId,
      reason: 'v2_snapshot_duplicate_headline_movement',
      diagnostic: diagnostic('v2_snapshot_duplicate_headline_movement', {
        checkUpId: checkUp.startedAt,
        protocolId: protocol.policy.id,
        protocolVersion: protocol.policy.version,
        domain: domainForMovementId(duplicate),
      }),
    };
  }

  const chair = canonicalChairResult(resultForItem<ChairRiseV2Result>(checkUp, CHAIR_RISE_V2_ID));
  const balance = canonicalBalanceResult(
    resultForItem<BalanceEyesOpenV2Result>(checkUp, BALANCE_EYES_OPEN_V2_ID) ??
      resultForItem<OneLegBalanceV2Result>(checkUp, ONE_LEG_BALANCE_V2_ID)
  );
  const shoulder = canonicalShoulderResult(resultForItem<ActiveShoulderReachV2Result>(checkUp, ACTIVE_SHOULDER_REACH_V2_ID));
  const missingDomains: MovementProfileV2DomainKey[] = [];
  if (!chair.ok) missingDomains.push('chair');
  if (!balance.ok) missingDomains.push('balance');
  if (!shoulder.ok) missingDomains.push('shoulder');

  if (chair.evidenceStatus) evidenceStatusByMovementId[CHAIR_RISE_V2_ID] = chair.evidenceStatus;
  if (balance.evidenceStatus) {
    evidenceStatusByMovementId[balance.movementId ?? ONE_LEG_BALANCE_V2_ID] = balance.evidenceStatus;
  }
  if (shoulder.evidenceStatus) evidenceStatusByMovementId[ACTIVE_SHOULDER_REACH_V2_ID] = shoulder.evidenceStatus;

  if (missingDomains.length > 0) {
    return {
      ok: false,
      missingDomains,
      evidenceStatusByMovementId,
      reason: 'v2_snapshot_raw_incomplete',
      diagnostic: diagnostic('v2_snapshot_raw_incomplete', {
        checkUpId: checkUp.startedAt,
        protocolId: protocol.policy.id,
        protocolVersion: protocol.policy.version,
        domain: missingDomains[0],
      }),
    };
  }

  const canonical = {
    checkUpId: checkUp.startedAt,
    sourceType: checkupType,
    protocolPolicy: {
      id: protocol.policy.id,
      version: protocol.policy.version,
      frozenAt: protocol.policy.frozenAt,
    },
    bodyUnit: jsonSafeValue(checkUp.bodyUnit),
    headlineMovementIds: [
      ...(balance.movementId === BALANCE_EYES_OPEN_V2_ID
        ? MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS_V2
        : MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS),
    ].sort(),
    rawCompleteness: {
      missingDomains: [],
      evidenceStatusByMovementId,
    },
    results: {
      chair: chair.canonical,
      balance: balance.canonical,
      shoulder: shoulder.canonical,
    },
  };
  return {
    ok: true,
    canonical,
    fingerprint: deterministicFingerprint('mpv2-source-checkup-v1', canonical),
    missingDomains: [],
    evidenceStatusByMovementId,
  };
}

function canonicalChairResult(result: ChairRiseV2Result | null): {
  ok: boolean;
  canonical?: unknown;
  evidenceStatus?: MovementProfileV2EvidenceStatus;
} {
  if (!result || result.movementId !== CHAIR_RISE_V2_ID || result.protocolPolicyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) {
    return { ok: false };
  }
  if (!isMovementProfileV2EvidenceStatus(result.evidenceStatus)) return { ok: false };
  if (result.evidenceStatus === 'invalid_measurement') return { ok: false, evidenceStatus: result.evidenceStatus };
  if (!Number.isInteger(result.reps) || result.reps < 0) return { ok: false, evidenceStatus: result.evidenceStatus };
  const setup = canonicalChairSetup(result.setup);
  if (!setup) return { ok: false, evidenceStatus: result.evidenceStatus };
  return {
    ok: true,
    evidenceStatus: result.evidenceStatus,
    canonical: {
      movementId: result.movementId,
      evidenceStatus: result.evidenceStatus,
      setup,
      setupConfidence: result.setupConfidence,
      practiceRepCompleted: result.practiceRepCompleted === true,
      activeWindowMs: finiteOrNull(result.activeWindowMs),
      activeMeasurementWindows: canonicalWindows(result.activeMeasurementWindows),
      fullStandRule: result.fullStandRule,
      reps: result.reps,
      repStats: Array.isArray(result.repStats)
        ? result.repStats.map((rep) => ({
            completedAtMs: finiteOrNull(rep.completedAtMs),
            meanVel: finiteOrNull(rep.meanVel),
            peakVel: finiteOrNull(rep.peakVel),
            durationMs: finiteOrNull(rep.durationMs),
            pushOff: rep.pushOff === true,
            creditedAtWindowExpiry: rep.creditedAtWindowExpiry === true,
          }))
        : [],
      sessionMeanVel: finiteOrNull(result.sessionMeanVel),
      sessionMeanPeakVel: finiteOrNull(result.sessionMeanPeakVel),
      pushOffDetected: result.pushOffDetected === true,
      fullStandAtExpiryCounted: result.fullStandAtExpiryCounted === true,
      invalidReasons: stringArray(result.invalidReasons).sort(),
      interruptions: finiteOrNull(result.interruptions),
    },
  };
}

function canonicalBalanceResult(result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null): {
  ok: boolean;
  canonical?: unknown;
  evidenceStatus?: MovementProfileV2EvidenceStatus;
  movementId?: MovementProfileV2HeadlineMovementId;
} {
  if (isBalanceEyesOpenV2Result(result)) return canonicalEyesOpenBalanceResult(result);
  if (
    !result ||
    result.movementId !== ONE_LEG_BALANCE_V2_ID ||
    result.protocolPolicyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID
  ) {
    return { ok: false };
  }
  if (!isMovementProfileV2EvidenceStatus(result.evidenceStatus)) return { ok: false };
  if (result.evidenceStatus === 'invalid_measurement') return { ok: false, evidenceStatus: result.evidenceStatus };
  if (!Number.isFinite(result.bestHoldSec) || result.bestHoldSec < 0 || result.bestHoldSec > 45) {
    return { ok: false, evidenceStatus: result.evidenceStatus };
  }
  if (result.standingLeg !== 'left' && result.standingLeg !== 'right') {
    return { ok: false, evidenceStatus: result.evidenceStatus };
  }
  const setup = canonicalBalanceSetup(result.setup);
  if (!setup) return { ok: false, evidenceStatus: result.evidenceStatus };
  return {
    ok: true,
    evidenceStatus: result.evidenceStatus,
    movementId: ONE_LEG_BALANCE_V2_ID,
    canonical: {
      movementId: result.movementId,
      evidenceStatus: result.evidenceStatus,
      setup,
      standingLeg: result.standingLeg,
      setupConfidence: result.setupConfidence,
      bestHoldSec: result.bestHoldSec,
      bestTrialNumber: jsonSafeValue(result.bestTrialNumber),
      validTrialCount: jsonSafeValue(result.validTrialCount),
      attemptedTrialCount: jsonSafeValue(result.attemptedTrialCount),
      trials: Array.isArray(result.trials)
        ? result.trials.map((trial) => ({
            attemptNumber: finiteOrNull(trial.attemptNumber),
            validTrialNumber: jsonSafeValue(trial.validTrialNumber),
            startedAtMs: finiteOrNull(trial.startedAtMs),
            endedAtMs: finiteOrNull(trial.endedAtMs),
            holdSec: finiteOrNull(trial.holdSec),
            swaySd: jsonSafeValue(trial.swaySd),
            termination: trial.termination,
            valid: trial.valid === true,
          }))
        : [],
      rests: Array.isArray(result.rests)
        ? result.rests.map((rest) => ({
            startedAtMs: finiteOrNull(rest.startedAtMs),
            endedAtMs: finiteOrNull(rest.endedAtMs),
            reason: rest.reason,
          }))
        : [],
      retryCount: jsonSafeValue(result.retryCount),
      declinedRemainingTrials: result.declinedRemainingTrials === true,
      hardCapReached: result.hardCapReached === true,
      activeMeasurementWindows: canonicalWindows(result.activeMeasurementWindows),
      invalidReasons: stringArray(result.invalidReasons).sort(),
      interruptions: finiteOrNull(result.interruptions),
    },
  };
}

function isBalanceEyesOpenV2Result(
  result: OneLegBalanceV2Result | BalanceEyesOpenV2Result | null
): result is BalanceEyesOpenV2Result {
  return result?.movementId === BALANCE_EYES_OPEN_V2_ID;
}

function canonicalEyesOpenBalanceResult(result: BalanceEyesOpenV2Result): {
  ok: boolean;
  canonical?: unknown;
  evidenceStatus?: MovementProfileV2EvidenceStatus;
  movementId?: MovementProfileV2HeadlineMovementId;
} {
  if (
    result.movementId !== BALANCE_EYES_OPEN_V2_ID ||
    result.protocolPolicyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID ||
    result.protocolId !== 'home_balance_eyes_open_v2' ||
    result.protocolVersion !== 2
  ) {
    return { ok: false, movementId: BALANCE_EYES_OPEN_V2_ID };
  }
  if (!isMovementProfileV2EvidenceStatus(result.evidenceStatus)) {
    return { ok: false, movementId: BALANCE_EYES_OPEN_V2_ID };
  }
  if (result.evidenceStatus === 'invalid_measurement') {
    return { ok: false, evidenceStatus: result.evidenceStatus, movementId: BALANCE_EYES_OPEN_V2_ID };
  }
  if (result.selectedStandingLeg !== 'left' && result.selectedStandingLeg !== 'right') {
    return { ok: false, evidenceStatus: result.evidenceStatus, movementId: BALANCE_EYES_OPEN_V2_ID };
  }
  const setup = canonicalBalanceEyesOpenSetup(result.setup);
  if (!setup || !Array.isArray(result.stages) || result.stages.length === 0) {
    return { ok: false, evidenceStatus: result.evidenceStatus, movementId: BALANCE_EYES_OPEN_V2_ID };
  }
  return {
    ok: true,
    evidenceStatus: result.evidenceStatus,
    movementId: BALANCE_EYES_OPEN_V2_ID,
    canonical: {
      movementId: result.movementId,
      protocolId: result.protocolId,
      protocolVersion: result.protocolVersion,
      evidenceStatus: result.evidenceStatus,
      setup,
      selectedStandingLeg: result.selectedStandingLeg,
      setupConfidence: result.setupConfidence,
      stages: result.stages.map((stage) => ({
        stageId: stage.stageId,
        order: finiteOrNull(stage.order),
        capMs: finiteOrNull(stage.capMs),
        maintainedMs: finiteOrNull(stage.maintainedMs),
        completedCap: stage.completedCap === true,
        endReason: stage.endReason,
        selectedSide: jsonSafeValue(stage.selectedSide),
        sideRole: stage.sideRole,
        observedSide: jsonSafeValue(stage.observedSide),
        valid: stage.valid === true,
        startedAtMs: finiteOrNull(stage.startedAtMs),
        endedAtMs: finiteOrNull(stage.endedAtMs),
        supportingMetrics: jsonSafeValue(stage.supportingMetrics ?? null),
      })),
      trackingRetries: Array.isArray(result.trackingRetries)
        ? result.trackingRetries.map((retry) => ({
            stageId: retry.stageId,
            order: finiteOrNull(retry.order),
            interruptedAtMs: finiteOrNull(retry.interruptedAtMs),
            discardedStartedAtMs: finiteOrNull(retry.discardedStartedAtMs),
            discardedPartialMs: finiteOrNull(retry.discardedPartialMs),
            reason: retry.reason,
          }))
        : [],
      highestCompletedStage: jsonSafeValue(result.highestCompletedStage),
      terminalStage: jsonSafeValue(result.terminalStage),
      terminalStageMaintainedMs: jsonSafeValue(result.terminalStageMaintainedMs),
      completedStageCount: finiteOrNull(result.completedStageCount),
      totalMaintainedMs: finiteOrNull(result.totalMaintainedMs),
      totalCapMs: finiteOrNull(result.totalCapMs),
      completedAllStages: result.completedAllStages === true,
      completionReason: result.completionReason,
      activeMeasurementWindows: canonicalWindows(result.activeMeasurementWindows),
      invalidReasons: stringArray(result.invalidReasons).sort(),
      interruptions: finiteOrNull(result.interruptions),
    },
  };
}

function canonicalShoulderResult(result: ActiveShoulderReachV2Result | null): {
  ok: boolean;
  canonical?: unknown;
  evidenceStatus?: MovementProfileV2EvidenceStatus;
} {
  if (
    !result ||
    result.movementId !== ACTIVE_SHOULDER_REACH_V2_ID ||
    result.protocolPolicyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID
  ) {
    return { ok: false };
  }
  if (!isMovementProfileV2EvidenceStatus(result.evidenceStatus)) return { ok: false };
  if (result.evidenceStatus === 'invalid_measurement') return { ok: false, evidenceStatus: result.evidenceStatus };
  if (!Number.isFinite(result.peakFlexionDeg) || result.peakFlexionDeg < 0 || result.peakFlexionDeg > 180) {
    return { ok: false, evidenceStatus: result.evidenceStatus };
  }
  if (result.selectedSide !== 'left' && result.selectedSide !== 'right') {
    return { ok: false, evidenceStatus: result.evidenceStatus };
  }
  const setup = canonicalShoulderSetup(result.setup);
  if (!setup) return { ok: false, evidenceStatus: result.evidenceStatus };
  return {
    ok: true,
    evidenceStatus: result.evidenceStatus,
    canonical: {
      movementId: result.movementId,
      evidenceStatus: result.evidenceStatus,
      setup,
      selectedSide: result.selectedSide,
      setupConfidence: result.setupConfidence,
      peakFlexionDeg: result.peakFlexionDeg,
      retryCount: jsonSafeValue(result.retryCount),
      painLimited: result.painLimited === true,
      validTrackingMs: finiteOrNull(result.validTrackingMs),
      activeMeasurementWindows: canonicalWindows(result.activeMeasurementWindows),
      invalidReasons: stringArray(result.invalidReasons).sort(),
      interruptions: finiteOrNull(result.interruptions),
    },
  };
}

function snapshotHasRequiredTopLevelShape(
  value: Partial<StoredMovementProfileV2Snapshot>
): value is StoredMovementProfileV2Snapshot {
  return (
    value.kind === MOVEMENT_PROFILE_V2_SNAPSHOT_KIND &&
    value.schemaVersion === MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION &&
    typeof value.sourceCheckUpId === 'string' &&
    typeof value.snapshotId === 'string' &&
    value.snapshotId === movementProfileV2SnapshotIdForSourceCheckUp(value.sourceCheckUpId) &&
    typeof value.snapshotFingerprint === 'string' &&
    isOfficialV2SourceCheckUpType(value.sourceCheckUpType) &&
    typeof value.sourceCheckUpFingerprint === 'string' &&
    isIsoTimestamp(value.createdAt) &&
    isRecord(value.protocolPolicy) &&
    value.protocolPolicy.id === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID &&
    value.protocolPolicy.version === 1 &&
    value.officialEvidencePolicyVersion === MOVEMENT_PROFILE_V2_OFFICIAL_EVIDENCE_POLICY_VERSION &&
    isRecord(value.referenceProfile) &&
    typeof value.referenceProfileFingerprint === 'string' &&
    isRecord(value.engine) &&
    value.engine.schemaVersion === MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_SCHEMA_VERSION &&
    value.engine.engineVersion === MOVEMENT_PROFILE_V2_REFERENCE_ENGINE_VERSION &&
    isRecord(value.sourceSet) &&
    value.sourceSet.sourceSetId === MOVEMENT_PROFILE_V2_SOURCE_SET_ID &&
    typeof value.sourceSet.sourceSetFingerprint === 'string' &&
    value.displayPolicyVersion === MOVEMENT_PROFILE_V2_DISPLAY_POLICY_VERSION &&
    isRecord(value.interpretation)
  );
}

function validateInterpretation(
  interpretation: MovementProfileV2Interpretation,
  snapshot: StoredMovementProfileV2Snapshot
): { valid: true } | { valid: false; domain?: MovementProfileV2DomainKey } {
  if (
    interpretation.engineSchemaVersion !== snapshot.engine.schemaVersion ||
    interpretation.engineVersion !== snapshot.engine.engineVersion ||
    interpretation.protocolPolicyId !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID ||
    interpretation.protocolPolicyVersion !== snapshot.protocolPolicy.version ||
    interpretation.protocolSupported !== true ||
    interpretation.unsupportedReason !== null ||
    interpretation.sourceSetId !== snapshot.sourceSet.sourceSetId ||
    interpretation.sourceSetFingerprint !== snapshot.sourceSet.sourceSetFingerprint ||
    !isRecord(interpretation.rawCompleteness) ||
    !isRecord(interpretation.rawCompleteness.evidenceStatusByMovementId)
  ) {
    return { valid: false };
  }
  if (!chairInterpretationIsValid(interpretation.chair)) return { valid: false, domain: 'chair' };
  if (!balanceInterpretationIsValid(interpretation.balance)) return { valid: false, domain: 'balance' };
  if (!shoulderInterpretationIsValid(interpretation.shoulder)) return { valid: false, domain: 'shoulder' };
  return { valid: true };
}

function chairInterpretationIsValid(chair: MovementProfileV2Interpretation['chair']): boolean {
  if (!isRecord(chair) || chair.movementId !== CHAIR_RISE_V2_ID) return false;
  if (!RESULT_KINDS.includes(chair.resultKind) || !isClaimEligibility(chair.claimEligibility)) return false;
  if (!Array.isArray(chair.eligibilityReasons) || !chair.eligibilityReasons.every(isClaimEligibility)) return false;
  if (!isRecord(chair.source) || chair.source.sourceId !== 'warden_2022_30s_sts') return false;
  if (
    !isRecord(chair.transformation) ||
    chair.transformation.transformationId !== 'chair_percentile_range_v1_pending_transform'
  ) {
    return false;
  }
  if ('percentile' in chair) return false;
  if (chair.rawMetric !== null) {
    if (
      !isRecord(chair.rawMetric) ||
      chair.rawMetric.metricId !== 'chair_rises_30s' ||
      chair.rawMetric.unit !== 'repetitions' ||
      !Number.isInteger(chair.rawMetric.value) ||
      chair.rawMetric.value < 0
    ) {
      return false;
    }
  }
  if (chair.percentileRange !== null) {
    if (!chair.transformation.enabled || chair.resultKind !== 'percentile_range') return false;
    if (!percentileRangeIsValid(chair.percentileRange)) return false;
  }
  if (chair.transformation.enabled === false && chair.percentileRange !== null) return false;
  return true;
}

function balanceInterpretationIsValid(balance: MovementProfileV2Interpretation['balance']): boolean {
  if (
    !isRecord(balance) ||
    (balance.movementId !== ONE_LEG_BALANCE_V2_ID && balance.movementId !== BALANCE_EYES_OPEN_V2_ID)
  ) {
    return false;
  }
  if (!RESULT_KINDS.includes(balance.resultKind) || !isClaimEligibility(balance.claimEligibility)) return false;
  if (!Array.isArray(balance.eligibilityReasons) || !balance.eligibilityReasons.every(isClaimEligibility)) return false;
  if (!isRecord(balance.source) || balance.source.sourceId !== 'springer_2007_unipedal_eyes_open') return false;
  if (forbiddenReferenceStatKeys(balance)) return false;
  if (balance.rawMetric !== null) {
    if (!isRecord(balance.rawMetric) || balance.rawMetric.unit !== 'seconds') return false;
    if (balance.rawMetric.metricId === 'one_leg_balance_best') {
      if (
        balance.movementId !== ONE_LEG_BALANCE_V2_ID ||
        balance.rawMetric.ceiling !== 45 ||
        !Number.isFinite(balance.rawMetric.value) ||
        balance.rawMetric.value < 0 ||
        balance.rawMetric.value > 45
      ) {
        return false;
      }
      if (balance.taskBand !== balanceTaskBand(balance.rawMetric.value)) return false;
    } else if (balance.rawMetric.metricId === 'balance_eyes_open_total') {
      if (
        balance.movementId !== BALANCE_EYES_OPEN_V2_ID ||
        !Number.isFinite(balance.rawMetric.value) ||
        balance.rawMetric.value < 0 ||
        !Number.isInteger(balance.rawMetric.completedStageCount) ||
        balance.rawMetric.completedStageCount < 0 ||
        balance.rawMetric.completedStageCount > 4 ||
        !Number.isFinite(balance.rawMetric.totalCapSeconds) ||
        balance.rawMetric.totalCapSeconds !== 42
      ) {
        return false;
      }
      if (balance.taskBand !== null || balance.sourceBenchmark !== null || balance.claimEligibility === 'reference_eligible') {
        return false;
      }
    } else {
      return false;
    }
  }
  if (balance.sourceBenchmark !== null) {
    if (!isRecord(balance.sourceBenchmark)) return false;
    if (balance.sourceBenchmark.kind !== 'published_age_group_benchmark') return false;
    if (balance.sourceBenchmark.sourceId !== 'springer_2007_unipedal_eyes_open') return false;
    if (balance.sourceBenchmark.trialCeilingSeconds !== 45) return false;
    if (!Number.isFinite(balance.sourceBenchmark.meanBestOfThreeSeconds)) return false;
    if (balance.rawMetric && balance.sourceBenchmark.measuredSeconds !== balance.rawMetric.value) return false;
  }
  return true;
}

function shoulderInterpretationIsValid(shoulder: MovementProfileV2Interpretation['shoulder']): boolean {
  if (!isRecord(shoulder) || shoulder.movementId !== ACTIVE_SHOULDER_REACH_V2_ID) return false;
  if (!RESULT_KINDS.includes(shoulder.resultKind) || !isClaimEligibility(shoulder.claimEligibility)) return false;
  if (!Array.isArray(shoulder.eligibilityReasons) || !shoulder.eligibilityReasons.every(isClaimEligibility)) return false;
  if (!isRecord(shoulder.source) || shoulder.source.sourceId !== 'gill_2020_active_shoulder_flexion') return false;
  if (shoulder.rawMetric !== null) {
    if (
      !isRecord(shoulder.rawMetric) ||
      shoulder.rawMetric.metricId !== 'active_shoulder_reach' ||
      shoulder.rawMetric.unit !== 'degrees' ||
      !Number.isFinite(shoulder.rawMetric.value) ||
      shoulder.rawMetric.value < 0 ||
      shoulder.rawMetric.value > 180 ||
      (shoulder.rawMetric.side !== 'left' && shoulder.rawMetric.side !== 'right')
    ) {
      return false;
    }
    if (shoulder.selectedSide !== shoulder.rawMetric.side) return false;
  }
  if (shoulder.painLimited && shoulder.claimEligibility === 'reference_eligible') return false;
  if (shoulder.iqr !== null) {
    if (!isRecord(shoulder.iqr)) return false;
    if (shoulder.iqr.kind !== 'published_iqr_category') return false;
    if (shoulder.iqr.sourceId !== 'gill_2020_active_shoulder_flexion') return false;
    if (shoulder.iqr.side !== shoulder.selectedSide) return false;
    if (shoulder.iqr.q1Degrees > shoulder.iqr.medianDegrees || shoulder.iqr.medianDegrees > shoulder.iqr.q3Degrees) {
      return false;
    }
    if (shoulder.rawMetric && shoulder.iqr.measuredDegrees !== shoulder.rawMetric.value) return false;
    if (shoulder.iqr.category !== shoulderIqrCategoryForStoredResult(shoulder.iqr)) return false;
    if ('higherIsBetter' in shoulder.iqr) return false;
  }
  return true;
}

function shoulderIqrCategoryForStoredResult(
  iqr: MovementProfileV2Interpretation['shoulder']['iqr']
): ShoulderIqrCategory | null {
  if (!iqr) return null;
  if (iqr.measuredDegrees < iqr.q1Degrees) return 'below_published_middle_range';
  if (iqr.measuredDegrees > iqr.q3Degrees) return 'above_published_middle_range';
  return 'within_published_middle_range';
}

function referenceProfileIsValid(value: unknown): value is NormalizedMovementProfileV2ReferenceProfile {
  if (!isRecord(value)) return false;
  if (value.ageAtTest !== null && (typeof value.ageAtTest !== 'number' || !Number.isFinite(value.ageAtTest))) {
    return false;
  }
  if (!AGE_BASIS_VALUES.includes(value.ageBasis as ReferenceAgeBasis)) return false;
  if (value.ageGroupLabel !== null && typeof value.ageGroupLabel !== 'string') return false;
  if (!REFERENCE_SEX_VALUES.includes(value.referenceSex as ReferenceSexForPublishedComparisons)) return false;
  if (!Array.isArray(value.profileDiagnostics)) return false;
  return value.profileDiagnostics.every(
    (item) =>
      isRecord(item) &&
      typeof item.code === 'string' &&
      (item.severity === 'info' || item.severity === 'warning' || item.severity === 'error') &&
      (item.domain === undefined || item.domain === 'profile' || item.domain === 'engine' || item.domain === 'chair' || item.domain === 'balance' || item.domain === 'shoulder')
  );
}

function containsForbiddenV2SnapshotKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenV2SnapshotKeys);
  if (!isRecord(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (LEGACY_DERIVED_ARTIFACT_KEYS.has(key)) {
      return true;
    }
    if (containsForbiddenV2SnapshotKeys(child)) return true;
  }
  return false;
}

function duplicateHeadlineMovementId(items: readonly CheckUpItem[]): MovementProfileV2HeadlineMovementId | null {
  for (const movementId of MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS_V2) {
    const count = items.filter((item) => item.movementId === movementId).length;
    if (count > 1) return movementId;
  }
  if (
    items.some((item) => item.movementId === ONE_LEG_BALANCE_V2_ID) &&
    items.some((item) => item.movementId === BALANCE_EYES_OPEN_V2_ID)
  ) {
    return BALANCE_EYES_OPEN_V2_ID;
  }
  return null;
}

function resultForItem<T>(checkUp: CheckUp, movementId: string): T | null {
  const item = checkUp.items.find((candidate) => candidate.movementId === movementId);
  if (item?.status !== 'measured' || !item.result || !isRecord(item.result)) return null;
  return item.result as T;
}

function canonicalChairSetup(setup: ChairRiseV2Setup | null | undefined): unknown | null {
  if (!setup || setup.protocol !== 'chair_rise_v2_setup') return null;
  if (typeof setup.confirmed !== 'boolean') return null;
  if (!setupConfidenceIsValid(setup.confidence) || !setupSourceIsValid(setup.source)) return null;
  return {
    protocol: setup.protocol,
    confirmed: setup.confirmed,
    confidence: setup.confidence,
    source: setup.source,
  };
}

function canonicalBalanceSetup(setup: OneLegBalanceV2Setup | null | undefined): unknown | null {
  if (!setup || setup.protocol !== 'one_leg_balance_v2_setup') return null;
  if (setup.standingLeg !== 'left' && setup.standingLeg !== 'right') return null;
  if (typeof setup.confirmed !== 'boolean') return null;
  if (!setupConfidenceIsValid(setup.confidence) || !setupSourceIsValid(setup.source)) return null;
  if (setup.priorStandingLeg !== null && setup.priorStandingLeg !== 'left' && setup.priorStandingLeg !== 'right') {
    return null;
  }
  return {
    protocol: setup.protocol,
    standingLeg: setup.standingLeg,
    confirmed: setup.confirmed,
    confidence: setup.confidence,
    source: setup.source,
    priorStandingLeg: setup.priorStandingLeg,
    changedFromPrior: setup.changedFromPrior === true,
  };
}

function canonicalBalanceEyesOpenSetup(setup: BalanceEyesOpenV2Setup | null | undefined): unknown | null {
  if (!setup || setup.protocol !== 'balance_eyes_open_v2_setup') return null;
  if (setup.standingLeg !== 'left' && setup.standingLeg !== 'right') return null;
  if (typeof setup.confirmed !== 'boolean') return null;
  if (!setupConfidenceIsValid(setup.confidence) || !setupSourceIsValid(setup.source)) return null;
  if (setup.priorStandingLeg !== null && setup.priorStandingLeg !== 'left' && setup.priorStandingLeg !== 'right') {
    return null;
  }
  return {
    protocol: setup.protocol,
    standingLeg: setup.standingLeg,
    confirmed: setup.confirmed,
    confidence: setup.confidence,
    source: setup.source,
    priorStandingLeg: setup.priorStandingLeg,
    changedFromPrior: setup.changedFromPrior === true,
  };
}

function canonicalShoulderSetup(setup: ActiveShoulderReachV2Setup | null | undefined): unknown | null {
  if (!setup || setup.protocol !== 'active_shoulder_reach_v2_setup') return null;
  if (setup.selectedSide !== 'left' && setup.selectedSide !== 'right') return null;
  if (typeof setup.confirmed !== 'boolean') return null;
  if (!setupConfidenceIsValid(setup.confidence) || !setupSourceIsValid(setup.source)) return null;
  if (setup.priorSelectedSide !== null && setup.priorSelectedSide !== 'left' && setup.priorSelectedSide !== 'right') {
    return null;
  }
  return {
    protocol: setup.protocol,
    selectedSide: setup.selectedSide,
    confirmed: setup.confirmed,
    confidence: setup.confidence,
    source: setup.source,
    priorSelectedSide: setup.priorSelectedSide,
    changedFromPrior: setup.changedFromPrior === true,
  };
}

function canonicalWindows(windows: unknown): unknown[] {
  if (!Array.isArray(windows)) return [];
  return windows.map((window) => {
    if (!isRecord(window)) return null;
    return {
      startedAtMs: finiteOrNull(window.startedAtMs),
      endedAtMs: finiteOrNull(window.endedAtMs),
      valid: window.valid === true,
      reason: typeof window.reason === 'string' ? window.reason : '',
    };
  });
}

function percentileRangeIsValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.kind === 'below_10' || value.kind === 'above_90') return true;
  return (
    value.kind === 'range' &&
    typeof value.low === 'number' &&
    typeof value.high === 'number' &&
    Number.isInteger(value.low) &&
    Number.isInteger(value.high) &&
    value.low >= 0 &&
    value.high <= 100 &&
    value.low <= value.high
  );
}

function forbiddenReferenceStatKeys(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return 'percentile' in value || 'zScore' in value || 'range' in value;
}

function isOfficialV2SourceCheckUpType(value: unknown): value is MovementProfileV2OfficialSourceCheckUpType {
  return typeof value === 'string' && OFFICIAL_SOURCE_TYPES.includes(value as MovementProfileV2OfficialSourceCheckUpType);
}

function isMovementProfileV2EvidenceStatus(value: unknown): value is MovementProfileV2EvidenceStatus {
  return EVIDENCE_STATUSES.includes(value as MovementProfileV2EvidenceStatus);
}

function isClaimEligibility(value: unknown): value is ReferenceClaimEligibility {
  return CLAIM_ELIGIBILITY_VALUES.includes(value as ReferenceClaimEligibility);
}

function setupConfidenceIsValid(value: unknown): boolean {
  return value === 'confirmed' || value === 'uncertain' || value === 'bypassed';
}

function setupSourceIsValid(value: unknown): boolean {
  return value === 'user' || value === 'prior_record' || value === 'default' || value === 'direct_call';
}

function referenceProfileSupportsReferenceComparison(profile: NormalizedMovementProfileV2ReferenceProfile): boolean {
  return profile.ageBasis !== 'unknown' && profile.referenceSex !== 'unknown' && profile.referenceSex !== 'prefer_not_to_say';
}

function looksLikeLegacyDerivedArtifact(value: unknown): boolean {
  return (
    isRecord(value) &&
    'schemaVersion' in value &&
    'scoringVersion' in value &&
    'normVersion' in value &&
    'score' in value
  );
}

function isJsonSafe(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonSafe);
  if (isRecord(value)) {
    return Object.values(value).every(isJsonSafe);
  }
  return false;
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function integerOrUndefined(value: unknown): number | undefined {
  return Number.isInteger(value) ? (value as number) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function jsonSafeValue(value: unknown): unknown {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(jsonSafeValue);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) out[key] = jsonSafeValue(child);
    return out;
  }
  if (value === undefined) return null;
  return value;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function domainForMovementId(movementId: MovementProfileV2HeadlineMovementId): MovementProfileV2DomainKey {
  if (movementId === CHAIR_RISE_V2_ID) return 'chair';
  if (movementId === ONE_LEG_BALANCE_V2_ID || movementId === BALANCE_EYES_OPEN_V2_ID) return 'balance';
  return 'shoulder';
}

function protocolIdForDiagnostic(checkUp: CheckUp): string | undefined {
  const protocol = normalizeCheckUpRecordProtocolPolicy(checkUp);
  return protocol.supported ? protocol.policy.id : protocol.unsupportedId ?? undefined;
}

function protocolVersionForDiagnostic(checkUp: CheckUp): number | undefined {
  const protocol = normalizeCheckUpRecordProtocolPolicy(checkUp);
  return protocol.supported ? protocol.policy.version : undefined;
}

function diagnostic(
  code: MovementProfileV2SnapshotDiagnosticCode,
  details: Omit<MovementProfileV2SnapshotDiagnostic, 'code'> = {}
): MovementProfileV2SnapshotDiagnostic {
  return { code, ...details };
}
