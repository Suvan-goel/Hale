import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

const RESTART_HERO_IMAGE = require('../../../assets/images/hale-clean-slate-restart-hero-v1.png');
const RESTART_COPY = {
  title: 'Ease back in',
  subtitle: 'A shorter session is enough to restart your plan today.',
  cta: 'Start gentle restart',
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
        <Text style={styles.summaryTitle}>A lighter session today</Text>
        <Text style={styles.summaryBody}>
          You'll do a few gentle movements from your current plan. This counts for the week and keeps your block moving.
        </Text>

        <View style={styles.summaryFacts}>
          <SummaryMetric value="3-4" detail="Movements" />
          <SummaryMetric value="Gentle" detail="Pace" />
          <SummaryMetric value="Counts" detail="This week" />
        </View>
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
  actions: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
