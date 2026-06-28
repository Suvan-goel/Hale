import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { selectPublicMovementCheckUpLaunch } from '../publicCheckUpEngine';

describe('public Movement Check-Up engine selector', () => {
  it('routes public baseline to the unified Movement Profile without the retired release flag', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        releaseEnabled: false,
      })
    ).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline',
      entryContext: 'standard',
    });
  });

  it('routes public onboarding baseline to the unified Movement Profile by default', () => {
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

  it('uses baseline retake for a later unified public baseline after an accepted V2 baseline exists', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        releaseEnabled: false,
        hasAcceptedMovementProfileV2State: true,
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline_retake',
    });
  });

  it('keeps public manual and quick V1 entries unavailable', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'manual_extra',
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'unsupported_public_checkup_source',
      sourceType: 'manual_extra',
    });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'quick_recheck',
        legacyV1RollbackEnabled: true,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'unsupported_public_checkup_source',
      sourceType: 'quick_recheck',
    });
  });

  it('routes optional full extra check-ups through the unified V2 shell with a non-official source', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'manual_extra_v2',
        legacyV1RollbackEnabled: true,
        hasMalformedMovementProfileV2State: true,
        hasAcceptedMovementProfileV2State: true,
      })
    ).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'manual_extra_v2',
      entryContext: 'standard',
    });
  });

  it('fails closed for unknown public check-up sources', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'legacy_unknown',
      })
    ).toEqual({
      status: 'unavailable',
      reason: 'unsupported_public_checkup_source',
      sourceType: 'legacy_unknown',
      entryContext: 'standard',
    });
  });

  it('routes V2-origin official retests through the unified Movement Profile when due and source artifacts are valid', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        activeBlockOriginKind: 'movement_profile_v2_assessment',
        movementProfileV2OfficialRetestScheduleStatus: 'retest_due',
        hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
      })
    ).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'official_retest',
      entryContext: 'public_official_retest',
    });
  });

  it('keeps V2-origin official retests unavailable until schedule and source-artifact gates pass', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        releaseEnabled: false,
        activeBlockOriginKind: 'movement_profile_v2_assessment',
        movementProfileV2OfficialRetestScheduleStatus: 'training_complete_waiting_retest',
        hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_not_due',
    });

    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        releaseEnabled: false,
        activeBlockOriginKind: 'movement_profile_v2_assessment',
        movementProfileV2OfficialRetestScheduleStatus: 'retest_due',
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_source_artifacts_unavailable',
    });
  });

  it('allows legacy V1 only through the explicit rollback flag when no V2 authority exists', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        legacyV1RollbackEnabled: true,
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'legacy_v1',
      sourceType: 'baseline',
    });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        legacyV1RollbackEnabled: true,
        hasAcceptedMovementProfileV2State: true,
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline_retake',
    });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        legacyV1RollbackEnabled: true,
        activeBlockOriginKind: 'legacy_v1_assessment',
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'legacy_v1',
      sourceType: 'official_retest',
    });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        activeBlockOriginKind: 'legacy_v1_assessment',
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'legacy_v1_rollback_disabled',
    });
  });

  it('fails closed instead of rolling back when V2 state needs recovery', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        legacyV1RollbackEnabled: true,
        hasMalformedMovementProfileV2State: true,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'movement_profile_v2_state_recovery_required',
    });
  });

  it('wires the app through the rollback flag, selector, unified route, and recovery route', () => {
    const app = readFileSync(join(process.cwd(), 'App.tsx'), 'utf8');

    expect(app).not.toContain('UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED');
    expect(app).toContain('LEGACY_V1_CHECKUP_ROLLBACK_ENABLED');
    expect(app).toContain('selectPublicMovementCheckUpLaunch');
    expect(app).toContain('beginUnifiedMovementProfileV2Public');
    expect(app).toContain('movement-profile-v2-unified-checkup');
    expect(app).toContain('movement-profile-v2-retest-unavailable');
    expect(app).toContain('movementProfileV2FlowAllowed');
    expect(app).toContain("flow === 'checkup' && legacyV1CheckUpFlowAllowed");
    expect(app).toContain("flow === 'results' && legacyV1ResultsFlowAllowed");
    expect(app).toContain('reason: launchDecision.reason');
    expect(app).toContain("beginCheckUp('manual_extra_v2')");
    expect(app).toContain('movement-profile-v2-practice-results');
  });

  it('keeps optional full and optional micro check-ups out of official artifact and slot-credit paths', () => {
    const app = readFileSync(join(process.cwd(), 'App.tsx'), 'utf8');

    const rawCompleteStart = app.indexOf('function handleMovementProfileV2RawComplete');
    const finalizeStart = app.indexOf('function finalizeMovementProfileV2Raw');
    const materializeStart = app.indexOf('const materialized = materializeOfficialMovementProfileV2Artifacts');
    expect(rawCompleteStart).toBeGreaterThanOrEqual(0);
    expect(finalizeStart).toBeGreaterThan(rawCompleteStart);
    expect(materializeStart).toBeGreaterThan(finalizeStart);
    expect(app.slice(rawCompleteStart, finalizeStart)).toContain(
      'finalizeMovementProfileV2Raw(input'
    );
    expect(app.slice(finalizeStart, materializeStart)).toContain(
      'if (!isOfficialMovementProfileV2SourceType(raw.sourceType))'
    );

    const optionalMicroStart = app.indexOf("if (microCheckLaunch?.mode === 'optional')");
    const scheduledMicroStart = app.indexOf('const scheduledTarget =', optionalMicroStart);
    expect(optionalMicroStart).toBeGreaterThanOrEqual(0);
    expect(scheduledMicroStart).toBeGreaterThan(optionalMicroStart);
    const optionalMicroBranch = app.slice(optionalMicroStart, scheduledMicroStart);
    expect(optionalMicroBranch).toContain("id: `optional:${result.type}:${result.startedAt}`");
    expect(optionalMicroBranch).not.toContain('makeTrainingSessionCompletion');
    expect(optionalMicroBranch).not.toContain('recordTrainingSessionCompletion');
    expect(optionalMicroBranch).not.toContain('microCheckSlotMetadataFromTarget');
    expect(app).toContain('isOptionalMicroCheckResult');
  });

  it('keeps public unified check-up screens free of internal-facing labels', () => {
    const unifiedCheckUp = readFileSync(
      join(process.cwd(), 'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx'),
      'utf8'
    );

    expect(unifiedCheckUp).not.toContain('Leave internal Movement Profile');
  });
});
