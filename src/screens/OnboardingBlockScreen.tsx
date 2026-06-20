import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { MovementBlock } from '../adherence';
import { Card, ListRow, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge, Typography } from '../components/ui';
import { blockFocusCopy } from '../onboarding/results';
import { spacing } from '../theme';

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
          <Typography variant="h2">Focus</Typography>
          <StatusBadge label="Ready" tone="good" />
        </View>
        <Typography variant="h1">{blockFocusCopy(toTrainingFocus(block.focusDomain))}</Typography>
        <Row label="Plan" value="3 sessions per week" />
        <Row label="Time" value="About 20 minutes each" />
        <Row label="Re-test" value="In 4 weeks to add another data point" />
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start first session" onPress={onStartSession} />
        <SecondaryButton title="Go to Today" onPress={onGoToday} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <ListRow title={label} value={value} />;
}

function toTrainingFocus(domain: MovementBlock['focusDomain']) {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  actions: { gap: spacing.md },
});
