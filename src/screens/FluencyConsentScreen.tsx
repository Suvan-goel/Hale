import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, spacing, type } from '../theme';

/**
 * Fluency per-use consent (CLARITY_INSTRUMENTS_TDD §5.4, FL1) — THE
 * trust-critical surface of the privacy-model change. Shown immediately
 * before every fluency task, every time; consent is per-use and session-
 * scoped, never remembered as blanket permission.
 *
 * The copy states, implementation-true (pinned by fluencyPrivacy.test.ts):
 * what happens (speech → words, on her phone), for how long (~60 s), why
 * (only to count them), what is kept (the count, nothing else), what is not
 * (no words stored, nothing sent), and that this is DIFFERENT from how the
 * mic normally works here — the global commands/safety promise ("never
 * transcribed") is restated, not weakened. Skip is first-class: the check-up
 * completes normally without it (instrument records itself skipped).
 *
 * On iOS the in-context speech-recognition permission prompt is triggered
 * from Start (never at launch) — wired in FL2+; this screen owns only the
 * human consent. No-stall: the offer auto-skips after 30 s.
 */
export function FluencyConsentScreen({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const doneRef = React.useRef(false);
  const decide = React.useCallback(
    (action: () => void) => {
      if (doneRef.current) return;
      doneRef.current = true;
      action();
    },
    []
  );

  React.useEffect(() => {
    const timer = setTimeout(() => decide(onSkip), 30000);
    return () => clearTimeout(timer);
  }, [decide, onSkip]);

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader
        eyebrow="One more minute — optional"
        title="A 60-second word-finding check"
        subtitle="Name as many things in a category as you can, out loud, for one minute."
      />

      <View style={styles.consentCard}>
        <Text style={styles.consentTitle}>Before you start — how this uses the mic</Text>
        <Text style={styles.consentBody}>
          For the next 60 seconds, your speech is turned into words ON YOUR PHONE, only to
          count them. The words are not stored and not sent anywhere — the count is all that
          is kept.
        </Text>
        <Text style={styles.consentBody}>
          This is different from how the mic normally works here: everywhere else, nothing
          you say is ever transcribed — the app only listens for a few session and safety
          words.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="I understand — start" onPress={() => decide(onStart)} />
        <SecondaryButton title="Skip this part" onPress={() => decide(onSkip)} />
      </View>
      <Text style={styles.gentle}>
        Skipping changes nothing about your check-up results — this part is yours to take or
        leave, every month.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  consentCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  consentTitle: {
    ...type.cardTitle,
  },
  consentBody: {
    ...type.cardBody,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.md,
  },
  gentle: {
    ...type.caption,
    color: colors.textSecondary,
  },
});
