import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const HERO_IMAGE = require('../../assets/images/hale-home-hero-botanical.png');

import { HeaderLogo } from '../components/HeaderLogo';
import { useScreenScrollClearance } from '../components/ui';
import type {
  HaleAppLifecycleResult,
  MovementSnapshot,
  MovementSnapshotBand,
  TodaySessionAdjustment,
} from '../haleFlow';
import { SettingsIcon } from '../navigation/icons';
import type { UserProfile } from '../profile';
import type { PainArea } from '../training';
import { colors, fonts, imageOverlayControl, radius, shadow, spacing, todayHomeColors, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

type SnapshotKey = keyof MovementSnapshot;

const SNAPSHOT_ROWS: readonly { key: SnapshotKey; short: string; title: string }[] = [
  { key: 'strengthPower', short: 'S', title: 'Strength' },
  { key: 'balance', short: 'B', title: 'Balance' },
  { key: 'mobility', short: 'M', title: 'Mobility' },
];

export function TodayScreen({
  profile,
  lifecycle,
  onPrimaryAction,
  onOpenSettings,
}: {
  profile: UserProfile;
  lifecycle: HaleAppLifecycleResult;
  onPrimaryAction: (preferences?: { adjustment?: TodaySessionAdjustment | null; painArea?: PainArea | null }) => void;
  onOpenSettings: () => void;
}) {
  const responsive = useResponsiveLayout();
  const bottomScrollClearance = useScreenScrollClearance();
  const compact = responsive.isCompactPhone;
  const snapshot = lifecycle.movementSnapshot;
  const isSessionAction =
    lifecycle.primaryAction.type === 'start_first_session' ||
    lifecycle.primaryAction.type === 'start_today_session';
  const sessionTitle = todayActionTitle(lifecycle);
  const sessionSubtitle = todayActionSubtitle(lifecycle);
  const sessionDetail = todaySessionDetail(lifecycle);

  // Start goes straight to the session preview, which owns today's
  // adjustments (shorter / gentler / equipment / something hurts) inline.
  const handleStartPress = () => onPrimaryAction();

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
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <SettingsIcon size={24} color={todayHomeColors.headingGreen} strokeWidth={1.8} />
          </Pressable>
        </View>

        <MovementSnapshotCard compact={compact} lifecycle={lifecycle} snapshot={snapshot} />

        <DailyFocusCard
          compact={compact}
          label="Today"
          title={sessionTitle}
          subtitle={sessionSubtitle}
          detail={sessionDetail}
          ctaLabel={isSessionAction ? 'Start session' : actionCta(lifecycle.primaryAction.ctaLabel)}
          onPress={handleStartPress}
        />

        <TodayContextStrip compact={compact} lifecycle={lifecycle} />
      </ScrollView>
    </View>
  );
}

function MovementSnapshotCard({
  compact,
  lifecycle,
  snapshot,
}: {
  compact: boolean;
  lifecycle: HaleAppLifecycleResult;
  snapshot: MovementSnapshot | null | undefined;
}) {
  const progress = movementProfileProgress(lifecycle, snapshot);
  const hasMeasuredDomains = SNAPSHOT_ROWS.some((row) => snapshot?.[row.key]);
  return (
    <View style={[styles.snapshotCard, compact && styles.compactCardPadding]}>
      <Text style={styles.snapshotTitle}>Your movement snapshot</Text>
      {!hasMeasuredDomains ? (
        <Text style={styles.snapshotIntro}>
          Complete your check-up to see strength, balance, and mobility here.
        </Text>
      ) : null}
      <View style={[styles.snapshotBody, compact && styles.snapshotBodyCompact]}>
        <SnapshotProgressRing
          progress={progress.progress}
          value={progress.value}
          noun={progress.noun}
          verb={progress.verb}
          size={compact ? 148 : 162}
        />
        <View style={styles.metricRows}>
          {SNAPSHOT_ROWS.map((row, index) => {
            const band = snapshot?.[row.key];
            return (
              <MetricRow
                key={row.key}
                domain={row.key}
                label={row.title}
                value={snapshotRowValue(row.key, band, lifecycle.activeBlockSummary?.focusDomain)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function SnapshotProgressRing({
  progress,
  value,
  noun,
  verb,
  size,
}: {
  progress: number;
  value: string;
  noun: string;
  verb: string;
  size: number;
}) {
  const stroke = 6;
  const center = size / 2;
  const radiusValue = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const clamped = Math.max(0, Math.min(1, progress));
  const visualProgress = clamped === 0 ? 0.035 : clamped;
  const [current = value, total = ''] = value.split('/');

  return (
    <View style={[styles.snapshotRing, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radiusValue} stroke={todayHomeColors.ringTrack} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radiusValue}
          stroke={todayHomeColors.headingGreen}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - visualProgress)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.snapshotRingCenter}>
        <Text style={styles.snapshotRingValue}>
          {current}
          {total ? <Text style={styles.snapshotRingJoin}> of </Text> : null}
          {total ? <Text>{total}</Text> : null}
        </Text>
        <Text style={styles.snapshotRingLabel}>{noun}</Text>
        <Text style={styles.snapshotRingLabel}>{verb}</Text>
      </View>
    </View>
  );
}

function TodayContextStrip({ compact, lifecycle }: { compact: boolean; lifecycle: HaleAppLifecycleResult }) {
  const block = lifecycle.activeBlockSummary;
  if (block && shouldShowActivePlanContext(lifecycle.state)) {
    return (
      <View style={[styles.contextStrip, compact && styles.compactCardPadding]}>
        <Text style={styles.contextTitle}>Your 4-week plan</Text>
        <View style={styles.contextBody}>
          <View style={styles.contextPrimary}>
            <Text style={styles.contextLabel}>Current week</Text>
            <Text style={styles.contextValue} numberOfLines={1}>
              Week <Text style={styles.contextValueNumber}>{block.weekNumber}</Text> of{' '}
              <Text style={styles.contextValueNumber}>{block.totalWeeks}</Text>
            </Text>
          </View>
          <View style={styles.contextDivider} />
          <View style={styles.contextSecondary}>
            <Text style={styles.contextLabel}>Next Check-Up</Text>
            <Text style={styles.contextValue} numberOfLines={1}>{retestLabel(block.retestInDays, block.totalWeeks)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.contextStrip, compact && styles.compactCardPadding]}>
      <Text style={styles.contextTitle}>Next step</Text>
      <View style={styles.contextBody}>
        <View style={styles.contextPrimary}>
          <Text style={styles.contextLabel}>Today</Text>
          <Text style={styles.contextValue} numberOfLines={1}>{contextValue(lifecycle.primaryAction.title)}</Text>
        </View>
        <View style={styles.contextDivider} />
        <View style={styles.contextSecondary}>
          <Text style={styles.contextLabel}>Check-up</Text>
          <Text style={styles.contextValue} numberOfLines={1}>
            {lifecycle.movementSnapshot ? 'Check-up saved' : 'Check-up not started'}
          </Text>
        </View>
      </View>
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
  const displayCta = ctaLabel === 'Start Session' ? 'Start session' : ctaLabel;
  const displayTitle = title === 'Move with intention' ? 'Move with\nintention' : title;
  const heroMinHeightStyle = { minHeight: responsive.todayHeroHeight };

  return (
    <View style={[styles.focusCard, compact && styles.focusCardCompact, heroMinHeightStyle]}>
      <Image source={HERO_IMAGE} style={[styles.focusImage, compact && styles.focusImageCompact]} resizeMode="cover" accessible={false} />
      <HomeHeroScrim />
      <View style={[styles.focusContent, compact && styles.focusContentCompact, heroMinHeightStyle]}>
        <View style={[styles.focusCopy, compact && styles.focusCopyCompact]}>
          <Text style={styles.focusLabel}>{label}</Text>
          <Text style={[styles.focusTitle, compact && styles.focusTitleCompact]}>{displayTitle}</Text>
          <View style={styles.focusMeta}>
            <Text style={styles.focusSubtitle}>{subtitle}</Text>
            {detail ? <Text style={styles.focusDetail}>{detail}</Text> : null}
          </View>
        </View>
        <View style={[styles.focusAction, compact && styles.focusActionCompact]}>
          <Pressable
            style={({ pressed }) => [styles.focusButton, compact && styles.compactControlPadding, pressed && styles.focusButtonPressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text style={styles.focusButtonText}>{displayCta}</Text>
            <Text style={styles.focusButtonArrow}>›</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function HomeHeroScrim() {
  return (
    <Svg pointerEvents="none" style={styles.focusScrim}>
      <Defs>
        <LinearGradient id="homeHeroScrimH" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.accentDeep} stopOpacity={0.52} />
          <Stop offset="0.58" stopColor={colors.accentDeep} stopOpacity={0.16} />
          <Stop offset="1" stopColor={colors.accentDeep} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="homeHeroScrimV" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.accentDeep} stopOpacity={0.32} />
          <Stop offset="0.5" stopColor={colors.accentDeep} stopOpacity={0.08} />
          <Stop offset="1" stopColor={colors.accentDeep} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={colors.accentDeep} opacity={0.04} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#homeHeroScrimH)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#homeHeroScrimV)" />
    </Svg>
  );
}

function MetricRow({
  domain,
  label,
  value,
}: {
  domain: SnapshotKey;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricIcon}>
        <DomainGlyph domain={domain} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

function DomainGlyph({ domain }: { domain: SnapshotKey }) {
  const s = {
    stroke: todayHomeColors.headingGreen,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (domain === 'strengthPower') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M4.8 10 V14" {...s} />
        <Path d="M7.2 8.5 V15.5" {...s} />
        <Path d="M9.4 11.8 H14.6" {...s} />
        <Path d="M16.8 8.5 V15.5" {...s} />
        <Path d="M19.2 10 V14" {...s} />
      </Svg>
    );
  }

  if (domain === 'balance') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M12 5 V18" {...s} />
        <Path d="M7 8 H17" {...s} />
        <Path d="M8 8 L5.8 14 H10.2 Z" {...s} />
        <Path d="M16 8 L13.8 14 H18.2 Z" {...s} />
        <Path d="M8 18 H16" {...s} />
      </Svg>
    );
  }

  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Circle cx={12} cy={5.7} r={1.5} {...s} />
      <Path d="M12 8 V13" {...s} />
      <Path d="M8 10 L12 12 L16 10" {...s} />
      <Path d="M12 13 L8.7 18" {...s} />
      <Path d="M12 13 L15.6 18.5" {...s} />
    </Svg>
  );
}

function actionTitle(title: string): string {
  if (title === "Today's Hale Session") return "Today's session";
  return title.replace('Hale Session', 'Hale session');
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

function todayActionTitle(lifecycle: HaleAppLifecycleResult): string {
  if (lifecycle.primaryAction.type === 'start_first_session') return 'Your first session is ready';
  if (lifecycle.primaryAction.type === 'start_today_session') return "Today's session is ready";
  if (lifecycle.primaryAction.type === 'start_gentle_restart') return 'Clean slate';
  if (lifecycle.primaryAction.type === 'start_micro_check') return '60-second check-in';
  if (lifecycle.primaryAction.type === 'start_retest') return 'Time for your next check-up';
  if (lifecycle.primaryAction.type === 'explore_extra_sessions') return 'Your week is complete';
  return actionTitle(lifecycle.primaryAction.title);
}

function todayActionSubtitle(lifecycle: HaleAppLifecycleResult): string {
  if (lifecycle.primaryAction.type === 'start_first_session') {
    return 'Built from your check-up.';
  }
  if (lifecycle.primaryAction.type === 'start_today_session') {
    return 'A simple session to build strength, balance, and mobility.';
  }
  if (lifecycle.primaryAction.type === 'start_gentle_restart') {
    return "Let's restart gently and keep your plan moving.";
  }
  if (lifecycle.primaryAction.type === 'explore_extra_sessions') {
    return 'Optional mobility work can support your plan without pressure.';
  }
  return lifecycle.primaryAction.subtitle;
}

function todaySessionDetail(lifecycle: HaleAppLifecycleResult): string | undefined {
  if (lifecycle.primaryAction.type !== 'start_first_session' && lifecycle.primaryAction.type !== 'start_today_session') {
    return undefined;
  }
  const nextSession = lifecycle.weekSessionStatuses?.find((session) => session.status === 'next');
  if (!nextSession) return undefined;
  return `Today's focus: ${nextSession.focus}`;
}

function actionCta(label: string): string {
  if (label === 'Start First Session') return 'Start session';
  if (label === 'Start Gentle Session') return 'Start session';
  if (label === 'Start') return 'Start session';
  return label;
}

function snapshotRowValue(
  row: SnapshotKey,
  band: MovementSnapshotBand | undefined,
  focusDomain: NonNullable<HaleAppLifecycleResult['activeBlockSummary']>['focusDomain'] | undefined
): string {
  if (!band) return 'Not checked yet';
  if (snapshotRowMatchesFocus(row, focusDomain)) return 'Your main focus';
  if (row === 'mobility') return 'Doing well for now';
  return 'Needs steady practice';
}

function snapshotRowMatchesFocus(
  row: SnapshotKey,
  focusDomain: NonNullable<HaleAppLifecycleResult['activeBlockSummary']>['focusDomain'] | undefined
): boolean {
  if (!focusDomain) return false;
  if (row === 'strengthPower') return focusDomain === 'strength_power';
  return row === focusDomain;
}

function movementProfileProgress(
  lifecycle: HaleAppLifecycleResult,
  snapshot: MovementSnapshot | null | undefined
): { progress: number; value: string; noun: string; verb: string } {
  const block = lifecycle.activeBlockSummary;
  if (block && shouldShowActivePlanContext(lifecycle.state)) {
    const total = Math.max(1, block.sessionsTargetThisWeek);
    const current = Math.max(0, Math.min(total, block.sessionsCompleteThisWeek));
    return {
      progress: current / total,
      value: `${current}/${total}`,
      noun: 'sessions',
      verb: 'completed',
    };
  }

  const total = SNAPSHOT_ROWS.length;
  const measured = SNAPSHOT_ROWS.filter((row) => snapshot?.[row.key]).length;
  return {
    progress: measured / total,
    value: `${measured}/${total}`,
    noun: 'areas',
    verb: 'checked',
  };
}

function shouldShowActivePlanContext(state: HaleAppLifecycleResult['state']): boolean {
  return (
    state === 'first_session_ready' ||
    state === 'normal_training_day' ||
    state === 'weekly_micro_check_due' ||
    state === 'monthly_retest_due' ||
    state === 'week_complete' ||
    state === 'inactive_restart'
  );
}

function retestLabel(days: number | undefined, totalWeeks = 4): string {
  if (days === undefined) return `End of week ${totalWeeks}`;
  if (days <= 0) return 'Ready now';
  if (days === 1) return 'Tomorrow';
  if (days >= 14) {
    const weeks = Math.ceil(days / 7);
    return `In about ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `In ${days} days`;
}

function contextValue(title: string): string {
  if (title.length <= 22) return title;
  if (title.includes('Movement Profile')) return 'Movement profile';
  if (title.includes('Movement Check-Up')) return 'Check-up';
  if (title.includes('4-week')) return 'Plan';
  return 'Next action';
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
    gap: 14,
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
    fontSize: 23,
    lineHeight: 26,
    letterSpacing: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  contextStrip: {
    minHeight: 102,
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: todayHomeColors.card,
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
  contextBody: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 18,
    marginTop: 13,
  },
  contextPrimary: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  contextSecondary: {
    flex: 0.9,
    minWidth: 0,
    justifyContent: 'center',
  },
  contextDivider: {
    width: 1,
    backgroundColor: todayHomeColors.border,
  },
  contextLabel: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  contextValue: {
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
    marginTop: 5,
  },
  contextValueNumber: {
    fontVariant: ['tabular-nums'],
  },
  snapshotCard: {
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingVertical: 22,
    backgroundColor: todayHomeColors.card,
    ...shadow.card,
  },
  snapshotTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  snapshotIntro: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 6,
  },
  snapshotBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  snapshotBodyCompact: {
    gap: 12,
  },
  snapshotRing: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  snapshotRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotRingValue: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 35,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  snapshotRingJoin: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  snapshotRingLabel: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  metricRows: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 8,
  },
  metricRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
  },
  metricValue: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    marginTop: 2,
  },
  focusCard: {
    minHeight: 274,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.hero,
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
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  focusTitle: {
    color: colors.onAccent,
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
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  focusDetail: {
    color: colors.onAccent,
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
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: imageOverlayControl.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: imageOverlayControl.border,
  },
  focusButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  focusButtonText: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  focusButtonArrow: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
