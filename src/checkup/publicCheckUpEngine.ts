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
  | 'v2_official_retest_release_disabled'
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
  releaseEnabled: boolean;
  hasAcceptedMovementProfileV2Baseline?: boolean;
  hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts?: boolean;
  movementProfileV2OfficialRetestScheduleStatus?: PublicMovementCheckUpScheduleStatus | null;
  hasMovementProfileV2OfficialRetestActiveBlockConflict?: boolean;
  activeBlockOriginKind?: MovementBlockOrigin['kind'] | null;
}): PublicMovementCheckUpLaunchDecision {
  const entryContext = input.entryContext ?? 'standard';

  if (
    input.sourceType === 'official_retest' &&
    input.activeBlockOriginKind === 'movement_profile_v2_assessment'
  ) {
    if (!input.releaseEnabled) {
      return {
        status: 'unavailable',
        reason: 'v2_official_retest_release_disabled',
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

  if (input.sourceType === 'legacy_unknown') {
    return {
      status: 'unavailable',
      reason: 'unsupported_public_checkup_source',
      sourceType: input.sourceType,
      entryContext,
    };
  }

  if (input.sourceType === 'baseline' || input.sourceType === 'baseline_retake') {
    const sourceType =
      input.releaseEnabled &&
      input.sourceType === 'baseline' &&
      input.hasAcceptedMovementProfileV2Baseline
        ? 'baseline_retake'
        : input.sourceType;
    return {
      status: 'ready',
      engine: input.releaseEnabled ? 'unified_movement_profile' : 'legacy_v1',
      sourceType,
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
