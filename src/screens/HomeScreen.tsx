/**
 * Home tab — a calm daily dashboard. It keeps the core loop intact (check-up →
 * training block → re-test) while presenting it as a premium longevity routine:
 * a clear greeting, a movement-age snapshot, and a small plan for today.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CurrentBlockCard,
  getLifeGoalDisplayText,
  LifeGoal,
  MovementBlock,
  SupportConnection,
  TrainingSessionCompletion,
} from '../adherence';
import type { NextBestAction } from '../haleFlow';
import {
  Card,
  DailyPlanItem,
  Eyebrow,
  HealthMetricRow,
  MaterialCard,
  MetricCard,
  MetricRing,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { StoredCheckUp } from '../history';
import { UserProfile } from '../profile';
import { CheckUpScore, DOMAIN_LABEL, Domain, DomainResult } from '../scoring';
import { colors, radius, spacing, type } from '../theme';

export interface ActivePlan {
  week: number;
  sessionNumber: number;
  totalSessions: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const DOMAIN_INITIAL: Record<Domain, string> = {
  strength: 'S',
  balance: 'B',
  mobility: 'M',
};

export function HomeScreen({
  profile,
  lastCheckUp,
  score,
  checkUpCount,
  nextBestAction,
  plan,
  retestDue,
  lifeGoal,
  currentBlock,
  adherenceCompletions,
  supportConnection,
  onNextBestAction,
  onBeginCheckUp,
  onRetestCheckUp,
  onViewLast,
  onStartWorkout,
  onStartRestart,
  onMicroCheck,
  onChooseLifeGoal,
  onOpenSupportCircle,
  onWeeklySummary,
  onViewReport,
}: {
  profile: UserProfile;
  lastCheckUp: StoredCheckUp | null;
  /** Scored most-recent check-up, for the progress snapshot (null before the first). */
  score: CheckUpScore | null;
  checkUpCount: number;
  nextBestAction: NextBestAction;
  /** The next session of an active block, or null (no block / block finished). */
  plan: ActivePlan | null;
  retestDue: boolean;
  lifeGoal: LifeGoal | null;
  currentBlock: MovementBlock | null;
  adherenceCompletions: readonly TrainingSessionCompletion[];
  supportConnection?: SupportConnection | null;
  onNextBestAction: (route: string) => void;
  onBeginCheckUp: () => void;
  onRetestCheckUp: () => void;
  onViewLast: () => void;
  onStartWorkout: () => void;
  onStartRestart: () => void;
  onMicroCheck: () => void;
  onChooseLifeGoal: () => void;
  onOpenSupportCircle: () => void;
  onWeeklySummary: () => void;
  onViewReport: () => void;
}) {
  const lastDate = lastCheckUp ? formatDate(lastCheckUp.checkUp.startedAt) : null;
  const measured = score ? score.domains.filter((d) => d.measured) : [];
  const focus = score?.weakestDomain ?? null;
  const focusLabel = focus ? DOMAIN_LABEL[focus] : null;
  const nextActionDetail = retestDue
    ? 'Your training block is complete. A new check-up will refresh your movement-age profile.'
    : plan
      ? `Week ${plan.week}, session ${plan.sessionNumber} of ${plan.totalSessions} is ready.`
      : 'Start with a guided Movement Check-Up to build your baseline.';

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting()}
            {profile.name ? `, ${profile.name}` : ''}
          </Text>
          <Text style={styles.tagline}>
            {profile.goal || 'Your daily guide to strength, balance, mobility, and long-term wellbeing.'}
          </Text>
        </View>
        <View style={styles.headerMark}>
          <Text style={styles.headerMarkText}>H</Text>
        </View>
      </View>

      <MaterialCard>
        <View style={styles.nextCardTop}>
          <View style={styles.heroCopy}>
            <Eyebrow>Next best action</Eyebrow>
            <Text style={styles.nextTitle}>{nextBestAction.title}</Text>
            <Text style={styles.heroBody}>{nextBestAction.body}</Text>
          </View>
          <StatusBadge label={stateLabel(nextBestAction.state)} tone="gold" />
        </View>
        <View style={styles.nextActions}>
          <PrimaryButton title={nextBestAction.primaryCta} onPress={() => onNextBestAction(nextBestAction.primaryRoute)} />
          {nextBestAction.secondaryCta && nextBestAction.secondaryRoute ? (
            <SecondaryButton
              title={nextBestAction.secondaryCta}
              onPress={() => onNextBestAction(nextBestAction.secondaryRoute as string)}
            />
          ) : null}
        </View>
      </MaterialCard>

      <MaterialCard
        onPress={measured.length > 0 && lastDate ? onViewLast : onBeginCheckUp}
        accessibilityLabel={measured.length > 0 ? 'View movement check-up results' : 'Begin movement check-up'}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Eyebrow>{measured.length > 0 ? 'Movement age profile' : 'Movement Check-Up'}</Eyebrow>
            <Text style={styles.heroValue}>{measured.length > 0 ? focusLabel ?? 'Baseline ready' : 'Ready when you are'}</Text>
            <Text style={styles.heroBody}>
              {measured.length > 0
                ? `Latest check-up${lastDate ? ` from ${lastDate}` : ''}. ${focusLabel ? `${focusLabel} is the best place to focus next.` : 'Keep building your routine.'}`
                : 'Voice-guided movements measure how your body is moving. Camera video is never shown.'}
            </Text>
          </View>
          <MetricRing
            progress={measured.length > 0 ? measured.length / 3 : 0.72}
            value={measured.length > 0 ? `${measured.length}/3` : '10'}
            label={measured.length > 0 ? 'domains' : 'min'}
          />
        </View>
        <Text style={styles.heroLink}>
          {measured.length > 0 ? 'View latest results ›' : 'Begin check-up ›'}
        </Text>
      </MaterialCard>

      {!lifeGoal ? (
        <Card>
          <SectionHeader title="Your Goal" actionLabel="Choose" onAction={onChooseLifeGoal} />
          <Text style={styles.firstHint}>
            Tell Hale what you want your body to keep letting you do. Your block copy will use that reason
            without changing the measurement result.
          </Text>
          <View style={styles.inlineAction}>
            <SecondaryButton title="Choose my goal" onPress={onChooseLifeGoal} />
          </View>
        </Card>
      ) : (
        <Card>
          <SectionHeader title="Your Goal" actionLabel="Edit" onAction={onChooseLifeGoal} />
          <Text style={styles.goalText}>{getLifeGoalDisplayText(lifeGoal)}</Text>
        </Card>
      )}

      {currentBlock ? (
        <CurrentBlockCard
          block={currentBlock}
          lifeGoal={lifeGoal}
          completions={adherenceCompletions}
          onStartSession={onStartWorkout}
          onStartRestart={onStartRestart}
          onMicroCheck={onMicroCheck}
          onRetest={onRetestCheckUp}
          onWeeklySummary={onWeeklySummary}
          onReport={onViewReport}
        />
      ) : null}

      {currentBlock && !supportConnection ? (
        <Card>
          <SectionHeader title="Support Circle" actionLabel="Add" onAction={onOpenSupportCircle} />
          <Text style={styles.firstHint}>
            Invite one Hale Partner, choose what they can see, or keep the block private for now.
          </Text>
        </Card>
      ) : currentBlock && supportConnection ? (
        <Card>
          <SectionHeader title="Support Circle" actionLabel="Manage" onAction={onOpenSupportCircle} />
          <Text style={styles.firstHint}>
            {supportConnection.sharingLevel === 'private'
              ? 'Your block is private.'
              : 'Your supporter only sees the progress summary you chose to share.'}
          </Text>
        </Card>
      ) : null}

      <View style={styles.metricGrid}>
        <MetricCard
          label="Check-ups"
          value={`${checkUpCount}`}
          detail={checkUpCount === 1 ? 'baseline saved' : checkUpCount > 1 ? 'trend building' : 'not started'}
          status={checkUpCount > 0 ? 'Local' : undefined}
        />
        <MetricCard
          label="Next focus"
          value={focusLabel ? shortFocus(focusLabel) : plan ? 'Routine' : 'Baseline'}
          detail={nextActionDetail}
        />
      </View>

      <Card>
        <SectionHeader title="Today’s Plan" />
        {retestDue ? (
          <DailyPlanItem
            icon="1"
            title="Measure"
            subtitle="Refresh your Movement Check-Up"
            tone="green"
            onPress={onRetestCheckUp}
          />
        ) : plan ? (
          <DailyPlanItem
            icon="1"
            title="Move"
            subtitle={`Week ${plan.week} · Session ${plan.sessionNumber} of ${plan.totalSessions}`}
            tone="green"
            onPress={onStartWorkout}
          />
        ) : (
          <DailyPlanItem
            icon="1"
            title="Measure"
            subtitle="Complete your first guided baseline"
            tone="green"
            onPress={onBeginCheckUp}
          />
        )}
        {lastDate ? (
          <DailyPlanItem icon="2" title="Review" subtitle={`Last check-up · ${lastDate}`} tone="sage" onPress={onViewLast} />
        ) : (
          <DailyPlanItem icon="2" title="Prepare" subtitle="Find a chair and a quiet, well-lit space" tone="sage" />
        )}
        {plan ? (
          <DailyPlanItem
            icon="3"
            title="Check in"
            subtitle="A quick 60-second power check"
            tone="gold"
            onPress={onMicroCheck}
          />
        ) : (
          <DailyPlanItem icon="3" title="Listen" subtitle="Clara or Marcus will guide every step" tone="gold" />
        )}
      </Card>

      {measured.length > 0 ? (
        <Card>
          <View style={styles.cardTitleRow}>
            <SectionHeader title="Key Indicators" />
            {focusLabel ? <StatusBadge label="Focus" tone="gold" /> : null}
          </View>
          {score?.domains.map((domain) => (
            <HealthMetricRow
              key={domain.domain}
              icon={DOMAIN_INITIAL[domain.domain]}
              label={domain.label}
              value={domain.measured ? `Age ${domain.ageLow}–${domain.ageHigh}` : 'Not measured'}
              status={domainStatus(domain)}
            />
          ))}
          <Text style={styles.cardFootnote}>
            Typical age ranges are wellness estimates from validated movement tests, not clinical advice.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.firstTitle}>What to expect</Text>
          <Text style={styles.firstHint}>
            Prop your phone at about hip height, step back, and listen. The app renders only a clean
            skeleton outline while it measures strength, balance, and mobility.
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        {plan && !retestDue ? (
          <>
            <PrimaryButton title="Start Hale Session" onPress={onStartWorkout} />
            <SecondaryButton title="Start Movement Check-Up" onPress={onBeginCheckUp} />
          </>
        ) : (
          <PrimaryButton title={retestDue ? 'Begin re-test' : 'Begin Movement Check-Up'} onPress={retestDue ? onRetestCheckUp : onBeginCheckUp} />
        )}
      </View>
    </Screen>
  );
}

function stateLabel(state: NextBestAction['state']): string {
  if (state.includes('retest')) return 'Re-test';
  if (state.includes('micro')) return 'Check-in';
  if (state.includes('session') || state.includes('block')) return 'Block';
  if (state.includes('baseline') || state.includes('checkup')) return 'Check-up';
  return 'Start';
}

function shortFocus(label: string): string {
  if (label === 'Strength & Power') return 'Strength';
  return label;
}

function domainStatus(domain: DomainResult): string {
  if (!domain.measured) return 'Next time';
  return domain.estimated ? 'Estimate' : 'Measured';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  greeting: { ...type.display },
  tagline: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm, maxWidth: 300 },
  headerMark: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  headerMarkText: { ...type.h2, color: colors.accentDeep },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  nextCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg },
  heroCopy: { flex: 1 },
  nextTitle: { ...type.h1, marginTop: spacing.sm },
  heroValue: { ...type.h1, marginTop: spacing.sm },
  heroBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  nextActions: { gap: spacing.md, marginTop: spacing.lg },
  heroLink: { ...type.bodySmall, color: colors.accentDeep, marginTop: spacing.lg },
  metricGrid: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardFootnote: { ...type.caption, color: colors.textTertiary, marginTop: spacing.lg },
  firstTitle: { ...type.h2 },
  firstHint: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  goalText: { ...type.h3, color: colors.accentDeep, marginTop: spacing.sm },
  inlineAction: { marginTop: spacing.lg },
  actions: { gap: spacing.md },
});
