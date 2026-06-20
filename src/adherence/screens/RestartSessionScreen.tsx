import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import { getAdherenceState } from '../adherenceState';
import { getLapseRecoveryCopy, getProtectionCopy } from '../adherenceCopy';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

export function RestartSessionScreen({
  block,
  lifeGoal,
  completions,
  onStart,
  onCancel,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  onStart: () => void;
  onCancel: () => void;
}) {
  const state = getAdherenceState(block, completions);
  const copy = getLapseRecoveryCopy(state, lifeGoal);
  return (
    <Screen>
      <ScreenHeader eyebrow="Clean slate" title={copy.title} subtitle={copy.body} />
      <Card style={styles.card}>
        <Text style={styles.title}>Today's restart session</Text>
        <Text style={styles.body}>
          A shorter Hale session counts toward this week and helps you restart without overthinking the gap.
        </Text>
        <View style={styles.list}>
          <Text style={styles.item}>1. Frame check</Text>
          <Text style={styles.item}>2. Three to four focused movements</Text>
          <Text style={styles.item}>3. Gentle finish</Text>
        </View>
        <Text style={styles.protection}>{getProtectionCopy({ lifeGoal, focusDomain: block.focusDomain, adherenceState: state })}</Text>
      </Card>
      <View style={styles.actions}>
        <PrimaryButton title={copy.cta} onPress={onStart} />
        <SecondaryButton title="Back" onPress={onCancel} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { ...type.cardTitle },
  body: { ...type.cardBody },
  list: { gap: spacing.sm, paddingTop: spacing.sm },
  item: { ...type.bodySmall },
  protection: { ...type.h3, color: colors.accentDeep },
  actions: { gap: spacing.md },
});
