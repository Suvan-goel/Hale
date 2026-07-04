import { selectPublicMovementCheckUpLaunch } from '../publicCheckUpEngine';

describe('public movement check-up launch decision', () => {
  it('always launches practice check-ups on the unified engine', () => {
    expect(
      selectPublicMovementCheckUpLaunch({ sourceType: 'manual_extra_v2' })
    ).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'manual_extra_v2',
      entryContext: 'standard',
    });
  });

  it('launches a first baseline on the unified engine and keeps the entry context', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        entryContext: 'onboarding',
      })
    ).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline',
      entryContext: 'onboarding',
    });
  });

  it('upgrades a repeated baseline to a retake once accepted V2 state exists', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        hasAcceptedMovementProfileV2State: true,
      })
    ).toMatchObject({ status: 'ready', sourceType: 'baseline_retake' });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        hasAcceptedMovementProfileV2Baseline: true,
      })
    ).toMatchObject({ status: 'ready', sourceType: 'baseline_retake' });
  });

  it('routes malformed V2 state to recovery before any launch', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        hasMalformedMovementProfileV2State: true,
      })
    ).toEqual({
      status: 'unavailable',
      reason: 'movement_profile_v2_state_recovery_required',
      sourceType: 'baseline',
      entryContext: 'standard',
    });
  });

  it('gates the official retest on schedule, artifacts, and block origin', () => {
    const base = {
      sourceType: 'official_retest' as const,
      activeBlockOriginKind: 'movement_profile_v2_assessment' as const,
      hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
      movementProfileV2OfficialRetestScheduleStatus: 'retest_due' as const,
    };

    expect(selectPublicMovementCheckUpLaunch(base)).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'official_retest',
      entryContext: 'public_official_retest',
    });

    expect(
      selectPublicMovementCheckUpLaunch({
        ...base,
        movementProfileV2OfficialRetestScheduleStatus: 'session_due',
      })
    ).toMatchObject({ status: 'unavailable', reason: 'v2_official_retest_not_due' });

    expect(
      selectPublicMovementCheckUpLaunch({
        ...base,
        hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: false,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_source_artifacts_unavailable',
    });

    expect(
      selectPublicMovementCheckUpLaunch({
        ...base,
        hasMovementProfileV2OfficialRetestActiveBlockConflict: true,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_active_block_conflict',
    });

    expect(
      selectPublicMovementCheckUpLaunch({
        ...base,
        activeBlockOriginKind: null,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_source_artifacts_unavailable',
    });
  });

  it('rejects source types with no public launch surface', () => {
    for (const sourceType of ['legacy_unknown', 'micro_check'] as const) {
      expect(selectPublicMovementCheckUpLaunch({ sourceType })).toMatchObject({
        status: 'unavailable',
        reason: 'unsupported_public_checkup_source',
      });
    }
  });
});
