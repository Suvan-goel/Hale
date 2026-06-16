import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MovementBlock } from '../adherence';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../components/ui';
import { blockFocusCopy } from '../onboarding/results';
import { colors, spacing, type } from '../theme';

export function OnboardingBlockScreen({
  block,
  onStartSession,
  onGoToday,
}: {
  block: MovementBlock;
  onStartSession: () => void;
  onGoToday: () => void;
}) {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Step 9 of 10"
        title="Your first 4-week block"
        subtitle="Hale has turned your Movement Check-Up into a simple starting plan."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Focus</Text>
          <StatusBadge label="Ready" tone="good" />
        </View>
        <Text style={styles.focus}>{blockFocusCopy(toTrainingFocus(block.focusDomain))}</Text>
        <Row label="Plan" value="3 sessions per week" />
        <Row label="Time" value="About 20 minutes each" />
        <Row label="Re-test" value="In 4 weeks to see what changed" />
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start first session" onPress={onStartSession} />
        <SecondaryButton title="Go to Today" onPress={onGoToday} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function toTrainingFocus(domain: MovementBlock['focusDomain']) {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  focus: { ...type.h1 },
  row: { gap: spacing.xs },
  label: { ...type.label, color: colors.textSecondary },
  value: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
});
