export const RELEASE_FLAG_ENV_NAMES = {
  movementProfileV2Internal: 'EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL',
  movementProfileV2Diagnostics: 'EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS',
  poseLatencyDiagnostics: 'EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS',
  allowDiagnosticsInRelease: 'EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE',
  clarityDimension: 'EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION',
  appleSignIn: 'EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN',
  sentry: 'EXPO_PUBLIC_ENABLE_SENTRY',
} as const;

export type ReleaseFlagEnvName =
  (typeof RELEASE_FLAG_ENV_NAMES)[keyof typeof RELEASE_FLAG_ENV_NAMES];

export type ReleaseFlagUnsafeReason =
  | 'movement_profile_v2_internal_enabled'
  | 'movement_profile_v2_diagnostics_enabled'
  | 'pose_latency_diagnostics_enabled'
  | 'release_diagnostics_allowed'
  | 'clarity_dimension_enabled'
  | 'dev_mock_data_enabled';

export type SafeDiagnosticCode =
  | 'beta_release_profile_audited'
  | 'development_profile_not_audited'
  | 'observability_flag_not_internal'
  | 'apple_sign_in_flag_not_internal';

export interface SafeDiagnostic {
  code: SafeDiagnosticCode;
  detail?: string;
}

export interface BetaReleaseFlagAuditFlags {
  movementProfileV2InternalEnabled: boolean;
  movementProfileV2DiagnosticsEnabled: boolean;
  poseLatencyDiagnosticsEnabled: boolean;
  allowDiagnosticsInRelease: boolean;
  /** Clarity scoring surfaces (REPOSITION_TDD Part 2a) — dev-only until shipped. */
  clarityDimensionEnabled: boolean;
  devMockDataEnabled: boolean;
  appleSignInEnabled?: boolean;
  sentryEnabled?: boolean;
}

export interface BetaReleaseFlagAuditInput {
  buildProfile?: string | null;
  platform?: string | null;
  flags: BetaReleaseFlagAuditFlags;
}

export type BetaReleaseFlagAuditResult =
  | { status: 'safe'; diagnostics: readonly SafeDiagnostic[] }
  | { status: 'unsafe'; reasons: readonly ReleaseFlagUnsafeReason[] };

export type ReleaseFlagRawEnv = Partial<Record<ReleaseFlagEnvName, unknown>>;

const BETA_RELEASE_BUILD_PROFILES = new Set([
  'preview',
  'beta',
  'internal',
  'playinternal',
  'play-internal',
  'production',
  'release',
]);

export function parseExactReleaseFlag(value: unknown): boolean {
  return value === '1';
}

export function parseReleaseFlagAuditEnv(env: ReleaseFlagRawEnv): BetaReleaseFlagAuditFlags {
  return {
    movementProfileV2InternalEnabled: parseExactReleaseFlag(
      env[RELEASE_FLAG_ENV_NAMES.movementProfileV2Internal]
    ),
    movementProfileV2DiagnosticsEnabled: parseExactReleaseFlag(
      env[RELEASE_FLAG_ENV_NAMES.movementProfileV2Diagnostics]
    ),
    poseLatencyDiagnosticsEnabled: parseExactReleaseFlag(
      env[RELEASE_FLAG_ENV_NAMES.poseLatencyDiagnostics]
    ),
    allowDiagnosticsInRelease: parseExactReleaseFlag(
      env[RELEASE_FLAG_ENV_NAMES.allowDiagnosticsInRelease]
    ),
    clarityDimensionEnabled: parseExactReleaseFlag(env[RELEASE_FLAG_ENV_NAMES.clarityDimension]),
    appleSignInEnabled: parseExactReleaseFlag(env[RELEASE_FLAG_ENV_NAMES.appleSignIn]),
    sentryEnabled: parseExactReleaseFlag(env[RELEASE_FLAG_ENV_NAMES.sentry]),
    devMockDataEnabled: false,
  };
}

export function auditBetaReleaseFlags(
  input: BetaReleaseFlagAuditInput
): BetaReleaseFlagAuditResult {
  if (isDevelopmentBuildProfile(input.buildProfile)) {
    return {
      status: 'safe',
      diagnostics: [{ code: 'development_profile_not_audited', detail: input.buildProfile ?? '' }],
    };
  }

  const reasons: ReleaseFlagUnsafeReason[] = [];
  if (input.flags.movementProfileV2InternalEnabled) {
    reasons.push('movement_profile_v2_internal_enabled');
  }
  if (input.flags.movementProfileV2DiagnosticsEnabled) {
    reasons.push('movement_profile_v2_diagnostics_enabled');
  }
  if (input.flags.poseLatencyDiagnosticsEnabled) reasons.push('pose_latency_diagnostics_enabled');
  if (input.flags.allowDiagnosticsInRelease) reasons.push('release_diagnostics_allowed');
  if (input.flags.clarityDimensionEnabled) reasons.push('clarity_dimension_enabled');
  if (input.flags.devMockDataEnabled) reasons.push('dev_mock_data_enabled');

  if (reasons.length > 0) {
    return { status: 'unsafe', reasons };
  }

  return {
    status: 'safe',
    diagnostics: [
      {
        code: 'beta_release_profile_audited',
        detail: [input.buildProfile ?? 'unspecified', input.platform ?? 'all'].join(':'),
      },
      { code: 'apple_sign_in_flag_not_internal' },
      { code: 'observability_flag_not_internal' },
    ],
  };
}

export function isBetaReleaseBuildProfile(buildProfile: string | null | undefined): boolean {
  if (!buildProfile) return false;
  return BETA_RELEASE_BUILD_PROFILES.has(buildProfile.trim().toLowerCase());
}

function isDevelopmentBuildProfile(buildProfile: string | null | undefined): boolean {
  if (!buildProfile) return false;
  const normalized = buildProfile.trim().toLowerCase();
  return normalized === 'development' || normalized === 'dev' || normalized === 'local-dev';
}
