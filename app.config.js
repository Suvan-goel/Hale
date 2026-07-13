const appJson = require('./app.json');
const brand = require('./brand/brand');

const enablePoseLatencyDiagnostics =
  process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS === '1';
const allowDiagnosticsInRelease =
  process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE === '1';
const enableSentry = process.env.EXPO_PUBLIC_ENABLE_SENTRY === '1';
const betaReleaseBuildProfiles = new Set([
  'preview',
  'beta',
  'internal',
  'playinternal',
  'play-internal',
  'production',
  'release',
]);

const unsafeBetaReleaseFlags = [
  {
    env: 'EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL',
    reason: 'movement_profile_v2_internal_enabled',
  },
  {
    env: 'EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS',
    reason: 'movement_profile_v2_diagnostics_enabled',
  },
  {
    env: 'EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS',
    reason: 'pose_latency_diagnostics_enabled',
  },
  {
    env: 'EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE',
    reason: 'release_diagnostics_allowed',
  },
  {
    env: 'EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION',
    reason: 'clarity_dimension_enabled',
  },
  {
    env: 'EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN',
    reason: 'apple_sign_in_nonce_state_not_approved',
  },
];

function isBetaReleaseBuildProfile(value) {
  return typeof value === 'string' && betaReleaseBuildProfiles.has(value.trim().toLowerCase());
}

function assertSafeBetaReleaseFlags() {
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  if (!isBetaReleaseBuildProfile(buildProfile)) return;

  const reasons = unsafeBetaReleaseFlags
    .filter((flag) => process.env[flag.env] === '1')
    .map((flag) => flag.reason);
  if (reasons.length === 0) return;

  throw new Error(
    `[pearl-release-flag-audit] Unsafe beta/release build profile "${buildProfile}" has enabled internal/diagnostic flags: ${reasons.join(', ')}. Set safe beta overrides to 0 or use a development diagnostics build.`
  );
}

function assertOnlineProfileReleaseConfig() {
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  if (!isBetaReleaseBuildProfile(buildProfile)) return;

  const required = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  ].filter((name) => !process.env[name]?.trim());
  if (process.env.EXPO_PUBLIC_ENABLE_ONLINE_PROFILES === '1') {
    if (!process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim()) {
      required.push('EXPO_PUBLIC_PRIVACY_POLICY_URL');
    }
    const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
    if (privacyUrl && !/^https:\/\//i.test(privacyUrl)) {
      required.push('EXPO_PUBLIC_PRIVACY_POLICY_URL_HTTPS');
    }
  }
  if (required.length > 0) {
    throw new Error(
      `[pearl-online-profile-audit] Build profile "${buildProfile}" enables online profiles without required release configuration: ${required.join(', ')}.`
    );
  }
}

module.exports = ({ config }) => {
  assertSafeBetaReleaseFlags();
  assertOnlineProfileReleaseConfig();
  const plugins = enableSentry
    ? appJson.expo.plugins
    : appJson.expo.plugins.filter((plugin) => plugin !== '@sentry/react-native/expo');

  return {
    ...config,
    ...appJson.expo,
    // Display name comes from the brand token (REPOSITION_TDD §3.1 / F6);
    // slug/scheme stay in app.json deliberately — infra identity, not brand.
    name: brand.appName,
    plugins,
    extra: {
      ...config.extra,
      ...appJson.expo.extra,
      enablePoseLatencyDiagnostics,
      allowDiagnosticsInRelease,
    },
  };
};
