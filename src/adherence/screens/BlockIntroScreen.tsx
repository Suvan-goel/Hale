import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, PrimaryButton, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, spacing, type } from '../../theme';
import { domainLabel } from '../goalDomainMapping';
import { movementBlockDomainFocus } from '../blockFocus';
import type { LifeGoal, MovementBlock } from '../types';

export function BlockIntroScreen({
  block,
  onStartSession,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  onStartSession: () => void;
  onDone: () => void;
}) {
  const focusDomain = movementBlockDomainFocus(block);
  const focus = focusDomain ? domainLabel(focusDomain) : 'Balanced';

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScreenHeader
        eyebrow="4-week plan"
        title="Your 4-week plan is ready"
        subtitle="Hale built this from your latest check-up, your goal, and your home setup."
      />

      <Card style={styles.planCard}>
        <View style={styles.focusPanel}>
          <Text style={styles.sectionLabel}>Main focus</Text>
          <Text style={styles.focusTitle}>{focus}</Text>
          <Text style={styles.focusBody}>{focusDomain ? focusBenefitCopy(focusDomain) : 'This plan balances strength, steadiness, and mobility across the week.'}</Text>
        </View>

        <View style={styles.rhythmSection}>
          <Text style={styles.sectionLabel}>Plan rhythm</Text>
          <View style={styles.metricList}>
            <PlanMetric
              value={String(block.sessionsPerWeekTarget)}
              label="Sessions each week"
              detail="Hale will talk you through each one."
            />
            <View style={styles.metricRule} />
            <PlanMetric
              value="20"
              label="Minutes each session"
              detail="About 20 minutes. Short enough to repeat."
            />
            <View style={styles.metricRule} />
            <PlanMetric
              value="4"
              label="Weeks before next check-up"
              detail="Repeat the same check-up to see what changed."
            />
          </View>
        </View>

        <View style={styles.helpPanel}>
          <Text style={styles.helpTitle}>If something does not feel right</Text>
          <Text style={styles.helpBody}>
            Before a session starts, you can make it shorter, gentler, or use less equipment.
          </Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start first session" onPress={onStartSession} />
        <Button title="Not now" variant="ghost" onPress={onDone} style={styles.dashboardButton} />
      </View>
    </Screen>
  );
}

function focusBenefitCopy(domain: MovementBlock['focusDomain']): string {
  if (domain === 'balance') {
    return 'Your sessions will practice steadier movement for stairs, turns, curbs, and uneven ground.';
  }
  if (domain === 'mobility') {
    return 'Your sessions will practice reaching, bending, dressing, and moving comfortably.';
  }
  return 'Your sessions will practice standing from a chair, stairs, carrying, and everyday strength.';
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
  focusPanel: {
    gap: spacing.sm,
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
  helpPanel: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  helpTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  helpBody: {
    ...type.caption,
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
