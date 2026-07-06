import * as React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  clearLocalHaleData,
  shareHaleDataExport,
  useAuth,
} from '../services/backend';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import {
  CLEAR_THIS_DEVICE_COPY,
  CLEAR_THIS_DEVICE_TITLE,
  CLOUD_ACCOUNT_DELETION_CONTACT_COPY,
} from './accountDeletionConfig';
import { ACCOUNT_SIGNED_IN_COPY, isAppleSignInEnabled } from './accountAuthConfig';
import { Button, Card, Input, SegmentedTabs, Typography } from './ui';

import { BRAND } from '../brand';
type AccountMode = 'sign-in' | 'sign-up' | 'forgot-password';

// Live surfaces: the Settings account section (signed-in stack or the
// sign-in/sign-up form) and the password-recovery card that AuthScreen
// shows via context="required". Guest-first launch means there is no
// mandatory sign-in flow anymore.
export function AccountAuthCard({ context }: { context: 'required' | 'settings' }) {
  const {
    error,
    isPasswordRecovery,
    isSignedIn,
    loading,
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
  const responsive = useResponsiveLayout();
  const [mode, setMode] = React.useState<AccountMode>('sign-in');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [confirmingClearDevice, setConfirmingClearDevice] = React.useState(false);
  const [dataActionLoading, setDataActionLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const authError = localError ?? error;
  const isRequiredAuth = context === 'required';
  const title = isPasswordRecovery
    ? 'Set a new password'
    : mode === 'forgot-password'
      ? 'Reset your password'
      : 'Account';
  const showGoogleButton = Platform.OS === 'ios' || Platform.OS === 'android';
  const appleSignInEnabled = isAppleSignInEnabled();
  const showAppleButton = appleSignInEnabled && Platform.OS === 'ios' && appleAvailable;
  const submitTitle = loading
    ? mode === 'sign-up'
      ? 'Creating account...'
      : 'Signing in...'
    : mode === 'sign-up'
      ? 'Create account'
      : 'Sign in';

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
    const trimmedName = fullName.trim();
    if (mode === 'sign-up' && !trimmedName) {
      setLocalError(`Enter the name you want ${BRAND.appName} to use.`);
      return;
    }
    if (!trimmedEmail || !password) {
      setLocalError('Enter an email and password.');
      return;
    }

    setLocalError(null);
    setNotice(null);

    try {
      const next = mode === 'sign-up'
        ? await signUp(trimmedEmail, password, trimmedName)
        : await signIn(trimmedEmail, password);

      if (next.isSignedIn) {
        await refreshProfile();
        setNotice(`Signed in. ${BRAND.appName} is ready.`);
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
      setLocalError(`Enter the email you use for ${BRAND.appName}.`);
      return;
    }

    setLocalError(null);
    setNotice(null);

    try {
      await resetPassword(trimmedEmail);
      setNotice(`Check your email for a password reset link from ${BRAND.appName}.`);
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
      setNotice(`Password updated. ${BRAND.appName} is ready.`);
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
        setNotice(`Signed in. ${BRAND.appName} is ready.`);
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
      setLocalError(`Sign in before exporting your ${BRAND.appName} data.`);
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

  const beginClearDevice = () => {
    setConfirmingClearDevice(true);
    setLocalError(null);
    setNotice(null);
  };

  const cancelClearDevice = () => {
    setConfirmingClearDevice(false);
    setLocalError(null);
  };

  const confirmClearDevice = async () => {
    if (!isSignedIn) {
      setLocalError('Sign in before changing account data.');
      return;
    }

    setDataActionLoading(true);
    setLocalError(null);
    setNotice(null);

    try {
      const result = await clearLocalHaleData();
      if (result.failures.length > 0) {
        throw new Error(`Some local ${BRAND.appName} data could not be deleted. Please try again.`);
      }

      await signOut();
      setNotice(`${BRAND.appName} data was cleared from this device and you were signed out.`);
    } catch (err) {
      setLocalError(messageFromError(err));
    } finally {
      setDataActionLoading(false);
      setConfirmingClearDevice(false);
    }
  };

  if (context === 'settings' && isSignedIn) {
    return (
      <View style={styles.compactAccountStack}>
        <View style={[styles.compactAccountCard, responsive.isCompactPhone && styles.compactCardPadding]}>
          <View style={styles.compactAccountIcon}>
            <MailIcon />
          </View>
          <View style={styles.compactAccountCopy}>
            <Text style={styles.compactAccountTitle}>Signed in</Text>
            <Text style={styles.compactAccountEmail} numberOfLines={2} selectable>
              {user?.email ?? 'Signed in'}
            </Text>
          </View>
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

        {confirmingClearDevice ? (
          <View style={[styles.compactConfirmPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
            <Typography variant="bodySmall" color={colors.textPrimary}>
              {CLEAR_THIS_DEVICE_COPY} {CLOUD_ACCOUNT_DELETION_CONTACT_COPY}
            </Typography>
            <View style={styles.dangerButtonRow}>
              <Button
                title={dataActionLoading ? 'Working...' : CLEAR_THIS_DEVICE_TITLE}
                variant="danger"
                onPress={confirmClearDevice}
                disabled={dataActionLoading || loading}
                style={styles.dangerButton}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={cancelClearDevice}
                disabled={dataActionLoading || loading}
                style={styles.dangerButton}
              />
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.deleteAccountLink, pressed && styles.pressed]}
            onPress={beginClearDevice}
            disabled={loading || dataActionLoading}
            accessibilityRole="button"
            accessibilityLabel={CLEAR_THIS_DEVICE_TITLE}
          >
            <Text style={styles.deleteAccountText}>{CLEAR_THIS_DEVICE_TITLE}</Text>
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
      </View>
      <Typography
        variant={isRequiredAuth ? 'bodySmall' : 'caption'}
        color={colors.textSecondary}
        style={[styles.sectionHint, isRequiredAuth && styles.requiredSectionHint]}
      >
        {isPasswordRecovery
          ? `Choose a new password to finish restoring access to your ${BRAND.appName} account.`
          : mode === 'forgot-password'
          ? `Enter the email you use for ${BRAND.appName}. We will send a link to choose a new password.`
          : isSignedIn
          ? ACCOUNT_SIGNED_IN_COPY
          : `Sign in if you want ${BRAND.appName} to keep your check-up history and account setup available when you return.`}
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
      ) : (
        <View style={[styles.stack, isRequiredAuth && styles.requiredStack]}>
          {mode === 'forgot-password' ? (
            <Typography variant="bodySmall" color={colors.textSecondary}>
              After you open the link, return to {BRAND.appName} and sign in with your new password.
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
                  provider="google"
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
              label="Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder={`What should ${BRAND.appName} call you?`}
              returnKeyType="next"
              accessibilityLabel="Name"
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
              title={loading ? 'Sending reset link...' : 'Send reset link'}
              onPress={submitPasswordReset}
              disabled={loading}
              accessibilityLabel="Send reset link"
              style={[styles.submitButton, isRequiredAuth && styles.requiredSubmitButton]}
            />
          ) : (
            <Button
              title={submitTitle}
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
          {mode === 'forgot-password' ? (
            <Pressable
              style={({ pressed }) => [styles.modeLink, pressed && styles.pressed]}
              onPress={() => changeMode('sign-in')}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Text style={styles.modeLinkText}>Back to sign in</Text>
            </Pressable>
          ) : null}
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
  provider,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  dark?: boolean;
  provider?: 'google';
}) {
  const responsive = useResponsiveLayout();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialButton,
        responsive.isCompactPhone && styles.compactCardPadding,
        dark && styles.socialButtonDark,
        disabled && styles.compactActionDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled } : undefined}
    >
      {provider === 'google' ? <GoogleIcon /> : null}
      <Text style={[styles.socialButtonText, dark && styles.socialButtonTextDark]}>{label}</Text>
    </Pressable>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.6 12.23 C21.6 11.52 21.54 10.84 21.43 10.18 H12 V14.06 H17.39 C17.16 15.31 16.45 16.37 15.38 17.08 V19.6 H18.63 C20.53 17.85 21.6 15.26 21.6 12.23 Z"
        fill="#4285F4"
      />
      <Path
        d="M12 22 C14.7 22 16.96 21.1 18.63 19.6 L15.38 17.08 C14.48 17.68 13.33 18.04 12 18.04 C9.39 18.04 7.18 16.28 6.39 13.91 H3.03 V16.51 C4.69 19.78 8.08 22 12 22 Z"
        fill="#34A853"
      />
      <Path
        d="M6.39 13.91 C6.19 13.31 6.08 12.67 6.08 12 C6.08 11.33 6.19 10.69 6.39 10.09 V7.49 H3.03 C2.35 8.85 1.96 10.38 1.96 12 C1.96 13.62 2.35 15.15 3.03 16.51 L6.39 13.91 Z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.96 C13.47 5.96 14.79 6.46 15.82 7.46 L18.7 4.58 C16.96 2.96 14.7 2 12 2 C8.08 2 4.69 4.22 3.03 7.49 L6.39 10.09 C7.18 7.72 9.39 5.96 12 5.96 Z"
        fill="#EA4335"
      />
    </Svg>
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
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
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
  exportButton: {
    minHeight: 54,
    borderRadius: radius.pill,
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
    borderRadius: radius.pill,
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
    // Comfortable tap target for the 50+ audience (matches minTapTarget).
    minHeight: 48,
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
    paddingVertical: spacing.xxl,
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
    fontFamily: type.cardTitle.fontFamily,
    fontSize: 24,
    lineHeight: 30,
  },
  requiredSectionHint: {
    maxWidth: 310,
  },
  stack: { gap: spacing.lg, marginTop: spacing.lg },
  requiredStack: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  socialStack: { gap: spacing.sm, marginTop: spacing.xs },
  socialButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  socialButtonText: {
    ...type.button,
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
  dangerButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  dangerButton: { flexGrow: 1, flexBasis: '45%', shadowOpacity: 0 },
  field: {},
  submitButton: {
    marginTop: spacing.xs,
  },
  requiredSubmitButton: {
    minHeight: 60,
    ...shadow.soft,
  },
  modeLink: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLinkText: { ...type.caption, color: colors.accentDeep, fontFamily: type.button.fontFamily, textAlign: 'center' },
  modeLinkText: { ...type.bodySmall, color: colors.accentDeep, fontFamily: type.button.fontFamily, textAlign: 'center' },
  message: { marginTop: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
