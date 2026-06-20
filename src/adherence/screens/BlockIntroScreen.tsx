import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import { getBlockPurposeCopy, retestCountdownCopy } from '../adherenceCopy';
import { domainLabel, getLifeGoalDisplayText } from '../goalDomainMapping';
import type { LifeGoal, MovementBlock } from '../types';

export function BlockIntroScreen({
  block,
  lifeGoal,
  onStartSession,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  onStartSession: () => void;
  onDone: () => void;
}) {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="4-week block"
        title="Training for the life you want to keep living"
        subtitle={getBlockPurposeCopy(block, lifeGoal)}
      />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.label}>Your goal</Text>
            <Text style={styles.value}>{getLifeGoalDisplayText(lifeGoal)}</Text>
          </View>
          <StatusBadge label="On device" tone="gold" />
        </View>
        <View style={styles.divider} />
        <Row label="Focus" value={domainLabel(block.focusDomain)} />
        <Row label="Plan" value={`${block.totalPlannedSessions} sessions over 4 weeks`} />
        <Row label="Re-test" value={retestCountdownCopy(block, new Date().toISOString())} />
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start a short starter session" onPress={onStartSession} />
        <SecondaryButton title="Schedule my first session" onPress={onDone} />
        <SecondaryButton title="Go to dashboard" onPress={onDone} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, flexWrap: 'wrap' },
  rowCopy: { flex: 1 },
  label: { ...type.label },
  value: { ...type.cardTitle, marginTop: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  detailRow: { gap: spacing.xs },
  detailValue: { ...type.cardBody },
  actions: { gap: spacing.md },
});
