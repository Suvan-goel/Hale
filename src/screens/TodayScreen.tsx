import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const HERO_IMAGE = require('../../assets/images/pearl-home-hero-botanical.png');

import { HeaderLogo } from '../components/HeaderLogo';
import { useScreenScrollClearance } from '../components/ui';
import type { ProgrammeTodayViewModel } from '../programme';
// The hero copy (title/subtitle/CTA) comes straight from the programme
// adapter's primary action — src/programme/appLifecycle.ts is the single
// source for that copy.
import { SettingsIcon } from '../navigation/icons';
import type { UserProfile } from '../profile';
import { colors, fonts, radius, shadow, spacing, todayHomeColors } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

/**
 * The Today tab (programme engine v2 — the only data source since the old
 * engine's decommission, promotion commit 2, 2026-07-08): greeting header,
 * the hero focus card carrying today's session and its Start CTA, and the
 * persistent check-up offer when one is due. Action-first by design — the
 * session CTA leads, nothing passive sits above it (2026-07-08: the "Your
 * levels" readout moved to Progress, where the reported training ladder
 * lives alongside the measured check-up). Since the Plan tab merged into
 * Home (simplification pass, 2026-07-08) this is the one place the plan
 * lives; training days stay editable in Settings.
 */
export interface TodayProgrammeMode {
  today: ProgrammeTodayViewModel;
  onStartCheckup?: () => void;
}

export function TodayScreen({
  profile,
  programme,
  onPrimaryAction,
  onOpenSettings,
}: {
  profile: UserProfile;
  programme: TodayProgrammeMode;
  onPrimaryAction: () => void;
  onOpenSettings?: () => void;
}) {
  const responsive = useResponsiveLayout();
  const bottomScrollClearance = useScreenScrollClearance();
  const compact = responsive.isCompactPhone;
  const primaryAction = programme.today.primaryAction;

  return (
    <View style={styles.background}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: responsive.maxContentWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingTop: responsive.pageTop,
            paddingBottom: bottomScrollClearance || spacing.xl,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <HeaderLogo />
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>
                {timeOfDayGreeting()}
              </Text>
              <Text style={styles.headerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                {headerName(profile.name)}
              </Text>
            </View>
          </View>
          {onOpenSettings ? (
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <SettingsIcon size={24} color={todayHomeColors.headingGreen} strokeWidth={1.8} />
            </Pressable>
          ) : null}
        </View>

        <DailyFocusCard
          compact={compact}
          label="Today"
          title={primaryAction.title}
          subtitle={primaryAction.subtitle}
          detail={programme.today.sessionDetail}
          ctaLabel={primaryAction.ctaLabel}
          onPress={onPrimaryAction}
        />

        {programme.today.checkupOffer && programme.onStartCheckup ? (
          <CheckupOfferCard
            compact={compact}
            title={programme.today.checkupOffer.title}
            ctaLabel={programme.today.checkupOffer.ctaLabel}
            onPress={programme.onStartCheckup}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

/** The persistent movement-check affordance (routine cadence / standing entry). */
function CheckupOfferCard({
  compact,
  title,
  ctaLabel,
  onPress,
}: {
  compact: boolean;
  title: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={[styles.contextStrip, compact && styles.compactCardPadding]}>
      <Text style={styles.contextTitle}>{title}</Text>
      <Pressable
        style={({ pressed }) => [styles.checkupButton, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={styles.checkupButtonText}>{ctaLabel}</Text>
        <Text style={styles.checkupButtonArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function DailyFocusCard({
  compact,
  label,
  title,
  subtitle,
  detail,
  ctaLabel,
  onPress,
}: {
  compact?: boolean;
  label: string;
  title: string;
  subtitle: string;
  detail?: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  const responsive = useResponsiveLayout();
  const heroMinHeightStyle = { minHeight: responsive.todayHeroHeight };
  const showDetail = detail && normalizedHeroMeta(detail) !== normalizedHeroMeta(subtitle);

  return (
    <View style={[styles.focusCard, compact && styles.focusCardCompact, heroMinHeightStyle]}>
      <Image source={HERO_IMAGE} style={[styles.focusImage, compact && styles.focusImageCompact]} resizeMode="cover" accessible={false} />
      <HomeHeroScrim />
      <View style={[styles.focusContent, compact && styles.focusContentCompact, heroMinHeightStyle]}>
        <View style={[styles.focusCopy, compact && styles.focusCopyCompact]}>
          <Text style={styles.focusLabel}>{label}</Text>
          <Text style={[styles.focusTitle, compact && styles.focusTitleCompact]}>{title}</Text>
          <View style={styles.focusMeta}>
            <Text style={styles.focusSubtitle}>{subtitle}</Text>
            {showDetail ? <Text style={styles.focusDetail}>{detail}</Text> : null}
          </View>
        </View>
        {ctaLabel ? (
          <View style={[styles.focusAction, compact && styles.focusActionCompact]}>
            <Pressable
              style={({ pressed }) => [styles.focusButton, compact && styles.compactControlPadding, pressed && styles.focusButtonPressed]}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={ctaLabel}
            >
              <Text style={styles.focusButtonText}>{ctaLabel}</Text>
              <Text style={styles.focusButtonArrow}>›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function normalizedHeroMeta(value: string): string {
  return value
    .toLowerCase()
    .replace(/\btoday\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function HomeHeroScrim() {
  return (
    <Svg pointerEvents="none" style={styles.focusScrim}>
      <Defs>
        <LinearGradient id="homeHeroScrimH" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.bgBase} stopOpacity={0.9} />
          <Stop offset="0.58" stopColor={colors.bgBase} stopOpacity={0.46} />
          <Stop offset="1" stopColor={colors.bgBase} stopOpacity={0.08} />
        </LinearGradient>
        <LinearGradient id="homeHeroScrimV" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.bgBase} stopOpacity={0.72} />
          <Stop offset="0.5" stopColor={colors.bgBase} stopOpacity={0.18} />
          <Stop offset="1" stopColor={colors.bgBase} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={colors.bgBase} opacity={0.08} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#homeHeroScrimH)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#homeHeroScrimV)" />
    </Svg>
  );
}

function firstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function headerName(name?: string | null): string {
  return firstName(name) ?? 'Welcome';
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: todayHomeColors.background,
  },
  scroller: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 0, justifyContent: 'center' },
  greeting: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0,
  },
  headerName: {
    color: colors.primaryText,
    fontFamily: fonts.serifRegular,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: 0,
  },
  iconButton: {
    // Comfortable tap target for the 50+ audience (matches minTapTarget);
    // stays transparent-on-warm rather than the shared chip-style button.
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  contextStrip: {
    minHeight: 92,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: todayHomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: todayHomeColors.border,
    ...shadow.card,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  compactControlPadding: {
    paddingHorizontal: 16,
  },
  contextTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.serifMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  checkupButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.button,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.accent,
    marginTop: 13,
  },
  checkupButtonText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  checkupButtonArrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  focusCard: {
    minHeight: 274,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.hero,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
  },
  focusCardCompact: {
    minHeight: 286,
    borderRadius: radius.card,
  },
  focusImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '118%',
    height: '100%',
  },
  focusImageCompact: {
    width: '124%',
  },
  focusScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  focusContent: {
    minHeight: 274,
    paddingVertical: 26,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  focusContentCompact: {
    minHeight: 286,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  focusCopy: {
    width: '72%',
    gap: 12,
  },
  focusCopyCompact: {
    width: '70%',
    gap: 11,
  },
  focusMeta: {
    gap: 3,
  },
  focusLabel: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  focusTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  focusTitleCompact: {
    fontSize: 25,
    lineHeight: 31,
  },
  focusSubtitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  focusDetail: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  focusAction: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    paddingTop: 16,
  },
  focusActionCompact: {
    paddingTop: 16,
  },
  focusButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.button,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
  },
  focusButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  focusButtonText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  focusButtonArrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
