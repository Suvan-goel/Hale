import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../../components/ui';
import { CheckUpScore } from '../../scoring';
import { colors, spacing, type } from '../../theme';
import { blockProgress } from '../adherenceState';
import { assessmentComparisonCopy } from '../adherenceCopy';
import { scoreDomainFromMovementDomain } from '../blockService';
import { domainLabel, getLifeGoalDisplayText } from '../goalDomainMapping';
import type { IdentityMilestone, LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

export function BlockReportScreen({
  block,
  lifeGoal,
  completions,
  previousScore,
  latestScore,
  milestone,
  onStartNextBlock,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  previousScore?: CheckUpScore | null;
  latestScore?: CheckUpScore | null;
  milestone?: IdentityMilestone | null;
  onStartNextBlock: () => void;
  onDone: () => void;
}) {
  const progress = blockProgress(block, completions);
  const domain = scoreDomainFromMovementDomain(block.focusDomain);
  const before = previousScore?.domains.find((d) => d.domain === domain);
  const after = latestScore?.domains.find((d) => d.domain === domain);
  const beforeMid = before?.measured ? (before.ageLow + before.ageHigh) / 2 : null;
  const afterMid = after?.measured ? (after.ageLow + after.ageHigh) / 2 : null;

  return (
    <Screen>
      <ScreenHeader title="Your 4-week Hale report" subtitle="A calm look at what you completed and what the next block can use." />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Life goal</Text>
          <StatusBadge label="Purpose" tone="gold" />
        </View>
        <Text style={styles.body}>You said you wanted to {getLifeGoalDisplayText(lifeGoal).toLowerCase()}.</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Training</Text>
        <Row label="Focus" value={domainLabel(block.focusDomain)} />
        <Row label="Sessions" value={`${progress.completedSessions} of ${progress.totalSessions}`} />
        <Row label="Micro-checks" value={`${progress.microChecksCompleted}`} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.body}>
          {assessmentComparisonCopy({ before: beforeMid, after: afterMid, focusDomain: block.focusDomain })}
        </Text>
        {before?.measured && after?.measured ? (
          <Text style={styles.detail}>
            {before.label}: age {before.ageLow}-{before.ageHigh} to age {after.ageLow}-{after.ageHigh}
            {after.estimated ? ' (estimate)' : ''}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Identity</Text>
        <Text style={styles.body}>
          {milestone ? `${milestone.title}. ${milestone.body}` : 'You are becoming someone who trains to stay capable.'}
        </Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Start next 4-week block" onPress={onStartNextBlock} />
        <SecondaryButton title="Done" onPress={onDone} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
  detail: { ...type.caption, color: colors.sageDeep },
  row: { gap: spacing.xs },
  label: { ...type.label },
  value: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
});
