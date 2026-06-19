import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  HealthMetricRow,
  PrimaryButton,
  Screen,
  ScreenHeader,
  SecondaryButton,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { getLearnDetail, getMovementLadderDetail, type LadderLevelView } from '../haleFlow';
import type { LadderProgress } from '../training';
import { colors, spacing, type } from '../theme';

export function LadderDetailScreen({
  ladderId,
  ladderProgressById,
  onPractice,
  onDone,
}: {
  ladderId: string;
  ladderProgressById: Record<string, LadderProgress>;
  onPractice: () => void;
  onDone: () => void;
}) {
  const detail = React.useMemo(
    () => getMovementLadderDetail(ladderId, ladderProgressById),
    [ladderId, ladderProgressById]
  );

  if (!detail) {
    return (
      <Screen>
        <ScreenHeader title="Movement ladder" subtitle="This ladder is not available in V1." />
        <SecondaryButton title="Back to Explore" onPress={onDone} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader eyebrow="Movement Ladder" title={detail.title} subtitle={detail.body} />

      <Card>
        <View style={styles.cardHead}>
          <View style={styles.copy}>
            <Text style={styles.cardTitle}>Why it matters</Text>
            <Text style={styles.body}>{detail.whyItMatters}</Text>
          </View>
          <StatusBadge label={detail.domainLabel} tone="gold" />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Current level" />
        <LevelBlock level={detail.currentLevel} />
      </Card>

      <Card>
        <SectionHeader title="Adjacent levels" />
        {detail.easierLevel ? <LevelSummary title="Easier" level={detail.easierLevel} /> : <Text style={styles.body}>You are at the gentlest V1 level.</Text>}
        {detail.harderLevel ? <LevelSummary title="Harder" level={detail.harderLevel} /> : <Text style={styles.body}>You are at the top V1 core level.</Text>}
      </Card>

      <Card>
        <SectionHeader title="V1 core levels" />
        {detail.levels.map((level) => (
          <LevelSummary key={level.id} title={level.levelLabel} level={level} />
        ))}
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Practice This Ladder" onPress={onPractice} style={styles.action} />
        <SecondaryButton title="Back to Explore" onPress={onDone} style={styles.action} />
      </View>
    </Screen>
  );
}

export function LearnDetailScreen({
  articleId,
  onCameraSetup,
  onEquipment,
  onDone,
}: {
  articleId: string;
  onCameraSetup: () => void;
  onEquipment: () => void;
  onDone: () => void;
}) {
  const detail = React.useMemo(() => getLearnDetail(articleId), [articleId]);
  if (!detail) {
    return (
      <Screen>
        <ScreenHeader title="Learn" subtitle="This guide is not available." />
        <SecondaryButton title="Back to Explore" onPress={onDone} />
      </Screen>
    );
  }

  const primary =
    detail.id === 'camera-setup'
      ? { title: 'Open camera setup', onPress: onCameraSetup }
      : detail.id === 'resistance-band'
        ? { title: 'Open equipment settings', onPress: onEquipment }
        : null;

  return (
    <Screen>
      <ScreenHeader eyebrow={detail.readTimeLabel} title={detail.title} subtitle={detail.body} />
      {detail.sections.map((section) => (
        <Card key={section.title}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      ))}
      <View style={styles.actions}>
        {primary ? <PrimaryButton title={primary.title} onPress={primary.onPress} style={styles.action} /> : null}
        <SecondaryButton title="Back to Explore" onPress={onDone} style={styles.action} />
      </View>
    </Screen>
  );
}

function LevelBlock({ level }: { level: LadderLevelView }) {
  return (
    <View style={styles.levelBlock}>
      <HealthMetricRow label={level.name} value={level.levelLabel} status={level.measurementLabel} />
      <HealthMetricRow label="Equipment" value={level.equipmentLabel} status={level.cameraLabel} />
      <Text style={styles.body}>{level.instructions}</Text>
    </View>
  );
}

function LevelSummary({ title, level }: { title: string; level: LadderLevelView }) {
  return (
    <View style={styles.levelSummary}>
      <View style={styles.summaryText}>
        <Text style={styles.summaryTitle}>
          {title}: {level.name}
        </Text>
        <Text style={styles.summaryBody}>
          {level.equipmentLabel} - {level.measurementLabel}
        </Text>
      </View>
      {level.isCurrent ? <StatusBadge label="Current" tone="good" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', flexWrap: 'wrap' },
  copy: { flex: 1 },
  cardTitle: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  levelBlock: { marginTop: spacing.sm },
  levelSummary: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flexWrap: 'wrap',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  summaryText: { flex: 1 },
  summaryTitle: { ...type.bodySmall },
  summaryBody: { ...type.caption, marginTop: 2 },
  actions: { gap: spacing.md },
  action: { shadowOpacity: 0 },
});
