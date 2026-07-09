import { ACCOUNT_SIGNED_IN_COPY, isAppleSignInEnabled } from '../accountAuthConfig';
import {
  CLEAR_THIS_DEVICE_COPY,
  CLEAR_THIS_DEVICE_TITLE,
  CLOUD_ACCOUNT_DELETION_CONTACT_COPY,
} from '../accountDeletionConfig';

describe('AccountAuthCard auth hardening', () => {
  it('hides Apple sign-in unless the explicit env flag is enabled', () => {
    expect(isAppleSignInEnabled({})).toBe(false);
    expect(isAppleSignInEnabled({ EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN: '0' })).toBe(false);
    expect(isAppleSignInEnabled({ EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN: 'true' })).toBe(false);
    expect(isAppleSignInEnabled({ EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN: '1' })).toBe(true);
  });

  it('does not describe movement progress as local-only', () => {
    expect(ACCOUNT_SIGNED_IN_COPY).toMatch(/saves your progress/i);
    expect(ACCOUNT_SIGNED_IN_COPY).not.toMatch(/local for now|stays local/i);
  });

  it('keeps destructive account copy truthful while cloud deletion is deferred', () => {
    const copy = `${CLEAR_THIS_DEVICE_TITLE} ${CLEAR_THIS_DEVICE_COPY} ${CLOUD_ACCOUNT_DELETION_CONTACT_COPY}`;

    expect(copy).toMatch(/Clear this device/i);
    expect(copy).toMatch(/does not delete your cloud account/i);
    expect(copy).toMatch(/contact Pearl support/i);
    expect(copy).not.toMatch(/will delete synced account data|request account deletion/i);
  });
});
