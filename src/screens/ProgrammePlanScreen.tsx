/**
 * Programme v2 plan surface (promotion integration Phase 3): the levels +
 * upcoming-session view that replaces the old block/week plan tab at
 * promotion, in the old Plan screen's design language — hero card with the
 * mountain image and scrim, warm cards with section titles. Data comes from
 * the programme adapter (today view model + level rows) and the content
 * layer (day labels); no copy or programme logic lives here beyond labels
 * already scanned elsewhere.
 */

import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BackArrowButton } from '../components/BackArrowButton';
import { Card, Screen, SectionTitle, SecondaryButton } from '../components/ui';
import {
  onboardingQuestionContent,
  type ProgrammeLevelRow,
  type ProgrammeTodayViewModel,
  type Weekday,
} from '../programme';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const PLAN_HERO_IMAGE = require('../../assets/images/hale-plan-hero-mountain.png');

export function ProgrammePlanScreen({
  today,
  levelRows,
  chosenDays,
  onBack,
  onStartSession,
  onStartCheckup,
}: {
  today: ProgrammeTodayViewModel;
  levelRows: readonly ProgrammeLevelRow[];
  chosenDays: readonly Weekday[];
  /** Present when pushed as a flow; absent when mounted as the Plan tab. */
  onBack?: () => void;
  onStartSession: () => void;
  onStartCheckup?: () => void;
}) {
  const responsive = useResponsiveLayout();
  const heroMinHeightStyle = { minHeight: responsive.planHeroHeight };
  // Day labels come from the claims-scanned content layer (D1 options).
  const dayLabelByValue = new Map(
    onboardingQuestionContent('d1_days').options.map((option) => [option.value, option.label])
  );

  return (
    <Screen contentStyle={styles.screen}>
      {onBack ? (
        <View style={styles.backRow}>
          <BackArrowButton accessibilityLabel="Back to today" onPress={onBack} />
        </View>
      ) : null}

      <View style={[styles.heroCard, heroMinHeightStyle]}>
        <Image source={PLAN_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" accessible={false} />
        <HeroScrim />
        <View style={[styles.heroContent, heroMinHeightStyle]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{today.primaryAction.title}</Text>
            <Text style={styles.heroBody}>{today.sessionDetail}</Text>
          </View>
          <View style={styles.heroAction}>
            <Pressable
              style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
              onPress={onStartSession}
              accessibilityRole="button"
              accessibilityLabel={today.primaryAction.ctaLabel}
            >
              <Text style={styles.heroButtonText}>{today.primaryAction.ctaLabel}</Text>
              <Text style={styles.heroButtonArrow}>›</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Card style={styles.card}>
        <SectionTitle>Your levels</SectionTitle>
        <View style={styles.levelRows}>
          {levelRows.map((row, index) => (
            <View
              key={row.pattern}
              style={[styles.levelRow, index === levelRows.length - 1 && styles.levelRowLast]}
            >
              <View style={styles.levelCopy}>
                <Text style={styles.levelPattern}>{row.patternTitle}</Text>
                <Text style={styles.levelName}>{row.levelDisplayName}</Text>
              </View>
              <Text style={styles.levelValue}>
                {row.currentLevel}
                <Text style={styles.levelValueTotal}> / {row.maxLevel}</Text>
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {chosenDays.length > 0 ? (
        <Card style={styles.card}>
          <SectionTitle>Your week</SectionTitle>
          <View style={styles.dayPills}>
            {chosenDays.map((day) => (
              <View key={day} style={styles.dayPill}>
                <Text style={styles.dayPillText}>{dayLabelByValue.get(day) ?? day}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {today.checkupOffer && onStartCheckup ? (
        <Card style={styles.card}>
          <SectionTitle>{today.checkupOffer.title}</SectionTitle>
          <View style={styles.checkupAction}>
            <SecondaryButton title={today.checkupOffer.ctaLabel} onPress={onStartCheckup} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function HeroScrim() {
  return (
    <Svg pointerEvents="none" style={styles.heroScrim}>
      <Defs>
        <LinearGradient id="programmePlanScrimH" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.accentDeep} stopOpacity={0.58} />
          <Stop offset="0.58" stopColor={colors.accentDeep} stopOpacity={0.18} />
          <Stop offset="1" stopColor={colors.accentDeep} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="programmePlanScrimV" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.accentDeep} stopOpacity={0.42} />
          <Stop offset="0.48" stopColor={colors.accentDeep} stopOpacity={0.1} />
          <Stop offset="1" stopColor={colors.accentDeep} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={colors.accentDeep} opacity={0.08} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#programmePlanScrimH)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#programmePlanScrimV)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    // No padding overrides: the shared Screen supplies responsive page
    // padding, and — critically for a TAB screen — the bottom padding is the
    // floating tab bar's scroll clearance. Overriding it pins the last cards
    // under the bar and the page "stops scrolling" (bug fixed 2026-07-08).
    gap: spacing.xl,
  },
  backRow: {
    alignItems: 'flex-start',
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.accentDeep,
    ...shadow.card,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '118%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  heroContent: {
    paddingVertical: 26,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  heroCopy: {
    width: '76%',
    gap: 10,
  },
  heroTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
  },
  heroBody: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  heroAction: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    paddingTop: 18,
  },
  heroButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  heroButtonText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  heroButtonArrow: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  card: {
    gap: spacing.md,
  },
  levelRows: {
    gap: 0,
  },
  levelRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderHairline,
  },
  levelRowLast: {
    borderBottomWidth: 0,
  },
  levelCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  levelPattern: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  levelName: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  levelValue: {
    color: colors.accentDeep,
    fontFamily: fonts.serifMedium,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  levelValueTotal: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  dayPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  dayPillText: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  checkupAction: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
