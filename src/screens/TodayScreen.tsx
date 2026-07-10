import * as React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppBackground } from '../components/AppBackground';
import { HeaderLogo } from '../components/HeaderLogo';
import { useScreenScrollClearance } from '../components/ui';
import { SettingsIcon } from '../navigation/icons';
import type { ProgrammeTodayViewModel } from '../programme';
import type { UserProfile } from '../profile';
import { colors, fonts, radius, shadow, spacing, todayHomeColors } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const HERO_IMAGE = require('../../assets/images/pearl-home-hero-botanical.png');

export interface TodayProgrammeMode {
  today: ProgrammeTodayViewModel;
}

/**
 * Home is the action surface: one greeting and one dynamic hero. Programme
 * structure lives on Plan; measured change and Everyday Clarity live on
 * Progress. No secondary card competes with the next required action here.
 */
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
  const action = programme.today.primaryAction;
  const checkUpAction = action.type === 'start_baseline_checkup';

  return (
    <View style={styles.background}>
      <AppBackground />
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
          <View style={styles.identity}>
            <HeaderLogo size={44} />
            <View style={styles.greetingCopy}>
              <Text style={styles.greeting}>{timeOfDayGreeting()}</Text>
              <Text
                style={styles.name}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {firstName(profile.name) ?? 'Welcome'}
              </Text>
            </View>
          </View>
          {onOpenSettings ? (
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <SettingsIcon size={24} color={colors.textSecondary} strokeWidth={1.8} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.hero,
            { minHeight: Math.max(390, responsive.todayHeroHeight) },
            pressed && styles.heroPressed,
          ]}
          onPress={onPrimaryAction}
          accessibilityRole="button"
          accessibilityLabel={`${action.ctaLabel}. ${action.title}. ${action.subtitle}`}
        >
          <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" accessible={false} />
          <HeroScrim />
          <View style={styles.heroContent}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>
                {checkUpAction ? 'MOVEMENT CHECK-UP' : 'TODAY'}
              </Text>
              <Text style={styles.heroTitle}>{action.title}</Text>
              <Text style={styles.heroSubtitle}>{action.subtitle}</Text>
            </View>
            <View style={styles.heroButton}>
              <Text style={styles.heroButtonText}>{action.ctaLabel}</Text>
              <Text style={styles.heroButtonArrow}>›</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function HeroScrim() {
  return (
    <Svg pointerEvents="none" style={styles.scrim}>
      <Defs>
        <LinearGradient id="homeActionScrimV" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.bgBase} stopOpacity={0.08} />
          <Stop offset="0.46" stopColor={colors.bgBase} stopOpacity={0.35} />
          <Stop offset="1" stopColor={colors.bgBase} stopOpacity={0.96} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#homeActionScrimV)" />
    </Svg>
  );
}

function firstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? trimmed;
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
    backgroundColor: 'transparent',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.xl,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greetingCopy: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 17,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 28,
    lineHeight: 34,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgElevated,
    ...shadow.lifted,
  },
  heroPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroContent: {
    flex: 1,
    minHeight: 390,
    justifyContent: 'flex-end',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  heroCopy: {
    gap: spacing.sm,
    maxWidth: 360,
  },
  heroEyebrow: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 31,
    lineHeight: 38,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  heroButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
  },
  heroButtonText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  heroButtonArrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -1,
  },
  pressed: {
    opacity: 0.78,
  },
});
