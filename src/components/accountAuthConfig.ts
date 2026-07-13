export const ACCOUNT_SIGNED_IN_COPY =
  `Your name, reference details, goal, trainer voice, and comparison preference are saved to your private online profile.`;

export const ACCOUNT_SIGNED_OUT_COPY =
  `Create an optional account to keep your non-health profile available on your devices. Health answers, workouts, check-ups, Everyday Clarity, and camera data stay on this device.`;

// Expo only inlines statically-addressed EXPO_PUBLIC variables. These module
// defaults therefore read each variable directly while the optional env
// parameters keep the policy helpers deterministic in tests.
const APPLE_SIGN_IN_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN === '1';
const PRIVACY_POLICY_URL = normalizePrivacyPolicyUrl(
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL
);

function normalizePrivacyPolicyUrl(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && /^https:\/\//i.test(normalized) ? normalized : null;
}

export function isAppleSignInEnabled(env?: Record<string, string | undefined>): boolean {
  return env
    ? env.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN === '1'
    : APPLE_SIGN_IN_ENABLED;
}

export function onlineProfilePrivacyPolicyUrl(
  env?: Record<string, string | undefined>
): string | null {
  return env
    ? normalizePrivacyPolicyUrl(env.EXPO_PUBLIC_PRIVACY_POLICY_URL)
    : PRIVACY_POLICY_URL;
}
export { isOnlineProfilesEnabled } from '../config/onlineProfiles';
