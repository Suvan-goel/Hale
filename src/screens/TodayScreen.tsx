import * as React from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type {
  HaleAppLifecycleResult,
  MovementSnapshot,
  MovementSnapshotBand,
  TodaySessionAdjustment,
} from '../haleFlow';
import { PlanIcon, SettingsIcon } from '../navigation/icons';
import type { UserProfile } from '../profile';
import type { PainArea } from '../training';
import { colors, fonts, radius, spacing, type } from '../theme';

type SnapshotKey = keyof MovementSnapshot;

const sessionCardImage = require('../../assets/images/hale-todays-session-card.png');

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
  const [imageFailed, setImageFailed] = React.useState(false);
  const block = lifecycle.activeBlockSummary;
  const snapshot = lifecycle.movementSnapshot;
  const measuredCount = SNAPSHOT_ROWS.filter((row) => snapshot?.[row.key]).length;
  const progress = block
    ? block.sessionsCompleteThisWeek / Math.max(1, block.sessionsTargetThisWeek)
    : measuredCount / SNAPSHOT_ROWS.length;
  const progressValue = block
    ? `${block.sessionsCompleteThisWeek}/${block.sessionsTargetThisWeek}`
    : `${measuredCount}/${SNAPSHOT_ROWS.length}`;
  const progressLabel = block ? 'this week' : 'domains';
  const weekLabel = block
    ? `${block.sessionsCompleteThisWeek} of ${block.sessionsTargetThisWeek} sessions completed`
    : `${measuredCount} of ${SNAPSHOT_ROWS.length} domains measured`;
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
  const upcomingMeta = isSessionAction ? 'Today - 20 min' : 'Today - next step';

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
            <SettingsIcon size={24} color={colors.accent} strokeWidth={1.8} />
          </Pressable>
        </View>

        <PremiumCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Daily Progress</Text>
            <View style={styles.infoMark}>
              <Text style={styles.infoText}>i</Text>
            </View>
          </View>
          <View style={styles.progressBody}>
            <ProgressRing progress={progress} value={progressValue} label={progressLabel} />
            <View style={styles.metricRows}>
              {SNAPSHOT_ROWS.map((row) => {
                const band = snapshot?.[row.key];
                return (
                  <MetricRow
                    key={row.key}
                    icon={row.short}
                    label={row.title}
                    value={band ? bandValue(band) : 'Pending'}
                  />
                );
              })}
            </View>
          </View>
        </PremiumCard>

        {imageFailed ? (
          <View style={[styles.focusCard, styles.focusFallback]}>
            <SessionCardContent
              label={isSessionAction ? 'Daily Focus' : 'Today'}
              title={sessionTitle}
              subtitle={sessionSubtitle}
              ctaLabel={isSessionAction ? 'Start Session' : actionCta(lifecycle.primaryAction.ctaLabel)}
              onPress={handleStartPress}
            />
          </View>
        ) : (
          <ImageBackground
            source={sessionCardImage}
            resizeMode="cover"
            style={styles.focusCard}
            imageStyle={styles.focusImage}
            onError={() => setImageFailed(true)}
          >
            <View style={styles.focusOverlay} />
            <SessionCardContent
              label={isSessionAction ? 'Daily Focus' : 'Today'}
              title={sessionTitle}
              subtitle={sessionSubtitle}
              ctaLabel={isSessionAction ? 'Start Session' : actionCta(lifecycle.primaryAction.ctaLabel)}
              onPress={handleStartPress}
            />
          </ImageBackground>
        )}

        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Text style={styles.sectionAction}>See All</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.upcomingRow, pressed && styles.pressed]}
            onPress={handleStartPress}
            accessibilityRole="button"
            accessibilityLabel={`Start ${upcomingTitle}`}
          >
            <View style={styles.upcomingIcon}>
              <PlanIcon size={22} color={colors.accent} strokeWidth={1.8} />
            </View>
            <View style={styles.upcomingCopy}>
              <Text style={styles.upcomingTitle}>{upcomingTitle}</Text>
              <Text style={styles.upcomingMeta}>{upcomingMeta}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <PremiumCard style={styles.weekCard}>
          <View style={styles.weekTop}>
            <View style={styles.weekCopy}>
              <Text style={styles.cardTitle}>This week</Text>
              <Text style={styles.weekLabel}>{weekLabel}</Text>
            </View>
            <Text style={styles.weekMeta}>{block ? `Week ${block.weekNumber}` : progressValue}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
          </View>
        </PremiumCard>
      </ScrollView>

      <SessionStartMenu
        visible={sessionMenuVisible}
        onClose={() => setSessionMenuVisible(false)}
        onStart={startWith}
      />
    </View>
  );
}

function PremiumCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SessionCardContent({
  label,
  title,
  subtitle,
  ctaLabel,
  onPress,
}: {
  label: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.focusContent}>
      <Text style={styles.focusLabel}>{label}</Text>
      <Text style={styles.focusTitle}>{title}</Text>
      <Text style={styles.focusSubtitle}>{subtitle}</Text>
      <Pressable
        style={({ pressed }) => [styles.focusButton, pressed && styles.focusButtonPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={styles.focusButtonText}>{ctaLabel}</Text>
        <Text style={styles.focusButtonArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function ProgressRing({ progress, value, label }: { progress: number; value: string; label: string }) {
  const size = 124;
  const stroke = 10;
  const center = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke="#E5E2D8" strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke="#4F5A45"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{value}</Text>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    </View>
  );
}

function MetricRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricIcon}>
        <Text style={styles.metricIconText}>{icon}</Text>
      </View>
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
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
    backgroundColor: '#F7F2EA',
  },
  scroller: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  greeting: {
    color: '#1F261F',
    fontFamily: fonts.serifRegular,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0,
  },
  name: {
    color: '#1F261F',
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: 0,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    padding: spacing.xl,
    backgroundColor: '#FCFAF6',
    borderWidth: 1,
    borderColor: '#E7DDCB',
    shadowColor: '#2B2418',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  progressCard: {
    marginTop: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    ...type.h3,
    color: '#1F261F',
  },
  infoMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8A887F',
  },
  infoText: {
    ...type.caption,
    color: '#60645D',
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  progressBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringValue: {
    color: '#26382C',
    fontFamily: fonts.sansMedium,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  ringLabel: {
    ...type.caption,
    color: '#26382C',
    marginTop: -1,
  },
  metricRows: {
    flex: 1,
    gap: spacing.md,
  },
  metricRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metricIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6ECE3',
  },
  metricIconText: {
    ...type.caption,
    color: '#4F5A45',
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    ...type.bodySmall,
    color: '#1F261F',
    fontFamily: fonts.sansMedium,
  },
  metricValue: {
    ...type.caption,
    color: '#60645D',
    marginTop: 1,
  },
  focusCard: {
    minHeight: 228,
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(231,221,203,0.62)',
    shadowColor: '#2B2418',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  focusImage: {
    borderRadius: 24,
  },
  focusFallback: {
    backgroundColor: '#53624D',
  },
  focusOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(25,36,28,0.24)',
  },
  focusContent: {
    width: '62%',
    minHeight: 228,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  focusLabel: {
    ...type.bodySmall,
    color: '#F8F3EA',
    opacity: 0.88,
  },
  focusTitle: {
    color: '#F8F3EA',
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: 0,
    marginTop: spacing.sm,
  },
  focusSubtitle: {
    ...type.caption,
    color: '#F8F3EA',
    marginTop: spacing.sm,
    maxWidth: 260,
  },
  focusButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 21,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#F8F3EA',
    borderWidth: 1,
    borderColor: 'rgba(231,221,203,0.8)',
    marginTop: spacing.lg,
  },
  focusButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  focusButtonText: {
    ...type.bodySmall,
    color: '#26382C',
    fontFamily: fonts.sansMedium,
  },
  focusButtonArrow: {
    ...type.bodySmall,
    color: '#26382C',
    fontFamily: fonts.sansMedium,
    marginTop: -1,
  },
  upcomingSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...type.h3,
    color: '#1F261F',
  },
  sectionAction: {
    ...type.caption,
    color: '#60645D',
    fontFamily: fonts.sansMedium,
  },
  upcomingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FCFAF6',
    borderWidth: 1,
    borderColor: '#EFE6D8',
    shadowColor: '#2B2418',
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  upcomingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE6',
  },
  upcomingCopy: {
    flex: 1,
    minWidth: 0,
  },
  upcomingTitle: {
    ...type.bodySmall,
    color: '#1F261F',
    fontFamily: fonts.sansMedium,
  },
  upcomingMeta: {
    ...type.caption,
    color: '#60645D',
    marginTop: 1,
  },
  chevron: {
    ...type.h2,
    color: '#60645D',
  },
  weekCard: {
    gap: spacing.md,
  },
  weekTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  weekCopy: {
    flex: 1,
    minWidth: 0,
  },
  weekLabel: {
    ...type.caption,
    color: '#60645D',
    marginTop: 2,
  },
  weekMeta: {
    ...type.bodySmall,
    color: '#26382C',
    fontFamily: fonts.sansMedium,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#E8E4DA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: '#4F5A45',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31,38,31,0.28)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    backgroundColor: '#FCFAF6',
    borderWidth: 1,
    borderColor: '#E7DDCB',
    shadowColor: '#2B2418',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  sheetTitle: {
    ...type.h2,
    color: '#1F261F',
  },
  sheetSubtitle: {
    ...type.bodySmall,
    color: '#60645D',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6D8',
  },
  menuOptionSelected: {
    backgroundColor: '#E6ECE3',
    borderColor: '#B9C7B8',
  },
  menuOptionText: {
    ...type.bodySmall,
    color: '#1F261F',
    fontFamily: fonts.sansMedium,
  },
  menuOptionTextSelected: {
    color: '#26382C',
  },
  menuRadio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B9C7B8',
    backgroundColor: '#FFFFFF',
  },
  menuRadioSelected: {
    backgroundColor: '#26382C',
    borderColor: '#26382C',
  },
  painMenu: {
    marginTop: spacing.lg,
  },
  painTitle: {
    ...type.caption,
    color: '#60645D',
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
    borderColor: '#D8D2C6',
    backgroundColor: '#FFFFFF',
  },
  painChipSelected: {
    backgroundColor: '#E6ECE3',
    borderColor: '#B9C7B8',
  },
  painChipText: {
    ...type.caption,
    color: '#60645D',
    fontFamily: fonts.sansMedium,
  },
  painChipTextSelected: {
    color: '#26382C',
  },
  sheetPrimary: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#26382C',
    marginTop: spacing.lg,
  },
  sheetPrimaryPressed: {
    backgroundColor: '#1E2D23',
    transform: [{ scale: 0.99 }],
  },
  sheetPrimaryText: {
    ...type.button,
    color: '#F8F3EA',
  },
  sheetCancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  sheetCancelText: {
    ...type.bodySmall,
    color: '#60645D',
    fontFamily: fonts.sansMedium,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
