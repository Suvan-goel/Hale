import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CheckUp } from '../checkup';
import { Card, HealthMetricRow, MaterialCard, PrimaryButton, Screen, StatusBadge } from '../components/ui';
import {
  bandLabel,
  onboardingDomainSummaries,
  onboardingFocusCopy,
  onboardingFocusDomain,
} from '../onboarding/results';
import { scoreCheckUp } from '../scoring';
import { colors, spacing, type } from '../theme';

const ICONS = {
  strength_power: 'S',
  balance_stability: 'B',
  mobility_flexibility: 'M',
} as const;

export function OnboardingResultsScreen({
  checkUp,
  onCreateBlock,
}: {
  checkUp: CheckUp;
  onCreateBlock: () => void;
}) {
  const score = React.useMemo(() => scoreCheckUp(checkUp), [checkUp]);
  const focus = onboardingFocusDomain(score);
  const summaries = onboardingDomainSummaries(score);
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.step}>Step 8 of 10</Text>
        <Text style={styles.title}>Your Movement Check-Up results</Text>
        <Text style={styles.subtitle}>Here is the simple picture from today’s baseline.</Text>
      </View>

      <MaterialCard>
        <Text style={styles.focusLabel}>Your main opportunity</Text>
        <Text style={styles.focusValue}>{onboardingFocusCopy(focus)}</Text>
        <Text style={styles.body}>Hale will use this to shape your first 4-week block.</Text>
      </MaterialCard>

      <Card style={styles.card}>
        {summaries.map((domain) => (
          <HealthMetricRow
            key={domain.key}
            icon={ICONS[domain.key]}
            label={domain.title}
            value={bandLabel(domain.band)}
            status={domain.key === focus ? 'Main focus' : 'Baseline'}
          />
        ))}
      </Card>

      <Card style={styles.card}>
        <View style={styles.noteHead}>
          <Text style={styles.noteTitle}>What happens next</Text>
          <StatusBadge label="4-week block" tone="gold" />
        </View>
        <Text style={styles.body}>You will get three calm Hale Sessions each week, then re-test in 4 weeks to see what changed.</Text>
      </Card>

      <PrimaryButton title="Create my 4-week block" onPress={onCreateBlock} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  step: { ...type.label, color: colors.accentDeep },
  title: { ...type.display },
  subtitle: { ...type.body, color: colors.textSecondary },
  focusLabel: { ...type.label, color: colors.accentDeep },
  focusValue: { ...type.h1, marginTop: spacing.sm },
  body: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  card: { gap: spacing.md },
  noteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  noteTitle: { ...type.h2 },
});
