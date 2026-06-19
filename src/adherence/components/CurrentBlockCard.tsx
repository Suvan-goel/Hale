import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, MetricRing, PrimaryButton, SecondaryButton, StatusBadge } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import { getAdherenceState, currentWeekProgress, blockProgress } from '../adherenceState';
import {
  getBlockPurposeCopy,
  getBlockTitle,
  getDashboardCopy,
  getLapseRecoveryCopy,
  getProtectionCopy,
  retestCountdownCopy,
} from '../adherenceCopy';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

export function CurrentBlockCard({
  block,
  lifeGoal,
  completions,
  onStartSession,
  onStartRestart,
  onMicroCheck,
  onRetest,
  onWeeklySummary,
  onReport,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  onStartSession: () => void;
  onStartRestart: () => void;
  onMicroCheck: () => void;
  onRetest: () => void;
  onWeeklySummary: () => void;
  onReport: () => void;
}) {
  const now = new Date().toISOString();
  const state = getAdherenceState(block, completions, now);
  const week = currentWeekProgress(block, completions, now);
  const progress = blockProgress(block, completions);
  const recovery = getLapseRecoveryCopy(state, lifeGoal);
  const recoveryMode = state === 'inactive_this_week' || state === 'inactive_14_days' || state === 'missed_one_session';
  const readyForRetest = state === 'ready_for_retest';
  const complete = state === 'block_complete';
  const ringProgress = progress.totalSessions > 0 ? progress.completedSessions / progress.totalSessions : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Current block</Text>
          <Text style={styles.title}>{getBlockTitle(block, lifeGoal)}</Text>
          <Text style={styles.body}>{getBlockPurposeCopy(block, lifeGoal)}</Text>
        </View>
        <MetricRing
          size={102}
          progress={ringProgress}
          value={`${progress.completedSessions}/${progress.totalSessions}`}
          label="sessions"
        />
      </View>

      <View style={styles.metaRow}>
        <StatusBadge label={readyForRetest ? 'Re-test ready' : complete ? 'Complete' : `Week ${week.weekNumber}`} tone="gold" />
        <Text style={styles.meta}>{retestCountdownCopy(block, now)}</Text>
      </View>

      <View style={styles.statGrid}>
        <Stat label="This week" value={`${week.sessionsCompleted} of ${week.sessionsTarget}`} />
        <Stat label="Micro-check" value={week.microCheckCompleted ? 'Done' : 'Ready'} />
        <Stat label="Focus" value={block.focusDomain === 'strength_power' ? 'Strength' : block.focusDomain} />
      </View>

      <Text style={styles.protection}>{getProtectionCopy({ lifeGoal, focusDomain: block.focusDomain, adherenceState: state })}</Text>
      <Text style={styles.body}>{recoveryMode ? recovery.body : getDashboardCopy({ block, lifeGoal, adherenceState: state })}</Text>

      <View style={styles.actions}>
        {complete ? (
          <PrimaryButton title="View 4-week report" onPress={onReport} />
        ) : readyForRetest ? (
          <PrimaryButton title="Begin re-test" onPress={onRetest} />
        ) : recoveryMode ? (
          <PrimaryButton title={recovery.cta} onPress={onStartRestart} />
        ) : (
          <PrimaryButton title="Start today's session" onPress={onStartSession} />
        )}
        {!complete ? <SecondaryButton title="Do 60-second micro-check" onPress={onMicroCheck} /> : null}
        <SecondaryButton title="Weekly summary" onPress={onWeeklySummary} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  copy: { flex: 1 },
  eyebrow: { ...type.label },
  title: { ...type.h1, marginTop: spacing.xs },
  body: { ...type.bodySmall, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  meta: { ...type.caption, color: colors.sageDeep },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flex: 1, minWidth: 130, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  statValue: { ...type.h3, textTransform: 'capitalize', fontVariant: ['tabular-nums'] },
  statLabel: { ...type.caption, marginTop: 2 },
  protection: { ...type.h3, color: colors.accentDeep },
  actions: { gap: spacing.md },
});
