import { ACCOUNT_SIGNED_IN_COPY, isAppleSignInEnabled } from '../accountAuthConfig';
import { canConfirmAccountDataAction } from '../accountDeletionConfig';

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

  it('requires typed confirmation for account deletion', () => {
    expect(canConfirmAccountDataAction('delete-account', '')).toBe(false);
    expect(canConfirmAccountDataAction('delete-account', 'delete')).toBe(true);
    expect(canConfirmAccountDataAction('clear-local-data', '')).toBe(true);
  });
});
