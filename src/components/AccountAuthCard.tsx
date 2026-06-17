import * as React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../services/backend';
import { colors, radius, spacing, type } from '../theme';
import { Card, Eyebrow, StatusBadge } from './ui';

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
        <Eyebrow>{title}</Eyebrow>
        {isSignedIn ? <StatusBadge label="Signed in" tone="good" /> : null}
      </View>
      <Text style={styles.sectionHint}>
        {isSignedIn
          ? 'Your account is active. Hale saves profile setup to your account while movement data stays local for now.'
          : 'Use the same account to keep your setup, check-up history, and training progress connected.'}
      </Text>

      {isSignedIn ? (
        <View style={styles.stack}>
          <InfoRow label="Email" value={user?.email ?? 'Signed in'} />
          <InfoRow label="Name" value={profile?.full_name ?? 'Not set'} />
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={submitSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.secondaryButtonText}>{loading ? 'Signing out...' : 'Sign out'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.stack}>
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
          <View style={styles.modeRow}>
            <Segment label="Sign in" selected={mode === 'sign-in'} onPress={() => changeMode('sign-in')} />
            <Segment label="Sign up" selected={mode === 'sign-up'} onPress={() => changeMode('sign-up')} />
          </View>
          {mode === 'sign-up' ? (
            <Field label="Full name optional">
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="next"
                accessibilityLabel="Full name"
              />
            </Field>
          ) : null}
          <Field label="Email">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              accessibilityLabel="Email"
            />
          </Field>
          <Field label="Password">
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              returnKeyType="done"
              accessibilityLabel="Password"
            />
          </Field>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              loading && styles.buttonDisabled,
              pressed && !loading && styles.pressed,
            ]}
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={mode === 'sign-up' ? 'Create account' : 'Sign in'}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Working...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </Text>
          </Pressable>
        </View>
      )}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {authError ? <Text style={styles.error}>{authError}</Text> : null}
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
    <Pressable
      style={({ pressed }) => [
        styles.socialButton,
        dark && styles.socialButtonDark,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.socialButtonText, dark && styles.socialButtonTextDark]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.segmentTitle, selected && styles.segmentTitleSelected]}>{label}</Text>
    </Pressable>
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
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionHint: { ...type.caption, marginTop: spacing.sm },
  stack: { marginTop: spacing.md },
  socialStack: { gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.sm },
  socialButton: {
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonDark: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  socialButtonText: { ...type.bodySmall, color: colors.accentDeep, fontFamily: type.button.fontFamily },
  socialButtonTextDark: { color: colors.onAccent },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  dividerText: { ...type.caption, color: colors.textTertiary },
  field: { marginTop: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    ...type.body,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  segment: {
    minWidth: 92,
    minHeight: 42,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  segmentSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  segmentTitle: { ...type.bodySmall },
  segmentTitleSelected: { color: colors.accentDeep },
  primaryButton: {
    minHeight: 52,
    marginTop: spacing.lg,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accentDeep,
  },
  primaryButtonText: { ...type.button },
  secondaryButton: {
    minHeight: 50,
    marginTop: spacing.lg,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { ...type.button, color: colors.accentDeep },
  buttonDisabled: { opacity: 0.58 },
  notice: { ...type.caption, color: colors.sageDeep, marginTop: spacing.md },
  error: { ...type.caption, color: colors.error, marginTop: spacing.md },
  infoRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  infoLabel: { ...type.bodySmall, color: colors.textSecondary, flex: 1 },
  infoValue: { ...type.bodySmall, color: colors.accentDeep, textAlign: 'right', flex: 1 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
