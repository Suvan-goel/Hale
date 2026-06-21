import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, PrimaryButton, Screen, ScreenHeader, StatusBadge } from '../../components/ui';
import { colors, fonts, radius, spacing, type } from '../../theme';
import { getBlockPurposeCopy, retestCountdownCopy } from '../adherenceCopy';
import { daysUntil } from '../dateUtils';
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
  const nowIso = new Date().toISOString();
  const focus = domainLabel(block.focusDomain);
  const goal = getLifeGoalDisplayText(lifeGoal);
  const retestMetric = getRetestMetric(Math.max(0, daysUntil(block.retestDate, nowIso)));

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScreenHeader
        eyebrow="4-week block"
        title="Your block is ready"
        subtitle={getBlockPurposeCopy(block, lifeGoal)}
      />

      <Card style={styles.planCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.label}>Built around your goal</Text>
            <Text style={styles.planLabel}>{focus} focus</Text>
            <Text style={styles.goal}>{goal}</Text>
          </View>
          <StatusBadge label="Ready" tone="good" />
        </View>

        <View style={styles.focusPanel}>
          <Text style={styles.focusTitle}>A steady starter rhythm</Text>
          <Text style={styles.focusBody}>
            Starts with your highlighted area, then keeps each week simple to repeat.
          </Text>
        </View>

        <View style={styles.rhythmSection}>
          <Text style={styles.sectionLabel}>Plan rhythm</Text>
          <View style={styles.metricList}>
            <PlanMetric
              value={String(block.sessionsPerWeekTarget)}
              label="Sessions each week"
              detail="A steady weekly pace."
            />
            <View style={styles.metricRule} />
            <PlanMetric
              value={String(block.totalPlannedSessions)}
              label="Sessions total"
              detail="Over 4 weeks."
            />
            <View style={styles.metricRule} />
            <PlanMetric
              value={retestMetric.value}
              label={retestMetric.label}
              detail={retestCountdownCopy(block, nowIso)}
            />
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start first session" onPress={onStartSession} />
        <Button title="Not now" variant="ghost" onPress={onDone} style={styles.dashboardButton} />
      </View>
    </Screen>
  );
}

function getRetestMetric(days: number): { value: string; label: string } {
  if (days === 0) return { value: 'Now', label: 'Re-test ready' };
  if (days === 1) return { value: '1', label: 'Day to re-test' };
  return { value: String(days), label: 'Days to re-test' };
}

function PlanMetric({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricNumberWrap}>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.xl,
  },
  planCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.045)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  label: {
    ...type.label,
    color: colors.accentDeep,
  },
  planLabel: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  goal: {
    fontFamily: fonts.serifMedium,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: 0,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  focusPanel: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  focusTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  focusBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  rhythmSection: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sectionLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  metricList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  metricRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 54,
  },
  metricNumberWrap: {
    width: 40,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metricLabel: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  metricDetail: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
  dashboardButton: {
    minHeight: 36,
    paddingVertical: spacing.xs,
  },
});
