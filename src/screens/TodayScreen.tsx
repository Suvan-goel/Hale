import * as React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const HERO_IMAGE = require('../../assets/images/hale-home-hero-premium.png');

import type {
  HaleAppLifecycleResult,
  MovementSnapshot,
  MovementSnapshotBand,
  TodaySessionAdjustment,
} from '../haleFlow';
import { SettingsIcon } from '../navigation/icons';
import type { UserProfile } from '../profile';
import type { PainArea } from '../training';
import { colors, fonts, radius, shadow, spacing, todayHomeColors, type } from '../theme';

type SnapshotKey = keyof MovementSnapshot;

const SNAPSHOT_ROWS: readonly { key: SnapshotKey; short: string; title: string }[] = [
  { key: 'strengthPower', short: 'S', title: 'Strength' },
  { key: 'balance', short: 'B', title: 'Balance' },
  { key: 'mobility', short: 'M', title: 'Mobility' },
];

const PAIN_AREAS: readonly { label: string; value: PainArea }[] = [
  { label: 'Knee', value: 'knee' },
  { label: 'Hip', value: 'hip' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Neck', value: 'neck' },
  { label: 'Other', value: 'other' },
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
  const [sessionMenuVisible, setSessionMenuVisible] = React.useState(false);
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const snapshot = lifecycle.movementSnapshot;
  const canAdjustSession =
    lifecycle.state === 'first_session_ready' ||
    lifecycle.state === 'normal_training_day' ||
    lifecycle.state === 'inactive_restart' ||
    lifecycle.state === 'week_complete';
  const isSessionAction =
    lifecycle.primaryAction.type === 'start_first_session' ||
    lifecycle.primaryAction.type === 'start_today_session' ||
    lifecycle.primaryAction.type === 'start_gentle_restart';
  const sessionTitle = todayActionTitle(lifecycle);
  const sessionSubtitle = todayActionSubtitle(lifecycle);
  const sessionDetail = todaySessionDetail(lifecycle);

  const startWith = React.useCallback(
    (adjustment?: TodaySessionAdjustment | null, painArea?: PainArea | null) => {
      setSessionMenuVisible(false);
      onPrimaryAction({ adjustment: adjustment ?? null, painArea: adjustment === 'something_hurts' ? painArea ?? null : null });
    },
    [onPrimaryAction]
  );

  const handleStartPress = () => {
    if (canAdjustSession) {
      setSessionMenuVisible(true);
      return;
    }
    onPrimaryAction();
  };

  return (
    <View style={styles.background}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>
              {timeOfDayGreeting()}
            </Text>
            <Text style={styles.headerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
              {headerName(profile.name)}
            </Text>
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
          ctaLabel={isSessionAction ? 'Start Session' : actionCta(lifecycle.primaryAction.ctaLabel)}
          onPress={handleStartPress}
        />

        <TodayContextStrip lifecycle={lifecycle} />
      </ScrollView>

      <SessionStartMenu
        visible={sessionMenuVisible}
        onClose={() => setSessionMenuVisible(false)}
        onStart={startWith}
      />
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
    <View style={styles.snapshotCard}>
      <Text style={styles.snapshotTitle}>Your movement profile</Text>
      {!hasMeasuredDomains ? (
        <Text style={styles.snapshotIntro}>Your Movement Check-Up will fill this in.</Text>
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
                value={band ? bandValue(band) : 'Pending'}
                last={index === SNAPSHOT_ROWS.length - 1}
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

function TodayContextStrip({ lifecycle }: { lifecycle: HaleAppLifecycleResult }) {
  const block = lifecycle.activeBlockSummary;
  if (block) {
    return (
      <View style={styles.contextStrip}>
        <Text style={styles.contextTitle}>Plan timeline</Text>
        <View style={styles.contextBody}>
          <View style={styles.contextPrimary}>
            <Text style={styles.contextLabel}>Current block</Text>
            <Text style={styles.contextValue} numberOfLines={1}>
              Week <Text style={styles.contextValueNumber}>{block.weekNumber}</Text> of{' '}
              <Text style={styles.contextValueNumber}>{block.totalWeeks}</Text>
            </Text>
          </View>
          <View style={styles.contextDivider} />
          <View style={styles.contextSecondary}>
            <Text style={styles.contextLabel}>Next Check-Up</Text>
            <Text style={styles.contextValue} numberOfLines={1}>{retestLabel(block.retestInDays)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contextStrip}>
      <Text style={styles.contextTitle}>Next step</Text>
      <View style={styles.contextBody}>
        <View style={styles.contextPrimary}>
          <Text style={styles.contextLabel}>Today</Text>
          <Text style={styles.contextValue} numberOfLines={1}>{contextValue(lifecycle.primaryAction.title)}</Text>
        </View>
        <View style={styles.contextDivider} />
        <View style={styles.contextSecondary}>
          <Text style={styles.contextLabel}>Movement Check-Up</Text>
          <Text style={styles.contextValue} numberOfLines={1}>
            {lifecycle.movementSnapshot ? 'Baseline saved' : 'Baseline pending'}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Green wash over the hero photo so the headline/body stay legible on the left
 * while the figure on the right reads through. Horizontal pass keeps the text
 * column on solid green; vertical pass darkens the base behind the CTA pill.
 */
function FocusScrim() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="focusScrimH" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={todayHomeColors.heroDeep} stopOpacity={0.72} />
          <Stop offset="0.42" stopColor={todayHomeColors.hero} stopOpacity={0.5} />
          <Stop offset="0.68" stopColor={todayHomeColors.hero} stopOpacity={0.08} />
          <Stop offset="1" stopColor={todayHomeColors.hero} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="focusScrimV" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.5" stopColor={todayHomeColors.heroDeep} stopOpacity={0} />
          <Stop offset="1" stopColor={todayHomeColors.heroDeep} stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={todayHomeColors.hero} opacity={0.18} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#focusScrimH)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#focusScrimV)" />
    </Svg>
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
  const displayCta = ctaLabel === 'Start Session' ? 'Start session' : ctaLabel;
  const displayTitle = title === 'Move with intention' ? 'Move with\nintention' : title;
  return (
    <View style={[styles.focusCard, compact && styles.focusCardCompact]}>
      <Image source={HERO_IMAGE} style={styles.focusImage} resizeMode="cover" accessible={false} />
      <FocusScrim />
      <View style={[styles.focusContent, compact && styles.focusContentCompact]}>
        <Text style={styles.focusLabel}>{label}</Text>
        <Text style={[styles.focusTitle, compact && styles.focusTitleCompact]}>{displayTitle}</Text>
        <Text style={styles.focusSubtitle}>{subtitle}</Text>
        {detail ? <Text style={styles.focusDetail} numberOfLines={1}>{detail}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.focusButton, pressed && styles.focusButtonPressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.focusButtonText}>{displayCta}</Text>
          <Text style={styles.focusButtonArrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetricRow({
  domain,
  label,
  value,
  last,
}: {
  domain: SnapshotKey;
  label: string;
  value: string;
  last: boolean;
}) {
  return (
    <View style={[styles.metricRow, !last && styles.metricRowDivider]}>
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

function SessionStartMenu({
  visible,
  onClose,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  onStart: (adjustment?: TodaySessionAdjustment | null, painArea?: PainArea | null) => void;
}) {
  const [selected, setSelected] = React.useState<TodaySessionAdjustment | null>(null);
  const [painArea, setPainArea] = React.useState<PainArea | null>(null);

  React.useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setPainArea(null);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close session options" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Adjust today's session?</Text>
          <Text style={styles.sheetSubtitle}>Choose how you'd like to start.</Text>
          <View style={styles.menuOptions}>
            <MenuOption label="Start as planned" selected={selected === null} onPress={() => setSelected(null)} />
            <MenuOption label="Make it shorter" selected={selected === 'shorter'} onPress={() => setSelected('shorter')} />
            <MenuOption label="Make it gentler" selected={selected === 'gentler'} onPress={() => setSelected('gentler')} />
            <MenuOption label="No equipment" selected={selected === 'no_equipment'} onPress={() => setSelected('no_equipment')} />
            <MenuOption label="Something hurts" selected={selected === 'something_hurts'} onPress={() => setSelected('something_hurts')} />
          </View>
          {selected === 'something_hurts' ? (
            <View style={styles.painMenu}>
              <Text style={styles.painTitle}>Where should Hale be careful?</Text>
              <View style={styles.painOptions}>
                {PAIN_AREAS.map((area) => (
                  <Pressable
                    key={area.value}
                    style={({ pressed }) => [styles.painChip, painArea === area.value && styles.painChipSelected, pressed && styles.pressed]}
                    onPress={() => setPainArea((value) => (value === area.value ? null : area.value))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: painArea === area.value }}
                    accessibilityLabel={area.label}
                  >
                    <Text style={[styles.painChipText, painArea === area.value && styles.painChipTextSelected]}>{area.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.sheetPrimary, pressed && styles.sheetPrimaryPressed]}
            onPress={() => onStart(selected, selected === 'something_hurts' ? painArea : null)}
            accessibilityRole="button"
            accessibilityLabel={selected ? 'Start session' : 'Start as planned'}
          >
            <Text style={styles.sheetPrimaryText}>{selected ? 'Start session' : 'Start as planned'}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]} onPress={onClose} accessibilityRole="button">
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function MenuOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuOption, selected && styles.menuOptionSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.menuOptionText, selected && styles.menuOptionTextSelected]}>{label}</Text>
      <View style={[styles.menuRadio, selected && styles.menuRadioSelected]} />
    </Pressable>
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
  if (lifecycle.primaryAction.type === 'start_first_session') return 'Your first Hale session is ready';
  if (lifecycle.primaryAction.type === 'start_today_session') return "Today's session is ready";
  if (lifecycle.primaryAction.type === 'start_gentle_restart') return 'Start gently today';
  if (lifecycle.primaryAction.type === 'start_micro_check') return '60-second check-in';
  if (lifecycle.primaryAction.type === 'start_retest') return "It's time to re-test";
  if (lifecycle.primaryAction.type === 'explore_extra_sessions') return 'Your week is complete';
  return actionTitle(lifecycle.primaryAction.title);
}

function todayActionSubtitle(lifecycle: HaleAppLifecycleResult): string {
  if (lifecycle.primaryAction.type === 'start_first_session') {
    return 'A calm first session built from your Movement Check-Up.';
  }
  if (lifecycle.primaryAction.type === 'start_today_session') {
    return 'A simple session to help you build strength, balance, and mobility.';
  }
  if (lifecycle.primaryAction.type === 'start_gentle_restart') {
    return "A shorter session to ease you back into your block.";
  }
  if (lifecycle.primaryAction.type === 'explore_extra_sessions') {
    return 'Optional mobility work can support the plan without adding pressure.';
  }
  return lifecycle.primaryAction.subtitle;
}

function todaySessionDetail(lifecycle: HaleAppLifecycleResult): string | undefined {
  if (lifecycle.primaryAction.type !== 'start_first_session' && lifecycle.primaryAction.type !== 'start_today_session') {
    return undefined;
  }
  const nextSession = lifecycle.weekSessionStatuses?.find((session) => session.status === 'next');
  if (!nextSession) return undefined;
  return `${nextSession.title}: ${nextSession.focus}`;
}

function actionCta(label: string): string {
  if (label === 'Start First Session') return 'Start Session';
  if (label === 'Start Gentle Session') return 'Start Session';
  if (label === 'Start') return 'Start Session';
  return label;
}

function bandValue(band: MovementSnapshotBand): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  return 'Starting point';
}

function movementProfileProgress(
  lifecycle: HaleAppLifecycleResult,
  snapshot: MovementSnapshot | null | undefined
): { progress: number; value: string; noun: string; verb: string } {
  const block = lifecycle.activeBlockSummary;
  if (block) {
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
    noun: 'domains',
    verb: 'measured',
  };
}

function retestLabel(days: number | undefined): string {
  if (days === undefined) return 'After block';
  if (days <= 0) return 'Due now';
  if (days === 1) return 'Tomorrow';
  if (days >= 14) {
    const weeks = Math.ceil(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `${days} days`;
}

function contextValue(title: string): string {
  if (title.length <= 22) return title;
  if (title.includes('Movement Check-Up')) return 'Movement Check-Up';
  if (title.includes('4-week')) return '4-week block';
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
    maxWidth: spacing.pageMaxWidth,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xl,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  greeting: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  headerName: {
    color: colors.primaryText,
    fontFamily: fonts.serifRegular,
    fontSize: 28,
    lineHeight: 34,
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
  metricRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,222,210,0.55)',
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
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.hero,
    ...shadow.card,
  },
  focusCardCompact: {
    borderRadius: radius.card,
  },
  focusImage: {
    position: 'absolute',
    top: 0,
    right: -34,
    bottom: 0,
    width: '112%',
    height: '100%',
  },
  focusContent: {
    paddingVertical: 26,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  focusContentCompact: {
    paddingVertical: 24,
    paddingHorizontal: 22,
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
    lineHeight: 28,
    letterSpacing: 0,
    marginTop: 16,
    maxWidth: '86%',
  },
  focusTitleCompact: {
    fontSize: 25,
    lineHeight: 28,
  },
  focusSubtitle: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 10,
    maxWidth: '72%',
  },
  focusDetail: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 10,
    maxWidth: '72%',
  },
  focusButton: {
    marginTop: 22,
    alignSelf: 'flex-start',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: todayHomeColors.warmWhite,
    borderWidth: 1,
    borderColor: todayHomeColors.warmWhite,
  },
  focusButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  focusButtonText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  focusButtonArrow: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17,20,18,0.32)',
  },
  sheet: {
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  sheetTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...type.cardBody,
    marginTop: spacing.xs,
  },
  menuOptions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  menuOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  menuOptionSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  menuOptionText: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  menuOptionTextSelected: {
    color: colors.accentDeep,
  },
  menuRadio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.bgSurface,
  },
  menuRadioSelected: {
    backgroundColor: colors.positive,
    borderColor: colors.positive,
  },
  painMenu: {
    marginTop: spacing.lg,
  },
  painTitle: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  painOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  painChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 13,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgSurface,
  },
  painChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  painChipText: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  painChipTextSelected: {
    color: colors.accentDeep,
  },
  sheetPrimary: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accent,
    marginTop: spacing.lg,
  },
  sheetPrimaryPressed: {
    backgroundColor: colors.accentHover,
    transform: [{ scale: 0.99 }],
  },
  sheetPrimaryText: {
    ...type.button,
    color: colors.onAccent,
  },
  sheetCancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  sheetCancelText: {
    ...type.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
