import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

const RESTART_HERO_IMAGE = require('../../../assets/images/hale-clean-slate-restart-hero-v1.png');
const RESTART_COPY = {
  title: 'Start from where your body is today',
  subtitle: 'Let’s restart gently and keep the plan moving from here.',
  cta: 'Restart my block',
} as const;

export function RestartSessionScreen({
  onStart,
  onCancel,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.backRow}>
        <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      </View>

      <ScreenHeader eyebrow="Clean slate" title={RESTART_COPY.title} subtitle={RESTART_COPY.subtitle} />

      <View style={styles.heroImageCard}>
        <Image
          source={RESTART_HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={styles.summaryPanel}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryKicker}>Restart session</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>Counts this week</Text>
          </View>
        </View>

        <Text style={styles.summaryTitle}>A calm way back in.</Text>
        <Text style={styles.summaryBody}>
          Today is shorter on purpose. You’ll do a few focused movements, get credit for the week, and keep your current plan moving.
        </Text>

        <View style={styles.summaryFacts}>
          <SummaryMetric value="3-4" detail="Movements" />
          <SummaryMetric value="Gentle" detail="Pace" />
          <SummaryMetric value="Current" detail="Plan" />
        </View>
      </View>

      <View style={styles.routePanel}>
        <SectionHeader title="Today’s route" note="Voice guided" />
        <RouteStep
          index="01"
          title="Check your setup"
          body="Make sure your phone can see you clearly before the session starts."
        />
        <RouteStep
          index="02"
          title="Short focused set"
          body="Move through three to four movements from your current plan."
        />
        <RouteStep
          index="03"
          title="Gentle finish"
          body="End with enough work to restart without overdoing it."
          isLast
        />
      </View>

      <View style={styles.reassurancePanel}>
        <Text style={styles.reassuranceKicker}>What changes today</Text>
        <Text style={styles.reassuranceText}>No catch-up work. A shorter session is enough to restart and keep the week moving.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title={RESTART_COPY.cta} onPress={onStart} />
      </View>
    </Screen>
  );
}

function SummaryMetric({ value, detail }: { value: string; detail: string }) {
  return (
    <View style={styles.summaryFact}>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
        {value}
      </Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function SectionHeader({ title, note }: { title: string; note: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionNote}>{note}</Text>
    </View>
  );
}

function RouteStep({
  index,
  title,
  body,
  isLast = false,
}: {
  index: string;
  title: string;
  body: string;
  isLast?: boolean;
}) {
  return (
    <View style={styles.routeStep}>
      <View style={styles.routeRail}>
        <Text style={styles.routeIndex}>{index}</Text>
        {!isLast ? <View style={styles.routeLine} /> : null}
      </View>
      <View style={styles.routeCopy}>
        <Text style={styles.routeTitle}>{title}</Text>
        <Text style={styles.routeBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  backRow: {
    alignItems: 'flex-start',
  },
  heroImageCard: {
    aspectRatio: 16 / 11,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgMaterial,
    ...shadow.card,
    boxShadow: '0 14px 34px rgba(17,20,18,0.05)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  summaryPanel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
  },
  summaryTopRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryKicker: {
    ...type.label,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  summaryBadge: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  summaryBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  summaryTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  summaryBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  summaryFacts: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  summaryFact: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  summaryValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  summaryDetail: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  routePanel: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 10px 26px rgba(17,20,18,0.04)',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sectionNote: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    paddingTop: 4,
  },
  routeStep: {
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 74,
  },
  routeRail: {
    width: 38,
    alignItems: 'center',
  },
  routeIndex: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  routeLine: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    minHeight: 34,
    marginTop: spacing.md,
    backgroundColor: colors.borderHairline,
  },
  routeCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.lg,
    minWidth: 0,
  },
  routeTitle: {
    ...type.h3,
    fontSize: 17,
    lineHeight: 23,
  },
  routeBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  reassurancePanel: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.035)',
  },
  reassuranceKicker: {
    ...type.label,
    color: colors.accentGold,
  },
  reassuranceText: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
