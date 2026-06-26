import type { CheckupType, MovementBlockOrigin } from '../adherence';

export type PublicMovementCheckUpEngine = 'legacy_v1' | 'unified_movement_profile';
export type PublicMovementCheckUpEntryContext = 'standard' | 'onboarding' | 'public_official_retest';
export type PublicMovementCheckUpBaselineSourceType = Extract<
  CheckupType,
  'baseline' | 'baseline_retake'
>;
export type PublicMovementProfileV2SourceType = Extract<
  CheckupType,
  'baseline' | 'baseline_retake' | 'official_retest'
>;
export type PublicMovementCheckUpScheduleStatus =
  | 'session_due'
  | 'week_complete_waiting'
  | 'training_complete_waiting_retest'
  | 'retest_due'
  | 'block_completed'
  | 'schedule_unavailable';
export type PublicMovementCheckUpUnavailableReason =
  | 'unsupported_public_checkup_source'
  | 'movement_profile_v2_state_recovery_required'
  | 'legacy_v1_rollback_disabled'
  | 'legacy_v1_official_retest_source_unavailable'
  | 'v2_official_retest_not_due'
  | 'v2_official_retest_source_artifacts_unavailable'
  | 'v2_official_retest_active_block_conflict';

export type PublicMovementCheckUpLaunchDecision =
  | {
      status: 'ready';
      engine: 'legacy_v1';
      sourceType: CheckupType;
      entryContext: PublicMovementCheckUpEntryContext;
    }
  | {
      status: 'ready';
      engine: 'unified_movement_profile';
      sourceType: PublicMovementProfileV2SourceType;
      entryContext: PublicMovementCheckUpEntryContext;
    }
  | {
      status: 'unavailable';
      reason: PublicMovementCheckUpUnavailableReason;
      sourceType: CheckupType;
      entryContext: PublicMovementCheckUpEntryContext;
    };

export function selectPublicMovementCheckUpLaunch(input: {
  sourceType: CheckupType;
  entryContext?: PublicMovementCheckUpEntryContext;
  releaseEnabled?: boolean;
  legacyV1RollbackEnabled?: boolean;
  hasAcceptedMovementProfileV2Baseline?: boolean;
  hasAcceptedMovementProfileV2State?: boolean;
  hasPendingMovementProfileV2Continuation?: boolean;
  hasMalformedMovementProfileV2State?: boolean;
  hasMovementProfileV2BlockOrReportState?: boolean;
  hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts?: boolean;
  movementProfileV2OfficialRetestScheduleStatus?: PublicMovementCheckUpScheduleStatus | null;
  hasMovementProfileV2OfficialRetestActiveBlockConflict?: boolean;
  activeBlockOriginKind?: MovementBlockOrigin['kind'] | null;
}): PublicMovementCheckUpLaunchDecision {
  const entryContext = input.entryContext ?? 'standard';
  const hasAcceptedMovementProfileV2State =
    !!input.hasAcceptedMovementProfileV2State ||
    !!input.hasAcceptedMovementProfileV2Baseline;
  const hasMovementProfileV2AuthorityState =
    hasAcceptedMovementProfileV2State ||
    !!input.hasPendingMovementProfileV2Continuation ||
    !!input.hasMalformedMovementProfileV2State ||
    !!input.hasMovementProfileV2BlockOrReportState ||
    input.activeBlockOriginKind === 'movement_profile_v2_assessment';

  if (input.hasMalformedMovementProfileV2State) {
    return {
      status: 'unavailable',
      reason: 'movement_profile_v2_state_recovery_required',
      sourceType: input.sourceType,
      entryContext,
    };
  }

  if (
    input.sourceType === 'official_retest' &&
    input.activeBlockOriginKind === 'movement_profile_v2_assessment'
  ) {
    if (input.hasMovementProfileV2OfficialRetestActiveBlockConflict) {
      return {
        status: 'unavailable',
        reason: 'v2_official_retest_active_block_conflict',
        sourceType: input.sourceType,
        entryContext,
      };
    }
    if (input.movementProfileV2OfficialRetestScheduleStatus !== 'retest_due') {
      return {
        status: 'unavailable',
        reason: 'v2_official_retest_not_due',
        sourceType: input.sourceType,
        entryContext,
      };
    }
    if (!input.hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts) {
      return {
        status: 'unavailable',
        reason: 'v2_official_retest_source_artifacts_unavailable',
        sourceType: input.sourceType,
        entryContext,
      };
    }
    return {
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: input.sourceType,
      entryContext: 'public_official_retest',
    };
  }

  if (
    input.sourceType === 'legacy_unknown' ||
    input.sourceType === 'manual_extra' ||
    input.sourceType === 'quick_recheck' ||
    input.sourceType === 'micro_check'
  ) {
    return {
      status: 'unavailable',
      reason: 'unsupported_public_checkup_source',
      sourceType: input.sourceType,
      entryContext,
    };
  }

  if (input.sourceType === 'baseline' || input.sourceType === 'baseline_retake') {
    if (input.legacyV1RollbackEnabled && !hasMovementProfileV2AuthorityState) {
      return {
        status: 'ready',
        engine: 'legacy_v1',
        sourceType: input.sourceType,
        entryContext,
      };
    }

    const sourceType =
      input.sourceType === 'baseline' &&
      hasAcceptedMovementProfileV2State
        ? 'baseline_retake'
        : input.sourceType;
    return {
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType,
      entryContext,
    };
  }

  if (input.sourceType === 'official_retest') {
    if (hasMovementProfileV2AuthorityState) {
      return {
        status: 'unavailable',
        reason: 'v2_official_retest_source_artifacts_unavailable',
        sourceType: input.sourceType,
        entryContext,
      };
    }

    if (!input.legacyV1RollbackEnabled) {
      return {
        status: 'unavailable',
        reason: 'legacy_v1_rollback_disabled',
        sourceType: input.sourceType,
        entryContext,
      };
    }

    if (input.activeBlockOriginKind !== 'legacy_v1_assessment') {
      return {
        status: 'unavailable',
        reason: 'legacy_v1_official_retest_source_unavailable',
        sourceType: input.sourceType,
        entryContext,
      };
    }

    return {
      status: 'ready',
      engine: 'legacy_v1',
      sourceType: input.sourceType,
      entryContext,
    };
  }

  return {
    status: 'unavailable',
    reason: 'unsupported_public_checkup_source',
    sourceType: input.sourceType,
    entryContext,
  };
}
