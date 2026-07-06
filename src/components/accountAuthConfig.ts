import { BRAND } from '../brand';
export const ACCOUNT_SIGNED_IN_COPY =
  `Your account is active. ${BRAND.appName} securely saves your progress and account setup so you can restore them when you sign in.`;

export function isAppleSignInEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN === '1';
}
