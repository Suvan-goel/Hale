import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, PrimaryButton, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, spacing, type } from '../../theme';
import { domainLabel } from '../goalDomainMapping';
import { movementBlockDomainFocus } from '../blockFocus';
import type { LifeGoal, MovementBlock } from '../types';

import { BRAND } from '../../brand';
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
        subtitle={`${BRAND.appName} built this from your latest check-up, your goal, and your home setup.`}
      />

      <View style={styles.focusHero}>
        <View style={styles.focusHeroTopRow}>
          <Text style={styles.focusHeroKicker}>Main focus</Text>
          <View style={styles.readyPill}>
            <Text style={styles.readyPillText}>Ready</Text>
          </View>
        </View>
        <Text style={styles.focusHeroTitle}>{focus}</Text>
        <Text style={styles.focusHeroBody}>
          {focusDomain
            ? focusBenefitCopy(focusDomain)
            : 'This plan balances strength, steadiness, and mobility across the week.'}
        </Text>
      </View>

      <Card style={styles.planCard}>
        <View style={styles.rhythmSection}>
          <Text style={styles.sectionLabel}>Plan rhythm</Text>
          <View style={styles.metricList}>
            <PlanMetric
              value={String(block.sessionsPerWeekTarget)}
              label="Sessions each week"
              detail={`${BRAND.appName} will talk you through each one.`}
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
      </Card>

      <Card style={styles.supportCard}>
        <View style={styles.helpPanel}>
          <Text style={styles.sectionLabel}>During sessions</Text>
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
    gap: spacing.lg,
  },
  focusHero: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(17,20,18,0.055)',
  },
  focusHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  focusHeroKicker: {
    ...type.label,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  readyPill: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  readyPillText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  focusHeroTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 0,
    color: colors.accentDeep,
    flexShrink: 1,
  },
  focusHeroBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
    maxWidth: 340,
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
  rhythmSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  metricList: {
    overflow: 'hidden',
    borderRadius: radius.input,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  metricRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  metricRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 58,
  },
  metricNumberWrap: {
    width: 44,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0,
    color: colors.accentDeep,
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
  supportCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
  },
  helpPanel: {
    gap: spacing.xs,
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
