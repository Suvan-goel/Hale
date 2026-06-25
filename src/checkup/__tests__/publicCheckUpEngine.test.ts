import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { selectPublicMovementCheckUpLaunch } from '../publicCheckUpEngine';

describe('public Movement Check-Up engine selector', () => {
  it('keeps public baseline on legacy V1 while the release flag is off', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        releaseEnabled: false,
      })
    ).toEqual({
      status: 'ready',
      engine: 'legacy_v1',
      sourceType: 'baseline',
      entryContext: 'standard',
    });
  });

  it('routes public onboarding baseline to the unified Movement Profile when the release flag is on', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        entryContext: 'onboarding',
        releaseEnabled: true,
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
        releaseEnabled: true,
        hasAcceptedMovementProfileV2Baseline: true,
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline_retake',
    });
  });

  it('keeps non-baseline public check-up entries on the legacy engine', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'manual_extra',
        releaseEnabled: true,
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'legacy_v1',
      sourceType: 'manual_extra',
    });
  });

  it('fails closed for unknown public check-up sources', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'legacy_unknown',
        releaseEnabled: true,
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
        releaseEnabled: true,
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

  it('keeps V2-origin official retests unavailable until release, schedule, and source-artifact gates pass', () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        releaseEnabled: false,
        activeBlockOriginKind: 'movement_profile_v2_assessment',
        movementProfileV2OfficialRetestScheduleStatus: 'retest_due',
        hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_release_disabled',
    });

    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        releaseEnabled: true,
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
        releaseEnabled: true,
        activeBlockOriginKind: 'movement_profile_v2_assessment',
        movementProfileV2OfficialRetestScheduleStatus: 'retest_due',
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'v2_official_retest_source_artifacts_unavailable',
    });
  });

  it('wires the app through the release flag, selector, unified route, and recovery route', () => {
    const app = readFileSync(join(process.cwd(), 'App.tsx'), 'utf8');

    expect(app).toContain('UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED');
    expect(app).toContain('selectPublicMovementCheckUpLaunch');
    expect(app).toContain('beginUnifiedMovementProfileV2Public');
    expect(app).toContain('movement-profile-v2-unified-checkup');
    expect(app).toContain('movement-profile-v2-retest-unavailable');
    expect(app).toContain('reason: launchDecision.reason');
  });

  it('keeps public unified check-up screens free of internal-facing labels', () => {
    const unifiedCheckUp = readFileSync(
      join(process.cwd(), 'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx'),
      'utf8'
    );
    const referenceDetails = readFileSync(
      join(process.cwd(), 'src/screens/MovementProfileV2ReferenceDetailsScreen.tsx'),
      'utf8'
    );

    expect(unifiedCheckUp).not.toContain('Leave internal Movement Profile');
    expect(referenceDetails).not.toContain('Back to internal Movement Profile');
  });
});
