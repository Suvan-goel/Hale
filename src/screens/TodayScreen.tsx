import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BRAND } from '../brand';
import { AppBackground } from '../components/AppBackground';
import { PearlBrandMark } from '../components/PearlBrandMark';
import { PearlHeroArtwork } from '../components/PearlHeroArtwork';
import { useScreenScrollClearance } from '../components/ui';
import { MenuIcon } from '../navigation/icons';
import type {
  PhysicalTrainingFocus,
  ProgrammeJourneyStatus,
  ProgrammeJourneyWeekSummary,
  ProgrammeTodayViewModel,
} from '../programme';
import type { UserProfile } from '../profile';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

export interface TodayProgrammeMode {
  today: ProgrammeTodayViewModel;
  journey: {
    status: ProgrammeJourneyStatus;
    physicalFocus: PhysicalTrainingFocus | null;
    currentWeekSummary: ProgrammeJourneyWeekSummary | null;
    checkUpDraftInProgress: boolean;
  };
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
  const sessionMinutes = Math.round(programme.today.sessionPreview.estimatedMinutes);
  const copy = todayCopy(programme, sessionMinutes);
  const greetingName = firstName(profile.name);
  const layout = todayHomeLayout({
    contentWidth: responsive.contentWidth,
    windowHeight: responsive.windowHeight,
    bottomClearance: bottomScrollClearance,
    titleLength: copy.title.length,
  });

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
            paddingTop: layout.topPadding,
            paddingBottom: bottomScrollClearance || spacing.xl,
            gap: layout.sectionGap,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.wordmark} accessibilityLabel={BRAND.appName}>
            <PearlBrandMark size={layout.brandMarkSize} />
            <Text
              style={[
                styles.wordmarkText,
                {
                  fontSize: layout.wordmarkSize,
                  lineHeight: layout.wordmarkLineHeight,
                },
              ]}
            >
              {BRAND.appName.toLowerCase()}
            </Text>
          </View>
          {onOpenSettings ? (
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <MenuIcon size={24} color={colors.textPrimary} strokeWidth={1.55} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.greetingRow}>
          <Text
            style={[
              styles.greeting,
              { fontSize: layout.greetingSize, lineHeight: layout.greetingLineHeight },
            ]}
          >
            {timeOfDayGreeting()}{greetingName ? `, ${greetingName}` : ''}
          </Text>
          <View style={styles.greetingRule} />
        </View>

        <View style={styles.actionStage}>
          <View style={[styles.actionCopy, { gap: layout.copyGap }]}>
            <Text
              style={[
                styles.actionTitle,
                {
                  fontSize: layout.titleSize,
                  lineHeight: layout.titleLineHeight,
                  letterSpacing: layout.titleLetterSpacing,
                },
              ]}
            >
              {copy.title}
            </Text>
            <Text
              style={[
                styles.actionSubtitle,
                {
                  fontSize: layout.subtitleSize,
                  lineHeight: layout.subtitleLineHeight,
                },
              ]}
            >
              {copy.subtitle}
            </Text>
          </View>

          <View
            style={[styles.readinessRow, { marginTop: layout.statusTopGap, gap: layout.statusGap }]}
            accessible
            accessibilityLabel={copy.status}
          >
            <View
              style={[
                styles.readinessCheck,
                {
                  width: layout.statusIconSize,
                  height: layout.statusIconSize,
                  borderRadius: layout.statusIconSize / 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.readinessCheckText,
                  { fontSize: layout.statusSize, lineHeight: layout.statusLineHeight },
                ]}
              >
                ✓
              </Text>
            </View>
            <Text
              style={[
                styles.readinessText,
                { fontSize: layout.statusSize, lineHeight: layout.statusLineHeight },
              ]}
            >
              {copy.status}
            </Text>
          </View>

          <View
            style={[
              styles.lowerStage,
              {
                minHeight: layout.lowerStageMinHeight,
                gap: layout.heroButtonGap,
                paddingBottom: layout.buttonBottomGap,
              },
            ]}
          >
            <View
              style={[
                styles.orbitStage,
                { width: layout.heroWidth, height: layout.heroHeight },
              ]}
              pointerEvents="none"
              accessibilityElementsHidden
            >
              <PearlHeroArtwork width={layout.heroWidth} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                {
                  width: layout.buttonWidth,
                  minHeight: layout.buttonHeight,
                  paddingHorizontal: layout.buttonHorizontalPadding,
                },
                pressed && styles.actionButtonPressed,
              ]}
              onPress={onPrimaryAction}
              accessibilityRole="button"
              accessibilityLabel={`${action.ctaLabel}. ${action.title}. ${action.subtitle}`}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { fontSize: layout.buttonTextSize, lineHeight: layout.buttonTextLineHeight },
                ]}
              >
                {checkUpAction ? action.ctaLabel : 'Start session'}
              </Text>
            </Pressable>
          </View>
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

type TodayCopy = {
  title: string;
  subtitle: string;
  status: string;
};

export function todayCopy(programme: TodayProgrammeMode, sessionMinutes: number): TodayCopy {
  const { today, journey } = programme;
  const action = today.primaryAction;

  if (action.type === 'start_baseline_checkup') {
    if (journey.checkUpDraftInProgress) {
      return {
        title: action.title,
        subtitle: today.sessionDetail,
        status: 'Continue with Everyday Clarity, or skip it, to finish',
      };
    }
    const routineCheckUp = today.checkupOffer?.kind === 'routine_due';
    return {
      title: routineCheckUp ? 'See what has changed' : 'Build your 12-week plan',
      subtitle: today.sessionDetail,
      status: routineCheckUp
        ? 'The same check-up keeps your results comparable'
        : 'A private starting point for Strength and Balance',
    };
  }

  const patterns = movementPatternLine(today.sessionPreview.mainPatternTitles);
  if (today.state === 'first_session_ready') {
    return {
      title: 'Your first session',
      subtitle: `${sessionMinutes} minutes · Starting levels\n${patterns}`,
      status: 'A chair and a little floor space are all you need',
    };
  }
  if (today.state === 'returning_after_break') {
    return {
      title: 'Ease back in today',
      subtitle: `${sessionMinutes} minutes · Exercises eased back one step\n${patterns}`,
      status: 'A gentle return is enough',
    };
  }

  const week = journey.currentWeekSummary;
  const sessionPosition = journey.status === 'completed'
    ? `${sessionMinutes} minutes · Follow-on session`
    : week === null
      ? `${sessionMinutes} minutes · Strength and balance`
    : week.plannedComplete
      ? `${sessionMinutes} minutes · 3 sessions complete this week`
      : `${sessionMinutes} minutes · Session ${week.creditedSessions + 1} of ${week.plannedSessions} this week`;
  return {
    title: focusHeadline(journey.physicalFocus),
    subtitle: `${sessionPosition}\n${patterns}`,
    status: weeklyStatus(week, journey.status),
  };
}

function focusHeadline(focus: PhysicalTrainingFocus | null): string {
  if (focus === 'strength') return 'Build strength today';
  if (focus === 'balance') return 'Practise balance today';
  if (focus === 'balanced') return 'Strength and balance today';
  return 'Move well today';
}

function movementPatternLine(patterns: readonly string[]): string {
  return patterns
    .map((pattern, index) => index === 0 ? pattern : pattern.toLowerCase())
    .join(' · ');
}

function weeklyStatus(
  week: ProgrammeJourneyWeekSummary | null,
  journeyStatus: ProgrammeJourneyStatus
): string {
  if (journeyStatus === 'completed') return 'Your 12-week programme is complete';
  if (week === null) return 'Continue at your own pace';
  if (week.plannedComplete) return '3 sessions complete · week complete';
  if (week.creditedSessions >= week.sufficientSessions) {
    return `${week.creditedSessions} sessions complete · successful week`;
  }
  if (week.creditedSessions === 1) return '1 session complete this week';
  return 'Two sessions makes a successful week';
}

export type TodayHomeLayoutInput = {
  contentWidth: number;
  windowHeight: number;
  bottomClearance: number;
  titleLength: number;
};

export type TodayHomeLayout = {
  topPadding: number;
  sectionGap: number;
  brandMarkSize: number;
  wordmarkSize: number;
  wordmarkLineHeight: number;
  greetingSize: number;
  greetingLineHeight: number;
  copyGap: number;
  titleSize: number;
  titleLineHeight: number;
  titleLetterSpacing: number;
  subtitleSize: number;
  subtitleLineHeight: number;
  statusTopGap: number;
  statusGap: number;
  statusIconSize: number;
  statusSize: number;
  statusLineHeight: number;
  heroWidth: number;
  heroHeight: number;
  heroButtonGap: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonBottomGap: number;
  buttonHorizontalPadding: number;
  buttonTextSize: number;
  buttonTextLineHeight: number;
  lowerStageMinHeight: number;
};

/**
 * Scale Home as one composition inside the space above the tab bar. The
 * resulting minimum heights make ordinary phones non-scrolling while still
 * allowing ScrollView to protect short screens and larger accessibility text.
 */
export function todayHomeLayout(input: TodayHomeLayoutInput): TodayHomeLayout {
  const contentWidth = Math.max(280, input.contentWidth);
  const usableHeight = Math.max(500, input.windowHeight - input.bottomClearance);
  const widthScale = clamp(contentWidth / 361, 0.78, 1.1);
  const heightScale = clamp(usableHeight / 790, 0.76, 1.12);
  const scale = Math.min(widthScale, heightScale);
  const titleBase = input.titleLength > 27 ? 40 : input.titleLength > 21 ? 44 : 48;
  const titleSize = clamp(Math.round(titleBase * scale), 34, 50);
  const subtitleSize = clamp(Math.round(15 * scale), 13, 16);
  const statusSize = clamp(Math.round(13 * scale), 12, 14);
  const heroFraction = clamp(0.62 + (usableHeight - 600) * 0.0006, 0.6, 0.79);
  const heroWidth = clamp(
    Math.round(contentWidth * heroFraction),
    Math.min(170, contentWidth),
    Math.min(310, contentWidth)
  );
  const heroHeight = Math.round(heroWidth * 1.1);
  const heroButtonGap = clamp(Math.round(12 * scale), 8, 15);
  const buttonHeight = clamp(Math.round(contentWidth * 0.165), 54, 68);
  const buttonBottomGap = clamp(Math.round(usableHeight * 0.016), 8, 16);

  return {
    topPadding: clamp(Math.round(usableHeight * 0.028), 14, 24),
    sectionGap: clamp(Math.round(18 * scale), 12, 20),
    brandMarkSize: clamp(Math.round(32 * scale), 28, 34),
    wordmarkSize: clamp(Math.round(21 * scale), 18, 22),
    wordmarkLineHeight: clamp(Math.round(27 * scale), 23, 28),
    greetingSize: clamp(Math.round(15 * scale), 13, 16),
    greetingLineHeight: clamp(Math.round(21 * scale), 18, 22),
    copyGap: clamp(Math.round(10 * scale), 7, 12),
    titleSize,
    titleLineHeight: Math.round(titleSize * 1.09),
    titleLetterSpacing: -clamp(titleSize * 0.014, 0.5, 0.8),
    subtitleSize,
    subtitleLineHeight: Math.round(subtitleSize * 1.48),
    statusTopGap: clamp(Math.round(18 * scale), 11, 20),
    statusGap: clamp(Math.round(11 * scale), 8, 12),
    statusIconSize: clamp(Math.round(30 * scale), 26, 32),
    statusSize,
    statusLineHeight: Math.round(statusSize * 1.45),
    heroWidth,
    heroHeight,
    heroButtonGap,
    buttonWidth: Math.round(contentWidth * (usableHeight < 650 ? 0.98 : 0.96)),
    buttonHeight,
    buttonBottomGap,
    buttonHorizontalPadding: clamp(Math.round(24 * scale), 18, 26),
    buttonTextSize: clamp(Math.round(16 * scale), 14, 17),
    buttonTextLineHeight: clamp(Math.round(21 * scale), 18, 22),
    lowerStageMinHeight: heroHeight + heroButtonGap + buttonHeight + buttonBottomGap,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.bgBase,
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
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmarkText: {
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 3.2,
  },
  greetingRow: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  greeting: {
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  greetingRule: {
    width: 56,
    height: 2,
    backgroundColor: colors.accentDeep,
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
    minHeight: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  actionCopy: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 52,
    lineHeight: 55,
    letterSpacing: -0.7,
    textAlign: 'left',
  },
  actionSubtitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '100%',
    textAlign: 'left',
  },
  readinessRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 2,
  },
  readinessCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readinessCheckText: {
    color: colors.accentGold,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 19,
  },
  readinessText: {
    color: colors.accentGold,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  orbitStage: {
    alignSelf: 'flex-end',
  },
  lowerStage: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
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
  pressed: {
    opacity: 0.78,
  },
});
