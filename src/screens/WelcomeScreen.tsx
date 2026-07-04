import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const WELCOME_HERO_IMAGE = require('../../assets/images/hale-welcome-hero-v3.png');

export function WelcomeScreen({
  onStart,
  onDone,
  onBack,
  showDashboardLink = true,
}: {
  onStart: () => void;
  onDone: () => void;
  onBack?: () => void;
  showDashboardLink?: boolean;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen contentStyle={styles.screen}>
      {onBack ? (
        <View style={styles.backRow}>
          <BackArrowButton accessibilityLabel="Back to sign in" onPress={onBack} />
        </View>
      ) : null}

      <ScreenHeader
        eyebrow="Welcome"
        title="Welcome to Hale"
        subtitle="Hale starts by checking how you move today, then builds a simple 4-week plan you can do at home."
      />

      <View style={styles.heroImageCard}>
        <Image
          source={WELCOME_HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="contain"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={[styles.summaryPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryKicker}>Movement Check-Up</Text>
        </View>
        <Text style={styles.summaryTitle}>Start with a 10-minute check-up.</Text>
        <Text style={styles.summaryBody}>
          Hale checks a few everyday movements to understand your strength, balance, and mobility, then uses the results to build your plan. Just three short steps and you are ready to begin.
        </Text>
        <View style={styles.summaryFacts}>
          <SummaryMetric value="10 min" detail="Check-up" />
          <SummaryMetric value="3 areas" detail="Measured" />
          <SummaryMetric value="4 weeks" detail="Plan" />
        </View>
      </View>

      <View style={[styles.privacyPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.privacyHeader}>
          <View style={styles.privacyHeaderCopy}>
            <Text style={styles.privacyKicker}>Privacy</Text>
            <Text style={styles.privacyTitle}>No mirror. No judging.</Text>
          </View>
        </View>
        <Text style={styles.privacyIntro}>
          Hale uses the camera only to measure your movement. You will not see a live video of yourself, and Hale will not criticize how you move.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Get started" onPress={onStart} />
        {showDashboardLink ? <SecondaryButton title="Go to dashboard" onPress={onDone} /> : null}
      </View>
    </Screen>
  );
}

function SummaryMetric({ value, detail }: { value: string; detail: string }) {
  return (
    <View style={styles.summaryFact}>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
        {value}
      </Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  backRow: {
    alignItems: 'flex-start',
  },
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
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
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
    paddingHorizontal: spacing.md,
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
  },
  summaryDetail: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  privacyPanel: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.045)',
  },
  privacyHeader: {
    gap: spacing.xs,
  },
  privacyHeaderCopy: {
    minWidth: 0,
    gap: 3,
  },
  privacyKicker: {
    ...type.label,
    color: colors.accentDeep,
  },
  privacyTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  privacyIntro: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
