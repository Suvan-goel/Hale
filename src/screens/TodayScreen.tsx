import * as React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const HERO_IMAGE = require('../../assets/images/hale-home-hero-botanical.png');

import { HeaderLogo } from '../components/HeaderLogo';
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

const PAIN_AREAS: readonly { label: string; value: PainArea }[] = [
  { label: 'Knee', value: 'knee' },
  { label: 'Hip', value: 'hip' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Neck', value: 'neck' },
  { label: 'Other', value: 'other' },
];

type SessionMenuIconKind = 'planned' | 'shorter' | 'gentler' | 'equipment' | 'pain';

const SESSION_MENU_OPTIONS: readonly {
  value: TodaySessionAdjustment | null;
  label: string;
  description: string;
  primaryLabel: string;
  icon: SessionMenuIconKind;
}[] = [
  {
    value: null,
    label: 'Start as planned',
    description: "Keep today's full session and usual pacing.",
    primaryLabel: 'Start as planned',
    icon: 'planned',
  },
  {
    value: 'shorter',
    label: 'Make it shorter',
    description: 'Keep the focus, reduce the session length.',
    primaryLabel: 'Start shorter session',
    icon: 'shorter',
  },
  {
    value: 'gentler',
    label: 'Make it gentler',
    description: 'Use easier levels, slower pacing, and more rest.',
    primaryLabel: 'Start gentler session',
    icon: 'gentler',
  },
  {
    value: 'no_equipment',
    label: 'No equipment',
    description: 'Swap optional equipment for bodyweight options.',
    primaryLabel: 'Start without equipment',
    icon: 'equipment',
  },
  {
    value: 'something_hurts',
    label: 'Something hurts',
    description: 'Tell Hale where to be careful today.',
    primaryLabel: 'Start with care',
    icon: 'pain',
  },
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
  const responsive = useResponsiveLayout();
  const compact = responsive.isCompactPhone;
  const snapshot = lifecycle.movementSnapshot;
  const canAdjustSession =
    lifecycle.state === 'first_session_ready' ||
    lifecycle.state === 'normal_training_day' ||
    lifecycle.state === 'week_complete';
  const isSessionAction =
    lifecycle.primaryAction.type === 'start_first_session' ||
    lifecycle.primaryAction.type === 'start_today_session';
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
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: responsive.maxContentWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingTop: responsive.pageTop,
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
      <Image source={HERO_IMAGE} style={[styles.focusImage, compact && styles.focusImageCompact]} resizeMode="cover" accessible={false} />
      <View style={[styles.focusContent, compact && styles.focusContentCompact]}>
        <View style={[styles.focusCopy, compact && styles.focusCopyCompact]}>
          <Text style={styles.focusLabel}>{label}</Text>
          <Text style={[styles.focusTitle, compact && styles.focusTitleCompact]} numberOfLines={2}>{displayTitle}</Text>
          <Text style={styles.focusSubtitle} numberOfLines={2}>{subtitle}</Text>
          {detail ? <Text style={styles.focusDetail} numberOfLines={1}>{detail}</Text> : null}
        </View>
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

export function SessionStartMenu({
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
  const needsPainArea = selected === 'something_hurts' && !painArea;
  const selectedOption = SESSION_MENU_OPTIONS.find((option) => option.value === selected) ?? SESSION_MENU_OPTIONS[0];
  const primaryLabel = needsPainArea ? 'Choose an area first' : selectedOption.primaryLabel;

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
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetEyebrow}>Today's session</Text>
            <Text style={styles.sheetTitle}>How would you like to start?</Text>
            <Text style={styles.sheetSubtitle}>Hale can adjust the session before it opens.</Text>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.menuOptions}>
              {SESSION_MENU_OPTIONS.map((option) => (
                <MenuOption
                  key={option.label}
                  option={option}
                  selected={selected === option.value}
                  onPress={() => setSelected(option.value)}
                />
              ))}
            </View>

            {selected === 'something_hurts' ? (
              <View style={styles.painMenu}>
                <View style={styles.painHeader}>
                  <Text style={styles.painTitle}>Where should Hale be careful?</Text>
                  <Text style={styles.painBody}>Choose one area so the session can stay comfortable.</Text>
                </View>
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
          </ScrollView>

          <View style={styles.sheetActions}>
            <Pressable
              style={({ pressed }) => [
                styles.sheetPrimary,
                needsPainArea && styles.sheetPrimaryDisabled,
                pressed && !needsPainArea && styles.sheetPrimaryPressed,
              ]}
              onPress={() => onStart(selected, selected === 'something_hurts' ? painArea : null)}
              disabled={needsPainArea}
              accessibilityRole="button"
              accessibilityState={{ disabled: needsPainArea }}
              accessibilityLabel={needsPainArea ? 'Choose where Hale should be careful' : primaryLabel}
            >
              <Text style={styles.sheetPrimaryText}>{primaryLabel}</Text>
              <Text style={styles.sheetPrimaryArrow}>›</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]} onPress={onClose} accessibilityRole="button">
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MenuOption({
  option,
  selected,
  onPress,
}: {
  option: (typeof SESSION_MENU_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuOption, selected && styles.menuOptionSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
    >
      <View style={[styles.menuIconFrame, selected && styles.menuIconFrameSelected]}>
        <SessionMenuIcon kind={option.icon} selected={selected} />
      </View>
      <View style={styles.menuOptionCopy}>
        <Text style={[styles.menuOptionText, selected && styles.menuOptionTextSelected]}>{option.label}</Text>
        <Text style={[styles.menuOptionDescription, selected && styles.menuOptionDescriptionSelected]}>{option.description}</Text>
      </View>
      <View style={[styles.menuRadio, selected && styles.menuRadioSelected]}>
        {selected ? <View style={styles.menuRadioDot} /> : null}
      </View>
    </Pressable>
  );
}

function SessionMenuIcon({ kind, selected }: { kind: SessionMenuIconKind; selected: boolean }) {
  const stroke = selected ? colors.onAccent : colors.accentDeep;
  const s = {
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (kind === 'shorter') {
    return (
      <Svg width={21} height={21} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Circle cx={12} cy={12} r={7.2} {...s} />
        <Path d="M12 7.8 V12 L15.2 14" {...s} />
      </Svg>
    );
  }

  if (kind === 'gentler') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Path d="M6.2 14.8 C6.2 9.3 10.3 6.4 17.8 5.8 C17.1 13.2 13.8 17 8.6 17" {...s} />
        <Path d="M6.8 17.2 C9.3 14.5 12.2 12.2 15.6 10.4" {...s} />
      </Svg>
    );
  }

  if (kind === 'equipment') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Path d="M6.2 9.2 H17.8" {...s} />
        <Path d="M8 7.2 V16.8" {...s} />
        <Path d="M16 7.2 V16.8" {...s} />
        <Path d="M5 16.8 H19" {...s} />
        <Path d="M19 5 L5 19" {...s} />
      </Svg>
    );
  }

  if (kind === 'pain') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Path d="M12 4.8 L18.2 7 V11.4 C18.2 15.2 15.8 17.9 12 19.4 C8.2 17.9 5.8 15.2 5.8 11.4 V7 Z" {...s} />
        <Path d="M12 8.8 V15.2" {...s} />
        <Path d="M8.8 12 H15.2" {...s} />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx={12} cy={12} r={7.2} {...s} />
      <Path d="M8.8 12.2 L11 14.4 L15.8 9.6" {...s} />
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
  if (lifecycle.primaryAction.type === 'start_first_session') return 'Your first Hale session is ready';
  if (lifecycle.primaryAction.type === 'start_today_session') return "Today's session is ready";
  if (lifecycle.primaryAction.type === 'start_gentle_restart') return 'Clean slate';
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
    return "Let's restart gently and keep the plan moving from here.";
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
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
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
  focusContent: {
    minHeight: 274,
    paddingVertical: 26,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  focusContentCompact: {
    minHeight: 286,
    paddingVertical: 24,
    paddingHorizontal: 22,
  },
  focusCopy: {
    width: '72%',
    gap: 12,
  },
  focusCopyCompact: {
    width: '70%',
    gap: 11,
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
    maxWidth: '100%',
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
  focusButton: {
    marginTop: 'auto',
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17,20,18,0.32)',
  },
  sheet: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetHeader: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
  },
  sheetEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  sheetTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  sheetScroll: {
    flexShrink: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
  menuOptions: {
    gap: spacing.sm,
  },
  menuOption: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  menuOptionSelected: {
    backgroundColor: colors.bgGold,
    borderColor: colors.accentDeep,
  },
  menuIconFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  menuIconFrameSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  menuOptionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  menuOptionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  menuOptionTextSelected: {
    color: colors.accentDeep,
  },
  menuOptionDescription: {
    ...type.caption,
    color: colors.textSecondary,
  },
  menuOptionDescriptionSelected: {
    color: colors.textSecondary,
  },
  menuRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  menuRadioSelected: {
    borderColor: colors.accentDeep,
  },
  menuRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentDeep,
  },
  painMenu: {
    gap: spacing.md,
    marginTop: spacing.md,
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  painHeader: {
    gap: 2,
  },
  painTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  painBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  painOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  painChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
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
  sheetActions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sheetPrimary: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  sheetPrimaryPressed: {
    backgroundColor: colors.accentHover,
    transform: [{ scale: 0.99 }],
  },
  sheetPrimaryDisabled: {
    backgroundColor: colors.border,
    opacity: 0.72,
  },
  sheetPrimaryText: {
    ...type.button,
    color: colors.onAccent,
  },
  sheetPrimaryArrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 23,
    letterSpacing: 0,
    marginTop: -1,
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
