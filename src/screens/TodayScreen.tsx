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
import { BellIcon, CalendarIcon } from '../navigation/icons';
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
  const block = lifecycle.activeBlockSummary;
  const snapshot = lifecycle.movementSnapshot;
  const measuredCount = SNAPSHOT_ROWS.filter((row) => snapshot?.[row.key]).length;
  const progress = block
    ? block.sessionsCompleteThisWeek / Math.max(1, block.sessionsTargetThisWeek)
    : measuredCount / SNAPSHOT_ROWS.length;
  const progressValue = block
    ? `${block.sessionsCompleteThisWeek}/${block.sessionsTargetThisWeek}`
    : `${measuredCount}/${SNAPSHOT_ROWS.length}`;
  const progressNoun = block ? 'sessions' : 'domains';
  const progressVerb = block ? 'completed' : 'measured';
  const canAdjustSession =
    lifecycle.state === 'first_session_ready' ||
    lifecycle.state === 'normal_training_day' ||
    lifecycle.state === 'inactive_restart' ||
    lifecycle.state === 'week_complete';
  const isSessionAction =
    lifecycle.primaryAction.type === 'start_first_session' ||
    lifecycle.primaryAction.type === 'start_today_session' ||
    lifecycle.primaryAction.type === 'start_gentle_restart';
  const sessionTitle = isSessionAction ? 'Move with intention' : actionTitle(lifecycle.primaryAction.title);
  const sessionSubtitle = isSessionAction
    ? '10-15 min focused movement to build strength, balance, and mobility.'
    : actionSubtitle(lifecycle.primaryAction.subtitle);
  const upcomingTitle = block ? block.focusTitle : actionTitle(lifecycle.primaryAction.title);
  const upcomingMeta = isSessionAction ? 'Today · 20 min' : 'Today · next step';

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
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name} numberOfLines={1}>{firstName(profile.name)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open profile and settings"
          >
            <BellIcon size={24} color={todayHomeColors.headingGreen} strokeWidth={1.8} />
          </Pressable>
        </View>

        <MovementSnapshotCard
          compact={compact}
          progress={progress}
          progressValue={progressValue}
          progressNoun={progressNoun}
          progressVerb={progressVerb}
          snapshot={snapshot}
        />

        <DailyFocusCard
          compact={compact}
          label={isSessionAction ? 'Daily focus' : 'Today'}
          title={sessionTitle}
          subtitle={sessionSubtitle}
          ctaLabel={isSessionAction ? 'Start Session' : actionCta(lifecycle.primaryAction.ctaLabel)}
          onPress={handleStartPress}
        />

        <NextUpCard title={upcomingTitle} meta={upcomingMeta} onPress={handleStartPress} />
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
  progress,
  progressValue,
  progressNoun,
  progressVerb,
  snapshot,
}: {
  compact: boolean;
  progress: number;
  progressValue: string;
  progressNoun: string;
  progressVerb: string;
  snapshot: MovementSnapshot | null | undefined;
}) {
  return (
    <View style={styles.snapshotCard}>
      <Text style={styles.snapshotTitle}>Movement snapshot</Text>
      <View style={[styles.snapshotBody, compact && styles.snapshotBodyCompact]}>
        <ProgressRing
          progress={progress}
          value={progressValue}
          noun={progressNoun}
          verb={progressVerb}
          size={compact ? 136 : 148}
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
  ctaLabel,
  onPress,
}: {
  compact?: boolean;
  label: string;
  title: string;
  subtitle: string;
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

function NextUpCard({ title, meta, onPress }: { title: string; meta: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Start ${title}`}
    >
      <Text style={styles.nextLabel}>Next up</Text>
      <View style={styles.nextBody}>
        <View style={styles.nextIcon}>
          <CalendarIcon size={22} color={todayHomeColors.headingGreen} strokeWidth={1.8} />
        </View>
        <View style={styles.nextCopy}>
          <Text style={styles.nextTitle}>{title}</Text>
          <Text style={styles.nextMeta}>{meta}</Text>
        </View>
        <Text style={styles.nextChevron}>›</Text>
      </View>
    </Pressable>
  );
}

function ProgressRing({
  progress,
  value,
  noun,
  verb,
  size = 154,
}: {
  progress: number;
  value: string;
  noun: string;
  verb: string;
  size?: number;
}) {
  const stroke = 9;
  const center = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const visualProgress = clamped === 0 ? 0.025 : clamped;
  const [current = value, total = ''] = value.split('/');

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={todayHomeColors.ringTrack} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={todayHomeColors.headingGreen}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - visualProgress)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>
          {current}
          {total ? <Text style={styles.ringJoin}> of </Text> : null}
          {total ? <Text>{total}</Text> : null}
        </Text>
        <Text style={styles.ringLabel}>{noun}</Text>
        <Text style={styles.ringLabel}>{verb}</Text>
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

function firstName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'Welcome back';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function actionTitle(title: string): string {
  if (title === "Today's Hale Session") return "Today's session";
  return title.replace('Hale Session', 'Hale session');
}

function actionSubtitle(subtitle: string): string {
  if (subtitle === 'Your next session is adjusted from your check-up and recent progress.') {
    return 'A simple session to help you build strength, balance, and mobility.';
  }
  if (subtitle === 'Start your first step toward feeling stronger, steadier, and more mobile.') {
    return 'A simple first session to help you build strength, balance, and mobility.';
  }
  return subtitle;
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
    maxWidth: 560,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 42,
    paddingBottom: spacing.lg,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  greeting: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.serifRegular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  name: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.serifMedium,
    fontSize: 36,
    lineHeight: 41,
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
  snapshotCard: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: todayHomeColors.card,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
    shadowColor: todayHomeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  snapshotTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  snapshotBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  snapshotBodyCompact: {
    gap: spacing.xl,
  },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringValue: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.serifMedium,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  ringJoin: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  ringLabel: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  metricRows: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  metricRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  metricRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,222,210,0.22)',
  },
  metricIcon: {
    width: 30,
    height: 30,
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
    borderRadius: 28,
    backgroundColor: todayHomeColors.hero,
    borderWidth: 1,
    borderColor: todayHomeColors.heroDeep,
    shadowColor: todayHomeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  focusCardCompact: {
    borderRadius: 26,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  focusContentCompact: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  focusLabel: {
    color: todayHomeColors.warmWhite,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  focusTitle: {
    color: todayHomeColors.warmWhite,
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0,
    marginTop: 10,
    maxWidth: '64%',
  },
  focusTitleCompact: {
    fontSize: 25,
    lineHeight: 29,
  },
  focusSubtitle: {
    color: todayHomeColors.warmWhite,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 9,
    maxWidth: '58%',
  },
  focusButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 21,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: todayHomeColors.warmWhite,
    borderWidth: 1,
    borderColor: todayHomeColors.warmWhite,
  },
  focusButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  focusButtonText: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 0,
  },
  focusButtonArrow: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -2,
  },
  nextCard: {
    minHeight: 80,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: todayHomeColors.card,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
    shadowColor: todayHomeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  nextLabel: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  nextBody: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 9,
  },
  nextIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: todayHomeColors.iconFill,
  },
  nextCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  nextMeta: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 4,
  },
  nextChevron: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 32,
    lineHeight: 32,
    marginLeft: spacing.sm,
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
    borderWidth: 1,
    borderColor: colors.borderHairline,
    ...shadow.lifted,
  },
  sheetTitle: {
    ...type.h2,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...type.bodySmall,
    color: colors.textSecondary,
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
    ...type.bodySmall,
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
