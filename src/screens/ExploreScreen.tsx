import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { MovementSafetyProfile } from '../adherence';
import { Screen } from '../components/ui';
import {
  getExtraSessionCards,
  getLearnCards,
  getMovementLadderCards,
  type ExtraSessionCard,
} from '../haleFlow';
import type { AppSettings } from '../profile';
import type { EquipmentProfile, LadderProgress } from '../training';
import { colors, fonts, radius, spacing, todayHomeColors, type } from '../theme';

type PictogramName = 'walk' | 'sprout' | 'chair' | 'squat' | 'book' | 'scale' | 'camera' | 'clock';

const FEATURED_SESSION_IDS = ['preset-mobility-reset', 'preset-gentle-restart'] as const;

const FEATURED_SESSION_COPY: Record<string, { title?: string; body: string; icon: PictogramName }> = {
  'preset-mobility-reset': {
    title: '10-minute Mobility Reset',
    body: 'Loosen tight areas and reclaim easy movement.',
    icon: 'walk',
  },
  'preset-gentle-restart': {
    body: 'Reset your body and mind with a calm flow.',
    icon: 'sprout',
  },
};

const LADDER_ICONS: Record<string, PictogramName> = {
  'sit-to-stand': 'chair',
  squat: 'squat',
};

const LEARN_ICONS: Record<string, PictogramName> = {
  'chair-rise-strength': 'book',
  'balance-practice': 'scale',
  'camera-setup': 'camera',
};

export function ExploreScreen({
  equipment,
  safetyProfile,
  ladderProgressById,
  onStartExtraSession,
  onOpenLadder,
  onOpenLearn,
}: {
  equipment: EquipmentProfile;
  safetyProfile?: MovementSafetyProfile | null;
  settings: AppSettings;
  ladderProgressById: Record<string, LadderProgress>;
  onStartExtraSession: (presetId: string) => void;
  onOpenLadder: (ladderId: string) => void;
  onOpenLearn: (articleId: string) => void;
  onOpenSettings: () => void;
}) {
  const extraSessions = React.useMemo(
    () => getExtraSessionCards({ equipment, safetyProfile, ladderProgressById }),
    [equipment, ladderProgressById, safetyProfile]
  );
  const ladders = React.useMemo(
    () => getMovementLadderCards({ ladderProgressById }),
    [ladderProgressById]
  );
  const learnCards = React.useMemo(() => getLearnCards(), []);
  const featuredSessions = React.useMemo(
    () =>
      FEATURED_SESSION_IDS.map((id) => extraSessions.find((session) => session.id === id)).filter(
        (session): session is ExtraSessionCard => Boolean(session)
      ),
    [extraSessions]
  );
  const visibleLadders = ladders.slice(0, 2);
  const visibleLearnCards = learnCards.slice(0, 3);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.headerCopy}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Optional practice and short guides.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extra sessions</Text>
        <View style={styles.featuredGrid}>
          {featuredSessions.map((session) => (
            <FeaturedSessionCard
              key={session.id}
              title={FEATURED_SESSION_COPY[session.id]?.title ?? session.title}
              body={FEATURED_SESSION_COPY[session.id]?.body ?? session.body}
              durationLabel={durationLabel(session.durationLabel)}
              iconName={FEATURED_SESSION_COPY[session.id]?.icon ?? 'walk'}
              disabled={session.disabled}
              disabledReason={session.disabledReason}
              onStart={() => onStartExtraSession(session.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Movement ladders</Text>
        <View style={styles.listPanel}>
          {visibleLadders.map((ladder, index) => (
            <LadderRow
              key={ladder.id}
              title={ladder.title}
              currentLevelName={ladder.currentLevelName}
              iconName={LADDER_ICONS[ladder.id] ?? 'walk'}
              showDivider={index < visibleLadders.length - 1}
              onOpen={() => onOpenLadder(ladder.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learn</Text>
        <View style={styles.listPanel}>
          {visibleLearnCards.map((article, index) => (
            <LearnRow
              key={article.id}
              iconName={LEARN_ICONS[article.id] ?? 'book'}
              title={article.title}
              readTimeLabel={article.readTimeLabel}
              showDivider={index < visibleLearnCards.length - 1}
              onOpen={() => onOpenLearn(article.id)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function FeaturedSessionCard({
  title,
  body,
  durationLabel,
  iconName,
  disabled,
  disabledReason,
  onStart,
}: {
  title: string;
  body: string;
  durationLabel: string;
  iconName: PictogramName;
  disabled: boolean;
  disabledReason?: string;
  onStart: () => void;
}) {
  return (
    <View style={[styles.sessionCard, disabled && styles.disabledCard]}>
      <IconWell name={iconName} />
      <Text style={styles.sessionTitle}>{title}</Text>
      <Text style={styles.sessionBody}>{body}</Text>
      <TimePill label={durationLabel} />
      {disabled ? (
        <View style={styles.disabledAction}>
          <Text style={styles.disabledText}>{disabledReason}</Text>
        </View>
      ) : (
        <StartButton accessibilityLabel={`Start ${title}`} onPress={onStart} />
      )}
    </View>
  );
}

function LadderRow({
  title,
  currentLevelName,
  iconName,
  showDivider,
  onOpen,
}: {
  title: string;
  currentLevelName: string;
  iconName: PictogramName;
  showDivider: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, showDivider && styles.listRowDivider, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${title} ladder`}
    >
      <IconWell name={iconName} compact />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>Current: {currentLevelName}</Text>
      </View>
      <ChevronIcon />
    </Pressable>
  );
}

function LearnRow({
  iconName,
  title,
  readTimeLabel,
  showDivider,
  onOpen,
}: {
  iconName: PictogramName;
  title: string;
  readTimeLabel: string;
  showDivider: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, showDivider && styles.listRowDivider, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <IconWell name={iconName} compact />
      <View style={styles.listCopy}>
        <Text style={styles.learnTitle}>{title}</Text>
      </View>
      <TimePill label={readTimeLabel} compact />
      <ChevronIcon />
    </Pressable>
  );
}

function StartButton({
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

function IconWell({ name, compact = false }: { name: PictogramName; compact?: boolean }) {
  return (
    <View style={[styles.iconWell, compact && styles.iconWellCompact]}>
      <Pictogram name={name} size={compact ? 28 : 32} />
    </View>
  );
}

function TimePill({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <View style={[styles.timePill, compact && styles.timePillCompact]}>
      <Pictogram name="clock" size={16} />
      <Text style={styles.timePillText}>{label}</Text>
    </View>
  );
}

function Pictogram({ name, size }: { name: PictogramName; size: number }) {
  const common = {
    stroke: todayHomeColors.headingGreen,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (name === 'sprout') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 19 V11" {...common} />
        <Path d="M12 11 C8.6 8, 6 8.2, 4.6 10.1 C7.1 10.5, 9.3 12.1, 12 15" {...common} />
        <Path d="M12 11 C15.6 6.8, 18.2 6.4, 20 8 C17.5 8.8, 15.2 10.9, 12 15" {...common} />
      </Svg>
    );
  }

  if (name === 'chair') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M8 4 V20" {...common} />
        <Path d="M16 4 V20" {...common} />
        <Path d="M7 11 H17" {...common} />
        <Path d="M6 14 H18" {...common} />
        <Path d="M8 20 H6.5" {...common} />
        <Path d="M16 20 H17.5" {...common} />
      </Svg>
    );
  }

  if (name === 'squat') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12.2} cy={5.2} r={2.1} {...common} />
        <Path d="M11.5 8 L9.2 11.8 L12.4 14.1 L16.4 14.1" {...common} />
        <Path d="M9.2 11.8 L6.7 15.1 L10.1 17.1" {...common} />
        <Path d="M12.4 14.1 L10.7 19.2" {...common} />
        <Path d="M15.8 18 H20" {...common} />
      </Svg>
    );
  }

  if (name === 'book') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 7 C10.1 5.8, 6.9 5.8, 5 6.6 V18.2 C6.9 17.4, 10.1 17.4, 12 18.7" {...common} />
        <Path d="M12 7 C13.9 5.8, 17.1 5.8, 19 6.6 V18.2 C17.1 17.4, 13.9 17.4, 12 18.7" {...common} />
        <Path d="M12 7 V18.7" {...common} />
      </Svg>
    );
  }

  if (name === 'scale') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 5 V19" {...common} />
        <Path d="M6 8 H18" {...common} />
        <Path d="M8 8 L5 14 H11 Z" {...common} />
        <Path d="M16 8 L13 14 H19 Z" {...common} />
        <Path d="M9 19 H15" {...common} />
      </Svg>
    );
  }

  if (name === 'camera') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x={4} y={7.5} width={16} height={11} rx={2.2} {...common} />
        <Path d="M8.2 7.5 L9.4 5.6 H14.6 L15.8 7.5" {...common} />
        <Circle cx={12} cy={13} r={3} {...common} />
        <Path d="M17.4 10.2 H17.5" {...common} />
      </Svg>
    );
  }

  if (name === 'clock') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={8} {...common} />
        <Path d="M12 7.6 V12 L15.2 14" {...common} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={5.1} r={2} {...common} />
      <Path d="M12 7.5 V12.5" {...common} />
      <Path d="M9 10.2 L12 8.6 L15.3 10.2" {...common} />
      <Path d="M12 12.5 L9.2 18.8" {...common} />
      <Path d="M12.2 12.6 L16.8 16.4" {...common} />
      <Path d="M7.8 20 H11" {...common} />
      <Path d="M15.7 18.1 H19" {...common} />
    </Svg>
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
    paddingTop: 82,
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 30,
    backgroundColor: todayHomeColors.background,
  },
  headerCopy: {
    gap: 10,
  },
  title: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.serifRegular,
    fontSize: 42,
    lineHeight: 47,
    letterSpacing: 0,
  },
  subtitle: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  section: {
    gap: 13,
  },
  sectionTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  featuredGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 282,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.card,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
    shadowColor: todayHomeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  disabledCard: {
    opacity: 0.68,
  },
  iconWell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: todayHomeColors.iconFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sessionTitle: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 0,
    marginTop: 17,
  },
  sessionBody: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 12,
    minHeight: 60,
  },
  timePill: {
    alignSelf: 'flex-start',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    backgroundColor: todayHomeColors.iconFill,
    marginTop: 12,
  },
  timePillCompact: {
    minHeight: 34,
    paddingHorizontal: 11,
    marginTop: 0,
  },
  timePillText: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
  },
  startButton: {
    minHeight: 50,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: todayHomeColors.primary,
    marginTop: 18,
  },
  startButtonText: {
    color: todayHomeColors.warmWhite,
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  disabledAction: {
    minHeight: 50,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: todayHomeColors.card,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
    marginTop: 18,
  },
  disabledText: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listPanel: {
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.card,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
    paddingHorizontal: 16,
    shadowColor: todayHomeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1,
  },
  listRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
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
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  rowSubtitle: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 2,
  },
  learnTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
