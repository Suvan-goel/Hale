import type { CheckupType, MovementBlockOrigin } from '../adherence';

export type PublicMovementCheckUpEntryContext = 'standard' | 'onboarding' | 'public_official_retest';
export type PublicMovementProfileV2SourceType = Extract<
  CheckupType,
  'baseline' | 'baseline_retake' | 'official_retest' | 'manual_extra_v2'
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
  | 'v2_official_retest_not_due'
  | 'v2_official_retest_source_artifacts_unavailable'
  | 'v2_official_retest_active_block_conflict';

export type PublicMovementCheckUpLaunchDecision =
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
  hasAcceptedMovementProfileV2Baseline?: boolean;
  hasAcceptedMovementProfileV2State?: boolean;
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

  if (input.sourceType === 'manual_extra_v2') {
    return {
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: input.sourceType,
      entryContext,
    };
  }

  if (input.hasMalformedMovementProfileV2State) {
    return {
      status: 'unavailable',
      reason: 'movement_profile_v2_state_recovery_required',
      sourceType: input.sourceType,
      entryContext,
    };
  }

  if (input.sourceType === 'baseline' || input.sourceType === 'baseline_retake') {
    const sourceType =
      input.sourceType === 'baseline' && hasAcceptedMovementProfileV2State
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
    if (input.activeBlockOriginKind !== 'movement_profile_v2_assessment') {
      return {
        status: 'unavailable',
        reason: 'v2_official_retest_source_artifacts_unavailable',
        sourceType: input.sourceType,
        entryContext,
      };
    }
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

  return {
    status: 'unavailable',
    reason: 'unsupported_public_checkup_source',
    sourceType: input.sourceType,
    entryContext,
  };
}
