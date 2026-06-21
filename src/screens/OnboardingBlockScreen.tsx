import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { MovementBlock } from '../adherence';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../components/ui';
import { blockFocusCopy } from '../onboarding/results';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const FIRST_BLOCK_HERO_IMAGE = require('../../assets/images/hale-first-block-hero-v4.png');

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
        eyebrow="Plan ready"
        title="Your first block is ready"
        subtitle="Hale has turned your check-up, goal, comfort details, and home setup into a simple starting plan."
      />

      <View style={styles.heroImageCard}>
        <Image
          source={FIRST_BLOCK_HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="contain"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      </View>

      <Card style={styles.planCard}>
        <View style={styles.planTopRow}>
          <View style={styles.planIdentity}>
            <View style={styles.planIdentityCopy}>
              <Text style={styles.planKicker}>First block</Text>
              <Text style={styles.planLabel}>{focusLabel(block.focusDomain)} focus</Text>
            </View>
          </View>
          <StatusBadge label="Ready" tone="good" />
        </View>

        <Text style={styles.focusTitle}>{blockFocusCopy(toTrainingFocus(block.focusDomain))}</Text>
        <Text style={styles.focusBody}>
          Your first block starts with a measured routine built around this focus, your setup, and what felt manageable today.
        </Text>

        <View style={styles.rhythmSection}>
          <Text style={styles.sectionLabel}>Plan rhythm</Text>
          <View style={styles.metricList}>
            <PlanMetric value="3" label="Sessions each week" detail="A steady weekly rhythm without crowding your calendar." />
            <View style={styles.metricRule} />
            <PlanMetric value="20" label="Minutes per session" detail="Short enough to repeat, long enough to build momentum." />
            <View style={styles.metricRule} />
            <PlanMetric value="4" label="Weeks, then re-test" detail="Repeat the check-up after the block to compare progress." />
          </View>
        </View>

        <View style={styles.detailList}>
          <PlanDetail
            eyebrow="Built-in flexibility"
            title="Substitutions stay available"
            body="If equipment or space is limited, Hale keeps a simpler option ready."
          />
          <View style={styles.detailRule} />
          <PlanDetail
            eyebrow="Next checkpoint"
            title="Repeat the check-up in 4 weeks"
            body="Use the same movement baseline to see what changed after the block."
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start first session" onPress={onStartSession} />
        <SecondaryButton title="Go to Today" onPress={onGoToday} />
      </View>
    </Screen>
  );
}

function toTrainingFocus(domain: MovementBlock['focusDomain']) {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

function focusLabel(domain: MovementBlock['focusDomain']) {
  if (domain === 'balance') return 'Balance';
  if (domain === 'mobility') return 'Mobility';
  return 'Strength';
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

function PlanDetail({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailDot} />
      <View style={styles.detailCopy}>
        <Text style={styles.detailEyebrow}>{eyebrow}</Text>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroImageCard: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgMaterial,
    ...shadow.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  planCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.045)',
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planIdentityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  planKicker: {
    ...type.label,
    color: colors.accentDeep,
  },
  planLabel: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  focusTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0,
    color: colors.textPrimary,
    marginTop: spacing.md,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  metricRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  metricRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 58,
  },
  metricNumberWrap: {
    width: 42,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 30,
    lineHeight: 35,
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
  detailList: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentDeep,
    marginTop: 7,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailEyebrow: {
    ...type.label,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  detailTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
  },
  detailBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  detailRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 20,
  },
  actions: { gap: spacing.md },
});
