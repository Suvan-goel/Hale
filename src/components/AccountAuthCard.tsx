import * as React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  clearLocalHaleData,
  requestCloudAccountDeletion,
  shareHaleDataExport,
  useAuth,
} from '../services/backend';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
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
  const responsive = useResponsiveLayout();
  const [mode, setMode] = React.useState<AccountMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
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
  const title = isPasswordRecovery
    ? 'Set a new password'
    : mode === 'forgot-password'
      ? 'Reset your password'
      : context === 'required'
        ? 'Account access'
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
      setLocalError('Enter the name you want Hale to use.');
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

        {pendingDataAction ? (
          <View style={[styles.compactConfirmPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
            <Typography variant="bodySmall" color={colors.textPrimary}>
              Deleting your account is permanent. Hale will request account deletion, then remove Hale data from this phone.
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

  if (isRequiredAuth && !isPasswordRecovery && !isSignedIn && mode !== 'forgot-password') {
    return (
      <View style={styles.requiredAuthStack}>
        <Card style={styles.authCard}>
          <View style={styles.requiredPrimaryStack}>
            {mode === 'sign-up' ? (
              <AuthInputField
                label="Name"
                icon="account"
                value={fullName}
                onChangeText={setFullName}
                placeholder="What should Hale call you?"
                returnKeyType="next"
                accessibilityLabel="Name"
              />
            ) : null}
            <AuthInputField
              label="Email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              accessibilityLabel="Email"
            />
            <AuthInputField
              label="Password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'sign-up' ? 'Create a password' : 'Enter your password'}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!passwordVisible}
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              returnKeyType="done"
              accessibilityLabel="Password"
              rightIcon="eye"
              onRightPress={() => setPasswordVisible((value) => !value)}
              rightAccessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            />
            {mode === 'sign-in' ? (
              <Pressable
                style={({ pressed }) => [styles.requiredForgotLink, pressed && styles.pressed]}
                onPress={() => changeMode('forgot-password')}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
              >
                <Text style={styles.forgotLinkText}>Forgot password?</Text>
              </Pressable>
            ) : null}
            <Button
              title={submitTitle}
              onPress={submit}
              disabled={loading}
              accessibilityLabel={mode === 'sign-up' ? 'Create account' : 'Sign in'}
              style={styles.requiredSubmitButton}
            />
            <View style={styles.requiredModeLine}>
              <View style={styles.requiredModeDivider} />
              <Pressable
                style={({ pressed }) => [styles.requiredModePrompt, pressed && styles.pressed]}
                onPress={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                accessibilityRole="button"
                accessibilityLabel={mode === 'sign-in' ? 'Create an account' : 'Sign in instead'}
              >
                <Text style={styles.requiredModePromptText}>
                  {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.requiredModePromptAction}>{mode === 'sign-in' ? 'Create account' : 'Sign in'}</Text>
                </Text>
              </Pressable>
              <View style={styles.requiredModeDivider} />
            </View>
          </View>

          {notice ? <Typography variant="caption" color={colors.sageDeep} style={styles.message}>{notice}</Typography> : null}
          {authError ? <Typography variant="caption" color={colors.error} style={styles.message}>{authError}</Typography> : null}
        </Card>

        {showGoogleButton || showAppleButton ? (
          <View style={styles.requiredProviderSection}>
            <View style={styles.requiredOrRow}>
              <View style={styles.requiredOrLine} />
              <Text style={styles.requiredOrText}>OR</Text>
              <View style={styles.requiredOrLine} />
            </View>
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
          </View>
        ) : null}

        <View style={[styles.requiredPrivacyNote, responsive.isCompactPhone && styles.compactCardPadding]}>
          <ShieldCheckIcon />
          <Text style={styles.requiredPrivacyText}>Your account data stays private. Hale never creates public profiles.</Text>
        </View>
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
          : mode === 'forgot-password'
          ? 'Enter the email you use for Hale. We will send a link to choose a new password.'
          : isSignedIn
          ? ACCOUNT_SIGNED_IN_COPY
          : context === 'settings'
          ? 'Sign in if you want Hale to keep your check-up history and account setup available when you return.'
          : 'Sign in or create an account so Hale can save your check-ups, sessions, and progress.'}
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
                Delete Hale data from this phone, or delete your account and synced Hale data.
              </Typography>
              {pendingDataAction ? (
                <View style={styles.confirmPanel}>
                  <Typography variant="bodySmall" color={colors.textPrimary}>
                    {pendingDataAction === 'delete-account'
                      ? 'This asks Hale to delete synced account data, then removes Hale data from this phone and signs you out.'
                      : 'This removes Hale data stored on this phone and signs you out. Synced account data is not deleted.'}
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
              After you open the link, return to Hale and sign in with your new password.
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
              placeholder="What should Hale call you?"
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

function AuthInputField({
  label,
  icon,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
  ...inputProps
}: TextInputProps & {
  label: string;
  icon: 'account' | 'mail' | 'lock';
  rightIcon?: 'eye';
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
}) {
  return (
    <View style={styles.authField}>
      <Text style={styles.authFieldLabel}>{label}</Text>
      <View style={styles.authInputShell}>
        <AuthFieldIcon name={icon} />
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.textTertiary}
          style={styles.authTextInput}
        />
        {rightIcon === 'eye' && onRightPress ? (
          <Pressable
            style={({ pressed }) => [styles.authInputIconButton, pressed && styles.pressed]}
            onPress={onRightPress}
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel ?? 'Toggle password visibility'}
          >
            <EyeIcon />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AuthFieldIcon({ name }: { name: 'account' | 'mail' | 'lock' }) {
  const common = {
    stroke: colors.textTertiary,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      {name === 'account' ? (
        <>
          <Circle cx={12} cy={8.4} r={3} {...common} />
          <Path d="M5.8 19 C6.7 15.8, 8.9 14.2, 12 14.2 C15.1 14.2, 17.3 15.8, 18.2 19" {...common} />
        </>
      ) : null}
      {name === 'mail' ? (
        <>
          <Rect x={4.5} y={6.7} width={15} height={11} rx={2.2} {...common} />
          <Path d="M6 8.9 L12 13.2 L18 8.9" {...common} />
        </>
      ) : null}
      {name === 'lock' ? (
        <>
          <Rect x={6.5} y={10.1} width={11} height={8.3} rx={2} {...common} />
          <Path d="M9 10.1 V7.8 C9 5.8, 10.2 4.7, 12 4.7 C13.8 4.7, 15 5.8, 15 7.8 V10.1" {...common} />
        </>
      ) : null}
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.7 12 C5.5 8.8, 8.4 7.2, 12 7.2 C15.6 7.2, 18.5 8.8, 20.3 12 C18.5 15.2, 15.6 16.8, 12 16.8 C8.4 16.8, 5.5 15.2, 3.7 12 Z"
        stroke={colors.textTertiary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={2.4} stroke={colors.textTertiary} strokeWidth={1.8} />
    </Svg>
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

function ShieldCheckIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 5.8 L30.8 9.9 V18.3 C30.8 25.5 26.2 30.2 20 33.2 C13.8 30.2 9.2 25.5 9.2 18.3 V9.9 Z"
        stroke={colors.accentDeep}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 20.2 L18.5 23.2 L24.9 16.7"
        stroke={colors.accentDeep}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
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
  requiredAuthStack: {
    gap: spacing.xl,
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
  requiredPrimaryStack: {
    gap: spacing.md,
  },
  authField: {
    gap: spacing.xs,
  },
  authFieldLabel: {
    ...type.bodySmall,
    color: colors.textPrimary,
  },
  authInputShell: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  authTextInput: {
    ...type.bodySmall,
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    padding: 0,
    color: colors.textPrimary,
  },
  authInputIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
  },
  requiredForgotLink: {
    minHeight: 30,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  requiredModeLine: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  requiredModeDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  requiredModePrompt: {
    minHeight: 30,
    justifyContent: 'center',
  },
  requiredModePromptText: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  requiredModePromptAction: {
    color: colors.accentDeep,
    fontFamily: type.button.fontFamily,
  },
  requiredProviderSection: {
    gap: spacing.md,
  },
  requiredOrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  requiredOrLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  requiredOrText: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: type.button.fontFamily,
  },
  requiredPrivacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  requiredPrivacyText: {
    ...type.caption,
    flex: 1,
    maxWidth: 270,
    color: colors.textSecondary,
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
