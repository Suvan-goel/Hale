import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { MenopauseStage } from '../profile';
import { Screen } from '../components/ui';
import { HeaderLogo } from '../components/HeaderLogo';
import { getHealthInsightCards, type HealthInsightCard } from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, todayHomeColors, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import { SettingsIcon } from '../navigation/icons';
import { INSIGHT_IMAGES } from './exploreImages';

/**
 * The Learn tab (founder-directed simplification pass, 2026-07-08): the
 * bundled articles only. The extra-practice session catalogue was removed
 * with the rest of the pass — the daily programme session is the one
 * training surface, so nothing here competes with it.
 */
export function ExploreScreen({
  menopauseStage,
  onOpenLearn,
  onOpenSettings,
}: {
  /** Personalization signal only ("Not sure" → educational content leads). */
  menopauseStage?: MenopauseStage | null;
  onOpenLearn: (articleId: string) => void;
  onOpenSettings: () => void;
}) {
  const responsive = useResponsiveLayout();
  const insights = React.useMemo(() => getHealthInsightCards({ menopauseStage }), [menopauseStage]);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Learn</Text>
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

      <View style={styles.section}>
        <SectionCopy body="Simple articles about movement, recovery, and staying strong through menopause." />
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

function SectionCopy({ title, body }: { title?: string; body?: string }) {
  return (
    <View style={styles.sectionCopy}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
    </View>
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
  rowThumb: {
    width: 100,
    height: 80,
    borderRadius: 13,
    backgroundColor: todayHomeColors.iconFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: todayHomeColors.border,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
