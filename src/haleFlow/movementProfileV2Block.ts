import {
  LOCAL_USER_ID,
  addDaysIso,
  isMovementDomain,
  movementDomainToTrainingPrimaryDomain,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementDomain,
} from '../adherence';
import type { CheckUp } from '../checkup';
import {
  createBalancedSessionTemplates,
  createSessionTemplatesForFocus,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION,
} from '../training';
import {
  MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
  MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
  parseMovementProfileV2Assessment,
  parseStoredMovementProfileV2Snapshot,
  validateMovementProfileV2AssessmentSource,
  type MovementProfileV2Assessment,
  type MovementProfileV2Interpretation,
  type StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';

export const MOVEMENT_PROFILE_V2_BLOCK_CREATION_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_BLOCK_CREATION_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-block-creation-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_BLOCK_CREATION_POLICY_VERSION,
    assessmentSchemaVersion: MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
    focusPolicyVersion: MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
    focusPolicyFingerprint: MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT,
    id: 'movement-block-v2:<encoded-assessment-id>',
    reuse: 'same-id-same-fingerprint',
    failClosed: [
      'malformed',
      'source_mismatch',
      'needs_retake',
      'future_policy',
      'active_block_conflict',
      'immutable_conflict',
    ],
    schedule: { weeks: 4, sessionsPerWeek: 3, totalPlannedSessions: 12 },
    balancedTemplates: {
      version: MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION,
      fingerprint: MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT,
    },
  }
);

export type MovementProfileV2BlockMaterializationFailureReason =
  | 'v2_block_malformed_snapshot'
  | 'v2_block_malformed_assessment'
  | 'v2_block_future_policy'
  | 'v2_block_source_mismatch'
  | 'v2_block_needs_retake'
  | 'v2_block_unsupported_focus_domain'
  | 'v2_block_active_block_conflict'
  | 'v2_block_immutable_conflict';

export type MovementProfileV2BlockMaterializationResult =
  | {
      ok: true;
      status: 'created' | 'reused';
      block: MovementBlock;
      adherence: AdherenceStoreState;
      blockFingerprint: string;
    }
  | {
      ok: false;
      reason: MovementProfileV2BlockMaterializationFailureReason;
      existingBlockId?: string;
      expectedBlockId?: string;
    };

export function movementProfileV2BlockIdForAssessment(assessmentId: string): string {
  return `movement-block-v2:${encodeURIComponent(assessmentId)}`;
}

export function materializeMovementProfileV2Block(input: {
  adherence: AdherenceStoreState;
  checkUp: CheckUp;
  checkupType?: string | null;
  snapshot: unknown;
  assessment: unknown;
  userId?: string;
  startDate: string;
}): MovementProfileV2BlockMaterializationResult {
  const parsedSnapshot = parseStoredMovementProfileV2Snapshot(input.snapshot);
  if (!parsedSnapshot.ok) {
    return {
      ok: false,
      reason: parsedSnapshot.compatibility === 'future_schema'
        ? 'v2_block_future_policy'
        : 'v2_block_malformed_snapshot',
    };
  }
  const parsedAssessment = parseMovementProfileV2Assessment(input.assessment);
  if (!parsedAssessment.ok) {
    return {
      ok: false,
      reason: parsedAssessment.diagnostic.code === 'v2_assessment_future_schema'
        ? 'v2_block_future_policy'
        : 'v2_block_malformed_assessment',
    };
  }

  const sourceValidation = validateMovementProfileV2AssessmentSource({
    checkUp: input.checkUp,
    checkupType: input.checkupType,
    snapshot: parsedSnapshot.snapshot,
    assessment: parsedAssessment.assessment,
  });
  if (!sourceValidation.valid) {
    return { ok: false, reason: 'v2_block_source_mismatch' };
  }

  const block = createMovementProfileV2Block({
    snapshot: parsedSnapshot.snapshot,
    assessment: parsedAssessment.assessment,
    userId: input.userId ?? LOCAL_USER_ID,
    startDate: input.startDate,
  });
  if (!block.ok) return block;

  const expectedBlockId = block.block.id;
  const existingSameId = input.adherence.blocks.find((item) => item.id === expectedBlockId);
  if (existingSameId) {
    if (existingSameId.blockFingerprint !== block.blockFingerprint) {
      return {
        ok: false,
        reason: 'v2_block_immutable_conflict',
        existingBlockId: existingSameId.id,
        expectedBlockId,
      };
    }
    return {
      ok: true,
      status: 'reused',
      block: existingSameId,
      adherence: input.adherence,
      blockFingerprint: block.blockFingerprint,
    };
  }

  const activeConflict = input.adherence.blocks.find(
    (item) => (item.status === 'active' || item.status === 'paused') && item.id !== expectedBlockId
  );
  if (activeConflict) {
    return {
      ok: false,
      reason: 'v2_block_active_block_conflict',
      existingBlockId: activeConflict.id,
      expectedBlockId,
    };
  }

  return {
    ok: true,
    status: 'created',
    block: block.block,
    adherence: {
      ...input.adherence,
      blocks: [...input.adherence.blocks, block.block],
    },
    blockFingerprint: block.blockFingerprint,
  };
}

function createMovementProfileV2Block(input: {
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  userId: string;
  startDate: string;
}):
  | { ok: true; block: MovementBlock; blockFingerprint: string }
  | Extract<MovementProfileV2BlockMaterializationResult, { ok: false }> {
  const focus = input.assessment.focus;
  if (focus.kind === 'needs_retake') return { ok: false, reason: 'v2_block_needs_retake' };

  const templateIds = templateIdsForAssessmentFocus(focus);
  if (templateIds.length !== 3) return { ok: false, reason: 'v2_block_unsupported_focus_domain' };
  const secondaryDomains = secondaryDomainsForFocus(focus);
  const endDate = addDaysIso(input.startDate, 28);
  const blockId = movementProfileV2BlockIdForAssessment(input.assessment.assessmentId);
  const blockBase: Omit<MovementBlock, 'blockFingerprint'> = {
    id: blockId,
    userId: input.userId,
    status: 'active',
    startDate: input.startDate,
    endDate,
    retestDate: endDate,
    ...(focus.kind === 'domain'
      ? {
          focusDomain: focus.focusDomain,
          focus: { kind: 'domain' as const, domain: focus.focusDomain },
        }
      : {
          focus: {
            kind: 'balanced' as const,
            balancedPolicyVersion: MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION,
            balancedPolicyFingerprint: MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT,
          },
        }),
    origin: {
      kind: 'movement_profile_v2_assessment',
      assessmentId: input.assessment.assessmentId,
      assessmentFingerprint: input.assessment.assessmentFingerprint,
      snapshotId: input.snapshot.snapshotId,
      snapshotFingerprint: input.snapshot.snapshotFingerprint,
      sourceCheckUpId: input.assessment.sourceCheckUpId,
      sourceCheckUpType: input.assessment.sourceCheckUpType,
      focusPolicyVersion: input.assessment.focusProvenance.focusPolicyVersion,
      focusPolicyFingerprint: input.assessment.focusProvenance.focusPolicyFingerprint,
    },
    secondaryDomains,
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    sourceCheckUpId: input.assessment.sourceCheckUpId,
    blockCreationPolicyVersion: MOVEMENT_PROFILE_V2_BLOCK_CREATION_POLICY_VERSION,
    blockCreationPolicyFingerprint: MOVEMENT_PROFILE_V2_BLOCK_CREATION_POLICY_FINGERPRINT,
    templatePolicyVersion: focus.kind === 'balanced' ? MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION : undefined,
    templatePolicyFingerprint: focus.kind === 'balanced' ? MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT : undefined,
    templateIds,
    createdAt: input.startDate,
    updatedAt: input.startDate,
  };
  const blockFingerprint = movementProfileV2BlockFingerprint(blockBase);
  return { ok: true, block: { ...blockBase, blockFingerprint }, blockFingerprint };
}

export function movementProfileV2BlockFingerprint(
  block: Omit<MovementBlock, 'blockFingerprint'> | MovementBlock
): string {
  const { blockFingerprint: _blockFingerprint, ...material } = block as MovementBlock;
  return deterministicFingerprint('mpv2-block-v1', material);
}

/**
 * Extracts the same two raw capability values the legacy CheckUpScore battery
 * exposes (chair-stand reps, single-leg hold seconds) from a V2 snapshot's
 * interpretation, for initialLadderProgressFromMeasuredCapability. Never
 * reads age. Only trusts a raw metric that resolved without an invalid
 * reason; balance_eyes_open_total is a different (cumulative) metric from
 * the single continuous hold this calibration models, so it is left null.
 */
export function measuredCapabilityFromMovementProfileV2Interpretation(
  interpretation: MovementProfileV2Interpretation | null | undefined
): { chairStandReps: number | null; singleLegHoldSec: number | null } {
  const chairMetric = interpretation?.chair.rawMetric;
  const chairStandReps =
    chairMetric &&
    chairMetric.metricId === 'chair_rises_30s' &&
    Number.isFinite(chairMetric.value) &&
    (interpretation?.chair.rawInvalidReasons.length ?? 0) === 0
      ? chairMetric.value
      : null;

  const balanceMetric = interpretation?.balance.rawMetric;
  const singleLegHoldSec =
    balanceMetric &&
    balanceMetric.metricId === 'one_leg_balance_best' &&
    Number.isFinite(balanceMetric.value) &&
    (interpretation?.balance.rawInvalidReasons.length ?? 0) === 0
      ? balanceMetric.value
      : null;

  return { chairStandReps, singleLegHoldSec };
}

function templateIdsForAssessmentFocus(focus: MovementProfileV2Assessment['focus']): string[] {
  if (focus.kind === 'domain') {
    if (!isMovementDomain(focus.focusDomain)) return [];
    return createSessionTemplatesForFocus(movementDomainToTrainingPrimaryDomain(focus.focusDomain))
      .filter((template) => template.dayLabel === 'A' || template.dayLabel === 'B' || template.dayLabel === 'C')
      .map((template) => template.id);
  }
  if (focus.kind === 'balanced') return createBalancedSessionTemplates().map((template) => template.id);
  return [];
}

function secondaryDomainsForFocus(focus: MovementProfileV2Assessment['focus']): MovementDomain[] {
  const all: MovementDomain[] = ['strength_power', 'balance', 'mobility'];
  if (focus.kind !== 'domain') return all;
  return all.filter((domain) => domain !== focus.focusDomain);
}
