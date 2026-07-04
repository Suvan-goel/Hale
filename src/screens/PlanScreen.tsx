import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  Card,
  Screen,
} from '../components/ui';
import { HeaderLogo } from '../components/HeaderLogo';
import type { ActiveBlockSummary, HaleLifecycleState, TodaySessionPreferences, WeekSessionStatus } from '../haleFlow';
import {
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getPlanSessionCategoryCopy,
  getRetestCopy,
  type PlanSessionId,
} from '../haleFlow';
import { SettingsIcon } from '../navigation/icons';
import type { ActivityLevel, AvailableEquipment } from '../adherence';
import { startingEffortLabel } from '../profile';
import { colors, fonts, imageOverlayControl, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

const PLAN_HERO_IMAGE = require('../../assets/images/hale-plan-hero-mountain.png');
const PLAN_WEEK_DAYS: readonly { value: string; label: string }[] = [
  { value: 'Mon', label: 'Mo' },
  { value: 'Tue', label: 'Tu' },
  { value: 'Wed', label: 'We' },
  { value: 'Thu', label: 'Th' },
  { value: 'Fri', label: 'Fr' },
  { value: 'Sat', label: 'Sa' },
  { value: 'Sun', label: 'Su' },
];

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
  availableEquipment,
  startingEffort,
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
  availableEquipment: readonly AvailableEquipment[];
  startingEffort: ActivityLevel;
  onStartOnboarding: () => void;
  onStartCheckUp: () => void;
  onCreateBlock: () => void;
  onStartPlanSession: (id: PlanSessionId, preferences?: TodaySessionPreferences | null) => void;
  onStartRetest: () => void;
  onOpenSettings: () => void;
}) {
  const responsive = useResponsiveLayout();
  const goalText = lifeGoalText?.trim();
  const nextSession = weekSessionStatuses.find((session) => session.status === 'next');
  const focusCopy = getPlanFocusCopy(activeBlockSummary?.focusDomain);
  const retest = getRetestCopy(activeBlockSummary);
  const progress = activeBlockSummary
    ? Math.max(0, Math.min(1, activeBlockSummary.sessionsCompleteThisWeek / Math.max(1, activeBlockSummary.sessionsTargetThisWeek)))
    : 0;
  const heroAction = getPlanHeroAction(activeBlockSummary, retest, nextSession, lifecycleState);
  const showBlockingNextAction = shouldShowPlanPreparationState(lifecycleState);
  const showCreatedPlanHeaderSummary = !showBlockingNextAction && !!activeBlockSummary;

  function runEmptyAction(action: ReturnType<typeof getPlanEmptyStateCopy>['action']) {
    if (action === 'onboarding') onStartOnboarding();
    else if (action === 'checkup') onStartCheckUp();
    else onCreateBlock();
  }

  // Starting a plan session goes straight to the session preview, which owns
  // today's adjustments inline (the former start sheet is gone).
  const startPlanSession = React.useCallback(
    (id: PlanSessionId) => onStartPlanSession(id),
    [onStartPlanSession]
  );

  return (
    <>
      <Screen contentStyle={styles.screenContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleGroup}>
              <HeaderLogo />
              <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Your plan</Text>
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
          {showCreatedPlanHeaderSummary ? <PlanGoalSummary goalText={goalText} /> : null}
        </View>

        {showBlockingNextAction || !activeBlockSummary ? (
          <EmptyPlanState lifecycleState={lifecycleState} onAction={runEmptyAction} />
        ) : (
          <>
            <PlanHeroCard
              focusCopy={focusCopy}
              action={heroAction}
              onStartPlanSession={startPlanSession}
              onStartRetest={onStartRetest}
            />

            <WeeklySessionsCard
              summary={activeBlockSummary}
              progress={progress}
              weekSessionStatuses={weekSessionStatuses}
              onStartPlanSession={startPlanSession}
            />

            <BlockTimelineCard summary={activeBlockSummary} retest={retest} />

            <ProfilePreferencesCard
              preferredDays={preferredDays}
              availableEquipment={availableEquipment}
              startingEffort={startingEffort}
              onOpenSettings={onOpenSettings}
            />
          </>
        )}
      </Screen>
    </>
  );
}

function PlanGoalSummary({ goalText }: { goalText?: string }) {
  if (goalText) {
    return <Text style={styles.subtitle}>Built around what matters to you: {goalText}.</Text>;
  }

  return <Text style={styles.subtitle}>A simple plan to build strength, steadiness, and mobility.</Text>;
}

function PlanHeroCard({
  focusCopy,
  action,
  onStartPlanSession,
  onStartRetest,
}: {
  focusCopy: ReturnType<typeof getPlanFocusCopy>;
  action: PlanHeroAction | null;
  onStartPlanSession: (id: PlanSessionId) => void;
  onStartRetest: () => void;
}) {
  const responsive = useResponsiveLayout();
  const compactHero = responsive.isCompactPhone;
  const heroMinHeightStyle = { minHeight: responsive.planHeroHeight };

  function runAction() {
    if (!action) return;
    if (action.kind === 'session') onStartPlanSession(action.sessionId);
    else if (action.kind === 'retest') onStartRetest();
  }

  const content = (
    <>
      <Image source={PLAN_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" accessible={false} />
      <HeroScrim />
      <View style={[styles.heroContent, compactHero && styles.heroContentCompact, heroMinHeightStyle]}>
        <View style={[styles.heroCopy, compactHero && styles.heroCopyCompact]}>
          <Text style={[styles.heroTitle, compactHero && styles.heroTitleCompact]}>{focusCopy.title}</Text>
          <Text style={styles.heroBody}>{focusCopy.body}</Text>
        </View>
        {action ? (
          <View style={styles.heroAction}>
            {action.kind === 'complete' ? (
              <View style={styles.heroCompletePill}>
                <Text style={styles.heroCompleteText}>{action.label}</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.heroButton, compactHero && styles.compactCardPadding, pressed && styles.pressed]}
                onPress={runAction}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
              >
                <Text style={styles.heroButtonText}>{action.label}</Text>
                <Text style={styles.heroButtonArrow}>›</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    </>
  );

  return <View style={[styles.heroCard, heroMinHeightStyle]}>{content}</View>;
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
        <Text style={styles.sectionTitle}>4-week plan</Text>
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
          <Text style={styles.sectionTitle}>This week</Text>
          <Text style={styles.weekSummary}>{weeklySessionSummary(summary)}</Text>
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
    <View
      style={styles.weekSegments}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: complete }}
      accessibilityLabel={`${complete} of ${total} sessions done this week`}
    >
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.weekSegment, index < complete && styles.weekSegmentComplete]} />
      ))}
    </View>
  );
}

function EmptyPlanState({
  lifecycleState,
  onAction,
}: {
  lifecycleState: HaleLifecycleState;
  onAction: (action: ReturnType<typeof getPlanEmptyStateCopy>['action']) => void;
}) {
  const responsive = useResponsiveLayout();
  const copy = getPlanEmptyStateCopy(lifecycleState);
  const setupReady = lifecycleState === 'needs_block_creation';

  return (
    <View style={styles.emptyPlanWrap}>
      <View style={[styles.emptyPlanCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.emptyPlanHeader}>
          <Text style={styles.emptyPlanKicker}>
            {setupReady ? 'Plan preparation' : 'Before your plan starts'}
          </Text>
          <View style={styles.emptyPlanMetaPill}>
            <Text style={styles.emptyPlanMetaText}>{setupReady ? 'Automatic' : '~10 min'}</Text>
          </View>
        </View>

        <Text style={styles.emptyPlanTitle}>{copy.title}</Text>

        <Text style={styles.emptyPlanBody}>{copy.body}</Text>

        <View style={[styles.emptyPlanProgress, responsive.isCompactPhone && styles.compactCardPadding]} accessibilityLabel="Plan preparation steps">
          <EmptyPlanStep
            index="1"
            title="Check-up"
            body="Hale checks strength, balance, and mobility at home."
            state={setupReady ? 'complete' : 'current'}
          />
          <EmptyPlanStep
            index="2"
            title="Preparation"
            body="Hale uses the result to shape your first plan."
            state={setupReady ? 'current' : 'upcoming'}
          />
          <EmptyPlanStep
            index="3"
            title="First week"
            body="Three calm sessions appear here when your plan is ready."
            state="upcoming"
            last
          />
        </View>

        {copy.ctaLabel ? (
          <Pressable
            style={({ pressed }) => [styles.emptyPlanButton, responsive.isCompactPhone && styles.compactCardPadding, pressed && styles.pressed]}
            onPress={() => onAction(copy.action)}
            accessibilityRole="button"
            accessibilityLabel={copy.ctaLabel}
          >
            <Text style={styles.emptyPlanButtonText}>{copy.ctaLabel}</Text>
            <Text style={styles.emptyPlanButtonArrow}>›</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.emptyPlanNote}>
        <Text style={styles.emptyPlanNoteText}>Your camera view stays private. Hale never shows a live camera view.</Text>
      </View>
    </View>
  );
}

function EmptyPlanStep({
  index,
  title,
  body,
  state,
  last = false,
}: {
  index: string;
  title: string;
  body: string;
  state: 'complete' | 'current' | 'upcoming';
  last?: boolean;
}) {
  const active = state === 'complete' || state === 'current';
  return (
    <View style={[styles.emptyPlanStep, last && styles.emptyPlanStepLast]}>
      <View style={styles.emptyPlanStepMarkerCol}>
        <View style={[styles.emptyPlanStepMarker, active && styles.emptyPlanStepMarkerActive]}>
          <Text style={[styles.emptyPlanStepMarkerText, active && styles.emptyPlanStepMarkerTextActive]}>{index}</Text>
        </View>
        {!last ? <View style={[styles.emptyPlanStepLine, active && styles.emptyPlanStepLineActive]} /> : null}
      </View>
      <View style={styles.emptyPlanStepCopy}>
        <Text style={styles.emptyPlanStepTitle}>{title}</Text>
        <Text style={styles.emptyPlanStepBody}>{body}</Text>
      </View>
    </View>
  );
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
  const responsive = useResponsiveLayout();
  const copy = getPlanSessionCategoryCopy(session.id);
  const complete = session.status === 'complete';
  const next = session.status === 'next';
  const detail = copy.body;
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
        responsive.isCompactPhone && styles.compactCardPadding,
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

const EQUIPMENT_LABELS: Record<AvailableEquipment, string> = {
  chair: 'Chair',
  wall: 'Wall',
  stairs: 'Stairs',
  resistance_band: 'Band',
  door_anchor: 'Door anchor',
  mini_band: 'Mini band',
  dumbbells: 'Dumbbells',
  backpack: 'Backpack',
  floor_space: 'Floor space',
  none: 'None',
};

function equipmentSummary(available: readonly AvailableEquipment[]): string {
  const labels = available
    .filter((item) => item !== 'none')
    .map((item) => EQUIPMENT_LABELS[item])
    .filter(Boolean);
  if (labels.length === 0) return 'None yet';
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
}

function ProfilePreferencesCard({
  preferredDays,
  availableEquipment,
  startingEffort,
  onOpenSettings,
}: {
  preferredDays: readonly string[];
  availableEquipment: readonly AvailableEquipment[];
  startingEffort: ActivityLevel;
  onOpenSettings: () => void;
}) {
  return (
    <Card style={styles.preferencesCard}>
      <View style={styles.preferencesHeader}>
        <View style={styles.preferencesTitleBlock}>
          <Text style={styles.sectionTitle}>Plan settings</Text>
          <Text style={styles.cardBody}>Change your days, pace, or equipment.</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.preferencesEditButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Edit plan settings"
        >
          <EditGlyph />
          <Text style={styles.preferencesEditText}>Edit</Text>
        </Pressable>
      </View>
      <View style={styles.settingsPreview}>
        <View style={styles.trainingDaysHeader}>
          <Text style={styles.settingsPreviewLabel}>Training days</Text>
          {preferredDays.length === 0 ? <Text style={styles.settingsUnset}>Choose in Settings</Text> : null}
        </View>
        <View style={styles.dayChipRow}>
          {PLAN_WEEK_DAYS.map((day) => (
            <View key={day.value} style={[styles.dayChip, preferredDays.includes(day.value) && styles.dayChipSelected]}>
              <Text style={[styles.dayChipText, preferredDays.includes(day.value) && styles.dayChipTextSelected]}>{day.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.settingsPreviewRows}>
          <SettingPreviewRow label="Effort" value={startingEffortLabel(startingEffort)} />
          <SettingPreviewRow label="Equipment" value={equipmentSummary(availableEquipment)} last />
        </View>
      </View>
    </Card>
  );
}

function SettingPreviewRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.settingPreviewRow, last && styles.settingPreviewRowLast]}>
      <Text style={styles.settingPreviewLabel}>{label}</Text>
      <Text style={styles.settingPreviewValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function EditGlyph() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Path
        d="M5 18.8 L8.8 18 L18.1 8.7 C18.8 8 18.8 6.9 18.1 6.2 L17.8 5.9 C17.1 5.2 16 5.2 15.3 5.9 L6 15.2 Z"
        stroke={colors.accentDeep}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14.6 6.7 L17.3 9.4" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function shouldShowPlanPreparationState(state: HaleLifecycleState): boolean {
  return (
    state === 'needs_onboarding' ||
    state === 'needs_baseline_checkup' ||
    state === 'needs_block_creation'
  );
}

function getPlanHeroAction(
  summary: ActiveBlockSummary | undefined,
  retest: ReturnType<typeof getRetestCopy>,
  nextSession: WeekSessionStatus | undefined,
  lifecycleState: HaleLifecycleState,
): PlanHeroAction | null {
  if (retest.due) {
    return {
      kind: 'retest',
      label: 'Start check-up',
      accessibilityLabel: 'Start check-up',
    };
  }

  if (nextSession) {
    if (lifecycleState === 'inactive_restart') {
      return {
        kind: 'session',
        label: 'Restart gently',
        accessibilityLabel: 'Restart gently with a shorter session',
        sessionId: nextSession.id,
      };
    }
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
  if (retest.due) return 'Ready now';
  if (summary.retestInDays === undefined) return `End of week ${summary.totalWeeks}`;
  if (summary.retestInDays === 1) return 'Tomorrow';
  if (summary.retestInDays >= 14) {
    const weeks = Math.ceil(summary.retestInDays / 7);
    return `about ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `${summary.retestInDays} days`;
}

function timelineRetestSentence(summary: ActiveBlockSummary, retest: ReturnType<typeof getRetestCopy>): string {
  if (retest.due) return 'Your next check-up is ready when you are.';
  if (summary.retestInDays === undefined) return `Next check-up: end of week ${summary.totalWeeks}.`;
  if (summary.retestInDays === 1) return 'Next check-up tomorrow.';
  return `Next check-up in ${timelineRetestLabel(summary, retest)}.`;
}

function weeklySessionSummary(summary: ActiveBlockSummary): string {
  const complete = summary.sessionsCompleteThisWeek;
  const target = summary.sessionsTargetThisWeek;
  if (complete === target) return `${complete} of ${target} sessions done`;
  return `${complete} of ${target} sessions done this week`;
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 12,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  header: {
    gap: spacing.md,
    marginBottom: 8,
  },
  titleRow: {
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
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...type.pageTitle, flexShrink: 1 },
  subtitle: {
    maxWidth: 380,
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
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
    paddingVertical: 26,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  heroContentCompact: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  heroCopy: {
    width: '72%',
    gap: 12,
  },
  heroCopyCompact: {
    width: '70%',
    gap: 11,
  },
  heroTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  heroTitleCompact: {
    fontSize: 25,
    lineHeight: 31,
  },
  heroBody: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  heroAction: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    paddingTop: 16,
  },
  heroButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    maxWidth: '100%',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: imageOverlayControl.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: imageOverlayControl.border,
  },
  heroButtonText: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  heroButtonArrow: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    lineHeight: 22,
    marginTop: -1,
  },
  heroCompletePill: {
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
  heroCompleteText: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  emptyPlanWrap: {
    gap: spacing.md,
  },
  emptyPlanCard: {
    overflow: 'hidden',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 18px 40px rgba(17,20,18,0.045)',
  },
  emptyPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emptyPlanKicker: {
    ...type.label,
    color: colors.accentDeep,
    flex: 1,
    minWidth: 0,
  },
  emptyPlanTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: 0,
    marginTop: 22,
  },
  emptyPlanMetaPill: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  emptyPlanMetaText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  emptyPlanBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: 0,
    marginTop: 18,
  },
  emptyPlanProgress: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  emptyPlanStep: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
  },
  emptyPlanStepLast: {
    minHeight: 44,
  },
  emptyPlanStepMarkerCol: {
    width: 28,
    alignItems: 'center',
  },
  emptyPlanStepMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  emptyPlanStepMarkerActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  emptyPlanStepMarkerText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  emptyPlanStepMarkerTextActive: {
    color: colors.onAccent,
  },
  emptyPlanStepLine: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    marginVertical: 7,
    backgroundColor: colors.borderHairline,
  },
  emptyPlanStepLineActive: {
    backgroundColor: colors.accentBorder,
  },
  emptyPlanStepCopy: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 18,
  },
  emptyPlanStepTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  emptyPlanStepBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 3,
  },
  emptyPlanButton: {
    minHeight: 58,
    marginTop: 24,
    borderRadius: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
  },
  emptyPlanButtonText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
    textAlign: 'center',
  },
  emptyPlanButtonArrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 23,
    letterSpacing: 0,
    marginTop: -1,
  },
  emptyPlanNote: {
    paddingHorizontal: 16,
  },
  emptyPlanNoteText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
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
    paddingHorizontal: 16,
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
  preferencesCard: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 18,
    ...shadow.card,
  },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  preferencesTitleBlock: {
    flex: 1,
    minWidth: 0,
    maxWidth: 360,
  },
  preferencesEditButton: {
    // Comfortable tap target for the 50+ audience (matches minTapTarget).
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 24,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  preferencesEditText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  settingsPreview: {
    marginTop: 20,
    gap: 13,
  },
  trainingDaysHeader: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  settingsPreviewLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  settingsUnset: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  dayChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  dayChip: {
    width: 36,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMaterial,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  dayChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  dayChipTextSelected: {
    color: colors.onAccent,
  },
  settingsPreviewRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  settingPreviewRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  settingPreviewRowLast: {
    borderBottomWidth: 0,
  },
  settingPreviewLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  settingPreviewValue: {
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
