import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackground } from '../components/AppBackground';
import { HeaderLogo } from '../components/HeaderLogo';
import { useScreenScrollClearance } from '../components/ui';
import { SettingsIcon } from '../navigation/icons';
import type { ProgrammeTodayViewModel } from '../programme';
import type { UserProfile } from '../profile';
import { colors, fonts, radius, shadow, spacing, todayHomeColors } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

export interface TodayProgrammeMode {
  today: ProgrammeTodayViewModel;
}

/**
 * Home is the action surface: one greeting and one centered action. Programme
 * structure lives on Plan; measured change and Everyday Clarity live on
 * Progress. No image or secondary card competes with the next required action.
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

        <View style={styles.actionStage}>
          <View style={styles.actionCopy}>
            <Text style={styles.actionEyebrow}>
              {checkUpAction ? 'MOVEMENT CHECK-UP' : 'TODAY'}
            </Text>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={onPrimaryAction}
            accessibilityRole="button"
            accessibilityLabel={`${action.ctaLabel}. ${action.title}. ${action.subtitle}`}
          >
            <Text style={styles.actionButtonText}>{action.ctaLabel}</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  actionStage: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  actionCopy: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.md,
  },
  actionEyebrow: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  actionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 34,
    lineHeight: 41,
    textAlign: 'center',
  },
  actionSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    maxWidth: 320,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    ...shadow.soft,
  },
  actionButtonPressed: {
    backgroundColor: colors.accentHover,
    transform: [{ scale: 0.99 }],
  },
  actionButtonText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  actionButtonArrow: {
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
