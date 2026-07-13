import fs from 'node:fs';
import path from 'node:path';

import {
  ACCOUNT_SIGNED_IN_COPY,
  isAppleSignInEnabled,
  isOnlineProfilesEnabled,
  onlineProfilePrivacyPolicyUrl,
} from '../accountAuthConfig';
import {
  CLEAR_THIS_DEVICE_COPY,
  CLEAR_THIS_DEVICE_TITLE,
  DELETE_ONLINE_ACCOUNT_COPY,
  DELETE_ONLINE_ACCOUNT_TITLE,
} from '../accountDeletionConfig';

describe('AccountAuthCard auth hardening', () => {
  it('hides Apple sign-in unless the explicit env flag is enabled', () => {
    expect(isAppleSignInEnabled({})).toBe(false);
    expect(isAppleSignInEnabled({ EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN: '0' })).toBe(false);
    expect(isAppleSignInEnabled({ EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN: 'true' })).toBe(false);
    expect(isAppleSignInEnabled({ EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN: '1' })).toBe(true);
  });

  it('keeps new online-account entry behind the end-to-end rollout flag', () => {
    expect(isOnlineProfilesEnabled({})).toBe(false);
    expect(isOnlineProfilesEnabled({ EXPO_PUBLIC_ENABLE_ONLINE_PROFILES: 'true' })).toBe(false);
    expect(isOnlineProfilesEnabled({ EXPO_PUBLIC_ENABLE_ONLINE_PROFILES: '1' })).toBe(true);
  });

  it('keeps Expo public env reads statically addressable for bundle-time inlining', () => {
    const onlineProfilesSource = fs.readFileSync(
      path.join(process.cwd(), 'src/config/onlineProfiles.ts'),
      'utf8'
    );
    const accountConfigSource = fs.readFileSync(
      path.join(process.cwd(), 'src/components/accountAuthConfig.ts'),
      'utf8'
    );

    expect(onlineProfilesSource).toMatch(
      /const ONLINE_PROFILES_ENABLED\s*=\s*process\.env\.EXPO_PUBLIC_ENABLE_ONLINE_PROFILES/
    );
    expect(accountConfigSource).toMatch(
      /const APPLE_SIGN_IN_ENABLED\s*=\s*process\.env\.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN/
    );
    expect(accountConfigSource).toMatch(
      /normalizePrivacyPolicyUrl\(\s*process\.env\.EXPO_PUBLIC_PRIVACY_POLICY_URL\s*\)/
    );
  });

  it('limits the online promise to the non-health profile', () => {
    expect(ACCOUNT_SIGNED_IN_COPY).toMatch(/name, reference details, goal/i);
    expect(ACCOUNT_SIGNED_IN_COPY).toMatch(/private online profile/i);
    expect(ACCOUNT_SIGNED_IN_COPY).not.toMatch(/progress|check-up|health|clarity/i);
  });

  it('accepts only an explicit HTTPS privacy-policy URL', () => {
    expect(onlineProfilePrivacyPolicyUrl({})).toBeNull();
    expect(onlineProfilePrivacyPolicyUrl({ EXPO_PUBLIC_PRIVACY_POLICY_URL: 'http://example.com' })).toBeNull();
    expect(onlineProfilePrivacyPolicyUrl({ EXPO_PUBLIC_PRIVACY_POLICY_URL: ' https://example.com/privacy ' }))
      .toBe('https://example.com/privacy');
  });

  it('distinguishes device clearing from permanent online-account deletion', () => {
    const copy = `${CLEAR_THIS_DEVICE_TITLE} ${CLEAR_THIS_DEVICE_COPY} ${DELETE_ONLINE_ACCOUNT_TITLE} ${DELETE_ONLINE_ACCOUNT_COPY}`;

    expect(copy).toMatch(/Clear this device/i);
    expect(copy).toMatch(/online profile remains available/i);
    expect(copy).toMatch(/Delete online account/i);
    expect(copy).toMatch(/permanently deletes your Pearl account/i);
    expect(copy).toMatch(/cannot be undone/i);
  });
});
