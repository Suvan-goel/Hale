/**
 * Production session mode (2026-07-05 direction): voice-guided is the
 * default; the camera-conducted surface is the PARKED conductor path, kept
 * fully working behind this flag (its suites run in CI regardless). The
 * promotion trigger is churn-location telemetry, not this flag.
 */
export const CAMERA_CONDUCTED_SESSIONS_FLAG = 'EXPO_PUBLIC_ENABLE_CAMERA_CONDUCTED_SESSIONS' as const;

export function isCameraConductedSessionsEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const raw = env[CAMERA_CONDUCTED_SESSIONS_FLAG];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}
