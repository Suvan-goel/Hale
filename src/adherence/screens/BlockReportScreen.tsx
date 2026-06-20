import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../../components/ui';
import { CheckUpScore, DOMAIN_LABEL, selectFocusFromScore, type Domain, type ScoreFocusSelection } from '../../scoring';
import { colors, spacing, type } from '../../theme';
import { blockProgress } from '../adherenceState';
import { movementDomainFromScoreDomainOrNull } from '../blockService';
import { domainLabel, getLifeGoalDisplayText } from '../goalDomainMapping';
import type { IdentityMilestone, LifeGoal, MovementBlock, MovementBlockReport, MovementDomain, TrainingSessionCompletion } from '../types';

export function BlockReportScreen({
  block,
  lifeGoal,
  completions,
  previousScore,
  latestScore,
  milestone,
  report,
  nextBlockReady,
  onStartNextBlock,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  previousScore?: CheckUpScore | null;
  latestScore?: CheckUpScore | null;
  report?: MovementBlockReport | null;
  milestone?: IdentityMilestone | null;
  nextBlockReady?: boolean;
  onStartNextBlock: () => void;
  onDone: () => void;
}) {
  const progress = blockProgress(block, completions);
  const comparisonUnavailable = report ? (report.comparison?.status ?? 'legacy_unversioned') !== 'compatible' : false;
  const domainChanges = (['strength', 'balance', 'mobility'] as Domain[]).map((domain) =>
    comparisonUnavailable ? unavailableDomainChange(domain) : domainChange(domain, previousScore, latestScore)
  );
  const main = comparisonUnavailable ? comparisonUnavailableCopy() : mainChange(domainChanges);
  const latestFocusSelection = latestScore
    ? selectFocusFromScore(latestScore, { activeFocusDomain: latestScore.weakestDomain })
    : null;
  const nextFocus = latestFocusSelection
    ? DOMAIN_LABEL[latestFocusSelection.focusDomain]
    : latestScore
      ? domainLabel(movementDomainFromScoreDomainOrNull(latestScore.weakestDomain) ?? block.focusDomain)
      : domainLabel(block.focusDomain);
  const closelyMatched = latestFocusSelection?.kind === 'exact_tie' || latestFocusSelection?.kind === 'near_tie';

  return (
    <Screen>
      <ScreenHeader
        title="Your 4-week report"
        subtitle={nextBlockReady ? 'Your next 4-week block is ready.' : 'A calm look at your latest re-test and what comes next.'}
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
        <Text style={styles.title}>{comparisonUnavailable ? 'Re-test complete' : 'Latest re-test'}</Text>
        <Text style={styles.body}>{main}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Suggested next focus</Text>
        <Text style={styles.body}>
          {nextFocusCopy({ nextFocus, nextBlockReady, focusSelection: latestFocusSelection, closelyMatched })}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Why this matters</Text>
        <Text style={styles.body}>
          {milestone
            ? `${milestone.title}. ${milestone.body}`
            : lifeGoal
              ? `This supports progress toward ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`
              : 'This keeps Hale focused on supporting everyday movement.'}
        </Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title={nextBlockReady ? 'Go to Today' : 'Start next 4-week block'} onPress={onStartNextBlock} />
        <SecondaryButton title="Done" onPress={onDone} />
      </View>
    </Screen>
  );
}

function unavailableDomainChange(
  domain: Domain
): { domain: Domain; label: string; value: string; direction: 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown' } {
  const label = domain === 'strength' ? 'Strength / Power change' : domain === 'balance' ? 'Balance change' : 'Mobility change';
  return { domain, label, value: 'Comparison unavailable', direction: 'unknown' };
}

function comparisonUnavailableCopy(): string {
  return "Your latest result has been saved. Hale's scoring method has changed since your earlier Check-Up, so a direct comparison isn't available.";
}

function nextFocusCopy({
  nextFocus,
  nextBlockReady,
  focusSelection,
  closelyMatched,
}: {
  nextFocus: string;
  nextBlockReady?: boolean;
  focusSelection: ScoreFocusSelection | null;
  closelyMatched: boolean;
}): string {
  const prefix = closelyMatched && focusSelection
    ? `Your latest domains were closely matched (${focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ')}). `
    : '';
  return nextBlockReady
    ? `${prefix}Your next 4-week block is ready with ${nextFocus.toLowerCase()} as the suggested focus.`
    : `${prefix}Your next 4-week block can use ${nextFocus.toLowerCase()} as the suggested focus.`;
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
): { domain: Domain; label: string; value: string; direction: 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown' } {
  const label = domain === 'strength' ? 'Strength / Power change' : domain === 'balance' ? 'Balance change' : 'Mobility change';
  const before = previousScore?.domains.find((item) => item.domain === domain);
  const after = latestScore?.domains.find((item) => item.domain === domain);
  if (!before?.measured || !after?.measured) return { domain, label, value: 'Re-test saved', direction: 'unknown' };
  const beforeMid = (before.ageLow + before.ageHigh) / 2;
  const afterMid = (after.ageLow + after.ageHigh) / 2;
  if (!Number.isFinite(beforeMid) || !Number.isFinite(afterMid)) return { domain, label, value: 'Re-test saved', direction: 'unknown' };
  if (afterMid < beforeMid) return { domain, label, value: 'Changed', direction: 'recorded_lower' };
  if (afterMid === beforeMid) return { domain, label, value: 'Similar result', direction: 'similar' };
  return { domain, label, value: 'New data point', direction: 'recorded_higher' };
}

function mainChange(changes: readonly ReturnType<typeof domainChange>[]): string {
  const lower = changes.find((change) => change.direction === 'recorded_lower');
  if (lower) return `${shortDomain(lower.domain)} changed in the latest re-test.`;
  const similar = changes.find((change) => change.direction === 'similar');
  if (similar) return `${shortDomain(similar.domain)} was similar in the latest re-test.`;
  const higher = changes.find((change) => change.direction === 'recorded_higher');
  if (higher) return `${shortDomain(higher.domain)} added a new data point for the next block.`;
  return 'Your re-test is saved. Hale will use it as another data point for the next block.';
}

function shortDomain(domain: Domain): string {
  return domainLabel(movementDomainForScoreDomain(domain));
}

function movementDomainForScoreDomain(domain: Domain): MovementDomain {
  return domain === 'strength' ? 'strength_power' : domain;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  title: { ...type.cardTitle },
  body: { ...type.cardBody },
  row: { gap: spacing.xs },
  label: { ...type.label },
  value: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
});
