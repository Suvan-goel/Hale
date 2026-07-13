// Expo replaces direct `process.env.EXPO_PUBLIC_*` reads at bundle time. Keep
// this access explicit: aliasing the whole `process.env` object prevents that
// replacement and can leave release builds seeing an empty runtime object.
const ONLINE_PROFILES_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_ONLINE_PROFILES === '1';

export function isOnlineProfilesEnabled(
  env?: Record<string, string | undefined>
): boolean {
  return env
    ? env.EXPO_PUBLIC_ENABLE_ONLINE_PROFILES === '1'
    : ONLINE_PROFILES_ENABLED;
}
