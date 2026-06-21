import * as React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import {
  clearLocalHaleData,
  requestCloudAccountDeletion,
  shareHaleDataExport,
  useAuth,
} from '../services/backend';
import { colors, radius, shadow, spacing, type } from '../theme';
import {
  DELETE_CONFIRMATION_WORD,
  canConfirmAccountDataAction,
  type AccountDataAction,
} from './accountDeletionConfig';
import { ACCOUNT_SIGNED_IN_COPY, isAppleSignInEnabled } from './accountAuthConfig';
import { Button, Card, Input, ListRow, SegmentedTabs, StatusBadge, Typography } from './ui';

type AccountMode = 'sign-in' | 'sign-up' | 'forgot-password';

export function AccountAuthCard({
  context,
  initialMode = 'sign-in',
}: {
  context: 'required' | 'settings';
  initialMode?: AccountMode;
}) {
  const {
    error,
    isPasswordRecovery,
    isSignedIn,
    loading,
    profile,
    refreshProfile,
    resetPassword,
    signIn,
    signInWithApple,
    signInWithGoogle,
    signOut,
    signUp,
    updatePassword,
    user,
  } = useAuth();
  const [mode, setMode] = React.useState<AccountMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [pendingDataAction, setPendingDataAction] = React.useState<AccountDataAction | null>(null);
  const [confirmationText, setConfirmationText] = React.useState('');
  const [dataActionLoading, setDataActionLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const authError = localError ?? error;
  const isRequiredAuth = context === 'required';
  const title = isPasswordRecovery ? 'Set a new password' : context === 'required' ? 'Account access' : 'Account';
  const showGoogleButton = Platform.OS === 'ios' || Platform.OS === 'android';
  const appleSignInEnabled = isAppleSignInEnabled();
  const showAppleButton = appleSignInEnabled && Platform.OS === 'ios' && appleAvailable;

  React.useEffect(() => {
    if (!appleSignInEnabled) return undefined;
    if (Platform.OS !== 'ios') return undefined;

    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) setAppleAvailable(available);
      })
      .catch(() => {
        if (mounted) setAppleAvailable(false);
      });

    return () => {
      mounted = false;
    };
  }, [appleSignInEnabled]);

  const changeMode = (nextMode: AccountMode) => {
    setMode(nextMode);
    setLocalError(null);
    setNotice(null);
  };

  const submit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError('Enter an email and password.');
      return;
    }

    setLocalError(null);
    setNotice(null);

    try {
      const next = mode === 'sign-up'
        ? await signUp(trimmedEmail, password, fullName)
        : await signIn(trimmedEmail, password);

      if (next.isSignedIn) {
        await refreshProfile();
        setNotice('Signed in. Hale is ready.');
      } else {
        setNotice('Check your email to confirm the account, then sign in here.');
      }
      setPassword('');
    } catch (err) {
      setLocalError(messageFromError(err));
    }
  };

  const submitPasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Enter the email you use for Hale.');
      return;
    }

    setLocalError(null);
    setNotice(null);

    try {
      await resetPassword(trimmedEmail);
      setNotice('Check your email for a password reset link from Hale.');
      setMode('sign-in');
    } catch (err) {
      setLocalError(messageFromError(err));
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setLocalError('Use at least 8 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('The passwords do not match.');
      return;
    }

    setLocalError(null);
    setNotice(null);

    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Password updated. Hale is ready.');
    } catch (err) {
      setLocalError(messageFromError(err));
    }
  };

  const submitProvider = async (provider: 'google' | 'apple') => {
    setLocalError(null);
    setNotice(null);

    try {
      const next = provider === 'google' ? await signInWithGoogle() : await signInWithApple();

      if (next.isSignedIn) {
        await refreshProfile();
        setNotice('Signed in. Hale is ready.');
      }
    } catch (err) {
      setLocalError(messageFromError(err));
    }
  };

  const submitSignOut = async () => {
    setLocalError(null);
    setNotice(null);
    try {
      await signOut();
      setPassword('');
    } catch (err) {
      setLocalError(messageFromError(err));
    }
  };

  const submitExportData = async () => {
    if (!isSignedIn) {
      setLocalError('Sign in before exporting your Hale data.');
      return;
    }

    setExportLoading(true);
    setLocalError(null);
    setNotice(null);

    try {
      const result = await shareHaleDataExport();
      setNotice(`Export ready: ${result.filename}`);
    } catch (err) {
      setLocalError(messageFromError(err));
    } finally {
      setExportLoading(false);
    }
  };

  const beginDataAction = (action: AccountDataAction) => {
    setPendingDataAction(action);
    setConfirmationText('');
    setLocalError(null);
    setNotice(null);
  };

  const cancelDataAction = () => {
    setPendingDataAction(null);
    setConfirmationText('');
    setLocalError(null);
  };

  const confirmDataAction = async () => {
    if (!pendingDataAction) return;
    if (!isSignedIn) {
      setLocalError('Sign in before changing account data.');
      return;
    }
    if (!canConfirmAccountDataAction(pendingDataAction, confirmationText)) {
      setLocalError(`Type ${DELETE_CONFIRMATION_WORD} to confirm account deletion.`);
      return;
    }

    setDataActionLoading(true);
    setLocalError(null);
    setNotice(null);

    try {
      if (pendingDataAction === 'delete-account') {
        await requestCloudAccountDeletion();
      }

      const result = await clearLocalHaleData();
      if (result.failures.length > 0) {
        throw new Error('Some local Hale data could not be deleted. Please try again.');
      }

      await signOut();
      setNotice('Local Hale data was deleted from this device.');
    } catch (err) {
      setLocalError(messageFromError(err));
    } finally {
      setDataActionLoading(false);
      setPendingDataAction(null);
      setConfirmationText('');
    }
  };

  if (context === 'settings' && isSignedIn) {
    return (
      <View style={styles.compactAccountStack}>
        <View style={styles.compactAccountCard}>
          <View style={styles.compactAccountIcon}>
            <MailIcon />
          </View>
          <View style={styles.compactAccountCopy}>
            <Text style={styles.compactAccountTitle}>Account</Text>
            <Text style={styles.compactAccountEmail} numberOfLines={2} selectable>
              {user?.email ?? 'Signed in'}
            </Text>
          </View>
          <Text style={styles.compactChevron}>{'>'}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.exportButton,
            (loading || exportLoading || dataActionLoading) && styles.compactActionDisabled,
            pressed && !(loading || exportLoading || dataActionLoading) && styles.pressed,
          ]}
          onPress={submitExportData}
          disabled={loading || exportLoading || dataActionLoading}
          accessibilityRole="button"
          accessibilityLabel="Export my data"
        >
          <DownloadIcon color={colors.onAccent} />
          <Text style={styles.exportButtonText}>{exportLoading ? 'Preparing export...' : 'Export my data'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            loading && styles.compactActionDisabled,
            pressed && !loading && styles.pressed,
          ]}
          onPress={submitSignOut}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <SignOutIcon />
          <Text style={styles.signOutButtonText}>{loading ? 'Signing out...' : 'Sign out'}</Text>
        </Pressable>

        {pendingDataAction ? (
          <View style={styles.compactConfirmPanel}>
            <Typography variant="bodySmall" color={colors.textPrimary}>
              Delete account is permanent and will require secure cloud deletion.
            </Typography>
            <Input
              label={`Type ${DELETE_CONFIRMATION_WORD} to confirm`}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder={DELETE_CONFIRMATION_WORD}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel="Delete account confirmation"
              containerStyle={styles.field}
            />
            <View style={styles.dangerButtonRow}>
              <Button
                title={dataActionLoading ? 'Working...' : 'Delete account'}
                variant="danger"
                onPress={confirmDataAction}
                disabled={dataActionLoading || loading}
                style={styles.dangerButton}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={cancelDataAction}
                disabled={dataActionLoading || loading}
                style={styles.dangerButton}
              />
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.deleteAccountLink, pressed && styles.pressed]}
            onPress={() => beginDataAction('delete-account')}
            disabled={loading || dataActionLoading}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <Text style={styles.deleteAccountText}>Delete account</Text>
          </Pressable>
        )}

        {notice ? <Typography variant="caption" color={colors.sageDeep} style={styles.message}>{notice}</Typography> : null}
        {authError ? <Typography variant="caption" color={colors.error} style={styles.message}>{authError}</Typography> : null}
      </View>
    );
  }

  return (
    <Card style={isRequiredAuth ? styles.authCard : undefined}>
      <View style={[styles.sectionHead, isRequiredAuth && styles.requiredSectionHead]}>
        <Typography variant={isRequiredAuth ? 'h2' : 'h3'} color={colors.textPrimary} style={isRequiredAuth && styles.requiredCardTitle}>
          {title}
        </Typography>
        {isSignedIn ? <StatusBadge label="Signed in" tone="good" /> : null}
      </View>
      <Typography
        variant={isRequiredAuth ? 'bodySmall' : 'caption'}
        color={colors.textSecondary}
        style={[styles.sectionHint, isRequiredAuth && styles.requiredSectionHint]}
      >
        {isPasswordRecovery
          ? 'Choose a new password to finish restoring access to your Hale account.'
          : isSignedIn
          ? ACCOUNT_SIGNED_IN_COPY
          : 'Sign in or create an account to keep your progress saved.'}
      </Typography>

      {isPasswordRecovery ? (
        <View style={[styles.stack, isRequiredAuth && styles.requiredStack]}>
          <Input
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="newPassword"
            returnKeyType="next"
            accessibilityLabel="New password"
            containerStyle={styles.field}
          />
          <Input
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat new password"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="newPassword"
            returnKeyType="done"
            accessibilityLabel="Confirm password"
            containerStyle={styles.field}
          />
          <Button
            title={loading ? 'Updating...' : 'Update password'}
            onPress={submitNewPassword}
            disabled={loading}
            accessibilityLabel="Update password"
            style={[styles.submitButton, isRequiredAuth && styles.requiredSubmitButton]}
          />
        </View>
      ) : isSignedIn ? (
        <View style={styles.stack}>
          <ListRow title="Email" value={user?.email ?? 'Signed in'} />
          <ListRow title="Name" value={profile?.full_name ?? 'Not set'} />
          {context === 'settings' ? (
            <Button
              title={exportLoading ? 'Preparing export...' : 'Export my data'}
              variant="secondary"
              onPress={submitExportData}
              disabled={loading || exportLoading || dataActionLoading}
            />
          ) : null}
          <Button title={loading ? 'Signing out...' : 'Sign out'} variant="secondary" onPress={submitSignOut} disabled={loading} />
          {context === 'settings' ? (
            <View style={styles.dangerZone}>
              <Typography variant="label" color={colors.error}>Account data</Typography>
              <Typography variant="caption" color={colors.textSecondary} style={styles.dangerCopy}>
                Delete local data from this device, or request full account deletion when Hale’s secure server function is available.
              </Typography>
              {pendingDataAction ? (
                <View style={styles.confirmPanel}>
                  <Typography variant="bodySmall" color={colors.textPrimary}>
                    {pendingDataAction === 'delete-account'
                      ? 'Delete account is permanent and will require a secure cloud deletion function. Local data will not be cleared unless cloud deletion succeeds.'
                      : 'This deletes Hale data stored on this device and signs you out. Synced account data is not deleted.'}
                  </Typography>
                  {pendingDataAction === 'delete-account' ? (
                    <Input
                      label={`Type ${DELETE_CONFIRMATION_WORD} to confirm`}
                      value={confirmationText}
                      onChangeText={setConfirmationText}
                      placeholder={DELETE_CONFIRMATION_WORD}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="done"
                      accessibilityLabel="Delete account confirmation"
                      containerStyle={styles.field}
                    />
                  ) : null}
                  <View style={styles.dangerButtonRow}>
                    <Button
                      title={dataActionLoading ? 'Working...' : pendingDataAction === 'delete-account' ? 'Delete account' : 'Delete local data'}
                      variant="danger"
                      onPress={confirmDataAction}
                      disabled={dataActionLoading || loading}
                      style={styles.dangerButton}
                    />
                    <Button
                      title="Cancel"
                      variant="ghost"
                      onPress={cancelDataAction}
                      disabled={dataActionLoading || loading}
                      style={styles.dangerButton}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.dangerButtonRow}>
                  <Button
                    title="Delete local data only"
                    variant="secondary"
                    onPress={() => beginDataAction('clear-local-data')}
                    disabled={loading || dataActionLoading}
                    style={styles.dangerButton}
                  />
                  <Button
                    title="Delete account"
                    variant="danger"
                    onPress={() => beginDataAction('delete-account')}
                    disabled={loading || dataActionLoading}
                    style={styles.dangerButton}
                  />
                </View>
              )}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.stack, isRequiredAuth && styles.requiredStack]}>
          {mode === 'forgot-password' ? (
            <Typography variant="bodySmall" color={colors.textSecondary}>
              Enter your email and Hale will send a secure password reset link.
            </Typography>
          ) : (
            <SegmentedTabs
              value={mode}
              onChange={changeMode}
              options={[
                { value: 'sign-in', label: 'Sign in' },
                { value: 'sign-up', label: 'Sign up' },
              ]}
            />
          )}
          {mode !== 'forgot-password' && (showGoogleButton || showAppleButton) ? (
            <View style={styles.socialStack}>
              {showGoogleButton ? (
                <SocialButton
                  label={loading ? 'Connecting...' : 'Continue with Google'}
                  disabled={loading}
                  onPress={() => submitProvider('google')}
                />
              ) : null}
              {showAppleButton ? (
                <SocialButton
                  label={loading ? 'Connecting...' : 'Continue with Apple'}
                  disabled={loading}
                  onPress={() => submitProvider('apple')}
                  dark
                />
              ) : null}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or use email</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          ) : null}
          {mode === 'sign-up' ? (
            <Input
              label="Full name optional"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              returnKeyType="next"
              accessibilityLabel="Full name"
              containerStyle={styles.field}
            />
          ) : null}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            accessibilityLabel="Email"
            containerStyle={styles.field}
          />
          {mode !== 'forgot-password' ? (
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              returnKeyType="done"
              accessibilityLabel="Password"
              containerStyle={styles.field}
            />
          ) : null}
          {mode === 'forgot-password' ? (
            <Button
              title={loading ? 'Sending...' : 'Send reset email'}
              onPress={submitPasswordReset}
              disabled={loading}
              accessibilityLabel="Send reset email"
              style={[styles.submitButton, isRequiredAuth && styles.requiredSubmitButton]}
            />
          ) : (
            <Button
              title={loading ? 'Working...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
              onPress={submit}
              disabled={loading}
              accessibilityLabel={mode === 'sign-up' ? 'Create account' : 'Sign in'}
              style={[styles.submitButton, isRequiredAuth && styles.requiredSubmitButton]}
            />
          )}
          {mode === 'sign-in' ? (
            <Pressable
              style={({ pressed }) => [styles.forgotLink, pressed && styles.pressed]}
              onPress={() => changeMode('forgot-password')}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.modeLink, pressed && styles.pressed]}
            onPress={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            accessibilityRole="button"
            accessibilityLabel={mode === 'sign-in' ? 'Create an account' : 'Sign in instead'}
          >
            <Text style={styles.modeLinkText}>
              {mode === 'sign-in'
                ? 'New to Hale? Create an account'
                : mode === 'sign-up'
                  ? 'Already have an account? Sign in'
                  : 'Back to sign in'}
            </Text>
          </Pressable>
        </View>
      )}

      {notice ? <Typography variant="caption" color={colors.sageDeep} style={styles.message}>{notice}</Typography> : null}
      {authError ? <Typography variant="caption" color={colors.error} style={styles.message}>{authError}</Typography> : null}
    </Card>
  );
}

function SocialButton({
  label,
  disabled,
  onPress,
  dark = false,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <Button
      title={label}
      onPress={onPress}
      variant="secondary"
      disabled={disabled}
      accessibilityLabel={label}
      style={[styles.socialButton, dark && styles.socialButtonDark]}
      textStyle={[styles.socialButtonText, dark && styles.socialButtonTextDark]}
    />
  );
}

function MailIcon() {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={6.5} width={16} height={11.5} rx={2.2} stroke={colors.accentDeep} strokeWidth={1.7} />
      <Path d="M5.5 8.5 L12 13 L18.5 8.5" stroke={colors.accentDeep} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4.5 V14" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M8 10.5 L12 14.5 L16 10.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 18.5 H19" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

function SignOutIcon() {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path d="M10 6 H6.5 C5.7 6, 5 6.7, 5 7.5 V16.5 C5 17.3, 5.7 18, 6.5 18 H10" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 12 H19" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M16 8.5 L19.5 12 L16 15.5" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const styles = StyleSheet.create({
  compactAccountStack: {
    gap: spacing.md,
  },
  compactAccountCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  compactAccountIcon: {
    width: 39,
    height: 39,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  compactAccountCopy: {
    flex: 1,
    minWidth: 0,
  },
  compactAccountTitle: {
    ...type.bodySmall,
    fontFamily: type.button.fontFamily,
    color: colors.primaryText,
  },
  compactAccountEmail: {
    ...type.caption,
    marginTop: 2,
    color: colors.primaryText,
  },
  compactChevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  exportButton: {
    minHeight: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
    ...shadow.soft,
  },
  exportButtonText: {
    ...type.bodySmall,
    fontFamily: type.button.fontFamily,
    color: colors.onAccent,
  },
  signOutButton: {
    minHeight: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accentDeep,
  },
  signOutButtonText: {
    ...type.bodySmall,
    fontFamily: type.button.fontFamily,
    color: colors.accentDeep,
  },
  deleteAccountLink: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountText: {
    ...type.caption,
    fontFamily: type.button.fontFamily,
    color: colors.error,
    textAlign: 'center',
  },
  compactConfirmPanel: {
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
  },
  compactActionDisabled: {
    opacity: 0.55,
  },
  authCard: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    ...shadow.card,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionHint: { marginTop: spacing.xs },
  requiredSectionHead: {
    alignItems: 'flex-start',
  },
  requiredCardTitle: {
    fontFamily: type.h2.fontFamily,
  },
  requiredSectionHint: {
    maxWidth: 310,
  },
  stack: { gap: spacing.lg, marginTop: spacing.lg },
  requiredStack: {
    gap: 14,
    marginTop: spacing.xl,
  },
  socialStack: { gap: spacing.sm, marginTop: spacing.xs },
  socialButton: {
    minHeight: 58,
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  socialButtonText: {
    color: colors.accentDeep,
  },
  socialButtonDark: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  socialButtonTextDark: { color: colors.onAccent },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  dividerText: { ...type.caption, color: colors.textTertiary },
  dangerZone: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  dangerCopy: { marginTop: spacing.xs },
  confirmPanel: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  dangerButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  dangerButton: { flexGrow: 1, flexBasis: '45%', shadowOpacity: 0 },
  field: {},
  submitButton: {
    marginTop: spacing.xs,
  },
  requiredSubmitButton: {
    minHeight: 60,
    borderRadius: radius.button,
    ...shadow.soft,
  },
  modeLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLinkText: { ...type.caption, color: colors.accentDeep, fontFamily: type.button.fontFamily, textAlign: 'center' },
  modeLinkText: { ...type.bodySmall, color: colors.accentDeep, fontFamily: type.button.fontFamily, textAlign: 'center' },
  message: { marginTop: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
