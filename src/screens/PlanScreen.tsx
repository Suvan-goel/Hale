import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  Eyebrow,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  SettingsIconButton,
  StatusBadge,
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
import type { TrainingIntensityPreference } from '../training';
import { colors, radius, spacing, type } from '../theme';

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
  const completed = weekSessionStatuses.filter((session) => session.status === 'complete').length;
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
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Eyebrow>Plan</Eyebrow>
          <Text style={styles.title}>Your 4-week block</Text>
          <Text style={styles.subtitle}>
            {goalText ? `Built around your goal: ${goalText}.` : 'A simple plan for becoming stronger, steadier, and more mobile.'}
          </Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      {!activeBlockSummary ? (
        <EmptyPlanState lifecycleState={lifecycleState} onAction={runEmptyAction} />
      ) : (
        <>
          <Card style={styles.featuredBlock}>
            <View style={styles.statusHead}>
              <View style={styles.headerCopy}>
                <Text style={styles.featureEyebrow}>Featured block</Text>
                <Text style={styles.featureTitle}>{focusCopy.title}</Text>
              </View>
              <StatusBadge label={`Week ${activeBlockSummary.weekNumber}`} tone="gold" />
            </View>
            <Text style={styles.featureBody}>{focusCopy.body}</Text>
            {nextSession ? (
              <SecondaryButton
                title={`Start ${nextSession.title}`}
                onPress={() => onStartPlanSession(nextSession.id)}
                style={styles.featureCta}
              />
            ) : null}
          </Card>

          <Card>
            <SectionHeader title="This week" />
            <View style={styles.weekMetricRow}>
              <View>
                <Text style={styles.weekValue}>
                  {activeBlockSummary.sessionsCompleteThisWeek} of {activeBlockSummary.sessionsTargetThisWeek}
                </Text>
                <Text style={styles.cardBody}>sessions complete</Text>
              </View>
              <StatusBadge
                label={completed >= activeBlockSummary.sessionsTargetThisWeek ? 'Week complete' : 'In progress'}
                tone={completed >= activeBlockSummary.sessionsTargetThisWeek ? 'good' : 'neutral'}
              />
            </View>
            <View
              style={styles.progressRail}
              accessibilityRole="progressbar"
              accessibilityLabel="Weekly session progress"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
            >
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </Card>

          <Card>
            <SectionHeader title="This week's sessions" />
            {weekSessionStatuses.map((session) => (
              <SessionCard key={session.id} session={session} onStart={() => onStartPlanSession(session.id)} />
            ))}
          </Card>

          <Card>
            <View style={styles.statusHead}>
              <View style={styles.headerCopy}>
                <SectionHeader title="Movement Check-Up" />
                <Text style={styles.retestValue}>{retest.title}</Text>
              </View>
              {retest.due ? <StatusBadge label="Ready" tone="gold" /> : null}
            </View>
            <Text style={styles.cardBody}>{retest.body}</Text>
            {retest.due ? <PrimaryButton title="Start re-test" onPress={onStartRetest} style={styles.primaryCta} /> : null}
          </Card>

          <Card>
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

function SessionCard({ session, onStart }: { session: WeekSessionStatus; onStart: () => void }) {
  const copy = getPlanSessionCategoryCopy(session.id);
  const complete = session.status === 'complete';
  const next = session.status === 'next';
  return (
    <View style={styles.sessionRow}>
      <View style={[styles.sessionMark, complete && styles.sessionMarkComplete]}>
        <Text style={[styles.sessionMarkText, complete && styles.sessionMarkTextComplete]}>{copy.title.slice(-1)}</Text>
      </View>
      <View style={styles.sessionCopy}>
        <View style={styles.sessionTitleRow}>
          <Text style={styles.sessionTitle}>{copy.title}</Text>
          <StatusBadge label={statusLabel(session.status)} tone={next ? 'gold' : complete ? 'good' : 'neutral'} />
        </View>
        <View style={styles.categoryRow}>
          {copy.categories.map((category) => (
            <View key={category} style={styles.categoryPill}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.cardBody}>{copy.body}</Text>
        {next ? (
          <SecondaryButton title="Start" accessibilityLabel={`Start ${copy.title}`} onPress={onStart} style={styles.sessionButton} />
        ) : complete ? (
          <Text style={styles.sessionNote}>Complete for this week.</Text>
        ) : (
          <Text style={styles.sessionNote}>Available after your next session.</Text>
        )}
      </View>
    </View>
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

function statusLabel(status: WeekSessionStatus['status']): string {
  if (status === 'complete') return 'Complete';
  if (status === 'next') return 'Next';
  return 'Later';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1 },
  title: { ...type.display, marginTop: spacing.sm },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  statusHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  featuredBlock: {
    backgroundColor: colors.oliveSage,
    borderColor: colors.oliveSage,
  },
  featureEyebrow: { ...type.label, color: colors.textOnDark },
  featureTitle: { ...type.h1, color: colors.textOnDark, marginTop: spacing.sm },
  featureBody: { ...type.bodySmall, color: colors.textOnDark, opacity: 0.88, marginTop: spacing.md },
  featureCta: {
    alignSelf: 'flex-start',
    marginTop: spacing.xl,
    backgroundColor: colors.elevatedCard,
    borderColor: colors.elevatedCard,
    minWidth: 176,
    shadowOpacity: 0,
  },
  cardTitle: { ...type.h2, marginTop: spacing.sm },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  primaryCta: { marginTop: spacing.xl },
  weekMetricRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  weekValue: { ...type.metricSmall, color: colors.accentDeep },
  progressRail: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSage,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  sessionRow: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sessionMark: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSage,
  },
  sessionMarkComplete: { backgroundColor: colors.accent },
  sessionMarkText: { ...type.h3, color: colors.accentDeep },
  sessionMarkTextComplete: { color: colors.onAccent },
  sessionCopy: { flex: 1, minWidth: 0 },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sessionTitle: { ...type.h3, flex: 1 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  categoryPill: {
    minHeight: 28,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.bgGold,
  },
  categoryText: { ...type.caption, color: colors.accentDeep },
  sessionButton: { alignSelf: 'flex-start', marginTop: spacing.md, minWidth: 104, shadowOpacity: 0 },
  sessionNote: { ...type.caption, color: colors.sageDeep, marginTop: spacing.md },
  retestValue: { ...type.h1, color: colors.accentDeep, marginTop: spacing.sm },
  adjustmentRows: { marginTop: spacing.md },
  adjustmentRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  adjustmentTitle: { ...type.h3 },
  adjustmentValue: { ...type.caption, color: colors.accentDeep, marginTop: spacing.sm },
  adjustmentButton: { minWidth: 82, shadowOpacity: 0 },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
