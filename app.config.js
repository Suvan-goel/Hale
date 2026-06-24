const appJson = require('./app.json');

const enablePoseLatencyDiagnostics =
  process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS === '1';
const allowDiagnosticsInRelease =
  process.env.EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE === '1';

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  extra: {
    ...config.extra,
    ...appJson.expo.extra,
    enablePoseLatencyDiagnostics,
    allowDiagnosticsInRelease,
  },
});
