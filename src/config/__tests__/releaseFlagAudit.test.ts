import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  RELEASE_FLAG_ENV_NAMES,
  auditBetaReleaseFlags,
  isBetaReleaseBuildProfile,
  parseExactReleaseFlag,
  parseReleaseFlagAuditEnv,
  type BetaReleaseFlagAuditFlags,
  type ReleaseFlagEnvName,
} from '../releaseFlagAudit';

const SAFE_FLAGS: BetaReleaseFlagAuditFlags = {
  movementProfileV2InternalEnabled: false,
  movementProfileV2DiagnosticsEnabled: false,
  poseLatencyDiagnosticsEnabled: false,
  allowDiagnosticsInRelease: false,
  clarityDimensionEnabled: false,
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
        { code: 'apple_sign_in_flag_not_internal' },
        { code: 'observability_flag_not_internal' },
      ],
    });
  });

  it('reports each unsafe beta/release exposure reason without blocking dev builds', () => {
    expect(
      auditBetaReleaseFlags({
        buildProfile: 'production',
        flags: {
          ...SAFE_FLAGS,
          movementProfileV2InternalEnabled: true,
          movementProfileV2DiagnosticsEnabled: true,
          poseLatencyDiagnosticsEnabled: true,
          allowDiagnosticsInRelease: true,
          devMockDataEnabled: true,
        },
      })
    ).toEqual({
      status: 'unsafe',
      reasons: [
        'movement_profile_v2_internal_enabled',
        'movement_profile_v2_diagnostics_enabled',
        'pose_latency_diagnostics_enabled',
        'release_diagnostics_allowed',
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

  it('treats tester-facing build profiles as beta/release-like', () => {
    for (const profile of [
      'preview',
      'beta',
      'internal',
      'playInternal',
      'play-internal',
      'production',
      'release',
    ]) {
      expect(isBetaReleaseBuildProfile(profile)).toBe(true);
      expect(isBetaReleaseBuildProfile(` ${profile.toUpperCase()} `)).toBe(true);
    }

    expect(isBetaReleaseBuildProfile(undefined)).toBe(false);
    expect(isBetaReleaseBuildProfile('development')).toBe(false);
    expect(isBetaReleaseBuildProfile('local-dev')).toBe(false);
  });

  it.each([
    ['internal harness', { movementProfileV2InternalEnabled: true }, 'movement_profile_v2_internal_enabled'],
    ['Movement Profile diagnostics', { movementProfileV2DiagnosticsEnabled: true }, 'movement_profile_v2_diagnostics_enabled'],
    ['pose diagnostics', { poseLatencyDiagnosticsEnabled: true }, 'pose_latency_diagnostics_enabled'],
    ['release diagnostics', { allowDiagnosticsInRelease: true }, 'release_diagnostics_allowed'],
  ] as const)('blocks unsafe beta profile when %s is enabled', (_label, override, reason) => {
    expect(
      auditBetaReleaseFlags({
        buildProfile: 'beta',
        flags: { ...SAFE_FLAGS, ...override },
      })
    ).toEqual({ status: 'unsafe', reasons: [reason] });
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
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.movementProfileV2Internal}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.movementProfileV2Diagnostics}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics}=0`);
    expect(envExample).toContain(`${RELEASE_FLAG_ENV_NAMES.allowDiagnosticsInRelease}=0`);
    expect(packageJson.scripts?.['verify:safe-beta-flags']).toContain('EAS_BUILD_PROFILE=beta');
    expect(packageJson.scripts?.['verify:safe-beta-flags']).toContain(
      `${RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics}=0`
    );
    expect(packageJson.scripts?.['verify:play-internal-flags']).toContain(
      'EAS_BUILD_PROFILE=playInternal'
    );
    expect(packageJson.scripts?.['verify:play-internal-flags']).toContain(
      `${RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics}=0`
    );
  });

  it('fails app config fast for unsafe beta/release env while preserving local dev diagnostics', () => {
    expect(() =>
      resolveAppConfigExtra({
        EAS_BUILD_PROFILE: 'beta',
        EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
      })
    ).toThrow(/pose_latency_diagnostics_enabled/);

    expect(() =>
      resolveAppConfigExtra({
        EAS_BUILD_PROFILE: 'production',
        EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE: '1',
      })
    ).toThrow(/release_diagnostics_allowed/);

    expect(
      resolveAppConfigExtra({
        EAS_BUILD_PROFILE: 'beta',
        EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL: '0',
        EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS: '0',
        EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '0',
        EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE: '0',
      })
    ).toMatchObject({
      enablePoseLatencyDiagnostics: false,
      allowDiagnosticsInRelease: false,
    });

    expect(
      resolveAppConfigExtra({
        EAS_BUILD_PROFILE: 'development',
        EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS: '1',
        EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE: '1',
      })
    ).toMatchObject({
      enablePoseLatencyDiagnostics: true,
      allowDiagnosticsInRelease: true,
    });
  });
});

function resolveAppConfigExtra(env: Record<string, string | undefined>) {
  const names = [
    'EAS_BUILD_PROFILE',
    ...Object.values(RELEASE_FLAG_ENV_NAMES),
  ];
  const original = new Map(names.map((name) => [name, process.env[name]]));
  try {
    jest.resetModules();
    for (const name of names) {
      delete process.env[name];
    }
    for (const [name, value] of Object.entries(env)) {
      if (value !== undefined) process.env[name] = value;
    }
    const buildConfig = require('../../../app.config.js') as (input: {
      config: { extra?: Record<string, unknown> };
    }) => { extra: Record<string, unknown> };
    return buildConfig({ config: { extra: {} } }).extra;
  } finally {
    jest.resetModules();
    for (const [name, value] of original.entries()) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

function flagExpectationFor(name: ReleaseFlagEnvName): Partial<BetaReleaseFlagAuditFlags> {
  switch (name) {
    case RELEASE_FLAG_ENV_NAMES.movementProfileV2Internal:
      return { movementProfileV2InternalEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.movementProfileV2Diagnostics:
      return { movementProfileV2DiagnosticsEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics:
      return { poseLatencyDiagnosticsEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.allowDiagnosticsInRelease:
      return { allowDiagnosticsInRelease: true };
    case RELEASE_FLAG_ENV_NAMES.clarityDimension:
      return { clarityDimensionEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.appleSignIn:
      return { appleSignInEnabled: true };
    case RELEASE_FLAG_ENV_NAMES.sentry:
      return { sentryEnabled: true };
  }
}
