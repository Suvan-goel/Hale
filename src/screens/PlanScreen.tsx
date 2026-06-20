import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  Card,
  EmptyState,
  Screen,
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
import { SettingsIcon } from '../navigation/icons';
import type { TrainingIntensityPreference } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const PLAN_HERO_IMAGE = require('../../assets/images/hale-plan-hero-mountain.png');

type PlanHeroAction =
  | { kind: 'session'; label: string; accessibilityLabel: string; sessionId: PlanSessionId }
  | { kind: 'retest'; label: string; accessibilityLabel: string }
  | { kind: 'complete'; label: string };

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
  const goalText = lifeGoalText?.trim();
  const nextSession = weekSessionStatuses.find((session) => session.status === 'next');
  const focusCopy = getPlanFocusCopy(activeBlockSummary?.focusDomain);
  const retest = getRetestCopy(activeBlockSummary);
  const progress = activeBlockSummary
    ? Math.max(0, Math.min(1, activeBlockSummary.sessionsCompleteThisWeek / Math.max(1, activeBlockSummary.sessionsTargetThisWeek)))
    : 0;
  const showRetestCard = shouldShowRetestCard(activeBlockSummary);
  const heroAction = getPlanHeroAction(activeBlockSummary, retest, nextSession);

  function runEmptyAction(action: ReturnType<typeof getPlanEmptyStateCopy>['action']) {
    if (action === 'onboarding') onStartOnboarding();
    else if (action === 'checkup') onStartCheckUp();
    else onCreateBlock();
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your Plan</Text>
          <Pressable
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <SettingsIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
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
            action={heroAction}
            onStartPlanSession={onStartPlanSession}
            onStartRetest={onStartRetest}
          />

          <BlockTimelineCard summary={activeBlockSummary} retest={retest} />

          <WeeklySessionsCard
            summary={activeBlockSummary}
            progress={progress}
            weekSessionStatuses={weekSessionStatuses}
            onStartPlanSession={onStartPlanSession}
          />

          <MovementEmphasisCard focusDomain={activeBlockSummary.focusDomain} />

          {showRetestCard ? <RetestCard retest={retest} onStartRetest={onStartRetest} /> : null}

          <ProfilePreferencesCard
            preferredDays={preferredDays}
            preferredIntensity={preferredIntensity}
            onOpenSettings={onOpenSettings}
          />
        </>
      )}
    </Screen>
  );
}

function PlanHeroCard({
  weekNumber,
  focusCopy,
  action,
  onStartPlanSession,
  onStartRetest,
}: {
  weekNumber: number;
  focusCopy: ReturnType<typeof getPlanFocusCopy>;
  action: PlanHeroAction | null;
  onStartPlanSession: (id: PlanSessionId) => void;
  onStartRetest: () => void;
}) {
  function runAction() {
    if (!action) return;
    if (action.kind === 'session') onStartPlanSession(action.sessionId);
    else if (action.kind === 'retest') onStartRetest();
  }

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
        {action ? (
          action.kind === 'complete' ? (
            <View style={styles.heroCompletePill}>
              <Text style={styles.heroCompleteText}>{action.label}</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
              onPress={runAction}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
            >
              <Text style={styles.heroButtonText}>{action.label}</Text>
              <Text style={styles.heroButtonArrow}>›</Text>
            </Pressable>
          )
        ) : null}
      </View>
    </>
  );

  return <View style={styles.heroCard}>{content}</View>;
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

function BlockTimelineCard({
  summary,
  retest,
}: {
  summary: ActiveBlockSummary;
  retest: ReturnType<typeof getRetestCopy>;
}) {
  const weeks = Array.from({ length: summary.totalWeeks }, (_, index) => index + 1);
  return (
    <Card style={styles.timelineCard}>
      <View style={styles.timelineHeader}>
        <Text style={styles.sectionTitle}>Block timeline</Text>
        <View style={styles.timelineWeekBadge}>
          <Text style={styles.timelineWeekBadgeText}>
            Week {summary.weekNumber} of {summary.totalWeeks}
          </Text>
        </View>
      </View>
      <Text style={styles.timelineSummary}>{timelineRetestSentence(summary, retest)}</Text>
      <View style={styles.timelineSteps}>
        {weeks.map((week, index) => (
          <TimelineStep
            key={week}
            week={week}
            current={week === summary.weekNumber}
            past={week < summary.weekNumber}
            last={index === weeks.length - 1}
          />
        ))}
      </View>
    </Card>
  );
}

function TimelineStep({
  week,
  current,
  past,
  last,
}: {
  week: number;
  current: boolean;
  past: boolean;
  last: boolean;
}) {
  return (
    <View style={[styles.timelineStep, last && styles.timelineStepLast]}>
      <View style={styles.timelineDotRow}>
        <View style={[styles.timelineDot, past && styles.timelineDotPast, current && styles.timelineDotCurrent]}>
          <Text style={[styles.timelineDotText, past && styles.timelineDotTextPast, current && styles.timelineDotTextCurrent]}>{week}</Text>
        </View>
        {!last ? <View style={[styles.timelineLine, past && styles.timelineLineActive]} /> : null}
      </View>
      {current ? <Text style={styles.timelineStepCaption}>Now</Text> : <View style={styles.timelineStepCaptionSpacer} />}
    </View>
  );
}

function WeeklySessionsCard({
  summary,
  progress,
  weekSessionStatuses,
  onStartPlanSession,
}: {
  summary: ActiveBlockSummary;
  progress: number;
  weekSessionStatuses: readonly WeekSessionStatus[];
  onStartPlanSession: (id: PlanSessionId) => void;
}) {
  return (
    <Card style={styles.sessionsCard}>
      <View style={styles.sessionsHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionTitle}>This week's sessions</Text>
          <Text style={styles.weekSummary}>
            {summary.sessionsCompleteThisWeek} of {summary.sessionsTargetThisWeek} sessions complete
          </Text>
        </View>
        <WeekProgressSegments progress={progress} count={summary.sessionsTargetThisWeek} />
      </View>
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
  );
}

function WeekProgressSegments({ progress, count }: { progress: number; count: number }) {
  const total = Math.max(1, count);
  const complete = Math.round(Math.max(0, Math.min(1, progress)) * total);
  return (
    <View style={styles.weekSegments} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: complete }}>
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.weekSegment, index < complete && styles.weekSegmentComplete]} />
      ))}
    </View>
  );
}

function MovementEmphasisCard({ focusDomain }: { focusDomain: ActiveBlockSummary['focusDomain'] }) {
  const items = movementEmphasis(focusDomain);
  return (
    <Card style={styles.emphasisCard}>
      <Text style={styles.sectionTitle}>Why this focus</Text>
      <Text style={styles.cardBody}>Hale keeps the week simple while giving extra attention to the area your Movement Check-Up suggested first.</Text>
      <View style={styles.emphasisGrid}>
        {items.map((item) => (
          <View key={item.title} style={styles.emphasisItem}>
            <Text style={styles.emphasisTitle}>{item.title}</Text>
            <Text style={styles.emphasisBody}>{item.body}</Text>
          </View>
        ))}
      </View>
    </Card>
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
        <Text style={styles.retestTitle}>Movement Check-Up</Text>
        <Text style={styles.retestValue}>{retest.title}</Text>
      </View>
      {retest.due ? <Text style={styles.chevron}>›</Text> : null}
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
  const detail = `${copy.categories.slice(0, 2).join(' · ')} · ${session.focus}`;
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
      {next ? <Text style={styles.chevron}>›</Text> : null}
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

function ProfilePreferencesCard({
  preferredDays,
  preferredIntensity,
  onOpenSettings,
}: {
  preferredDays: readonly string[];
  preferredIntensity: TrainingIntensityPreference;
  onOpenSettings: () => void;
}) {
  return (
    <Card style={styles.preferencesCard}>
      <View style={styles.preferencesHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionTitle}>Plan preferences</Text>
          <Text style={styles.cardBody}>Saved in Settings for future sessions.</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.preferencesEditButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Edit plan preferences"
        >
          <Text style={styles.preferencesEditText}>Edit</Text>
        </Pressable>
      </View>
      <View style={styles.preferenceList}>
        <PreferenceRow label="Training days" value={formatPreferredDays(preferredDays)} />
        <PreferenceRow label="Intensity" value={intensityLabel(preferredIntensity)} />
        <PreferenceRow label="Equipment" value="Manage in Settings" last />
      </View>
    </Card>
  );
}

function PreferenceRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.preferenceRow, last && styles.preferenceRowLast]}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Text style={styles.preferenceValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function shouldShowRetestCard(summary: ActiveBlockSummary | undefined): boolean {
  if (!summary) return false;
  if (summary.retestInDays === undefined) return false;
  return summary.retestInDays <= 7;
}

function getPlanHeroAction(
  summary: ActiveBlockSummary | undefined,
  retest: ReturnType<typeof getRetestCopy>,
  nextSession: WeekSessionStatus | undefined,
): PlanHeroAction | null {
  if (retest.due) {
    return {
      kind: 'retest',
      label: 'Start Movement Check-Up',
      accessibilityLabel: 'Start Movement Check-Up',
    };
  }

  if (nextSession) {
    return {
      kind: 'session',
      label: 'Start next session',
      accessibilityLabel: `Start ${nextSession.title}`,
      sessionId: nextSession.id,
    };
  }

  if (summary && summary.sessionsCompleteThisWeek >= summary.sessionsTargetThisWeek) {
    return { kind: 'complete', label: 'Week complete' };
  }

  return null;
}

function timelineRetestLabel(summary: ActiveBlockSummary, retest: ReturnType<typeof getRetestCopy>): string {
  if (retest.due) return 'Due now';
  if (summary.retestInDays === undefined) return 'After block';
  if (summary.retestInDays === 1) return 'Tomorrow';
  if (summary.retestInDays >= 14) {
    const weeks = Math.ceil(summary.retestInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `${summary.retestInDays} days`;
}

function timelineRetestSentence(summary: ActiveBlockSummary, retest: ReturnType<typeof getRetestCopy>): string {
  if (retest.due) return 'Your next Movement Check-Up is ready when you are.';
  if (summary.retestInDays === undefined) return 'Your next Movement Check-Up comes at the end of this block.';
  if (summary.retestInDays === 1) return 'Next Movement Check-Up tomorrow.';
  return `Next Movement Check-Up in ${timelineRetestLabel(summary, retest)}.`;
}

function movementEmphasis(focusDomain: ActiveBlockSummary['focusDomain']): readonly { title: string; body: string }[] {
  if (focusDomain === 'strength_power') {
    return [
      { title: 'Chair-rise power', body: 'Practice standing with control and confidence.' },
      { title: 'Lower-body strength', body: 'Build the legs you use for stairs and getting up.' },
      { title: 'Balance support', body: 'Keep steadiness in the plan without overloading the week.' },
    ];
  }
  if (focusDomain === 'balance') {
    return [
      { title: 'Steady holds', body: 'Practice calm balance with support nearby.' },
      { title: 'Ankle control', body: 'Build the small adjustments that keep you steady.' },
      { title: 'Strength base', body: 'Keep legs strong enough to support better balance.' },
    ];
  }
  if (focusDomain === 'mobility') {
    return [
      { title: 'Hips and hinge', body: 'Keep bending and reaching easier in daily life.' },
      { title: 'Shoulder reach', body: 'Build comfortable overhead range.' },
      { title: 'Easy strength', body: 'Support new range with simple controlled work.' },
    ];
  }
  return [
    { title: 'Strength', body: 'Keep everyday power moving forward.' },
    { title: 'Balance', body: 'Practice steadiness without pressure.' },
    { title: 'Mobility', body: 'Support comfortable reach and range.' },
  ];
}

const styles = StyleSheet.create({
  screenContent: {
    maxWidth: spacing.pageMaxWidth,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: 12,
  },
  header: {
    gap: spacing.xs,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...type.pageTitle },
  subtitle: { ...type.pageSubtitle },
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
    ...shadow.card,
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
    bottom: 18,
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  weekPill: {
    alignSelf: 'flex-start',
    minHeight: 31,
    borderRadius: radius.input,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(251,245,239,0.72)',
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
    minHeight: 46,
    maxWidth: '100%',
    borderRadius: 23,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  heroCompletePill: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 19,
    justifyContent: 'center',
    paddingHorizontal: 15,
    backgroundColor: 'rgba(251,250,247,0.86)',
  },
  heroCompleteText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  timelineCard: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderRadius: 16,
    ...shadow.card,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timelineWeekBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.bgMaterial,
  },
  timelineWeekBadgeText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  timelineSummary: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 8,
  },
  timelineSteps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
  },
  timelineStep: {
    flex: 1,
    minWidth: 0,
  },
  timelineStepLast: {
    flex: 0,
    width: 30,
  },
  timelineDotRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMaterial,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  timelineDotPast: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  timelineDotCurrent: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timelineDotText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  timelineDotTextPast: {
    color: colors.accentDeep,
  },
  timelineDotTextCurrent: {
    color: colors.onAccent,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 5,
    borderRadius: 1,
    backgroundColor: colors.borderHairline,
  },
  timelineLineActive: {
    backgroundColor: colors.accentBorder,
  },
  timelineStepCaption: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0,
    marginTop: 6,
  },
  timelineStepCaptionSpacer: {
    height: 21,
  },
  weekSummary: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 5,
  },
  emphasisCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 16,
    ...shadow.card,
  },
  emphasisGrid: {
    gap: 10,
    marginTop: 14,
  },
  emphasisItem: {
    minHeight: 66,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.bgMaterial,
  },
  emphasisTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  emphasisBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 4,
  },
  sessionsCard: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    borderRadius: 16,
    ...shadow.card,
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  weekSegments: {
    minWidth: 82,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 5,
    paddingTop: 7,
  },
  weekSegment: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgGold,
  },
  weekSegmentComplete: {
    backgroundColor: colors.accent,
  },
  sessionList: {
    marginTop: 14,
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
  sessionMarkComplete: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
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
    ...shadow.card,
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
  preferencesCard: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 16,
    ...shadow.card,
  },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  preferencesEditButton: {
    minHeight: 36,
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: colors.bgMaterial,
  },
  preferencesEditText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  preferenceList: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: colors.bgMaterial,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  preferenceRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  preferenceRowLast: {
    borderBottomWidth: 0,
  },
  preferenceLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    flex: 1,
    minWidth: 0,
  },
  preferenceValue: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
});
