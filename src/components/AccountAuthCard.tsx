import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
  const { error, isSignedIn, loading, profile, refreshProfile, signIn, signOut, signUp, user } = useAuth();
  const [mode, setMode] = React.useState<AccountMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const authError = localError ?? error;
  const title = context === 'required' ? 'Sign in to Hale' : 'Account';

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
        <StatusBadge label={isSignedIn ? 'Signed in' : 'Required'} tone={isSignedIn ? 'good' : 'gold'} />
      </View>
      <Text style={styles.sectionHint}>
        {isSignedIn
          ? 'Your account is active. Hale saves profile setup to your account while movement data stays local for now.'
          : 'Use your account to save Hale progress and keep your setup connected to you.'}
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
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionHint: { ...type.caption, marginTop: spacing.sm },
  stack: { marginTop: spacing.lg },
  field: { marginTop: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    ...type.body,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    borderRadius: radius.card,
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segment: {
    minWidth: 92,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  segmentSelected: { backgroundColor: colors.sageMist, borderColor: colors.restorativeGreen },
  segmentTitle: { ...type.bodySmall },
  segmentTitleSelected: { color: colors.accentDeep },
  primaryButton: {
    minHeight: 54,
    marginTop: spacing.lg,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accentDeep,
  },
  primaryButtonText: { ...type.button },
  secondaryButton: {
    minHeight: 54,
    marginTop: spacing.lg,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
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
