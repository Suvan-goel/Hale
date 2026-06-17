import * as React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../services/backend';
import { colors, radius, spacing, type } from '../theme';
import { Button, Card, Input, ListRow, SegmentedTabs, StatusBadge, Typography } from './ui';

type AccountMode = 'sign-in' | 'sign-up';

export function AccountAuthCard({
  context,
  initialMode = 'sign-in',
}: {
  context: 'required' | 'settings';
  initialMode?: AccountMode;
}) {
  const {
    error,
    isSignedIn,
    loading,
    profile,
    refreshProfile,
    signIn,
    signInWithApple,
    signInWithGoogle,
    signOut,
    signUp,
    user,
  } = useAuth();
  const [mode, setMode] = React.useState<AccountMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const authError = localError ?? error;
  const title = context === 'required' ? 'Account access' : 'Account';
  const showGoogleButton = Platform.OS === 'ios' || Platform.OS === 'android';
  const showAppleButton = Platform.OS === 'ios' && appleAvailable;

  React.useEffect(() => {
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
  }, []);

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

  return (
    <Card style={context === 'required' ? styles.authCard : undefined}>
      <View style={styles.sectionHead}>
        <Typography variant="h3" color={colors.textPrimary}>{title}</Typography>
        {isSignedIn ? <StatusBadge label="Signed in" tone="good" /> : null}
      </View>
      <Typography variant="caption" color={colors.textSecondary} style={styles.sectionHint}>
        {isSignedIn
          ? 'Your account is active. Hale saves profile setup to your account while movement data stays local for now.'
          : 'Sign in or create an account to keep your progress saved.'}
      </Typography>

      {isSignedIn ? (
        <View style={styles.stack}>
          <ListRow title="Email" value={user?.email ?? 'Signed in'} />
          <ListRow title="Name" value={profile?.full_name ?? 'Not set'} />
          <Button title={loading ? 'Signing out...' : 'Sign out'} variant="secondary" onPress={submitSignOut} disabled={loading} />
        </View>
      ) : (
        <View style={styles.stack}>
          <SegmentedTabs
            value={mode}
            onChange={changeMode}
            options={[
              { value: 'sign-in', label: 'Sign in' },
              { value: 'sign-up', label: 'Sign up' },
            ]}
          />
          {showGoogleButton || showAppleButton ? (
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
          <Button
            title={loading ? 'Working...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
            onPress={submit}
            disabled={loading}
            accessibilityLabel={mode === 'sign-up' ? 'Create account' : 'Sign in'}
            style={styles.submitButton}
          />
          <Pressable
            style={({ pressed }) => [styles.modeLink, pressed && styles.pressed]}
            onPress={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            accessibilityRole="button"
            accessibilityLabel={mode === 'sign-in' ? 'Create an account' : 'Sign in instead'}
          >
            <Text style={styles.modeLinkText}>
              {mode === 'sign-in' ? 'New to Hale? Create an account' : 'Already have an account? Sign in'}
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
      style={dark ? styles.socialButtonDark : undefined}
      textStyle={dark ? styles.socialButtonTextDark : undefined}
    />
  );
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const styles = StyleSheet.create({
  authCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.panel,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionHint: { marginTop: spacing.xs },
  stack: { gap: spacing.lg, marginTop: spacing.lg },
  socialStack: { gap: spacing.sm, marginTop: spacing.xs },
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
  field: {},
  submitButton: {
    marginTop: spacing.xs,
  },
  modeLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeLinkText: { ...type.bodySmall, color: colors.accentDeep, fontFamily: type.button.fontFamily, textAlign: 'center' },
  message: { marginTop: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
