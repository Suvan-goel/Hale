const appJson = require('./app.json');

const enablePoseLatencyDiagnostics =
  process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS === '1';
const allowDiagnosticsInRelease =
  process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE === '1';
const enableSentry = process.env.EXPO_PUBLIC_ENABLE_SENTRY === '1';
const betaReleaseBuildProfiles = new Set(['preview', 'beta', 'internal', 'production', 'release']);

const unsafeBetaReleaseFlags = [
  {
    env: 'EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK',
    reason: 'legacy_v1_rollback_enabled',
  },
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
    env: 'EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS',
    reason: 'pose_renderer_benchmarks_enabled',
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
    `[hale-release-flag-audit] Unsafe beta/release build profile "${buildProfile}" has enabled internal/diagnostic flags: ${reasons.join(', ')}. Set safe beta overrides to 0 or use a development diagnostics build.`
  );
}

module.exports = ({ config }) => {
  assertSafeBetaReleaseFlags();
  const plugins = enableSentry
    ? appJson.expo.plugins
    : appJson.expo.plugins.filter((plugin) => plugin !== '@sentry/react-native/expo');

  return {
    ...config,
    ...appJson.expo,
    plugins,
    extra: {
      ...config.extra,
      ...appJson.expo.extra,
      enablePoseLatencyDiagnostics,
      allowDiagnosticsInRelease,
    },
  };
};
