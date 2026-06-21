import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { Card, PrimaryButton, Screen, SecondaryButton } from '../components/ui';
import type {
  HaleSessionPlanningResult,
  SessionPlanningRecoveryCopy,
} from '../haleFlow';
import { colors, spacing, type } from '../theme';

export function SessionPlanningRecoveryScreen({
  result,
  copy,
  onPrimaryAction,
  onSecondaryAction,
  onCancel,
}: {
  result: Extract<HaleSessionPlanningResult, { kind: 'unavailable' }>;
  copy: SessionPlanningRecoveryCopy | null;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onCancel: () => void;
}) {
  const content = copy ?? {
    title: 'Hale could not safely prepare today\'s session.',
    body: 'Your plan has not changed. Try again, or review your setup.',
    primaryActionLabel: 'Try again',
  };
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back to Today" onPress={onCancel} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Session setup</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.body}</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Plan status</Text>
        <Text style={styles.body}>Your current block, history, and progress were left unchanged.</Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title={content.primaryActionLabel} onPress={onPrimaryAction} />
        {content.secondaryActionLabel && result.recoveryActions.length > 1 ? (
          <SecondaryButton title={content.secondaryActionLabel} onPress={onSecondaryAction} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  eyebrow: { ...type.caption, color: colors.textTertiary, textTransform: 'uppercase' },
  title: { ...type.pageTitle },
  subtitle: { ...type.pageSubtitle },
  cardTitle: { ...type.cardTitle },
  body: { ...type.cardBody, marginTop: spacing.xs },
  actions: { gap: spacing.md },
});
