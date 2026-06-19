import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, StatusBadge } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import { generateWeeklySummary } from '../weeklySummary';
import type { LifeGoal, MovementBlock, SupportConnection, TrainingSessionCompletion } from '../types';
import { createSupportSummary } from '../supportCircleService';

export function WeeklySummaryScreen({
  block,
  lifeGoal,
  completions,
  supportConnection,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  supportConnection?: SupportConnection | null;
  onDone: () => void;
}) {
  const summary = generateWeeklySummary({ block, lifeGoal, completions });
  const support = createSupportSummary({ connection: supportConnection, block, completions });
  return (
    <Screen>
      <ScreenHeader eyebrow={`Week ${summary.weekNumber}`} title={summary.title} subtitle={summary.body} />
      <Card style={styles.card}>
        <Row label="Sessions" value={`${summary.sessionsCompleted} of ${block.sessionsPerWeekTarget}`} />
        <Row label="Micro-check" value={summary.microCheckCompleted ? 'Completed' : 'Ready when you are'} />
        <Row label="Next focus" value={summary.nextFocus} />
      </Card>
      {supportConnection && support.visible ? (
        <Card style={styles.card}>
          <View style={styles.supportHead}>
            <Text style={styles.title}>Support Circle</Text>
            <StatusBadge label="Shared by choice" tone="gold" />
          </View>
          <Text style={styles.body}>{support.headline}</Text>
          {support.detail ? <Text style={styles.body}>{support.detail}</Text> : null}
        </Card>
      ) : null}
      <PrimaryButton title="Done" onPress={onDone} />
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

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  row: { gap: spacing.xs },
  label: { ...type.label },
  value: { ...type.bodySmall, color: colors.textSecondary },
  supportHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
});
