import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  RELEASE_FLAG_ENV_NAMES,
  auditBetaReleaseFlags,
  parseExactReleaseFlag,
  parseReleaseFlagAuditEnv,
  type BetaReleaseFlagAuditFlags,
  type ReleaseFlagEnvName,
} from '../releaseFlagAudit';

const SAFE_FLAGS: BetaReleaseFlagAuditFlags = {
  legacyV1RollbackEnabled: false,
  unifiedMovementCheckUpEnabled: false,
  movementProfileV2InternalEnabled: false,
  movementProfileV2DiagnosticsEnabled: false,
  poseLatencyDiagnosticsEnabled: false,
  allowDiagnosticsInRelease: false,
  poseRendererBenchmarksEnabled: false,
  devMockDataEnabled: false,
};

describe('beta/release flag audit', () => {
  it('treats safe beta defaults as shippable while public V2 remains expected', () => {
    expect(
      auditBetaReleaseFlags({
        buildProfile: 'beta',
        platform: 'ios',
        flags: SAFE_FLAGS,
      })
    ).toEqual({
      status: 'safe',
      diagnostics: [
        { code: 'beta_release_profile_audited', detail: 'beta:ios' },
        { code: 'public_v2_default_is_expected' },
        { code: 'apple_sign_in_flag_not_internal' },
        { code: 'observability_flag_not_internal' },
        { code: 'pose_renderer_benchmark_flag_not_present' },
      ],
    });
  });

  it('reports each unsafe beta/release exposure reason without blocking dev builds', () => {
    expect(
      auditBetaReleaseFlags({
        buildProfile: 'production',
        flags: {
          ...SAFE_FLAGS,
          legacyV1RollbackEnabled: true,
          movementProfileV2InternalEnabled: true,
          movementProfileV2DiagnosticsEnabled: true,
          poseLatencyDiagnosticsEnabled: true,
          allowDiagnosticsInRelease: true,
          poseRendererBenchmarksEnabled: true,
          devMockDataEnabled: true,
        },
      })
    ).toEqual({
      status: 'unsafe',
      reasons: [
        'legacy_v1_rollback_enabled',
        'movement_profile_v2_internal_enabled',
        'movement_profile_v2_diagnostics_enabled',
        'pose_latency_diagnostics_enabled',
        'release_diagnostics_allowed',
        'pose_renderer_benchmarks_enabled',
        'dev_mock_data_enabled',
      ],
    });

    expect(
      auditBetaReleaseFlags({
        buildProfile: 'development',
        flags: {
          ...SAFE_FLAGS,
          movementProfileV2InternalEnabled: true,
          poseLatencyDiagnosticsEnabled: true,
        },
      })
    ).toEqual({
      status: 'safe',
      diagnostics: [{ code: 'development_profile_not_audited', detail: 'development' }],
    });
  });

  it('parses every release/security boolean flag as exact 1 only', () => {
    const names = Object.values(RELEASE_FLAG_ENV_NAMES);

    for (const name of names) {
      expect(parseExactReleaseFlag(undefined)).toBe(false);
      expect(parseExactReleaseFlag('')).toBe(false);
      expect(parseExactReleaseFlag('0')).toBe(false);
      expect(parseExactReleaseFlag('true')).toBe(false);
      expect(parseExactReleaseFlag('yes')).toBe(false);
      expect(parseExactReleaseFlag(' 1 ')).toBe(false);
      expect(parseExactReleaseFlag(true)).toBe(false);
      expect(parseReleaseFlagAuditEnv({ [name]: '1' } as Record<ReleaseFlagEnvName, unknown>)).toEqual(
        expect.objectContaining(flagExpectationFor(name))
      );
    }
  });

  it('keeps documented beta/release defaults off for internal, diagnostic, rollback, and mock surfaces', () => {
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');

    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.legacyV1Rollback}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.movementProfileV2Internal}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.movementProfileV2Diagnostics}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.allowDiagnosticsInRelease}=0`);
    expect(envExample).not.toContain(`${RELEASE_FLAG_ENV_NAMES.poseRendererBenchmarks}=1`);
  });
});

function flagExpectationFor(name: ReleaseFlagEnvName): Partial<BetaReleaseFlagAuditFlags> {
  switch (name) {
    case RELEASE_FLAG_ENV_NAMES.legacyV1Rollback:
      return { legacyV1RollbackEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.unifiedMovementCheckUp:
      return { unifiedMovementCheckUpEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.movementProfileV2Internal:
      return { movementProfileV2InternalEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.movementProfileV2Diagnostics:
      return { movementProfileV2DiagnosticsEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics:
      return { poseLatencyDiagnosticsEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.allowDiagnosticsInRelease:
      return { allowDiagnosticsInRelease: true };
    case RELEASE_FLAG_ENV_NAMES.poseRendererBenchmarks:
      return { poseRendererBenchmarksEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.appleSignIn:
      return { appleSignInEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.sentry:
      return { sentryEnabled: true };
  }
}
