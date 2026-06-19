import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  Card,
  EmptyState,
  Pill,
  Screen,
  SecondaryButton,
  SectionHeader,
} from '../components/ui';
import type { ActiveBlockSummary, HaleLifecycleState, WeekSessionStatus } from '../haleFlow';
import {
  formatPreferredDays,
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getPlanSessionCategoryCopy,
  getRetestCopy,
  intensityLabel,
  type PlanSessionId,
} from '../haleFlow';
import { BellIcon } from '../navigation/icons';
import type { TrainingIntensityPreference } from '../training';
import { colors, fonts, radius, spacing, type } from '../theme';

const PLAN_HERO_IMAGE = require('../../assets/images/hale-plan-hero-mountain.png');

type Shortcut = 'schedule' | 'intensity' | null;

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const INTENSITY_OPTIONS: readonly TrainingIntensityPreference[] = ['gentle', 'standard', 'more_challenge'];

export function PlanScreen({
  lifecycleState,
  lifeGoalText,
  activeBlockSummary,
  weekSessionStatuses,
  preferredDays,
  preferredIntensity,
  onStartOnboarding,
  onStartCheckUp,
  onCreateBlock,
  onStartPlanSession,
  onStartRetest,
  onOpenSettings,
  onPreferredDaysChange,
  onIntensityChange,
}: {
  lifecycleState: HaleLifecycleState;
  lifeGoalText?: string;
  activeBlockSummary?: ActiveBlockSummary;
  weekSessionStatuses: readonly WeekSessionStatus[];
  preferredDays: readonly string[];
  preferredIntensity: TrainingIntensityPreference;
  onStartOnboarding: () => void;
  onStartCheckUp: () => void;
  onCreateBlock: () => void;
  onStartPlanSession: (id: PlanSessionId) => void;
  onStartRetest: () => void;
  onOpenSettings: () => void;
  onPreferredDaysChange: (days: string[]) => void;
  onIntensityChange: (value: TrainingIntensityPreference) => void;
}) {
  const [shortcut, setShortcut] = React.useState<Shortcut>(null);
  const goalText = lifeGoalText?.trim();
  const nextSession = weekSessionStatuses.find((session) => session.status === 'next');
  const focusCopy = getPlanFocusCopy(activeBlockSummary?.focusDomain);
  const retest = getRetestCopy(activeBlockSummary);
  const progress = activeBlockSummary
    ? Math.max(0, Math.min(1, activeBlockSummary.sessionsCompleteThisWeek / Math.max(1, activeBlockSummary.sessionsTargetThisWeek)))
    : 0;

  function runEmptyAction(action: ReturnType<typeof getPlanEmptyStateCopy>['action']) {
    if (action === 'onboarding') onStartOnboarding();
    else if (action === 'checkup') onStartCheckUp();
    else onCreateBlock();
  }

  function togglePreferredDay(day: string) {
    const selected = new Set(preferredDays);
    if (selected.has(day)) selected.delete(day);
    else selected.add(day);
    onPreferredDaysChange(WEEK_DAYS.filter((item) => selected.has(item)));
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your 4-week block</Text>
          <Pressable
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open profile and settings"
          >
            <BellIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          {goalText ? `Built around your goal: ${goalText}.` : 'A simple plan for becoming stronger, steadier, and more mobile.'}
        </Text>
      </View>

      {!activeBlockSummary ? (
        <EmptyPlanState lifecycleState={lifecycleState} onAction={runEmptyAction} />
      ) : (
        <>
          <PlanHeroCard
            weekNumber={activeBlockSummary.weekNumber}
            focusCopy={focusCopy}
            nextSession={nextSession}
            onStartPlanSession={onStartPlanSession}
          />

          <WeeklyProgressCard summary={activeBlockSummary} progress={progress} />

          <Card style={styles.sessionsCard}>
            <Text style={styles.sectionTitle}>This week's sessions</Text>
            <View style={styles.sessionList}>
              {weekSessionStatuses.map((session, index) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  onStart={() => onStartPlanSession(session.id)}
                />
              ))}
            </View>
          </Card>

          <RetestCard retest={retest} onStartRetest={onStartRetest} />

          <Card style={styles.adjustCard}>
            <SectionHeader title="Adjust this block" />
            <View style={styles.adjustmentRows}>
              <AdjustmentRow
                title="Equipment"
                body="Update what you have available for future sessions."
                value="Edit in Profile"
                onPress={onOpenSettings}
              />
              <AdjustmentRow
                title="Schedule"
                body="Stored as a local preference only."
                value={formatPreferredDays(preferredDays)}
                onPress={() => setShortcut(shortcut === 'schedule' ? null : 'schedule')}
              />
              {shortcut === 'schedule' ? (
                <View style={styles.chipGroup}>
                  {WEEK_DAYS.map((day) => (
                    <Pill key={day} label={day} selected={preferredDays.includes(day)} onPress={() => togglePreferredDay(day)} />
                  ))}
                </View>
              ) : null}
              <AdjustmentRow
                title="Intensity"
                body="Used to keep future sessions matched to how today should feel."
                value={intensityLabel(preferredIntensity)}
                onPress={() => setShortcut(shortcut === 'intensity' ? null : 'intensity')}
              />
              {shortcut === 'intensity' ? (
                <View style={styles.chipGroup}>
                  {INTENSITY_OPTIONS.map((value) => (
                    <Pill
                      key={value}
                      label={intensityLabel(value)}
                      selected={preferredIntensity === value}
                      onPress={() => onIntensityChange(value)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

function PlanHeroCard({
  weekNumber,
  focusCopy,
  nextSession,
  onStartPlanSession,
}: {
  weekNumber: number;
  focusCopy: ReturnType<typeof getPlanFocusCopy>;
  nextSession: WeekSessionStatus | undefined;
  onStartPlanSession: (id: PlanSessionId) => void;
}) {
  const content = (
    <>
      <Image source={PLAN_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" accessible={false} />
      <HeroScrim />
      <View style={styles.heroContent}>
        <View style={styles.weekPill}>
          <Text style={styles.weekPillText}>Week {weekNumber}</Text>
        </View>
        <Text style={styles.heroTitle}>{focusCopy.title}</Text>
        <Text style={styles.heroBody}>{focusCopy.body}</Text>
        {nextSession ? (
          <View style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Start {nextSession.title}</Text>
            <Text style={styles.heroButtonArrow}>›</Text>
          </View>
        ) : null}
      </View>
    </>
  );

  if (!nextSession) return <View style={styles.heroCard}>{content}</View>;

  return (
    <Pressable
      style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
      onPress={() => onStartPlanSession(nextSession.id)}
      accessibilityRole="button"
      accessibilityLabel={`Start ${nextSession.title}`}
    >
      {content}
    </Pressable>
  );
}

function HeroScrim() {
  return (
    <Svg pointerEvents="none" style={styles.heroScrim}>
      <Defs>
        <LinearGradient id="heroScrimH" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.accentDeep} stopOpacity={0.58} />
          <Stop offset="0.58" stopColor={colors.accentDeep} stopOpacity={0.18} />
          <Stop offset="1" stopColor={colors.accentDeep} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="heroScrimV" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.accentDeep} stopOpacity={0.42} />
          <Stop offset="0.48" stopColor={colors.accentDeep} stopOpacity={0.1} />
          <Stop offset="1" stopColor={colors.accentDeep} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={colors.accentDeep} opacity={0.08} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroScrimH)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroScrimV)" />
    </Svg>
  );
}

function WeeklyProgressCard({ summary, progress }: { summary: ActiveBlockSummary; progress: number }) {
  return (
    <Card style={styles.weekCard}>
      <View style={styles.weekCardCopy}>
        <Text style={styles.sectionTitle}>This week</Text>
        <Text style={styles.weekSummary}>
          {summary.sessionsCompleteThisWeek} of {summary.sessionsTargetThisWeek} sessions complete
        </Text>
      </View>
      <MiniProgressRing progress={progress} />
    </Card>
  );
}

function MiniProgressRing({ progress, size = 60 }: { progress: number; size?: number }) {
  const stroke = 5;
  const center = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[styles.miniRing, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Weekly session progress"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={colors.bgGold} strokeWidth={stroke} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={colors.accent}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
    </View>
  );
}

function RetestCard({
  retest,
  onStartRetest,
}: {
  retest: ReturnType<typeof getRetestCopy>;
  onStartRetest: () => void;
}) {
  const content = (
    <>
      <View style={styles.retestIcon}>
        <MovementIcon />
      </View>
      <View style={styles.retestCopy}>
        <Text style={styles.retestTitle}>Movement check-up</Text>
        <Text style={styles.retestValue}>{retest.title}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </>
  );

  if (!retest.due) return <View style={styles.retestCard}>{content}</View>;

  return (
    <Pressable
      style={({ pressed }) => [styles.retestCard, pressed && styles.pressed]}
      onPress={onStartRetest}
      accessibilityRole="button"
      accessibilityLabel="Start movement check-up re-test"
    >
      {content}
    </Pressable>
  );
}

function MovementIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Circle cx={15} cy={5.8} r={2.3} stroke={colors.accentDeep} strokeWidth={1.8} />
      <Path d="M15 8.7 V16.3" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M9.2 13.3 L15 10.7 L20.8 13.3" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 16.3 L10.7 24.4" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M15 16.3 L21 23.6" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function EmptyPlanState({
  lifecycleState,
  onAction,
}: {
  lifecycleState: HaleLifecycleState;
  onAction: (action: ReturnType<typeof getPlanEmptyStateCopy>['action']) => void;
}) {
  const copy = getPlanEmptyStateCopy(lifecycleState);
  return <EmptyState title={copy.title} body={copy.body} actionLabel={copy.ctaLabel} onAction={() => onAction(copy.action)} />;
}

function SessionCard({
  session,
  index,
  onStart,
}: {
  session: WeekSessionStatus;
  index: number;
  onStart: () => void;
}) {
  const copy = getPlanSessionCategoryCopy(session.id);
  const complete = session.status === 'complete';
  const next = session.status === 'next';
  const detail = copy.categories.slice(0, 2).join(' · ');
  const content = (
    <>
      {next ? <View style={styles.sessionActiveRail} /> : null}
      <View style={[styles.sessionMark, next && styles.sessionMarkNext, complete && styles.sessionMarkComplete]}>
        <Text style={[styles.sessionMarkText, next && styles.sessionMarkTextNext, complete && styles.sessionMarkTextComplete]}>
          {copy.title.slice(-1)}
        </Text>
      </View>
      <View style={styles.sessionCopy}>
        <Text style={styles.sessionTitle}>{copy.title}</Text>
        <Text style={styles.sessionDetail}>{detail}</Text>
      </View>
      {next ? (
        <View style={styles.nextPill}>
          <Text style={styles.nextPillText}>Next</Text>
        </View>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </>
  );

  if (!next) return <View style={[styles.sessionRow, index > 0 && styles.sessionRowDivider]}>{content}</View>;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.sessionRow,
        styles.sessionRowNext,
        index > 0 && styles.sessionRowDivider,
        pressed && styles.pressed,
      ]}
      onPress={onStart}
      accessibilityRole="button"
      accessibilityLabel={`Start ${copy.title}`}
    >
      {content}
    </Pressable>
  );
}

function AdjustmentRow({
  title,
  body,
  value,
  onPress,
}: {
  title: string;
  body: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.adjustmentRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.adjustmentTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
        <Text style={styles.adjustmentValue}>{value}</Text>
      </View>
      <SecondaryButton title="Edit" onPress={onPress} style={styles.adjustmentButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    maxWidth: 430,
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: spacing.xxxl,
    gap: 12,
  },
  header: {
    gap: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: {
    color: colors.accent,
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    marginTop: 4,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  heroCard: {
    aspectRatio: 1.31,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,43,33,0.18)',
    boxShadow: '0 14px 30px rgba(17,20,18,0.12)',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  heroContent: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 16,
    bottom: 16,
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  weekPill: {
    alignSelf: 'flex-start',
    minHeight: 31,
    borderRadius: radius.input,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(18,60,46,0.82)',
  },
  weekPillText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  heroTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 28,
    letterSpacing: 0,
    marginTop: 16,
    maxWidth: '86%',
  },
  heroBody: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 10,
    maxWidth: '72%',
  },
  heroButton: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 22,
    paddingHorizontal: 19,
    backgroundColor: colors.bgElevated,
  },
  heroButtonText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  heroButtonArrow: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  weekCard: {
    minHeight: 94,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    borderRadius: 16,
    boxShadow: '0 10px 24px rgba(17,20,18,0.06)',
  },
  weekCardCopy: { flex: 1, minWidth: 0 },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  weekSummary: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 5,
  },
  miniRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsCard: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    borderRadius: 16,
    boxShadow: '0 10px 24px rgba(17,20,18,0.06)',
  },
  sessionList: {
    marginTop: 10,
  },
  sessionRow: {
    position: 'relative',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  sessionRowNext: {
    backgroundColor: colors.bgMaterial,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  sessionRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sessionActiveRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: colors.accent,
  },
  sessionMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgGold,
  },
  sessionMarkNext: { backgroundColor: colors.accent },
  sessionMarkComplete: { backgroundColor: colors.accentSoft },
  sessionMarkText: {
    color: colors.accentDeep,
    fontFamily: fonts.serifMedium,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0,
  },
  sessionMarkTextNext: { color: colors.onAccent },
  sessionMarkTextComplete: { color: colors.accentDeep },
  sessionCopy: { flex: 1, minWidth: 0 },
  sessionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  sessionDetail: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
    marginTop: 1,
  },
  nextPill: {
    minHeight: 28,
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  nextPillText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  chevron: {
    color: colors.accentDeep,
    fontFamily: fonts.sansRegular,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 0,
  },
  retestCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    boxShadow: '0 10px 24px rgba(17,20,18,0.06)',
  },
  retestIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgGold,
  },
  retestCopy: { flex: 1, minWidth: 0 },
  retestTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  retestValue: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 1,
  },
  adjustCard: {
    marginTop: 4,
  },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  adjustmentRows: { marginTop: spacing.md },
  adjustmentRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  adjustmentTitle: { ...type.h3 },
  adjustmentValue: { ...type.caption, color: colors.accentDeep, marginTop: spacing.sm },
  adjustmentButton: { minWidth: 92, shadowOpacity: 0 },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
