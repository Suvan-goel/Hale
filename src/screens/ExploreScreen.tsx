import * as React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { MovementSafetyProfile } from '../adherence';
import type { MenopauseStage } from '../profile';
import { Screen } from '../components/ui';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  getExtraSessionCards,
  getHealthInsightCards,
  type TodaySessionPreferences,
  type ExtraSessionCard,
  type HealthInsightCard,
} from '../haleFlow';
import type { LadderProgress } from '../training';
import { colors, fonts, imageOverlayControl, radius, shadow, spacing, todayHomeColors, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import { SettingsIcon } from '../navigation/icons';
import { INSIGHT_IMAGES, PRACTICE_IMAGES } from './exploreImages';

export function ExploreScreen({
  safetyProfile,
  menopauseStage,
  ladderProgressById,
  onStartExtraSession,
  onOpenLearn,
  onOpenSettings,
}: {
  safetyProfile?: MovementSafetyProfile | null;
  /** Personalization signal only ("Not sure" → educational content leads). */
  menopauseStage?: MenopauseStage | null;
  ladderProgressById: Record<string, LadderProgress>;
  onStartExtraSession: (presetId: string, preferences?: TodaySessionPreferences | null) => void;
  onOpenLearn: (articleId: string) => void;
  onOpenSettings: () => void;
}) {
  const responsive = useResponsiveLayout();
  const insights = React.useMemo(() => getHealthInsightCards({ menopauseStage }), [menopauseStage]);
  const extraSessions = React.useMemo(
    () => getExtraSessionCards({ safetyProfile, ladderProgressById }),
    [ladderProgressById, safetyProfile]
  );
  const startExtraSession = React.useCallback(
    (presetId: string) => {
      onStartExtraSession(presetId, { adjustment: null, painArea: null });
    },
    [onStartExtraSession]
  );

  const featuredSession = extraSessions.find((session) => session.id === 'preset-mobility-reset') ?? extraSessions[0];
  const sessionRows = featuredSession ? extraSessions.filter((session) => session.id !== featuredSession.id) : extraSessions;

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Explore</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <SettingsIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
        </Pressable>
      </View>

      {featuredSession ? (
        <FeaturedPracticeCard
          session={featuredSession}
          onStart={() => startExtraSession(featuredSession.id)}
        />
      ) : null}

      {sessionRows.length > 0 ? (
        <View style={styles.section}>
          <SectionCopy title="More sessions" body="Optional sessions outside your 4-week plan." />
          <View style={[styles.listPanel, styles.rowListPanel, responsive.isCompactPhone && styles.compactListPanel]}>
            {sessionRows.map((session, index) => (
              <OptionalSessionRow
                key={session.id}
                session={session}
                showDivider={index < sessionRows.length - 1}
                onStart={() => startExtraSession(session.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionCopy title="Learn" body="Simple articles about movement, recovery, and staying strong through menopause." />
        <View style={[styles.listPanel, styles.rowListPanel, responsive.isCompactPhone && styles.compactListPanel]}>
          {insights.map((article, index) => (
            <InsightRow
              key={article.id}
              article={article}
              showDivider={index < insights.length - 1}
              onOpen={() => onOpenLearn(article.id)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function FeaturedPracticeCard({ session, onStart }: { session: ExtraSessionCard; onStart: () => void }) {
  const responsive = useResponsiveLayout();
  const compactHero = responsive.isCompactPhone;
  const heroMinHeightStyle = { minHeight: responsive.exploreHeroHeight };

  return (
    <View style={styles.featuredSection}>
      <Text style={styles.featuredLabel}>For lighter days</Text>
      <Pressable
        style={({ pressed }) => [styles.featuredCard, heroMinHeightStyle, session.disabled && styles.disabledRow, pressed && styles.pressed]}
        onPress={onStart}
        disabled={session.disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: session.disabled }}
        accessibilityLabel={`Start ${session.title}`}
      >
        <ImageBackground
          source={PRACTICE_IMAGES.hero}
          style={[styles.featuredImage, heroMinHeightStyle]}
          imageStyle={styles.featuredImageRadius}
          resizeMode="cover"
        >
          <View style={styles.featuredScrim} />
          <View style={[styles.featuredContent, compactHero && styles.featuredHeroContentCompact, heroMinHeightStyle]}>
            <View style={[styles.featuredHeroCopy, compactHero && styles.featuredHeroCopyCompact]}>
              <Text style={styles.featuredMeta}>
                Extra session · {durationLabel(session.durationLabel)}
              </Text>
              <Text style={styles.featuredTitle}>{session.cardTitle}</Text>
              <Text style={styles.featuredBody}>{session.detailBody}</Text>
            </View>
            <View style={styles.featuredHeroAction}>
              <View style={[styles.featuredButton, compactHero && styles.featuredHeroButtonCompact]}>
                <Text style={styles.featuredButtonText}>{session.disabled ? 'Setup needed' : 'Start session'}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

function InsightRow({
  article,
  showDivider,
  onOpen,
}: {
  article: HealthInsightCard;
  showDivider: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, showDivider && styles.listRowDivider, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      <Image source={INSIGHT_IMAGES[article.id]} style={styles.rowThumb} resizeMode="cover" />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle}>{article.title}</Text>
        <Text style={styles.rowSubtitle}>{article.categoryLabel} · {article.readTimeLabel}</Text>
      </View>
      <ChevronIcon />
    </Pressable>
  );
}

function SectionCopy({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.sectionCopy}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
    </View>
  );
}

function OptionalSessionRow({
  session,
  showDivider,
  onStart,
}: {
  session: ExtraSessionCard;
  showDivider: boolean;
  onStart: () => void;
}) {
  return (
    <View style={[styles.practiceSessionRow, showDivider && styles.listRowDivider, session.disabled && styles.disabledRow]}>
      <Image source={PRACTICE_IMAGES[session.id] ?? PRACTICE_IMAGES.hero} style={styles.rowThumb} resizeMode="cover" />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {session.cardTitle}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {session.body}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {practiceRowMeta(session)}
        </Text>
      </View>
      {session.disabled ? (
        <View style={styles.disabledPill}>
          <Text style={styles.disabledText}>Setup</Text>
        </View>
      ) : (
        <SmallStartButton onPress={onStart} accessibilityLabel={`Start ${session.title}`} />
      )}
    </View>
  );
}

function practiceRowMeta(session: ExtraSessionCard): string {
  if (session.disabled && session.disabledReason) return session.disabledReason;
  return `${durationLabel(session.durationLabel)} · ${session.focusLabel}`;
}

function SmallStartButton({
  accessibilityLabel,
  onPress,
}: {
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.startButtonText}>Start</Text>
    </Pressable>
  );
}

function ChevronIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M9.5 5.5 L15.5 12 L9.5 18.5"
        stroke={colors.textSecondary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function durationLabel(label: string): string {
  return label.replace(/^About\s+/, '');
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 22,
    backgroundColor: todayHomeColors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...type.pageTitle, flexShrink: 1 },
  headerIconButton: {
    // Comfortable tap target for the 50+ audience (matches minTapTarget).
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredSection: {
    gap: 12,
  },
  featuredLabel: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  featuredCard: {
    minHeight: 274,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    ...shadow.card,
  },
  featuredImage: {
    flex: 1,
    minHeight: 274,
    justifyContent: 'flex-start',
  },
  featuredImageRadius: {
    borderRadius: radius.card,
  },
  featuredScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(17, 20, 18, 0.34)',
  },
  featuredContent: {
    paddingVertical: 26,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  featuredHeroContentCompact: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  featuredHeroCopy: {
    width: '72%',
    gap: 12,
  },
  featuredHeroCopyCompact: {
    width: '70%',
    gap: 11,
  },
  featuredMeta: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  featuredTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  featuredBody: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  featuredHeroAction: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    paddingTop: 16,
  },
  featuredButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: imageOverlayControl.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: imageOverlayControl.border,
  },
  featuredHeroButtonCompact: {
    paddingHorizontal: 16,
  },
  featuredButtonText: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  section: {
    gap: 13,
  },
  sectionCopy: {
    gap: 5,
  },
  sectionTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  sectionBody: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  listPanel: {
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.card,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  compactListPanel: {
    paddingHorizontal: spacing.md,
  },
  rowListPanel: {
    paddingLeft: 10,
  },
  listRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  practiceSessionRow: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: todayHomeColors.border,
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  rowSubtitle: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 3,
  },
  rowMeta: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 4,
  },
  rowThumb: {
    width: 100,
    height: 80,
    borderRadius: 13,
    backgroundColor: todayHomeColors.iconFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: todayHomeColors.border,
  },
  startButton: {
    // Comfortable tap target for the 50+ audience (matches minTapTarget).
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: todayHomeColors.primary,
  },
  startButtonText: {
    color: todayHomeColors.warmWhite,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  disabledRow: {
    opacity: 0.7,
  },
  disabledPill: {
    minHeight: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
  },
  disabledText: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
