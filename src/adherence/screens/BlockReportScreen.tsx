import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../../components/ui';
import { CheckUpScore, type Domain } from '../../scoring';
import { colors, spacing, type } from '../../theme';
import { blockProgress } from '../adherenceState';
import { movementDomainFromScoreDomain } from '../blockService';
import { domainLabel, getLifeGoalDisplayText } from '../goalDomainMapping';
import type { IdentityMilestone, LifeGoal, MovementBlock, MovementDomain, TrainingSessionCompletion } from '../types';

export function BlockReportScreen({
  block,
  lifeGoal,
  completions,
  previousScore,
  latestScore,
  milestone,
  nextBlockReady,
  onStartNextBlock,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  previousScore?: CheckUpScore | null;
  latestScore?: CheckUpScore | null;
  milestone?: IdentityMilestone | null;
  nextBlockReady?: boolean;
  onStartNextBlock: () => void;
  onDone: () => void;
}) {
  const progress = blockProgress(block, completions);
  const domainChanges = (['strength', 'balance', 'mobility'] as Domain[]).map((domain) =>
    domainChange(domain, previousScore, latestScore)
  );
  const main = mainChange(domainChanges);
  const nextFocus = latestScore ? domainLabel(movementDomainFromScoreDomain(latestScore.weakestDomain)) : domainLabel(block.focusDomain);

  return (
    <Screen>
      <ScreenHeader
        title="Your 4-week report"
        subtitle={nextBlockReady ? 'Your next 4-week block is ready.' : 'A calm look at what changed and what comes next.'}
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Training</Text>
          <StatusBadge label="4-week block" tone="gold" />
        </View>
        <Row label="Focus" value={domainLabel(block.focusDomain)} />
        <Row label="Sessions completed" value={`${progress.completedSessions} of ${progress.totalSessions}`} />
        <Row label="Micro-checks" value={`${progress.microChecksCompleted}`} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>What changed</Text>
        {domainChanges.map((change) => (
          <Row key={change.domain} label={change.label} value={change.value} />
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Main improvement</Text>
        <Text style={styles.body}>{main}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Next focus</Text>
        <Text style={styles.body}>
          {nextBlockReady
            ? `Your next 4-week block is ready and will focus on ${nextFocus.toLowerCase()}.`
            : `Your next 4-week block can focus on ${nextFocus.toLowerCase()}.`}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Why this matters</Text>
        <Text style={styles.body}>
          {milestone
            ? `${milestone.title}. ${milestone.body}`
            : lifeGoal
              ? `This protects progress toward ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`
              : 'This keeps Hale focused on helping you stay capable.'}
        </Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title={nextBlockReady ? 'Go to Today' : 'Start next 4-week block'} onPress={onStartNextBlock} />
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

function domainChange(
  domain: Domain,
  previousScore?: CheckUpScore | null,
  latestScore?: CheckUpScore | null
): { domain: Domain; label: string; value: string; direction: 'improved' | 'held_steady' | 'adjusted' | 'unknown' } {
  const label = domain === 'strength' ? 'Strength / Power change' : domain === 'balance' ? 'Balance change' : 'Mobility change';
  const before = previousScore?.domains.find((item) => item.domain === domain);
  const after = latestScore?.domains.find((item) => item.domain === domain);
  if (!before?.measured || !after?.measured) return { domain, label, value: 'Re-test saved', direction: 'unknown' };
  const beforeMid = (before.ageLow + before.ageHigh) / 2;
  const afterMid = (after.ageLow + after.ageHigh) / 2;
  if (!Number.isFinite(beforeMid) || !Number.isFinite(afterMid)) return { domain, label, value: 'Re-test saved', direction: 'unknown' };
  if (afterMid < beforeMid) return { domain, label, value: 'Improved', direction: 'improved' };
  if (afterMid === beforeMid) return { domain, label, value: 'Held steady', direction: 'held_steady' };
  return { domain, label, value: 'Adjusted for next block', direction: 'adjusted' };
}

function mainChange(changes: readonly ReturnType<typeof domainChange>[]): string {
  const improved = changes.find((change) => change.direction === 'improved');
  if (improved) return `${shortDomain(improved.domain)} improved during this block.`;
  const steady = changes.find((change) => change.direction === 'held_steady');
  if (steady) return `${shortDomain(steady.domain)} held steady. Your next block will keep building this.`;
  const adjusted = changes.find((change) => change.direction === 'adjusted');
  if (adjusted) return `Today's ${shortDomain(adjusted.domain).toLowerCase()} result was lower. That can happen - Hale will adjust your next block.`;
  return 'Your re-test is saved. Hale will use it to shape the next block.';
}

function shortDomain(domain: Domain): string {
  return domainLabel(movementDomainForScoreDomain(domain));
}

function movementDomainForScoreDomain(domain: Domain): MovementDomain {
  return domain === 'strength' ? 'strength_power' : domain;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
  row: { gap: spacing.xs },
  label: { ...type.label },
  value: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
});
