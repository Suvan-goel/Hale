import type { CheckUp } from '../../checkup/types';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  normalizeCheckUpRecordProtocolPolicy,
} from '../../checkup/protocolPolicy';
import type { LifeGoal } from '../../adherence/types';
import { deterministicFingerprint } from './fingerprint';
import {
  MOVEMENT_PROFILE_V2_ASSESSMENT_KIND,
  MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
  createMovementProfileV2Assessment,
  deriveMovementProfileV2DomainEvidence,
  normalizeMovementProfileV2PriorFocusContext,
  parseMovementProfileV2Assessment,
  type MovementProfileV2Assessment,
  type MovementProfileV2PriorFocusContext,
} from './assessment';
import {
  MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION,
  attachMovementProfileV2Snapshot,
  createMovementProfileV2Snapshot,
  getMovementProfileV2SnapshotEligibility,
  movementProfileV2ReferenceProfileFingerprint,
  parseStoredMovementProfileV2Snapshot,
  validMovementProfileV2SnapshotForCheckUp,
  type MovementProfileV2OfficialSourceCheckUpType,
  type StoredMovementProfileV2Snapshot,
} from './snapshot';
import { movementProfileV2SourceSetFingerprint } from './engine';
import { normalizeMovementProfileV2ReferenceProfile } from './referenceProfile';
import type {
  MovementProfileV2ReferenceEngineDependencies,
  MovementProfileV2ReferenceProfile,
} from './types';

export const MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_VERSION = 1 as const;

export const MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-assessment-persistence-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_VERSION,
    requiresOfficialV2Source: true,
    requiresSourceBoundSnapshot: true,
    persistableFocusKinds: ['domain', 'balanced'],
    rejectNeedsRetake: true,
    snapshotRequired: true,
  }
);

export const MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-artifact-orchestration-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_VERSION,
    reuseFrozenSnapshot: true,
    reuseFrozenAssessment: true,
    createMissingSnapshotBeforeAssessment: true,
    priorFocusOfficialRetestOnly: true,
    noReadTimeRecompute: true,
  }
);

export type MovementProfileV2AssessmentCompatibility =
  | 'current'
  | 'missing'
  | 'malformed'
  | 'future_schema'
  | 'fingerprint_invalid'
  | 'source_mismatch'
  | 'snapshot_missing'
  | 'unsupported_checkup_protocol'
  | 'unsupported_source_type'
  | 'focus_not_persistable'
  | 'conflict';

export type MovementProfileV2AssessmentPersistenceDiagnosticCode =
  | 'v2_assessment_persistence_missing'
  | 'v2_assessment_persistence_malformed'
  | 'v2_assessment_persistence_future_schema'
  | 'v2_assessment_persistence_fingerprint_invalid'
  | 'v2_assessment_persistence_missing_snapshot'
  | 'v2_assessment_persistence_snapshot_mismatch'
  | 'v2_assessment_persistence_source_mismatch'
  | 'v2_assessment_persistence_unsupported_checkup_protocol'
  | 'v2_assessment_persistence_unsupported_source_type'
  | 'v2_assessment_persistence_focus_not_persistable'
  | 'v2_assessment_persistence_conflict'
  | 'v2_assessment_orchestration_ineligible_source'
  | 'v2_assessment_orchestration_snapshot_creation_failed'
  | 'v2_assessment_orchestration_snapshot_conflict'
  | 'v2_assessment_orchestration_existing_snapshot_reference_conflict'
  | 'v2_assessment_orchestration_existing_snapshot_source_set_conflict'
  | 'v2_assessment_orchestration_assessment_creation_failed'
  | 'v2_assessment_orchestration_assessment_conflict'
  | 'v2_assessment_orchestration_missing_prior_artifact';

export interface MovementProfileV2AssessmentPersistenceDiagnostic {
  code: MovementProfileV2AssessmentPersistenceDiagnosticCode;
  checkUpId?: string;
  snapshotId?: string;
  assessmentId?: string;
  sourceType?: string;
  assessmentFingerprint?: string;
  existingAssessmentFingerprint?: string;
  snapshotFingerprint?: string;
  expectedFingerprint?: string;
  policyFingerprint?: string;
}

export type MovementProfileV2AssessmentSourceValidation =
  | {
      valid: true;
      checkupType: MovementProfileV2OfficialSourceCheckUpType;
      snapshot: StoredMovementProfileV2Snapshot;
      assessment: MovementProfileV2Assessment;
    }
  | {
      valid: false;
      reason: MovementProfileV2AssessmentPersistenceDiagnosticCode;
      compatibility: MovementProfileV2AssessmentCompatibility;
      diagnostic: MovementProfileV2AssessmentPersistenceDiagnostic;
    };

export type MovementProfileV2AssessmentPersistenceEligibility =
  | {
      eligible: true;
      checkupType: MovementProfileV2OfficialSourceCheckUpType;
      snapshot: StoredMovementProfileV2Snapshot;
      assessment: MovementProfileV2Assessment;
    }
  | {
      eligible: false;
      reason: MovementProfileV2AssessmentPersistenceDiagnosticCode;
      compatibility: MovementProfileV2AssessmentCompatibility;
      diagnostic: MovementProfileV2AssessmentPersistenceDiagnostic;
    };

export type MovementProfileV2AssessmentAttachmentResult =
  | {
      attached: true;
      status: 'attached' | 'idempotent';
      checkUp: CheckUp;
      snapshot: StoredMovementProfileV2Snapshot;
      assessment: MovementProfileV2Assessment;
    }
  | {
      attached: false;
      status: 'rejected' | 'conflict';
      checkUp: CheckUp;
      existingAssessment?: MovementProfileV2Assessment;
      reason: MovementProfileV2AssessmentPersistenceDiagnosticCode;
      compatibility: MovementProfileV2AssessmentCompatibility;
      diagnostic: MovementProfileV2AssessmentPersistenceDiagnostic;
    };

export interface MovementProfileV2AssessmentHistoryRecord {
  checkUp: CheckUp;
  checkupType?: string | null;
  movementProfileV2Snapshot?: unknown;
  movementProfileV2Assessment?: unknown;
}

export interface OfficialMovementProfileV2AssessmentRecord<
  TRecord extends MovementProfileV2AssessmentHistoryRecord = MovementProfileV2AssessmentHistoryRecord,
> {
  record: TRecord;
  type: MovementProfileV2OfficialSourceCheckUpType;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
}

export interface MovementProfileV2AssessmentConflict<
  TRecord extends MovementProfileV2AssessmentHistoryRecord = MovementProfileV2AssessmentHistoryRecord,
> {
  assessmentId: string;
  kept: OfficialMovementProfileV2AssessmentRecord<TRecord>;
  rejected: OfficialMovementProfileV2AssessmentRecord<TRecord>;
  diagnostic: MovementProfileV2AssessmentPersistenceDiagnostic;
}

export interface MovementProfileV2AssessmentRecordSelection<
  TRecord extends MovementProfileV2AssessmentHistoryRecord = MovementProfileV2AssessmentHistoryRecord,
> {
  records: OfficialMovementProfileV2AssessmentRecord<TRecord>[];
  conflicts: MovementProfileV2AssessmentConflict<TRecord>[];
  diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[];
}

export interface MovementProfileV2PriorFocusSelection<
  TRecord extends MovementProfileV2AssessmentHistoryRecord = MovementProfileV2AssessmentHistoryRecord,
> {
  priorFocusContext: MovementProfileV2PriorFocusContext;
  priorAssessment?: OfficialMovementProfileV2AssessmentRecord<TRecord>;
  diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[];
}

export type MovementProfileV2ArtifactMaterializationResult =
  | {
      ok: true;
      status: 'materialized' | 'reused' | 'conflict';
      checkUp: CheckUp;
      snapshot: StoredMovementProfileV2Snapshot;
      assessment: MovementProfileV2Assessment;
      createdSnapshot: boolean;
      createdAssessment: boolean;
      diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[];
    }
  | {
      ok: false;
      status: 'rejected' | 'conflict';
      checkUp: CheckUp;
      snapshot?: StoredMovementProfileV2Snapshot;
      assessment?: MovementProfileV2Assessment;
      reason: MovementProfileV2AssessmentPersistenceDiagnosticCode;
      diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[];
    };

export interface MaterializeOfficialMovementProfileV2ArtifactsInput<
  TRecord extends MovementProfileV2AssessmentHistoryRecord = MovementProfileV2AssessmentHistoryRecord,
> {
  checkUp: CheckUp;
  checkupType: string | null | undefined;
  referenceProfile: MovementProfileV2ReferenceProfile;
  lifeGoal?: LifeGoal | null;
  acceptedHistory?: readonly TRecord[] | null;
  snapshotCreatedAt: string;
  assessmentCreatedAt: string;
  dependencies?: MovementProfileV2ReferenceEngineDependencies;
}

export function validateMovementProfileV2AssessmentSource({
  checkUp,
  checkupType,
  snapshot,
  assessment,
}: {
  checkUp: CheckUp;
  checkupType?: string | null;
  snapshot: unknown;
  assessment: unknown;
}): MovementProfileV2AssessmentSourceValidation {
  const parsedAssessment = parseMovementProfileV2Assessment(assessment);
  if (!parsedAssessment.ok) {
    const compatibility = assessmentCompatibilityFromParseCode(parsedAssessment.diagnostic.code);
    return invalidAssessmentSource(
      diagnosticCodeFromAssessmentCompatibility(compatibility),
      compatibility,
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.diagnostic.assessmentId,
        snapshotId: parsedAssessment.diagnostic.snapshotId,
        sourceType: parsedAssessment.diagnostic.sourceType,
      }
    );
  }

  const parsedSnapshot = parseStoredMovementProfileV2Snapshot(snapshot);
  if (!parsedSnapshot.ok) {
    const compatibility = snapshot === null || snapshot === undefined
      ? 'snapshot_missing'
      : parsedSnapshot.compatibility === 'future_schema'
        ? 'future_schema'
        : parsedSnapshot.compatibility === 'fingerprint_invalid'
          ? 'fingerprint_invalid'
          : 'snapshot_missing';
    return invalidAssessmentSource(
      compatibility === 'future_schema'
        ? 'v2_assessment_persistence_future_schema'
        : compatibility === 'fingerprint_invalid'
          ? 'v2_assessment_persistence_fingerprint_invalid'
          : 'v2_assessment_persistence_missing_snapshot',
      compatibility,
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: parsedAssessment.assessment.sourceSnapshotId,
        sourceType: parsedAssessment.assessment.sourceCheckUpType,
      }
    );
  }

  const protocol = normalizeCheckUpRecordProtocolPolicy(checkUp);
  if (!protocol.supported || protocol.policy.id !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) {
    return invalidAssessmentSource(
      'v2_assessment_persistence_unsupported_checkup_protocol',
      'unsupported_checkup_protocol',
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: parsedSnapshot.snapshot.snapshotId,
        sourceType: parsedAssessment.assessment.sourceCheckUpType,
      }
    );
  }

  if (checkupType !== undefined && checkupType !== null && !isOfficialV2SourceType(checkupType)) {
    return invalidAssessmentSource(
      'v2_assessment_persistence_unsupported_source_type',
      'unsupported_source_type',
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: parsedSnapshot.snapshot.snapshotId,
        sourceType: checkupType,
      }
    );
  }

  const effectiveCheckupType = checkupType ?? parsedSnapshot.snapshot.sourceCheckUpType;
  if (
    !isOfficialV2SourceType(effectiveCheckupType) ||
    parsedSnapshot.snapshot.sourceCheckUpType !== effectiveCheckupType ||
    parsedAssessment.assessment.sourceCheckUpType !== effectiveCheckupType
  ) {
    return invalidAssessmentSource(
      'v2_assessment_persistence_source_mismatch',
      'source_mismatch',
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: parsedSnapshot.snapshot.snapshotId,
        sourceType: String(effectiveCheckupType),
      }
    );
  }

  const validSnapshot = validMovementProfileV2SnapshotForCheckUp({
    snapshot: parsedSnapshot.snapshot,
    checkUp,
    checkupType: effectiveCheckupType,
  });
  if (!validSnapshot) {
    return invalidAssessmentSource(
      'v2_assessment_persistence_source_mismatch',
      'source_mismatch',
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: parsedSnapshot.snapshot.snapshotId,
        sourceType: effectiveCheckupType,
      }
    );
  }

  if (
    parsedAssessment.assessment.sourceCheckUpId !== validSnapshot.sourceCheckUpId ||
    parsedAssessment.assessment.sourceSnapshotId !== validSnapshot.snapshotId ||
    parsedAssessment.assessment.sourceSnapshotFingerprint !== validSnapshot.snapshotFingerprint
  ) {
    return invalidAssessmentSource(
      'v2_assessment_persistence_snapshot_mismatch',
      'source_mismatch',
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: validSnapshot.snapshotId,
        sourceType: effectiveCheckupType,
        snapshotFingerprint: validSnapshot.snapshotFingerprint,
        assessmentFingerprint: parsedAssessment.assessment.assessmentFingerprint,
      }
    );
  }

  if (
    !jsonEqual(
      parsedAssessment.assessment.focusProvenance.domainEvidence,
      deriveMovementProfileV2DomainEvidence(validSnapshot)
    )
  ) {
    return invalidAssessmentSource(
      'v2_assessment_persistence_snapshot_mismatch',
      'source_mismatch',
      {
        checkUpId: checkUp.startedAt,
        assessmentId: parsedAssessment.assessment.assessmentId,
        snapshotId: validSnapshot.snapshotId,
        sourceType: effectiveCheckupType,
      }
    );
  }

  return {
    valid: true,
    checkupType: effectiveCheckupType,
    snapshot: validSnapshot,
    assessment: parsedAssessment.assessment,
  };
}

export function getMovementProfileV2AssessmentPersistenceEligibility(input: {
  checkUp: CheckUp;
  checkupType?: string | null;
  snapshot: unknown;
  assessment: unknown;
}): MovementProfileV2AssessmentPersistenceEligibility {
  const validation = validateMovementProfileV2AssessmentSource(input);
  if (!validation.valid) return ineligibleFromValidation(validation);
  if (validation.assessment.focus.kind !== 'domain' && validation.assessment.focus.kind !== 'balanced') {
    return ineligibleAssessment(
      'v2_assessment_persistence_focus_not_persistable',
      'focus_not_persistable',
      {
        checkUpId: input.checkUp.startedAt,
        assessmentId: validation.assessment.assessmentId,
        snapshotId: validation.snapshot.snapshotId,
        sourceType: validation.checkupType,
      }
    );
  }
  return {
    eligible: true,
    checkupType: validation.checkupType,
    snapshot: validation.snapshot,
    assessment: validation.assessment,
  };
}

export function validMovementProfileV2AssessmentForCheckUp(input: {
  checkUp: CheckUp;
  checkupType?: string | null;
  snapshot: unknown;
  assessment: unknown;
}): MovementProfileV2Assessment | null {
  const eligibility = getMovementProfileV2AssessmentPersistenceEligibility(input);
  return eligibility.eligible ? eligibility.assessment : null;
}

export function attachMovementProfileV2Assessment({
  checkUp,
  snapshot,
  assessment,
  checkupType,
}: {
  checkUp: CheckUp;
  snapshot: unknown;
  assessment: MovementProfileV2Assessment;
  checkupType?: string | null;
}): MovementProfileV2AssessmentAttachmentResult {
  const eligibility = getMovementProfileV2AssessmentPersistenceEligibility({
    checkUp,
    checkupType,
    snapshot,
    assessment,
  });
  if (!eligibility.eligible) {
    return {
      attached: false,
      status: 'rejected',
      checkUp,
      reason: eligibility.reason,
      compatibility: eligibility.compatibility,
      diagnostic: eligibility.diagnostic,
    };
  }

  const existing = (checkUp as { movementProfileV2Assessment?: unknown }).movementProfileV2Assessment;
  if (!existing) {
    return {
      attached: true,
      status: 'attached',
      checkUp: { ...checkUp, movementProfileV2Assessment: eligibility.assessment },
      snapshot: eligibility.snapshot,
      assessment: eligibility.assessment,
    };
  }

  const existingEligibility = getMovementProfileV2AssessmentPersistenceEligibility({
    checkUp,
    checkupType,
    snapshot,
    assessment: existing,
  });
  if (!existingEligibility.eligible) {
    return {
      attached: false,
      status: 'conflict',
      checkUp,
      reason: 'v2_assessment_persistence_conflict',
      compatibility: 'conflict',
      diagnostic: diagnostic('v2_assessment_persistence_conflict', {
        checkUpId: checkUp.startedAt,
        assessmentId: eligibility.assessment.assessmentId,
        snapshotId: eligibility.snapshot.snapshotId,
      }),
    };
  }

  if (existingEligibility.assessment.assessmentId !== eligibility.assessment.assessmentId) {
    return {
      attached: false,
      status: 'rejected',
      checkUp,
      existingAssessment: existingEligibility.assessment,
      reason: 'v2_assessment_persistence_conflict',
      compatibility: 'conflict',
      diagnostic: diagnostic('v2_assessment_persistence_conflict', {
        checkUpId: checkUp.startedAt,
        assessmentId: eligibility.assessment.assessmentId,
        snapshotId: eligibility.snapshot.snapshotId,
        existingAssessmentFingerprint: existingEligibility.assessment.assessmentFingerprint,
        assessmentFingerprint: eligibility.assessment.assessmentFingerprint,
      }),
    };
  }

  if (existingEligibility.assessment.assessmentFingerprint !== eligibility.assessment.assessmentFingerprint) {
    return {
      attached: false,
      status: 'conflict',
      checkUp,
      existingAssessment: existingEligibility.assessment,
      reason: 'v2_assessment_persistence_conflict',
      compatibility: 'conflict',
      diagnostic: diagnostic('v2_assessment_persistence_conflict', {
        checkUpId: checkUp.startedAt,
        assessmentId: eligibility.assessment.assessmentId,
        snapshotId: eligibility.snapshot.snapshotId,
        existingAssessmentFingerprint: existingEligibility.assessment.assessmentFingerprint,
        assessmentFingerprint: eligibility.assessment.assessmentFingerprint,
      }),
    };
  }

  return {
    attached: true,
    status: 'idempotent',
    checkUp,
    snapshot: existingEligibility.snapshot,
    assessment: existingEligibility.assessment,
  };
}

export function selectOfficialMovementProfileV2AssessmentRecords<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>(
  history: readonly TRecord[] | null | undefined
): MovementProfileV2AssessmentRecordSelection<TRecord> {
  const records: OfficialMovementProfileV2AssessmentRecord<TRecord>[] = [];
  const conflicts: MovementProfileV2AssessmentConflict<TRecord>[] = [];
  const diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[] = [];
  const byAssessmentId = new Map<string, OfficialMovementProfileV2AssessmentRecord<TRecord>>();
  const seenFingerprintsByAssessmentId = new Map<string, Set<string>>();

  const sorted = (history ?? []).slice().sort(compareHistoryRecords);
  for (const record of sorted) {
    const eligibility = getMovementProfileV2AssessmentPersistenceEligibility({
      checkUp: record.checkUp,
      checkupType: record.checkupType,
      snapshot: record.movementProfileV2Snapshot,
      assessment: record.movementProfileV2Assessment,
    });
    if (!eligibility.eligible) {
      if (record.movementProfileV2Assessment !== undefined && record.movementProfileV2Assessment !== null) {
        diagnostics.push(eligibility.diagnostic);
      }
      continue;
    }

    const candidate: OfficialMovementProfileV2AssessmentRecord<TRecord> = {
      record,
      type: eligibility.checkupType,
      snapshot: eligibility.snapshot,
      assessment: eligibility.assessment,
    };
    const seenFingerprints =
      seenFingerprintsByAssessmentId.get(candidate.assessment.assessmentId) ?? new Set<string>();
    if (seenFingerprints.has(candidate.assessment.assessmentFingerprint)) {
      continue;
    }
    seenFingerprints.add(candidate.assessment.assessmentFingerprint);
    seenFingerprintsByAssessmentId.set(candidate.assessment.assessmentId, seenFingerprints);
    const existing = byAssessmentId.get(candidate.assessment.assessmentId);
    if (!existing) {
      byAssessmentId.set(candidate.assessment.assessmentId, candidate);
      records.push(candidate);
      continue;
    }
    if (existing.assessment.assessmentFingerprint === candidate.assessment.assessmentFingerprint) {
      continue;
    }
    const conflictDiagnostic = diagnostic('v2_assessment_persistence_conflict', {
      checkUpId: candidate.record.checkUp.startedAt,
      assessmentId: candidate.assessment.assessmentId,
      snapshotId: candidate.snapshot.snapshotId,
      existingAssessmentFingerprint: existing.assessment.assessmentFingerprint,
      assessmentFingerprint: candidate.assessment.assessmentFingerprint,
    });
    conflicts.push({
      assessmentId: candidate.assessment.assessmentId,
      kept: existing,
      rejected: candidate,
      diagnostic: conflictDiagnostic,
    });
    diagnostics.push(conflictDiagnostic);
  }

  return { records, conflicts, diagnostics };
}

export function latestOfficialMovementProfileV2AssessmentRecord<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>(
  history: readonly TRecord[] | null | undefined
): OfficialMovementProfileV2AssessmentRecord<TRecord> | null {
  const records = selectOfficialMovementProfileV2AssessmentRecords(history).records;
  return records[records.length - 1] ?? null;
}

export function movementProfileV2AssessmentRecordForSourceCheckUpId<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>(
  history: readonly TRecord[] | null | undefined,
  sourceCheckUpId: string
): OfficialMovementProfileV2AssessmentRecord<TRecord> | null {
  return (
    selectOfficialMovementProfileV2AssessmentRecords(history).records.find(
      (record) => record.assessment.sourceCheckUpId === sourceCheckUpId
    ) ?? null
  );
}

export function movementProfileV2AssessmentRecordForSourceSnapshotId<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>(
  history: readonly TRecord[] | null | undefined,
  sourceSnapshotId: string
): OfficialMovementProfileV2AssessmentRecord<TRecord> | null {
  return (
    selectOfficialMovementProfileV2AssessmentRecords(history).records.find(
      (record) => record.assessment.sourceSnapshotId === sourceSnapshotId
    ) ?? null
  );
}

export function latestOfficialMovementProfileV2AssessmentBeforeCheckUp<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>(
  history: readonly TRecord[] | null | undefined,
  currentCheckUp: CheckUp
): OfficialMovementProfileV2AssessmentRecord<TRecord> | null {
  const before = selectOfficialMovementProfileV2AssessmentRecords(history).records.filter(
    (record) =>
      record.record.checkUp.startedAt < currentCheckUp.startedAt &&
      record.assessment.sourceCheckUpId < currentCheckUp.startedAt
  );
  return before[before.length - 1] ?? null;
}

export function priorMovementProfileV2FocusContextForCheckUp<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>({
  currentCheckUp,
  currentCheckupType,
  acceptedHistory,
}: {
  currentCheckUp: CheckUp;
  currentCheckupType?: string | null;
  acceptedHistory: readonly TRecord[] | null | undefined;
}): MovementProfileV2PriorFocusSelection<TRecord> {
  const type = currentCheckupType ?? sourceTypeFromCurrentArtifacts(currentCheckUp);
  const selection = selectOfficialMovementProfileV2AssessmentRecords(acceptedHistory);
  if (type !== 'official_retest') {
    return { priorFocusContext: { kind: 'none' }, diagnostics: selection.diagnostics };
  }
  const prior = selection.records
    .filter(
      (record) =>
        record.record.checkUp.startedAt < currentCheckUp.startedAt &&
        record.assessment.sourceCheckUpId < currentCheckUp.startedAt
    )
    .at(-1);
  if (!prior) {
    return { priorFocusContext: { kind: 'none' }, diagnostics: selection.diagnostics };
  }
  return {
    priorFocusContext: normalizeMovementProfileV2PriorFocusContext(prior.assessment),
    priorAssessment: prior,
    diagnostics: selection.diagnostics,
  };
}

export function materializeOfficialMovementProfileV2Artifacts<
  TRecord extends MovementProfileV2AssessmentHistoryRecord,
>(
  input: MaterializeOfficialMovementProfileV2ArtifactsInput<TRecord>
): MovementProfileV2ArtifactMaterializationResult {
  const diagnostics: MovementProfileV2AssessmentPersistenceDiagnostic[] = [];
  const eligibility = getMovementProfileV2SnapshotEligibility(input.checkUp, input.checkupType);
  if (!eligibility.eligible) {
    return {
      ok: false,
      status: 'rejected',
      checkUp: input.checkUp,
      reason: 'v2_assessment_orchestration_ineligible_source',
      diagnostics: [
        diagnostic('v2_assessment_orchestration_ineligible_source', {
          checkUpId: input.checkUp.startedAt,
          sourceType: String(input.checkupType ?? ''),
        }),
      ],
    };
  }

  let workingCheckUp = input.checkUp;
  let snapshot: StoredMovementProfileV2Snapshot | null = null;
  let createdSnapshot = false;
  const existingSnapshot = (input.checkUp as { movementProfileV2Snapshot?: unknown }).movementProfileV2Snapshot;
  if (existingSnapshot !== undefined && existingSnapshot !== null) {
    const validExisting = validMovementProfileV2SnapshotForCheckUp({
      snapshot: existingSnapshot,
      checkUp: input.checkUp,
      checkupType: eligibility.sourceType,
    });
    if (!validExisting) {
      return {
        ok: false,
        status: 'conflict',
        checkUp: input.checkUp,
        reason: 'v2_assessment_orchestration_snapshot_conflict',
        diagnostics: [
          diagnostic('v2_assessment_orchestration_snapshot_conflict', {
            checkUpId: input.checkUp.startedAt,
            sourceType: eligibility.sourceType,
          }),
        ],
      };
    }
    snapshot = validExisting;
    const expectedReferenceFingerprint = movementProfileV2ReferenceProfileFingerprint(
      normalizeMovementProfileV2ReferenceProfile(input.referenceProfile)
    );
    if (snapshot.referenceProfileFingerprint !== expectedReferenceFingerprint) {
      diagnostics.push(
        diagnostic('v2_assessment_orchestration_existing_snapshot_reference_conflict', {
          checkUpId: input.checkUp.startedAt,
          snapshotId: snapshot.snapshotId,
          snapshotFingerprint: snapshot.snapshotFingerprint,
          expectedFingerprint: expectedReferenceFingerprint,
        })
      );
    }
    const expectedSourceSetFingerprint = movementProfileV2SourceSetFingerprint(
      input.dependencies?.sources,
      input.dependencies?.transformations
    );
    if (snapshot.sourceSet.sourceSetFingerprint !== expectedSourceSetFingerprint) {
      diagnostics.push(
        diagnostic('v2_assessment_orchestration_existing_snapshot_source_set_conflict', {
          checkUpId: input.checkUp.startedAt,
          snapshotId: snapshot.snapshotId,
          snapshotFingerprint: snapshot.snapshotFingerprint,
          expectedFingerprint: expectedSourceSetFingerprint,
        })
      );
    }
  } else {
    const created = createMovementProfileV2Snapshot({
      checkUp: input.checkUp,
      checkupType: eligibility.sourceType,
      referenceProfile: input.referenceProfile,
      createdAt: input.snapshotCreatedAt,
      dependencies: input.dependencies,
    });
    if (!created.ok) {
      return {
        ok: false,
        status: 'rejected',
        checkUp: input.checkUp,
        reason: 'v2_assessment_orchestration_snapshot_creation_failed',
        diagnostics: [
          diagnostic('v2_assessment_orchestration_snapshot_creation_failed', {
            checkUpId: input.checkUp.startedAt,
            sourceType: eligibility.sourceType,
          }),
        ],
      };
    }
    const attachedSnapshot = attachMovementProfileV2Snapshot({
      checkUp: input.checkUp,
      snapshot: created.snapshot,
      checkupType: eligibility.sourceType,
    });
    if (!attachedSnapshot.attached) {
      return {
        ok: false,
        status: 'conflict',
        checkUp: input.checkUp,
        reason: 'v2_assessment_orchestration_snapshot_conflict',
        diagnostics: [
          diagnostic('v2_assessment_orchestration_snapshot_conflict', {
            checkUpId: input.checkUp.startedAt,
            snapshotId: created.snapshot.snapshotId,
            snapshotFingerprint: created.snapshot.snapshotFingerprint,
            sourceType: eligibility.sourceType,
          }),
        ],
      };
    }
    workingCheckUp = attachedSnapshot.checkUp;
    snapshot = attachedSnapshot.snapshot;
    createdSnapshot = attachedSnapshot.status === 'attached';
  }

  const existingAssessment = (workingCheckUp as { movementProfileV2Assessment?: unknown }).movementProfileV2Assessment;
  if (existingAssessment !== undefined && existingAssessment !== null) {
    const existingEligibility = getMovementProfileV2AssessmentPersistenceEligibility({
      checkUp: workingCheckUp,
      checkupType: eligibility.sourceType,
      snapshot,
      assessment: existingAssessment,
    });
    if (!existingEligibility.eligible) {
      return {
        ok: false,
        status: 'conflict',
        checkUp: workingCheckUp,
        snapshot,
        reason: 'v2_assessment_orchestration_assessment_conflict',
        diagnostics: [
          ...diagnostics,
          diagnostic('v2_assessment_orchestration_assessment_conflict', {
            checkUpId: input.checkUp.startedAt,
            snapshotId: snapshot.snapshotId,
            sourceType: eligibility.sourceType,
          }),
        ],
      };
    }
    diagnostics.push(...missingPriorArtifactDiagnostics(existingEligibility.assessment, input.acceptedHistory));
    return {
      ok: true,
      status: diagnostics.length > 0 ? 'conflict' : 'reused',
      checkUp: workingCheckUp,
      snapshot,
      assessment: existingEligibility.assessment,
      createdSnapshot,
      createdAssessment: false,
      diagnostics,
    };
  }

  const prior = priorMovementProfileV2FocusContextForCheckUp({
    currentCheckUp: workingCheckUp,
    currentCheckupType: eligibility.sourceType,
    acceptedHistory: input.acceptedHistory,
  });
  diagnostics.push(...prior.diagnostics);
  const createdAssessment = createMovementProfileV2Assessment({
    checkUp: workingCheckUp,
    snapshot,
    lifeGoal: input.lifeGoal,
    priorFocus: prior.priorFocusContext,
    createdAt: input.assessmentCreatedAt,
  });
  if (!createdAssessment.ok) {
    return {
      ok: false,
      status: 'rejected',
      checkUp: workingCheckUp,
      snapshot,
      reason: 'v2_assessment_orchestration_assessment_creation_failed',
      diagnostics: [
        ...diagnostics,
        diagnostic('v2_assessment_orchestration_assessment_creation_failed', {
          checkUpId: input.checkUp.startedAt,
          snapshotId: snapshot.snapshotId,
          sourceType: eligibility.sourceType,
        }),
      ],
    };
  }

  const attachedAssessment = attachMovementProfileV2Assessment({
    checkUp: workingCheckUp,
    snapshot,
    assessment: createdAssessment.assessment,
    checkupType: eligibility.sourceType,
  });
  if (!attachedAssessment.attached) {
    return {
      ok: false,
      status: attachedAssessment.status,
      checkUp: workingCheckUp,
      snapshot,
      assessment: createdAssessment.assessment,
      reason: 'v2_assessment_orchestration_assessment_conflict',
      diagnostics: [
        ...diagnostics,
        diagnostic('v2_assessment_orchestration_assessment_conflict', {
          checkUpId: input.checkUp.startedAt,
          snapshotId: snapshot.snapshotId,
          assessmentId: createdAssessment.assessment.assessmentId,
          sourceType: eligibility.sourceType,
        }),
      ],
    };
  }

  return {
    ok: true,
    status: diagnostics.length > 0 ? 'conflict' : createdSnapshot ? 'materialized' : 'reused',
    checkUp: attachedAssessment.checkUp,
    snapshot: attachedAssessment.snapshot,
    assessment: attachedAssessment.assessment,
    createdSnapshot,
    createdAssessment: attachedAssessment.status === 'attached',
    diagnostics,
  };
}

function missingPriorArtifactDiagnostics<TRecord extends MovementProfileV2AssessmentHistoryRecord>(
  assessment: MovementProfileV2Assessment,
  history: readonly TRecord[] | null | undefined
): MovementProfileV2AssessmentPersistenceDiagnostic[] {
  const prior = assessment.focusProvenance.priorFocusContext;
  if (prior.kind === 'none') return [];
  const selection = selectOfficialMovementProfileV2AssessmentRecords(history);
  const found = selection.records.some(
    (record) =>
      record.assessment.assessmentId === prior.sourceAssessmentId &&
      record.assessment.assessmentFingerprint === prior.sourceAssessmentFingerprint
  );
  return found
    ? selection.diagnostics
    : [
        ...selection.diagnostics,
        diagnostic('v2_assessment_orchestration_missing_prior_artifact', {
          checkUpId: assessment.sourceCheckUpId,
          assessmentId: assessment.assessmentId,
          snapshotId: assessment.sourceSnapshotId,
        }),
      ];
}

function compareHistoryRecords<TRecord extends MovementProfileV2AssessmentHistoryRecord>(
  a: TRecord,
  b: TRecord
): number {
  const byCheckUp = a.checkUp.startedAt.localeCompare(b.checkUp.startedAt);
  if (byCheckUp !== 0) return byCheckUp;
  const aAssessment = parseMovementProfileV2Assessment(a.movementProfileV2Assessment);
  const bAssessment = parseMovementProfileV2Assessment(b.movementProfileV2Assessment);
  const byCreatedAt = (aAssessment.ok ? aAssessment.assessment.createdAt : '').localeCompare(
    bAssessment.ok ? bAssessment.assessment.createdAt : ''
  );
  if (byCreatedAt !== 0) return byCreatedAt;
  return (aAssessment.ok ? aAssessment.assessment.assessmentFingerprint : '').localeCompare(
    bAssessment.ok ? bAssessment.assessment.assessmentFingerprint : ''
  );
}

function sourceTypeFromCurrentArtifacts(checkUp: CheckUp): string | null {
  const assessment = parseMovementProfileV2Assessment(
    (checkUp as { movementProfileV2Assessment?: unknown }).movementProfileV2Assessment
  );
  if (assessment.ok) return assessment.assessment.sourceCheckUpType;
  const snapshot = parseStoredMovementProfileV2Snapshot(
    (checkUp as { movementProfileV2Snapshot?: unknown }).movementProfileV2Snapshot
  );
  return snapshot.ok ? snapshot.snapshot.sourceCheckUpType : null;
}

function assessmentCompatibilityFromParseCode(code: string): MovementProfileV2AssessmentCompatibility {
  if (code === 'v2_assessment_future_schema') return 'future_schema';
  if (code === 'v2_assessment_fingerprint_invalid') return 'fingerprint_invalid';
  return 'malformed';
}

function diagnosticCodeFromAssessmentCompatibility(
  compatibility: MovementProfileV2AssessmentCompatibility
): MovementProfileV2AssessmentPersistenceDiagnosticCode {
  if (compatibility === 'future_schema') return 'v2_assessment_persistence_future_schema';
  if (compatibility === 'fingerprint_invalid') return 'v2_assessment_persistence_fingerprint_invalid';
  if (compatibility === 'missing') return 'v2_assessment_persistence_missing';
  return 'v2_assessment_persistence_malformed';
}

function invalidAssessmentSource(
  reason: MovementProfileV2AssessmentPersistenceDiagnosticCode,
  compatibility: MovementProfileV2AssessmentCompatibility,
  details: Omit<MovementProfileV2AssessmentPersistenceDiagnostic, 'code' | 'policyFingerprint'>
): Extract<MovementProfileV2AssessmentSourceValidation, { valid: false }> {
  return {
    valid: false,
    reason,
    compatibility,
    diagnostic: diagnostic(reason, details),
  };
}

function ineligibleFromValidation(
  validation: Extract<MovementProfileV2AssessmentSourceValidation, { valid: false }>
): Extract<MovementProfileV2AssessmentPersistenceEligibility, { eligible: false }> {
  return {
    eligible: false,
    reason: validation.reason,
    compatibility: validation.compatibility,
    diagnostic: validation.diagnostic,
  };
}

function ineligibleAssessment(
  reason: MovementProfileV2AssessmentPersistenceDiagnosticCode,
  compatibility: MovementProfileV2AssessmentCompatibility,
  details: Omit<MovementProfileV2AssessmentPersistenceDiagnostic, 'code' | 'policyFingerprint'>
): Extract<MovementProfileV2AssessmentPersistenceEligibility, { eligible: false }> {
  return {
    eligible: false,
    reason,
    compatibility,
    diagnostic: diagnostic(reason, details),
  };
}

function diagnostic(
  code: MovementProfileV2AssessmentPersistenceDiagnosticCode,
  details: Omit<MovementProfileV2AssessmentPersistenceDiagnostic, 'code' | 'policyFingerprint'> = {}
): MovementProfileV2AssessmentPersistenceDiagnostic {
  return {
    code,
    policyFingerprint: MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_FINGERPRINT,
    ...details,
  };
}

function isOfficialV2SourceType(value: unknown): value is MovementProfileV2OfficialSourceCheckUpType {
  return value === 'baseline' || value === 'baseline_retake' || value === 'official_retest';
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function movementProfileV2AssessmentSchemaVersion(value: unknown): number | null {
  const parsed = parseMovementProfileV2Assessment(value);
  return parsed.ok ? parsed.assessment.schemaVersion : null;
}

export function movementProfileV2AssessmentStorageSummary(value: unknown): {
  schemaVersion: number | null;
  kind: typeof MOVEMENT_PROFILE_V2_ASSESSMENT_KIND | null;
  expectedSchemaVersion: typeof MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION;
  expectedSnapshotSchemaVersion: typeof MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION;
} {
  const parsed = parseMovementProfileV2Assessment(value);
  return {
    schemaVersion: parsed.ok ? parsed.assessment.schemaVersion : null,
    kind: parsed.ok ? parsed.assessment.kind : null,
    expectedSchemaVersion: MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
    expectedSnapshotSchemaVersion: MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION,
  };
}
